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
        "sap/ui/export/library",
        "sap/ui/export/Spreadsheet",
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
        exportLibrary,
        Spreadsheet
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        return Controller.extend(
            "customActivity.controller.cycleCorrection",

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
                    this.selectWC();

                },

                selectWC : function(){



                    var response = TransactionCaller.sync(
                        "MES/Itelli/CAN_FRN/CYCLE_CORRECTION/T_ISYERI_SELECT",
    
                        {
                               
                        },
                        "O_JSON"
                    );
                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    this.getView().byId("isYeri").setModel(tableModel);
                        
                    this.getView().byId("isYeri").getModel().refresh();


                },

                controlStatu : function () {

                    var statu =this.getView().byId("StatuDurumu").getSelectedKey();

                    if (statu =="AKTIF" || statu == "HAZIRLIK") {
                        this.getView().byId("STarih").setEnabled(false)
                        this.getView().byId("STarih").setValue("");
                    }

                    else {

                        this.getView().byId("STarih").setEnabled(true)
                    }


                },

                getirFunc : function () {

                    var isyeri = this.getView().byId("isYeri").getSelectedKey();
                    var cevrimno =this.getView().byId("CevrimNo").getValue() ;

                    if (isyeri == "" || cevrimno ==""){

                        alert ("Bilgilerin getirilmesi için 'İşyeri' ve 'Çevrim Numarası' alanı doldurulmalıdır.")
                    }
                    
                    else {
                    var response = TransactionCaller.sync(
                        "MES/Itelli/CAN_FRN/CYCLE_CORRECTION/T_GETIR_SELECT",
    
                        {

                            I_WRKCTR : isyeri,
                            I_CYCLENO: cevrimno
                               
                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        alert(response[0]);
                    }

                    var modelArr = Array.isArray(response[0]?.Rowsets?.Rowset?.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);


                    this.getView().byId("StatuDurumu")?.setSelectedKey(tableModel.oData[0]?.FRN_STATU);
                    this.getView().byId("BTarih")?.setValue(tableModel.oData[0]?.START_TIME);
                    this.getView().byId("STarih")?.setValue(tableModel.oData[0]?.END_TIME);
                    }

                    this.controlStatu();

                  
                },



                kaydetFunc : function() {

                    

                    var isyeri = this.getView().byId("isYeri").getSelectedKey();
                    var cevrimno =this.getView().byId("CevrimNo").getValue() ;

                    var statu =this.getView().byId("StatuDurumu").getSelectedKey();
                    var sdate= this.getView().byId("BTarih").getValue();
                    var edate =this.getView().byId("STarih").getValue();

                    sdate = moment(sdate).format('YYYY-MM-DD'+'T'+'HH:mm:SS');
                    edate = moment(edate).format('YYYY-MM-DD'+'T'+'HH:mm:SS');


                    

                    if( (isyeri == "" || cevrimno == "" || statu=="" || sdate=="Invalid date" || edate=="Invalid date") && statu == "TAMAMLANDI") {

                        alert("İşlem yapabilmek için bütün alanları doldurmalısınız.");
                    }else if ( (statu == "HAZIRLIK" || statu == "AKTIF") && (isyeri == "" || cevrimno == "" || statu=="" || sdate=="Invalid date")){

                        alert("İşlem yapabilmek için bütün alanları doldurmalısınız.");
                    }
                        
                    else {


                        if(statu == "HAZIRLIK" || statu == "AKTIF"){

                            edate = "" ;
                        }


                    var response = TransactionCaller.sync(
                        "MES/Itelli/CAN_FRN/CYCLE_CORRECTION/T_KAYDET_BUTTON",
    
                        {

                            I_WRKCTR : isyeri,
                            I_CYCLENO: cevrimno,
                            I_STATU : statu,
                            I_SDATE : sdate,
                            I_EDATE : edate
                               
                        },
                        "O_JSON"
                    );

                    var isyeri = this.getView().byId("isYeri").setSelectedKey("");
                    var cevrimno =this.getView().byId("CevrimNo").setValue("") ;

                    var statu =this.getView().byId("StatuDurumu").setSelectedKey("");
                    var sdate= this.getView().byId("BTarih").setValue("");
                    var edate =this.getView().byId("STarih").setValue("");





                    if (response[1] == "E") {
                        alert(response[0]);
                    } else {
                        
    
                        MessageBox.information("Bilgiler başarılı şekilde kaydedildi.");
                    }

                    this.controlStatu();

                }
                },

               
                

             




            }
        );
    }
);