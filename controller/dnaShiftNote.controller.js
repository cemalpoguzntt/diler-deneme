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
        coreLibrary
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        var ValueState = coreLibrary.ValueState;
        return Controller.extend(
            "customActivity.controller.dnaShiftNote",

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
                    this.getView().setModel(this.oEnterTimeModel,"startDateModel");
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

                handleLiveChange: function (oEvent) {
                    var iValueLength = this.getView().byId("idNote").getValue().length,
                        iMaxLength = this.getView().byId("idNote").getMaxLength(),
                        sState = iValueLength > iMaxLength ? ValueState.Warning : ValueState.None;

                    this.getView().byId("idNote").setValueState(sState);
                    if (iValueLength > iMaxLength) {
                        MessageBox.error("Max karakter sayısı 5000'dir. Lütfen karakter siliniz.");
                    }
                },

                onPressSave: function () {
                    
                    var tarih = this.getView().byId("DateTimePicker1").getValue();
                    var nodeid = this.appData.node.nodeID;
                    var plant = this.appData.plant;
                    var vardiya = this.getView().byId("idShift").getSelectedKey();
                    var userid = this.appData.user.userID;
                    var note = String(this.getView().byId("idNote").getValue());

                    
                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/ShiftNote/T_SaveShiftNote",

                        {
                            I_DATE: tarih,
                            I_CLIENT: this.appData.client,
                            I_PLANT: plant,
                            I_NODEID: nodeid,
                            I_VARDIYA: vardiya,
                            I_USERID: userid,
                            I_NOTE: JSON.stringify(note),

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }
                    else {
                        MessageBox.information("İşlem Başarılı");
                    }


                },

                onPressGetir: function () {

                    var vardiya = this.getView().byId("idShift").getSelectedKey(vardiya);
                    var nodeid = this.appData.node.nodeID;
                    var plant = this.appData.plant;                    
                    var tarih = this.getView().byId("DateTimePicker1").getValue();

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/ShiftNote/T_GetShiftNote",

                        {
                            I_CLIENT: this.appData.client,
                            I_DATE: tarih,
                            I_PLANT: plant,
                            I_NODEID: nodeid,
                            I_VARDIYA: vardiya,
                        },
                        "O_JSON"
                    );

                    var modelData = response[0];

                    this.getView().byId("idNote").setValue(modelData);                      

                },





            }
        );
    }
);