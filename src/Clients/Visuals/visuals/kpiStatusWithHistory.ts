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

/*
Created by Fredrik Hedenström, 2015-09-08
*/

module powerbi.visuals {
    export interface KPIStatusWithHistoryData {
        dataPoints: KPIStatusWithHistoryDataPoint[];
        format: string;
        directionType: string;
        goal: number;
        actual: number;
        targetExists: boolean;
        historyExists: boolean;
        indicatorExists: boolean;
        trendExists: boolean;
        formattedValue: string;
    }

    export interface KPIStatusWithHistoryDataPoint {
        x: number;
        y: number;
        actual: number;
        goal: number;
        selector: data.Selector;
        tooltipInfo: TooltipDataItem[];
    }

    export class KPIStatusWithHistory implements IVisual {

        public static kpiFormatStringProp: DataViewObjectPropertyIdentifier = { objectName: 'format', propertyName: 'kpiFormat' };
        public static directionTypeStringProp: DataViewObjectPropertyIdentifier = { objectName: 'status', propertyName: 'direction' };

        public static status = { INCREASE: "increase", DROP: "drop", NOGOAL: "no-goal" };
        public static textStatusColor = { RED: "#ee0000", GREEN: "#3bb44a", YELLOW: "#f2b311", NOGOAL: "#212121" };
        public static statusColor = { RED: "#fef0f0", GREEN: "#ebf7ec", YELLOW: "#fdf9e7", NOGOAL: "#f2f2f2" };
        public static statusBandingType = { Below: "BELOW", Above: "ABOVE" };
        public static actualTextConsts = { VERTICAL_OFFSET_FROM_HALF_HEIGHT: 20, FONT_WIDTH_FACTOR: 14, RIGHT_MARGIN: 10 };

        public static trendAreaFilePercentage = 0.34;

        private svg: D3.Selection;
        private dataView: DataView;
        private kpiArrow: D3.Selection;
        private mainGroupElement: D3.Selection;
        private mainGroupElement2: D3.Selection;
        private mainRect: D3.Selection;
        private kpiActualText: D3.Selection;
        private areaFill: D3.Selection;
        private host: IVisualHostServices;

        public init(options: VisualInitOptions): void {
            this.svg = d3.select(options.element.get(0)).append('svg');
            let mainGroupElement = this.mainGroupElement = this.svg.append('g');
            this.mainGroupElement2 = this.svg.append('g');
            this.mainRect = mainGroupElement.append("rect");
            this.areaFill = mainGroupElement.append("path");
            this.kpiArrow = mainGroupElement.append("path");
            this.kpiActualText = mainGroupElement.append("text");
            this.host = options.host;
        }

        public update(options: VisualUpdateOptions) {
            if (!options.dataViews || !options.dataViews[0]) return;
            let dataView = this.dataView = options.dataViews[0];
            let viewport = options.viewport;

            // We must have at least one measure
            if (!dataView.categorical || !dataView.categorical.values || dataView.categorical.values.length < 1) {
                this.svg.attr("visibility", "hidden");
                return;
            }
            this.svg.attr("visibility", "visible");

            let kpiViewModel: KPIStatusWithHistoryData = KPIStatusWithHistory.converter(
                dataView,
                viewport,
                KPIStatusWithHistory.getProp_KPIFormat(dataView),
                KPIStatusWithHistory.getProp_KPIDirection(dataView));

            this.render(kpiViewModel, viewport);
        }

        private render(kpiViewModel: KPIStatusWithHistoryData, viewport: IViewport) {
            if (kpiViewModel.dataPoints.length === 0) {
                this.svg.attr("visibility", "hidden");
                return;
            }

            this.svg.attr({
                'height': viewport.height,
                'width': viewport.width
            });

            this.setShowDataMissingWarning(!(kpiViewModel.indicatorExists && kpiViewModel.trendExists));

            if (!kpiViewModel.historyExists || !(kpiViewModel.indicatorExists && kpiViewModel.trendExists)) {
                this.mainGroupElement2.attr("visibility", "hidden");
                this.areaFill.attr("visibility", "hidden");
                return;
            }

            let status = KPIStatusWithHistory.status.NOGOAL;
            if (kpiViewModel.targetExists && kpiViewModel.indicatorExists && kpiViewModel.trendExists) {
                status = GetStatus(kpiViewModel.actual, kpiViewModel.goal, kpiViewModel.directionType);
            }

            let actualText = kpiViewModel.formattedValue + kpiViewModel.format;
            this.kpiActualText
                .attr("x", viewport.width * 0.5)
                .attr("y", viewport.height * 0.5 + KPIStatusWithHistory.actualTextConsts.VERTICAL_OFFSET_FROM_HALF_HEIGHT)
                .attr("fill", GetTextColorByStatus(status))
                .attr("style", "font-family:wf_standard-font_light,helvetica,arial,sans-serif;font-size:60px")
                .attr("text-anchor", "middle")
                .text(actualText);

            this.mainGroupElement2.attr("visibility", "visible");
            let selectionCircle = this.mainGroupElement2.selectAll("circle").data(kpiViewModel.dataPoints);

            this.mainGroupElement2.selectAll("rect").remove();

            TooltipManager.addTooltip(selectionCircle, (tooltipEvent: TooltipEvent) => tooltipEvent.data.tooltipInfo);

            let area = d3.svg.area()
                .x(function (d) { return d.x; })
                .y0(viewport.height)
                .y1(function (d) { return d.y; });

            this.areaFill
                .attr("d", area(kpiViewModel.dataPoints))
                .attr("stroke", "none")
                .attr("visibility", "visible")
                .attr("fill", GetColorByStatus(status));
        }

