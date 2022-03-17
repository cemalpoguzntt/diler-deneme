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
        "sap/ui/model/FilterType",
        "sap/ui/core/util/Export",
        "sap/ui/core/util/ExportTypeCSV",
        "customActivity/scripts/customStyle"
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        Export,
        ExportTypeCSV,
        customScript,
        Dialog,
        Label,
        MessageToast,
        TextArea,
        Button,
        ButtonType
    ) {
        //"use strict";
        var that;

        return Controller.extend("customActivity.controller.oeeBilletYieldScreen", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */

            formatter: formatter,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.appData.intervalState = true;
                this.interfaces = this.appComponent.getODataInterface();
                //Filtrelemede bugünün tarihini seçer
                var today = new Date();
                setYest = (today.getDate()) + "." + (today.getMonth() + 1) + "." + today.getFullYear();
                setTom = (today.getDate()) + "." + (today.getMonth() + 1) + "." + today.getFullYear();
                this.getView().byId("idDatePicker").setValue(setYest + " - " + setTom);
                this.getBilletYieldList();
                // this.modelServices();
                //this.getKTKIDFilter();
                //this.getOrderFilter();

            },

            onPressCalculateYield: function (selectedRow) {
                // var selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split("/")[1];
                var tableModel = this.getView().getModel("confirmBilletYield").oData;
                var oTable = this.getView().byId("tblBilletYield");

                var ktkId = tableModel[selectedRow].KTKID;
                //var teoWeight = tableModel[selectedRow].TEO_WEIGHT;
                //var weight = tableModel[selectedRow].WEIGHT;
                //var HB = tableModel[selectedRow].HB;
                //var UBUK = tableModel[selectedRow].UBUK;

                var nodeId = this.appData.node.nodeID;
                var client = this.appData.client;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;

                var params = {
                    I_KTKID: ktkId,
                  //    I_TEO_WEIGHT: teoWeight,
                  //  I_WEIGHT: weight,
                  //  I_HB: HB,
                   //  I_UBUK: UBUK
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Yield/updateYieldXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callYieldValue);

            },

            callYieldValue: function (p_this, p_data) {
                p_this.getBilletYieldList();
                var selectedIndex = p_this.appData.selectedAufnrIndex;
                var oList = p_this.getView().byId("masterList");
                var oListItems = p_this.getView().byId("masterList").getItems();
                oList.setSelectedItem(oListItems[selectedIndex]);
                p_this.getBilletYieldData();

                //sap.m.MessageToast.show("");
            },

            onChangeTeoWeight: function (oEvent) {
                var selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split("/")[1];
                this.appData.row = selectedRow;
                var tableModel = this.getView().getModel("confirmBilletYield").oData;
                var oTable = this.getView().byId("tblBilletYield");

                var ktkId = tableModel[selectedRow].KTKID;
                var teoWeight = oEvent.getSource().getValue();
                if (teoWeight == "") {
                    teoWeight = 0;
                }

                var nodeId = this.appData.node.nodeID;
                var client = this.appData.client;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;

                var params = {
                    "Param.1": teoWeight,
                    "Param.2": ktkId
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Yield/updateTeoricWeightQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callChangeTeoWeight);
            },

            callChangeTeoWeight: function (p_this, p_data) {
                //sap.m.MessageToast.show("");
                var selectedRow = p_this.appData.row;
                p_this.onPressCalculateYield(selectedRow);
            },

            onChangeHB: function (oEvent) {
                var selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split("/")[1];
               this.appData.row = selectedRow;
                var tableModel = this.getView().getModel("confirmBilletYield").oData;
                var oTable = this.getView().byId("tblBilletYield");

                var ktkId = tableModel[selectedRow].KTKID;
                var HB = oEvent.getSource().getValue();
                var UBUK = tableModel[selectedRow].UBUK;
                var input = HB;

                var user = this.appData.user.userID;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;

                var params = {
                    I_UBUK: UBUK,
                    I_HB: HB,
                    I_KTKID: ktkId,
                    I_USER: user
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Yield/insertScrapForYieldXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callChangeHB);
            },

            callChangeHB: function (p_this, p_data) {
                //sap.m.MessageToast.show("");
                 var selectedRow = p_this.appData.row;
                p_this.onPressCalculateYield(selectedRow);
            },

            onChangeUBUK: function (oEvent) {
                var selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split("/")[1];
                this.appData.row = selectedRow;
                var tableModel = this.getView().getModel("confirmBilletYield").oData;
                var oTable = this.getView().byId("tblBilletYield");

                var ktkId = tableModel[selectedRow].KTKID;
                var HB = tableModel[selectedRow].HB;
                var UBUK = oEvent.getSource().getValue();
                var input = UBUK;

                var user = this.appData.user.userID;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;

                var params = {
                    I_HB: HB,
                    I_UBUK: UBUK,
                    I_KTKID: ktkId,
                    I_USER: user
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Yield/insertScrapForYieldXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callChangeUBUK);
            },

            callChangeUBUK: function (p_this, p_data) {
                //sap.m.MessageToast.show("");
                var selectedRow = p_this.appData.row;
                p_this.onPressCalculateYield(selectedRow);
            },

            getDateTime: function (oEvent) {
                var dateS = oEvent.getSource().getValue();
                var dateValues = dateS.split(" - ");
                console.log(dateValues[0]);
                console.log(dateValues[1]);
            },

            colorizeTableData: function () {
                var oTable = this.getView().byId("tblBilletYield");
                var tableItems = oTable.mAggregations.items;
                var modelData = this.getView().getModel("confirmBilletYield").getData();
                for (var i = 0; i < tableItems.length; i++) {
                    tableItems[i].mAggregations.cells[10].removeStyleClass("fontError");
                    tableItems[i].mAggregations.cells[10].removeStyleClass("fontSuccess");
                    tableItems[i].mAggregations.cells[10].removeStyleClass("fontWarning");
                    tableItems[i].mAggregations.cells[10].addStyleClass(modelData[i].YIELD_TYPE);
                    tableItems[i].mAggregations.cells[11].removeStyleClass("fontError");
                    tableItems[i].mAggregations.cells[11].removeStyleClass("fontSuccess");
                    tableItems[i].mAggregations.cells[11].removeStyleClass("fontWarning");
                    tableItems[i].mAggregations.cells[11].addStyleClass(modelData[i].M_YIELD_TYPE);
                }
            },

            callBilletYieldData: function (p_this, p_data) {
                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                p_this.getView().setModel(oModel, "confirmBilletYield");
                p_this.colorizeTableData();
            },
            getBilletYieldData: function (oEvent) {
                var inappropriateData = "F";
                var werks = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var workcenterid = this.appData.node.workcenterID;
                var dateS = this.getView().byId("idDatePicker").getValue();
                var pickerSecondDate = new Date(this.getView().byId("idDatePicker").getSecondDateValue());
                var tomorrowDay = new Date(pickerSecondDate);
                tomorrowDay.setDate(tomorrowDay.getDate() + 1);
                var secondaryDate = (tomorrowDay.getDate()) + "." + (tomorrowDay.getMonth() + 1) + "." + tomorrowDay.getFullYear();
                var dateValues = dateS.split(" - ");
                var selectedOrderNo = this.getView().byId("masterList").getSelectedItem().mProperties.title;
                var params = { "Param.1": dateValues[0], "Param.2": secondaryDate, "Param.3": selectedOrderNo, "Param.4": inappropriateData };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Yield/getYieldDataQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletYieldData);
            },

            getInappropriateYieldData: function (oEvent) {
                var oView = this.getView();
                var oModel = this.getView().getModel("confirmBilletYield");
                var aFilter1 = new sap.ui.model.Filter("YIELD", sap.ui.model.FilterOperator.LT, 96.5);
                var aFilter2 = new sap.ui.model.Filter("YIELD", sap.ui.model.FilterOperator.GT, 99.5);
                var combineFilters = new sap.ui.model.Filter({
                    filters: [aFilter1, aFilter2],
                    and: false
                });
                oView.byId("tblBilletYield").getBinding("items").filter(combineFilters);
                var oTable = this.getView().byId("tblBilletYield");
                var tableItems = oTable.mAggregations.items;
                var modelData = this.getView().getModel("confirmBilletYield").getData();
                var tableItemRow;
                for (var i = 0; i < tableItems.length; i++) {
                    tableItems[i].mAggregations.cells[10].removeStyleClass("fontError");
                    tableItems[i].mAggregations.cells[10].removeStyleClass("fontSuccess");
                    tableItems[i].mAggregations.cells[10].removeStyleClass("fontWarning");
                    tableItemRow = oTable.getItems()[i].getCells()[10].mProperties.text;
                    if (tableItemRow > 99.5 || tableItemRow < 96.5)
                        tableItems[i].mAggregations.cells[10].addStyleClass("fontError");
                    else if (tableItemRow <= 99.5 && tableItemRow >= 96.5)
                        tableItems[i].mAggregations.cells[10].addStyleClass("fontSuccess");
                    else
                        tableItems[i].mAggregations.cells[10].addStyleClass("fontWarning");
                }
                 for (var i = 0; i < tableItems.length; i++) {
                    tableItems[i].mAggregations.cells[11].removeStyleClass("fontError");
                    tableItems[i].mAggregations.cells[11].removeStyleClass("fontSuccess");
                    tableItems[i].mAggregations.cells[11].removeStyleClass("fontWarning");
                    tableItemRow = oTable.getItems()[i].getCells()[11].mProperties.text;
                    if (tableItemRow > 99.5 || tableItemRow < 96.5)
                        tableItems[i].mAggregations.cells[11].addStyleClass("fontError");
                    else if (tableItemRow <= 99.5 && tableItemRow >= 96.5)
                        tableItems[i].mAggregations.cells[11].addStyleClass("fontSuccess");
                    else
                        tableItems[i].mAggregations.cells[11].addStyleClass("fontWarning");
                }


            },

            callBilletYieldList: function (p_this, p_data) {
                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                p_this.getView().setModel(oModel, "confirmBilletYieldList");
                var selectedIndex = p_this.appData.selectedAufnrIndex;
                var oList = p_this.getView().byId("masterList");
                var oListItems = p_this.getView().byId("masterList").getItems();
                oList.setSelectedItem(oListItems[selectedIndex]);
            },

            getBilletYieldList: function (oEvent) {
                this.appData.selectedAufnrIndex = this.getView().byId("masterList")._aSelectedPaths.toString().substring(1);
                var werks = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var workcenterid = this.appData.node.workcenterID;
                var dateS = this.getView().byId("idDatePicker").getValue();
                //    var orderParameter = this.getView().byId("searchFieldOrder").getValue();
                var orderParameter = "";
                var pickerSecondDate = new Date(this.getView().byId("idDatePicker").getSecondDateValue())
                var tomorrowDay = new Date(pickerSecondDate);
                tomorrowDay.setDate(tomorrowDay.getDate() + 1);
                var secondaryDate = (tomorrowDay.getDate()) + "." + (tomorrowDay.getMonth() + 1) + "." + tomorrowDay.getFullYear();
                var dateValues = dateS.split(" - ");
                if (!orderParameter) orderParameter = "";
                var params = { "Param.1": dateValues[0], "Param.2": secondaryDate, "Param.3": werks };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Yield/getYieldListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletYieldList);
            },

            handleCancel: function () {
                this.appData.oDialog.destroy();
                this.appData.intervalState = false;
                this.changeIntervalState();

            },
                  //Verim Teyidi  gondermek icin

  sendYieldConfirmation: function (oEvent) {
                   var type =oEvent.getSource().mProperties.type;
                    var selectedRow = oEvent
                    .getSource()
                    .oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split(
                        "/"
                    )[1];
if (type == "Accept"){
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_ALERT_FLM_CONFIRM_ACCEPT"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.yieldConfirmation(selectedRow);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
}
else if(type=="Reject"){
    sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_ALERT_FLM_CONFIRM_ACCEPT"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.retryYieldConfirmation(selectedRow);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
}
            },

