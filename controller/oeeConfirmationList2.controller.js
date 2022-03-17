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
  ],
  function (
    Controller,
    JSONModel,
    MessageBox,
    customScripts,
    formatter,
    Dialog,
    Label,
    MessageToast,
    TextArea,
    Button,
    ButtonType,
    Filter,
    FilterOperator
  ) {
    "use strict";
    var oDialog;
    var oTable;
    return Controller.extend("customActivity.controller.oeeConfirmationList2", {
      formatter: formatter,

      onInit: function () {
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.router = this.appComponent.getRouter();

        var today = new Date();
        var selectedPastTime =
          today.getDate() +
          "." +
          (today.getMonth() + 1) +
          "." +
          today.getFullYear();
        var selectedFutureTime =
          today.getDate() +
          "." +
          (today.getMonth() + 1) +
          "." +
          today.getFullYear();
        this.getView()
          .byId("idDatePicker")
          .setValue(selectedPastTime + " - " + selectedFutureTime);
        this.getData();
      },

      getData: function () {
        var plant = this.appData.plant;
        var workcenterID = this.appData.node.workcenterID;
        var nodeID = this.appData.node.nodeID;

        var filterSearch = this.getView().byId("filterSearch").getValue();
        var workcenterID = this.appData.node.workcenterID;
        var selectedDatePeriod = this.getView().byId("idDatePicker").getValue();
        var selectedSecondDate = new Date(
          this.getView().byId("idDatePicker").getSecondDateValue()
        );
        var selectedSecondNextDate = new Date(selectedSecondDate);
        selectedSecondNextDate.setDate(selectedSecondNextDate.getDate() + 1);
        var selectedSecondNextDateValue =
          selectedSecondNextDate.getDate() +
          "." +
          (selectedSecondNextDate.getMonth() + 1) +
          "." +
          selectedSecondNextDate.getFullYear();
        var selectedDatePeriodValues = selectedDatePeriod.split(" - ");
        var selectConfirmType = this.getView().byId("selectConfirmType").getSelectedKey();

        var params = {
          "Param.1": nodeID,
          "Param.2": selectedDatePeriodValues[0],
          "Param.3": selectedSecondNextDateValue,
          "Param.4": plant,
          "Param.5": selectConfirmType
        };

        var tRunner = new TransactionRunner(
          "MES/UI/ConfirmationList2/getTableDataQry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData()[0].Row;
        var oModel = new JSONModel();
        oModel.setSizeLimit(10000);
        oModel.setData(oData);
        this.getView()
          .byId("tableConfirmed")
          .setModel(oModel, "confirmationList");
      },
      //Teyidi yeniden gondermek icin
      retryConfirmation: function (oEvent) {
        var type = oEvent.getSource().getType();
        var path = oEvent.getSource().getParent().getBindingContextPath();
        path = path.split("/")[1];
        var allData = this.getView()
          .byId("tableConfirmed")
          .getModel("confirmationList")
          .getData();
        var self = this;
        var textMessage;
        if (type == "Emphasized")
          textMessage = "Teyidi iptal etmek istediğinize emin misiniz?";
        else if (type == "Reject")
          textMessage = "Teyidi yeniden göndermek istediğinize emin misiniz?";
        var data = allData[path];
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
                if (type == "Emphasized") {
                  var params = {
                    I_CONF_NUMBER: data.CONF_NUMBER,
                    I_CONF_COUNTER: data.CONF_COUNTER,
                  };
                  var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList2/confirmCancelXquery",
                    params
                  );
                  if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                  }
                } else if (type == "Reject") {
                  var params = {
                    I_ID: data.ID,
                  };
                  var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList/retryQueueConfirmXquery",
                    params
                  );
                  if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                  }
                }
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
            self.getData();
          },
        });
        oDialog.open();
      },

      refreshData: function () {
        this.getData();
      },

      onExit() {
        jQuery.sap.clearIntervalCall(this.getDataRefreshInterval);
        document.getElementById("__button1").style.visibility = "visible";
      },

      onSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();

        var oFilter1 = new sap.ui.model.Filter(
          "AUFNR",
          sap.ui.model.FilterOperator.Contains,
          sQuery
        );
        var oFilter2 = new sap.ui.model.Filter(
          "CASTID",
          sap.ui.model.FilterOperator.Contains,
          sQuery
        );
        var allFilter = new sap.ui.model.Filter(
          [oFilter1, oFilter2],
          false
        );
        oTable = this.getView().byId("tableConfirmed");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(allFilter);
      },

      onPressConf: function () {
        var tableUnfilteredData = this.getView()
          .byId("tableConfirmed")
          .getModel("confirmationList")
          .getData();
        var failedConfirmationList = [];
        for (var i = 0; i < tableUnfilteredData.length; i++) {
          if (tableUnfilteredData[i].STATUS !== "PASSED") {
            failedConfirmationList.push(tableUnfilteredData[i]);
          }
        }
        this.getView()
          .byId("tableConfirmed")
          .getModel("confirmationList")
          .setData(failedConfirmationList);
      },
    });
  }
);