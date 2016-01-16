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
    export interface PlayInitOptions extends CartesianVisualInitOptions {
    }
    
    export interface PlayChartDataPoint {
        frameIndex?: number;
    };

    export interface PlayChartData<T extends PlayableChartData> {
        frameKeys: string[];
        allViewModels: T[];
        currentViewModel: T;
        currentFrameIndex: number;
        labelData: PlayAxisTickLabelData;
    }

    export interface PlayChartViewModel<TData extends PlayableChartData, TViewModel> {
        data: PlayChartData<TData>;
        viewModel: TViewModel;
        viewport: IViewport;
    }

    // TODO: consider a template for the datapoint type <T> instead of any[]
    // I tried this an it is quite hard to express correctly with TypeScript.
    export interface PlayableChartData {
        dataPoints: any[];
    }

    interface PlayObjectProperties {
        currentFrameIndex?: number;
    }

    export interface PlayAxisTickLabelInfo {
        label: string;
        labelWidth: number;
    }

    export interface PlayAxisTickLabelData {
        labelInfo: PlayAxisTickLabelInfo[];
        anyWordBreaks: boolean;
    }

    export interface PlayChartRenderResult<TData extends PlayableChartData, TViewModel> {
        allDataPoints: SelectableDataPoint[];
        viewModel: PlayChartViewModel<TData, TViewModel>;
    }

    export interface PlayChartRenderFrameDelegate<T> {
        (data: T): void;
    }

    export interface VisualDataConverterDelegate<T> {
        (dataView: DataView): T;
    }

    export interface ITraceLineRenderer {
        render(selectedPoints: SelectableDataPoint[], shouldAnimate: boolean): void;
        remove(): void;
    }

    export class PlayAxis<T extends PlayableChartData> {
        private element: JQuery;
        private svg: JQuery;

        private playData: PlayChartData<T>;
        private renderDelegate: PlayChartRenderFrameDelegate<T>;
        private isPlaying: boolean;
        private lastViewport: IViewport;

        // do not call converter() when we call persistProperties and a new update() happens
        // NOTE: calling persistProperties will still cause a render() call to come from cartesianChart
        // TODO: make persist properties only optionally trigger a new onDataChagned, as most charts don't want this (only slicer needs it)
        private ridiculousFlagForPersistProperties: boolean;

        private playControl: PlayControl;
        private callout: JQuery;

        private host: IVisualHostServices;
        private interactivityService: IInteractivityService;
        private isMobileChart: boolean;

        constructor(options: CartesianVisualConstructorOptions) {
            if (options) {
                this.interactivityService = options.interactivityService;
            }
        }

        public init(options: PlayInitOptions) {
            debug.assertValue(options, 'options');

            this.element = options.element;
            this.svg = options.svg ? $(options.svg.node()) : null;
            this.host = options.host;

            this.isMobileChart = options.interactivity && options.interactivity.isInteractiveLegend;

            if (this.interactivityService && !this.isMobileChart) {
                this.playControl = new PlayControl(this.element, (frameIndex: number) => this.moveToFrameAndRender(frameIndex));
                this.playControl.onPlay(() => this.play());
            }
        }

        public setData(dataView: DataView, visualConverter: VisualDataConverterDelegate<T>, onlyResized: boolean): PlayChartData<T> {
            if (dataView) {
                if (this.ridiculousFlagForPersistProperties && dataView.metadata) {
                    // BUG FIX: customer feedback has been strong that we should always default to show the last frame.
                    // This is essential for dashboard tiles to refresh properly.

                    //  Only copy frameIndex since it is the only property using persistProperties
                    //let objectProps = getObjectProperties(dataView.metadata);
                    //playData.currentFrameIndex = objectProps.currentFrameIndex;
                    
                    //  Turn off the flag that was set by our persistProperties call
                    this.ridiculousFlagForPersistProperties = false;
                    return this.playData;
                }
                else if (dataView.matrix || dataView.categorical) {
                    if (onlyResized)
                        return this.playData;

                    this.playData = PlayChart.converter<T>(dataView, visualConverter);
                }
                else {
                    this.playData = PlayChart.getDefaultPlayData<T>();
                }
            }
            else {
                this.playData = PlayChart.getDefaultPlayData<T>();
            }

            // Next render should be a full one.
            this.lastViewport = undefined;

            return this.playData;
        }

        public render<TViewModel>(suppressAnimations: boolean, viewModel: TViewModel, viewport: IViewport): PlayChartRenderResult<T, TViewModel> {
            let playData = this.playData;

            let resized = !this.lastViewport || (this.lastViewport.height !== viewport.height || this.lastViewport.width !== viewport.width);
            this.lastViewport = viewport;

            if (resized)
                this.stop();

            if (!playData)
                return;

            let playViewModel: PlayChartViewModel<T, TViewModel> = {
                data: this.playData,
                viewModel: viewModel,
                viewport: viewport,
            };

            let hasSelection = false;
            if (this.interactivityService) {
                let data = <PlayableChartData>playData.currentViewModel;
                this.interactivityService.applySelectionStateToData(data.dataPoints);
                hasSelection = this.interactivityService.hasSelection();
            }

            let frameKeys = playData.frameKeys;
            let currentFrameIndex = playData.currentFrameIndex;
            let height = viewport.height;
            let width = viewport.width;

            // callout / currentFrameIndex label - keep separate from other Play DOM creation as we need this even without interactivity.
            if (!this.callout) {
                this.callout = $('<span class="callout"></span>').appendTo(this.element);
            }

            // update callout position due to legend
            // TODO: Shouldn't all of this placement be done from the viewport?
            this.adjustForLegend();

            if (this.playControl && resized) {
                this.playControl.rebuild(playData, viewport);
            }

            // update callout to current frame index
            let calloutDimension = Math.min(height, width * 1.3); //1.3 to compensate for tall, narrow-width viewport
            let fontSize = Math.max(12, Math.round(calloutDimension / 7));
            fontSize = Math.min(fontSize, 70);
            if (currentFrameIndex < frameKeys.length && currentFrameIndex >= 0) {
                // clear these for auto-measurement
                this.callout.width('auto');
                this.callout.height('auto');

                this.callout
                    .text(frameKeys[currentFrameIndex])
                    .css('font-size', fontSize + 'px');

                let compStyle = getComputedStyle(this.callout[0]);
                let actualWidth = Math.ceil(parseFloat(compStyle.width));
                let actualHeight = Math.ceil(parseFloat(compStyle.height));
                this.callout.width(Math.min(actualWidth, viewport.width));
                this.callout.height(actualHeight);
            }
            else {
                this.callout.text('');
            }

            let allDataPoints = playData.allViewModels.map((vm) => vm.dataPoints);
            let flatAllDataPoints = _.flatten<SelectableDataPoint>(allDataPoints);
            
            // NOTE: Return data points to keep track of current selected bubble even if it drops out for a few frames
            return {
                allDataPoints: flatAllDataPoints,
                viewModel: playViewModel,
            };
        }

        public play(): void {
            let playData = this.playData;

            if (this.isPlaying) {
                this.stop();
            }
            else if (this.playControl) {
                this.isPlaying = true;
                this.playControl.play();

                let indexToShow = Math.round(this.playControl.getCurrentIndex());
                if (indexToShow >= playData.allViewModels.length - 1) {
                    playData.currentFrameIndex = -1;
                } else {
                    playData.currentFrameIndex = indexToShow - 1;
                }

                this.playNextFrame(playData);
            }
        }

        private playNextFrame(playData: PlayChartData<T>, startFrame?: number, endFrame?: number): void {
            if (!this.isPlaying) {
                this.stop();
                return;
            }

            let nextFrame = playData.currentFrameIndex + 1;
            if (startFrame != null && endFrame != null) {
                nextFrame = Math.abs(endFrame - startFrame + 1);
                startFrame = nextFrame;
            }

            if (nextFrame < playData.allViewModels.length && nextFrame > -1) {
                playData.currentFrameIndex = nextFrame;
                playData.currentViewModel = playData.allViewModels[nextFrame];

                this.renderDelegate(playData.currentViewModel);
                this.playControl.setFrame(nextFrame);

                if (nextFrame < playData.allViewModels.length) {
                    window.setTimeout(() => {
                        this.playNextFrame(playData, startFrame, endFrame);
                    }, PlayChart.FrameStepDuration);
                }
            } else {
                this.stop();
            }
        }

        public stop(): void {
            if (this.playControl)
                this.playControl.pause();
            this.isPlaying = false;
        }

        public remove(): void {
            if (this.playControl)
                this.playControl.remove();
            if (this.callout)
                this.callout.remove();

            // TODO: remove any tracelines
        }

        public setRenderFunction(fn: PlayChartRenderFrameDelegate<T>): void {
            this.renderDelegate = fn;
        }

        private moveToFrameAndRender(frameIndex: number): void {
            let playData = this.playData;

            this.isPlaying = false;

            if (frameIndex < 0 || frameIndex === playData.currentFrameIndex || frameIndex >= playData.allViewModels.length)
                return;

            playData.currentFrameIndex = frameIndex;
            let data = playData.allViewModels[frameIndex];
            playData.currentViewModel = data;
            this.renderDelegate(data);
        }

        private adjustForLegend(): void {
            let legend = $(".legend", this.element);
            let sliderLeftOffset = 0, sliderBottomOffset = 0;

            if (this.playControl) {
                // Reset
                let container = this.playControl.getContainer();
                container.css("left", "");
                container.css("bottom", "");
            }

            if (legend.length > 0) {
                // TODO: we should NOT be interrogating legend CSS properties for this, move the Callout to be SVGText and position inside the svg container
                const padding = 16; //callout padding
                
                // Reset to inherit css class top/right
                this.callout.css("right", "");
                this.callout.css("top", "");

                let floatVal = legend.css("float");
                let bottomVal = legend.css("bottom");

                if (floatVal === "right")
                    this.callout.css("right", legend.width() + padding);
                else if (floatVal === "left")
                    sliderLeftOffset = legend.width();
                else if (floatVal === "none" || floatVal === "") {
                    if (bottomVal === "" || bottomVal === "inherit" || bottomVal === "auto") {
                        this.callout.css("top", legend.height() + padding);
                    }
                    else {
                        sliderBottomOffset = legend.height() + 35;
                    }
                }

                if (this.playControl) {
                    let container = this.playControl.getContainer();
                    if (sliderLeftOffset)
                        container.css("left", sliderLeftOffset);
                    if (sliderBottomOffset)
                        container.css("bottom", sliderBottomOffset);
                }
            }
        }

        public getCartesianExtents(existingExtents: CartesianExtents, getExtents: (T) => CartesianExtents): CartesianExtents {
            if (this.playData && this.playData.allViewModels && this.playData.allViewModels.length > 0) {
                return PlayChart.getMinMaxForAllFrames(this.playData, getExtents);
            }

            return existingExtents;
        }
    }

    class PlayControl {
        private playAxisContainer: JQuery;
        private playButton: JQuery;
        private playButtonCircle: JQuery;
        private slider: JQuery;
        private noUiSlider: noUiSlider.noUiSlider;
        private renderDelegate: (index: number) => void;

        private static SliderMarginLeft = 15 + 24 + 10 * 2; // left margin + playButton width + playButton margin
        private static SliderMarginRight = 20;
        private static SliderMaxMargin = 100;

        constructor(element: JQuery, renderDelegate: (index: number) => void) {
            this.createSliderDOM(element);
            this.renderDelegate = renderDelegate;
        }

        public getContainer(): JQuery {
            return this.playAxisContainer;
        }

        public remove(): void {
            if (this.playAxisContainer)
                this.playAxisContainer.remove();
        }

        public pause(): void {
            this.playButton.removeClass('pause').addClass('play');
        }

        public play(): void {
            this.playButton.removeClass('play').addClass('pause');
        }

        public getCurrentIndex(): number {
            // TODO: round() necessary?
            return Math.round(<number>this.noUiSlider.get());
        }

        public onPlay(handler: (eventObject: JQueryEventObject) => void): void {
            this.playButtonCircle.off('click');
            this.playButtonCircle.on('click', handler);
        }

        private static calculateSliderWidth(labelData: PlayAxisTickLabelData, width: number): number {
            let leftMargin = 0, rightMargin = 0;
            if (!_.isEmpty(labelData.labelInfo)) {
                leftMargin = _.first(labelData.labelInfo).labelWidth / 2;
                rightMargin = _.last(labelData.labelInfo).labelWidth / 2;
            }

            let sliderLeftMargin = Math.max(leftMargin, PlayControl.SliderMarginLeft);
            let sliderRightMargin = Math.max(rightMargin, PlayControl.SliderMarginRight);
            
            sliderLeftMargin = Math.min(PlayControl.SliderMaxMargin, sliderLeftMargin);
            sliderRightMargin = Math.min(PlayControl.SliderMaxMargin, sliderRightMargin);
            
            let sliderWidth = Math.max((width - sliderLeftMargin - sliderRightMargin), 1);
            return sliderWidth;
        }

        private createSliderDOM(element: JQuery): void {
            this.playAxisContainer = $('<div class="play-axis-container"></div>')
                .appendTo(element);

            this.playButtonCircle = $('<div class="button-container"></div>')
                .appendTo(this.playAxisContainer);

            this.playButton = $('<div class="play"></div>')
                .appendTo(this.playButtonCircle);

            this.slider = $('<div class="sliders"></div>')
                .appendTo(this.playAxisContainer);
        }

        public rebuild<T extends PlayableChartData>(playData: PlayChartData<T>, viewport: IViewport): void {
            let slider = this.slider;

            // re-create the slider
            if (this.noUiSlider)
                this.noUiSlider.destroy();

            let sliderElement = <noUiSlider.Instance>this.slider.get(0);

            let labelData = playData.labelData;
            let sliderWidth = PlayControl.calculateSliderWidth(labelData, viewport.width);
            this.slider.css('width', sliderWidth + 'px');

            let numFrames = playData.frameKeys.length;
            if (numFrames > 0) {
                let filterPipLabels = PlayChart.createPipsFilterFn(playData, sliderWidth, labelData);
                let lastIndex = numFrames - 1;
                noUiSlider.create(
                    sliderElement,
                    {
                        step: 1,
                        start: [playData.currentFrameIndex],
                        range: {
                            min: [0],
                            max: [lastIndex],
                        },
                        pips: {
                            mode: 'steps',
                            density: Math.round(100 / numFrames), //only draw ticks where we have labels
                            format: {
                                to: (index) => playData.frameKeys[index],
                                from: (value) => playData.frameKeys.indexOf(value),
                            },
                            filter: filterPipLabels,
                        },
                    }
                );
            }
            else {
                noUiSlider.create(
                    sliderElement,
                    {
                        step: 1,
                        start: [0],
                        range: {
                            min: [0],
                            max: [0],
                        },
                    });
            }

            this.noUiSlider = sliderElement.noUiSlider;

            this.noUiSlider.on('slide', () => {
                let indexToShow = this.getCurrentIndex();
                this.renderDelegate(indexToShow);
            });

            // update the width and margin-left to center up each label
            $('.noUi-value', slider).each((idx, elem) => {
                // TODO: better way to get the label info for an element?
                let actualWidth = labelData.labelInfo.filter(l => l.label === $(elem).text())[0].labelWidth;
                $(elem).width(actualWidth);
                $(elem).css('margin-left', -actualWidth / 2 + 'px');
            });
        }

        public setFrame(frameIndex: number): void {
            this.noUiSlider.set([frameIndex]);
        };
    }

    export module PlayChart {
        // TODO: add speed control to property pane
        // NOTE: current noUiSlider speed is a CSS property of the class .noUi-state-tap, and also is hard-coded in noUiSlider.js. We'll need to add a new create param for transition time.
        // 800ms matches Silverlight frame speed
        export const FrameStepDuration = 800;
        export const FrameAnimationDuration = 750; //leave 50ms for the traceline animation - to avoid being cancelled. TODO: add a proper wait impl.

        export const ClassName = 'playChart';

        export function convertMatrixToCategorical(matrix: DataViewMatrix, frame: number): DataViewCategorical {

            let categorical: DataViewCategorical = {
                categories: [],
                values: powerbi.data.DataViewTransform.createValueColumns()
            };

            // If we only have a Play field, we don't have series or categories, then just return early
            if (matrix.rows.levels.length < 2 && matrix.columns.levels.length === 0)
                return categorical;

            let category: DataViewCategoryColumn = {
                source: matrix.rows.levels.length > 1 ? matrix.rows.levels[1].sources[0] : matrix.columns.levels[0].sources[0],
                values: [],
                objects: undefined,
                identity: []
            };

            // Matrix shape for Play:
            //
            //                   Series1 | Series2 | ...
            //                  --------- --------  
            // Play1 | Category1 | values  | values
            //       | Category2 | values  | values
            //       | ...
            // Play2 | Category1 | values  | values
            //       | Category2 | values  | values
            // ...

            // we are guaranteed at least one row (it will be the Play field)
            let hasRowChildren = matrix.rows.root.children;
            let hasColChildren = matrix.columns.root.children;
            let hasSeries = matrix.columns.levels.length > 1 && hasColChildren;
            let hasPlayAndCategory = matrix.rows.levels.length > 1 && hasRowChildren;

            if (hasSeries && !hasPlayAndCategory) {
                // special case - series but no categories - use series as categories
                
                // set categories to undefined
                categorical.categories = undefined;

                let node = matrix.columns.root;
                categorical.values.source = matrix.columns.levels[0].sources[0];
                let columnLength = matrix.valueSources.length;
                for (let i = 0, len = node.children.length; i < len; i++) {
                    // add all the value sources for each series
                    let columnNode = node.children[i];
                    for (let j = 0; j < columnLength; j++) {
                        let source = <any>_.create(matrix.valueSources[j], { groupName: columnNode.value });
                        let dataViewColumn: DataViewValueColumn = {
                            identity: columnNode.identity,
                            values: [],
                            source: source
                        };
                        categorical.values.push(dataViewColumn);
                    }
                }

                let innerValueNode = matrix.rows.root.children[frame];
                for (let i = 0, len = node.children.length; i < len; i++) {
                    for (let j = 0; j < columnLength; j++) {
                        categorical.values[i * columnLength + j].values.push(innerValueNode.values[i * columnLength + j].value);
                    }
                }
            }
            else if (hasSeries && hasRowChildren) {
                // series and categories
                let node = matrix.rows.root.children[frame];
                
                // create the categories first
                for (let i = 0, len = node.children.length; i < len; i++) {
                    let innerNode = node.children[i];
                    category.identity.push(innerNode.identity);
                    category.values.push(innerNode.value);
                }

                // now add the series info
                categorical.values.source = matrix.columns.levels[0].sources[0];
                let nodeQueue = [];
                let columnNode = matrix.columns.root;
                let seriesIndex = -1;
                while (columnNode) {
                    if (columnNode.children && columnNode.children[0].children) {
                        for (let j = 0, jlen = columnNode.children.length; j < jlen; j++) {
                            // each of these is a "series"
                            nodeQueue.push(columnNode.children[j]);
                        }
                    } else if (columnNode.children && node.children) {
                        // Processing a single series under here, push all the value sources for every series.
                        let columnLength = columnNode.children.length;
                        for (let j = 0; j < columnLength; j++) {
                            let source = <any>_.create(matrix.valueSources[j], { groupName: columnNode.value });
                            let dataViewColumn: DataViewValueColumn = {
                                identity: columnNode.identity,
                                values: [],
                                source: source,
                            };
                            categorical.values.push(dataViewColumn);
                        }
                        for (let i = 0, len = node.children.length; i < len; i++) {
                            let innerNode = node.children[i];
                            for (let j = 0; j < columnLength; j++) {
                                categorical.values[seriesIndex * columnLength + j].values.push(innerNode.values[seriesIndex * columnLength + j].value);
                            }
                        }
                    }

                    if (nodeQueue.length > 0) {
                        columnNode = nodeQueue[0];
                        nodeQueue = nodeQueue.splice(1);
                        seriesIndex++;
                    } else
                        columnNode = undefined;
                }
            }
            else if (hasPlayAndCategory) {
                // no series, just play and category
                let node = matrix.rows.root.children[frame];
                let measureLength = matrix.valueSources.length;
                for (let j = 0; j < measureLength; j++) {
                    let dataViewColumn: DataViewValueColumn = {
                        identity: undefined,
                        values: [],
                        source: matrix.valueSources[j]
                    };
                    categorical.values.push(dataViewColumn);
                }

                for (let i = 0, len = node.children.length; i < len; i++) {
                    let innerNode = node.children[i];
                    category.identity.push(innerNode.identity);
                    category.values.push(innerNode.value);

                    for (let j = 0; j < measureLength; j++) {
                        categorical.values[j].values.push(innerNode.values[j].value);
                    }
                }
            }

            if (categorical.categories)
                categorical.categories.push(category);

            return categorical;
        }

        function getObjectProperties(dataViewMetadata: DataViewMetadata, dataLabelsSettings?: PointDataLabelsSettings): PlayObjectProperties {
            let objectProperties: PlayObjectProperties = {};

            if (dataViewMetadata && dataViewMetadata.objects) {
                let objects = dataViewMetadata.objects;
                // TODO: remove?
                objectProperties.currentFrameIndex = DataViewObjects.getValue(objects, scatterChartProps.currentFrameIndex.index, null);
            }
            return objectProperties;
        }

        function buildDataViewForFrame(metadata: DataViewMetadata, categorical: DataViewCategorical): DataView {
            return {
                metadata: metadata,
                categorical: categorical,
            };
        }

        export function converter<T extends PlayableChartData>(dataView: DataView, visualConverter: VisualDataConverterDelegate<T>): PlayChartData<T> {
            let dataViewMetadata: DataViewMetadata = dataView.metadata;
            let dataLabelsSettings = dataLabelUtils.getDefaultPointLabelSettings();
            let objectProperties = getObjectProperties(dataViewMetadata, dataLabelsSettings);

            let allViewModels: T[] = [];
            let frameKeys: string[] = [];
            let convertedData: T = undefined;
            let matrixRows = dataView.matrix.rows;
            let rowChildrenLength = matrixRows.root.children ? matrixRows.root.children.length : 0;
            if (dataView.matrix && rowChildrenLength > 0) {
                let keySourceColumn = matrixRows.levels[0].sources[0];

                // TODO: this should probably defer to the visual which knows how to format the categories.
                let keyFormatter = valueFormatter.create({
                    format: valueFormatter.getFormatString(keySourceColumn, scatterChartProps.general.formatString),
                    value: matrixRows.root.children[0],
                    value2: matrixRows.root.children[rowChildrenLength - 1],
                });

                for (let i = 0, len = rowChildrenLength; i < len; i++) {
                    let key = matrixRows.root.children[i];
                    frameKeys.push(keyFormatter.format(key.value));

                    let dataViewCategorical = convertMatrixToCategorical(dataView.matrix, i);
                    convertedData = visualConverter(buildDataViewForFrame(dataView.metadata, dataViewCategorical));
                    allViewModels.push(convertedData);
                }
            }
            else {
                let dataViewCategorical = convertMatrixToCategorical(dataView.matrix, 0);
                convertedData = visualConverter(buildDataViewForFrame(dataView.metadata, dataViewCategorical));
                allViewModels.push(convertedData);
            }
            
            // NOTE: currentViewModel is already set to the last frame
            objectProperties.currentFrameIndex = frameKeys.length - 1;

            return {
                allViewModels: allViewModels,
                currentViewModel: convertedData,
                frameKeys: frameKeys,
                currentFrameIndex: objectProperties.currentFrameIndex,
                labelData: getLabelData(frameKeys),
            };
        }

        export function getDefaultPlayData<T extends PlayableChartData>(): PlayChartData<T> {
            let defaultData: PlayChartData<T> = {
                frameKeys: [],
                allViewModels: [],
                currentFrameIndex: 0,
                currentViewModel: undefined,
                labelData: {
                    anyWordBreaks: false,
                    labelInfo: [],
                },
            };
            return defaultData;
        }

        export function getMinMaxForAllFrames<T extends PlayableChartData>(playData: PlayChartData<T>, getExtents: (T) => CartesianExtents): CartesianExtents {
            let extents: CartesianExtents = {
                minY: 0,
                maxY: 10,
                minX: 0,
                maxX: 10,
            };

            if (playData.allViewModels && playData.allViewModels.length > 0) {
                extents.minY = extents.minX = Number.MAX_VALUE;
                extents.maxY = extents.maxX = Number.MIN_VALUE;
                for (let i = 0, len = playData.allViewModels.length; i < len; i++) {
                    let data = playData.allViewModels[i];
                    let e = getExtents(data);

                    // NOTE: D3.min/max handle undefined and NaN nicely, as opposed to Math.min/max
                    extents = {
                        minY: d3.min([e.minY, extents.minY]),
                        maxY: d3.max([e.maxY, extents.maxY]),
                        minX: d3.min([e.minX, extents.minX]),
                        maxX: d3.max([e.maxX, extents.maxX]),
                    };
                }
            }

            return extents;
        }

        export function getLabelData(keys: string[]): PlayAxisTickLabelData {
            let textProperties: TextProperties = {
                fontFamily: 'wf_segoe-ui_normal',
                fontSize: jsCommon.PixelConverter.toString(14),
            };

            let labelInfo: PlayAxisTickLabelInfo[] = [];
            let anyWordBreaks = false;
            for (let key of keys) {
                let labelWidth = jsCommon.WordBreaker.getMaxWordWidth(key, TextMeasurementService.measureSvgTextWidth, textProperties);
                anyWordBreaks = anyWordBreaks || jsCommon.WordBreaker.hasBreakers(key) || (key).indexOf('-') > -1;  // TODO: Why isn't this last part included in hasBreakers()?
                labelInfo.push({ label: key, labelWidth });
            }

            return {
                labelInfo: labelInfo,
                anyWordBreaks: anyWordBreaks,
            };
        }

        export function createPipsFilterFn<T extends PlayableChartData>(playData: PlayChartData<T>, sliderWidth: number, labelData: PlayAxisTickLabelData): (index: any, type: any) => number {
            let maxLabelWidth = _.max(_.map(labelData.labelInfo, (l) => l.labelWidth));

            let pipSize = 1; //0=hide, 1=large, 2=small
            let skipMod = 1;
            let maxAllowedLabelWidth = playData.frameKeys.length > 1 ? sliderWidth / (playData.frameKeys.length - 1) : sliderWidth;
            let widthRatio = maxLabelWidth / maxAllowedLabelWidth;

            if (widthRatio > 1.25) {
                skipMod = Math.ceil(widthRatio);
                pipSize = 2;
            }
            else if (widthRatio > 1.0 || labelData.anyWordBreaks) {
                // wordbreak line wrapping is automatic, and we don't reserve enough space to show two lines of text with the larger font
                pipSize = 2;
            }

            let filterPipLabels = (index: any, type: any) => {
                // noUiSlider will word break / wrap to new lines, so max width is the max word length
                if (index % skipMod === 0) {
                    return pipSize;
                }
                return 0; //hide
            };

            return filterPipLabels;
        }

        export function isDataViewPlayable(dataView: DataView, playRole: string = 'Play'): boolean {
            debug.assertValue(dataView, 'dataView');

            let categoryRoleIsPlay = dataView.categorical
                && dataView.categorical.categories
                && dataView.categorical.categories[0]
                && dataView.categorical.categories[0].source
                && dataView.categorical.categories[0].source.roles
                && dataView.categorical.categories[0].source.roles[playRole];

            return (dataView.matrix && (!dataView.categorical || categoryRoleIsPlay));
        }

        /** Render trace-lines for selected data points. */
        export function renderTraceLines(allDataPoints: SelectableDataPoint[], traceLineRenderer: ITraceLineRenderer, shouldAnimate: boolean): void {
            let selectedDataPoints = _.filter(allDataPoints, (d: SelectableDataPoint) => d.selected);
            selectedDataPoints = _.uniq(selectedDataPoints, (d: SelectableDataPoint) => d.identity.getKey());
            traceLineRenderer.render(selectedDataPoints, shouldAnimate);
        }
    }
}
