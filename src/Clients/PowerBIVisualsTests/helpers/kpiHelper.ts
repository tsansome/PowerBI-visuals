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
        return {
            columns: [
                { displayName: "TrendLine", type: ValueType.fromDescriptor({ text: true }) },
                { displayName: "Indicator", type: ValueType.fromDescriptor({ numeric: true }), isMeasure: true, roles: { "Indicator": true } },
                { displayName: "Goal", isMeasure: true }]
        };
    }

    function buildDataViewCategoricalForRedTrend(): powerbi.DataViewCategorical {        
        let dataViewMetadata = buildDefaultDataViewMetadata();
        let dataViewCategorical = {
            categories: [{
                source: dataViewMetadata.columns[0],
                values: ["Apple", "Orange", "Kiwi", "Grapes", "Banana"],   
                identity: [
                    mocks.dataViewScopeIdentity("Apple"),
                    mocks.dataViewScopeIdentity("Orange"),
                    mocks.dataViewScopeIdentity("Kiwi"),
                    mocks.dataViewScopeIdentity("Grapes"),
                    mocks.dataViewScopeIdentity("Banana")
                ],            
            }],
            values: DataViewTransform.createValueColumns([{
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
        dataView.categorical.values[0].values = [20, 10, 30, 15, 25];
          
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

    function buildDataViewMetadataForNoGoal(): powerbi.DataViewMetadata {
        return {
            columns: [
                { displayName: "Fruit", type: ValueType.fromDescriptor({ text: true }) },
                { displayName: "Indicator", isMeasure: true, type: ValueType.fromDescriptor({ numeric: true }), roles: { "Indicator": true } },]          
        };
    }

    function buildDataViewCategoricalForNoGoal(): powerbi.DataViewCategorical {
        let dataViewMetadata = buildDataViewMetadataForNoGoal();
        let dataViewCategorical = {
            categories: [{
                source: dataViewMetadata.columns[0],
                values: ["Apple", "Orange", "Kiwi", "Grapes", "Banana"],
                identity: [
                    mocks.dataViewScopeIdentity("Apple"),
                    mocks.dataViewScopeIdentity("Orange"),
                    mocks.dataViewScopeIdentity("Kiwi"),
                    mocks.dataViewScopeIdentity("Grapes"),
                    mocks.dataViewScopeIdentity("Banana")
                ],
            }],
            values: DataViewTransform.createValueColumns([{
                source: dataViewMetadata.columns[1],
                values: [20, 10, 30, 15, 18]
            }])
        };

        return dataViewCategorical;
    }

    export function buildDataViewForGreenNoTrend(): powerbi.DataView {
        let dataViewMetadata: powerbi.DataViewMetadata = buildDataViewMetadataForGreenNoTrend();
        let dataViewCategorical: powerbi.DataViewCategorical = buildDataViewCategoricalForGreenNoTrend();
        let dataView: powerbi.DataView = {
            metadata: dataViewMetadata,
            categorical: dataViewCategorical
        };

        return dataView;
    }

    function buildDataViewMetadataForGreenNoTrend(): powerbi.DataViewMetadata {
        return {
            columns: [                
                { displayName: "Indicator", isMeasure: true, type: ValueType.fromDescriptor({ numeric: true }), roles: { "Indicator": true } }, 
                { displayName: "Goal", isMeasure: true, roles: { "Goal": true }}]
        };
    }

    function buildDataViewCategoricalForGreenNoTrend(): powerbi.DataViewCategorical {
        let dataViewMetadata = buildDataViewMetadataForGreenNoTrend();
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