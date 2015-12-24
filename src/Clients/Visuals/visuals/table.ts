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

module powerbi.visuals {
    import TablixFormattingProperties = powerbi.visuals.controls.TablixFormattingPropertiesTable;
    import TablixUtils = controls.internal.TablixUtils;

    export interface DataViewVisualTable extends DataViewTable {
        visualRows?: DataViewVisualTableRow[];
        formattingProperties?: TablixFormattingProperties;
    }

    export interface DataViewVisualTableRow {
        index: number;
        values: any[];
    }

    export interface TableDataAdapter {
        update(table: DataViewTable): void;
    }

    export interface TableCell {
        textContent?: string;
        domContent?: JQuery;
        isMeasure: boolean;
        isTotal: boolean;
        isBottomMost: boolean;
        isLeftMost: boolean;
        showUrl: boolean;
        showImage?: boolean;
    }

    export interface TableTotal {
        totalCells: any[];
    }

    export class TableHierarchyNavigator implements controls.ITablixHierarchyNavigator, TableDataAdapter {

        private tableDataView: DataViewVisualTable;
        private formatter: ICustomValueColumnFormatter;

        constructor(tableDataView: DataViewVisualTable, formatter: ICustomValueColumnFormatter) {
            debug.assertValue(tableDataView, 'tableDataView');
            debug.assertValue(formatter, 'formatter');

            this.tableDataView = tableDataView;
            this.formatter = formatter;
        }
        
        /**
         * Returns the depth of a hierarchy.
         */
        public getDepth(hierarchy: any): number {
            return 1;
        }
        
        /**
         * Returns the leaf count of a hierarchy.
         */
        public getLeafCount(hierarchy: any): number {
            return hierarchy.length;
        }
        
        /**
         * Returns the leaf member of a hierarchy at a specified index.
         */
        public getLeafAt(hierarchy: any, index: number): any {
            return hierarchy[index];
        }
        
        /**
         * Returns the specified hierarchy member parent.
         */
        public getParent(item: any): any {
            return null;
        }
        
        /**
         * Returns the index of the hierarchy member relative to its parent.
         */
        public getIndex(item: any): number {
            if (!item)
                return -1;

            if (this.isRow(item))
                return (<DataViewVisualTableRow>item).index;

            return this.getColumnIndex(item);
        }

        private isRow(item: any): boolean {
            if (!item)
                return false;

            let row = <DataViewVisualTableRow>item;
            return row.index !== undefined && row.values !== undefined;
        }

        private getColumnIndex(item: any): number {
            return TableHierarchyNavigator.getIndex(this.tableDataView.columns, item);
        }
        
        /**
         * Checks whether a hierarchy member is a leaf.
         */
        public isLeaf(item: any): boolean {
            return true;
        }

        public isRowHierarchyLeaf(cornerItem: any): boolean {
            return false;
        }

        public isColumnHierarchyLeaf(cornerItem: any): boolean {
            return true;
        }
        
        /**
         * Checks whether a hierarchy member is the last item within its parent.
         */
        public isLastItem(item: any, items: any): boolean {
            return false;
        }
        
        /**
         * Gets the children members of a hierarchy member.
         */
        public getChildren(item: any): any {
            return null;
        }
        
        /**
         * Gets the members count in a specified collection.
         */
        public getCount(items: any): number {
            return items.length;
        }
        
        /**
         * Gets the member at the specified index.
         */
        public getAt(items: any, index: number): any {
            return items[index];
        }
        
        /**
         * Gets the hierarchy member level.
         */
        public getLevel(item: any): number {
            return 0;
        }
        
