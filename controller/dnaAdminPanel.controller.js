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
        "customActivity/scripts/customStyle",
        "../model/formatter",
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
        customScripts,
        customStyle,
        formatter
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        return Controller.extend(
            "customActivity/controller/dnaAdminPanel",
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
                    this.screenAllValue = [{}];
                    this.screenObj = [];
                    this.screenObj.inputChar = [];
                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();
                    this.interfaces = this.appComponent.getODataInterface();
                    this.typeModel();
                    //this.getModelCloseDay();
                    this.getTableData();
                },
                handleChange: function (oEvent) {
                    var oText = this.getView().byId("DateTimePicker"),
                    sValue = oEvent.getParameter("value");
                    oText.setValue(sValue);
                },
                handleChange2: function (oEvent) {
                    var oText = this.getView().byId("DateTimePickerFilter"),
                    sValue = oEvent.getParameter("value");
                    oText.setValue(sValue);
                },
                isInputNumber: function (oEvent) {
                    var typeCNT = this.getView().byId("idType")?.getSelectedKey();
                    if (typeCNT == "CNT") {
                        var _oInput = oEvent.getSource();
                        var val = _oInput.getValue();
                        val = val.replace(/[^\d]/g, "");
                        _oInput.setValue(val);
                    }
                },

                getTableData:function(){

                    var params = {
                        /* "Param.1": this.appData.client,
                        "Param.2": this.getView().byId("plantSelectBox").getSelectedKey(), */

                    };
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/AdminPanel/getFailedConsumptionsQry", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);

                    this.getView().byId("failedConsumptions").setModel(oModel);
                   




                },


                getDescriptions: function () {
                    var typeCNT = this.getView().byId("idType")?.getSelectedKey();
                    var params = {
                        "Param.1": typeCNT
                    };
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/AdminPanel/getModelbyTypeQry", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);
                    this.getView().byId("idDescription").setModel(oModel);
                    this.getView().byId("idOldValue").setText(null);
                    this.getView().byId("idNewValue").setValue(null);
                },
                getChosenValues: function () {
                    var selectedIndex = this.getView().byId("idDescription").getSelectedItem().getBindingContext().sPath.split("/")[1];
                    var selectedModel = this.getView().byId("idDescription").getModel()?.getData()[selectedIndex];
                    var value = selectedModel.VALUE;
                    this.getView().byId("idOldValue").setText(value);
                    this.getView().byId("idNewValue").setValue(null);
                },
                typeModel: function () {
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/AdminPanel/selectTypeAdmPnlQry");
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);
                    this.getView().byId("idType")?.setModel(oModel);
                },
                onSave: function () {
                    var newValue = this.getView().byId("idNewValue").getValue();
                    var selectedIndex = this.getView().byId("idDescription").getSelectedItem().getBindingContext().sPath.split("/")[1];
                    var selectedModel = this.getView().byId("idDescription").getModel()?.getData()[selectedIndex];

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/AdminPanel/T_Admin_Panel",
                        {
                            I_ID: selectedModel.ID,
                            I_VALUE: newValue,
                            I_USER: this.appData.user.userID,
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
                    this.getView().byId("idDescription").setSelectedKey(null);
                    this.getView().byId("idType").setSelectedKey(null);
                    this.getView().byId("idNewValue").setValue(null);
                    this.getView().byId("idOldValue").setText(null);
                },
                /*
                getModelCloseDay: function () {
                    var params4 = {
                        "Param.1": this.appData.client,
                        "Param.2": this.appData.plant,
                    };
                    var tRunner4 = new TransactionRunner("MES/Itelli/PastActivity/getWorkplaceAllQry", params4);
                    if (!tRunner4.Execute()) {
                        MessageBox.error(tRunner4.GetErrorMessage());
                        return;
                    }
                    var oData4 = tRunner4.GetJSONData();
                    var oModel4 = new sap.ui.model.json.JSONModel();
                    oModel4.setData(oData4[0].Row);
                    this.getView().byId("isyeriSelectBox").setModel(oModel4);
                    this.getView().byId("isyeriSelectBoxFilter").setModel(oModel4);
                    var params = {
                        "Param.1": this.appData.client,
                        "Param.2": this.appData.plant,
                        "Param.3": this.appData.node.nodeID,

                    };
                    var tRunner = new TransactionRunner("MES/Itelli/PastActivity/getWorkplaceQry", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    this.getView().byId("isyeriSelectBox").setSelectedKey(oData[0].Row[0].NAME);
                    // this.getView().byId("isyeriSelectBoxFilter").setSelectedKey(oData[0].Row[0].NAME);
                    var params2 = {};
                    var tRunner2 = new TransactionRunner("MES/Itelli/PastActivity/getPlantQry", params2);
                    if (!tRunner2.Execute()) {
                        MessageBox.error(tRunner2.GetErrorMessage());
                        return;
                    }
                    var oData2 = tRunner2.GetJSONData();
                    var oModel2 = new sap.ui.model.json.JSONModel();
                    oModel2.setData(oData2[0].Row);
                    this.getView().byId("plantFilter").setModel(oModel2);
                    // this.getView().byId("plantFilter").setSelectedKey(this.appData.plant);
                    this.getTableModel();
                },
                getTableModel: function () {
                    var previousDate = moment(moment(new Date()).format("DD-MM-YYYY"), "DD-MM-YYYY").subtract(1, 'days').format("DD-MM-YYYY");
                    var params2 = {
                        "Param.1": this.appData.client,
                        "Param.2": previousDate,
                    };
                    var tRunner2 = new TransactionRunner("MES/Itelli/PastActivity/getModelQry", params2);
                    if (!tRunner2.Execute()) {
                        MessageBox.error(tRunner2.GetErrorMessage());
                        return;
                    }
                    var oData2 = tRunner2.GetJSONData();
                    var oModel2 = new sap.ui.model.json.JSONModel();
                    oModel2.setData(oData2[0].Row);
                    this.getView().byId("pastActivityInfos").setModel(oModel2);
                    this.getView().byId("DateTimePicker").setValue(previousDate);
                    this.getView().byId("DateTimePickerFilter").setValue(previousDate);
                },

                onCloseDay: function () {
                    var workplace = this.getView().byId("isyeriSelectBox").getSelectedKey();
                    var date = this.getView().byId("DateTimePicker").getValue();
                    if (!!!workplace) {
                        MessageBox.error("İş yerini seçiniz.")
                        return;
                    }
                    if (!!!date) {
                        MessageBox.error("Tarihi doldurunuz.")
                        return;
                    }
                    if (moment(new Date()).format("DD-MM-YYYY") == date) {
                        MessageBox.error("Bugünün tarihine kayıt oluşturamazsınız.")
                        return;
                    }
                    var response = TransactionCaller.sync(
                        "MES/Itelli/PastActivity/T_Insert_Past_Activity_AP",
                        {
                            I_CLIENT: this.appData.client,
                            I_PLANT: this.appData.plant,
                            I_ISYERI: workplace,
                            I_DATE: date,
                            I_USER: this.appData.user.userID,
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
                    this.getView().byId("isyeriSelectBox").setSelectedKey(null);
                    this.getView().byId("DateTimePicker").setValue(null);
                },

                
                onDelete: function (oEvent) {
                    var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                    var selectedModel = oEvent.oSource.getModel().getData()[selectedIndex];
                    var selectedID = selectedModel.ID;
                    var workplace = selectedModel.ISYERI;
                    var array = [{}];
                    array[0].workplace = workplace
                    array[0].selectedID = selectedID
                    this.openFragment(array);
                },
                openFragment: function (array) {
                    if (!this._oDialog01) {
                        this._oDialog01 = sap.ui.xmlfragment(
                            "pastActivityMessage",
                            "customActivity.fragmentView.pastActivityMessage",
                            this
                        );
                        this.getView().addDependent(this._oDialog01);
                    }
                    this._oDialog01.open();
                    sap.ui.core.Fragment.byId("pastActivityMessage", "deleteData").setModel(array);
                },
                onCancelFrag01: function () {
                    this._oDialog01.close();
                },
                onPressDelete: function () {
                    var selectedModelfromDialog = sap.ui.core.Fragment.byId("pastActivityMessage", "deleteData")?.getModel();
                    var params = {
                        "Param.1": selectedModelfromDialog[0].selectedID,
                    };
                    var tRunner = new TransactionRunner("MES/Itelli/PastActivity/deleteQry", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    this.onGetirFilter();
                    this.onCancelFrag01();
                },
                onGetirFilter: function () {
                    var dateFilter = this.getView().byId("DateTimePickerFilter")?.getValue();
                    var plantFilter = this.getView().byId("plantFilter")?.getSelectedKey();
                    var workplaceFilter = this.getView().byId("isyeriSelectBoxFilter")?.getSelectedKey();
                    var response = TransactionCaller.sync(
                        "MES/Itelli/PastActivity/T_GetFilterModel",
                        {
                            I_CLIENT: this.appData.client,
                            I_PLANT: plantFilter,
                            I_WORKPLACE: workplaceFilter,
                            I_DATE: dateFilter,
                        },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }
                    var modelArr = Array.isArray(response[0]?.Rowsets?.Rowset?.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    this.getView().byId("pastActivityInfos").setModel(tableModel);
                },
                onClearDate: function () {
                    this.getView().byId("DateTimePickerFilter").setValue(null);
                },
                onClearPlant: function () {
                    this.getView().byId("plantFilter").setSelectedKey(null);
                },
                onClearWorkplace: function () {
                    this.getView().byId("isyeriSelectBoxFilter").setSelectedKey(null);
                },
                */
            });
    }
);