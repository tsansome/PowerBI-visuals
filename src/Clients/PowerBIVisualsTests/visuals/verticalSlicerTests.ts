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
    import DataViewTransform = powerbi.data.DataViewTransform;
    import SelectionId = powerbi.visuals.SelectionId;
    import SlicerOrientation = powerbi.visuals.slicerOrientation.Orientation;

    powerbitests.mocks.setLocale();

    describe("VerticalSlicer", () => {
        let builder: slicerHelper.TestBuilder;
        beforeEach(() => {
            builder = new slicerHelper.TestBuilder(SlicerOrientation.Vertical);
        });

        afterEach(() => {
            builder.destroy();
        });

        describe("DOM tests", () => {
            it("DOM Validation - Text Slicer", () => {
                spyOn(powerbi.visuals.valueFormatter, "format").and.callThrough();

                helpers.fireOnDataChanged(builder.visual, builder.interactiveDataViewOptions);

                expect($(".slicerContainer")).toBeInDOM();
                expect($(".slicerContainer .headerText")).toBeInDOM();
                expect($(".slicerContainer .slicerHeader .clear")).toBeInDOM();
                expect($(".slicerContainer .slicerBody")).toBeInDOM();
                expect($(".slicerContainer .slicerBody .row .slicerText")).toBeInDOM();
                expect($(".slicerText").length).toBe(6);
                expect($(".slicerText").first().text()).toBe(slicerHelper.SelectAllTextKey);
                expect($(".slicerText").last().text()).toBe("Banana");

                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Apple", undefined);
                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Orange", undefined);
                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Kiwi", undefined);
                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Grapes", undefined);
                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Banana", undefined);

                // Subsequent update              
                let dataView2: powerbi.DataView = {
                    metadata: builder.dataViewMetadata,
                    categorical: {
                        categories: [{
                            source: builder.dataViewMetadata.columns[0],
                            values: ["Strawberry", "Blueberry", "Blackberry"],
                            identity: [
                                mocks.dataViewScopeIdentityWithEquality(builder.field, "Strawberry"),
                                mocks.dataViewScopeIdentityWithEquality(builder.field, "Blueberry"),
                                mocks.dataViewScopeIdentityWithEquality(builder.field, "Blackberry")
                            ],
                            identityFields: [builder.field],
                        }],
                        values: DataViewTransform.createValueColumns([{
                            source: builder.dataViewMetadata.columns[1],
                            values: [40, 25, 22]
                        }])
                    }
                };
                dataView2.metadata.objects = slicerHelper.buildDefaultDataViewObjects();

                helpers.fireOnDataChanged(builder.visual, { dataViews: [dataView2] });

                expect($(".slicerContainer")).toBeInDOM();
                expect($(".slicerContainer .headerText")).toBeInDOM();
                expect($(".slicerContainer .slicerHeader .clear")).toBeInDOM();
                expect($(".slicerContainer .slicerBody")).toBeInDOM();
                expect($(".slicerContainer .slicerBody .row .slicerText")).toBeInDOM();

                expect($(".slicerText").length).toBe(4);
                expect($(".slicerText").first().text()).toBe(slicerHelper.SelectAllTextKey);
                expect($(".slicerText").last().text()).toBe("Blackberry");
            });

            it("DOM Validation - Image Slicer", () => {
                spyOn(powerbi.visuals.valueFormatter, "format").and.callThrough();

                helpers.fireOnDataChanged(builder.visual, builder.interactiveImageDataViewOptions);

                expect($(".slicerContainer")).toBeInDOM();
                expect($(".slicerContainer .headerText")).toBeInDOM();
                expect($(".slicerContainer .slicerHeader .clear")).toBeInDOM();
                expect($(".slicerContainer .slicerBody")).toBeInDOM();
                expect($(".slicerContainer .slicerBody .row img")).toBeInDOM();
                expect($(".slicerContainer .slicerBody .row img").length).toBe(5);
                expect($(".slicerContainer .slicerBody .row img").last().attr('src')).toBe("http://dummyimage.com/600x400/000/fff&text=5");
            });

            it("Validate converter", () => {
                let dataViewIdentities = builder.dataView.categorical.categories[0].identity;
                let selectionIds = [
                    SelectionId.createWithId(dataViewIdentities[0]),
                    SelectionId.createWithId(dataViewIdentities[1]),
                    SelectionId.createWithId(dataViewIdentities[2]),
                    SelectionId.createWithId(dataViewIdentities[3]),
                    SelectionId.createWithId(dataViewIdentities[4])
                ];
                let dataPoints = [
                    {
                        value: slicerHelper.SelectAllTextKey,
                        tooltip: slicerHelper.SelectAllTextKey,
                        identity: SelectionId.createWithMeasure(slicerHelper.SelectAllTextKey),
                        selected: false,
                        isSelectAllDataPoint: true
                    },
                    {
                        value: "Apple",
                        tooltip: "Apple",
                        identity: selectionIds[0],
                        selected: false
                    },
                    {
                        value: "Orange",
                        tooltip: "Orange",
                        identity: selectionIds[1],
                        selected: false
                    },
                    {
                        value: "Kiwi",
                        tooltip: "Kiwi",
                        identity: selectionIds[2],
                        selected: false
                    },
                    {
                        value: "Grapes",
                        tooltip: "Grapes",
                        identity: selectionIds[3],
                        selected: false
                    },
                    {
                        value: "Banana",
                        tooltip: "Banana",
                        identity: selectionIds[4],
                        selected: false
                    }];

                let expectedSlicerData = {
                    categorySourceName: "Fruit",
                    slicerSettings: powerbi.visuals.Slicer.DefaultStyleProperties(),
                    slicerDataPoints: dataPoints,
                    hasSelectionOverride: false,
                };
                expectedSlicerData.slicerSettings.selection.selectAllCheckboxEnabled = true;
                expectedSlicerData.slicerSettings.selection.singleSelect = false;
                jasmine.clock().tick(0);
                powerbi.visuals.DataConversion.convert(builder.dataView, slicerHelper.SelectAllTextKey, null, builder.hostServices).then(
                    slicerData => {
                        expect(slicerData.slicerDataPoints.length).toBe(6);
                        expect(slicerData).toEqual(expectedSlicerData);
                    });
            });
            
            xit("Resize", () => {
                let viewport = {
                    height: 200,
                    width: 300
                };
                builder.visual.onResizing(viewport);
                jasmine.clock().tick(0);

                expect($(".slicerContainer .slicerBody").first().css("height")).toBe("181px");
                expect($(".slicerContainer .slicerBody").first().css("width")).toBe("300px");
                expect($(".slicerContainer .headerText").first().css("width")).toBe("275px");

                // Next Resize
                let viewport2 = {
                    height: 150,
                    width: 150
                };
                builder.visual.onResizing(viewport2);
                jasmine.clock().tick(0);

                expect($(".slicerContainer .slicerBody").first().css("height")).toBe("131px");
                expect($(".slicerContainer .slicerBody").first().css("width")).toBe("150px");
            });
        });

        describe("Scroll Bar Resetting", () => {
            let field = powerbi.data.SQExprBuilder.fieldDef({
                schema: 's',
                entity: "Entity2",
                column: "PropertyName"
            });
            let dv1 = slicerHelper.buildSequenceDataView(field, 0, 100); // 0->99
            dv1.metadata.objects = slicerHelper.buildDefaultDataViewObjects(SlicerOrientation.Vertical, false, true);
            let dv2 = slicerHelper.buildSequenceDataView(field,0, 200); // 0->199
            dv2.metadata.objects = slicerHelper.buildDefaultDataViewObjects(SlicerOrientation.Vertical, false, true);
            let dvFiltered = slicerHelper.buildSequenceDataView(field, 50, 2); // 50, 51
            dvFiltered.metadata.objects = slicerHelper.buildDefaultDataViewObjects(SlicerOrientation.Vertical, false, true);

            let dvOptionsCreate: powerbi.VisualDataChangedOptions = {
                dataViews: [dv1],
                operationKind: powerbi.VisualDataChangeOperationKind.Create
            };
            let dvOptionsAppend: powerbi.VisualDataChangedOptions = {
                dataViews: [dv2],
                operationKind: powerbi.VisualDataChangeOperationKind.Append
            };
            let dvOptionsFilter: powerbi.VisualDataChangedOptions = {
                dataViews: [dvFiltered],
                operationKind: powerbi.VisualDataChangeOperationKind.Create
            };

            function loadFirstSegment(): void {
                helpers.fireOnDataChanged(builder.visual, dvOptionsCreate);
            }
            function loadSecondSegment(): void {
                helpers.fireOnDataChanged(builder.visual, dvOptionsAppend);
            }
            function loadFilteredSegment(): void {
                helpers.fireOnDataChanged(builder.visual, dvOptionsFilter);
            }
            function scrollBy(itemCount: number): void {
                // Get 'real' row height
                let rowHeight = $('.slicerItemContainer').eq(0).outerHeight(true);
                // Scrolling
                $(".slicerBody .scrollbar-inner.scroll-content").scrollTop(itemCount * rowHeight);
            }

            xit("Scrolling", (done) => {
                loadFirstSegment();

                expect($(".slicerText").eq(0).text()).toBe(dv1.categorical.categories[0].values[0]); // Fruit 0

                // Scroll by 10 items, assert first rendered element is #10
                scrollBy(10);
                helpers.executeWithDelay(() => {
                    expect($(".slicerText").eq(0).text()).toBe(dv1.categorical.categories[0].values[10]); // Fruit 10
                    done();
                }, DefaultWaitForRender);
            });

            xit("Selecting an item -> No Scroll Reset", (done) => {
                loadFirstSegment();

                // Scroll by 10 items, assert first rendered element is #10
                scrollBy(10);
                helpers.executeWithDelay(() => {
                    expect($(".slicerText").eq(0).text()).toBe(dv1.categorical.categories[0].values[10]); // Fruit 10

                    // Select an item -> No Reset
                    $(".slicerText").eq(1).trigger('click');
                    expect($(".slicerText").eq(0).text()).toBe(dv1.categorical.categories[0].values[10]); // Fruit 10
                    done();
                }, DefaultWaitForRender);
            });

            xit("Appending -> No Scroll Reset", (done) => {
                loadFirstSegment();

                // Scroll by 10 items, assert first rendered element is #10
                scrollBy(10);
                helpers.executeWithDelay(() => {
                    expect($(".slicerText").eq(0).text()).toBe(dv1.categorical.categories[0].values[10]); // Fruit 10

                    // Appending -> No change
                    loadSecondSegment();
                    expect($(".slicerText").eq(0).text()).toBe(dv1.categorical.categories[0].values[10]); // Fruit 10

                    done();
                }, DefaultWaitForRender);
            });

            xit("Filtering -> Scroll Reset", (done) => {
                loadFirstSegment();

                // Scroll by 10 items, assert first rendered element is #10
                scrollBy(10);
                helpers.executeWithDelay(() => {
                    expect($(".slicerText").eq(0).text()).toBe(dv1.categorical.categories[0].values[10]); // Fruit 10

                    // Filtering -> Scroll reset -> First rendered element
                    loadFilteredSegment();
                    expect($(".slicerText").eq(0).text()).toBe(dvFiltered.categorical.categories[0].values[0]); // Fruit 50
                    // asserting translate position is 0
                    expect($(".slicerText").eq(0).text()).toBe(dvFiltered.categorical.categories[0].values[0]); // Fruit 50
                    expect($('.visibleGroup').eq(0).css('transform').split(',')[5].split(')')[0].trim()).toBe("0");
                    done();
                }, DefaultWaitForRender);
            });
        });

        describe("Interactivity tests", () => {
            it("slicer item selectby checkbox", () => {
                jasmine.clock().tick(0);
                (<any>builder.slicerCheckbox.eq(1)).d3Click(0, 0);

                slicerHelper.validateSelectionState(SlicerOrientation.Vertical, [1], builder);
                expect(builder.hostServices.onSelect).toHaveBeenCalledWith({
                    data:
                    [
                        {
                            data: [
                                builder.interactiveDataViewOptions.dataViews[0].categorical.categories[0].identity[0]
                            ]
                        }
                    ]
                });
            });

            it("Switch slicer orientation", () => {
                // Switch to Horizontal
                builder.dataView.metadata.objects["general"] = { orientation: SlicerOrientation.Horizontal };
                helpers.fireOnDataChanged(builder.visual, { dataViews: [builder.dataView] });

                expect($(".slicerContainer")).not.toBeInDOM();
                expect($(".horizontalSlicerContainer")).toBeInDOM();

                // Switch to Vertical
                builder.dataView.metadata.objects["general"] = { orientation: SlicerOrientation.Vertical };
                helpers.fireOnDataChanged(builder.visual, { dataViews: [builder.dataView] });

                expect($(".slicerContainer")).toBeInDOM();
                expect($(".horizontalSlicerContainer")).not.toBeInDOM();
            });
        });
    });
}