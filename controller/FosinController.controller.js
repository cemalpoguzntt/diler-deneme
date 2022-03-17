sap.ui.define(
    [
        "sap/m/MessageBox",
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
        "sap/m/Dialog",
        "sap/m/Text",
        "sap/m/TextArea",
        "sap/m/Button",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        
        "customActivity/scripts/customStyle"

    ],

    function (
        MessageBox,
        Controller,
        JSONModel,
        MessageToast,
        TransactionCaller,
        Fragment,
        Dialog,
        Text,
        TextArea,
        Button,
        Filter,
        FilterOperator,
        customStyle
    ) {
        "use strict";
        that=this;
        var globalresponse = [] ;
        var that;
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.FosinController",

            {
                selectedOrder: {
                    orderNumber: "",
                    status: "",
                    routingOperNo: "",
                    productionActivity: "",
                    releasedHeaderID: "",
                    releasedID: "",
                    baseUOM: "",
                    quantityReleased: "",
                    quantityReleasedUOM: "",
                    material: "",
                    startDate: "",
                    startTime: "",
                    activity: "",
                    runID: "",
                    numberOfCapacities: "",
                },

                onInit: function () {

                    that = this;
                    jsonDataForPriorityChange = [];
                    // this.router = sap.ui.core.UIComponent.getRouterFor(this);
                    // this.router.attachRouteMatched(this._fnRouteMatched, this);
                    //  this.router = new sap.ui.core.routing.Router(this);

                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();

                    this.interfaces = this.appComponent.getODataInterface();
                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();
                    this.interfaces = this.appComponent.getODataInterface();
                   
                    this.getdata();
                },

                 

                getdata: function () {

                    var aufnr = (this.appData.selected.order.orderNo).replace(/^0+/,'');
	                this.getView().byId("label8").setText(aufnr);

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/fosfatlamaToleranslar/T_CAP_SELECT",
                        {
                           I_1 : aufnr
                        },
                        "O_JSON"
                    );

                    var response1 = TransactionCaller.sync(
                        "MES/Itelli/EREN/fosfatlamaToleranslar/T_KALITE_SELECT",
                        {

                            I_1 : aufnr
                           
                        },
                        "O_JSON"
                    );

                    var cap = response[0].Rowsets.Rowset.Row.CHAR_DEGER ;
                    var kalite = response1[0].Rowsets.Rowset.Row.CHAR_DEGER ;

                                   
                
                var response3 = TransactionCaller.sync(
                    "MES/Itelli/EREN/fosfatlamaToleranslar/T_SELECT",
                    {
                        I_1 : cap,
                        I_2 : kalite


                    },
                    "O_JSON"
                );

                this.globalresponse = response3 ;

               
                /* var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                var tableModel = new sap.ui.model.json.JSONModel(modelArrr); */

               /*  this.getView().byId("input1").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.AB_NAOH_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.AB_NAOH_MAX);
                this.getView().byId("input2").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.AB_NT_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.AB_NT_MAX);
                this.getView().byId("input4").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.AB_KMN_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.AB_KMN_MAX); */
                this.getView().byId("input6").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.AB_SIC_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.AB_SIC_MAX);
                this.getView().byId("input7").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.AB_BKLM_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.AB_BKLM_MAX);
                this.getView().byId("input8").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.NB_PH_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.NB_PH_MAX);
                this.getView().byId("input9").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.NB_SIC_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.NB_SIC_MAX);
                this.getView().byId("input10").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.NB_BKLM_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.NB_BKLM_MAX);
                this.getView().byId("input11").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.D1_PH_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.D1_PH_MAX);
                this.getView().byId("input12").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.D1_BKLM_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.D1_BKLM_MAX);
                this.getView().byId("input13").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.D2_PH_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.D2_PH_MAX);
                this.getView().byId("input14").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.D2_BKLM_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.D2_BKLM_MAX);
                this.getView().byId("input15").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.AKB_PH_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.AKB_PH_MAX);
                this.getView().byId("input16").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.AKB_BKLM_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.AKB_BKLM_MAX);
                this.getView().byId("input17").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.FD_PH_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.FD_PH_MAX);
                this.getView().byId("input18").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.FD_BKLM_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.FD_BKLM_MAX);
                this.getView().byId("input19").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.FB_TA_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.FB_TA_MAX);
                this.getView().byId("input20").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.FB_SA_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.FB_SA_MAX);
                this.getView().byId("input21").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.FB_HIZ_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.FB_HIZ_MAX);
                this.getView().byId("input22").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.FB_SIC_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.FB_SIC_MAX);
                this.getView().byId("input23").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.FB_BKLM_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.FB_BKLM_MAX);
                    if (response3[0].Rowsets.Rowset.Row?.SB_TA_MIN == null || response3[0].Rowsets.Rowset.Row?.SB_TA_MAX == null) {
                        this.getView().byId("input24").setPlaceholder("0.00");
                    }
                    else{
                        this.getView().byId("input24").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.SB_TA_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.SB_TA_MAX);
                    }
                    if(response3[0].Rowsets.Rowset.Row?.SB_SA_MIN == null || response3[0].Rowsets.Rowset.Row?.SB_SA_MAX == null)
                    {this.getView().byId("input25").setPlaceholder("0.00");}
                    else {
                this.getView().byId("input25").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.SB_SA_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.SB_SA_MAX);
                    }
                    if(response3[0].Rowsets.Rowset.Row?.SB_SIC_MIN == null || response3[0].Rowsets.Rowset.Row?.SB_SIC_MAX == null){
                        this.getView().byId("input26").setPlaceholder("0.00") ; 
                    }
                    else {
                this.getView().byId("input26").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.SB_SIC_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.SB_SIC_MAX);
                    }
                    if(response3[0].Rowsets.Rowset.Row?.SB_BKLM_MIN == null || response3[0].Rowsets.Rowset.Row?.SB_BKLM_MAX == null){
                        this.getView().byId("input27").setPlaceholder("0.00") ;
                    }
                    else{
                this.getView().byId("input27").setPlaceholder("min." + response3[0].Rowsets.Rowset.Row?.SB_BKLM_MIN + " - Max." + response3[0].Rowsets.Rowset.Row?.SB_BKLM_MAX);
                    }
            

                },


                Warning: function() {

                    

                    var input6 = this.getView().byId("input6").getValue();
                    var input7 = this.getView().byId("input7").getValue();
                    var input8 = this.getView().byId("input8").getValue();
                    var input9 = this.getView().byId("input9").getValue();
                    var input10 = this.getView().byId("input10").getValue();
                    var input11 = this.getView().byId("input11").getValue();
                    var input12 = this.getView().byId("input12").getValue();
                    var input13 = this.getView().byId("input13").getValue();
                    var input14 = this.getView().byId("input14").getValue();
                    var input15 = this.getView().byId("input15").getValue();
                    var input16 = this.getView().byId("input16").getValue();
                    var input17 = this.getView().byId("input17").getValue();
                    var input18 = this.getView().byId("input18").getValue();
                    var input19 = this.getView().byId("input19").getValue();
                    var input20 = this.getView().byId("input20").getValue();
                    var input21 = this.getView().byId("input21").getValue();
                    var input22 = this.getView().byId("input22").getValue();
                    var input23 = this.getView().byId("input23").getValue();
                    var input24 = this.getView().byId("input24").getValue();
                    var input25 = this.getView().byId("input25").getValue();
                    var input26 = this.getView().byId("input26").getValue();
                    var input27 = this.getView().byId("input27").getValue();

                   

                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.AB_SIC_MIN  <= input6) && (input6 <= this.globalresponse[0].Rowsets.Rowset.Row?.AB_SIC_MAX)) && (input6 != "")){document.getElementById(this.getView().byId("input6").sId + "-inner").classList.add("neon");document.getElementById(this.getView().byId("text6").sId).classList.add("neon");}else { document.getElementById(this.getView().byId("input6").sId +"-inner").classList.remove("neon");document.getElementById(this.getView().byId("text6").sId).classList.remove("neon");}                
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.AB_BKLM_MIN  <= input7) && (input7 <= this.globalresponse[0].Rowsets.Rowset.Row?.AB_BKLM_MAX)) && (input7 != "")){document.getElementById(this.getView().byId("input7").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text7").sId).classList.add("neon");}else { document.getElementById(this.getView().byId("input7").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text7").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.NB_PH_MIN  <= input8) && (input8 <= this.globalresponse[0].Rowsets.Rowset.Row?.NB_PH_MAX)) && (input8 != "")){document.getElementById(this.getView().byId("input8").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text8").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input8").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text8").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.NB_SIC_MIN  <= input9) && (input9 <= this.globalresponse[0].Rowsets.Rowset.Row?.NB_SIC_MAX)) && (input9 != "")){document.getElementById(this.getView().byId("input9").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text9").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input9").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text9").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.NB_BKLM_MIN  <= input10) && (input10 <= this.globalresponse[0].Rowsets.Rowset.Row?.NB_BKLM_MAX)) && (input10 != "")){document.getElementById(this.getView().byId("input10").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text10").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input10").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text10").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.D1_PH_MIN  <= input11) && (input11 <= this.globalresponse[0].Rowsets.Rowset.Row?.D1_PH_MAX)) && (input11 != "")){document.getElementById(this.getView().byId("input11").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text11").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input11").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text11").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.D1_BKLM_MIN  <= input12) && (input12 <= this.globalresponse[0].Rowsets.Rowset.Row?.D1_BKLM_MAX)) && (input12 != "")){document.getElementById(this.getView().byId("input12").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text12").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input12").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text12").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.D2_PH_MIN  <= input13) && (input13 <= this.globalresponse[0].Rowsets.Rowset.Row?.D2_PH_MAX)) && (input13 != "")){document.getElementById(this.getView().byId("input13").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text13").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input13").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text13").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.D2_BKLM_MIN  <= input14) && (input14 <= this.globalresponse[0].Rowsets.Rowset.Row?.D2_BKLM_MAX)) && (input14 != "")){document.getElementById(this.getView().byId("input14").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text14").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input14").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text14").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.AKB_PH_MIN  <= input15) && (input15 <= this.globalresponse[0].Rowsets.Rowset.Row?.AKB_PH_MAX)) && (input15 != "")){document.getElementById(this.getView().byId("input15").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text15").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input15").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text15").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.AKB_BKLM_MIN  <= input16) && (input16 <= this.globalresponse[0].Rowsets.Rowset.Row?.AKB_BKLM_MAX)) && (input16 != "")){document.getElementById(this.getView().byId("input16").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text16").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input16").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text16").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.FD_PH_MIN  <= input17) && (input17 <= this.globalresponse[0].Rowsets.Rowset.Row?.FD_PH_MAX)) && (input17 != "")){document.getElementById(this.getView().byId("input17").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text17").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input17").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text17").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.FD_BKLM_MIN  <= input18) && (input18 <= this.globalresponse[0].Rowsets.Rowset.Row?.FD_BKLM_MAX)) && (input18 != "")){document.getElementById(this.getView().byId("input18").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text18").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input18").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text18").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_TA_MIN  <= input19) && (input19 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_TA_MAX)) && (input19 != "")){document.getElementById(this.getView().byId("input19").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text19").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input19").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text19").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_SA_MIN  <= input20) && (input20 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_SA_MAX)) && (input20 != "")){document.getElementById(this.getView().byId("input20").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text20").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input20").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text20").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_HIZ_MIN  <= input21) && (input21 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_HIZ_MAX)) && (input21 != "")){document.getElementById(this.getView().byId("input21").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text21").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input21").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text21").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_SIC_MIN  <= input22) && (input22 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_SIC_MAX)) && (input22 != "")){document.getElementById(this.getView().byId("input22").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text22").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input22").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text22").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_BKLM_MIN  <= input23) && (input23 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_BKLM_MAX)) && (input23 != "")){document.getElementById(this.getView().byId("input23").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text23").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input23").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text23").sId).classList.remove("neon");}
                   /*  if (!((this.globalresponse[0].Rowsets.Rowset.Row?.SB_TA_MIN  <= input24) && (input24 <= this.globalresponse[0].Rowsets.Rowset.Row?.SB_TA_MAX)) && (input24 != "")){document.getElementById(this.getView().byId("input24").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text24").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input24").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text24").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.SB_SA_MIN  <= input25) && (input25 <= this.globalresponse[0].Rowsets.Rowset.Row?.SB_SA_MAX)) && (input25 != "")){document.getElementById(this.getView().byId("input25").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text25").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input25").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text25").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.SB_SIC_MIN  <= input26) && (input26 <= this.globalresponse[0].Rowsets.Rowset.Row?.SB_SIC_MAX)) && (input26 != "")){document.getElementById(this.getView().byId("input26").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text26").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input26").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text26").sId).classList.remove("neon");}
                    if (!((this.globalresponse[0].Rowsets.Rowset.Row?.SB_BKLM_MIN  <= input27) && (input27 <= this.globalresponse[0].Rowsets.Rowset.Row?.SB_BKLM_MAX)) && (input27 != "")){document.getElementById(this.getView().byId("input27").sId + "-inner").classList.add("neon"); document.getElementById(this.getView().byId("text27").sId).classList.add("neon");} else { document.getElementById(this.getView().byId("input27").sId + "-inner").classList.remove("neon"); document.getElementById(this.getView().byId("text27").sId).classList.remove("neon");} */
                    


                        
                        
                        

                },

                
                

                Cal: function () {

                    var input1 = this.getView().byId("input1").getValue(); 
                    var input2 = this.getView().byId("input2").getValue(); 
                    var input3 = (input1*0.49)/input2 ;
                    var input4 = this.getView().byId("input4").getValue(); 
                    var input5 = input4 * 1.12 ;

                    this.getView().byId("input3").setValue(input3.toFixed(3)) ;
                    this.getView().byId("input5").setValue(input5.toFixed(3)) ;

                },

                /* getModelData: function () {
					var response = TransactionCaller.sync(
						"MES/Itelli/EREN/fosfatlamaToleranslar/T_SELECT",
						{},
						"O_JSON"
					);
					var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
					/* tableModel.setData(response[0]?.Rowsets?.Rowset?.Row); */ // tableModel değişkenine setData fonki ile bu adresteki şeyleri bas
					/* this.getView().byId("serhatTable").setModel(tableModel); */ //serhatTable id'deki view'a setmodel fonk aracılıyla tableModel içindeki bilgileri bas
					/* this.getView().byId("serhatTable").getModel().refresh(); */ // sayfayı refresh ettirerek bilgiyi anında düşürtme
				//},


                Execute: function () {

                   
                    var input1 = this.getView().byId("input1").getValue(); 
                    var input2 = this.getView().byId("input2").getValue(); 
                    var input3 = ((input1*0.49)/input2).toFixed(3) ;
                    var input4 = this.getView().byId("input4").getValue(); 
                    var input5 = (input4 * 1.12).toFixed(3) ;
                    var input6 = this.getView().byId("input6").getValue(); 
                    var input7 = this.getView().byId("input7").getValue(); 
                    var input8 = this.getView().byId("input8").getValue();
                    var input9 = this.getView().byId("input9").getValue();
                    var input10 = this.getView().byId("input10").getValue();
                    var input11 = this.getView().byId("input11").getValue();
                    var input12 = this.getView().byId("input12").getValue();
                    var input13 = this.getView().byId("input13").getValue();
                    var input14 = this.getView().byId("input14").getValue();
                    var input15 = this.getView().byId("input15").getValue();
                    var input16 = this.getView().byId("input16").getValue();
                    var input17 = this.getView().byId("input17").getValue();
                    var input18 = this.getView().byId("input18").getValue();
                    var input19 = this.getView().byId("input19").getValue();
                    var input20 = this.getView().byId("input20").getValue();
                    var input21 = this.getView().byId("input21").getValue();
                    var input22 = this.getView().byId("input22").getValue();
                    var input23 = this.getView().byId("input23").getValue();
                    var input24 = this.getView().byId("input24").getValue();
                    var input25 = this.getView().byId("input25").getValue();
                    var input26 = this.getView().byId("input26").getValue();
                    var input27 = this.getView().byId("input27").getValue();

                    var d1 = (new Date().getDate()).toString();
                    if (d1.length == "1"){ d1 = "0" + d1 ; }
                    else{d1=d1};

                    var m1 = (new Date().getMonth() + 1).toString();
                    if (m1.length == 1){ m1 = "0" + m1 ; }
                    else{m1=m1};

                    var y1 = (new Date().getFullYear()).toString();

                    var date = y1 +"-"+m1+"-" + d1 ;
                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;
                    var shift = this.appData.shift.shiftID;
                    var aufnr = this.appData.selected.order.orderNo;
                    var insuser = this.appData.user.userID;
                    
                    if(   input1 == ""  && input2 === "" && input3 === "NaN" && input4 === "" && input5 === "0.000" && input6 === "" && input7 === "" && input8 === "" && input9 === "" && input10 === "" && input11 === "" && input12 === "" && input13 === "" && input14 === "" && input15 === "" && input16 === "" && input17 === "" && input18 === "" && input19 === "" && input20 === "" && input21 === "" && input22 === "" && input23 === "" && input24 === "" && input25 === "" && input26 === "" && input27 === "" ){

                        alert("En az bir adet veri giriş alanı doldurulmalıdır.\nLütfen en az bir adet veri giriş alanı doldurup tekrar deneyin.");
                        return

                        
                    }

                    if (  (input2 != "" && input3==="NaN") || (input1 != "" && input3==="NaN") ||input3 === "Infinity" || input3 === "0.000" || input3 === "0.00"){

                        alert ("Girilen NaOH Sarfiyatı veya Numune Tartımı verisi hatalıdır.\nLütfen kontrol edip tekrar deneyiniz.");
                        return
                    }

                    if(input3 === "NaN"){ input3 = "" ;  }
                    if(input5 == "0.000"){ input5 = "" ;  }
                    
                    /* var Array = [] ;

                    for (let i = 1; i < 28; i++) {
                        console.log(i) ;
                        
                        

                       Array[i] = this.getView().byId("input" + i).getValue();
                      }


                      var Jsonarray = JSON.stringify(Array) ;  */



                        
                      if ((!((this.globalresponse[0].Rowsets.Rowset.Row?.AB_SIC_MIN  <= input6) && (input6 <= this.globalresponse[0].Rowsets.Rowset.Row?.AB_SIC_MAX)) && (input6 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.AB_BKLM_MIN  <= input7) && (input7 <= this.globalresponse[0].Rowsets.Rowset.Row?.AB_BKLM_MAX)) && (input7 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.NB_PH_MIN  <= input8) && (input8 <= this.globalresponse[0].Rowsets.Rowset.Row?.NB_PH_MAX)) && (input8 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.NB_SIC_MIN  <= input9) && (input9 <= this.globalresponse[0].Rowsets.Rowset.Row?.NB_SIC_MAX)) && (input9 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.NB_BKLM_MIN  <= input10) && (input10 <= this.globalresponse[0].Rowsets.Rowset.Row?.NB_BKLM_MAX)) && (input10 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.D1_PH_MIN  <= input11) && (input11 <= this.globalresponse[0].Rowsets.Rowset.Row?.D1_PH_MAX)) && (input11 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.D1_BKLM_MIN  <= input12) && (input12 <= this.globalresponse[0].Rowsets.Rowset.Row?.D1_BKLM_MAX)) && (input12 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.D2_PH_MIN  <= input13) && (input13 <= this.globalresponse[0].Rowsets.Rowset.Row?.D2_PH_MAX)) && (input13 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.D2_BKLM_MIN  <= input14) && (input14 <= this.globalresponse[0].Rowsets.Rowset.Row?.D2_BKLM_MAX)) && (input14 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.AKB_PH_MIN  <= input15) && (input15 <= this.globalresponse[0].Rowsets.Rowset.Row?.AKB_PH_MAX)) && (input15 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.AKB_BKLM_MIN  <= input16) && (input16 <= this.globalresponse[0].Rowsets.Rowset.Row?.AKB_BKLM_MAX)) && (input16 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.FD_PH_MIN  <= input17) && (input17 <= this.globalresponse[0].Rowsets.Rowset.Row?.FD_PH_MAX)) && (input17 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.FD_BKLM_MIN  <= input18) && (input18 <= this.globalresponse[0].Rowsets.Rowset.Row?.FD_BKLM_MAX)) && (input18 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_TA_MIN  <= input19) && (input19 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_TA_MAX)) && (input19 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_SA_MIN  <= input20) && (input20 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_SA_MAX)) && (input20 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_HIZ_MIN  <= input21) && (input21 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_HIZ_MAX)) && (input21 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_SIC_MIN  <= input22) && (input22 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_SIC_MAX)) && (input22 != "")) || (!((this.globalresponse[0].Rowsets.Rowset.Row?.FB_BKLM_MIN  <= input23) && (input23 <= this.globalresponse[0].Rowsets.Rowset.Row?.FB_BKLM_MAX)) && (input23 != ""))  ) {

                        var cevap = confirm ("Belirtilen aralık dışında veriler mevcut.\nDevam etmek istediğinize emin misiniz?") ; 

                      }
                      
                      else {
                        var response = TransactionCaller.sync(
                            "MES/Itelli/FOSPARAM/T_INSERT",
                            {
        
                                I_1: input1,
                                I_2: input2,
                                I_3: input3,
                                I_4: input4,
                                I_5: input5,
                                I_6: input6,
                                I_7: input7,
                                I_8: input8,
                                I_9: input9,
                                I_10: input10,
                                I_11: input11,
                                I_12: input12,
                                I_13: input13,
                                I_14: input14,
                                I_15: input15,
                                I_16: input16,
                                I_17: input17,
                                I_18: input18,
                                I_19: input19,
                                I_20: input20,
                                I_21: input21,
                                I_22: input22,
                                I_23: input23,
                                I_24: input24,
                                I_25: input25,
                                I_26: input26,
                                I_27: input27,
                                I_28: date,
                                I_29: client,
                                I_30: plant,
                                I_31: nodeid,
                                I_32: shift,
                                I_33: aufnr,
                                I_34: insuser
    
                                
                                
                            },
                            "O_JSON"
                        );
        
                        if(response[1] == "E") {
                    alert(response[0]);
                } else {
        
        
                    MessageBox.information("Veriler Başarılı bir şekilde kayıt edildi");
                }
        
                            this.getView().byId("input1").setValue("") ;                    
                            this.getView().byId("input2").setValue("") ;                   
                            this.getView().byId("input3").setValue("") ;                    
                            this.getView().byId("input4").setValue("") ;                    
                            this.getView().byId("input5").setValue("") ;                    
                            this.getView().byId("input6").setValue("") ;                    
                            this.getView().byId("input7").setValue("") ;                    
                            this.getView().byId("input8").setValue("") ;
                            this.getView().byId("input9").setValue("") ;
                            this.getView().byId("input10").setValue("") ;
                            this.getView().byId("input11").setValue("") ;
                            this.getView().byId("input12").setValue("") ;
                            this.getView().byId("input13").setValue("") ;
                            this.getView().byId("input14").setValue("") ;
                            this.getView().byId("input15").setValue("") ;
                            this.getView().byId("input16").setValue("") ;
                            this.getView().byId("input17").setValue("") ;
                            this.getView().byId("input18").setValue("") ;
                            this.getView().byId("input19").setValue("") ;
                            this.getView().byId("input20").setValue("") ;
                            this.getView().byId("input21").setValue("") ;
                            this.getView().byId("input22").setValue("") ;
                            this.getView().byId("input23").setValue("") ;
                            this.getView().byId("input24").setValue("") ;
                            this.getView().byId("input25").setValue("") ;
                            this.getView().byId("input26").setValue("") ;
                            this.getView().byId("input27").setValue("") ;
    
                       
    

                      }

                      if( cevap === true){

                        if(input3 == "NaN"){ input3 = "" ; }
                        if(input5 == "0.000"){ input5 = "" ;  }
                

                      var response = TransactionCaller.sync(
                        "MES/Itelli/FOSPARAM/T_INSERT",
                        {
    
                            I_1: input1,
                            I_2: input2,
                            I_3: input3,
                            I_4: input4,
                            I_5: input5,
                            I_6: input6,
                            I_7: input7,
                            I_8: input8,
                            I_9: input9,
                            I_10: input10,
                            I_11: input11,
                            I_12: input12,
                            I_13: input13,
                            I_14: input14,
                            I_15: input15,
                            I_16: input16,
                            I_17: input17,
                            I_18: input18,
                            I_19: input19,
                            I_20: input20,
                            I_21: input21,
                            I_22: input22,
                            I_23: input23,
                            I_24: input24,
                            I_25: input25,
                            I_26: input26,
                            I_27: input27,
                            I_28: date,
                            I_29: client,
                            I_30: plant,
                            I_31: nodeid,
                            I_32: shift,
                            I_33: aufnr,
                            I_34: insuser

                            
                            
                        },
                        "O_JSON"
                    );
    
                    if(response[1] == "E") {
                alert(response[0]);
            } else {
    
    
                MessageBox.information("Veriler Başarılı bir şekilde kayıt edildi");
            }
    
                        this.getView().byId("input1").setValue("") ;                    
                        this.getView().byId("input2").setValue("") ;                   
                        this.getView().byId("input3").setValue("") ;                    
                        this.getView().byId("input4").setValue("") ;                    
                        this.getView().byId("input5").setValue("") ;                    
                        this.getView().byId("input6").setValue("") ;                    
                        this.getView().byId("input7").setValue("") ;                    
                        this.getView().byId("input8").setValue("") ;
                        this.getView().byId("input9").setValue("") ;
                        this.getView().byId("input10").setValue("") ;
                        this.getView().byId("input11").setValue("") ;
                        this.getView().byId("input12").setValue("") ;
                        this.getView().byId("input13").setValue("") ;
                        this.getView().byId("input14").setValue("") ;
                        this.getView().byId("input15").setValue("") ;
                        this.getView().byId("input16").setValue("") ;
                        this.getView().byId("input17").setValue("") ;
                        this.getView().byId("input18").setValue("") ;
                        this.getView().byId("input19").setValue("") ;
                        this.getView().byId("input20").setValue("") ;
                        this.getView().byId("input21").setValue("") ;
                        this.getView().byId("input22").setValue("") ;
                        this.getView().byId("input23").setValue("") ;
                        this.getView().byId("input24").setValue("") ;
                        this.getView().byId("input25").setValue("") ;
                        this.getView().byId("input26").setValue("") ;
                        this.getView().byId("input27").setValue("") ;


                      
        
                        document.getElementById(this.getView().byId("input6").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text6").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input7").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text7").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input8").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text8").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input9").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text9").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input10").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text10").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input11").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text11").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input12").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text12").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input13").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text13").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input14").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text14").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input15").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text15").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input16").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text16").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input17").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text17").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input18").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text18").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input19").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text19").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input20").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text20").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input21").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text21").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input22").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text22").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input23").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text23").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input24").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text24").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input25").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text25").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input26").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text26").sId).classList.remove("neon");
                        document.getElementById(this.getView().byId("input27").sId +"-inner").classList.remove("neon") ; document.getElementById(this.getView().byId("text27").sId).classList.remove("neon");

                            
                            
                            
    
                           
                          

        }            

    },

                
             




            }
        );
    }
);