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

module powerbi {
    import shapes = powerbi.visuals.shapes;
    import ISize = shapes.ISize;
    import IRect = powerbi.visuals.IRect;
    import VisualDataLabelsSettings = powerbi.visuals.VisualDataLabelsSettings;
    import DonutArcDescriptor = powerbi.visuals.DonutArcDescriptor;
    import NewDataLabelUtils = powerbi.visuals.NewDataLabelUtils;
    import PixelConverter = jsCommon.PixelConverter;

    export interface DonutChartProperties {
        viewport: IViewport;
        dataLabelsSettings: VisualDataLabelsSettings;
        radius: number;
        arc: D3.Svg.Arc;
        outerArc: D3.Svg.Arc;
        outerArcRadiusRatio: number;
        innerArcRadiusRatio: number;
    }

    export interface DonutLabelDataPoint extends LabelDataPoint {
        donutArcDescriptor: DonutArcDescriptor;
        /** Whether the label is truncated (Donut) */
        isTruncated: boolean;
        alternativeScale?: number;
        arc?: number;
    }
    
    export class DonutLabelLayout {

        /** Maximum distance labels will be offset by */
        private maximumOffset: number;
        /** The amount to increase the offset each attempt while laying out labels */
        private offsetIterationDelta: number;
        /** The amount of offset to start with when the data label is not centered */
        private startingOffset: number;

        constructor(options: DataLabelLayoutOptions) {
            this.startingOffset = options.startingOffset;
            this.maximumOffset = options.maximumOffset;
            if (options.offsetIterationDelta != null) {
                debug.assert(options.offsetIterationDelta > 0, "label offset delta must be greater than 0");
                this.offsetIterationDelta = options.offsetIterationDelta;
            }
        }

        /**
        * Arrange takes a set of data labels and lays them out them in order, assuming that
        * the given array has already been sorted with the most preferred labels at the
        * front.
        * 
        * Details:
        * - We iterate over offsets from the target position, increasing from 0
        * - For each offset, we iterate over each data label
        * - For each data label, we iterate over each position that is valid for
        *     both the specific label and this layout
        * - When a valid position is found, we position the label there and no longer
        *     reposition it.
        * - This prioritizes the earlier labels to be positioned closer to their
        *     target points in the position they prefer.
        * - This prioritizes putting data labels close to a valid position over
        *     placing them at their preferred position (it will place it at a less
        *     preferred position if it will be a smaller offset)
        */

        public layout(labelDataPoints: DonutLabelDataPoint[], donutChartProperties: DonutChartProperties): Label[] {
            // Clear data labels for a new layout
            for (let labelPoint of labelDataPoints) {
                labelPoint.hasBeenRendered = false;
            }

            let resultingLabels: Label[] = [];
            let preferredLabels: DonutLabelDataPoint[] = [];
            let viewport = donutChartProperties.viewport;
            let labelDataPointsGroup: LabelDataPointsGroup = {
                labelDataPoints: labelDataPoints,
                maxNumberOfLabels: labelDataPoints.length
            };
            let grid = new LabelArrangeGrid([labelDataPointsGroup], viewport);
            for (let i = labelDataPoints.length - 1; i >= 0; i--) {
                let labelPoint = labelDataPoints[i];
                if (labelPoint.isPreferred) {
                    let label = labelDataPoints.splice(i, 1);
                    preferredLabels = label.concat(preferredLabels);
                }
            }

            // first iterate all the preferred labels
            if (preferredLabels.length > 0)
                resultingLabels = this.positionLabels(preferredLabels, donutChartProperties, grid);
            
            // While there are invisible not preferred labels and label distance is less than the max
            // allowed distance
            if (labelDataPoints.length > 0) {
                let labels = this.positionLabels(labelDataPoints, donutChartProperties, grid);
                resultingLabels = resultingLabels.concat(labels);
            }

            return resultingLabels;
        }

        private positionLabels(labelDataPoints: DonutLabelDataPoint[], donutChartProperties: DonutChartProperties, grid: LabelArrangeGrid): Label[] {
            let resultingLabels: Label[] = [];
            let offsetDelta = this.offsetIterationDelta;
            let currentOffset = this.startingOffset;
            let currentCenteredOffset = 0;

            while (currentOffset <= this.maximumOffset) {
                for (let labelPoint of labelDataPoints) {
                    if (labelPoint.hasBeenRendered) {
                        continue;
                    }
                    let label;
                    label = this.tryPositionForDonut(labelPoint, grid, donutChartProperties, currentOffset);
                    if (label) {
                        resultingLabels.push(label);
                    }
                }
                currentOffset += offsetDelta;
                currentCenteredOffset += offsetDelta;
            }

            return resultingLabels;
        }

