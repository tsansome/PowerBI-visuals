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

/// <reference path="../../_references.ts"/>

module powerbi.visuals.samples {
    import SelectionManager = utility.SelectionManager;
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import getAnimationDuration = AnimatorCommon.GetAnimationDuration;

    export interface DotPlotConstructorOptions {
        animator?: IGenericAnimator;
        svg?: D3.Selection;
        margin?: IMargin;
        radius?: number;
        strokeWidth?: number;
    }

    export interface DotPlotDataPoint {
        x: number;
        y: number;
        color?: string;
        value?: number;
        label?: string;
        identity: SelectionId;
        tooltipInfo?: TooltipDataItem[];
    }

    export interface DotPlotData {
        dataPoints: DotPlotDataPoint[];
        legendData: LegendData;
    }

    class VisualLayout {
        private marginValue: IMargin;
        private viewportValue: IViewport;
        private viewportInValue: IViewport;

        public defaultMargin: IMargin;
        public defaultViewport: IViewport;

        constructor(defaultViewport?: IViewport, defaultMargin?: IMargin) {
            this.defaultViewport = defaultViewport || { width: 0, height: 0 };
            this.defaultMargin = defaultMargin || { top: 0, bottom: 0, right: 0, left: 0 };
        }

        public get margin(): IMargin {
            return this.marginValue || (this.margin = this.defaultMargin);
        }

        public set margin(value: IMargin) {
            this.marginValue = VisualLayout.restrictToMinMax(value);
            this.update();
        }

        public get viewport(): IViewport {
            return this.viewportValue || (this.viewportValue = this.defaultViewport);
        }

        public set viewport(value: IViewport) {
            this.viewportValue = VisualLayout.restrictToMinMax(value);
            this.update();
        }

        public get viewportIn(): IViewport {
            return this.viewportInValue || this.viewport;
        }

        public get viewportInIsZero(): boolean {
            return this.viewportIn.width === 0 || this.viewportIn.height === 0;
        }

        private update(): void {
            this.viewportInValue = VisualLayout.restrictToMinMax({
                width: this.viewport.width - (this.margin.left + this.margin.right),
                height: this.viewport.height - (this.margin.top + this.margin.bottom)
            });
        }

        private static restrictToMinMax<T>(value: T): T {
            var result = $.extend({}, value);
            d3.keys(value).forEach(x => result[x] = Math.max(0, value[x]));
            return result;
        }
    }

    export class DotPlot implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [{
                name: 'Category',
                kind: powerbi.VisualDataRoleKind.Grouping,
                displayName: data.createDisplayNameGetter("Role_DisplayName_Category")
            },
            {
                name: 'Y',
                kind: powerbi.VisualDataRoleKind.Measure,
                displayName: data.createDisplayNameGetter("Role_DisplayName_Value")
            }],
            dataViewMappings: [{
                conditions: [
                    { 'Category': { max: 1 }, 'Y': { max: 1 } },
                ],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        select: [{ bind: { to: 'Y' } }]
                    },
                }
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

        private static VisualClassName = 'dotPlot';

        private static DotPlot: ClassAndSelector = {
            class: 'dotPlot',
            selector: '.dotPlot'
        };

        private static Axis: ClassAndSelector = {
            class: 'axis',
            selector: '.axis'
        };

        private static Dot: ClassAndSelector = {
            class: 'dot',
            selector: '.dot'
        };

        private static DefaultMargin: IMargin = {
            top: 40,
            bottom: 5,
            right: 5,
            left: 5
        };

        private static MaxXAxisHeight: number = 50;
        private static XAxisHorizontalMargin: number = 40;

        private svg: D3.Selection;
        private axis: D3.Selection;
        private dotPlot: D3.Selection;

        private colors: IDataColorPalette;
        private selectionManager: SelectionManager;
        private dataView: DataView;
        private layout: VisualLayout;
        private animator: IGenericAnimator;
        private legend: ILegend;

        private radius: number;
        private strokeWidth: number;
        private hostService: IVisualHostServices;

        private static DefaultRadius: number = 5;
        private static DefaultStrokeWidth: number = 1;
        private static FrequencyText: string = "Frequency";

        private durationAnimations: number = 200;
        private MinOpacity: number = 0.3;
        private MaxOpacity: number = 1;

        private static round10(value: number, digits: number = 2) {
            var scale = Math.pow(10, digits);
            return (Math.round(scale * value) / scale);
        }

        private static getTooltipData(value: number): TooltipDataItem[] {
            return [{
                displayName: DotPlot.FrequencyText,
                value: value.toString()
            }];
        }

