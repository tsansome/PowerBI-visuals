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

module powerbi.data {
    import DataViewTransform = powerbi.data.DataViewTransform;
    import SQExprBuilder = powerbi.data.SQExprBuilder;

    /** Utility for creating a DataView from columns of data. */
    export interface IDataViewBuilderCategorical {
        withCategory(options: DataViewBuilderCategoryColumnOptions): IDataViewBuilderCategorical;
        withCategories(categories: DataViewCategoryColumn[]): IDataViewBuilderCategorical;
        withValues(options: DataViewBuilderValuesOptions): IDataViewBuilderCategorical;
        withGroupedValues(options: DataViewBuilderGroupedValuesOptions): IDataViewBuilderCategorical;

        build(): DataView;
    }

    export interface DataViewBuilderColumnOptions {
        source: DataViewMetadataColumn;
    }

    export interface DataViewBuilderCategoryColumnOptions extends DataViewBuilderColumnOptions {
        values: PrimitiveValue[];
        identityFrom: DataViewBuilderColumnIdentitySource;
    }

    export interface DataViewBuilderValuesOptions {
        columns: DataViewBuilderValuesColumnOptions[];
    }

    export interface DataViewBuilderGroupedValuesOptions {
        groupColumn: DataViewBuilderCategoryColumnOptions;
        valueColumns: DataViewBuilderColumnOptions[];
        data: DataViewBuilderSeriesData[][];
    }

    /** Indicates the source set of identities. */
    export interface DataViewBuilderColumnIdentitySource {
        fields: SQExpr[];
        identities?: DataViewScopeIdentity[];
    }

    export interface DataViewBuilderValuesColumnOptions extends DataViewBuilderColumnOptions, DataViewBuilderSeriesData {
    }

    export interface DataViewBuilderSeriesData {
        values: PrimitiveValue[];
        highlights?: PrimitiveValue[];

        /** Client-computed maximum value for a column. */
        maxLocal?: any;

        /** Client-computed maximum value for a column. */
        minLocal?: any;
    }

    export function createCategoricalDataViewBuilder(): IDataViewBuilderCategorical {
        return new CategoricalDataViewBuilder();
    }

    interface ColumnMetadata {
        column: DataViewMetadataColumn;
        identityFrom: DataViewBuilderColumnIdentitySource;
        values: PrimitiveValue[];
    }

    class CategoricalDataViewBuilder implements IDataViewBuilderCategorical {
        private categories: DataViewCategoryColumn[];
        private measureColumns: DataViewMetadataColumn[];
        private hasDynamicSeries: boolean;
        private dynamicSeriesMetadata: ColumnMetadata;
        private columnIndex: number;
        private data: DataViewBuilderValuesColumnOptions[]| DataViewBuilderSeriesData[][];

        constructor() {
            this.categories = [];
            this.measureColumns = [];
            this.columnIndex = 0;
        }

        public withCategory(options: DataViewBuilderCategoryColumnOptions): IDataViewBuilderCategorical {
            let categoryValues = options.values,
                identityFrom = options.identityFrom,
                type = options.source.type;

            let categoryColumn: DataViewCategoryColumn = {
                source: options.source,
                identityFields: options.identityFrom.fields,
                identity: options.identityFrom.identities || [],
                values: categoryValues,
            };

            if (!options.identityFrom.identities) {
                for (let categoryIndex = 0, categoryLength = categoryValues.length; categoryIndex < categoryLength; categoryIndex++) {
                    categoryColumn.identity.push(
                        getScopeIdentity(identityFrom, categoryIndex, categoryValues[categoryIndex], type));
                }
            }

            if (!this.categories)
                this.categories = [];

            this.categories.push(categoryColumn);

            return this;
        }

        public withCategories(categories: DataViewCategoryColumn[]): IDataViewBuilderCategorical {
            if (_.isEmpty(this.categories))
                this.categories = categories;
            else
                Array.prototype.push.apply(this.categories, categories);

            return this;
        }

        public withValues(options: DataViewBuilderValuesOptions): IDataViewBuilderCategorical {
            debug.assertValue(options, 'options');

            let columns = options.columns;
            debug.assertValue(columns, 'columns');

            for (let column of columns) {
                this.measureColumns.push(column.source);
            }

            this.data = columns;

            return this;
        }

        public withGroupedValues(options: DataViewBuilderGroupedValuesOptions): IDataViewBuilderCategorical {
            debug.assertValue(options, 'options');

            this.hasDynamicSeries = true;

            let groupColumn = options.groupColumn;
            debug.assertValue(groupColumn, 'groupColumn');

            this.dynamicSeriesMetadata = {
                column: groupColumn.source,
                identityFrom: groupColumn.identityFrom,
                values: groupColumn.values,
            };

            let valueColumns = options.valueColumns;
            for (let valueColumn of valueColumns) {
                this.measureColumns.push(valueColumn.source);
            }

            this.data = options.data;

            return this;
        }

