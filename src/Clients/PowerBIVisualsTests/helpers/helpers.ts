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

/* tslint:disable */
var powerBIAccessToken = "fooBarBaz";
var powerBIAccessTokenExpiry = "2115-01-01 00:00:00Z";
/* tslint:enable */

module powerbitests.helpers {
    debug.assertFailFunction = (message: string) => {
        expect(message).toBe('DEBUG asserts should never happen.  There is a product or test bug.');
    };

    export var dataSets = {
        singleMeasureDataViewSource: '{"descriptor": {"Select": [{"Kind": 2, "Value": "M0"}]}, "dsr": {"DataShapes":[{"Id":"DS0","PrimaryHierarchy":[{"Id":"DM0","Instances":[{"Calculations":[{"Id":"M0","Value":"21852688.46698004D"}]}]}],"IsComplete":true}]}}',
        dataViewSourceWithErrors: '{"descriptor":{"Select":[{"Kind":1,"Depth":0,"Value":"G0"},{"Kind":2,"Value":"M0","Subtotal":["A0"],"Min":["A2"],"Max":["A1"]}],"Expressions":{"Primary":{"Groupings":[{"Keys":[{"Source":{"Entity":"DimDate","Property":"Month Name"},"Select":0},{"Source":{"Entity":"DimDate","Property":"Month Number"},"Calc":"K0"}]}]}}},"dsr":{"DataShapes":[{"Id":"DS0","odata.error":{"code":"rsDataShapeQueryTranslationError","message":{"lang":"da-DK","value":"Data Shape Query translation failed with error code: \'InvalidExpression\'. Check the report server logs for more information."},"azure:values":[{"timestamp":"2015-01-15T07:44:45.8135124Z"},{"details":"Microsoft.ReportingServices.DataShapeQueryTranslation.DataShapeQueryTranslationException: Data Shape Query translation failed with error code: \'InvalidExpression\'. Check the report server logs for more information."},{"helpLink":"http://go.microsoft.com/fwlink/?LinkId=20476&EvtSrc=Microsoft.ReportingServ…Error&ProdName=Microsoft%20SQL%20Server%20Reporting%20Services&ProdVer=1.0"},{"productInfo":{"productName":"change this","productVersion":"1.0","productLocaleId":127,"operatingSystem":"OsIndependent","countryLocaleId":1033}},{"moreInformation":{"odata.error":{"code":"System.Exception","message":{"lang":"da-DK","value":"For more information about this error navigate to the report server on the local server machine, or enable remote errors"},"azure:values":[{"details":"System.Exception: For more information about this error navigate to the report server on the local server machine, or enable remote errors"}]}}}]}}]}}',
    };

    export function fireOnDataChanged(visual: powerbi.IVisual, dataOptions: powerbi.VisualDataChangedOptions): void {
        visual.onDataChanged(dataOptions);

        jasmine.clock().tick(0);
    }

    export function testDom(height: string, width: string): JQuery {
        var testhtml = '<div id="item" style="height: ' + height + 'px; width: ' + width + 'px;"></div>';
        setFixtures(testhtml);
        var element = $('#item');
        return element;
    }

    /**
     * Waits for some time and then Executes a function asynchronously
     * @param {function} fn Function to be executed
     * @param {number} delay Time to wait in milliseconds
     */
    export function executeWithDelay(fn: Function, delay: number): void {
        // Uninstalling jasmine.clock() to enable using the following timer
        jasmine.clock().uninstall();
        // Waiting until scroll takes effect
        setTimeout(() => {
            // Calling the assert function
            fn();
        }, delay);
        // installing the clock again
        jasmine.clock().install();
    }

    export function isTranslateCloseTo(actualTranslate: string, expectedX: number, expectedY: number): boolean {
        var splitChar = actualTranslate.indexOf(",") > 0 ? ',' : ' ';
        var translateValues = actualTranslate.substr(10, actualTranslate.lastIndexOf(')') - 10).split(splitChar);
        var actualX = parseInt(translateValues[0], 10);
        var actualY = parseInt(translateValues[1], 10);

        var deltaX = Math.abs(expectedX - actualX);
        var deltaY = Math.abs(expectedY - actualY);

        // Tolerance of 1
        return deltaX <= 1 && deltaY <= 1;
    }

