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
    export const tableCapabilities: VisualCapabilities = {
        dataRoles: [{
            name: 'Values',
            kind: VisualDataRoleKind.GroupingOrMeasure,
        }],
        objects: {
            general: {
                displayName: data.createDisplayNameGetter('Visual_General'),
                properties: {
                    formatString: {
                        type: { formatting: { formatString: true } },
                    },
                    columnWidth: {
                        type: { numeric: true }
                    },
                    totals: {
                        type: { bool: true },
                        displayName: data.createDisplayNameGetter('Visual_Totals')
                    },
                    autoSizeColumnWidth: {
                        type: { bool: true },
                        displayName: data.createDisplayNameGetter('Visual_Adjust_Column_Width')
                    },
                    textSize: {
                        displayName: data.createDisplayNameGetter('Visual_TextSize'),
                        type: { numeric: true }
                    },
                    outlineColor: {
                        displayName: data.createDisplayNameGetter('Visual_OutlineColor'),
                        type: { fill: { solid: { color: true } } }
                    },
                    outlineWeight: {
                        displayName: data.createDisplayNameGetter('Visual_OutlineWeight'),
                        type: { numeric: true }
                    }
                },
            },
            columns:
            {
                displayName: data.createDisplayNameGetter('Role_DisplayName_Columns'),
                properties: {
                    showSeparators: {
                        displayName: data.createDisplayNameGetter('Tablix_Column_Separator'),
                        type: { bool: true }
                    },
                    separatorColor: {
                        displayName: data.createDisplayNameGetter('Visual_Fill'),
                        type: { fill: { solid: { color: true } } }
                    },
                    columnSeparatorWeight: {
                        displayName: data.createDisplayNameGetter('Visual_BasicShape_Weight'),
                        type: { numeric: true }
                    }
                }
            },
            header: {
                displayName: data.createDisplayNameGetter('Visual_Header'),
                properties: {
                    fontColor: {
                        displayName: data.createDisplayNameGetter('Visual_FontColor'),
                        type: { fill: { solid: { color: true } } }
                    },
                    backgroundColor: {
                        displayName: data.createDisplayNameGetter('Visual_Background'),
                        type: { fill: { solid: { color: true } } }
                    },
                    outline: {
                        displayName: data.createDisplayNameGetter('Visual_Outline'),
                        type: { enumeration: outline.type }
                    }
                },
            },
            rows: {
                displayName: data.createDisplayNameGetter('Role_DisplayName_Rows'),
                properties: {
                    showSeparators: {
                        displayName: data.createDisplayNameGetter('Tablix_Row_Separator'),
                        type: { bool: true }
                    },
                    fontColor: {
                        displayName: data.createDisplayNameGetter('Visual_FontColor'),
                        type: { fill: { solid: { color: true } } }
                    },
                    backgroundColor: {
                        displayName: data.createDisplayNameGetter('Visual_Background'),
                        type: { fill: { solid: { color: true } } }
                    },
                    outline: {
                        displayName: data.createDisplayNameGetter('Visual_Outline'),
                        type: { enumeration: outline.type }
                    }
                },
            },
            totals: {
                displayName: data.createDisplayNameGetter('Visual_Totals'),
                properties: {
                    fontColor: {
                        displayName: data.createDisplayNameGetter('Visual_FontColor'),
                        type: { fill: { solid: { color: true } } }
                    },
                    backgroundColor: {
                        displayName: data.createDisplayNameGetter('Visual_Background'),
                        type: { fill: { solid: { color: true } } }
                    },
                    outline: {
                        displayName: data.createDisplayNameGetter('Visual_Outline'),
                        type: { enumeration: outline.type }
                    }
                },
            }
        },
        dataViewMappings: [{
            table: {
                rows: {
                    for: { in: 'Values' },
                    dataReductionAlgorithm: { window: { count: 500 } }
                },
                rowCount: { preferred: { min: 1 } }
            },
        }],
        sorting: {
            custom: {},
        },
        suppressDefaultTitle: true,
        supportsSelection: false,
    };
}