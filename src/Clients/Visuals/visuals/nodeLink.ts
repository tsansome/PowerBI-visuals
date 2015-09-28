/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/// <reference path="../_references.ts"/>

module powerbi.visuals {
    import SelectionManager = utility.SelectionManager;

    export class Node {
        name: string;
        constructor(name: string) {
            this.name = name;
        }
    }

    export class Link {
        source: Node;
        target: Node;
        value: number;
        constructor(source: Node, target: Node, value: number) {
            this.source = source;
            this.target = target;
            this.value = value;
        }
    }

    export class LinkProperties {
        minThickness: number;
        maxThickness: number;
        linkDistance: number;
        public constructor(minThickness, maxThickness, linkDistance) {
            this.minThickness = minThickness;
            this.maxThickness = maxThickness;
            this.linkDistance = linkDistance;
        }
    }

    export class NodeProperties {
        fontSize: number;
        public constructor(fontSize: number) {
            this.fontSize = fontSize;
        }
    }

    export class NodeLinkModel {
        links: Link[];
        nodes: Node[];

        public constructor() {
            this.links = [];
            this.nodes = [];
        }
        public nodeExists(name: string): boolean {
            return _.filter(this.nodes, function (d) {
                return d.name === name;
            }).length !== 0;
        }
        //todo: put out of bounds test
        public getNodeByIndex(index: number): Node {
            return this.nodes[index];
        }
        public addNode(name: string): void {
            if (this.nodeExists(name) === false) {
                this.nodes.push(new Node(name));
            }
        }
        public getNodeByName(name: string): Node {
            return _.filter(this.nodes, function (d) {
                return d.name === name;
            })[0];
        }
    }

    export class NodeLink implements IVisual {

        private root: D3.Selection;
        private dataView: DataView[];
        private selectionManager: SelectionManager;
        private force: D3.Layout.ForceLayout;

        public init(options: VisualInitOptions): void {
            this.selectionManager = new SelectionManager({ hostServices: options.host });

            this.root = d3.select(options.element.get(0))
                .append('svg');

        }

        public static converter(dataView: DataView[]): NodeLinkModel {
            var dv1: DataViewCategorical = dataView[0].categorical;

            var ndlkmdl = new NodeLinkModel();

            var NodeToVals = dv1.categories[0].values;
            for (var ii = 0; ii < NodeToVals.length; ii++) {
                var ndvl: string = NodeToVals[ii];
                ndlkmdl.addNode(ndvl);
            }

            for (var jj = 0; jj < dv1.values.length; jj++) {
                //each Node from is a group aka Series
                var NodeFromText = dv1.values[jj].source.groupName;
                ndlkmdl.addNode(NodeFromText);
                for (var kk = 0; kk < dv1.values[jj].values.length; kk++) {
                    var strength = dv1.values[jj].values[kk];
                    if (strength != null) {
                        //as this column based
                        var nodeFromRef = ndlkmdl.getNodeByIndex(kk);
                        //todo: work out better way of getting this that isn't by name
                        var nodesToRef = ndlkmdl.getNodeByName(NodeFromText);
                        //now create the link and push it on
                        var lnk = new Link(nodeFromRef, nodesToRef, strength);
                        ndlkmdl.links.push(lnk);
                    }
                }
            }

            return ndlkmdl;
        }

        public update(options: VisualUpdateOptions) {
            if (this.force !== undefined) {
                this.force.stop();
            }

            var dataView = this.dataView = options.dataViews;

            var viewport = options.viewport;

            var dataPoints = NodeLink.converter(dataView);            

            //should clear the pallette first
            this.root.selectAll("*").remove();

            var h = viewport.height;
            var w = viewport.width;

            //our target is the size of a 2x2 tile on pbi.com
            //var targetWidth = 520.0;
            var targetHeight = 360.0;
            //now we work out the percent scale
            //var scaleWidth = viewport.width / targetWidth;
            var scaleHeight = viewport.height / targetHeight;

            this.root.attr({
                'height': viewport.height,
                'width': viewport.width
            });

            var visArea = this.root.attr("viewBox", "0 0 " + w + " " + h)
                .attr("preserveAspectRatio", "xMidYMid");

            var mainArea = visArea.append("g");

            var defs = visArea.append('defs');
            defs.append("marker")
                .attr("id", "arrowGray")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 10)
                .attr("refY", -1.5)
                .attr("markerWidth", 3)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5");

