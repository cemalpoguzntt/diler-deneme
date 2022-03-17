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
            "customActivity.controller.dnaPcWireProduction",

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

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;
                    var toplamHurda = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    var date1 = this.date1();
                    var date2 = this.date2();

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/PC Wire/T_SELECT_PcWire",

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
                        this.getView().byId("toplamUretim").setText(0);
                        this.getView().byId("toplamTuketim").setText(0);
                        this.getView().byId("toplamHurda").setText(0);
                        this.getView().byId("toplamFire").setText(0);

                    }
                    else {
                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamUretim = modelArr[i].MAMUL_URETIM + toplamUretim;
                            var toplamHurda = modelArr[i].TOPLAM_HURDA + toplamHurda;
                            var toplamTuketim = modelArr[i].SARF_TEL_MIKTAR + toplamTuketim;
                        }

                        if (!!modelArr.filter((i) => i.PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr.filter((i) => i.PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].MAMUL_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretim").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercnt").setText(stdPercnt.toFixed(3));
                        }
                        if (!!modelArr.filter((i) => i.PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr.filter((i) => i.PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].MAMUL_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretim").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercnt").setText(sapmaPercnt.toFixed(3));
                        }

                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;
                        this.getView().byId("toplamUretim").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketim").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamHurda").setText(toplamHurda.toFixed(3));
                        this.getView().byId("toplamFire").setText(toplamFire.toFixed(3));
                    }

                    this.getView().byId("pcWireReport").setModel(tableModel);
                    this.getView().byId("pcWireReport").getModel().refresh();
                },


                getModelData: function () {

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamHurda = 0;
                    var toplamFire = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    var date1 = this.time();
                    var date2 = this.time();

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/PC Wire/T_SELECT_PcWire",


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
                        this.getView().byId("toplamUretim").setText(0);
                        this.getView().byId("toplamTuketim").setText(0);
                        this.getView().byId("toplamHurda").setText(0);
                        this.getView().byId("toplamFire").setText(0);

                    }
                    else {
                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamUretim = modelArr[i].MAMUL_URETIM + toplamUretim;
                            var toplamHurda = modelArr[i].TOPLAM_HURDA + toplamHurda;
                            var toplamTuketim = modelArr[i].SARF_TEL_MIKTAR + toplamTuketim;
                        }

                        if (!!modelArr.filter((i) => i.PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr.filter((i) => i.PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].MAMUL_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretim").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercnt").setText(stdPercnt.toFixed(3));
                        }
                        if (!!modelArr.filter((i) => i.PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr.filter((i) => i.PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].MAMUL_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretim").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercnt").setText(sapmaPercnt.toFixed(3));
                        }

                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;
                        this.getView().byId("toplamUretim").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketim").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamHurda").setText(toplamHurda.toFixed(3));
                        this.getView().byId("toplamFire").setText(toplamFire.toFixed(3));
                    }

                    this.getView().byId("datePicker").setValue(this.time() + " " + "- " + " " + this.time());
                    this.getView().byId("pcWireReport").setModel(tableModel);
                    this.getView().byId("pcWireReport").getModel().refresh();


                },

                createColumns: function () {
                    return [{
                        label: 'Tarih',
                        property: 'TARIH',
                        width: '20'
                    }, {
                        label: 'Vardiya',
                        property: 'VARDIYA',
                        width: '20'
                    }, {
                        label: 'Satış Sip No.',
                        property: 'SATIS_SIP',
                        width: '20'
                    }, {
                        label: 'Üretim Sip No.',
                        property: 'URETIM_SIP',
                        width: '20'
                    }, {
                        label: 'Kullanılan S. Tel Çap (mm)',
                        property: 'TELCAP',
                        width: '20'
                    }, {
                        label: 'Sarf S. Tel Miktar (ton)',
                        property: 'SARF_TEL_MIKTAR',
                        type: EdmType.Number,
                        width: '20'
                    }, {
                        label: 'Paket Tipi',
                        property: 'PAKET_TIP',
                        width: '20'
                    },

                    {
                        label: 'Yüzey Tipi',
                        property: 'YUZEY_TIP',
                        width: '20'
                    },

                    {
                        label: 'Çentik Tipi',
                        property: 'CENTIK_TIP',
                        width: '20'
                    },

                    {
                        label: 'PC Wire Standart',
                        property: 'PC_WIRE',
                        width: '20'
                    },

                    {
                        label: 'PC Wire Çap (mm)',
                        property: 'PC_WIRE_CAP',
                        width: '20'
                    },

                    {
                        label: 'PC Wire Kalite',
                        property: 'PC_WIRE_KALITE',
                        width: '20'
                    },

                    {
                        label: 'Mamül Üretim (ton)',
                        property: 'MAMUL_URETIM',
                        type: EdmType.Number,
                        width: '20'
                    },

                    {
                        label: 'Paket (adet)',
                        property: '{PAKET_ADET}',
                        type: EdmType.Number,
                        width: '20'
                    },

                    {
                        label: 'Hurda (ton)',
                        property: 'TOPLAM_HURDA',
                        type: EdmType.Number,
                        width: '20'
                    },
                    {
                        label: '% Fire',
                        property: 'FIRE',
                        type: EdmType.Number,
                        width: '20'
                    },
                    {
                        label: 'Standart Dışı - Sapma',
                        property: 'PROD_TYPE',
                        type: EdmType.Number,
                        width: '20'
                    },
                    {
                        label: "Toplam Üretim (ton)",
                        property: "Toplam_Uretim",
                        width: "20",
                    },
                    {
                        label: "Toplam Tüketim (ton)",
                        property: "Toplam_Tuketim",
                        width: "20",
                    },
                    {
                        label: "Toplam Hurda (ton)",
                        property: "Toplam_Hurda",
                        width: "20",
                    },

                    {
                        label: "Toplam Fire (%)",
                        property: "Toplam_Fire",
                        width: "20",
                    },
                    {
                        label: "Standart Dışı Üretim (ton)",
                        property: "stdUretim",
                        width: "20",
                    },
                    {
                        label: "Standart Dışı Üretim (%)",
                        property: "stdPercnt",
                        width: "20",
                    },
                    {
                        label: "Sapma Üretim (ton)",
                        property: "sapmaUretim",
                        width: "20",
                    },
                    {
                        label: "Sapma Üretim (%)",
                        property: "sapmaPercnt",
                        width: "20",
                    },

                    ];
                },

                onExport: function (oEvent) {
                    var tarih1 = this.getView().byId("datePicker").getDateValue().toLocaleDateString();
                    var tarih2 = this.getView().byId("datePicker").getSecondDateValue().toLocaleDateString();

                    var oColumns = this.createColumns();
                    var tableModel = this.getView().byId("pcWireReport").getModel();
                    if (!(!!tableModel?.oData)) {
                        MessageBox.error("Tabloda veri bulunmamaktadır.");
                        return;
                    }
                    var oDatas = tableModel.getData();
                    if (!(!!oDatas)) {
                        MessageBox.error("Tabloda veri bulunmamaktadır.");
                        return;
                    }

                    oDatas[0].Toplam_Uretim = this.getView().byId("toplamUretim").getText();
                    oDatas[0].Toplam_Tuketim = this.getView().byId("toplamTuketim").getText();
                    oDatas[0].Toplam_Hurda = this.getView().byId("toplamHurda").getText();
                    oDatas[0].Toplam_Fire = this.getView().byId("toplamFire").getText();

                    oDatas[0].stdUretim = this.getView().byId("stddisiUretim").getText();
                    oDatas[0].stdPercnt = this.getView().byId("stddisiUretimPercnt").getText();
                    oDatas[0].sapmaUretim = this.getView().byId("sapmaUretim").getText();
                    oDatas[0].sapmaPercnt = this.getView().byId("sapmaUretimPercnt").getText();

                    var oSettings = {
                        workbook: {
                            columns: oColumns
                        },
                        dataSource: oDatas,
                        fileName: "PcWire_" + this.exceldate1() + "-" + this.exceldate2()
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