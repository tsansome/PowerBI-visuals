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

module powerbitests {
    import ScatterChart = powerbi.visuals.ScatterChart;
    import LabelsBehavior = powerbi.visuals.LabelsBehavior;
    import ArrayExtensions = jsCommon.ArrayExtensions;
    import AxisType = powerbi.visuals.axisType;
    import DataViewPivotCategorical = powerbi.data.DataViewPivotCategorical;
    import DataViewTransform = powerbi.data.DataViewTransform;
    import ValueType = powerbi.ValueType;
    import PrimitiveType = powerbi.PrimitiveType;
    import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
    import SelectionId = powerbi.visuals.SelectionId;
    import PixelConverter = jsCommon.PixelConverter;

    powerbitests.mocks.setLocale();

    const labelColor: string = powerbi.visuals.dataLabelUtils.defaultLabelColor;

    const axisLabelVisibleMinHeight: number = powerbi.visuals.visualPluginFactory.MobileVisualPluginService.MinHeightAxesVisible;
    const axisLabelVisibleGreaterThanMinHeight: number = axisLabelVisibleMinHeight + 1;
    const axisLabelVisibleSmallerThanMinHeight: number = axisLabelVisibleMinHeight - 1;
    const axisLabelVisibleGreaterThanMinHeightString: string = axisLabelVisibleGreaterThanMinHeight.toString();
    const axisLabelVisibleSmallerThanMinHeightString: string = axisLabelVisibleSmallerThanMinHeight.toString();

    const legendVisibleMinHeight: number = powerbi.visuals.visualPluginFactory.MobileVisualPluginService.MinHeightLegendVisible;
    const legendVisibleGreaterThanMinHeight: number = legendVisibleMinHeight + 1;
    const legendVisibleSmallerThanMinHeight: number = legendVisibleMinHeight - 1;
    const legendVisibleGreaterThanMinHeightString: string = legendVisibleGreaterThanMinHeight.toString();
    const legendVisibleSmallerThanMinHeightString: string = legendVisibleSmallerThanMinHeight.toString();

    function createConverterOptions(
        viewport: powerbi.IViewport,
        colors: any,
        interactivityService?: any,
        categoryAxisProperties?: any,
        valueAxisProperties?: any) {

        return {
            viewport: viewport,
            colors: colors,
            interactivityService: interactivityService,
            categoryAxisProperties: categoryAxisProperties,
            valueAxisProperties: valueAxisProperties,
        };
    }

    function getDataViewMultiSeries(firstGroupName: string = 'Canada', secondGroupName: string = 'United States', withMinMax: boolean = false): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = {
            columns: [
                {
                    displayName: 'category',
                    format: 'yyyy',
                    type: ValueType.fromDescriptor({ dateTime: true })
                }, {
                    displayName: 'series'
                }, {
                    displayName: 'x',
                    format: '#,0.00',
                    isMeasure: true,
                    roles: { 'X': true },
                    groupName: firstGroupName,
                }, {
                    displayName: 'y',
                    format: '#,0',
                    isMeasure: true,
                    roles: { 'Y': true },
                    groupName: firstGroupName,
                }, {
                    displayName: 'size',
                    format: '#,0',
                    isMeasure: true,
                    roles: { 'Size': true },
                    groupName: firstGroupName,
                }, {
                    displayName: 'x',
                    format: '#,0.00',
                    isMeasure: true,
                    roles: { 'X': true },
                    groupName: secondGroupName,
                }, {
                    displayName: 'y',
                    format: '#,0',
                    isMeasure: true,
                    roles: { 'Y': true },
                    groupName: secondGroupName,
                }, {
                    displayName: 'size',
                    format: '#,0',
                    isMeasure: true,
                    roles: { 'Size': true },
                    groupName: secondGroupName,
                }
            ]
        };

