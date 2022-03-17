sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "customActivity/scripts/custom",
        "../model/formatter",
        "sap/m/Dialog",
        "sap/m/Label",
        "sap/m/MessageToast",
        "sap/m/TextArea",
        "sap/m/Button",
        "sap/m/ButtonType",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "customActivity/scripts/transactionCaller"
    ],
    function (
        Controller,
        JSONModel,
        MessageBox,
        customScripts,
        formatter,
        Dialog,
        Label,
        MessageToast,
        TextArea,
        Button,
        ButtonType,
        Filter,
        FilterOperator,
        TransactionCaller
    ) {
        "use strict";
        var oDialog;
        var oTable;
        var interval;
        var that;
        var selectedItem;
        return Controller.extend("customActivity.controller.oeeConfirmationListFIR", {
            formatter: formatter,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.router = this.appComponent.getRouter();
                that = this;
                var today = new Date();
                var selectedPastTime =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                var selectedFutureTime =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                this.getView()
                    .byId("idDatePicker")
                    .setValue(selectedPastTime + " - " + selectedFutureTime);
                interval = setInterval(function getDataInterval() {
                    if (!!that.getView().byId("idDatePicker")) {
                        that.getData();
                    }
                    else {
                        clearInterval(interval);
                    }
                }, 2000);
            },
            /*
            checkShift: function () {
                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/CheckActiveStaffInShift/T_GET_ACTIVE_STAFF_IN_SHIFT",
                    {
                        I_CLIENT: this.appData.client,
                        I_PLANT: this.appData.plant,
                        I_NODE_ID: this.appData.node.nodeID
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.information("Vardiya girişi yapılmalı!");
                    //this.redirectToShiftScreen();
                }

            },
            */
            /*
            redirectToShiftScreen: function () {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_SHIFT_STAFF";
                window.location.href = origin + pathname + navToPage;
            },
            */
            getData: function () {
                var plant = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var nodeID = this.appData.node.nodeID;

                var filterSearch = this.getView().byId("filterSearch").getValue();
                var workcenterID = this.appData.node.workcenterID;
                var selectedDatePeriod = this.getView().byId("idDatePicker").getValue();
                var selectedSecondDate = new Date(
                    this.getView().byId("idDatePicker").getSecondDateValue()
                );
                var selectedSecondNextDate = new Date(selectedSecondDate);
                selectedSecondNextDate.setDate(selectedSecondNextDate.getDate() + 1);
                var selectedSecondNextDateValue =
                    selectedSecondNextDate.getDate() +
                    "." +
                    (selectedSecondNextDate.getMonth() + 1) +
                    "." +
                    selectedSecondNextDate.getFullYear();
                var selectedDatePeriodValues = selectedDatePeriod.split(" - ");

                var params = {
                    "Param.1": nodeID,
                    "Param.2": selectedDatePeriodValues[0],
                    "Param.3": selectedDatePeriodValues[1],
                    "Param.4": plant,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList/getConfirmationListQryFIR",
                    params
                );
                if (!tRunner.Execute()) {
                    //var oData = tRunner.GetJSONData();
                    //console.log(oData);
                    MessageBox.error(tRunner.GetErrorMessage());
                    clearInterval(interval);
                    return null;
                }
                var oData = tRunner.GetJSONData()[0].Row;
                var oModel = new JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(oData);
                this.getView()
                    .byId("tableConfirmed")
                    .setModel(oModel, "confirmationList");
            },
            //Teyidi iptal et / yeniden gonder
            retryConfirmation: function (oEvent) {
                var type = oEvent.getSource().getType();
                var path = oEvent.getSource().getParent().getBindingContextPath();
                path = path.split("/")[1];
                var allData = this.getView().byId("tableConfirmed").getModel("confirmationList").getData();
                var data = allData[path];
                this.selectedItem = data;

                if (type == "Emphasized") {
                    /*
                    var workCenter = this.appData.node.description;
                    if (!workCenter.includes("Fosfatlama")) {
                        var adminPassword = prompt("Teyit iptal etmek için şifre gereklidir.")
                        if(adminPassword != "Test1234") {
                            MessageBox.error("Girilen şifre hatalı!");
                            return;
                        }
                    }
                    */
                    if (!this.oDialogCancelConf) {
                        this.oDialogCancelConf = sap.ui.xmlfragment("cancelConfirmationFragment","customActivity.fragmentView.cancelConfirmationDNA",this);
                        this.getView().addDependent(this.oDialogCancelConf);
                    }
                    this.oDialogCancelConf.open();
                } else if (type == "Reject") {
                    if (!this.oDialogRetryConf) {
                        this.oDialogRetryConf = sap.ui.xmlfragment("retryConfirmationFragment","customActivity.fragmentView.retryConfirmationDNA",this);
                        this.getView().addDependent(this.oDialogRetryConf);
                    }
                    this.oDialogRetryConf.open();
                }
            },
            //Teyit İptal
            onAcceptCncCnf: function () {
                sap.ui.core.Fragment.byId("cancelConfirmationFragment", "AcceptCncCnf").setEnabled(false);
                var data = this.selectedItem;
                /*
                var params = {
                    I_CONF_NUMBER: data.CONF_NUMBER,
                    I_CONF_COUNTER: data.CONF_COUNTER,
                    I_ENTRYID: data.ENTRY_ID,
                    I_AUFNR: data.AUFNR,
                    I_STATUS: data.STATUS,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList/confirmCancelXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                } else {
                    sap.m.MessageToast.show("İşlem Gerçekleşti");
                }
                */
                var responseCancel = TransactionCaller.sync(
                    "MES/UI/ConfirmationList/confirmCancelFIRTrns",
                    {
                        I_CONF_NUMBER: data.CONF_NUMBER,
                        I_CONF_COUNTER: data.CONF_COUNTER,
                        I_ENTRYID: data.ENTRY_ID,
                        I_AUFNR: data.AUFNR,
                        I_STATUS: data.STATUS,
                    },
                    "O_JSON"
                );
                if (responseCancel[1] == "E") {
                    MessageBox.error(responseCancel[0]);
                } else {
                    MessageBox.information("Teyit iptal başarılı");
                }
                sap.ui.core.Fragment.byId("cancelConfirmationFragment", "AcceptCncCnf").setEnabled(true);
                this.oDialogCancelConf.close();
                this.getData();
            },
            onCloseCncCnf: function () {
                this.oDialogCancelConf.close();
                this.getData();
            },
            afterCloseCncCnf: function () {
                this.oDialogCancelConf.destroy();
                this.getData();
            },
            //Teyit tekrar gönder
            onAcceptRtryCnf: function () {
                sap.ui.core.Fragment.byId("retryConfirmationFragment", "AcceptRtryCnf").setEnabled(false);
                var data = this.selectedItem;
                var params = {
                    I_ID: data.ID,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList/retryQueueConfirmXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                } else {
                    sap.m.MessageToast.show("Teyit tekrar gönderildi");
                }
                sap.ui.core.Fragment.byId("retryConfirmationFragment", "AcceptRtryCnf").setEnabled(true);
                this.oDialogRetryConf.close();
                this.getData();
            },

            onCloseRtryCnf: function () {
                this.oDialogRetryConf.close();
                this.getData();
            },
            afterCloseRtryCnf: function () {
                this.oDialogRetryConf.destroy();
                this.getData();
            },
            /*
            onPressEtiket: function (oEvent) {
                var b = oEvent.getSource().getParent().getBindingContextPath();
                var c = this.getView().byId("tableConfirmed").getModel("confirmationList").getObject(b);
                var aufnr = c.AUFNR;
                var entryID = c.ENTRY_ID;
                var printName = this.getView().byId("idPrinter").getSelectedKey();
                var manuel = "X";

                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/Etiket/API/RESEND_ETIKET/T_RESEND_ETIKET",
                    {
                        I_AUFNR: aufnr,
                        I_ENTRYID: entryID,
                        I_MANUEL: manuel,
                        I_PRINT_NAME: printName,
                        I_CLIENT: this.appData.client,
                        I_PLANT: this.appData.plant,
                        I_NODEID: this.appData.node.nodeID,
                    },
                    "O_JSON"
                );

                // var response = TransactionCaller.sync(
                //     "MES/Itelli/DNA/Etiket/EtiketTekrar/T_UPD_ETIKET_ISLEMDRM",
                //     {
                //         I_BATCH_NO: c.BATCH_NO,
                //     },
                //     "O_JSON"
                // );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                }
                if (response[1] == "S") {
                    MessageBox.information("Yeniden Etiket Alma Başarılı");
                }
            },
            */

            /*
            cancelConsumption: function (oEvent) {
                var path = oEvent.getSource().getParent().getBindingContextPath();
                path = path.split("/")[1];
                var allData = this.getView()
                    .byId("tableConfirmed")
                    .getModel("confirmationList")
                    .getData();
                var data = allData[path];
                var response = TransactionCaller.sync("MES/Itelli/DNA/CancelConsumption/T_CANCEL_CONSUMPTION", {
                    I_BATCH_NO: data.BATCH_NO
                },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                }
                MessageBox.information("Bileşen tüketimleri geri alınmıştır");
            },
            */
            refreshData: function () {
                this.getData();
            },

            onExit() {
                jQuery.sap.clearIntervalCall(this.getDataRefreshInterval);
                document.getElementById("__button1").style.visibility = "visible";
            },

            onSearch: function (oEvent) {
                var aFilters = [];
                var sQuery = oEvent.getSource().getValue();

                var oFilter1 = new sap.ui.model.Filter(
                    "AUFNR",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );
                var oFilter2 = new sap.ui.model.Filter(
                    "MATNR",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );
                var oFilter3 = new sap.ui.model.Filter(
                    "CASTID",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );
                var allFilter = new sap.ui.model.Filter(
                    [oFilter1, oFilter2, oFilter3],
                    false
                );
                oTable = this.getView().byId("tableConfirmed");
                var oBinding = oTable.getBinding("items");
                oBinding.filter(allFilter);
            },

            /*
            onPressConf: function () {
                var tableUnfilteredData = this.getView()
                    .byId("tableConfirmed")
                    .getModel("confirmationList")
                    .getData();
                var failedConfirmationList = [];
                for (var i = 0; i < tableUnfilteredData.length; i++) {
                    if (tableUnfilteredData[i].STATUS !== "PASSED") {
                        failedConfirmationList.push(tableUnfilteredData[i]);
                    }
                }
                this.getView()
                    .byId("tableConfirmed")
                    .getModel("confirmationList")
                    .setData(failedConfirmationList);
            },
            */

            onClickGetConsumption: function (oEvent) {
                var sPath = oEvent.getSource().getParent().getBindingContextPath();
                var selectedRow = sPath.split("/")[1];
                var allData = this.getView()
                    .byId("tableConfirmed")
                    .getModel("confirmationList")
                    .getData();
                var entryID = allData[selectedRow].ENTRY_ID;
                var fragmentPath = "";
                if(this.appData.node.description.includes("Örme")){
                    fragmentPath = "customActivity.fragmentView.consumptionBatchListORME";
                }
                else if(this.appData.node.description.includes("Düzenli Halat Sarıcı")){
                    fragmentPath = "customActivity.fragmentView.consumptionBatchListDHS";
                }
                /*
                else if(this.appData.node.description.includes("Tel Çekme")){
                    fragmentPath = "customActivity.fragmentView.consumptionBatchListSCT";
                }
                */
                else{
                    fragmentPath = "customActivity.fragmentView.consumptionBatchList";
                }
                var oView = this.getView();
                var oDialog = oView.byId("consumptionBatchList");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        fragmentPath,
                        this
                    );
                    oView.addDependent(oDialog);
                }
                oDialog.open();
                this.appData.oDialog = oDialog;

                this.getConsumptionQry(entryID);
            },

            callConsumptionQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().byId("consumptionBatchListTable").setModel(oModel);
            },

            getConsumptionQry: function (entryID) {
                var path = "";
                if(this.appData.node.description.includes("Örme")){
                    path = "MES/UI/ConfirmationList/getConsumptionBatchQryORME";
                }
                else if(this.appData.node.description.includes("Düzenli Halat Sarıcı")){
                    path = "MES/UI/ConfirmationList/getConsumptionBatchQryDHS";
                }
                /*
                else if(this.appData.node.description.includes("Tel Çekme")){
                    path = "MES/UI/ConfirmationList/getConsumptionBatchQrySCT";
                }
                */
                else{
                    path = "MES/UI/ConfirmationList/getConsumptionBatchQry";
                }
                var params = { "Param.1": entryID };
                var tRunner = new TransactionRunner(
                    path,
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callConsumptionQry);
            },

            handleCancel: function (oEvent) {
                this.appData.oDialog.close()
            },

            /*
            selectPrinterID: function () {


                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/Etiket/API/RESEND_ETIKET/T_Select_Node_Infos",
                    {
                        I_CLIENT: this.appData.client,
                        I_PLANT: this.appData.plant,
                        I_NODE_ID: this.appData.node.nodeID,
                    },
                    "O_JSON"
                );

                var name = response[0].Rowsets.Rowset.Row.NAME;

                
                var response = TransactionCaller.sync(
                    "MES/Itelli/PRINTERS/T_GET_ID_MODEL",
                    {
                        
                    },
                    "O_JSON"
                );

                var modelArr = Array.isArray(response[0]?.Rowsets?.Rowset?.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);
                var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                this.getView().byId("idPrinter").setModel(tableModel);             
                this.getView().byId("idPrinter").setSelectedKey(name);


            },
            */
        });
    }
);
