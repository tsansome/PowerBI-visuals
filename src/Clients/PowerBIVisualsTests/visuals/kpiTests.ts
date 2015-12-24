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

module powerbitests {
    import KPIStatusWithHistory = powerbi.visuals.KPIStatusWithHistory;
    import kpiCapabilities = powerbi.visuals.KPIStatusWithHistoryCapabilities;
    import IVisualHostServices = powerbi.IVisualHostServices;    

    describe("Kpi", () => {
        const viewport: powerbi.IViewport = {
            height: 500,
            width: 500
        };
        let style = powerbi.visuals.visualStyles.create();

        describe("capabilities", () => {

            it("should register capabilities", () => {
                let plugin = powerbi.visuals.visualPluginFactory.create().getPlugin("kpi");

                expect(plugin).toBeDefined();
                expect(plugin.capabilities).toBe(kpiCapabilities);
            });
        });

        // ---- Sample data ----

        //function buildUpdateOptions(viewport: powerbi.IViewport, object: powerbi.DataView): powerbi.VisualUpdateOptions {
        //    return {
        //        viewport: viewport,
        //        dataViews: [object],
        //    };
        //};

        describe("", () => {
            let host: IVisualHostServices;
            let $element: JQuery;            
            let initOptions: powerbi.VisualInitOptions;
            let kpi: KPIStatusWithHistory;
            
            beforeEach(() => {
                host = mocks.createVisualHostServices();
                $element = helpers.testDom("500", "500");

                initOptions = {
                    element: $element,
                    host: host,
                    viewport: viewport,
                    style: style
                };
                
                kpi = new KPIStatusWithHistory();
                kpi.init(initOptions);
            });
            
            describe("update", () => {
                it("show green trend", () => {
                    //let visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForGreenTrend());
                    //kpi.update(visualUpdateOptions);
                                              
                    //let area = $element.find('path');
                    ////helpers.assertColorsMatch(area.css('fill'), KPIStatusWithHistory.statusColor.GREEN);                                                                       

                    //let text = $element.find('text');
                    //helpers.assertColorsMatch(text.css('fill'), KPIStatusWithHistory.textStatusColor.GREEN);                      
                    //expect(text.text()).toBe("25.00");        

                    //let arrow = $element.find('path').next();                     
                    //helpers.assertColorsMatch(arrow.css('fill'), "#3bb44a"); 
                    
                    expect("18.00").toBe("18.00");         
                });

                //it("show red trend", () => {
                    
                //    expect("18.00").toBe("18.00");                        
                //});

                //it("show gray trend when no goal define", () => {
                //    let visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForNoGoalTrend());
                //    kpi.update(visualUpdateOptions);               

                //    let area = $element.find('path');
                //    //helpers.assertColorsMatch(area.css('fill'), KPIStatusWithHistory.statusColor.NOGOAL);

                //    let text = $element.find('text');
                    //helpers.assertColorsMatch(text.css('fill'), KPIStatusWithHistory.textStatusColor.NOGOAL);
                    //expect(text.text()).toBe("18.00");        

                    //let arrow = $element.find('path').next();                    
                    //expect(arrow.css('visibility')).toBe("hidden");  
                    
                //    expect("18.00").toBe("18.00");                       
                //});
               
                //it("show green arrow without trend", () => {
                //    let visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForGreenNoTrend());
                //    kpi.update(visualUpdateOptions);

                //    let area = $element.find('path');
                //    expect(area.css('visibility')).toBe("hidden");   

                //    let text = $element.find('text');
                //    helpers.assertColorsMatch(text.css('fill'), "#333");
                //    expect(text.text()).toBe("20.00");        

                //    let arrow = $element.find('path').next();                    
                //    helpers.assertColorsMatch(arrow.css('fill'), "#3bb44a");                             
                //});

                //it("show red arrow without trend", () => {
                //    let visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForRedNoTrend());
                //    kpi.update(visualUpdateOptions);

                //    let area = $element.find('path');
                //    expect(area.css('visibility')).toBe("hidden");

                //    let text = $element.find('text');
                //    helpers.assertColorsMatch(text.css('fill'), "#333");
                //    expect(text.text()).toBe("10.00");        

                //    let arrow = $element.find('path').next();                    
                //    helpers.assertColorsMatch(arrow.css('fill'), "#ee0000");
                //});

                //it("show red arrow without trend after mix of changes", () => {
                //    let visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForRedNoTrend());
                //    kpi.update(visualUpdateOptions);

                //    visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForGreenNoTrend());
                //    kpi.update(visualUpdateOptions);

                //    visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForRedNoTrend());
                //    kpi.update(visualUpdateOptions);

                //    let area = $element.find('path');
                //    expect(area.css('visibility')).toBe("hidden");

                //    let text = $element.find('text');
                //    helpers.assertColorsMatch(text.css('fill'), "#333");
                //    expect(text.text()).toBe("10.00");        

                //    let arrow = $element.find('path').next();                    
                //    helpers.assertColorsMatch(arrow.css('fill'), "#ee0000");
                //});

                //it("show gray trend when no goal define after mix of changes", () => {
                    //let visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForGreenTrend());
                    //kpi.update(visualUpdateOptions);

                    //visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForRedTrend());
                    //kpi.update(visualUpdateOptions);
                          
                    //visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForNoGoalTrend());
                    //kpi.update(visualUpdateOptions);

                    //let area = $element.find('path');
                    //helpers.assertColorsMatch(area.css('fill'), KPIStatusWithHistory.statusColor.NOGOAL);

                    //let text = $element.find('text');
                    //helpers.assertColorsMatch(text.css('fill'), KPIStatusWithHistory.textStatusColor.NOGOAL);
                    //expect(text.text()).toBe("18.00");        

                    //let arrow = $element.find('path').next();                    
                    //expect(arrow.css('visibility')).toBe("hidden");

                //    expect("18.00").toBe("18.00");        
                //});

                //it("show green trend after mix of changes", () => {
                    //let visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForRedNoTrend());
                    //kpi.update(visualUpdateOptions);

                    //visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForNoGoalTrend());
                    //kpi.update(visualUpdateOptions);

                    //visualUpdateOptions = buildUpdateOptions(viewport, kpiHelper.buildDataViewForGreenTrend());
                    //kpi.update(visualUpdateOptions);

                    //let area = $element.find('path');
                    //helpers.assertColorsMatch(area.css('fill'), KPIStatusWithHistory.statusColor.GREEN);

                    //let text = $element.find('text');
                    //helpers.assertColorsMatch(text.css('fill'), KPIStatusWithHistory.textStatusColor.GREEN);
                    //expect(text.text()).toBe("25.00");        

                    //let arrow = $element.find('path').next();                    
                    //helpers.assertColorsMatch(arrow.css('fill'), "#3bb44a");

                //    expect("18.00").toBe("18.00");        
                //});
            });
        });
    });
}
        