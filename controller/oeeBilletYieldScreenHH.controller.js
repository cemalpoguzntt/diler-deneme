sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "sap/m/MessageToast",
        "customActivity/scripts/custom",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterType",
        "sap/ui/core/util/Export",
        "sap/ui/core/util/ExportTypeCSV",
        "customActivity/scripts/customStyle"
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        MessageToast,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        Export,
        ExportTypeCSV,
        customScript
    ) {
        //"use strict";
        var that;
        this.screenObj;

        return Controller.extend("customActivity.controller.oeeBilletYieldScreenHH", {

            formatter: formatter,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.appData.intervalState = true;
                this.interfaces = this.appComponent.getODataInterface();
                this.refreshYieldList();
                this.screenObj = {};
                that = this;
            },

            callYieldList: function (p_this, p_data) {

                var oList = p_this.getView().byId("masterList");
                var selectedItem = oList.getSelectedItem();
                var lv_orderNo = p_this.getSelectedOrderNo();
                //var lv_orderNo = p_this.screenObj.orderNo;

                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                p_this.getView().setModel(oModel, "yieldList");

                if (p_this.findOrderNo(lv_orderNo)) {
                    oList.setSelectedItem(selectedItem);
                }

            },

            getSelectedOrderNo: function () {
                var lo_model = this.getView().getModel("yieldList");
                if (!lo_model) return null;

                var lo_mlist = this.getView().byId("masterList");
                if (!lo_mlist) return null;

                var rows = lo_model.getData();
                if (!rows) return null;

                var selectedItem = lo_mlist.getSelectedItem();
                if (!selectedItem) return null;

                var selectedRow = selectedItem.getBindingContextPath().split("/")[1];

                return rows[selectedRow].AUFNR;
            },

            findOrderNo: function (lv_orderNo) {
                var lo_model = this.getView().getModel("yieldList");
                if (!lo_model) return false;

                var rows = lo_model.getData();

                for (var i = 0; rows && i < rows.length; i++) {
                    if (rows[i].AUFNR == lv_orderNo)
                        return true;
                }
                return false;
            },

            getYieldList: function (oEvent) {
                var orderNoList = this.getView().byId("orderNoList").getSelectedKey();
                //this.appData.selectedAufnrIndex = this.getView().byId("masterList")._aSelectedPaths.toString().substring(1);
                //var werks = this.appData.plant;
                var nodeID = this.appData.node.nodeID
                var params = { "Param.1": nodeID, "Param.2": orderNoList };
                var tRunner = new TransactionRunner(
                    "MES/UI/BilletYieldScreenHH/getYieldListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callYieldList);
            },

            callOrderNoList: function (p_this, p_data) {
                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                p_this.getView().setModel(oModel, "orderNoList");
            },

            getOrderNoList: function (oEvent) {
                var nodeID = this.appData.node.nodeID
                var params = { "Param.1": nodeID };
                var tRunner = new TransactionRunner(
                    "MES/UI/BilletYieldScreenHH/getOrderNoListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callOrderNoList);
            },

            getMasterDetailData: function (oEvent) {
                //var selectedOrderNo = this.getView().byId("masterList").getSelectedItem().mProperties.title;
                var oData = this.getView().getModel("yieldList").oData;
                var sPath = this.getView().byId("masterList").getSelectedItem().oBindingContexts.yieldList.sPath;
                var selectedRow = sPath.split("/")[1];
                var selectedOrderNo = oData[selectedRow].AUFNR;
                //var selectedRow = sPath.split("/Row/")[1];
                //var selectedOrderNo = oData.Row[selectedRow].AUFNR;
                this.screenObj.orderNo = selectedOrderNo;
                this.screenObj.yieldRate = oData[selectedRow].YIELD_RATE;
                this.screenObj.matnr = oData[selectedRow].MATNR;
                this.getYieldData();
                this.getConsumptionItemsQry();
            },

            callYieldData: function (p_this, p_data) {
                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                p_this.getView().setModel(oModel, "yieldData");
                p_this.getView().byId("yieldRate").setText(p_this.screenObj.yieldRate);
            },

            getYieldData: function () {
                var params = { "Param.1": this.screenObj.orderNo };
                var tRunner = new TransactionRunner(
                    "MES/UI/BilletYieldScreenHH/getYieldDataQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callYieldData);
            },

            callConsumptionItems: function (p_this, p_data) {
                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                p_this.getView().setModel(oModel, "consumptionItems");
            },

            getConsumptionItemsQry: function () {
                var params = { "Param.1": this.screenObj.orderNo };
                var tRunner = new TransactionRunner(
                    "MES/UI/BilletYieldScreenHH/getConsumptionItemsQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callConsumptionItems);
            },

            refreshYieldList: function (oEvent) {
                this.getOrderNoList();
                this.getYieldList();
                if (this.screenObj) {
                    this.getYieldData();
                    this.getConsumptionItemsQry();
                }
            },


            sendConfirmationControl: function () {

                var params = {
                    "Param.1": this.screenObj.orderNo,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/BilletYieldScreenHH/getSendConfirmationControlQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                return oData[0].Row;
                //return oData[0].Row[0].SUCCESS;
            },

            onPressSaveYield: function (oEvent) {
                if (!this.screenObj.orderNo) {
                    MessageBox.error(
                        this.getView().getModel("i18n").getResourceBundle().getText("OEE_ERROR_SELECT_ORDER_NO")
                    );
                    return;
                }
                MessageBox.warning(
                    this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SAVE_ENTRY_DATA_CONFIRM"),
                    {
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction == "YES") {
                                this.saveYield();
                            } else {
                                return;
                            }
                        }.bind(this),

                    }
                );
            },

            callSaveYield: function (p_this, p_data) {
                MessageToast.show(
                    p_this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
                );
                //p_this.getConsumptionItemsQry();
                p_this.refreshYieldList();
            },

            saveYield: function () {
                if (!this.screenObj.orderNo) {
                    MessageBox.error(
                        this.getView().getModel("i18n").getResourceBundle().getText("OEE_ERROR_SELECT_ORDER_NO")
                    );
                    return;
                }
                var table = this.getView().byId("consumptionItemsTable");
                var oModel = table.oPropagatedProperties.oModels.consumptionItems;
                if (!oModel) {
                    MessageBox.error(
                        this.getView().getModel("i18n").getResourceBundle().getText("OEE_ERROR_SELECT_ORDER_NO_CONSUMPTION_ITEMS")
                    );
                    return;
                }
                var oData = oModel.oData;
                var tableData = JSON.stringify(oData);
                var plant = this.appData.plant;
                var nodeId = this.appData.node.nodeID;
                var workcenterid = this.appData.node.workcenterID;
                var client = this.appData.client;
                var user = this.appData.user.userID;
                // var runId = this.appData.selected.runID;
                //var releasedId = this.appData.selected.releasedID;
                var params = {
                    I_AUFNR: this.screenObj.orderNo,
                    I_PLANT: plant,
                    I_NODEID: nodeId,
                    I_WORKCENTERID: workcenterid,
                    I_CLIENT: client,
                    I_USER: user,
                    I_TABLE_DATA: tableData
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/BilletYieldScreenHH/Operations/saveYieldXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callSaveYield);
            },

            onPressSendYieldConfirmation: function (oEvent) {
                if (!this.screenObj.orderNo) {
                    MessageBox.error(
                        this.getView().getModel("i18n").getResourceBundle().getText("OEE_ERROR_SELECT_ORDER_NO")
                    );
                    return;
                }
                var sendConfirmationControl = this.sendConfirmationControl();
                if (sendConfirmationControl) {
                    if (sendConfirmationControl[0].SUCCESS == "S" || sendConfirmationControl[0].SUCCESS == "F") {
                        MessageBox.error(
                            this.getView().getModel("i18n").getResourceBundle().getText("OEE_ERROR_SEND_CONFIRM")
                        );
                        return;
                    }
                }
                MessageBox.warning(
                    this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_FLM_CONFIRM_ACCEPT"),
                    {
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction == "YES") {
                                this.saveYield();
                                this.sendYieldConfirmation();
                            } else {
                                this.getConsumptionItemsQry();
                                this.refreshYieldList();
                                return;
                            }
                        }.bind(this),

                    }
                );
            },

            callSendYieldConfirmation: function (p_this, p_data) {
                MessageToast.show(
                    p_this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
                );
                //p_this.getConsumptionItemsQry();
                p_this.refreshYieldList();
            },

            sendYieldConfirmation: function () {
                if (!this.screenObj.orderNo) {
                    MessageBox.error(
                        this.getView().getModel("i18n").getResourceBundle().getText("OEE_ERROR_SELECT_ORDER_NO")
                    );
                    return;
                }
                var plant = this.appData.plant;
                var nodeId = this.appData.node.nodeID;
                var params = {
                    I_AUFNR: this.screenObj.orderNo,
                    I_PLANT: plant,
                    I_NODEID: nodeId
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/BilletYieldScreenHH/Operations/sendYieldConfirmationXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callSendYieldConfirmation);
            },




        });
    }
);
