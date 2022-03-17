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
            "customActivity.controller.dnaOrmeToleranslar",

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

                kaydet: function () {

                    var kalite = this.getView().byId("Input15").getValue();
                    var cap = this.getView().byId("Input16").getValue();


                    if (kalite == "" || cap == "") {
                        alert("Lütfen Kalite ve Çap değerlerini doldurunuz.");
                        return;
                    }
                    
                    var Array = [];

                    for (let i = 1; i < 17; i++) {
                        Array[i] = this.getView().byId("Input" + i).getValue();
                    }

                    for (let i = 1; i < 17; i++) {
                        Array[i] = this.getView().byId("Input" + i).getValue();
                        if (Array[i] === "") {
                            alert("Lütfen boş alanları doldurunuz.");
                            return;
                        }
                    }

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;
                    var ınsuser = this.appData.user.userID;

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/OrmeToleranslar/T_InsertOrmeTolerans",

                        {
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeid,
                            I_INSUSER: ınsuser,
                            I_INPUT1: Array[1],
                            I_INPUT2: Array[2],
                            I_INPUT3: Array[3],
                            I_INPUT4: Array[4],
                            I_INPUT5: Array[5],
                            I_INPUT6: Array[6],
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

                
                sec: function () {


                    var cap = this.getView().byId("idCap").getSelectedKey();
                    var kalite = this.getView().byId("idKalite").getSelectedKey();

                    var params = {
                        "Param.1": cap,
                        "Param.2": kalite,
                    };
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/OrmeToleranslar/Q_SELECT", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData);

                    var obj = oData[0].Row[0]

                    
                    var result = Object.keys(obj).map((key) => [Number(key), obj[key]]);                   
                    for (let i = 1, j = 8; i < 15 && j < 22; i++, j++) {
                        this.getView().byId("Input" + i).setValue(result[j][1])
                    }
                    this.getView().byId("Input15").setValue(result[6][1]);
                    this.getView().byId("Input16").setValue(result[7][1]);

                },

                update: function () {

                    var Array = [];

                    for (let i = 1; i < 17; i++) {
                        Array[i] = this.getView().byId("Input" + i).getValue();
                    }

                    for (let i = 1; i < 17; i++) {
                        Array[i] = this.getView().byId("Input" + i).getValue();
                        if (Array[i] === "") {
                            alert("Lütfen boş alanları doldurunuz.");
                            return;
                        }
                    }

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/OrmeToleranslar/UpdateData/T_Update_Data",

                        {
                            I_INPUT1: Array[1],
                            I_INPUT2: Array[2],
                            I_INPUT3: Array[3],
                            I_INPUT4: Array[4],
                            I_INPUT5: Array[5],
                            I_INPUT6: Array[6],
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

                getModelData: function () {

                    var tRunner = new TransactionRunner("MES/Itelli/DNA/OrmeToleranslar/getKalite/selectKalite");
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);

                    this.getView().byId("idKalite").setModel(oModel);
                },

                getCapData: function () {

                    var kalite = this.getView().byId("idKalite").getSelectedKey();

                    var params = {
                        "Param.1": kalite
                    };
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/OrmeToleranslar/SelectComboBox/getDatabyKalite", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);

                    this.getView().byId("idCap").setModel(oModel);

                },

                clear: function () {

                    for (let i = 1; i < 17; i++) {
                        this.getView().byId("Input" + i).setValue("")
                    }

                },

                clearLiveChange: function () {

                    for (let i = 1; i < 15; i++) {
                        this.getView().byId("Input" + i).setValue("")
                    }

                },
            }
        );
    }
);