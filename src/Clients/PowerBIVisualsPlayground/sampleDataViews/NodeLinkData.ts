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

    export class Group {
        GroupName: string;
        MeasureDisplayName: string;
        MeasureQueryName: string;
        Values: any[];
        public constructor(groupName, measureDisplayName, measureQueryName, values) {
            this.GroupName = groupName;
            this.MeasureDisplayName = measureDisplayName;
            this.MeasureQueryName = measureQueryName;
            this.Values = values;
        }
        public ToDataViewValueColumn(): DataViewValueColumn {
            return {
                source: {
                    roles: {
                        Y: true
                    },
                    type: new ValueType(260, null),
                    format: "0",
                    displayName: this.MeasureDisplayName,
                    queryName: this.MeasureQueryName,
                    objects: {
                        general: {
                            formatString: "0"
                        }
                    },
                    groupName: this.GroupName,
                    index: 2,
                    isMeasure: true
                },
                values: this.Values
            };
        }
    }

    export class NodeLinkData extends SimpleMatrixData {

        public createCategory(displayNameEnter: string, queryNameEnter: string, categoryValues: string[]): DataViewCategoryColumn {
            return {
                source: {
                    roles: {
                        Category: true
                    },
                    type: new ValueType(1, null),
                    displayName: displayNameEnter,
                    queryName: queryNameEnter
                },
                values: categoryValues
            };
        }

        public createDataRecord(groupNameEnter, measureDisplayNameEnter, measureQueryName, valuesEnter: number[]): DataViewValueColumn {
            return {
                source: {
                    roles: {
                        Y: true
                    },
                    type: new ValueType(260, null),
                    format: "0",
                    displayName: measureDisplayNameEnter,
                    queryName: measureQueryName,
                    objects: {
                        general: {
                            formatString: "0"
                        }
                    },
                    groupName: groupNameEnter,
                    index: 2,
                    isMeasure: true
                },
                values: valuesEnter
            };
        }

        public name: string = "SimpleNodeLinkData";
        public displayName: string = "Simple node link data";

        public visuals: string[] = ['nodeLink', ];

        public getDataViews(): DataView[] {

            //var fieldExpr = powerbi.data.SQExprBuilder.fieldDef({ schema: 's', entity: "NodeLinks", column: "NodeTo" });
            //var nodesToIdentities = nodesToValues.map(function (value) {
            //    var expr = powerbi.data.SQExprBuilder.equal(fieldExpr, powerbi.data.SQExprBuilder.text(value));
            //    return powerbi.data.createDataViewScopeIdentity(expr);
            //});

            //first we need to create the nodes to within the category variable
            var category = this.createCategory("NodeTo", "NodeLinks.NodeTo", ["Playstation", "WiiU", "WindowsPhone", "Xbox"]);

            //now we define a measure
            var measureDisplayName = "StrengthOfRelationship";
            var measureQueryName = "Sum(NodeLinks.StrengthOfRelationship)";

            var groupings = [
                new Group("Playstation", measureDisplayName, measureQueryName, [null, null, null, 15]),
                new Group("WindowsPhone", measureDisplayName, measureQueryName, [null, 70, null, null]),
                new Group("Xbox", measureDisplayName, measureQueryName, [30, null, 50, null])
            ];

            //so lets create the data records          
            var dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(_.map(groupings, function (group) { return group.ToDataViewValueColumn(); }));
            //now attach the series property to it
            var seriesEntity: DataViewMetadataColumn = {
                roles: {
                    Series: true
                },
                displayName: "NodeFrom",
                queryName: "NodeLinks.NodeFrom",
                type: new ValueType(1, null),
            };
            dataValues.source = seriesEntity;
            
            //create the meta data
            var dataViewMetadata: powerbi.DataViewMetadata = {
                columns: []
            };

            //return the data view        
            return [{

                metadata: dataViewMetadata,
                categorical: {
                    categories: [category],
                    values: dataValues
                }
            }];
        }

        public randomize(): void {
        }

    }
}