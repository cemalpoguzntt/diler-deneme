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

], function (Controller,
    JSONModel,
    MessageBox,
    customScripts,
    formatter,
    Filter,
    FilterOperator,
    FilterType,
    MessageToast) {
    "use strict";

    return Controller.extend("customActivity.controller.oeeShiftStaff", {

        onInit: function () {
            this.appComponent = this.getView().getViewData().appComponent;
            this.appData = this.appComponent.getAppGlobalData();
            this.interfaces = this.appComponent.getODataInterface();
            this.appData.intervalState = true;
            this.setWorkplace();
            this.getAllStaff();
            this.modelServices();
        },
        setWorkplace: function () {
            if (this.appData.plant == "2002") {
                this.getView().byId("idWorkplace").setVisible(true);
            }
        },
        getAllStaff: function () {
            var nodeID = this.appData.node.nodeID;
            var client = this.appData.client;
            var werks = this.appData.plant;
            var shiftID = this.appData.shift.shiftID;
            var params = {
                "Param.3": nodeID,
                "Param.1": client,
                "Param.2": werks,
                "Param.4": shiftID,
            };
            var tRunner = new TransactionRunner(
                "MES/UI/StaffShift/getCurrentShiftStaff",
                params
            );
            tRunner.ExecuteQueryAsync(this, this.callAllStaff);
        },
        callAllStaff: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(p_data.Rowsets.Rowset[0]);
            p_this.getView().setModel(oModel, "currentShiftStaff");
        },
        insertStaffDetailData: function (oEvent) {
            if (!this.appData.shift.isCurrentShift) {
                MessageBox.error("Sadece aktif vardiyada işlem yapabilirsiniz.");
                return null;
            }
            var persNo = this.getView().byId("persNo").getValue();
            if (persNo == "") {
                this.getView().byId("persNo").setValueState(sap.m.ValueColor.Error);
                return false;
            }
            var nodeID = this.appData.node.nodeID;
            var nodeName = this.appData.node.description;
            var shiftID = this.appData.shift.shiftID;
            var client = this.appData.client;
            var werks = this.appData.plant;
            var user = this.appData.user.userID;
            var params = {
                "I_PERSNO": persNo,
                "I_NODEID": nodeID,
                "I_NODENAME": nodeName,
                "I_CLIENT": client,
                "I_WERKS": werks,
                "I_ZSHIFT": shiftID,
                "I_INSUSER": user,
            };
            var tRunner = new TransactionRunner(
                "MES/UI/StaffShift/insertStaff/insertStaffXquery",
                params
            );
            if (!tRunner.Execute()) {
                MessageBox.error(tRunner.GetErrorMessage());
                return null;
            }
            MessageBox.alert("Başarılı");
            this.getAllStaff();
        },
        staffSelected: function (oEvent) {
            var stat = this.getView().byId("operatorTable").getSelectedItems().length;

            if (stat > 0)
                this.appData.intervalState = false;
            else
                this.appData.intervalState = true;

        },
        logoutStaff: function (oEvent) {
            var oTable = this.getView().byId("operatorTable");
            var tableModel = this.getView().getModel("currentShiftStaff").oData;
            var selectedStaffList = [];
            var oSelectedRowLength = oTable.getSelectedContexts().length;
            for (var i = 0; i < oSelectedRowLength; i++) {
                var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                var selectedRow = selectedRowPath.split("/")[2];
                var persNo = tableModel.Row[selectedRow].PERNR;
                selectedStaffList.push(persNo);
            }
            var nodeID = this.appData.node.nodeID;
            var shiftID = this.appData.shift.shiftID;
            var client = this.appData.client;
            var werks = this.appData.plant;
            var user = this.appData.user.userID;
            var params = {
                I_NODEID: nodeID,
                I_CLIENT: client,
                I_WERKS: werks,
                I_SHIFTID: shiftID,
                I_USER: user,
                StaffList: selectedStaffList.toString(),
            };
            var tRunner = new TransactionRunner(
                "MES/UI/StaffShift/logoutStaff/logoutStaffXquery",
                params
            );
            if (!tRunner.Execute()) {
                MessageBox.error(tRunner.GetErrorMessage());
                return null;
            }
            MessageBox.alert("Başarılı");
            this.getAllStaff();
            /* tRunner.ExecuteQueryAsync(this, this.callLogoutStaff);*/

        },
        callLogoutStaff: function (p_this, p_data) {
            MessageBox.alert("Başarılı");
        },
        modelServices: function () {
            var self = this;
            self.staffSelected();
            this.intervalHandle = setInterval(function () {
                if (window.location.hash == "#/activity/ZACT_SHIFT_STAFF") {
                    if (self.appData.intervalState == true)
                        self.getAllStaff();
                }
            }, 3500);
        },

    });
});