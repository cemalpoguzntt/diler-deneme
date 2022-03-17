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
        "sap/ui/core/library",
        "sap/ui/core/Core",
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
        coreLibrary,
        Core,
        exportLibrary,
        Spreadsheet,
        customScripts
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        return Controller.extend(
            "customActivity.controller.tum_raporlar",

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

                    this.getModelData();
                },


                date1: function () {
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 =
                        this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView()
                        .byId("datePicker")
                        .getDateValue()
                        .getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                },
                date2: function () {
                    var day2 = this.getView()
                        .byId("datePicker")
                        .getSecondDateValue()
                        .getDate();
                    var month2 =
                        this.getView().byId("datePicker").getSecondDateValue().getMonth() +
                        1;
                    var fullyear2 = this.getView()
                        .byId("datePicker")
                        .getSecondDateValue()
                        .getFullYear();
                    return fullyear2 + "-" + month2 + "-" + day2;
                },
                exceldate1: function () {
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 =
                        this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView()
                        .byId("datePicker")
                        .getDateValue()
                        .getFullYear();
                    return day1 + "." + month1 + "." + fullyear1;
                },

                exceldate2: function () {
                    var day2 = this.getView()
                        .byId("datePicker")
                        .getSecondDateValue()
                        .getDate();
                    var month2 =
                        this.getView().byId("datePicker").getSecondDateValue().getMonth() +
                        1;
                    var fullyear2 = this.getView()
                        .byId("datePicker")
                        .getSecondDateValue()
                        .getFullYear();
                    return day2 + "." + month2 + "." + fullyear2;
                },

                searchData: function () {
                    var date1 = this.date1();
                    var date2 = this.date2();


                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeidArray = ["FOSFAT", "SCTEL1", "SCTEL2", "PCSTRAND", "PCWIRE","SKINPASS"];
                    var oData = [];

                    // var nodeidpcs = "899D5E81A7991EEB92CDCEE63D63D10B";
                    // var nodeidfosfat = "899D5E81A7991EEB92CD931F2D55510B";
                    // var nodeidpcwire = "899D5E81A7991EEB95CAD6A29473B10D";

                    // var nodeid1 = "899D5E81A7991EEB92CDB5AFB3B7310B";
                    // var nodeid2 = "899D5E81A7991EEB92CDC9CAD28A510B";


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


                    var nodeidfosfat = oData[0];
                    var nodeid1 = oData[1];
                    var nodeid2 = oData[2];
                    var nodeidpcs = oData[3];
                    var nodeidpcwire = oData[4];
                    var nodeidskinpass = oData[5];

                    var response2 = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_SELECT_MPM_PROD_RUN_HDR",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeidfosfat,
                        },
                        "O_JSON"
                    );

                    var modelArr2 = Array.isArray(response2[0].Rowsets.Rowset.Row)
                        ? response2[0].Rowsets.Rowset.Row
                        : new Array(response2[0].Rowsets.Rowset.Row);
                    var tableModel2 = new sap.ui.model.json.JSONModel(modelArr2);

                    var toplamUretimFosfat = 0;
                    var toplamTuketimFosfat = 0;
                    var toplamFireFosfat = 0;

                    var toplamUretimAYT = 0;
                    var toplamTuketimAYT = 0;
                    var toplamFireAYT = 0;

                    var toplamUretimRW = 0;
                    var toplamTuketimRW = 0;
                    var toplamFireRW = 0;

                    if (response2[0].Rowsets.Rowset.Row == null) {
                        this.getView().byId("toplamUretimFosfat").setText(0);
                        this.getView().byId("toplamTuketimFosfat").setText(0);

                    }
                    else {
                        if (!!modelArr2?.filter((i) => i.FS_MATNR == "FOSFATLI_FILMASIN")[0]) {
                            var fosfatModel = modelArr2?.filter((i) => i.FS_MATNR == "FOSFATLI_FILMASIN");
                            for (var i = 0; i < fosfatModel.length; i++) {
                                var toplamUretimFosfat = fosfatModel[i].FS_TOPLAM_URETIM + toplamUretimFosfat;
                                var toplamTuketimFosfat = fosfatModel[i].FS_TOPLAM_TUKETIM + toplamTuketimFosfat;
                            }
                            var toplamFireFosfat = (toplamTuketimFosfat - toplamUretimFosfat) / toplamTuketimFosfat * 100;

                        }

                        this.getView().byId("toplamUretimFosfat").setText(toplamUretimFosfat.toFixed(3));
                        this.getView().byId("toplamTuketimFosfat").setText(toplamTuketimFosfat.toFixed(3));
                        this.getView().byId("toplamFireFosfat").setText(toplamFireFosfat.toFixed(3));


                        if (!!modelArr2?.filter((i) => i.FS_RW_AYT == "AYT")[0]) {
                            var AYTModel = modelArr2?.filter((i) => i.FS_RW_AYT == "AYT");
                            for (var i = 0; i < AYTModel.length; i++) {
                                var toplamUretimAYT = AYTModel[i].FS_TOPLAM_URETIM + toplamUretimAYT;
                                var toplamTuketimAYT = AYTModel[i].FS_TOPLAM_TUKETIM + toplamTuketimAYT;
                            }
                            var toplamFireAYT = (toplamTuketimAYT - toplamUretimAYT) / toplamTuketimAYT * 100;
                        }

                        this.getView().byId("toplamUretimAYT").setText(toplamUretimAYT.toFixed(3));
                        this.getView().byId("toplamTuketimAYT").setText(toplamTuketimAYT.toFixed(3));
                        this.getView().byId("toplamFireAYT").setText(toplamFireAYT.toFixed(3));


                        if (!!modelArr2?.filter((i) => i.FS_RW_AYT == "REWORK")[0]) {
                            var reworkModel = modelArr2?.filter((i) => i.FS_RW_AYT == "REWORK");
                            for (var i = 0; i < reworkModel.length; i++) {
                                var toplamUretimRW = reworkModel[i].FS_TOPLAM_URETIM + toplamUretimRW;
                                var toplamTuketimRW = reworkModel[i].FS_TOPLAM_TUKETIM + toplamTuketimRW;
                            }
                            var toplamFireRW = (toplamTuketimRW - toplamUretimRW) / toplamTuketimRW * 100;
                        }

                        this.getView().byId("toplamUretimRW").setText(toplamUretimRW.toFixed(3));
                        this.getView().byId("toplamTuketimRW").setText(toplamTuketimRW.toFixed(3));
                        this.getView().byId("toplamFireRW").setText(toplamFireRW.toFixed(3));
                    }


                    this.getView().byId("FosfatReport").setModel(tableModel2);
                    this.getView().byId("FosfatReport").getModel().refresh();

                    var response4 = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_INNERGROUP2",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODE_ID1: nodeid1,
                            I_NODE_ID2: nodeid2,
                        },
                        "O_JSON"
                    );

                    var modelArr4 = Array.isArray(response4[0].Rowsets.Rowset.Row)
                        ? response4[0].Rowsets.Rowset.Row
                        : new Array(response4[0].Rowsets.Rowset.Row);
                    var tableModel4 = new sap.ui.model.json.JSONModel(modelArr4);

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;
                    var fark = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    if (response4[0].Rowsets.Rowset.Row == null) {

                        this.getView().byId("toplamUretimTelCekme").setText(0);
                        this.getView().byId("toplamTuketimTelCekme").setText(0);
                        this.getView().byId("farkTelCekme").setText(0);


                    }

                    else {

                        for (var i = 0; i < modelArr4.length; i++) {
                            var toplamUretim = modelArr4[i].SCTEL_URETIM + toplamUretim;
                            var toplamTuketim = modelArr4[i].SCTEL_CONS_QUANTITY + toplamTuketim;
                        }

                        var fark = (toplamTuketim - toplamUretim);
                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;

                        if (!!modelArr4.filter((i) => i.SCT_PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr4.filter((i) => i.SCT_PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].SCTEL_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretimSCT").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercntSCT").setText(stdPercnt.toFixed(3));
                        }

                        if (!!modelArr4.filter((i) => i.SCT_PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr4.filter((i) => i.SCT_PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].SCTEL_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretimSCT").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercntSCT").setText(sapmaPercnt.toFixed(3));
                        }

                        this.getView().byId("toplamUretimTelCekme").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketimTelCekme").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamFireTelCekme").setText(toplamFire.toFixed(3));
                        this.getView().byId("farkTelCekme").setText(fark.toFixed(3));

                    }

                    this.getView().byId("TelCekmeReport").setModel(tableModel4);
                    this.getView().byId("TelCekmeReport").getModel().refresh();



                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_PC_STRAND",

                        {
                            I_STARTDATE: date1,
                            I_ENDDATE: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeidpcs,
                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row)
                        ? response[0].Rowsets.Rowset.Row
                        : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;
                    var toplamHurda = 0;
                    var fark = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    if (response[0].Rowsets.Rowset.Row == null) {
                        this.getView().byId("toplamUretimPC").setText(0);
                        this.getView().byId("toplamTuketimPC").setText(0);
                        this.getView().byId("toplamHurdaPC").setText(0);
                        this.getView().byId("toplamFirePC").setText(0);

                    }
                    else {

                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamUretim = modelArr[i].PCS_TOPLAM_URETIM + toplamUretim;
                            var toplamHurda = modelArr[i].PCS_TOPLAM_HURDA + toplamHurda;
                            var toplamTuketim = modelArr[i].PCS_TOPLAM_TUKETIM + toplamTuketim;
                        }

                        if (!!modelArr.filter((i) => i.PCS_PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr.filter((i) => i.PCS_PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].PCS_TOPLAM_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretimPCS").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercntPCS").setText(stdPercnt.toFixed(3));
                        }
                        if (!!modelArr.filter((i) => i.PCS_PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr.filter((i) => i.PCS_PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].PCS_TOPLAM_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretimPCS").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercntPCS").setText(sapmaPercnt.toFixed(3));
                        }

                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;
                        this.getView().byId("toplamUretimPC").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketimPC").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamHurdaPC").setText(toplamHurda.toFixed(3));
                        this.getView().byId("toplamFirePC").setText(toplamFire.toFixed(3));
                    }

                    this.getView().byId("pcStrand").setModel(tableModel);
                    this.getView().byId("pcStrand").getModel().refresh();

                    var response3 = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_SELECT_PcWire",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeidpcwire,
                        },
                        "O_JSON"
                    );

                    var modelArr3 = Array.isArray(response3[0].Rowsets.Rowset.Row)
                        ? response3[0].Rowsets.Rowset.Row
                        : new Array(response3[0].Rowsets.Rowset.Row);
                    var tableModel3 = new sap.ui.model.json.JSONModel(modelArr3);

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;
                    var toplamHurda = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    if (response3[0].Rowsets.Rowset.Row == null) {
                        this.getView().byId("toplamUretimPCW").setText(0);
                        this.getView().byId("toplamTuketimPCW").setText(0);
                        this.getView().byId("toplamHurdaPCW").setText(0);
                        this.getView().byId("toplamFirePCW").setText(0);

                    }
                    else {
                        for (var i = 0; i < modelArr3.length; i++) {
                            var toplamUretim = modelArr3[i].PCW_MAMUL_URETIM + toplamUretim;
                            var toplamTuketim = modelArr3[i].PCW_SARF_TEL_MIKTAR + toplamTuketim;
                            var toplamHurda = modelArr3[i].PCW_TOPLAM_HURDA + toplamHurda;
                        }

                        if (!!modelArr3.filter((i) => i.PCW_PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr3.filter((i) => i.PCW_PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].PCW_MAMUL_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretimPCW").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercntPCW").setText(stdPercnt.toFixed(3));
                        }
                        if (!!modelArr3.filter((i) => i.PCW_PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr3.filter((i) => i.PCW_PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].PCW_MAMUL_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretimPCW").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercntPCW").setText(sapmaPercnt.toFixed(3));
                        }

                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;
                        this.getView().byId("toplamUretimPCW").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketimPCW").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamHurdaPCW").setText(toplamHurda.toFixed(3));
                        this.getView().byId("toplamFirePCW").setText(toplamFire.toFixed(3));
                    }

                    this.getView().byId("pcWireReport").setModel(tableModel3);
                    this.getView().byId("pcWireReport").getModel().refresh();


                    var response5 = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_skpAllReport",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeidskinpass,
                        },
                        "O_JSON"
                    );

                    var modelArr5 = Array.isArray(response5[0].Rowsets.Rowset.Row)
                        ? response5[0].Rowsets.Rowset.Row
                        : new Array(response5[0].Rowsets.Rowset.Row);
                    var tableModel5 = new sap.ui.model.json.JSONModel(modelArr5);


                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamHurda = 0;
                    var toplamFire = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    
                    if (response5[0].Rowsets.Rowset.Row != null) {

                        for (var i = 0; i < modelArr5.length; i++) {
                            var toplamUretim = modelArr5[i].SKP_TOPLAM_URETIM + toplamUretim;
                            var toplamTuketim = modelArr5[i].SKP_TOPLAM_TUKETIM + toplamTuketim;
                            var toplamHurda = modelArr5[i].SKP_TOPLAM_HURDA + toplamHurda;
                        }

                        if (!!modelArr5.filter((i) => i.SKP_PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr5.filter((i) => i.SKP_PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].SKP_TOPLAM_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretimSKP").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercntSKP").setText(stdPercnt.toFixed(3));
                        }
                        if (!!modelArr5.filter((i) => i.SKP_PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr5.filter((i) => i.SKP_PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].SKP_TOPLAM_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretimSKP").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercntSKP").setText(sapmaPercnt.toFixed(3));
                        }

                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;
                        this.getView().byId("toplamUretimSKP").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketimSKP").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamHurdaSKP").setText(toplamHurda.toFixed(3));
                        this.getView().byId("toplamFireSKP").setText(toplamFire.toFixed(3));
                    }

                    this.getView().byId("SKPReport").setModel(tableModel5);
                    this.getView().byId("SKPReport").getModel().refresh();
                },

                createColumns: function () {
                    return [
                        {
                            label: "FS_Tarih",
                            property: "FS_TARIH",
                            width: "10",
                        },
                        {
                            label: "Vardiya",
                            property: "FS_VARDIYA",
                            width: "10",
                        },
                        // {
                        //     label: "Satış Sip No.",
                        //     property: "FS_SATIS_SIP",
                        //     width: "20",
                        // },
                        {
                            label: "Üretim Sip No.",
                            property: "FS_URETIM_SIP",
                            width: "10",
                        },
                        {
                            label: "Rework - AYT",
                            property: "FS_RW_AYT",
                            width: "14",
                        },
                        {
                            label: "Filmaşin Kalite",
                            property: "FS_KALITE",
                            width: "14",
                        },
                        {
                            label: "Filmaşin Kalite Değişim",
                            property: "FS_KALITE_DEGISIM",
                            width: "15",
                        },
                        {
                            label: "Filmaşin Çap (mm)",
                            property: "FS_CAP",
                            width: "20",
                        },

                        {
                            label: "Üretim (ton)",
                            property: "FS_TOPLAM_URETIM",
                            type: EdmType.Number,
                            width: "8",
                        },

                        {
                            label: "Filmaşin Sarf (ton)",
                            property: "FS_TOPLAM_TUKETIM",
                            type: EdmType.Number,
                            width: "12",
                        },

                        {
                            label: "Üretim (adet)",
                            property: "FS_URETIM_ADEDI",
                            type: EdmType.Number,
                            width: "8",
                        },

                        // {
                        //     label: "% fire",
                        //     property: "FS_FIRE",
                        //     type: EdmType.Number,
                        //     width: "20",
                        // },

                        {
                            label: "Fosfat Toplam Üretim (ton)",
                            property: "Fosfat_Toplam_Uretim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Fosfat Toplam Tüketim (ton)",
                            property: "Fosfat_Toplam_Tuketim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Fosfat Toplam Fire (%)",
                            property: "Fosfat_Toplam_Fire",
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
                            label: "AYT Toplam Tüketim (ton)",
                            property: "AYT_Toplam_Tuketim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "AYT Toplam Fire (%)",
                            property: "AYT_Toplam_Fire",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Rework Toplam Üretim (ton)",
                            property: "RW_Toplam_Uretim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Rewrok Toplam Tüketim (ton)",
                            property: "RW_Toplam_Tuketim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Rework Toplam Fire (%)",
                            property: "RW_Toplam_Fire",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "ScTeL_Tarih",
                            property: "SCTEL_TARIH",
                            width: "10",
                        },
                        {
                            label: "Vardiya",
                            property: "SCTEL_VARDIYA",
                            width: "10",
                        },
                        {
                            label: "Makine No",
                            property: "SCTEL_MAKINA",
                            width: "10",
                        },
                        // {
                        //     label: "Satış Sip No.",
                        //     property: "SCTEL_SATIS_SIP",
                        //     width: "20",
                        // },
                        {
                            label: "Üretim Sip No.",
                            property: "SCTEL_URETIM_SIPARISI",
                            width: "15",
                        },
                        {
                            label: "Sarf Edilen Filmaşin Kalitesi",
                            property: "SCTEL_KALITE",
                            width: "10",
                        },
                        {
                            label: "Kalite Değişimi",
                            property: "SCTEL_DEGISIM_KALITE",

                            width: "10",
                        },
                        {
                            label: "Sarf Edilen Filmaşin Çap (mm)",
                            property: "SCTEL_CAP",

                            width: "15",
                        },

                        {
                            label: "Sarf Edilen Filmaşin Miktarı (Ton)",
                            property: "SCTEL_CONS_QUANTITY",
                            type: EdmType.Number,
                            width: "15",
                        },

                        {
                            label: "Tel Çapı (mm)",
                            property: "SCTEL_TEL_CAP",

                            width: "15",
                        },

                        {
                            label: "Bobin (Adet)",
                            property: "SCTEL_ADET",
                            type: EdmType.Number,
                            width: "10",
                        },

                        {
                            label: "Üretilen Miktar (Ton)",
                            property: "SCTEL_URETIM",
                            type: EdmType.Number,
                            width: "10",
                        },

                        // {
                        //     label: "% fire",
                        //     property: "SCTEL_FIRE",

                        //     width: "20",
                        // },
                        {
                            label: 'Standart Dışı - Sapma',
                            property: 'SCT_PROD_TYPE',
                            type: EdmType.Number,
                            width: '20'
                        },
                        {
                            label: "SCT Toplam Üretim (ton)",
                            property: "SCTEL_Toplam_Uretim",
                            type: EdmType.Number,
                            width: "21",
                        },
                        {
                            label: "SCT Toplam Tüketim (ton)",
                            property: "SCTEL_Toplam_Tuketim",
                            type: EdmType.Number,
                            width: "21",
                        },
                        {
                            label: "SCT Toplam Hurda (ton)",
                            property: "SCTEL_Toplam_Fark",
                            type: EdmType.Number,
                            width: "21",
                        },
                        {
                            label: "SCT Toplam Fire (%)",
                            property: "SCTEL_Toplam_Fire",
                            type: EdmType.Number,
                            width: "21",
                        },
                        {
                            label: "Standart Dışı Üretim (ton)",
                            property: "stddisiUretimSCT",
                            width: "20",
                        },
                        {
                            label: "Standart Dışı Üretim (%)",
                            property: "stddisiUretimPercntSCT",
                            width: "20",
                        },
                        {
                            label: "Sapma Üretim (ton)",
                            property: "sapmaUretimSCT",
                            width: "20",
                        },
                        {
                            label: "Sapma Üretim (%)",
                            property: "sapmaUretimPercntSCT",
                            width: "20",
                        },

                        {
                            label: "PCS_Tarih",
                            property: "PCS_TARIH",
                            width: "10",
                        },
                        {
                            label: "Vardiya",
                            property: "PCS_VARDIYA",
                            width: "10",
                        },
                        // {
                        //     label: "Satış Sip No.",
                        //     property: "PCS_SATIS_SIPNO",
                        //     width: "20",
                        // },
                        {
                            label: "Üretim Sip No.",
                            property: "PCS_URETIM_SIPNO",
                            width: "10",
                        },
                        {
                            label: "Merkez Tel (mm)",
                            property: "PCS_Y_MERKEZ_TEL_CAP",
                            width: "15",
                        },
                        {
                            label: "Çevre Tel (mm)",
                            property: "PCS_Y_CEVRE_TEL_CAP",
                            width: "15",
                        },
                        {
                            label: "PC Strand Standart",
                            property: "PCS_Y_STANDART_PCS",
                            width: "15",
                        },
                        {
                            label: "PC Strand Çap (mm-inch)",
                            property: "PCS_PC_STRAND_CAP",
                            width: "15",
                        },

                        {
                            label: "PC Strand Kalite",
                            property: "PCS_Y_KALITE_PCS",

                            width: "15",
                        },

                        {
                            label: "Tüketim (ton)",
                            property: "PCS_TOPLAM_TUKETIM",

                            width: "20",
                        },

                        {
                            label: "Mamul Üretim (ton)",
                            property: "PCS_TOPLAM_URETIM",

                            width: "20",
                        },

                        {
                            label: "Kangal Adet",
                            property: "PCS_KANGAL_ADET",

                            width: "17",
                        },
                        {
                            label: "Hurda (ton)",
                            property: "PCS_TOPLAM_HURDA",

                            width: "17",
                        },
                        {
                            label: "% Fire",
                            property: "PCS_FIRE",
                            width: "10",
                        },
                        {
                            label: 'Standart Dışı - Sapma',
                            property: 'PCS_PROD_TYPE',
                            type: EdmType.Number,
                            width: '20'
                        },
                        {
                            label: "PCS Toplam Üretim (ton)",
                            property: "PCS_Toplam_Uretim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "PCS Toplam Tüketim (ton)",
                            property: "PCS_Toplam_Tuketim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "PCS Toplam Hurda (ton)",
                            property: "PCS_Toplam_Hurda",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "PCS Toplam Fire (%)",
                            property: "PCS_Toplam_Fire",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Standart Dışı Üretim (ton)",
                            property: "stddisiUretimPCS",
                            width: "20",
                        },
                        {
                            label: "Standart Dışı Üretim (%)",
                            property: "stddisiUretimPercntPCS",
                            width: "20",
                        },
                        {
                            label: "Sapma Üretim (ton)",
                            property: "sapmaUretimPCS",
                            width: "20",
                        },
                        {
                            label: "Sapma Üretim (%)",
                            property: "sapmaUretimPercntPCS",
                            width: "20",
                        },

                        {
                            label: "PCW_Tarih",
                            property: "PCW_TARIH",
                            width: "10",
                        },
                        {
                            label: "Vardiya",
                            property: "PCW_VARDIYA",
                            width: "10",
                        },
                        // {
                        //     label: "Satış Sip No.",
                        //     property: "PCW_SATIS_SIP",
                        //     width: "20",
                        // },
                        {
                            label: "Üretim Sip No.",
                            property: "PCW_URETIM_SIP",
                            width: "10",
                        },
                        {
                            label: "Kullanılan S. Tel Çap (mm)",
                            property: "PCW_TELCAP",
                            width: "20",
                        },
                        {
                            label: "Sarf S. Tel Miktar (ton)",
                            property: "PCW_SARF_TEL_MIKTAR",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Paket Tipi",
                            property: "PCW_PAKET_TIP",
                            width: "10",
                        },

                        {
                            label: "Yüzey Tipi",
                            property: "PCW_YUZEY_TIP",
                            width: "10",
                        },

                        {
                            label: "Çentik Tipi",
                            property: "PCW_CENTIK_TIP",
                            width: "10",
                        },

                        {
                            label: "PC Wire Standart",
                            property: "PCW_PC_WIRE",
                            width: "15",
                        },

                        {
                            label: "PC Wire Çap (mm)",
                            property: "PCW_PC_WIRE_CAP",
                            width: "15",
                        },

                        {
                            label: "PC Wire Kalite",
                            property: "PCW_PC_WIRE_KALITE",
                            width: "15",
                        },

                        {
                            label: "Mamül Üretim (ton)",
                            property: "PCW_MAMUL_URETIM",
                            type: EdmType.Number,
                            width: "20",
                        },

                        {
                            label: "Paket (adet)",
                            property: "PCW_PAKET_ADET",
                            type: EdmType.Number,
                            width: "10",
                        },

                        {
                            label: "% Fire",
                            property: "PCW_FIRE",
                            type: EdmType.Number,
                            width: "10",
                        },
                        {
                            label: 'Standart Dışı - Sapma',
                            property: 'PCW_PROD_TYPE',
                            type: EdmType.Number,
                            width: '20'
                        },
                        {
                            label: "PCW Toplam Üretim (ton)",
                            property: "PCW_Toplam_Uretim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "PCW Toplam Tüketim (ton)",
                            property: "PCW_Toplam_Tuketim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "PCW Toplam Hurda (ton)",
                            property: "PCW_Toplam_Hurda",
                            type: EdmType.Number,
                            width: "20",
                        },

                        {
                            label: "PCW Toplam Fire (%)",
                            property: "PCW_Toplam_Fire",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Standart Dışı Üretim (ton)",
                            property: "stddisiUretimPCW",
                            width: "20",
                        },
                        {
                            label: "Standart Dışı Üretim (%)",
                            property: "stddisiUretimPercntPCW",
                            width: "20",
                        },
                        {
                            label: "Sapma Üretim (ton)",
                            property: "sapmaUretimPCW",
                            width: "20",
                        },
                        {
                            label: "Sapma Üretim (%)",
                            property: "sapmaUretimPercntPCW",
                            width: "20",
                        },

                        {
                            label: "SKP_Tarih",
                            property: "SKP_TARIH",
                            width: "10",
                        },
                        {
                            label: "Vardiya",
                            property: "SKP_VARDIYA",
                            width: "10",
                        },                        
                        {
                            label: "Üretim Sip No.",
                            property: "SKP_URETIM_SIP",
                            width: "10",
                        },
                        {
                            label: "SkinPass Üretim (ton)",
                            property: "SKP_TOPLAM_URETIM",
                            width: "15",
                        },
                        {
                            label: "Filmaşin Sarf (ton)",
                            property: "SKP_TOPLAM_TUKETIM",
                            width: "15",
                        },
                        {
                            label: "Üretim (adet)",
                            property: "SKP_URETIM_ADEDI",
                            width: "15",
                        },
                        {
                            label: "Hurda (ton)",
                            property: "SKP_TOPLAM_HURDA",
                            width: "15",
                        },

                        {
                            label: "Fire (%)",
                            property: "SKP_FIRE",

                            width: "15",
                        },
                        
                        {
                            label: 'Standart Dışı - Sapma',
                            property: 'SKP_PROD_TYPE',
                            type: EdmType.Number,
                            width: '20'
                        },
                        {
                            label: "SKP Toplam Üretim (ton)",
                            property: "SKP_Toplam_Uretim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "SKP Toplam Tüketim (ton)",
                            property: "SKP_Toplam_Tuketim",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "SKP Toplam Hurda (ton)",
                            property: "SKP_Toplam_Hurda",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "SKP Toplam Fire (%)",
                            property: "SKP_Toplam_Fire",
                            type: EdmType.Number,
                            width: "20",
                        },
                        {
                            label: "Standart Dışı Üretim (ton)",
                            property: "stddisiUretimSKP",
                            width: "20",
                        },
                        {
                            label: "Standart Dışı Üretim (%)",
                            property: "stddisiUretimPercntSKP",
                            width: "20",
                        },
                        {
                            label: "Sapma Üretim (ton)",
                            property: "sapmaUretimSKP",
                            width: "20",
                        },
                        {
                            label: "Sapma Üretim (%)",
                            property: "sapmaUretimPercntSKP",
                            width: "20",
                        },
                    ];
                },

                onExport: function (oEvent) {
                    var oColumns = this.createColumns();
                    var tableModel = this.getView().byId("pcStrand").getModel();

                    var tableModel2 = this.getView().byId("FosfatReport").getModel();

                    var tableModel3 = this.getView().byId("pcWireReport").getModel();

                    var tableModel4 = this.getView().byId("TelCekmeReport").getModel();

                    var tableModel5 = this.getView().byId("SKPReport").getModel();

                    var oDatas1 = tableModel2.getData(); //fosfatlama
                    var oDatas2 = tableModel4.getData(); //telcekme
                    var oDatas3 = tableModel.getData(); //pc strand
                    var oDatas4 = tableModel3.getData(); //pc wire
                    var oDatas5 = tableModel5.getData(); //skinpass
                    var oDatas = [];

                    var a = oDatas1.length;
                    var b = oDatas2.length;
                    var c = oDatas3.length;
                    var d = oDatas4.length;
                    var f = oDatas4.length;
                    var e = Math.max(a, b, c, d, f);

                    var fs_tarih = [];
                    for (let i = 0, len = a; i < len; i++) {
                        if (a <= 1) {
                            break;
                        } else {
                            var tarih1 = oDatas1[i]["FS_TARIH"];
                            fs_tarih.push(tarih1);
                        }
                    }
                    var sctel_tarih = [];
                    for (let i = 0, len = b; i < len; i++) {
                        if (b <= 1) {
                            break;
                        } else {
                            var tarih2 = oDatas2[i]["SCTEL_TARIH"];
                            sctel_tarih.push(tarih2);
                        }
                    }
                    var pcs_tarih = [];
                    for (let i = 0, len = c; i < len; i++) {
                        if (c <= 1) {
                            break;
                        }
                        else {
                            var tarih3 = oDatas3[i]["PCS_TARIH"];
                            pcs_tarih.push(tarih3);
                        }
                    }
                    var pcw_tarih = [];
                    for (let i = 0, len = d; i < len; i++) {
                        if (d <= 1) {
                            break;
                        } else {
                            var tarih4 = oDatas4[i]["PCW_TARIH"];

                            pcw_tarih.push(tarih4);
                        }
                    }

                    var skp_tarih = [];
                    for (let i = 0, len = f; i < len; i++) {
                        if (f <= 1) {
                            break;
                        } else {
                            var tarih5 = oDatas5[i]["SKP_TARIH"];

                            skp_tarih.push(tarih5);
                        }
                    }
                    var alldates = [
                        ...fs_tarih,
                        ...sctel_tarih,
                        ...pcs_tarih,
                        ...pcw_tarih,
                        ...skp_tarih,
                    ];
                    Array.prototype.contains = function (v) {
                        for (var i = 0; i < this.length; i++) {
                            if (this[i] === v) return true;
                        }
                        return false;
                    };

                    Array.prototype.unique = function () {
                        var arr = [];
                        for (var i = 0; i < this.length; i++) {
                            if (!arr.contains(this[i])) {
                                arr.push(this[i]);
                            }
                        }
                        return arr;
                    };

                    var uniques = alldates.unique();

                    for (let i = 0, len = uniques.length; i < len; i++) {
                        var tempArray1 = oDatas1.filter(item => item?.FS_TARIH == uniques[i]);
                        var tempArray2 = oDatas2.filter(item => item?.SCTEL_TARIH == uniques[i]);
                        var tempArray3 = oDatas3.filter(item => item?.PCS_TARIH == uniques[i]);
                        var tempArray4 = oDatas4.filter(item => item?.PCW_TARIH == uniques[i]);
                        var tempArray5 = oDatas5.filter(item => item?.SKP_TARIH == uniques[i]);

                        var x = tempArray1.length;
                        var y = tempArray2.length;
                        var z = tempArray3.length;
                        var t = tempArray4.length;
                        var w = tempArray5.length;
                        var s = Math.max(x, y, z, t, w);


                        for (let i = 0, len = s; i < len; i++) {
                            var tempObject = {
                                ...(!!tempArray1[i] ? tempArray1[i] : []),
                                ...(!!tempArray2[i] ? tempArray2[i] : []),
                                ...(!!tempArray3[i] ? tempArray3[i] : []),
                                ...(!!tempArray4[i] ? tempArray4[i] : []),
                                ...(!!tempArray5[i] ? tempArray5[i] : []),
                            };
                            oDatas.push(tempObject);
                        }
                    }

                    oDatas[0].Fosfat_Toplam_Uretim = this.getView().byId("toplamUretimFosfat").getText();
                    oDatas[0].Fosfat_Toplam_Tuketim = this.getView().byId("toplamTuketimFosfat").getText();
                    oDatas[0].Fosfat_Toplam_Fire = this.getView().byId("toplamFireFosfat").getText();

                    oDatas[0].AYT_Toplam_Uretim = this.getView().byId("toplamUretimAYT").getText();
                    oDatas[0].AYT_Toplam_Tuketim = this.getView().byId("toplamTuketimAYT").getText();
                    oDatas[0].AYT_Toplam_Fire = this.getView().byId("toplamFireAYT").getText();
                     
                    oDatas[0].RW_Toplam_Uretim = this.getView().byId("toplamUretimRW").getText();
                    oDatas[0].RW_Toplam_Tuketim = this.getView().byId("toplamTuketimRW").getText();
                    oDatas[0].RW_Toplam_Fire = this.getView().byId("toplamFireRW").getText();

                    oDatas[0].SCTEL_Toplam_Uretim = this.getView().byId("toplamUretimTelCekme").getText();
                    oDatas[0].SCTEL_Toplam_Tuketim = this.getView().byId("toplamTuketimTelCekme").getText();
                    oDatas[0].SCTEL_Toplam_Fark = this.getView().byId("farkTelCekme").getText();
                    oDatas[0].SCTEL_Toplam_Fire = this.getView().byId("toplamFireTelCekme").getText();

                    oDatas[0].PCS_Toplam_Uretim = this.getView().byId("toplamUretimPC").getText();
                    oDatas[0].PCS_Toplam_Tuketim = this.getView().byId("toplamTuketimPC").getText();
                    oDatas[0].PCS_Toplam_Hurda = this.getView().byId("toplamHurdaPC").getText();
                    oDatas[0].PCS_Toplam_Fire = this.getView().byId("toplamFirePC").getText();

                    oDatas[0].PCW_Toplam_Uretim = this.getView().byId("toplamUretimPCW").getText();
                    oDatas[0].PCW_Toplam_Tuketim = this.getView().byId("toplamTuketimPCW").getText();
                    oDatas[0].PCW_Toplam_Hurda = this.getView().byId("toplamHurdaPCW").getText();
                    oDatas[0].PCW_Toplam_Fire = this.getView().byId("toplamFirePCW").getText();

                    oDatas[0].SKP_Toplam_Uretim = this.getView().byId("toplamUretimSKP").getText();
                    oDatas[0].SKP_Toplam_Tuketim = this.getView().byId("toplamTuketimSKP").getText();
                    oDatas[0].SKP_Toplam_Hurda = this.getView().byId("toplamHurdaSKP").getText();
                    oDatas[0].SKP_Toplam_Fire = this.getView().byId("toplamFireSKP").getText();

                    oDatas[0].stddisiUretimSCT = this.getView().byId("stddisiUretimSCT").getText();
                    oDatas[0].stddisiUretimPercntSCT = this.getView().byId("stddisiUretimPercntSCT").getText();
                    oDatas[0].sapmaUretimSCT = this.getView().byId("sapmaUretimSCT").getText();
                    oDatas[0].sapmaUretimPercntSCT = this.getView().byId("sapmaUretimPercntSCT").getText();

                    oDatas[0].stddisiUretimPCS = this.getView().byId("stddisiUretimPCS").getText();
                    oDatas[0].stddisiUretimPercntPCS = this.getView().byId("stddisiUretimPercntPCS").getText();
                    oDatas[0].sapmaUretimPCS = this.getView().byId("sapmaUretimPCS").getText();
                    oDatas[0].sapmaUretimPercntPCS = this.getView().byId("sapmaUretimPercntPCS").getText();

                    oDatas[0].stddisiUretimPCW = this.getView().byId("stddisiUretimPCW").getText();
                    oDatas[0].stddisiUretimPercntPCW = this.getView().byId("stddisiUretimPercntPCW").getText();
                    oDatas[0].sapmaUretimPCW = this.getView().byId("sapmaUretimPCW").getText();
                    oDatas[0].sapmaUretimPercntPCW = this.getView().byId("sapmaUretimPercntPCW").getText();

                    oDatas[0].stddisiUretimSKP = this.getView().byId("stddisiUretimSKP").getText();
                    oDatas[0].stddisiUretimPercntSKP = this.getView().byId("stddisiUretimPercntSKP").getText();
                    oDatas[0].sapmaUretimSKP = this.getView().byId("sapmaUretimSKP").getText();
                    oDatas[0].sapmaUretimPercntSKP = this.getView().byId("sapmaUretimPercntSKP").getText();


                    var oSettings = {
                        workbook: {
                            columns: oColumns,
                        },
                        dataSource: oDatas,
                        fileName:
                            "tum_raporlar" + this.exceldate1() + "-" + this.exceldate2(),
                    };
                    var oSheet = new Spreadsheet(oSettings);
                    oSheet.build().then(function () {
                        MessageToast.show("Tablo Excel'e aktarıldı.");
                    });
                },



                time: function () {
                    var day1 = new Date().getDate();
                    var month1 = new Date().getMonth() + 1;
                    var fullyear1 = new Date().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                },


                getModelData: function () {
                    var date1 = this.time();
                    var date2 = this.time();

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeidArray = ["FOSFAT", "SCTEL1", "SCTEL2", "PCSTRAND", "PCWIRE","SKINPASS"];
                    var oData = [];

                    // var nodeidpcs = "899D5E81A7991EEB92CDCEE63D63D10B";
                    // var nodeidfosfat = "899D5E81A7991EEB92CD931F2D55510B";
                    // var nodeidpcwire = "899D5E81A7991EEB95CAD6A29473B10D";

                    // var nodeid1 = "899D5E81A7991EEB92CDB5AFB3B7310B";
                    // var nodeid2 = "899D5E81A7991EEB92CDC9CAD28A510B";


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


                    var nodeidfosfat = oData[0];
                    var nodeid1 = oData[1];
                    var nodeid2 = oData[2];
                    var nodeidpcs = oData[3];
                    var nodeidpcwire = oData[4];
                    var nodeidskinpass = oData[5];





                    var response2 = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_SELECT_MPM_PROD_RUN_HDR",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeidfosfat,
                        },
                        "O_JSON"
                    );

                    var modelArr2 = Array.isArray(response2[0].Rowsets.Rowset.Row)
                        ? response2[0].Rowsets.Rowset.Row
                        : new Array(response2[0].Rowsets.Rowset.Row);
                    var tableModel2 = new sap.ui.model.json.JSONModel(modelArr2);

                    var toplamUretimFosfat = 0;
                    var toplamTuketimFosfat = 0;
                    var toplamFireFosfat = 0;

                    var toplamUretimAYT = 0;
                    var toplamTuketimAYT = 0;
                    var toplamFireAYT = 0;

                    var toplamUretimRW = 0;
                    var toplamTuketimRW = 0;
                    var toplamFireRW = 0;

                    if (response2[0].Rowsets.Rowset.Row == null) {
                        this.getView().byId("toplamUretimFosfat").setText(0);
                        this.getView().byId("toplamTuketimFosfat").setText(0);
                        this.getView().byId("toplamFireFosfat").setText(0);

                    }
                    else {
                        if (!!modelArr2?.filter((i) => i.FS_MATNR == "FOSFATLI_FILMASIN")[0]) {
                            var fosfatModel = modelArr2?.filter((i) => i.FS_MATNR == "FOSFATLI_FILMASIN");
                            for (var i = 0; i < fosfatModel.length; i++) {
                                var toplamUretimFosfat = fosfatModel[i].FS_TOPLAM_URETIM + toplamUretimFosfat;
                                var toplamTuketimFosfat = fosfatModel[i].FS_TOPLAM_TUKETIM + toplamTuketimFosfat;
                            }
                            var toplamFireFosfat = (toplamTuketimFosfat - toplamUretimFosfat) / toplamTuketimFosfat * 100;

                        }

                        this.getView().byId("toplamUretimFosfat").setText(toplamUretimFosfat.toFixed(3));
                        this.getView().byId("toplamTuketimFosfat").setText(toplamTuketimFosfat.toFixed(3));
                        this.getView().byId("toplamFireFosfat").setText(toplamFireFosfat.toFixed(3));


                        if (!!modelArr2?.filter((i) => i.FS_RW_AYT == "AYT")[0]) {
                            var AYTModel = modelArr2?.filter((i) => i.FS_RW_AYT == "AYT");
                            for (var i = 0; i < AYTModel.length; i++) {
                                var toplamUretimAYT = AYTModel[i].FS_TOPLAM_URETIM + toplamUretimAYT;
                                var toplamTuketimAYT = AYTModel[i].FS_TOPLAM_TUKETIM + toplamTuketimAYT;
                            }
                            var toplamFireAYT = (toplamTuketimAYT - toplamUretimAYT) / toplamTuketimAYT * 100;
                        }

                        this.getView().byId("toplamUretimAYT").setText(toplamUretimAYT.toFixed(3));
                        this.getView().byId("toplamTuketimAYT").setText(toplamTuketimAYT.toFixed(3));
                        this.getView().byId("toplamFireAYT").setText(toplamFireAYT.toFixed(3));


                        if (!!modelArr2?.filter((i) => i.FS_RW_AYT == "REWORK")[0]) {
                            var reworkModel = modelArr2?.filter((i) => i.FS_RW_AYT == "REWORK");
                            for (var i = 0; i < reworkModel.length; i++) {
                                var toplamUretimRW = reworkModel[i].FS_TOPLAM_URETIM + toplamUretimRW;
                                var toplamTuketimRW = reworkModel[i].FS_TOPLAM_TUKETIM + toplamTuketimRW;
                            }
                            var toplamFireRW = (toplamTuketimRW - toplamUretimRW) / toplamTuketimRW * 100;
                        }

                        this.getView().byId("toplamUretimRW").setText(toplamUretimRW.toFixed(3));
                        this.getView().byId("toplamTuketimRW").setText(toplamTuketimRW.toFixed(3));
                        this.getView().byId("toplamFireRW").setText(toplamFireRW.toFixed(3));
                    }

                    this.getView().byId("FosfatReport").setModel(tableModel2);
                    this.getView().byId("FosfatReport").getModel().refresh();

                    var response4 = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_INNERGROUP2",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODE_ID1: nodeid1,
                            I_NODE_ID2: nodeid2,
                        },
                        "O_JSON"
                    );

                    var modelArr4 = Array.isArray(response4[0].Rowsets.Rowset.Row)
                        ? response4[0].Rowsets.Rowset.Row
                        : new Array(response4[0].Rowsets.Rowset.Row);
                    var tableModel4 = new sap.ui.model.json.JSONModel(modelArr4);

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;
                    var fark = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    if (response4[0].Rowsets.Rowset.Row == null) {

                        this.getView().byId("toplamUretimTelCekme").setText(0);
                        this.getView().byId("toplamTuketimTelCekme").setText(0);
                        this.getView().byId("farkTelCekme").setText(0);


                    }

                    else {

                        for (var i = 0; i < modelArr4.length; i++) {
                            var toplamUretim = modelArr4[i].SCTEL_URETIM + toplamUretim;
                            var toplamTuketim = modelArr4[i].SCTEL_CONS_QUANTITY + toplamTuketim;
                        }

                        var fark = (toplamTuketim - toplamUretim);
                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;

                        if (!!modelArr4.filter((i) => i.SCT_PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr4.filter((i) => i.SCT_PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].SCTEL_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretimSCT").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercntSCT").setText(stdPercnt.toFixed(3));
                        }

                        if (!!modelArr4.filter((i) => i.SCT_PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr4.filter((i) => i.SCT_PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].SCTEL_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretimSCT").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercntSCT").setText(sapmaPercnt.toFixed(3));
                        }

                        this.getView().byId("toplamUretimTelCekme").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketimTelCekme").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamFireTelCekme").setText(toplamFire.toFixed(3));
                        this.getView().byId("farkTelCekme").setText(fark.toFixed(3));

                    }

                    this.getView().byId("TelCekmeReport").setModel(tableModel4);
                    this.getView().byId("TelCekmeReport").getModel().refresh();



                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_PC_STRAND",

                        {
                            I_STARTDATE: date1,
                            I_ENDDATE: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeidpcs,
                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row)
                        ? response[0].Rowsets.Rowset.Row
                        : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;
                    var toplamHurda = 0;
                    var fark = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    if (response[0].Rowsets.Rowset.Row == null) {
                        this.getView().byId("toplamUretimPC").setText(0);
                        this.getView().byId("toplamTuketimPC").setText(0);
                        this.getView().byId("toplamHurdaPC").setText(0);
                        this.getView().byId("toplamFirePC").setText(0);

                    }
                    else {

                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamUretim = modelArr[i].PCS_TOPLAM_URETIM + toplamUretim;
                            var toplamHurda = modelArr[i].PCS_TOPLAM_HURDA + toplamHurda;
                            var toplamTuketim = modelArr[i].PCS_TOPLAM_TUKETIM + toplamTuketim;
                        }

                        if (!!modelArr.filter((i) => i.PCS_PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr.filter((i) => i.PCS_PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].PCS_TOPLAM_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretimPCS").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercntPCS").setText(stdPercnt.toFixed(3));
                        }
                        if (!!modelArr.filter((i) => i.PCS_PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr.filter((i) => i.PCS_PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].PCS_TOPLAM_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretimPCS").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercntPCS").setText(sapmaPercnt.toFixed(3));
                        }

                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;
                        this.getView().byId("toplamUretimPC").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketimPC").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamHurdaPC").setText(toplamHurda.toFixed(3));
                        this.getView().byId("toplamFirePC").setText(toplamFire.toFixed(3));
                    }

                    this.getView().byId("pcStrand").setModel(tableModel);
                    this.getView().byId("pcStrand").getModel().refresh();

                    var response3 = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_SELECT_PcWire",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeidpcwire,
                        },
                        "O_JSON"
                    );

                    var modelArr3 = Array.isArray(response3[0].Rowsets.Rowset.Row)
                        ? response3[0].Rowsets.Rowset.Row
                        : new Array(response3[0].Rowsets.Rowset.Row);
                    var tableModel3 = new sap.ui.model.json.JSONModel(modelArr3);

                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamFire = 0;
                    var toplamHurda = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    if (response3[0].Rowsets.Rowset.Row == null) {
                        this.getView().byId("toplamUretimPCW").setText(0);
                        this.getView().byId("toplamTuketimPCW").setText(0);
                        this.getView().byId("toplamHurdaPCW").setText(0);
                        this.getView().byId("toplamFirePCW").setText(0);

                    }
                    else {
                        for (var i = 0; i < modelArr3.length; i++) {
                            var toplamUretim = modelArr3[i].PCW_MAMUL_URETIM + toplamUretim;
                            var toplamTuketim = modelArr3[i].PCW_SARF_TEL_MIKTAR + toplamTuketim;
                            var toplamHurda = modelArr3[i].PCW_TOPLAM_HURDA + toplamHurda;
                        }

                        if (!!modelArr3.filter((i) => i.PCW_PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr3.filter((i) => i.PCW_PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].PCW_MAMUL_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretimPCW").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercntPCW").setText(stdPercnt.toFixed(3));
                        }
                        if (!!modelArr3.filter((i) => i.PCW_PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr3.filter((i) => i.PCW_PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].PCW_MAMUL_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretimPCW").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercntPCW").setText(sapmaPercnt.toFixed(3));
                        }

                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;
                        this.getView().byId("toplamUretimPCW").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketimPCW").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamHurdaPCW").setText(toplamHurda.toFixed(3));
                        this.getView().byId("toplamFirePCW").setText(toplamFire.toFixed(3));
                    }

                    this.getView().byId("pcWireReport").setModel(tableModel3);
                    this.getView().byId("pcWireReport").getModel().refresh();


                    var response5 = TransactionCaller.sync(
                        "MES/Itelli/DNA/DNAReport/T_skpAllReport",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeidskinpass,
                        },
                        "O_JSON"
                    );

                    var modelArr5 = Array.isArray(response5[0].Rowsets.Rowset.Row)
                        ? response5[0].Rowsets.Rowset.Row
                        : new Array(response5[0].Rowsets.Rowset.Row);
                    var tableModel5 = new sap.ui.model.json.JSONModel(modelArr5);


                    var toplamUretim = 0;
                    var toplamTuketim = 0;
                    var toplamHurda = 0;
                    var toplamFire = 0;

                    var stdUretim = 0;
                    var stdPercnt = 0;
                    var sapmaUretim = 0;
                    var sapmaPercnt = 0;

                    
                    if (response5[0].Rowsets.Rowset.Row != null) {

                        for (var i = 0; i < modelArr5.length; i++) {
                            var toplamUretim = modelArr5[i].SKP_TOPLAM_URETIM + toplamUretim;
                            var toplamTuketim = modelArr5[i].SKP_TOPLAM_TUKETIM + toplamTuketim;
                            var toplamHurda = modelArr5[i].SKP_TOPLAM_HURDA + toplamHurda;
                        }

                        if (!!modelArr5.filter((i) => i.SKP_PROD_TYPE == "STANDART DIŞI")[0]) {
                            var stdModel = modelArr5.filter((i) => i.SKP_PROD_TYPE == "STANDART DIŞI");
                            for (var i = 0; i < stdModel.length; i++) {
                                var stdUretim = stdModel[i].SKP_TOPLAM_URETIM + stdUretim;
                            }

                            var stdPercnt = stdUretim * 100 / toplamUretim;

                            this.getView().byId("stddisiUretimSKP").setText(stdUretim.toFixed(3));
                            this.getView().byId("stddisiUretimPercntSKP").setText(stdPercnt.toFixed(3));
                        }
                        if (!!modelArr5.filter((i) => i.SKP_PROD_TYPE == "SAPMA")[0]) {
                            var sapmaModel = modelArr5.filter((i) => i.SKP_PROD_TYPE == "SAPMA");
                            for (var i = 0; i < sapmaModel.length; i++) {
                                var sapmaUretim = sapmaModel[i].SKP_TOPLAM_URETIM + sapmaUretim;
                            }

                            var sapmaPercnt = sapmaUretim * 100 / toplamUretim;

                            this.getView().byId("sapmaUretimSKP").setText(sapmaUretim.toFixed(3));
                            this.getView().byId("sapmaUretimPercntSKP").setText(sapmaPercnt.toFixed(3));
                        }

                        var toplamFire = (toplamTuketim - toplamUretim) / toplamTuketim * 100;
                        this.getView().byId("toplamUretimSKP").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamTuketimSKP").setText(toplamTuketim.toFixed(3));
                        this.getView().byId("toplamHurdaSKP").setText(toplamHurda.toFixed(3));
                        this.getView().byId("toplamFireSKP").setText(toplamFire.toFixed(3));
                    }

                    this.getView().byId("SKPReport").setModel(tableModel5);
                    this.getView().byId("SKPReport").getModel().refresh();


                    this.getView().byId("datePicker").setValue(this.time() + " " + "- " + " " + this.time());
                },
            }
        );
    }
);