        /**
         * Returns the intersection between a row and a column item.
         */
        public getIntersection(rowItem: any, columnItem: DataViewMetadataColumn): TableCell {
            let value: any;
            let isTotal: boolean = false;
            let isBottomMost: boolean = false;

            let columnIndex = TableHierarchyNavigator.getIndex(this.tableDataView.columns, columnItem);
            let isLeftMost = columnIndex === 0 ? true : false;

            let totalRow = <TableTotal>rowItem;
            if (totalRow.totalCells != null) {
                isTotal = true;
                value = totalRow.totalCells[columnIndex];
            }
            else {
                let bottomRow = this.tableDataView.visualRows[this.tableDataView.visualRows.length - 1];
                isBottomMost = bottomRow === rowItem;
                value = (<DataViewVisualTableRow>rowItem).values[columnIndex];
            }

            let formattedValue = this.formatter(value, columnItem, TablixUtils.TablixFormatStringProp);
            let domContent: JQuery;
            let textContent: string;
            if (TablixUtils.isValidStatusGraphic(columnItem.kpi, formattedValue))
                domContent = TablixUtils.createKpiDom(columnItem.kpi, formattedValue);
            else
                textContent = formattedValue;

            return {
                textContent: textContent,
                domContent: domContent,
                isMeasure: columnItem.isMeasure,
                isTotal: isTotal,
                isBottomMost: isBottomMost,
                showUrl: UrlHelper.isValidUrl(columnItem, formattedValue),
                showImage: UrlHelper.isValidImage(columnItem, formattedValue),
                isLeftMost: isLeftMost
              };
        }
        
        /**
         * Returns the corner cell between a row and a column level. 
         */
        public getCorner(rowLevel: number, columnLevel: number): any {
            return null;
        }

        public headerItemEquals(item1: any, item2: any): boolean {
            if (item1 === item2)
                return true;

            // Typechecking does not work with interfaces nor at runtime. We need to explicitly check for 
            // properties of DataViewMetadataColumn to determine if we can use the column equivalency check.
            // We expect this method to handle either VisualTableRows or DataViewMetadataColumns so checking
            // for displayName should be sufficient.
            if (item1.displayName && item2.displayName) {
                let column1 = <powerbi.DataViewMetadataColumn>item1;
                let column2 = <powerbi.DataViewMetadataColumn>item2;
                return powerbi.DataViewAnalysis.areMetadataColumnsEquivalent(column1, column2);
            }

            if (this.isRow(item1) && this.isRow(item2))
                return item1.index === item2.index;

            return false;
        }

        public bodyCellItemEquals(item1: any, item2: any): boolean {
            return (item1 === item2);
        }

        public cornerCellItemEquals(item1: any, item2: any): boolean {
            // Should not be called as we don't return any corner items for table
            return true;
        }

        public update(table: DataViewVisualTable): void {
            this.tableDataView = table;
        }

        public static getIndex(items: any[], item: any): number {
            for (let index = 0, len = items.length; index < len; index++) {

                // For cases when the item was re-created during the DataTransformation phase,
                // we check for the item's index to verify equality.
                let arrayItem = items[index];
                if (arrayItem.index != null && item.index != null && arrayItem.index === item.index) {
                    return index;
                }
                else {
                    if (item === items[index])
                        return index;
                }
            }

            return -1;
        }
    }

    export interface TableBinderOptions {
        onBindRowHeader?(item: any): void;
        onColumnHeaderClick?(queryName: string, sortDirection: SortDirection): void;
        layoutKind?: controls.TablixLayoutKind;
    }
    
    /**
     * Note: Public for testability.
     */
    export class TableBinder implements controls.ITablixBinder {

        public static sortIconContainerClassName = "bi-sort-icon-container";
        public static columnHeaderClassName = 'bi-table-column-header';
        private static rowClassName = 'bi-table-row';
        private static lastRowClassName = 'bi-table-last-row';
        private static footerClassName = 'bi-table-footer';
        private static numericCellClassName = 'bi-table-cell-numeric';
        private static nonBreakingSpace = '&nbsp;';
        private options: TableBinderOptions;
        private formattingProperties: TablixFormattingProperties;
        private tableDataView: DataViewVisualTable;

        constructor(options: TableBinderOptions) {
            this.options = options;
        }