        private fillData(dataViewValues: DataViewValueColumns, groups: DataViewMetadataColumn[]) {
            let categoryColumn = _.first(this.categories);
            let categoryLength = (categoryColumn && categoryColumn.values) ? categoryColumn.values.length : 1;

            if (this.hasDynamicSeries) {
                // Dynamic series
                let data = <DataViewBuilderSeriesData[][]>this.data;
                for (let seriesIndex = 0; seriesIndex < this.dynamicSeriesMetadata.values.length; seriesIndex++) {
                    let seriesMeasures = data[seriesIndex];
                    debug.assert(seriesMeasures.length === this.measureColumns.length, 'seriesMeasures.length === this.measureColumns.length');

                    for (let measureIndex = 0, measuresLen = this.measureColumns.length; measureIndex < measuresLen; measureIndex++) {
                        let groupIndex = seriesIndex * measuresLen + measureIndex;

                        applySeriesData(dataViewValues[groupIndex], seriesMeasures[measureIndex], categoryLength);
                    }
                }
            }
            else {
                // Static series
                let data = <DataViewBuilderValuesColumnOptions[]>this.data;
                for (let measureIndex = 0, measuresLen = this.measureColumns.length; measureIndex < measuresLen; measureIndex++) {
                    applySeriesData(dataViewValues[measureIndex], data[measureIndex], categoryLength);
                }
            }
        }

        public build(): DataView {
            let metadataColumns: DataViewMetadataColumn[] = [];
            let categorical: DataViewCategorical = {};
            let groups: DataViewMetadataColumn[];

            let categoryMetadata = this.categories;
            let dynamicSeriesMetadata = this.dynamicSeriesMetadata;

            // --- Build metadata columns and value groups ---
            for (let columnMetadata of categoryMetadata) {
                pushIfNotExists(metadataColumns, columnMetadata.source);
            }

            if (this.hasDynamicSeries) {
                pushIfNotExists(metadataColumns, dynamicSeriesMetadata.column);
            }

            if (this.hasDynamicSeries) {
                // Dynamic series
                categorical.values = DataViewTransform.createValueColumns([], dynamicSeriesMetadata.identityFrom.fields, dynamicSeriesMetadata.column);

                let measures = this.measureColumns;
                groups = [];

                // For each series value we will make one column per measure
                let seriesValues = dynamicSeriesMetadata.values;
                for (let seriesIndex = 0; seriesIndex < seriesValues.length; seriesIndex++) {
                    let seriesValue = seriesValues[seriesIndex];
                    let seriesIdentity = getScopeIdentity(dynamicSeriesMetadata.identityFrom, seriesIndex, seriesValue, dynamicSeriesMetadata.column.type);

                    for (let measure of measures) {
                        let column = _.clone(measure);
                        column.groupName = <string>seriesValue;
                        groups.push(column);

                        pushIfNotExists(metadataColumns, column);
                        categorical.values.push({
                            source: column,
                            values: [],
                            identity: seriesIdentity,
                        });
                    }
                }
            }
            else {
                // Static series / no series
                categorical.values = DataViewTransform.createValueColumns();
                groups = this.measureColumns;
                for (let measure of groups) {
                    let column = measure;
                    pushIfNotExists(metadataColumns, column);
                    categorical.values.push({
                        source: column,
                        values: [],
                    });
                }
            }

            let categories = this.categories;
            if (!_.isEmpty(categories))
                categorical.categories = categories;

            // --- Fill in data point values ---
            this.fillData(categorical.values, groups);

            return {
                metadata: {
                    columns: metadataColumns,
                },
                categorical: categorical,
            };
        }
    }

    function getScopeIdentity(
        source: DataViewBuilderColumnIdentitySource,
        index: number,
        value: PrimitiveValue,
        valueType: ValueType): DataViewScopeIdentity {
        let identities = source.identities;
        if (identities) {
            return identities[index];
        }

        debug.assert(source.fields && source.fields.length === 1, 'Inferring identity, expect exactly one field.');

        return createDataViewScopeIdentity(
            SQExprBuilder.equal(
                source.fields[0],
                SQExprBuilder.typedConstant(value, valueType)));
    }

    function pushIfNotExists(items: DataViewMetadataColumn[], itemToAdd: DataViewMetadataColumn): void {
        if (_.contains(items, itemToAdd))
            return;

        items.push(itemToAdd);
    }

    function applySeriesData(target: DataViewValueColumn, source: DataViewBuilderSeriesData, categoryLength: number): void {
        debug.assertValue(target, 'target');
        debug.assertValue(source, 'source');
        debug.assertValue(categoryLength, 'categoryLength');

        let values = source.values;
        debug.assert(categoryLength === values.length, 'categoryLength === values.length');

        target.values = values;

        let highlights = source.highlights;
        if (highlights) {
            debug.assert(categoryLength === highlights.length, 'categoryLength === highlights.length');

            target.highlights = highlights;
        }

        if (source.minLocal !== undefined)
            target.minLocal = source.minLocal;

        if (source.maxLocal !== undefined)
            target.maxLocal = source.maxLocal;
    }
}