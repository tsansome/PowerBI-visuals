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
    import PixelConverter = jsCommon.PixelConverter;

    /** Utility class for slicer*/
    export module SlicerUtil {
        /** CSS selectors for slicer elements. */
        export module Selectors {
            import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

            export const HeaderContainer = createClassAndSelector('headerContainer');
            export const Header = createClassAndSelector('slicerHeader');
            export const HeaderText = createClassAndSelector('headerText');
            export const Body = createClassAndSelector('slicerBody');
            export const LabelText = createClassAndSelector('slicerText');
            export const Clear = createClassAndSelector('clear');
            export const MultiSelectEnabled = createClassAndSelector('isMultiSelectEnabled');
        }

        /** Const declarations*/
        export module DisplayNameKeys {
            export const Clear = 'Slicer_Clear';
            export const SelectAll = 'Slicer_SelectAll';
        }

        /** Helper class for slicer settings  */
        export module SettingsHelper {
            export function areSettingsDefined(data: SlicerData): boolean {
                return data != null && data.slicerSettings != null;
            }
        }

        /** Helper class for handling slicer default value  */
        export module DefaultValueHandler {
            export function getDefaultValue(dataView: DataView): data.SQConstantExpr {
                let dataViewDefaultValue = DataConversion.getDataViewDefaultValue(dataView);
                if (dataViewDefaultValue)
                    return dataViewDefaultValue.value;
            }

            export function getIdentityFields(dataView: DataView): data.SQExpr[] {
                if (!dataView) {
                    return;
                }

                let dataViewCategorical = dataView.categorical;
                if (!dataViewCategorical || _.isEmpty(dataViewCategorical.categories))
                    return;

                return dataViewCategorical.categories[0].identityFields;
            }
        }

        // Compare the sqExpr of the scopeId with sqExprs of the retained values. 
        // If match found, remove the item from the retainedValues list, and return true, 
        // otherwise return false.
        export function tryRemoveValueFromRetainedList(value: DataViewScopeIdentity, selectedScopeIds: DataViewScopeIdentity[], caseInsensitive?: boolean): boolean {
            if (!value || _.isEmpty(selectedScopeIds))
                return false;

            for (let i = 0, len = selectedScopeIds.length; i < len; i++) {
                let retainedValueScopeId = selectedScopeIds[i];
                if (DataViewScopeIdentity.equals(value, retainedValueScopeId, caseInsensitive)) {
                    selectedScopeIds.splice(i, 1);
                    return true;
                }
            }

            return false;
        }

        /** Helper class for creating and measuring slicer DOM elements  */
        export class DOMHelper {
            public createSlicerHeader(hostServices: IVisualHostServices): HTMLElement {
                let slicerHeaderDiv = document.createElement('div');
                slicerHeaderDiv.className = Selectors.Header.class;

                let slicerHeader: D3.Selection = d3.select(slicerHeaderDiv);
                slicerHeader.append('span')
                    .classed(Selectors.Clear.class, true)
                    .attr('title', hostServices.getLocalizedString(DisplayNameKeys.Clear));
                slicerHeader.append('div').classed(Selectors.HeaderText.class, true);

                return slicerHeaderDiv;
            }

            public getHeaderTextProperties(settings: SlicerSettings): TextProperties {
                let headerTextProperties: TextProperties = {
                    fontFamily: 'wf_segoe-ui_normal',
                    fontSize: '10px'
                };
                if (settings.header.show) {
                    headerTextProperties.fontSize = PixelConverter.fromPoint(settings.header.textSize);
                }
                return headerTextProperties;
            }

            public getSlicerBodyViewport(currentViewport: IViewport, settings: SlicerSettings, headerTextProperties: TextProperties): IViewport {
                let headerHeight = (settings.header.show) ? this.getHeaderHeight(settings, headerTextProperties) : 0;
                let slicerBodyHeight = currentViewport.height - (headerHeight + settings.header.borderBottomWidth);
                return {
                    height: slicerBodyHeight,
                    width: currentViewport.width
                };
            }

            public updateSlicerBodyDimensions(currentViewport: IViewport, slicerBody: D3.Selection, settings: SlicerSettings): void {
                let slicerViewport = this.getSlicerBodyViewport(currentViewport, settings, this.getHeaderTextProperties(settings));
                slicerBody.style({
                    'height': PixelConverter.toString(slicerViewport.height),
                    'width': PixelConverter.toString(slicerViewport.width),
                });
            }

            public getHeaderHeight(settings: SlicerSettings, textProperties: TextProperties): number {
                return TextMeasurementService.estimateSvgTextHeight(this.getTextProperties(settings.header.textSize, textProperties)) + settings.general.outlineWeight;
            }

            public getRowHeight(settings: SlicerSettings, textProperties: TextProperties): number {
                return TextMeasurementService.estimateSvgTextHeight(this.getTextProperties(settings.slicerText.textSize, textProperties)) + this.getRowsOutlineWidth(settings.slicerText.outline, settings.general.outlineWeight);
            }

            public styleSlicerHeader(slicerHeader: D3.Selection, settings: SlicerSettings, headerText: string): void {
                if (settings.header.show) {
                    slicerHeader.style('display', 'block');
                    let headerTextElement = slicerHeader.select(Selectors.HeaderText.selector)
                        .text(headerText);
                    this.setSlicerHeaderTextStyle(headerTextElement, settings);
                }
                else {
                    slicerHeader.style('display', 'none');
                }
            }

            public setSlicerTextStyle(slicerText: D3.Selection, settings: SlicerSettings): void {
                slicerText
                    .style({
                        'color': settings.slicerText.color,
                        'background-color': settings.slicerText.background,
                        'border-style': VisualBorderUtil.getBorderStyle(settings.slicerText.outline),
                        'border-color': settings.general.outlineColor,
                        'border-width': VisualBorderUtil.getBorderWidth(settings.slicerText.outline, settings.general.outlineWeight),
                        'font-size': PixelConverter.fromPoint(settings.slicerText.textSize),
                    });
            }

            public getRowsOutlineWidth(outlineElement: string, outlineWeight: number): number {
                switch (outlineElement) {
                    case 'None':
                    case 'LeftRight':
                        return 0;
                    case 'BottomOnly':
                    case 'TopOnly':
                        return outlineWeight;
                    case 'TopBottom':
                    case 'Frame':
                        return outlineWeight * 2;
                    default:
                        return 0;
                }
            }

            private setSlicerHeaderTextStyle(slicerHeader: D3.Selection, settings: SlicerSettings): void {
                slicerHeader
                    .style({
                        'border-style': VisualBorderUtil.getBorderStyle(settings.header.outline),
                        'border-color': settings.general.outlineColor,
                        'border-width': VisualBorderUtil.getBorderWidth(settings.header.outline, settings.general.outlineWeight),
                        'color': settings.header.fontColor,
                        'background-color': settings.header.background,
                        'font-size': PixelConverter.fromPoint(settings.header.textSize),
                    });
            }

            private getTextProperties(textSize: number, textProperties: TextProperties): TextProperties {
                textProperties.fontSize = PixelConverter.fromPoint(textSize);
                return textProperties;
            }
        }
    }
}
