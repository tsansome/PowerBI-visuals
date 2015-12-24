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

module powerbi.visuals.sampleDataViews {
    import DataViewTransform = powerbi.data.DataViewTransform;

    export class CarLogosData extends SampleDataViews implements ISampleDataViewsMethods {

        public name: string = "CarLogosData";
        public displayName: string = "Car logos";

        public visuals: string[] = ['chicletSlicer'];

        private sampleData: number[] = [5, 10, 15, 20, 25];
        private categoryValues: string[] = ["BMW", "Mercedes", "Honda", "Toyota", "Ferrari"];
        private carImages: string[] = [
            "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/bmw.png",
            "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/mercedes.png",
            "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/honda.png",
            "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/toyota.gif",
            "https://raw.githubusercontent.com/Microsoft/PowerBI-visuals/resources/images/chicletSlicer/ferrari.png"
        ];

        public getDataViews(): DataView[] {

            let fieldExpr = powerbi.data.SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "country" } });

            let categoryIdentities = this.categoryValues.map(function (value) {
                let expr = powerbi.data.SQExprBuilder.equal(fieldExpr, powerbi.data.SQExprBuilder.text(value));
                return powerbi.data.createDataViewScopeIdentity(expr);
            });
        
            // Metadata, describes the data columns, and provides the visual with hints
            // so it can decide how to best represent the data
            let dataViewMetadata: powerbi.DataViewMetadata = {
                columns: [
                    {
                        displayName: 'Car',
                        queryName: 'Country',
                        roles: {
                            Category: true
                        },
                        type: powerbi.ValueType.fromDescriptor({ text: true })
                    },
                    {
                        displayName: 'Sales Count',
                        format: "g",
                        isMeasure: true,
                        queryName: 'sales',
                        roles: { 
                            Values : true 
                        },
                        type: powerbi.ValueType.fromDescriptor({ numeric: true }),
                        objects: { dataPoint: { fill: { solid: { color: 'purple' } } } },
                    },
                    {
                        displayName: 'Image',
                        format: "g",
                        queryName: 'Image',
                        roles: {
                            Image: true
                        },
                        type: powerbi.ValueType.fromDescriptor({ text: true })
                    }
                ],
                objects: {
                    general: {
                        columns: 1
                    }
                }
            };

            
            let imageFieldExpr = powerbi.data.SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "Image" } });
            
            let imageIdentities = this.carImages.map(function (value) {
                let expr = powerbi.data.SQExprBuilder.equal(imageFieldExpr, powerbi.data.SQExprBuilder.text(value));
                return powerbi.data.createDataViewScopeIdentity(expr);
            });

            let columns: DataViewValueColumn[] = this.categoryValues.map((car, i): DataViewValueColumn => {

                let source = dataViewMetadata.columns[1];
                source.groupName = this.carImages[i];
                return {
                    source: source,
                    identity: imageIdentities[i],
                    values: this.sampleData
                };
            });

            let dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(columns, [fieldExpr, imageFieldExpr], dataViewMetadata.columns[2]);
            
            return [{
                metadata: dataViewMetadata,
                categorical: {
                    categories: [{
                        source: dataViewMetadata.columns[0],
                        values: this.categoryValues,
                        identity: categoryIdentities,
                    }],
                    values: dataValues
                }
            }];
        }

        public randomize(): void {
        }        
    }
}