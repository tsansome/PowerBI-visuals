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
    
    export class StatementResponseV2 {
        public identity: any;
        public statement: string;
        public GroupA: OpinionNodeV2;
        public GroupB: OpinionNodeV2;        
        public constructor(identity: any, statement: string, GroupA: OpinionNodeV2, GroupB: OpinionNodeV2) {
            this.identity = identity;
            this.statement = statement;
            this.GroupA = GroupA;
            this.GroupB = GroupB;            
        }
    }

    export class OpinionNodeV2 {
        public groupLabel: string;
        public val: number;
        public valFormatted: string;
        public valDetails: string;
        public valDetailsLabel: string;
        public XpX: number;        
        public constructor(GroupLabel: string, valAInput: number, valAFormatted: string, valADetails:string, valADetailsLabel:string, XpX: number) {
            this.groupLabel = GroupLabel;
            this.val = valAInput;
            this.XpX = XpX;
            this.valDetails = valADetails;
            this.valFormatted = valAFormatted;
            this.valDetailsLabel = valADetailsLabel;
        }
    }

    export class OpinionVisualMetaDataV2 {
        public valAGroupLabel: string;
        public valBGroupLabel: string;
        public constructor(valAGroupLabelInput: string, valBGroupLabelInput) {
            this.valAGroupLabel = valAGroupLabelInput;
            this.valBGroupLabel = valBGroupLabelInput;
        }
    }

    export class OpinionVis2 implements IVisual {

        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Statement',
                    displayName: 'Statement',
                    kind: VisualDataRoleKind.Grouping,
                },
                {
                    name: 'Groups',
                    displayName: 'Groups to compare',
                    kind: VisualDataRoleKind.Grouping,
                },
                {
                    name: 'Value',
                    displayName: 'Values',
                    kind: VisualDataRoleKind.Measure,
                    requiredTypes: [{ numeric: true }]
                },
                {
                    name: 'ExtraDetails',
                    displayName: 'Extra Details',
                    kind: VisualDataRoleKind.Measure,
                    requiredTypes: [{ numeric: true }]
                }
            ],
            dataViewMappings: [
                {
                    conditions: [
                        { 'Statement': { max: 5 }, 'Groups': { max: 1 }, 'Value': { max: 1 } },
                    ],
                    categorical: {
                        categories: {
                            for: { in: 'Statement' },
                            dataReductionAlgorithm: { top: {} }
                        },
                        values: {
                            group: {
                                by: 'Groups',
                                select: [
                                { bind: { to: 'Value' } },
                                { bind: { to: 'ExtraDetails' } },
                                ],
                                dataReductionAlgorithm: { top: { count: 2 } }
                            }
                        },
                        rowCount: { preferred: { min: 2 }, supported: { min: 0 } }
                    }
                }
            ],
            objects: {
                statementproperties: {
                    displayName: "Statement",
                    properties: {
                        defaultFontSize: {
                            description: "Specify the font size for the statement text.",
                            type: { numeric: true },
                            displayName: "Default Font Size"
                        },
                        defaultFontColor: {
                            description: "Specify the font color for the statement text.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Default Font Color"
                        }
                    }
                },
                groupnodeproperties: {
                    displayName: "Group Circle",
                    properties: {
                        defaultColor: {
                            description: "Specify the font size for the statement text.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Default Color"
                        }
                    }
                },
                groupnodedatalabelproperties: {
                    displayName: "Group Circle Data Label",
                    properties: {
                        defaultColor: {
                            description: "Specify the default color for the nodes.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Default Color"
                        },
                        defaultFontSize: {
                            description: "Specify the font size for the data label on a node.",
                            type: { numeric: true },
                            displayName: "Default Font Size"
                        }
                    }
                },
                gapbarproperties: {
                    displayName: "Gap Bar",
                    properties: {
                        defaultColor: {
                            description: "Specify the default color for the gap bar.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Default Color"
                        }
                    }
                },
                gaplabelproperties: {
                    displayName: "Gap Label",
                    properties: {
                        defaultColorOnBar: {
                            description: "Specify the default color for the text label on the gap bar.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Default Color On Bar"
                        },
                        defaultColorBelowBar: {
                            description: "Specify the default color for the text label below the gap bar.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Default Color Below Bar"
                        },
                        defaultFontSize: {
                            description: "Specify the font size for the gap label.",
                            type: { numeric: true },
                            displayName: "Default Font Size"
                        }
                    }
                }                
            },
            drilldown: {
                roles: ['Statement']
            }
        };

        private OpinionVisProperties = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'formatString' },
            }
        };

        private root: D3.Selection;
        private dataView: DataView[];
        private selectionManager: SelectionManager;
        private selectedId: any;
        
        private circleNodesCollectionD3: any[];
        private circleNodesCollectionClasses: OpinionNodeV2[];
        private rectNodesCollectionD3: any[];
        private rectNodesCollectionClasses: StatementResponseV2[];

        private colors: IDataColorPalette;
        
        public init(options: VisualInitOptions): void {
            this.selectionManager = new SelectionManager({ hostServices: options.host });

            this.root = d3.select(options.element.get(0))
                .append('svg');

            this.colors = options.style.colorPalette.dataColors;

        }

        public static converter(dataView: DataView[]): DataViewCategorical {
            return dataView[0].categorical;
        }

        public update(options: VisualUpdateOptions) {
            var dataView = this.dataView = options.dataViews;
            var viewport = options.viewport;
            var dataPoints = OpinionVis2.converter(dataView);    
            
            //if they've only put 1 of the fields in
            //don't render the visual
            if (dataPoints.values.length > 1) {
                this.circleNodesCollectionD3 = [];
                this.circleNodesCollectionClasses = [];
                this.rectNodesCollectionD3 = [];
                this.rectNodesCollectionClasses = [];
                //prep the visual area

                //should clear the pallette first
                this.root.selectAll("*").remove();

                this.root.attr({
                    'height': viewport.height,
                    'width': viewport.width
                });

                //get our formatters for using later
                var fStrA = valueFormatter.getFormatString(dataPoints.values[0].source, this.OpinionVisProperties.general.formatString);
                var fStrB = valueFormatter.getFormatString(dataPoints.values[1].source, this.OpinionVisProperties.general.formatString);

                var fStrC = null;
                var fStrD = null;
                //set the formatter if they put in the details
                if (2 in dataPoints.values) {
                    fStrC = valueFormatter.getFormatString(dataPoints.values[2].source, this.OpinionVisProperties.general.formatString);
                }
                if (3 in dataPoints.values) {
                    fStrD = valueFormatter.getFormatString(dataPoints.values[3].source, this.OpinionVisProperties.general.formatString);
                }

                //figure out the max value out of all the data points
                var maxValGroupA = _.max(dataPoints.values[0].values);
                var maxValGroupB = _.max(dataPoints.values[1].values);
                var maxVal = _.max([maxValGroupA, maxValGroupB]);

                var minValGroupA = _.min(dataPoints.values[0].values);
                var minValGroupB = _.min(dataPoints.values[1].values);
                var minVal = _.min([minValGroupA, minValGroupB]); 

                //we are going to draw the largest value for 
                //the maximum datapoint value
                var maxValWidth = 0;
                var maxValStr = this.root.append("text")
                    .data([maxVal])
                    .text(valueFormatter.format(maxVal, fStrA))
                    .style("font-size", this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", OpinionVis2.groupNodeDataLabelDefaultFontSize).toString() + "px")
                    .each(function (d) {
                        maxValWidth = this.getBBox().width;
                    });

                maxValStr.remove();

                //the minimum datapoint value
                var minValWidth = 0;
                var minValStr = this.root.append("text")
                    .data([maxVal])
                    .text(valueFormatter.format(minVal, fStrA))
                    .style("font-size", this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", OpinionVis2.groupNodeDataLabelDefaultFontSize).toString() + "px")
                    .each(function (d) {
                        minValWidth = this.getBBox().width;
                    });

                minValStr.remove();

                //longest group label text
                var longestSeriesElem: string = _.max(dataPoints.categories[0].values, function (d: string) {
                    return d.length;
                });
                var longestSeriesElemWidth = 0;
                var longestSeriesElemDraw = this.root.append("text")
                    .data([longestSeriesElem])
                    .style("font-size", this.GetProperty(this.dataView[0], "statementproperties", "defaultFontSize", OpinionVis2.statementDefaultFontSize).toString() + "px")
                    .style("font-family", "Segoe UI")
                    .text(longestSeriesElem)
                    .each(function (d) {
                        longestSeriesElemWidth = this.getBBox().width;
                    });
                longestSeriesElemDraw.remove();

                //some variables for drawing
                var rowIncrementPx = 30;
                var circleRadiusPx = 8;

                var outerTopMargin = 15;
                var leftTextMarginPx = 10;
                var leftMarginPx = leftTextMarginPx + longestSeriesElemWidth + 10 + minValWidth;
                var maxWidthBarPx = (viewport.width - leftMarginPx) - (maxValWidth + 15);

                var xScale = d3.scale.linear()
                    .domain([0, maxVal])
                    .range([leftMarginPx, leftMarginPx + maxWidthBarPx]);

                var mtdt = new OpinionVisualMetaDataV2(dataPoints.values[0].source.groupName, dataPoints.values[1].source.groupName);
                
                var valueGroupColor = this.GetPropertyColor(this.dataView[0], "groupnodeproperties", "defaultColor", OpinionVis2.groupNodeDefaultColor).solid.color;

                //firstly we need to draw the header with the legend
                this.root.append("circle")
                    .attr("cx", 15)
                    .attr("cy", 10)
                    .attr("r", circleRadiusPx)
                    .style("fill", "white")
                    .attr("stroke", valueGroupColor);

                var width = 0;
                var valueAGroupLabelHeight = 0;
                var valueAGroupLabel = this.root.append("text")
                    .data([mtdt])
                    .attr("dx", 15 + circleRadiusPx + 3)
                    .attr("dy", 10 + circleRadiusPx)
                    .style("font-size", "11px")
                    .text(mtdt.valAGroupLabel)
                    .each(function (d) {
                        d.width = this.getBBox().width;
                        width = d.width;
                        d.height = this.getBBox().height;
                        valueAGroupLabelHeight = d.height;
                    });

                this.root.append("circle")
                    .attr("cx", outerTopMargin + circleRadiusPx + 3 + width + circleRadiusPx + 10)
                    .attr("cy", 10)
                    .attr("r", circleRadiusPx)
                    .style("fill", valueGroupColor);

                var valueBGroupLabel = this.root.append("text")
                    .data([mtdt])
                    .attr("dx", outerTopMargin + circleRadiusPx + 3 + width + circleRadiusPx + 10 + (circleRadiusPx) + 3)
                    .attr("dy", 10 + circleRadiusPx)
                    .style("font-size", "11px")
                    .text(mtdt.valBGroupLabel)
                    .each(function (d) {
                        d.width = this.getBBox().width;
                        width = d.width;
                        d.height = this.getBBox().height;
                    });

                valueAGroupLabel.attr("dy", function (d) {
                    return 10 + (d.height / 2) - 3;
                });

                valueBGroupLabel.attr("dy", function (d) {
                    return 10 + (d.height / 2) - 3;
                });           

                //lets put the hover legend content in
                var defaultHeaderMoreDetailsLabel = "Hover on a circle below to focus in on that group";
                var selectedText = this.root.append("text")
                    .attr("dx", leftTextMarginPx)
                    .attr("dy", outerTopMargin + valueAGroupLabelHeight + 15 + 3)
                    .text(defaultHeaderMoreDetailsLabel)
                    .style("font-size", "13px");

                //now we draw the line seperating the legend from the visual
                this.root.append("line")
                    .attr("x1", leftTextMarginPx)
                    .attr("y1", outerTopMargin + valueAGroupLabelHeight + 30 + 3)
                    .attr("x2", leftTextMarginPx + leftMarginPx + maxWidthBarPx)
                    .attr("y2", outerTopMargin + valueAGroupLabelHeight + 30 + 3)
                    .attr("stroke-width", 1)
                    .attr("stroke", valueGroupColor);            
            

                //now we put the vertical tooltip
                var startYPy = outerTopMargin + valueAGroupLabelHeight + 40 + 3;
                startYPy += (circleRadiusPx * 2.5);

                var tooltip = this.root.append("line")
                    .attr("x1", 30)
                    .attr("y1", outerTopMargin + valueAGroupLabelHeight + 30 + 3)
                    .attr("x2", 30)
                    .attr("y2", 5)
                    .attr("stroke-width", 1)
                    .attr("stroke", valueGroupColor)
                    .style("visibility", "hidden");

                var valMeasureName: string = dataPoints.values[0].source.displayName;

                var endIndex = dataPoints.categories[0].values.length;
                //now lets walk through the values
                for (var i = 0; i < endIndex; i++) {
                    var statementStr: string = "";
                    var valA: number = 0;
                    var valB: number = 0;
                    var valADetails = 0;
                    var valBDetails = 0;
                    var valADetailsLabel = null;
                    var valBDetailsLabel = null;

                    var valAIndex = 0;
                    var valBIndex = 1;
                    //extract the values and strings
                    if (dataPoints.values.length > 2) {
                        //in this case we know that the value b index will actually be 3 not 1
                        valBIndex = 2;
                        valADetails = dataPoints.values[1].values[i];
                        valADetailsLabel = dataPoints.values[1].source.displayName;
                        valBDetails = dataPoints.values[3].values[i];
                        valBDetailsLabel = dataPoints.values[3].source.displayName;
                    }

                    var statementStr: string = dataPoints.categories[0].values[i];
                    var valA: number = dataPoints.values[valAIndex].values[i];
                    var valB: number = dataPoints.values[valBIndex].values[i];     

                    var leftFilled = false;
                    //if its greater just switch it
                    if (valA > valB) {
                        leftFilled = true;
                        //flip the main value
                        var tmp = valA;
                        valA = valB;
                        valB = tmp;
                        //flip the details
                        var tmpDetails = valADetails;
                        valADetails = valBDetails;
                        valBDetails = tmpDetails;
                        //flip the details label
                        var tmpDetailsLabel = valADetailsLabel;
                        valADetailsLabel = valBDetailsLabel;
                        valBDetailsLabel = tmpDetailsLabel;
                    }

                    var valAStr = valueFormatter.format(valA, fStrA);
                    var valBStr = valueFormatter.format(valB, fStrB);

                    var valADetailsStr = null;
                    var valBDetailsStr = null;
                    if (valADetails !== null) {
                        valADetailsStr = valueFormatter.format(valADetails, fStrC);
                    }
                    if (valBDetails !== null) {
                        valADetailsStr = valueFormatter.format(valBDetails, fStrD);
                    }

                    var gap = valB - valA;
                    var gapStr = valueFormatter.format(gap, fStrA);

                    //now we want to put the text on the page
                    this.root.append("text")
                        .attr("dx", leftTextMarginPx)
                        .attr("dy", startYPy)
                        .style("fill", this.GetPropertyColor(this.dataView[0], "statementproperties", "defaultFontColor", OpinionVis2.statementDefaultFontColor).solid.color)
                        .style("font-size", this.GetProperty(this.dataView[0], "statementproperties", "defaultFontSize", OpinionVis2.statementDefaultFontSize).toString() + "px")
                        .style("font-family", "'Segoe UI',wf_segoe-ui_normal,helvetica,arial,sans-serif")
                        .text(statementStr);
                                    
                    //we're going to set up the two nodes and work out their relative positions
                    var LeftCircleX = xScale(valA);
                    var RightCircleX = xScale(valB);

                    var label = mtdt.valAGroupLabel;
                    if (leftFilled) {
                        label = mtdt.valBGroupLabel;
                    }
                    var LeftNode = new OpinionNodeV2(label, valA, valAStr, valADetailsStr, valADetailsLabel, LeftCircleX);
                    var label = mtdt.valBGroupLabel;
                    if (leftFilled) {
                        label = mtdt.valAGroupLabel;
                    }
                    var RightNode = new OpinionNodeV2(label, valB, valBStr, valBDetailsStr, valBDetailsLabel, RightCircleX);
                    
                    var id = SelectionIdBuilder
                        .builder()
                        .withCategory(dataPoints.categories[0], i)
                        .createSelectionId();
                    var dd = new StatementResponseV2(id,statementStr, LeftNode, RightNode);
                                
                    //determine the two x start positions, then just calculate the width
                    //do the rectangle between the circles and add the text underneath or on top of
                    var rectWidth = RightCircleX - LeftCircleX;

                    var gapBColor = this.GetPropertyColor(this.dataView[0], "gapbarproperties", "defaultColor", OpinionVis2.gapBarDefaultColor).solid.color;
                    var gapBFontOnBar = this.GetPropertyColor(this.dataView[0], "gaplabelproperties", "defaultColorOnBar", OpinionVis2.gapLabelDefaultColorOnBar).solid.color;
                    var gapBFontBelowBar = this.GetPropertyColor(this.dataView[0], "gaplabelproperties", "defaultColorBelowBar", OpinionVis2.gapLabelDefaultColorBelowBar).solid.color;

                    var rect = this.root.append("rect")
                                        .data([dd])
                                        .attr("y", startYPy - circleRadiusPx)
                                        .attr("x", LeftCircleX)
                                        .attr("width", rectWidth)
                                        .attr("height", (circleRadiusPx * 2))
                        .style("fill", gapBColor);

                    this.rectNodesCollectionD3.push(rect[0][0]);
                    
                    var midpointPx = LeftCircleX + (rectWidth / 2);

                    var rectDLabel = this.root.append("text")
                        .data([dd])
                        .attr("dx", midpointPx)
                        .attr("dy", startYPy)
                        .text(gapStr)
                        .style("font-size", this.GetProperty(this.dataView[0], "gaplabelproperties", "defaultFontSize", OpinionVis2.gapLabelDefaultFontSize).toString() + "px")
                        .style("font-family", "wf_standard-font,helvetica,arial,sans-serif")
                        .each(function (d) {
                            d.width = this.getBBox().width;
                            d.height = this.getBBox().height;
                        });

                    rectDLabel.attr("dx", function (d) {
                        return midpointPx - (d.width / 2);
                    });

                    //if the width of the text is larger than the rectangle
                    //we need to push it underneath the rectangle
                    var rectWidthWithRadius = rectWidth - (circleRadiusPx * 2);

                    rectDLabel.attr("dy", function (d) {
                        var rectStart = (startYPy - circleRadiusPx);
                        var rectHeight = (circleRadiusPx * 2);
                        if (rectWidthWithRadius < d.width) {
                            return rectStart + rectHeight + (d.height) + 3;
                        }
                        var rectMidPointY = rectStart + (rectHeight / 2);
                        return rectMidPointY + (d.height / 2) - 3;
                    });

                    rectDLabel.style("fill", function (d) {
                        if (rectWidthWithRadius < d.width) {
                            return gapBFontBelowBar;
                        } else {
                            return gapBFontOnBar;
                        }
                    });

                    //do the circle then the text                
                    var leftCircleNode = this.root.append("circle")
                        .data([LeftNode])
                        .attr("cx", LeftCircleX)
                        .attr("cy", startYPy)
                        .attr("r", circleRadiusPx)
                        .style("fill", function (d) {
                            if (leftFilled) {
                                return valueGroupColor;
                            }
                            return "white";
                        })
                        .style("stroke", valueGroupColor);

                    this.circleNodesCollectionD3.push(leftCircleNode[0][0]);

                    var nodeLabelFontColor = this.GetPropertyColor(this.dataView[0], "groupnodedatalabelproperties", "defaultColor", OpinionVis2.groupNodeDataLabelDefaultColor).solid.color;
                    var nodeLabelDefaultFontSize = this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", OpinionVis2.groupNodeDataLabelDefaultFontSize).toString() + "px";

                    var LeftDLabel = this.root.append("text")
                        .data([dd])
                        .attr("dx", LeftCircleX)
                        .attr("dy", startYPy)
                        .text(valAStr)
                        .style("font-size", nodeLabelDefaultFontSize)
                        .style("font-family", "wf_standard-font,helvetica,arial,sans-serif")
                        .style("fill", nodeLabelFontColor)
                        .each(function (d) {
                            d.width = this.getBBox().width;
                        });

                    LeftDLabel.attr("dx", function (d) {
                        return LeftCircleX - d.width - circleRadiusPx - 3;
                    });

                    //do the circle then the text
                    var rightCircleNode = this.root.append("circle")
                        .data([RightNode])
                        .attr("cx", RightCircleX)
                        .attr("cy", startYPy)
                        .attr("r", circleRadiusPx)
                        .style("fill", function (d) {
                            if (leftFilled) {
                                return "white";
                            }
                            return valueGroupColor;
                        })
                        .attr("stroke", valueGroupColor);

                    this.circleNodesCollectionD3.push(rightCircleNode[0][0]);

                    var RightDLabel = this.root.append("text")
                        .data([dd])
                        .attr("dx", RightCircleX)
                        .attr("dy", startYPy)
                        .text(valBStr)
                        .style("fill", nodeLabelFontColor)
                        .style("font-size", nodeLabelDefaultFontSize)
                        .style("font-family", "wf_standard-font,helvetica,arial,sans-serif")
                        .each(function (d) {
                            d.width = this.getBBox().width;
                        });

                    RightDLabel.attr("dx", function (d) {
                        return RightCircleX + circleRadiusPx + 3;
                    });

                    this.root.append("line")
                        .attr("x1", leftTextMarginPx)
                        .attr("y1", startYPy + rowIncrementPx)
                        .attr("x2", leftTextMarginPx + leftMarginPx + maxWidthBarPx)
                        .attr("y2", startYPy + rowIncrementPx)
                        .attr("stroke-width", 2)
                        .style("stroke-dasharray", ("3, 3"))  // <== This line here!!
                        .attr("stroke", "grey");

                    startYPy += rowIncrementPx;
                    startYPy += rowIncrementPx;
                }

                tooltip.attr("y2", startYPy);

                //our tool tip content and animations triggered
                d3.selectAll(this.circleNodesCollectionD3).on("mouseover", function () {
                    return tooltip.style("visibility", "visible");
                }).on("mousemove", function (d) {
                    if (mtdt.valAGroupLabel === d.groupLabel) {
                        valueAGroupLabel.style("text-decoration", "underline");
                        valueAGroupLabel.style("font-weight", "bold");
                    } else {
                        valueBGroupLabel.style("text-decoration", "underline");
                        valueBGroupLabel.style("font-weight", "bold");
                    }
                    var strToDisplay = valMeasureName + ": " + d.valFormatted;
                    if (d.valDetails !== null) {
                        strToDisplay += " | " + d.valDetailsLabel + ": " + d.valDetails;
                    }
                    selectedText.text(strToDisplay);
                    return tooltip.attr("x1", d.XpX).attr("x2", d.XpX);
                }).on("mouseout", function (d) {
                    valueAGroupLabel.style("text-decoration", "");
                    valueBGroupLabel.style("text-decoration", "");
                    valueAGroupLabel.style("font-weight", "");
                    valueBGroupLabel.style("font-weight", "");
                    selectedText.text(defaultHeaderMoreDetailsLabel);
                    return tooltip.style("visibility", "hidden");
                });

                var self = this;
                d3.selectAll(this.rectNodesCollectionD3).on("click", function (d: StatementResponseV2) {
                    self.selectionManager.select(d.identity).then(ids => {                        
                        //now we should do highlighting here
                        if (self.selectedId === d.identity) {
                            d3.selectAll(self.rectNodesCollectionD3).style("opacity", 1);
                        } else {
                            d3.selectAll(self.rectNodesCollectionD3).style("opacity", 0.5);
                            d3.select(this).style("opacity", 1);
                        }
                        self.selectedId = d.identity;
                    });
                });
            }            
        }

        static statementDefaultFontSize = 11;
        static statementDefaultFontColor = "#777";

        static gapBarDefaultColor = "rgb(1, 184, 170)";
        static gapLabelDefaultColorOnBar = "white";
        static gapLabelDefaultColorBelowBar = "#4884d9";
        static gapLabelDefaultFontSize = 12;

        static groupNodeDefaultColor = "#00394D";

        static groupNodeDataLabelDefaultColor = "rgb(119, 119, 119)";
        static groupNodeDataLabelDefaultFontSize = 12;
       
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];
            var dV = this.dataView[0];
            switch (options.objectName) {
                case 'statementproperties':
                    var objectname = 'statementproperties';
                    var statementproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Statement',
                        selector: null,
                        properties: {
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", OpinionVis2.statementDefaultFontSize),
                            defaultFontColor: this.GetPropertyColor(dV, objectname, "defaultFontColor", OpinionVis2.statementDefaultFontColor)
                        }
                    };
                    instances.push(statementproperties);
                    break;
                case 'groupnodeproperties':
                    var objectname = 'groupnodeproperties';
                    var groupnodeproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Group Node',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", OpinionVis2.groupNodeDefaultColor)
                        }
                    };
                    instances.push(groupnodeproperties);
                    break;
                case 'groupnodedatalabelproperties':
                    var objectname = 'groupnodedatalabelproperties';
                    var gapbarproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Group Node Data Label',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", OpinionVis2.groupNodeDataLabelDefaultColor),
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", OpinionVis2.groupNodeDataLabelDefaultFontSize)
                        }
                    };
                    instances.push(gapbarproperties);
                    break;
                case 'gapbarproperties':
                    var objectname = 'gapbarproperties';
                    var gapbarproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Gap Bar',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", OpinionVis2.gapBarDefaultColor)
                        }
                    };
                    instances.push(gapbarproperties);
                    break;
                case 'gaplabelproperties':
                    var objectname = 'gaplabelproperties';
                    var gaplabelproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Gap Label',
                        selector: null,
                        properties: {
                            defaultColorOnBar: this.GetPropertyColor(dV, objectname, "defaultColorOnBar", OpinionVis2.gapLabelDefaultColorOnBar),
                            defaultColorBelowBar: this.GetPropertyColor(dV, objectname, "defaultColorBelowBar", OpinionVis2.gapLabelDefaultColorBelowBar),
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", OpinionVis2.gapLabelDefaultFontSize)
                        }
                    };
                    instances.push(gaplabelproperties);
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
            var colorToReturn: Fill = {
                solid: {
                    color: defaultValue
                }
            };
            return colorToReturn;
        }

        private GetProperty<T>(dataView: DataView, groupPropertyValue: string, propertyValue: string, defaultValue: T) {
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