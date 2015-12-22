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

module powerbi {
    import ArrayNamedItems = jsCommon.ArrayNamedItems;
    import StringExtensions = jsCommon.StringExtensions;
    import FederatedConceptualSchema = powerbi.data.FederatedConceptualSchema;
    import DefaultSQExprVisitor = powerbi.data.DefaultSQExprVisitor;
    import SQEntityExpr = powerbi.data.SQEntityExpr;
    import SQExprConverter = powerbi.data.SQExprConverter;
    import SQAggregationExpr = powerbi.data.SQAggregationExpr;
    import SQColumnRefExpr = powerbi.data.SQColumnRefExpr;
    import SQMeasureRefExpr = powerbi.data.SQMeasureRefExpr;
    import SQPropRefExpr = powerbi.data.SQPropRefExpr;
    import SQHierarchyLevelExpr = powerbi.data.SQHierarchyLevelExpr;
    import SQHierarchyExpr = powerbi.data.SQHierarchyExpr;
    import FieldExprPattern = powerbi.data.FieldExprPattern;
    import QueryProjectionsByRole = data.QueryProjectionsByRole;

    export interface ScriptResult {
        source: string;
        provider: string;
    }

    export module ScriptResultUtil {

        export function findScriptResult(dataViewMappings: DataViewMapping[]| data.CompiledDataViewMapping[]): DataViewScriptResultMapping | data.CompiledDataViewScriptResultMapping {
            if (dataViewMappings && dataViewMappings.length === 1) {
                return dataViewMappings[0].scriptResult;
            }

            return undefined;
        }

        export function extractScriptResult(dataViewMappings: data.CompiledDataViewMapping[]): ScriptResult {
            let scriptResult = findScriptResult(dataViewMappings);
            if (scriptResult) {
                let objects = dataViewMappings[0].metadata.objects;
                let source: string = DataViewObjects.getValue<string>(objects, scriptResult.script.source);
                let provider: string = DataViewObjects.getValue<string>(objects, scriptResult.script.provider);
                return {
                    source: source,
                    provider: provider
                };
            }

            return undefined;
        }

        export function extractScriptResultFromVisualConfig(dataViewMappings: DataViewMapping[], objects: powerbi.data.DataViewObjectDefinitions): ScriptResult {
            let scriptResult = findScriptResult(dataViewMappings);
            if (scriptResult && objects) {
                let scriptSource= <data.SQConstantExpr>data.DataViewObjectDefinitions.getValue(objects, scriptResult.script.source, null);
                let provider = <data.SQConstantExpr>data.DataViewObjectDefinitions.getValue(objects, scriptResult.script.provider, null);
                return {
                    source: scriptSource ? scriptSource.value : null,
                    provider: provider ? provider.value : null
                };
            }

            return undefined;
        }

        export function getScriptInput(projections: QueryProjectionsByRole, selects: ArrayNamedItems<data.NamedSQExpr>, schema: FederatedConceptualSchema): data.ScriptInput {
            let scriptInput: data.ScriptInput = {
                VariableName: "dataset",
                Columns: []
            };

            // Go over all the projections, and create an input column according to the order
            // of the projections (including duplicate expressions)
            if (projections && selects && !_.isEmpty(selects)) {
                let scriptInputColumnNames: string[] = [];
                let scriptInputColumns: data.ScriptInputColumn[] = [];
                for (let role in projections) {
                    for (let projection of projections[role].all()) {
                        let select = selects.withName(projection.queryRef);
                        if (select) {
                            let scriptInputColumn = <data.ScriptInputColumn>{
                                QueryName: select.name,
                                Name: select.expr.accept(new ScriptInputColumnNameVisitor(schema))
                            };

                            scriptInputColumns.push(scriptInputColumn);
                            scriptInputColumnNames.push(scriptInputColumn.Name);
                        }
                    }
                }

                // Make sure the names of the columns are unique
                scriptInputColumnNames = StringExtensions.ensureUniqueNames(scriptInputColumnNames);

                // Update the names of the columns
                for (let i = 0; i < scriptInputColumnNames.length; i++) {
                    let scriptInputColumn = scriptInputColumns[i];
                    scriptInputColumn.Name = scriptInputColumnNames[i];
                }

                scriptInput.Columns = scriptInputColumns;
            }

            return scriptInput;
        }

