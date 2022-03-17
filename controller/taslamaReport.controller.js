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
            "customActivity.controller.taslamaReport",

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
                    

                    this.getMessageModel(this.getView().getViewData().appComponent.date1,this.getView().getViewData().appComponent.date2)

                },



         
    

                getMessageModel: function (date1,date2) {
                                  
                    var d1 = moment(date1).format('YYYY-MM-DD');
                    var d2 = moment(date2).format('YYYY-MM-DD');

                    var response = TransactionCaller.sync(
						"MES/Itelli/FLM_TAS/TASLAMA_REPORT/T_TASLAMA_RSELECT",
						{
                            I_DATE1: d1,
                            I_DATE2: d2,

                        },
						"O_JSON"
					);
					var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
					/* tableModel.setData(response[0]?.Rowsets?.Rowset?.Row); */ // tableModel değişkenine setData fonki ile bu adresteki şeyleri bas
					this.getView().byId("idOrdersTable").setModel(tableModel); //serhatTable id'deki view'a setmodel fonk aracılıyla tableModel içindeki bilgileri bas
					this.getView().byId("idOrdersTable").getModel().refresh();



                   
                                   
                },


                backMainPanel : function () {

                    this.appComponent.getRouter().navTo("activity", {
                         activityId: "Z_FilmasinReport",
 
                         
                        });

                },


                createColumns: function () {
                                        return [{
                                            label: 'Kayıt Tarihi',
                                            property: 'TARIH',
                                            width: '20'
                                        },  {label: 'Vardiya',
                                            property: 'VARDIYA',
                                            width: '20'
                                        }, {
                                            label: 'Sipariş Numarası',
                                            property: 'SIPNO',
                                            width: '20'
                                        }, {
                                            label: 'Planlı Miktar (Ton)',
                                            property: 'PLANLANAN_URETIM',
                                            width: '20'
                                        }, {
                                            label: 'Üretilen Miktar (Ton)',
                                            property: 'URETIM',
                                            width: '20'
                                        }, {
                                            label: 'Üretilen Adet',
                                            property: 'URETILEN_ADET',
                                            width: '20'
                                        }, {
                                            label: 'Tüketim (TON)',
                                            property: 'TUKETIM',
                                            width: '20'
                                        }, {
                                            label: 'Kalite',
                                            property: 'TASLAMA_KALITE',
                                            width: '20'
                                        },
                                        {
                                            label: 'Ebat',
                                            property: 'EBAT',
                                            width: '20'
                                        },
                                        {
                                            label: 'Boy',
                                            property: 'BOY',
                                            width: '20'
                                        },
                                     
                                        ];
                                    },
                                    onExport: function (oEvent) {
                                        var oColumns = this.createColumns();
                                        var tableModel = this.getView().byId("idOrdersTable").getModel();
                                        if (!(!!tableModel?.oData)) { // 2 adet ünlem konursa işlemi booelan olarak verir yani eğer data varsa içerisi true olur en baştaki ünlem ile tekrar false olur ve if çalışmaz
                                            MessageBox.error("Tabloda veri bulunmamaktadır.");
                                            return;
                                        }
                                        var oDatas = tableModel.getData();
                                        if (!(!!oDatas)) {
                                            MessageBox.error("Tabloda veri bulunmamaktadır.");
                                            return;
                                        }
                                        var oSettings = {
                                            workbook: {
                                                columns: oColumns
                                            },
                                            dataSource: oDatas,
                                            fileName: "Taslama_Rapor"
                                        };
                                        var oSheet = new Spreadsheet(oSettings);
                                        oSheet.build().then(function () {
                                            MessageToast.show("Tablo Excel'e aktarıldı.");
                                        });
                                    },




    }
);
    }
);