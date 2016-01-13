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
    import SelectionManager = utility.SelectionManager;
    
    module SortOrderEnum {
        export var ASCENDING: string = 'Ascending';
        export var DESCENDING: string = 'Descending';

        export var type: IEnumType = createEnumType([
            { value: ASCENDING, displayName: ASCENDING },
            { value: DESCENDING, displayName: DESCENDING }
        ]);
    }

    module GapLabelPositionEnum {
        export var AUTO: string = 'Auto';
        export var BELOW: string = 'Below';

        export var type: IEnumType = createEnumType([
            { value: AUTO, displayName: AUTO },
            { value: BELOW, displayName: BELOW }
        ]);
    }

    export class StatementResponseV2 {
        public identity: any;
        public statement: string;
        public GroupA: OpinionNodeV2;
        public GroupB: OpinionNodeV2;       
        public color: string; 
        public constructor(identity: any, statement: string, GroupA: OpinionNodeV2, GroupB: OpinionNodeV2, color: string) {
            this.identity = identity;
            this.statement = statement;
            this.GroupA = GroupA;
            this.GroupB = GroupB;            
            this.color = color;
        }

        public SwapNodes() {
            var tmp = this.GroupA;
            this.GroupA = this.GroupB;
            this.GroupB = tmp;
        }
    }

    export class OpinionNodeV2 {
        public groupLabel: string;
        public val: number;
        public valFormatted: string;
        public valDetails: string;
        public valDetailsLabel: string;
        public XpX: number;        
        public IsGroupA: boolean;
        public constructor(IsGroupA:boolean, GroupLabel: string, valAInput: number, valAFormatted: string, valADetails:string, valADetailsLabel:string, XpX: number) {
            this.groupLabel = GroupLabel;
            this.val = valAInput;
            this.XpX = XpX;
            this.valDetails = valADetails;
            this.valFormatted = valAFormatted;
            this.valDetailsLabel = valADetailsLabel;
            this.IsGroupA = IsGroupA;
        }
    }

    export class OpinionVisualMetaDataV2 {
        public valAGroupLabel: string;
        public valBGroupLabel: string;
        public valueGroupColor: string;
        public constructor(valAGroupLabelInput: string, valBGroupLabelInput, valueGroupColor: string) {
            this.valAGroupLabel = valAGroupLabelInput;
            this.valBGroupLabel = valBGroupLabelInput;
            this.valueGroupColor = valueGroupColor;
        }
    }

    export class OpinionFrameClass {
        public viewPortWidth: number;
        public viewPortHeight: number;

        public rowIncrementPx: number;
        public gapBetweenBarAndUnderneathLabel: number;
        public circleRadiusPx: number;
        public outerRightMargin: number;
        public outerTopMargin: number;
        public leftTextMarginPx: number;
        public leftMarginPx: number;
        public leftMarginRowContainerStartPx: number;
        public minValWidth: number;
        public maxValWidth: number;
        public maxWidthBarPx: number;      
        public xAxisScale: D3.Scale.LinearScale;
        public heightOfStatementLine: number;

        public ScrollBarXAxis: boolean;
     
        calcGapBars(widthOfViewPort: number, maxVal: number) {
            this.maxWidthBarPx = (widthOfViewPort - this.leftMarginPx) - (this.maxValWidth + this.outerRightMargin);

            this.ScrollBarXAxis = false;
            if (this.maxWidthBarPx < 150) {
                //in this case we need to turn on the x scroll bar
                this.maxWidthBarPx = 150;
                this.ScrollBarXAxis = true;
            }

            this.xAxisScale = d3.scale.linear()
                .domain([0, maxVal])
                .range([this.minValWidth + 15, this.maxWidthBarPx]);
        }
    }

    export class OpinionLegendProperties {
        public height: number;
        public valueAGroupLabel;
        public valueBGroupLabel;
    }

    export class OpinionHoverProperties {
        public height: number;
        public selectedText: D3.Selection;
    }

    export class GapAnalysis implements IVisual {

        public static capabilities: VisualCapabilities = {
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
                    displayName: 'Sort Statements By',
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
                        rowCount: { preferred: { min: 2 }, supported: { max: 20 } }
                    }
                },
                {
                    conditions: [
                        // NOTE: Ordering of the roles prefers to add measures to Y before Gradient.
                        { 'Statement': { max: 5 }, 'Groups': { max: 1 }, 'Value': { max: 1 }, 'SortBy': { max: 1 }, 'ExtraDetails': { max: 1 }}
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
                        rowCount: { preferred: { min: 2 }, supported: { max: 20 } }
                    }
                }
            ],
            objects: { 
                general: {
                    displayName: data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
                statementproperties: {
                    displayName: "Statement",
                    properties: {
                        defaultFontSize: {
                            description: "Specify the font size for the statement text.",
                            type: { formatting: { fontSize: true } },
                            displayName: "Text Size"
                        },
                        defaultFontColor: {
                            description: "Specify the font color for the statement text.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Default Font Color"
                        }
                    }
                },
                statementsortproperties: {
                    displayName: "Statement Sort",
                    properties: {
                        statementSortOrderDefault: {
                            description: "Specify the default sort order for the statements.",
                            type: { enumeration: SortOrderEnum.type },
                            displayName: "Order"
                        }
                    }
                },
                groupnodeproperties: {
                    displayName: "Group Circle",
                    properties: {
                        defaultColor: {
                            description: "Specify the font size for the statement text.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Color"
                        }
                    }
                },
                groupnodedatalabelproperties: {
                    displayName: "Group Circle Data Label",
                    properties: {
                        showLabels: {
                            description: "Specify true/false on whether to show labels on the nodes.",
                            type: { bool: true },
                            displayName: "Show labels"
                        },
                        defaultColor: {
                            description: "Specify the default color for the nodes.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Color"
                        },
                        defaultFontSize: {
                            description: "Specify the font size for the data label on a node.",
                            type: { formatting: { fontSize: true } },
                            displayName: "Text Size"
                        }
                    }
                },
                groupnodelegendproperties: {
                    displayName: "Group Legend",
                    properties: {
                        defaultFontSize: {
                            description: "Specify the font size for the labels in the legend.",
                            type: { formatting: { fontSize: true } },
                            displayName: "Text Size"
                        },
                        defaultRadius: {
                            description: "Specify the radius of the circles in the legend.",
                            type: { numeric: true },
                            displayName: "Radius"
                        }
                    }
                },
                gapbarproperties: {
                    displayName: "Gap Bar",
                    properties: {
                        defaultColor: {
                            description: "Specify the default color for the gap bar.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Color"
                        },
                        defaultHeight: {
                            description: "Specifiy the size of a bar (pt).",
                            type: { numeric: true },
                            displayName: "Height"
                        },
                        colorByCategory: {
                            description: "Color the bars by each statement",
                            type: { bool: true },
                            displayName: "Color by Statement"
                        }
                        //fill: {
                        //    displayName: "Color for the bars",
                        //    type: { fill: { solid: { color: true } } }
                        //}
                    }
                },
                gaplabelproperties: {
                    displayName: "Gap Label",
                    properties: {
                        defaultPosition: {
                            description: "Specify the default positioning for the labels on the bars. (Auto / Below)",
                            type: { enumeration: GapLabelPositionEnum.type },
                            displayName: "Position (Auto / Below)"
                        },
                        defaultColorOnBar: {
                            description: "Specify the default color for the text label on the gap bar.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Color On Bar"
                        },
                        defaultColorBelowBar: {
                            description: "Specify the default color for the text label below the gap bar.",
                            type: { fill: { solid: { color: true } } },
                            displayName: "Color Below Bar"
                        },
                        defaultFontSize: {
                            description: "Specify the font size for the gap label.",
                            type: { formatting: { fontSize: true } },
                            displayName: "Text Size"
                        }
                    }
                }
            },
            drilldown: {
                roles: ['Statement']
            }
        };

        private OpinionVisProperties = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'formatString' },
            }
        };
        
        private dataView: DataView[];
        private selectionManager: SelectionManager;
        private opinionContainerRef: D3.Selection;
        private opinionContainerRefSVG: D3.Selection;
        private legendAndHoverContainerRef: D3.Selection;
        private legendAndHoverContainerRefSVG: D3.Selection;
        private opinionSeriesContainerRef: D3.Selection;
        private opinionSeriesContainerRefSVG: D3.Selection;
        private opinionRowsContainerRef: D3.Selection;
        private opinionRowsContainerRefSVG: D3.Selection;

        private circleNodesCollectionD3: any[];
        private rectNodesCollectionD3: any[];
        private rectNodesCollectionClasses: StatementResponseV2[];

        private tooltip;

        private fStrA;
        private fStrB;
        private fStrC;
        private fStrD;

        private valAIndex;
        private valBIndex;

        private minVal;
        private maxVal;

        private static defaultHeaderMoreDetailsLabel = "Hover on a circle below to focus in on that group";

        private colors: IDataColorPalette;

        private interactivityService: InteractivityOptions;
        
        public init(options: VisualInitOptions): void {
            this.selectionManager = new SelectionManager({ hostServices: options.host });
            
            var root = d3.select(options.element.get(0));                
            this.legendAndHoverContainerRef = root.append("div").attr("id", "LegendAndHoverContainer");
            this.legendAndHoverContainerRefSVG = this.legendAndHoverContainerRef.append('svg');
            this.opinionContainerRef = root.append("div").attr("id", "OpinionNodeContainer").style("overflow", "hidden");
            this.opinionContainerRefSVG = this.opinionContainerRef.append("svg").attr("height",5);

            this.opinionSeriesContainerRef = this.opinionContainerRef.append("div").attr("id", "OpinionNodeSeries");
            this.opinionSeriesContainerRef.style("display", "inline-block");
            this.opinionSeriesContainerRefSVG = this.opinionSeriesContainerRef.append("svg");
            this.opinionRowsContainerRef = this.opinionContainerRef.append("div").attr("id", "OpinionNodeRows");
            this.opinionRowsContainerRef.style("display", "inline-block");
            this.opinionRowsContainerRefSVG = this.opinionRowsContainerRef.append("svg");

            this.colors = options.style.colorPalette.dataColors;

            this.interactivityService = options.interactivity;            
        }

        public static converter(dataView: DataView[]): DataViewCategorical {
            if (dataView === undefined) {
                return null;
            }
            if (dataView.length > 1 && dataView[1].categorical !== null && dataView[1].categorical.values.length !== 0) {                
                var cate = dataView[1].categorical;
                //we need to match the old indexes against the original matrix
                var oldVals = _.map(cate.values[0].values, (dV, idx) => {
                    var oldKey = _.findIndex(dataView[0].categorical.categories[0].values, function (d: string) {
                        return cate.categories[0].values[idx] === d;
                    });
                    return {
                        vv: dV,
                        oldIndex: oldKey
                    };
                });
                var multiplier = -1;
                //we need to look at the sort property to see whether we should do ascending or descending
                var sortOrder = GapAnalysis.statementSortOrderDefault;
                if (dataView) {
                    var objects = dataView[0].metadata.objects;
                    if (objects) {
                        var groupProperty = objects["statementsortproperties"];
                        if (groupProperty) {
                            var object = <string>groupProperty["statementSortOrderDefault"];
                            if (object !== undefined)
                                sortOrder = object;
                        }
                    }
                }
                if (sortOrder === SortOrderEnum.ASCENDING) {
                    multiplier = 1;
                }
                oldVals = _.sortBy(oldVals, (d) => {
                    return d.vv * multiplier;
                });        
                
                var dV = dataView[0].categorical;
                //now reorder the default values not the extra details
                var categories: any[] = [];
                var valuesA: any[] = [];
                var valuesB: any[] = [];
                for (var i = 0; i < oldVals.length; i++) {
                    var cc = oldVals[i];
                    categories.push(dV.categories[0].values[cc.oldIndex]);
                    valuesA.push(dV.values[0].values[cc.oldIndex]);
                    valuesB.push(dV.values[1].values[cc.oldIndex]);
                }
                dataView[0].categorical.categories[0].values = categories;
                dataView[0].categorical.values[0].values = valuesA;
                dataView[0].categorical.values[1].values = valuesB;
                //just check if the extra details has been brought in
                if (dataView[0].categorical.values.length > 2) {
                    var valuesADetails: any[] = [];
                    var valuesBDetails: any[] = [];
                    for (var i = 0; i < oldVals.length; i++) {
                        var cc = oldVals[i];
                        valuesADetails.push(dV.values[2].values[cc.oldIndex]);
                        valuesBDetails.push(dV.values[3].values[cc.oldIndex]);
                    }
                    dataView[0].categorical.values[2].values = valuesADetails;
                    dataView[0].categorical.values[3].values = valuesBDetails;
                }
                
            }
            if (dataView.length > 0) {
                return dataView[0].categorical;
            } else {
                return null;
            }
        }

        public onClearSelection(): void {
            if (this.interactivityService) {
                d3.selectAll(this.rectNodesCollectionD3).style("opacity", 1);
            }
        }        

        public deriveWindowToDrawIn(dv: DataViewCategorical, heighOfViewPort: number, widthOfViewPort: number) {
            var fc = new OpinionFrameClass();            
            //firstly we need to draw a lot of things and test their width

            //figure out the max value out of all the data points
            var maxValGroupA = _.max(dv.values[this.valAIndex].values);
            var maxValGroupB = _.max(dv.values[this.valBIndex].values);
            this.maxVal = _.max([maxValGroupA, maxValGroupB]);

            var minValGroupA = _.min(dv.values[this.valAIndex].values);
            var minValGroupB = _.min(dv.values[this.valBIndex].values);
            this.minVal = _.min([minValGroupA, minValGroupB]); 

            //we are going to draw the largest value for 
            //the maximum datapoint value
            fc.maxValWidth = 0;
            var maxValHeight = 0;
            var maxValStr = this.opinionContainerRefSVG.append("text")
                .data([this.maxVal])
                .text(valueFormatter.format(this.maxVal, this.fStrA))
                .style("font-size", this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", GapAnalysis.groupNodeDataLabelDefaultFontSize).toString() + "pt")
                .each(function (d) {
                    fc.maxValWidth = this.getBBox().width;
                    maxValHeight = this.getBBox().height;
                });

            maxValStr.remove();

            //the minimum datapoint value
            fc.minValWidth = 0;
            var minValHeight = 0;
            var minValStr = this.opinionContainerRefSVG.append("text")
                .data([this.maxVal])
                .text(valueFormatter.format(this.minVal, this.fStrA))
                .style("font-size", this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", GapAnalysis.groupNodeDataLabelDefaultFontSize).toString() + "pt")
                .each(function (d) {
                    fc.minValWidth = this.getBBox().width;
                    minValHeight = 0;
                });

            minValStr.remove();

            //get an idea of a value under the bars size
            var gapBarUnderTextHeight = 0;
            var gapBarUnderTextStr = this.opinionContainerRefSVG.append("text")
                .data([this.maxVal])
                .text(valueFormatter.format(this.maxVal, this.fStrA))
                .style("font-size", this.GetProperty(this.dataView[0], "gaplabelproperties", "defaultFontSize", GapAnalysis.gapLabelDefaultFontSize).toString() + "pt")
                .each(function (d) {
                    gapBarUnderTextHeight = this.getBBox().height;
                });

            gapBarUnderTextStr.remove();

            var statementFontSize = this.GetProperty(this.dataView[0], "statementproperties", "defaultFontSize", GapAnalysis.statementDefaultFontSize).toString() + "pt";
            //longest group label text
            var longestSeriesElem: string = _.max(dv.categories[0].values, function (d: string) {
                return d.length;
            });
            var longestSeriesElemWidth = 0;
            var longestSeriesElemHeight = 0;
            var longestSeriesElemDraw = this.opinionContainerRefSVG.append("text")
                .data([longestSeriesElem])
                .style("font-size", statementFontSize)
                .style("font-family", "Segoe UI")
                .text(longestSeriesElem)
                .each(function (d) {
                    longestSeriesElemWidth = this.getBBox().width;
                    longestSeriesElemHeight = this.getBBox().height;
                });
            longestSeriesElemDraw.remove();
                      
            //now we set up the default frame   
            fc.viewPortWidth = widthOfViewPort;
            fc.viewPortHeight = heighOfViewPort;
                     
            fc.rowIncrementPx = 30;
            fc.circleRadiusPx = this.GetProperty(this.dataView[0], "gapbarproperties", "defaultHeight", GapAnalysis.gapBarHeight) / 2;
            fc.gapBetweenBarAndUnderneathLabel = 3;

            //we need to define the total height of a statmen record
            var option1 = longestSeriesElemHeight + 10; //10 either side for a buffer
            var option2 = (maxValHeight + 5) + (gapBarUnderTextHeight + fc.gapBetweenBarAndUnderneathLabel) + (fc.circleRadiusPx * 2) + 10;

            fc.heightOfStatementLine = option1 > option2 ? option1: option2;

            fc.outerRightMargin = 15;
            
            fc.outerTopMargin = 8;

            fc.leftTextMarginPx = 10;
            fc.leftMarginRowContainerStartPx = fc.leftTextMarginPx + longestSeriesElemWidth + 10;
            fc.leftMarginPx = fc.leftMarginRowContainerStartPx + fc.minValWidth;

            fc.calcGapBars(widthOfViewPort, this.maxVal);
            return fc;
        }

        private setupFormattersAndIndexers(dv: DataViewCategorical) {
            //now we need to declare the indexes
            this.valAIndex = 0;
            this.valBIndex = 1;
            //extract the values and strings
            if (dv.values.length > 2) {
                this.valBIndex = 2;
            }

            //get our formatters for using later
            this.fStrA = valueFormatter.getFormatString(dv.values[this.valAIndex].source, this.OpinionVisProperties.general.formatString);
            this.fStrB = valueFormatter.getFormatString(dv.values[this.valBIndex].source, this.OpinionVisProperties.general.formatString);

            this.fStrC = null;
            this.fStrD = null;
            //set the formatter if they put in the details
            if (dv.values.length > 2) {
                this.fStrC = valueFormatter.getFormatString(dv.values[1].source, this.OpinionVisProperties.general.formatString);
                this.fStrD = valueFormatter.getFormatString(dv.values[3].source, this.OpinionVisProperties.general.formatString);
            }
        }

        private extractStatementRecord(dv: DataViewCategorical, frame: OpinionFrameClass, mtdt: OpinionVisualMetaDataV2, idx: number): StatementResponseV2 {
            var statementStr: string = "";
            var valA: number = 0;
            var valB: number = 0;
            var valADetails = 0;
            var valBDetails = 0;
            var valADetailsLabel = null;
            var valBDetailsLabel = null;

            //extract the values and strings
            if (dv.values.length > 2) {
                //in this case we know that the value b index will actually be 3 not 1
                valADetails = dv.values[1].values[idx];
                valADetailsLabel = dv.values[1].source.displayName;
                valBDetails = dv.values[3].values[idx];
                valBDetailsLabel = dv.values[3].source.displayName;
            }

            var statementStr: string = dv.categories[0].values[idx];
            var valA: number = dv.values[this.valAIndex].values[idx];
            var valB: number = dv.values[this.valBIndex].values[idx];

            var valAStr = valueFormatter.format(valA, this.fStrA);
            var valBStr = valueFormatter.format(valB, this.fStrB);

            var valADetailsStr = null;
            var valBDetailsStr = null;
            if (valADetails !== null) {
                valADetailsStr = valueFormatter.format(valADetails, this.fStrC);
            }
            if (valBDetails !== null) {
                valBDetailsStr = valueFormatter.format(valBDetails, this.fStrD);
            }

            //we're going to set up the two nodes and work out their relative positions
            var LeftCircleX = frame.xAxisScale(valA);
            var RightCircleX = frame.xAxisScale(valB);

            var LeftNode = new OpinionNodeV2(true, mtdt.valAGroupLabel, valA, valAStr, valADetailsStr, valADetailsLabel, LeftCircleX);
            var RightNode = new OpinionNodeV2(false, mtdt.valBGroupLabel, valB, valBStr, valBDetailsStr, valBDetailsLabel, RightCircleX);
                    
            //get the id and the color for the category
            var id = SelectionIdBuilder
                .builder()
                .withCategory(dv.categories[0], idx)
                .createSelectionId();
            var color = this.colors.getColorByIndex(idx);
            var dd = new StatementResponseV2(id, statementStr, LeftNode, RightNode, color.value);
                    
            //if its greater just switch it
            if (valA > valB) {
                dd.SwapNodes();
            }                   

            return dd;
        }

        private drawLegend(frame: OpinionFrameClass, mtdt: OpinionVisualMetaDataV2): OpinionLegendProperties {
            var legendProps = new OpinionLegendProperties();

            var gapBetweenTwoGroupText = 15;
            var paddingBetweenTextAndCircle = 3;
            
            var initialOffset = 15;
            var offset = initialOffset;

            var circleRadiusPx = this.GetProperty(this.dataView[0], "groupnodelegendproperties", "defaultRadius", GapAnalysis.groupNodeLegendDefaultRadius);
            var fontSize = (this.GetProperty(this.dataView[0], "groupnodelegendproperties", "defaultFontSize", GapAnalysis.groupNodeLegendDefaultFontSize)).toString() + "pt";

            var groupACirclePosition = offset;
            var groupACircle = this.legendAndHoverContainerRefSVG.append("circle")
                .attr("cx", groupACirclePosition)
                .attr("cy", frame.outerTopMargin + circleRadiusPx)
                .attr("r", circleRadiusPx)
                .style("fill", "white")
                .attr("stroke", mtdt.valueGroupColor);
            
            offset += (circleRadiusPx + paddingBetweenTextAndCircle);
            
            var groupALabelPosition = offset;
            var width = 0;
            var legendTextHeight = 0;
            legendProps.valueAGroupLabel = this.legendAndHoverContainerRefSVG.append("text")
                .data([mtdt])
                .attr("dx", groupALabelPosition)
                .attr("dy", 1)
                .style("font-size", fontSize)
                .text(mtdt.valAGroupLabel)
                .each(function (d) {
                    d.width = this.getBBox().width;
                    width = d.width;
                    d.height = this.getBBox().height;
                    legendTextHeight = d.height;
                })
                .attr("dy", function (d) {
                    //we need to put it in the center
                    var centreOfCircle = frame.outerTopMargin + circleRadiusPx;
                    return centreOfCircle + (d.height / 4);
                });

            offset += (width + gapBetweenTwoGroupText + circleRadiusPx);

            var groupBCirclePosition = offset;
            var groupBCircle = this.legendAndHoverContainerRefSVG.append("circle")
                .attr("cx", groupBCirclePosition)
                .attr("cy", frame.outerTopMargin + circleRadiusPx)
                .attr("r", circleRadiusPx)
                .style("fill", mtdt.valueGroupColor);

            offset += (circleRadiusPx + paddingBetweenTextAndCircle);

            var groupBLabelPosition = offset;
            legendProps.valueBGroupLabel = this.legendAndHoverContainerRefSVG.append("text")
                .data([mtdt])
                .attr("dx", groupBLabelPosition)
                .attr("dy", 1)
                .style("font-size", fontSize)
                .text(mtdt.valBGroupLabel)
                .each(function (d) {
                    d.width = this.getBBox().width;
                    width = d.width;
                    d.height = this.getBBox().height;
                })
                .attr("dy", function (d) {
                    //we need to put it in the center
                    var centreOfCircle = frame.outerTopMargin + circleRadiusPx;
                    return centreOfCircle + (d.height / 4);
                });

            offset += (width);

            //now lastly i want to center the legend
            //work out its total width
            var totalWidth = offset - initialOffset;
            //now we are going to translate all the svg elements
            var startIngPointX = (frame.viewPortWidth / 2) - (totalWidth / 2);
            var translateX = startIngPointX - initialOffset;
            //now do the translation
            groupACircle.attr("cx", groupACirclePosition + translateX);
            legendProps.valueAGroupLabel.attr("dx", groupALabelPosition + translateX);
            groupBCircle.attr("cx", groupBCirclePosition + translateX);
            legendProps.valueBGroupLabel.attr("dx", groupBLabelPosition + translateX);

            var option1 = legendTextHeight + 3;
            var option2 = (circleRadiusPx * 2) + 3;
            legendProps.height = option1 > option2 ? option1 : option2;
            
            return legendProps;     
        }

        private drawHoverInteractiveArea(frame: OpinionFrameClass, mtdt: OpinionVisualMetaDataV2, legendProperties: OpinionLegendProperties): OpinionHoverProperties {
            var hp = new OpinionHoverProperties();
            
            //lets put the hover legend content in
            var selectedTextHeight = 0;
            hp.selectedText = this.legendAndHoverContainerRefSVG.append("text")
                .attr("dx", frame.leftTextMarginPx)
                .attr("dy", frame.outerTopMargin + legendProperties.height + 15 + 3)
                .text(GapAnalysis.defaultHeaderMoreDetailsLabel)
                .style("font-size", "10pt");
            
            this.wrap(hp.selectedText, frame.viewPortWidth - frame.outerRightMargin, frame.leftTextMarginPx);

            hp.selectedText.each(function (d) {
                selectedTextHeight = this.getBBox().height;
            });

            hp.height = (selectedTextHeight + 10) + 3;
            
            //now we draw the line seperating the legend from the visual
            this.opinionContainerRefSVG.append("line")
                .attr("x1", frame.leftTextMarginPx)
                .attr("y1", 0)
                .attr("x2", frame.leftTextMarginPx + frame.leftMarginPx + frame.maxWidthBarPx)
                .attr("y2", 0)
                .attr("stroke-width", 1)
                .attr("stroke", mtdt.valueGroupColor); 

            //now we put the vertical tooltip
            this.tooltip = this.opinionRowsContainerRefSVG.append("line")
                .attr("x1", 30)
                .attr("y1", 0)
                .attr("x2", 30)
                .attr("y2", 5)
                .attr("stroke-width", 1)
                .attr("stroke", mtdt.valueGroupColor)
                .style("visibility", "hidden");     
            
            return hp;    
        }

        private drawGroup(frame: OpinionFrameClass, mtdt: OpinionVisualMetaDataV2, Node: OpinionNodeV2, CentreYPx: number, isOnLeftSide: boolean) {
            var CircleXOffset = Node.XpX;

            //do the circle then the text                
            var NodeElem = this.opinionRowsContainerRefSVG.append("circle")
                .data([Node])
                .attr("cx", CircleXOffset)
                .attr("cy", CentreYPx)
                .attr("r", frame.circleRadiusPx)
                .style("fill", function (d) {
                    if (Node.IsGroupA) {
                        return "white";   
                    }
                    return mtdt.valueGroupColor;
                })
                .style("stroke", mtdt.valueGroupColor);

            this.circleNodesCollectionD3.push(NodeElem[0][0]);

            var nodeLabelFontColor = this.GetPropertyColor(this.dataView[0], "groupnodedatalabelproperties", "defaultColor", GapAnalysis.groupNodeDataLabelDefaultColor).solid.color;
            var nodeLabelDefaultFontSize = this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", GapAnalysis.groupNodeDataLabelDefaultFontSize).toString() + "pt";

            if (this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "showLabels", GapAnalysis.groupNodeDataLabelShow)) {
                var LeftDLabel = this.opinionRowsContainerRefSVG.append("text")
                    .data([Node])
                    .attr("dx", CircleXOffset)
                    .attr("dy", CentreYPx)
                    .text(Node.valFormatted)
                    .style("font-size", nodeLabelDefaultFontSize)
                    .style("font-family", "wf_standard-font,helvetica,arial,sans-serif")
                    .style("fill", nodeLabelFontColor)
                    .each(function (d) {
                        d.width = this.getBBox().width;
                    });

                if (isOnLeftSide) {
                    //now we need to adjust the x position of the label basedo n whether its the left or right node
                    LeftDLabel.attr("dx", function (d) {
                        return CircleXOffset - d.width - frame.circleRadiusPx - 3;
                    });
                }
                else {
                    //now we need to adjust the x position of the label basedo n whether its the left or right node
                    LeftDLabel.attr("dx", function (d) {
                        return CircleXOffset + frame.circleRadiusPx + 3;
                    });
                }
            }
        }

        private drawGap(frame: OpinionFrameClass, mtdt: OpinionVisualMetaDataV2, dd: StatementResponseV2, CentreYPx: number) {
            var rectWidth = dd.GroupB.XpX - dd.GroupA.XpX;
            var gap = dd.GroupB.val - dd.GroupA.val;
            var gapStr = valueFormatter.format(gap, this.fStrA);

            var gapBColor = this.GetPropertyColor(this.dataView[0], "gapbarproperties", "defaultColor", GapAnalysis.gapBarDefaultColor).solid.color;
            if (this.GetProperty(this.dataView[0], "gapbarproperties", "colorByCategory", GapAnalysis.statementColorByStatement) === true) {
                gapBColor = dd.color;
            }
            var gapBFontOnBar = this.GetPropertyColor(this.dataView[0], "gaplabelproperties", "defaultColorOnBar", GapAnalysis.gapLabelDefaultColorOnBar).solid.color;
            var gapBFontBelowBar = this.GetPropertyColor(this.dataView[0], "gaplabelproperties", "defaultColorBelowBar", GapAnalysis.gapLabelDefaultColorBelowBar).solid.color;

            var rect = this.opinionRowsContainerRefSVG.append("rect")
                .data([dd])
                .attr("y", CentreYPx - frame.circleRadiusPx)
                .attr("x", dd.GroupA.XpX)
                .attr("width", rectWidth)
                .attr("height", (frame.circleRadiusPx * 2))
                .style("fill", gapBColor);

            this.rectNodesCollectionD3.push(rect[0][0]);

            var midpointPx = dd.GroupA.XpX + (rectWidth / 2);

            var rectDLabel = this.opinionRowsContainerRefSVG.append("text")
                .data([dd])
                .attr("dx", midpointPx)
                .attr("dy", CentreYPx)
                .text(gapStr)
                .style("font-size", this.GetProperty(this.dataView[0], "gaplabelproperties", "defaultFontSize", GapAnalysis.gapLabelDefaultFontSize).toString() + "pt")
                .style("font-family", "wf_standard-font,helvetica,arial,sans-serif")
                .each(function (d) {
                    d.width = this.getBBox().width;
                    d.height = this.getBBox().height;
                });

            rectDLabel.attr("dx", function (d) {
                return midpointPx - (d.width / 2);
            });

            //if the width of the text is larger than the rectangle
            //we need to push it underneath the rectangle
            var rectWidthWithRadius = rectWidth - (frame.circleRadiusPx * 2);

            var defaultPosChosen = this.GetProperty(this.dataView[0], "gaplabelproperties", "defaultPosition", GapAnalysis.gapLabelDefaultPosition);

            rectDLabel.attr("dy", function (d) {
                var rectStart = (CentreYPx - frame.circleRadiusPx);
                var rectHeight = (frame.circleRadiusPx * 2);
                if (defaultPosChosen === GapLabelPositionEnum.BELOW || rectWidthWithRadius < d.width || d.height > (frame.circleRadiusPx*2)) {
                    return rectStart + rectHeight + (d.height) + frame.gapBetweenBarAndUnderneathLabel;
                }
                var rectMidPointY = rectStart + (rectHeight / 2);
                return rectMidPointY + (d.height / 2) - 3;
            });

            rectDLabel.style("fill", function (d) {
                if (defaultPosChosen === GapLabelPositionEnum.BELOW || rectWidthWithRadius < d.width || d.height > (frame.circleRadiusPx * 2)) {
                    return gapBFontBelowBar;
                } else {
                    return gapBFontOnBar;
                }
            });
        }

        private drawStatementLabel(frame: OpinionFrameClass, mtdt: OpinionVisualMetaDataV2, dd: StatementResponseV2, YPosition: number) {
            var statementLabel = this.opinionSeriesContainerRefSVG.append("text")
                .data([dd])
                .attr("dx", frame.leftTextMarginPx)
                .attr("dy", YPosition)
                .style("fill", this.GetPropertyColor(this.dataView[0], "statementproperties", "defaultFontColor", GapAnalysis.statementDefaultFontColor).solid.color)
                .style("font-size", this.GetProperty(this.dataView[0], "statementproperties", "defaultFontSize", GapAnalysis.statementDefaultFontSize).toString() + "pt")
                .style("font-family", "'Segoe UI',wf_segoe-ui_normal,helvetica,arial,sans-serif")
                .text(dd.statement)
                .each(function (d) {
                    d.height = this.getBBox().height;
                });                 

            //we just need to recenter the text based on its size
            statementLabel.attr("dy", function (d) {
                return YPosition + (d.height / 4);
            });
        }

        private drawDivider(frame: OpinionFrameClass, YPosition: number) {
            this.opinionRowsContainerRefSVG.append("line")
                .attr("x1", frame.leftTextMarginPx)
                .attr("y1", YPosition)
                .attr("x2", frame.maxWidthBarPx)
                .attr("y2", YPosition)
                .attr("stroke-width", 2)
                .style("stroke-dasharray", ("3, 3"))  // <== This line here!!
                .attr("stroke", "grey");
        }

        private activateClickOnGapBars() {
            var self = this;
            //now we need to do the click animation
            var percentUnhighlighted = 0.5;
            var percentHighlighted = 1;
            d3.selectAll(this.rectNodesCollectionD3).on("click", function (d: StatementResponseV2) {
                //in the case that nothing is selected, just select the selcted one
                if (self.selectionManager.getSelectionIds().length === 0) {
                    self.selectionManager.select(d.identity, d3.event.ctrlKey).then(ids => {
                        d3.selectAll(self.rectNodesCollectionD3).style("opacity", percentUnhighlighted);
                        d3.select(this).style("opacity", percentHighlighted);
                    });
                }
                //in the case that there's only one selected id and it's the one clicked
                //we just completely clear the selection and go to the default state
                else if (self.selectionManager.getSelectionIds().length === 1 && self.selectionManager.getSelectionIds()[0] === d.identity) {
                    self.selectionManager.clear();
                    d3.selectAll(self.rectNodesCollectionD3).style("opacity", percentHighlighted);
                }
                else {
                    //Check to see if the newly selected was previously clicked
                    if (_.contains(self.selectionManager.getSelectionIds(), d.identity)) {                        
                        //if they click cntrl key we want to unhighlight it and deselect it
                        if (d3.event.ctrlKey) {
                            self.selectionManager.select(d.identity, d3.event.ctrlKey).then(ids => {
                                d3.select(this).style("opacity", percentUnhighlighted);
                            });
                        }
                        //else we want to clear every selection and just select this one
                        else {
                            self.selectionManager.clear();
                            self.selectionManager.select(d.identity, d3.event.ctrlKey).then(ids => {
                                d3.selectAll(self.rectNodesCollectionD3).style("opacity", percentUnhighlighted);
                                d3.select(this).style("opacity", percentHighlighted);
                            });
                        }
                    }
                    //it hasn't been previously selected
                    else {
                        //if they click cntrl key we want to add it to the selection
                        if (d3.event.ctrlKey) {
                            self.selectionManager.select(d.identity, d3.event.ctrlKey).then(ids => {
                                d3.select(this).style("opacity", percentHighlighted);
                            });
                        }
                        //else we want it to clear every selection just select this one
                        else {
                            self.selectionManager.clear();
                            self.selectionManager.select(d.identity, d3.event.ctrlKey).then(ids => {
                                d3.selectAll(self.rectNodesCollectionD3).style("opacity", percentUnhighlighted);
                                d3.select(this).style("opacity", percentHighlighted);
                            });
                        }
                    }
                }
            });
        }

        private activateHoverOnGroups(frame: OpinionFrameClass,mtdt: OpinionVisualMetaDataV2, lgProps: OpinionLegendProperties, hp: OpinionHoverProperties, valMeasureName: string) {
            var self = this;
            //our tool tip content and animations triggered
            d3.selectAll(this.circleNodesCollectionD3).on("mouseover", function () {
                return self.tooltip.style("visibility", "visible");
            }).on("mousemove", function (d: OpinionNodeV2) {
                if (d.IsGroupA) {
                    lgProps.valueAGroupLabel.style("text-decoration", "underline");
                    lgProps.valueAGroupLabel.style("font-weight", "bold");
                } else {
                    lgProps.valueBGroupLabel.style("text-decoration", "underline");
                    lgProps.valueBGroupLabel.style("font-weight", "bold");
                }
                var strToDisplay = valMeasureName + ": " + d.valFormatted;
                if (d.valDetails !== null && d.valDetailsLabel !== null) {
                    strToDisplay += " | " + d.valDetailsLabel + ": " + d.valDetails;
                }
                hp.selectedText.text(strToDisplay).call(self.wrap, frame.viewPortWidth - frame.outerRightMargin, frame.leftTextMarginPx);
                return self.tooltip.attr("x1", d.XpX).attr("x2", d.XpX);
            }).on("mouseout", function (d) {
                lgProps.valueAGroupLabel.style("text-decoration", "");
                lgProps.valueBGroupLabel.style("text-decoration", "");
                lgProps.valueAGroupLabel.style("font-weight", "");
                lgProps.valueBGroupLabel.style("font-weight", "");
                hp.selectedText.text(GapAnalysis.defaultHeaderMoreDetailsLabel).call(self.wrap, frame.viewPortWidth - frame.outerRightMargin, frame.leftTextMarginPx);
                return self.tooltip.style("visibility", "hidden");
            });
        }

        private activateYScrollBar(frame: OpinionFrameClass, endingHeight: number, widthOfViewPort: number) {
            //update the frames max width bar
            frame.outerRightMargin = 45;
            frame.calcGapBars(widthOfViewPort, this.maxVal);

            this.opinionContainerRef.style("overflow-y", "scroll");
            this.opinionRowsContainerRefSVG.attr("height", endingHeight + frame.heightOfStatementLine); 
            this.opinionRowsContainerRefSVG.attr("height", endingHeight + frame.heightOfStatementLine);
        }

        private disableYScrollBar() {
            this.opinionContainerRef.style("overflow-y", "hidden");
        }

        private activateXScrollBar() {
            this.opinionRowsContainerRef.attr("width", 150);
            this.opinionRowsContainerRef.style("overflow-x", "scroll");
        }

        private disableXScrollBar() {
            this.opinionRowsContainerRef.style("overflow-x", "hidden");
        }

        private wrap(text, width, xoffset) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy),
                    previousHeight = 0,
                    offSetHeight = 0;
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan[0][0].getComputedTextLength() > width) {
                        offSetHeight += previousHeight;
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", xoffset).attr("y", y).attr("dy", offSetHeight).text(word);
                    }
                    previousHeight = 15;
                }
        });
    }
        
        public update(options: VisualUpdateOptions) {
            var dataView = this.dataView = options.dataViews;
            var viewport = options.viewport;
            var dataPoints = GapAnalysis.converter(dataView);  
            
            //should clear the pallette first
            this.opinionContainerRefSVG.selectAll("*").remove();
            this.legendAndHoverContainerRefSVG.selectAll("*").remove();
            this.opinionRowsContainerRefSVG.selectAll("*").remove();
            this.opinionSeriesContainerRefSVG.selectAll("*").remove();

            //if they've only put 1 of the fields in
            //don't render the visual
            if (options.dataViews.length > 0 && dataPoints.values.length > 1) {
                this.circleNodesCollectionD3 = [];
                this.rectNodesCollectionD3 = [];
                this.rectNodesCollectionClasses = [];
                //prep the visual area

                //set up our indexes & formatters
                this.setupFormattersAndIndexers(dataPoints);

                //now setup the frame to draw in
                var frame = this.deriveWindowToDrawIn(dataPoints, viewport.height, viewport.width);    

                var valueGroupColor = this.GetPropertyColor(this.dataView[0], "groupnodeproperties", "defaultColor", GapAnalysis.groupNodeDefaultColor).solid.color;
                var mtdt = new OpinionVisualMetaDataV2(dataPoints.values[this.valAIndex].source.groupName, dataPoints.values[this.valBIndex].source.groupName, valueGroupColor);

                var legendArea = this.drawLegend(frame, mtdt);                                
                var hoverArea = this.drawHoverInteractiveArea(frame, mtdt, legendArea);           

                var startYPy = 0;
              
                var valMeasureName: string = dataPoints.values[0].source.displayName;

                //set up the size of the containers
                var legendAndHoverContainerHeight = frame.outerTopMargin + legendArea.height + hoverArea.height;
                this.legendAndHoverContainerRefSVG.attr({
                    'height': legendAndHoverContainerHeight,
                    'width': viewport.width
                });              

                var opinionContainerHeight = viewport.height - legendAndHoverContainerHeight;
                this.opinionContainerRefSVG.attr({
                    'width': viewport.width
                });
                
                //setup the container with the height
                this.legendAndHoverContainerRef.style("height", legendAndHoverContainerHeight + "px");
                this.opinionContainerRef.style("height", opinionContainerHeight + "px").style("overflow", "hidden");
                                  
                //we need to figure out if we need scroll bars or not
                var endingY = (frame.heightOfStatementLine * (dataPoints.categories[0].values.length));
                if (endingY > opinionContainerHeight) {
                    this.activateYScrollBar(frame, endingY, viewport.width);
                }
                else {
                    this.disableYScrollBar();
                }

                this.opinionSeriesContainerRef.style("width", frame.leftMarginRowContainerStartPx + "px");
                this.opinionRowsContainerRef.style("width", (frame.viewPortWidth - frame.leftMarginRowContainerStartPx - frame.outerRightMargin) + "px");

                var maxXNode = 0;

                //now lets walk through the values
                for (var i = 0; i < dataPoints.categories[0].values.length; i++) {
                    //extract the record from the categorical data view
                    var dd = this.extractStatementRecord(dataPoints, frame, mtdt, i);
                    //we're just going to keep track of the furthest most out X
                    if (dd.GroupB.XpX > maxXNode) {
                        maxXNode = dd.GroupB.XpX;
                    }
                    var yPositionStatement = startYPy + (frame.heightOfStatementLine * 0.4);
                    var yPositionVisualElem = startYPy + (frame.heightOfStatementLine * 0.4);
                    //now we want to put the text on the page
                    this.drawStatementLabel(frame, mtdt, dd, yPositionStatement);
                    //draw the the gap
                    this.drawGap(frame, mtdt, dd, yPositionVisualElem);
                    //draw the two circles
                    this.drawGroup(frame, mtdt, dd.GroupA, yPositionVisualElem, true);
                    this.drawGroup(frame, mtdt, dd.GroupB, yPositionVisualElem, false);
                    //progress it to the next record                    
                    startYPy += frame.heightOfStatementLine;
                    //draw the divider
                    this.drawDivider(frame, startYPy);
                }
                
                this.tooltip.attr("y2", startYPy);
                this.opinionRowsContainerRefSVG.attr("height", startYPy);
                this.opinionSeriesContainerRefSVG.attr("height", startYPy);
                this.opinionSeriesContainerRefSVG.attr("width", frame.leftMarginRowContainerStartPx);
                this.opinionRowsContainerRefSVG.attr("width", maxXNode + frame.maxValWidth + frame.outerRightMargin);
                
                if (frame.ScrollBarXAxis) {
                    this.activateXScrollBar();
                } else {
                    this.disableXScrollBar();
                }

                //activate the two interaction ones.
                this.activateHoverOnGroups(frame,mtdt,legendArea,hoverArea,valMeasureName);
                this.activateClickOnGapBars();                
            }            
        }

        static statementDefaultFontSize = 9;
        static statementDefaultFontColor = "#777";
        static statementColorByStatement = false;

        static gapBarHeight = 16;
        static gapBarDefaultColor = "rgb(1, 184, 170)";
        static gapLabelDefaultColorOnBar = "white";
        static gapLabelDefaultColorBelowBar = "#4884d9";
        static gapLabelDefaultFontSize = 9;
        static gapLabelDefaultPosition = GapLabelPositionEnum.AUTO;

        static groupNodeDefaultColor = "#00394D";

        static groupNodeDataLabelShow = true;
        static groupNodeDataLabelDefaultColor = "rgb(119, 119, 119)";
        static groupNodeDataLabelDefaultFontSize = 9;

        static groupNodeLegendDefaultFontSize = 9;
        static groupNodeLegendDefaultRadius = 8;

        static statementSortOrderDefault = SortOrderEnum.DESCENDING;
       
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            var enumeration = new ObjectEnumerationBuilder();
            var dV = this.dataView[0];
            switch (options.objectName) {
                case 'statementproperties':
                    var objectname = 'statementproperties';
                    var statementproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Statement',
                        selector: null,
                        properties: {
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", GapAnalysis.statementDefaultFontSize),
                            defaultFontColor: this.GetPropertyColor(dV, objectname, "defaultFontColor", GapAnalysis.statementDefaultFontColor)
                        }
                    };
                    enumeration.pushInstance(statementproperties);
                    break;
                case 'statementsortproperties':
                    var objectname = 'statementsortproperties';
                    var statementsortproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Statement sort',
                        selector: null,
                        properties: {
                            statementSortOrderDefault: this.GetProperty(dV, objectname, "statementSortOrderDefault", GapAnalysis.statementSortOrderDefault)
                        }
                    };
                    enumeration.pushInstance(statementsortproperties);
                    break;
                case 'groupnodeproperties':
                    var objectname = 'groupnodeproperties';
                    var groupnodeproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Group Node',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", GapAnalysis.groupNodeDefaultColor)
                        }
                    };
                    enumeration.pushInstance(groupnodeproperties);
                    break;
                case 'groupnodedatalabelproperties':
                    var objectname = 'groupnodedatalabelproperties';
                    var groupnodedatalabelproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Group Node Data Label',
                        selector: null,
                        properties: {
                            showLabels: this.GetProperty(dV, objectname, "showLabels", GapAnalysis.groupNodeDataLabelShow),
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", GapAnalysis.groupNodeDataLabelDefaultColor),
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", GapAnalysis.groupNodeDataLabelDefaultFontSize)
                        }
                    };
                    enumeration.pushInstance(groupnodedatalabelproperties);
                    break;
                case 'groupnodelegendproperties':
                    var objectname = 'groupnodelegendproperties';
                    var groupnodelegendproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Group Legend',
                        selector: null,
                        properties: {
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", GapAnalysis.groupNodeLegendDefaultFontSize),
                            defaultRadius: this.GetProperty(dV, objectname, "defaultRadius", GapAnalysis.groupNodeLegendDefaultRadius)
                        }
                    };
                    enumeration.pushInstance(groupnodelegendproperties);
                    break;
                case 'gapbarproperties':
                    var objectname = 'gapbarproperties';
                    var gapbarproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Gap Bar',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", GapAnalysis.gapBarDefaultColor),
                            defaultHeight: this.GetProperty(dV, objectname, "defaultHeight", GapAnalysis.gapBarHeight),
                            colorByCategory: this.GetProperty(dV, objectname, "colorByCategory", GapAnalysis.statementColorByStatement)
                        }
                    };
                    enumeration.pushInstance(gapbarproperties);
                    this.rectNodesCollectionClasses.forEach((resp, idx) => {
                        enumeration.pushInstance({
                            objectName: objectname,
                            displayName: resp.statement,
                            selector: ColorHelper.normalizeSelector(resp.identity.getSelector(), false),
                            properties: {
                                fill: {
                                    solid: { color: resp.color }
                                }
                            },
                        });
                    });                  
                    break;
                case 'gaplabelproperties':
                    var objectname = 'gaplabelproperties';
                    var gaplabelproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Gap Label',
                        selector: null,
                        properties: {
                            defaultPosition: this.GetProperty(dV, objectname, "defaultPosition", GapAnalysis.gapLabelDefaultPosition),
                            defaultColorOnBar: this.GetPropertyColor(dV, objectname, "defaultColorOnBar", GapAnalysis.gapLabelDefaultColorOnBar),
                            defaultColorBelowBar: this.GetPropertyColor(dV, objectname, "defaultColorBelowBar", GapAnalysis.gapLabelDefaultColorBelowBar),
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", GapAnalysis.gapLabelDefaultFontSize)
                        }
                    };
                    enumeration.pushInstance(gaplabelproperties);
                    break;
            }

            return enumeration.complete();
        }

        private GetPropertyColor(dataView: DataView, groupPropertyValue: string, propertyValue: string, defaultValue: string) {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var groupProperty = objects[groupPropertyValue];
                    if (groupProperty) {
                        var object = <Fill>groupProperty[propertyValue];
                        if (object !== undefined)
                            return object;
                    }
                }
            }
            var colorToReturn: Fill = {
                solid: {
                    color: defaultValue
                }
            };
            return colorToReturn;
        }
        
        private GetProperty<T>(dataView: DataView, groupPropertyValue: string, propertyValue: string, defaultValue: T) {
            if (dataView) {
                var objects = dataView.metadata.objects;
                if (objects) {
                    var groupProperty = objects[groupPropertyValue];
                    if (groupProperty) {
                        var object = <T>groupProperty[propertyValue];
                        if (object !== undefined)
                            return object;
                    }
                }
            }
            return defaultValue;
        }

        public destroy(): void {
            this.legendAndHoverContainerRefSVG = null;
            this.opinionContainerRefSVG = null;
        }

    }
}