        class ScriptInputColumnNameVisitor extends DefaultSQExprVisitor<string>
        {
            private federatedSchema: FederatedConceptualSchema;

            constructor(federatedSchema: FederatedConceptualSchema) {
                super();
                this.federatedSchema = federatedSchema;
            }

            public visitEntity(expr: SQEntityExpr): string {
                return expr.entity;
            }

            public visitColumnRef(expr: SQColumnRefExpr): string {
                return ScriptInputColumnNameVisitor.getNameForProperty(expr, this.federatedSchema);
            }

            public visitMeasureRef(expr: SQMeasureRefExpr): string {
                return ScriptInputColumnNameVisitor.getNameForProperty(expr, this.federatedSchema);
            }

            public visitAggr(expr: SQAggregationExpr): string {
                return ScriptInputColumnNameVisitor.getNameForAggregate(expr, this.federatedSchema);
            }

            public visitHierarchy(expr: SQHierarchyExpr): string {
                return ScriptInputColumnNameVisitor.getNameForHierarchy(expr, this.federatedSchema);
            }

            public visitHierarchyLevel(expr: SQHierarchyLevelExpr): string {
                return ScriptInputColumnNameVisitor.getNameForHierarchyLevel(expr, this.federatedSchema);
            }

            public static getNameForProperty(expr: SQPropRefExpr, federatedSchema: FederatedConceptualSchema): string {
                debug.assertValue(expr, 'expr');

                let fieldExpr = SQExprConverter.asFieldPattern(expr);
                let fieldExprItem = fieldExpr.column || fieldExpr.measure;

                let schema = federatedSchema.schema(fieldExprItem.schema),
                    property = schema.findProperty(fieldExprItem.entity, fieldExprItem.name);

                if (property)
                    return property.name;
            }

            public static getNameForAggregate(expr: SQAggregationExpr, federatedSchema: FederatedConceptualSchema): string {
                debug.assertValue(expr, 'expr');

                let field = SQExprConverter.asFieldPattern(expr);
                let fieldAggregate = field.columnAggr || field.entityAggr;
                let entity = federatedSchema
                    .schema(fieldAggregate.schema)
                    .entities
                    .withName(fieldAggregate.entity);

                if (!entity)
                    return;

                let backingProperty = entity.properties.withName(FieldExprPattern.getFieldExprName(field));

                return backingProperty.name;
            }

            public static getNameForHierarchy(expr: SQHierarchyExpr, federatedScheam: FederatedConceptualSchema): string {
                let fieldExpr = SQExprConverter.asFieldPattern(expr);
                let fieldExprItem = fieldExpr.hierarchy;

                if (fieldExprItem) {
                    let schema = federatedScheam.schema(fieldExprItem.schema),
                        hierarchy = schema.findHierarchy(fieldExprItem.entity, fieldExprItem.name);

                    if (hierarchy)
                        return hierarchy.name;
                }
            }

            public static getNameForHierarchyLevel(expr: SQHierarchyLevelExpr, federatedScheam: FederatedConceptualSchema): string {
                debug.assertValue(expr, 'expr');

                let field = SQExprConverter.asFieldPattern(expr);
                if (field.columnHierarchyLevelVariation) {
                    return ScriptInputColumnNameVisitor.getVariationLevelName(expr, federatedScheam);
                }

                /*Hierarchies are not supported yet*/
            }

            private static getVariationLevelName(expr: SQHierarchyLevelExpr, federatedSchema: FederatedConceptualSchema): string {
                debug.assertValue(expr, 'expr');

                let field = SQExprConverter.asFieldPattern(expr);
                let fieldEntity = FieldExprPattern.toFieldExprEntityItemPattern(field);

                if (field.columnHierarchyLevelVariation) {
                    let prop = federatedSchema.schema(fieldEntity.schema).findProperty(fieldEntity.entity, field.columnHierarchyLevelVariation.source.name);
                    if (!prop)
                        return;

                    let variations = prop.column.variations;
                    for (let variation of variations)
                        if (variation.name === field.columnHierarchyLevelVariation.variationName)
                            for (let level of variation.defaultHierarchy.levels)
                                if (level.name === field.columnHierarchyLevelVariation.level.level)
                                    return level.column.name;
                }
            }
        }
    }
}