        public onDataViewChanged(dataView: DataViewVisualTable): void {
            this.tableDataView = dataView;
            this.formattingProperties = dataView.formattingProperties;
        }

        public setTablixColumnSeparator(cell: controls.ITablixCell): void {
            if (this.formattingProperties.columns.showSeparators)
                cell.extension.setColumnSeparator(this.formattingProperties.columns.separatorColor, this.formattingProperties.columns.separatorWeight);
        }

        public setTablixRegionStyle(cell: controls.ITablixCell, fontColor: string, backgroundColor, outline: string, outlineWeight: number, outlineColor: string): void {
            if (fontColor !== "")
                cell.extension.setFontColor(fontColor);
            if (backgroundColor)
                cell.extension.setBackgroundColor(backgroundColor);

            let borderStyle = VisualBorderUtil.getBorderStyleWithWeight(outline, outlineWeight);
            let borderWeight = VisualBorderUtil.getBorderWidth(outline, outlineWeight);
            cell.extension.setOutline(borderStyle, outlineColor, borderWeight);
        }

        public onStartRenderingSession(): void {
        }

        public onEndRenderingSession(): void {
        }
        
        /**
         * Row Header.
         */
        public bindRowHeader(item: any, cell: controls.ITablixCell): void {
            this.ensureHeight(item, cell);
            if (this.options.onBindRowHeader)
                this.options.onBindRowHeader(item);
        }

        public unbindRowHeader(item: any, cell: controls.ITablixCell): void {
        }
        
        /**
         * Column Header.
         */

        public bindColumnHeader(item: DataViewMetadataColumn, cell: controls.ITablixCell): void {
            let columnIndex = TableHierarchyNavigator.getIndex(this.tableDataView.columns, item);
            cell.extension.setContainerStyle(TableBinder.columnHeaderClassName);
            cell.extension.disableDragResize();
            cell.extension.contentHost.textContent = item.displayName;

            if (this.sortIconsEnabled())
                TablixUtils.appendSortImageToColumnHeader(item, cell);

            if (this.options.onColumnHeaderClick) {
                let handler = (e: MouseEvent) => {
                    let sortDirection: SortDirection = TablixUtils.reverseSort(item.sort);
                    this.options.onColumnHeaderClick(item.queryName ? item.queryName : item.displayName, sortDirection);
                };
                cell.extension.registerClickHandler(handler);
            }

            if (this.formattingProperties) {
                this.setTablixRegionStyle(cell, this.formattingProperties.header.fontColor, this.formattingProperties.header.backgroundColor, this.formattingProperties.header.outline, this.formattingProperties.general.outlineWeight, this.formattingProperties.general.outlineColor);

                //set Column separator for table
                if (columnIndex > 0)
                    this.setTablixColumnSeparator(cell);
            }
        }

        public unbindColumnHeader(item: any, cell: controls.ITablixCell): void {
            cell.extension.clearContainerStyle();
            cell.extension.contentHost.textContent = '';

            if (this.sortIconsEnabled())
                TablixUtils.removeSortIcons(cell);

            if (this.options.onColumnHeaderClick) {
                cell.extension.unregisterClickHandler();
            }
        }
        