        let colP1Ref = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 't', column: 'p1' });
        let colP2Ref = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 't', column: 'p2' });

        let seriesValues = [firstGroupName, secondGroupName];
        let seriesIdentities = seriesValues.map(v => mocks.dataViewScopeIdentity(v));

        let dataViewValueColumns: powerbi.DataViewValueColumn[] = [
            {
                source: dataViewMetadata.columns[2],
                values: [150, 177, 157],
                identity: seriesIdentities[0],
            }, {
                source: dataViewMetadata.columns[3],
                values: [30, 25, 28],
                identity: seriesIdentities[0],
            }, {
                source: dataViewMetadata.columns[4],
                values: [100, 200, 300],
                identity: seriesIdentities[0],
            }, {
                source: dataViewMetadata.columns[5],
                values: [100, 149, 144],
                identity: seriesIdentities[1],
            }, {
                source: dataViewMetadata.columns[6],
                values: [300, 250, 280],
                identity: seriesIdentities[1],
            }, {
                source: dataViewMetadata.columns[7],
                values: [150, 250, 350],
                identity: seriesIdentities[1],
            }
        ];

        if (withMinMax) {
            dataViewValueColumns[2].min = 50;
            dataViewValueColumns[2].max = 400;
            dataViewValueColumns[5].min = 100;
            dataViewValueColumns[5].max = 500;
        }

        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: {
                categories: [{
                    source: dataViewMetadata.columns[0],
                    values: [
                        powerbitests.helpers.parseDateString("2012-01-01T00:00:00"),
                        powerbitests.helpers.parseDateString("2011-01-01T00:00:00"),
                        powerbitests.helpers.parseDateString("2010-01-01T00:00:00")
                    ],
                    identity: [seriesIdentities[0]],
                    identityFields: [
                        colP1Ref
                    ]
                }],
                values: DataViewTransform.createValueColumns(dataViewValueColumns, [colP2Ref])
            },
        };

        dataView.categorical.values.source = dataViewMetadata.columns[1];

        return dataView;
    }

    function getDataViewWithSharedCategoryAndSeries(): powerbi.DataView {
        // Category and series are the same field
        let metadata: powerbi.DataViewMetadata = {
            columns: [
                { displayName: 'series', isMeasure: false, queryName: 'series', roles: { "Category": true, "Series": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text) },
                { displayName: 'value1', groupName: 'a', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'value2', groupName: 'a', isMeasure: true, queryName: "size", roles: { "Size": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'value3', groupName: 'a', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'value1', groupName: 'b', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'value2', groupName: 'b', isMeasure: true, queryName: "size", roles: { "Size": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'value3', groupName: 'b', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'value1', groupName: 'c', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'value2', groupName: 'c', isMeasure: true, queryName: "size", roles: { "Size": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'value3', groupName: 'c', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
            ]
        };

        let seriesValues = ['a', 'b', 'c'];
        let seriesIdentities = seriesValues.map(v => mocks.dataViewScopeIdentity(v));
        let seriesIdentityField = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 'e', column: 'series' });

        let valueColumns = DataViewTransform.createValueColumns([
            {
                source: metadata.columns[1],
                values: [0, null, null],
                identity: seriesIdentities[0],
            }, {
                source: metadata.columns[2],
                values: [1, null, null],
                identity: seriesIdentities[0],
            }, {
                source: metadata.columns[3],
                values: [10, null, null],
                identity: seriesIdentities[0],
            }, {
                source: metadata.columns[4],
                values: [null, 100, null],
                identity: seriesIdentities[1],
            }, {
                source: metadata.columns[5],
                values: [null, 2, null],
                identity: seriesIdentities[1],
            }, {
                source: metadata.columns[6],
                values: [null, 20, null],
                identity: seriesIdentities[1],
            }, {
                source: metadata.columns[7],
                values: [null, null, 200],
                identity: seriesIdentities[2],
            }, {
                source: metadata.columns[8],
                values: [null, null, 3],
                identity: seriesIdentities[2],
            }, {
                source: metadata.columns[9],
                values: [null, null, 30],
                identity: seriesIdentities[2],
            }],
            [seriesIdentityField]);
        valueColumns.source = metadata.columns[0];

        return <powerbi.DataView>{
            metadata: metadata,
            categorical: {
                categories: [{
                    source: metadata.columns[0],
                    values: seriesValues,
                    identity: seriesIdentities,
                }],
                values: valueColumns,
            }
        };
    }

    describe("ScatterChart", () => {
        let dataViewMetadataFourColumn: powerbi.DataViewMetadata;
        beforeEach(() => {
            dataViewMetadataFourColumn = {
                columns: [
                    { displayName: 'category', queryName: 'select1', roles: { "Category": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text) },
                    { displayName: 'x', queryName: 'select2', isMeasure: true, roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'y', queryName: 'select3', isMeasure: true, roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'size', queryName: 'select4', isMeasure: true, roles: { "Size": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) }
                ]
            };
        });

        it('ScatterChart registered capabilities', () => {
            expect(powerbi.visuals.visualPluginFactory.create().getPlugin('scatterChart').capabilities).toBe(powerbi.visuals.scatterChartCapabilities);
        });

        it('Capabilities should include dataViewMappings', () => {
            expect(powerbi.visuals.scatterChartCapabilities.dataViewMappings).toBeDefined();
        });

        it('Capabilities should include dataRoles', () => {
            expect(powerbi.visuals.scatterChartCapabilities.dataRoles).toBeDefined();
        });

        it('Capabilities should not suppressDefaultTitle', () => {
            expect(powerbi.visuals.scatterChartCapabilities.suppressDefaultTitle).toBeUndefined();
        });

        it('FormatString property should match calculated', () => {
            expect(powerbi.data.DataViewObjectDescriptors.findFormatString(powerbi.visuals.scatterChartCapabilities.objects)).toEqual(powerbi.visuals.scatterChartProps.general.formatString);
        });

        it('preferred capability does not support zero rows', () => {
            let dataView: powerbi.DataView = {
                metadata: dataViewMetadataFourColumn,
                categorical: {
                    categories: [{
                        source: dataViewMetadataFourColumn.columns[0],
                        values: []
                    }],
                    values: DataViewTransform.createValueColumns([{
                        source: dataViewMetadataFourColumn.columns[1],
                        values: []
                    }]),
                }
            };

            expect(powerbi.DataViewAnalysis.supports(dataView, powerbi.visuals.scatterChartCapabilities.dataViewMappings[0], true))
                .toBe(false);
        });

        it('preferred capability does not support one row', () => {
            let dataView: powerbi.DataView = {
                metadata: dataViewMetadataFourColumn,
                categorical: {
                    categories: [{
                        source: dataViewMetadataFourColumn.columns[0],
                        values: [2012, 2013]
                    }],
                    values: DataViewTransform.createValueColumns([{
                        source: dataViewMetadataFourColumn.columns[1],
                        values: [200]
                    }]),
                }
            };

            expect(powerbi.DataViewAnalysis.supports(dataView, powerbi.visuals.scatterChartCapabilities.dataViewMappings[0], true))
                .toBe(false);
        });

        function scatterChartDomValidation(interactiveChart: boolean) {
            let v: powerbi.IVisual, element: JQuery;
        let selectorXaxis: string = '.scatterChart .axisGraphicsContext .x.axis .tick';
        let selectorYaxis: string = '.scatterChart .axisGraphicsContext .y.axis .tick';

        let dataViewMetadataFourColumn: powerbi.DataViewMetadata = {
            columns: [
                { displayName: 'col1', queryName: 'testQuery', roles: { "Category": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text) },
                { displayName: 'col2', queryName: 'col2Query', isMeasure: true, roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'col3', queryName: 'col3Query', isMeasure: true, roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                { displayName: 'col4', queryName: 'col4Query', isMeasure: true, roles: { "Size": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) }
            ]
        };

            let hostServices: powerbi.IVisualHostServices;

            beforeEach(() => {
                hostServices = powerbitests.mocks.createVisualHostServices();
                element = powerbitests.helpers.testDom('500', '500');
                let visualPluginfactory = interactiveChart ?
                    powerbi.visuals.visualPluginFactory.createMobile() :
                    powerbi.visuals.visualPluginFactory.create();
                v = visualPluginfactory.getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: hostServices,
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true },
                    interactivity: { isInteractiveLegend: interactiveChart },
                });
            });

            describe('warnings', () => {

                it('NaN in values shows a warning', (done) => {
                    let warningSpy = jasmine.createSpy('warning');
                    hostServices.setWarnings = warningSpy;

                    let options = getOptionsForValueWarnings([500000, 495000, 490000, NaN, 500000]);
                    v.onDataChanged(options);

                    setTimeout(() => {
                        expect(warningSpy).toHaveBeenCalled();
                        expect(warningSpy.calls.count()).toBe(1);
                        expect(warningSpy.calls.argsFor(0)[0][0].code).toBe('NaNNotSupported');
                        done();
                    }, DefaultWaitForRender);
                });

                it('Negative Infinity in values shows a warning', (done) => {
                    let warningSpy = jasmine.createSpy('warning');
                    hostServices.setWarnings = warningSpy;

                    let options = getOptionsForValueWarnings([500000, 495000, 490000, Number.NEGATIVE_INFINITY, 500000]);
                    v.onDataChanged(options);

                    setTimeout(() => {
                        expect(warningSpy).toHaveBeenCalled();
                        expect(warningSpy.calls.count()).toBe(1);
                        expect(warningSpy.calls.argsFor(0)[0][0].code).toBe('InfinityValuesNotSupported');
                        done();
                    }, DefaultWaitForRender);
                });

                it('Positive Infinity in values shows a warning', (done) => {
                    let warningSpy = jasmine.createSpy('warning');
                    hostServices.setWarnings = warningSpy;

                    let options = getOptionsForValueWarnings([500000, 495000, 490000, Number.POSITIVE_INFINITY, 500000]);
                    v.onDataChanged(options);

                    setTimeout(() => {
                        expect(warningSpy).toHaveBeenCalled();
                        expect(warningSpy.calls.count()).toBe(1);
                        expect(warningSpy.calls.argsFor(0)[0][0].code).toBe('InfinityValuesNotSupported');
                        done();
                    }, DefaultWaitForRender);
                });

                it('Out of range value in values shows a warning', (done) => {
                    let warningSpy = jasmine.createSpy('warning');
                    hostServices.setWarnings = warningSpy;

                    let options = getOptionsForValueWarnings([500000, 495000, 490000, 1e301, 500000]);
                    v.onDataChanged(options);

                    setTimeout(() => {
                        expect(warningSpy).toHaveBeenCalled();
                        expect(warningSpy.calls.count()).toBe(1);
                        expect(warningSpy.calls.argsFor(0)[0][0].code).toBe('ValuesOutOfRange');
                        done();
                    }, DefaultWaitForRender);
                });

                it('All okay in values shows a warning', (done) => {
                    let warningSpy = jasmine.createSpy('warning');
                    hostServices.setWarnings = warningSpy;

                    let options = getOptionsForValueWarnings([500000, 495000, 490000, 480000, 500000]);
                    v.onDataChanged(options);

                    setTimeout(() => {
                        expect(warningSpy).not.toHaveBeenCalled();
                        done();
                    }, DefaultWaitForRender);
                });

                function getOptionsForValueWarnings(values: number[]) {
                    let options = {
                        dataViews: [{
                            metadata: dataViewMetadataFourColumn,
                            categorical: {
                                categories: [{
                                    source: dataViewMetadataFourColumn.columns[0],
                                    values: ['a', 'b', 'c', 'd', 'e']
                                }],
                                values: DataViewTransform.createValueColumns([{
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: values,
                                    subtotal: 2465000
                                }])
                            }
                        }]
                    };

                    return options;
                }
            });

            it('scatter chart single measure dom validation', (done) => {
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e']
                            }],
                            values: DataViewTransform.createValueColumns([{
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [500000, 495000, 490000, 480000, 500000],
                                subtotal: 2465000
                            }])
                        }
                    }]
                });
                setTimeout(() => {
                let selector: string = '.scatterChart .axisGraphicsContext .x.axis .tick';
                expect($(selector).length).toBeGreaterThan(0);
                expect(helpers.findElementText($(selector).find('text').first())).toBe('480K');
                //check title
                expect(helpers.findElementText($(selector).find('text').first())).toBe('480K');
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart two measure dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [.21, .22, .23, .24, .25]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let markers = getMarkers();

                expect(helpers.findElementText($(selectorXaxis).find('text').first())).toBe('110');
                expect(helpers.findElementText($(selectorYaxis).find('text').first())).toBe('0.21');
                //check titles
                expect(helpers.findElementTitle($(selectorXaxis).find('text').first())).toBe('110');
                expect(helpers.findElementTitle($(selectorYaxis).find('text').first())).toBe('0.21');

                    expect(markers.length).toBe(5);
                    expect(markers[0].style.fillOpacity).toBe("0");
                    expect(markers[0].style.strokeOpacity).toBe("0.85");
                    expect(markers[0].getAttribute('r')).toBe('6');
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart series dom validation', (done) => {
                dataViewMetadataFourColumn.columns[0].roles = { 'Series': true };

                v.onDataChanged({
                    dataViews: [DataViewPivotCategorical.apply({
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b'],
                                identity: [
                                    mocks.dataViewScopeIdentity('a'),
                                    mocks.dataViewScopeIdentity('b'),
                                ]
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110, 120]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [210, 220]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [310, 320]
                                }])
                        }
                    })]
                });

                let legendClassSelector = interactiveChart ? ".interactive-legend" : '.legend';
                let itemsNumber = interactiveChart ? 3 : 2;
                setTimeout(() => {
                    expect(getMarkers().length).toBe(2);
                    let length = $(legendClassSelector + (interactiveChart ? ' .item' : 'Text')).length;
                    expect($(legendClassSelector).length).toBe(1);
                    expect(length).toBe(itemsNumber);
                if (!interactiveChart) {
                    expect(helpers.findElementText($('.legendTitle'))).toBe('col1');
                    expect(helpers.findElementTitle($('.legendTitle'))).toBe('col1');
                }
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart measure and size dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [210, 220, 230, 240, 250]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [310, 320, 330, 340, 350]
                                }])
                        }
                    }]
                });
                let r = interactiveChart ? 40 : 45.5;  // interactive legend is bigger
                setTimeout(() => {
                    let markers = getMarkers();

                expect(helpers.findElementText($(selectorXaxis).find('text').first())).toBe('110');
                expect(helpers.findElementText($(selectorYaxis).find('text').first())).toBe('210');
                //check titles
                expect(helpers.findElementTitle($(selectorXaxis).find('text').first())).toBe('110');
                expect(helpers.findElementTitle($(selectorYaxis).find('text').first())).toBe('210');

                    expect(markers.length).toBe(5);
                    let expectedR0 = parseFloat(markers[0].getAttribute('r'));
                    expect(expectedR0).toBeCloseTo(r, -0.31);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart gridline dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([{
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [50000, 49500, 49000, 48000, 50000],
                                subtotal: 246500
                            }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                });
                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .x.axis .tick').length).toBeGreaterThan(0);
                    expect($('.scatterChart .axisGraphicsContext .x.axis.showLinesOnAxis').length).toBe(1);
                    expect($('.scatterChart .axisGraphicsContext .y.axis.showLinesOnAxis').length).toBe(2);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart single category value dom validation', (done) => {
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a'],
                                identity: [mocks.dataViewScopeIdentity('a')],
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [310]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [210]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let markers = getMarkers();

                expect($(selectorXaxis).length).toBe(4);
                expect(helpers.findElementText($(selectorXaxis).find('text').first())).toBe('80');
                expect(helpers.findElementText($(selectorXaxis).find('text').last())).toBe('140');
                //check titles
                expect(helpers.findElementTitle($(selectorXaxis).find('text').first())).toBe('80');
                expect(helpers.findElementTitle($(selectorXaxis).find('text').last())).toBe('140');

                expect($(selectorYaxis).length).toBe(3);
                expect(helpers.findElementText($(selectorYaxis).find('text').first())).toBe('200');
                expect(helpers.findElementText($(selectorYaxis).find('text').last())).toBe('400');
                //check titles
                expect(helpers.findElementText($(selectorYaxis).find('text').first())).toBe('200');
                expect(helpers.findElementText($(selectorYaxis).find('text').last())).toBe('400');

                    expect(markers.length).toBe(1);
                    let r = (interactiveChart ? 39.5 : 45.5).toString();
                    expect(markers[0].getAttribute('r')).toBe(r);
                    expect($('.legendItem').length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart no category dom validation', (done) => {
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: null,
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [310]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [210]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let markers = getMarkers();
                    expect($('.scatterChart .axisGraphicsContext .x.axis .tick').length).toBe(4);
                    expect($('.scatterChart .axisGraphicsContext .y.axis .tick').length).toBe(3);
                    expect(markers.length).toBe(1);
                    let r = (interactiveChart ? 39.5 : 45.5).toString();// interactive legend is bigger
                    expect(markers[0].getAttribute('r')).toBe(r);
                    expect(markers.find('title').first().text()).toBe('');
                    expect($('.legendItem').length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });

            it('empty scatter chart dom validation', (done) => {
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: []
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: []
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: []
                                }
                            ])
                        }
                    }]
                });
                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .x.axis .tick').length).toBeGreaterThan(0);
                    expect($('.scatterChart .axisGraphicsContext .y.axis .tick').length).toBeGreaterThan(0);
                    done();
                }, DefaultWaitForRender);
            });

            it('ensure scatter chart is cleared when an empty dataview is applied', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([{
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [50000, 49500, 49000, 48000, 50000],
                                subtotal: 246500
                            }])
                        }
                    }]
                });
                setTimeout(() => {
                    let scatterCount = getMarkers().length;
                    expect(scatterCount).toBe(5);
                    v.onDataChanged({
                        dataViews: [{
                            metadata: dataViewMetadataFourColumn,
                            categorical: {
                                categories: [{
                                    source: dataViewMetadataFourColumn.columns[0],
                                    values: []
                                }],
                                values: DataViewTransform.createValueColumns([{
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [],
                                    subtotal: 0
                                }])
                            }
                        }]
                    });
                    setTimeout(() => {
                        let scatterCount = getMarkers().length;
                        expect(scatterCount).toBe(0);
                        done();
                    }, DefaultWaitForRender);
                }, DefaultWaitForRender);
            });

            it('scatter chart with small interval dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [0.5, 2.0, 1.5, 1.0, 2.5]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [0.5, 2.0, 1.5, 1.0, 2.5]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1.2, 2.3, 1.8, 3.7, 2.6]
                                }
                            ])
                        }
                    }]
                });
                setTimeout(() => {
                expect($(selectorXaxis).length).toBe(5);
                expect($(selectorYaxis).length).toBe(5);

                let xTicks = $(selectorXaxis).find('text');
                let yTicks = $(selectorYaxis).find('text');
                    ['0.5', '1.0', '1.5', '2.0', '2.5', ].map(function (val, i) {
                    expect(helpers.findElementText($(xTicks.eq(i)))).toBe(val);
                    expect(helpers.findElementText($(yTicks.eq(i)))).toBe(val);
                    //check titles
                    expect(helpers.findElementTitle($(xTicks.eq(i)))).toBe(val);
                    expect(helpers.findElementTitle($(yTicks.eq(i)))).toBe(val);
                    });

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart nested svg dom validation', () => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [5, 20, 15, 10, 25]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [0.5, 2.0, 1.5, 1.0, 2.5]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1.2, 2.3, 1.8, 3.7, 2.6]
                                }
                            ])
                        }
                    }]
                });

                expect(getMarkers().length).toBe(5);
                expect($('.scatterChart .mainGraphicsContext').find('svg')).toBeDefined();
            });

            it('scatter chart does not show less ticks dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [32, 45]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [26.125, 26.125]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [3, 5]
                                }
                            ])
                        }
                    }]
                });
                setTimeout(() => {
                expect($(selectorYaxis).length).toBeGreaterThan(1);
                expect(helpers.findElementText($(selectorYaxis).find('text').last())).toBe('30');
                //check title
                expect(helpers.findElementTitle($(selectorYaxis).find('text').last())).toBe('30');
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart axis labels dom validation', (done) => {
                dataViewMetadataFourColumn.columns[1].displayName = 'X-Axis';
                dataViewMetadataFourColumn.columns[2].displayName = 'Y-Axis';

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [210, 220, 230, 240, 250]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [310, 320, 330, 340, 350]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                let selectorXaxisLabel: string = '.scatterChart .axisGraphicsContext .xAxisLabel';
                let selectorYaxisLabel: string = '.scatterChart .axisGraphicsContext .yAxisLabel';

                expect($(selectorXaxisLabel).length).toBe(1);
                expect($(selectorYaxisLabel).length).toBe(1);

                expect(helpers.findElementText($(selectorXaxisLabel).first())).toBe('X-Axis');
                expect(helpers.findElementText($(selectorYaxisLabel).first())).toBe('Y-Axis');
                //check titles
                expect(helpers.findElementTitle($(selectorXaxisLabel).first())).toBe('X-Axis');
                expect(helpers.findElementTitle($(selectorYaxisLabel).first())).toBe('Y-Axis');

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart on small tile shows at least two tick lines dom validation', (done) => {
                v.onResizing({
                    height: 101,
                    width: 226
                });
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [3, 5, 7]
                                }
                            ])
                        }
                    }]
                });
                setTimeout(() => {
                expect($(selectorYaxis).length).toBeGreaterThan(1);
                expect(helpers.findElementText($(selectorYaxis).find('text').first())).toBe('0.15');
                expect(helpers.findElementText($(selectorYaxis).find('text').last())).toBe('0.16');
                //check titles
                expect(helpers.findElementTitle($(selectorYaxis).find('text').first())).toBe('0.15');
                expect(helpers.findElementTitle($(selectorYaxis).find('text').last())).toBe('0.16');

                expect($(selectorXaxis).length).toBeGreaterThan(1);
                expect(helpers.findElementText($(selectorXaxis).find('text').first())).toBe('0.15');
                expect(helpers.findElementText($(selectorXaxis).find('text').last())).toBe('0.16');
                //check titles
                expect(helpers.findElementTitle($(selectorXaxis).find('text').first())).toBe('0.15');
                expect(helpers.findElementTitle($(selectorXaxis).find('text').last())).toBe('0.16');

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart onResize big tile radius dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [3, 15, 27],
                                    min: 0,
                                    max: 30
                                }
                            ])
                        }
                    }]
                });

                v.onResizing({
                    height: 500,
                    width: 500
                });

                let r0, r1, r2;
                if (interactiveChart) {
                    r0 = 38;
                    r1 = 29;
                    r2 = 16;
                } else {
                    r0 = 43;
                    r1 = 33;
                    r2 = 18;
                }

                setTimeout(() => {
                    let markers = getMarkers();

                    let expectedR0 = parseFloat(markers[0].getAttribute('r'));
                    expect(expectedR0).toBeCloseTo(r0, -0.31);

                    let expectedR1 = parseFloat(markers[1].getAttribute('r'));
                    expect(expectedR1).toBeCloseTo(r1, -0.31);

                    let expectedR2 = parseFloat(markers[2].getAttribute('r'));
                    expect(expectedR2).toBeCloseTo(r2, -0.31);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart onResize medium tile radius dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [3, 15, 27],
                                    min: 0,
                                    max: 30
                                }
                            ])
                        }
                    }]
                });

                v.onResizing({
                    height: 300,
                    width: 300
                });

                let r0, r1, r2;
                if (interactiveChart) {
                    r0 = 18.5;
                    r1 = 14;
                    r2 = 7.5;
                } else {
                    r0 = 23.5;
                    r1 = 18;
                    r2 = 10;
                };
                setTimeout(() => {
                    let markers = getMarkers();

                    let expectedR0 = parseFloat(markers[0].getAttribute('r'));
                    expect(expectedR0).toBeCloseTo(r0, -0.31);

                    let expectedR1 = parseFloat(markers[1].getAttribute('r'));
                    expect(expectedR1).toBeCloseTo(r1, -0.31);

                    let expectedR2 = parseFloat(markers[2].getAttribute('r'));
                    expect(expectedR2).toBeCloseTo(r2, -0.31);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart onResize small tile radius dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [3, 15, 27],
                                    min: 0,
                                    max: 30
                                }
                            ])
                        }
                    }]
                });

                v.onResizing({
                    height: 200,
                    width: 200
                });

                let r0, r1, r2;
                if (interactiveChart) {
                    r0 = 8.5;
                    r1 = 6.5;
                    r2 = 3.5;
                } else {
                    r0 = 13.5;
                    r1 = 10.5;
                    r2 = 5.5;
                }
                setTimeout(() => {
                    let markers = getMarkers();
                    let expectedR0 = parseFloat(markers[0].getAttribute('r'));
                    expect(expectedR0).toBeCloseTo(r0, -0.31);

                    let expectedR1 = parseFloat(markers[1].getAttribute('r'));
                    expect(expectedR1).toBeCloseTo(r1, -0.31);

                    let expectedR2 = parseFloat(markers[2].getAttribute('r'));
                    expect(expectedR2).toBeCloseTo(r2, -0.31);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart zero axis line is darkened', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110, 120, -130, 140, 150]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [210, -220, -230, 240, -250]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [-310, 320, 330, -340, 350]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let zeroTicks = $('g.tick:has(line.zero-line)');
                    expect($('.brush')).not.toBeInDOM();
                    expect(zeroTicks.length).toBe(2);
                    zeroTicks.each(function (i, item) {
                        expect(d3.select(item).datum() === 0).toBe(true);
                    });

                    done();
                }, DefaultWaitForRender);
            });

            it('bubble sort is a total sort', (done) => {
                let categories1 = ['a', 'b', 'c', 'd', 'e'];
                let categories2 = ['e', 'd', 'c', 'b', 'a'];

                let dataView1: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: categories1,
                            identity: _.map(categories1, (c) => mocks.dataViewScopeIdentity(c)),
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [10, 20, 30, 40, 50]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [1, 2, 3, 4, 5]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [10, 100, 100, 100, 20]
                            }]),
                    }
                };

                // Data points are reversed
                let dataView2: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: categories2,
                            identity: _.map(categories2, (c) => mocks.dataViewScopeIdentity(c)),
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [50, 40, 30, 20, 10]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [5, 4, 3, 2, 1]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [20, 100, 100, 100, 10]
                            }]),
                    }
                };

                v.onDataChanged({ dataViews: [dataView1] });
                setTimeout(() => {
                    let dots1 = getMarkersD3().data();

                    v.onDataChanged({ dataViews: [dataView2] });
                    setTimeout(() => {
                        let dots2 = getMarkersD3().data();

                        expect(dots1.length).toBe(dots2.length);

                        for (let i = 0; i < dots1.length; i++) {
                            expect(dots1[i].category).toEqual(dots2[i].category);
                            if (i > 0)
                                expect(dots1[i].size <= dots1[i - 1].size).toBeTruthy();
                        }

                        done();
                    }, DefaultWaitForRender);
                }, DefaultWaitForRender);
            });

            it("scatter chart draw category labels when enabled", (done) => {
                let metadata: powerbi.DataViewMetadata = {
                    columns: dataViewMetadataFourColumn.columns,
                    objects: {
                        categoryLabels: {
                            show: true,
                            color: undefined,
                            labelDisplayUnits: undefined,
                            labelPosition: undefined,
                            labelPrecision: undefined,
                        }
                    }
                };
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: metadata.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: metadata.columns[2],
                                    values: [.21, .22, .23, .24, .25]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    expect($(".labelGraphicsContext")).toBeInDOM();
                    expect($(".labelGraphicsContext .label").length).toBe(5);

                    done();
                }, DefaultWaitForRender);
            });

            it("scatter chart draw category labels with correct font size", (done) => {
                let metadata: powerbi.DataViewMetadata = {
                    columns: dataViewMetadataFourColumn.columns,
                    objects: {
                        categoryLabels: {
                            show: true,
                            fontSize: 12,
                        }
                    }
                };
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([{
                                source: metadata.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                    source: metadata.columns[2],
                                    values: [.21, .22, .23, .24, .25]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    expect($(".labelGraphicsContext")).toBeInDOM();
                    expect($(".labelGraphicsContext .label").length).toBe(5);
                    expect($(".labelGraphicsContext .label").css('font-size')).toBe('16px');

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart reference line dom validation', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];

                let refLineColor1 = '#ff0000';
                let refLineColor2 = '#ff00ff';

                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [310, 320, 330, 340, 350]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [210, 220, 230, 240, 250]
                            }])
                    }
                };

                let yAxisReferenceLine: powerbi.DataViewObject = {
                    show: true,
                    value: 340,
                    lineColor: { solid: { color: refLineColor1 } },
                    transparency: 60,
                    style: powerbi.visuals.lineStyle.dashed,
                    position: powerbi.visuals.referenceLinePosition.back,
                    dataLabelShow: true,
                    dataLabelColor: { solid: { color: refLineColor1 } },
                    dataLabelDecimalPoints: 0,
                    dataLabelHorizontalPosition: powerbi.visuals.referenceLineDataLabelHorizontalPosition.left,
                    dataLabelVerticalPosition: powerbi.visuals.referenceLineDataLabelVerticalPosition.above,
                };

                let xAxisReferenceLine: powerbi.DataViewObject = {
                    show: true,
                    value: 140,
                    lineColor: { solid: { color: refLineColor1 } },
                    transparency: 60,
                    style: powerbi.visuals.lineStyle.dashed,
                    position: powerbi.visuals.referenceLinePosition.back,
                    dataLabelShow: true,
                    dataLabelColor: { solid: { color: refLineColor1 } },
                    dataLabelDecimalPoints: 0,
                    dataLabelHorizontalPosition: powerbi.visuals.referenceLineDataLabelHorizontalPosition.left,
                    dataLabelVerticalPosition: powerbi.visuals.referenceLineDataLabelVerticalPosition.above,
                };

                dataView.metadata.objects = {
                    y1AxisReferenceLine: [
                        {
                            id: '0',
                            object: yAxisReferenceLine,
                        },
                    ],
                    xAxisReferenceLine: [
                        {
                            id: '0',
                            object: xAxisReferenceLine,
                        }
                    ],
                };

                v.onDataChanged({
                    dataViews: [dataView]
                });

                setTimeout(() => {
                    let graphicsContext = $('.scatterChart .mainGraphicsContext');

                    let yLine = $('.y1-ref-line');
                    let yLabel = $('.labelGraphicsContext .label').eq(0);
                    helpers.verifyReferenceLine(
                        yLine,
                        yLabel,
                        graphicsContext,
                        {
                            inFront: false,
                            isHorizontal: true,
                            color: refLineColor1,
                            style: powerbi.visuals.lineStyle.dashed,
                            opacity: 0.4,
                            label: {
                                color: refLineColor1,
                                horizontalPosition: powerbi.visuals.referenceLineDataLabelHorizontalPosition.left,
                                text: '340',
                                verticalPosition: powerbi.visuals.referenceLineDataLabelVerticalPosition.above,
                            },
                        });

                    let xLine = $('.x-ref-line');
                    let xLabel = $('.labelGraphicsContext .label').eq(1);
                    helpers.verifyReferenceLine(
                        xLine,
                        xLabel,
                        graphicsContext,
                        {
                            inFront: false,
                            isHorizontal: false,
                            color: refLineColor1,
                            style: powerbi.visuals.lineStyle.dashed,
                            opacity: 0.4,
                            label: {
                                color: refLineColor1,
                                horizontalPosition: powerbi.visuals.referenceLineDataLabelHorizontalPosition.left,
                                text: '140',
                                verticalPosition: powerbi.visuals.referenceLineDataLabelVerticalPosition.above,
                            },
                        });

                    yAxisReferenceLine['lineColor'] = { solid: { color: refLineColor2 } };
                    yAxisReferenceLine['style'] = powerbi.visuals.lineStyle.dotted;
                    yAxisReferenceLine['position'] = powerbi.visuals.referenceLinePosition.front;
                    yAxisReferenceLine['transparency'] = 0;
                    yAxisReferenceLine['dataLabelColor'] = { solid: { color: refLineColor2 } };

                    xAxisReferenceLine['lineColor'] = { solid: { color: refLineColor2 } };
                    xAxisReferenceLine['style'] = powerbi.visuals.lineStyle.dotted;
                    xAxisReferenceLine['position'] = powerbi.visuals.referenceLinePosition.front;
                    xAxisReferenceLine['transparency'] = 0;
                    xAxisReferenceLine['dataLabelColor'] = { solid: { color: refLineColor2 } };

                    v.onDataChanged({
                        dataViews: [dataView]
                    });

                    setTimeout(() => {
                        yLine = $('.y1-ref-line');
                        yLabel = $('.labelGraphicsContext .label').eq(0);
                        helpers.verifyReferenceLine(
                            yLine,
                            yLabel,
                            graphicsContext,
                            {
                                inFront: true,
                                isHorizontal: true,
                                color: refLineColor2,
                                style: powerbi.visuals.lineStyle.dotted,
                                opacity: 1.0,
                                label: {
                                    color: refLineColor2,
                                    horizontalPosition: powerbi.visuals.referenceLineDataLabelHorizontalPosition.left,
                                    text: '340',
                                    verticalPosition: powerbi.visuals.referenceLineDataLabelVerticalPosition.above,
                                },
                            });

                        xLine = $('.x-ref-line');
                        xLabel = $('.labelGraphicsContext .label').eq(1);
                        helpers.verifyReferenceLine(
                            xLine,
                            xLabel,
                            graphicsContext,
                            {
                                inFront: true,
                                isHorizontal: false,
                                color: refLineColor2,
                                style: powerbi.visuals.lineStyle.dotted,
                                opacity: 1.0,
                                label: {
                                    color: refLineColor2,
                                    horizontalPosition: powerbi.visuals.referenceLineDataLabelHorizontalPosition.left,
                                    text: '140',
                                    verticalPosition: powerbi.visuals.referenceLineDataLabelVerticalPosition.above,
                                },
                            });

                        yAxisReferenceLine['show'] = false;
                        yAxisReferenceLine['dataLabelShow'] = false;

                        xAxisReferenceLine['show'] = false;
                        xAxisReferenceLine['dataLabelShow'] = false;

                        v.onDataChanged({
                            dataViews: [dataView]
                        });

                        setTimeout(() => {
                            expect($('.y1-ref-line').length).toBe(0);
                            expect($('.x-ref-line').length).toBe(0);
                            expect($('.scatterChart .labelGraphicsContext .label').length).toBe(0);

                            done();
                        }, DefaultWaitForRender);
                    }, DefaultWaitForRender);
                }, DefaultWaitForRender);
            });

            it('background image', (done) => {
                dataViewMetadataFourColumn.objects = {
                    plotArea: {
                        image: {
                            url: 'data:image/gif;base64,R0lGO',
                            name: 'someName',
                        }
                    },
                };
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e']
                            }],
                            values: DataViewTransform.createValueColumns([{
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [500000, 495000, 490000, 480000, 500000],
                                subtotal: 2465000
                            }])
                        }
                    }]
                });
                setTimeout(() => {
                    let backgroundImage = $('.scatterChart .background-image');
                    expect(backgroundImage.length).toBeGreaterThan(0);
                    expect(backgroundImage.css('height')).toBeDefined();
                    expect(backgroundImage.css('width')).toBeDefined();
                    expect(backgroundImage.css('left')).toBeDefined();
                    expect(backgroundImage.css('bottom')).toBeDefined();
                    done();
                }, DefaultWaitForRender);
            });
        }

        describe("scatterChart DOM validation", () => scatterChartDomValidation(false));

        describe("interactive scatterChart DOM validation", () => scatterChartDomValidation(true));

        describe("scatterChart bubble radius validation", () => {

            it('scatter chart getBubblePixelAreaSizeRange validation', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };
                let bubblePixelArea = ScatterChart.getBubblePixelAreaSizeRange(viewport, 100, 200);
                expect(bubblePixelArea.minRange).toBe(278);
                expect(bubblePixelArea.maxRange).toBe(556);
                expect(bubblePixelArea.delta).toBe(278);
            });

            it('scatter chart projectSizeToPixel validation', () => {
                let element = powerbitests.helpers.testDom('500', '500');
                let v = powerbi.visuals.visualPluginFactory.create().getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: powerbitests.mocks.createVisualHostServices(),
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true }
                });

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [210, 220, 230, 240, 250]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [310, 320, 330, 340, 350]
                                }])
                        }
                    }]
                });

                let actualSizeDataRange = {
                    minRange: 310,
                    maxRange: 350,
                    delta: 40
                };

                let bubblePixelAreaSizeRange = {
                    minRange: 278,
                    maxRange: 556,
                    delta: 278
                };

                let projectedSize = ScatterChart.projectSizeToPixels(310, actualSizeDataRange, bubblePixelAreaSizeRange);
                expect(projectedSize).toBe(19);
                projectedSize = ScatterChart.projectSizeToPixels(320, actualSizeDataRange, bubblePixelAreaSizeRange);
                expect(projectedSize).toBe(21);
                projectedSize = ScatterChart.projectSizeToPixels(330, actualSizeDataRange, bubblePixelAreaSizeRange);
                expect(projectedSize).toBe(23);
            });
        });

        describe("scatterChart converter validation", () => {

            it('scatter chart dataView with role validation', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let dataView = getDataViewWithSharedCategoryAndSeries();
                dataView.metadata.objects = { categoryLabels: { show: true } };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));

                let dataPoints = scatterChartData.dataPoints;
                expect(dataPoints[0].category).toBe("a");
                expect(dataPoints[0].x).toBe(0);
                expect(dataPoints[0].y).toBe(10);
                expect(dataPoints[0].fill).toBeDefined();
                expect(dataPoints[0].fill).not.toBe(dataPoints[1].fill);
                expect(scatterChartData.xCol).toBe(dataView.metadata.columns[1]);
                expect(scatterChartData.size).toBe(dataView.metadata.columns[2]);
                expect(scatterChartData.yCol).toBe(dataView.metadata.columns[3]);

                // No legend if we don't have a field in legend
                expect(scatterChartData.legendData.dataPoints.map(l => l.label)).toEqual(['a', 'b', 'c']);
                let legendColors = scatterChartData.legendData.dataPoints.map(l => l.color);
                expect(legendColors).toEqual(ArrayExtensions.distinct(legendColors));

                expect(scatterChartData.legendData.title).toBe('series');

                //Tooltips
                expect(dataPoints[0].tooltipInfo).toEqual([{ displayName: 'series', value: 'a' }, { displayName: 'value1', value: '0' }, { displayName: 'value3', value: '10' }, { displayName: 'value2', value: '1' }]);
                expect(dataPoints[1].tooltipInfo).toEqual([{ displayName: 'series', value: 'b' }, { displayName: 'value1', value: '100' }, { displayName: 'value3', value: '20' }, { displayName: 'value2', value: '2' }]);
                expect(dataPoints[2].tooltipInfo).toEqual([{ displayName: 'series', value: 'c' }, { displayName: 'value1', value: '200' }, { displayName: 'value3', value: '30' }, { displayName: 'value2', value: '3' }]);
            });

            it('scatter chart null legend', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let dataView = getDataViewMultiSeries(null, 'Canada');

                let groupedValues = dataView.categorical.values.grouped();
                groupedValues[0].objects = { dataPoint: { fill: { solid: { color: '#41BEE1' } } } };
                dataView.categorical.values.grouped = () => groupedValues;
                
                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let dataPoints = scatterChartData.dataPoints;

                let legendItems = scatterChartData.legendData.dataPoints;
                expect(legendItems[0].label).toBe(powerbi.visuals.valueFormatter.format(null));
                helpers.assertColorsMatch(legendItems[0].color, '#41BEE1');

                let legendColors = legendItems.map(l => l.color);
                expect(legendColors).toEqual(ArrayExtensions.distinct(legendColors));

                // Show no tooltip item for null series
                // TODO: this is likely a bug
                expect(dataPoints.length).toBe(6);
                expect(dataPoints[0].tooltipInfo).toEqual([{ displayName: 'category', value: '2012' }, { displayName: 'x', value: '150.00' }, { displayName: 'y', value: '30' }, { displayName: 'size', value: '100' }]);
                expect(dataPoints[1].tooltipInfo).toEqual([{ displayName: 'category', value: '2012' }, { displayName: 'series', value: 'Canada' }, { displayName: 'x', value: '100.00' }, { displayName: 'y', value: '300' }, { displayName: 'size', value: '150' }]);

                expect(dataPoints[2].tooltipInfo).toEqual([{ displayName: 'category', value: '2011' }, { displayName: 'x', value: '177.00' }, { displayName: 'y', value: '25' }, { displayName: 'size', value: '200' }]);
                expect(dataPoints[3].tooltipInfo).toEqual([{ displayName: 'category', value: '2011' }, { displayName: 'series', value: 'Canada' }, { displayName: 'x', value: '149.00' }, { displayName: 'y', value: '250' }, { displayName: 'size', value: '250' }]);

                expect(dataPoints[4].tooltipInfo).toEqual([{ displayName: 'category', value: '2010' }, { displayName: 'x', value: '157.00' }, { displayName: 'y', value: '28' }, { displayName: 'size', value: '300' }]);
                expect(dataPoints[5].tooltipInfo).toEqual([{ displayName: 'category', value: '2010' }, { displayName: 'series', value: 'Canada' }, { displayName: 'x', value: '144.00' }, { displayName: 'y', value: '280' }, { displayName: 'size', value: '350' }]);
            });

            it('scatter chart empty categories should return not-null category', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity(null),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: [null, 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [310, 320, 330, 340, 350],
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                expect(scatterChartData.dataPoints[0].category).toBe("(Blank)");
                expect(scatterChartData.dataPoints[0].tooltipInfo).toEqual([{ displayName: 'category', value: '(Blank)' }, { displayName: 'x', value: '110' }, { displayName: 'y', value: '210' }, { displayName: 'size', value: '310' }]);
            });

            it('scatter chart dataView with min/max', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [310, 320, 330, 340, 350],
                                min: 200,
                                max: 400
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));

                let dataPoints = scatterChartData.dataPoints;
                expect(dataPoints[0].category).toBe("a");
                expect(dataPoints[0].x).toBe(110);
                expect(dataPoints[0].y).toBe(210);
                expect(ScatterChart.getBubbleRadius(dataPoints[0].radius, scatterChartData.sizeRange, viewport)).toBe(46);
            });

            it('scatter chart dataView with minLocal/maxLocal', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [310, 320, 330, 340, 350],
                                minLocal: 200,
                                maxLocal: 400
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let dataPoints = scatterChartData.dataPoints;
                expect(dataPoints[0].category).toBe("a");
                expect(dataPoints[0].x).toBe(110);
                expect(dataPoints[0].y).toBe(210);
                expect(ScatterChart.getBubbleRadius(dataPoints[0].radius, scatterChartData.sizeRange, viewport)).toBe(46);
                expect(dataPoints[0].fill).toBeDefined();
            });

            it('scatter chart dataView without min/minLocal/max/maxLocal', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [310, 320, 330, 340, 350],
                            }])
                    }
                };
                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let dataPoints = scatterChartData.dataPoints;
                expect(dataPoints[0].category).toBe("a");
                expect(dataPoints[0].x).toBe(110);
                expect(dataPoints[0].y).toBe(210);
                expect(ScatterChart.getBubbleRadius(dataPoints[0].radius, scatterChartData.sizeRange, viewport)).toBe(48.5);
                expect(dataPoints[0].fill).toBeDefined();
            });

            it('scatterChart multi-series', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let dataView: powerbi.DataView = getDataViewMultiSeries();

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors)).dataPoints;
                expect(scatterChartData[0].category).toBe('1/1/2012');
                expect(scatterChartData[0].x).toBe(150);
                expect(scatterChartData[0].y).toBe(30);
                expect(scatterChartData[0].fill).toBeDefined();
                expect(scatterChartData[0].fill).not.toBe(scatterChartData[3].fill);

                //Tooltips
                expect(scatterChartData[0].tooltipInfo).toEqual([{ displayName: 'category', value: '2012' }, { displayName: 'series', value: 'Canada' }, { displayName: 'x', value: '150.00' }, { displayName: 'y', value: '30' }, { displayName: 'size', value: '100' }]);
                expect(scatterChartData[1].tooltipInfo).toEqual([{ displayName: 'category', value: '2012' }, { displayName: 'series', value: 'United States' }, { displayName: 'x', value: '100.00' }, { displayName: 'y', value: '300' }, { displayName: 'size', value: '150' }]);
                expect(scatterChartData[2].tooltipInfo).toEqual([{ displayName: 'category', value: '2011' }, { displayName: 'series', value: 'Canada' }, { displayName: 'x', value: '177.00' }, { displayName: 'y', value: '25' }, { displayName: 'size', value: '200' }]);
                expect(scatterChartData[3].tooltipInfo).toEqual([{ displayName: 'category', value: '2011' }, { displayName: 'series', value: 'United States' }, { displayName: 'x', value: '149.00' }, { displayName: 'y', value: '250' }, { displayName: 'size', value: '250' }]);
                expect(scatterChartData[4].tooltipInfo).toEqual([{ displayName: 'category', value: '2010' }, { displayName: 'series', value: 'Canada' }, { displayName: 'x', value: '157.00' }, { displayName: 'y', value: '28' }, { displayName: 'size', value: '300' }]);
                expect(scatterChartData[5].tooltipInfo).toEqual([{ displayName: 'category', value: '2010' }, { displayName: 'series', value: 'United States' }, { displayName: 'x', value: '144.00' }, { displayName: 'y', value: '280' }, { displayName: 'size', value: '350' }]);
            });

            it('selection state set on converter result', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let dataView: powerbi.DataView = getDataViewMultiSeries('GroupOne', 'GroupTwo');

                let host = powerbitests.mocks.createVisualHostServices();
                let interactivityService = <powerbi.visuals.InteractivityService>powerbi.visuals.createInteractivityService(host);
                let groupSelection = SelectionId.createWithId(mocks.dataViewScopeIdentity('GroupTwo'));
                interactivityService['selectedIds'] = [groupSelection];

                let converterOptions = createConverterOptions(
                    viewport,
                    powerbi.visuals.visualStyles.create().colorPalette.dataColors,
                    interactivityService
                );
                let scatterChartData = ScatterChart.converter(dataView, converterOptions);

                expect(scatterChartData.legendData.dataPoints[0].selected).toBe(false);
                expect(scatterChartData.legendData.dataPoints[1].selected).toBe(true);
            });

            it('scatterChart multi-series with default color', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let dataView: powerbi.DataView = getDataViewMultiSeries();

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let hexDefaultColorRed = "#FF0000";

                dataView.metadata = {
                    columns: null,
                    objects: { dataPoint: { defaultColor: { solid: { color: hexDefaultColorRed } } } }
                };

                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors)).dataPoints;
                expect(scatterChartData[0].category).toBe('1/1/2012');
                expect(scatterChartData[0].x).toBe(150);
                expect(scatterChartData[0].y).toBe(30);
                helpers.assertColorsMatch(scatterChartData[0].fill, hexDefaultColorRed);
                expect(scatterChartData[0].fill).toBe(scatterChartData[2].fill);
                expect(scatterChartData[0].fill).toBe(scatterChartData[3].fill);
            });

            it('scatterChart multi-series with explicit colors', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let dataView: powerbi.DataView = getDataViewMultiSeries();

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;

                let groupedValues = dataView.categorical.values.grouped();
                groupedValues[0].objects = { dataPoint: { fill: { solid: { color: 'red' } } } };
                groupedValues[1].objects = { dataPoint: { fill: { solid: { color: 'green' } } } };
                dataView.categorical.values.grouped = () => groupedValues;

                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors)).dataPoints;
                expect(scatterChartData[0].fill).toBe('red');
                expect(scatterChartData[1].fill).toBe('green');
            });

            it('scatterChart categorical with explicit colors', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };
                let categoryValues = ['a', 'b', 'c', 'd', 'e'];
                let categoryIdentities = categoryValues.map(v => mocks.dataViewScopeIdentity(v));
                let categoryIdentityField = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 'e', column: 'category' });

                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: categoryValues,
                            identity: categoryIdentities,
                            identityFields: [categoryIdentityField],
                            objects: [{ dataPoint: { fill: { solid: { color: '#41BEE0' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE1' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE2' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE3' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE4' } } } }]
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [310, 320, 330, 340, 350],
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;

                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors)).dataPoints;
                helpers.assertColorsMatch(scatterChartData[0].fill, '#41BEE0');
                helpers.assertColorsMatch(scatterChartData[1].fill, '#41BEE1');
                helpers.assertColorsMatch(scatterChartData[2].fill, '#41BEE2');
                helpers.assertColorsMatch(scatterChartData[3].fill, '#41BEE3');
                helpers.assertColorsMatch(scatterChartData[4].fill, '#41BEE4');
            });

            it('scatterChart multi-series with min/max', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let dataView: powerbi.DataView = getDataViewMultiSeries(undefined, undefined, true);

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let dataPoints = scatterChartData.dataPoints;

                let firstSeries = dataPoints[0];
                expect(firstSeries.x).toBe(150);
                expect(firstSeries.y).toBe(30);
                expect(firstSeries.size).toBe(100);
                expect(ScatterChart.getBubbleRadius(firstSeries.radius, scatterChartData.sizeRange, viewport)).toBe(26);
                expect(firstSeries.fill).toBeDefined();

                let secondSeries = dataPoints[1];
                expect(secondSeries.x).toBe(100);
                expect(secondSeries.y).toBe(300);
                expect(secondSeries.size).toBe(150);
                expect(ScatterChart.getBubbleRadius(secondSeries.radius, scatterChartData.sizeRange, viewport)).toBe(30.5);
                expect(secondSeries.fill).toBeDefined();

                expect(firstSeries.category).toBe(secondSeries.category);
                expect(firstSeries.fill).not.toBe(secondSeries.fill);
            });

            it('scatter chart dataView that should pivot categories', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let metadata: powerbi.DataViewMetadata = {
                    columns: [
                        { displayName: '', queryName: '$s1', index: 0 },
                        { displayName: '', queryName: '$s2', isMeasure: true, index: 1 },
                        { displayName: '', queryName: '$s3', isMeasure: true, index: 2 },
                        { displayName: '', queryName: '$s4', isMeasure: true, index: 3 }
                    ]
                };

                let dataView: powerbi.DataView = {
                    metadata: metadata,
                    categorical: {
                        categories: [{
                            source: metadata.columns[0],
                            values: ['a', 'b'],
                            identity: [
                                mocks.dataViewScopeIdentity('a'),
                                mocks.dataViewScopeIdentity('b'),
                            ]
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: metadata.columns[1],
                                values: [110, 120]
                            }, {
                                source: metadata.columns[2],
                                values: [210, 220]
                            }, {
                                source: metadata.columns[3],
                                values: [310, 320]
                            }])
                    }
                };
                let pivotedDataView = DataViewTransform.apply({
                    prototype: dataView,
                    objectDescriptors: powerbi.visuals.plugins.scatterChart.capabilities.objects,
                    dataViewMappings: powerbi.visuals.plugins.scatterChart.capabilities.dataViewMappings,
                    transforms: {
                        selects: [
                            { displayName: 'col1', queryName: '$s1', roles: { 'Series': true } },
                            { displayName: 'col2', queryName: '$s2', roles: { 'Y': true } },
                            { displayName: 'col3', queryName: '$s3', roles: { 'Size': true } },
                            { displayName: 'col4', queryName: '$s4', roles: { 'X': true } },
                        ]
                    },
                    colorAllocatorFactory: powerbi.visuals.createColorAllocatorFactory(),
                    dataRoles: powerbi.visuals.plugins.scatterChart.capabilities.dataRoles,
                })[0];
                expect(pivotedDataView).not.toBe(dataView);

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(pivotedDataView, createConverterOptions(viewport, colors)).dataPoints;
                expect(scatterChartData[0].category).toBe('a');
                expect(scatterChartData[0].fill).not.toBe(scatterChartData[1].fill);

                //Tooltips
                expect(scatterChartData[0].tooltipInfo).toEqual([{ displayName: 'col1', value: 'a' }, { displayName: 'col4', value: '310' }, { displayName: 'col2', value: '110' }, { displayName: 'col3', value: '210' }]);
                expect(scatterChartData[1].tooltipInfo).toEqual([{ displayName: 'col1', value: 'b' }, { displayName: 'col4', value: '320' }, { displayName: 'col2', value: '120' }, { displayName: 'col3', value: '220' }]);
            });

            it('scatter chart bubble color category no size', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];

                let dataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let dataPoints = scatterChartData.dataPoints;
                expect(dataPoints[0].fill).toBe(dataPoints[1].fill);

                //Tooltips
                expect(dataPoints[0].tooltipInfo).toEqual([{ displayName: 'category', value: 'a' }, { displayName: 'x', value: '110' }, { displayName: 'y', value: '210' }]);
                expect(dataPoints[1].tooltipInfo).toEqual([{ displayName: 'category', value: 'b' }, { displayName: 'x', value: '120' }, { displayName: 'y', value: '220' }]);
                expect(dataPoints[2].tooltipInfo).toEqual([{ displayName: 'category', value: 'c' }, { displayName: 'x', value: '130' }, { displayName: 'y', value: '230' }]);
                expect(dataPoints[3].tooltipInfo).toEqual([{ displayName: 'category', value: 'd' }, { displayName: 'x', value: '140' }, { displayName: 'y', value: '240' }]);
                expect(dataPoints[4].tooltipInfo).toEqual([{ displayName: 'category', value: 'e' }, { displayName: 'x', value: '150' }, { displayName: 'y', value: '250' }]);
            });

            it('scatter chart bubble color category no size default color', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let hexDefaultColorRed = "#FF0000";

                dataViewMetadataFourColumn.objects = {
                    dataPoint: { defaultColor: { solid: { color: hexDefaultColorRed } } }
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let dataPoints = scatterChartData.dataPoints;
                helpers.assertColorsMatch(dataPoints[0].fill, hexDefaultColorRed);
            });

            it('scatter chart null X axes values', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                            objects: [{ dataPoint: { fill: { solid: { color: '#41BEE0' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE1' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE2' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE3' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE4' } } } }],
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                // X
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [null, null, null, null, null]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [110, 120, 130, 140, 150]
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let scatterChartDataPoints = scatterChartData.dataPoints;
                expect(scatterChartDataPoints.length).toBe(0);
            });

            it('scatter chart null Y axes values', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                // Y
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [null, null, null, null, null]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [110, 120, 130, 140, 150]
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let scatterChartDataPoints = scatterChartData.dataPoints;
                expect(scatterChartDataPoints.length).toBe(0);
            });

            it('scatter chart null X measure', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let dataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e']
                        }],
                        values: DataViewTransform.createValueColumns([
                            // No X role
                            {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let scatterChartDataPoints = scatterChartData.dataPoints;
                expect(scatterChartDataPoints.length).toBe(0);
            });

            it('scatter chart null Y measure', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                            objects: [{ dataPoint: { fill: { solid: { color: '#41BEE0' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE1' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE2' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE3' } } } },
                                { dataPoint: { fill: { solid: { color: '#41BEE4' } } } }],
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [210, 220, 230, 240, 250]
                            }
                            // No Y role
                        ])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let scatterChartDataPoints = scatterChartData.dataPoints;
                expect(scatterChartDataPoints[0].category).toBe('a');
                helpers.assertColorsMatch(scatterChartDataPoints[1].fill, '#41BEE1');
                expect(scatterChartDataPoints[0].x).toBe(210);
                expect(scatterChartDataPoints[0].y).toBe(0);
            });

            it('scatter chart null X and Y measure', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let dataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let scatterChartDataPoints = scatterChartData.dataPoints;
                expect(scatterChartDataPoints.length).toBe(0);
            });

            it('scatter chart converter data labels default values', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                ];
                let dataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210]
                            }])
                    }
                };
                let dataLabelsSettings = powerbi.visuals.dataLabelUtils.getDefaultPointLabelSettings();
                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;

                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));

                expect(scatterChartData.dataLabelsSettings).toEqual(dataLabelsSettings);
            });

            it('scatter chart bubble gradient color', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };
                
                dataViewMetadataFourColumn.columns.push({ displayName: 'gradient', isMeasure: true, roles: { "Gradient": true } });

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let objectDefinitions: powerbi.DataViewObjects[] = [
                    { dataPoint: { fill: { solid: { color: "#d9f2fb" } } } },
                    { dataPoint: { fill: { solid: { color: "#b1eab7" } } } },
                    { dataPoint: { fill: { solid: { color: "#cceab7" } } } },
                    { dataPoint: { fill: { solid: { color: "#b100b7" } } } },
                    { dataPoint: { fill: { solid: { color: "#cceab7" } } } }
                ];
                let dataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                            objects: objectDefinitions
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [10, 20, 15, 10, 100]
                            }, {
                                source: dataViewMetadataFourColumn.columns[4],
                                values: [13, 33, 55, 11, 55]
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let dataPoints = scatterChartData.dataPoints;

                helpers.assertColorsMatch(dataPoints[0].fill, '#d9f2fb');
                helpers.assertColorsMatch(dataPoints[1].fill, '#b1eab7');
                helpers.assertColorsMatch(dataPoints[2].fill, '#cceab7');
                helpers.assertColorsMatch(dataPoints[3].fill, '#b100b7');
                helpers.assertColorsMatch(dataPoints[4].fill, '#cceab7');
            });

            it('scatter chart bubble gradient color - validate tool tip', () => {
                let viewport: powerbi.IViewport = {
                    height: 500,
                    width: 500
                };
                
                dataViewMetadataFourColumn.columns.push({ displayName: 'gradient', isMeasure: true, roles: { "Gradient": true } });

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                let objectDefinitions: powerbi.DataViewObjects[] = [
                    { dataPoint: { fill: { solid: { color: "#d9f2fb" } } } },
                    { dataPoint: { fill: { solid: { color: "#b1eab7" } } } },
                    { dataPoint: { fill: { solid: { color: "#cceab7" } } } },
                    { dataPoint: { fill: { solid: { color: "#b100b7" } } } },
                    { dataPoint: { fill: { solid: { color: "#cceab7" } } } }
                ];
                let dataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                            objects: objectDefinitions
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [110, 120, 130, 140, 150]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [210, 220, 230, 240, 250]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [10, 20, 15, 10, 100]
                            }, {
                                source: dataViewMetadataFourColumn.columns[4],
                                values: [13, 33, 55, 11, 55]
                            }])
                    }
                };

                let colors = powerbi.visuals.visualStyles.create().colorPalette.dataColors;
                let scatterChartData = ScatterChart.converter(dataView, createConverterOptions(viewport, colors));
                let dataPoints = scatterChartData.dataPoints;

                // TODO: this should be showing gradient values as well.
                expect(dataPoints[0].tooltipInfo).toEqual([{ displayName: 'category', value: 'a' }, { displayName: 'x', value: '110' }, { displayName: 'y', value: '210' }, { displayName: 'size', value: '10' }]);
                expect(dataPoints[1].tooltipInfo).toEqual([{ displayName: 'category', value: 'b' }, { displayName: 'x', value: '120' }, { displayName: 'y', value: '220' }, { displayName: 'size', value: '20' }]);
                expect(dataPoints[2].tooltipInfo).toEqual([{ displayName: 'category', value: 'c' }, { displayName: 'x', value: '130' }, { displayName: 'y', value: '230' }, { displayName: 'size', value: '15' }]);
                expect(dataPoints[3].tooltipInfo).toEqual([{ displayName: 'category', value: 'd' }, { displayName: 'x', value: '140' }, { displayName: 'y', value: '240' }, { displayName: 'size', value: '10' }]);
                expect(dataPoints[4].tooltipInfo).toEqual([{ displayName: 'category', value: 'e' }, { displayName: 'x', value: '150' }, { displayName: 'y', value: '250' }, { displayName: 'size', value: '100' }]);

            });
        });

        describe('scatterChart interactivity', () => {
            let v: powerbi.IVisual, element: JQuery;
            let hostServices: powerbi.IVisualHostServices;

            beforeEach(() => {
                element = powerbitests.helpers.testDom('500', '500');
                hostServices = mocks.createVisualHostServices();
                v = powerbi.visuals.visualPluginFactory.createMinerva({ dataDotChartEnabled: false, heatMap: false }).getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: hostServices,
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true },
                    interactivity: { selection: true }
                });
            });

            it('check color for legend title and legend items scatter chart', (done) => {
                let dataView = getDataViewMultiSeries();

                dataView.metadata.objects = {
                        legend: {
                            titleText: 'my title text',
                            show: true,
                            showTitle: true,
                            labelColor: { solid: { color: labelColor } },
                        }
                };

                v.onDataChanged({ dataViews: [dataView] });

                setTimeout(() => {
                    let legend = element.find('.legend');
                    let legendTitle = legend.find('.legendTitle');
                    let legendText = legend.find('.legendItem').find('.legendText');
                    helpers.assertColorsMatch(legendTitle.css('fill'), labelColor);
                    helpers.assertColorsMatch(legendText.first().css('fill'), labelColor);
                    done();
                }, DefaultWaitForRender);

            });

            it('check font size for legend title and legend items scatter chart', (done) => {
                let labelFontSize = 13;
                let dataView = getDataViewMultiSeries();

                dataView.metadata.objects = {
                        legend: {
                            titleText: 'my title text',
                            show: true,
                            showTitle: true,
                            fontSize: labelFontSize
                        }
                };

                v.onDataChanged({ dataViews: [dataView] });

                setTimeout(() => {
                    let legend = element.find('.legend');
                    let legendTitle = legend.find('.legendTitle');
                    let legendText = legend.find('.legendItem').find('.legendText');
                    expect(Math.round(parseInt(legendTitle.css('font-size'), 10))).toBe(Math.round(parseInt(PixelConverter.fromPoint(labelFontSize), 10)));
                    expect(Math.round(parseInt(legendText.css('font-size'), 10))).toBe(Math.round(parseInt(PixelConverter.fromPoint(labelFontSize), 10)));
                    done();
                }, DefaultWaitForRender);

            });

            it('scatter chart single select', (done) => {
                let dimmedOpacity = ScatterChart.DimmedBubbleOpacity.toString();
                let defaultOpacity = ScatterChart.DefaultBubbleOpacity.toString();
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = element.find('.dot');
                    let trigger = powerbitests.helpers.getClickTriggerFunctionForD3(dots[1]);
                    let mockEvent = {
                        abc: 'def',
                        stopPropagation: () => { },
                    };

                    spyOn(hostServices, 'onSelect').and.callThrough();

                    trigger(mockEvent);

                    expect(dots.length).toBe(5);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[3]]
                                }
                            ],
                            data2: [{
                                dataMap: { 'select1': categoryIdentities[3] }
                            }]
                        });

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart repeated single select', (done) => {
                let dimmedOpacity = ScatterChart.DimmedBubbleOpacity.toString();
                let defaultOpacity = ScatterChart.DefaultBubbleOpacity.toString();
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = element.find('.dot');
                    let trigger1 = powerbitests.helpers.getClickTriggerFunctionForD3(dots[1]);
                    let trigger3 = powerbitests.helpers.getClickTriggerFunctionForD3(dots[3]);
                    let mockEvent = {
                        abc: 'def',
                        stopPropagation: () => { },
                    };
                    spyOn(hostServices, 'onSelect').and.callThrough();

                    trigger1(mockEvent);

                    expect(dots.length).toBe(5);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[3]]
                                }
                            ],
                            data2: [
                                {
                                    dataMap: { 'select1': categoryIdentities[3] }
                                }
                            ]
                        });
                    trigger3(mockEvent);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[1]]
                                }
                            ],
                            data2: [
                                {
                                    dataMap: { 'select1': categoryIdentities[1] }
                                }
                            ]

                        });
                    trigger3(mockEvent);
                    expect(dots[0].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(defaultOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: []
                        });

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart multi select', (done) => {
                let dimmedOpacity = ScatterChart.DimmedBubbleOpacity.toString();
                let defaultOpacity = ScatterChart.DefaultBubbleOpacity.toString();
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                });

                setTimeout(() => {    
                    // Dots show up in reverse order (e.g. dots.eq(0) is category 'e'; 1,d; 2,c; etc.)
                    let dots = element.find('.dot');
                    expect(dots.length).toBe(5);

                    let trigger1 = powerbitests.helpers.getClickTriggerFunctionForD3(dots[1]);
                    let trigger3 = powerbitests.helpers.getClickTriggerFunctionForD3(dots[3]);
                    let trigger4 = powerbitests.helpers.getClickTriggerFunctionForD3(dots[4]);
                    let mockEvent = {
                        abc: 'def',
                        ctrlKey: true,
                        stopPropagation: () => { },
                    };

                    spyOn(hostServices, 'onSelect').and.callThrough();
                
                    // Allow multiselection
                    spyOn(hostServices, 'canSelect').and.returnValue(true);

                    trigger1(mockEvent);

                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith({
                        data: [
                            { data: [categoryIdentities[3]] },
                        ],
                        data2: [
                            { dataMap: { 'select1': categoryIdentities[3] } },
                        ],
                    });

                    trigger3(mockEvent);

                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith({
                        data: [
                            { data: [categoryIdentities[3]] },
                            { data: [categoryIdentities[1]] },
                        ],
                        data2: [
                            { dataMap: { 'select1': categoryIdentities[3] } },
                            { dataMap: { 'select1': categoryIdentities[1] } },
                        ],
                    });

                    trigger4(mockEvent);

                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(defaultOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith({
                        data: [
                            { data: [categoryIdentities[3]] },
                            { data: [categoryIdentities[1]] },
                            { data: [categoryIdentities[0]] },
                        ],
                        data2: [
                            { dataMap: { 'select1': categoryIdentities[3] } },
                            { dataMap: { 'select1': categoryIdentities[1] } },
                            { dataMap: { 'select1': categoryIdentities[0] } },
                        ],
                    });

                    trigger1(mockEvent);

                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(defaultOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith({
                        data: [
                            { data: [categoryIdentities[3]] },
                            { data: [categoryIdentities[1]] },
                        ],
                        data2: [
                            { dataMap: { 'select1': categoryIdentities[3] } },
                            { dataMap: { 'select1': categoryIdentities[1] } },
                        ],
                    });

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart single and multi select', (done) => {
                let dimmedOpacity = ScatterChart.DimmedBubbleOpacity.toString();
                let defaultOpacity = ScatterChart.DefaultBubbleOpacity.toString();
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = element.find('.dot');
                    let trigger1 = powerbitests.helpers.getClickTriggerFunctionForD3(dots[1]);
                    let trigger3 = powerbitests.helpers.getClickTriggerFunctionForD3(dots[3]);
                    let trigger4 = powerbitests.helpers.getClickTriggerFunctionForD3(dots[4]);
                    let singleEvent = {
                        abc: 'def',
                        stopPropagation: () => { },
                    };
                    let multiEvent = {
                        abc: 'def',
                        ctrlKey: true,
                        stopPropagation: () => { },
                    };

                    spyOn(hostServices, 'onSelect').and.callThrough();

                    trigger1(singleEvent);

                    expect(dots.length).toBe(5);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[3]]
                                }
                            ],
                            data2: [
                                {
                                    dataMap: { 'select1': categoryIdentities[3] }
                                }
                            ]
                        });
                    trigger3(multiEvent);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[3]]
                                },
                            ],
                            data2: [
                                {
                                    dataMap: { 'select1': categoryIdentities[3] }
                                }
                            ]
                        });
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[1]]
                                }
                            ],
                            data2: [
                                {
                                    dataMap: { 'select1': categoryIdentities[1] }
                                }
                            ]
                        });
                    trigger1(singleEvent);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    trigger4(multiEvent);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(defaultOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[3]]
                                }
                            ]
                            ,
                            data2: [
                                {
                                    dataMap: { 'select1': categoryIdentities[3] }
                                }
                            ]
                        });
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[0]]
                                }
                            ]
                            ,
                            data2: [
                                {
                                    dataMap: { 'select1': categoryIdentities[0] }
                                }
                            ]
                        });
                    trigger3(singleEvent);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data: [categoryIdentities[1]]
                                }
                            ],
                            data2: [
                                {
                                    dataMap: { 'select1': categoryIdentities[1] }
                                }
                            ]
                        });

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart external clear', (done) => {
                let dimmedOpacity = ScatterChart.DimmedBubbleOpacity.toString();
                let defaultOpacity = ScatterChart.DefaultBubbleOpacity.toString();
                let identities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: identities
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = element.find('.dot');
                    let trigger = powerbitests.helpers.getClickTriggerFunctionForD3(dots[1]);
                    let mockEvent = {
                        abc: 'def',
                        stopPropagation: () => { },
                    };

                    spyOn(hostServices, 'onSelect').and.callThrough();

                    trigger(mockEvent);

                    expect(dots.length).toBe(5);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data:
                                    [
                                        identities[3]
                                    ]
                                }
                            ],
                            data2: [
                                {
                                    dataMap: { 'select1': identities[3] }
                                }
                            ]
                        });

                    v.onClearSelection();
                    expect(dots[0].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(defaultOpacity);

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart clear on clearCatcher click', (done) => {
                let dimmedOpacity = ScatterChart.DimmedBubbleOpacity.toString();
                let defaultOpacity = ScatterChart.DefaultBubbleOpacity.toString();
                let identities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: identities
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = element.find('.dot');
                    let trigger = powerbitests.helpers.getClickTriggerFunctionForD3(dots[1]);
                    let mockEvent = {
                        abc: 'def',
                        stopPropagation: () => { },
                    };

                    spyOn(hostServices, 'onSelect').and.callThrough();

                    trigger(mockEvent);

                    expect(dots.length).toBe(5);
                    expect(dots[0].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(dimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(dimmedOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: [
                                {
                                    data:
                                    [
                                        identities[3]
                                    ]
                                }
                            ],
                            data2: [
                                {
                                    dataMap: { 'select1': identities[3] }
                                }
                            ]
                        });

                    (<any>($('.clearCatcher').last())).d3Click(0, 0);
                    expect(dots[0].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[1].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[3].style.fillOpacity).toBe(defaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(defaultOpacity);
                    expect(hostServices.onSelect).toHaveBeenCalledWith(
                        {
                            data: []
                        });

                    done();
                }, DefaultWaitForRender);
            });
        });

        describe("interactive legend scatterChart validation", () => {
            let v: powerbi.IVisual;
            let element: JQuery;

            beforeEach(() => {
                element = powerbitests.helpers.testDom('500', '500');
                v = powerbi.visuals.visualPluginFactory.createMobile().getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: powerbitests.mocks.createVisualHostServices(),
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true },
                    interactivity: { isInteractiveLegend: true },
                });

                let identities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];

                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: identities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [210, 220, 230, 240, 250]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [310, 320, 330, 340, 350]
                                }])
                        }
                    }]
                });
            });

            it('Interaction scatter chart click validation', (done) => {
                let { x: x, y: y } = getSelectedBubblePosition();
                let mouseCordinate = { x: x - 5, y: y + 6 };
                let behavior = v["behavior"]["behaviors"][0];
                spyOn(behavior, 'getMouseCoordinates').and.returnValue(mouseCordinate);
                behavior.onClick();
                setTimeout(() => {
                    validateInteraction(x, y, v);
                    done();
                }, DefaultWaitForRender);
            });

            it('Scatter chart drag interaction validation', (done) => {
                let { x: x, y: y } = getSelectedBubblePosition();
                let mouseCordinate = { x: x, y: y };
                let behavior = v["behavior"]["behaviors"][0];
                spyOn(behavior, 'getMouseCoordinates').and.returnValue(mouseCordinate);
                behavior.onDrag();
                setTimeout(() => {
                    validateInteraction(x, y, v);
                    done();
                }, DefaultWaitForRender);
            });

            it('Interaction scatter chart dotClick validation', (done) => {
                let { x: x, y: y } = getSelectedBubblePosition();
                let behavior = v["behavior"]["behaviors"][0];
                let selectedDotIndex = behavior.findClosestDotIndex(x, y);
                behavior.selectDotByIndex(selectedDotIndex);
                setTimeout(() => {
                    validateInteraction(x, y, v);
                    done();
                }, DefaultWaitForRender);
            });

            function getSelectedBubblePosition(): { x: number; y: number } {
                let selectedCircle = getMarkersD3().filter(function (d, i) { return d.category === 'd'; });
                let x = parseFloat(selectedCircle.attr('cx'));
                let y = parseFloat(selectedCircle.attr('cy'));

                return { x: x, y: y };
            }
        });

        function validateInteraction(x: number, y: number, cartesianChart: any): void {    
            //test crosshair position
            let mainGraphicsContext = $('.scatterChart .mainGraphicsContext > svg');
            let behavior = (<any>cartesianChart).behavior.behaviors[0];
            expect(behavior.crosshair.select(".horizontal").attr('y1')).toBe(y.toString());
            expect(behavior.crosshair.select(".horizontal").attr('y2')).toBe(y.toString());
            expect(behavior.crosshair.select(".vertical").attr('x1')).toBe(x.toString());
            expect(behavior.crosshair.select(".vertical").attr('x2')).toBe(x.toString());
            expect(behavior.crosshair.select(".horizontal").attr('x1')).toBe('0');
            expect(behavior.crosshair.select(".horizontal").attr('x2')).toBe(mainGraphicsContext.attr('width'));
            expect(behavior.crosshair.select(".vertical").attr('y1')).toBe(mainGraphicsContext.attr('height'));
            expect(behavior.crosshair.select(".vertical").attr('y2')).toBe('0');

            //test style => dot 3 should be selected
            expect(getMarkersD3().filter(function (d, i) { return (d.x !== 140) && (d.y !== 240); }).attr('class')).toBe("dot notSelected");
            expect(getMarkersD3().filter(function (d, i) { return (d.x === 140) && (d.y === 240); }).attr('class')).toBe("dot selected");
        
            //test legend
            expect($('.interactive-legend').find('.title').text().trim()).toMatch("d");
            expect($('.interactive-legend').find('.item').find('.itemName')[0].innerText.trim()).toBe('x');
            expect($('.interactive-legend').find('.item').find('.itemName')[1].innerText.trim()).toBe('size');
            expect($('.interactive-legend').find('.item').find('.itemName')[2].innerText.trim()).toBe('y');
            expect($('.interactive-legend').find('.item').find('.itemMeasure')[0].innerText.trim()).toBe('140.00');
            expect($('.interactive-legend').find('.item').find('.itemMeasure')[1].innerText.trim()).toBe('340.00');
            expect($('.interactive-legend').find('.item').find('.itemMeasure')[2].innerText.trim()).toBe('240.00');
        }

        describe("scatterChart axis label existence validation", () => {

            it('scatter chart axis labels existence dom validation with viewport height greater than axisLabelVisibleMinHeight non-interactive', (done) => {
                testAxisAndLegendExistence(axisLabelVisibleGreaterThanMinHeightString, axisLabelVisibleGreaterThanMinHeightString, false, false);

                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .xAxisLabel').length).toBe(1);
                    expect($('.scatterChart .axisGraphicsContext .yAxisLabel').length).toBe(1);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart axis labels existence dom validation with viewport height greater than axisLabelVisibleMinHeight interactive', (done) => {
                testAxisAndLegendExistence(axisLabelVisibleGreaterThanMinHeightString, axisLabelVisibleGreaterThanMinHeightString, true, false);

                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .xAxisLabel').length).toBe(1);
                    expect($('.scatterChart .axisGraphicsContext .yAxisLabel').length).toBe(1);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart axis labels existence dom validation with viewport height smaller than axisLabelVisibleMinHeight non-interactive', (done) => {
                testAxisAndLegendExistence(axisLabelVisibleSmallerThanMinHeightString, axisLabelVisibleSmallerThanMinHeightString, false, false);

                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .xAxisLabel').length).toBe(1);
                    expect($('.scatterChart .axisGraphicsContext .yAxisLabel').length).toBe(1);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart axis labels existence dom validation with viewport height smaller than axisLabelVisibleMinHeight interactive', (done) => {
                testAxisAndLegendExistence(axisLabelVisibleSmallerThanMinHeightString, axisLabelVisibleSmallerThanMinHeightString, true, false);

                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .xAxisLabel').length).toBe(1);
                    expect($('.scatterChart .axisGraphicsContext .yAxisLabel').length).toBe(1);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart axis labels existence dom validation with viewport height smaller than axisLabelVisibleMinHeight non-interactive mobile', (done) => {
                testAxisAndLegendExistence(axisLabelVisibleSmallerThanMinHeightString, axisLabelVisibleSmallerThanMinHeightString, false, true);

                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .xAxisLabel').length).toBe(0);
                    expect($('.scatterChart .axisGraphicsContext .yAxisLabel').length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart axis labels existence dom validation with viewport height greater than axisLabelVisibleMinHeight non-interactive mobile', (done) => {
                testAxisAndLegendExistence(axisLabelVisibleGreaterThanMinHeightString, axisLabelVisibleGreaterThanMinHeightString, false, true);

                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .xAxisLabel').length).toBe(1);
                    expect($('.scatterChart .axisGraphicsContext .yAxisLabel').length).toBe(1);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart axis labels existence dom validation with viewport height smaller than axisLabelVisibleMinHeight interactive mobile', (done) => {
                testAxisAndLegendExistence(axisLabelVisibleSmallerThanMinHeightString, axisLabelVisibleSmallerThanMinHeightString, true, true);

                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .xAxisLabel').length).toBe(1);
                    expect($('.scatterChart .axisGraphicsContext .yAxisLabel').length).toBe(1);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart axis labels existence dom validation with viewport height greater than axisLabelVisibleMinHeight interactive mobile', (done) => {
                testAxisAndLegendExistence(axisLabelVisibleGreaterThanMinHeightString, axisLabelVisibleGreaterThanMinHeightString, true, true);

                setTimeout(() => {
                    expect($('.scatterChart .axisGraphicsContext .xAxisLabel').length).toBe(1);
                    expect($('.scatterChart .axisGraphicsContext .yAxisLabel').length).toBe(1);
                    done();
                }, DefaultWaitForRender);
            });
        });

        describe("scatterChart legends existence validation", () => {

            it('scatter chart legends existence dom validation with viewport height greater than legendVisibleMinHeight non-interactive', (done) => {
                testAxisAndLegendExistence(legendVisibleGreaterThanMinHeightString, "500", false, false);

                setTimeout(() => {
                    expect($('.legendText').length).toBe(3);
                    expect($('.legendItem').length).toBe(3);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart legends existence dom validation with viewport height smaller than legendVisibleMinHeight non-interactive', (done) => {
                testAxisAndLegendExistence(legendVisibleSmallerThanMinHeightString, "500", false, false);

                setTimeout(() => {
                    expect($('.legendText').length).toBe(3);
                    expect($('.legendItem').length).toBe(3);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart legends existence dom validation with viewport height smaller than legendVisibleMinHeight non-interactive mobile', (done) => {
                testAxisAndLegendExistence(legendVisibleSmallerThanMinHeightString, legendVisibleSmallerThanMinHeightString, false, true);

                setTimeout(() => {
                    expect($('.legend .label').length).toBe(0);
                    expect($('.legend .item').length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart legends existence dom validation with viewport height greater than legendVisibleMinHeight non-interactive mobile', (done) => {
                testAxisAndLegendExistence(legendVisibleGreaterThanMinHeightString, "500", false, true);

                setTimeout(() => {
                    expect($('.legendText').length).toBe(3);
                    expect($('.legendItem').length).toBe(3);
                    done();
                }, DefaultWaitForRender);
            });
        });

        describe("Enumerate Objects", () => {
            let v: powerbi.IVisual, element: JQuery;

            beforeEach(() => {
                element = powerbitests.helpers.testDom('500', '500');
                v = powerbi.visuals.visualPluginFactory.create().getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: powerbitests.mocks.createVisualHostServices(),
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true }
                });
            });

            it('Check basic enumeration', (done) => {
                let categoryValues = ['a', 'b', 'c', 'd', 'e'];
                let categoryIdentities = categoryValues.map(v => mocks.dataViewScopeIdentity(v));
                let dataChangedOptions = {
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: categoryValues,
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                };

                v.onDataChanged(dataChangedOptions);

                setTimeout(() => {
                    let points = <VisualObjectInstanceEnumerationObject>v.enumerateObjectInstances({ objectName: 'dataPoint' });
                    expect(points.instances.length).toBe(6);
                    expect(points.instances[0].properties['defaultColor']).toBeDefined();
                    expect(points.instances[0].properties['showAllDataPoints']).toBeDefined();
                    for (let i = 2; i < points.instances.length; i++) {
                        expect(_.contains(categoryValues, points.instances[i].displayName)).toBeTruthy();
                        expect(points.instances[i].properties['fill']).toBeDefined();
                    }
                    done();
                }, DefaultWaitForRender);
            });

            it('enumerateObjectInstances: Verify x-axis property card for scatter chart', () => {
                let dataChangedOptions = {
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [1, 2, 3, 4, 5]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                };

                v.onDataChanged(dataChangedOptions);

                let points = <VisualObjectInstanceEnumerationObject>v.enumerateObjectInstances({ objectName: 'categoryAxis' });

                expect('start' in points.instances[0].properties).toBeTruthy();//better to check if the index key is found
                expect('end' in points.instances[0].properties).toBeTruthy();
                expect('axisType' in points.instances[0].properties).toBeFalsy();
                expect('show' in points.instances[0].properties).toBeTruthy();
                expect('showAxisTitle' in points.instances[0].properties).toBeTruthy();
                expect('axisStyle' in points.instances[0].properties).toBeTruthy();
            });

            it('enumerateObjectInstances: Verify colorByCategory property card for scatter chart', () => {

                let dataView: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [1, 2, 3, 4, 5]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [200, 400, 600, 800, 1000]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [1, 2, 3, 4, 5]
                            }])
                    }
                };

                v.onDataChanged({ dataViews: [dataView] });
                let enumeration = <VisualObjectInstanceEnumerationObject>v.enumerateObjectInstances({ objectName: 'colorByCategory' });
                expect('show' in enumeration.instances[0].properties).toBeTruthy(); //show is a valid property
                expect(enumeration.instances[0].properties['show']).toBeFalsy(); //value of show is falsey
            
                v.onDataChanged({ dataViews: [getDataViewMultiSeries()] });
                enumeration = <VisualObjectInstanceEnumerationObject>v.enumerateObjectInstances({ objectName: 'colorByCategory' });
                expect(enumeration).toBeUndefined();
            });

            it('enumerateObjectInstances: fill point default depends on gradient role', () => {
                // Fill point is not shown when we have a 'Size' role, so remove it
                dataViewMetadataFourColumn.columns = _.remove(dataViewMetadataFourColumn.columns, (column) => column.roles['Size'] === true);

                // Without Gradient role
                let dataViewWithoutGradient: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [1, 2, 3, 4, 5]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [200, 400, 600, 800, 1000]
                            }])
                    }
                };

                v.onDataChanged({ dataViews: [dataViewWithoutGradient] });
                let enumeration = <VisualObjectInstanceEnumerationObject>v.enumerateObjectInstances({ objectName: 'fillPoint' });
                expect('show' in enumeration.instances[0].properties).toBe(true);
                expect(enumeration.instances[0].properties['show']).toBe(false);

                // With Gradient role
                dataViewMetadataFourColumn.columns.push({ displayName: 'gradient', isMeasure: true, roles: { "Gradient": true } });

                let dataViewWithGradient: powerbi.DataView = {
                    metadata: dataViewMetadataFourColumn,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [1, 2, 3, 4, 5]
                            }, {
                                source: dataViewMetadataFourColumn.columns[2],
                                values: [200, 400, 600, 800, 1000]
                            }, {
                                source: dataViewMetadataFourColumn.columns[3],
                                values: [1, 2, 3, 4, 5],
                            }])
                    }
                };

                v.onDataChanged({ dataViews: [dataViewWithGradient] });
                enumeration = <VisualObjectInstanceEnumerationObject>v.enumerateObjectInstances({ objectName: 'fillPoint' });
                expect('show' in enumeration.instances[0].properties).toBe(true);
                expect(enumeration.instances[0].properties['show']).toBe(true);
            });

            it('X-axis customization: Test forced domain (start and end)', () => {
                dataViewMetadataFourColumn.objects = {
                    categoryAxis: {
                        show: true,
                        start: 0,
                        end: 25,
                        axisType: AxisType.scalar,
                        showAxisTitle: true,
                        axisStyle: true
                    }
                };
                let dataChangedOptions = {
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [1, 2, 3, 4, 5],
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                };
                v.onDataChanged(dataChangedOptions);

            let labels = $('.x.axis').children('.tick').find("text");

            expect(helpers.findElementText($(labels).first())).toBe('0');
            expect(helpers.findElementText($(labels).last())).toBe('25');
            //check titles
            expect(helpers.findElementTitle($(labels).first())).toBe('0');
            expect(helpers.findElementTitle($(labels).last())).toBe('25');
            });

            it('X-axis customization: Test axis display units and precision', () => {
                dataViewMetadataFourColumn.objects = {
                    categoryAxis: {
                        show: true,
                        start: 0,
                        end: 30,
                        axisType: AxisType.scalar,
                        showAxisTitle: true,
                        axisStyle: true,
                        labelDisplayUnits: 1000000,
                        labelPrecision: 5
                    }
                };
                var dataChangedOptions = {
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [1, 2, 3, 4, 5],
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                };
                v.onDataChanged(dataChangedOptions);

            var labels = $('.x.axis').children('.tick').find("text");

            expect(helpers.findElementText($(labels).first())).toBe('0.00000M');
            expect(helpers.findElementText($(labels).last())).toBe('0.00003M');
            //check titles
            expect(helpers.findElementTitle($(labels).first())).toBe('0.00000M');
            expect(helpers.findElementTitle($(labels).last())).toBe('0.00003M');
            });

            it('X-axis customization: Set axis color', () => {
                dataViewMetadataFourColumn.objects = {
                    categoryAxis: {
                        show: true,
                        start: 0,
                        end: 25,
                        axisType: AxisType.scalar,
                        showAxisTitle: true,
                        axisStyle: true,
                        labelColor: { solid: { color: '#ff0000' } }
                    }
                };
                let dataChangedOptions = {
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[1],
                                values: [1, 2, 3, 4, 5],
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                };
                v.onDataChanged(dataChangedOptions);

                let labels = $('.x.axis').children('.tick');
                helpers.assertColorsMatch(labels.find('text').css('fill'), '#ff0000');
            });

            it('Y-axis customization: Test forced domain (start and end)', () => {
                dataViewMetadataFourColumn.objects = {
                    valueAxis: {
                        show: true,
                        position: 'Right',
                        start: 0,
                        end: 500,
                        showAxisTitle: true,
                        axisStyle: true
                    }
                };
                let dataChangedOptions = {
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: [1, 2, 3, 4, 5],
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                };
                v.onDataChanged(dataChangedOptions);

            let labels = $('.y.axis').children('.tick').find("text");

            expect(helpers.findElementText($(labels).first())).toBe('0');
            expect(helpers.findElementText($(labels).last())).toBe('500');
            //check titles
            expect(helpers.findElementTitle($(labels).first())).toBe('0');
            expect(helpers.findElementTitle($(labels).last())).toBe('500');
            });

            it('Y-axis customization: Test axis display units and precision', () => {
                dataViewMetadataFourColumn.objects = {
                    valueAxis: {
                        show: true,
                        position: 'Right',
                        start: 0,
                        end: 500,
                        showAxisTitle: true,
                        axisStyle: true,
                        labelDisplayUnits: 1000,
                        labelPrecision: 5
                    }
                };
                var dataChangedOptions = {
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: [1, 2, 3, 4, 5],
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                };
                v.onDataChanged(dataChangedOptions);

            var labels = $('.y.axis').children('.tick').find("text");

            expect(helpers.findElementText($(labels).first())).toBe('0.00000K');
            expect(helpers.findElementText($(labels).last())).toBe('0.50000K');
            //check titles
            expect(helpers.findElementTitle($(labels).first())).toBe('0.00000K');
            expect(helpers.findElementTitle($(labels).last())).toBe('0.50000K');
            });

            it('Y-axis customization: Set axis color', () => {
                dataViewMetadataFourColumn.objects = {
                    valueAxis: {
                        show: true,
                        position: 'Right',
                        start: 0,
                        end: 500,
                        showAxisTitle: true,
                        axisStyle: true,
                        labelColor: { solid: { color: '#ff0000' } }
                    }
                };
                let dataChangedOptions = {
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: [1, 2, 3, 4, 5],
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [100, 200, 300, 400, 500]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [200, 400, 600, 800, 1000]
                                }, {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [1, 2, 3, 4, 5]
                                }])
                        }
                    }]
                };
                v.onDataChanged(dataChangedOptions);

                let labels = $('.y.axis').children('.tick');
                helpers.assertColorsMatch(labels.find('text').css('fill'), '#ff0000');
            });
        });

        describe("Fill Point validation", () => {
            let v: powerbi.IVisual, element: JQuery;
            let hostServices: powerbi.IVisualHostServices;

            beforeEach(() => {
                hostServices = powerbitests.mocks.createVisualHostServices();
                element = powerbitests.helpers.testDom('500', '500');
                v = powerbi.visuals.visualPluginFactory.create().getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: hostServices,
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true },
                    interactivity: { isInteractiveLegend: false },
                });
            });

            it('scatter chart with size verify label fill with null size', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [3, null, 27],
                                    min: 0,
                                    max: 30
                                }
                            ])
                        }
                    }]
                });

                setTimeout(() => {
                    expect(getMarkers().first().css('fill-opacity')).toBeGreaterThan(0);
                
                    // null size should be hollow
                    expect(getMarkers().eq(2).css('fill-opacity')).toBe('0');

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart with size verify label fill', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];
                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataFourColumn,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataFourColumn.columns[0],
                                values: ['a', 'b', 'c'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataFourColumn.columns[1],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[2],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataFourColumn.columns[3],
                                    values: [3, 15, 27],
                                    min: 0,
                                    max: 30
                                }
                            ])
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = getMarkers();
                    for (let i = 0; i < dots.length; i++) {
                        let pointFill = dots.eq(i).css('fill-opacity');
                        expect(pointFill).toBeGreaterThan(0);
                    }
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart without size verify label fill when fill point is on', (done) => {    
                // Category and series are the same field
                let metadata: powerbi.DataViewMetadata = {
                    columns: [
                        { displayName: 'series', isMeasure: false, queryName: 'series', roles: { "Category": true, "Series": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text) },
                        { displayName: 'value1', groupName: 'a', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'a', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'b', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'b', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'c', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'c', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    ],
                    objects: {
                        fillPoint: { show: true },
                    },
                };
                let seriesValues = ['a', 'b', 'c'];
                let seriesIdentities = seriesValues.map(v => mocks.dataViewScopeIdentity(v));
                let seriesIdentityField = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 'e', column: 'series' });

                let valueColumns = DataViewTransform.createValueColumns([
                    {
                        source: metadata.columns[1],
                        values: [0, null, null],
                        identity: seriesIdentities[0],
                    }, {
                        source: metadata.columns[2],
                        values: [10, null, null],
                        identity: seriesIdentities[0],
                    }, {
                        source: metadata.columns[3],
                        values: [null, 100, null],
                        identity: seriesIdentities[1],
                    }, {
                        source: metadata.columns[4],
                        values: [null, 20, null],
                        identity: seriesIdentities[1],
                    }, {
                        source: metadata.columns[5],
                        values: [null, null, 200],
                        identity: seriesIdentities[2],
                    }, {
                        source: metadata.columns[6],
                        values: [null, null, 30],
                        identity: seriesIdentities[2],
                    }],
                    [seriesIdentityField]);
                valueColumns.source = metadata.columns[0];

                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: seriesValues,
                                identity: seriesIdentities,
                                identityFields: [seriesIdentityField],
                            }],
                            values: valueColumns
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = getMarkers();
                    for (let i = 0; i < dots.length; i++) {
                        let pointFill = dots.eq(i).css('fill-opacity');
                        expect(pointFill).toBeGreaterThan(0);
                    }
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart without size verify label fill when fill point is off', (done) => {
                // Category and series are the same field
                let metadata: powerbi.DataViewMetadata = {
                    columns: [
                        { displayName: 'series', isMeasure: false, queryName: 'series', roles: { "Category": true, "Series": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text) },
                        { displayName: 'value1', groupName: 'a', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'a', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'b', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'b', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'c', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'c', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    ],
                    objects: {
                        fillPoint: { show: false },
                    },
                };
                let seriesValues = ['a', 'b', 'c'];
                let seriesIdentities = seriesValues.map(v => mocks.dataViewScopeIdentity(v));
                let seriesIdentityField = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 'e', column: 'series' });

                let valueColumns = DataViewTransform.createValueColumns([
                    {
                        source: metadata.columns[1],
                        values: [0, null, null],
                        identity: seriesIdentities[0],
                    }, {
                        source: metadata.columns[2],
                        values: [10, null, null],
                        identity: seriesIdentities[0],
                    }, {
                        source: metadata.columns[3],
                        values: [null, 100, null],
                        identity: seriesIdentities[1],
                    }, {
                        source: metadata.columns[4],
                        values: [null, 20, null],
                        identity: seriesIdentities[1],
                    }, {
                        source: metadata.columns[5],
                        values: [null, null, 200],
                        identity: seriesIdentities[2],
                    }, {
                        source: metadata.columns[6],
                        values: [null, null, 30],
                        identity: seriesIdentities[2],
                    }],
                    [seriesIdentityField]);
                valueColumns.source = metadata.columns[0];

                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: seriesValues,
                                identity: seriesIdentities,
                                identityFields: [seriesIdentityField],
                            }],
                            values: valueColumns
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = getMarkers();
                    for (let i = 0; i < dots.length; i++) {
                        let pointFill = dots.eq(i).css('fill-opacity');
                        expect(pointFill).toBe('0');
                    }
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart without size verify bubble stroke style', (done) => {
                // Category and series are the same field
                let metadata: powerbi.DataViewMetadata = {
                    columns: [
                        { displayName: 'series', isMeasure: false, queryName: 'series', roles: { "Category": true, "Series": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text) },
                        { displayName: 'value1', groupName: 'a', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'a', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'b', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'b', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'c', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'c', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    ],
                };
                let seriesValues = ['a', 'b', 'c'];
                let seriesIdentities = seriesValues.map(v => mocks.dataViewScopeIdentity(v));
                let seriesIdentityField = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 'e', column: 'series' });

                let valueColumns = DataViewTransform.createValueColumns([
                    {
                        source: metadata.columns[1],
                        values: [0, null, null],
                        identity: seriesIdentities[0],
                    }, {
                        source: metadata.columns[2],
                        values: [10, null, null],
                        identity: seriesIdentities[0],
                    }, {
                        source: metadata.columns[3],
                        values: [null, 100, null],
                        identity: seriesIdentities[1],
                    }, {
                        source: metadata.columns[4],
                        values: [null, 20, null],
                        identity: seriesIdentities[1],
                    }, {
                        source: metadata.columns[5],
                        values: [null, null, 200],
                        identity: seriesIdentities[2],
                    }, {
                        source: metadata.columns[6],
                        values: [null, null, 30],
                        identity: seriesIdentities[2],
                    }],
                    [seriesIdentityField]);
                valueColumns.source = metadata.columns[0];

                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: seriesValues,
                                identity: seriesIdentities,
                                identityFields: [seriesIdentityField],
                            }],
                            values: valueColumns
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = getMarkers();
                    expect(dots.length).toBeGreaterThan(0);
                    for (let i = 0; i < dots.length; i++) {
                        let strokeOpacity = dots.eq(i).css('stroke-opacity');
                        let strokeWidth = dots.eq(i).css('stroke-width');
                        let strokeFill = dots.eq(i).css('stroke');
                        let bubbleFill = dots.eq(i).css('fill');
                        expect(strokeOpacity).toBeLessThan(1);
                        expect(strokeWidth).toBe('1px');
                        helpers.assertColorsMatch(strokeFill, bubbleFill);

                    }
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart with size verify bubble stroke style when stroke border is on', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];

                let dataViewMetadataWithColorBorder = powerbi.Prototype.inherit(dataViewMetadataFourColumn);
                dataViewMetadataWithColorBorder.objects = { colorBorder: { show: true } };

                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataWithColorBorder,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataWithColorBorder.columns[0],
                                values: ['a', 'b', 'c'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataWithColorBorder.columns[1],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataWithColorBorder.columns[2],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataWithColorBorder.columns[3],
                                    values: [3, 15, 27],
                                    min: 0,
                                    max: 30
                                }
                            ])
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = getMarkers();
                    expect(dots.length).toBeGreaterThan(0);
                    for (let i = 0; i < dots.length; i++) {
                        let strokeOpacity = dots.eq(i).css('stroke-opacity');
                        let strokeWidth = dots.eq(i).css('stroke-width');
                        let strokeFill = dots.eq(i).css('stroke');
                        expect(strokeOpacity).toBe('1');
                        expect(strokeWidth).toBe('1px');
                        let bubbleFill = dots.eq(i).css('fill');
                        let colorRgb = jsCommon.Color.parseColorString(bubbleFill);
                        let stroke = jsCommon.Color.hexString(jsCommon.Color.darken(colorRgb, ScatterChart.StrokeDarkenColorValue));
                        helpers.assertColorsMatch(strokeFill, stroke);
                    }
                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart with size verify bubble stroke style when stroke border is off', (done) => {
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];

                let dataViewMetadataWithColorBorder = powerbi.Prototype.inherit(dataViewMetadataFourColumn);
                dataViewMetadataWithColorBorder.objects = { colorBorder: { show: false } };

                v.onDataChanged({
                    dataViews: [{
                        metadata: dataViewMetadataWithColorBorder,
                        categorical: {
                            categories: [{
                                source: dataViewMetadataWithColorBorder.columns[0],
                                values: ['a', 'b', 'c'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: dataViewMetadataWithColorBorder.columns[1],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataWithColorBorder.columns[2],
                                    values: [0.1495, 0.15, 0.1633]
                                },
                                {
                                    source: dataViewMetadataWithColorBorder.columns[3],
                                    values: [3, 15, 27],
                                    min: 0,
                                    max: 30
                                }
                            ])
                        }
                    }]
                });

                setTimeout(() => {
                    let dots = getMarkers();
                    expect(dots.length).toBeGreaterThan(0);
                    for (let i = 0; i < dots.length; i++) {
                        let strokeOpacity = dots.eq(i).css('stroke-opacity');
                        let strokeWidth = dots.eq(i).css('stroke-width');
                        let strokeFill = dots.eq(i).css('stroke');
                        let bubbleFill = dots.eq(i).css('fill');
                        expect(strokeOpacity).toBeLessThan(1);
                        expect(strokeWidth).toBe('1px');
                        helpers.assertColorsMatch(strokeFill, bubbleFill);
                    }
                    done();
                }, DefaultWaitForRender);
            });
        });

        describe("label data point creation", () => {
            let v: powerbi.IVisual, element: JQuery;
            let renderSpy: jasmine.Spy;
            let hostServices: powerbi.IVisualHostServices;
            let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                mocks.dataViewScopeIdentity('a'),
                mocks.dataViewScopeIdentity('b'),
                mocks.dataViewScopeIdentity('c'),
                mocks.dataViewScopeIdentity('d'),
                mocks.dataViewScopeIdentity('e'),
            ];

            beforeEach(() => {
                hostServices = powerbitests.mocks.createVisualHostServices();
                element = powerbitests.helpers.testDom('500', '500');
                let visualPluginfactory = powerbi.visuals.visualPluginFactory.create();
                v = visualPluginfactory.getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: hostServices,
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true },
                });

                renderSpy = spyOn(v, 'renderDataLabels');
                renderSpy.and.callThrough();
            });

            it("Label data points have correct text", () => {
                let metadata: powerbi.DataViewMetadata = {
                    columns: dataViewMetadataFourColumn.columns,
                    objects: {
                        categoryLabels: {
                            show: true,
                            color: undefined,
                            labelDisplayUnits: undefined,
                            labelPosition: undefined,
                            labelPrecision: undefined,
                        }
                    }
                };
                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: metadata.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: metadata.columns[2],
                                    values: [.21, .22, .23, .24, .25]
                                }])
                        }
                    }]
                });

                let labelDataPoints = getLabelDataPointsFromRenderCall(renderSpy);
                expect(labelDataPoints[0].text).toEqual("a");
                expect(labelDataPoints[1].text).toEqual("b");
                expect(labelDataPoints[2].text).toEqual("c");
                expect(labelDataPoints[3].text).toEqual("d");
                expect(labelDataPoints[4].text).toEqual("e");
            });

            it("Label data points have correct default fill", () => {
                let metadata: powerbi.DataViewMetadata = {
                    columns: dataViewMetadataFourColumn.columns,
                    objects: {
                        categoryLabels: {
                            show: true,
                            color: undefined,
                            labelDisplayUnits: undefined,
                            labelPosition: undefined,
                            labelPrecision: undefined,
                        }
                    }
                };
                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: metadata.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: metadata.columns[2],
                                    values: [.21, .22, .23, .24, .25]
                                }])
                        }
                    }]
                });

                let labelDataPoints = getLabelDataPointsFromRenderCall(renderSpy);
                helpers.assertColorsMatch(labelDataPoints[0].outsideFill, powerbi.visuals.NewDataLabelUtils.defaultLabelColor);
                helpers.assertColorsMatch(labelDataPoints[1].outsideFill, powerbi.visuals.NewDataLabelUtils.defaultLabelColor);
                helpers.assertColorsMatch(labelDataPoints[2].outsideFill, powerbi.visuals.NewDataLabelUtils.defaultLabelColor);
                helpers.assertColorsMatch(labelDataPoints[3].outsideFill, powerbi.visuals.NewDataLabelUtils.defaultLabelColor);
                helpers.assertColorsMatch(labelDataPoints[4].outsideFill, powerbi.visuals.NewDataLabelUtils.defaultLabelColor);
                helpers.assertColorsMatch(labelDataPoints[0].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
                helpers.assertColorsMatch(labelDataPoints[1].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
                helpers.assertColorsMatch(labelDataPoints[2].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
                helpers.assertColorsMatch(labelDataPoints[3].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
                helpers.assertColorsMatch(labelDataPoints[4].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
            });

            it("Label data points have correct fill", () => {
                let labelColor = "#007700";
                let metadata: powerbi.DataViewMetadata = {
                    columns: dataViewMetadataFourColumn.columns,
                    objects: {
                        categoryLabels: {
                            show: true,
                            color: { solid: { color: labelColor } },
                            labelDisplayUnits: undefined,
                            labelPosition: undefined,
                            labelPrecision: undefined,
                        }
                    }
                };
                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: ['a', 'b', 'c', 'd', 'e'],
                                identity: categoryIdentities,
                            }],
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: metadata.columns[1],
                                    values: [110, 120, 130, 140, 150]
                                }, {
                                    source: metadata.columns[2],
                                    values: [.21, .22, .23, .24, .25]
                                }])
                        }
                    }]
                });

                let labelDataPoints = getLabelDataPointsFromRenderCall(renderSpy);
                helpers.assertColorsMatch(labelDataPoints[0].outsideFill, labelColor);
                helpers.assertColorsMatch(labelDataPoints[1].outsideFill, labelColor);
                helpers.assertColorsMatch(labelDataPoints[2].outsideFill, labelColor);
                helpers.assertColorsMatch(labelDataPoints[3].outsideFill, labelColor);
                helpers.assertColorsMatch(labelDataPoints[4].outsideFill, labelColor);
                helpers.assertColorsMatch(labelDataPoints[0].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
                helpers.assertColorsMatch(labelDataPoints[1].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
                helpers.assertColorsMatch(labelDataPoints[2].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
                helpers.assertColorsMatch(labelDataPoints[3].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
                helpers.assertColorsMatch(labelDataPoints[4].insideFill, powerbi.visuals.NewDataLabelUtils.defaultInsideLabelColor);
            });
        });

        describe('interactive labels scatterChart validation', () => {
            let v: powerbi.IVisual, element: JQuery;
            let hostServices: powerbi.IVisualHostServices;
            let dataView: powerbi.DataView;

            beforeEach(() => {
                element = powerbitests.helpers.testDom('500', '500');
                hostServices = mocks.createVisualHostServices();
                v = powerbi.visuals.visualPluginFactory.createMinerva({ dataDotChartEnabled: false, heatMap: false, isLabelInteractivityEnabled: true }).getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: hostServices,
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true },
                    interactivity: { selection: true }
                });

                let metadata: powerbi.DataViewMetadata = {
                    columns: dataViewMetadataFourColumn.columns,
                    objects: {
                        categoryLabels: {
                            show: true,
                            color: undefined,
                            labelDisplayUnits: undefined,
                            labelPosition: undefined,
                            labelPrecision: undefined,
                        }
                    }
                };

                let categoryIdentities: powerbi.DataViewScopeIdentity[] = [
                    mocks.dataViewScopeIdentity('a'),
                    mocks.dataViewScopeIdentity('b'),
                    mocks.dataViewScopeIdentity('c'),
                    mocks.dataViewScopeIdentity('d'),
                    mocks.dataViewScopeIdentity('e'),
                ];

                dataView = {
                    metadata: metadata,
                    categorical: {
                        categories: [{
                            source: metadata.columns[0],
                            values: ['a', 'b', 'c', 'd', 'e'],
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: metadata.columns[1],
                                values: [100, 200, 300, 400, 500]
                            }, {
                                source: metadata.columns[2],
                                values: [200, 400, 600, 800, 1000]
                            }, {
                                source: metadata.columns[3],
                                values: [1, 2, 3, 4, 5]
                            }])
                    }
                };
            });

            it('scatter chart label interaction dot selection', (done) => {
                let defaultOpacity = LabelsBehavior.DefaultLabelOpacity.toString();
                let dimmedOpacity = LabelsBehavior.DimmedLabelOpacity.toString();

                v.onDataChanged({
                    dataViews: [dataView]
                });

                setTimeout(() => {
                    let dots = element.find('.dot');
                    let labels = element.find('.label');
                    let triggerSelect = powerbitests.helpers.getClickTriggerFunctionForD3(dots[1]);
                    let triggerUnselect = powerbitests.helpers.getClickTriggerFunctionForD3(dots[1]);
                    let mockEvent = {
                        abc: 'def',
                        stopPropagation: () => { },
                    };

                    spyOn(hostServices, 'onSelect').and.callThrough();

                    triggerSelect(mockEvent);

                    expect(labels.length).toBe(5);
                    expect(labels[0].style.opacity).toBe(dimmedOpacity);
                    expect(labels[1].style.opacity).toBe(dimmedOpacity);
                    expect(labels[2].style.opacity).toBe(dimmedOpacity);
                    expect(labels[3].style.opacity).toBe(defaultOpacity);
                    expect(labels[4].style.opacity).toBe(dimmedOpacity);

                    triggerUnselect(mockEvent);

                    expect(labels.length).toBe(5);
                    expect(labels[0].style.opacity).toBe(defaultOpacity);
                    expect(labels[1].style.opacity).toBe(defaultOpacity);
                    expect(labels[2].style.opacity).toBe(defaultOpacity);
                    expect(labels[3].style.opacity).toBe(defaultOpacity);
                    expect(labels[4].style.opacity).toBe(defaultOpacity);

                    done();
                }, DefaultWaitForRender);
            });

            it('scatter chart label interaction label selection', (done) => {
                let labelsDefaultOpacity = LabelsBehavior.DefaultLabelOpacity.toString();
                let labelsDimmedOpacity = LabelsBehavior.DimmedLabelOpacity.toString();
                let bublleDefaultOpacity = ScatterChart.DefaultBubbleOpacity.toString();
                let bublleDimmedOpacity = ScatterChart.DimmedBubbleOpacity.toString();

                v.onDataChanged({
                    dataViews: [dataView]
                });

                setTimeout(() => {
                    let dots = element.find('.dot');
                    let labels = element.find('.label');
                    let triggerSelect = powerbitests.helpers.getClickTriggerFunctionForD3(labels[0]);
                    let triggerUnselect = powerbitests.helpers.getClickTriggerFunctionForD3(labels[0]);
                    let mockEvent = {
                        abc: 'def',
                        stopPropagation: () => { },
                    };

                    spyOn(hostServices, 'onSelect').and.callThrough();

                    triggerSelect(mockEvent);

                    expect(labels.length).toBe(5);
                    expect(labels[0].style.opacity).toBe(labelsDefaultOpacity);
                    expect(labels[1].style.opacity).toBe(labelsDimmedOpacity);
                    expect(labels[2].style.opacity).toBe(labelsDimmedOpacity);
                    expect(labels[3].style.opacity).toBe(labelsDimmedOpacity);
                    expect(labels[4].style.opacity).toBe(labelsDimmedOpacity);
                    expect(dots.length).toBe(5);
                    expect(dots[0].style.fillOpacity).toBe(bublleDefaultOpacity);
                    expect(dots[1].style.fillOpacity).toBe(bublleDimmedOpacity);
                    expect(dots[2].style.fillOpacity).toBe(bublleDimmedOpacity);
                    expect(dots[3].style.fillOpacity).toBe(bublleDimmedOpacity);
                    expect(dots[4].style.fillOpacity).toBe(bublleDimmedOpacity);

                    triggerUnselect(mockEvent);

                    expect(labels.length).toBe(5);
                    expect(labels[0].style.opacity).toBe(labelsDefaultOpacity);
                    expect(labels[1].style.opacity).toBe(labelsDefaultOpacity);
                    expect(labels[2].style.opacity).toBe(labelsDefaultOpacity);
                    expect(labels[3].style.opacity).toBe(labelsDefaultOpacity);
                    expect(labels[4].style.opacity).toBe(labelsDefaultOpacity);
                    expect(dots.length).toBe(5);
                    expect(dots[0].style.fillOpacity).toBe(bublleDefaultOpacity);
                    expect(dots[1].style.fillOpacity).toBe(bublleDefaultOpacity);
                    expect(dots[2].style.fillOpacity).toBe(bublleDefaultOpacity);
                    expect(dots[3].style.fillOpacity).toBe(bublleDefaultOpacity);
                    expect(dots[4].style.fillOpacity).toBe(bublleDefaultOpacity);

                    done();
                }, DefaultWaitForRender);
            });

        });

        describe("Validate preferred labels", () => {
            let v: powerbi.IVisual, element: JQuery;
            let renderSpy: jasmine.Spy;

            beforeEach(() => {
                element = powerbitests.helpers.testDom('500', '500');
                v = powerbi.visuals.visualPluginFactory.create().getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: powerbitests.mocks.createVisualHostServices(),
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true }
                });

                renderSpy = spyOn(v, 'renderDataLabels');
                renderSpy.and.callThrough();
            });

            it('validate preferred labels on bubble chart', () => {
                let metadata: powerbi.DataViewMetadata = {
                    columns: dataViewMetadataFourColumn.columns,
                    objects: {
                        categoryLabels: {
                            show: true
                        }
                    }
                };
                let categoryValues = ['a', 'b', 'c', 'd', 'e'];
                let categoryIdentities = categoryValues.map(v => mocks.dataViewScopeIdentity(v));

                let dataView: powerbi.DataView = {
                    metadata: metadata,
                    categorical: {
                        categories: [{
                            source: dataViewMetadataFourColumn.columns[0],
                            values: categoryValues,
                            identity: categoryIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: metadata.columns[1],
                                values: [100, 200, 300, 400, 500]
                            }, {
                                source: metadata.columns[2],
                                values: [200, 400, 600, 800, 1000]
                            }, {
                                source: metadata.columns[3],
                                values: [5, 4, 3, 2, 1]
                            }])
                    }
                };
                let dataChangedOptions = {
                    dataViews: [dataView]
                };

                v.onDataChanged(dataChangedOptions);

                let labelDataPoints = getLabelDataPointsFromRenderCall(renderSpy);

                expect(labelDataPoints[0].isPreferred).toBeTruthy();
                expect(labelDataPoints[1].isPreferred).toBeFalsy();
                expect(labelDataPoints[2].isPreferred).toBeTruthy();
                expect(labelDataPoints[3].isPreferred).toBeTruthy();
                expect(labelDataPoints[4].isPreferred).toBeFalsy();
            });

            it('validate preferred labels on scater chart', () => {
                let metadata: powerbi.DataViewMetadata = {
                    columns: [
                        { displayName: 'series', isMeasure: false, queryName: 'series', roles: { "Category": true, "Series": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text) },
                        { displayName: 'value1', groupName: 'a', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'a', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'b', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'b', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'c', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'c', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'd', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'd', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'e', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'e', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value1', groupName: 'f', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                        { displayName: 'value2', groupName: 'f', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    ],
                    objects: {
                        categoryLabels: {
                            show: true
                        }
                    }
                };
                let seriesValues = ['a', 'b', 'c', 'd', 'e', 'f'];
                let seriesIdentities = seriesValues.map(v => mocks.dataViewScopeIdentity(v));

                let dataView: powerbi.DataView = {
                    metadata: metadata,
                    categorical: {
                        categories: [{
                            source: metadata.columns[0],
                            values: seriesValues,
                            identity: seriesIdentities,
                        }],
                        values: DataViewTransform.createValueColumns([
                            {
                                source: metadata.columns[1],
                                values: [0, null, null, null, null, null],
                                identity: seriesIdentities[0],
                            }, {
                                source: metadata.columns[2],
                                values: [10, null, null, null, null, null],
                                identity: seriesIdentities[0],
                            }, {
                                source: metadata.columns[3],
                                values: [null, 100, null, null, null, null],
                                identity: seriesIdentities[1],
                            }, {
                                source: metadata.columns[4],
                                values: [null, 20, null, null, null, null],
                                identity: seriesIdentities[1],
                            }, {
                                source: metadata.columns[5],
                                values: [null, null, 200, null, null, null],
                                identity: seriesIdentities[2],
                            }, {
                                source: metadata.columns[6],
                                values: [null, null, 30, null, null, null],
                                identity: seriesIdentities[2],
                            }, {
                                source: metadata.columns[7],
                                values: [null, null, null, 150, null, null],
                                identity: seriesIdentities[3],
                            }, {
                                source: metadata.columns[8],
                                values: [null, null, null, 25, null, null],
                                identity: seriesIdentities[3],
                            }, {
                                source: metadata.columns[9],
                                values: [null, null, null, null, 50, null],
                                identity: seriesIdentities[4],
                            }, {
                                source: metadata.columns[10],
                                values: [null, null, null, null, 15, null],
                                identity: seriesIdentities[4],
                            }, {
                                source: metadata.columns[11],
                                values: [null, null, null, null, null, 150],
                                identity: seriesIdentities[5],
                            }, {
                                source: metadata.columns[12],
                                values: [null, null, null, null, null, 15],
                                identity: seriesIdentities[5],
                            }])
                    }
                };
                let dataChangedOptions = {
                    dataViews: [dataView]
                };

                v.onDataChanged(dataChangedOptions);

                let labelDataPoints = getLabelDataPointsFromRenderCall(renderSpy);

                expect(labelDataPoints[0].isPreferred).toBeFalsy();
                expect(labelDataPoints[1].isPreferred).toBeTruthy();
                expect(labelDataPoints[2].isPreferred).toBeFalsy();
                expect(labelDataPoints[3].isPreferred).toBeTruthy();
                expect(labelDataPoints[4].isPreferred).toBeTruthy();
                expect(labelDataPoints[5].isPreferred).toBeTruthy();
            });
        });

        describe('scatterChart labels layout validation', () => {
            let v: powerbi.IVisual, element: JQuery;
            let hostServices: powerbi.IVisualHostServices;
            beforeEach(() => {
                element = powerbitests.helpers.testDom('500', '500');
                hostServices = mocks.createVisualHostServices();
                v = powerbi.visuals.visualPluginFactory.createMinerva({ dataDotChartEnabled: false, heatMap: false, isLabelInteractivityEnabled: true }).getPlugin('scatterChart').create();
                v.init({
                    element: element,
                    host: hostServices,
                    style: powerbi.visuals.visualStyles.create(),
                    viewport: {
                        height: element.height(),
                        width: element.width()
                    },
                    animation: { transitionImmediate: true },
                    interactivity: { selection: true }
                });
            });

            it("scatter chart draw category labels in correct available position with leader line if neccessary", (done) => {
                let metadata: powerbi.DataViewMetadata = {
                    columns: dataViewMetadataFourColumn.columns,
                    objects: {
                        categoryLabels: {
                            show: true,
                            color: undefined,
                            labelDisplayUnits: undefined,
                            labelPosition: undefined,
                            labelPrecision: undefined,
                        },
                        categoryAxis: {
                            start: 130.0010,
                            end: 130.0102,
                        },
                        valueAxis: {
                            start: 0.22,
                            end: 0.23,
                        },
                    }
                };

                let datalabelTextArray: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'z', 'y', 'w', 'x'];
                let categoryIdentities: powerbi.DataViewScopeIdentity[] = _.map(datalabelTextArray, (value) => mocks.dataViewScopeIdentity(value));
                v.onDataChanged({
                    dataViews: [{
                        metadata: metadata,
                        categorical: {
                            categories: [{
                                source: metadata.columns[0],
                                values: datalabelTextArray,
                                identity: categoryIdentities,
                            }],
                        
                            // These values create a crowded group of points which will make the label layout logic to draw 4 labels with an increased radius and draw leader lines for it.
                            values: DataViewTransform.createValueColumns([
                                {
                                    source: metadata.columns[1],
                                    values: [130.01, 130.01011, 130.01012, 130.01013, 130.01014, 130.01011, 130.01012, 130.01013, 130.01014, 130.01011, 130.01012, 130.01013, 130.01014, 130.01011, 130.01012, 130.01013, 130.01014, 130.01011, 130.01012, 130.01013, 130.01014, 130.01015, 130.01010, 130.01]
                                }, {
                                    source: metadata.columns[2],
                                    values: [.22, .2215, .2215, .2215, .2215, .2215, .2215, .2216, .2216, .2216, .2216, .2216, .2216, .2217, .2217, .2217, .2217, .2217, .2218, .2218, .2218, .2218, .2218, .23]
                                }])
                        }
                    }]
                });

                setTimeout(() => {
                    expect($(".labelGraphicsContext")).toBeInDOM();
                    expect($(".labelGraphicsContext .label").length).toBe(18);
                    expect($(".labelGraphicsContext .line-label").length).toBe(10);

                    done();
                }, DefaultWaitForRender);
            });
        });

        function testAxisAndLegendExistence(domSizeHeightString: string, domSizeWidthString: string, isInteractive: boolean, isMobile: boolean): void {
            let element = powerbitests.helpers.testDom(domSizeHeightString, domSizeWidthString);
            let v;
            if (isMobile) {
                v = powerbi.visuals.visualPluginFactory.createMobile().getPlugin('scatterChart').create();
            } else {
                v = powerbi.visuals.visualPluginFactory.create().getPlugin('scatterChart').create();
            }
            v.init({
                element: element,
                host: powerbitests.mocks.createVisualHostServices(),
                style: powerbi.visuals.visualStyles.create(),
                viewport: {
                    height: element.height(),
                    width: element.width()
                },
                animation: { transitionImmediate: true },
                interactivity: { isInteractiveLegend: isInteractive },
            });

            // Category and series are the same field
            let metadata: powerbi.DataViewMetadata = {
                columns: [
                    { displayName: 'series', isMeasure: false, queryName: 'series', roles: { "Category": true, "Series": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text) },
                    { displayName: 'value1', groupName: 'a', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'value2', groupName: 'a', isMeasure: true, queryName: "size", roles: { "Size": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'value3', groupName: 'a', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'value1', groupName: 'b', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'value2', groupName: 'b', isMeasure: true, queryName: "size", roles: { "Size": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'value3', groupName: 'b', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'value1', groupName: 'c', isMeasure: true, queryName: "x", roles: { "X": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'value2', groupName: 'c', isMeasure: true, queryName: "size", roles: { "Size": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                    { displayName: 'value3', groupName: 'c', isMeasure: true, queryName: "y", roles: { "Y": true }, type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double) },
                ],
                objects: { categoryLabels: { show: true } },
            };
            let seriesValues = ['a', 'b', 'c'];
            let seriesIdentities = seriesValues.map(v => mocks.dataViewScopeIdentity(v));
            let seriesIdentityField = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: 'e', column: 'series' });

            let valueColumns = DataViewTransform.createValueColumns([
                {
                    source: metadata.columns[1],
                    values: [0, null, null],
                    identity: seriesIdentities[0],
                }, {
                    source: metadata.columns[2],
                    values: [1, null, null],
                    identity: seriesIdentities[0],
                }, {
                    source: metadata.columns[3],
                    values: [10, null, null],
                    identity: seriesIdentities[0],
                }, {
                    source: metadata.columns[4],
                    values: [null, 100, null],
                    identity: seriesIdentities[1],
                }, {
                    source: metadata.columns[5],
                    values: [null, 2, null],
                    identity: seriesIdentities[1],
                }, {
                    source: metadata.columns[6],
                    values: [null, 20, null],
                    identity: seriesIdentities[1],
                }, {
                    source: metadata.columns[7],
                    values: [null, null, 200],
                    identity: seriesIdentities[2],
                }, {
                    source: metadata.columns[8],
                    values: [null, null, 3],
                    identity: seriesIdentities[2],
                }, {
                    source: metadata.columns[9],
                    values: [null, null, 30],
                    identity: seriesIdentities[2],
                }],
                [seriesIdentityField]);
            valueColumns.source = metadata.columns[0];

            v.onDataChanged({
                dataViews: [{
                    metadata: metadata,
                    categorical: {
                        categories: [{
                            source: metadata.columns[0],
                            values: seriesValues,
                            identity: seriesIdentities,
                            identityFields: [seriesIdentityField],
                        }],
                        values: valueColumns
                    }
                }]
            });
        }

        function getMarkers(): JQuery {
            return $('.scatterChart .mainGraphicsContext circle.dot');
        }

        function getMarkersD3(): D3.Selection {
            return d3.selectAll('.scatterChart .mainGraphicsContext circle.dot');
        }

        function getLabelDataPointsFromRenderCall(renderSpy: jasmine.Spy): powerbi.LabelDataPoint[] {
            let labelDataPointGroups: powerbi.LabelDataPointsGroup[] = renderSpy.calls.mostRecent().args[0];
            return labelDataPointGroups[0].labelDataPoints;
        }
    });
}
