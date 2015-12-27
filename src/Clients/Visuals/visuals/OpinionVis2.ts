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
        public IsFilled: boolean;
        public constructor(IsGroupA:boolean, GroupLabel: string, valAInput: number, valAFormatted: string, valADetails:string, valADetailsLabel:string, XpX: number) {
            this.groupLabel = GroupLabel;
            this.val = valAInput;
            this.XpX = XpX;
            this.valDetails = valADetails;
            this.valFormatted = valAFormatted;
            this.valDetailsLabel = valADetailsLabel;
            this.IsGroupA = IsGroupA;
            this.IsFilled = this.IsGroupA;
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
        public rowIncrementPx: number;
        public gapBetweenBarAndUnderneathLabel: number;
        public circleRadiusPx: number;
        public outerRightMargin: number;
        public outerTopMargin: number;
        public leftTextMarginPx: number;
        public leftMarginPx: number;
        public maxValWidth: number;
        public maxWidthBarPx: number;        
        public xAxisScale: D3.Scale.LinearScale;
        public heightOfStatementLine: number;

        calcGapBars(widthOfViewPort: number, maxVal: number) {
            this.maxWidthBarPx = (widthOfViewPort - this.leftMarginPx) - (this.maxValWidth + this.outerRightMargin);

            this.xAxisScale = d3.scale.linear()
                .domain([0, maxVal])
                .range([this.leftMarginPx, this.leftMarginPx + this.maxWidthBarPx]);
        }
    }

    export class OpinionLegendProperties {
        public height: number;
        public valueAGroupLabel;
        public valueBGroupLabel;
    }

    export class OpinionHoverProperties {
        public height: number;
        public selectedText;
    }

    export class OpinionVis2 implements IVisual {

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
                statementsortproperties: {
                    displayName: "Statement Sort",
                    properties: {
                        statementSortOrderDefault: {
                            description: "Specify the default sort order for the statements.",
                            type: { text: true },
                            displayName: "Default Font Size"
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
                        showLabels: {
                            description: "Specify true/false on whether to show labels on the nodes.",
                            type: { bool: true },
                            displayName: "Show labels"
                        },
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
                        },
                        defaultHeight: {
                            description: "Specifiy the size of a bar (px).",
                            type: { numeric: true },
                            displayName: "Default Height"
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
                            type: { text: true },
                            displayName: "Default Position (Auto / Below)"
                        },
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

        private OpinionVisProperties = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'formatString' },
            }
        };

        private root: D3.Selection;
        private dataView: DataView[];
        private selectionManager: SelectionManager;
        private opinionContainerRef: D3.Selection;
        
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
            
            this.root = d3.select(options.element.get(0));                
            this.opinionContainerRef = this.root.append("div").attr("id", "OpinionNodeContainer").style("overflow", "hidden");
            this.root = this.opinionContainerRef.append('svg');

            this.colors = options.style.colorPalette.dataColors;

            this.interactivityService = options.interactivity;            
        }

        public static converter(dataView: DataView[]): DataViewCategorical {
            if (dataView.length > 1 && dataView[1].categorical !== null && dataView[1].categorical.values.length !== 0) {                
                var cate = dataView[1].categorical;
                var oldVals = _.map(cate.values[0].values, (dV,idx) => {
                    return {
                        vv: dV,
                        oldIndex: idx
                    };
                });
                var multiplier = -1;
                //we need to look at the sort property to see whether we should do ascending or descending
                var sortOrder = OpinionVis2.statementSortOrderDefault;
                if (dataView) {
                    var objects = dataView[0].metadata.objects;
                    if (objects) {
                        var groupProperty = objects["statementsortproperties"];
                        if (groupProperty) {
                            var object = <string>groupProperty["statementSortOrderDefault"];
                            if (object !== undefined)
                                sortOrder = object.toLowerCase();
                        }
                    }
                }
                if (sortOrder === OpinionVis2.statementSortOrderDefault || sortOrder === "ascending") {
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
            return dataView[0].categorical;
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
            var maxValStr = this.root.append("text")
                .data([this.maxVal])
                .text(valueFormatter.format(this.maxVal, this.fStrA))
                .style("font-size", this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", OpinionVis2.groupNodeDataLabelDefaultFontSize).toString() + "px")
                .each(function (d) {
                    fc.maxValWidth = this.getBBox().width;
                    maxValHeight = this.getBBox().height;
                });

            maxValStr.remove();

            //the minimum datapoint value
            var minValWidth = 0;
            var minValHeight = 0;
            var minValStr = this.root.append("text")
                .data([this.maxVal])
                .text(valueFormatter.format(this.minVal, this.fStrA))
                .style("font-size", this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", OpinionVis2.groupNodeDataLabelDefaultFontSize).toString() + "px")
                .each(function (d) {
                    minValWidth = this.getBBox().width;
                    minValHeight = 0;
                });

            minValStr.remove();

            //get an idea of a value under the bars size
            var gapBarUnderTextHeight = 0;
            var gapBarUnderTextStr = this.root.append("text")
                .data([this.maxVal])
                .text(valueFormatter.format(this.maxVal, this.fStrA))
                .style("font-size", this.GetProperty(this.dataView[0], "gaplabelproperties", "defaultFontSize", OpinionVis2.gapLabelDefaultFontSize).toString() + "px")
                .each(function (d) {
                    gapBarUnderTextHeight = this.getBBox().height;
                });

            gapBarUnderTextStr.remove();

            //longest group label text
            var longestSeriesElem: string = _.max(dv.categories[0].values, function (d: string) {
                return d.length;
            });
            var longestSeriesElemWidth = 0;
            var longestSeriesElemHeight = 0;
            var longestSeriesElemDraw = this.root.append("text")
                .data([longestSeriesElem])
                .style("font-size", this.GetProperty(this.dataView[0], "statementproperties", "defaultFontSize", OpinionVis2.statementDefaultFontSize).toString() + "px")
                .style("font-family", "Segoe UI")
                .text(longestSeriesElem)
                .each(function (d) {
                    longestSeriesElemWidth = this.getBBox().width;
                    longestSeriesElemHeight = this.getBBox().height;
                });
            longestSeriesElemDraw.remove();

            //now we set up the default frame            
            fc.rowIncrementPx = 30;
            fc.circleRadiusPx = this.GetProperty(this.dataView[0], "gapbarproperties", "defaultHeight", OpinionVis2.gapBarHeight) / 2;
            fc.gapBetweenBarAndUnderneathLabel = 3;

            //we need to define the total height of a statmen record
            var option1 = longestSeriesElemHeight + 20; //10 either side for a buffer
            var option2 = (maxValHeight + 5) + (gapBarUnderTextHeight + fc.gapBetweenBarAndUnderneathLabel) + (fc.circleRadiusPx * 2) + 20;

            fc.heightOfStatementLine = option1 > option2 ? option1: option2;

            fc.outerRightMargin = 15;
            
            fc.outerTopMargin = 8;

            fc.leftTextMarginPx = 10;
            fc.leftMarginPx = fc.leftTextMarginPx + longestSeriesElemWidth + 10 + minValWidth;
            fc.maxWidthBarPx = (widthOfViewPort - fc.leftMarginPx) - (fc.maxValWidth + fc.outerRightMargin);
            
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

            var LeftNode = new OpinionNodeV2(true, valA < valB ? mtdt.valBGroupLabel : mtdt.valAGroupLabel, valA, valAStr, valADetailsStr, valADetailsLabel, LeftCircleX);
            var RightNode = new OpinionNodeV2(false, valA < valB ? mtdt.valAGroupLabel : mtdt.valBGroupLabel, valB, valBStr, valBDetailsStr, valBDetailsLabel, RightCircleX);
                    
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

            var offset = 15;

            //firstly we need to draw the header with the legend
            this.root.append("circle")
                .attr("cx", offset)
                .attr("cy", frame.outerTopMargin + frame.circleRadiusPx)
                .attr("r", frame.circleRadiusPx)
                .style("fill", "white")
                .attr("stroke", mtdt.valueGroupColor);

            //need to add the second half of the circle and the padding
            offset += (frame.circleRadiusPx + paddingBetweenTextAndCircle);

            var width = 0;
            var legendTextHeight = 0;
            legendProps.valueAGroupLabel = this.root.append("text")
                .data([mtdt])
                .attr("dx", offset)
                .attr("dy", function (d) {
                    return frame.outerTopMargin + (frame.circleRadiusPx * 2) - 3;
                })
                .style("font-size", "11px")
                .text(mtdt.valAGroupLabel)
                .each(function (d) {
                    d.width = this.getBBox().width;
                    width = d.width;
                    d.height = this.getBBox().height;
                    legendTextHeight = d.height;
                });

            offset += (width + gapBetweenTwoGroupText);

            this.root.append("circle")
                .attr("cx", offset)
                .attr("cy", frame.outerTopMargin + frame.circleRadiusPx)
                .attr("r", frame.circleRadiusPx)
                .style("fill", mtdt.valueGroupColor);

            offset += (frame.circleRadiusPx + paddingBetweenTextAndCircle);

            legendProps.valueBGroupLabel = this.root.append("text")
                .data([mtdt])
                .attr("dx", offset)
                .attr("dy", function (d) {
                    return frame.outerTopMargin + (frame.circleRadiusPx * 2) - 3;
                })
                .style("font-size", "11px")
                .text(mtdt.valBGroupLabel)
                .each(function (d) {
                    d.width = this.getBBox().width;
                    width = d.width;
                    d.height = this.getBBox().height;
                });

            var option1 = legendTextHeight + 3;
            var option2 = (frame.circleRadiusPx * 2) + 3;
            legendProps.height = option1 > option2 ? option1 : option2;

            return legendProps;     
        }

        private drawHoverInteractiveArea(frame: OpinionFrameClass, mtdt: OpinionVisualMetaDataV2, legendProperties: OpinionLegendProperties): OpinionHoverProperties {
            var hp = new OpinionHoverProperties();
            
            //lets put the hover legend content in
            var selectedTextHeight = 0;
            hp.selectedText = this.root.append("text")
                .attr("dx", frame.leftTextMarginPx)
                .attr("dy", frame.outerTopMargin + legendProperties.height + 15 + 3)
                .text(OpinionVis2.defaultHeaderMoreDetailsLabel)
                .style("font-size", "13px")
                .each(function (d) {
                    selectedTextHeight = this.getBBox().height;
                });;

            hp.height = (selectedTextHeight + 15) + 3;
            
            //now we draw the line seperating the legend from the visual
            var yPos = frame.outerTopMargin + legendProperties.height + hp.height;
            this.root.append("line")
                .attr("x1", frame.leftTextMarginPx)
                .attr("y1", yPos)
                .attr("x2", frame.leftTextMarginPx + frame.leftMarginPx + frame.maxWidthBarPx)
                .attr("y2", yPos)
                .attr("stroke-width", 1)
                .attr("stroke", mtdt.valueGroupColor); 

            //now we put the vertical tooltip
            this.tooltip = this.root.append("line")
                .attr("x1", 30)
                .attr("y1", yPos)
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
            var NodeElem = this.root.append("circle")
                .data([Node])
                .attr("cx", CircleXOffset)
                .attr("cy", CentreYPx)
                .attr("r", frame.circleRadiusPx)
                .style("fill", function (d) {
                    if (Node.IsFilled) {
                        return mtdt.valueGroupColor;
                    }
                    return "white";
                })
                .style("stroke", mtdt.valueGroupColor);

            this.circleNodesCollectionD3.push(NodeElem[0][0]);

            var nodeLabelFontColor = this.GetPropertyColor(this.dataView[0], "groupnodedatalabelproperties", "defaultColor", OpinionVis2.groupNodeDataLabelDefaultColor).solid.color;
            var nodeLabelDefaultFontSize = this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "defaultFontSize", OpinionVis2.groupNodeDataLabelDefaultFontSize).toString() + "px";

            if (this.GetProperty(this.dataView[0], "groupnodedatalabelproperties", "showLabels", OpinionVis2.groupNodeDataLabelShow)) {
                var LeftDLabel = this.root.append("text")
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

            var gapBColor = this.GetPropertyColor(this.dataView[0], "gapbarproperties", "defaultColor", OpinionVis2.gapBarDefaultColor).solid.color;
            if (this.GetProperty(this.dataView[0], "gapbarproperties", "colorByCategory", OpinionVis2.statementColorByStatement) === true) {
                gapBColor = dd.color;
            }
            var gapBFontOnBar = this.GetPropertyColor(this.dataView[0], "gaplabelproperties", "defaultColorOnBar", OpinionVis2.gapLabelDefaultColorOnBar).solid.color;
            var gapBFontBelowBar = this.GetPropertyColor(this.dataView[0], "gaplabelproperties", "defaultColorBelowBar", OpinionVis2.gapLabelDefaultColorBelowBar).solid.color;

            var rect = this.root.append("rect")
                .data([dd])
                .attr("y", CentreYPx - frame.circleRadiusPx)
                .attr("x", dd.GroupA.XpX)
                .attr("width", rectWidth)
                .attr("height", (frame.circleRadiusPx * 2))
                .style("fill", gapBColor);

            this.rectNodesCollectionD3.push(rect[0][0]);

            var midpointPx = dd.GroupA.XpX + (rectWidth / 2);

            var rectDLabel = this.root.append("text")
                .data([dd])
                .attr("dx", midpointPx)
                .attr("dy", CentreYPx)
                .text(gapStr)
                .style("font-size", this.GetProperty(this.dataView[0], "gaplabelproperties", "defaultFontSize", OpinionVis2.gapLabelDefaultFontSize).toString() + "px")
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

            var defaultPosChosen = this.GetProperty(this.dataView[0], "gaplabelproperties", "defaultPosition", OpinionVis2.gapLabelDefaultPosition);

            rectDLabel.attr("dy", function (d) {
                var rectStart = (CentreYPx - frame.circleRadiusPx);
                var rectHeight = (frame.circleRadiusPx * 2);
                if (defaultPosChosen.toLowerCase() === "below" || rectWidthWithRadius < d.width || d.height > (frame.circleRadiusPx*2)) {
                    return rectStart + rectHeight + (d.height) + frame.gapBetweenBarAndUnderneathLabel;
                }
                var rectMidPointY = rectStart + (rectHeight / 2);
                return rectMidPointY + (d.height / 2) - 3;
            });

            rectDLabel.style("fill", function (d) {
                if (defaultPosChosen.toLowerCase() === "below" || rectWidthWithRadius < d.width || d.height > (frame.circleRadiusPx * 2)) {
                    return gapBFontBelowBar;
                } else {
                    return gapBFontOnBar;
                }
            });
        }

        private drawStatementLabel(frame: OpinionFrameClass, mtdt: OpinionVisualMetaDataV2, dd: StatementResponseV2, YPosition: number) {
            var statementLabel = this.root.append("text")
                .data([dd])
                .attr("dx", frame.leftTextMarginPx)
                .attr("dy", YPosition)
                .style("fill", this.GetPropertyColor(this.dataView[0], "statementproperties", "defaultFontColor", OpinionVis2.statementDefaultFontColor).solid.color)
                .style("font-size", this.GetProperty(this.dataView[0], "statementproperties", "defaultFontSize", OpinionVis2.statementDefaultFontSize).toString() + "px")
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
            this.root.append("line")
                .attr("x1", frame.leftTextMarginPx)
                .attr("y1", YPosition)
                .attr("x2", frame.leftTextMarginPx + frame.leftMarginPx + frame.maxWidthBarPx)
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

        private activateHoverOnGroups(mtdt: OpinionVisualMetaDataV2, lgProps: OpinionLegendProperties, hp: OpinionHoverProperties, valMeasureName: string) {
            var self = this;
            //our tool tip content and animations triggered
            d3.selectAll(this.circleNodesCollectionD3).on("mouseover", function () {
                return self.tooltip.style("visibility", "visible");
            }).on("mousemove", function (d) {
                if (mtdt.valAGroupLabel === d.groupLabel) {
                    lgProps.valueAGroupLabel.style("text-decoration", "underline");
                    lgProps.valueAGroupLabel.style("font-weight", "bold");
                } else {
                    lgProps.valueBGroupLabel.style("text-decoration", "underline");
                    lgProps.valueBGroupLabel.style("font-weight", "bold");
                }
                var strToDisplay = valMeasureName + ": " + d.valFormatted;
                if (d.valDetails !== null) {
                    strToDisplay += " | " + d.valDetailsLabel + ": " + d.valDetails;
                }
                hp.selectedText.text(strToDisplay);
                return self.tooltip.attr("x1", d.XpX).attr("x2", d.XpX);
            }).on("mouseout", function (d) {
                lgProps.valueAGroupLabel.style("text-decoration", "");
                lgProps.valueBGroupLabel.style("text-decoration", "");
                lgProps.valueAGroupLabel.style("font-weight", "");
                lgProps.valueBGroupLabel.style("font-weight", "");
                hp.selectedText.text(OpinionVis2.defaultHeaderMoreDetailsLabel);
                return self.tooltip.style("visibility", "hidden");
            });
        }

        private activateYScrollBar(frame: OpinionFrameClass, endingHeight: number, widthOfViewPort: number) {
            //update the frames max width bar
            frame.outerRightMargin = 45;
            frame.calcGapBars(widthOfViewPort, this.maxVal);

            this.opinionContainerRef.style("overflow-y", "scroll");
            this.root.attr("height", endingHeight + frame.heightOfStatementLine); 
        }

        private disableYScrollBar() {
            this.opinionContainerRef.style("overflow-y", "hidden");
        }

        public update(options: VisualUpdateOptions) {
            var dataView = this.dataView = options.dataViews;
            var viewport = options.viewport;
            var dataPoints = OpinionVis2.converter(dataView);  

            //if they've only put 1 of the fields in
            //don't render the visual
            if (dataPoints.values.length > 1) {
                this.circleNodesCollectionD3 = [];
                this.rectNodesCollectionD3 = [];
                this.rectNodesCollectionClasses = [];
                //prep the visual area

                //should clear the pallette first
                this.root.selectAll("*").remove();

                this.root.attr({
                    'height': viewport.height,
                    'width': viewport.width
                });                

                //setup the container with the height
                this.opinionContainerRef.style("height", viewport.height.toString() + "px");

                //set up our indexes & formatters
                this.setupFormattersAndIndexers(dataPoints);

                //now setup the frame to draw in
                var frame = this.deriveWindowToDrawIn(dataPoints, viewport.height, viewport.width);    

                var valueGroupColor = this.GetPropertyColor(this.dataView[0], "groupnodeproperties", "defaultColor", OpinionVis2.groupNodeDefaultColor).solid.color;
                var mtdt = new OpinionVisualMetaDataV2(dataPoints.values[this.valAIndex].source.groupName, dataPoints.values[this.valBIndex].source.groupName, valueGroupColor);

                var legendArea = this.drawLegend(frame, mtdt);                                
                var hoverArea = this.drawHoverInteractiveArea(frame, mtdt, legendArea);           

                var startYPy = frame.outerTopMargin + legendArea.height + hoverArea.height;
              
                var valMeasureName: string = dataPoints.values[0].source.displayName;
                
                //we need to figure out if we need scroll bars or not
                var endingY = (frame.outerTopMargin + legendArea.height + hoverArea.height) + (frame.heightOfStatementLine * (dataPoints.categories[0].values.length - 1));
                if (endingY > viewport.height) {
                    this.activateYScrollBar(frame, endingY, viewport.width);
                } 
                else {
                    this.disableYScrollBar();
                }

                //now lets walk through the values
                for (var i = 0; i < dataPoints.categories[0].values.length; i++) {
                    //extract the record from the categorical data view
                    var dd = this.extractStatementRecord(dataPoints, frame, mtdt, i);
                    var yPositionStatement = startYPy + (frame.heightOfStatementLine * 0.5);
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

                //activate the two interaction ones.
                this.activateHoverOnGroups(mtdt, legendArea, hoverArea, valMeasureName);
                this.activateClickOnGapBars();                
            }            
        }

        static statementDefaultFontSize = 11;
        static statementDefaultFontColor = "#777";
        static statementColorByStatement = false;

        static gapBarHeight = 16;
        static gapBarDefaultColor = "rgb(1, 184, 170)";
        static gapLabelDefaultColorOnBar = "white";
        static gapLabelDefaultColorBelowBar = "#4884d9";
        static gapLabelDefaultFontSize = 12;
        static gapLabelDefaultPosition = "Auto";

        static groupNodeDefaultColor = "#00394D";

        static groupNodeDataLabelShow = true;
        static groupNodeDataLabelDefaultColor = "rgb(119, 119, 119)";
        static groupNodeDataLabelDefaultFontSize = 12;

        static statementSortOrderDefault = "asc";
       
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
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", OpinionVis2.statementDefaultFontSize),
                            defaultFontColor: this.GetPropertyColor(dV, objectname, "defaultFontColor", OpinionVis2.statementDefaultFontColor)
                        }
                    };
                    enumeration.pushInstance(statementproperties);
                    break;
                case 'statementsortproperties':
                    var objectname = 'statementsortproperties';
                    var statementproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Statement sort',
                        selector: null,
                        properties: {
                            statementSortOrderDefault: this.GetProperty(dV, objectname, "statementSortOrderDefault", OpinionVis2.statementSortOrderDefault)
                        }
                    };
                    enumeration.pushInstance(statementproperties);
                    break;
                case 'groupnodeproperties':
                    var objectname = 'groupnodeproperties';
                    var groupnodeproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Group Node',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", OpinionVis2.groupNodeDefaultColor)
                        }
                    };
                    enumeration.pushInstance(groupnodeproperties);
                    break;
                case 'groupnodedatalabelproperties':
                    var objectname = 'groupnodedatalabelproperties';
                    var gapbarproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Group Node Data Label',
                        selector: null,
                        properties: {
                            showLabels: this.GetProperty(dV, objectname, "showLabels", OpinionVis2.groupNodeDataLabelShow),
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", OpinionVis2.groupNodeDataLabelDefaultColor),
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", OpinionVis2.groupNodeDataLabelDefaultFontSize)
                        }
                    };
                    enumeration.pushInstance(gapbarproperties);
                    break;
                case 'gapbarproperties':
                    var objectname = 'gapbarproperties';
                    var gapbarproperties: VisualObjectInstance = {
                        objectName: objectname,
                        displayName: 'Gap Bar',
                        selector: null,
                        properties: {
                            defaultColor: this.GetPropertyColor(dV, objectname, "defaultColor", OpinionVis2.gapBarDefaultColor),
                            defaultHeight: this.GetProperty(dV, objectname, "defaultHeight", OpinionVis2.gapBarHeight),
                            colorByCategory: this.GetProperty(dV, objectname, "colorByCategory", OpinionVis2.statementColorByStatement)
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
                            defaultPosition: this.GetProperty(dV, objectname, "defaultPosition", OpinionVis2.gapLabelDefaultPosition),
                            defaultColorOnBar: this.GetPropertyColor(dV, objectname, "defaultColorOnBar", OpinionVis2.gapLabelDefaultColorOnBar),
                            defaultColorBelowBar: this.GetPropertyColor(dV, objectname, "defaultColorBelowBar", OpinionVis2.gapLabelDefaultColorBelowBar),
                            defaultFontSize: this.GetProperty(dV, objectname, "defaultFontSize", OpinionVis2.gapLabelDefaultFontSize)
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
            this.root = null;
        }

    }
}