        /**
         * Body Cell.
         */
        public bindBodyCell(item: TableCell, cell: controls.ITablixCell): void {
            if (item.showUrl)
                TablixUtils.appendATagToBodyCell(item.textContent, cell);
            else if (item.showImage)
                TablixUtils.appendImgTagToBodyCell(item.textContent, cell);
            else if (!_.isEmpty(item.domContent))
                $(cell.extension.contentHost).append(item.domContent);
            else if (item.textContent)
                cell.extension.contentHost.textContent = item.textContent;

            let classNames = item.isTotal ?
                TableBinder.footerClassName :
                item.isBottomMost ? TableBinder.lastRowClassName : TableBinder.rowClassName;

            if (item.isMeasure)
                classNames += ' ' + TableBinder.numericCellClassName;

            cell.extension.setContainerStyle(classNames);

            if (this.formattingProperties) {
                let fontColor = item.isTotal ? this.formattingProperties.totals.fontColor : this.formattingProperties.rows.fontColor;
                let backgroundColor = item.isTotal ? this.formattingProperties.totals.backgroundColor : this.formattingProperties.rows.backgroundColor;
                let outlineStyle = item.isTotal ? this.formattingProperties.totals.outline : this.formattingProperties.rows.outline;

                this.setTablixRegionStyle(cell, fontColor, backgroundColor, outlineStyle, this.formattingProperties.general.outlineWeight, this.formattingProperties.general.outlineColor);

                if (this.formattingProperties.rows.showSeparators)
                    cell.extension.setRowSeparator();

                if (!item.isLeftMost)
                    this.setTablixColumnSeparator(cell);
            }
        }

        public unbindBodyCell(item: TableCell, cell: controls.ITablixCell): void {
            cell.extension.clearContainerStyle();
            cell.extension.contentHost.textContent = '';
        }
        
        /**
         * Corner Cell.
         */
        public bindCornerCell(item: any, cell: controls.ITablixCell): void {
        }

        public unbindCornerCell(item: any, cell: controls.ITablixCell): void {
        }

        public bindEmptySpaceHeaderCell(cell: controls.ITablixCell): void {
            // Not needed for Table
        }

        public unbindEmptySpaceHeaderCell(cell: controls.ITablixCell): void {
            // Not needed for Table
        }

        public bindEmptySpaceFooterCell(cell: controls.ITablixCell): void {
            // Not needed for Table
        }

        public unbindEmptySpaceFooterCell(cell: controls.ITablixCell): void {
            // Not needed for Table
        }
        
        /**
         * Measurement Helper.
         */
        public getHeaderLabel(item: DataViewMetadataColumn): string {
            return item.displayName;
        }

        public getCellContent(item: any): string {
            return item;
        }

        public hasRowGroups(): boolean {
            return false;
        }

        private ensureHeight(item: any, cell: controls.ITablixCell) {
            if (!item.values)
                return;

            let count = item.values.length;
            if (count === 0)
                return;

            let allValuesEmpty = true;
            for (let i: number = 0; i < count; i++) {
                if (item.values[i]) {
                    allValuesEmpty = false;
                    break;
                }
            }

            // In order to maintain the height of the row when the values are null or empty
            // we set the innerHTML to be a nonBreakingSpace. The nonBreakingSpace does not
            // show up in the visual because for actual cell content we use the textContent property instead.
            if (allValuesEmpty)
                cell.extension.contentHost.innerHTML = TableBinder.nonBreakingSpace;
        }

        private sortIconsEnabled(): boolean {
            return this.options.layoutKind === controls.TablixLayoutKind.Canvas;
        }
    }

    export interface ColumnWidthCallbackType {
        (index: number, width: number): void;
    }

    export class Table implements IVisual {
        private static preferredLoadMoreThreshold: number = 0.8;

        private element: JQuery;
        private currentViewport: IViewport;
        private style: IVisualStyle;
        private formatter: ICustomValueColumnFormatter;
        private isInteractive: boolean;
        private getLocalizedString: (stringId: string) => string;
        private hostServices: IVisualHostServices;

        private tablixControl: controls.TablixControl;
        private hierarchyNavigator: TableHierarchyNavigator;
        private waitingForData: boolean;
        private lastAllowHeaderResize: boolean;
        private waitingForSort: boolean;
        private columnWidthManager: controls.TablixColumnWidthManager;
        private dataView: DataView;
        private isFormattingPropertiesEnabled: boolean;

        constructor(isFormattingPropertiesEnabled?: boolean) {
            this.isFormattingPropertiesEnabled = isFormattingPropertiesEnabled;
        }

