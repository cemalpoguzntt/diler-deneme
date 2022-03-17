sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "customActivity/scripts/custom",
        "customActivity/scripts/customStyle",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterType",
        "sap/m/Dialog",
        "sap/m/Label",
        "sap/m/Button",
        "sap/m/ButtonType",
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        customScripts,
        customStyle,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        Dialog,
        Label,
        Button,
        ButtonType
    ) {
        //"use strict";
        var that;

        return Controller.extend("customActivity.controller.oeeBilletTagList", {
            formatter: formatter,

            onInit: function () {
                that = this;
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.appData.intervalState = true;
                this.interfaces = this.appComponent.getODataInterface();

                //Filtrelemede bugünün tarihini seçer
                var today = new Date();
                setYest =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                setTom =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                this.getView()
                    .byId("idDatePicker")
                    .setValue(setYest + " - " + setTom);
                this.getCurrentLabelQuan();
                this.getBilletTagList();
                this.onSelectRejectType();
                this.getRobotLabel();
                this.getBilletOrderChar();
                this.getBilletConfirmChar();
                this.getBilletRejectType();
                this.getGlobalConfig();
                this.modelServices();
                this.getShortPiece();
                this.getProducedQuantity();
                this.getProducedQuantityToday();
                this.getConfirmTolerance();
                this.controlAutoConfirm();


            },


            onChangeLabelQuan: function () {
                var labelQuan = this.getView().byId("setLabelQuan").getValue();
                var workcenter = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                var params = {
                    I_QUAN: labelQuan,
                    I_WORKCENTER: workcenter,
                    I_PLANT: plant
                };
                var tRunner = new TransactionRunner(
                    "MES/Integration/Label/DHH/updateLabelQuanXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callLabelQuan);
            },

            callLabelQuan: function () {
            },



            getCurrentLabelQuan: function (oEvent) {
                var workcenter = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                var params = {
                    I_WORKCENTER: workcenter,
                    I_PLANT: plant
                };
                var tRunner = new TransactionRunner(
                    "MES/Integration/Label/DHH/getLabelQuanXqry", params
                );
                tRunner.ExecuteQueryAsync(this, this.callCurrentLabelQuan);
            },
            callCurrentLabelQuan: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                var labelQuan = p_data.Rowsets?.Rowset[0]?.Row[0]?.LABEL_QUAN;
                p_this.getView().byId("setLabelQuan").setValue(labelQuan);
            },



            getRobotLabel: function (oEvent) {
            
                var plant = this.appData.plant;
                if(plant == "3001") {
                    return;
                }
                var workcenterid = this.appData.node.workcenterID;
                var params = {
                    "I_PLANT": plant,
                    "I_WORKCENTER": workcenterid
                }
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/getRobotLabelStatusXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callRobotLabel);
            },

            callRobotLabel: function (p_this, p_data) {
                var oData = p_data.Rowsets.Rowset[0].Row[0];
                var arka_etiket = oData.ARKA_ETIKET;
                p_this.appData.arka = arka_etiket;
                var on_etiket = oData.ON_ETIKET;
                p_this.appData.on = on_etiket;
            },



            editGrillQuan: function (oEvent) {
                var oView = this.getView();
                var oDialog = oView.byId("editGrillQuan");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.editGrillQuan",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                this.appData.oDialog = oDialog;
                oDialog.open();
            },

            confirmGrillQuan: function (oEvent) {
                var value = this.getView().byId("deleteValue").mProperties.value;
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var params = {
                    I_DELETED_CNT: value,
                    I_WERKS: werks,
                    I_WORKCENTER: workcenterid
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/editGrillQuanXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callGrillQuan);
            },

            callGrillQuan: function (p_this, p_data) {
                p_this.handleCancel();
            },


            addRowColor: function () {
                var status;
                var items = this.getView().byId("tblBilletLabelMaster").getItems();
                for (i = 0; i < items.length; i++) {
                    items[i].removeStyleClass("SAPMA");
                    items[i].removeStyleClass("STNDRT");
                    items[i].removeStyleClass("STD_DISI");
                    status = this.getView().getModel("billetTagListModel").oData[i]
                        .CONFIRM_TYPE;
                    items[i].addStyleClass(status);
                }
            },



            updateAutoConfirm: function (oEvent) {
                var buttonType = this.getView().byId("autoConfirm").getType();
                // var buttonType = oEvent.getSource().getType();
                var plant = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                if (this.getView().byId("STD").getSelected() == false) {
                    sap.m.MessageBox.warning("Sapma veya Standart dışı seçili iken otomatik teyit aktif edilemez");
                    return;
                }

                if (buttonType == "Reject") {
                    var value = 1;
                    this.getView().byId("autoConfirm").setType("Accept");
                } else if (buttonType == "Accept") {
                    var value = 0;
                    this.getView().byId("autoConfirm").setType("Reject");
                }
                var params = {
                    I_PLANT: plant,
                    I_WORKCENTER: workcenterid,
                    I_VALUE: value
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/AutoConfirmButton/updateAutoConfirmXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callAutoConfirm);
            },

            callAutoConfirm: function (p_this, p_data) {
            },
            controlAutoConfirm: function (oEvent) {
                var plant = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var params = {
                    I_PLANT: plant,
                    I_WORKCENTER: workcenterid
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/AutoConfirmButton/controlAutoConfirmXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callControlAutoConfirm);
            },

            callControlAutoConfirm: function (p_this, p_data) {

                var oData = p_data.Rowsets.Rowset[0].Row;

                if (oData[0]?.VALUE == "1") {
                    p_this.getView().byId("autoConfirm").setType("Accept");
                } else {
                    p_this.getView().byId("autoConfirm").setType("Reject");
                }
            },

            callGetAlert: function (p_this, p_data) {
                var data = p_data.Rowsets.Rowset[0].Row;
                if (data != undefined) {
                    var alertMessage = p_data.Rowsets.Rowset[0].Row[0].LONGTEXT;
                    var alertID = p_data.Rowsets.Rowset[0].Row[0].ID;
                    sap.m.MessageBox.warning(
                        p_this.appComponent.oBundle.getText(alertMessage),
                        {
                            actions: [
                                p_this.appComponent.oBundle.getText("TAMAM"),

                            ],
                            onClose: function (oAction) {

                                if (oAction == "TAMAM") {
                                    p_this.appData.intervalState = true;
                                    p_this.updateAlertStatus(alertID);
                                } else {
                                    return;
                                }
                            }.bind(p_this),
                        }
                    );
                } else {
                    p_this.appData.intervalState = true;
                }
            },

            getAlert: function (oEvent) {
                var plant = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var shortText = plant + "" + "BAG_ALERT" + workcenterid;
                var params = {
                    "Param.1": shortText
                }
                var tRunner = new TransactionRunner(
                    "MES/UI/AlertViewer/getNewAlertQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callGetAlert);
                this.appData.intervalState = false;
            },


            updateAlertStatus: function (alertID) {
                var params = {
                    I_ALERTID: alertID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/AlertViewer/updateAlertStatusXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdateAlert);
            },

            callUpdateAlert: function (p_this, p_data) {
                p_this.appData.intervalState = true;

            },



            callConfirmTolerance: function (p_this, p_data) {
                var tableData = p_data.Rowsets.Rowset[0].Row;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData);
                p_this.getView().setModel(oModel, "ConfirmTolerance");
            },

            getConfirmTolerance: function () {
                var aufnr = this.appData.selected.order.orderNo
                var params = {
                    "Param.1": aufnr
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Confirmation/getConfirmToleranceQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callConfirmTolerance);
            },



            changeIntervalState: function (oEvent) {
                this.getProducedQuantityToday();
                oButton = this.getView().byId("chkIntervalState");
                if (this.appData.intervalState == true) {
                    this.appData.intervalState = false;
                    oButton.setType("Reject");
                } else {
                    this.appData.intervalState = true;
                    this.getView().byId("chkIntervalState").setType("Accept");
                }
            },

            billetItemSelected: function (oEvent) {
                var stat =
                    this.getView().byId("tblBilletLabelMaster").getSelectedItems()
                        .length > 0
                        ? true
                        : false;
                if (stat > 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
                } else if (stat == 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
                } else {
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                }
            },
            getBilletTagListFailed: function () {
                this.appData.intervalState = true;
                this.changeIntervalState();
                var werks = this.appData.plant;
                var workCenterId = this.appData.node.workcenterID;
                var dateS = this.getView().byId("idDatePicker").getValue();
                var pickerSecondDate = new Date(
                    this.getView().byId("idDatePicker").getSecondDateValue()
                );
                var tomorrowDay = new Date(pickerSecondDate);
                tomorrowDay.setDate(tomorrowDay.getDate() + 1);
                var secondaryDate =
                    tomorrowDay.getDate() +
                    "." +
                    (tomorrowDay.getMonth() + 1) +
                    "." +
                    tomorrowDay.getFullYear();
                var dateValues = dateS.split(" - ");
                var params = {
                    "Param.1": werks,
                    "Param.2": workCenterId,
                    "Param.3": this.appData.selected.order.orderNo,
                    "Param.4": dateValues[0],
                    "Param.5": secondaryDate,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/getBilletTagListFailedQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletTagList);
            },
            getBilletTagList: function () {
                this.appData.intervalState = false;
                this.changeIntervalState();
                var werks = this.appData.plant;
                var workCenterId = this.appData.node.workcenterID;
                var dateS = this.getView().byId("idDatePicker").getValue();
                var pickerSecondDate = new Date(
                    this.getView().byId("idDatePicker").getSecondDateValue()
                );
                var tomorrowDay = new Date(pickerSecondDate);
                tomorrowDay.setDate(tomorrowDay.getDate() + 1);
                var secondaryDate =
                    tomorrowDay.getDate() +
                    "." +
                    (tomorrowDay.getMonth() + 1) +
                    "." +
                    tomorrowDay.getFullYear();
                var dateValues = dateS.split(" - ");
                var params = {
                    "Param.1": werks,
                    "Param.2": workCenterId,
                    "Param.3": this.appData.selected.order.orderNo,
                    "Param.4": dateValues[0],
                    "Param.5": secondaryDate,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/getBilletTagListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletTagList);
            },

            callBilletTagList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(2000);
                var tableData = p_data.Rowsets.Rowset[0];
                var rows = p_data.Rowsets.Rowset[0].Row;
                var newTableData = [];
                var boolean;
                if (!rows) {
                    oModel.setData(newTableData);
                    p_this.getView().setModel(oModel, "billetTagListModel");
                    return;
                }
                for (var i = 0; i < rows.length; i++) {
                    boolean = true;
                    for (var j = 0; j < newTableData.length; j++) {
                        if (rows[i].PACKAGE_ID == newTableData[j].PACKAGE_ID)
                            boolean = false;
                    }
                    if (boolean) newTableData.push(rows[i]);
                }
                for (i = 0; i < rows.length; i++) {
                    for (j = 0; j < newTableData.length; j++) {
                        newTableData[j][rows[i].CHARC] = rows[i].CHARC_VALUE;
                    }
                }


                oModel.setData(newTableData);
                p_this.getView().setModel(oModel, "billetTagListModel");
                p_this.addRowColor();
                p_this.getRobotLabel();
                p_this.kantarAlert();
            },

            onPressPrintManual: function () {
                var selectedBilletLength = this.byId(
                    "tblBilletLabelMaster"
                ).getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_ERROR_NO_BILLET_SELECTED"
                );
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                } else {
                    sap.m.MessageBox.success(
                        this.appComponent.oBundle.getText(
                            "Etiket çıkartmak istediğinize emin misiniz?"
                        ),
                        {
                            actions: [
                                this.appComponent.oBundle.getText("EVET"),
                                this.appComponent.oBundle.getText("HAYIR"),
                            ],
                            onClose: function (oAction) {
                                if (oAction == "EVET") {
                                    this.printLabelManual();
                                }
                            }.bind(this),
                        }
                    );
                }
            },

            callPrintManual: function (p_this, p_data, oAction) {
                sap.m.MessageToast.show("Manuel etiket çıkarma başarılı");
                p_this.changeIntervalState();
                p_this.handleCancel();
            },

            printLabelManual: function () {
                var tableModel = this.getView().getModel("billetTagListModel").oData;
                var oTable = this.getView().byId("tblBilletLabelMaster");
                /*
                        var oSelectedRowLength = oTable.getSelectedContexts().length;
                        var selectedRowPath = oTable.getSelectedContexts()[0].sPath;
                        var selectedRow = selectedRowPath.split("/")[1];
              */

                var selectedBagList = [];
                var oSelectedRowLength = oTable.getSelectedContexts().length;
                for (i = 0; i < oSelectedRowLength; i++) {
                    var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                    var selectedRow = selectedRowPath.split("/")[1];
                    var entryId = tableModel[selectedRow].ENTRY_ID;
                    selectedBagList.push(entryId);
                }


                // var entryid = tableModel[selectedRow].ENTRY_ID;
                var ktkId = tableModel[selectedRow].KTKID;
                var aufnr = tableModel[selectedRow].AUFNR;
                var workcenterid = this.appData.node.workcenterID;

                var plant = this.appData.plant;
                var params = {
                    //I_ENTRYID: entryid,
                    ENTRYID_LIST: selectedBagList.toString(),
                    I_AUFNR: aufnr,
                    I_PLANT: plant,
                    I_WORKCENTER: workcenterid,
                };
                var tRunner = new TransactionRunner(
                    "MES/Integration/Label/DHH/sendManualLabelDHHXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(that, that.callPrintManual);
            },

            getBilletOrderChar: function () {
                var werks = this.appData.plant;
                var workCenterId = this.appData.node.workcenterID;
                var params = {
                    "Param.1": werks,
                    "Param.2": this.appData.selected.order.orderNo,
                    "Param.3": workCenterId,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/getBilletOrderCharacteristics",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletOrderChar);
            },

            callBilletOrderChar: function (p_this, p_data) {
                var tableData = p_data.Rowsets.Rowset[0];
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData);
                p_this.getView().setModel(oModel, "CharList");
            },

            getBilletConfirmChar: function () {
                var werks = this.appData.plant;
                var workCenterId = this.appData.node.workCenterID;
                var params = {
                    "Param.1": werks,
                    "Param.2": this.appData.selected.order.orderNo,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/getBilletConfirmCharacteristics",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletConfirmChar);
            },

            callBilletConfirmChar: function (p_this, p_data) {
                var tableData = p_data.Rowsets.Rowset[0];
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData);
                p_this.getView().setModel(oModel, "CharList2");
                var oView = p_this.getView();

                if (
                    !!oModel.oData.Row.find((charc) => charc.CHARC == "Y_STDDISI")?.CHARC
                ) {
                    oView.byId("STD_DISI").setSelected(true);
                    p_this.prm = "STD_DISI";
                } else if (
                    !!oModel.oData.Row.find((charc) => charc.CHARC == "Y_SAPMA")?.CHARC
                ) {
                    oView.byId("SAPMA").setSelected(true);
                    p_this.prm = "SAPMA";
                } else if (
                    !!oModel.oData.Row.find((charc) => charc.CHARC == "Y_KISAPARCA")?.CHARC
                ) {
                    oView.byId("KISAPARCA").setSelected(true);
                    p_this.prm = "KISAPARCA";
                }

                else {
                    oView.byId("STD").setSelected(true);
                    p_this.prm = "STD";
                }
            },

            onPressBilletConfirm: function (oEvent) {
                this.getView().byId("billetConfirm").setEnabled(false);
                this.oView.setBusy(true);
                var buttonType = oEvent.getSource().getType();
                var allData = this.getView().getModel("billetTagListModel").oData;
                var selectedRow = oEvent
                    .getSource()
                    .oPropagatedProperties.oBindingContexts.billetTagListModel.sPath.split(
                        "/"
                    )[1];

                if (buttonType == "Emphasized") {
                    sap.m.MessageBox.warning(
                        this.appComponent.oBundle.getText("Teyit vermek istediğinize emin misiniz?"),
                        {
                            actions: [
                                this.appComponent.oBundle.getText("EVET"),
                                this.appComponent.oBundle.getText("HAYIR"),
                            ],
                            onClose: function (oAction) {
                                if (oAction == "EVET") {
                                    this.billetConfirmation(selectedRow);
                                } else {
                                    this.oView.setBusy(false);
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                }

                else if (buttonType == "Reject") {
                    var textMessage =
                        allData[selectedRow].MESSAGE +
                        "\n" +
                        " Tekrar denemek ister misiniz?";

                    sap.m.MessageBox.warning(textMessage, {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                // this.retryBilletConfirm(allData[selectedRow].ID);

                                this.billetConfirmation(selectedRow);
                            } else {
                                this.getView().byId("billetConfirm").setEnabled(true);
                                this.handleCancel();
                                return;
                            }
                        }.bind(this),
                    });
                }
            },
            billetConfirmation: function (selectedRow) {

                var tableModel = this.getView().getModel("billetTagListModel").oData;
                var oTable = this.getView().byId("tblBilletLabelMaster");

                var ktkId = tableModel[selectedRow].KTKID;
                var labelStatus = tableModel[selectedRow].LABEL_STATUS;
                var paletNo = tableModel[selectedRow].PACKAGE_NUMBER;
                var aufnr = tableModel[selectedRow].AUFNR;
                var weight = tableModel[selectedRow].LABEL_WEIGHT;
                var aufnrSeq = tableModel[selectedRow].AUFNR_SEQ;
                var packid = tableModel[selectedRow].ENTRY_ID;
                var entryid = tableModel[selectedRow].ENTRY_ID;
                var castID = tableModel[selectedRow].CASTID;

                var runId = this.appData.selected.runID;
                var nodeId = this.appData.node.nodeID;
                var material = this.appData.selected.material.id;
                var client = this.appData.client;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                var releasedId = this.appData.selected.releasedID;
                var rejType = "";
                var reasonCodeKey = this.getView()
                    .byId("idSelectReason")
                    .getSelectedKey();


                this.getView().byId("billetConfirm").setEnabled(false);
                var params = {

                    I_AUFNR: aufnr,
                    I_MATERIAL: material,
                    I_PLANT: plant,
                    I_NODEID: nodeId,
                    // I_RUNID:runId,
                    I_CLIENT: client,
                    //  I_RELEASED_ID:releasedId,
                    I_QUANTITY: weight,
                    I_PACKAGE_NUMBER: paletNo,
                    I_KTKID: ktkId,
                    I_ENTRYID: entryid,
                    I_PACKAGE_ID: packid,
                    I_REJECT_TYPE: rejType,
                    I_REASON_CODE: reasonCodeKey,
                    I_CASTID: castID,
                    I_CONFTYPE: 'X',
                };
                if ((this.getView().byId("SAPMA").getSelected() == true || this.getView().byId("STD_DISI").getSelected() == true) && reasonCodeKey == "") {
                    sap.m.MessageBox.warning("Lütfen Hata Kodu Seçiniz...");
                    this.oView.setBusy(false);
                }
                else {
                    var tRunner = new TransactionRunner(
                        "MES/UI/Haddehane/Confirmation/insertBilletConfirmationXqry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callBilletConfirmation);
                }
            },

            callBilletConfirmation: function (p_this, p_data) {
                p_this.getBilletTagList();
                p_this.oView.setBusy(false);

            },



            onPressBilletConfirmCancel: function (oEvent) {
                //this.getView().byId("billetConfirmCancel").setEnabled(false);
                this.oView.setBusy(true);
                var buttonType = oEvent.getSource().getType();
                var allData = this.getView().getModel("billetTagListModel").oData;
                var selectedRow = oEvent
                    .getSource()
                    .oPropagatedProperties.oBindingContexts.billetTagListModel.sPath.split(
                        "/"
                    )[1];

                if (buttonType == "Emphasized") {
                    sap.m.MessageBox.warning(
                        this.appComponent.oBundle.getText("Teyidi iptal etmek istediğinize emin misiniz?"),
                        {
                            actions: [
                                this.appComponent.oBundle.getText("EVET"),
                                this.appComponent.oBundle.getText("HAYIR"),
                            ],
                            onClose: function (oAction) {
                                if (oAction == "EVET") {
                                    this.billetConfirmationCancel(selectedRow);
                                } else {
                                    this.getView().byId("billetConfirmCancel").setEnabled(true);
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                }
                else if (buttonType == "Reject") {
                    var textMessage =
                        allData[selectedRow].CANCEL_MESSAGE +
                        "\n" +
                        " Tekrar denemek ister misiniz?";

                    sap.m.MessageBox.warning(textMessage, {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.retryBilletConfirmCancel(allData[selectedRow].C_ID);
                            } else {
                                this.oView.setBusy(false);
                                this.getView().byId("billetConfirmCancel").setEnabled(true);
                                return;
                            }
                        }.bind(this),
                    });
                }
            },

            billetConfirmationCancel: function (selectedRow) {
                var tableModel = this.getView().getModel("billetTagListModel").oData;
                var oTable = this.getView().byId("tblBilletLabelMaster");
                var user = this.appData.user.userID;
                var aufnr = tableModel[selectedRow].AUFNR;
                var entryId = tableModel[selectedRow].ENTRY_ID;
                var plant = this.appData.plant;
                var params = {
                    I_AUFNR: aufnr,
                    //I_KTKID: ktkid,
                    I_USER: user,
                    I_PLANT: plant,
                    I_ENTRYID: entryId
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/ConfirmCancel/confirmCancelXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletConfirmCancel);
            },

            callBilletConfirmCancel: function (p_this, p_data) {
                p_this.oView.setBusy(false);
                sap.m.MessageToast.show(
                    p_this.appComponent.oBundle.getText(
                        "OEE_LABEL_TRANSACTION_SUCCESSFUL"
                    )
                );
                //p_this.getBilletTagList();
                p_this.getView().byId("idSelectReason").setSelectedKey(null);
                p_this.getView().byId("STD").setSelected(true);
            },



            onOpenRejectDialog: function (oEvent) {
                var selectedBilletLength = this.byId(
                    "tblBilletLabelMaster"
                ).getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_ERROR_NO_BILLET_SELECTED"
                );
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                }
                var oView = this.getView();
                var oDialog = oView.byId("rejectedNotifsBilletMonitor");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.rejectedNotifsBilletMonitor",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                this.appData.oDialog = oDialog;
                oDialog.open();
                //this.getBilletDetail();
                this.getBilletRejectType();
            },

            getBilletRejectType: function (oEvent) {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Operations/getRejectTypesBilletMonitorQry"
                );
                tRunner.ExecuteQueryAsync(this, this.callRejectType);
            },

            callRejectType: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "rejectedNotifTypes");
            },

            callRejectReason: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "rejectedNotifReasonSec");
            },

            onSelectRejectType: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Operations/getRejectReasonBilletMonitorQry", params
                );
                if (!tRunner.Execute()) return null;
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "rejectedNotifReasons");

            },

            onSelectRejectReason: function (oEvent) {
                var params = { "Param.1": oEvent.getSource().getSelectedKey() };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Operations/getRejectReasonBlletMonitorSecQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callRejectReason);
            },

            handleCancel: function (oEvent) {
                this.oView.setBusy(false);
                var dependentLength = this.oView.getDependents().length - 1;
                this.oView.getDependents()[dependentLength].destroyContent();
                this.oView.getDependents()[dependentLength].destroy();

            },

            handleCancelCharc: function (oEvent) {
                this.getView().byId("STD").setSelected(true);
                this.cancelReturnStandart();
                var dependentLength = this.oView.getDependents().length - 1;
                this.oView.getDependents()[dependentLength].destroyContent();
                this.oView.getDependents()[dependentLength].destroy();
            },
            onSelectRejectReasonCode: function (oEvent) {
                var res = oEvent.getSource().getSelectedKey();
                var item = this.getView().byId("STD").getSelected();
                this.getView().getModel("i18n");
                if (item == true) {
                    this.getView().byId("idSelectReason").setSelectedKey(null);
                }
            },

            callChangeRadioButton: function (p_this, p_data) {
                p_this.getBilletConfirmChar();
                p_this.getBilletOrderChar();
                if (p_this.prm == "SAPMA" || p_this.prm == "STD_DISI") {
                    p_this.onPressChangeCharacteristic();
                    p_this.getView().byId("autoConfirm").setType("Reject");
                } else {
                    p_this.getView().byId("idSelectReason").setSelectedKey(null);
                    //p_this.getView().byId("autoConfirm").setType("Accept");
                }
            },

            onSelectConfirmType: function (oEvent) {
                if (!oEvent.getParameter("selected")) {
                    return;
                }
                var prm = oEvent.getParameter("id").split("--")[1];
                this.prm = prm;

                var aufnr = this.appData.selected.order.orderNo;
                var plant = this.appData.plant;
                var workCenterId = this.appData.node.workcenterID;
                var params = { I_AUFNR: aufnr, I_PLANT: plant, I_SELECTEDTYPE: prm, I_WORKCENTERID: workCenterId };

                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/changeRadioButtonXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callChangeRadioButton);


            },


            callReturnStart: function (p_this, p_data) {
                p_this.getView().byId("idSelectReason").setSelectedKey(null);
                //p_this.getView().byId("autoConfirm").setType("Accept");
            },


            cancelReturnStandart: function (oEvent) {

                var prm = "STD";
                var aufnr = this.appData.selected.order.orderNo;
                var plant = this.appData.plant;
                var workCenterId = this.appData.node.workcenterID;
                var params = { I_AUFNR: aufnr, I_PLANT: plant, I_SELECTEDTYPE: prm, I_WORKCENTERID: workCenterId };

                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/changeRadioButtonXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callReturnStart);
            },

            getGlobalConfig: function () {
                return;
                var params = { "Param.1": this.appData.node.workcenterID };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/getConfirmTypeParamQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.show(tRunner.GetErrorMessage());
                    return false;
                }
                if (!tRunner.GetJSONData()[0].Row) return;
                var ret = tRunner.GetJSONData()[0].Row[0];
                this.appData.globalConfig = ret;
                this.getView().byId(ret.VAL)?.setSelected(true);
            },

            updateConfTypeParam: function (sParam) {
                var params = {
                    "Param.1": this.appData.node.workcenterID,
                    "Param.2": sParam,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/updateConfirmTypeParamQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.show(tRunner.GetErrorMessage());
                    return false;
                }
            },

            onPressClearReasons: function (oEvent) {
                this.getView().byId("idSelectReason").setSelectedKey(null);
            },
            onPressNextButton: function () {
                this.getView()
                    .byId("tblBilletLabelMaster")
                    .map((e) => e.KTKID)
                    .join();
            },

            onPressAddPackageButton: function () {
                sap.m.MessageBox.success(
                    this.appComponent.oBundle.getText(
                        "Yeni paket eklemek istediğinize emin misiniz?"
                    ),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.addPackageButton();
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },


            addPackageButton: function () {
                var val = this.getView().byId("idPackageWeight").getValue();
                var werks = this.appData.plant;
                var workCenterId = this.appData.node.workcenterID;
                var shortPiece = this.getView().byId("KISAPARCA").getSelected();
                var params = {
                    I_PLANT: werks,
                    I_WORKCENTER: workCenterId,
                    I_TONAJ: val,
                    I_CONFIRMRYPE: this.prm,
                    I_SHORTPIECE: shortPiece,
                };

                if (val > 3000) {
                    sap.m.MessageBox.warning("Tonaj 3000 den fazla olamaz.");
                }
                else {
                    var tRunner = new TransactionRunner(
                        "MES/UI/Haddehane/Package/manualInsertBilletPackageXqry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callAddPackageButton);
                }
            },
            callAddPackageButton: function (p_this, p_data) {
                sap.m.MessageToast.show(p_data.Rowsets.Messages[0]?.Message);
                p_this.getBilletTagList();
                p_this.getProducedQuantity();
                p_this.getProducedQuantityToday();
            },

            onPressChangeCharacteristic: function (oEvent) {
                var oView = this.getView();
                var oDialog = oView.byId("billetChangeCharacteristic");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.billetChangeCharacteristic",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                this.appData.oDialog = oDialog;
                oDialog.open();
                this.getInformationFragmentData();
            },

            callInformationFragmentData: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "informationFragmentData");
            },

            getInformationFragmentData: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var params = { "Param.1": aufnr };

                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/getInformationFragmentDataQry",
                    params
                );

                tRunner.ExecuteQueryAsync(this, this.callInformationFragmentData);
            },

            callBilletChangeCharacteristic: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                );
                p_this.handleCancel();
                p_this.onInit();
            },

            onChangeDialogCharacteristic: function (oEvent) {
                var rodLength = this.getView().byId("rodLength").getValue();
                var productionType = this.getView()
                    .byId("productionType")
                    .getSelectedKey();
                var bufferLength = this.getView().byId("bufferLength").getValue();
                var rodCount = this.getView().byId("rodCount").getValue();
                if (bufferLength == "") bufferLength = rodLength;

                if (
                    rodLength == "" ||
                    productionType == "" ||
                    bufferLength == "" ||
                    rodCount == ""
                ) {
                    sap.m.MessageBox.show(
                        this.appComponent.oBundle.getText("OEE_ERR_MSG_FILL_BLANKS")
                    );
                    return;
                }
                if (rodLength > 50 || rodCount > 1000) {
                    sap.m.MessageBox.show(
                        "Fazla miktarda çubuk boyu veya sayısı girilmiştir."
                    );
                    return;
                }
                var changeCharacteristicJSON = [
                    { CHAR: "Y_BOY_CBK_M", CHAR_VALUE: rodLength },
                    { CHAR: "Y_URETIM_YONTEMI", CHAR_VALUE: productionType },
                    { CHAR: "Y_TAMPON_BOY", CHAR_VALUE: bufferLength },
                    { CHAR: "Y_CUBUK_SAYISI", CHAR_VALUE: rodCount },
                ];

                var plant = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var changeCharacteristic = JSON.stringify(changeCharacteristicJSON);
                var params = {
                    I_AUFNR: aufnr,
                    I_PLANT: plant,
                    I_CHANGECHARACTERISTIC: changeCharacteristic,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/billetChangeCharacteristicXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletChangeCharacteristic);
            },

            changeBufferLength: function (oEvent) {
                this.getView()
                    .byId("bufferLength")
                    .setValue(oEvent.getSource().getValue());
            },

            callDeleteBilletTagListRowXquery: function (p_this, p_data) {
                p_this.onInit();
                sap.m.MessageToast.show(
                    p_this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                );
            },

            onOpenDeleteBilletTag: function () {
                var oTable = this.getView().byId("tblBilletLabelMaster");
                var nodeID = this.appData.node.nodeID;
                var entryIDArray = [];
                var oData = this.getView().getModel("billetTagListModel").oData;
                if (oTable.getSelectedItems().length == 0) {
                    sap.m.MessageToast.show("Lütfen Seçim yapınız!");
                    return;
                }
                var rows = this.getView()
                    .byId("tblBilletLabelMaster")
                    .getSelectedItems();

                rows.forEach(function (item, index) {
                    var chosenRow = item.oBindingContexts.billetTagListModel.sPath.split(
                        "/"
                    )[1];
                    var entryID = oData[chosenRow].ENTRY_ID;
                    if (oData[chosenRow].BP_SUCCESS == "S" || oData[chosenRow].BP_SUCCESS == "E") {
                        sap.m.MessageToast.show(
                            oData[chosenRow].ENTRY_ID + " nolu kaydı silemezsiniz!"
                        );
                        return;
                    }

                    entryIDArray.push({ ENTRY_ID: entryID });
                }, this);

                if (entryIDArray.length == 0) return;

                var params = { I_ENTRYID: JSON.stringify(entryIDArray) };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/Package/deleteBilletTagListRowXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callDeleteBilletTagListRowXquery);
            },

            callShortPieceFunction: function (p_this, p_data) { },

            onPressShortPiece: function (oEvent) {
                var select = oEvent.getSource().getSelected();
                var workcenterID = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;
                var name = "Y_KISAPARCA";
                var params = {
                    I_AUFNR: aufnr,
                    I_WORKCENTERID: workcenterID,
                    I_NAME: name,
                    I_SELECT: select,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/insertShortPieceXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callShortPieceFunction);
            },

            callShortPiece: function (p_this, p_data) {
                var shortPiece = p_this.getView().byId("KISAPARCA");
                if (p_data.Rowsets.Rowset[0].Row != undefined) {
                    if (p_data.Rowsets.Rowset[0].Row[0].VAL == "X")
                        shortPiece.setSelected(true);
                    else shortPiece.setSelected(false);
                }
            },

            getShortPiece: function () {
                var workcenterID = this.appData.node.workcenterID;
                var params = { "Param.1": workcenterID };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/getShortPieceQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callShortPiece);
            },

            callProducedQuantity: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "producedQuantity");
                if (oModel.oData[0].REMAINING == "5" || oModel.oData[0].REMAINING == "15" || oModel.oData[0].REMAINING == "25") {
                    //MessageBox.information(`Kalan paket sayısı ${oModel.oData[0].REMAINING}'tir. `);

                    sap.m.MessageBox.warning(`Kalan paket sayısı ${oModel.oData[0].REMAINING}'tir. `, {
                        id: "onClickSaveMessageBox",
                        styleClass: "onClickSaveMessageBox",
                        onClose: function (oAction) {
                        }.bind(this),
                    });
                }
            },
            callProducedQuantityToday: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "producedQuantityToday");

            },

            getProducedQuantity: function () {
                var workcenterID = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var params = {
                    "Param.1": aufnr,
                    "Param.2": plant,
                    "Param.3": workcenterID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/getProducedQuantityQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callProducedQuantity);
            },

            getProducedQuantityToday: function () {
                var workcenterID = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var params = {

                    "Param.2": plant,
                    "Param.3": workcenterID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Haddehane/getProducedQuantityTodayQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callProducedQuantityToday);
            },
            retryBilletConfirm: function (id) {
                var params = {
                    I_ID: id,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList/retryQueueConfirmHHXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                this.oView.setBusy(false);
            },
            kantarAlert: function () {
                var kantarMax1 = this.getView().byId("idConfirmTolerance").mProperties.text
                var kantarRange = kantarMax1.split("- ");
                var kantarMin = kantarRange[0]
                var kantarMax = kantarRange[1]
                var netWeight = this.getView().byId("tblBilletLabelMaster").mAggregations.items[0].mAggregations.cells[8].mProperties.text;
                if (this.getView().byId("kantarToleransCb").getSelected()) {
                    if (netWeight > kantarMax) {
                        sap.m.MessageBox.warning("Kantar ağırlığı kantar toleransından fazladır.", {
                            id: "onClickSaveMessageBox2",
                            styleClass: "onClickSaveMessageBox",
                        });
                    }
                    else if (netWeight < kantarMin) {
                        sap.m.MessageBox.warning("Kantar ağırlığı kantar toleransından azdır.", {
                            id: "onClickSaveMessageBox2",
                            styleClass: "onClickSaveMessageBox",
                        });
                    }
                    this.updateAutoConfirm()
                }

            },
            onPressRefresh: function (oEvent) {
                this.getBilletTagList();
                this.getProducedQuantity();
                this.getProducedQuantityToday();
                this.getConfirmTolerance();

            },

            retryBilletConfirmCancel: function (id) {
                var params = {
                    I_ID: id,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList/retryQueueConfirmHHXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                this.oView.setBusy(false);
            },
            //  });
            // }
            // );

            modelServices: function () {
                var self = this;
                this.intervalHandle = setInterval(function () {
                    if (window.location.hash == "#/activity/ZACT_TAG_LIST") {
                        if (self.appData.intervalState == true) {
                            self.getBilletTagList();
                            self.getProducedQuantity();
                            self.getAlert();
                            self.controlAutoConfirm();
                            self.oView.setBusy(false);
                        }
                    }
                    console.log("Tag list sayfa yenileme");
                }, 25000);
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
        }
        );
    }
);
