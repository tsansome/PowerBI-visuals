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
    import PixelConverter = jsCommon.PixelConverter;
    import SlicerOrientation = slicerOrientation.Orientation;

    export interface CheckboxStyle {
        transform: string;
        'transform-origin': string;
        'font-size': string;
    }

    export class VerticalSlicerRenderer implements ISlicerRenderer, SlicerDefaultValueHandler {
        private element: JQuery;
        private currentViewport: IViewport;
        private dataView: DataView;
        private header: D3.Selection;
        private body: D3.Selection;
        private container: D3.Selection;
        private listView: IListView;
        private data: SlicerData;
        private settings: SlicerSettings;
        private behavior: IInteractiveBehavior;
        private hostServices: IVisualHostServices;
        private renderAsImage: (url: string) => boolean;
        private textProperties: TextProperties = {
            'fontFamily': 'wf_segoe-ui_normal, helvetica, arial, sans-serif',
            'fontSize': '14px',
        };
        private domHelper: SlicerUtil.DOMHelper;

        constructor(options?: SlicerConstructorOptions) {
            if (options) {
                this.behavior = options.behavior;
            }
            this.renderAsImage = $.noop;
            this.domHelper = options.domHelper;
        }

        // SlicerDefaultValueHandler
        public getDefaultValue(): data.SQConstantExpr {
            return SlicerUtil.DefaultValueHandler.getDefaultValue(this.dataView);
        }

        public getIdentityFields(): data.SQExpr[] {
            return SlicerUtil.DefaultValueHandler.getIdentityFields(this.dataView);
        }

        public init(slicerInitOptions: SlicerInitOptions): IInteractivityService {
            this.element = slicerInitOptions.visualInitOptions.element;
            this.currentViewport = slicerInitOptions.visualInitOptions.viewport;
            let hostServices = this.hostServices = slicerInitOptions.visualInitOptions.host;

            let settings = this.settings = Slicer.DefaultStyleProperties();
            let domHelper = this.domHelper;
            let bodyViewport = domHelper.getSlicerBodyViewport(this.currentViewport, settings, this.textProperties);
            let interactivityService: IInteractivityService;

            if (this.behavior)
                interactivityService = createInteractivityService(hostServices);

            let containerDiv = document.createElement('div');
            containerDiv.className = Selectors.Container.class;
            let container = this.container = d3.select(containerDiv);

            let header = domHelper.createSlicerHeader(hostServices);
            containerDiv.appendChild(header);
            this.header = d3.select(header);

            this.body = container.append('div').classed(SlicerUtil.Selectors.Body.class, true)
                .style({
                    'height': PixelConverter.toString(bodyViewport.height),
                    'width': PixelConverter.toString(bodyViewport.width),
                });

            let rowEnter = (rowSelection: D3.Selection) => {
                this.onEnterSelection(rowSelection);
            };

            let rowUpdate = (rowSelection: D3.Selection) => {
                this.onUpdateSelection(rowSelection, interactivityService);
            };

            let rowExit = (rowSelection: D3.Selection) => {
                rowSelection.remove();
            };

            let listViewOptions: ListViewOptions = {
                rowHeight: domHelper.getRowHeight(settings, this.textProperties),
                enter: rowEnter,
                exit: rowExit,
                update: rowUpdate,
                loadMoreData: () => slicerInitOptions.loadMoreData(),
                scrollEnabled: true,
                viewport: domHelper.getSlicerBodyViewport(this.currentViewport, settings, this.textProperties),
                baseContainer: this.body,
            };

            this.listView = ListViewFactory.createListView(listViewOptions);

            // Append container to DOM
            this.element.get(0).appendChild(containerDiv);

            return interactivityService;
        }

        public render(options: SlicerRenderOptions): void {
            let data = this.data = options.data;
            this.currentViewport = options.viewport;
            let dataView = options.dataView;

            if (!(dataView && data))
                return;

            this.dataView = dataView;
            this.renderAsImage = options.renderAsImage;
            let settings = this.settings = data.slicerSettings;
            let domHelper = this.domHelper;

            domHelper.updateSlicerBodyDimensions(this.currentViewport, this.body, settings);
            this.updateSelectionStyle();
            this.listView
                .viewport(domHelper.getSlicerBodyViewport(this.currentViewport, settings, this.textProperties))
                .rowHeight(domHelper.getRowHeight(settings, this.textProperties))
                .data(
                    data.slicerDataPoints,
                    (d: SlicerDataPoint) => $.inArray(d, data.slicerDataPoints),
                    options.resetScrollbarPosition
                    );
        }

        private updateSelectionStyle(): void {
            let settings = this.settings;
            this.container.classed('isMultiSelectEnabled', settings && settings.selection && !settings.selection.singleSelect);
        }

        private onEnterSelection(rowSelection: D3.Selection): void {
            let settings = this.settings;
            let listItemElement = rowSelection.append('li')
                .classed(Selectors.ItemContainer.class, true);

            let labelElement = listItemElement.append('div')
                .classed(Selectors.Input.class, true);

            labelElement.append('input')
                .attr('type', 'checkbox');

            labelElement.append('span')
                .classed(Selectors.Checkbox.class, true)
                .style(Styles.buildCheckboxStyle(settings));

            listItemElement.append('span')
                .classed(SlicerUtil.Selectors.LabelText.class, true)
                .style('font-size', PixelConverter.fromPoint(settings.slicerText.textSize));
        }

        private onUpdateSelection(rowSelection: D3.Selection, interactivityService: IInteractivityService): void {
            let settings = this.settings;
            let data = this.data;
            if (data && settings) {
                // Style Slicer Header
                let domHelper = this.domHelper;
                domHelper.styleSlicerHeader(this.header, settings, data.categorySourceName);

                let labelText = rowSelection.selectAll(SlicerUtil.Selectors.LabelText.selector);
                labelText.html((d: SlicerDataPoint) => {
                    if (!this.renderAsImage(d.value))
                        return d.value;
                    else
                        return `<img src="${d.value}" />`;
                });
                domHelper.setSlicerTextStyle(labelText, settings);

                let slicerCheckbox = rowSelection.selectAll(Selectors.Input.selector).selectAll('span');
                slicerCheckbox.style(Styles.buildCheckboxStyle(settings));

                if (interactivityService && this.body) {
                    let body = this.body.attr('width', this.currentViewport.width);
                    let slicerItemContainers = body.selectAll(Selectors.ItemContainer.selector);
                    let slicerItemLabels = body.selectAll(SlicerUtil.Selectors.LabelText.selector);
                    let slicerItemInputs = body.selectAll(Selectors.Input.selector);
                    let slicerClear = this.header.select(SlicerUtil.Selectors.Clear.selector);

                    let behaviorOptions: VerticalSlicerBehaviorOptions = {
                        dataPoints: data.slicerDataPoints,
                        slicerContainer: this.container,
                        itemContainers: slicerItemContainers,
                        itemLabels: slicerItemLabels,
                        itemInputs: slicerItemInputs,
                        clear: slicerClear,
                        interactivityService: interactivityService,
                        settings: data.slicerSettings,
                    };

                    let orientationBehaviorOptions: SlicerOrientationBehaviorOptions = {
                        behaviorOptions: behaviorOptions,
                        orientation: SlicerOrientation.Vertical,
                    };

                    interactivityService.bind(
                        data.slicerDataPoints,
                        this.behavior,
                        orientationBehaviorOptions,
                        { overrideSelectionFromData: true, hasSelectionOverride: data.hasSelectionOverride, slicerDefaultValueHandler: this });
                    SlicerWebBehavior.styleSlicerItems(rowSelection.select(Selectors.Input.selector), data.hasSelectionOverride, interactivityService.isSelectionModeInverted());
                }
                else {
                    SlicerWebBehavior.styleSlicerItems(rowSelection.select(Selectors.Input.selector), false, false);
                }
            }
        }
    }

    module Selectors {
        import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

        export const Container = createClassAndSelector('slicerContainer');
        export const ItemContainer = createClassAndSelector('slicerItemContainer');
        export const Input = createClassAndSelector('slicerCheckbox');
        export const Checkbox = createClassAndSelector('checkbox');
    }

    module CheckboxSprite {
        export const MinimumSize = 8;
        export const Size = 13;
        export const SizeRange = Size - MinimumSize;
    }

    /** Helper class for managing slicer styles. */
    module Styles {
        export function buildCheckboxStyle(settings: SlicerSettings): CheckboxStyle {
            let checkboxScale = getCheckboxScale(settings);
            let checkboxTransformOrigin = SVGUtil.transformOrigin('left', 'center');
            return {
                'transform': checkboxScale,
                'transform-origin': checkboxTransformOrigin,
                'font-size': PixelConverter.fromPoint(settings.slicerText.textSize),
            };
        }

        function getCheckboxScale(settings: SlicerSettings): string {
            let scale = jsCommon.TextSizeDefaults.getScale(settings.slicerText.textSize);
            let size = (CheckboxSprite.MinimumSize + (CheckboxSprite.SizeRange * scale));
            let relativeZoom = size / CheckboxSprite.Size;

            let rounded = powerbi.Double.toIncrement(relativeZoom, 0.05);

            return SVGUtil.scale(rounded);
        }

    }
}