        public static customizeQuery(options: CustomizeQueryOptions): void {
            let dataViewMapping = options.dataViewMappings[0];
            if (!dataViewMapping || !dataViewMapping.table || !dataViewMapping.metadata)
                return;

            let dataViewTableRows: data.CompiledDataViewRoleForMapping = <data.CompiledDataViewRoleForMapping>dataViewMapping.table.rows;
            let objects = dataViewMapping.metadata.objects;
            dataViewTableRows.for.in.subtotalType = TablixUtils.shouldShowTableTotals(objects) ? data.CompiledSubtotalType.Before : data.CompiledSubtotalType.None;
        }

        public static getSortableRoles(): string[] {
            return ['Values'];
        }

        public init(options: VisualInitOptions): void {
            this.element = options.element;
            this.style = options.style;
            this.updateViewport(options.viewport);
            this.formatter = valueFormatter.formatValueColumn;
            this.isInteractive = options.interactivity && options.interactivity.selection != null;
            this.getLocalizedString = options.host.getLocalizedString;
            this.hostServices = options.host;

            this.waitingForData = false;
            this.lastAllowHeaderResize = true;
            this.waitingForSort = false;
        }
        
        /**
         * Note: Public for testability.
         */
        public static converter(dataView: DataView, isFormattingPropertiesEnabled: boolean): DataViewVisualTable {
            let table = dataView.table;
            debug.assertValue(table, 'table');
            debug.assertValue(table.rows, 'table.rows');

            let visualTable = Prototype.inherit<DataViewVisualTable>(table);
            visualTable.visualRows = [];

            for (let i: number = 0; i < table.rows.length; i++) {
                let visualRow: DataViewVisualTableRow = {
                    index: i,
                    values: table.rows[i]
                };
                visualTable.visualRows.push(visualRow);
            }

            if (isFormattingPropertiesEnabled) {
                visualTable.formattingProperties = TablixUtils.getTableFormattingProperties(dataView);
            }

            return visualTable;
        }

        public onResizing(finalViewport: IViewport): void {
            this.updateViewport(finalViewport);
        }

        // Public for testability
        public getColumnWidthManager(): controls.TablixColumnWidthManager {
            return this.columnWidthManager;
        }

        public onDataChanged(options: VisualDataChangedOptions): void {
            debug.assertValue(options, 'options');
            // To avoid OnDataChanged being called every time resize occurs or the auto-size property switch is flipped.
            if (this.columnWidthManager && this.columnWidthManager.suppressOnDataChangedNotification) {
                // Reset flag for cases when cross-filter/cross-higlight happens right after. We do need onDataChanged call to go through
                this.columnWidthManager.suppressOnDataChangedNotification = false;
                return;
            }

            let previousDataView = this.dataView;
            let dataViews = options.dataViews;

            if (dataViews && dataViews.length > 0) {
                this.dataView = dataViews[0];
                let visualTable = Table.converter(this.dataView, this.isFormattingPropertiesEnabled);
                let textSize = visualTable.formattingProperties ? visualTable.formattingProperties.general.textSize : TablixUtils.getTextSize(this.dataView.metadata.objects);

                if (options.operationKind === VisualDataChangeOperationKind.Append) {
                    this.hierarchyNavigator.update(visualTable);
                    this.tablixControl.updateModels(/*resetScrollOffsets*/false, visualTable.visualRows);
                    this.refreshControl(/*clear*/false);
                } else {
                    this.createOrUpdateHierarchyNavigator(visualTable);
                    this.createColumnWidthManager();
                    this.createTablixControl(textSize);
                    let binder = <TableBinder>this.tablixControl.getBinder();
                    binder.onDataViewChanged(visualTable);
                    this.populateColumnWidths();
                    this.updateInternal(this.dataView, textSize, previousDataView, visualTable);
                }
            }

            this.waitingForData = false;
            this.waitingForSort = false;
        }

        private populateColumnWidths(): void { 
            if (this.columnWidthManager) {
                this.columnWidthManager.deserializeTablixColumnWidths();
                if (this.columnWidthManager.persistColumnWidthsOnHost())
                    this.persistColumnWidths(this.columnWidthManager.getVisualObjectInstancesToPersist());
            }
        }

