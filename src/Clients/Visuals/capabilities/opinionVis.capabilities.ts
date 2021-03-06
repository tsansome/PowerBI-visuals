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

module powerbi.visuals {
    export var OpinionVisCapabilities: VisualCapabilities = {
        dataRoles: [
            {
                name: 'Statement',
                displayName: 'Statement',
                kind: VisualDataRoleKind.Grouping,
            },
            {
                name: 'GroupAValues',
                displayName: 'Group A values',
                kind: VisualDataRoleKind.Measure,
            },
            {
                name: 'GroupADetails',
                displayName: 'Group A details',
                kind: VisualDataRoleKind.Measure,
            },
            {
                name: 'GroupBValues',
                displayName: 'Group B values',
                kind: VisualDataRoleKind.Measure,
            },
            {
                name: 'GroupBDetails',
                displayName: 'Group B details',
                kind: VisualDataRoleKind.Measure,
            }
        ],
        dataViewMappings: [
            {
                categorical: {
                    categories: {
                        for: { in: 'Statement' },
                        dataReductionAlgorithm: { sample: {} }
                    },
                    values: {
                        select: [
                            { bind: { to: 'GroupAValues' } },
                            { bind: { to: 'GroupBValues' } },
                            { bind: { to: 'GroupADetails' } },
                            { bind: { to: 'GroupBDetails' } }
                        ]
                    },
                    rowCount: { preferred: { min: 2 } }
                }
            }
        ]
    };
}