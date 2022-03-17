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
            "customActivity.controller.fosfatlamaToleranslar",

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
                    // this.getCapData();

                },

                kaydet: function () {

                    var kalite = this.getView().byId("Input7").getValue();
                    var cap = this.getView().byId("Input8").getValue();

                    // var obj = response[0].Rowsets.Rowset.Row
                    // if (obj != null) {

                    //     var result = Object.keys(obj).map((key) => [Number(key), obj[key]]);

                    //     for (let j = 0; j < result.length; j++) {
                    //         if (kalite == result[j][1].KALITE && cap == result[j][1].CAP) {
                    //             alert("Var olan Kalite ve Çap değeri girdiniz. Lütfen sağ taraftan kontrol ediniz.");
                    //             return;
                    //         }
                    //         else if (kalite == "" || cap == "") {
                    //             alert("Lütfen Kalite ve Çap değerlerini doldurunuz.");
                    //             return;
                    //         }
                    //     }
                    // }
                    if (kalite == "" || cap == "") {
                        alert("Lütfen Kalite ve Çap değerlerini doldurunuz.");
                        return;
                    }


                    var Array = [];

                    for (let i = 7; i < 57; i++) {
                        Array[i] = this.getView().byId("Input" + i).getValue();
                    }

                    for (let i = 7; i < 49; i++) {
                        Array[i] = this.getView().byId("Input" + i).getValue();
                        if (Array[i] === "") {
                            alert("Lütfen boş alanları doldurunuz.");
                            return;
                        }
                    }

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;
                    // var shift = this.appData.shift.shiftID;
                    // var aufnr = this.appData.selected.order.orderNo;
                    var ınsuser = this.appData.user.userID;

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/fosfatlamaToleranslar/T_INSERT_FSTOLERANS",

                        {
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeid,
                            // I_SHIFT: shift,
                            // I_AUFNR: aufnr,
                            I_INSUSER: ınsuser,
                            I_INPUT7: Array[7],
                            I_INPUT8: Array[8],
                            I_INPUT9: Array[9],
                            I_INPUT10: Array[10],
                            I_INPUT11: Array[11],
                            I_INPUT12: Array[12],
                            I_INPUT13: Array[13],
                            I_INPUT14: Array[14],
                            I_INPUT15: Array[15],
                            I_INPUT16: Array[16],
                            I_INPUT17: Array[17],
                            I_INPUT18: Array[18],
                            I_INPUT19: Array[19],
                            I_INPUT20: Array[20],
                            I_INPUT21: Array[21],
                            I_INPUT22: Array[22],
                            I_INPUT23: Array[23],
                            I_INPUT24: Array[24],
                            I_INPUT25: Array[25],
                            I_INPUT26: Array[26],
                            I_INPUT27: Array[27],
                            I_INPUT28: Array[28],
                            I_INPUT29: Array[29],
                            I_INPUT30: Array[30],
                            I_INPUT31: Array[31],
                            I_INPUT32: Array[32],
                            I_INPUT33: Array[33],
                            I_INPUT34: Array[34],
                            I_INPUT35: Array[35],
                            I_INPUT36: Array[36],
                            I_INPUT37: Array[37],
                            I_INPUT38: Array[38],
                            I_INPUT39: Array[39],
                            I_INPUT40: Array[40],
                            I_INPUT41: Array[41],
                            I_INPUT42: Array[42],
                            I_INPUT43: Array[43],
                            I_INPUT44: Array[44],
                            I_INPUT45: Array[45],
                            I_INPUT46: Array[46],
                            I_INPUT47: Array[47],
                            I_INPUT48: Array[48],
                            I_INPUT49: Array[49],
                            I_INPUT50: Array[50],
                            I_INPUT51: Array[51],
                            I_INPUT52: Array[52],
                            I_INPUT53: Array[53],
                            I_INPUT54: Array[54],
                            I_INPUT55: Array[55],
                            I_INPUT56: Array[56],

                        },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        alert(response[0]);
                    } else {

                        MessageBox.information("Veriler Başarılı bir şekilde kayıt edildi");
                    }

                    this.getModelData();
                    this.getCapData();
                    this.clear();

                },

                getModelData: function () {
                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/fosfatlamaToleranslar/SelectComboBox/T_SELECT_COMBOBOX",
                        {},
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                    // tableModel.setData(response[0]);
                    // this.getView().byId("idCap").setModel(tableModel);
                    this.getView().byId("idKalite").setModel(tableModel);
                },

                sec: function () {

                    var cap = this.getView().byId("idCap").getValue();
                    var kalite = this.getView().byId("idKalite").getValue();

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/fosfatlamaToleranslar/T_SELECT",
                        {
                            I_1: cap,
                            I_2: kalite,
                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                    tableModel.setData(response[0]);
                    var obj = response[0].Rowsets.Rowset.Row
                    var result = Object.keys(obj).map((key) => [Number(key), obj[key]]);
                    this.getView().byId("Input7").setValue(result[8][1])
                    this.getView().byId("Input8").setValue(result[7][1])
                    for (let i = 9, j = 9; i < 57 && j < 57; i++, j++) {
                        this.getView().byId("Input" + i).setValue(result[j][1])
                    }

                },

                update: function () {

                    var cap = this.getView().byId("idCap").getValue();
                    var kalite = this.getView().byId("idKalite").getValue();

                    var Array = [];

                    for (let i = 9; i < 57; i++) {
                        Array[i] = this.getView().byId("Input" + i).getValue();
                    }

                    for (let i = 7; i < 49; i++) {
                        Array[i] = this.getView().byId("Input" + i).getValue();
                        if (Array[i] === "") {
                            alert("Lütfen boş alanları doldurunuz.");
                            return;
                        }
                    }

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/fosfatlamaToleranslar/UpdateData/Q_UPDATE_DATA",

                        {
                            I_INPUT7: Array[9],
                            I_INPUT8: Array[10],
                            I_INPUT9: Array[11],
                            I_INPUT10: Array[12],
                            I_INPUT11: Array[13],
                            I_INPUT12: Array[14],
                            I_INPUT13: Array[15],
                            I_INPUT14: Array[16],
                            I_INPUT15: Array[17],
                            I_INPUT16: Array[18],
                            I_INPUT17: Array[19],
                            I_INPUT18: Array[20],
                            I_INPUT19: Array[21],
                            I_INPUT20: Array[22],
                            I_INPUT21: Array[23],
                            I_INPUT22: Array[24],
                            I_INPUT23: Array[25],
                            I_INPUT24: Array[26],
                            I_INPUT25: Array[27],
                            I_INPUT26: Array[28],
                            I_INPUT27: Array[29],
                            I_INPUT28: Array[30],
                            I_INPUT29: Array[31],
                            I_INPUT30: Array[32],
                            I_INPUT31: Array[33],
                            I_INPUT32: Array[34],
                            I_INPUT33: Array[35],
                            I_INPUT34: Array[36],
                            I_INPUT35: Array[37],
                            I_INPUT36: Array[38],
                            I_INPUT37: Array[39],
                            I_INPUT38: Array[40],
                            I_INPUT39: Array[41],
                            I_INPUT40: Array[42],
                            I_INPUT41: Array[43],
                            I_INPUT42: Array[44],
                            I_INPUT43: Array[45],
                            I_INPUT44: Array[46],
                            I_INPUT45: Array[47],
                            I_INPUT46: Array[48],
                            I_INPUT47: Array[49],
                            I_INPUT48: Array[50],
                            I_INPUT49: Array[51],
                            I_INPUT50: Array[52],
                            I_INPUT51: Array[53],
                            I_INPUT52: Array[54],
                            I_INPUT53: Array[55],
                            I_INPUT54: Array[56],
                            I_INPUT55: cap,
                            I_INPUT56: kalite,

                        },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        alert(response[0]);
                        return;
                    } else {

                        MessageBox.information("Veriler Başarılı bir şekilde kayıt edildi");
                    }

                    this.getModelData();
                    this.getCapData();

                    this.clear();

                },

                getCapData: function () {

                    var kalite = this.getView().byId("idKalite").getValue();

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/fosfatlamaToleranslar/KALITEYE_BAGLI_CAP/T_KALITE_BAGLI_CAP",
                        {
                            I_KALITE: kalite,
                        },
                        "O_JSON"
                    );


                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                    // tableModel.setData(response[0]);
                    this.getView().byId("idCap").setModel(tableModel);

                },

                clear: function () {

                    for (let i = 7; i < 57; i++) {
                        this.getView().byId("Input" + i).setValue("")
                    }

                },

                clearLiveChange: function () {

                    for (let i = 9; i < 57; i++) {
                        this.getView().byId("Input" + i).setValue("")
                    }

                },
            }
        );
    }
);