        public columnWidthChanged(index: number, width: number): void {
            this.columnWidthManager.columnWidthChanged(index, width);
            this.persistColumnWidths(this.columnWidthManager.getVisualObjectInstancesToPersist());
        }

        private persistColumnWidths(objectInstances: VisualObjectInstancesToPersist): void {
            this.hostServices.persistProperties(objectInstances);
        }

        private updateViewport(newViewport: IViewport) {
            this.currentViewport = newViewport;

            if (this.tablixControl) {
                this.tablixControl.viewport = this.currentViewport;
                this.verifyHeaderResize();
                this.refreshControl(false);
            }
        }

        private refreshControl(clear: boolean) {
            if (visibilityHelper.partiallyVisible(this.element) || this.getLayoutKind() === controls.TablixLayoutKind.DashboardTile) {
                this.tablixControl.refresh(clear);
            }
        }

        private getLayoutKind() {
            return this.isInteractive ? controls.TablixLayoutKind.Canvas : controls.TablixLayoutKind.DashboardTile;
        }

        private createOrUpdateHierarchyNavigator(visualTable: DataViewVisualTable): void {
            if (!this.tablixControl) {
                let dataNavigator = new TableHierarchyNavigator(visualTable, this.formatter);
                this.hierarchyNavigator = dataNavigator;
            }
            else {
                this.hierarchyNavigator.update(visualTable);
            }
        }

        private createTablixControl(textSize: number): void {
            if (!this.tablixControl) {
                // Create the control
                this.tablixControl = this.createControl(this.hierarchyNavigator, textSize);
            }
        }

        private createColumnWidthManager(): void {
            if (!this.columnWidthManager) {
                this.columnWidthManager = new controls.TablixColumnWidthManager(this.dataView, false /* isMatrix */);
                this.columnWidthManager.columnWidthResizeCallback = (i, w) => this.columnWidthChanged(i, w);
            }
            else {
                this.columnWidthManager.updateDataView(this.dataView);
            }
        }

        private createControl(dataNavigator: TableHierarchyNavigator, textSize: number): controls.TablixControl {
            let layoutKind = this.getLayoutKind();

            let tableBinderOptions: TableBinderOptions = {
                onBindRowHeader: (item: any) => this.onBindRowHeader(item),
                onColumnHeaderClick: (queryName: string, sortDirection: SortDirection) => this.onColumnHeaderClick(queryName, sortDirection),
                layoutKind: layoutKind,
            };

            let tableBinder = new TableBinder(tableBinderOptions);
            let layoutManager: controls.internal.TablixLayoutManager = layoutKind === controls.TablixLayoutKind.DashboardTile
                ? controls.internal.DashboardTablixLayoutManager.createLayoutManager(tableBinder)
                : controls.internal.CanvasTablixLayoutManager.createLayoutManager(tableBinder, this.columnWidthManager);

            // Create Host element
            let tablixContainer = document.createElement('div');
            this.element.append(tablixContainer);

            let tablixOptions: controls.TablixOptions = {
                interactive: this.isInteractive,
                enableTouchSupport: false,
                layoutKind: layoutKind,
                fontSize: TablixUtils.getTextSizeInPx(textSize),
            };

            return new controls.TablixControl(dataNavigator, layoutManager, tableBinder, tablixContainer, tablixOptions);
        }

