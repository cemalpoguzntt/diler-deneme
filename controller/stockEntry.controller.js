sap.ui.define(
    [
        "sap/m/MessageToast",
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/resource/ResourceModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "customActivity/scripts/transactionCaller",
        "sap/m/MessageBox"
    ],
    function (
        MessageToast,
        Controller,
        JSONModel,
        ResourceModel,
        Filter,
        FilterOperator,
        TransactionCaller,
        MessageBox
    ) {
        "use strict";
        var that;
        var focusInterval;
        var tableInterval;

        return Controller.extend("customActivity.controller.stockEntry", {

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                that = this;
                this.getView().byId("input0").setValue(null);
                focusInterval = setInterval(function () {
                    that.inputSetFocus();
                }, 100);
                tableInterval = setInterval(function () {
                    that.fetchTable();
                }, 5000);
                this.fetchTable();
                this.getOrderInfo();
            },
            getOrderInfo: function () {
                TransactionCaller.async(
                    "MES/Itelli/DNA/StockRFC/T_GET_ORDER_INFO", {},
                    "O_JSON",
                    this.getOrderInfoCB,
                    this,
                    "GET"
                );
                
            },
            getOrderInfoCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                }
                else {
                    iv_scope.getView().byId("Label1").setText(iv_data[0].OrderInfo.AUFNR);
                    iv_scope.getView().byId("Label2").setText(iv_data[0].OrderInfo.QUALITY);
                    iv_scope.getView().byId("Label3").setText(iv_data[0].OrderInfo.DIAMETER);
                }
            },

            onChangeInput: function (oEvent) {
                var barcode = this.getView().byId("input0").getValue();
                this.insertToTable(barcode);
                this.getView().byId("input0").setEnabled(false);
            },
            insertToTable: function (barcode) {
                this.getView().byId("input0").setValue(null);
                this.getView().byId("tableEtiket").setBusy(true);
                TransactionCaller.async(
                    "MES/Itelli/DNA/StockRFC/T_CREATE_STOCK", {
                    I_BARCODE: barcode
                },
                    "O_JSON",
                    this.onInsertToTableCB,
                    this,
                    "GET"
                );

            },
            onInsertToTableCB: function (iv_data, iv_scope) {
                iv_scope.getView().byId("tableEtiket").setBusy(false);
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                }
                else {
                    iv_scope.fetchTable();
                }
                
                iv_scope.getView().byId("input0").setEnabled(true);
            },
            fetchTable: function () {
                if(!(!!this.getView().byId("tableEtiket"))){
                    clearInterval(tableInterval);
                    return;
                }
                this.getView().byId("tableEtiket").setBusy(true);
                TransactionCaller.async(
                    "MES/Itelli/DNA/StockRFC/T_GET_OLD_TAG_STOCK", {},
                    "O_JSON",
                    this.onFetchTableCB,
                    this,
                    "GET"
                );
            },
            onFetchTableCB: function (iv_data, iv_scope) {
                iv_scope.getView().byId("tableEtiket").setBusy(false);
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var myModel = new sap.ui.model.json.JSONModel();

                if (Array.isArray(iv_data[0].Rowsets.Rowset.Row)) {
                    myModel.setData(iv_data[0]);
                } else {
                    var obj_iv_data = iv_data[0];
                    var dummyData = [];
                    dummyData.push(iv_data[0].Rowsets.Rowset.Row);
                    obj_iv_data.Rowsets.Rowset.Row = dummyData;
                    myModel.setData(obj_iv_data);
                }
                if(!(!!iv_scope.getView().byId("tableEtiket"))){
                    clearInterval(tableInterval);
                    return;
                }
                iv_scope.getView().byId("tableEtiket").setModel(myModel);
            },
            inputSetFocus: function () {
                if(!(!!this.getView().byId("input0"))){
                    clearInterval(focusInterval);
                    return;
                }
                this.getView().byId("input0").focus();
            }
        });
    }
);