            var linkDist = this.getLinkDistance(this.dataView[0]) * scaleHeight;
            var chargeE = this.getForce(this.dataView[0]);
            this.force = d3.layout.force()
                .nodes(dataPoints.nodes)
                .links(dataPoints.links)
                .linkDistance(linkDist)
                .charge(chargeE)
                .size([viewport.width, viewport.height]);

            var nodes = this.force.nodes();
            var links = this.force.links();

            var maxLinkValue = _.max(dataPoints.links, function (lk) { return lk.value; }).value;

            var xScale = d3.scale.linear()
                .domain([0, maxLinkValue])
                .range([this.getMinimumThickness(dataView[0]), this.getMaximumThickness(dataView[0])]);

            var linkg = mainArea.selectAll("path")
                .data(links)
                .enter()
                .append("g");

            var link = linkg.append("path")
                .attr("id", function (d: Link, idx) {
                    return d.source.name + "_" + d.target.name;
                })
                .attr("fill", "none")
                .style("stroke", this.getLinkDefaultColor(this.dataView[0]).solid.color)
                .style("stroke-width", function (d: Link) {
                    var pixelVale = (xScale(d.value) * scaleHeight).toString();
                    return pixelVale + "px";
                })
                .attr("marker-end", "url(#arrowGray)");

            var linkText = linkg.append("text")
                .style("font-size", this.getLinkDataLabelFontSize(this.dataView[0]).toString() + "px")
                .attr("class", "nodeLinkLinkText");

            if (this.getShowLinkDataLabels(this.dataView[0])) {
                linkText.append("textPath")
                    .attr("xlink:href", function (d: Link, idx) {
                        return "#" + d.source.name + "_" + d.target.name;
                    })
                    .attr("startOffset", "45%")
                    .text(function (d) {
                        return d.value.toString();
                    });
            }

            var nodeg = mainArea.selectAll("node")
                .data(nodes)
                .enter()
                .append("g");

            //.attr("r", )
            var node = nodeg.append("circle")
                .attr("r", this.getDefaultRadiusOfNode(this.dataView[0]) * scaleHeight)
                .attr("fill", this.getNodeDefaultColor(this.dataView[0]).solid.color);

            var text = nodeg.append("text");

            if (this.getShowNodeLabels(this.dataView[0])) {
                text.text(function (d) {
                    return d.name;
                })
                    .attr("class", "nodeLinkText")
                    .attr("x", 8)
                    .attr("y", ".31em")
                    .style("font-size", this.getNodeLabelFontSize(this.dataView[0]) + "px");
            }

            function linkArc(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
            }

            this.force.on("tick", function () {
                link.attr("d", function (d) {
                    var str = linkArc(d);
                    return str;
                });
                node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
                text.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
            });

            this.force.start();
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];
            var dataView = this.dataView[0];
            switch (options.objectName) {
                case 'linkproperties':
                    var linkproperties: VisualObjectInstance = {
                        objectName: 'linkproperties',
                        displayName: 'Link General',
                        selector: null,
                        properties: {
                            defaultColor: this.getLinkDefaultColor(dataView),
                            minThickness: this.getMinimumThickness(dataView),
                            maxThickness: this.getMaximumThickness(dataView),
                            linkDistance: this.getLinkDistance(dataView)
                        }
                    };
                    instances.push(linkproperties);
                    break;
                case 'nodelabels':
                    var nodelabels: VisualObjectInstance = {
                        objectName: 'nodelabels',
                        displayName: 'Node Labels',
                        selector: null,
                        properties: {
                            showLabels: this.getShowNodeLabels(this.dataView[0]),
                            fontSize: this.getNodeLabelFontSize(this.dataView[0])
                        }
                    };
                    instances.push(nodelabels);
                    break;
                case 'nodeproperties':
                    var nodeproperties: VisualObjectInstance = {
                        objectName: 'nodeproperties',
                        displayName: 'Node General',
                        selector: null,
                        properties: {
                            defaultColor: this.getNodeDefaultColor(this.dataView[0]),
                            defaultRadius: this.getDefaultRadiusOfNode(this.dataView[0]),
                            force: this.getForce(this.dataView[0])
                        }
                    };
                    instances.push(nodeproperties);
                    break;
                case 'linkdatalabels':
                    var linkdatalabels: VisualObjectInstance = {
                        objectName: 'linkdatalabels',
                        displayName: 'Link Data labels',
                        selector: null,
                        properties: {
                            showLabels: this.getShowLinkDataLabels(this.dataView[0]),
                            fontSize: this.getLinkDataLabelFontSize(this.dataView[0])
                        }
                    };
                    instances.push(linkdatalabels);
                    break;
            }

