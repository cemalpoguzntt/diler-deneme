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
        return Controller.extend("customActivity.controller.naturalGasDNA", {
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
                    "MES/Itelli/DNA/naturalGas/getNaturalGasDataQry",
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
                this.getView().byId("tableDataList").setModel(oModel, "naturalGasDataList");
            },
            
            // ERPye tekrar gönder
            retrySendERP: function (oEvent) {
                
                var path = oEvent.getSource().getParent().getBindingContextPath();
                path = path.split("/")[1];
                var allData = this.getView().byId("tableDataList").getModel("naturalGasDataList").getData();
                var data = allData[path];

                if (!data.ID) {
                    MessageBox.error("Veride problem var. Kontrol edilmeli");
                    return;
                }
                var response = TransactionCaller.sync(
                    "MES/Integration/DNA DGAZ/sendValuesToERPTrns",
                    {
                        I_ID: data.ID,
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                } else {
                    MessageBox.information("Sayaç verisi ERP'ye gönderildi");
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
