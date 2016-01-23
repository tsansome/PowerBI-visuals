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

/// <reference path="../_references.ts"/>

module powerbi.data {
    import StringExtensions = jsCommon.StringExtensions;

    export module SQExprUtils {
        /** Returns an array of supported aggregates for a given expr and role. */
        export function getSupportedAggregates(
            expr: SQExpr,
            schema: FederatedConceptualSchema): QueryAggregateFunction[] {
            let emptyList: QueryAggregateFunction[] = [];

            let metadata = getMetadataForUnderlyingType(expr, schema);

            // don't use expr.validate as validate will be using this function and we end up in a recursive loop
            if (!metadata)
                return emptyList;

            let valueType = metadata.type,
                fieldKind = metadata.kind,
                isPropertyIdentity = metadata.idOnEntityKey,
                Agg = QueryAggregateFunction; // alias

            if (!valueType)
                return emptyList;

            // Cannot aggregate on model measures
            if (fieldKind === FieldKind.Measure)
                return emptyList;

            if (valueType.numeric || valueType.integer) {
                let aggregates = [Agg.Sum, Agg.Avg, Agg.Min, Agg.Max, Agg.Count, Agg.CountNonNull, Agg.StandardDeviation, Agg.Variance];
                let fieldExpr = SQExprConverter.asFieldPattern(expr);
                let fieldExprItem = FieldExprPattern.toFieldExprEntityItemPattern(fieldExpr);

                let currentSchema = schema.schema(fieldExprItem.schema);
                if (currentSchema.capabilities.supportsMedian)
                    aggregates.push(Agg.Median);
                return aggregates;
            } else if (valueType.text || valueType.bool || valueType.dateTime) {
                if (isPropertyIdentity)
                    return [Agg.CountNonNull];
                return [Agg.Count, Agg.CountNonNull];
            }

            debug.assertFail("Unexpected expr or role.");
            return emptyList;
        }

        export function isSupportedAggregate(
            expr: SQExpr,
            schema: FederatedConceptualSchema,
            aggregate: QueryAggregateFunction): boolean {
            let supportedAggregates = getSupportedAggregates(expr, schema);
            return _.contains(supportedAggregates, aggregate);
        }

        export function indexOfExpr(items: SQExpr[], searchElement: SQExpr): number {
            debug.assertValue(items, 'items');
            debug.assertValue(searchElement, 'searchElement');

            for (let i = 0, len = items.length; i < len; i++) {
                if (SQExpr.equals(items[i], searchElement))
                    return i;
            }
            return -1;
        }

        export function sequenceEqual(x: SQExpr[], y: SQExpr[]): boolean {
            debug.assertValue(x, 'x');
            debug.assertValue(y, 'y');

            let len = x.length;
            if (len !== y.length)
                return false;

            for (let i = 0; i < len; i++) {
                if (!SQExpr.equals(x[i], y[i]))
                    return false;
            }

            return true;
        }

        export function uniqueName(namedItems: NamedSQExpr[], expr: SQExpr): string {
            debug.assertValue(namedItems, 'namedItems');

            // Determine all names
            let names: { [name: string]: boolean } = {};
            for (let i = 0, len = namedItems.length; i < len; i++)
                names[namedItems[i].name] = true;

            return StringExtensions.findUniqueName(names, defaultName(expr));
        }

        /** Generates a default expression name  */
        export function defaultName(expr: SQExpr, fallback: string = 'select'): string {
            if (!expr)
                return fallback;

            return expr.accept(SQExprDefaultNameGenerator.instance, fallback);
        }

        /** Gets a value indicating whether the expr is a model measure or an aggregate. */
        export function isMeasure(expr: SQExpr): boolean {
            debug.assertValue(expr, 'expr');

            return expr.accept(IsMeasureVisitor.instance);
        }

        /** Gets a value indicating whether the expr is an AnyValue or equals comparison to AnyValue*/
        export function isAnyValue(expr: SQExpr): boolean {
            debug.assertValue(expr, 'expr');

            return expr.accept(IsAnyValueVisitor.instance);
        }

        /** Gets a value indicating whether the expr is a DefaultValue or equals comparison to DefaultValue*/
        export function isDefaultValue(expr: SQExpr): boolean {
            debug.assertValue(expr, 'expr');

            return expr.accept(IsDefaultValueVisitor.instance);
        }

