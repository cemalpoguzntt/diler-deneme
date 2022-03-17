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
        "customActivity/scripts/custom",
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
        Spreadsheet,
        customScripts
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        return Controller.extend(
            "customActivity.controller.TelCekmeReport",

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
                    var d1 = new Date().getDate();
                    var m1 = new Date().getMonth() + 1;
                    var fy1 = new Date().getFullYear();

                    /* finaldate = fy1 + "-" + m1 + "-" + d1; 
                    return finaldate */

                    return fy1 + "-" + m1 + "-" + d1
                },

                getModelData: function () {

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;


                    var fark = 0;
                    var date1 = this.time();
                    var date2 = this.time();
                    this.getView().byId("dateRange").setValue(date1 + " - " + date2);



                    var client = this.appData.client;
                    var plant = this.appData.plant;                    
                    var nodeidArray = ["SCTEL1", "SCTEL2"];
                    var oData = [];

                    nodeidArray.forEach((item, index) => {

                        var params = {
                            "Param.1": client,
                            "Param.2": plant,
                            "Param.3": nodeidArray[index],
                        };

                        var tRunner = new TransactionRunner(
                            "MES/Itelli/DNA/DNAReport/getNodeInfos",
                            params
                        );
                        if (!tRunner.Execute()) {
                            MessageBox.error(tRunner.GetErrorMessage());
                            return;
                        }
                        oData.push(tRunner.GetJSONData()[0]?.Row[0]?.NODE_ID);

                    });
                    
                    var nodeid1 = oData[0];
                    var nodeid2 = oData[1];


                    var response = TransactionCaller.sync(
                        "MES/Itelli/SERHAT/T_INNERGROUP2",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODE_ID1: nodeid1,
                            I_NODE_ID2: nodeid2

                        },
                        "O_JSON"
                    );
                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    // tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);  

                    if (response[0].Rowsets.Rowset.Row == null) {

                        this.getView().byId("toplamUretim").setText(0);
                        this.getView().byId("toplamTuketim").setText(0);
                        this.getView().byId("fark").setText(0);


                    }

                    else {
                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamUretim = modelArr[i].URETIM + toplamUretim;
                            var toplamTuketim = modelArr[i].CONS_QUANTITY + toplamTuketim;
                        }

                        if (!!modelArr.filter((i) => i.PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr.filter((i) => i.PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretim").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercnt").setText(stdPercnt.toFixed(3));
                        }

                        if (!!modelArr.filter((i) => i.PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr.filter((i) => i.PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretim").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercnt").setText(sapmaPercnt.toFixed(3));
                        }
                    }
                    var fark = (toplamTuketim - toplamUretim);
                    var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;

                    this.getView().byId("TelCekmeReport").setModel(tableModel);
                    this.getView().byId("toplamUretim").setText(toplamUretim.toFixed(3));
                    this.getView().byId("toplamTuketim").setText(toplamTuketim.toFixed(3));
                    this.getView().byId("toplamFire").setText(toplamFire.toFixed(3));
                    this.getView().byId("fark").setText(fark.toFixed(3));
                    this.getView().byId("TelCekmeReport").getModel().refresh();

                },

                Execute: function () {

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;


                    var fark = 0;
                    var d1 = this.getView().byId("dateRange").getDateValue().getDate();
                    var m1 = this.getView().byId("dateRange").getDateValue().getMonth() + 1;
                    var y1 = this.getView().byId("dateRange").getDateValue().getFullYear();
                    var d2 = this.getView().byId("dateRange").getSecondDateValue().getDate();
                    var m2 = this.getView().byId("dateRange").getSecondDateValue().getMonth() + 1;
                    var y2 = this.getView().byId("dateRange").getSecondDateValue().getFullYear();

                    var startdate = y1 + "-" + m1 + "-" + d1;
                    var enddate = y2 + "-" + m2 + "-" + d2;


                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeidArray = ["SCTEL1", "SCTEL2"];
                    var oData = [];

                    nodeidArray.forEach((item, index) => {

                        var params = {
                            "Param.1": client,
                            "Param.2": plant,
                            "Param.3": nodeidArray[index],
                        };

                        var tRunner = new TransactionRunner(
                            "MES/Itelli/DNA/DNAReport/getNodeInfos",
                            params
                        );
                        if (!tRunner.Execute()) {
                            MessageBox.error(tRunner.GetErrorMessage());
                            return;
                        }
                        oData.push(tRunner.GetJSONData()[0]?.Row[0]?.NODE_ID);

                    });
                    
                    var nodeid1 = oData[0];
                    var nodeid2 = oData[1];


                    var response = TransactionCaller.sync(
                        "MES/Itelli/SERHAT/T_INNERGROUP2",

                        {
                            I_DATE1: startdate,
                            I_DATE2: enddate,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODE_ID1: nodeid1,
                            I_NODE_ID2: nodeid2

                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                    if (response[0].Rowsets.Rowset.Row == null) {

                        this.getView().byId("toplamUretim").setText(0);
                        this.getView().byId("toplamTuketim").setText(0);
                        this.getView().byId("fark").setText(0);


                    }

                    else {
                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamUretim = modelArr[i].URETIM + toplamUretim;
                            var toplamTuketim = modelArr[i].CONS_QUANTITY + toplamTuketim;
                        }

                        if (!!modelArr.filter((i) => i.PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr.filter((i) => i.PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretim").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercnt").setText(stdPercnt.toFixed(3));
                        }

                        if (!!modelArr.filter((i) => i.PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr.filter((i) => i.PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretim").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercnt").setText(sapmaPercnt.toFixed(3));
                        }

                    }
                    var fark = (toplamTuketim - toplamUretim);
                    var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;

                    this.getView().byId("TelCekmeReport").setModel(tableModel);
                    this.getView().byId("toplamUretim").setText(toplamUretim.toFixed(3));
                    this.getView().byId("toplamTuketim").setText(toplamTuketim.toFixed(3));
                    this.getView().byId("toplamFire").setText(toplamFire.toFixed(3));
                    this.getView().byId("fark").setText(fark.toFixed(3));
                    this.getView().byId("TelCekmeReport").getModel().refresh();
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
                        label: 'Makine No',
                        property: 'MAKINA',
                        width: '20'
                    }, {
                        label: 'Satış Sip No.',
                        property: 'SATIS_SIP',
                        width: '20'
                    }, {
                        label: 'Üretim Sip No.',
                        property: 'URETIM_SIPARISI',
                        width: '20'
                    }, {
                        label: 'Sarf Edilen Filmaşin Kalitesi',
                        property: 'KALITE',
                        width: '20'
                    }, {
                        label: ' Kalite Değişimi',
                        property: 'DEGISIM_KALITE',

                        width: '20'
                    }, {
                        label: 'Sarf Edilen Filmaşin Çap (mm)',
                        property: 'CAP',

                        width: '20'
                    },

                    {
                        label: 'Sarf Edilen Filmaşin Miktarı (Ton)',
                        property: 'CONS_QUANTITY',
                        type: EdmType.Number,
                        width: '20'
                    },

                    {
                        label: 'Tel Çapı (mm)',
                        property: 'TEL_CAP',

                        width: '20'
                    },

                    {
                        label: 'Üretilen Miktar (Ton)',
                        property: 'URETIM',
                        type: EdmType.Number,
                        width: '20'
                    },

                    {
                        label: 'Üretim (Adet)',
                        property: 'ADET',
                        type: EdmType.Number,
                        width: '20'
                    },

                    {
                        label: '% Fire',
                        property: 'FIRE',

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
                        label: "Toplam Hurda (kg)",
                        property: "Toplam_Fark",
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
                    var oColumns = this.createColumns();
                    var tableModel = this.getView().byId("TelCekmeReport").getModel();
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
                    oDatas[0].Toplam_Fark = this.getView().byId("fark").getText();
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
                        fileName: "Tel_Cekme_Rapor"
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