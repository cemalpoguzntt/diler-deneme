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
            "customActivity.controller.dnaFosfatlamaDöküm",

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
                    this.getModelData();

                },

                time: function () {
                    var day1 = new Date().getDate();
                    var month1 = new Date().getMonth() + 1;
                    var fullyear1 = new Date().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                },
                date1: function () {
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 = this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("datePicker").getDateValue().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;

                },
                date2: function () {
                    var day2 = this.getView().byId("datePicker").getSecondDateValue().getDate();
                    var month2 = this.getView().byId("datePicker").getSecondDateValue().getMonth() + 1;
                    var fullyear2 = this.getView().byId("datePicker").getSecondDateValue().getFullYear();
                    return fullyear2 + "-" + month2 + "-" + day2;

                },
                exceldate1: function () {
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 = this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("datePicker").getDateValue().getFullYear();
                    return day1 + "." + month1 + "." + fullyear1;

                },
                exceldate2: function () {
                    var day2 = this.getView().byId("datePicker").getSecondDateValue().getDate();
                    var month2 = this.getView().byId("datePicker").getSecondDateValue().getMonth() + 1;
                    var fullyear2 = this.getView().byId("datePicker").getSecondDateValue().getFullYear();
                    return day2 + "." + month2 + "." + fullyear2;

                },

                searchData: function () {

                    var toplamUretimFosfat = 0;
                    var toplamUretimAYT = 0;
                    var toplamUretimRW = 0;

                    var date1 = this.date1();
                    var date2 = this.date2();

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/T_Fosfatlama_Döküm",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeid,

                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    if (response[0].Rowsets.Rowset.Row == null) {
                        this.getView().byId("toplamUretimFosfat").setText(0);
                    }
                    else {
                        if (!!modelArr?.filter((i) => i.MATNR == "FOSFATLI_FILMASIN")[0]) {
                            var fosfatModel = modelArr?.filter((i) => i.MATNR == "FOSFATLI_FILMASIN");
                            for (var i = 0; i < fosfatModel.length; i++) {
                                var toplamUretimFosfat = fosfatModel[i].TOPLAM_URETIM + toplamUretimFosfat;
                            }
                        }

                        this.getView().byId("toplamUretimFosfat").setText(toplamUretimFosfat.toFixed(3));

                        if (!!modelArr?.filter((i) => i.RW_AYT == "AYT")[0]) {
                            var AYTModel = modelArr?.filter((i) => i.RW_AYT == "AYT");
                            for (var i = 0; i < AYTModel.length; i++) {
                                var toplamUretimAYT = AYTModel[i].TOPLAM_URETIM + toplamUretimAYT;
                            }
                        }
                        this.getView().byId("toplamUretimAYT").setText(toplamUretimAYT.toFixed(3));

                        if (!!modelArr?.filter((i) => i.RW_AYT == "REWORK")[0]) {
                            var reworkModel = modelArr?.filter((i) => i.RW_AYT == "REWORK");
                            for (var i = 0; i < reworkModel.length; i++) {
                                var toplamUretimRW = reworkModel[i].TOPLAM_URETIM + toplamUretimRW;
                            }
                        }
                        this.getView().byId("toplamUretimRW").setText(toplamUretimRW.toFixed(3));
                    }
                    this.getView().byId("FosfatDokum").setModel(tableModel);
                    this.getView().byId("FosfatDokum").getModel().refresh();
                },


                getModelData: function () {

                    var toplamUretimFosfat = 0;
                    var toplamUretimAYT = 0;
                    var toplamUretimRW = 0;

                    var date1 = this.time();
                    var date2 = this.time();

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/T_Fosfatlama_Döküm",


                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeid,

                        },
                        "O_JSON"
                    );
                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    // tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
                    if (response[0].Rowsets.Rowset.Row == null) {
                        this.getView().byId("toplamUretimFosfat").setText(0);
                    } else {
                        if (!!modelArr?.filter((i) => i.MATNR == "FOSFATLI_FILMASIN")[0]) {
                            var fosfatModel = modelArr?.filter((i) => i.MATNR == "FOSFATLI_FILMASIN");
                            for (var i = 0; i < fosfatModel.length; i++) {
                                var toplamUretimFosfat = fosfatModel[i].TOPLAM_URETIM + toplamUretimFosfat;
                            }
                        }

                        this.getView().byId("toplamUretimFosfat").setText(toplamUretimFosfat.toFixed(3));

                        if (!!modelArr?.filter((i) => i.RW_AYT == "AYT")[0]) {
                            var AYTModel = modelArr?.filter((i) => i.RW_AYT == "AYT");
                            for (var i = 0; i < AYTModel.length; i++) {
                                var toplamUretimAYT = AYTModel[i].TOPLAM_URETIM + toplamUretimAYT;
                            }
                        }
                        this.getView().byId("toplamUretimAYT").setText(toplamUretimAYT.toFixed(3));

                        if (!!modelArr?.filter((i) => i.RW_AYT == "REWORK")[0]) {
                            var reworkModel = modelArr?.filter((i) => i.RW_AYT == "REWORK");
                            for (var i = 0; i < reworkModel.length; i++) {
                                var toplamUretimRW = reworkModel[i].TOPLAM_URETIM + toplamUretimRW;
                            }
                        }
                        this.getView().byId("toplamUretimRW").setText(toplamUretimRW.toFixed(3));
                    }


                    this.getView().byId("datePicker").setValue(this.time() + " " + "- " + " " + this.time());
                    this.getView().byId("FosfatDokum").setModel(tableModel);
                    this.getView().byId("FosfatDokum").getModel().refresh();
                },

                createColumns: function () {
                    return [{
                        label: 'Tarih',
                        property: 'TARIH',
                        width: '20'
                    },
                    {
                        label: 'Vardiya',
                        property: 'VARDIYA',
                        width: '20'
                    },
                    {
                        label: 'Satış Sip No.',
                        property: 'SATIS_SIP',
                        width: '20'
                    },
                    {
                        label: 'Üretim Sip No.',
                        property: 'URETIM_SIP',
                        width: '20'
                    },
                    {
                        label: 'Rework - AYT',
                        property: 'RW_AYT',
                        width: '20'
                    },
                    {
                        label: 'Filmaşin Kalite',
                        property: 'KALITE',
                        width: '20'
                    },
                    {
                        label: 'Filmaşin Kalite Değişim',
                        property: 'KALITE_DEGISIM',
                        width: '20'
                    },
                    {
                        label: 'Filmaşin Çap (mm)',
                        property: 'CAP',
                        width: '20'
                    },
                    {
                        label: 'Döküm Numarası',
                        property: 'DOKUMNO',
                        width: '20'
                    },
                    {
                        label: 'Üretim (ton)',
                        property: 'TOPLAM_URETIM',
                        type: EdmType.Number,
                        width: '20'
                    },
                    {
                        label: 'Üretim (adet)',
                        property: 'URETIM_ADEDI',
                        type: EdmType.Number,
                        width: '20'
                    },
                    {
                        label: "Fosfat Toplam Üretim (ton)",
                        property: "Fosfat_Toplam_Uretim",
                        type: EdmType.Number,
                        width: "20",
                    },
                    {
                        label: "AYT Toplam Üretim (ton)",
                        property: "AYT_Toplam_Uretim",
                        type: EdmType.Number,
                        width: "20",
                    },
                    {
                        label: "Rework Toplam Üretim (ton)",
                        property: "RW_Toplam_Uretim",
                        type: EdmType.Number,
                        width: "20",
                    },

                    ];
                },

                onExport: function (oEvent) {

                    var oColumns = this.createColumns();
                    var tableModel = this.getView().byId("FosfatDokum").getModel();
                    if (!(!!tableModel?.oData)) {
                        MessageBox.error("Tabloda veri bulunmamaktadır.");
                        return;
                    }
                    var oDatas = tableModel.getData();
                    if (!(!!oDatas)) {
                        MessageBox.error("Tabloda veri bulunmamaktadır.");
                        return;
                    }

                    oDatas[0].Fosfat_Toplam_Uretim = this.getView().byId("toplamUretimFosfat").getText();

                    oDatas[0].AYT_Toplam_Uretim = this.getView().byId("toplamUretimAYT").getText();

                    oDatas[0].RW_Toplam_Uretim = this.getView().byId("toplamUretimRW").getText();


                    var oSettings = {
                        workbook: {
                            columns: oColumns
                        },
                        dataSource: oDatas,
                        fileName: "Fosfatlama_" + this.exceldate1() + "-" + this.exceldate2()
                    };
                    var oSheet = new Spreadsheet(oSettings);
                    oSheet.build().then(function () {
                        MessageToast.show("Tablo Excel'e aktarıldı.");
                    });
                },
            }
        );
    }
);