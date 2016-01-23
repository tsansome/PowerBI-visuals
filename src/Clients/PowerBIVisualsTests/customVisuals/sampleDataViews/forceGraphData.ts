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

/// <reference path="../../_references.ts"/>

module powerbitests.customVisuals.sampleDataViews {
    import SQExprBuilder = powerbi.data.SQExprBuilder;
    import DataView = powerbi.DataView;
    import DataViewMetadata = powerbi.DataViewMetadata;
    import ValueType = powerbi.ValueType;
    import DataViewTransform = powerbi.data.DataViewTransform;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import DataViewValueColumn = powerbi.DataViewValueColumn;

    export class ForceGraphData {

        public getDataView(): DataView {
            let dataViewMetadata: DataViewMetadata = {
                columns: [
                    {
                        displayName: 'Source',
                        roles: { 'Source': true },
                        type: ValueType.fromDescriptor({ text: true }),
                    }, {
                        displayName: 'Target',
                        roles: { 'Target': true },
                        type: ValueType.fromDescriptor({ text: true }),
                    }, {
                        displayName: 'Weight',
                        roles: { 'Weight': true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ numeric: true }),
                    }, {
                        displayName: 'LinkType',
                        roles: { 'LinkType': true },
                        type: ValueType.fromDescriptor({ text: true }),
                    }, {
                        displayName: 'SourceType',
                        roles: { 'SourceType': true },
                        type: ValueType.fromDescriptor({ text: true }),
                    }, {
                        displayName: 'TargetType',
                        roles: { 'TargetType': true },
                        type: ValueType.fromDescriptor({ text: true }),
                    }
                ]
            };

            let sourceValues = ["Brazil", "Canada",  "USA", "Portugal"];
            let targetValues = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];

            let columns: DataViewValueColumn[] = [{
                    source: dataViewMetadata.columns[0],
                    values: targetValues
                }];

            let tableDataValues = helpers.getTableDataValues(sourceValues, columns);

            let dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(columns);

            let sourceValuesfieldExpr = SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "source", name: "source" } });
            let sourceValuesIdentities = sourceValues.map((value) =>
                powerbi.data.createDataViewScopeIdentity(SQExprBuilder.equal(sourceValuesfieldExpr, SQExprBuilder.text(value))));

            let targetValuesfieldExpr = SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "target", name: "target" } });
            let targetValuesIdentities = targetValues.map((value) =>
                powerbi.data.createDataViewScopeIdentity(SQExprBuilder.equal(targetValuesfieldExpr, SQExprBuilder.text(value))));

            return {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                            source: dataViewMetadata.columns[0],
                            values: sourceValues,
                            identity: sourceValuesIdentities
                        }, {
                            source: dataViewMetadata.columns[1],
                            values: targetValues,
                            identity: targetValuesIdentities
                        }],
                    values: dataValues
                },
                table: {
                    rows: tableDataValues,
                    columns: dataViewMetadata.columns,
                }
            };
        }
    }
}