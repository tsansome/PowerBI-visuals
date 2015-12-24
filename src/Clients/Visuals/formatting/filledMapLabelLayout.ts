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

/// <reference path="../_references.ts" />

module powerbi {

    import ISize = powerbi.visuals.shapes.ISize;
    import IPoint = powerbi.visuals.IPoint;
    import IRect = powerbi.visuals.IRect;
    import Polygon = powerbi.visuals.shapes.Polygon;
    import Transform = powerbi.visuals.Transform;
    import NewDataLabelUtils = powerbi.visuals.NewDataLabelUtils;

    const DefaultCentroidOffset = 5;
    const OffsetDelta = 10;
    const MaximumOffset = 60;
    const stemExtension = 5;

    export interface LabelParentPolygon {
        /** The point this data label belongs to */
        polygon: Polygon;

        /** Valid positions to place the label ordered by preference */
        validPositions: NewPointLabelPosition[];
    }

    export class FilledMapLabelLayout {

        public layout(labelDataPoints: LabelDataPoint[], viewport: IViewport, polygonInfoTransform: Transform): Label[] {
            let labelDataPointsGroup: LabelDataPointsGroup = {
                labelDataPoints: labelDataPoints,
                maxNumberOfLabels: labelDataPoints.length
            };
            let grid = new LabelArrangeGrid([labelDataPointsGroup], viewport, NewDataLabelUtils.horizontalLabelBackgroundMargin, NewDataLabelUtils.verticalLabelBackgroundMargin);
            let resultingDataLabels: Label[] = [];
            let allPolygons: Polygon[] = [];

            for (let labelPoint of labelDataPoints) {
                let polygon = (<LabelParentPolygon>labelPoint.parentShape).polygon;
                allPolygons.push(polygon);
                polygon.pixelBoundingRect = polygonInfoTransform.applyToRect(polygon.absoluteBoundingRect());
            }

            let shapesgrid = new LabelPolygonArrangeGrid(allPolygons, viewport);

            for (let labelPoint of labelDataPoints) {
                let dataLabel = this.getLabelByPolygonPositions(labelPoint, polygonInfoTransform, grid, shapesgrid);
                if (dataLabel != null) {
                    resultingDataLabels.push(dataLabel);
                }
            }
            return resultingDataLabels;
        }

        public getLabelPolygon(mapDataPoint: LabelDataPoint, position: NewPointLabelPosition, pointPosition: IPoint, offset: number): IRect {
            let dataPointSize: ISize = {
                width: mapDataPoint.textSize.width,
                height: (mapDataPoint.textSize.height)
            };

            switch (position) {
                case NewPointLabelPosition.Above: {
                    return DataLabelPointPositioner.above(dataPointSize, pointPosition, offset);
                }
                case NewPointLabelPosition.Below: {
                    return DataLabelPointPositioner.below(dataPointSize, pointPosition, offset);
                }
                case NewPointLabelPosition.Left: {
                    return DataLabelPointPositioner.left(dataPointSize, pointPosition, offset);
                }
                case NewPointLabelPosition.Right: {
                    return DataLabelPointPositioner.right(dataPointSize, pointPosition, offset);
                }
                case NewPointLabelPosition.AboveLeft: {
                    return DataLabelPointPositioner.aboveLeft(dataPointSize, pointPosition, offset);
                }
                case NewPointLabelPosition.AboveRight: {
                    return DataLabelPointPositioner.aboveRight(dataPointSize, pointPosition, offset);
                }
                case NewPointLabelPosition.BelowLeft: {
                    return DataLabelPointPositioner.belowLeft(dataPointSize, pointPosition, offset);
                }
                case NewPointLabelPosition.BelowRight: {
                    return DataLabelPointPositioner.belowRight(dataPointSize, pointPosition, offset);
                }
                case NewPointLabelPosition.Center: {
                    return DataLabelPointPositioner.center(dataPointSize, pointPosition);
                }
                default: {
                    debug.assertFail("Unsupported label position");
                }
            }
            return null;
        }

