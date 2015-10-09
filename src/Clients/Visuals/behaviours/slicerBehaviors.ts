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
    export interface SlicerBehaviorOptions {
        slicerItemContainers: D3.Selection;
        slicerItemLabels: D3.Selection;
        slicerItemInputs: D3.Selection;
        slicerClear: D3.Selection;
        dataPoints: SlicerDataPoint[];
        interactivityService: IInteractivityService;
        slicerSettings: SlicerSettings;
    }

    export class SlicerWebBehavior implements IInteractiveBehavior {
        private slicerItemLabels: D3.Selection;
        private slicerItemInputs: D3.Selection;
        private dataPoints: SlicerDataPoint[];
        private interactivityService: IInteractivityService;
        private slicerSettings: SlicerSettings;

        public bindEvents(options: SlicerBehaviorOptions, selectionHandler: ISelectionHandler): void {
            let filterPropertyId = slicerProps.filterPropertyIdentifier;
            let slicers = options.slicerItemContainers;
            let slicerClear = options.slicerClear;

            this.slicerItemLabels = options.slicerItemLabels;
            this.slicerItemInputs = options.slicerItemInputs;
            this.dataPoints = options.dataPoints;
            this.interactivityService = options.interactivityService;
            this.slicerSettings = options.slicerSettings;

            slicers.on("mouseover", (d: SlicerDataPoint) => {
                d.mouseOver = true;
                d.mouseOut = false;
                this.renderMouseover();
            });

            slicers.on("mouseout", (d: SlicerDataPoint) => {
                d.mouseOver = false;
                d.mouseOut = true;
                this.renderMouseover();
            });

            slicers.on("click", (d: SlicerDataPoint) => {
                d3.event.preventDefault();
                if (d.isSelectAllDataPoint) {
                    selectionHandler.toggleSelectionModeInversion();
                }
                else {
                    selectionHandler.handleSelection(d, true /* isMultiSelect */);
                }
                selectionHandler.persistSelectionFilter(filterPropertyId);
            });

            slicerClear.on("click", (d: SelectableDataPoint) => {
                selectionHandler.handleClearSelection();
                selectionHandler.persistSelectionFilter(filterPropertyId);
            });
        }

        public renderSelection(hasSelection: boolean): void {
            if (!hasSelection && !this.interactivityService.isSelectionModeInverted()) {
                this.slicerItemInputs.selectAll('.partiallySelected').classed('partiallySelected', false);
                this.slicerItemInputs.selectAll('input').property('checked', false);
                this.slicerItemLabels.style('color', this.slicerSettings.slicerText.color);
            }
            else {
                SlicerWebBehavior.styleSlicerInputs(this.slicerItemInputs, hasSelection);
                this.slicerItemLabels.style({
                    'color': (d: SlicerDataPoint) => {
                        if (d.selected)
                            return this.slicerSettings.slicerText.selectionColor;
                        else
                            return this.slicerSettings.slicerText.color;
                }
            });
        }
        }

        private renderMouseover(): void {
            this.slicerItemLabels.style({
                'color': (d: SlicerDataPoint) => {
                    if (d.mouseOver)
                        return this.slicerSettings.slicerText.hoverColor;

                    if (d.mouseOut) {
                        if (d.selected)
                            return this.slicerSettings.slicerText.selectionColor;
                        else
                            return this.slicerSettings.slicerText.color;
                    }
                }
            });
        }

        public static styleSlicerInputs(slicerItemInputs: D3.Selection, hasSelection: boolean) {
            slicerItemInputs.selectAll('input').each(function (d: SlicerDataPoint) {
                if (d.isSelectAllDataPoint) {
                    d3.select(this).classed('partiallySelected', hasSelection);
                    d3.select(this).property({ 'checked': d.selected });
                }
                else {
                    d3.select(this).property({ 'checked': d.selected });
                }
            });
        }
    }
}  