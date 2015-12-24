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
    export const KPIStatusWithHistoryCapabilities: VisualCapabilities = {
        dataRoles: [
            {
                name: 'Indicator',
                kind: VisualDataRoleKind.Measure,
                displayName: data.createDisplayNameGetter('Role_DisplayName_Indicator'),
                description: data.createDisplayNameGetter('Visual_KPI_Indicator_Description')
            }, {
                name: 'Goal',
                kind: VisualDataRoleKind.Measure,
                displayName: data.createDisplayNameGetter('Role_DisplayName_Goal'),
                description: data.createDisplayNameGetter('Visual_KPI_Goal_Description')
            }, {
                name: 'TrendLine',
                kind: VisualDataRoleKind.Grouping,
                displayName: data.createDisplayNameGetter('Role_DisplayName_TrendLine'),
                description: data.createDisplayNameGetter('Visual_KPI_Trendline_Description')
            }],
        dataViewMappings: [{
            conditions: [
                { 'Indicator': { max: 1 }, 'TrendLine': { max: 1 }, 'Goal': { max: 1 } },
            ],
            categorical: {
                categories: {
                    for: { in: 'TrendLine' },
                    dataReductionAlgorithm: { top: {} }
                },
                values: {
                    select: [
                        { bind: { to: 'Indicator' } },
                        { bind: { to: 'Goal' } }
                    ]
                }
            },
        }],
        objects: {
            status: {
                displayName: data.createDisplayNameGetter('Visual_KPI_Status'),
                description: data.createDisplayNameGetter('Visual_KPI_Status'),
                properties: {
                    direction: {
                        displayName: data.createDisplayNameGetter('Visual_KPI_Direction'),
                        description: data.createDisplayNameGetter('Visual_KPI_Direction'),
                        type: { enumeration: kpiDirection.type }
                    }
                }
            },
            format: {
                displayName: data.createDisplayNameGetter('Visual_KPI_Format'),
                description: data.createDisplayNameGetter('Visual_KPI_Format'),
                properties: {
                    show: {
                        displayName: data.createDisplayNameGetter('Visual_Show'),
                        type: { bool: true }
                    },
                    kpiFormat: {
                        type: { text: true },
                        displayName: data.createDisplayNameGetter('TaskPane_Format'),
                    },
                }
            }
        },
    };
}