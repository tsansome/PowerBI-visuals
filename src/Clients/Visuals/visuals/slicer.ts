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
    import DisplayNameKeys = SlicerUtil.DisplayNameKeys;
    import DOMHelper = SlicerUtil.DOMHelper;
    import SettingsHelper = SlicerUtil.SettingsHelper;
    import SlicerOrientation = slicerOrientation.Orientation;

    export interface SlicerDefaultValueHandler {
        getDefaultValue(): data.SQConstantExpr;
        getIdentityFields(): data.SQExpr[];
    }

    export interface SlicerConstructorOptions {
        domHelper?: DOMHelper;
        behavior?: IInteractiveBehavior;
    }

    export interface ISlicerRenderer {
        init(options: SlicerInitOptions): IInteractivityService;
        render(options: SlicerRenderOptions): void;
    }

    export interface SlicerRenderOptions {
        dataView: DataView;
        data: SlicerData;
        viewport: IViewport;
        renderAsImage: (url: string) => boolean;
        resetScrollbarPosition?: boolean;
    }

    export interface SlicerData {
        categorySourceName: string;
        slicerDataPoints: SlicerDataPoint[];
        slicerSettings: SlicerSettings;
        hasSelectionOverride?: boolean;
    }

    export interface SlicerDataPoint extends SelectableDataPoint {
        value: string;
        tooltip: string;
        isSelectAllDataPoint?: boolean;
    }

    export interface SlicerSettings {
        general: {
            outlineColor: string;
            outlineWeight: number;
            orientation: SlicerOrientation;
        };
        header: {
            borderBottomWidth: number;
            show: boolean;
            outline: string;
            fontColor: string;
            background?: string;
            textSize: number;
        };
        slicerText: {
            color: string;
            outline: string;
            background?: string;
            textSize: number;
        };
        selection: {
            selectAllCheckboxEnabled: boolean;
            singleSelect: boolean;
        };
    }

    export interface SlicerInitOptions {
        visualInitOptions: VisualInitOptions;
        loadMoreData: () => void;
    }

    export class Slicer implements IVisual {
        private element: JQuery;
        private currentViewport: IViewport;
        private dataView: DataView;
        private slicerData: SlicerData;
        private settings: SlicerSettings;
        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;
        private hostServices: IVisualHostServices;
        private slicerRenderer: ISlicerRenderer;
        private slicerOrientation: SlicerOrientation;
        private waitingForData: boolean;
        private renderAsImage: (url: string) => boolean;
        private domHelper: DOMHelper;
        private initOptions: VisualInitOptions;
        public static DefaultStyleProperties(): SlicerSettings {
            return {
                general: {
                    outlineColor: '#808080',
                    outlineWeight: 1,
                    orientation: SlicerOrientation.Vertical,
                },
                header: {
                    borderBottomWidth: 1,
                    show: true,
                    outline: 'BottomOnly',
                    fontColor: '#000000',
                    textSize: 10,
                },
                slicerText: {
                    color: '#666666',
                    outline: 'None',
                    textSize: 10,
                },
                selection: {
                    selectAllCheckboxEnabled: false,
                    singleSelect: true
                },
            };
        }

        constructor(options?: SlicerConstructorOptions) {
            if (options) {
                this.behavior = options.behavior;
            }
            this.domHelper = new DOMHelper();
        }

        public init(options: VisualInitOptions): void {
            this.initOptions = options;
            this.element = options.element;
            this.currentViewport = options.viewport;
            this.hostServices = options.host;
            let settings = this.settings = Slicer.DefaultStyleProperties();
            this.slicerOrientation = settings.general.orientation;
            this.waitingForData = false;

            this.initializeSlicerRenderer(this.slicerOrientation);
        }

        public onDataChanged(options: VisualDataChangedOptions): void {
            debug.assertValue(options, 'options');

            let dataViews = options.dataViews;
            debug.assertValue(dataViews, 'dataViews');

            if (_.isEmpty(dataViews)) {
                return;
            }

            let existingDataView = this.dataView;
            this.dataView = dataViews[0];
            // Reset scrollbar by default, unless it's an Append operation or Selecting an item
            let resetScrollbarPosition = options.operationKind !== VisualDataChangeOperationKind.Append
                && !DataViewAnalysis.hasSameCategoryIdentity(existingDataView, this.dataView);

            let metadata = this.dataView.metadata;
            this.renderAsImage = metadata &&
                !_.isEmpty(metadata.columns) &&
                metadata.columns[0].type &&
                metadata.columns[0].type.misc &&
                metadata.columns[0].type.misc.imageUrl ? jsCommon.Utility.isValidUrl : $.noop;

            this.render(resetScrollbarPosition, true);
        }

        public onResizing(finalViewport: IViewport): void {
            this.currentViewport = finalViewport;
            this.render(false /* resetScrollbarPosition */);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            return ObjectEnumerator.enumerateObjectInstances(options, this.slicerData, this.settings);
        }

        // public for testability
        public loadMoreData(): void {
            let dataView = this.dataView;
            if (!dataView)
                return;

            let dataViewMetadata = dataView.metadata;
            // Making sure that hostservices.loadMoreData is not invoked when waiting for server to load the next segment of data
            if (!this.waitingForData && dataViewMetadata && dataViewMetadata.segment) {
                this.hostServices.loadMoreData();
                this.waitingForData = true;
            }
        }

        private render(resetScrollbarPosition: boolean, stopWaitingForData?: boolean): void {
            let localizedSelectAllText = this.hostServices.getLocalizedString(DisplayNameKeys.SelectAll);
            DataConversion.convert(this.dataView, localizedSelectAllText, this.interactivityService, this.hostServices).then(
                data => {
                    if (!data) {
                        return;
                    }

                    data.slicerSettings.general.outlineWeight = data.slicerSettings.general.outlineWeight < 0 ? 0 : data.slicerSettings.general.outlineWeight;
                    this.settings = data.slicerSettings;
                    this.slicerData = data;

                    let slicerOrientation = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.general && data.slicerSettings.general.orientation ?
                        data.slicerSettings.general.orientation : Slicer.DefaultStyleProperties().general.orientation;

                    let orientationHasChanged = this.orientationHasChanged(slicerOrientation);
                    if (orientationHasChanged) {
                        this.slicerOrientation = slicerOrientation;
                        // Clear the previous slicer type when rendering the new slicer type
                        this.element.empty();
                        this.initializeSlicerRenderer(slicerOrientation);
                    }
                    this.slicerRenderer.render({ dataView: this.dataView, data: data, viewport: this.currentViewport, renderAsImage: this.renderAsImage, resetScrollbarPosition: resetScrollbarPosition });

                    if (stopWaitingForData)
                        this.waitingForData = false;
                });
        }

        private orientationHasChanged(slicerOrientation: SlicerOrientation): boolean {
            return this.slicerOrientation !== slicerOrientation;
        }

        private initializeSlicerRenderer(slicerOrientation: SlicerOrientation): void {
            switch (slicerOrientation) {
                case SlicerOrientation.Horizontal:
                    this.initializeHorizontalSlicer();
                    break;

                case SlicerOrientation.Vertical:
                    this.initializeVerticalSlicer();
                    break;
            }
        }

        private initializeVerticalSlicer(): void {
            let verticalSlicerRenderer = this.slicerRenderer = new VerticalSlicerRenderer({ domHelper: this.domHelper, behavior: this.behavior });
            let options = this.createInitOptions();
            this.interactivityService = verticalSlicerRenderer.init(options);
        }

        private initializeHorizontalSlicer(): void {
            let horizontalSlicerRenderer = this.slicerRenderer = new HorizontalSlicerRenderer({ domHelper: this.domHelper, behavior: this.behavior });
            let options = this.createInitOptions();
            this.interactivityService = horizontalSlicerRenderer.init(options);
        }

        private createInitOptions(): SlicerInitOptions {
            return {
                visualInitOptions: this.initOptions,
                loadMoreData: () => this.loadMoreData()
            };
        }
    }

    /** Helper class for calculating the current slicer settings. */
    module ObjectEnumerator {
        export function enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions, data: SlicerData, settings: SlicerSettings): VisualObjectInstance[] {
            if (!data)
                return;

            switch (options.objectName) {
                case 'items':
                    return enumerateItems(data, settings);
                case 'header':
                    return enumerateHeader(data, settings);
                case 'general':
                    return enumerateGeneral(data, settings);
                case 'selection':
                    return enumerateSelection(data, settings);
            }
        }

        function enumerateSelection(data: SlicerData, settings: SlicerSettings): VisualObjectInstance[] {
            let slicerSettings = settings;
            let areSelectionSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.selection;
            let selectAllCheckboxEnabled = areSelectionSettingsDefined && data.slicerSettings.selection.selectAllCheckboxEnabled ?
                data.slicerSettings.selection.selectAllCheckboxEnabled : slicerSettings.selection.selectAllCheckboxEnabled;
            let singleSelect = data && data.slicerSettings && data.slicerSettings.selection && data.slicerSettings.selection.singleSelect !== undefined ?
                data.slicerSettings.selection.singleSelect : slicerSettings.selection.singleSelect;

            return [{
                selector: null,
                objectName: 'selection',
                properties: {
                    selectAllCheckboxEnabled: selectAllCheckboxEnabled,
                    singleSelect: singleSelect
                }
            }];
        }

        function enumerateHeader(data: SlicerData, settings: SlicerSettings): VisualObjectInstance[] {
            let slicerSettings = settings;
            let areHeaderSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.header;
            let fontColor = areHeaderSettingsDefined && data.slicerSettings.header.fontColor ?
                data.slicerSettings.header.fontColor : slicerSettings.header.fontColor;
            let background = areHeaderSettingsDefined && data.slicerSettings.header.background ?
                data.slicerSettings.header.background : slicerSettings.header.background;
            return [{
                selector: null,
                objectName: 'header',
                properties: {
                    show: slicerSettings.header.show,
                    fontColor: fontColor,
                    background: background,
                    outline: slicerSettings.header.outline,
                    textSize: slicerSettings.header.textSize,
                }
            }];
        }

        function enumerateItems(data: SlicerData, settings: SlicerSettings): VisualObjectInstance[] {
            let slicerSettings = settings;
            let areTextSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.slicerText;
            let fontColor = areTextSettingsDefined && data.slicerSettings.slicerText.color ?
                data.slicerSettings.slicerText.color : slicerSettings.slicerText.color;
            let background = areTextSettingsDefined && data.slicerSettings.slicerText.background ?
                data.slicerSettings.slicerText.background : slicerSettings.slicerText.background;
            return [{
                selector: null,
                objectName: 'items',
                properties: {
                    fontColor: fontColor,
                    background: background,
                    outline: slicerSettings.slicerText.outline,
                    textSize: slicerSettings.slicerText.textSize,
                }
            }];
        }

        function enumerateGeneral(data: SlicerData, settings: SlicerSettings): VisualObjectInstance[] {
            let slicerSettings = settings;
            let areGeneralSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.general != null;
            let outlineColor = areGeneralSettingsDefined && data.slicerSettings.general.outlineColor ?
                data.slicerSettings.general.outlineColor : slicerSettings.general.outlineColor;
            let outlineWeight = areGeneralSettingsDefined && data.slicerSettings.general.outlineWeight ?
                data.slicerSettings.general.outlineWeight : slicerSettings.general.outlineWeight;
            let orientation = areGeneralSettingsDefined && data.slicerSettings.general.orientation != null ?
                data.slicerSettings.general.orientation : slicerSettings.general.orientation;

            return [{
                selector: null,
                objectName: 'general',
                properties: {
                    outlineColor: outlineColor,
                    outlineWeight: outlineWeight,
                    orientation: orientation,
                }
            }];
        }
    }
}