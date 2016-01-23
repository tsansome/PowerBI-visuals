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

    export class BulletChartData {

        public getDataView(): DataView {
            let dataViewMetadata: DataViewMetadata = {
                columns: [
                    {
                        displayName: 'Category',
                        roles: { 'Category': true },
                        type: ValueType.fromDescriptor({ text: true }),
                    }, {
                        displayName: 'Value',
                        roles: { 'Value': true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ numeric: true }),
                    }, {
                        displayName: 'Target Value',
                        roles: { 'TargetValue': true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ numeric: true }),
                    }, {
                        displayName: 'Minimum',
                        roles: { 'Minimum': true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ numeric: true }),
                    }, {
                        displayName: 'Satisfactory',
                        roles: { 'Satisfactory': true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ numeric: true }),
                    }, {
                        displayName: 'Good',
                        roles: { 'Good': true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ numeric: true }),
                    }, {
                        displayName: 'Maximum',
                        roles: { 'Maximum': true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ numeric: true }),
                    }
                ]
            };

            let columns: DataViewValueColumn[] = [
                {
                    source: dataViewMetadata.columns[1],
                    // Value
                    values: [2, 4, 3, 3, 4, 3, 4, 5],
                },
                {
                    source: dataViewMetadata.columns[2],
                    // TargetValue
                    values: [3, 3, 3, 2, 2, 2, 3, 3],
                },
                {
                    source: dataViewMetadata.columns[3],
                    // Minimum
                    values: [1,1 ,1 ,1 ,1 ,1 ,2 ,2],
                },
                {
                    source: dataViewMetadata.columns[4],
                    // Satisfactory
                    values: [2, 2 ,2 ,3 ,3 ,3 ,3 ,3],
                },
                {
                    source: dataViewMetadata.columns[5],
                    // Good
                    values: [4, 4, 4 ,6 ,6 ,6 ,4 ,4],
                },
                {
                    source: dataViewMetadata.columns[6],
                    // Maximum
                    values: [6, 6, 6, 8, 8, 8, 8, 7],
                }
            ];

            let fieldExpr = SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "Category", name: "Category" } });
            let categoryValues = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];
            let categoryIdentities = categoryValues.map((value) => 
                powerbi.data.createDataViewScopeIdentity(SQExprBuilder.equal(fieldExpr, SQExprBuilder.text(value))));

            let dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(columns);
            let tableDataValues = helpers.getTableDataValues(categoryValues, columns);

            return {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: categoryValues,
                        identity: categoryIdentities,
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