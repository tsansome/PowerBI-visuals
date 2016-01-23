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

    export class SalesByCountryData {

        public getDataView(): DataView {
                let dataViewMetadata: DataViewMetadata = {
                    columns: [
                        {
                            displayName: 'Country',
                            queryName: 'Country',
                            type: ValueType.fromDescriptor({ text: true })
                        },
                        {
                            displayName: 'Sales Amount (2014)',
                            isMeasure: true,
                            format: "$0,000.00",
                            queryName: 'sales1',
                            type: ValueType.fromDescriptor({ numeric: true }),
                            objects: { dataPoint: { fill: { solid: { color: 'purple' } } } },
                        },
                        {
                            displayName: 'Sales Amount (2015)',
                            isMeasure: true,
                            format: "$0,000.00",
                            queryName: 'sales2',
                            type: ValueType.fromDescriptor({ numeric: true })
                        }
                    ]
                };

                let columns: DataViewValueColumn[] = [
                    {
                        source: dataViewMetadata.columns[1],
                        // Sales Amount for 2014
                        values: [742731.43, 162066.43, 283085.78, 300263.49, 376074.57, 814724.34],
                    },
                    {
                        source: dataViewMetadata.columns[2],
                        // Sales Amount for 2015
                        values: [123455.43, 40566.43, 200457.78, 5000.49, 320000.57, 450000.34],
                    }
                ];
                let sampleSingleData: number = 55943.67;

                let categoryValues = ["Australia", "Canada", "France", "Germany", "United Kingdom", "United States"];
                let fieldExpr = SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "country" } });
                let categoryIdentities = categoryValues.map(value => 
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
                    },
                    single: { value: sampleSingleData }
                };
        }
    }
}