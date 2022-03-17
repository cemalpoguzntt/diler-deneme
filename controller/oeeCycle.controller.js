sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "sap/m/Label",
        "sap/m/Dialog",
        "sap/m/DialogType",
        "sap/m/Button",
        "sap/m/ButtonType",
        "sap/ui/core/CustomData",
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
        Label,
        Dialog,
        DialogType,
        Button,
        ButtonType,
        CustomData,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        customStyle,
        FilterType,
        TransactionCaller
    ) {
        var interval;
        var that;
        var radioValues = {
            "UST": "idRadioUst",
            "ORTA": "idRadioOrta",
            "ALT": "idRadioAlt"
        };
        return Controller.extend("customActivity/controller/oeeCycle", {

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                that = this;
                this.fetchTable();
                /*
                interval = setInterval(function int() {
                    if (!!that.getView().byId("idCycleTracingTable")) {
                        that.fetchTable();
                    }
                    else {
                        clearInterval(interval);
                        return;
                    }
                }, 5000);
                */

            },
            fetchTable: function () {
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_GET_CEVRIM_TABLE",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID
                    },
                    "O_JSON",
                    this.fetchTableCB,
                    this,
                    "GET"
                );
            },
            fetchTableCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var result = [];
                if (!!iv_data[0]?.Rowsets?.Rowset?.Row) {
                    result = Array.isArray(iv_data[0].Rowsets.Rowset.Row) ? iv_data[0].Rowsets.Rowset.Row : new Array(iv_data[0].Rowsets.Rowset.Row);
                }
                var cycleNo = "";
                var statu = "";
                var startTime = "";
                var endTime = "";
                if (result.length != 0) {
                    cycleNo = result[0]?.CYCLENO;
                    statu = result[0]?.FRN_STATU;
                    startTime = result[0]?.START_TIME;
                    endTime = result[0]?.END_TIME;
                }
                iv_scope.manageStatu(statu);
                iv_scope.manageTime(startTime, endTime);
                iv_scope.getView().byId("idCycleNo").setText(cycleNo);
                if (!(!!iv_scope.getView().byId("idCycleTracingTable"))) {
                    clearInterval(interval);
                    return;
                }
                var myModel = new sap.ui.model.json.JSONModel();
                myModel.setData(result);
                iv_scope.getView().byId("batchCount").setText(result.length);
                iv_scope.getView().byId("idCycleTracingTable").setModel(myModel);
                if (result.length > 0) {
                    iv_scope.isEditable(result[0]?.FRN_STATU);
                    iv_scope.paintRowBackground();
                }
                //
                if (!!cycleNo) {
                    TransactionCaller.async(
                        "MES/Itelli/CAN_FRN/CEVRIM_SCREEN/Q_GET_LAST_READED",
                        {
                            I_WORKCENTERID: iv_scope.appData.node.workcenterID,
                            I_CYCLENO: cycleNo
                        },
                        "O_JSON",
                        iv_scope.getLastReadedAufnrCB,
                        iv_scope,
                        "GET"
                    );

                }
            },
            paintRowBackground: function () {
                var tableItems = this.getView().byId("idCycleTracingTable").getItems();
                var modelArr = this.getView().byId("idCycleTracingTable").getModel()?.getData();
                if (tableItems.length > 0 && modelArr.length > 0) {
                    tableItems.forEach((item, index) => {
                        item.removeStyleClass("cycleTableDefaultBackground");
                        item.removeStyleClass("cycleTableRedBackground");
                        if (!!!modelArr[index]?.WEIGHT || !!!modelArr[index]?.KONUM || !!!modelArr[index]?.PALETNO)
                            item.addStyleClass("cycleTableRedBackground");
                        else
                            item.addStyleClass("cycleTableDefaultBackground");

                    });
                }
                this.getView().byId("idCycleTracingTable").getModel().refresh();
            },
            getLastReadedAufnrCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                iv_scope._oLastReaded = null;
                if (!!iv_data[0]?.Rowsets?.Rowset?.Row) {
                    iv_scope._oLastReaded = iv_data[0].Rowsets.Rowset.Row.AUFNR;

                    iv_scope.getView().byId("idLastActiveSeperator").setVisible(true);
                    iv_scope.getView().byId("idLastActive").setVisible(true);
                }
                else {
                    iv_scope.getView().byId("idLastActiveSeperator").setVisible(false);
                    iv_scope.getView().byId("idLastActive").setVisible(false);
                }
            },

            isEditable: function (statu) {
                if (statu != "HAZIRLIK") {
                    if (Array.isArray(this.getView().byId("idCycleTracingTable")?.mAggregations?.items)) {
                        this.getView().byId("idCycleTracingTable").mAggregations.items.forEach((item) => {
                            var sIdEdit = item.mAggregations.cells[10].sId;
                            var sIdDelete = item.mAggregations.cells[11].sId;
                            that.getView().byId(sIdEdit).setEnabled(false);
                            that.getView().byId(sIdDelete).setEnabled(false);
                        });
                    }
                }
            },
            manageTime: function (startTime, endTime) {
                if (!!startTime) {
                    var text = `${new Date(startTime).toLocaleDateString()} ${new Date(startTime).toLocaleTimeString()}`;

                    this.getView().byId("idStartTime").setText(text);
                    this.getView().byId("idStartText").setVisible(true);
                    this.getView().byId("idStartTime").setVisible(true);
                    this.getView().byId("idStartCycle").setEnabled(false);
                }
                else {
                    this.getView().byId("idFinishCycle").setEnabled(false);
                }
                if (!!endTime) {
                    var text = `${new Date(endTime).toLocaleDateString()} ${new Date(endTime).toLocaleTimeString()}`;

                    this.getView().byId("idEndTime").setText(text);
                    this.getView().byId("idEndText").setVisible(true);
                    this.getView().byId("idEndTime").setVisible(true);
                    this.getView().byId("idStartCycle").setEnabled(false);
                    this.getView().byId("idFinishCycle").setEnabled(false);
                }
            },
            manageStatu: function (statu) {
                this.getView().byId("idStateCustom").setValue(statu);
                this.getView().byId("idState").setText(statu);
            },
            onPressEdit: function (oEvent) {
                var selectedObj = oEvent.getSource().getBindingContext().getObject();
                if (!this._oDialogEdit) {
                    this._oDialogEdit = sap.ui.xmlfragment(
                        "cycleEdit",
                        "customActivity.fragmentView.cycleEdit",
                        this
                    );
                    this.getView().addDependent(this._oDialogEdit);
                }
                var modelArr = [];
                modelArr.push(selectedObj);
                var myModel = new sap.ui.model.json.JSONModel();
                myModel.setData(modelArr);
                this.getView().setModel(myModel, "editModel");
                this._oDialogEdit.open();
                this.resetEditFragment();
                this.fillValues(selectedObj);
            },

            resetEditFragment: function () {
                var radioArr = Object.values(radioValues);
                sap.ui.core.Fragment.byId("cycleEdit", "idPalet").setValue("");
                sap.ui.core.Fragment.byId("cycleEdit", "idBatch").setText("");
                radioArr.forEach((id) => sap.ui.core.Fragment.byId("cycleEdit", id).setSelected(false));
            },
            fillValues: function (selectedObj) {
                sap.ui.core.Fragment.byId("cycleEdit", "idPalet").setValue(selectedObj?.PALETNO);
                sap.ui.core.Fragment.byId("cycleEdit", "idBatch").setText(selectedObj.BATCH);
                if (selectedObj.WEIGHT >= 2)
                    sap.ui.core.Fragment.byId("cycleEdit", "idRadioOrta").setEnabled(false);
                if (!!radioValues[selectedObj?.KONUM])
                    sap.ui.core.Fragment.byId("cycleEdit", radioValues[selectedObj?.KONUM]).setSelected(true);
                this.setOnlyNumberListener();
            },
            setOnlyNumberListener: function () {
                sap.ui.core.Fragment.byId("cycleEdit", "idPalet").onkeypress = function (e) {
                    that.valueInputFilter(that, e, "idPalet");
                }
            },
            valueInputFilter: function (that, e, inputId) {
                var val = sap.ui.core.Fragment("cycleEdit", inputId).getValue();
                var maxLength = 3;
                var charValue = String.fromCharCode(e.keyCode);
                if (val.includes('.') || val.includes(',')) {
                    if (charValue == ',' || charValue == '.') {
                        e.preventDefault();
                    }
                }
                if (val.length >= maxLength) {
                    e.preventDefault();
                }
                if (((isNaN(parseInt(charValue))) && (e.which != 8) && charValue == ',' && charValue == '.')) { // BSP KB code is 8
                    e.preventDefault();
                }
                if (e.keyCode == 46) {
                    e.preventDefault();
                }
                return true;
            },
            onEditConfirm: function (oEvent) {
                var selectedModel = this.getView().getModel("editModel");
                var selectedObj = selectedModel.oData[0];
                var selectedPaletNo = sap.ui.core.Fragment.byId("cycleEdit", "idPalet").getValue();
                if (!(!!selectedPaletNo)) {
                    MessageBox.error("Palet numarası boş bırakılamaz");
                    return;
                }
                if (selectedPaletNo == 0) {
                    MessageBox.error("Palet numarası 0 olamaz");
                    return;
                }
                var radioArr = Object.values(radioValues);
                var isSelected = false;
                var selectedLokasyon = "";
                radioArr.forEach((id) => {
                    if (sap.ui.core.Fragment.byId("cycleEdit", id).getSelected()) {
                        isSelected = true;
                        selectedLokasyon = Object.keys(radioValues).find(key => radioValues[key] == id);
                    }
                });
                if (!isSelected) {
                    MessageBox.error("Lokasyon seçiniz");
                    return;
                }

                //if (!this.oCycleEditConfirm) {
                this.oCycleEditConfirm = new Dialog({
                    type: 'Message',
                    title: "Çevrim Düzenle",
                    content: new Label({ text: "Düzenlemeyi onaylıyor musunuz?", customData: new CustomData({ key: "canBatch", value: "TITLE", writeToDom: true }) }),
                    beginButton: new Button({
                        text: "Evet",
                        class: "cycleBtnInner",
                        press: function () {
                            this.onSaveEditConfirm(selectedObj, selectedPaletNo, selectedLokasyon);
                            this.oCycleEditConfirm.close();
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "İptal",
                        class: "cycleBtnInner",
                        press: function () {
                            this.oCycleEditConfirm.close();
                        }.bind(this)
                    })
                });
                this.oCycleEditConfirm.setEscapeHandler(function (o) {
                    o.reject();
                });
                this.getView().addDependent(this.oCycleEditConfirm);
                //}
                this.oCycleEditConfirm.open();
            },
            onSaveEditConfirm: function (selectedObj, selectedPaletNo, selectedLokasyon) {

                var selectedBatch = selectedObj.BATCH;
                var selectedCycleNo = selectedObj.CYCLENO;
                var selectedAgirlik = selectedObj.WEIGHT;

                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_EDIT_BATCH_INFO",
                    {
                        I_BATCH: selectedBatch,
                        I_PALETNO: selectedPaletNo,
                        I_KONUM: selectedLokasyon,
                        I_CYCLENO: selectedCycleNo,
                        I_AGIRLIK: selectedAgirlik,
                        I_USER: this.appData.user.userID
                    },
                    "O_JSON",
                    this.onUpdateEditCB,
                    this,
                    "GET"
                );
                sap.ui.core.Fragment.byId("cycleEdit", "cycleEditDialog").setBusy(true);
            },
            onUpdateEditCB: function (iv_data, iv_scope) {
                sap.ui.core.Fragment.byId("cycleEdit", "cycleEditDialog").setBusy(false);
                if (iv_data[1] == "E") {
                    MessageBox.show(iv_data[0]);
                    return;
                }
                MessageBox.information("Düzenleme başarılı");
                iv_scope.fetchTable();
                iv_scope._oDialogEdit.close();
            },
            onEditCancel: function (oEvent) {
                this._oDialogEdit.close();
            },
            onPressDelete: function (oEvent) {
                var selectedObj = oEvent.getSource().getBindingContext().getObject();
                if (!this.oCycleDeleteConfirm) {
                    this.oCycleDeleteConfirm = new Dialog({
                        type: 'Message',
                        title: "Parti Sil",
                        content: new Label({ text: "Seçilen partiyi çevrimden silmek istediğinize emin misiniz?", customData: new CustomData({ key: "canBatch", value: "TITLE", writeToDom: true }) }),
                        beginButton: new Button({
                            text: "Evet",
                            class: "cycleBtnInner",
                            press: function () {
                                this.onDeleteConfirm(selectedObj.BATCH);
                                this.oCycleDeleteConfirm.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "İptal",
                            class: "cycleBtnInner",
                            press: function () {
                                this.oCycleDeleteConfirm.close();
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this.oCycleDeleteConfirm);
                }
                this.oCycleDeleteConfirm.open();
            },
            onDeleteConfirm: function (batch) {
                this.getView().byId("idCycleTracingTable").setBusy(true);
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_DELETE_BATCH",
                    {
                        I_BATCH: batch,
                        I_USER: this.appData.user.userID
                    },
                    "O_JSON",
                    this.deleteBatchCB,
                    this,
                    "GET"
                );
            },
            deleteBatchCB: function (iv_data, iv_scope) {
                iv_scope.getView().byId("idCycleTracingTable").setBusy(false);
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                iv_scope.fetchTable();
            },
            onPressStart: function (oEvent) {
                if (!this.oCycleStartDialog) {
                    this.oCycleStartDialog = new Dialog({
                        type: 'Message',
                        title: "Çevrim Başlat",
                        content: new Label({ text: "Çevrimi başlatmak istediğinize emin misiniz?", customData: new CustomData({ key: "canBatch", value: "TITLE", writeToDom: true }) }),
                        beginButton: new Button({
                            text: "Evet",
                            class: "cycleBtnInner",
                            press: function () {
                                this.startCycle();
                                this.oCycleStartDialog.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "İptal",
                            class: "cycleBtnInner",
                            press: function () {
                                this.oCycleStartDialog.close();
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this.oCycleStartDialog);
                }
                this.oCycleStartDialog.open();
            },
            startCycle: function () {
                var tableModel = this.getView().byId("idCycleTracingTable").getModel();
                var oData = tableModel?.oData;
                if (!(!!oData) || oData.length == 0) {
                    MessageBox.error("Çevrimde parti yok, bileşen tayin yapın");
                    return;
                }
                var isEmptyCharacteristic = false;
                var checkArr = ["CAP", "CASTNO", "KALITE", "KONUM", "PALETNO", "WEIGHT"];
                oData.forEach((obj) => {
                    checkArr.forEach((column) => {
                        if (!(!!obj[column])) {
                            isEmptyCharacteristic = true;
                        }
                    });
                });
                if (isEmptyCharacteristic) {
                    MessageBox.error("Çevrim içinde boş olan karakteristikler mevcut");
                    return;
                }

                var cycleNo = this.getView().byId("idCycleNo").getText();

                this.getView().byId("idCycleTracingTable").setBusy(true);
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_START_CYCLE",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID,
                        I_CYCLENO: cycleNo,
                        I_USER: this.appData.user.userID
                    },
                    "O_JSON",
                    this.startCycleCB,
                    this,
                    "GET"
                );
            },
            startCycleCB: function (iv_data, iv_scope) {
                iv_scope.getView().byId("idCycleTracingTable").setBusy(false);
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                iv_scope.getView().byId("idFinishCycle").setEnabled(true);
                iv_scope.fetchTable();
            },
            onCycleTableSelectionChanged: function (oEvent) {
                oEvent.getSource().mAggregations.items.forEach((item) => {
                    var cells = item.mAggregations.cells;
                    var deleteButton = cells[cells.length - 1];
                    var editButton = cells[cells.length - 2];
                    if (!!item?.mProperties?.selected) {
                        deleteButton.setEnabled(true);
                        editButton.setEnabled(true);
                    }
                    else {
                        deleteButton.setEnabled(false);
                        editButton.setEnabled(false);
                    }
                });
            },
            onPressFinish: function (oEvent) {
                if (!this.oCycleFinishDialog) {
                    this.oCycleFinishDialog = new Dialog({
                        type: 'Message',
                        title: "Çevrim Başlat",
                        content: new Label({ text: "Çevrimi bitirmek istediğinize emin misiniz?", customData: new CustomData({ key: "canBatch", value: "TITLE", writeToDom: true }) }),
                        beginButton: new Button({
                            text: "Evet",
                            press: function () {
                                this.finishCycle();
                                this.oCycleFinishDialog.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "İptal",
                            press: function () {
                                this.oCycleFinishDialog.close();
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this.oCycleFinishDialog);
                }
                this.oCycleFinishDialog.open();
            },
            finishCycle: function () {
                var tableModel = this.getView().byId("idCycleTracingTable").getModel();
                var oData = tableModel?.oData;
                if (!(!!oData) || oData.length == 0) {
                    MessageBox.error("Çevrimde parti yok, bileşen tayin yapın");
                    return;
                }

                var cycleNo = this.getView().byId("idCycleNo").getText();

                this.getView().byId("idCycleTracingTable").setBusy(true);
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_END_CYCLE",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID,
                        I_CYCLENO: cycleNo,
                        I_USER: this.appData.user.userID,
                        I_NODE_ID : this.appData.node.nodeID
                    },
                    "O_JSON",
                    this.finishCycleCB,
                    this,
                    "GET"
                );
            },
            finishCycleCB: function (iv_data, iv_scope) {
                iv_scope.getView().byId("idCycleTracingTable").setBusy(true);
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                iv_scope.fetchTable();
                iv_scope.onRedirectConfirmBatch();
            },
            onRedirectManageOrders: function (oEvent) {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_ORD_CAN";
                window.location.href = origin + pathname + navToPage;
            },
            onRedirectConfirmBatch: function (oEvent) {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_BATCH_CONFIRM";
                window.location.href = origin + pathname + navToPage;
            },
            navigateCevrim: function () {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_CYCLE";
                window.location.href = origin + pathname + navToPage;
            },
            onPressLastActive: function (oEvent) {
                if (!!this._oLastReaded) {
                    var aufnr = this._oLastReaded;
                    this.appComponent.getRouter().navTo("activity", {
                        activityId: "ZACT_ORD_CAN",
                        mode: aufnr
                    });
                }


            },
        });
    }
);
