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

module powerbitests.kpiHelper {
    import ValueType = powerbi.ValueType;
    import DataViewTransform = powerbi.data.DataViewTransform;

    export function buildDataViewForRedTrend(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDefaultDataViewMetadata();
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategoricalForRedTrend();
        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    function buildDefaultDataViewMetadata(): powerbi.DataViewMetadata {
        return buildDataViewMetadata(true, true, true, false);
    }

    function buildDataViewCategoricalForRedTrend(): powerbi.DataViewCategorical {
        let dataViewMetadata = buildDefaultDataViewMetadata();
        let dataViewCategorical = {
            categories: [{
                source: dataViewMetadata.columns[0],
                values: [1, 2, 3, 4, 5],
                identity: [
                    mocks.dataViewScopeIdentity(1),
                    mocks.dataViewScopeIdentity(2),
                    mocks.dataViewScopeIdentity(3),
                    mocks.dataViewScopeIdentity(4),
                    mocks.dataViewScopeIdentity(5)
                ],
            }],
            values: DataViewTransform.createValueColumns([
                {
                    source: dataViewMetadata.columns[0],
                    values: [1, 2, 3, 4, 5]
                },
                {
                    source: dataViewMetadata.columns[1],
                    values: [20, 10, 30, 15, 12]
                },
                {
                    source: dataViewMetadata.columns[2],
                    values: [20, 20, 20, 20, 20]
                }])
        };

        return dataViewCategorical;
    }

    export function buildDataViewForGreenTrend(): powerbi.DataView {
        let dataView = buildDataViewForRedTrend();
        dataView.categorical.values[1].values = [20, 10, 30, 15, 25];

        return dataView;
    }

    export function buildDataViewForYellowTrend(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadata(true, true, true, true);

        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategorical(
            dataViewMetadata.columns[0], dataViewMetadata.columns[1], dataViewMetadata.columns[2], dataViewMetadata.columns[3]);

        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    export function buildDataViewForNoGoalTrend(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadataForNoGoal();
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategoricalForNoGoal();
        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    export function buildDataViewWithMissingIndicator(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadataForNoGoal();
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategoricalForNoGoal();

        dataViewMetadata.columns.pop();
        dataViewCategorical.values.pop();

        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }
    
    export function buildDataViewWithMissingIndicatorWITHGoal(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadata(true, false, true, true);
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategorical(dataViewMetadata.columns[0], null, dataViewMetadata.columns[1], dataViewMetadata.columns[2]);

        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    export function buildDataViewWithMissingTrendline(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadata(false, true, false, false);
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategorical(null, dataViewMetadata.columns[0], null, null);

        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    export function buildDataViewWithMissingTrendlineWITHGoal(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadata(false, true, true, true);
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategorical(null, dataViewMetadata.columns[0], dataViewMetadata.columns[1], dataViewMetadata.columns[2]);

        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    export function buildDataViewWithMissingTrendlineAndIndicator(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadata(false, false, false, false);
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategorical(null, null, null, null);

        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    export function buildDataViewWithMissingTrendlineAndIndicatorBUTWithGoals(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadata(false, false, true, true);
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategorical(null, null, dataViewMetadata.columns[0], dataViewMetadata.columns[1]);

        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    function buildDataViewMetadataForNoGoal(): powerbi.DataViewMetadata {
        return buildDataViewMetadata(true, true, false, false);
    }

    function buildDataViewMetadata(trendline: boolean, indicator: boolean, lowGoal: boolean, highGoal: boolean): powerbi.DataViewMetadata {
        let columns: powerbi.DataViewMetadataColumn[] = [];

        if (trendline) {
            columns.push({ displayName: "TrendLine", type: ValueType.fromDescriptor({ text: true }), roles: { "TrendLine": true } });
        }

        if (indicator) {
            columns.push({ displayName: "Indicator", isMeasure: true, type: ValueType.fromDescriptor({ numeric: true }), roles: { "Indicator": true } });
        }

        if (lowGoal) {
            columns.push({ displayName: "Goal", isMeasure: true, roles: { "Goal": true } });
        }

        if (highGoal) {
            columns.push({ displayName: "Goal", isMeasure: true, roles: { "Goal": true } });
        }

        return {
            columns: columns
        };
    }

    function buildDataViewCategoricalForNoGoal(): powerbi.DataViewCategorical {
        let dataViewMetadata = buildDataViewMetadataForNoGoal();
        let dataViewCategorical = {
            categories: [{
                source: dataViewMetadata.columns[0],
                values: [1, 2, 3, 4, 5],
                identity: [
                    mocks.dataViewScopeIdentity(1),
                    mocks.dataViewScopeIdentity(2),
                    mocks.dataViewScopeIdentity(3),
                    mocks.dataViewScopeIdentity(4),
                    mocks.dataViewScopeIdentity(5)
                ],
            }],
            values: DataViewTransform.createValueColumns([
                {
                    source: dataViewMetadata.columns[0],
                    values: [1, 2, 3, 4, 5]
                },
                {
                    source: dataViewMetadata.columns[1],
                    values: [20, 10, 30, 15, 12]
                }])
        };

        return dataViewCategorical;
    }

    function buildDataViewCategorical(trendlineMetaDataColumn: powerbi.DataViewMetadataColumn, indicatorMetaDataColumn: powerbi.DataViewMetadataColumn,
        lowGoalMetaDataColumn: powerbi.DataViewMetadataColumn, highGoalMetaDataColumn: powerbi.DataViewMetadataColumn): powerbi.DataViewCategorical {

        let dataViewValueColumns: powerbi.DataViewValueColumn[] = [];

        let sourceColumn: powerbi.DataViewMetadataColumn;

        if (trendlineMetaDataColumn) {
            dataViewValueColumns.push({
                source: trendlineMetaDataColumn,
                values: [1, 2, 3, 4, 5]
            });

            sourceColumn = trendlineMetaDataColumn;
        }

        if (indicatorMetaDataColumn) {
            dataViewValueColumns.push({
                source: indicatorMetaDataColumn,
                values: [20, 10, 30, 15, 12]
            });

            if (!sourceColumn) {
                sourceColumn = indicatorMetaDataColumn;
            }
        }

        if (lowGoalMetaDataColumn) {
            dataViewValueColumns.push({
                source: lowGoalMetaDataColumn,
                values: [1, 1, 1, 1, 1]
            });
        }

        if (highGoalMetaDataColumn) {
            dataViewValueColumns.push({
                source: highGoalMetaDataColumn,
                values: [100, 200, 300, 400, 500]
            });
        }

        let source: powerbi.DataViewMetadataColumn;
        let values: number[];
        let identity: powerbi.DataViewScopeIdentity[];

        if (trendlineMetaDataColumn && indicatorMetaDataColumn) {
            source = sourceColumn;
            values = [1, 2, 3, 4, 5];
            identity = [
                mocks.dataViewScopeIdentity(1),
                mocks.dataViewScopeIdentity(2),
                mocks.dataViewScopeIdentity(3),
                mocks.dataViewScopeIdentity(4),
                mocks.dataViewScopeIdentity(5)
            ];
        }

        let dataViewCategorical = {
            categories: [{
                source: source,
                values: values,
                identity: identity,
            }],
            values: DataViewTransform.createValueColumns(dataViewValueColumns)
        };

        return dataViewCategorical;
    }

    export function buildDataViewForGreenNoTrend(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadataForNoTrend();
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategoricalForGreenNoTrend();
        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    function buildDataViewMetadataForNoTrend(): powerbi.DataViewMetadata {
        return buildDataViewMetadata(false, true, true, false);
    }

    function buildDataViewCategoricalForGreenNoTrend(): powerbi.DataViewCategorical {
        let dataViewMetadata = buildDataViewMetadataForNoTrend();
        let dataViewCategorical = {
            values: DataViewTransform.createValueColumns([{
                source: dataViewMetadata.columns[0],
                values: [20]
            },
                {
                    source: dataViewMetadata.columns[1],
                    values: [15]
                }])
        };

        return dataViewCategorical;
    }

    export function buildDataViewForRedNoTrend(): powerbi.DataView {
        let dataView = buildDataViewForGreenNoTrend();
        dataView.categorical.values[0].values = [10];

        return dataView;
    }
}