        export function discourageAggregation(expr: SQExpr, schema: FederatedConceptualSchema): boolean {
            let capabilities = getSchemaCapabilities(expr, schema);
            return capabilities && capabilities.discourageQueryAggregateUsage;
        }

        export function getSchemaCapabilities(expr: SQExpr, schema: FederatedConceptualSchema): ConceptualCapabilities {
            debug.assertValue(expr, 'expr');
            debug.assertValue(schema, 'schema');

            let field = SQExprConverter.asFieldPattern(expr);
            if (!field)
                return;

            let fieldExprItem = FieldExprPattern.toFieldExprEntityItemPattern(field);
            let conceptualSchema = schema.schema(fieldExprItem.schema);
            if (conceptualSchema)
                return conceptualSchema.capabilities;
        }

        export function getKpiStatus(expr: SQExpr, schema: FederatedConceptualSchema): SQExpr {
            let kpi = getKpiStatusProperty(expr, schema);
            if (kpi) {
                let measureExpr = SQExprConverter.asFieldPattern(expr).measure;
                if (measureExpr) {
                    return SQExprBuilder.fieldExpr({
                        measure: {
                            schema: measureExpr.schema,
                            entity: measureExpr.entity,
                            name: kpi.name,
                        }
                    });
                }
            }
        }

        export function getKpiMetadata(expr: SQExpr, schema: FederatedConceptualSchema): DataViewKpiColumnMetadata {
            let property = expr.getConceptualProperty(schema);
            if (!property)
                return;

            if (property.measure && property.measure.kpi)
                return property.measure.kpi.statusMetadata;

            let kpiStatusProperty = getKpiStatusProperty(expr, schema);
            if (kpiStatusProperty)
                return kpiStatusProperty.kpi.measure.kpi.statusMetadata;
        }

        function getKpiStatusProperty(expr: SQExpr, schema: FederatedConceptualSchema): ConceptualProperty {
            let property = expr.getConceptualProperty(schema);
            if (!property)
                return;

            let kpi = property.kpi;
            if (kpi && kpi.measure.kpi.status === property)
                return property;
        }

        function getMetadataForUnderlyingType(expr: SQExpr, schema: FederatedConceptualSchema): SQExprMetadata {
            // Unwrap the aggregate (if the expr has one), and look at the underlying type.
            let metadata = SQExprBuilder.removeAggregate(expr).getMetadata(schema);

            if (!metadata)
                metadata = expr.getMetadata(schema);

            return metadata;
        }

        export function getDefaultValue(fieldSQExpr: SQExpr, schema: FederatedConceptualSchema): SQConstantExpr {
            if (!fieldSQExpr || !schema)
                return;

            let sqField = SQExprConverter.asFieldPattern(fieldSQExpr);
            let column: FieldExprPropertyPattern = sqField.column;

            if (column) {
                if (schema.schema(column.schema) && sqField.column.name) {
                    let property = schema.schema(column.schema).findProperty(column.entity, sqField.column.name);

                    if (property && property.column)
                        return property.column.defaultValue;
                }
            }
            else {
                let hierarchyLevelField: FieldExprHierarchyLevelPattern = sqField.hierarchyLevel;
                if (hierarchyLevelField) {
                    let fieldExprItem = FieldExprPattern.toFieldExprEntityItemPattern(sqField);
                    let schemaName = fieldExprItem.schema;
                    if (schema.schema(schemaName)) {
                        let hierarchy = schema.schema(schemaName)
                            .findHierarchy(fieldExprItem.entity, hierarchyLevelField.name);

                        if (hierarchy) {
                            let hierarchyLevel: ConceptualHierarchyLevel = hierarchy.levels.withName(hierarchyLevelField.level);
                            if (hierarchyLevel && hierarchyLevel.column && hierarchyLevel.column.column)
                                return hierarchyLevel.column.column.defaultValue;
                        }
                    }
                }
            }
        }

