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
        'sap/ui/core/library',
        "customActivity/scripts/custom",
        "customActivity/scripts/customStyle",
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
        coreLibrary,
        customScripts,
        customStyle
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        var ValueState = coreLibrary.ValueState;
        return Controller.extend(
            "customActivity.controller.dnaShiftNoteSCT",

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

                    // Ekran açılırken tarihi set etme
                    this.oEnterTimeModel = new sap.ui.model.json.JSONModel();
                    var dateObject = new Date(
                        this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                            new Date().getTime()
                        )
                    );
                    this.getView().setModel(this.oEnterTimeModel, "startDateModel");
                    this.getView().getModel("startDateModel").setProperty("/startDate", dateObject);
                    //
                    var vardiya = parseInt(this.appData.shift.shiftID);
                    this.getView().byId("idShift").setSelectedKey(vardiya);
                    this.getView().byId("DateTimePicker1").setValue(new Date().toISOString().split('T')[0]);
                    this.onPressGetir();




                },

                handleChange1: function (oEvent) {
                    var oText = this.getView().byId("DateTimePicker1"),
                        sValue = oEvent.getParameter("value");


                    oText.setValue(sValue);

                },

                handleLiveChangeSCT1: function (oEvent) {
                    var iValueLength = this.getView().byId("idNote1").getValue().length,
                        iMaxLength = this.getView().byId("idNote1").getMaxLength(),
                        sState = iValueLength > iMaxLength ? ValueState.Warning : ValueState.None;

                    this.getView().byId("idNote1").setValueState(sState);
                    if (iValueLength > iMaxLength) {
                        MessageBox.error("Max karakter sayısı 5000'dir. Lütfen karakter siliniz.");
                    }
                },
                handleLiveChangeSCT2: function (oEvent) {
                    var iValueLength = this.getView().byId("idNote2").getValue().length,
                        iMaxLength = this.getView().byId("idNote2").getMaxLength(),
                        sState = iValueLength > iMaxLength ? ValueState.Warning : ValueState.None;

                    this.getView().byId("idNote2").setValueState(sState);
                    if (iValueLength > iMaxLength) {
                        MessageBox.error("Max karakter sayısı 5000'dir. Lütfen karakter siliniz.");
                    }
                },

                onPressSave: function () {

                    var tarih = this.getView().byId("DateTimePicker1").getValue();
                    
                    var plant = this.appData.plant;
                    var vardiya = this.getView().byId("idShift").getSelectedKey();
                    var userid = this.appData.user.userID;
                    var note1 = String(this.getView().byId("idNote1").getValue());
                    var note2 = String(this.getView().byId("idNote2").getValue());
                    var nodeidArray = ["SCTEL1", "SCTEL2"];
                    var oData = [];

                    nodeidArray.forEach((item, index) => {

                        var params = {
                            "Param.1": this.appData.client,
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
                    
                    var nodeidsct1 = oData[0];
                    var nodeidsct2 = oData[1];


                    var response1 = TransactionCaller.sync(
                        "MES/Itelli/DNA/ShiftNote/T_SaveShiftNote",

                        {
                            I_DATE: tarih,
                            I_CLIENT: this.appData.client,
                            I_PLANT: plant,
                            I_NODEID: nodeidsct1,
                            I_VARDIYA: vardiya,
                            I_USERID: userid,
                            I_NOTE: JSON.stringify(note1),


                        },
                        "O_JSON"
                    );

                    if (response1[1] == "E") {
                        MessageBox.error(response1[0]);
                        return;
                    }

                    var response2 = TransactionCaller.sync(
                        "MES/Itelli/DNA/ShiftNote/T_SaveShiftNote",

                        {
                            I_DATE: tarih,
                            I_CLIENT: this.appData.client,
                            I_PLANT: plant,
                            I_NODEID: nodeidsct2,
                            I_VARDIYA: vardiya,
                            I_USERID: userid,
                            I_NOTE: JSON.stringify(note2),

                        },
                        "O_JSON"
                    );

                    if (response2[1] == "E") {
                        MessageBox.error(response2[0]);
                        return;
                    }


                    if (response1[1] == "S" && response2[1] == "S") {
                        MessageBox.information("İşlem Başarılı");
                    }


                },

                onPressGetir: function () {

                    var vardiya = this.getView().byId("idShift").getSelectedKey(vardiya);                    
                    var plant = this.appData.plant;
                    var tarih = this.getView().byId("DateTimePicker1").getValue();

                    var nodeidArray = ["SCTEL1", "SCTEL2"];
                    var oData = [];

                    nodeidArray.forEach((item, index) => {

                        var params = {
                            "Param.1": this.appData.client,
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
                    
                    var nodeidsct1 = oData[0];
                    var nodeidsct2 = oData[1];


                    var response1 = TransactionCaller.sync(
                        "MES/Itelli/DNA/ShiftNote/T_GetShiftNote",

                        {
                            I_DATE: tarih,
                            I_CLIENT: this.appData.client,
                            I_PLANT: plant,
                            I_NODEID: nodeidsct1,
                            I_VARDIYA: vardiya,
                        },
                        "O_JSON"
                    );

                    var modelData1 = response1[0];                    

                    this.getView().byId("idNote1").setValue(modelData1);


                    var response2 = TransactionCaller.sync(
                        "MES/Itelli/DNA/ShiftNote/T_GetShiftNote",

                        {
                            I_DATE: tarih,
                            I_CLIENT: this.appData.client,
                            I_PLANT: plant,
                            I_NODEID: nodeidsct2,
                            I_VARDIYA: vardiya,
                        },
                        "O_JSON"
                    );

                    var modelData2 = response2[0];

                    this.getView().byId("idNote2").setValue(modelData2);

                },





            }
        );
    }
);