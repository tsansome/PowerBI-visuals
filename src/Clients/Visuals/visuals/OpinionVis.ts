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
    
    export class OpinionVis implements IVisual {

        private root: D3.Selection;
        private dataView: DataView[];
        private selectionManager: SelectionManager;
     
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

            //prep the visual area

            //should clear the pallette first
            this.root.selectAll("*").remove();

            //var h = viewport.height;
            //var w = viewport.width;

            //our target is the size of a 2x2 tile on pbi.com
            //var targetWidth = 520.0;
            //var targetHeight = 360.0;
            //now we work out the percent scale
            //var scaleWidth = viewport.width / targetWidth;
            //var scaleHeight = viewport.height / targetHeight;

            this.root.attr({
                'height': viewport.height,
                'width': viewport.width
            });

            //var visArea = this.root.attr("viewBox", "0 0 " + w + " " + h)
            //    .attr("preserveAspectRatio", "xMidYMid");
            

            //extract the two value field names first
            //var valALabel = dataPoints.columns.levels[0].sources[0];
            //var valBLabel = dataPoints.columns.levels[0].sources[1];

            //some global vars
            var maxVal = 850000;

            //some variables for drawing
            var rowIncrementPx = 30;
            var circleRadiusPx = 8;
            var startYPx = 10;
            
            var leftTextMarginPx = 10;
            var leftMarginPx = 100;
            var maxWidthBarPx = 500;

            var xScale = d3.scale.linear()
                .domain([0, maxVal])
                .range([leftMarginPx, leftMarginPx + maxWidthBarPx]);

            var endIndex = dataPoints.values[0].values.length;    
            //now lets walk through the values
            for (var i = 0; i < endIndex; i++) {
                //extract the values and strings
                var statementStr: string = dataPoints.categories[0].values[i];
                var valA: number = dataPoints.values[0].values[i];
                var valB: number = dataPoints.values[1].values[i];                

                //now we want to put the text on the page
                this.root.append("text")
                    .attr("dx", leftTextMarginPx)
                    .attr("dy", startYPx)
                    .style("font-size", "11px")
                    .text(statementStr);

                //determine the two x start positions, then just calculate the width
                var LeftCircleX = xScale(valA);
                var RightCircleX = xScale(valB);

                //if its greater just switch it for now
                if (LeftCircleX > RightCircleX) {
                    var tmp = RightCircleX;
                    RightCircleX = LeftCircleX;
                    LeftCircleX = tmp;
                }

                this.root.append("rect")
                    .attr("y", startYPx - circleRadiusPx)
                    .attr("x", LeftCircleX)
                    .attr("width", RightCircleX - LeftCircleX)
                    .attr("height", (circleRadiusPx*2))
                    .style("fill", "#4884d9");
                                
                this.root.append("circle")
                    .attr("cx", LeftCircleX)
                    .attr("cy", startYPx)
                    .attr("r", circleRadiusPx)
                    .style("fill", "#00394D");

                this.root   .append("circle")
                            .attr("cx", RightCircleX)
                            .attr("cy", startYPx)
                            .attr("r", circleRadiusPx)
                            .style("fill", "white")
                            .attr("stroke", "#00394D");                   
                
                this.root.append("line")
                    .attr("x1", leftTextMarginPx)
                    .attr("y1", startYPx + rowIncrementPx)
                    .attr("x2", leftTextMarginPx + leftMarginPx + maxWidthBarPx)
                    .attr("y2", startYPx + rowIncrementPx)
                    .attr("stroke-width", 2)
                    .style("stroke-dasharray", ("3, 3"))  // <== This line here!!
                    .attr("stroke", "grey");

                startYPx += rowIncrementPx;
                startYPx += rowIncrementPx;
            }
            
        }

        public destroy(): void {
            this.root = null;
        }

    }
}