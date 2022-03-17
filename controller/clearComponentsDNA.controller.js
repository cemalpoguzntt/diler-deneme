sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "customActivity/scripts/custom",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    'sap/m/MessageToast',
    "customActivity/scripts/transactionCaller",
    "customActivity/scripts/customStyle",

], function (
    Controller,
    JSONModel,
    MessageBox,
    customScripts,
    formatter,
    Filter,
    FilterOperator,
    FilterType,
    MessageToast,
    TransactionCaller,
    customStyle
) {
    "use strict";

    return Controller.extend("customActivity.controller.clearComponentsDNA", {

        onInit: function () {
            this.appComponent = this.getView().getViewData().appComponent;
            this.appData = this.appComponent.getAppGlobalData();
            this.interfaces = this.appComponent.getODataInterface();
            this.getComponents();
            this.getDeletedComponents();
        },
        getComponents: function () {
            var order = this.appData.selected.order.orderNo;
            var workCenterID = this.appData.node.workcenterID;

            TransactionCaller.async("MES/Itelli/DNA/ClearComponents/getComponentsTrns", {
                I_ORDER: order,
                I_WORKCENTER: workCenterID
            },
                "O_JSON",
                this.getComponentsCB,
                this,
                "GET"
            );
        },
        getComponentsCB: function (iv_data, iv_scope) {
            if (iv_data[1] == "E") {
                MessageBox.error(iv_data[0]);
                return;
            }
            var modelArr = Array.isArray(iv_data[0].Rowsets.Rowset[0].Row) ? iv_data[0].Rowsets.Rowset[0].Row : new Array(iv_data[0].Rowsets.Rowset[0].Row);
            var myModel = new sap.ui.model.json.JSONModel(modelArr);

            iv_scope.getView().byId("componentsTable").setModel(myModel);
        },
        getDeletedComponents: function () {
            var aufnr = this.appData.selected.order.orderNo;
            var aprio = this.appData.selected.operationNo;

            TransactionCaller.async("MES/Itelli/DNA/ClearComponents/DeletedComponents/getDeletedComponentsQry", {
                I_AUFNR: aufnr,
                I_APRIO: aprio
            },
                "O_JSON",
                this.getDeletedComponentsCB,
                this,
                "GET"
            );
        },
        getDeletedComponentsCB: function (iv_data, iv_scope) {
            if (iv_data[1] == "E") {
                MessageBox.error(iv_data[0]);
                return;
            }
            var modelArr = Array.isArray(iv_data[0].Rowsets.Rowset[0].Row) ? iv_data[0].Rowsets.Rowset[0].Row : new Array(iv_data[0].Rowsets.Rowset[0].Row);
            var myModel = new sap.ui.model.json.JSONModel(modelArr);

            iv_scope.getView().byId("oldComponentsTable").setModel(myModel);
        },
        onPressUndo: function () {
            var selectedPath = this.getView().byId("oldComponentsTable").getSelectedContextPaths()[0].split("/")[1];
            var consId = this.getView().byId("oldComponentsTable").getModel().getData()[selectedPath].CONSID;

            if (!consId) {
                sap.m.MessageToast.show("Satır seçilmeli");
                return;
            }

            TransactionCaller.async("MES/Itelli/DNA/ClearComponents/DeletedComponents/getComponentBackTrns", {
                I_CONSID: consId,
            },
                "O_JSON",
                this.onPressUndoCB,
                this,
                "GET"
            );
        },
        onPressUndoCB: function (iv_data, iv_scope) {
            if (iv_data[1] == "E") {
                MessageBox.error(iv_data[0]);
                return;
            }
            sap.m.MessageToast.show("Silme işlemi geri alındı");
            iv_scope.getComponents();
            iv_scope.getDeletedComponents();
        },
        onPressDelete: function () {
            var selectedPath = this.getView().byId("componentsTable").getSelectedContextPaths()[0].split("/")[1];
            var consType = this.getView().byId("componentsTable").getModel().getData()[selectedPath].CONSUMPTIONTYPE;

            if (consType == "10") {     

                var selectedModel = this.getView().byId("componentsTable").getModel().getData()[selectedPath];


                var fragmentMessage = "Bileşeni silmek istediğinize emin misiniz?"

                this.openFragment1(fragmentMessage, selectedModel);                

                

            } else {                    


                var selectedModel = this.getView().byId("componentsTable").getModel().getData()[selectedPath];

                var fragmentMessage = "Bu bileşenin tüketim kaydı bulunmaktadır.\nEğer bu bileşeni silerseniz aynı siparişe tekrar okutamazsınız!\nDevam etmek istiyor musunuz?"

                this.openFragment2(fragmentMessage, selectedModel);

               
            }
        },

        openFragment1: function (fragmentMessage, selectedModel) {
            if (!this._oDialog01) {
                this._oDialog01 = sap.ui.xmlfragment(
                    "clearCompMessageFragment1",
                    "customActivity.fragmentView.clearCompMessageFragment1",

                    this
                );
                this.getView().addDependent(this._oDialog01);
            }
            this._oDialog01.open();


            sap.ui.core.Fragment.byId("clearCompMessageFragment1", "clearCompDiaog1").setModel(selectedModel);
            sap.ui.core.Fragment.byId("clearCompMessageFragment1", "fragmentMessage").setText(fragmentMessage);

        },
        onCancelFrag01: function () {
            this._oDialog01.close();
        },

        openFragment2: function (fragmentMessage, selectedModel) {
            if (!this._oDialog02) {
                this._oDialog02 = sap.ui.xmlfragment(
                    "clearCompMessageFragment2",
                    "customActivity.fragmentView.clearCompMessageFragment2",

                    this
                );
                this.getView().addDependent(this._oDialog02);
            }
            this._oDialog02.open();

            sap.ui.core.Fragment.byId("clearCompMessageFragment2", "clearCompDiaog2").setModel(selectedModel);
            sap.ui.core.Fragment.byId("clearCompMessageFragment2", "fragmentMessage").setText(fragmentMessage);

        },
        onCancelFrag02: function () {
            this._oDialog02.close();
        },

        onPressDelete1: function () {

            var selectedModelfromDialog = sap.ui.core.Fragment.byId("clearCompMessageFragment1", "clearCompDiaog1")?.getModel();
            var batch = selectedModelfromDialog.BARCODE;
            var consID = selectedModelfromDialog.CONSID;

            var params = {
                "Param.1": batch,
                "Param.2": this.appData.user.userID,
                "Param.3": this.appData.plant,
                "Param.4": this.appData.selected.order.orderNo,
                "Param.5": this.appData.node.nodeID,
                "Param.6": this.appData.selected.operationNo,
                "Param.7": consID,
            };

            var tRunner = new TransactionRunner(
                "MES/UI/ComponentAssignment/Operations/deleteCompXquery",
                params
            );
            tRunner.ExecuteQueryAsync(this, this.callDeleteComp);
            this.onCancelFrag01();
        },

        onPressDelete2: function () {

            var selectedModelfromDialog = sap.ui.core.Fragment.byId("clearCompMessageFragment2", "clearCompDiaog2")?.getModel();
            var batch = selectedModelfromDialog.BARCODE;

            TransactionCaller.async("MES/Itelli/DNA/ClearComponents/deleteComponentTrns", {
                I_BARCODE: batch,
                I_ORDER: this.appData.selected.order.orderNo,
                I_WORKCENTER: this.appData.node.workcenterID,
            },
                "O_JSON",
                this.onPressDeleteCB,
                this,
                "GET"
            );
            this.onCancelFrag02();
        },

        callDeleteComp: function (p_this, p_data) {
            sap.m.MessageToast.show("Kayıt Silindi");
            p_this.getComponents();
            p_this.getDeletedComponents();
        },

        onPressDeleteCB: function (iv_data, iv_scope) {
            if (iv_data[1] == "E") {
                MessageBox.error(iv_data[0]);
                return;
            }
            sap.m.MessageToast.show("Kayıt Silindi - Bu partiyi aynı siparişe tekrar okutamazsınız!");
            iv_scope.getComponents();
            iv_scope.getDeletedComponents();
        },
        onPressDeleteAll: function () {
            return; //bu işlem iptal
        }
    });
});