        private updateInternal(dataView: DataView, textSize: number, previousDataView: DataView, visualTable: DataViewVisualTable) {
            if (this.getLayoutKind() === controls.TablixLayoutKind.DashboardTile) {
                this.tablixControl.layoutManager.adjustContentSize(UrlHelper.hasImageColumn(dataView));
            }

            this.tablixControl.fontSize = TablixUtils.getTextSizeInPx(textSize);
            this.verifyHeaderResize();

            // Update models before the viewport to make sure column widths are computed correctly
            this.tablixControl.updateModels(/*resetScrollOffsets*/true, visualTable.visualRows, visualTable.columns);

            let totals = this.createTotalsRow(dataView);
            this.tablixControl.rowDimension.setFooter(totals);

            this.tablixControl.viewport = this.currentViewport;
            let shouldClearControl = this.shouldClearControl(previousDataView, dataView);

            // Render
            // We need the layout for the DIV to be done so that the control can measure items correctly.
            setTimeout(() => {
                // Render
                this.refreshControl(shouldClearControl);
                this.columnWidthManager.persistAllColumnWidths(this.tablixControl.layoutManager.columnWidthsToPersist);
                if (this.columnWidthManager.persistColumnWidthsOnHost())
                    this.persistColumnWidths(this.columnWidthManager.getVisualObjectInstancesToPersist());
            }, 0);
        }

        private shouldClearControl(previousDataView: DataView, newDataView: DataView) {
            if (!this.waitingForSort || !previousDataView || !newDataView)
                return true;

            return !DataViewAnalysis.isMetadataEquivalent(previousDataView.metadata, newDataView.metadata);
        }

        private createTotalsRow(dataView: DataView): TableTotal {
            if (!TablixUtils.shouldShowTableTotals(dataView.metadata.objects))
                return null;

            let totals = dataView.table.totals;
            if (!totals || totals.length === 0)
                return null;

            let totalRow: any[] = [];
            let columns = dataView.table.columns;

            // Add totals for measure columns, blank for non-measure columns unless it's the first column
            for (let i = 0, len = columns.length; i < len; ++i) {
                let column = columns[i];

                let totalValue = totals[column.index];
                if (totalValue != null) {
                    totalRow.push(totalValue);
                }
                else {
                    // If the first column is a non-measure column, we put 'Total' as the text similar to PV.
                    // Note that if the first column is a measure column we don't render any Total text at
                    // all, once again similar to PV.
                    totalRow.push((i === 0) ? this.getLocalizedString('TableTotalLabel') : '');
                }
            }

            return <TableTotal>{ totalCells: totalRow };
        }

        private onBindRowHeader(item: any): void {
            if (this.needsMoreData(item)) {
                this.hostServices.loadMoreData();
                this.waitingForData = true;
            }
        }

        private onColumnHeaderClick(queryName: string, sortDirection: SortDirection) {
            let sortDescriptors: SortableFieldDescriptor[] = [{
                queryName: queryName,
                sortDirection: sortDirection
            }];
            let args: CustomSortEventArgs = {
                sortDescriptors: sortDescriptors
            };
            this.waitingForSort = true;
            this.hostServices.onCustomSort(args);
        }
        
        /**
         * Note: Public for testability.
         */
        public needsMoreData(item: any): boolean {
            if (this.waitingForData || !this.dataView.metadata || !this.dataView.metadata.segment)
                return false;

            let leafCount = this.tablixControl.rowDimension.getItemsCount();
            let loadMoreThreshold = leafCount * Table.preferredLoadMoreThreshold;

            return this.hierarchyNavigator.getIndex(item) >= loadMoreThreshold;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let enumeration = new ObjectEnumerationBuilder();

            if (this.dataView) {
                TablixUtils.setEnumeration(options, enumeration, this.dataView, this.isFormattingPropertiesEnabled, controls.TablixType.Table);
        }

            return enumeration.complete();
        }

        private shouldAllowHeaderResize(): boolean {
            return this.hostServices.getViewMode() === ViewMode.Edit;
        }

        private verifyHeaderResize() {
            let currentAllowHeaderResize = this.shouldAllowHeaderResize();
            if (currentAllowHeaderResize !== this.lastAllowHeaderResize) {
                this.lastAllowHeaderResize = currentAllowHeaderResize;
                this.tablixControl.layoutManager.setAllowHeaderResize(currentAllowHeaderResize);
            }
        }
    }
}