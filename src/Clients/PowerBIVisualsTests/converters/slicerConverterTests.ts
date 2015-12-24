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
    import data = powerbi.data;
    import DataViewTransform = powerbi.data.DataViewTransform;
    import SQExprBuilder = powerbi.data.SQExprBuilder;

    describe('SlicerConverter', () => {
        let field = SQExprBuilder.fieldDef({
            schema: 's',
            entity: "Entity2",
            column: "PropertyName"
        });

        it("retained values doesn't exist in dataView", (done) => {
            let hostServices = slicerHelper.createHostServices();
            let interactivityService = powerbi.visuals.createInteractivityService(hostServices);
            let semanticFilter: data.SemanticFilter = data.SemanticFilter.fromSQExpr(
                SQExprBuilder.or(
                    SQExprBuilder.compare(data.QueryComparisonKind.Equal, field, SQExprBuilder.text('retainedValue1')),
                    SQExprBuilder.compare(data.QueryComparisonKind.Equal, field, SQExprBuilder.text('retainedValue2'))));
            let dataView = applyDataTransform(slicerHelper.buildDefaultDataView(field), semanticFilter);
            let resultVerified = false;
            powerbi.visuals.DataConversion.convert(dataView[0], slicerHelper.SelectAllTextKey, interactivityService, hostServices).then(
                slicerData => {
                    expect(slicerData.slicerDataPoints.length).toBe(7);
                    expect(slicerData.slicerDataPoints[0].tooltip).toBe('Apple');
                    expect(slicerData.slicerDataPoints[1].tooltip).toBe('Orange');
                    expect(slicerData.slicerDataPoints[2].tooltip).toBe('Kiwi');
                    expect(slicerData.slicerDataPoints[3].tooltip).toBe('Grapes');
                    expect(slicerData.slicerDataPoints[4].tooltip).toBe('Banana');
                    expect(slicerData.slicerDataPoints[5].tooltip).toBe('retainedValue1');
                    expect(slicerData.slicerDataPoints[6].tooltip).toBe('retainedValue2');
                    expect(slicerData.slicerDataPoints[5].selected).toBe(true);
                    expect(slicerData.slicerDataPoints[6].selected).toBe(true);
                    resultVerified = true;
                });
            setTimeout(() => {
                expect(resultVerified).toBe(true);
                done();
            });
        });

        it("one retained value exists in dataView, the other does not", (done) => {
            let hostServices = slicerHelper.createHostServices();;
            let interactivityService = powerbi.visuals.createInteractivityService(hostServices);
            let semanticFilter: data.SemanticFilter = data.SemanticFilter.fromSQExpr(
                SQExprBuilder.or(
                    SQExprBuilder.compare(data.QueryComparisonKind.Equal, field, SQExprBuilder.text('Grapes')),
                    SQExprBuilder.compare(data.QueryComparisonKind.Equal, field, SQExprBuilder.text('retainedValue'))));
            let dataView = applyDataTransform(slicerHelper.buildDefaultDataView(field), semanticFilter);
            let resultVerified = false;
            powerbi.visuals.DataConversion.convert(dataView[0], slicerHelper.SelectAllTextKey, interactivityService, hostServices).then(
                slicerData => {
                    expect(slicerData.slicerDataPoints.length).toBe(6);
                    expect(slicerData.slicerDataPoints[0].tooltip).toBe('Apple');
                    expect(slicerData.slicerDataPoints[1].tooltip).toBe('Orange');
                    expect(slicerData.slicerDataPoints[2].tooltip).toBe('Kiwi');
                    expect(slicerData.slicerDataPoints[3].tooltip).toBe('Grapes');
                    expect(slicerData.slicerDataPoints[4].tooltip).toBe('Banana');
                    expect(slicerData.slicerDataPoints[5].tooltip).toBe('retainedValue');
                    expect(slicerData.slicerDataPoints[5].selected).toBe(true);
                    expect(slicerData.slicerDataPoints[3].selected).toBe(true);
                    resultVerified = true;
                });
            setTimeout(() => {
                expect(resultVerified).toBe(true);
                done();
            }, DefaultWaitForRender);
        });

        it("is not in filter", (done) => {
            let hostServices = slicerHelper.createHostServices();
            let interactivityService = powerbi.visuals.createInteractivityService(hostServices);
            let semanticFilter: data.SemanticFilter = data.SemanticFilter.fromSQExpr(
                SQExprBuilder.not(
                    SQExprBuilder.inExpr(
                        [field],
                        [
                            [SQExprBuilder.text('Apple')],
                            [SQExprBuilder.text('Banana')],
                        ])));
            let dataView = applyDataTransform(slicerHelper.buildDefaultDataView(field), semanticFilter);
            let resultVerified = false;
            powerbi.visuals.DataConversion.convert(dataView[0], slicerHelper.SelectAllTextKey, interactivityService, hostServices).then(
                slicerData => {
                    expect(slicerData.slicerDataPoints.length).toBe(5);
                    expect(slicerData.slicerDataPoints[0].tooltip).toBe('Apple');
                    expect(slicerData.slicerDataPoints[1].tooltip).toBe('Orange');
                    expect(slicerData.slicerDataPoints[2].tooltip).toBe('Kiwi');
                    expect(slicerData.slicerDataPoints[3].tooltip).toBe('Grapes');
                    expect(slicerData.slicerDataPoints[4].tooltip).toBe('Banana');
                    expect(slicerData.slicerDataPoints[0].selected).toBe(true);
                    expect(slicerData.slicerDataPoints[4].selected).toBe(true);
                    resultVerified = true;
                });

            setTimeout(() => {
                expect(resultVerified).toBe(true);
                done();
            }, DefaultWaitForRender);
        });

        it("when all are selected in filter", (done) => {
            let hostServices = slicerHelper.createHostServices();
            let interactivityService = powerbi.visuals.createInteractivityService(hostServices);
            let semanticFilter: data.SemanticFilter = data.SemanticFilter.fromSQExpr(
                SQExprBuilder.inExpr(
                    [field],
                    [
                        [SQExprBuilder.text('Apple')],
                        [SQExprBuilder.text('Orange')],
                        [SQExprBuilder.text('Kiwi')],
                        [SQExprBuilder.text('Grapes')],
                        [SQExprBuilder.text('Banana')],
                    ]));
            let dataView = applyDataTransform(slicerHelper.buildDefaultDataView(field), semanticFilter);
            dataView[0].metadata.objects["selection"] = { selectAllCheckboxEnabled: true, singleSelect: false };
            let resultVerified = false;
            powerbi.visuals.DataConversion.convert(dataView[0], slicerHelper.SelectAllTextKey, interactivityService, hostServices).then(
                slicerData => {
                    expect(slicerData.slicerDataPoints.length).toBe(6);
                    expect(slicerData.slicerDataPoints[0].tooltip).toBe('Select All');
                    expect(slicerData.slicerDataPoints[1].tooltip).toBe('Apple');
                    expect(slicerData.slicerDataPoints[2].tooltip).toBe('Orange');
                    expect(slicerData.slicerDataPoints[3].tooltip).toBe('Kiwi');
                    expect(slicerData.slicerDataPoints[4].tooltip).toBe('Grapes');
                    expect(slicerData.slicerDataPoints[5].tooltip).toBe('Banana');
                    expect(slicerData.slicerDataPoints[0].isSelectAllDataPoint).toBe(true);
                    expect(slicerData.slicerDataPoints[0].selected).toBe(true);
                    expect(slicerData.slicerDataPoints[1].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[2].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[3].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[4].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[5].selected).toBe(false);
                    
                    resultVerified = true;
                });

            setTimeout(() => {
                expect(resultVerified).toBe(true);
                done();
            }, DefaultWaitForRender);
        });

        it("when all are selected in Not filter", (done) => {
            let hostServices = slicerHelper.createHostServices();
            let interactivityService = powerbi.visuals.createInteractivityService(hostServices);
            let semanticFilter: data.SemanticFilter = data.SemanticFilter.fromSQExpr(
                SQExprBuilder.not(
                SQExprBuilder.inExpr(
                    [field],
                    [
                        [SQExprBuilder.text('Apple')],
                        [SQExprBuilder.text('Orange')],
                        [SQExprBuilder.text('Kiwi')],
                        [SQExprBuilder.text('Grapes')],
                        [SQExprBuilder.text('Banana')],
                    ])));
            let dataView = applyDataTransform(slicerHelper.buildDefaultDataView(field), semanticFilter);
            dataView[0].metadata.objects["selection"] = { selectAllCheckboxEnabled: true, singleSelect: false };
            let resultVerified = false;
            powerbi.visuals.DataConversion.convert(dataView[0], slicerHelper.SelectAllTextKey, interactivityService, hostServices).then(
                slicerData => {
                    expect(slicerData.slicerDataPoints.length).toBe(6);
                    expect(slicerData.slicerDataPoints[0].tooltip).toBe('Select All');
                    expect(slicerData.slicerDataPoints[1].tooltip).toBe('Apple');
                    expect(slicerData.slicerDataPoints[2].tooltip).toBe('Orange');
                    expect(slicerData.slicerDataPoints[3].tooltip).toBe('Kiwi');
                    expect(slicerData.slicerDataPoints[4].tooltip).toBe('Grapes');
                    expect(slicerData.slicerDataPoints[5].tooltip).toBe('Banana');
                    expect(slicerData.slicerDataPoints[0].isSelectAllDataPoint).toBe(true);
                    expect(slicerData.slicerDataPoints[0].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[1].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[2].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[3].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[4].selected).toBe(false);
                    expect(slicerData.slicerDataPoints[5].selected).toBe(false);
                    
                    resultVerified = true;
                });

            setTimeout(() => {
                expect(resultVerified).toBe(true);
                done();
            }, DefaultWaitForRender);
        });

        function applyDataTransform(dataView: powerbi.DataView, semanticFilter: data.SemanticFilter): powerbi.DataView[] {
            let transforms: data.DataViewTransformActions = {
                selects: [
                    {
                        type: powerbi.ValueType.fromDescriptor({ text: true }),
                        roles: { 'Category': true },
                        queryName: 'queryName',
                    }
                ],
                objects: {
                    general: [{ properties: { filter: semanticFilter } }],
                }
            };

            return DataViewTransform.apply({
                prototype: dataView,
                objectDescriptors: {
                    general: powerbi.visuals.slicerCapabilities.objects.general,
                    selection: powerbi.visuals.slicerCapabilities.objects['selection'],
                },
                transforms: transforms,
                colorAllocatorFactory: powerbi.visuals.createColorAllocatorFactory(),
                dataViewMappings: powerbi.visuals.capabilities.slicer.dataViewMappings,
                dataRoles: [{ name: 'queryName', kind: powerbi.VisualDataRoleKind.Grouping}],
            });
        }
    });
}