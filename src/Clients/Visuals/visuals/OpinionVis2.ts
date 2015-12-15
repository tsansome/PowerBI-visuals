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
    
    export class StatementResponse {
        public statement: string;
        public GroupA: OpinionNode;
        public GroupB: OpinionNode;        
        public constructor(statement: string, GroupA: OpinionNode, GroupB: OpinionNode) {
            this.statement = statement;
            this.GroupA = GroupA;
            this.GroupB = GroupB;            
        }
    }

    export class OpinionNode {
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

    export class OpinionVisualMetaData {
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
            ],
            dataViewMappings: [
                {
                    conditions: [
                        // NOTE: Ordering of the roles prefers to add measures to Y before Gradient.
                        { 'Statement': { max: 1 }, 'Groups': { max: 1 }, 'Value': { max: 1 } },
                    ],
                    categorical: {
                        categories: {
                            for: { in: 'Statement' },
                            dataReductionAlgorithm: { top: {} }
                        },
                        values: {
                            group: {
                                by: 'Groups',
                                select: [{ for: { in: 'Value' } }],
                                dataReductionAlgorithm: { top: { count: 2 } }
                            }
                        },
                        rowCount: { preferred: { min: 2 }, supported: { min: 0 } }
                    }
                }
            ]
        };

        private OpinionVisProperties = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'formatString' },
            }
        };

        private root: D3.Selection;
        private dataView: DataView[];
        private selectionManager: SelectionManager;
        
        private circleNodesCollectionD3: any[];
        private circleNodesCollectionClasses: OpinionNode[];

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
            var dataPoints = OpinionVis.converter(dataView);    
            
            //if they've only put 1 of the fields in
            //don't render the visual
            if (dataPoints.values.length > 1) {
                this.circleNodesCollectionD3 = [];
                this.circleNodesCollectionClasses = [];
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
                    .each(function (d) {
                        maxValWidth = this.getBBox().width;
                    });

                maxValStr.remove();

                //the minimum datapoint value
                var minValWidth = 0;
                var minValStr = this.root.append("text")
                    .data([maxVal])
                    .text(valueFormatter.format(minVal, fStrA))
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
                    .style("font-size", "11px")
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

                var mtdt = new OpinionVisualMetaData(dataPoints.values[0].source.groupName, dataPoints.values[1].source.groupName);

                var valueGroupColor = "#00394D";

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
                    .text(defaultHeaderMoreDetailsLabel);

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

                var endIndex = dataPoints.categories[0].values.length; 
                alert(dataPoints.categories[0].values);
                //now lets walk through the values
                for (var i = 0; i < endIndex; i++) {
                    //extract the values and strings
                    var statementStr: string = dataPoints.categories[0].values[i];
                    var valA: number = dataPoints.values[0].values[i];
                    var valB: number = dataPoints.values[1].values[i];

                    var valADetails = null;
                    var valBDetails = null;
                    var valADetailsLabel = null;
                    var valBDetailsLabel = null;
                    if (2 in dataPoints.values) {
                        valADetails = dataPoints.values[2].values[i];
                        valADetailsLabel = dataPoints.values[2].source.displayName;
                    }
                    if (3 in dataPoints.values) {
                        valBDetails = dataPoints.values[3].values[i];
                        valBDetailsLabel = dataPoints.values[3].source.displayName;
                    }

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
                        .style("font-size", "11px")
                        .text(statementStr);

                
                    //we're going to set up the two nodes and work out their relative positions
                    var LeftCircleX = xScale(valA);
                    var RightCircleX = xScale(valB);

                    var label = mtdt.valAGroupLabel;
                    if (leftFilled) {
                        label = mtdt.valBGroupLabel;
                    }
                    var LeftNode = new OpinionNode(label, valA, valAStr, valADetailsStr, valADetailsLabel, LeftCircleX);
                    var label = mtdt.valBGroupLabel;
                    if (leftFilled) {
                        label = mtdt.valAGroupLabel;
                    }
                    var RightNode = new OpinionNode(label, valB, valBStr, valBDetailsStr, valBDetailsLabel, RightCircleX);

                    var dd = new StatementResponse(statementStr, LeftNode, RightNode);
                                
                    //determine the two x start positions, then just calculate the width
                    //do the rectangle between the circles and add the text underneath or on top of
                    var rectWidth = RightCircleX - LeftCircleX;

                    this.root.append("rect")
                        .attr("y", startYPy - circleRadiusPx)
                        .attr("x", LeftCircleX)
                        .attr("width", rectWidth)
                        .attr("height", (circleRadiusPx * 2))
                        .style("fill", "#4884d9");

                    var midpointPx = LeftCircleX + (rectWidth / 2);

                    var rectDLabel = this.root.append("text")
                        .data([dd])
                        .attr("dx", midpointPx)
                        .attr("dy", startYPy)
                        .text(gapStr)
                        .style("font-size", "12px")
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
                            return "#4884d9";
                        } else {
                            return "white";
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

                    var LeftDLabel = this.root.append("text")
                        .data([dd])
                        .attr("dx", LeftCircleX)
                        .attr("dy", startYPy)
                        .text(valAStr)
                        .style("font-size", "14px")
                        .style("fill", "grey")
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
                        .style("fill", "grey")
                        .style("font-size", "14px")
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
                    var strToDisplay = d.valFormatted;
                    if (d.valDetails !== null) {
                        strToDisplay += ", " + d.valDetailsLabel + ": " + d.valDetails;
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
            }
            
        }

        public destroy(): void {
            this.root = null;
        }

    }
}