        private setShowDataMissingWarning(show: boolean) {
            this.host.setWarnings(show ? [new VisualKPIDataMissingWarning()] : []);
        }

        private static getDefaultFormatSettings(): CardFormatSetting {
            return {
                labelSettings: dataLabelUtils.getDefaultLabelSettings(true, Card.DefaultStyle.value.color),
                textSize: 10,
                wordWrap: false
            };
        }

        private static getMetaDataColumn(dataView: DataView): DataViewMetadataColumn {
            if (dataView && dataView.metadata && dataView.metadata.columns) {
                for (let column of dataView.metadata.columns) {
                    if (column.isMeasure) {
                        return column;
                    }
                }
            }
        }

        private static getFormatString(column: DataViewMetadataColumn): string {
            debug.assertAnyValue(column, 'column');
            return valueFormatter.getFormatString(column, AnimatedText.formatStringProp);
        }

        private static getProp_KPIFormat(dataView: DataView) {
            if (dataView.metadata) {
                return DataViewObjects.getValue<string>(dataView.metadata.objects, KPIStatusWithHistory.kpiFormatStringProp, "");
            }

            return "";
        }

        private static getProp_KPIDirection(dataView: DataView) {
            if (dataView.metadata) {
                return DataViewObjects.getValue<string>(dataView.metadata.objects, KPIStatusWithHistory.directionTypeStringProp, kpiDirection.positive);
            }

            return kpiDirection.positive;
        }

        private static getFormattedValue(metaDataColumn: DataViewMetadataColumn, theValue: number): string {
            let cardFormatSetting = KPIStatusWithHistory.getDefaultFormatSettings();
            let labelSettings = cardFormatSetting.labelSettings;
            let isDefaultDisplayUnit = labelSettings.displayUnits === 0;
            let formatter = valueFormatter.create({
                format: KPIStatusWithHistory.getFormatString(metaDataColumn),
                value: labelSettings.displayUnits,
                precision: labelSettings.precision,
                displayUnitSystemType: DisplayUnitSystemType.WholeUnits, // keeps this.displayUnitSystemType as the displayUnitSystemType unless the user changed the displayUnits or the precision
                formatSingleValues: isDefaultDisplayUnit ? true : false,
                allowFormatBeautification: true,
                columnType: metaDataColumn ? metaDataColumn.type : undefined
            });
            return formatter.format(theValue);
        }

