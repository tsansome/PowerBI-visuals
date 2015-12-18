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
    export var OpinionVis2Capabilities: VisualCapabilities = {
        dataRoles: [
            {
                name: 'Statement',
                displayName: 'Statement',
                kind: VisualDataRoleKind.Grouping,
            },
            {
                name: 'Groups',
                displayName: 'Groups to compare',
                kind: VisualDataRoleKind.Grouping,
            },
            {
                name: 'Value',
                displayName: 'Values',
                kind: VisualDataRoleKind.Measure,
                requiredTypes: [{ numeric: true }]
            },
            {
                name: 'ExtraDetails',
                displayName: 'Extra Details',
                kind: VisualDataRoleKind.Measure,
                requiredTypes: [{ numeric: true }]
            },
            {
                name: 'SortBy',
                displayName: 'Sort By',
                kind: VisualDataRoleKind.Measure,
                requiredTypes: [{ numeric: true }]
            }
        ],
        dataViewMappings: [
            {
                conditions: [
                    { 'Statement': { max: 5 }, 'Groups': { max: 1 }, 'Value': { max: 1 }, 'SortBy': { max: 1 }, 'ExtraDetails': { max: 1 } },
                ],
                categorical: {
                    categories: {
                        for: { in: 'Statement' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        group: {
                            by: 'Groups',
                            select: [
                                { bind: { to: 'Value' } },
                                { bind: { to: 'ExtraDetails' } },
                            ],
                            dataReductionAlgorithm: { top: { count: 2 } }
                        }
                    },
                    rowCount: { preferred: { min: 2 }, supported: { min: 0 } }
                }
            },
            {
                conditions: [
                    // NOTE: Ordering of the roles prefers to add measures to Y before Gradient.
                    { 'Statement': { max: 5 }, 'Groups': { max: 1 }, 'Value': { max: 1 }, 'SortBy': { max: 1 }, 'ExtraDetails': { max: 1 } }
                ],
                categorical: {
                    categories: {
                        for: { in: 'Statement' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        select: [
                            { bind: { to: 'SortBy' } }
                        ]
                    },
                    rowCount: { preferred: { min: 2 }, supported: { min: 0 } }
                }
            }
        ],
        objects: {
            statementproperties: {
                displayName: "Statement",
                properties: {
                    defaultFontSize: {
                        description: "Specify the font size for the statement text.",
                        type: { numeric: true },
                        displayName: "Default Font Size"
                    },
                    defaultFontColor: {
                        description: "Specify the font color for the statement text.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Default Font Color"
                    }
                }
            },
            groupnodeproperties: {
                displayName: "Group Circle",
                properties: {
                    defaultColor: {
                        description: "Specify the font size for the statement text.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Default Color"
                    }
                }
            },
            groupnodedatalabelproperties: {
                displayName: "Group Circle Data Label",
                properties: {
                    defaultColor: {
                        description: "Specify the default color for the nodes.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Default Color"
                    },
                    defaultFontSize: {
                        description: "Specify the font size for the data label on a node.",
                        type: { numeric: true },
                        displayName: "Default Font Size"
                    }
                }
            },
            gapbarproperties: {
                displayName: "Gap Bar",
                properties: {
                    defaultColor: {
                        description: "Specify the default color for the gap bar.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Default Color"
                    }
                }
            },
            gaplabelproperties: {
                displayName: "Gap Label",
                properties: {
                    defaultColorOnBar: {
                        description: "Specify the default color for the text label on the gap bar.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Default Color On Bar"
                    },
                    defaultColorBelowBar: {
                        description: "Specify the default color for the text label below the gap bar.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Default Color Below Bar"
                    },
                    defaultFontSize: {
                        description: "Specify the font size for the gap label.",
                        type: { numeric: true },
                        displayName: "Default Font Size"
                    }
                }
            }
        },
        drilldown: {
            roles: ['Statement']
        }
    };
}