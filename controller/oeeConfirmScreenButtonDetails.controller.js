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
    "sap/ui/core/Fragment",
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
    Fragment,
    Dialog,
    Label,
    Button,
    ButtonType
  ) {
    //"use strict";
    var that;

    var intVal;
    return Controller.extend(
      "customActivity.controller.oeeConfirmScreenButtonDetails",
      {
        formatter: formatter,

        onInit: function () {
          this.appComponent = this.getView().getViewData().appComponent;
          this.appData = this.appComponent.getAppGlobalData();
          this.interfaces = this.appComponent.getODataInterface();
          that = this;
          that.params = this.getView().getViewData().mode.split(":");
          intVal = setInterval(this.refreshData.bind(this), 5000);
          this.getTableDetails();
        },

        refreshData: function () {
          if (window.location.hash.split("/")[2] != "ZACT_REP_QTY_DETAILS") {
            this.clearInt();
            return;
          }
          this.getTableDetails();
        },

        clearInt: function () {
          if (!intVal) return;
          clearInterval(intVal);
          intVal = null;
        },

        callButtonDetailsQry: function (p_this, p_data) {
          var productionTableFragment = p_this
            .getView()
            .byId("productionTableFragment");
          var selectedItem = productionTableFragment.getSelectedItem();
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "buttonDetailsModel");
          productionTableFragment.setSelectedItem(selectedItem);
        },

        getTableDetails: function () {
          var aufnr = this.appData.selected.order.orderNo;
          var params = {
            "Param.1": aufnr,
            "Param.2": that.params[0],
            "Param.3": that.params[1],
            "Param.4": that.params[2],
          };

          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getButtonDetailsQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callButtonDetailsQry);
        },

        callrefreshTableDetails: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "buttonDetailsModel");
        },

        refreshTableDetails: function () {
          var aufnr = this.appData.selected.order.orderNo;
          var params = {
            "Param.1": aufnr,
            "Param.2": that.params[0],
            "Param.3": that.params[1],
            "Param.4": that.params[2],
          };

          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getButtonDetailsQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callrefreshTableDetails);
        },

        onPressDeleteConfirmation: function (oEvent) {
          var oTable = this.getView().byId("productionTableFragment");
          var allData = this.getView().getModel("buttonDetailsModel").oData;
          var chosenRows = oTable.getSelectedItems();

          var textMessage = "Teyidi iptal etmek istediğinize emin misiniz?";
          var self = this;

          var oDialog = new Dialog({
            title: "Yeniden Dene",
            type: "Message",
            content: [
              new Label({
                text: textMessage,
              }),
            ],
            beginButton: new Button("id", {
              type: ButtonType.Accept,
              text: "Onayla",
              press: function () {
                sap.ui.getCore().byId("id").setEnabled(false);
                window.setTimeout(function () {
                  chosenRows.forEach(function (item, index) {
                    var sPath = item.oBindingContexts.buttonDetailsModel.sPath;
                    var chosenRow = sPath.split("/")[1];

                    var data = allData[chosenRow];

                    var params = {
                      I_CONF_NUMBER: data.CONF_NUMBER,
                      I_CONF_COUNTER: data.CONF_COUNTER,
                      I_ENTRYID: data.ENTRY_ID,
                      I_AUFNR: data.AUFNR,
                      I_STATUS: data.STATUS,
                    };
                    var tRunner = new TransactionRunner(
                      "MES/UI/ConfirmationList/confirmCancelXquery",
                      params
                    );
                    if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return null;
                    }
                  }, this);
                  oDialog.close();
                }, 500);
              },
            }),
            endButton: new Button({
              text: "İptal",
              press: function () {
                oDialog.close();
              },
            }),
            afterClose: function () {
              oDialog.destroy();
              self.refreshTableDetails();
            },
          });
          oDialog.open();
        },
      }
    );
  }
);