        private getLabelByPolygonPositions(labelPoint: LabelDataPoint, polygonInfoTransform: Transform, grid: LabelArrangeGrid, shapesGrid: LabelPolygonArrangeGrid): Label {
            let offset: number = 0;
            for (let i: number = 0; i < 2; i++) {
                if (i === 1) {
                    offset = DefaultCentroidOffset;
                }
                for (let position of (<LabelParentPolygon>labelPoint.parentShape).validPositions) {
                    let resultingBoundingBox = this.tryPositionForPolygonPosition(position, labelPoint, polygonInfoTransform, offset);
                    if (position === NewPointLabelPosition.Center && i !== 0) {
                        continue;
                    }
                    if (resultingBoundingBox) {
                        let dataLabel: Label = {
                            text: labelPoint.text,
                            secondRowText: labelPoint.secondRowText,
                            boundingBox: resultingBoundingBox,
                            isVisible: true,
                            fill: labelPoint.insideFill,
                            identity: null,
                            selected: false,
                        };

                        return dataLabel;
                    }
                }
            }

            let inverseTransorm = polygonInfoTransform.getInverse();
            let currentOffset = 6;

            while (currentOffset <= MaximumOffset) {
                for (let position of (<powerbi.LabelParentPolygon>labelPoint.parentShape).validPositions) {
                    if (position === NewPointLabelPosition.Center) {
                        continue;
                    }
                    let polygon = (<LabelParentPolygon>labelPoint.parentShape).polygon;
                    let pixelCentroid = polygonInfoTransform.applyToPoint(polygon.absoluteCentroid());
                    let resultingBoundingBox = this.tryPlaceLabelOutsidePolygon(grid, position, labelPoint, currentOffset, pixelCentroid, shapesGrid, inverseTransorm);

                    if (resultingBoundingBox) {
                        let dataLabel: Label = {
                            text: labelPoint.text,
                            secondRowText: labelPoint.secondRowText,
                            boundingBox: resultingBoundingBox,
                            isVisible: true,
                            fill: labelPoint.insideFill,
                            identity: null,
                            selected: false,
                        };

                        dataLabel.leaderLinePoints = this.setLeaderLinePoints(this.calculateStemSource(polygonInfoTransform, inverseTransorm, polygon, resultingBoundingBox, position, pixelCentroid),
                            this.calculateStemDestination(resultingBoundingBox, position));

                        grid.add(resultingBoundingBox);
                        return dataLabel;
                    }
                }
                currentOffset += OffsetDelta;
            }
            return null;
        }

        private setLeaderLinePoints(stemSource: IPoint, stemDestination: IPoint): number[][] {
            return [[stemSource.x, stemSource.y], [stemDestination.x, stemDestination.y]];
        }

        private calculateStemSource(polygonInfoTransform: Transform, inverseTransorm: Transform, polygon: Polygon, labelBoundingBox: IRect, position: NewPointLabelPosition, pixelCentroid: IPoint): IPoint {
            let absoluteStemSource = polygon.lineIntersectionPoint(polygon.absoluteCentroid(),
                inverseTransorm.applyToPoint({ x: labelBoundingBox.left + labelBoundingBox.width / 2, y: labelBoundingBox.top + labelBoundingBox.height / 2 }));

            if (absoluteStemSource == null) {
                return pixelCentroid;
            }

            let stemSource = polygonInfoTransform.applyToPoint(absoluteStemSource);

            switch (position) {
                case NewPointLabelPosition.Above: {
                    stemSource.y += stemExtension;
                    break;
                }
                case NewPointLabelPosition.Below: {
                    stemSource.y -= stemExtension;
                    break;
                }
                case NewPointLabelPosition.Left: {
                    stemSource.x += stemExtension;
                    break;
                }
                case NewPointLabelPosition.Right: {
                    stemSource.x -= stemExtension;
                    break;
                }
                case NewPointLabelPosition.AboveLeft: {
                    stemSource.x += (stemExtension / DataLabelPointPositioner.cos45);
                    stemSource.y += (stemExtension / DataLabelPointPositioner.sin45);
                    break;
                }
                case NewPointLabelPosition.AboveRight: {
                    stemSource.x -= (stemExtension / DataLabelPointPositioner.cos45);
                    stemSource.y += (stemExtension / DataLabelPointPositioner.sin45);
                    break;
                }
                case NewPointLabelPosition.BelowLeft: {
                    stemSource.x += (stemExtension / DataLabelPointPositioner.cos45);
                    stemSource.y -= (stemExtension / DataLabelPointPositioner.sin45);
                    break;
                }
                case NewPointLabelPosition.BelowRight: {
                    stemSource.x -= (stemExtension / DataLabelPointPositioner.cos45);
                    stemSource.y -= (stemExtension / DataLabelPointPositioner.sin45);
                    break;
                }
                case NewPointLabelPosition.Center: {
                    break;
                }
                default: {
                    debug.assertFail("Unsupported label position");
                }
            }

            return stemSource;
        }