    export function buildSelectorForColumn(queryName: string, data, selector?) {
        var newSelector = selector ? selector : {};
        newSelector[queryName] = data;

        return newSelector;
    }

    /** Returns a function that can be called to trigger a dragstart. */
    export function getDragStartTriggerFunctionForD3(element: HTMLElement): (arg) => {} {
        var elem: any = element;
        if (elem.__ondragstart)
            return arg => elem.__ondragstart(arg);
    }

    /** Returns a function that can be called to trigger a click. */
    export function getClickTriggerFunctionForD3(element: HTMLElement): (arg) => {} {
        var elem: any = element;
        if (elem.__onclick)
            return arg => elem.__onclick(arg);
    }

    /** Execute a dummy expect to avoid Jasmine warnings, since some tests only perform validation directly on the httpService via expectPOST etc. */
    export function suppressJasmineMissingExpectWarning(): void {
        expect(true).toBe(true);
    }

    export enum ClickEventType {
        Default = 0,
        CtrlKey = 1,
        AltKey = 2,
        ShiftKey = 4,
        MetaKey = 8,
    }

    // Defining a simulated click event (see http://stackoverflow.com/questions/9063383/how-to-invoke-click-event-programmaticaly-in-d3)
    jQuery.fn.d3Click = function (x: number, y: number, eventType?: ClickEventType) {
        var type = eventType || ClickEventType.Default;
        this.each(function (i, e) {
            var evt: any = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", // type
                true,   // canBubble
                true,   // cancelable
                window, // view
                0,      // detail
                x,      // screenX
                y,      // screenY
                x,      // clientX
                y,      // clientY
                type & ClickEventType.CtrlKey,  // ctrlKey
                type & ClickEventType.AltKey,  // altKey
                type & ClickEventType.ShiftKey,  // shiftKey
                type & ClickEventType.MetaKey,  // metaKey
                0,      // button
                null);  // relatedTarget

            e.dispatchEvent(evt);
        });
    };

    export function runWithImmediateAnimationFrames(func: () => void): void {
        var requestAnimationFrame = window.requestAnimationFrame;
        try {
            window.requestAnimationFrame = (f) => setTimeout(f, 0);
            func();
        }
        finally {
            window.requestAnimationFrame = requestAnimationFrame;
        }
    }

    export function deepCopy(object: any): any {
        return JSON.parse(JSON.stringify(object));
    }

    export function getLocalTimeFromUTCBase(utcYear: number, utcMonth: number, utcDay: number, utcHours: number, utcMinutes: number, utcSeconds: number): Date {
        // IMPORTANT: We need to dynamically calculate the UTC offset to use for our test date instead of hard-coding the offset so that:
        // i) It doesn't break when daylight savings changes the UTC offset
        // ii) The test works even if your machine is not in the US Pacific Time zone :)
        var baseDate = new Date(utcYear, utcMonth, utcDay, utcHours, utcMinutes, utcSeconds);
        var offsetMinutes = baseDate.getTimezoneOffset();
        var date = new Date();
        date.setTime(baseDate.getTime() - offsetMinutes * 60000);
        return date;
    }

    export function isUndefined(value) { return typeof value === 'undefined'; }

    export enum ContextMenuEntityButtonPosition {
        NewMeasure = 0,
        NewColumn = 1,
        Rename = 3,
        Delete = 4,
        Hide = 5,
        ViewHidden = 7,
        UnhideAll = 8,
    }
    export enum ContextMenuPropertyButtonPosition {
        AddFilter = 0,
        NewMeasure = 2,
        NewColumn = 3,
        Rename = 5,
        Delete = 6,
        Hide = 7,
        ViewHidden = 9,
        UnhideAll = 10,
    }

    export interface Point {
        x: number;
        y: number;
    }

    export function parseDateString(dateString: string): Date {
        var date,
            timezoneOffset;

        date = new Date(dateString);

        if (date.toString() === 'Invalid Date') {
            return null;
        }

        timezoneOffset = date.getTimezoneOffset();

        date.setMinutes(date.getMinutes() + timezoneOffset);

        return date;
    }

    export function createMouseWheelEvent(eventName: string, delta: number): MouseWheelEvent {
        let evt = document.createEvent("MouseEvents");
        evt.initMouseEvent(
            eventName,
            true,  // boolean canBubbleArg,
            true,  // boolean cancelableArg,
            null,  // views::AbstractView viewArg,
            120,   // long detailArg,
            0,     // long screenXArg,
            0,     // long screenYArg,
            0,     // long clientXArg,
            0,     // long clientYArg,
            false, // boolean ctrlKeyArg,
            false, // boolean altKeyArg,
            false, // boolean shiftKeyArg,
            false, // boolean metaKeyArg,
            0,     // unsigned short buttonArg,
            null   // EventTarget relatedTargetArg
            );
        let mouseEvt = <MouseWheelEvent>evt;
        mouseEvt.wheelDelta = delta;

        return mouseEvt;
    }

    /**
    * The original string, which ended with '...' was always placed in the DOM
    * CSS text-overflow property with value ellipsis was truncating the text visually
    * This function verifies the width and visual truncation are working appropriately
    */
    export function verifyEllipsisActive($element: JQuery): void {
        let element = $element.get(0);
        expect($element.css('textOverflow')).toBe('ellipsis');
        expect(element.offsetWidth).toBeLessThan(element.scrollWidth);
    }

    /** 
    Checks if value is in the given range 
    @val Value to check
    @min Min value of range
    @max Max value of range
    @returns True, if value falls in range. False, otherwise
    **/
    export function isInRange(val: number, min: number, max: number): Boolean {
        return min <= val && val <= max;
    }

    export function assertColorsMatch(actual: string, expected: string, invert: boolean = false): boolean {
        let rgbActual = jsCommon.Color.parseColorString(actual);
        let rgbExpected = jsCommon.Color.parseColorString(expected);

        if (invert)
            return expect(rgbActual).not.toEqual(rgbExpected);
        else
            return expect(rgbActual).toEqual(rgbExpected);
    }

    export function verifyPositionAttributes(element: JQuery): void {
        let checkAttrs = ['x', 'y', 'x1', 'x2', 'y1', 'y2'];
        for (let attr of checkAttrs) {
            let value = element.attr(attr);
            if (!value)
                continue;
            let numericValue = parseInt(element.attr(attr), 10);
            expect(isNaN(numericValue)).toBe(false);
        }
    }

    export class DataViewBuilder {
        private dataView: powerbi.DataView = { metadata: null };

        public setMetadata(metadata: powerbi.DataViewMetadata): DataViewBuilder {
            this.dataView.metadata = metadata;
            return this;
        }

        public getMetadata(): powerbi.DataViewMetadata {
            return this.dataView.metadata;
        }

        public setCategorical(categorical: powerbi.DataViewCategorical) {
            this.dataView.categorical = categorical;
            return this;
        }

        public setCategories(categories: powerbi.DataViewCategoryColumn[]) {
            this.initCategorical();
            this.dataView.categorical.categories = categories;

            return this;
        }

        public addCategory(category: powerbi.DataViewCategoryColumn) {
            this.initCategories();
            this.dataView.categorical.categories.push(category);
            return this;
        }

        public categoryBuilder(category: powerbi.DataViewCategoryColumn = { source: null, values: null }) {
            var self = this;

            return {
                setIdentity(identity: powerbi.DataViewScopeIdentity[]) {
                    category.identity = identity;
                    return this;
                },
                setIdentityFields(identityFields: powerbi.data.SQExpr[]) {
                    category.identityFields = identityFields;
                    return this;
                },
                setSource(source: powerbi.DataViewMetadataColumn) {
                    category.source = source;
                    return this;
                },
                setValues(values: any[]) {
                    category.values = values;
                    return this;
                },
                setObjects(objects: powerbi.DataViewObjects[]) {
                    category.objects = objects;
                    return this;
                },
                buildCategory() {
                    return self.addCategory(category);
                }
            };
        }

        public valueColumnsBuilder() {
            var self = this;

            this.initCategorical();

            var tempValues: powerbi.DataViewValueColumn[] = [];
            var valueIdentityFields: powerbi.data.SQExpr[];
            var source: powerbi.DataViewMetadataColumn;
            return {
                newValueBuilder(value: powerbi.DataViewValueColumn = <powerbi.DataViewValueColumn>{}) {
                    var self = this;
                    return {
                        setSubtotal(subtotal: any) {
                            value.subtotal = subtotal;
                            return this;
                        },
                        setMax(max: any) {
                            value.max = max;
                            return this;
                        },
                        setMin(min: any) {
                            value.min = min;
                            return this;
                        },
                        setHighlights(highlights: any[]) {
                            value.highlights = highlights;
                            return this;
                        },
                        setIdentity(identity: powerbi.DataViewScopeIdentity) {
                            value.identity = identity;
                            return this;
                        },
                        setMaxLocal(maxLocal: any) {
                            value.maxLocal = maxLocal;
                            return this;
                        },
                        setMinLocal(minLocal: any) {
                            value.minLocal = minLocal;
                            return this;
                        },
                        setSource(source: powerbi.DataViewMetadataColumn) {
                            value.source = source;
                            return this;
                        },
                        setValues(values: any[]) {
                            value.values = values;
                            return this;
                        },
                        setObjects(objects: powerbi.DataViewObjects[]) {
                            value.objects = objects;
                            return this;
                        },
                        buildNewValue() {
                            tempValues.push(value);
                            return self;
                        }
                    };
                },
                setValueIdentityFields(identityFields: powerbi.data.SQExpr[]) {
                    valueIdentityFields = identityFields;
                    return self;
                },
                setSource(src: powerbi.DataViewMetadataColumn) {
                    source = src;
                    return self;
                },
                buildValueColumns() {
                    self.setValues(powerbi.data.DataViewTransform.createValueColumns(tempValues, valueIdentityFields, source));
                    return self;
                }
            };
        }

        public setValues(values: powerbi.DataViewValueColumns) {
            this.initCategorical();
            this.dataView.categorical.values = values;

            return this;
        }

        public build(): powerbi.DataView {
            return this.dataView;
        }

        private initCategorical() {
            if (!this.dataView.categorical) {
                this.setCategorical({});
            }
        }

        private initCategories() {
            this.initCategorical();
            if (!this.dataView.categorical.categories) {
                this.setCategories([]);
            }
        }
    }

    export class VisualBuilder {
        private height: number;

        private width: number;

        private pluginType: string;

        private visualPluginService: powerbi.visuals.IVisualPluginService;

        private visualHostService: powerbi.IVisualHostServices;

        public get host(): powerbi.IVisualHostServices {
            return this.visualHostService;
        }

        private visualStyle: powerbi.IVisualStyle;

        private jQueryElement: JQuery;

        public get element(): JQuery {
            return this.jQueryElement;
        }

        private visualPlugin: powerbi.IVisual;

        public get visual(): powerbi.IVisual {
            return this.visualPlugin;
        }

        public transitionImmediate: boolean = true;

        public interactivitySelection: boolean = false;

        constructor(
            visualPluginService: powerbi.visuals.IVisualPluginService,
            pluginType: string,
            height: number = 500,
            width: number = 500
            ) {
            this.visualPluginService = visualPluginService;
            this.pluginType = pluginType;
            this.height = height;
            this.width = width;
        }

        private init(): void {
            this.createElement();
            this.createHost();
            this.createStyle();
            this.createVisual();

            this.initVisual();
        }

        private createElement(): void {
            this.jQueryElement = powerbitests.helpers.testDom(
                this.height.toString(),
                this.width.toString());
        }

        private createHost(): void {
            this.visualHostService = powerbitests.mocks.createVisualHostServices();
        }

        private createStyle(): void {
            this.visualStyle = powerbi.visuals.visualStyles.create();
        }

        private createVisual(): void {
            if (this.visualPluginService)
                this.visualPlugin =
                this.visualPluginService.getPlugin(this.pluginType).create();
        }

        private initVisual(): void {
            if (!this.visualPlugin)
                return;

            this.visualPlugin.init({
                element: this.jQueryElement,
                host: this.visualHostService,
                style: this.visualStyle,
                viewport: {
                    height: this.height,
                    width: this.width
                },
                animation: {
                    transitionImmediate: this.transitionImmediate
                },
                interactivity: {
                    selection: this.interactivitySelection
                }
            });
        }

        public setSize(height: number, width: number): void {
            this.height = height;
            this.width = width;

            this.init();
        }

        public build(): powerbi.IVisual {
            this.init();

            return this.visualPlugin;
        }
    }
}