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
    export var nodeLinkCapabilities: VisualCapabilities = {
        dataRoles: [  
            {
                name: 'NodeFrom',
                displayName: 'Node From',
                kind: VisualDataRoleKind.Grouping,
            },          
            {
                name: 'NodeTo',
                displayName: 'Node To',
                kind: VisualDataRoleKind.Grouping,
            },
            {
                name: 'Values',
                displayName: 'Strength of relationship',
                kind: VisualDataRoleKind.Measure,
            }
        ],
        dataViewMappings: [
            {
                categorical: {
                    categories: {
                        for: { in: 'NodeFrom' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        group: {
                            by: 'NodeTo',
                            select: [{ for: { in: 'Values' } }],
                            dataReductionAlgorithm: { top: {} }
                        }
                    },
                    rowCount: { preferred: { min: 2 }, supported: { min: 0 } }
                },
            }
        ],
        objects: {
            nodeproperties: {
                displayName: "Node General",
                properties: {
                    defaultColor: {
                        description: "Specify the default colour for the nodes.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Default Color"
                    },
                    defaultRadius: {
                        description: "Specify the default size of a circle with its radius.",
                        type: { numeric: true },
                        displayName: "Default radius"
                    },
                    force: {
                        description: "The force between nodes. A negative value will repel nodes from each other. A positive value will attract the nodes together.",
                        type: { numeric: true },
                        displayName: "Force"
                    }
                }
            },
            nodelabels: {
                displayName: "Node Labels",
                properties: {
                    showLabels: {
                        description: "Specify true/false on whether to show labels on the nodes.",
                        type: { bool: true },
                        displayName: "Show labels"
                    },
                    fontSize: {
                        description: "Choose the font size for the labels on the nodes.",
                        type: { numeric: true },
                        displayName: "Font size"
                    }
                }
            },
            linkproperties: {
                displayName: "Link General",
                properties: {
                    highlightColor: {
                        description: "Specify the highlight colour for links.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Highlight Color"
                    },
                    defaultColor: {
                        description: "Specify the default colour for links.",
                        type: { fill: { solid: { color: true } } },
                        displayName: "Default Color"
                    },
                    linkDistance: {
                        description: "A links distance between each node.",
                        type: { numeric: true },
                        displayName: "Distance"
                    },
                    minThickness: {
                        description: "Minimum thickness of the link to scale from. Units are in pixels",
                        type: { numeric: true },
                        displayName: "Min (px) Thick"
                    },
                    maxThickness: {
                        description: "Maximum thickness of the link to scale from. Units are in pixels",
                        type: { numeric: true },
                        displayName: "Max (px) Thick"
                    }
                }
            },
            linkdatalabels: {
                displayName: "Link Data Labels",
                properties: {
                    showLabels: {
                        description: "Specify true/false on whether to show labels on each link.",
                        type: { bool: true },
                        displayName: "Show labels"
                    },
                    fontSize: {
                        description: "Choose the font size for the labels on each link.",
                        type: { numeric: true },
                        displayName: "Font size"
                    }
                }
            }
        }
    }
}