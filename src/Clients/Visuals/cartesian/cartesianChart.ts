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
    import EnumExtensions = jsCommon.EnumExtensions;
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

    const COMBOCHART_DOMAIN_OVERLAP_TRESHOLD_PERCENTAGE = 0.1;

    export const enum CartesianChartType {
        Line,
        Area,
        StackedArea,
        ClusteredColumn,
        StackedColumn,
        ClusteredBar,
        StackedBar,
        HundredPercentStackedBar,
        HundredPercentStackedColumn,
        Scatter,
        ComboChart,
        DataDot,
        Waterfall,
        LineClusteredColumnCombo,
        LineStackedColumnCombo,
        DataDotClusteredColumnCombo,
        DataDotStackedColumnCombo,
    }

    export interface CalculateScaleAndDomainOptions {
        viewport: IViewport;
        margin: IMargin;
        forcedTickCount?: number;
        forcedYDomain?: any[];
        forcedXDomain?: any[];
        showCategoryAxisLabel: boolean;
        showValueAxisLabel: boolean;
        forceMerge: boolean;
        categoryAxisScaleType: string;
        valueAxisScaleType: string;
        categoryAxisDisplayUnits?: number;
        categoryAxisPrecision?: number;
        valueAxisDisplayUnits?: number;
        valueAxisPrecision?: number;
    }

    export interface MergedValueAxisResult {
        domain: number[];
        merged: boolean;
        tickCount: number;
        forceStartToZero: boolean;
    }

    export interface CartesianSmallViewPortProperties {
        hideLegendOnSmallViewPort: boolean;
        hideAxesOnSmallViewPort: boolean;
        MinHeightLegendVisible: number;
        MinHeightAxesVisible: number;
    }

    export interface AxisRenderingOptions {
        axisLabels: ChartAxesLabels;
        viewport: IViewport;
        margin: IMargin;
        hideXAxisTitle: boolean;
        hideYAxisTitle: boolean;
        hideY2AxisTitle?: boolean;
        xLabelColor?: Fill;
        yLabelColor?: Fill;
        y2LabelColor?: Fill;
        fontSize: number;
    }

    export interface CartesianConstructorOptions {
        chartType: CartesianChartType;
        isScrollable?: boolean;
        animator?: IGenericAnimator;
        cartesianSmallViewPortProperties?: CartesianSmallViewPortProperties;
        behavior?: IInteractiveBehavior;
        seriesLabelFormattingEnabled?: boolean;
        isLabelInteractivityEnabled?: boolean;
        tooltipsEnabled?: boolean;
        referenceLinesEnabled?: boolean;
        backgroundImageEnabled?: boolean;
        lineChartLabelDensityEnabled?: boolean;
    }

    export interface ICartesianVisual {
        init(options: CartesianVisualInitOptions): void;
        setData(dataViews: DataView[], resized?: boolean): void;
        calculateAxesProperties(options: CalculateScaleAndDomainOptions): IAxisProperties[];
        overrideXScale(xProperties: IAxisProperties): void;
        render(suppressAnimations: boolean): CartesianVisualRenderResult;
        calculateLegend(): LegendData;
        hasLegend(): boolean;
        onClearSelection(): void;
        enumerateObjectInstances?(enumeration: ObjectEnumerationBuilder, options: EnumerateVisualObjectInstancesOptions): void;
        getVisualCategoryAxisIsScalar?(): boolean;
        getSupportedCategoryAxisType?(): string;
        getPreferredPlotArea?(isScalar: boolean, categoryCount: number, categoryThickness: number): IViewport;
        setFilteredData?(startIndex: number, endIndex: number): CartesianData;
    }

    export interface CartesianVisualConstructorOptions {
        isScrollable: boolean;
        interactivityService?: IInteractivityService;
        animator?: IGenericAnimator;
        seriesLabelFormattingEnabled?: boolean;
        isLabelInteractivityEnabled?: boolean;
        tooltipsEnabled?: boolean;
        lineChartLabelDensityEnabled?: boolean;
    }

    export interface CartesianVisualRenderResult {
        dataPoints: SelectableDataPoint[];
        behaviorOptions: any;
        labelDataPoints: LabelDataPoint[];
        labelsAreNumeric: boolean;
        labelDataPointGroups?: LabelDataPointsGroup[];
    }

    export interface CartesianDataPoint {
        categoryValue: any;
        value: number;
        categoryIndex: number;
        seriesIndex: number;
        highlight?: boolean;
    }

    export interface CartesianSeries {
        data: CartesianDataPoint[];
    }

    export interface CartesianData {
        series: CartesianSeries[];
        categoryMetadata: DataViewMetadataColumn;
        categories: any[];
        hasHighlights?: boolean;
    }

    export interface CartesianVisualInitOptions extends VisualInitOptions {
        svg: D3.Selection;
        cartesianHost: ICartesianVisualHost;
        chartType?: CartesianChartType;
        labelsContext?: D3.Selection; //TEMPORARY - for PlayAxis
    }

    export interface ICartesianVisualHost {
        updateLegend(data: LegendData): void;
        getSharedColors(): IDataColorPalette;
    }

    export interface ChartAxesLabels {
        x: string;
        y: string;
        y2?: string;
    }

    export const enum AxisLinesVisibility {
        ShowLinesOnXAxis = 1,
        ShowLinesOnYAxis = 2,
        ShowLinesOnBothAxis = ShowLinesOnXAxis | ShowLinesOnYAxis,
    }

    export interface CategoryLayout {
        categoryCount: number;
        categoryThickness: number;
        outerPaddingRatio: number;
        isScalar?: boolean;
    }

    export interface CategoryLayoutOptions {
        availableWidth: number;
        categoryCount: number;
        domain: any;
        isScalar?: boolean;
        isScrollable?: boolean;
    }

    export interface CartesianAxisProperties {
        x: IAxisProperties;
        y1: IAxisProperties;
        y2?: IAxisProperties;
    }

    const AxisPadding: IMargin = {
        left: 10,
        right: 15,
        top: 0,
        bottom: 12,
    };

    export interface ReferenceLineOptions {
        graphicContext: D3.Selection;
        referenceLineProperties: DataViewObject;
        axes: CartesianAxisProperties;
        viewport: IViewport;
        classAndSelector: ClassAndSelector;
        defaultColor: string;
        isHorizontal: boolean;
    }

    export interface ReferenceLineDataLabelOptions {
        referenceLineProperties: DataViewObject;
        axes: CartesianAxisProperties;
        viewport: IViewport;
        defaultColor: string;
        isHorizontal: boolean;
    }

    type RenderPlotAreaDelegate = (
        layers: ICartesianVisual[],
        axesLayout: CartesianAxesLayout,
        suppressAnimations: boolean) => void;

    /** 
     * Renders a data series as a cartestian visual.
     */
    export class CartesianChart implements IVisual {
        public static MinOrdinalRectThickness = 20;
        public static MinScalarRectThickness = 2;
        public static OuterPaddingRatio = 0.4;
        public static InnerPaddingRatio = 0.2;
        public static TickLabelPadding = 2;

        private static ClassName = 'cartesianChart';
        private static PlayAxisBottomMargin = 75;
        private static FontSize = 11;
        private static FontSizeString = jsCommon.PixelConverter.toString(CartesianChart.FontSize);
        private static TextProperties: TextProperties = {
            fontFamily: 'wf_segoe-ui_normal',
            fontSize: CartesianChart.FontSizeString,
        };

        private element: JQuery;
        private svg: D3.Selection;
        private clearCatcher: D3.Selection;
        private type: CartesianChartType;
        private hostServices: IVisualHostServices;
        private layers: ICartesianVisual[];
        private legend: ILegend;
        private legendMargins: IViewport;
        private layerLegendData: LegendData;
        private hasSetData: boolean;
        private visualInitOptions: VisualInitOptions;
        private legendObjectProperties: DataViewObject;
        private categoryAxisProperties: DataViewObject;
        private valueAxisProperties: DataViewObject;
        private xAxisReferenceLines: DataViewObjectMap;
        private y1AxisReferenceLines: DataViewObjectMap;
        private cartesianSmallViewPortProperties: CartesianSmallViewPortProperties;
        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;
        private sharedColorPalette: SharedColorPalette;
        private seriesLabelFormattingEnabled: boolean;
        private isLabelInteractivityEnabled: boolean;
        private tooltipsEnabled: boolean;
        private lineChartLabelDensityEnabled: boolean;

        private referenceLinesEnabled: boolean;
        private xRefLine: ClassAndSelector = createClassAndSelector('x-ref-line');
        private y1RefLine: ClassAndSelector = createClassAndSelector('y1-ref-line');
        private backgroundImageEnabled: boolean;

        public animator: IGenericAnimator;

        private axes: CartesianAxes;
        private scrollableAxes: ScrollableAxes;
        private svgAxes: SvgCartesianAxes;
        private svgBrush: SvgBrush;

        // TODO: Remove onDataChanged & onResizing once all visuals have implemented update.
        private dataViews: DataView[];
        private currentViewport: IViewport;
        private background: VisualBackground;

        private static getAxisVisibility(type: CartesianChartType): AxisLinesVisibility {
            switch (type) {
                case CartesianChartType.StackedBar:
                case CartesianChartType.ClusteredBar:
                case CartesianChartType.HundredPercentStackedBar:
                    return AxisLinesVisibility.ShowLinesOnXAxis;
                case CartesianChartType.Scatter:
                    return AxisLinesVisibility.ShowLinesOnBothAxis;
                default:
                    return AxisLinesVisibility.ShowLinesOnYAxis;
            }
        }

        constructor(options: CartesianConstructorOptions) {
            let isScrollable = false;
            if (options) {
                this.tooltipsEnabled = options.tooltipsEnabled;
                this.type = options.chartType;
                this.seriesLabelFormattingEnabled = options.seriesLabelFormattingEnabled;
                this.isLabelInteractivityEnabled = options.isLabelInteractivityEnabled;
                this.referenceLinesEnabled = options.referenceLinesEnabled;
                this.backgroundImageEnabled = options.backgroundImageEnabled;
                this.lineChartLabelDensityEnabled = options.lineChartLabelDensityEnabled;
                if (options.isScrollable)
                    isScrollable = options.isScrollable;
                this.animator = options.animator;
                if (options.cartesianSmallViewPortProperties) {
                    this.cartesianSmallViewPortProperties = options.cartesianSmallViewPortProperties;
                }

                if (options.behavior) {
                    this.behavior = options.behavior;
                }
            }

            this.axes = new CartesianAxes(isScrollable, ScrollableAxes.ScrollbarWidth);
            this.svgAxes = new SvgCartesianAxes(this.axes);
            this.svgBrush = new SvgBrush(ScrollableAxes.ScrollbarWidth);
            this.scrollableAxes = new ScrollableAxes(this.axes, this.svgBrush);
        }

        public init(options: VisualInitOptions) {
            this.visualInitOptions = options;
            this.layers = [];

            let element = this.element = options.element;
            this.currentViewport = options.viewport;
            this.hostServices = options.host;

            element.addClass(CartesianChart.ClassName);
            let svg = this.svg = d3.select(element.get(0)).append('svg')
                .style('position', 'absolute');

            if (this.behavior) {
                this.clearCatcher = appendClearCatcher(svg);
                this.interactivityService = createInteractivityService(this.hostServices);
            }

            if (options.style.maxMarginFactor != null)
                this.axes.setMaxMarginFactor(options.style.maxMarginFactor);

            let axisLinesVisibility = CartesianChart.getAxisVisibility(this.type);
            this.axes.setAxisLinesVisibility(axisLinesVisibility);

            this.svgAxes.init(svg);
            this.svgBrush.init(svg);

            this.sharedColorPalette = new SharedColorPalette(options.style.colorPalette.dataColors);

            this.legend = createLegend(
                element,
                options.interactivity && options.interactivity.isInteractiveLegend,
                this.type !== CartesianChartType.Waterfall ? this.interactivityService : undefined,
                this.axes.isScrollable);
        }

        private isPlayAxis(): boolean {
            if (!this.dataViews || !this.dataViews[0])
                return false;

            let dataView = this.dataViews[0];
            let categoryRoleIsPlay: boolean = dataView.categorical
                && dataView.categorical.categories
                && dataView.categorical.categories[0]
                && dataView.categorical.categories[0].source
                && dataView.categorical.categories[0].source.roles
                && dataView.categorical.categories[0].source.roles['Play'];

            return this.type === CartesianChartType.Scatter
                && this.animator
                && dataView.matrix != null
                && (!dataView.categorical || categoryRoleIsPlay);
        }

        public static getIsScalar(objects: DataViewObjects, propertyId: DataViewObjectPropertyIdentifier, type: ValueType): boolean {
            let axisTypeValue = DataViewObjects.getValue(objects, propertyId);

            if (!objects || axisTypeValue === undefined) {
                // If we don't have anything set (Auto), show charts as Scalar if the category type is numeric or time. 
                // If we have the property, it will override the type.
                return !AxisHelper.isOrdinal(type);
            }

            // also checking type here to be in sync with AxisHelper, which ignores scalar if the type is non-numeric.
            return (axisTypeValue === axisType.scalar) && !AxisHelper.isOrdinal(type);
        }

        private populateObjectProperties(dataViews: DataView[]) {
            if (dataViews && dataViews.length > 0) {
                let dataViewMetadata = dataViews[0].metadata;

                if (dataViewMetadata) {
                    this.legendObjectProperties = DataViewObjects.getObject(dataViewMetadata.objects, 'legend', {});
                    this.xAxisReferenceLines = DataViewObjects.getUserDefinedObjects(dataViewMetadata.objects, 'xAxisReferenceLine');
                    this.y1AxisReferenceLines = DataViewObjects.getUserDefinedObjects(dataViewMetadata.objects, 'y1AxisReferenceLine');
                }
                else {
                    this.legendObjectProperties = {};
                }

                this.categoryAxisProperties = CartesianHelper.getCategoryAxisProperties(dataViewMetadata);
                this.valueAxisProperties = CartesianHelper.getValueAxisProperties(dataViewMetadata);
            }
        }

        public update(options: VisualUpdateOptions) {
            debug.assertValue(options, 'options');

            let dataViews = this.dataViews = options.dataViews;
            let resized = this.currentViewport && options.viewport
                && (this.currentViewport.height !== options.viewport.height || this.currentViewport.width !== options.viewport.width);
            this.currentViewport = options.viewport;

            if (!dataViews) return;

            if (this.layers.length === 0) {
                // Lazily instantiate the chart layers on the first data load.
                this.layers = this.createAndInitLayers(dataViews);

                debug.assert(this.layers.length > 0, 'createAndInitLayers should update the layers.');
            }
            let layers = this.layers;

            if (dataViews && dataViews.length > 0) {
                this.populateObjectProperties(dataViews);
                this.axes.update(dataViews);
                this.svgAxes.update(this.categoryAxisProperties, this.valueAxisProperties);
                let dataView = dataViews[0];
                if (dataView.metadata) {
                    // flatten background data
                    this.background = {
                        image: DataViewObjects.getValue<ImageValue>(dataView.metadata.objects, scatterChartProps.plotArea.image),
                        transparency: DataViewObjects.getValue(dataView.metadata.objects, scatterChartProps.plotArea.transparency, visualBackgroundHelper.getDefaultTransparency()),
                    };
                }
            }

            this.sharedColorPalette.clearPreferredScale();
            for (let i = 0, len = layers.length; i < len; i++) {
                layers[i].setData(getLayerData(dataViews, i, len), resized);

                if (len > 1)
                    this.sharedColorPalette.rotateScale();
            }

            this.render(!this.hasSetData || options.suppressAnimations);

            this.hasSetData = this.hasSetData || (dataViews && dataViews.length > 0);

            if (dataViews && dataViews.length > 0) {
                let warnings = getInvalidValueWarnings(
                    dataViews,
                    false /*supportsNaN*/,
                    false /*supportsNegativeInfinity*/,
                    false /*supportsPositiveInfinity*/);

                this.axes.addWarnings(warnings);

                if (warnings && warnings.length > 0)
                    this.hostServices.setWarnings(warnings);
            }
        }

        // TODO: Remove onDataChanged & onResizing once all visuals have implemented update.
        public onDataChanged(options: VisualDataChangedOptions): void {
            this.update({
                dataViews: options.dataViews,
                suppressAnimations: options.suppressAnimations,
                viewport: this.currentViewport
            });
        }

        // TODO: Remove onDataChanged & onResizing once all visuals have implemented update.
        public onResizing(viewport: IViewport): void {
            if (this.currentViewport && (this.currentViewport.height === viewport.height && this.currentViewport.width === viewport.width)) {
                return;
            }

            this.update({
                dataViews: this.dataViews,
                suppressAnimations: true,
                viewport: viewport
            });
        }

        public scrollTo(position: number): void {
            this.scrollableAxes.scrollTo(position);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let enumeration = new ObjectEnumerationBuilder();
            let layersLength = this.layers ? this.layers.length : 0;

            if (options.objectName === 'legend') {
                if (!this.shouldShowLegendCard())
                    return;
                let show = DataViewObject.getValue(this.legendObjectProperties, legendProps.show, this.legend.isVisible());
                let showTitle = DataViewObject.getValue(this.legendObjectProperties, legendProps.showTitle, true);
                let titleText = DataViewObject.getValue(this.legendObjectProperties, legendProps.titleText, this.layerLegendData ? this.layerLegendData.title : '');
                let labelColor = DataViewObject.getValue(this.legendObjectProperties, legendProps.labelColor, this.layerLegendData ? this.layerLegendData.labelColor : LegendData.DefaultLegendLabelFillColor);
                let fontSize = DataViewObject.getValue(this.legendObjectProperties, legendProps.fontSize, this.layerLegendData && this.layerLegendData.fontSize ? this.layerLegendData.fontSize : SVGLegend.DefaultFontSizeInPt);

                enumeration.pushInstance({
                    selector: null,
                    properties: {
                        show: show,
                        position: LegendPosition[this.legend.getOrientation()],
                        showTitle: showTitle,
                        titleText: titleText,
                        labelColor: labelColor,
                        fontSize: fontSize,
                    },
                    objectName: options.objectName
                });
            }
            else if (options.objectName === 'categoryAxis' && this.axes.hasCategoryAxis()) {
                this.getCategoryAxisValues(enumeration);
            }
            else if (options.objectName === 'valueAxis') {
                this.getValueAxisValues(enumeration);
            }
            else if (options.objectName === 'y1AxisReferenceLine' && this.referenceLinesEnabled) {
                let refLinedefaultColor = this.sharedColorPalette.getColorByIndex(0).value;
                ReferenceLineHelper.enumerateObjectInstances(enumeration, this.y1AxisReferenceLines, refLinedefaultColor, options.objectName);
            }
            else if (options.objectName === 'xAxisReferenceLine' && this.referenceLinesEnabled) {
                let refLinedefaultColor = this.sharedColorPalette.getColorByIndex(0).value;
                ReferenceLineHelper.enumerateObjectInstances(enumeration, this.xAxisReferenceLines, refLinedefaultColor, options.objectName);
            }
            else if (options.objectName === 'plotArea') {
                visualBackgroundHelper.enumeratePlot(enumeration, this.background, this.backgroundImageEnabled);
            }

            for (let i = 0, len = layersLength; i < len; i++) {
                let layer = this.layers[i];
                if (layer.enumerateObjectInstances) {
                    layer.enumerateObjectInstances(enumeration, options);
                }
            }

            return enumeration.complete();
        }

        private shouldShowLegendCard(): boolean {
            let layers = this.layers;
            let dataViews = this.dataViews;

            if (layers && dataViews) {
                let layersLength = layers.length;
                let layersWithValuesCtr = 0;

                for (let i = 0; i < layersLength; i++) {
                    if (layers[i].hasLegend()) {
                        return true;
                    }

                    // if there are at least two layers with values legend card should be shown (even if each of the individual layers don't have legend)
                    let dataView = dataViews[i];
                    if (dataView && dataView.categorical && dataView.categorical.values && dataView.categorical.values.length > 0) {
                        layersWithValuesCtr++;
                        if (layersWithValuesCtr > 1) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        private getCategoryAxisValues(enumeration: ObjectEnumerationBuilder): void {
            if (!this.categoryAxisProperties) {
                return;
            }
            let supportedType = axisType.both;
            let isScalar = false;
            let logPossible = this.axes.isLogScaleAllowed(AxisLocation.X);
            let scaleOptions = [axisScale.log, axisScale.linear];//until options can be update in propPane, show all options

            if (this.layers && this.layers[0].getSupportedCategoryAxisType) {
                supportedType = this.layers[0].getSupportedCategoryAxisType();
                if (supportedType === axisType.scalar) {
                    isScalar = true;
                }
                else {
                    isScalar = CartesianHelper.isScalar(supportedType === axisType.both, this.categoryAxisProperties);
                }
            }

            if (!isScalar) {
                this.categoryAxisProperties['start'] = null;
                this.categoryAxisProperties['end'] = null;
            }

            let instance: VisualObjectInstance = {
                selector: null,
                properties: {},
                objectName: 'categoryAxis',
                validValues: {
                    axisScale: scaleOptions,
                    axisStyle: this.axes.categoryAxisHasUnitType ? [axisStyle.showTitleOnly, axisStyle.showUnitOnly, axisStyle.showBoth] : [axisStyle.showTitleOnly]
                }
            };

            instance.properties['show'] = this.categoryAxisProperties['show'] != null ? this.categoryAxisProperties['show'] : true;
            if (this.axes.isYAxisCategorical())//in case of e.g. barChart
                instance.properties['position'] = this.valueAxisProperties && this.valueAxisProperties['position'] != null ? this.valueAxisProperties['position'] : yAxisPosition.left;
            if (supportedType === axisType.both) {
                instance.properties['axisType'] = isScalar ? axisType.scalar : axisType.categorical;
            }
            if (isScalar) {
                instance.properties['axisScale'] = (this.categoryAxisProperties['axisScale'] != null && logPossible) ? this.categoryAxisProperties['axisScale'] : axisScale.linear;
                instance.properties['start'] = this.categoryAxisProperties['start'];
                instance.properties['end'] = this.categoryAxisProperties['end'];
            }
            instance.properties['showAxisTitle'] = this.categoryAxisProperties['showAxisTitle'] != null ? this.categoryAxisProperties['showAxisTitle'] : false;

            instance.properties['axisStyle'] = this.categoryAxisProperties['axisStyle'] ? this.categoryAxisProperties['axisStyle'] : axisStyle.showTitleOnly;
            instance.properties['labelColor'] = this.categoryAxisProperties['labelColor'];
            if (isScalar) {
                instance.properties['labelDisplayUnits'] = this.categoryAxisProperties['labelDisplayUnits'] ? this.categoryAxisProperties['labelDisplayUnits'] : 0;
                let labelPrecision = this.categoryAxisProperties['labelPrecision'];
                instance.properties['labelPrecision'] = (labelPrecision === undefined || labelPrecision < 0)
                    ? dataLabelUtils.defaultLabelPrecision
                    : labelPrecision;
            }
            enumeration.pushInstance(instance);
        }

        //todo: wrap all these object getters and other related stuff into an interface
        private getValueAxisValues(enumeration: ObjectEnumerationBuilder): void {
            if (!this.valueAxisProperties) {
                return;
            }
            let scaleOptions = [axisScale.log, axisScale.linear];  //until options can be update in propPane, show all options
            let logPossible = this.axes.isLogScaleAllowed(AxisLocation.Y1);
            let secLogPossible = this.axes.isLogScaleAllowed(AxisLocation.Y2);

            let instance: VisualObjectInstance = {
                selector: null,
                properties: {},
                objectName: 'valueAxis',
                validValues: {
                    axisScale: scaleOptions,
                    secAxisScale: scaleOptions,
                    axisStyle: this.axes.valueAxisHasUnitType ? [axisStyle.showTitleOnly, axisStyle.showUnitOnly, axisStyle.showBoth] : [axisStyle.showTitleOnly]
                }
            };

            instance.properties['show'] = this.valueAxisProperties['show'] != null ? this.valueAxisProperties['show'] : true;

            if (!this.axes.isYAxisCategorical()) {
                instance.properties['position'] = this.valueAxisProperties['position'] != null ? this.valueAxisProperties['position'] : yAxisPosition.left;
            }
            instance.properties['axisScale'] = (this.valueAxisProperties['axisScale'] != null && logPossible) ? this.valueAxisProperties['axisScale'] : axisScale.linear;
            instance.properties['start'] = this.valueAxisProperties['start'];
            instance.properties['end'] = this.valueAxisProperties['end'];
            instance.properties['showAxisTitle'] = this.valueAxisProperties['showAxisTitle'] != null ? this.valueAxisProperties['showAxisTitle'] : false;
            instance.properties['axisStyle'] = this.valueAxisProperties['axisStyle'] != null ? this.valueAxisProperties['axisStyle'] : axisStyle.showTitleOnly;
            instance.properties['labelColor'] = this.valueAxisProperties['labelColor'];

            if (this.type !== CartesianChartType.HundredPercentStackedBar && this.type !== CartesianChartType.HundredPercentStackedColumn) {
                instance.properties['labelDisplayUnits'] = this.valueAxisProperties['labelDisplayUnits'] ? this.valueAxisProperties['labelDisplayUnits'] : 0;
                let labelPrecision = this.valueAxisProperties['labelPrecision'];
                instance.properties['labelPrecision'] = (labelPrecision === undefined || labelPrecision < 0)
                    ? dataLabelUtils.defaultLabelPrecision
                    : labelPrecision;
            }

            enumeration.pushInstance(instance);

            if (this.layers.length === 2) {
                instance.properties['secShow'] = this.valueAxisProperties['secShow'] != null ? this.valueAxisProperties['secShow'] : this.axes.hasY2Axis();
                if (instance.properties['secShow']) {
                    instance.properties['axisLabel'] = '';
                }
            }

            if (this.axes.hasY2Axis() && instance.properties['secShow']) {
                enumeration.pushContainer({
                    displayName: data.createDisplayNameGetter('Visual_YAxis_ShowSecondary'),
                });

                let secInstance: VisualObjectInstance = {
                    selector: null,
                    properties: {},
                    objectName: 'valueAxis'
                };
                secInstance.properties['secAxisLabel'] = '';
                secInstance.properties['secPosition'] = this.valueAxisProperties['secPosition'] != null ? this.valueAxisProperties['secPosition'] : yAxisPosition.right;
                secInstance.properties['secAxisScale'] = this.valueAxisProperties['secAxisScale'] != null && secLogPossible ? this.valueAxisProperties['secAxisScale'] : axisScale.linear;
                secInstance.properties['secStart'] = this.valueAxisProperties['secStart'];
                secInstance.properties['secEnd'] = this.valueAxisProperties['secEnd'];
                secInstance.properties['secShowAxisTitle'] = this.valueAxisProperties['secShowAxisTitle'] != null ? this.valueAxisProperties['secShowAxisTitle'] : false;

                enumeration
                    .pushInstance(secInstance)
                    .pushInstance({
                        selector: null,
                        properties: {
                            secAxisStyle: this.valueAxisProperties['secAxisStyle'] ? this.valueAxisProperties['secAxisStyle'] : axisStyle.showTitleOnly,
                            labelColor: this.valueAxisProperties['secLabelColor'],
                            secLabelDisplayUnits: this.valueAxisProperties['secLabelDisplayUnits'] ? this.valueAxisProperties['secLabelDisplayUnits'] : 0,
                            secLabelPrecision: this.valueAxisProperties['secLabelPrecision'] < 0 ? 0 : this.valueAxisProperties['secLabelPrecision']
                        },
                        objectName: 'valueAxis',
                        validValues: {
                            secAxisStyle: this.axes.secondaryValueAxisHasUnitType ? [axisStyle.showTitleOnly, axisStyle.showUnitOnly, axisStyle.showBoth] : [axisStyle.showTitleOnly]
                        },
                    });

                enumeration.popContainer();
            }
        }

        public onClearSelection(): void {
            if (this.hasSetData) {
                for (let i = 0, len = this.layers.length; i < len; i++) {
                    let layer = this.layers[i];
                    layer.onClearSelection();
                    layer.render(true /* suppressAnimations */);
                }
            }
        }

        private createAndInitLayers(dataViews: DataView[]): ICartesianVisual[] {
            let objects: DataViewObjects;
            if (dataViews && dataViews.length > 0) {
                let dataViewMetadata = dataViews[0].metadata;
                if (dataViewMetadata)
                    objects = dataViewMetadata.objects;
            }
         
            // Create the layers
            let layers = CartesianLayerFactory.createLayers(
                this.type,
                objects,
                this.interactivityService,
                this.animator,
                this.axes.isScrollable,
                this.seriesLabelFormattingEnabled,
                this.tooltipsEnabled,
                this.lineChartLabelDensityEnabled);

            // Initialize the layers
            let cartesianOptions = <CartesianVisualInitOptions>Prototype.inherit(this.visualInitOptions);
            cartesianOptions.svg = this.svgAxes.getScrollableRegion();
            cartesianOptions.labelsContext = this.svgAxes.getLabelsRegion();
            cartesianOptions.cartesianHost = {
                updateLegend: data => this.legend.drawLegend(data, this.currentViewport),
                getSharedColors: () => this.sharedColorPalette,
            };
            cartesianOptions.chartType = this.type;

            for (let i = 0, len = layers.length; i < len; i++)
                layers[i].init(cartesianOptions);

            return layers;
        }

        private renderLegend(): void {
            let layers = this.layers;
            let legendData: LegendData = { title: "", dataPoints: [] };

            for (let i = 0, len = layers.length; i < len; i++) {
                this.layerLegendData = layers[i].calculateLegend();
                if (this.layerLegendData) {
                    legendData.title = i === 0 ? this.layerLegendData.title || ""
                        : legendData.title;
                    legendData.labelColor = this.layerLegendData.labelColor;
                    legendData.dataPoints = legendData.dataPoints.concat(this.layerLegendData.dataPoints || []);
                    legendData.fontSize = this.layerLegendData.fontSize || SVGLegend.DefaultFontSizeInPt;
                    if (this.layerLegendData.grouped) {
                        legendData.grouped = true;
                    }
                }
            }

            let legendProperties = this.legendObjectProperties;

            if (legendProperties) {
                LegendData.update(legendData, legendProperties);
                let position = <string>legendProperties[legendProps.position];

                if (position)
                    this.legend.changeOrientation(LegendPosition[position]);
            }
            else {
                this.legend.changeOrientation(LegendPosition.Top);
            }

            if ((legendData.dataPoints.length === 1 && !legendData.grouped) || this.hideLegends()) {
                legendData.dataPoints = [];
            }

            this.legend.drawLegend(legendData, this.currentViewport);
        }

        private hideLegends(): boolean {
            if (this.cartesianSmallViewPortProperties) {
                if (this.cartesianSmallViewPortProperties.hideLegendOnSmallViewPort && (this.currentViewport.height < this.cartesianSmallViewPortProperties.MinHeightLegendVisible)) {
                    return true;
                }
            }
            return false;
        }

        private render(suppressAnimations: boolean): void {
            // Note: interactive legend shouldn't be rendered explicitly here
            // The interactive legend is being rendered in the render method of ICartesianVisual
            if (!(this.visualInitOptions.interactivity && this.visualInitOptions.interactivity.isInteractiveLegend)) {
                this.renderLegend();
            }

            let legendMargins = this.legendMargins = this.legend.getMargins();
            let hideAxisLabels = this.hideAxisLabels(legendMargins);

            let viewport: IViewport = {
                height: this.currentViewport.height - legendMargins.height,
                width: this.currentViewport.width - legendMargins.width
            };

            let padding = Prototype.inherit(AxisPadding);
            if (this.isPlayAxis()) {
                viewport.height -= CartesianChart.PlayAxisBottomMargin;
            }

            this.svg.attr({
                'width': viewport.width,
                'height': viewport.height
            });

            let axesLayout = this.axes.negotiateAxes(
                this.layers,
                viewport,
                padding,
                hideAxisLabels,
                CartesianChart.TextProperties
            );

            this.scrollableAxes.render(axesLayout, this.layers, suppressAnimations, (layers, axesLayout, suppressAnimations) => this.renderPlotArea(layers, axesLayout, suppressAnimations, legendMargins));
        }

        private getPlotAreaRect(axesLayout: CartesianAxesLayout, legendMargins: IViewport): IRect {
            let rect: Rect = {
                left: axesLayout.margin.left,
                top: axesLayout.margin.top,
                width: axesLayout.plotArea.width,
                height: axesLayout.plotArea.height,
            };

            // Adjust the margins to the legend position 
            if (this.legend) {
                let legendPosition = this.legend.getOrientation();

                if (legendPosition === LegendPosition.Top || legendPosition === LegendPosition.TopCenter) {
                    rect.top += legendMargins.height;
                }
                else if (legendPosition === LegendPosition.Left || legendPosition === LegendPosition.LeftCenter) {
                    rect.left += legendMargins.width;
                }
            }

            return rect;
        }

        private renderBackgroundImage(layout: IRect): void {
            visualBackgroundHelper.renderBackgroundImage(
                this.background,
                this.element,
                layout);
        }

        private hideAxisLabels(legendMargins: IViewport): boolean {
            if (this.cartesianSmallViewPortProperties) {
                if (this.cartesianSmallViewPortProperties.hideAxesOnSmallViewPort && ((this.currentViewport.height + legendMargins.height) < this.cartesianSmallViewPortProperties.MinHeightAxesVisible) && !this.visualInitOptions.interactivity.isInteractiveLegend) {
                    return true;
                }
            }
            return false;
        }

        private renderPlotArea(
            layers: ICartesianVisual[],
            axesLayout: CartesianAxesLayout,
            suppressAnimations: boolean,
            legendMargins: IViewport) {
            debug.assertValue(layers, 'layers');

            let axes = axesLayout.axes;
            let plotArea = axesLayout.plotArea;
            let plotAreaRect = this.getPlotAreaRect(axesLayout, legendMargins);
            let duration = AnimatorCommon.GetAnimationDuration(this.animator, suppressAnimations);

            this.renderBackgroundImage(plotAreaRect);

            this.svgAxes.renderAxes(axesLayout, duration);

            this.renderReferenceLines(axesLayout);

            this.renderLayers(layers, plotArea, axes, suppressAnimations);
        }

        private renderReferenceLines(axesLayout: CartesianAxesLayout): void {
            let axes = axesLayout.axes;
            let plotArea = axesLayout.plotArea;
            let scrollableRegion = this.svgAxes.getScrollableRegion();
            let refLineDefaultColor = this.sharedColorPalette.getColorByIndex(0).value;

            let showY1ReferenceLines = false;
            if (this.y1AxisReferenceLines) {
                for (let referenceLineProperties of this.y1AxisReferenceLines) {
                    let object: DataViewObject = referenceLineProperties.object;
                    if (object[ReferenceLineHelper.referenceLineProps.show]) {

                        let isHorizontal = !axes.y1.isCategoryAxis;
                        let y1RefLineOptions = {
                            graphicContext: scrollableRegion,
                            referenceLineProperties: object,
                            axes: axes,
                            viewport: plotArea,
                            classAndSelector: this.y1RefLine,
                            defaultColor: refLineDefaultColor,
                            isHorizontal: isHorizontal
                        };

                        ReferenceLineHelper.render(y1RefLineOptions);
                        showY1ReferenceLines = true;
                    }
                }
            }

            if (!showY1ReferenceLines) {
                scrollableRegion.selectAll(this.y1RefLine.selector).remove();
            }

            let showXReferenceLines = false;
            if (this.xAxisReferenceLines) {
                for (let referenceLineProperties of this.xAxisReferenceLines) {
                    let object: DataViewObject = referenceLineProperties.object;
                    if (object[ReferenceLineHelper.referenceLineProps.show]) {
                        let isHorizontal = false;
                        let xRefLineOptions = {
                            graphicContext: scrollableRegion,
                            referenceLineProperties: object,
                            axes: axes,
                            viewport: plotArea,
                            classAndSelector: this.xRefLine,
                            defaultColor: refLineDefaultColor,
                            isHorizontal: isHorizontal
                        };

                        ReferenceLineHelper.render(xRefLineOptions);
                        showXReferenceLines = true;
                    }
                }
            }

            if (!showXReferenceLines) {
                scrollableRegion.selectAll(this.xRefLine.selector).remove();
            }
        }

        private getReferenceLineDataLabels(axes: CartesianAxisProperties, plotArea: IViewport): LabelDataPoint[] {
            let refLineDefaultColor = this.sharedColorPalette.getColorByIndex(0).value;
            let referenceLineLabels: LabelDataPoint[] = [];
            if (this.y1AxisReferenceLines) {
                for (let referenceLineProperties of this.y1AxisReferenceLines) {
                    let object: DataViewObject = referenceLineProperties.object;
                    if (object[ReferenceLineHelper.referenceLineProps.show] && object[ReferenceLineHelper.referenceLineProps.dataLabelShow]) {
                        let isHorizontal = !axes.y1.isCategoryAxis;
                        let y1RefLineLabelOptions: ReferenceLineDataLabelOptions = {
                            referenceLineProperties: object,
                            axes: axes,
                            viewport: plotArea,
                            defaultColor: refLineDefaultColor,
                            isHorizontal: isHorizontal
                        };

                        referenceLineLabels.push(ReferenceLineHelper.createLabelDataPoint(y1RefLineLabelOptions));
                    }
                }
            }

            if (this.xAxisReferenceLines) {
                for (let referenceLineProperties of this.xAxisReferenceLines) {
                    let object: DataViewObject = referenceLineProperties.object;
                    if (object[ReferenceLineHelper.referenceLineProps.show] && object[ReferenceLineHelper.referenceLineProps.dataLabelShow]) {
                        let isHorizontal = false;
                        let xRefLineLabelOptions: ReferenceLineDataLabelOptions = {
                            referenceLineProperties: object,
                            axes: axes,
                            viewport: plotArea,
                            defaultColor: refLineDefaultColor,
                            isHorizontal: isHorizontal
                        };

                        referenceLineLabels.push(ReferenceLineHelper.createLabelDataPoint(xRefLineLabelOptions));
                    }
                }
            }

            return referenceLineLabels;
        }

        private renderDataLabels(labelDataPointGroups: LabelDataPointsGroup[], labelsAreNumeric: boolean, plotArea: IViewport, suppressAnimations: boolean, isCombo: boolean): void {
            let labelBackgroundRegion = this.svgAxes.getLabelBackground();
            let labelRegion = this.svgAxes.getLabelsRegion();

            if (this.behavior) {
                let labelLayoutOptions = NewDataLabelUtils.getDataLabelLayoutOptions(this.type);
                let labelLayout = new LabelLayout(labelLayoutOptions);
                let dataLabels = labelLayout.layout(labelDataPointGroups, plotArea);

                if (isCombo) {
                    NewDataLabelUtils.drawLabelBackground(labelBackgroundRegion, dataLabels, "#FFFFFF", 0.7);
                }

                let svgLabels: D3.UpdateSelection;
                if (this.animator && !suppressAnimations) {
                    let isPlayAxis = this.isPlayAxis();
                    let duration = isPlayAxis ? PlayChart.FrameAnimationDuration : this.animator.getDuration();
                    svgLabels = NewDataLabelUtils.animateDefaultLabels(labelRegion, dataLabels, duration, labelsAreNumeric, isPlayAxis ? 'linear' : undefined);
                }
                else {
                    svgLabels = NewDataLabelUtils.drawDefaultLabels(labelRegion, dataLabels, labelsAreNumeric);
                }

                if (labelLayoutOptions.allowLeaderLines) {
                    let filteredLabels = _.filter(dataLabels, (d: Label) => d.leaderLinePoints != null && !_.isEmpty(d.leaderLinePoints) && d.identity != null);
                    NewDataLabelUtils.drawLabelLeaderLines(labelRegion, filteredLabels, (d: Label) => d.identity.getKey());
                }

                if (this.interactivityService && this.isLabelInteractivityEnabled) {
                    let labelsBehaviorOptions: LabelsBehaviorOptions = {
                        labelItems: svgLabels,
                    };
                    this.interactivityService.bind(dataLabels, new LabelsBehavior(), labelsBehaviorOptions, { isLabels: true });
                }
            }
            else {
                let labelLayout = new LabelLayout({
                    maximumOffset: NewDataLabelUtils.maxLabelOffset,
                    startingOffset: NewDataLabelUtils.startingLabelOffset
                });

                let dataLabels = labelLayout.layout(labelDataPointGroups, plotArea);

                if (isCombo) {
                    NewDataLabelUtils.drawLabelBackground(labelBackgroundRegion, dataLabels, "#FFFFFF", 0.7);
                }
                NewDataLabelUtils.drawDefaultLabels(labelRegion, dataLabels, labelsAreNumeric);
            }
        }

        private renderLayers(layers: ICartesianVisual[], plotArea: IViewport, axes: CartesianAxisProperties, suppressAnimations: boolean): void {
            let labelDataPointGroups: LabelDataPointsGroup[] = [];
            let dataPoints: SelectableDataPoint[] = [];
            let layerBehaviorOptions: any[] = [];
            let labelsAreNumeric: boolean = true;
            for (let i = 0, len = layers.length; i < len; i++) {
                let result = layers[i].render(suppressAnimations);
                if (result) {
                    if (this.behavior) {
                        // NOTE: these are not needed if we don't have interactivity
                        dataPoints = dataPoints.concat(result.dataPoints);
                        layerBehaviorOptions.push(result.behaviorOptions);
                    }

                    if (result.labelDataPointGroups) {
                        let resultLabelDataPointsGroups = result.labelDataPointGroups;
                        for (let resultLabelDataPointsGroup of resultLabelDataPointsGroups) {
                            labelDataPointGroups.push({
                                labelDataPoints: NewDataLabelUtils.removeDuplicates(resultLabelDataPointsGroup.labelDataPoints),
                                maxNumberOfLabels: resultLabelDataPointsGroup.maxNumberOfLabels,
                            });
                        }
                    }
                    else {
                        let resultsLabelDataPoints = result.labelDataPoints;
                        labelDataPointGroups.push({
                            labelDataPoints: NewDataLabelUtils.removeDuplicates(resultsLabelDataPoints),
                            maxNumberOfLabels: resultsLabelDataPoints.length,
                        });
                    }

                    labelsAreNumeric = labelsAreNumeric && result.labelsAreNumeric;
                }
            }

            let referenceLineDataLabels = this.getReferenceLineDataLabels(axes, plotArea);
            if (!_.isEmpty(referenceLineDataLabels)) {
                labelDataPointGroups.unshift({
                    labelDataPoints: referenceLineDataLabels,
                    maxNumberOfLabels: referenceLineDataLabels.length,
                });
            }

            this.renderDataLabels(
                labelDataPointGroups,
                labelsAreNumeric,
                plotArea,
                suppressAnimations,
                (layers.length > 1));

            if (this.interactivityService) {
                let behaviorOptions: CartesianBehaviorOptions = {
                    layerOptions: layerBehaviorOptions,
                    clearCatcher: this.clearCatcher,
                };

                if (this.isPlayAxis()) {
                    let cartesianPlayBehavior = new CartesianChartBehavior([new PlayChartWebBehavior()]);
                    // the visual doesn't have its behavior available, so we have to set the child behavior on the playBehaviorOptions here.
                    (<PlayBehaviorOptions>layerBehaviorOptions[0]).visualBehavior = this.behavior['behaviors'][0];
                    this.interactivityService.bind(dataPoints, cartesianPlayBehavior, behaviorOptions);
                }
                else {
                    this.interactivityService.bind(dataPoints, this.behavior, behaviorOptions);
                }
            }
        }

        /**
         * Returns the actual viewportWidth if visual is not scrollable.
         * @return If visual is scrollable, returns the plot area needed to draw all the datapoints.
         */
        public static getPreferredPlotArea(
            categoryCount: number,
            categoryThickness: number,
            viewport: IViewport,
            isScrollable: boolean,
            isScalar: boolean): IViewport {

            let preferredViewport: IViewport = {
                height: viewport.height,
                width: viewport.width
            };
            if (!isScalar && isScrollable) {
                let preferredWidth = CartesianChart.getPreferredCategorySpan(categoryCount, categoryThickness);
                preferredViewport.width = Math.max(preferredWidth, viewport.width);
            }
            return preferredViewport;
        }

        /**
         * Returns preferred Category span if the visual is scrollable.
         */
        public static getPreferredCategorySpan(categoryCount: number, categoryThickness: number): number {
            return categoryThickness * (categoryCount + (CartesianChart.OuterPaddingRatio * 2));
        }
        
        /**
         * Note: Public for testing access.
         */
        public static getLayout(data: ColumnChartData, options: CategoryLayoutOptions): CategoryLayout {
            let categoryCount = options.categoryCount,
                availableWidth = options.availableWidth,
                domain = options.domain,
                isScalar = !!options.isScalar,
                isScrollable = !!options.isScrollable;

            let categoryThickness = CartesianChart.getCategoryThickness(data ? data.series : null, categoryCount, availableWidth, domain, isScalar);

            // Total width of the outer padding, the padding that exist on the far right and far left of the chart.
            let totalOuterPadding = categoryThickness * CartesianChart.OuterPaddingRatio * 2;

            // visibleCategoryCount will be used to discard data that overflows on ordinal-axis charts.
            // Needed for dashboard visuals            
            let calculatedBarCount = Math.round((availableWidth - totalOuterPadding) / categoryThickness);
            let visibleCategoryCount = Math.min(calculatedBarCount, categoryCount);

            let outerPaddingRatio = CartesianChart.OuterPaddingRatio;
            if (!isScalar) {
                // use dynamic outer padding
                let oneOuterPadding = (availableWidth - (categoryThickness * visibleCategoryCount)) / 2;
                outerPaddingRatio = oneOuterPadding / categoryThickness;
            }

            // If scrollable, visibleCategoryCount will be total categories
            if (!isScalar && isScrollable)
                visibleCategoryCount = categoryCount;

            return {
                categoryCount: visibleCategoryCount,
                categoryThickness: categoryThickness,
                outerPaddingRatio: outerPaddingRatio,
                isScalar: isScalar
            };
        }

        /** 
         * Returns the thickness for each category.
         * For clustered charts, you still need to divide by
         * the number of series to get column width after calling this method.
         * For linear or time scales, category thickness accomodates for
         * the minimum interval between consequtive points.
         * For all types, return value has accounted for outer padding,
         * but not inner padding.
         */
        public static getCategoryThickness(seriesList: CartesianSeries[], numCategories: number, plotLength: number, domain: number[], isScalar: boolean): number {
            let thickness;
            if (numCategories < 2)
                thickness = plotLength * (1 - CartesianChart.OuterPaddingRatio);
            else if (isScalar && domain && domain.length > 1) {
                // the smallest interval defines the column width.
                let minInterval = CartesianChart.getMinInterval(seriesList);
                let domainSpan = domain[domain.length - 1] - domain[0];
                // account for outside padding
                let ratio = minInterval / (domainSpan + (minInterval * CartesianChart.OuterPaddingRatio * 2));
                thickness = plotLength * ratio;
                thickness = Math.max(thickness, CartesianChart.MinScalarRectThickness);
            }
            else {
                // Divide the available width up including outer padding (in terms of category thickness) on
                // both sides of the chart, and categoryCount categories. Reverse math:
                // availableWidth = (categoryThickness * categoryCount) + (categoryThickness * (outerPadding * 2)),
                // availableWidth = categoryThickness * (categoryCount + (outerPadding * 2)),
                // categoryThickness = availableWidth / (categoryCount + (outerpadding * 2))
                thickness = plotLength / (numCategories + (CartesianChart.OuterPaddingRatio * 2));
                thickness = Math.max(thickness, CartesianChart.MinOrdinalRectThickness);
            }
            
            // spec calls for using the whole plot area, but the max rectangle thickness is "as if there were three categories"
            // (outerPaddingRatio has the same units as '# of categories' so they can be added)
            let maxRectThickness = plotLength / (3 + (CartesianChart.OuterPaddingRatio * 2));

            if (!isScalar && numCategories >= 3)
                return Math.max(Math.min(thickness, maxRectThickness), CartesianChart.MinOrdinalRectThickness);

            return Math.min(thickness, maxRectThickness);
        }

        private static getMinInterval(seriesList: CartesianSeries[]): number {
            let minInterval = Number.MAX_VALUE;
            if (seriesList.length > 0) {
                let series0data = seriesList[0].data.filter(d => !d.highlight);
                for (let i = 0, ilen = series0data.length - 1; i < ilen; i++) {
                    minInterval = Math.min(minInterval, Math.abs(series0data[i + 1].categoryValue - series0data[i].categoryValue));
                }
            }
            return minInterval;
        }
    }

    function getLayerData(dataViews: DataView[], currentIdx: number, totalLayers: number): DataView[] {
        if (totalLayers > 1) {
            if (dataViews && dataViews.length > currentIdx)
                return [dataViews[currentIdx]];
            return [];
        }

        return dataViews;
    }

    function hasMultipleYAxes(layers: ICartesianVisual[]): boolean {
        debug.assertValue(layers, 'layers');

        return layers.length > 1;
    }

    /**
     * Returns a boolean, that indicates if y axis title should be displayed.
     * @return True if y axis title should be displayed,
     * otherwise false.
     */
    function shouldShowYAxisLabel(layerNumber: number, valueAxisProperties: DataViewObject, yAxisWillMerge: boolean): boolean {
        return ((layerNumber === 0 && !!valueAxisProperties && !!valueAxisProperties['showAxisTitle']) ||
            (layerNumber === 1 && !yAxisWillMerge && !!valueAxisProperties && !!valueAxisProperties['secShowAxisTitle']));
    }

    function tryMergeYDomains(layers: ICartesianVisual[], visualOptions: CalculateScaleAndDomainOptions): MergedValueAxisResult {
        debug.assert(layers.length < 3, 'merging of more than 2 layers is not supported');

        let noMerge: MergedValueAxisResult = {
            domain: undefined,
            merged: false,
            tickCount: undefined,
            forceStartToZero: false
        };

        if (layers.length < 2)
            return noMerge;

        let min: number;
        let max: number;
        let minOfMax: number;
        let maxOfMin: number;

        // TODO: replace full calculateAxesProperties with just a data domain calc
        // we need to be aware of which chart require zero (column/bar) and which don't (line)
        let y1props = layers[0].calculateAxesProperties(visualOptions)[1];
        let y2props = layers[1].calculateAxesProperties(visualOptions)[1];
        let firstYDomain = y1props.scale.domain();
        let secondYDomain = y2props.scale.domain();

        if (firstYDomain[0] >= 0 && secondYDomain[0] >= 0) {
            noMerge.forceStartToZero = true;
        }

        if (y1props.values && y1props.values.length > 0 && y2props.values && y2props.values.length > 0) {
            noMerge.tickCount = Math.max(y1props.values.length, y2props.values.length);
        }

        min = Math.min(firstYDomain[0], secondYDomain[0]);
        max = Math.max(firstYDomain[1], secondYDomain[1]);

        if (visualOptions.forceMerge) {
            return {
                domain: [min, max],
                merged: true,
                tickCount: noMerge.tickCount,
                forceStartToZero: false
            };
        }

        // If domains don't intersect don't merge axis.
        if (firstYDomain[0] > secondYDomain[1] || firstYDomain[1] < secondYDomain[0])
            return noMerge;

        maxOfMin = Math.max(firstYDomain[0], secondYDomain[0]);
        minOfMax = Math.min(firstYDomain[1], secondYDomain[1]);

        let range = (max - min);

        if (range === 0) {
            return noMerge;
        }

        let intersection = Math.abs((minOfMax - maxOfMin) / range);

        // Only merge if intersection of domains greater than 10% of total range.
        if (intersection < COMBOCHART_DOMAIN_OVERLAP_TRESHOLD_PERCENTAGE)
            return noMerge;
        else
            return {
                domain: [min, max],
                merged: true,
                tickCount: noMerge.tickCount,
                forceStartToZero: false
            };
    }

    /** 
     * Computes the Cartesian Chart axes from the set of layers.
     */
    function calculateAxes(
        layers: ICartesianVisual[],
        viewport: IViewport,
        margin: IMargin,
        categoryAxisProperties: DataViewObject,
        valueAxisProperties: DataViewObject,
        textProperties: TextProperties,
        scrollbarVisible: boolean,
        existingAxisProperties: CartesianAxisProperties): CartesianAxisProperties {
        debug.assertValue(layers, 'layers');

        let visualOptions: CalculateScaleAndDomainOptions = {
            viewport: viewport,
            margin: margin,
            forcedXDomain: [categoryAxisProperties ? categoryAxisProperties['start'] : null, categoryAxisProperties ? categoryAxisProperties['end'] : null],
            forceMerge: valueAxisProperties && valueAxisProperties['secShow'] === false,
            showCategoryAxisLabel: false,
            showValueAxisLabel: false,
            categoryAxisScaleType: categoryAxisProperties && categoryAxisProperties['axisScale'] != null ? <string>categoryAxisProperties['axisScale'] : axisScale.linear,
            valueAxisScaleType: valueAxisProperties && valueAxisProperties['axisScale'] != null ? <string>valueAxisProperties['axisScale'] : axisScale.linear,
            categoryAxisDisplayUnits: categoryAxisProperties && categoryAxisProperties['labelDisplayUnits'] != null ? <number>categoryAxisProperties['labelDisplayUnits'] : 0,
            valueAxisDisplayUnits: valueAxisProperties && valueAxisProperties['labelDisplayUnits'] != null ? <number>valueAxisProperties['labelDisplayUnits'] : 0,
            categoryAxisPrecision: categoryAxisProperties ? CartesianHelper.getPrecision(categoryAxisProperties['labelPrecision']) : null,
            valueAxisPrecision: valueAxisProperties ? CartesianHelper.getPrecision(valueAxisProperties['labelPrecision']) : null
        };

        let skipMerge = valueAxisProperties && valueAxisProperties['secShow'] === true;
        let yAxisWillMerge = false;
        let mergeResult: MergedValueAxisResult;
        if (hasMultipleYAxes(layers) && !skipMerge) {
            mergeResult = tryMergeYDomains(layers, visualOptions);
            yAxisWillMerge = mergeResult.merged;
            if (yAxisWillMerge) {
                visualOptions.forcedYDomain = mergeResult.domain;
            }
            else {
                visualOptions.forcedTickCount = mergeResult.tickCount;
            }
        }

        if (valueAxisProperties) {
            visualOptions.forcedYDomain = AxisHelper.applyCustomizedDomain([valueAxisProperties['start'], valueAxisProperties['end']], visualOptions.forcedYDomain);
        }

        let result: CartesianAxisProperties;
        for (let layerNumber = 0, len = layers.length; layerNumber < len; layerNumber++) {
            let currentlayer = layers[layerNumber];

            if (layerNumber === 1 && !yAxisWillMerge) {
                visualOptions.forcedYDomain = valueAxisProperties ? [valueAxisProperties['secStart'], valueAxisProperties['secEnd']] : null;
                visualOptions.valueAxisScaleType = valueAxisProperties && valueAxisProperties['secAxisScale'] != null ? <string>valueAxisProperties['secAxisScale'] : axisScale.linear;
                visualOptions.valueAxisDisplayUnits = valueAxisProperties && valueAxisProperties['secLabelDisplayUnits'] != null ? <number>valueAxisProperties['secLabelDisplayUnits'] : 0;
                visualOptions.valueAxisPrecision = valueAxisProperties ? CartesianHelper.getPrecision(valueAxisProperties['secLabelPrecision']) : null;
                if (mergeResult && mergeResult.forceStartToZero) {
                    if (!visualOptions.forcedYDomain) {
                        visualOptions.forcedYDomain = [0, undefined];
                    }
                    else if (visualOptions.forcedYDomain[0] == null) {
                        visualOptions.forcedYDomain[0] = 0;//only set when user didn't choose a value
                    }
                }
            }
            visualOptions.showCategoryAxisLabel = (!!categoryAxisProperties && !!categoryAxisProperties['showAxisTitle']);//here

            visualOptions.showValueAxisLabel = shouldShowYAxisLabel(layerNumber, valueAxisProperties, yAxisWillMerge);

            let axes = currentlayer.calculateAxesProperties(visualOptions);

            if (layerNumber === 0) {
                result = {
                    x: axes[0],
                    y1: axes[1]
                };
            }
            else if (axes && !result.y2) {
                if (axes[0].axis.scale().domain().length > result.x.axis.scale().domain().length) {
                    visualOptions.showValueAxisLabel = (!!valueAxisProperties && !!valueAxisProperties['showAxisTitle']);

                    let axes = currentlayer.calculateAxesProperties(visualOptions);
                    // no categories returned for the first layer, use second layer x-axis properties
                    result.x = axes[0];
                    // and 2nd value axis to be the primary
                    result.y1 = axes[1];
                }
                else {
                    // make sure all layers use the same x-axis/scale for drawing
                    currentlayer.overrideXScale(result.x);
                    if (!yAxisWillMerge && !axes[1].usingDefaultDomain)
                        result.y2 = axes[1];
                }
            }

            if (existingAxisProperties && existingAxisProperties.x) {
                result.x.willLabelsFit = existingAxisProperties.x.willLabelsFit;
                result.x.willLabelsWordBreak = existingAxisProperties.x.willLabelsWordBreak;
            } else {
                let width = viewport.width - (margin.left + margin.right);
                result.x.willLabelsFit = AxisHelper.LabelLayoutStrategy.willLabelsFit(
                    result.x,
                    width,
                    TextMeasurementService.measureSvgTextWidth,
                    textProperties);

                // If labels do not fit and we are not scrolling, try word breaking
                result.x.willLabelsWordBreak = (!result.x.willLabelsFit && !scrollbarVisible) && AxisHelper.LabelLayoutStrategy.willLabelsWordBreak(
                    result.x,
                    margin,
                    width,
                    TextMeasurementService.measureSvgTextWidth,
                    TextMeasurementService.estimateSvgTextHeight,
                    TextMeasurementService.getTailoredTextOrDefault,
                    textProperties);
            }
        }

        return result;
    }

    const enum AxisLocation {
        X,
        Y1,
        Y2,
    }

    interface CartesianAxesLayout {
        axes: CartesianAxisProperties;
        margin: IMargin;
        marginLimits: IMargin;
        axisLabels: ChartAxesLabels;
        viewport: IViewport;
        plotArea: IViewport;
        preferredPlotArea: IViewport;
        tickLabelMargins: any;
    }

    class SvgBrush {
        private element: D3.Selection;
        private brushGraphicsContext: D3.Selection;
        private brushContext: D3.Selection;
        private brush: D3.Svg.Brush;
        private brushWidth: number;
        private scrollCallback: () => void;
        private isHorizontal: boolean;

        private static Brush = createClassAndSelector('brush');
        private static FillOpacity = 0.125;

        constructor(brushWidth: number) {
            this.brush = d3.svg.brush();
            this.brushWidth = brushWidth;
        }

        public init(element: D3.Selection): void {
            this.element = element;
        }

        public remove(): void {
            this.element.selectAll(SvgBrush.Brush.selector).remove();
            this.brushGraphicsContext = undefined;
        }

        public getExtent(): number[] {
            return this.brush.extent();
        }

        public setExtent(extent: number[]): void {
            this.brush.extent(extent);
        }

        public setScale(scale: D3.Scale.OrdinalScale): void {
            if (this.isHorizontal)
                this.brush.x(scale);
            else
                this.brush.y(scale);
        }

        public setOrientation(isHorizontal: boolean): void {
            this.isHorizontal = isHorizontal;
        }

        public renderBrush(
            extentLength: number,
            brushX: number,
            brushY: number,
            scrollCallback: () => void): void {
            if (!this.brushGraphicsContext) {
                this.brushGraphicsContext = this.element.append("g")
                    .classed(SvgBrush.Brush.class, true);
            }

            this.scrollCallback = scrollCallback;

            this.brush
                .on("brush", () => window.requestAnimationFrame(scrollCallback))
                .on("brushend", () => this.resizeExtent(extentLength, this.isHorizontal));

            let brushContext = this.brushContext = this.brushGraphicsContext
                .attr({
                    "transform": SVGUtil.translate(brushX, brushY),
                    "drag-resize-disabled": "true" /* Disables resizing of the visual when dragging the scrollbar in edit mode */
                })
                .call(this.brush);
              
            /* Disabling the zooming feature */
            brushContext.selectAll(".resize rect")
                .remove();

            brushContext.select(".background")
                .style('cursor', 'default');

            brushContext.selectAll(".extent")
                .style({
                    "fill-opacity": SvgBrush.FillOpacity,
                    "cursor": "default",
                });

            if (this.isHorizontal)
                brushContext.selectAll("rect").attr("height", this.brushWidth);
            else
                brushContext.selectAll("rect").attr("width", this.brushWidth);
        }

        public scroll(): void {
            this.scrollCallback();
        }

        private resizeExtent(extentLength: number, isHorizontal: boolean): void {
            let brushContext = this.brushContext;
            if (isHorizontal)
                brushContext.select(".extent").attr("width", extentLength);
            else
                brushContext.select(".extent").attr("height", extentLength);
        }
    }
    
    class ScrollableAxes {
        public static ScrollbarWidth = 10;

        private brush: SvgBrush;
        private brushMinExtent: number;
        private scrollScale: D3.Scale.OrdinalScale;

        private axes: CartesianAxes;

        constructor(axes: CartesianAxes, svgBrush: SvgBrush) {
            this.axes = axes;
            this.brush = svgBrush;
        }

        private filterDataToViewport(mainAxisScale: D3.Scale.OrdinalScale, layers: ICartesianVisual[], axes: CartesianAxisProperties, scrollScale: D3.Scale.OrdinalScale, extent: number[]): void {
            if (scrollScale) {
                let selected: number[];
                let data: CartesianData[] = [];

                let startValue = extent[0];
                let endValue = extent[1];

                let pixelStepSize = scrollScale(1) - scrollScale(0);
                let startIndex = Math.floor(startValue / pixelStepSize);
                let sliceLength = Math.ceil((endValue - startValue) / pixelStepSize);
                let endIndex = startIndex + sliceLength; // NOTE: Intentionally one past the end index for use with slice(start,end)
                let domain = scrollScale.domain();

                mainAxisScale.domain(domain);
                selected = domain.slice(startIndex, endIndex); // NOTE: Up to but not including 'end'
                if (selected && selected.length > 0) {
                    for (let i = 0; i < layers.length; i++) {
                        data[i] = layers[i].setFilteredData(selected[0], selected[selected.length - 1] + 1);
                    }
                    mainAxisScale.domain(selected);

                    let axisPropsToUpdate: IAxisProperties;
                    if (this.axes.isXScrollBarVisible) {
                        axisPropsToUpdate = axes.x;
                    }
                    else {
                        axisPropsToUpdate = axes.y1;
                    }

                    axisPropsToUpdate.axis.scale(mainAxisScale);
                    axisPropsToUpdate.scale(mainAxisScale);

                    // tick values are indices for ordinal axes
                    axisPropsToUpdate.axis.ticks(selected.length);
                    axisPropsToUpdate.axis.tickValues(selected); 

                    // use the original tick format to format the tick values
                    let tickFormat = axisPropsToUpdate.axis.tickFormat();
                    axisPropsToUpdate.values = _.map(selected, (d) => tickFormat(d));
                }
            }
        }

        public render(axesLayout: CartesianAxesLayout, layers: ICartesianVisual[], suppressAnimations: boolean, renderDelegate: RenderPlotAreaDelegate): void {
            let plotArea = axesLayout.plotArea;

            let axisScale: D3.Scale.OrdinalScale;
            let brushX: number;
            let brushY: number;
            let scrollableLength: number;
            let scrollbarLength: number;
            if (this.axes.isXScrollBarVisible) {
                axisScale = <D3.Scale.OrdinalScale>axesLayout.axes.x.scale;
                brushX = axesLayout.margin.left;
                brushY = axesLayout.viewport.height;  // - scrollbar width
                scrollableLength = axesLayout.preferredPlotArea.width;
                scrollbarLength = plotArea.width;
            }
            else if (this.axes.isYScrollBarVisible) {
                axisScale = <D3.Scale.OrdinalScale>axesLayout.axes.y1.scale;
                brushX = axesLayout.viewport.width;
                brushY = axesLayout.margin.top;
                scrollableLength = axesLayout.preferredPlotArea.height;
                scrollbarLength = plotArea.height;
            }
            else {
                // No scrollbars, render the chart normally.
                this.brush.remove();
                renderDelegate(layers, axesLayout, suppressAnimations);
                return;
            }

            this.brushMinExtent = ScrollableAxes.getMinExtent(scrollableLength, scrollbarLength);
            this.scrollScale = axisScale.copy();
            this.scrollScale.rangeBands([0, scrollbarLength]);
            this.brush.setOrientation(this.axes.isXScrollBarVisible);
            this.brush.setScale(this.scrollScale);
            this.brush.setExtent([0, this.brushMinExtent]);

            // This function will be called whenever we scroll.
            let renderOnScroll = (extent: number[], suppressAnimations: boolean) => {
                this.filterDataToViewport(axisScale, layers, axesLayout.axes, this.scrollScale, extent);
                renderDelegate(layers, axesLayout, suppressAnimations);
            };

            let scrollCallback = () => this.onBrushed(this.scrollScale, axisScale, axesLayout, scrollbarLength, renderOnScroll);
            this.brush.renderBrush(this.brushMinExtent, brushX, brushY, scrollCallback);

            // TODO: why modify original scale?
            axisScale.rangeBands([0, scrollbarLength]);
            renderOnScroll(this.brush.getExtent(), suppressAnimations);
        }

        public scrollTo(position: number): void {
            debug.assert(this.axes.isXScrollBarVisible || this.axes.isYScrollBarVisible, 'scrolling is not available');
            debug.assertValue(this.scrollScale, 'scrollScale');

            let extent = this.brush.getExtent();
            let extentLength = extent[1] - extent[0];
            extent[0] = this.scrollScale(position);
            extent[1] = extent[0] + extentLength;
            this.brush.setExtent(extent);

            let scrollbarLength = this.scrollScale.rangeExtent()[1];
            ScrollableAxes.clampBrushExtent(this.brush, scrollbarLength, this.brushMinExtent);
            this.brush.scroll();
        }

        private static getMinExtent(scrollableLength: number, scrollbarLength: number): number {
            return scrollbarLength * scrollbarLength / (scrollableLength);
        }

        private onBrushed(scrollScale: any, mainAxisScale: any, axesLayout, scrollbarLength: number, render: (extent: number[], suppressAnimations: boolean) => void): void {
            let brush = this.brush;

            if (mainAxisScale && scrollScale) {
                ScrollableAxes.clampBrushExtent(this.brush, scrollbarLength, this.brushMinExtent);
                let extent = brush.getExtent();
                render(extent, /* suppressAnimations */ true);
            }
        }

        private static clampBrushExtent(brush: SvgBrush, scrollbarLength: number, minExtent: number): void {
            let extent = brush.getExtent();
            let width = extent[1] - extent[0];

            if (width === minExtent && extent[1] <= scrollbarLength && extent[0] >= 0)
                return;

            if (width > minExtent) {
                let padding = (width - minExtent) / 2;
                extent[0] += padding;
                extent[1] -= padding;
            }

            else if (width < minExtent) {
                let padding = (minExtent - width) / 2;
                extent[0] -= padding;
                extent[1] += padding;
            }

            if (extent[0] < 0) {
                extent[0] = 0;
                extent[1] = minExtent;
            }

            else if (extent[0] > scrollbarLength - minExtent) {
                extent[0] = scrollbarLength - minExtent;
                extent[1] = scrollbarLength;
            }

            brush.setExtent(extent);
        }
    }

    class SvgCartesianAxes {
        private axisGraphicsContext: D3.Selection;
        private xAxisGraphicsContext: D3.Selection;
        private y1AxisGraphicsContext: D3.Selection;
        private y2AxisGraphicsContext: D3.Selection;
        private svgScrollable: D3.Selection;
        private axisGraphicsContextScrollable: D3.Selection;
        private labelRegion: D3.Selection;
        private labelBackgroundRegion: D3.Selection;

        private categoryAxisProperties: DataViewObject;
        private valueAxisProperties: DataViewObject;

        private static AxisGraphicsContext = createClassAndSelector('axisGraphicsContext');
        private static TickPaddingY = 10;
        private static TickPaddingRotatedX = 5;
        private static AxisLabelFontSize = 11;

        constructor(private axes: CartesianAxes) {
        }

        public getScrollableRegion(): D3.Selection {
            return this.axisGraphicsContextScrollable;
        }

        public getLabelsRegion(): D3.Selection {
            return this.labelRegion;
        }

        public getLabelBackground(): D3.Selection {
            return this.labelBackgroundRegion;
        }

        public getXAxis(): D3.Selection {
            return this.xAxisGraphicsContext;
        }

        public getY1Axis(): D3.Selection {
            return this.y1AxisGraphicsContext;
        }

        public getY2Axis(): D3.Selection {
            return this.y2AxisGraphicsContext;
        }

        public update(categoryAxisProperties: DataViewObject, valueAxisProperties: DataViewObject): void {
            this.categoryAxisProperties = categoryAxisProperties;
            this.valueAxisProperties = valueAxisProperties;
        }

        public init(svg: D3.Selection): void {
            /*
                The layout of the visual will look like:
                <svg>
                    <g>
                        <nonscrollable axis/>
                    </g>
                    <svgScrollable>
                        <g>
                            <scrollable axis/>
                        </g>
                    </svgScrollable>
                    <g xbrush/>
                </svg>

            */

            let axisGraphicsContext = this.axisGraphicsContext = svg.append('g')
                .classed(SvgCartesianAxes.AxisGraphicsContext.class, true);

            this.svgScrollable = svg.append('svg')
                .classed('svgScrollable', true)
                .style('overflow', 'hidden');

            let axisGraphicsContextScrollable = this.axisGraphicsContextScrollable = this.svgScrollable.append('g')
                .classed(SvgCartesianAxes.AxisGraphicsContext.class, true);

            this.labelBackgroundRegion = this.svgScrollable.append('g')
                .classed(NewDataLabelUtils.labelBackgroundGraphicsContextClass.class, true);

            this.labelRegion = this.svgScrollable.append('g')
                .classed(NewDataLabelUtils.labelGraphicsContextClass.class, true);

            let showLinesOnX = this.axes.showLinesOnX;
            let showLinesOnY = this.axes.showLinesOnY;

            // NOTE: We infer the axis which should scroll based on whether or not we draw grid lines for the other axis, and
            // only allow one axis to scroll.
            let scrollX = showLinesOnY;
            let scrollY = !scrollX;
            if (scrollY) {
                this.y1AxisGraphicsContext = axisGraphicsContextScrollable.append('g').attr('class', 'y axis');
                this.y2AxisGraphicsContext = axisGraphicsContextScrollable.append('g').attr('class', 'y axis');
            }
            else {
                this.y1AxisGraphicsContext = axisGraphicsContext.append('g').attr('class', 'y axis');
                this.y2AxisGraphicsContext = axisGraphicsContext.append('g').attr('class', 'y axis');
            }

            if (scrollX) {
                this.xAxisGraphicsContext = axisGraphicsContextScrollable.append('g').attr('class', 'x axis');
            }
            else {
                this.xAxisGraphicsContext = axisGraphicsContext.append('g').attr('class', 'x axis');
            }

            this.xAxisGraphicsContext.classed('showLinesOnAxis', showLinesOnX);
            this.y1AxisGraphicsContext.classed('showLinesOnAxis', showLinesOnY);
            this.y2AxisGraphicsContext.classed('showLinesOnAxis', showLinesOnY);

            this.xAxisGraphicsContext.classed('hideLinesOnAxis', !showLinesOnX);
            this.y1AxisGraphicsContext.classed('hideLinesOnAxis', !showLinesOnY);
            this.y2AxisGraphicsContext.classed('hideLinesOnAxis', !showLinesOnY);
        }

        public renderAxes(axesLayout: CartesianAxesLayout, duration: number): void {
            let marginLimits = axesLayout.marginLimits;
            let plotArea = axesLayout.plotArea;
            let viewport = axesLayout.viewport;
            let margin = axesLayout.margin;
            let axes = axesLayout.axes;
            let tickLabelMargins = axesLayout.tickLabelMargins;

            let bottomMarginLimit = marginLimits.bottom;
            let leftRightMarginLimit = marginLimits.left;

            let xLabelColor: Fill;
            let yLabelColor: Fill;
            let y2LabelColor: Fill;

            if (this.axes.shouldRenderAxis(axes.x)) {
                if (axes.x.isCategoryAxis) {
                    xLabelColor = this.categoryAxisProperties && this.categoryAxisProperties['labelColor'] ? this.categoryAxisProperties['labelColor'] : null;
                } else {
                    xLabelColor = this.valueAxisProperties && this.valueAxisProperties['labelColor'] ? this.valueAxisProperties['labelColor'] : null;
                }
                axes.x.axis.orient("bottom");
                if (!axes.x.willLabelsFit)
                    axes.x.axis.tickPadding(SvgCartesianAxes.TickPaddingRotatedX);

                let xAxisGraphicsElement = this.xAxisGraphicsContext;
                if (duration) {
                    xAxisGraphicsElement
                        .transition()
                        .duration(duration)
                        .call(axes.x.axis);
                }
                else {
                    xAxisGraphicsElement
                        .call(axes.x.axis);
                }

                xAxisGraphicsElement
                    .call(SvgCartesianAxes.darkenZeroLine)
                    .call(SvgCartesianAxes.setAxisLabelColor, xLabelColor);

                let xAxisTextNodes = xAxisGraphicsElement.selectAll('text');
                if (axes.x.willLabelsWordBreak) {
                    xAxisTextNodes
                        .call(AxisHelper.LabelLayoutStrategy.wordBreak, axes.x, bottomMarginLimit);
                } else {
                    xAxisTextNodes
                        .call(AxisHelper.LabelLayoutStrategy.rotate,
                        bottomMarginLimit,
                        TextMeasurementService.svgEllipsis,
                        !axes.x.willLabelsFit,
                        bottomMarginLimit === tickLabelMargins.xMax,
                        axes.x,
                        margin,
                        this.axes.isXScrollBarVisible || this.axes.isYScrollBarVisible);
                }
            }
            else {
                this.xAxisGraphicsContext.selectAll('*').remove();
            }

            if (this.axes.shouldRenderAxis(axes.y1)) {
                if (axes.y1.isCategoryAxis) {
                    yLabelColor = this.categoryAxisProperties && this.categoryAxisProperties['labelColor'] ? this.categoryAxisProperties['labelColor'] : null;
                } else {
                    yLabelColor = this.valueAxisProperties && this.valueAxisProperties['labelColor'] ? this.valueAxisProperties['labelColor'] : null;
                }
                let showY1OnRight = this.axes.shouldShowY1OnRight();
                axes.y1.axis
                    .tickSize(-plotArea.width)
                    .tickPadding(SvgCartesianAxes.TickPaddingY)
                    .orient(this.axes.getYAxisOrientation().toLowerCase());

                let y1AxisGraphicsElement = this.y1AxisGraphicsContext;
                if (duration) {
                    y1AxisGraphicsElement
                        .transition()
                        .duration(duration)
                        .call(axes.y1.axis);
                }
                else {
                    y1AxisGraphicsElement
                        .call(axes.y1.axis);
                }

                y1AxisGraphicsElement
                    .call(SvgCartesianAxes.darkenZeroLine)
                    .call(SvgCartesianAxes.setAxisLabelColor, yLabelColor);

                if (tickLabelMargins.yLeft >= leftRightMarginLimit) {
                    y1AxisGraphicsElement.selectAll('text')
                        .call(AxisHelper.LabelLayoutStrategy.clip,
                        // Can't use padding space to render text, so subtract that from available space for ellipses calculations
                        leftRightMarginLimit - AxisPadding.left,
                        TextMeasurementService.svgEllipsis);
                }

                if (axes.y2 && (!this.valueAxisProperties || this.valueAxisProperties['secShow'] == null || this.valueAxisProperties['secShow'])) {
                    y2LabelColor = this.valueAxisProperties && this.valueAxisProperties['secLabelColor'] ? this.valueAxisProperties['secLabelColor'] : null;

                    axes.y2.axis
                        .tickPadding(SvgCartesianAxes.TickPaddingY)
                        .orient(showY1OnRight ? yAxisPosition.left.toLowerCase() : yAxisPosition.right.toLowerCase());

                    if (duration) {
                        this.y2AxisGraphicsContext
                            .transition()
                            .duration(duration)
                            .call(axes.y2.axis);
                    }
                    else {
                        this.y2AxisGraphicsContext
                            .call(axes.y2.axis);
                    }

                    this.y2AxisGraphicsContext
                        .call(SvgCartesianAxes.darkenZeroLine)
                        .call(SvgCartesianAxes.setAxisLabelColor, y2LabelColor);

                    if (tickLabelMargins.yRight >= leftRightMarginLimit) {
                        this.y2AxisGraphicsContext.selectAll('text')
                            .call(AxisHelper.LabelLayoutStrategy.clip,
                            // Can't use padding space to render text, so subtract that from available space for ellipses calculations
                            leftRightMarginLimit - AxisPadding.right,
                            TextMeasurementService.svgEllipsis);
                    }
                }
                else {
                    this.y2AxisGraphicsContext.selectAll('*').remove();
                }
            }
            else {
                this.y1AxisGraphicsContext.selectAll('*').remove();
                this.y2AxisGraphicsContext.selectAll('*').remove();
            }

            // Axis labels
            //TODO: Add label for second Y axis for combo chart
            let axisLabels = axesLayout.axisLabels;
            let chartHasAxisLabels = (axisLabels.x != null) || (axisLabels.y != null || axisLabels.y2 != null);
            if (chartHasAxisLabels) {
                let hideXAxisTitle = !this.axes.shouldRenderAxisTitle(axes.x, /* defaultValue */ true, /* secondary */ false);
                let hideYAxisTitle = !this.axes.shouldRenderAxisTitle(axes.y1, /* defaultValue */ true,  /* secondary */false);
                let hideY2AxisTitle = !this.axes.shouldRenderAxisTitle(axes.y2, /* defaultValue */ false,  /* secondary */true);

                let renderAxisOptions: AxisRenderingOptions = {
                    axisLabels: axisLabels,
                    viewport: viewport,
                    margin: margin,
                    hideXAxisTitle: hideXAxisTitle,
                    hideYAxisTitle: hideYAxisTitle,
                    hideY2AxisTitle: hideY2AxisTitle,
                    xLabelColor: xLabelColor,
                    yLabelColor: yLabelColor,
                    y2LabelColor: y2LabelColor,
                    fontSize: SvgCartesianAxes.AxisLabelFontSize,
                };

                this.renderAxesLabels(renderAxisOptions);
            }
            else {
                this.axisGraphicsContext.selectAll('.xAxisLabel').remove();
                this.axisGraphicsContext.selectAll('.yAxisLabel').remove();
            }

            this.translateAxes(viewport, margin);
        }

        private renderAxesLabels(options: AxisRenderingOptions): void {
            debug.assertValue(options, 'options');
            debug.assertValue(options.viewport, 'options.viewport');
            debug.assertValue(options.axisLabels, 'options.axisLabels');

            this.axisGraphicsContext.selectAll('.xAxisLabel').remove();
            this.axisGraphicsContext.selectAll('.yAxisLabel').remove();

            let margin = options.margin;
            let width = options.viewport.width - (margin.left + margin.right);
            let height = options.viewport.height;
            let fontSize = options.fontSize;

            let heightOffset = fontSize;
            let showOnRight = this.axes.shouldShowY1OnRight();

            if (!options.hideXAxisTitle) {
                let xAxisLabel = this.axisGraphicsContext.append("text")
                    .style("text-anchor", "middle")
                    .text(options.axisLabels.x)
                    .call((text: D3.Selection) => {
                        text.each(function () {
                            let text = d3.select(this);
                            text.attr({
                                "class": "xAxisLabel",
                                "transform": SVGUtil.translate(width / 2, height - heightOffset)
                            });
                        });
                    });

                xAxisLabel.style("fill", options.xLabelColor ? options.xLabelColor.solid.color : null);

                xAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                    width,
                    TextMeasurementService.svgEllipsis);
            }

            if (!options.hideYAxisTitle) {
                let yAxisLabel = this.axisGraphicsContext.append("text")
                    .style("text-anchor", "middle")
                    .text(options.axisLabels.y)
                    .call((text: D3.Selection) => {
                        text.each(function () {
                            let text = d3.select(this);
                            text.attr({
                                "class": "yAxisLabel",
                                "transform": "rotate(-90)",
                                "y": showOnRight ? width + margin.right - fontSize : -margin.left,
                                "x": -((height - margin.top - margin.bottom) / 2),
                                "dy": "1em",
                            });
                        });
                    });

                yAxisLabel.style("fill", options.yLabelColor ? options.yLabelColor.solid.color : null);

                yAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                    height - (margin.bottom + margin.top),
                    TextMeasurementService.svgEllipsis);
            }

            if (!options.hideY2AxisTitle && options.axisLabels.y2) {
                let y2AxisLabel = this.axisGraphicsContext.append("text")
                    .style("text-anchor", "middle")
                    .text(options.axisLabels.y2)
                    .call((text: D3.Selection) => {
                        text.each(function () {
                            let text = d3.select(this);
                            text.attr({
                                "class": "yAxisLabel",
                                "transform": "rotate(-90)",
                                "y": showOnRight ? -margin.left : width + margin.right - fontSize,
                                "x": -((height - margin.top - margin.bottom) / 2),
                                "dy": "1em",
                            });
                        });
                    });

                y2AxisLabel.style("fill", options.y2LabelColor ? options.y2LabelColor.solid.color : null);

                y2AxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                    height - (margin.bottom + margin.top),
                    TextMeasurementService.svgEllipsis);
            }
        }

        // Margin convention: http://bl.ocks.org/mbostock/3019563
        private translateAxes(viewport: IViewport, margin: IMargin): void {
            let width = viewport.width - (margin.left + margin.right);
            let height = viewport.height - (margin.top + margin.bottom);

            let showY1OnRight = this.axes.shouldShowY1OnRight();

            this.xAxisGraphicsContext
                .attr('transform', SVGUtil.translate(0, height));

            this.y1AxisGraphicsContext
                .attr('transform', SVGUtil.translate(showY1OnRight ? width : 0, 0));

            this.y2AxisGraphicsContext
                .attr('transform', SVGUtil.translate(showY1OnRight ? 0 : width, 0));

            this.svgScrollable.attr({
                'x': 0,
                'width': viewport.width,
                'height': viewport.height
            });

            this.axisGraphicsContext.attr('transform', SVGUtil.translate(margin.left, margin.top));
            this.axisGraphicsContextScrollable.attr('transform', SVGUtil.translate(margin.left, margin.top));
            this.labelRegion.attr('transform', SVGUtil.translate(margin.left, margin.top));
            this.labelBackgroundRegion.attr('transform', SVGUtil.translate(margin.left, margin.top));

            if (this.axes.isXScrollBarVisible) {
                this.svgScrollable.attr({
                    'x': margin.left
                });
                this.axisGraphicsContextScrollable.attr('transform', SVGUtil.translate(0, margin.top));
                this.labelRegion.attr('transform', SVGUtil.translate(0, margin.top));
                this.labelBackgroundRegion.attr('transform', SVGUtil.translate(0, margin.top));
                this.svgScrollable.attr('width', width);
            }
            else if (this.axes.isYScrollBarVisible) {
                this.svgScrollable.attr('height', height + margin.top);
            }
        }

        /**
         * Within the context of the given selection (g), find the offset of
         * the zero tick using the d3 attached datum of g.tick elements.
         * 'Classed' is undefined for transition selections
         */
        private static darkenZeroLine(g: D3.Selection): void {
            let zeroTick = g.selectAll('g.tick').filter((data) => data === 0).node();
            if (zeroTick) {
                d3.select(zeroTick).select('line').classed('zero-line', true);
            }
        }

        private static setAxisLabelColor(g: D3.Selection, fill: Fill): void {
            g.selectAll('g.tick text').style('fill', fill ? fill.solid.color : null);
        }
    }

    class CartesianAxes {
        private static YAxisLabelPadding = 20;
        private static XAxisLabelPadding = 18;
        private static MaxMarginFactor = 0.25;
        private static MinimumMargin: IMargin = {
            left: 1,
            right: 1,
            top: 8,
            bottom: 25,
        };

        private categoryAxisProperties: DataViewObject;
        private valueAxisProperties: DataViewObject;

        private maxMarginFactor: number;
        private yAxisOrientation: string;
        private scrollbarWidth: number;
        private lastLeft: number;
        public showLinesOnX: boolean;
        public showLinesOnY: boolean;
        public isScrollable: boolean;
        public isXScrollBarVisible: boolean;
        public isYScrollBarVisible: boolean;
        public categoryAxisHasUnitType: boolean;
        public valueAxisHasUnitType: boolean;
        public secondaryValueAxisHasUnitType: boolean;

        private layout: CartesianAxesLayout;

        constructor(isScrollable: boolean, scrollbarWidth: number) {
            this.scrollbarWidth = scrollbarWidth;
            this.isScrollable = isScrollable;
            this.maxMarginFactor = CartesianAxes.MaxMarginFactor;
            this.yAxisOrientation = yAxisPosition.left;
            this.lastLeft = 0;
        }

        public shouldShowY1OnRight(): boolean {
            return this.yAxisOrientation === yAxisPosition.right;
        }

        public isYAxisCategorical(): boolean {
            return this.layout && this.layout.axes.y1.isCategoryAxis;
        }

        public hasCategoryAxis(): boolean {
            let axes = this.layout && this.layout.axes;
            if (!axes)
                return false;

            return this.isYAxisCategorical()
                ? axes.y1 && axes.y1.values.length > 0
                : axes.x && axes.x.values.length > 0;
        }

        public hasY2Axis(): boolean {
            return this.layout && this.layout.axes.y2 != null;
        }

        public getYAxisOrientation(): string {
            return this.yAxisOrientation;
        }

        public setAxisLinesVisibility(axisLinesVisibility: AxisLinesVisibility): void {
            this.showLinesOnX = EnumExtensions.hasFlag(axisLinesVisibility, AxisLinesVisibility.ShowLinesOnBothAxis) ||
            EnumExtensions.hasFlag(axisLinesVisibility, AxisLinesVisibility.ShowLinesOnXAxis);

            this.showLinesOnY = EnumExtensions.hasFlag(axisLinesVisibility, AxisLinesVisibility.ShowLinesOnBothAxis) ||
            EnumExtensions.hasFlag(axisLinesVisibility, AxisLinesVisibility.ShowLinesOnYAxis);
        }

        public setMaxMarginFactor(factor: number): void {
            this.maxMarginFactor = factor;
        }

        public update(dataViews: DataView[]) {
            if (dataViews && dataViews.length > 0) {
                let dataViewMetadata = dataViews[0].metadata;
                this.categoryAxisProperties = CartesianHelper.getCategoryAxisProperties(dataViewMetadata);
                this.valueAxisProperties = CartesianHelper.getValueAxisProperties(dataViewMetadata);
            }

            let axisPosition = this.valueAxisProperties['position'];
            this.yAxisOrientation = axisPosition ? axisPosition.toString() : yAxisPosition.left;
        }

        public addWarnings(warnings: IVisualWarning[]): void {
            let axes = this.layout && this.layout.axes;
            if (axes && axes.x && axes.x.hasDisallowedZeroInDomain
                || axes.y1 && axes.y1.hasDisallowedZeroInDomain
                || axes.y2 && axes.y2.hasDisallowedZeroInDomain) {
                warnings.unshift(new ZeroValueWarning());
            }
        }

        public negotiateAxes(
            layers: ICartesianVisual[],
            parentViewport: IViewport,
            padding: IMargin,
            hideAxisLabels: boolean,
            textProperties: TextProperties): CartesianAxesLayout {

            let margin: IMargin = Prototype.inherit(CartesianAxes.MinimumMargin);
            let viewport: IViewport = Prototype.inherit(parentViewport);

            let leftRightMarginLimit = viewport.width * this.maxMarginFactor;
            let bottomMarginLimit = Math.max(CartesianAxes.MinimumMargin.bottom, Math.ceil(viewport.height * this.maxMarginFactor));
            let marginLimits = {
                left: leftRightMarginLimit,
                right: leftRightMarginLimit,
                top: 0,
                bottom: bottomMarginLimit,
            };

            // TODO: Remove this, without regressing tick label margins.
            margin.left = this.lastLeft;

            let axes = calculateAxes(layers, viewport, margin, this.categoryAxisProperties, this.valueAxisProperties, textProperties, false, null);

            let renderXAxis = this.shouldRenderAxis(axes.x);
            let renderY1Axis = this.shouldRenderAxis(axes.y1);
            let renderY2Axis = this.shouldRenderAxis(axes.y2, true);

            // TODO: simplify places that width is set by using plot area
            let width = viewport.width - (margin.left + margin.right);

            let isScalar = false;
            let preferredPlotArea: IViewport;
            this.isXScrollBarVisible = false;
            this.isYScrollBarVisible = false;

            let showY1OnRight = this.shouldShowY1OnRight();

            if (layers) {
                if (layers[0].getVisualCategoryAxisIsScalar)
                    isScalar = layers[0].getVisualCategoryAxisIsScalar();

                if (!isScalar && this.isScrollable && layers[0].getPreferredPlotArea) {
                    let categoryThickness = this.showLinesOnY ? axes.x.categoryThickness : axes.y1.categoryThickness;
                    let categoryCount = this.showLinesOnY ? axes.x.values.length : axes.y1.values.length;
                    preferredPlotArea = layers[0].getPreferredPlotArea(isScalar, categoryCount, categoryThickness);
                    if (this.showLinesOnY && preferredPlotArea && preferredPlotArea.width > viewport.width) {
                        this.isXScrollBarVisible = true;
                        viewport.height -= this.scrollbarWidth;
                    }

                    if (this.showLinesOnX && preferredPlotArea && preferredPlotArea.height > viewport.height) {
                        this.isYScrollBarVisible = true;
                        viewport.width -= this.scrollbarWidth;
                        width = viewport.width - (margin.left + margin.right);
                    }
                }
            }

            // Recalculate axes now that scrollbar visible variables have been set.
            axes = calculateAxes(layers, viewport, margin, this.categoryAxisProperties, this.valueAxisProperties, textProperties, this.isXScrollBarVisible || this.isYScrollBarVisible, axes);

            // We need to make two passes because the margin changes affect the chosen tick values, which then affect the margins again.
            let tickLabelMargins = undefined;
            let axisLabels: ChartAxesLabels = undefined;
            for (let iteration = 0, doneWithMargins = false; iteration < 2 && !doneWithMargins; iteration++) {
                tickLabelMargins = AxisHelper.getTickLabelMargins(
                    { width: width, height: viewport.height },
                    marginLimits.left,
                    TextMeasurementService.measureSvgTextWidth,
                    TextMeasurementService.estimateSvgTextHeight,
                    axes,
                    marginLimits.bottom,
                    textProperties,
                    this.isXScrollBarVisible || this.isYScrollBarVisible,
                    showY1OnRight,
                    renderXAxis,
                    renderY1Axis,
                    renderY2Axis);

                // We look at the y axes as main and second sides, if the y axis orientation is right then the main side represents the right side.
                let maxMainYaxisSide = showY1OnRight ? tickLabelMargins.yRight : tickLabelMargins.yLeft,
                    maxSecondYaxisSide = showY1OnRight ? tickLabelMargins.yLeft : tickLabelMargins.yRight,
                    xMax = tickLabelMargins.xMax;

                maxMainYaxisSide += padding.left;
                if ((renderY2Axis && !showY1OnRight) || (showY1OnRight && renderY1Axis))
                    maxSecondYaxisSide += padding.right;
                xMax += padding.bottom;

                if (hideAxisLabels) {
                    axes.x.axisLabel = null;
                    axes.y1.axisLabel = null;
                    if (axes.y2) {
                        axes.y2.axisLabel = null;
                    }
                }

                this.addUnitTypeToAxisLabels(axes);

                axisLabels = { x: axes.x.axisLabel, y: axes.y1.axisLabel, y2: axes.y2 ? axes.y2.axisLabel : null };

                if (axisLabels.x != null)
                    xMax += CartesianAxes.XAxisLabelPadding;
                if (axisLabels.y != null)
                    maxMainYaxisSide += CartesianAxes.YAxisLabelPadding;
                if (axisLabels.y2 != null)
                    maxSecondYaxisSide += CartesianAxes.YAxisLabelPadding;

                margin.left = showY1OnRight ? maxSecondYaxisSide : maxMainYaxisSide;
                margin.right = showY1OnRight ? maxMainYaxisSide : maxSecondYaxisSide;
                margin.bottom = xMax;

                width = viewport.width - (margin.left + margin.right);

                // Re-calculate the axes with the new margins.
                let previousTickCountY1 = axes.y1.values.length;
                let previousTickCountY2 = axes.y2 && axes.y2.values.length;
                axes = calculateAxes(layers, viewport, margin, this.categoryAxisProperties, this.valueAxisProperties, textProperties, this.isXScrollBarVisible || this.isYScrollBarVisible, /*axes*/ axes);

                // The minor padding adjustments could have affected the chosen tick values, which in turn requires us to calculate margins again.
                // e.g. [0,2,4,6,8] vs. [0,5,10] the 10 is wider and needs more margin.
                // TODO: This does not take into account other aspects of the axes that could change, e.g. willLabelsFit, etc.
                if (axes.y1.values.length === previousTickCountY1 && (!axes.y2 || axes.y2.values.length === previousTickCountY2))
                    doneWithMargins = true;
            }

            let plotArea: IViewport = {
                width: viewport.width - (margin.left + margin.right),
                height: viewport.height - (margin.top + margin.bottom),
            };

            this.layout = {
                axes: axes,
                axisLabels: axisLabels,
                margin: margin,
                marginLimits: marginLimits,
                viewport: viewport,
                plotArea: plotArea,
                preferredPlotArea: preferredPlotArea,
                tickLabelMargins: tickLabelMargins,
            };

            this.lastLeft = margin.left;

            return this.layout;
        }

        public isLogScaleAllowed(axisType: AxisLocation): boolean {
            let axes = this.layout && this.layout.axes;
            if (!axes)
                return false;

            switch (axisType) {
                case AxisLocation.X:
                    return axes.x.isLogScaleAllowed;
                case AxisLocation.Y1:
                    return axes.y1.isLogScaleAllowed;
                case AxisLocation.Y2:
                    return axes.y2 && axes.y2.isLogScaleAllowed;
            }
        }

        public axesHaveTicks(viewport: IViewport): boolean {
            if (!this.layout)
                return false;

            let margin = this.layout.margin;

            let width = viewport.width - (margin.left + margin.right);
            let height = viewport.height - (margin.top + margin.bottom);

            // TODO: this is never the case, remove.
            if (AxisHelper.getRecommendedNumberOfTicksForXAxis(width) === 0
                && AxisHelper.getRecommendedNumberOfTicksForYAxis(height) === 0) {
                return false;
            }

            return true;
        }

        public shouldRenderAxisTitle(axisProperties: IAxisProperties, defaultValue: boolean, secondary: boolean): boolean {
            let propertyName = secondary ? 'secShowAxisTitle' : 'showAxisTitle';

            return !!this.getAxisProperty(axisProperties, propertyName, defaultValue);
        }

        public shouldRenderAxis(axisProperties: IAxisProperties, secondary: boolean = false): boolean {
            if (!axisProperties)
                return false;

            let propertyName = secondary ? 'secShow' : 'show';

            return this.getAxisProperty(axisProperties, propertyName, true)
                && axisProperties.values
                && axisProperties.values.length > 0;
        }

        private getAxisProperty(axisProperties: IAxisProperties, propertyName: string, defaultValue: DataViewPropertyValue): DataViewPropertyValue {
            if (!axisProperties)
                return defaultValue;

            let properties = axisProperties.isCategoryAxis
                ? this.categoryAxisProperties
                : this.valueAxisProperties;

            if (properties && properties[propertyName] != null)
                return properties[propertyName];
            else
                return defaultValue;
        }

        // TODO: clean this up
        private addUnitTypeToAxisLabels(axes: CartesianAxisProperties): void {
            let unitType = CartesianAxes.getUnitType(axes.x.formatter);
            if (axes.x.isCategoryAxis) {
                this.categoryAxisHasUnitType = unitType != null;
            }
            else {
                this.valueAxisHasUnitType = unitType != null;
            }

            if (axes.x.axisLabel && unitType) {
                if (axes.x.isCategoryAxis) {
                    axes.x.axisLabel = AxisHelper.createAxisLabel(this.categoryAxisProperties, axes.x.axisLabel, unitType);
                }
                else {
                    axes.x.axisLabel = AxisHelper.createAxisLabel(this.valueAxisProperties, axes.x.axisLabel, unitType);
                }
            }

            unitType = CartesianAxes.getUnitType(axes.y1.formatter);

            if (!axes.y1.isCategoryAxis) {
                this.valueAxisHasUnitType = unitType != null;
            }
            else {
                this.categoryAxisHasUnitType = unitType != null;
            }

            if (axes.y1.axisLabel && unitType) {
                if (!axes.y1.isCategoryAxis) {
                    axes.y1.axisLabel = AxisHelper.createAxisLabel(this.valueAxisProperties, axes.y1.axisLabel, unitType);
                }
                else {
                    axes.y1.axisLabel = AxisHelper.createAxisLabel(this.categoryAxisProperties, axes.y1.axisLabel, unitType);
                }
            }

            if (axes.y2) {
                let unitType = CartesianAxes.getUnitType(axes.y2.formatter);
                this.secondaryValueAxisHasUnitType = unitType != null;
                if (axes.y2.axisLabel && unitType) {
                    axes.y2.axisLabel = AxisHelper.createAxisLabel(this.valueAxisProperties, axes.y2.axisLabel, unitType, true);
                }
            }
        }

        private static getUnitType(formatter: IValueFormatter) {
            if (formatter &&
                formatter.displayUnit &&
                formatter.displayUnit.value > 1)
                return formatter.displayUnit.title;
        }
    }

    module CartesianLayerFactory {

        export function createLayers(
            type: CartesianChartType,
            objects: DataViewObjects,
            interactivityService: IInteractivityService,
            animator?: any,
            isScrollable: boolean = false,
            seriesLabelFormattingEnabled: boolean = false,
            tooltipsEnabled?: boolean,
            lineChartLabelDensityEnabled?: boolean): ICartesianVisual[]{

            let layers: ICartesianVisual[] = [];

            let cartesianOptions: CartesianVisualConstructorOptions = {
                isScrollable: isScrollable,
                animator: animator,
                interactivityService: interactivityService,
                tooltipsEnabled: tooltipsEnabled,
                seriesLabelFormattingEnabled: seriesLabelFormattingEnabled,
                lineChartLabelDensityEnabled: lineChartLabelDensityEnabled,
            };

            switch (type) {                
                case CartesianChartType.Area:
                    layers.push(createLineChartLayer(LineChartType.area, /* inComboChart */ false, cartesianOptions));
                    break;
                case CartesianChartType.Line:
                    layers.push(createLineChartLayer(LineChartType.default, /* inComboChart */ false, cartesianOptions));
                    break;
                case CartesianChartType.StackedArea:
                    layers.push(createLineChartLayer(LineChartType.stackedArea, /* inComboChart */ false, cartesianOptions));
                    break;
                case CartesianChartType.Scatter:
                    layers.push(createScatterChartLayer(cartesianOptions));
                    break;
                case CartesianChartType.Waterfall:
                    layers.push(createWaterfallChartLayer(cartesianOptions));
                    break;
                case CartesianChartType.DataDot:
                    layers.push(createDataDotChartLayer(cartesianOptions));
                    break;
                case CartesianChartType.StackedColumn:
                    layers.push(createColumnChartLayer(ColumnChartType.stackedColumn, cartesianOptions));
                    break;
                case CartesianChartType.ClusteredColumn:
                    layers.push(createColumnChartLayer(ColumnChartType.clusteredColumn, cartesianOptions));
                    break;
                case CartesianChartType.HundredPercentStackedColumn:
                    layers.push(createColumnChartLayer(ColumnChartType.hundredPercentStackedColumn, cartesianOptions));
                    break;
                case CartesianChartType.StackedBar:
                    layers.push(createColumnChartLayer(ColumnChartType.stackedBar, cartesianOptions));
                    break;
                case CartesianChartType.ClusteredBar:
                    layers.push(createColumnChartLayer(ColumnChartType.clusteredBar, cartesianOptions));
                    break;
                case CartesianChartType.HundredPercentStackedBar:
                    layers.push(createColumnChartLayer(ColumnChartType.hundredPercentStackedBar, cartesianOptions));
                    break;
                case CartesianChartType.ComboChart:
                    let columnType = getComboColumnType();
                    layers.push(createColumnChartLayer(columnType, cartesianOptions));
                    layers.push(createLineChartLayer(LineChartType.default, /* inComboChart */ true, cartesianOptions));
                    break;
                case CartesianChartType.LineClusteredColumnCombo:
                    layers.push(createColumnChartLayer(ColumnChartType.clusteredColumn, cartesianOptions));
                    layers.push(createLineChartLayer(LineChartType.default, /* inComboChart */ true, cartesianOptions));
                    break;
                case CartesianChartType.LineStackedColumnCombo:
                    layers.push(createColumnChartLayer(ColumnChartType.stackedColumn, cartesianOptions));
                    layers.push(createLineChartLayer(LineChartType.default, /* inComboChart */ true, cartesianOptions));
                    break;
                case CartesianChartType.DataDotClusteredColumnCombo:
                    layers.push(createColumnChartLayer(ColumnChartType.clusteredColumn, cartesianOptions));
                    layers.push(createDataDotChartLayer(cartesianOptions));
                    break;
                case CartesianChartType.DataDotStackedColumnCombo:
                    layers.push(createColumnChartLayer(ColumnChartType.stackedColumn, cartesianOptions));
                    layers.push(createDataDotChartLayer(cartesianOptions));
                    break;
            }

            return layers;
        }

        function createLineChartLayer(type: LineChartType, inComboChart: boolean, defaultOptions: CartesianVisualConstructorOptions): LineChart {
            let options: LineChartConstructorOptions = {
                animator: defaultOptions.animator,
                interactivityService: defaultOptions.interactivityService,
                isScrollable: defaultOptions.isScrollable,
                tooltipsEnabled: defaultOptions.tooltipsEnabled,
                seriesLabelFormattingEnabled: defaultOptions.seriesLabelFormattingEnabled,
                chartType: type,
                lineChartLabelDensityEnabled: defaultOptions.lineChartLabelDensityEnabled,
            };

            if (inComboChart) {
                options.chartType = options.chartType | LineChartType.lineShadow;
            }

            return new LineChart(options);
        }

        function createScatterChartLayer(defaultOptions: CartesianVisualConstructorOptions): ScatterChart {
            defaultOptions.isScrollable = false;
            return new ScatterChart(defaultOptions);
        }

        function createWaterfallChartLayer(defaultOptions: CartesianVisualConstructorOptions): WaterfallChart {
            return new WaterfallChart(defaultOptions);
        }

        function createDataDotChartLayer(defaultOptions: CartesianVisualConstructorOptions): DataDotChart {
            return new DataDotChart(defaultOptions);
        }

        function createColumnChartLayer(type: ColumnChartType, defaultOptions: CartesianVisualConstructorOptions): ColumnChart {
            let options: ColumnChartConstructorOptions = {
                animator: <IColumnChartAnimator>defaultOptions.animator,
                interactivityService: defaultOptions.interactivityService,
                isScrollable: defaultOptions.isScrollable,
                seriesLabelFormattingEnabled: defaultOptions.seriesLabelFormattingEnabled,
                tooltipsEnabled: defaultOptions.tooltipsEnabled,
                chartType: type
            };
            return new ColumnChart(options);
        }

        function getComboColumnType(objects?: DataViewObjects): ColumnChartType {
            // This supports existing serialized forms of pinned combo-chart visuals
            let columnType: ColumnChartType = ColumnChartType.clusteredColumn;
            if (objects) {
                let comboChartTypes: ComboChartDataViewObject = (<ComboChartDataViewObjects>objects).general;
                if (comboChartTypes) {
                    switch (comboChartTypes.visualType1) {
                        case 'Column':
                            columnType = ColumnChartType.clusteredColumn;
                            break;
                        case 'ColumnStacked':
                            columnType = ColumnChartType.stackedColumn;
                            break;
                        default:
                            debug.assertFail('Unsupported cartesian chart type ' + comboChartTypes.visualType1);
                    }

                    // second visual is always LineChart (for now)
                    if (comboChartTypes.visualType2) {
                        debug.assert(comboChartTypes.visualType2 === 'Line', 'expecting a LineChart for VisualType2');
                    }
                }
            }

            return columnType;
        }
    }

    export class SharedColorPalette implements IDataColorPalette {
        private palette: IDataColorPalette;
        private preferredScale: IColorScale;
        private rotated: boolean;

        constructor(palette: IDataColorPalette) {
            this.palette = palette;
            this.clearPreferredScale();
        }

        public getColorScaleByKey(scaleKey: string): IColorScale {
            this.setPreferredScale(scaleKey);
            return this.preferredScale;
        }

        public getNewColorScale(): IColorScale {
            return this.preferredScale;
        }

        public getColorByIndex(index: number): IColorInfo {
            return this.palette.getColorByIndex(index);
        }

        public getSentimentColors(): IColorInfo[] {
            return this.palette.getSentimentColors();
        }

        public getBasePickerColors(): IColorInfo[] {
            return this.palette.getBasePickerColors();
        }

        public clearPreferredScale(): void {
            this.preferredScale = this.palette.getNewColorScale();
            this.rotated = false;
        }

        public rotateScale(): void {
            // We create a new rotated the scale such that the first color of the new scale is the first
            // free color of the previous scale. Note that the new scale does not have any colors allocated
            // to particular keys.
            this.preferredScale = this.preferredScale.clone();
            this.preferredScale.clearAndRotateScale();
            this.rotated = true;
        }

        private setPreferredScale(scaleKey: string): void {
            if (!this.rotated) {
                // The first layer to express a preference sets the preferred scale.
                this.preferredScale = this.palette.getColorScaleByKey(scaleKey);
            }
        }
    }
}
