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

/// <reference path="../../_references.ts"/>

module powerbi.visuals.controls {

    export enum TablixType {
        Matrix,
        Table
    }

    export interface TablixFormattingPropertiesTable {
        general?: GeneralFormattingPropertiesTable;
        columns?: ColumnHeaderFormattingProperties;
        header?: BasicFormattingProperties;
        rows?: RowHeaderBasicFormattingProperties;
        values?: BasicFormattingProperties;
        totals?: TotalsBasicFormattingProperties;
    }

    export interface TablixFormattingPropertiesMatrix {
        general?: GeneralFormattingPropertiesMatrix;
        columns?: ColumnHeaderFormattingProperties;
        header?: BasicFormattingProperties;
        rows?: RowHeaderBasicFormattingProperties;
        values?: BasicFormattingProperties;
        totals?: TotalsBasicFormattingProperties;
    }

    export interface BasicFormattingProperties {
        fontColor: string;
        backgroundColor: string;
        outline: string;
    }

    export interface RowHeaderBasicFormattingProperties extends BasicFormattingProperties {
        showSeparators: boolean;
    }

    export interface TotalsBasicFormattingProperties extends BasicFormattingProperties {
        leadingSpace: number;
    }

    export interface ColumnHeaderFormattingProperties {
        showSeparators: boolean;
        separatorColor: string;
        separatorWeight: number;
    }

    export interface GeneralFormattingPropertiesTable {
        /** Property that drives whether columns should use automatically calculated (based on content) sizes for width or use persisted sizes.
        Default is true i.e. automatically calculate width based on column content */
        autoSizeColumnWidth: boolean;
        textSize: number;
        totals?: boolean;
        outlineColor?: string;
        outlineWeight?: number;
    }

    export interface GeneralFormattingPropertiesMatrix {
        /** Property that drives whether columns should use automatically calculated (based on content) sizes for width or use persisted sizes.
        Default is true i.e. automatically calculate width based on column content */
        autoSizeColumnWidth: boolean;
        textSize: number;
        rowSubtotals?: boolean;
        columnSubtotals?: boolean;
        outlineColor?: string;
        outlineWeight?: number;
    }
}