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

/// <reference path="../../../_references.ts"/>

module powerbi.visuals.controls {
    export module HTMLElementUtils {
        export function clearChildren(element: HTMLElement): void {
            if (!element) {
                return;
            }

            while (element.hasChildNodes()) {
                element.removeChild(element.firstChild);
            }
        }

        export function setElementTop(element: HTMLElement, top: number): void {
            element.style.top = top + "px";
        }

        export function setElementLeft(element: HTMLElement, left: number): void {
            element.style.left = left + "px";
        }

        export function setElementHeight(element: HTMLElement, height: number): void {
            if (HTMLElementUtils.isAutoSize(height))
                element.style.height = "auto";
            else
                element.style.height = height + "px";
        }

        export function setElementWidth(element: HTMLElement, width: number): void {
            if (HTMLElementUtils.isAutoSize(width))
                element.style.width = "auto";
            else
                element.style.width = width + "px";
        }

        export function getElementWidth(element: HTMLElement): number {
            return element.offsetWidth;
        }

        export function getElementHeight(element: HTMLElement): number {
            return element.offsetHeight;
        }

        export function isAutoSize(size: number): boolean {
            return size === -1;
        }

        export function getAccumulatedScale(element: HTMLElement): number {
            let scale: number = 1;
            while (element) {
                scale *= HTMLElementUtils.getScale(element);
                element = element.parentElement;
            }

            return scale;
        }
        
        /**
         * Get scale of element, return 1 when not scaled.
         */
        export function getScale(element: any): number {
            element = $(element);

            let str = element.css('-webkit-transform') ||
                element.css('-moz-transform') ||
                element.css('-ms-transform') ||
                element.css('-o-transform') ||
                element.css('transform');

            return (str && (
                str.match(/\d*\.\d*/) && Number(str.match(/\d*\.\d*/)[0]) ||
                str.match(/\d+/) && Number(str.match(/\d+/)[0]))
                ) || 1;
        }
    }
}

module powerbi.visuals.controls.internal {
    import DomFactory = InJs.DomFactory;

