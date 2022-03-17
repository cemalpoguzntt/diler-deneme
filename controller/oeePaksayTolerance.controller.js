sap.ui.define(
    [
        "sap/m/MessageToast",
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/resource/ResourceModel",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
        "sap/m/Dialog",
        "sap/m/Text",
        "sap/m/TextArea",
        "sap/m/Button",
        "sap/m/Label",
        "sap/m/MessageBox",
    ],
    function (
        MessageToast,
        Controller,
        JSONModel,
        ResourceModel,
        TransactionCaller,
        Fragment,
        Dialog,
        Text,
        TextArea,
        Button,
        Label,
        MessageBox
    ) {
        "use strict";
        var selectedID;
        var that;

        return Controller.extend("customActivity.controller.oeePaksayTolerance", {
            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.appData.intervalState = true;
                this.interfaces = this.appComponent.getODataInterface();
                that = this;
                this.getPaksayTable();
            },
            getPaksayTable: function () {
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/PAKSAY_TOLERANCE/T_GET_PAKSAY_TABLE",
                    {},
                    "O_JSON",
                    this.getPaksayTableCB,
                    this,
                    "GET"
                );
                this.getView().byId("paksayTable").setBusy(true);
            },
            getPaksayTableCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    iv_scope.getView().byId("paksayTable").setBusy(false);
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var result = [];
                if (!!iv_data[0]?.Rowsets?.Rowset?.Row) {
                    result = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row) ? iv_data[0]?.Rowsets?.Rowset?.Row : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
                }
                var myModel = new sap.ui.model.json.JSONModel();
                myModel.setData(result);
                iv_scope.getView().byId("paksayTable").setBusy(false);
                iv_scope.getView().byId("paksayTable").setModel(myModel);
            },
            openDialog: function (selectedObj) {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(
                        "paksayToleranceFragment",
                        "customActivity.fragmentView.paksayToleranceEdit",
                        this
                    );
                    this.getView().addDependent(this._oDialog);
                }
                this._oDialog.open();
                this.clearDialogFields();
                this.setOnlyNumberListener("idWeight");
                this.setOnlyNumberListener("idMin");
                this.setOnlyNumberListener("idMax");
                sap.ui.core.Fragment.byId("paksayToleranceFragment", "idWeight").setEnabled(true);
                if (!!selectedObj) {
                    sap.ui.core.Fragment.byId("paksayToleranceFragment", "idWeight").setEnabled(false);
                    sap.ui.core.Fragment.byId("paksayToleranceFragment", "idWeight").setValue(selectedObj?.WEIGHT);
                    sap.ui.core.Fragment.byId("paksayToleranceFragment", "idMin").setValue(selectedObj?.MIN);
                    sap.ui.core.Fragment.byId("paksayToleranceFragment", "idMax").setValue(selectedObj?.MAX);
                }
            },
            setOnlyNumberListener: function (id) {
                sap.ui.core.Fragment.byId("paksayToleranceFragment",id).onkeypress = function (e) {
                    that.valueInputFilter(that, e, id);
                }
            },
            valueInputFilter: function (that, e, inputId) {
                var val = sap.ui.core.Fragment.byId("paksayToleranceFragment",inputId).getValue();
                var charValue = String.fromCharCode(e.keyCode);
                if (val.includes('.') || val.includes(',')) {
                    if (charValue == ',' || charValue == '.') {
                        e.preventDefault();
                    }
                }
                if (((isNaN(parseInt(charValue))) || (e.which == 8) || charValue == ',' || charValue == '.')) { // BSP KB code is 8
                    e.preventDefault();
                }
                if (e.keyCode == 46) {
                    e.preventDefault();
                }
                return true;
            },
            onPressEditFragmentSave: function (oEvent) {
                var agirlik = sap.ui.core.Fragment.byId("paksayToleranceFragment", "idWeight").getValue();
                var min = sap.ui.core.Fragment.byId("paksayToleranceFragment", "idMin").getValue();
                var max = sap.ui.core.Fragment.byId("paksayToleranceFragment", "idMax").getValue();

                if (!(!!agirlik)) {
                    MessageBox.error("Paket ağırlık alanı boş bırakılamaz");
                    return;
                }
                if (!(!!min)) {
                    MessageBox.error("Minimum tolerans alanı boş bırakılamaz");
                    return;
                }
                if (!(!!max)) {
                    MessageBox.error("Maksimum tolerans alanı boş bırakılamaz");
                    return;
                }
                if(isNaN(parseInt(agirlik))){
                    MessageBox.error("Paket ağırlığı formatı hatalı");
                    return;
                }
                if(isNaN(parseInt(min))){
                    MessageBox.error("Minimum tolerans formatı hatalı");
                    return;
                }
                if(isNaN(parseInt(max))){
                    MessageBox.error("Minimum tolerans formatı hatalı");
                    return;
                }
                if(parseInt(min) > parseInt(max)){
                    MessageBox.error("Minimum tolerans değeri maksimum tolerans değerinden büyük olamaz");
                    return;
                }
                var path = "";
                if (sap.ui.core.Fragment.byId("paksayToleranceFragment", "idWeight").getEnabled()) {
                    // INSERT
                    path="MES/Itelli/CAN_FRN/PAKSAY_TOLERANCE/T_INSERT_PAKSAY_TABLE";
                }
                else {
                    // UPDATE
                    path="MES/Itelli/CAN_FRN/PAKSAY_TOLERANCE/T_UPDATE_PAKSAY_TABLE";
                }
                TransactionCaller.async(
                    path,
                    {
                        I_WEIGHT: agirlik,
                        I_MIN: min,
                        I_MAX: max,
                        I_USER:this.appData.user.userID
                    },
                    "O_JSON",
                    this.editConfirmCB,
                    this,
                    "GET"
                );
                sap.ui.core.Fragment.byId("paksayToleranceFragment", "idWeightDialog").setBusy(true);

            },
            editConfirmCB: function (iv_data, iv_scope) {
                sap.ui.core.Fragment.byId("paksayToleranceFragment", "idWeightDialog").setBusy(false);
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                MessageToast.show("Başarılı");
                iv_scope._oDialog.close();
                iv_scope.getPaksayTable();
            },
            onPressEditFragmentCancel: function (oEvent) {
                this._oDialog.close();
            },
            onPressAddPaksay: function (oEvent) {
                this.openDialog();
            },
            onPressEditPaksay: function (oEvent) {
                if (!this.checkSelectedIndices()) {
                    return;
                }
                var selectedIndex = this.getView().byId("paksayTable").getSelectedIndex();
                var selectedObj = this.getView().byId("paksayTable").getBinding("rows").oList[selectedIndex];
                this.openDialog(selectedObj);
            },
            onPressDeletePaksay: function (oEvent) {
                if (!this.checkSelectedIndices()) {
                    return;
                }
                var selectedIndex = this.getView().byId("paksayTable").getSelectedIndex();
                this._oDeleteConfirm = new Dialog({
                    type: 'Message',
                    title: "Paket Ağırlık Sil",
                    content: new Label({ text: "Seçilen paket ağırlığını silmek istediğinize emin misiniz?"}),
                    beginButton: new Button({
                        text: "Evet",
                        press: function () {
                            this.onDeleteConfirmPaksay(selectedIndex);
                            this._oDeleteConfirm.close();
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "İptal",
                        press: function () {
                            this._oDeleteConfirm.close();
                        }.bind(this)
                    })
                });
                this.getView().addDependent(this._oDeleteConfirm);

                this._oDeleteConfirm.open();
            },
            onDeleteConfirmPaksay:function(selectedIndex){
                var selectedObj = this.getView().byId("paksayTable").getBinding("rows").oList[selectedIndex];
                var weight = selectedObj?.WEIGHT;
                if(!!weight){
                    TransactionCaller.async(
                        "MES/Itelli/CAN_FRN/PAKSAY_TOLERANCE/T_DELETE_PAKSAY_TABLE",
                        {
                            I_WEIGHT: weight,
                            I_USER: this.appData.user.userID
                        },
                        "O_JSON",
                        this.onDeleteConfirmCB,
                        this,
                        "GET"
                    );
                }
            },
            onDeleteConfirmCB:function(iv_data,iv_scope){
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                MessageToast.show("Silndi!");
                iv_scope.getPaksayTable();
            },
            checkSelectedIndices: function () {
                var selectedIndices = this.getView().byId("paksayTable").getSelectedIndices();
                if (selectedIndices.length == 0) {
                    MessageBox.error("Satır seçiniz");
                    return false;
                }
                else if (selectedIndices.length > 1) {
                    MessageBox.error("En fazla 1 satır seçebilirsiniz");
                    return false;
                }
                return true;
            },
            clearDialogFields:function(){
                sap.ui.core.Fragment.byId("paksayToleranceFragment", "idWeight").setValue("");
                sap.ui.core.Fragment.byId("paksayToleranceFragment", "idMin").setValue("");
                sap.ui.core.Fragment.byId("paksayToleranceFragment", "idMax").setValue("");
            },
            onPressRefresh:function(oEvent){
                this.getPaksayTable();
            }



        });
    }
);
