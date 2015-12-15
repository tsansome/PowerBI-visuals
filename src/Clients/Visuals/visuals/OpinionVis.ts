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
    
    export class OpinionNode {
        public statement: string;
        public valA: number;
        public valB: number;
        public constructor(statement: string, valAInput: number, valBInput: number) {
            this.statement = statement;
            this.valA = valAInput;
            this.valB = valBInput;
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

    export class OpinionVis implements IVisual {

        private root: D3.Selection;
        private dataView: DataView[];
        private selectionManager: SelectionManager;
        
        private circleNodesCollection: any[];

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

            this.circleNodesCollection = [];
            //prep the visual area

            //should clear the pallette first
            this.root.selectAll("*").remove();

            this.root.attr({
                'height': viewport.height,
                'width': viewport.width
            });

            //get our formatters for using later
            var fStrA = valueFormatter.getFormatString(dataPoints.values[0].source, OpinionVisProperties.general.formatString);
            var fStrB = valueFormatter.getFormatString(dataPoints.values[1].source, OpinionVisProperties.general.formatString);

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
            var maxWidthBarPx = (viewport.width - leftMarginPx)  - (maxValWidth+3);

            var xScale = d3.scale.linear()
                .domain([0, maxVal])
                .range([leftMarginPx, leftMarginPx + maxWidthBarPx]);
            
            var mtdt = new OpinionVisualMetaData(dataPoints.values[0].source.displayName, dataPoints.values[1].source.displayName);
            
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
                .attr("cx", outerTopMargin + circleRadiusPx + 3 + width + circleRadiusPx + 5)
                .attr("cy", 10)
                .attr("r", circleRadiusPx)
                .style("fill", valueGroupColor);  

            var valueBGroupLabel = this.root.append("text")
                .data([mtdt])
                .attr("dx", outerTopMargin + circleRadiusPx + 3 + width + circleRadiusPx + 5 + (circleRadiusPx) + 3)
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

            //now we draw the line seperating the legend from the visual
            this.root.append("line")
                .attr("x1", leftTextMarginPx)
                .attr("y1", outerTopMargin + valueAGroupLabelHeight + 30 + 3)
                .attr("x2", leftTextMarginPx + leftMarginPx + maxWidthBarPx)
                .attr("y2", outerTopMargin + valueAGroupLabelHeight + 30 + 3)
                .attr("stroke-width", 1)
                .attr("stroke", valueGroupColor);
            
            //so we should start it after our line above
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

            var endIndex = dataPoints.values[0].values.length;    
            //now lets walk through the values
            for (var i = 0; i < endIndex; i++) {
                //extract the values and strings
                var statementStr: string = dataPoints.categories[0].values[i];
                var valA: number = dataPoints.values[0].values[i];
                var valB: number = dataPoints.values[1].values[i];           

                var leftFilled = false;
                //if its greater just switch it
                if (valA > valB) {
                    leftFilled = true;
                    var tmp = valA;
                    valA = valB;
                    valB = tmp;
                }

                var valAStr = valueFormatter.format(valA, fStrA);
                var valBStr = valueFormatter.format(valB, fStrB);

                var gap = valB - valA;
                var gapStr = valueFormatter.format(gap, fStrA);

                //now we want to put the text on the page
                this.root.append("text")
                    .attr("dx", leftTextMarginPx)
                    .attr("dy", startYPy)
                    .style("font-size", "11px")
                    .text(statementStr);

                //determine the two x start positions, then just calculate the width
                var LeftCircleX = xScale(valA);
                var RightCircleX = xScale(valB);
                
                var dd = new OpinionNode(statementStr, valA, valB);                

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
                    .attr("cx", LeftCircleX)
                    .data([LeftCircleX])
                    .attr("cy", startYPy)
                    .attr("r", circleRadiusPx)
                    .style("fill", function (d) {
                        if (leftFilled) {
                            return valueGroupColor;
                        }
                        return "white";
                    })
                    .style("stroke",valueGroupColor);

                this.circleNodesCollection.push(leftCircleNode[0][0]);

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
                                            .data([RightCircleX])
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
                
                this.circleNodesCollection.push(rightCircleNode[0][0]);
                
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

            d3.selectAll(this.circleNodesCollection).on("mouseover", function () {
                return tooltip.style("visibility", "visible");
            }).on("mousemove", function (d) {
                return tooltip.attr("x1", d).attr("x2", d);
            }).on("mouseout", function (d) {
                return tooltip.style("visibility", "hidden");
            });

        }

        public destroy(): void {
            this.root = null;
        }

    }
}