        public static converter(dataView: DataView, maxDots: number, colors: IDataColorPalette, host: IVisualHostServices): DotPlotData {

            var dataPoints: DotPlotDataPoint[] = [];
            var legendData: LegendData = {
                dataPoints: [],
            };

            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.values ||
                dataView.categorical.values.length < 1 ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0]) {
                return {
                    dataPoints: dataPoints,
                    legendData: legendData,
                };
            }

            var catDv: DataViewCategorical = dataView.categorical;
            var series: DataViewValueColumns = catDv.values;
            var categoryColumn = catDv.categories[0];
            var category: any[] = catDv.categories[0].values;

            if (!series[0].source.type.integer) {
                var visualMessage: IVisualErrorMessage = {
                    message: 'This visual expects integer Values. Try adding a text field to create a "Count of" value.',
                    title: 'Integer Value Expected',
                    detail: '',
                };
                var warning: IVisualWarning = {
                    code: 'UnexpectedValueType',
                    getMessages: () => visualMessage,
                };
                host.setWarnings([warning]);
                return {
                    dataPoints: dataPoints,
                    legendData: legendData,
                };
            }

            for (var i = 0, iLen = series.length; i < iLen; i++) {
                var counts = {};
                var values = series[i].values;
                for (var j = 0, jLen = values.length; j < jLen; j++) {
                    var idx = category[j];
                    var value = values[j];
                    if (!counts[idx]) counts[idx] = 0;
                    counts[idx] += value;
                }

                var legendText = series[i].source.displayName;
                var color = colors.getColorByIndex(i).value;

                var data = d3.entries(counts);
                var min = d3.min(data, d => d.value);
                var max = d3.max(data, d => d.value);

                var dotsScale: D3.Scale.LinearScale = d3.scale.linear().domain([min, max]);

                if (max > maxDots) {
                    dotsScale.rangeRound([0, maxDots]);
                    var scale = DotPlot.round10(max / maxDots);
                    legendText += ` (1 dot = x${scale})`;
                } else {
                    dotsScale.rangeRound([min, max]);
                }

                for (var k = 0, kLen = data.length; k < kLen; k++) {
                    var y = dotsScale(data[k].value);

                    var categorySelectionId = SelectionIdBuilder.builder()
                        .withCategory(categoryColumn, k)
                        .createSelectionId();

                    for (var level = 0; level < y; level++) {
                        dataPoints.push({
                            x: data[k].key,
                            y: level,
                            color: color,
                            identity: categorySelectionId,
                            tooltipInfo: DotPlot.getTooltipData(data[k].value)
                        });
                    }
                }

                legendData.dataPoints.push({
                    label: legendText,
                    color: color,
                    icon: LegendIcon.Box,
                    selected: false,
                    identity: null
                });
            }

            return {
                dataPoints: dataPoints,
                legendData: legendData
            };
        }

        public constructor(options?: DotPlotConstructorOptions) {
            if (options) {
                if (options.svg) {
                    this.svg = options.svg;
                }
                if (options.animator) {
                    this.animator = options.animator;
                }

                this.layout = new VisualLayout(null, options.margin || DotPlot.DefaultMargin);
                this.radius = options.radius || DotPlot.DefaultRadius;
                this.strokeWidth = options.strokeWidth || DotPlot.DefaultStrokeWidth;
            }
        }

        public init(options: VisualInitOptions): void {
            var element = options.element;
            this.selectionManager = new SelectionManager({ hostServices: options.host });
            this.hostService = options.host;

            if (!this.svg) {
                this.svg = d3.select(element.get(0)).append('svg');
            }
            if (!this.layout) {
                this.layout = new VisualLayout(null, DotPlot.DefaultMargin);
            }
            if (!this.radius) {
                this.radius = DotPlot.DefaultRadius;
            }
            if (!this.strokeWidth) {
                this.strokeWidth = DotPlot.DefaultStrokeWidth;
            }

            this.svg.classed(DotPlot.VisualClassName, true);
            this.colors = options.style.colorPalette.dataColors;
            this.legend = createLegend(element, false, null);

            this.dotPlot = this.svg
                .append('g')
                .classed(DotPlot.DotPlot.class, true);

            this.axis = this.svg
                .append('g')
                .classed(DotPlot.Axis.class, true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options.dataViews || !options.dataViews[0]) return;

            this.durationAnimations = getAnimationDuration(this.animator, options.suppressAnimations);

            var dataView = this.dataView = options.dataViews[0];
            this.layout.viewport = options.viewport;
            this.svg.style({
                "height": this.layout.viewportIn.height,
                "width": this.layout.viewportIn.width,
                "left": this.layout.margin.left,
                "right": this.layout.margin.right,
                "position": "relative"
            });

            if (this.layout.viewportInIsZero) {
                return;
            }

            var diameter: number = 2 * this.radius + 1;// "1" is to look better, because stroke width is not included in radius.
            var dotsTotalHeight: number = this.layout.viewportIn.height - this.radius - DotPlot.MaxXAxisHeight;
            var maxDots: number = Math.floor(dotsTotalHeight / diameter);

            var data = DotPlot.converter(dataView, maxDots, this.colors, this.hostService);
            var dataPoints = data.dataPoints;

            var values = dataView.categorical
                && dataView.categorical.categories
                && dataView.categorical.categories.length > 0
                ? dataView.categorical.categories[0].values
                : [];
            var xValues = d3.set(values).values();

            var xScale: D3.Scale.OrdinalScale = d3.scale.ordinal()
                .domain(xValues)
                .rangeBands([DotPlot.XAxisHorizontalMargin, this.layout.viewportIn.width - DotPlot.XAxisHorizontalMargin]);

            var yScale: D3.Scale.LinearScale = d3.scale.linear()
                .domain([0, maxDots])
                .range([dotsTotalHeight, dotsTotalHeight - maxDots * diameter]);

            // temporary disabled as this raises the following error on PBI Portal
            // Uncaught TypeError: Cannot read property 'registerDirectivesForEndPoint' of undefined
            //if(data.legendData.dataPoints.length > 0) {
            //    this.legend.drawLegend(data.legendData, viewport);
            //}
            this.drawAxis(xValues, xScale, this.layout.viewportIn.height - DotPlot.MaxXAxisHeight);
            this.drawDotPlot(dataPoints, xScale, yScale);
        }

        private drawDotPlot(data: DotPlotDataPoint[], xScale: D3.Scale.OrdinalScale, yScale: D3.Scale.LinearScale): void {
            var selection = this.dotPlot.selectAll(DotPlot.Dot.selector).data(data);
            selection
                .enter()
                .append('circle')
                .classed(DotPlot.Dot.class, true);
            selection
                .attr("cx", (point: DotPlotDataPoint) => xScale(point.x) + xScale.rangeBand() / 2)
                .attr("cy", (point: DotPlotDataPoint) => yScale(point.y))
                .attr("fill", d => d.color)
                .attr("stroke", "black")
                .attr("stroke-width", this.strokeWidth)
                .attr("r", this.radius);

            this.renderTooltip(selection);

            this.setSelectHandler(selection);

            selection.exit().remove();
        }

        private setSelectHandler(dotSelection: D3.UpdateSelection): void {
            this.setSelection(dotSelection);

            dotSelection.on("click", (data: DotPlotDataPoint) => {
                this.selectionManager
                    .select(data.identity, d3.event.ctrlKey)
                    .then((selectionIds: SelectionId[]) => this.setSelection(dotSelection, selectionIds));

                d3.event.stopPropagation();
            });

            this.svg.on("click", () => {
                this.selectionManager.clear();
                this.setSelection(dotSelection);
            });
        }

        private setSelection(selection: D3.UpdateSelection, selectionIds?: SelectionId[]): void {
            selection.transition()
                .duration(this.durationAnimations)
                .style("fill-opacity", this.MaxOpacity);

            if (!selectionIds || !selectionIds.length) {
                return;
            }

            selection
                .filter((dotSelectionData: DotPlotDataPoint) =>
                    !selectionIds.some((selectionId: SelectionId) => dotSelectionData.identity === selectionId))
                .transition()
                .duration(this.durationAnimations)
                .style("fill-opacity", this.MinOpacity);
        }

        private renderTooltip(selection: D3.UpdateSelection): void {
            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) =>
                (<DotPlotDataPoint>tooltipEvent.data).tooltipInfo);
        }

        private drawAxis(values: any[], xScale: D3.Scale.OrdinalScale, translateY: number) {
            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickValues(values);

            this.axis.attr("class", "x axis")
                .attr('transform', SVGUtil.translate(0, translateY));
            this.axis.call(xAxis);

            this.relaxTicks(values);
        }

        private itemsWidth: number = 0;
        private itemsLength: number = 0;

        private relaxTicks(values: any[]) {
            var xAxisWidth = this.axis.node().getBoundingClientRect().width;
            if (values.length !== this.itemsLength) {
                var self = this;
                this.itemsWidth = 0;
                this.itemsLength = values.length;
                this.axis.selectAll("text").each(function(d, i) {
                    self.itemsWidth += d3.select(this).node().getBoundingClientRect().width + 15;
                });
            }
            this.toggleRotateTicks( xAxisWidth < this.itemsWidth ? true : false );
            this.toggleHideTicks( xAxisWidth < values.length * 15 ? true : false );
        }
        private toggleRotateTicks(state) {
            if (state) {
                this.axis.selectAll("text")
                    .attr("dx", ".8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(65)")
                    .style("text-anchor", "start")
                    .text(function(d) { return (d.length > 5 ? d.substring(0, 5) + '...' : d); });
            } else {
                this.axis.selectAll("text")
                    .attr("dx", "0em")
                    .attr("transform", "rotate(0)")
                    .style("text-anchor", "middle");
            }
        }
        private toggleHideTicks(state) {
            if (state) {
                this.axis.selectAll("text").each(function(d, i) {
                    if (i % 2) {
                        d3.select(this).attr('fill', 'transparent');
                    }
                });
                return;
            }
            this.axis.selectAll("text").attr('fill', null);
        }
    }
}