        public static converter(dataView: DataView, viewPort: powerbi.IViewport, format: string, directionType: string): KPIStatusWithHistoryData {
            let dataPoints: KPIStatusWithHistoryDataPoint[] = [];
            let catDv: DataViewCategorical = dataView.categorical;
            let metaDataColumn = KPIStatusWithHistory.getMetaDataColumn(dataView);

            let historyExists = true;
            if (dataView.categorical.categories === undefined) {
                historyExists = false;
            }

            var category, categoryValues;
            if (historyExists) {
                category = catDv.categories[0]; // This only works if we have a category axis
                categoryValues = category.values;
            }

            let values = catDv.values;
            let historyActualData = [];
            let historyGoalData = [];
            let targetExists = false;

            if (values.length > 1) {
                targetExists = true;
            }

            let indicatorExists = false;
            let trendExists = false;

            let columns = dataView.metadata.columns;

            for (let i = 0; i < columns.length; i++) {
                if (DataRoleHelper.hasRole(columns[i], 'Indicator')) {
                    indicatorExists = true;
                }

                if (DataRoleHelper.hasRole(columns[i], 'TrendLine')) {
                    trendExists = true;
                }
            }

            for (let i = 0, len = values[0].values.length; i < len; i++) {
                var actualValue, targetValue;
                if (targetExists) {
                    if (DataRoleHelper.hasRole(values[0].source, 'Indicator')) {
                        actualValue = values[0].values[i];
                        targetValue = values[1].values[i];
                    }
                    else {
                        actualValue = values[1].values[i];
                        targetValue = values[0].values[i];
                    }
                    historyGoalData.push(targetValue);
                }
                else {
                    actualValue = values[0].values[i];
                }

                historyActualData.push(actualValue);
            }

            let maxActualData = Math.max.apply(Math, historyActualData);
            let minActualData = Math.min.apply(Math, historyActualData);
            let areaMaxHight = viewPort.height * KPIStatusWithHistory.trendAreaFilePercentage;

            for (let i = 0; i < historyActualData.length; i++) {
                let yPos = areaMaxHight * (historyActualData[i] - minActualData) / (maxActualData - minActualData);
                let tooltipString = 'actual ' + KPIStatusWithHistory.getFormattedValue(metaDataColumn, historyActualData[i]);
                if (targetExists) {
                    tooltipString += " ; Target " + KPIStatusWithHistory.getFormattedValue(metaDataColumn, historyGoalData[i]);
                }
                let toolTipStringName = "";
                let selectorId = null;
                if (historyExists) {
                    toolTipStringName = categoryValues[i];
                    selectorId = SelectionId.createWithId(category.identity[i]).getSelector();
                }

                dataPoints.push({
                    x: i * viewPort.width / (historyActualData.length - 1),
                    y: viewPort.height - yPos - viewPort.height * 0.1,                    
                    //dataId: (i * viewPort.width / (historyActualData.length - 1)) + "_" + (viewPort.height - yPos - viewPort.height * 0.1), // This ID identifies the points
                    //dataId: selectorId.id,
                    actual: historyActualData[i],
                    goal: historyGoalData[i],
                    selector: selectorId,
                    tooltipInfo: [{
                        displayName: toolTipStringName,
                        value: tooltipString,
                    }]
                });
            }

            var actual, goal;
            if (dataPoints.length > 0) {
                actual = dataPoints[dataPoints.length - 1].actual;
                goal = dataPoints[dataPoints.length - 1].goal;
            }

            if (dataPoints.length === 1) {
                historyExists = false;
            }

            let formattedValue = KPIStatusWithHistory.getFormattedValue(metaDataColumn, actual);

            return {
                dataPoints: dataPoints,
                format: format,
                directionType: directionType,
                actual: actual,
                goal: goal,
                targetExists: targetExists,
                historyExists: historyExists,
                indicatorExists,
                trendExists,
                formattedValue
            };
        }

        public static getColumnsByRole(values: DataViewValueColumns, roleString: string): any[] {
            let retval = [];

            for (let i = 0; i < values.length; i++) {
                if (DataRoleHelper.hasRole(values[i].source, roleString)) {
                    retval.push(values[i].values);
                }
            }

            return retval;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            let instances: VisualObjectInstance[] = [];
            let dataView = this.dataView;
            switch (options.objectName) {
                case 'general':
                    let general: VisualObjectInstance = {
                        objectName: 'general',
                        displayName: 'General',
                        selector: null,
                        properties: {
                            kpiFormat: KPIStatusWithHistory.getProp_KPIFormat(dataView)
                        }
                    };
                    instances.push(general);
                    break;
                case 'status':
                    return [{
                        selector: null,
                        objectName: 'status',
                        properties: {
                            direction: KPIStatusWithHistory.getProp_KPIDirection(dataView)
                        }
                    }];
                case 'format':
                    return [{
                        selector: null,
                        objectName: 'format',
                        properties: {
                            show: true,
                            kpiFormat: KPIStatusWithHistory.getProp_KPIFormat(dataView)
                        }
                    }];
            }
            return instances;
        }

        public destroy(): void {
            this.svg = null;
        }
    }

    function GetStatus(actual, goal, directionType) {
        switch (directionType) {
            case kpiDirection.positive:
                if (actual < goal) {
                    return KPIStatusWithHistory.status.DROP;
                }
                break;

            case kpiDirection.negative:
                if (actual > goal) {
                    return KPIStatusWithHistory.status.DROP;
                }
                break;

            default:
                break;
        }

        return KPIStatusWithHistory.status.INCREASE;
    }

    function GetColorByStatus(status) {
        switch (status) {
            case KPIStatusWithHistory.status.NOGOAL:
                return KPIStatusWithHistory.statusColor.NOGOAL;

            case KPIStatusWithHistory.status.INCREASE:
                return KPIStatusWithHistory.statusColor.GREEN;

            case KPIStatusWithHistory.status.DROP:
                return KPIStatusWithHistory.statusColor.RED;
        }
    }

    function GetTextColorByStatus(status) {
        switch (status) {
            case KPIStatusWithHistory.status.NOGOAL:
                return KPIStatusWithHistory.textStatusColor.NOGOAL;

            case KPIStatusWithHistory.status.INCREASE:
                return KPIStatusWithHistory.textStatusColor.GREEN;

            case KPIStatusWithHistory.status.DROP:
                return KPIStatusWithHistory.textStatusColor.RED;
        }
    }

}