        private calculateStemDestination(labelBoundingBox: IRect, position: NewPointLabelPosition): IPoint {
            let x: number;
            let y: number;
            switch (position) {
                case NewPointLabelPosition.Above: {
                    x = labelBoundingBox.left + labelBoundingBox.width / 2;
                    y = labelBoundingBox.top + labelBoundingBox.height;
                    break;
                }
                case NewPointLabelPosition.Below: {
                    x = labelBoundingBox.left + labelBoundingBox.width / 2;
                    y = labelBoundingBox.top;
                    break;
                }
                case NewPointLabelPosition.Left: {
                    x = labelBoundingBox.left + labelBoundingBox.width;
                    y = labelBoundingBox.top + labelBoundingBox.height / 2;
                    break;
                }
                case NewPointLabelPosition.Right: {
                    x = labelBoundingBox.left;
                    y = labelBoundingBox.top + labelBoundingBox.height / 2;
                    break;
                }
                case NewPointLabelPosition.AboveLeft: {
                    x = labelBoundingBox.left + labelBoundingBox.width;
                    y = labelBoundingBox.top + labelBoundingBox.height;
                    break;
                }
                case NewPointLabelPosition.AboveRight: {
                    x = labelBoundingBox.left;
                    y = labelBoundingBox.top + labelBoundingBox.height;
                    break;
                }
                case NewPointLabelPosition.BelowLeft: {
                    x = labelBoundingBox.left + labelBoundingBox.width;
                    y = labelBoundingBox.top;
                    break;
                }
                case NewPointLabelPosition.BelowRight: {
                    x = labelBoundingBox.left;
                    y = labelBoundingBox.top;
                    break;
                }
                case NewPointLabelPosition.Center: {
                    break;
                }
                default: {
                    debug.assertFail("Unsupported label position");
                }
            }

            return { x: x, y: y };
        }

        private tryPositionForPolygonPosition(position: NewPointLabelPosition, labelDataPoint: LabelDataPoint, polygonInfoTransform: Transform, offset: number) {
            let polygon = (<LabelParentPolygon>labelDataPoint.parentShape).polygon;
            let pixelCentroid = polygonInfoTransform.applyToPoint(polygon.absoluteCentroid());
            let labelRect = this.getLabelPolygon(labelDataPoint, position, pixelCentroid, offset);
            let inverseTransorm = polygonInfoTransform.getInverse();
            let absoluteLabelRect = this.getAbsoluteRectangle(inverseTransorm, labelRect);

            return polygon.contains(absoluteLabelRect) ? labelRect : null;
        }

        /**
        * Tests a particular position/offset combination for the given data label.
        * If the label can be placed, returns the resulting bounding box for the data
        * label.  If not, returns null.
        */
        private tryPlaceLabelOutsidePolygon(grid: LabelArrangeGrid, position: NewPointLabelPosition, labelDataPoint: LabelDataPoint, offset: number, pixelCentroid: IPoint, shapesGrid: LabelPolygonArrangeGrid, inverseTransform: powerbi.visuals.Transform): IRect {
            let offsetForPosition = offset;
            let labelRect = this.getLabelPolygon(labelDataPoint, position, pixelCentroid, offsetForPosition);

            let otherLabelsConflict = grid.hasConflict(labelRect);

            if (!otherLabelsConflict) {
                let absoluteLabelRect = this.getAbsoluteRectangle(inverseTransform, labelRect);

                if (!shapesGrid.hasConflict(absoluteLabelRect, labelRect)) {
                    return labelRect;
                }
            }
            return null;
        }