retryYieldConfirmation: function (selectedRow) {
                var tableModel = this.getView().getModel("confirmBilletYield")
                    .oData;
                var oTable = this.getView().byId("tblBilletYield");

                var ID = tableModel[selectedRow].ID;

                var params = {
                    I_ID :ID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList/retryQueueConfirmXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callRetryConfirmation);
            },

            callRetryConfirmation: function (p_this, p_data) {
                sap.m.MessageToast.show("Verim Teyidi Gönderildi");
            },




  yieldConfirmation: function (selectedRow) {
                var tableModel = this.getView().getModel("confirmBilletYield")
                    .oData;
                var oTable = this.getView().byId("tblBilletYield");

                var ktkId = tableModel[selectedRow].KTKID;
                var teoWeight = tableModel[selectedRow].TEO_WEIGHT;
                var aufnr =  tableModel[selectedRow].AUFNR;
                var nodeId = this.appData.node.nodeID;
                var client = this.appData.client;
                var user = this.appData.user.userID;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;

                var params = {
                    I_AUFNR: aufnr,
                    I_USER: user,
                    I_WORKCENTER: workcenterid,
                    I_PLANT: plant,
                    I_CLIENT: client,
                    I_NODEID: nodeId,
                    I_KTKID:ktkId,
                    I_TEO_QUANTITY: teoWeight
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Yield/YieldConfirmation/insertYieldConfirmationXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callYieldConfirmation);
            },

            callYieldConfirmation: function (p_this, p_data) {
                sap.m.MessageToast.show("Verim Teyidi Gönderildi");
            },


     cancelYieldConfirmation: function (oEvent) {
                    var selectedRow = oEvent
                    .getSource()
                    .oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split(
                        "/"
                    )[1];
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_ALERT_FLM_CONFIRM_CANCEL"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.cancelConfirmation(selectedRow);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },

  cancelConfirmation: function (selectedRow) {
                var tableModel = this.getView().getModel("confirmBilletYield")
                    .oData;
                var oTable = this.getView().byId("tblBilletYield");

                var ktkId = tableModel[selectedRow].KTKID;
                var conf_number = tableModel[selectedRow].CONF_NUMBER;
                var conf_counter = tableModel[selectedRow].CONF_COUNTER;
                var entryId = tableModel[selectedRow].ENTRY_ID;
                var aufnr = tableModel[selectedRow].AUFNR;
                var matnr = tableModel[selectedRow].MATNR;

                var nodeId = this.appData.node.nodeID;
                var client = this.appData.client;
                var user = this.appData.user.userID;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;

                   var params = {
                    I_CONF_NUMBER: conf_number,
                    I_CONF_COUNTER: conf_counter,
                    I_ENTRYID: entryId,
                    I_AUFNR : aufnr,
                    I_MATNR: matnr,
                    I_KTKID: ktkId
                  };
                    var tRunner = new TransactionRunner(
                   "MES/UI/Filmasin/ConfirmCancel/confirmCancelXquery",
                    params
                  );

                tRunner.ExecuteQueryAsync(this, this.callCancelYield);
            },

            callCancelYield: function (p_this, p_data) {
                sap.m.MessageToast.show("Teyit İptal İsteği Gönderildi");
            },


/*

            onConfirmBilletYield: function (oEvent) {
                var selectedOrderNo = this.getView().byId("masterList").getSelectedItem().mProperties.title;
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_LABEL_FLM_CONFIRM_ACCEPT"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.billetConfirmation(selectedOrderNo);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },

            billetConfirmation: function (selectedOrderNo) {
                var tableModel = this.getView().getModel("confirmBilletYield")
                    .oData;
                var oTable = this.getView().byId("tblBilletYield");


                var aufnr = selectedOrderNo;

                // var runId = this.appData.selected.runID;
                var nodeId = this.appData.node.nodeID;
                var client = this.appData.client;
                var user = this.appData.user.userID;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                //var releasedId = this.appData.selected.releasedID;
                var params = {
                    I_AUFNR: aufnr,
                    I_USER: user,
                    I_WORKCENTER: workcenterid,
                    I_PLANT: plant,
                    I_CLIENT: client,
                    I_NODEID: nodeId
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Yield/YieldConfirmation/insertYieldConfirmationXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletConfirmation);
            },

            callBilletConfirmation: function (p_this, p_data) {
                sap.m.MessageToast.show("Verim Teyidi Gönderildi");
            },

*/

            refreshData: function (oEvent) {
                this.getBilletYieldData();
            },

            onExit: function () {
                this.appComponent
                    .getEventBus()
                    .unsubscribe(
                        this.appComponent.getId(),
                        "orderChanged",
                        this.refreshReported,
                        this
                    );
                if (this.intervalHandle) clearInterval(this.intervalHandle);
            },
        });
    }
);
