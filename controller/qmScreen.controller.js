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
        var interval;        
        var that;
        var intervalState = true;
        return Controller.extend("customActivity.controller.qmScreen", {
            formatter: formatter,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.router = this.appComponent.getRouter();
                that = this;
                this.getData();
                interval = setInterval(function getDataInterval() {
                    if (!!intervalState) {
                        if (!!that.getView().byId("idQMRSB")) {
                            that.getData();
                        }
                        else {
                            clearInterval(interval);
                        }
                    }
                }, 2000);
            },
            getData: function () {
                var params = {};
                var tRunner = new TransactionRunner(
                    "MES/Itelli/DNA/QM Screen/getQMcomponentsQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    clearInterval(interval);
                    return null;
                }
                var oData = tRunner.GetJSONData()[0].Row;
                var oModel = new JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(oData);
                this.getView().byId("tableConfirmed").setModel(oModel, "confirmationList");
            },
            
            //Eski teyidi iptal et ve yeni QM karakteristiklerini ekle
            cancelOldConfirmation: function (oEvent) {
                var path = oEvent.getSource().getParent().getBindingContextPath();
                path = path.split("/")[1];
                var allData = this.getView().byId("tableConfirmed").getModel("confirmationList").getData();
                var data = allData[path];
                
                var responseCancel = TransactionCaller.sync(
                    "MES/Integration/RFC/ZPP_016_FM_TEYIT_IPTAL_RFC/ZPP_016_FM_TEYIT_IPTAL_RFC_DNA_QM",
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
                this.getData();
            },

            // Yeni teyidi gönder
            sendQMConfirmation: function (oEvent) {
                var path = oEvent.getSource().getParent().getBindingContextPath();
                path = path.split("/")[1];
                var allData = this.getView().byId("tableConfirmed").getModel("confirmationList").getData();
                var data = allData[path];

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
                this.getData();
            },

            refreshStatus: function () { //interval aç kapa yapsın
                if(intervalState === true) {
                    this.getData();
                    intervalState = false;
                    this.getView().byId("idQMRSB").setText("Otomatik Güncellemeyi Aç");
                    this.getView().byId("idQMRSB").setType("Accept");
                } else {
                    this.getData();
                    intervalState = true;
                    this.getView().byId("idQMRSB").setText("Otomatik Güncellemeyi Kapat");
                    this.getView().byId("idQMRSB").setType("Reject");
                }
            },
            onExit() {
                jQuery.sap.clearIntervalCall(this.getDataInterval);
            },
        });
    }
);