    export module TablixUtils {
        export const TablixFormatStringProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'formatString' };
        export const TableTotalsProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'totals' };
        export const TablixColumnAutoSizeProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'autoSizeColumnWidth' };
        export const TablixTextSizeProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'textSize' };
        export const MatrixRowSubtotalsProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'rowSubtotals' };
        export const MatrixColumnSubtotalsProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'columnSubtotals' };
        export const TablixOutlineColorProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'outlineColor' };
        export const TablixOutlineWeightProp: DataViewObjectPropertyIdentifier = { objectName: 'general', propertyName: 'outlineWeight' };

        export const ColumnSeparatorColorProp: DataViewObjectPropertyIdentifier = { objectName: 'columns', propertyName: 'separatorColor' };
        export const ColumnSeparatorShowProp: DataViewObjectPropertyIdentifier = { objectName: 'columns', propertyName: 'showSeparators' };
        export const ColumnSeparatorWeightProp: DataViewObjectPropertyIdentifier = { objectName: 'columns', propertyName: 'columnSeparatorWeight' };

        export const ColumnHeaderFontColorProp: DataViewObjectPropertyIdentifier = { objectName: 'header', propertyName: 'fontColor' };
        export const ColumnHeaderBackgroundColorProp: DataViewObjectPropertyIdentifier = { objectName: 'header', propertyName: 'backgroundColor' };
        export const ColumnHeaderOutlineProp: DataViewObjectPropertyIdentifier = { objectName: 'header', propertyName: 'outline' };

        export const RowSeparatorProp: DataViewObjectPropertyIdentifier = { objectName: 'rows', propertyName: 'showSeparators' };
        export const RowHeaderFontColorProp: DataViewObjectPropertyIdentifier = { objectName: 'rows', propertyName: 'fontColor' };
        export const RowHeaderBackgroundColorProp: DataViewObjectPropertyIdentifier = { objectName: 'rows', propertyName: 'backgroundColor' };
        export const RowHeaderOutlineStyleProp: DataViewObjectPropertyIdentifier = { objectName: 'rows', propertyName: 'outline' };

        export const ValuesFontColorProp: DataViewObjectPropertyIdentifier = { objectName: 'values', propertyName: 'fontColor' };
        export const ValuesBackgroundColorProp: DataViewObjectPropertyIdentifier = { objectName: 'values', propertyName: 'backgroundColor' };
        export const ValuesOutlineProp: DataViewObjectPropertyIdentifier = { objectName: 'values', propertyName: 'outline' };

        export const RowTotalsFontColorProp: DataViewObjectPropertyIdentifier = { objectName: 'totals', propertyName: 'fontColor' };
        export const RowTotalsBackgroundColor: DataViewObjectPropertyIdentifier = { objectName: 'totals', propertyName: 'backgroundColor' };
        export const RowTotalsOutlineProp: DataViewObjectPropertyIdentifier = { objectName: 'totals', propertyName: 'outline' };
        export const RowTotalsLeadingSpaceProp: DataViewObjectPropertyIdentifier = { objectName: 'totals', propertyName: 'leadingSpace' };

        export const DefaultColumnSeparatorShow: boolean = false;
        export const DefaultColumnSeparatorColor: string = "#E8E8E8";
        export const DefaultColumnSeparatorWeight: number = 1;
        export const DefaultRowSeparatorWeight: number = 1;
        export const DefaultRowSeparatorColor: string = "#E8E8E8";
        export const DefaultRowSeparatorShow: boolean = false;
        export const DefaultBackgroundColor: string = "#FFFFFF";
        export const DefaultFontColor: string = "#333333";
        export const DefaultOutlineColor: string = "#E8E8E8";
        export const DefaultOutlineWeight: number = 2;
        export const DefaultOutlineColumnHeader: string = "BottomOnly";
        export const DefaultOutlineRowHeader: string = "None";
        export const DefaultOutlineValues: string = "LeftOnly";
        export const DefaultOutlineRowTotals: string = "TopOnly";
        export const DefaultRowLeadingSpace: number = 0;
        export const UnitOfMeasurement: string = 'px';
        export const DefaultColumnSeparatorStyle: string = "solid";
        export const DefaultRowSeparatorStyle: string = 'solid';
        export const TableShowTotals: boolean = true;

        export function createTable(): HTMLTableElement {
            return <HTMLTableElement>document.createElement("table");
        }

        export function createDiv(): HTMLDivElement {
            let div: HTMLDivElement = <HTMLDivElement>document.createElement("div");

            // TODO: Fold these into CSS as well combined with the styling done for the different scenarios where div are used.
            let divStyle = div.style;
            divStyle.whiteSpace = "nowrap";
            divStyle.overflow = "hidden";
            divStyle.lineHeight = "normal";

            return div;
        }

        export function appendATagToBodyCell(value: string, cell: controls.ITablixCell): void {
            let element = <HTMLElement>cell.extension.contentHost;
            let atag: HTMLAnchorElement = null;
            if (element.childElementCount === 0) {
                atag = document.createElement('a');
                element.appendChild(atag);
            } else {
                atag = <HTMLAnchorElement>element.children[0];
            }

            atag.href = value;
            atag.target = '_blank';
            atag.title = value;
            atag.innerText = value;
        }

        export function appendImgTagToBodyCell(value: string, cell: controls.ITablixCell): void {
            let element = <HTMLElement>cell.extension.contentHost;
            let contentElement = element.parentElement;
            let imgTag: HTMLImageElement;
            if (element.childElementCount === 0) {
                imgTag = document.createElement('img');
                element.appendChild(imgTag);
            } else {
                imgTag = <HTMLImageElement>element.children[0];
            }
            // set padding for contentElement
            contentElement.style.paddingBottom = '3px';
            contentElement.style.paddingTop = '3px';
            imgTag.src = value;
            imgTag.style.maxHeight = '75px';
            imgTag.style.maxWidth = '100px';
            imgTag.style.height = '100%';
        }

        export function createKpiDom(kpi: DataViewKpiColumnMetadata, kpiValue: string): JQuery {
            debug.assertValue(kpi, 'kpi');
            debug.assertValue(kpiValue, 'kpiValue');
            let className: string = KpiUtil.getClassForKpi(kpi, kpiValue) || '';
            return DomFactory.div()
                .addClass(className)
                .css({
                    'display': 'inline-block',
                    'vertical-align': 'bottom',
                    'margin': '0 1px 1px 0',
                });
        }

        export function appendSortImageToColumnHeader(item: DataViewMetadataColumn, cell: controls.ITablixCell): void {
            if (item.sort) {
                let itemSort = item.sort;
                createSortImageHTML(itemSort, cell, true);
                createSortImageHTML(reverseSort(itemSort), cell, false);
            }
            else {
                createSortImageHTML(SortDirection.Descending, cell, false);
            }
        }

        function createSortImageHTML(sort: SortDirection, cell: controls.ITablixCell, isSorted: boolean): void {
            let imgSortContainer: HTMLDivElement = TablixUtils.createDiv();
            let imgSort: HTMLPhraseElement = <HTMLPhraseElement>document.createElement('i');
            imgSort.className = (sort === SortDirection.Ascending) ? "powervisuals-glyph caret-up" : "powervisuals-glyph caret-down";
            imgSortContainer.className = TableBinder.sortIconContainerClassName + " " + (isSorted ? "sorted" : "future");
            imgSortContainer.appendChild(imgSort);
            cell.extension.contentElement.insertBefore(imgSortContainer, cell.extension.contentHost);
        }

        export function isValidStatusGraphic(kpi: DataViewKpiColumnMetadata, kpiValue: string): boolean {
            if (!kpi || kpiValue === undefined) {
                return false;
            }

            return !!KpiUtil.getClassForKpi(kpi, kpiValue);
        }

        export function setEnumeration(options: EnumerateVisualObjectInstancesOptions, enumeration: ObjectEnumerationBuilder, dataView: DataView, isFormattingPropertiesEnabled: boolean, tablixType: TablixType): void {
            // Visuals are initialized with an empty data view before queries are run, therefore we need to make sure that
            // we are resilient here when we do not have data view.
            let tablixFormattingProperties = dataView.metadata.objects;

            switch (options.objectName) {
                case 'general':
                    TablixUtils.enumerateGeneralOptions(enumeration, tablixFormattingProperties, isFormattingPropertiesEnabled, tablixType);
                    break;
                case 'columns':
                    if (isFormattingPropertiesEnabled)
                        TablixUtils.enumerateColumnsOptions(enumeration, tablixFormattingProperties);
                    break;
                case 'header':
                    if (isFormattingPropertiesEnabled)
                        TablixUtils.enumerateHeaderOptions(enumeration, tablixFormattingProperties);
                    break;
                case 'rows':
                    if (isFormattingPropertiesEnabled)
                        TablixUtils.enumerateRowsOptions(enumeration, tablixFormattingProperties);
                    break;
                case 'values':
                    if (isFormattingPropertiesEnabled)
                        TablixUtils.enumerateValuesOptions(enumeration, tablixFormattingProperties);
                    break;
                case 'totals':
                    if (isFormattingPropertiesEnabled)
                        TablixUtils.enumerateTotalsOptions(enumeration, tablixFormattingProperties);
                    break;
            }
        }

        export function enumerateGeneralOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects, isFormattingPropertiesEnabled: boolean, tablixType: TablixType): void {
            if (this.isFormattingPropertiesEnabled) {
                switch (tablixType) {
                    case TablixType.Table:
                        enumeration.pushInstance({
                            selector: null,
                            objectName: 'general',
                            properties: {
                                totals: TablixUtils.shouldShowTableTotals(objects),
                                autoSizeColumnWidth: TablixUtils.shouldAutoSizeColumnWidth(objects),
                                textSize: TablixUtils.getTextSize(objects),
                                outlineColor: TablixUtils.getTablixOutlineColor(objects),
                                outlineWeight: TablixUtils.getTablixOutlineWeight(objects)
                            }
                        });
                        break;
                    case TablixType.Matrix:
                        enumeration.pushInstance({
                            selector: null,
                            objectName: 'general',
                            properties: {
                                autoSizeColumnWidth: TablixUtils.shouldAutoSizeColumnWidth(objects),
                                textSize: TablixUtils.getTextSize(objects),
                                rowSubtotals: TablixUtils.shouldShowRowSubtotals(objects),
                                columnSubtotals: TablixUtils.shouldShowColumnSubtotals(objects),
                                outlineColor: TablixUtils.getTablixOutlineColor(objects),
                                outlineWeight: TablixUtils.getTablixOutlineWeight(objects)
                            }
                        });
                        break;
                }
            }

            else {
                switch (tablixType) {
                    case TablixType.Table:
                        enumeration.pushInstance({
                            selector: null,
                            objectName: 'general',
                            properties: {
                                totals: TablixUtils.shouldShowTableTotals(objects),
                                autoSizeColumnWidth: TablixUtils.shouldAutoSizeColumnWidth(objects),
                                textSize: TablixUtils.getTextSize(objects)
                            }
                        });
                        break;

                    case TablixType.Matrix:
                    case TablixType.Table:
                        enumeration.pushInstance({
                            selector: null,
                            objectName: 'general',
                            properties: {
                                autoSizeColumnWidth: TablixUtils.shouldAutoSizeColumnWidth(objects),
                                textSize: TablixUtils.getTextSize(objects),
                                rowSubtotals: TablixUtils.shouldShowRowSubtotals(objects),
                                columnSubtotals: TablixUtils.shouldShowColumnSubtotals(objects)
                            }
                        });
                        break;
                }
            }
        }

        export function enumerateColumnsOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            let showSeparators = TablixUtils.getColumnSeparatorShow(objects);

            enumeration.pushInstance({
                selector: null,
                objectName: 'columns',
                properties: {
                    showSeparators: showSeparators,
                    separatorColor: showSeparators ? TablixUtils.getColumnSeparatorColor(objects) : TablixUtils.DefaultColumnSeparatorColor,
                    columnSeparatorWeight: showSeparators ? TablixUtils.getColumnSeparatorWeight(objects) : TablixUtils.DefaultColumnSeparatorWeight
                }
            });
        }

        export function enumerateHeaderOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                selector: null,
                objectName: 'header',
                properties: {
                    fontColor: TablixUtils.getColumnHeaderFontColor(objects),
                    backgroundColor: TablixUtils.getColumnHeaderBackgroundColor(objects),
                    outline: TablixUtils.getColumnHeaderOutlineType(objects),
                }
            });
        }

        export function enumerateRowsOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                selector: null,
                objectName: 'rows',
                properties: {
                    showSeparators: TablixUtils.getRowSeparatorShow(objects),
                    fontColor: TablixUtils.getRowHeaderFontColor(objects),
                    backgroundColor: TablixUtils.getRowHeaderBackgroundColor(objects),
                    outline: TablixUtils.getRowHeaderOutlineStyle(objects),
                }
            });
        }

        export function enumerateValuesOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                selector: null,
                objectName: 'values',
                properties: {
                    fontColor: TablixUtils.getValuesFontColor(objects),
                    backgroundColor: TablixUtils.getValuesBackgroundColor(objects),
                    outline: TablixUtils.getValuesOutlineType(objects),
                }
            });
        }

        export function enumerateTotalsOptions(enumeration: ObjectEnumerationBuilder, objects: DataViewObjects): void {
            enumeration.pushInstance({
                selector: null,
                objectName: 'totals',
                properties: {
                    fontColor: TablixUtils.getRowTotalsFontColor(objects),
                    backgroundColor: TablixUtils.getRowTotalsBackgroundColor(objects),
                    outline: TablixUtils.getRowTotalsOutlineType(objects),
                    leadingSpace: TablixUtils.getRowTotalsLeadingSpace(objects)
                }
            });
        }

        export function getTableFormattingProperties(dataView: DataView): TablixFormattingPropertiesTable {
            let formattingProperties: TablixFormattingPropertiesTable;

            if (dataView && dataView.metadata && dataView.metadata.objects) {
                let tablixFormattingProperties: DataViewObjects = dataView.metadata.objects;

                formattingProperties = {
                    general:
                    {
                        autoSizeColumnWidth: TablixUtils.shouldAutoSizeColumnWidth(tablixFormattingProperties),
                        textSize: TablixUtils.getTextSize(tablixFormattingProperties),
                        totals: TablixUtils.shouldShowTableTotals(tablixFormattingProperties),
                        outlineColor: TablixUtils.getTablixOutlineColor(tablixFormattingProperties),
                        outlineWeight: TablixUtils.getTablixOutlineWeight(tablixFormattingProperties)
                    },
                    columns:
                    {
                        showSeparators: TablixUtils.getColumnSeparatorShow(tablixFormattingProperties),
                        separatorColor: TablixUtils.getColumnSeparatorColor(tablixFormattingProperties),
                        separatorWeight: TablixUtils.getColumnSeparatorWeight(tablixFormattingProperties)
                    },
                    header:
                    {
                        fontColor: TablixUtils.getColumnHeaderFontColor(tablixFormattingProperties),
                        backgroundColor: TablixUtils.getColumnHeaderBackgroundColor(tablixFormattingProperties),
                        outline: TablixUtils.getColumnHeaderOutlineType(tablixFormattingProperties)
                    },
                    rows:
                    {
                        showSeparators: TablixUtils.getRowSeparatorShow(tablixFormattingProperties),
                        fontColor: TablixUtils.getRowHeaderFontColor(tablixFormattingProperties),
                        backgroundColor: TablixUtils.getRowHeaderBackgroundColor(tablixFormattingProperties),
                        outline: TablixUtils.getRowHeaderOutlineStyle(tablixFormattingProperties)
                    },
                    totals:
                    {
                        fontColor: TablixUtils.getRowTotalsFontColor(tablixFormattingProperties),
                        backgroundColor: TablixUtils.getRowTotalsBackgroundColor(tablixFormattingProperties),
                        outline: TablixUtils.getRowTotalsOutlineType(tablixFormattingProperties),
                        leadingSpace: TablixUtils.getRowTotalsLeadingSpace(tablixFormattingProperties)
                    }
                };
            }

            return formattingProperties;
        }

        export function getMatrixFormattingProperties(dataView: DataView): TablixFormattingPropertiesMatrix {
            let formattingProperties: TablixFormattingPropertiesMatrix;

            if (dataView && dataView.metadata && dataView.metadata.objects) {
                let tablixFormattingProperties: DataViewObjects = dataView.metadata.objects;

                formattingProperties = {
                    general:
                    {
                        autoSizeColumnWidth: TablixUtils.shouldAutoSizeColumnWidth(tablixFormattingProperties),
                        textSize: TablixUtils.getTextSize(tablixFormattingProperties),
                        rowSubtotals: TablixUtils.shouldShowRowSubtotals(tablixFormattingProperties),
                        columnSubtotals: TablixUtils.shouldShowColumnSubtotals(tablixFormattingProperties),
                        outlineColor: TablixUtils.getTablixOutlineColor(tablixFormattingProperties),
                        outlineWeight: TablixUtils.getTablixOutlineWeight(tablixFormattingProperties)
                    },
                    columns:
                    {
                        showSeparators: TablixUtils.getColumnSeparatorShow(tablixFormattingProperties),
                        separatorColor: TablixUtils.getColumnSeparatorColor(tablixFormattingProperties),
                        separatorWeight: TablixUtils.getColumnSeparatorWeight(tablixFormattingProperties)
                    },
                    header:
                    {
                        fontColor: TablixUtils.getColumnHeaderFontColor(tablixFormattingProperties),
                        backgroundColor: TablixUtils.getColumnHeaderBackgroundColor(tablixFormattingProperties),
                        outline: TablixUtils.getColumnHeaderOutlineType(tablixFormattingProperties)
                    },
                    rows:
                    {
                        showSeparators: TablixUtils.getRowSeparatorShow(tablixFormattingProperties),
                        fontColor: TablixUtils.getRowHeaderFontColor(tablixFormattingProperties),
                        backgroundColor: TablixUtils.getRowHeaderBackgroundColor(tablixFormattingProperties),
                        outline: TablixUtils.getRowHeaderOutlineStyle(tablixFormattingProperties)
                    },
                    values:
                    {
                        fontColor: TablixUtils.getValuesFontColor(tablixFormattingProperties),
                        backgroundColor: TablixUtils.getValuesBackgroundColor(tablixFormattingProperties),
                        outline: TablixUtils.getValuesOutlineType(tablixFormattingProperties)
                    },
                    totals:
                    {
                        fontColor: TablixUtils.getRowTotalsFontColor(tablixFormattingProperties),
                        backgroundColor: TablixUtils.getRowTotalsBackgroundColor(tablixFormattingProperties),
                        outline: TablixUtils.getRowTotalsOutlineType(tablixFormattingProperties),
                        leadingSpace: TablixUtils.getRowTotalsLeadingSpace(tablixFormattingProperties)
                    }
                };
            }

            return formattingProperties;
        }

        export function shouldShowTableTotals(objects: DataViewObjects): boolean {
            return DataViewObjects.getValue<boolean>(objects, TablixUtils.TableTotalsProp, TablixUtils.TableShowTotals);
        }

        export function shouldAutoSizeColumnWidth(objects: DataViewObjects): boolean {
            return DataViewObjects.getValue<boolean>(objects, TablixUtils.TablixColumnAutoSizeProp, controls.AutoSizeColumnWidthDefault);
        }

        export function getTextSize(objects: DataViewObjects): number {
            // By default, let tablixControl set default font size
            return DataViewObjects.getValue<number>(objects, TablixUtils.TablixTextSizeProp, controls.TablixDefaultTextSize);
        }

        export function getTextSizeInPx(textSize: number): string {
            return jsCommon.PixelConverter.fromPoint(textSize);
        }

        export function shouldShowRowSubtotals(objects: TablixFormattingPropertiesMatrix): boolean {
            if (objects && objects.general)
                return objects.general.rowSubtotals !== false;

            // By default, totals are enabled
            return true;
        }

        export function shouldShowColumnSubtotals(objects: TablixFormattingPropertiesMatrix): boolean {
            if (objects && objects.general)
                return objects.general.columnSubtotals !== false;

            // By default, totals are enabled
            return true;
        }

        export function getColumnSeparatorColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.ColumnSeparatorColorProp, TablixUtils.DefaultColumnSeparatorColor);
        }

        export function getColumnSeparatorWeight(objects: DataViewObjects): number {
            return DataViewObjects.getValue<number>(objects, TablixUtils.ColumnSeparatorWeightProp, TablixUtils.DefaultColumnSeparatorWeight);
        }

        export function getTablixOutlineColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.TablixOutlineColorProp, TablixUtils.DefaultOutlineColor);
        }

        export function getTablixOutlineWeight(objects: DataViewObjects): number {
            return DataViewObjects.getValue<number>(objects, TablixUtils.TablixOutlineWeightProp, TablixUtils.DefaultOutlineWeight);
        }

        export function getColumnSeparatorShow(objects: DataViewObjects): boolean {
            return DataViewObjects.getValue<boolean>(objects, TablixUtils.ColumnSeparatorShowProp, TablixUtils.DefaultColumnSeparatorShow);
        }

        export function getColumnHeaderFontColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.ColumnHeaderFontColorProp, TablixUtils.DefaultFontColor);
        }

        export function getColumnHeaderBackgroundColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.ColumnHeaderBackgroundColorProp, TablixUtils.DefaultBackgroundColor);
        }

        export function getColumnHeaderOutlineType(objects: DataViewObjects): string {
            return DataViewObjects.getValue<string>(objects, TablixUtils.ColumnHeaderOutlineProp, TablixUtils.DefaultOutlineColumnHeader);
        }

        export function getRowSeparatorShow(objects: DataViewObjects): boolean {
            return DataViewObjects.getValue<boolean>(objects, TablixUtils.RowSeparatorProp, TablixUtils.DefaultRowSeparatorShow);
        }

        export function getRowHeaderFontColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.RowHeaderFontColorProp, TablixUtils.DefaultFontColor);
        }
        export function getRowHeaderBackgroundColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.RowHeaderBackgroundColorProp, TablixUtils.DefaultBackgroundColor);
        }

        export function getRowHeaderOutlineStyle(objects: DataViewObjects): string {
            return DataViewObjects.getValue<string>(objects, TablixUtils.RowHeaderOutlineStyleProp, TablixUtils.DefaultOutlineRowHeader);
        }

        export function getValuesFontColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.ValuesFontColorProp, TablixUtils.DefaultFontColor);
        }

        export function getValuesBackgroundColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.ValuesBackgroundColorProp, TablixUtils.DefaultBackgroundColor);
        }

        export function getValuesOutlineType(objects: DataViewObjects): string {
            return DataViewObjects.getValue<string>(objects, TablixUtils.ValuesOutlineProp, TablixUtils.DefaultOutlineValues);
        }

        export function getRowTotalsFontColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.RowTotalsFontColorProp, TablixUtils.DefaultFontColor);
        }

        export function getRowTotalsBackgroundColor(objects: DataViewObjects): string {
            return DataViewObjects.getFillColor(objects, TablixUtils.RowTotalsBackgroundColor, TablixUtils.DefaultBackgroundColor);
        }

        export function getRowTotalsOutlineType(objects: DataViewObjects): string {
            return DataViewObjects.getValue<string>(objects, TablixUtils.RowTotalsOutlineProp, TablixUtils.DefaultOutlineRowTotals);
        }

        export function getRowTotalsLeadingSpace(objects: DataViewObjects): number {
            return DataViewObjects.getValue<number>(objects, TablixUtils.RowTotalsLeadingSpaceProp, TablixUtils.DefaultRowLeadingSpace);
        }

        export function reverseSort(sortDirection: SortDirection): SortDirection {
            return sortDirection === SortDirection.Descending ? SortDirection.Ascending : SortDirection.Descending;
        }

        function checkSortIconExists(cell: controls.ITablixCell): boolean {
            for (let element of cell.extension.contentElement.children) {
                if (element.className.indexOf(TableBinder.sortIconContainerClassName) > -1)
                    return true;
            }
            return false;
        }

        export function removeSortIcons(cell: controls.ITablixCell): void {
            if (!checkSortIconExists(cell))
                return;
            $((<HTMLElement>cell.extension.contentElement)).find('.' + TableBinder.sortIconContainerClassName).remove();
        }
    }
}