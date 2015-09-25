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
    
 
    export interface RadarDatapoint {
        color: string;
        value: number;
        label: string;
        selector: SelectionId;
        tooltipInfo: TooltipDataItem[];
    }

    export class RadarChart implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: powerbi.VisualDataRoleKind.Grouping,
                },
                {
                    name: 'Y',
                    kind: powerbi.VisualDataRoleKind.Measure,
                },
            ],
            dataViewMappings: [{
                categories: {
                    for: { in: 'Category' },
                    dataReductionAlgorithm: { top: {} }
                },
                values: {
                    select: [{ bind: { to: 'Y' } }]
                },
            }],
            objects: {
                general: {
                    displayName: data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
                label: {
                    displayName: 'Label',
                    properties: {
                        fill: {
                            displayName: 'Fill',
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                }
            }
        };

        private static VisualClassName = 'RadarChart';
        
        private static Segments: ClassAndSelector = {
            class: 'segments',
            selector: '.segments'
        };

        private static SegmentNode: ClassAndSelector = {
            class: 'segmentNode',
            selector: '.segmentNode'
        };
                
        
        private static Axis: ClassAndSelector = {
            class: 'axis',
            selector: '.axis'
        };

        private static AxisNode: ClassAndSelector = {
            class: 'axisNode',
            selector: '.axisNode'
        };

        private static AxisLabel: ClassAndSelector = {
            class: 'axisLabel',
            selector: '.axisLabel'
        };
                
        
        private static Chart: ClassAndSelector = {
            class: 'chart',
            selector: '.chart'
        };

        private static ChartNode: ClassAndSelector = {
            class: 'chartNode',
            selector: '.chartNode'
        };

        private static ChartPoint: ClassAndSelector = {
            class: 'chartPoint',
            selector: '.chartPoint'
        };

        private root: D3.Selection;
        private segments: D3.Selection;
        private axis: D3.Selection;
        private chart: D3.Selection;
        
        private mainGroupElement: D3.Selection;
        private colors: IDataColorPalette;
        private selectionManager: SelectionManager;
        private dataView: DataView;
        private viewport: IViewport;

        private margin: IMargin;
        
        private SEGMENT_LEVELS: number = 6;
        private SEGMENT_FACTOR: number = 1;
        private RADIANS: number = 2 * Math.PI;
        private SCALE: number = 1;
        private angle: number;
        private radius: number;
        
        private static createDataPoints(values, categories: DataViewCategoricalColumn, maxScore): RadarDatapoint[] {
            
            return values.map((value, i) => {
                
                const max = Math.max(value, 0);
                const score = max / maxScore;

                return {
                    color: "white",
                    value: value,
                    score: score,
                    label: categories.values[i],
                    selector: '.value',
                    tooltipInfo: []
                };
            });            
        }
        
        public static converter(dataView: DataView, colors: IDataColorPalette) {
            let catDv: DataViewCategorical = dataView.categorical;
            let categories: DataViewCategoricalColumn = catDv.categories[0];
            
            const maxScore = d3.max(dataView.categorical.values, item => {
                return d3.max(item.values); 
            });
              
            let series = dataView.categorical.values.map((item, i) => {
                
                let dataPoints: RadarDatapoint[] = this.createDataPoints(item.values, categories, maxScore);
                
                return {
                    displayName: item.source.displayName,
                    color: colors.getColorByIndex(i).value,
                    data: dataPoints,
                    //identity: identity,
                    selected: false,
                };                
            });
            
            return {
                categories: categories.values,
                values: series
            };
        }

        public init(options: VisualInitOptions): void {
            let element = options.element;
            this.selectionManager = new SelectionManager({ hostServices: options.host });

            this.root = d3.select(element.get(0))
                .append('svg')
                .classed(RadarChart.VisualClassName, true);

            this.margin = {
                top: 50,
                right: 100,
                bottom: 50,
                left: 100
            };

            this.colors = options.style.colorPalette.dataColors;
            this.mainGroupElement = this.root.append('g');
            
            this.segments = this.mainGroupElement
                .append('g')
                .classed(RadarChart.Segments.class, true);

            this.axis = this.mainGroupElement
                .append('g')
                .classed(RadarChart.Axis.class, true);

            this.chart = this.mainGroupElement
                .append('g')
                .classed(RadarChart.Chart.class, true);
        }

        public update(options: VisualUpdateOptions) {
            if (!options.dataViews || !options.dataViews[0]) return;
            let dataView = this.dataView = options.dataViews[0];
            let dataPoints = RadarChart.converter(dataView, this.colors);
            let viewport = this.viewport = options.viewport;

            this.root
                .attr({
                    'height': viewport.height,
                    'width': viewport.width
                });

            let mainGroup = this.mainGroupElement;
            mainGroup.attr('transform', SVGUtil.translate(viewport.width / 2, viewport.height / 2));

            let width: number = viewport.width - this.margin.left - this.margin.right;
            let height: number = viewport.height - this.margin.top - this.margin.bottom;
            
            this.angle = this.RADIANS / dataPoints.categories.length;
            this.radius = this.SEGMENT_FACTOR * this.SCALE * Math.min(width, height) / 2;
                                
            this.drawCircularSegments(dataPoints.categories);
            this.drawAxes(dataPoints.categories);
            this.drawAxesLabels(dataPoints.categories);
            this.drawChart(dataPoints.values);
        }
        
        private drawCircularSegments(dataPoints) {
  
            const angle: number = this.angle,
                factor: number = this.SEGMENT_FACTOR, 
                levels: number = this.SEGMENT_LEVELS,
                radius: number  = this.radius;
 
            let selection:D3.Selection = this.mainGroupElement
                                .select(RadarChart.Segments.selector)
                .selectAll(RadarChart.SegmentNode.selector);
           
            let data = [];
           
            for (let level = 0; level < levels - 1; level++) {
                const levelFactor: number = radius * ((level + 1) / levels);
                const transform: number = -1 * levelFactor;

                for (let i = 0; i < dataPoints.length; i++) {
                    data.push({
                        x1: levelFactor * (1 - factor * Math.sin(i * angle)),
                        y1: levelFactor * (1 - factor * Math.cos(i * angle)),
                        x2: levelFactor * (1 - factor * Math.sin((i + 1) * angle)),
                        y2: levelFactor * (1 - factor * Math.cos((i + 1) * angle)),
                        translate: `translate(${transform},${transform})`
                    });
                   
                }
            }  

            let segments = selection.data(data);
            segments
                .enter()
                .append("svg:line");
            segments
                .attr("x1", item => item.x1)
                .attr("y1", item => item.y1)
                .attr("x2", item => item.x2)
                .attr("y2", item => item.y2)
                .attr("class", "line")
                .style("stroke", "grey")
                .style("stroke-opacity", "0.75")
                .style("stroke-width", "0.3px")
                .attr("transform", item => item.translate)
                .classed(RadarChart.SegmentNode.class, true);
        }       
                
        private drawAxes(dataPoints) {

            const angle: number = this.angle,
                radius: number = this.radius;

            let selection: D3.Selection = this.mainGroupElement
                .select(RadarChart.Axis.selector)
                .selectAll(RadarChart.AxisNode.selector);
                
            let axis = selection.data(dataPoints);
     
            axis
                .enter()
                .append("svg:line");
            axis
                .attr("label", item => item)
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (name, i) => radius * Math.sin(i * angle))
                .attr("y2", (name, i) => radius * Math.cos(i * angle))
                .attr("class", "line")
                .style("stroke", "grey")
                .style("stroke-width", "1px")
                .classed(RadarChart.AxisNode.class, true);
                
            axis.exit().remove();
        }    
                
        private drawAxesLabels(dataPoints) {

            const angle: number = this.angle,
                radius: number = this.radius;

            let selection: D3.Selection = this.mainGroupElement
                .select(RadarChart.Axis.selector)
                .selectAll(RadarChart.AxisLabel.selector);
                
            let labels = selection.data(dataPoints);     

            labels
                .enter()
                .append("svg:text");

            labels
                .attr("class", "legend")
                .style("font-family", "sans-serif")
                .style("font-size", "11px")
                .attr("text-anchor", "middle")
                .attr("dy", "1.5em")
                .attr("transform", "translate(0, -10)")
                .attr("x", (name, i) => {
                    return radius * Math.sin(i * angle) + 20 * Math.sin(i * angle);
                })
                .attr("y", (name, i) => {
                    return radius * Math.cos(i * angle) + 10 * Math.cos(i * angle);
                })
                .text(item => item)
                .classed(RadarChart.AxisLabel.class, true);
                
            labels.exit().remove();
        }
        
        private drawChart(dataPoints) {

            const angle: number = this.angle,
                radius: number = this.radius,
                opacity: number = .5,
                circleRadius = 5;
            
            let selection: D3.Selection = this.mainGroupElement
                .select(RadarChart.Chart.selector);

            dataPoints.forEach((dataPoint, i) => {
                let data:any[] = dataPoint.data;
                const color: string = dataPoint.color;
                
                data.forEach((value, i) => {
                    value.x = value.score * radius * Math.sin(i * angle);
                    value.y = value.score * radius * Math.cos(i * angle);
                });
                
                let chart = selection
                            .selectAll(RadarChart.ChartNode.selector + '-' + i)
                            .data([data]);
                chart
                    .enter()
                    .append("polygon");
                chart
                    .style("stroke-width", "2px")
                    .style("stroke", color)
                    .attr("points", value => {
                        return value.map(point => `${point.x},${point.y}`).join(' ');
                    })
                    .style("fill", color)
                    .style("fill-opacity", opacity)
                    .classed(RadarChart.ChartNode.class + '-' + i, true)
                    .on('mouseover', function() {
                        let z = "polygon." + d3.select(this).attr("class");
                        selection.selectAll("polygon")
                            .transition()
                            .duration(200)
                            .style("fill-opacity", 0.1);
                        selection.selectAll(z)
                            .transition()
                            .duration(200)
                            .style("fill-opacity", .7);
                    })
                    .on('mouseout', function() {
                        selection.selectAll("polygon")
                            .transition()
                            .duration(200)
                            .style("fill-opacity", opacity);
                    });
                chart.exit().remove();

                let points = selection
                            .selectAll(RadarChart.ChartPoint.selector + '-' + i)
                            .data(data);
                points
                    .enter()
                    .append("svg:circle");
                points
                    .attr("r", circleRadius)
                    .attr("cx", point => point.x)
                    .attr("cy", point => point.y)
                    .style("fill", color)
                    .classed(RadarChart.ChartPoint.class + '-' + i, true);
                 
                points.exit().remove();
            });
        }
    }
}