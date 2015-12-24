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
    import SQExprConverter = powerbi.data.SQExprConverter;

    /** Helper module for converting a DataView into SlicerData. */
    export module DataConversion {
        export function convert(dataView: DataView, localizedSelectAllText: string, interactivityService: IInteractivityService | ISelectionHandler, hostServices: IVisualHostServices): IPromise<SlicerData> {
            debug.assertValue(hostServices, 'hostServices');
            if (!dataView || !dataView.categorical || _.isEmpty(dataView.categorical.categories))
                return hostServices.promiseFactory().reject();

            let category = dataView.categorical.categories[0];
            let identityFields = category.identityFields;
            if (!identityFields)
                return hostServices.promiseFactory().reject();

            let filter: data.SemanticFilter = <data.SemanticFilter>(
                dataView.metadata &&
                dataView.metadata.objects &&
                DataViewObjects.getValue(dataView.metadata.objects, visuals.slicerProps.filterPropertyIdentifier));

            let analyzer = hostServices.filterAnalyzer(filter, identityFields);
            if (!analyzer)
                return hostServices.promiseFactory().reject();

            if (filter) {
                let slicerData = getSlicerData(filter, analyzer, dataView.metadata, category, localizedSelectAllText, <IInteractivityService>interactivityService, hostServices);
                return hostServices.promiseFactory().resolve<SlicerData>(slicerData);
            }

            return analyzer.hasDefaultFilterOverride()
                .then((result) => {
                    if (result === true)
                        (<ISelectionHandler>interactivityService).handleClearSelection();

                    let slicerData = getSlicerData(filter, analyzer, dataView.metadata, category, localizedSelectAllText, <IInteractivityService>interactivityService, hostServices);
                    return slicerData;
                });
        }

        function getSlicerData(
            filter: data.SemanticFilter,
            analyzer: IFilterAnalyzer,
            dataViewMetadata: DataViewMetadata,
            category: DataViewCategoryColumn,
            localizedSelectAllText: string, interactivityService: IInteractivityService, hostServices: IVisualHostServices): SlicerData {
            let isInvertedSelectionMode: boolean = interactivityService && interactivityService.isSelectionModeInverted();
            let hasSelectionOverride: boolean = false;
            let selectedScopeIds = analyzer.selectedIdentities();
            hasSelectionOverride = !_.isEmpty(selectedScopeIds);
            if (filter)
                isInvertedSelectionMode = analyzer.isNotFilter();

            if (interactivityService)
                interactivityService.setSelectionModeInverted(isInvertedSelectionMode);

            let categoryValuesLen: number = category && category.values ? category.values.length : 0;
            let slicerDataPoints: SlicerDataPoint[] = [];
            let formatString = valueFormatter.getFormatString(category.source, slicerProps.formatString);
            let numOfSelected: number = 0;
            for (let i = 0; i < categoryValuesLen; i++) {
                let scopeId = category.identity && category.identity[i];
                let value = category.values && category.values[i];

                if (value) {
                    let isRetained = hasSelectionOverride ? SlicerUtil.tryRemoveValueFromRetainedList(scopeId, selectedScopeIds) : false;
                    let label: string = valueFormatter.format(value, formatString);
                    // TODO: need to add count as well
                    let slicerData: SlicerDataPoint = {
                        value: label,
                        tooltip: label,
                        identity: SelectionId.createWithId(scopeId),
                        selected: isRetained,
                    };

                    slicerDataPoints.push(slicerData);
                    if (slicerData.selected)
                        numOfSelected++;
                }
            }

            // Add retained values that are not in the returned dataview to the value list.
            if (hasSelectionOverride) {
                //TODO: To support group on keys, we need ask hostService for the matching label which should be cached
                for (let scopeId of selectedScopeIds) {
                    let label = getLabel(scopeId, formatString);

                    let slicerData: SlicerDataPoint = {
                        value: label,
                        tooltip: label,
                        identity: SelectionId.createWithId(scopeId),
                        selected: true,
                    };

                    slicerDataPoints.push(slicerData);
                    numOfSelected++;
                }
            }

            //When all the items are selected and there is no more data to request, then unselect all and toggle the invertedSelectionMode
            if (numOfSelected > 0 && !dataViewMetadata.segment && numOfSelected === slicerDataPoints.length) {
                isInvertedSelectionMode = !isInvertedSelectionMode;
                interactivityService.setSelectionModeInverted(isInvertedSelectionMode);
                for (let item of slicerDataPoints) {
                    item.selected = false;
                }
                hasSelectionOverride = false;
                numOfSelected = 0;
            }

            let defaultSettings = createDefaultSettings(dataViewMetadata);
            if (defaultSettings.selection.selectAllCheckboxEnabled) {
                slicerDataPoints.unshift({
                    value: localizedSelectAllText,
                    tooltip: localizedSelectAllText,
                    identity: SelectionId.createWithMeasure(localizedSelectAllText),
                    selected: !!isInvertedSelectionMode && numOfSelected === 0,
                    isSelectAllDataPoint: true
                });
            }

            let slicerData: SlicerData = {
                categorySourceName: category.source.displayName,
                slicerSettings: defaultSettings,
                slicerDataPoints: slicerDataPoints,
                hasSelectionOverride: hasSelectionOverride,
            };

            return slicerData;
        }

        function getLabel(scopeId: DataViewScopeIdentity, formatString: string): string {
            let label = SQExprConverter.getFirstComparandValue(scopeId);
            return valueFormatter.format(label, formatString);
        }

        function createDefaultSettings(dataViewMetadata: DataViewMetadata): SlicerSettings {
            let defaultSettings = Slicer.DefaultStyleProperties();
            let objects = dataViewMetadata.objects;

            if (objects) {
                defaultSettings.general.outlineColor = DataViewObjects.getFillColor(objects, slicerProps.general.outlineColor, defaultSettings.general.outlineColor);
                defaultSettings.general.outlineWeight = DataViewObjects.getValue<number>(objects, slicerProps.general.outlineWeight, defaultSettings.general.outlineWeight);
                defaultSettings.general.orientation = DataViewObjects.getValue<slicerOrientation.Orientation>(objects, slicerProps.general.orientation, defaultSettings.general.orientation);

                defaultSettings.header.show = DataViewObjects.getValue<boolean>(objects, slicerProps.header.show, defaultSettings.header.show);
                defaultSettings.header.fontColor = DataViewObjects.getFillColor(objects, slicerProps.header.fontColor, defaultSettings.header.fontColor);
                let headerBackground = DataViewObjects.getFillColor(objects, slicerProps.header.background);
                if (headerBackground)
                    defaultSettings.header.background = headerBackground;
                defaultSettings.header.outline = DataViewObjects.getValue<string>(objects, slicerProps.header.outline, defaultSettings.header.outline);
                defaultSettings.header.textSize = DataViewObjects.getValue<number>(objects, slicerProps.header.textSize, defaultSettings.header.textSize);

                defaultSettings.slicerText.color = DataViewObjects.getFillColor(objects, slicerProps.items.fontColor, defaultSettings.slicerText.color);
                let textBackground = DataViewObjects.getFillColor(objects, slicerProps.items.background);
                if (textBackground)
                    defaultSettings.slicerText.background = textBackground;

                defaultSettings.slicerText.outline = DataViewObjects.getValue<string>(objects, slicerProps.items.outline, defaultSettings.slicerText.outline);
                defaultSettings.slicerText.textSize = DataViewObjects.getValue<number>(objects, slicerProps.items.textSize, defaultSettings.slicerText.textSize);

                defaultSettings.selection.selectAllCheckboxEnabled = DataViewObjects.getValue<boolean>(objects, slicerProps.selection.selectAllCheckboxEnabled, defaultSettings.selection.selectAllCheckboxEnabled);
                defaultSettings.selection.singleSelect = DataViewObjects.getValue<boolean>(objects, slicerProps.selection.singleSelect, defaultSettings.selection.singleSelect);
            }

            return defaultSettings;
        }

        export function getDataViewDefaultValue(dataView: DataView): DefaultValueDefinition {
            if (dataView && dataView.metadata && !_.isEmpty(dataView.metadata.columns)) {
                return DataViewObjects.getValue<DefaultValueDefinition>(dataView.metadata.columns[0].objects, slicerProps.defaultValue);
            }
        }
    }
}