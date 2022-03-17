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
            "customActivity.controller.CanReport",

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


                onAfterRendering: function() {

                    var classname = document.getElementsByClassName("cNo");

                    /* document.getElementById("__text214-__clone31").parentNode.classList.add("cNo") */

                    for (var i = 0; i < classname.length; i++) {
                        classname[i].parentNode.classList.add("cNo2");
                        
                    }

                    var classname = document.getElementsByClassName("cNo2");
                     
                for (var i = 0; i < classname.length; i++) {
                    classname[i].addEventListener("click", function(e){
                        console.log(e)
                        that.getInnerText(e);
                    });
                }
                },

         
    

                getMessageModel: function (date1,date2) {
                                  
                    var d1 = moment(date1).format('YYYY-MM-DD');
                    var d2 = moment(date2).format('YYYY-MM-DD');

                    var response = TransactionCaller.sync(
						"MES/Itelli/CAN_FRN/CAN_REPORT/T_CAN_REPORT_SELECT",
						{
                            I_DATE1: d1,
                            I_DATE2: d2,

                        },
						"O_JSON"
					);
					var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
					
					this.getView().byId("idOrdersTable").setModel(tableModel);
					this.getView().byId("idOrdersTable").getModel().refresh();


                   

                   
                    
                

                    
                   
                                   
                },

                getInnerText : function (e) {

                    console.log(e.target.textContent);
                    var a = e.target.textContent ;

                    var cevap = confirm (a + " Numaralı çevrimin detaylarını görmek istediğinize emin misiniz? ")

                    if (cevap === true) {
                        this.getDetaildData(a);
                    }
                    

                },

                getDetaildData:function (a){


                    this.backToMainTable();

                    var response = TransactionCaller.sync(
						"MES/Itelli/CAN_FRN/CAN_REPORT/T_DETAIL_SELECT",
						{
                           I_TEXT : a,

                        },
						"O_JSON"
					);
					var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
					
					this.getView().byId("DetailTable").setModel(tableModel);
					this.getView().byId("DetailTable").getModel().refresh();

                },

                backToMainTable: function () {


                    var box1 = this.getView().byId("box1").getVisible() ; 

                    if (box1) {

                        this.getView().byId("box1").setVisible(false)
                        this.getView().byId("box2").setVisible(true)
                        this.getView().byId("MainPanel").setVisible(false);
                        this.getView().byId("idExcel1").setVisible(false);
                        this.getView().byId("MainTable").setVisible(true);
                        this.getView().byId("idExcel2").setVisible(true);
                    }

                    else {

                        this.getView().byId("box1").setVisible(true)
                        this.getView().byId("box2").setVisible(false)
                        this.getView().byId("MainPanel").setVisible(true);
                        this.getView().byId("idExcel1").setVisible(true);
                        this.getView().byId("MainTable").setVisible(false);
                        this.getView().byId("idExcel2").setVisible(false);
                        
                        setTimeout(() => {
                            this.onAfterRendering();   
                        }, 1000);
                        
                    }
                    



                },


                onClick: function (e){
                                    console.log(document.getElementById(e.target.dataset.sapUi).innerText);
                                    console.log(document.getElementById(document.getElementById(e.target.dataset.sapUi).parentNode.headers).innerHTML);
                                    
                               },

                backMainPanel : function () {

                    this.appComponent.getRouter().navTo("activity", {
                         activityId: "Z_FilmasinReport",
 
                         
                        });

                },


                createColumns: function () {
                                        return [{
                                            label: 'Kayıt Tarihi',
                                            property: 'CONFDATE',
                                            width: '20'
                                        },{
                                                label: 'Vardiya',
                                                property: 'VARDIYA',
                                                width: '20'
                                            }, {
                                            label: 'Çevrim Numarası',
                                            property: 'CYCLENO',
                                            width: '20'
                                        }, {
                                            label: 'İşyeri',
                                            property: 'ISYERI',
                                            width: '20'
                                        }, {
                                            label: 'Tüketim (TON)',
                                            property: 'TUKETIM',
                                            width: '20'
                                        }, {
                                            label: 'Üretilen Adet',
                                            property: 'URETILEN_ADET',
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
                                            fileName: "Can_Rapor"
                                        };
                                        var oSheet = new Spreadsheet(oSettings);
                                        oSheet.build().then(function () {
                                            MessageToast.show("Tablo Excel'e aktarıldı.");
                                        });
                                    },

                    createColumns2: function () {
                                            return [{
                                                label: 'Kayıt Tarihi',
                                                property: 'CONFDATE',
                                                width: '20'
                                            }, {
                                                label: 'Çevrim Numarası',
                                                property: 'CYCLENO',
                                                width: '20'
                                            }, {
                                                label: 'Müşteri Notu',
                                                property: 'TEXTMUSTERI',
                                                width: '20'
                                            },  {
                                                label: 'Grup No',
                                                property: 'GRUPNO',
                                                width: '20'
                                            }, {
                                                label: 'Sipariş No',
                                                property: 'AUFNR',
                                                width: '20'
                                            }, {
                                                label: 'Parti No',
                                                property: 'BATCH',
                                                width: '20'
                                            }, {
                                                label: 'Palet No',
                                                property: 'PALETNO',
                                                width: '20'
                                            }, {
                                                label: 'Konum',
                                                property: 'KONUM',
                                                width: '20'
                                            }, {
                                                label: 'Çap',
                                                property: 'CAP',
                                                width: '20'
                                            },
                                            {
                                                label: 'Ağırlık',
                                                property: 'WEIGHT',
                                                width: '20'
                                            },  {
                                                label: 'Kalite',
                                                property: 'KALITE',
                                                width: '20'
                                            }, {
                                                label: 'Kütük Mensei',
                                                property: 'KMENSEY',
                                                width: '20'
                                            }, 
                                                {
                                                label: 'Filmaşin Menşei',
                                                property: 'FMENSEI',
                                                width: '20'
                                            }, 
                                                {
                                                label: 'Başlatan K.',
                                                property: 'INSUSER',
                                                width: '20'
                                            }, {
                                                label: 'Bitiren K.',
                                                property: 'UPDUSER',
                                                width: '20'
                                            }, 
                                           
                                         
                                            ];
                                        },


                        onExport2: function (oEvent) {
                                                var oColumns = this.createColumns2();
                                                var tableModel = this.getView().byId("DetailTable").getModel();
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
                                                    fileName: "Can_Detay_Rapor"
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