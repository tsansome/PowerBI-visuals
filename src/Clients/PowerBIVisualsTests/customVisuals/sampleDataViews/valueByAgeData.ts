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
    import DataViewTransform = powerbi.data.DataViewTransform;

    export class ValueByAgeData {

        public getDataView(): powerbi.DataView {
            let ages = [10, 11, 12, 15, 16, 20, 21, 25, 26, 27, 28, 29, 30, 31, 40, 50, 60];

            let frequency = [7, 6, 10, 4, 3, 3, 3, 6, 10, 4, 1, 7, 9, 2, 9, 4, 5];       
        
            let fieldExpr = powerbi.data.SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "age" } });

            let identities = ages.map(function (value) {
                let expr = powerbi.data.SQExprBuilder.equal(fieldExpr, powerbi.data.SQExprBuilder.decimal(value));
                return powerbi.data.createDataViewScopeIdentity(expr);
            });

            let dataViewMetadata: powerbi.DataViewMetadata = {
                columns: [
                    {
                        displayName: 'Age',
                        queryName: 'table1.Age',
                        isMeasure: true,
                        type: powerbi.ValueType.fromDescriptor({ numeric: true }),
                    },
                    {
                        displayName: 'Value',
                        isMeasure: true,
                        queryName: 'Sum(table1.Value)',
                        type: powerbi.ValueType.fromDescriptor({ numeric: true })
                    }
                ]
            };

            let columns = [
                {
                    source: dataViewMetadata.columns[0],
                    values: ages,
                },
                {
                    source: dataViewMetadata.columns[1],
                    values: frequency,
                }
            ];

            let dataValues: powerbi.DataViewValueColumns = DataViewTransform.createValueColumns([columns[1]]);
            let tableDataValues = helpers.getTableDataValues(ages, columns);
        
            return {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: ages,
                        identity: identities,
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