            return instances;
        }

        private getShowLinkDataLabels(dataView: DataView): boolean {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var linkdatalabels = objects['linkdatalabels'];
                    if (linkdatalabels) {
                        var showLabels = <boolean>linkdatalabels['showLabels'];
                        if (showLabels !== undefined)
                            return showLabels;
                    }
                }
            }
            return true;
        }

        private getLinkDataLabelFontSize(dataView: DataView): number {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var linkdatalabels = objects['linkdatalabels'];
                    if (linkdatalabels) {
                        var fontSize = <number>linkdatalabels['fontSize'];
                        if (fontSize)
                            return fontSize;
                    }
                }
            }
            return 11;
        }

        private getDefaultRadiusOfNode(dataView: DataView): number {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var nodeproperties = objects['nodeproperties'];
                    if (nodeproperties) {
                        var defaultRadius = <number>nodeproperties['defaultRadius'];
                        if (defaultRadius)
                            return defaultRadius;
                    }
                }
            }
            return 5;
        }

        private getNodeDefaultColor(dataView: DataView): Fill {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var nodeproperties = objects['nodeproperties'];
                    if (nodeproperties) {
                        var defaultColor = <Fill>nodeproperties['defaultColor'];
                        if (defaultColor)
                            return defaultColor;
                    }
                }
            }
            return {
                solid: { color: "#ccc" }
            };
        }

        private getLinkDefaultColor(dataView: DataView): Fill {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var nodeproperties = objects['linkproperties'];
                    if (nodeproperties) {
                        var defaultColor = <Fill>nodeproperties['defaultColor'];
                        if (defaultColor)
                            return defaultColor;
                    }
                }
            }
            return {
                solid: { color: "#666" }
            };
        }

        private getNodeLabelFontSize(dataView: DataView): number {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var nodeproperties = objects['nodeproperties'];
                    if (nodeproperties) {
                        var fontSize = <number>nodeproperties['fontSize'];
                        if (fontSize)
                            return fontSize;
                    }
                }
            }
            return 11;
        }

        private getShowNodeLabels(dataView: DataView): boolean {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var nodelabels = objects['nodelabels'];
                    if (nodelabels) {
                        var showLabels = <boolean>nodelabels['showLabels'];
                        if (showLabels !== undefined)
                            return showLabels;
                    }
                }
            }
            return true;
        }

        private getForce(dataView: DataView): number {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var nodeproperties = objects['nodeproperties'];
                    if (nodeproperties) {
                        var force = <number>nodeproperties['force'];
                        if (force)
                            return force;
                    }
                }
            }
            return -400;
        }

        private getLinkDistance(dataView: DataView): number {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var linkproperties = objects['linkproperties'];
                    if (linkproperties) {
                        var linkDistance = <number>linkproperties['linkDistance'];
                        if (linkDistance)
                            return linkDistance;
                    }
                }
            }
            return 70;
        }

        private getMinimumThickness(dataView: DataView): number {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var linkproperties = objects['linkproperties'];
                    if (linkproperties) {
                        var minThickness = <number>linkproperties['minThickness'];
                        if (minThickness)
                            return minThickness;
                    }
                }
            }
            return 1;
        }

        private getMaximumThickness(dataView: DataView): number {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var linkproperties = objects['linkproperties'];
                    if (linkproperties) {
                        var maxThickness = <number>linkproperties['maxThickness'];
                        if (maxThickness)
                            return maxThickness;
                    }
                }
            }
            return 10;
        }

        public destroy(): void {
            this.root = null;
        }

    }
}