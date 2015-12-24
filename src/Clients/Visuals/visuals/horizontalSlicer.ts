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

    const ItemWidthSampleSize = 50;
    const MinTextWidth = 80;
    const LoadMoreDataThreshold = 0.8; // The value indicates the percentage of data already shown that triggers a loadMoreData call.
    const DefaultStyleProperties = {
        itemsContainer: {
            marginLeft: 19,// width of left navigation button + right margin of left navigation button.
            marginRight: 19, // width of right navigation button + left margin of right navigation button.
        },
        labelText: {
            marginRight: 2,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
        },
        navigationButtons: {
            leftButtonRightMargin: 5,
            rightButtonLeftMargin: 5,
            width: 14,
        },
    };

    export class HorizontalSlicerRenderer implements ISlicerRenderer, SlicerDefaultValueHandler {
        private element: JQuery;
        private currentViewport: IViewport;
        private data: SlicerData;
        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;
        private hostServices: IVisualHostServices;
        private dataView: DataView;
        private container: D3.Selection;
        private header: D3.Selection;
        private body: D3.Selection;
        private bodyViewport: IViewport;
        private itemsContainer: D3.Selection;
        private rightNavigationArrow: D3.Selection;
        private leftNavigationArrow: D3.Selection;
        private dataStartIndex: number = 0;
        private itemsToDisplay: number;
        private textProperties: TextProperties = {
            fontFamily: 'wf_segoe-ui_normal',
            fontSize: '14px'
        };
        private leftScrollRequested: boolean;
        private maxItemWidth: number;
        private loadMoreData: () => void;
        private domHelper: SlicerUtil.DOMHelper;

        constructor(options?: SlicerConstructorOptions) {
            if (options) {
                this.behavior = options.behavior;
            }
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

            if (this.behavior) {
                this.interactivityService = createInteractivityService(hostServices);
            }
            this.loadMoreData = () => slicerInitOptions.loadMoreData();

            let containerDiv = document.createElement('div');
            containerDiv.className = Selectors.container.class;
            let container: D3.Selection = this.container = d3.select(containerDiv);

            let header = this.domHelper.createSlicerHeader(this.hostServices);
            containerDiv.appendChild(header);
            this.header = d3.select(header);

            let body = this.body = container.append('div').classed(SlicerUtil.Selectors.Body.class + " " + Selectors.FlexDisplay.class, true);

            this.leftNavigationArrow = body.append("button")
                .classed(Selectors.NavigationArrow.class + " " + Selectors.LeftNavigationArrow.class, true)
                .style("margin-right", PixelConverter.toString(DefaultStyleProperties.navigationButtons.leftButtonRightMargin));

            this.itemsContainer = body.append("div")
                .classed(Selectors.ItemsContainer.class + " " + Selectors.FlexDisplay.class, true);

            this.rightNavigationArrow = body.append("button")
                .classed(Selectors.NavigationArrow.class + " " + Selectors.RightNavigationArrow.class, true)
                .style("margin-left", PixelConverter.toString(DefaultStyleProperties.navigationButtons.rightButtonLeftMargin));

            // Append container to DOM
            this.element.get(0).appendChild(containerDiv);

            this.bindNavigationEvents();

            return this.interactivityService;
        }

        public render(options: SlicerRenderOptions): void {
            let data = options.data;
            this.currentViewport = options.viewport;
            let dataView = options.dataView;

            if (!(dataView && data))
                return;

            this.data = data;
            this.dataView = dataView;
            this.leftScrollRequested = false;
            this.calculateAndSetMaxItemWidth();
            this.renderCore();
        }

        private renderCore(): void {
            let data = this.data;
            if (!data || !data.slicerDataPoints)
                return;

            let itemsToDisplay = this.itemsToDisplay = this.calculateVisibleItemCount();
            if (itemsToDisplay === 0)
                return;

            let materializedDataPoints = data.slicerDataPoints.slice(this.dataStartIndex, this.dataStartIndex + itemsToDisplay);

            // Manipulate DOM
            let defaultSettings = data.slicerSettings;
            this.updateStyle(data, itemsToDisplay);
            this.renderItems(data, materializedDataPoints, itemsToDisplay, defaultSettings);

            // Bind Interactivity Service
            this.bindInteractivityService(data);

            // Load More Data
            if (this.dataStartIndex + itemsToDisplay >= data.slicerDataPoints.length * LoadMoreDataThreshold) {
                this.loadMoreData();
            }
        }

        private updateStyle(data: SlicerData, itemsToDisplay: number): void {
            let viewport = this.currentViewport;
            let defaultSettings: SlicerSettings = data.slicerSettings;
            let domHelper = this.domHelper;

            this.container
                .classed(Selectors.MultiSelectEnabled.class, !data.slicerSettings.selection.singleSelect)
                .style({
                    "width": PixelConverter.toString(viewport.width),
                    "height": PixelConverter.toString(viewport.height),
                });

            // Style Slicer Header
            domHelper.styleSlicerHeader(this.header, defaultSettings, data.categorySourceName);
            let headerTextProperties = domHelper.getHeaderTextProperties(defaultSettings);

            // Update body width and height
            let bodyViewport = this.bodyViewport = domHelper.getSlicerBodyViewport(viewport, defaultSettings, headerTextProperties);
            this.body.style({
                "height": PixelConverter.toString(bodyViewport.height),
                "width": PixelConverter.toString(bodyViewport.width),
            });

            // Update Navigation Arrows
            this.rightNavigationArrow.classed("show", this.dataStartIndex + itemsToDisplay <= this.data.slicerDataPoints.length - 1);
            this.leftNavigationArrow.classed("show", this.dataStartIndex > 0);
        }

        private renderItems(data: SlicerData, virtualizedDataPoints: SlicerDataPoint[], itemsToDisplay: number, defaultSettings: SlicerSettings): void {
            debug.assert(itemsToDisplay > 0, 'items to display should be greater than zero');

            let settings = DefaultStyleProperties;
            let viewport = this.currentViewport;
            let bodyViewport = this.bodyViewport;

            let itemsContainerWidth = viewport.width - (settings.itemsContainer.marginLeft + settings.itemsContainer.marginRight);
            this.itemsContainer
                .style({
                    "width": PixelConverter.toString(itemsContainerWidth),
                    "height": PixelConverter.toString(bodyViewport.height),
                });

            let items = this.itemsContainer
                .selectAll(SlicerUtil.Selectors.LabelText.selector)
                .data(virtualizedDataPoints, (d: SlicerDataPoint) => _.indexOf(data.slicerDataPoints, d));

            items
                .enter()
                .append("div")
                .classed(SlicerUtil.Selectors.LabelText.class, true);

            items.order();

            items
                .attr("title", (d: SlicerDataPoint) => d.tooltip)
                .text((d: SlicerDataPoint) => d.value);

            let itemHeight = bodyViewport.height - (settings.labelText.paddingBottom + settings.labelText.paddingTop);

            // Divide left over space equally among all the items
            let itemPadding = settings.labelText.paddingLeft + settings.labelText.paddingRight;
            let spaceAvailableForItems = itemsContainerWidth - ((itemsToDisplay * itemPadding) + (itemsToDisplay - 1) * settings.labelText.marginRight);
            let itemWidth = spaceAvailableForItems / itemsToDisplay;

            items
                .style({
                    "padding-left": PixelConverter.toString(settings.labelText.paddingLeft),
                    "padding-right": PixelConverter.toString(settings.labelText.paddingRight),
                    "padding-top": PixelConverter.toString(settings.labelText.paddingTop),
                    "padding-bottom": PixelConverter.toString(settings.labelText.paddingBottom),
                    "font-family": this.textProperties.fontFamily,
                    "margin-right": (d: SlicerDataPoint, i) => this.isLastRowItem(i, itemsToDisplay) ? "0px" : PixelConverter.toString(settings.labelText.marginRight),
                    "width": PixelConverter.toString(itemWidth),
                    "height": PixelConverter.toString(itemHeight),
                });

            // Default style settings from formatting pane settings
            this.domHelper.setSlicerTextStyle(items, defaultSettings);

            // Wrap long text into multiple columns based on height availbale
            let labels = this.element.find(SlicerUtil.Selectors.LabelText.selector);
            labels.each((i, element) => {
                TextMeasurementService.wordBreakOverflowingText(element, itemWidth, itemHeight);
            });

            items.exit().remove();
        }

        private bindInteractivityService(data: SlicerData): void {
            if (this.interactivityService && this.body) {
                let body = this.body;
                let itemsContainer = body.selectAll(Selectors.ItemsContainer.selector);
                let itemLabels = body.selectAll(SlicerUtil.Selectors.LabelText.selector);
                let clear = this.header.select(SlicerUtil.Selectors.Clear.selector);

                let behaviorOptions: HorizontalSlicerBehaviorOptions = {
                    dataPoints: data.slicerDataPoints,
                    slicerContainer: this.container,
                    itemsContainer: itemsContainer,
                    itemLabels: itemLabels,
                    clear: clear,
                    interactivityService: this.interactivityService,
                    settings: data.slicerSettings,
                };

                let orientationBehaviorOptions: SlicerOrientationBehaviorOptions = {
                    behaviorOptions: behaviorOptions,
                    orientation: SlicerOrientation.Horizontal,
                };

                this.interactivityService.bind(data.slicerDataPoints, this.behavior, orientationBehaviorOptions, { overrideSelectionFromData: true, hasSelectionOverride: data.hasSelectionOverride });
                SlicerWebBehavior.styleSlicerItems(this.itemsContainer.selectAll(SlicerUtil.Selectors.LabelText.selector), this.interactivityService.hasSelection(), this.interactivityService.isSelectionModeInverted());
            }
            else {
                SlicerWebBehavior.styleSlicerItems(this.itemsContainer.selectAll(SlicerUtil.Selectors.LabelText.selector), false, false);
            }
        }

        private calculateVisibleItemCount(): number {
            let dataPointsLength: number = this.getDataPointsCount();
            if (dataPointsLength === 0)
                return 0;

            let totalWidthOccupiedThusFar = 0;
            let navigationButtonsSettings = DefaultStyleProperties.navigationButtons;

            // Normalize the start Index
            this.normalizePosition(this.data.slicerDataPoints);

            // Calculate Max Text Length
            totalWidthOccupiedThusFar += navigationButtonsSettings.leftButtonRightMargin + navigationButtonsSettings.rightButtonLeftMargin + navigationButtonsSettings.width * 2;

            let numberOfItems = 1;
            if (this.leftScrollRequested) {
                // When left navigation arrow is clicked 
                numberOfItems = this.calculateNumberOfItemsOnLeftNavigation(totalWidthOccupiedThusFar);
            }
            else {
                // When right navigation arrow is clicked or viewport resized
                numberOfItems = this.calculateNumberOfItemsOnRightNavigation(totalWidthOccupiedThusFar);
            }

            return numberOfItems;
        }

        private calculateNumberOfItemsOnLeftNavigation(totalWidthOccupiedThusFar: number): number {
            let firstItemIndex = 0;
            let startIndex = this.dataStartIndex;
            let totalAvailableWidth = this.currentViewport.width - totalWidthOccupiedThusFar;

            let numberOfItems = this.getNumberOfItemsToDisplay(totalAvailableWidth);

            if (startIndex - numberOfItems < firstItemIndex) {
                startIndex = firstItemIndex;
            }
            else {
                startIndex = startIndex - numberOfItems + 1;
            }
            this.dataStartIndex = startIndex;

            return numberOfItems;
        }

        private calculateNumberOfItemsOnRightNavigation(totalWidthOccupiedThusFar: number): number {
            let startIndex = this.dataStartIndex;
            let dataPoints = this.data.slicerDataPoints;
            let lastItemIndex = dataPoints.length - 1;

            let totalAvailableWidth = this.currentViewport.width - totalWidthOccupiedThusFar;
            let numberOfItems = this.getNumberOfItemsToDisplay(totalAvailableWidth);

            if (startIndex + numberOfItems > lastItemIndex) {
                startIndex = lastItemIndex - numberOfItems + 1;
            }
            this.dataStartIndex = startIndex;

            return numberOfItems;
        }

        private calculateTotalItemWidth(): number {
            return this.maxItemWidth + DefaultStyleProperties.labelText.paddingLeft + DefaultStyleProperties.labelText.paddingRight + DefaultStyleProperties.labelText.marginRight;
        }

        private normalizePosition(points: SlicerDataPoint[]): void {
            let dataStartIndex = this.dataStartIndex;
            // if dataStartIndex >= points.length
            this.dataStartIndex = Math.min(dataStartIndex, points.length - 1);

            // if dataStartIndex < 0 
            this.dataStartIndex = Math.max(dataStartIndex, 0);
        }

        private bindNavigationEvents(): void {
            this.registerMouseWheelScrollEvents();
            this.registerMouseClickEvents();
        }

        private registerMouseClickEvents(): void {
            let rightNavigationArrow = this.container.selectAll(Selectors.RightNavigationArrow.selector);
            let leftNavigationArrow = this.container.selectAll(Selectors.LeftNavigationArrow.selector);

            rightNavigationArrow
                .on("click", () => {
                    this.scrollRight();
                });

            leftNavigationArrow
                .on("click", () => {
                    this.scrollLeft();
                });
        }

        // Register for mouse wheel scroll events
        private registerMouseWheelScrollEvents(): void {
            let scrollableElement = this.body.node();

            scrollableElement.addEventListener("mousewheel", (e) => {
                this.onMouseWheel((<MouseWheelEvent>e).wheelDelta);
            });

            scrollableElement.addEventListener("DOMMouseScroll", (e) => {
                this.onMouseWheel((<MouseWheelEvent>e).detail);
            });
        }

        private onMouseWheel(wheelDelta: number): void {
            if (wheelDelta < 0) {
                this.scrollRight();
            }
            else if (wheelDelta > 0) {
                this.scrollLeft();
            }
        }

        /* If there is only one item being displayed, we show the next item when navigation arrows are clicked 
        * But when there are more than 1 item, n-1 items are shown say we have 10 items in total , in initial page if we show 1 to 5 items when right button is clicked we will show items from 5 to 10
        */
        private scrollRight(): void {
            let itemsToDisplay = this.itemsToDisplay;
            let startIndex = this.dataStartIndex;

            // If it is the last page stay on the same page and don't navigate
            if (itemsToDisplay + startIndex >= this.data.slicerDataPoints.length) {
                return;
            }

            if (itemsToDisplay === 1) {
                startIndex += itemsToDisplay;
            }
            else {
                startIndex += itemsToDisplay - 1;
            }

            this.dataStartIndex = startIndex;
            this.leftScrollRequested = false;
            this.renderCore();
        }

        /* If there is only one item being displayed, we show the next item when navigation arrows are clicked 
        * But when there are more than 1 item, n-1 items are shown
        */
        private scrollLeft(): void {
            let itemsToDisplay = this.itemsToDisplay;
            let startIndex = this.dataStartIndex;            
            // If it is the first page stay on the same page and don't navigate
            if (startIndex === 0) {
                return;
            }                  

            // If there is only item shown when left navigation button is clicked we want to navigate back to show previous item
            if (itemsToDisplay === 1) {
                startIndex -= itemsToDisplay;
            }
            this.dataStartIndex = startIndex;
            this.leftScrollRequested = true;
            this.renderCore();
        }

        private isLastRowItem(fieldIndex: number, columnsToDisplay: number): boolean {
            return fieldIndex === columnsToDisplay - 1;
        }

        private getScaledTextWidth(textSize: number): number {
            return (textSize / jsCommon.TextSizeDefaults.TextSizeMin) * MinTextWidth;
        }

        // Sampling a subset of total datapoints to calculate max item width
        private calculateAndSetMaxItemWidth(): void {
            let data = this.data;
            let dataPoints = data.slicerDataPoints;
            let dataPointsLength: number = this.getDataPointsCount();
            if (dataPointsLength === 0) {
                this.maxItemWidth = 0;
                return;
            }

            let sampleSize = Math.min(dataPointsLength, ItemWidthSampleSize);
            let maxItemWidth = 0;
            let properties = jQuery.extend(true, {}, this.textProperties);           
            // Update text properties from formatting pane values
            properties.fontSize = PixelConverter.fromPoint(data.slicerSettings.slicerText.textSize);
            let getMaxWordWidth = jsCommon.WordBreaker.getMaxWordWidth;

            for (let i = 0; i < sampleSize; i++) {
                let itemText = dataPoints[i].value;
                properties.text = itemText;
                maxItemWidth = Math.max(maxItemWidth, getMaxWordWidth(itemText, TextMeasurementService.measureSvgTextWidth, properties));
            }

            this.maxItemWidth = Math.min(maxItemWidth, this.getScaledTextWidth(data.slicerSettings.slicerText.textSize));
        }

        private getNumberOfItemsToDisplay(widthAvailable: number): number {
            let totalItemWidth = this.calculateTotalItemWidth();
            if (totalItemWidth === 0)
                return 0;

            let dataPointsLength = this.getDataPointsCount();
            let numberOfItems = Math.min(dataPointsLength, Math.round(widthAvailable / totalItemWidth));

            // Show atleast 1 item by default 
            return Math.max(numberOfItems, 1);

        }

        private getDataPointsCount(): number {
            return _.size(this.data.slicerDataPoints);
        }
    }

    module Selectors {
        import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

        export const container = createClassAndSelector('horizontalSlicerContainer');
        export const ItemsContainer = createClassAndSelector('slicerItemsContainer');
        export const NavigationArrow = createClassAndSelector('navigationArrow');
        export const LeftNavigationArrow = createClassAndSelector('left');
        export const RightNavigationArrow = createClassAndSelector('right');
        export const MultiSelectEnabled = createClassAndSelector('isMultiSelectEnabled');
        export const FlexDisplay = createClassAndSelector('flexDisplay');
    }
}