        /**
        * We try to move the label 25% up/down if the label is truncated or it collides with other labels.
        * after we moved it once we check that the new position doesn't failed (collides with other labels).
        */
        private tryPositionForDonut(labelPoint: DonutLabelDataPoint, grid: LabelArrangeGrid, donutProperties: DonutChartProperties, currentLabelOffset: number): Label {
            let transform: shapes.IVector =
                {
                    x: donutProperties.viewport.width / 2,
                    y: donutProperties.viewport.height / 2,
                };

            let parentShape: LabelParentPoint = <LabelParentPoint>labelPoint.parentShape;
            let defaultPosition: NewPointLabelPosition = parentShape.validPositions && parentShape.validPositions[0]
                ? parentShape.validPositions[0]
                : undefined;
            if (!defaultPosition)
                return null;

            let resultingBoundingBox = DonutLabelLayout.tryPositionPoint(grid, defaultPosition, labelPoint, currentLabelOffset, transform);
            let positions: NewPointLabelPosition[] = [];
            if (resultingBoundingBox) {
                if (labelPoint.isTruncated) {
                    //Todo: in the future add code for breaking label into two rows here
                    positions = this.getLabelPointPositions(labelPoint, true);
                }
            }
            else {
                positions = this.getLabelPointPositions(labelPoint, false);
            }

            for (let position of positions) {
                let newlabelPoint = this.getDataPointByPosition(labelPoint, donutProperties, position);
                let newPosition = (<LabelParentPoint>newlabelPoint.parentShape).validPositions[0];
                let newResultingBoundingBox = DonutLabelLayout.tryPositionPoint(grid, newPosition, newlabelPoint, currentLabelOffset, transform);
                if (newResultingBoundingBox) {
                    resultingBoundingBox = newResultingBoundingBox;
                    labelPoint = newlabelPoint;
                    break;
                }
            }

            if (resultingBoundingBox) {
                grid.add(resultingBoundingBox);
                labelPoint.hasBeenRendered = true;
                let left = resultingBoundingBox.left - transform.x;
                //We need to add or subtract half resultingBoundingBox.width because Donut chart labels get text anchor start/end
                left += left < 0 ? resultingBoundingBox.width / 2 : -(resultingBoundingBox.width / 2);
                let textAnchor = labelPoint.parentShape.validPositions[0] === NewPointLabelPosition.Right ? 'start' : 'end';
                let boundingBox: IRect = {
                    left: left,
                    top: resultingBoundingBox.top - transform.y,
                    height: resultingBoundingBox.height,
                    width: resultingBoundingBox.width,
                };
                return {
                    boundingBox: boundingBox,
                    text: labelPoint.text,
                    isVisible: true,
                    fill: labelPoint.outsideFill,
                    isInsideParent: false,
                    identity: labelPoint.identity,
                    fontSize: labelPoint.fontSize,
                    selected: false,
                    textAnchor: textAnchor,//set start for right labels and end for left labels 
                    leaderLinePoints: this.getLabelReferenceLineForDonutChart(labelPoint, donutProperties, boundingBox),
                };
            }
            return null;
        }

        private static tryPositionPoint(grid: LabelArrangeGrid, position: NewPointLabelPosition, labelDataPoint: LabelDataPoint, offset: number, transform: shapes.IVector = null): IRect {
            let labelRect = DataLabelPointPositioner.getLabelRect(labelDataPoint, position, offset);
            if (transform != null) {
                labelRect.left += transform.x;
                labelRect.top += transform.y;
            }
            if (!grid.hasConflict(labelRect)) {
                return labelRect;
            }

            return null;
        }

        /**
        * Returns an array of valid positions for hidden and truncated labels.
        * For truncated labels will return positions with more available space. 
        * For hidden labels will return all possible positions by the order we draw labels (clockwise) 
        */
        private getLabelPointPositions(labelPoint: DonutLabelDataPoint, isTruncated: boolean): NewPointLabelPosition[] {
            let parentShape: LabelParentPoint = <LabelParentPoint>labelPoint.parentShape;
            let position = parentShape.validPositions[0];
            if (isTruncated) {
                let labelY = parentShape.point.y;

                if (labelY < 0) {
                    return position === NewPointLabelPosition.Right
                        ? [NewPointLabelPosition.AboveRight]
                        : [NewPointLabelPosition.AboveLeft];
                }
                else {
                    return position === NewPointLabelPosition.Right
                        ? [NewPointLabelPosition.BelowRight]
                        : [NewPointLabelPosition.BelowLeft];
                }
            }
            //for hidden labels
            return position === NewPointLabelPosition.Left
                ? [NewPointLabelPosition.AboveLeft, NewPointLabelPosition.BelowLeft]
                : [NewPointLabelPosition.BelowRight, NewPointLabelPosition.AboveRight];
        }

