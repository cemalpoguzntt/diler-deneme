sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "customActivity/scripts/custom",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "customActivity/scripts/customStyle",
        "sap/ui/model/FilterType",
        "customActivity/scripts/transactionCaller",
    ],
    function (
        Controller,
        JSONModel,
        MessageBox,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        customStyle,
        FilterType,
        TransactionCaller
    ) {
        var that;
        var interval;
        var descArr = ["Fırın Giriş", "Fırın İçi", "Fırın Çıkış", "Role Yolu", "Boş Tartım", "Dolu Tartım", "Hurda Tartım", "Devrilme", "Serme Kafa", "ID EŞLEŞMESİ"];
        var tableArr = ["ZMPM_SIGNAL_FIRIN_GIRIS", "ZMPM_SIGNAL_FIRIN_ICI", "ZMPM_SIGNAL_FIRIN_CIKIS", "ZMPM_SIGNAL_ROLE", "ZMPM_SIGNAL_BOS_TARTIM", "ZMPM_SIGNAL_DOLU_TARTIM", "ZMPM_SIGNAL_HURDA_TARTIM", "ZMPM_SIGNAL_BILLET_CONFIRM", "ZMPM_SIGNAL_LAYING_HEAD", "ZMPM_SIGNAL_ID_MATCH"]

        return Controller.extend("customActivity/controller/oeeSignalLogsFLM", {
            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                that = this;


                this.fillSelect();
                this.getView().byId("selectTables").setSelectedKey("ZMPM_SIGNAL_FIRIN_GIRIS");
                this.getLogs();

                interval = setInterval(function int() {
                    if (!!that.getView().byId("selectTables"))
                        that.getLogs();
                    else
                        clearInterval(interval);
                }, 5000);
            },
            getLogs: function () {
                var selectedTable = this.getView().byId("selectTables").getSelectedKey();
                this.getView().byId("tableLogs").setBusy(true);
                TransactionCaller.async(
                    "MES/UI/Filmasin/SignalLogs/getSignalLogsTrns",
                    {
                        I_TABLE: selectedTable
                    },
                    "O_JSON",
                    this.getLogsCB,
                    this,
                    "GET"
                );
            },
            getLogsCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    clearInterval(interval);
                    that.getView().byId("tableLogs").setBusy(false);
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var myModel = new sap.ui.model.json.JSONModel();
                if (Array.isArray(iv_data[0].Rowsets.Rowset.Row)) {
                    myModel.setData(iv_data[0]);
                } else if (!iv_data[0].Rowsets.Rowset.Row) {
                    myModel.setData(null);
                } else {
                    var obj_iv_data = iv_data[0];
                    var dummyData = [];
                    dummyData.push(iv_data[0].Rowsets.Rowset.Row);
                    obj_iv_data.Rowsets.Rowset.Row = dummyData;
                    myModel.setData(obj_iv_data);
                }
                if (!(!!iv_scope.getView().byId("selectTables"))) {
                    clearInterval(interval);
                    iv_scope.getView().byId("tableLogs").setBusy(false);
                    return;
                }
                iv_scope.getView().byId("tableLogs").setModel(null);
                var arr = [];
                if (myModel?.oData?.Rowsets?.Rowset?.Row?.length > 0) {
                    var row = myModel.oData.Rowsets.Rowset.Row[0];
                    iv_scope.changeVisibilityOfColumns(row);
                    /*
                    arr = Object.keys(row);
                    iv_scope.getView().byId("tableLogs").mAggregations.columns.forEach((column) => {
                        var currentColumnId = column.sId.split("--")[1];
                        if (arr.includes(currentColumnId))
                            iv_scope.getView().byId(currentColumnId).setVisible(true);
                        else
                            iv_scope.getView().byId(currentColumnId).setVisible(false);
                    });
                    */

                }
                else if (!!iv_data[0]?.Rowsets?.Rowset?.Columns?.Column.length > 0) {
                    var obj = {};
                    iv_data[0].Rowsets.Rowset.Columns.Column.forEach((item) => {
                        obj[item["@Description"]] = "";
                    });
                    iv_scope.changeVisibilityOfColumns(obj);
                    var arr = [];
                    arr.push(obj);
                    myModel.setData(arr);
                }

                iv_scope.getView().byId("tableLogs").setBusy(false);
                iv_scope.getView().byId("tableLogs").setModel(myModel);
                /*
                if (arr.length > 0) {
                    arr.forEach((columnId) => {
                        iv_scope.getView().byId(columnId).setVisible(true);
                    });
                }*/
            },
            changeVisibilityOfColumns: function (sampleObj) {
                var arr = Object.keys(sampleObj);
                this.getView().byId("tableLogs").mAggregations.columns.forEach((column) => {
                    var currentColumnId = column.sId.split("--")[1];
                    if (arr.includes(currentColumnId))
                        this.getView().byId(currentColumnId).setVisible(true);
                    else
                        this.getView().byId(currentColumnId).setVisible(false);
                });
            },
            dateFormatter: function (date) {
                return !!date ? new Date(date).toLocaleString() : null;
            },
            fillSelect: function () {
                var objArr = [];
                descArr.forEach((desc, index) => {
                    var obj = { TABLE: tableArr[index], DESC: desc };
                    objArr.push(obj);
                });
                var model = new sap.ui.model.json.JSONModel();
                model.setData(objArr);
                this.getView().byId("selectTables").setModel(model);
            },
            onLogTableChanged: function (oEvent) {
                this.getLogs();
            }

        });
    }
);