        private getAbsoluteRectangle(inverseTransorm: Transform, rect: IRect) {
            return inverseTransorm.applyToRect(rect);
        }
    }

    export class LabelPolygonArrangeGrid {
        private grid: Polygon[][][];
        private viewport: IViewport;
        private cellSize: ISize;
        private columnCount: number;
        private rowCount: number;

        /**
         * A multiplier applied to the largest width height to attempt to balance # of
         * polygons in each cell and number of cells each polygon belongs to
         */
        private static cellSizeMultiplier = 2;

        constructor(polygons: Polygon[], viewport: IViewport) {
            this.viewport = viewport;
            let maxPolygonWidth = 0;
            let maxPolygonHeight = 0;

            for (let polygon of polygons) {
                let polygonSize: ISize = polygon.pixelBoundingRect;
                if (polygonSize.width > maxPolygonWidth) {
                    maxPolygonWidth = polygonSize.width;
                }
                if (polygonSize.height > maxPolygonHeight) {
                    maxPolygonHeight = polygonSize.height;
                }
            }

            if (maxPolygonWidth === 0) {
                maxPolygonWidth = viewport.width;
            }
            if (maxPolygonHeight === 0) {
                maxPolygonHeight = viewport.height;
            }

            let cellSize = this.cellSize = { width: maxPolygonWidth * LabelPolygonArrangeGrid.cellSizeMultiplier, height: maxPolygonHeight * LabelPolygonArrangeGrid.cellSizeMultiplier };
            this.columnCount = LabelPolygonArrangeGrid.getCellCount(cellSize.width, viewport.width, 1, 100);
            this.rowCount = LabelPolygonArrangeGrid.getCellCount(cellSize.height, viewport.height, 1, 100);
            let grid: Polygon[][][] = [];
            for (let i = 0, ilen = this.columnCount; i < ilen; i++) {
                grid[i] = [];
                for (let j = 0, jlen = this.rowCount; j < jlen; j++) {
                    grid[i][j] = [];
                }
            }

            this.grid = grid;

            for (let polygon of polygons) {
                this.add(polygon);
            }

        }

        public hasConflict(absolutLabelRect: IRect, pixelLabelRect: IRect): boolean {
            let containingIndexRect = this.getContainingGridSubsection(pixelLabelRect);
            let grid = this.grid;
            for (let x = containingIndexRect.xMin; x < containingIndexRect.xMax; x++) {
                for (let y = containingIndexRect.yMin; y < containingIndexRect.yMax; y++) {
                    for (let currentPolygon of grid[x][y]) {
                        if (currentPolygon.conflicts(absolutLabelRect)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        private add(polygon: Polygon): void {
            let containingIndexRect = this.getContainingGridSubsection(polygon.pixelBoundingRect);
            for (let x = containingIndexRect.xMin; x < containingIndexRect.xMax; x++) {
                for (let y = containingIndexRect.yMin; y < containingIndexRect.yMax; y++) {
                    this.grid[x][y].push(polygon);
                }
            }
        }

        private getContainingGridSubsection(rect: IRect): GridSubsection {
            return {
                xMin: LabelPolygonArrangeGrid.bound(Math.floor(rect.left / this.cellSize.width), 0, this.columnCount),
                xMax: LabelPolygonArrangeGrid.bound(Math.ceil((rect.left + rect.width) / this.cellSize.width), 0, this.columnCount),
                yMin: LabelPolygonArrangeGrid.bound(Math.floor(rect.top / this.cellSize.height), 0, this.rowCount),
                yMax: LabelPolygonArrangeGrid.bound(Math.ceil((rect.top + rect.height) / this.cellSize.height), 0, this.rowCount),
            };
        }

        private static getCellCount(step: number, length: number, minCount: number, maxCount: number): number {
            return LabelPolygonArrangeGrid.bound(Math.ceil(length / step), minCount, maxCount);
        }

        private static bound(value: number, min: number, max: number): number {
            return Math.max(Math.min(value, max), min);
        }

    }

}