        /**
        *Returns a new donutLabelDataPoint according to the given position
        */
        private getDataPointByPosition(labelPoint: DonutLabelDataPoint, donutProperties: DonutChartProperties, position: NewPointLabelPosition): DonutLabelDataPoint {
            let arc: number;
            let d = labelPoint.donutArcDescriptor;
            let midAngle = d.startAngle + ((d.endAngle - d.startAngle) / 2);
            let outerRadius = donutProperties.radius * donutProperties.outerArcRadiusRatio;

            switch (position) {
                case NewPointLabelPosition.AboveRight:
                case NewPointLabelPosition.BelowLeft:
                    arc = ((+d.startAngle + +midAngle) - Math.PI) / 2;
                    break;
                case NewPointLabelPosition.AboveLeft:
                case NewPointLabelPosition.BelowRight:
                    arc = ((+midAngle + +d.endAngle) - Math.PI) / 2;
                    break;
                default:
                    debug.assertFail("Unsupported label position");

            }
            //calculate the new label's coordinates 
            let newCentroidText = [Math.cos(arc) * outerRadius, Math.sin(arc) * outerRadius];
            let labelX = NewDataLabelUtils.getXPositionForDonutLabel(newCentroidText[0]);
            let labelY = newCentroidText[1];

            let text = NewDataLabelUtils.setLabelTextDonutChart(labelPoint.donutArcDescriptor, labelX, donutProperties.viewport, donutProperties.dataLabelsSettings, labelPoint.alternativeScale);
            let properties: TextProperties = {
                text: text,
                fontFamily: NewDataLabelUtils.LabelTextProperties.fontFamily,
                fontSize: PixelConverter.fromPoint(donutProperties.dataLabelsSettings.fontSize),
                fontWeight: NewDataLabelUtils.LabelTextProperties.fontWeight,
            };
            let textSize: ISize = {
                width: TextMeasurementService.measureSvgTextWidth(properties),
                height: TextMeasurementService.measureSvgTextHeight(properties),
            };

            let newPosition = labelX < 0 ? NewPointLabelPosition.Left : NewPointLabelPosition.Right;
            let pointPosition: LabelParentPoint = {
                point: {
                    x: labelX,
                    y: labelY,
                },
                validPositions: [newPosition],
                radius: 0,
            };
            let newLabelPoint: DonutLabelDataPoint = _.clone(labelPoint);
            newLabelPoint.arc = arc;
            newLabelPoint.text = text;
            newLabelPoint.textSize = textSize;
            newLabelPoint.parentShape = pointPosition;
            return newLabelPoint;
        }

        private getLabelReferenceLineForDonutChart(labelPoint: DonutLabelDataPoint, donutProperties: DonutChartProperties, labelRect: IRect): number[][]{
        let innerLinePointMultiplier = 2.05;
        let textPoint: number[];
        let midPoint: number[];
        let chartPoint: number[];
        //Label position has changed
        if (labelPoint.arc) {
            let arc = labelPoint.arc;
            let outerRadius = donutProperties.radius * donutProperties.outerArcRadiusRatio;
            let innerRadius = (donutProperties.radius / 2) * donutProperties.innerArcRadiusRatio;
            midPoint = [Math.cos(arc) * outerRadius, Math.sin(arc) * outerRadius];
            chartPoint = [Math.cos(arc) * innerRadius, Math.sin(arc) * innerRadius];

        }
        //Original label position
        else {
            midPoint = donutProperties.outerArc.centroid(labelPoint.donutArcDescriptor);
            chartPoint = donutProperties.arc.centroid(labelPoint.donutArcDescriptor);
        }
        let textPointX = labelRect.left + labelPoint.textSize.width / 2;
        textPointX += textPointX < 0 ? NewDataLabelUtils.maxLabelOffset / 2 : - (NewDataLabelUtils.maxLabelOffset / 2);
        textPoint = [textPointX, labelRect.top + labelPoint.textSize.height / 2];
        chartPoint[0] *= innerLinePointMultiplier;
        chartPoint[1] *= innerLinePointMultiplier;
        return [chartPoint, midPoint, textPoint];
    }
     
    }
}
