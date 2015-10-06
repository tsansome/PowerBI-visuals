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
        categoryIndex: number;
        //size: number;
        constructor(name: string, categoryIndex:number) {
            this.name = name;
            this.categoryIndex = categoryIndex;
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

    export class CategoryModel {
        private categories: string[];

        public constructor() {
            this.categories = [];
        }

        public CategoryLength() {
            return this.categories.length;
        }

        public addCategory(categoryName: string) {
            this.categories.push(categoryName);
        }

        public categoryExists(categoryName: string): boolean {
            var resultSet = _.filter(this.categories, function (cc) { return cc === categoryName; });
            return resultSet.length !== 0;
        }
        public getCategoryIndexByName(categoryName: string) {
            return _.indexOf(this.categories, categoryName);
        }
    }

    export class NodeLinkModel {
        links: Link[];
        nodes: Node[];

        categories: CategoryModel;

        public constructor() {
            this.links = [];
            this.nodes = [];
            this.categories = new CategoryModel();
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
        public addNode(name: string, categoryIndex: number): void {
            if (this.nodeExists(name) === false) {
                this.nodes.push(new Node(name, categoryIndex));
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

        private colors: IDataColorPalette;

        public init(options: VisualInitOptions): void {
            this.selectionManager = new SelectionManager({ hostServices: options.host });

            this.root = d3.select(options.element.get(0))
                .append('svg');

            this.colors = options.style.colorPalette.dataColors;

        }

        public static converter(dataView: DataView[]): NodeLinkModel {
            //the first data view is our categorical view of the nodes to and from
            var dv1: DataViewCategorical = dataView[0].categorical;
            
            var ndlkmdl = new NodeLinkModel();
            
            //the second data view is our target groupings            
            if (dataView[1] && dataView[1].categorical) {
                //this will give us the categories                
                var nodeCategories = dataView[1].categorical.categories[0].values;
                if (nodeCategories.length > 0) {
                    //now we need to traverse the values
                    var categoryValueMapping = dataView[1].categorical.values;
                    for (var jj = 0; jj < categoryValueMapping.length; jj++) {
                        var elems = categoryValueMapping[jj];
                        var node = elems.source.groupName;
                        for (var kk = 0; kk < elems.values.length; kk++) {
                            if (elems.values[kk] != null) {
                                var cat = nodeCategories[kk];
                                if (ndlkmdl.categories.categoryExists(cat) === false) {
                                    ndlkmdl.categories.addCategory(cat);
                                }
                                var catIndex = ndlkmdl.categories.getCategoryIndexByName(cat);
                                ndlkmdl.addNode(node, catIndex);
                            }
                        }
                    }
                }
            }   
            
            //now we look at the third because this will be the source groupings
            if (dataView[2] && dataView[2].categorical) {
                //this will give us the categories
                var nodeCategories = dataView[2].categorical.categories[0].values;
                //now we need to traverse the values
                if (nodeCategories.length > 0) {
                    var categoryValueMapping = dataView[2].categorical.values;
                    for (var jj = 0; jj < categoryValueMapping.length; jj++) {
                        var elems = categoryValueMapping[jj];
                        var node = elems.source.groupName;
                        for (var kk = 0; kk < elems.values.length; kk++) {
                            if (elems.values[kk] != null) {
                                var cat = nodeCategories[kk];
                                if (ndlkmdl.categories.categoryExists(cat) === false) {
                                    ndlkmdl.categories.addCategory(cat);
                                }
                                var catIndex = ndlkmdl.categories.getCategoryIndexByName(cat);
                                ndlkmdl.addNode(node, catIndex);
                            }
                        }
                    }
                }
            }         

            var NodeToVals = dv1.categories[0].values;
            for (var ii = 0; ii < NodeToVals.length; ii++) {
                var ndvl: string = NodeToVals[ii];
                ndlkmdl.addNode(ndvl,-1);
            }

            for (var jj = 0; jj < dv1.values.length; jj++) {
                //each Node from is a group aka Series
                var NodeFromText = dv1.values[jj].source.groupName;
                ndlkmdl.addNode(NodeFromText,-1);
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

            //var defs = visArea.append('defs');
            //defs.append("marker")
            //    .attr("id", "arrowGray")
            //    .attr("markerWidth", 25)
            //    .attr("markerHeight", 30)
            //    .attr("refX", 5 * scaleHeight)
            //    .attr("refY", 15 * scaleHeight)
            //    .attr("markerUnits", "userSpaceOnUse")
            //    .append("circle")
            //    .attr("cx", 10)
            //    .attr("cy", 10)
            //    .attr("r", 4 * scaleHeight)
            //    .attr("fill", "black")
            //    .attr("stroke", "black");

            var linkDist = this.GetProperty(this.dataView[0], "linkproperties", "linkDistance", NodeLink.linkDistance) * scaleHeight;
            var chargeE = this.GetProperty(this.dataView[0], "nodeproperties", "force", NodeLink.nodeForce);
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
                .range([this.GetProperty(this.dataView[0], "linkproperties", "minThickness", NodeLink.linkMinThickness), this.GetProperty(this.dataView[0], "linkproperties", "maxThickness", NodeLink.linkMaxThickness)]);

            var linkg = mainArea.selectAll("path")
                .data(links)
                .enter()
                .append("g");

            var defaultLinkColor = this.GetPropertyColor(this.dataView[0], "linkproperties", "defaultColor", NodeLink.linkDefaultColor).solid.color;

            var link = linkg.append("path")
                .attr("id", function (d: Link, idx) {
                    return d.source.name + "_" + d.target.name;
                })
                .attr("fill", "none")
                .style("stroke", defaultLinkColor)
                .style("stroke-width", function (d: Link) {
                    var pixelVale = (xScale(d.value) * scaleHeight).toString();
                    return pixelVale + "px";
                });
                //.attr("marker-end", "url(#arrowGray)");

            var linkText = linkg.append("text")
                .style("font-size", this.GetProperty(this.dataView[0], "linkdatalabels", "fontSize", NodeLink.linkDataLabelFontSize).toString() + "px")
                .attr("class", "nodeLinkLinkText");

            if (this.GetProperty(this.dataView[0], "linkdatalabels", "showLabels", NodeLink.linkDataLabelShow)) {
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
            
            var node = nodeg.append("rect")
                .attr("height", this.GetProperty(this.dataView[0], "nodeproperties", "defaultRadius", NodeLink.nodeDefaultRadius) * scaleHeight)
                .attr("width", this.GetProperty(this.dataView[0], "nodeproperties", "defaultRadius", NodeLink.nodeDefaultRadius) * scaleHeight)                
                .attr("stroke", "black")
                .attr("stroke-width",1);

            var defaultColor = this.GetPropertyColor(this.dataView[0], "nodeproperties", "defaultColor", NodeLink.nodeDefaultColor).solid.color;
            var colors = this.colors;
            if (dataPoints.categories.CategoryLength() > 0) {
                node.attr("fill", function (d: Node) {
                    if (d.categoryIndex === -1) {
                        return defaultColor;
                    } else {
                        return colors.getColorByIndex(d.categoryIndex).value;
                    }
                });
            } else {
                node.attr("fill", defaultColor);
            }

            var highlightColor = this.GetPropertyColor(this.dataView[0], 'linkproperties', "highlightColor", NodeLink.linkHighlightColor).solid.color;
            node.on("mouseover", function (d) {
                link.style('stroke', function (l) {
                    if (d.name === l.source.name || d.name === l.target.name) {
                        return highlightColor;
                    }
                    else {
                        return defaultLinkColor;
                    }
                });
            });

            node.on("mouseout", function (d) {
                link.style('stroke',defaultLinkColor);
            });

            var text = nodeg.append("text");

            if (this.GetProperty(this.dataView[0], "nodelabels", "showLabels", NodeLink.linkDataLabelShow)) {
                text.text(function (d) {
                    return d.name;
                })
                    .attr("class", "nodeLinkText")
                    .attr("x", 15 * scaleHeight)
                    .attr("y", ".61em")
                    .style("font-size", this.GetProperty(this.dataView[0], "nodelabels", "fontSize", NodeLink.linkDataLabelFontSize).toString() + "px");
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
                node.attr("transform", function (d) { return "translate(" + (d.x-5) + "," + (d.y-5) + ")"; });
                text.attr("transform", function (d) { return "translate(" + (d.x) + "," + (d.y) + ")"; });
            });

            this.force.start();
        }

        static linkDefaultColor = "#666";
        static linkHighlightColor = "red";
        static linkMinThickness = 1;
        static linkMaxThickness = 10;
        static linkDistance = 70;

        static linkDataLabelShow = true;
        static linkDataLabelFontSize = 11;

        static nodeForce = -400;
        static nodeDefaultRadius = 15;
        static nodeDefaultColor = "#ccc";

        static nodeDataLabelShow = true;
        static nodeDataLabelFontSize = 11;

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];
            var dV = this.dataView[0];
            switch (options.objectName) {
                case 'linkproperties':
                    var objectname = 'linkproperties';
                    var linkproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Link General',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", NodeLink.linkDefaultColor),
                            highlightColor: this.GetPropertyColor(dV, objectname, "highlightColor", NodeLink.linkHighlightColor),
                            minThickness: this.GetProperty(dV, objectname, "minThickness", NodeLink.linkMinThickness),
                            maxThickness: this.GetProperty(dV, objectname, "maxThickness", NodeLink.linkMaxThickness),
                            linkDistance: this.GetProperty(dV, objectname, "linkDistance", NodeLink.linkDistance)
                        }
                    };
                    instances.push(linkproperties);
                    break;
                case 'nodelabels':
                    var objectname = 'nodelabels';
                    var nodelabels: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Node Labels',
                        selector: null,
                        properties: {
                            showLabels: this.GetProperty(dV, objectname, "showLabels", NodeLink.nodeDataLabelShow),
                            fontSize: this.GetProperty(dV, objectname, "fontSize", NodeLink.nodeDataLabelFontSize)
                        }
                    };
                    instances.push(nodelabels);
                    break;
                case 'nodeproperties':
                    var objectname = 'nodeproperties';                    
                    var nodeproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Node General',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", NodeLink.nodeDefaultColor),
                            defaultRadius: this.GetProperty(dV, objectname, "defaultRadius", NodeLink.nodeDefaultRadius),
                            force: this.GetProperty(dV, objectname, "force", NodeLink.nodeForce)
                        }
                    };
                    instances.push(nodeproperties);
                    break;
                case 'linkdatalabels':
                    var objectname = 'linkdatalabels';
                    var linkdatalabels: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Link Data labels',
                        selector: null,
                        properties: {
                            showLabels: this.GetProperty(dV, objectname, "showLabels", NodeLink.linkDataLabelShow),
                            fontSize: this.GetProperty(dV, objectname, "fontSize", NodeLink.linkDataLabelFontSize)
                        }
                    };
                    instances.push(linkdatalabels);
                    break;
            }

            return instances;
        }

        private GetPropertyColor(dataView: DataView, groupPropertyValue: string, propertyValue: string, defaultValue: string) {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var groupProperty = objects[groupPropertyValue];
                    if (groupProperty) {
                        var object = <Fill>groupProperty[propertyValue];
                        if (object !== undefined)
                            return object;
                    }
                }
            }
            var colorToReturn:Fill = {
                solid: {
                    color: defaultValue
                }
            };
            return colorToReturn; 
        }

        private GetProperty<T>(dataView: DataView, groupPropertyValue: string, propertyValue:string, defaultValue: T) {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var groupProperty = objects[groupPropertyValue];
                    if (groupProperty) {
                        var object = <T>groupProperty[propertyValue];
                        if (object !== undefined)
                            return object;
                    }
                }
            }
            return defaultValue;
        }
        
        public destroy(): void {
            this.root = null;
        }

    }
}