        export function getDefaultValues(fieldSQExprs: SQExpr[], schema: FederatedConceptualSchema): SQConstantExpr[] {
            if (_.isEmpty(fieldSQExprs) || !schema)
                return;
            let result: SQConstantExpr[] = [];
            for (let sqExpr of fieldSQExprs) {
                let defaultValue = getDefaultValue(sqExpr, schema);
                if (defaultValue)
                    result.push(defaultValue);
            }
            return result;
        }

        /** Return compare or and expression for key value pairs. */
        export function getDataViewScopeIdentityComparisonExpr(fieldsExpr: SQExpr[], values: SQConstantExpr[]): SQExpr {
            debug.assert(fieldsExpr.length === values.length, "fileds and values need to be the same size");

            let compareExprs: SQCompareExpr[] = [];
            for (let i = 0; i < fieldsExpr.length; i++) {
                compareExprs.push(SQExprBuilder.compare(QueryComparisonKind.Equal, fieldsExpr[i], values[i]));
            }

            if (_.isEmpty(compareExprs))
                return;

            let resultExpr: SQExpr;
            for (let compareExpr of compareExprs) {
                resultExpr = SQExprBuilder.and(resultExpr, compareExpr);
            }

            return resultExpr;
        }

        export function getActiveTablesNames(queryDefn: data.SemanticQuery): string[] {
            let tables: string[] = [];
            if (queryDefn) {
                let selectedItems = queryDefn.from();
                if (selectedItems !== undefined) {
                    for (let key of selectedItems.keys()) {
                        let entityObj = selectedItems.entity(key);
                        if (tables.indexOf(entityObj.entity) < 0)
                            tables.push(entityObj.entity);
                    }
                }
            }
            return tables;
        }

        class SQExprDefaultNameGenerator extends DefaultSQExprVisitorWithArg<string, string> {
            public static instance: SQExprDefaultNameGenerator = new SQExprDefaultNameGenerator();

            public visitEntity(expr: SQEntityExpr): string {
                return expr.entity;
            }

            public visitColumnRef(expr: SQColumnRefExpr): string {
                return expr.source.accept(this) + '.' + expr.ref;
            }

            public visitMeasureRef(expr: SQMeasureRefExpr, fallback: string): string {
                return expr.source.accept(this) + '.' + expr.ref;
            }

            public visitAggr(expr: SQAggregationExpr, fallback: string): string {
                return QueryAggregateFunction[expr.func] + '(' + expr.arg.accept(this) + ')';
            }

            public visitConstant(expr: SQConstantExpr): string {
                return 'const';
            }

            public visitDefault(expr: SQExpr, fallback: string): string {
                return fallback || 'expr';
            }
        }

        class IsMeasureVisitor extends DefaultSQExprVisitor<boolean> {
            public static instance: IsMeasureVisitor = new IsMeasureVisitor();

            public visitMeasureRef(expr: SQMeasureRefExpr): boolean {
                return true;
            }

            public visitAggr(expr: SQAggregationExpr): boolean {
                return true;
            }

            public visitDefault(expr: SQExpr): boolean {
                return false;
            }
        }

        class IsDefaultValueVisitor extends DefaultSQExprVisitor<boolean> {
            public static instance: IsDefaultValueVisitor = new IsDefaultValueVisitor();

            public visitCompare(expr: SQCompareExpr): boolean {
                if (expr.kind !== QueryComparisonKind.Equal)
                    return false;

                return expr.right.accept(this);
            }

            public visitAnd(expr: SQAndExpr): boolean {
                return expr.left.accept(this) && expr.right.accept(this);
            }

            public visitDefaultValue(expr: SQDefaultValueExpr): boolean {
                return true;
            }

            public visitDefault(expr: SQExpr): boolean {
                return false;
            }
        }

        class IsAnyValueVisitor extends DefaultSQExprVisitor<boolean> {
            public static instance: IsAnyValueVisitor = new IsAnyValueVisitor();

            public visitCompare(expr: SQCompareExpr): boolean {
                if (expr.kind !== QueryComparisonKind.Equal)
                    return false;

                return expr.right.accept(this);
            }

            public visitAnd(expr: SQAndExpr): boolean {
                return expr.left.accept(this) && expr.right.accept(this);
            }

            public visitAnyValue(expr: SQAnyValueExpr): boolean {
                return true;
            }

            public visitDefault(expr: SQExpr): boolean {
                return false;
            }
        }
    }
}