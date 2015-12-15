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
        Values: any[];
        public constructor(groupName, values) {
            this.GroupName = groupName;
            this.Values = values;
        }
        public ToDataViewValueColumn(MeasureDisplayName: string, MeasureQueryName: string): DataViewValueColumn {
            return {
                source: {
                    roles: {
                        Y: true
                    },
                    type: new ValueType(260, null),
                    format: "0",
                    displayName: MeasureDisplayName,
                    queryName: MeasureQueryName,
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

    export class NodeLinkDataViewGenerator {

        private static createCategory(displayNameEnter: string, queryNameEnter: string, categoryValues: string[]): DataViewCategoryColumn {
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

        public static gen(name: string, displayName: string, visualsSupported: string[], NodeTo: string[], NodeFrom: Group[], measureDisplayName: string, measureQueryName: string) {

            //first we need to create the nodes to within the category variable
            var category = NodeLinkDataViewGenerator.createCategory("NodeTo", "NodeLinks.NodeTo", NodeTo);
            
            //so lets create the data records          
            var dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(_.map(NodeFrom, function (group) { return group.ToDataViewValueColumn(measureDisplayName, measureQueryName); }));
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

            var dv = {
                metadata: dataViewMetadata,
                categorical: {
                    categories: [category],
                    values: dataValues
                }
            };

            return dv;
        }

    }

    export class NodeLinkDataBase extends SampleDataViews {
        public visuals: string[] = ['nodeLink','opinionVis2' ];

        public measureDisplayName_nodeCat = "NodeSize";
        public measureQueryName_nodeCat = "Sum(NodeLinksCategories.NodeSize)";

        //our measures
        public measureDisplayName = "StrengthOfRelationship";
        public measureQueryName = "Sum(NodeLinks.StrengthOfRelationship)";
        
        public getRandomValue(min: number, max: number): number {
            return 1;
        }

        public randomElement(arr: any[]): any {
            return {};
        }

        public randomize(): void {
        }
    }

    export class NodeLinkData4Node extends NodeLinkDataBase implements ISampleDataViewsMethods {
        
        public name: string = "4NodeNodeLinkData";
        public displayName: string = "4 Node link data";
        
        public getDataViews(): DataView[] {
            
            var nodesTo = ["Playstation", "WiiU", "WindowsPhone", "Xbox"];

            var groupings = [
                new Group("Playstation", [20, 10, 50, 15]),
                new Group("WindowsPhone", [30, 70, 15, 40]),
                new Group("Xbox", [30, 45, 50, null])
            ];

            //return the data view    
            var dv = NodeLinkDataViewGenerator.gen(this.name, this.displayName, this.visuals, nodesTo, groupings, this.measureDisplayName, this.measureQueryName);
            
            //do a node category grouping as well

            var categories = ["Entertainment", "Device"];
            
            var groups = [
                new Group("Playstation", [80, null]),
                new Group("WiiU", [92, null]),
                new Group("WindowsPhone", [null, 55]),
                new Group("Xbox",[22,null])
            ];

            var nodeFromCat = NodeLinkDataViewGenerator.gen("NodeCategories", "Node Categories", this.visuals, categories, groups, this.measureDisplayName_nodeCat, this.measureQueryName_nodeCat);

            var nodeToCat = NodeLinkDataViewGenerator.gen("NodeCategories", "Node Categories", this.visuals, categories, groups, this.measureDisplayName_nodeCat, this.measureQueryName_nodeCat);

            return [dv, nodeToCat, nodeFromCat];
        }
    }

    export class NodeLinkData10Node extends NodeLinkDataBase implements ISampleDataViewsMethods {

        public name: string = "10NodeNodeLinkData";
        public displayName: string = "10 Node link data";

        public getDataViews(): DataView[] {

            var nodesTo = ["Bob", "Fred", "Will", "Joe","Ben","Alice","Penelope","Vanessa","Anna","Alexandra"];

            var groupings = [
                new Group("Bob", [null, null, 70, null,null,null,null,null,null,null,null]),
                new Group("Fred", [null, 10, 23, null, null, null, null, null, null, null, null]),
                new Group("Will", [null, null, null, null, null, null, null, null, null, null, null]),
                new Group("Joe", [null, null, 90, null, null, null, null, null, null, null, null]),
                new Group("Ben", [null, null, 95, null, null, null, null, null, null, null, null]),
                new Group("Alice", [15, 31, null, null, null, null, null, null, null, null, null]),
                new Group("Penelope", [67, 21, null, null, null, null, null, null, null, null, null]),
                new Group("Vanessa", [null, null, null, 89, null, null, null, null, null, null, null]),
                new Group("Anna", [null, null, null, 90, null, null, null, null, null, null, null]),
                new Group("Alexandra", [null, 51, 23, null, null, null, null, null, null, null, null])
            ];

            //return the data view    
            var dv = NodeLinkDataViewGenerator.gen(this.name, this.displayName, this.visuals, nodesTo, groupings, this.measureDisplayName, this.measureQueryName);

            return [dv];
        }
    }

    export class NodeLinkData10NodeWithCategories extends NodeLinkDataBase implements ISampleDataViewsMethods {

        public name: string = "10NodeNodeLinkDataWithCategories";
        public displayName: string = "10 Node link data with categories";

        public getDataViews(): DataView[] {

            var nodesTo = ["Jane", "Juniper", "Alan", "Bob","Jill","Fred","Bill","Liam"];

            var groupings = [
                new Group("Jill", [30, 21, 11, 90, null, null, null, null, null, null, null]),
                new Group("Jane", [null, 88, null, null, null, null, null, null, null, null, null]),
                new Group("Alice", [null, null, null, null, 90, null, null, null, null, null, null]),
                new Group("Alan", [null, null, null, 21, null, 65, 14, null, null, null, null]),
                new Group("Bob", [null, null, null, null, null, null, 120, null, null, null, null]),
                new Group("Liam", [null, null, 2, null, null, null, null, null, null, null, null]),
                new Group("Bill", [null, null, null, null, null, null, null, 5, null, null, null]),
                new Group("Fred", [null, null, null, null, null, null, null, 7, null, null, null]),
            ];

            //return the data view    
            var dv = NodeLinkDataViewGenerator.gen(this.name, this.displayName, this.visuals, nodesTo, groupings, this.measureDisplayName, this.measureQueryName);

            var categories = ["Recommender", "Control"];

            var groups = [
                new Group("Jill", [80, null]),
                new Group("Jane", [92, null]),
                new Group("Alice", [55, null]),
                new Group("Alan", [null, 22]),
                new Group("Bob", [null, 22]),
                new Group("Liam", [null, 22]),
                new Group("Bill", [null, 22]),
                new Group("Bill", [22, null])
            ];

            var nodeFromCat = NodeLinkDataViewGenerator.gen("NodeCategories", "Node Categories", this.visuals, categories, groups, this.measureDisplayName_nodeCat, this.measureQueryName_nodeCat);

            var categories = ["Recommender", "Control"];

            var groups = [
                new Group("Jane", [80, null]),
                new Group("Juniper", [null, 92]),
                new Group("Alan", [null, 55]),
                new Group("Bob", [null, 22]),
                new Group("Jill", [22, null]),
                new Group("Fred", [22, null]),
                new Group("Bill", [null, 22]),
                new Group("Liam", [null, 22])
            ];

            var nodeToCat = NodeLinkDataViewGenerator.gen("NodeCategories", "Node Categories", this.visuals, categories, groups, this.measureDisplayName_nodeCat, this.measureQueryName_nodeCat);

            return [dv, nodeToCat, nodeFromCat];
        }
    }

    export class NodeLinkData10NodeWithBlankCategory extends NodeLinkDataBase implements ISampleDataViewsMethods {

        public name: string = "10NodeNodeLinkDataWithBlankCategory";
        public displayName: string = "10 Node link data with blank category";

        public getDataViews(): DataView[] {

            var nodesTo = ["Jane", "Juniper", "Alan", "Bob", "Jill", "Fred", "Bill", "Liam"];

            var groupings = [
                new Group("Jill", [30, 21, 11, 90, null, null, null, null, null, null, null]),
                new Group("Jane", [null, 88, null, null, null, null, null, null, null, null, null]),
                new Group("Alice", [null, null, null, null, 90, null, null, null, null, null, null]),
                new Group("Alan", [null, null, null, 21, null, 65, 14, null, null, null, null]),
                new Group("Bob", [null, null, null, null, null, null, 120, null, null, null, null]),
                new Group("Liam", [null, null, 2, null, null, null, null, null, null, null, null]),
                new Group("Bill", [null, null, null, null, null, null, null, 5, null, null, null]),
                new Group("Fred", [null, null, null, null, null, null, null, 7, null, null, null]),
            ];

            //return the data view    
            var dv = NodeLinkDataViewGenerator.gen(this.name, this.displayName, this.visuals, nodesTo, groupings, this.measureDisplayName, this.measureQueryName);

            var categories = [];

            var groups = [
                new Group("Jill", [80]),
                new Group("Jane", [92]),
                new Group("Alice", [55]),
                new Group("Alan", [22]),
                new Group("Bob", [22]),
                new Group("Liam", [22]),
                new Group("Bill", [22])
            ];

            var nodeFromCat = NodeLinkDataViewGenerator.gen("NodeCategories", "Node Categories", this.visuals, categories, groups, this.measureDisplayName_nodeCat, this.measureQueryName_nodeCat);

            var categories = [];

            var groups = [
                new Group("Jane", [80]),
                new Group("Juniper", [92]),
                new Group("Alan", [55]),
                new Group("Bob", [22]),
                new Group("Jill", [22]),
                new Group("Fred", [22]),
                new Group("Bill", [22]),
                new Group("Liam", [22])
            ];

            var nodeToCat = NodeLinkDataViewGenerator.gen("NodeCategories", "Node Categories", this.visuals, categories, groups, this.measureDisplayName_nodeCat, this.measureQueryName_nodeCat);

            return [dv, nodeToCat, nodeFromCat];
        }
    }

}