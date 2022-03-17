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
  ],

  function (
    Controller,
    JSONModel,
    MessageBox,
    customScripts,
    formatter,
    Filter,
    FilterOperator,
    FilterType
  ) {
    // "use strict";
    return Controller.extend(
      "customActivity.controller.oeeComponentAssignment",
      {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         */

        formatter: formatter,

        onInit: function () {
          this.appComponent = this.getView().getViewData().appComponent;
          this.appData = this.appComponent.getAppGlobalData();
          this.interfaces = this.appComponent.getODataInterface();
          this.getComponentList();
        },

        getComponentList: function () {
          var aufnr = this.appData.selected.order.orderNo;
          var params = {"Param.1" : aufnr}
          var tRunner = new TransactionRunner(
            "MES/UI/ComponentAssignment/getComponentListQry",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          var oData = tRunner.GetJSONData();
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(oData[0]);
          this.getView().setModel(oModel, "componentList");
        },

        onClickAddQuantity: function () {
          var oView = this.getView();
          var oDialog = oView.byId("readBarcodeDialog");
          // create dialog lazily
          if (!oDialog) {
            // create dialog via fragment factory
            oDialog = sap.ui.xmlfragment(
              oView.getId(),
              "customActivity.fragmentView.readBarcodeDialog",
              this
            );
            oView.addDependent(oDialog);
          }

          oDialog.open();
          this.byId("inputBarcode").setValue("");
        },

        handleAddConfirm: function (oEvent) {
          var inputBarcode = this.getView().byId("inputBarcode");
          var inputBarcodeValue = inputBarcode.getValue();
          var warning = false;
          for(i=0; i< inputBarcodeValue.length; i++){
            if(inputBarcodeValue[i] == " ")
                var warning = true;
          }

          if (warning) {
            sap.m.MessageToast.show(
              this.appComponent.oBundle.getText("OEE_ERROR_FILL_ALL_INPUTS")
            );
            return;
          }

          var client = this.appData.client;
          var werks = this.appData.plant;
          var nodeID = this.appData.node.nodeID;
          var workcenterID = this.appData.node.workcenterID;
          var userID = this.appData.user.userID;
          var aufnr = this.appData.selected.order.orderNo;
          var aprio = this.appData.selected.operationNo;

          var params = {
            "Param.1": client,
            "Param.2": werks,
            "Param.3": nodeID,
            "Param.4": workcenterID,
            "Param.5": inputBarcodeValue,
            "Param.6": userID,
            "Param.7": aufnr,
            "Param.8": aprio
          };

          var tRunner = new TransactionRunner(
            "MES/UI/ComponentAssignment/insertConsumptionXquery",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
	this.getComponentList();
          this.handleCancel(oEvent);
        },

        handleCancel: function (oEvent) {
          oEvent.oSource.getParent().close();
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
