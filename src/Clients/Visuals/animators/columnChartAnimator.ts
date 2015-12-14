﻿/*
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
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;

    export interface ColumnChartAnimationOptions extends IAnimationOptions {
        viewModel: ColumnChartData;
        series: D3.UpdateSelection;
        layout: IColumnLayout;
        itemCS: ClassAndSelector;
        mainGraphicsContext: D3.Selection;
        viewPort: IViewport;
    }

    export interface ColumnChartAnimationResult extends IAnimationResult {
        shapes: D3.UpdateSelection;
    }

    export type IColumnChartAnimator = IAnimator<IAnimatorOptions, ColumnChartAnimationOptions, ColumnChartAnimationResult>;

    export class WebColumnChartAnimator extends BaseAnimator<IAnimatorOptions, ColumnChartAnimationOptions, ColumnChartAnimationResult> implements IColumnChartAnimator {
        private previousViewModel: ColumnChartData;

        constructor(options?: IAnimatorOptions) {
            super(options);
        }

        public animate(options: ColumnChartAnimationOptions): ColumnChartAnimationResult {
            let result: ColumnChartAnimationResult = {
                failed: true,
                shapes: null,
            };

            let viewModel = options.viewModel;
            let previousViewModel = this.previousViewModel;

            if (!previousViewModel) {
                // This is the initial drawing of the chart, which has no special animation for now.
            }
            else if (viewModel.hasHighlights && !previousViewModel.hasHighlights) {
                result = this.animateNormalToHighlighted(options);
            }
            else if (viewModel.hasHighlights && previousViewModel.hasHighlights) {
                result = this.animateHighlightedToHighlighted(options);
            }
            else if (!viewModel.hasHighlights && previousViewModel.hasHighlights) {
                result = this.animateHighlightedToNormal(options);
            }

            this.previousViewModel = viewModel;
            return result;
        }

        private animateNormalToHighlighted(options: ColumnChartAnimationOptions): ColumnChartAnimationResult {
            let data = options.viewModel;
            let itemCS = options.itemCS;
            let shapeSelection = options.series.selectAll(itemCS.selector);
            let shapes = shapeSelection.data((d: ColumnChartSeries) => d.data, (d: ColumnChartDataPoint) => d.key);
            let hasHighlights = data.hasHighlights;

            shapes
                .enter()
                .append('rect')
                .attr("class", (d: ColumnChartDataPoint) => itemCS.class.concat(d.highlight ? " highlight" : ""))
                .attr(options.layout.shapeLayoutWithoutHighlights); // Start out at the non-highlight layout

            shapes
                .style("fill", (d: ColumnChartDataPoint) => d.color)
                .style("fill-opacity", (d: ColumnChartDataPoint) => ColumnUtil.getFillOpacity(d.selected, d.highlight, false, hasHighlights))
                .transition()
                .duration(this.animationDuration)
                .attr(options.layout.shapeLayout);

            shapes
                .exit()
                .remove();

            return {
                failed: false,
                shapes: shapes,
            };
        }

        private animateHighlightedToHighlighted(options: ColumnChartAnimationOptions): ColumnChartAnimationResult {
            let shapes = this.animateDefaultShapes(options.viewModel, options.series, options.layout, options.itemCS);

            return {
                failed: false,
                shapes: shapes,
            };
        }

        private animateHighlightedToNormal(options: ColumnChartAnimationOptions): ColumnChartAnimationResult {
            let itemCS = options.itemCS;
            let shapeSelection = options.series.selectAll(itemCS.selector);
            let shapes = shapeSelection.data((d: ColumnChartSeries) => d.data, (d: ColumnChartDataPoint) => d.key);
            let hasSelection = options.interactivityService && options.interactivityService.hasSelection();

            shapes
                .enter()
                .append('rect')
                .attr("class", (d: ColumnChartDataPoint) => itemCS.class.concat(d.highlight ? " highlight" : ""));

            shapes
                .style("fill", (d: ColumnChartDataPoint) => d.color)
                .style("fill-opacity", (d: ColumnChartDataPoint) => ColumnUtil.getFillOpacity(d.selected, d.highlight, d.selected, !d.selected))
                .transition()
                .duration(this.animationDuration)
                .attr(options.layout.shapeLayout)
                .transition()
                .duration(0)
                .delay(this.animationDuration)
                .style("fill-opacity", (d: ColumnChartDataPoint) => ColumnUtil.getFillOpacity(d.selected, d.highlight, hasSelection, false));

            shapes
                .exit()
                .transition()
                .duration(this.animationDuration)
                .attr(hasSelection ? options.layout.zeroShapeLayout : options.layout.shapeLayoutWithoutHighlights)
                .remove();

            return {
                failed: false,
                shapes: shapes,
            };
        }

        private animateDefaultShapes(data: ColumnChartData, series: D3.UpdateSelection, layout: IColumnLayout, itemCS: ClassAndSelector): D3.UpdateSelection {
            let shapeSelection = series.selectAll(itemCS.selector);
            let shapes = shapeSelection.data((d: ColumnChartSeries) => d.data, (d: ColumnChartDataPoint) => d.key);

            shapes
                .enter()
                .append('rect')
                .attr("class", (d: ColumnChartDataPoint) => itemCS.class.concat(d.highlight ? " highlight" : ""));

            shapes
                .style("fill", (d: ColumnChartDataPoint) => d.color)
                .style("fill-opacity", (d: ColumnChartDataPoint) => ColumnUtil.getFillOpacity(d.selected, d.highlight, false, data.hasHighlights))
                .transition()
                .duration(this.animationDuration)
                .attr(layout.shapeLayout);

            shapes
                .exit()
                .remove();

            return shapes;
        }
    }
}