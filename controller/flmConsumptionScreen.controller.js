sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "customActivity/scripts/custom",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterType",
        "sap/ui/core/util/Export",
        "sap/ui/core/util/ExportTypeCSV",
        "customActivity/scripts/customStyle",
        "sap/m/Dialog",
        "sap/m/Label",
        "sap/m/MessageToast",
        "sap/m/Text",
        "sap/m/TextArea",
        "sap/m/Button",
        "sap/m/ButtonType",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
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
        Text,
        TextArea,
        Button,
        ButtonType,
        TransactionCaller,
        Fragment
    ) {
        //"use strict";
        var that;
        var interval;
        var state = false;
        var stateUnsuitable = false;
        var stateUnconfirmed = false;

        return Controller.extend("customActivity.controller.flmConsumptionScreen", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */

            formatter: formatter,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();

                that = this;
                //Filtrelemede bugünün tarihini seçer
                var today = new Date();
                setYest = (today.getDate()) + "." + (today.getMonth() + 1) + "." + today.getFullYear();
                setTom = (today.getDate()) + "." + (today.getMonth() + 1) + "." + today.getFullYear();
                setDate = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + (today.getDate());
                this.getView().byId("idDatePicker").setValue(setYest + " - " + setTom);
                this.getView().byId("DatePicker").setValue(setDate);
                this.getBilletYieldList();


                interval = setInterval(function getDataInterval() {
                    if (!!state) {

                        that.getBilletYieldData();

                    }
                    if (!!stateUnsuitable) {

                        that.getUnsuitableYieldData();

                    }
                    if (!!stateUnconfirmed) {

                        that.getUnconfirmedYieldData();

                    }

                }
                    , 4000);


            },



            getBilletYieldData: function (selectedOrderNo) {

                state = true;
                stateUnsuitable = false;               
                stateUnconfirmed = false;               
                              
                var selectedOrderNo = this.getView().byId("masterList").getSelectedItem().mProperties.title;



                var params = { "Param.1": selectedOrderNo };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/ConsumptionScreen/selectConsumptionDataQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletYieldData);
            },

            callBilletYieldData: function (p_this, p_data) {
                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                
                p_this.getView().setModel(oModel, "confirmBilletYield");
                p_this.colorizeTableData();
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

                TransactionCaller.async(
                    "MES/UI/Filmasin/ConsumptionScreen/T_Select_Consumption_List",
                    {
                        I_DATE1: dateValues[0],
                        I_DATE2: dateValues[1],

                    },
                    "O_JSON",
                    this.callBilletYieldList,
                    this,
                    "GET"
                );

            },

            callBilletYieldList: function (iv_data, iv_scope) {

                var myModel = new sap.ui.model.json.JSONModel();
                if (iv_data[1] == 'E') {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                if (!iv_data[0].Rowsets.Rowset.Row) {
                    myModel.setData(null)
                }
                else {
                    var modelArr = Array.isArray(iv_data[0].Rowsets.Rowset.Row) ? iv_data[0].Rowsets.Rowset.Row : new Array(iv_data[0].Rowsets.Rowset.Row);
                    var myModel = new sap.ui.model.json.JSONModel(modelArr);
                }


                iv_scope.getView().setModel(myModel, "confirmBilletYieldList");
                var selectedIndex = iv_scope.appData.selectedAufnrIndex;
                var oList = iv_scope.getView().byId("masterList");
                var oListItems = iv_scope.getView().byId("masterList").getItems();
                oList.setSelectedItem(oListItems[selectedIndex]);
            },

            onChangeHB: function (oEvent) {
                this.byId("tblBilletYield").setBusy(true);
                this.byId("tblBilletYield").setBusyIndicatorDelay(0);
                

                var selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split("/")[1];
                var tableModel = this.getView().getModel("confirmBilletYield").oData;

                var teyit_onay = tableModel[selectedRow].TEYIT_ONAY;

                if (teyit_onay === "CONFIRMED") {
                    MessageBox.error("Teyidi verilmiş kütüğün verilerini değiştiremezsiniz!");
                    this.byId("tblBilletYield").setBusy(false);
                    return;
                }

                var HB = oEvent.getSource().getValue();
                if (HB == '') {
                    this.byId("tblBilletYield").setBusy(false);
                    return;

                }
                var ktkId = tableModel[selectedRow].KTKID;
                var AUFNR = tableModel[selectedRow].AUFNR;



                TransactionCaller.async(
                    "MES/UI/Filmasin/ConsumptionScreen/T_Update_HB",
                    {
                        I_VALUE: HB / 1000,
                        I_KTKID: ktkId,

                    },
                    "O_JSON",
                    this.callChangeHB,
                    this,
                    "GET",
                    AUFNR
                );
            },

            callChangeHB: function (iv_data, iv_scope, AUFNR) {
                if (iv_data[1] == 'E') {
                    MessageBox.error(iv_data[0]);
                    iv_scope.byId("tblBilletYield").setBusy(false);
                    return;
                }
                if (!!state) {

                    iv_scope.getBilletYieldData(AUFNR);

                }
                if (!!stateUnsuitable) {
                    
                    iv_scope.getUnsuitableYieldData(AUFNR);

                }
                if (!!stateUnconfirmed) {
                    
                    iv_scope.getUnconfirmedYieldData(AUFNR);

                }
                iv_scope.byId("tblBilletYield").setBusy(false);
            },

            onChangeUBUK: function (oEvent) {
                this.byId("tblBilletYield").setBusy(true);
                this.byId("tblBilletYield").setBusyIndicatorDelay(0);
               

                var selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split("/")[1];
                var tableModel = this.getView().getModel("confirmBilletYield").oData;

                var teyit_onay = tableModel[selectedRow].TEYIT_ONAY;

                if (teyit_onay === "CONFIRMED") {
                    MessageBox.error("Teyidi verilmiş kütüğün verilerini değiştiremezsiniz!");
                    this.byId("tblBilletYield").setBusy(false);
                    return;
                }

                var UBUK = oEvent.getSource().getValue();
                if (UBUK == '') {
                    this.byId("tblBilletYield").setBusy(false);
                    return;
                }
                var ktkId = tableModel[selectedRow].KTKID;
                var AUFNR = tableModel[selectedRow].AUFNR;


                TransactionCaller.async(
                    "MES/UI/Filmasin/ConsumptionScreen/T_Update_UBUK",
                    {
                        I_VALUE: UBUK / 1000,
                        I_KTKID: ktkId,

                    },
                    "O_JSON",
                    this.callChangeUBUK,
                    this,
                    "GET",
                    AUFNR
                );

            },

            callChangeUBUK: function (iv_data, iv_scope, AUFNR) {
                if (iv_data[1] == 'E') {
                    MessageBox.error(iv_data[0]);
                    iv_scope.byId("tblBilletYield").setBusy(false);
                    return;
                }
                if (!!state) {

                    iv_scope.getBilletYieldData(AUFNR);

                }
                if (!!stateUnsuitable) {
                    
                    iv_scope.getUnsuitableYieldData(AUFNR);

                }
                if (!!stateUnconfirmed) {
                    
                    iv_scope.getUnconfirmedYieldData(AUFNR);

                }
                
                iv_scope.byId("tblBilletYield").setBusy(false);
            },

            handleChange: function (oEvent) {
                var oText = this.getView().byId("DatePicker"),
                    sValue = oEvent.getParameter("value");


                oText.setValue(sValue);

            },

            sendYieldConfirmation: function (oEvent) {

                this.byId("tblBilletYield").setBusy(true);
                this.byId("tblBilletYield").setBusyIndicatorDelay(0);
                var selectedRow = oEvent.oSource.getParent().getBindingContextPath().split("/")[1];
                var tableModel = this.getView().getModel("confirmBilletYield").oData;
                var selectedRowData = tableModel[selectedRow];

                var KTKID = selectedRowData.KTKID;
                var userid = this.appData.user.userID
                var date = this.getView().byId("DatePicker").getValue();
                var AUFNR = selectedRowData.AUFNR;

                if (selectedRowData.TEYIT_ONAY === "X") {
                    MessageBox.error(KTKID + ": Bu KTKID ile teyit onayı verilmiştir.");
                    this.byId("tblBilletYield").setBusy(false);
                    return;
                }

                if (!!((selectedRowData.EFFICIENCY >= 99.50) || (selectedRowData.EFFICIENCY <= 96.00))) {

                    var messageText = "Verim(%) 96.00 ile 99.50 arasında olmalıdır.";

                    var oTextArea = new Text("textBox", { text: messageText });
                    oTextArea.addStyleClass("tableText");

                    MessageBox.error(oTextArea)
                    this.byId("tblBilletYield").setBusy(false);
                    return;
                }



                if (selectedRowData.UBUK == "") {

                    MessageBox.error("UB+UK değeri boş bıraklımaz!")
                    this.byId("tblBilletYield").setBusy(false);
                    return;
                }
                if (selectedRowData.UBUK === "") {

                    MessageBox.error("UB+UK değeri boş bıraklımaz!")
                    this.byId("tblBilletYield").setBusy(false);
                    return;
                }
                if (selectedRowData.HB_TON === "") {

                    MessageBox.error("Hadde Bozuğu değeri boş bıraklımaz!")
                    this.byId("tblBilletYield").setBusy(false);
                    return;
                }

                TransactionCaller.async(
                    "MES/UI/Filmasin/ConsumptionScreen/SendConsumptionConfirm/T_sendConsConfirm",
                    {
                        I_KTKID: KTKID,
                        I_DATE: date,
                        I_USER: userid

                    },
                    "O_JSON",
                    this.sendYieldConfirmationCB,
                    this,
                    "GET",
                    AUFNR
                );

            },
            sendYieldConfirmationCB(iv_data, iv_scope, AUFNR) {
                if (iv_data[1] == 'E') {
                    MessageBox.error(iv_data[0]);
                    iv_scope.byId("tblBilletYield").setBusy(false);
                    return;
                }
                iv_scope.byId("tblBilletYield").setBusy(false);               
                if (!!state) {

                    iv_scope.getBilletYieldData(AUFNR);

                }
                if (!!stateUnsuitable) {
                    
                    iv_scope.getUnsuitableYieldData(AUFNR);

                }
                if (!!stateUnconfirmed) {
                    
                    iv_scope.getUnconfirmedYieldData(AUFNR);

                }

            },

            refreshData: function () {
                this.getBilletYieldData();


            },

            cancelYieldConfirmation: function (oEvent) {

                this.byId("tblBilletYield").setBusy(true);
                this.byId("tblBilletYield").setBusyIndicatorDelay(0);
                var selectedRow = oEvent.oSource.getParent().getBindingContextPath().split("/")[1];
                var tableModel = this.getView().getModel("confirmBilletYield").oData;
                var selectedRowData = tableModel[selectedRow];

                var KTKID = selectedRowData.KTKID;
                var userid = this.appData.user.userID
                var confno = selectedRowData.CONFNO;
                var confcounter = selectedRowData.COUNTER;
                var AUFNR = selectedRowData.AUFNR;
                var msgid = selectedRowData.MESSAGE_ID;


                TransactionCaller.async(
                    "MES/UI/Filmasin/ConsumptionScreen/ConfirmCancel/confirmCancelConsumption",
                    {
                        I_KTKID: KTKID,
                        I_USER: userid,
                        I_CONF_COUNTER: confcounter,
                        I_CONF_NUMBER: confno,
                        I_MESSAGE_ID: msgid,

                    },
                    "O_JSON",
                    this.cancelYieldConfirmationCB,
                    this,
                    "GET",
                    AUFNR
                );

            },

            cancelYieldConfirmationCB(iv_data, iv_scope, AUFNR) {
                if (iv_data[1] == 'E') {
                    MessageBox.error(iv_data[0]);
                    iv_scope.byId("tblBilletYield").setBusy(false);
                    return;
                }
                iv_scope.byId("tblBilletYield").setBusy(false);                
                if (!!state) {

                    iv_scope.getBilletYieldData(AUFNR);

                }
                if (!!stateUnsuitable) {
                    
                    iv_scope.getUnsuitableYieldData(AUFNR);

                }
                if (!!stateUnconfirmed) {
                    
                    iv_scope.getUnconfirmedYieldData(AUFNR);

                }

            },


            retryYieldConfirmation: function (oEvent) {

                this.byId("tblBilletYield").setBusy(true);
                this.byId("tblBilletYield").setBusyIndicatorDelay(0);
                var selectedRow = oEvent.oSource.getParent().getBindingContextPath().split("/")[1];
                var tableModel = this.getView().getModel("confirmBilletYield").oData;
                var selectedRowData = tableModel[selectedRow];

                var AUFNR = selectedRowData.AUFNR;
                var msgid = selectedRowData.MESSAGE_ID;


                TransactionCaller.async(
                    "MES/UI/Filmasin/ConsumptionScreen/RetryConfirm/T_Retry_Confirm",
                    {
                        I_MESSAGE_ID: msgid,

                    },
                    "O_JSON",
                    this.retryYieldConfirmationCB,
                    this,
                    "GET",
                    AUFNR
                );


            },

            retryYieldConfirmationCB(iv_data, iv_scope, AUFNR) {
                if (iv_data[1] == 'E') {
                    MessageBox.error(iv_data[0]);
                    iv_scope.byId("tblBilletYield").setBusy(false);
                    return;
                }
                iv_scope.byId("tblBilletYield").setBusy(false);
                
                if (!!state) {

                    iv_scope.getBilletYieldData(AUFNR);

                }
                if (!!stateUnsuitable) {
                    
                    iv_scope.getUnsuitableYieldData(AUFNR);

                }
                if (!!stateUnconfirmed) {
                    
                    iv_scope.getUnconfirmedYieldData(AUFNR);

                }

            },

            getUnsuitableYieldData: function () {
                state = false;
                stateUnsuitable = true;
                stateUnconfirmed = false;
                var selectedOrderNo = this.getView().byId("masterList").getSelectedItem().mProperties.title;

                var params = { "Param.1": selectedOrderNo };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/ConsumptionScreen/selectConsumptionDataFilterQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callgetUnsuitableYieldData);
            },
            

            callgetUnsuitableYieldData: function (p_this, p_data) {
                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                
                p_this.getView().setModel(oModel, "confirmBilletYield");               
            },

            getUnconfirmedYieldData: function () {
                state = false;
                stateUnsuitable = false;
                stateUnconfirmed = true;
                var selectedOrderNo = this.getView().byId("masterList").getSelectedItem().mProperties.title;

                var params = { "Param.1": selectedOrderNo };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/ConsumptionScreen/selectConsumptionDataUnconfirmedQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callgetUnconfirmedYieldData);
            },
            

            callgetUnconfirmedYieldData: function (p_this, p_data) {
                var tableData = p_data;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                
                p_this.getView().setModel(oModel, "confirmBilletYield");               
            },




            
        });
    }
);
