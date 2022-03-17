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
      "sap/m/MessageToast",
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
      MessageToast
    ) {
      // "use strict";
      return Controller.extend("customActivity.controller.oeeScrapOrderReport", {
        formatter: formatter,
  
        onInit: function () {
          this.appComponent = this.getView().getViewData().appComponent;
          this.appData = this.appComponent.getAppGlobalData();
          this.interfaces = this.appComponent.getODataInterface();
          that = this;
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
          this.getCastIDList();
        },
  
        callCastID: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0]);
          p_this.getView().setModel(oModel, "comboboxCastModel");
          // p_this.getView().byId("comboboxCastNo").setModel(oModel);
        },
  
        getCastIDList: function () {
            var a = new sap.m.BusyDialog()
            a.open()
            a.setBusyIndicatorDelay(40000);
            //write your odata code 
            //after getting the values you have close the dialog
           
          var werks = this.appData.plant;
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
          var selectedDatePeriod = this.getView().byId("idDatePicker").getValue();
          var selectedDatePeriodValues = selectedDatePeriod.split(" - ");
  
          var params = {
            "Param.1": werks,
            "Param.2": selectedDatePeriodValues[0],
            "Param.3": selectedSecondNextDateValue,
          };
          var tRunner = new TransactionRunner(
            "MES/UI/ScrapOrderReport/getCastIDListQry",
            params
          );
  
          tRunner.ExecuteQueryAsync(this, this.callCastID);
           a.close();
        },
  
        callChargesList: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          var oModelSumTable = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0]);
          p_this.getView().setModel(oModel, "tableCharges");
  
          var jsData = p_data.Rowsets.Rowset[0].Row;
  
          var sumCharge1 = 0;
          var sumCharge2 = 0;
          var sumCharge3 = 0;
          var sumCharge4 = 0;
          var sumCharge5 = 0;
          var sumCharges = 0;
  
          for (var i = 0; i < jsData.length; i++) {
            var sumCharge1 = sumCharge1 + jsData[i].CHARGE1;
            var sumCharge2 = sumCharge2 + jsData[i].CHARGE2;
            var sumCharge3 = sumCharge3 + jsData[i].CHARGE3;
            var sumCharge4 = sumCharge4 + jsData[i].CHARGE4;
            var sumCharge5 = sumCharge5 + jsData[i].CHARGE5;
            var sumCharges = sumCharges + jsData[i].SUMQUAN;
          }
  
          p_this.getView().byId("sumCharge1").setText(sumCharge1);
          p_this.getView().byId("sumCharge2").setText(sumCharge2);
          p_this.getView().byId("sumCharge3").setText(sumCharge3);
          p_this.getView().byId("sumCharge4").setText(sumCharge4);
          p_this.getView().byId("sumCharge5").setText(sumCharge5);
          p_this.getView().byId("sumCharges").setText(sumCharges);
        },
        clearTotalCharge:function(){
            this.getView().byId("sumCharge1").setText("");
            this.getView().byId("sumCharge2").setText("");
            this.getView().byId("sumCharge3").setText("");
            this.getView().byId("sumCharge4").setText("");
            this.getView().byId("sumCharge5").setText("");
            this.getView().byId("sumCharges").setText("");
        },
  
        onPressScrapCharge: function () {
           this.clearTotalCharge();
          var castId = this.getView().byId("comboboxCastNo").getValue();
          if (!castId) {
            MessageToast.show(
              this.getView()
                .getModel("i18n")
                .getResourceBundle()
                .getText("OEE_MESSAGE_CASTNO")
            );
            return;
          }
          var reportType = this.getView().byId("reportType").getSelectedKey();
          if (!reportType) {
            MessageToast.show(
              this.getView()
                .getModel("i18n")
                .getResourceBundle()
                .getText("OEE_MESSAGE_REPORT_TYPE")
            );
            return;
          }
          var werks = this.appData.plant;
          var params = {
            "Param.1": werks,
            "Param.2": castId,
            "Param.3": reportType,
          };
          var tRunner = new TransactionRunner(
            "MES/UI/ScrapOrderReport/getScrapOrderReportQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callChargesList);
        },
  
        onPressFormenScrap: function () {
          var origin = window.location.origin;
          var pathname = window.location.pathname;
          var navToPage = "#/activity/ZACT_FORM_SCRAP";
          window.location.href = origin + pathname + navToPage;
        },
  
        onChangeCastNumber: function (oEvent) {
          var rows = this.getView().getModel("comboboxCastModel").oData.Row;
          if (!rows) return;
          var newInformation;
          var castSelected = this.appData.castSelected;
          var type = oEvent.getSource().getType();
          if (type == "Accept") {
            newInformation = rows[parseFloat(castSelected) + 1];
            if (!!newInformation)
              this.appData.castSelected = parseFloat(castSelected) + 1;
          } else if (type == "Reject") {
            newInformation = rows[parseFloat(castSelected) - 1];
            if (!!newInformation)
              this.appData.castSelected = parseFloat(castSelected) - 1;
          }
          if (!!newInformation) {
            var cast = this.getView().byId("comboboxCastNo");
            cast.setValue(newInformation.CASTID);
           // cast.setSelectedKey(newInformation.SUP_AUFNR);
          }
          this.onPressScrapCharge();
        },

        changeCastingNumber: function (oEvent) {
            if (!!oEvent)
              this.appData.castSelected = oEvent.getSource().getSelectedItem().oBindingContexts.comboboxCastModel.sPath.split("/Row/")[1];

              this.onPressScrapCharge();
        },
        changeReportType: function(){
            if(this.getView().byId("comboboxCastNo").getSelectedKey() != "") this.onPressScrapCharge();
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
  