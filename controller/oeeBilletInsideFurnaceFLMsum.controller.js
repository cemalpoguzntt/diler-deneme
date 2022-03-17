sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
        "sap/m/Dialog",
        "customActivity/scripts/custom",
        "customActivity/scripts/customStyle",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterType",
        "customActivity/scripts/customStyle",
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        TransactionCaller,
        Fragment,
        Dialog,
        customScripts,
        customStyle,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        customStyle
    ) {
        //"use strict";
        var that;

        return Controller.extend(
            "customActivity.controller.oeeBilletInsideFurnaceFLMsum",
            {
                /**
                 * Called when a controller is instantiated and its View controls (if available) are already created.
                 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
                 */

                formatter: formatter,

                onInit: function () {

                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();
                    this.appData.intervalState = true;
                    this.interfaces = this.appComponent.getODataInterface();
                    this.t=0;
                    this.getBilletList2();
                    this.getBilletList();
                    this.getBilletList3();
                    this.cikanilkkutuk();
                    this.rlyilkkutuk();
                    this.modelServices();
                    
                    

                },
        ///////////////////////////////////////////FIRIN İÇİ(3.TABLE)/////////////////////////////////////////////////////////////////////////
                getBilletList2: function (oEvent) {
                    var werks = this.appData.plant;
                    var workcenterid = this.appData.node.workcenterID;
                    //var aufnr = this.appData.selected.order.orderNo;
                    var params = {
              
                        "Param.2": werks,
                        "Param.3": workcenterid,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/Itelli/oeeBilet/Q_Firin_Ici_E",
                        params
                    );


                    tRunner.ExecuteQueryAsync(this, this.callBilletList2);
                    
          
                },
                callBilletList2: function (p_this, p_data) {
                    var tableData = [];
                    var characteristic = [];
                    var rows = p_data.Rowsets.Rowset[0].Row;
                    var werks = p_this.appData.plant;
                    var workcenterID = p_this.appData.node.workcenterID;
                    var aufnr = p_this.appData.selected.order.orderNo;
                    var boolean;
                    if (rows != undefined) {
                        for (var i = 0; i < rows.length; i++) {
                            boolean = true;
                            for (var k = 0; k < tableData.length; k++) {
                                if (rows[i].KTKID == tableData[k].KTKID) boolean = false;
                            }

                            if (boolean) tableData.push(rows[i]);
                        }
                        for (i = 0; i < rows.length; i++) {
                            for (k = 0; k < tableData.length; k++) {
                                if (tableData[k].KTKID == rows[i].KTKID)
                                    tableData[k][rows[i].CHARC] = rows[i].CHARC_VALUE;
                            }
                        }
 
                    }
                    // var oModel = new sap.ui.model.json.JSONModel();
                    // oModel.setData(tableData);
                    //  p_this.getView().setModel(oModel, "confirmBilletList2");

                        // Fırın İÇİ kütük
                        if(rows!=undefined){
                    var tableDataBIF = rows.filter(x => x.SIGNAL_POINT == "FIRIN İÇİ");
                    var oModelBIF = new sap.ui.model.json.JSONModel();
                    oModelBIF.setData(tableDataBIF);
                    p_this.getView().setModel(oModelBIF, "confirmBilletList2");
                

                }},
                /////////////////////////////////////////////////FIRIN GİRİŞİ (1. TABLE))//////////////////////////////////////////////////
                getBilletList: function (oEvent) {
                    
                    var werks = this.appData.plant;
                    var workcenterid = this.appData.node.workcenterID;
                    //var aufnr = this.appData.selected.order.orderNo;
                    var params = {
                      
                        "Param.2": werks,
                        "Param.3": workcenterid,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/Itelli/oeeBilet/furnaceInOut",
                        params
                    );

                    tRunner.ExecuteQueryAsync(this, this.callBilletList);

                },
                callBilletList: function (p_this, p_data) {
                    var tableData = [];
                    var characteristic = [];
                    var rows = p_data.Rowsets.Rowset[0].Row;
                    var werks = p_this.appData.plant;
                    var workcenterID = p_this.appData.node.workcenterID;
                    var aufnr = p_this.appData.selected.order.orderNo;
                    var boolean;
                    if (rows != undefined) {
                        for (var i = 0; i < rows.length; i++) {
                            boolean = true;
                            for (var k = 0; k < tableData.length; k++) {
                                if (rows[i].KTKID == tableData[k].KTKID) boolean = false;
                            }

                            if (boolean) tableData.push(rows[i]);
                        }
                        for (i = 0; i < rows.length; i++) {
                            for (k = 0; k < tableData.length; k++) {
                                if (tableData[k].KTKID == rows[i].KTKID)
                                    tableData[k][rows[i].CHARC] = rows[i].CHARC_VALUE;
                            }
                        }

                    }

                    // Fırın Girişi kütük
                    if(rows!=undefined){
                    var tableDataBEF = rows.filter(x => x.SIGNAL_POINT == "FIRIN GİRİŞİ");
                    var oModelBEF = new sap.ui.model.json.JSONModel();
                    oModelBEF.setData(tableDataBEF);
                    p_this.getView().setModel(oModelBEF, "confirmBilletListBEF");
                }},

                ////////////////////////////////////////////////FIRIN ÇIKIŞI(2.TABLO)////////////////////////////////////

                getBilletList3: function (oEvent) {
                    
                    var werks = this.appData.plant;
                    var workcenterid = this.appData.node.workcenterID;
                    //var aufnr = this.appData.selected.order.orderNo;
                    var params = {
                      
                        "Param.2": werks,
                        "Param.3": workcenterid,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/Itelli/oeeBilet/furnaceInOut",
                        params
                    );

                    tRunner.ExecuteQueryAsync(this, this.callBilletList3);

                },
                callBilletList3: function (p_this, p_data) {
                    var tableData = [];
                    var characteristic = [];
                    var rows = p_data.Rowsets.Rowset[0].Row;
                    var werks = p_this.appData.plant;
                    var workcenterID = p_this.appData.node.workcenterID;
                    var aufnr = p_this.appData.selected.order.orderNo;
                    var boolean;
                    if (rows != undefined) {
                        for (var i = 0; i < rows.length; i++) {
                            boolean = true;
                            for (var k = 0; k < tableData.length; k++) {
                                if (rows[i].KTKID == tableData[k].KTKID) boolean = false;
                            }

                            if (boolean) tableData.push(rows[i]);
                        }
                        for (i = 0; i < rows.length; i++) {
                            for (k = 0; k < tableData.length; k++) {
                                if (tableData[k].KTKID == rows[i].KTKID)
                                    tableData[k][rows[i].CHARC] = rows[i].CHARC_VALUE;
                            }
                        }

                    }

                    // Fırın CIKISI kütük
                    if(rows!=undefined){
                    var tableDataOUT = rows.filter(x => x.SIGNAL_POINT == "FIRIN ÇIKIŞI");
                    var oModelOUT = new sap.ui.model.json.JSONModel();
                    oModelOUT.setData(tableDataOUT);
                    p_this.getView().setModel(oModelOUT, "confirmBilletListOUT");
                }},
                cikanilkkutuk:function(){
                    var response = TransactionCaller.sync(
                        "MES/Itelli/oeeBilet/firstBilletFromFurnace",
            
                        {
                          
                        },
                        "O_JSON"
                      );
                      
                      var ktkid = (response[0].Rowsets.Rowset.Row)
                       ? response[0].Rowsets.Rowset.Row.KTKID:
                       ktkid="";
                  
                      this.getView().byId("label12").setText("FIRIN İÇİ KTKID: " + ktkid);
                    
                    
                    },
                    rlyilkkutuk:function(){
                        var response = TransactionCaller.sync(
                            "MES/Itelli/oeeBilet/firstBilletOfRelay",
                
                            {
                              
                            },
                            "O_JSON"
                          );
                          
                          var ktkid = (response[0].Rowsets.Rowset.Row)
                           ? response[0].Rowsets.Rowset.Row.KTKID:
                           ktkid="";
                  
                          this.getView().byId("label13").setText("ROLE YOLU İLK KTKID: " + ktkid);
                        
                        },

                        css:function(){
                            if(this.t>0){
                                document.getElementById(this.getView().byId("label12").sId).classList.add("neon");
                                document.getElementById(this.getView().byId("label13").sId).classList.add("neon");

                            }
                        },
                        
                        modelServices: function () {
                           
              
                            oTrigger = new sap.ui.core.IntervalTrigger(5000);
                            oTrigger.addListener(() => {
                                if (this.appData.intervalState) {
                                    this.getBilletList2();
                                    this.getBilletList();
                                    this.getBilletList3();
                                    this.cikanilkkutuk();
                                    this.rlyilkkutuk();
                                    this.css();
                                    this.t++;
                                    
                                    
              
                                }
                                console.log("interval çalışıyor");
              
                            }, this);
              
                        },

            }
        );
    }
);
