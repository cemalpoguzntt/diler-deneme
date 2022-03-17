sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/m/MessageBox",
      "sap/m/MessageToast",
      "customActivity/scripts/custom",
      "customActivity/scripts/customStyle",
      "../model/formatter",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
      "sap/ui/model/FilterType",
      "sap/ui/model/Sorter",
      "customActivity/scripts/customStyle",
    ],
  
    function (
      Controller,
      JSONModel,
      MessageBox,
      MessageToast,
      customScripts,
      customStyle,
      formatter,
      Filter,
      FilterOperator,
      FilterType,
      Sorter,
      customStyle
    ) {
      //"use strict";
      var that;
  
      return Controller.extend(
        "customActivity.controller.oeeHotTrestle",
        {
          /**
           * Called when a controller is instantiated and its View controls (if available) are already created.
           * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
           */
  
          formatter: formatter,
  
          onInit: function () {
            this.appComponent = this.getView().getViewData().appComponent;
            this.appData = this.appComponent.getAppGlobalData();
            this.appData.intervalState = true;
            this.interfaces = this.appComponent.getODataInterface();
            
            this.getHotTrestle();
            this.modelServices();
          },


          callHotTrestle: function (p_this, p_data) {
            p_this.getView().byId("tblSingalLogs").setBusy(false);
            var tableData = [];
            var characteristic = [];
            var rows = p_data.Rowsets?.Rowset[0]?.Row;
          //  if (rows === undefined) {
           //   return;
           //  }
            var werks = p_this.appData.plant;
            var workcenterID = p_this.appData.node.workcenterID;
            var aufnr = p_this.appData.selected.order.orderNo;
            var boolean;
            if (rows === undefined) {
              oModel.setData(tableData);
              p_this.getView().setModel(oModel, "signalLogsList");
              return false;
            }
            for (var i = 0; i < rows.length; i++) {
              boolean = true;
              for (var k = 0; k < tableData.length; k++) {
               rows[i].FIELD+i == tableData[k].FIELD+i              
              }
  
              if (boolean) tableData.push(rows[i]);
            }
            
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(tableData);
            p_this.getView().setModel(oModel, "signalLogsList"); 
           
          },
   
	        getHotTrestle: function (oEvent) {

            var tRunner = new TransactionRunner(
              "MES/Test/HHTEST/GetSckSehpa"
            );
            this.getView().byId("tblSingalLogs").setBusy(true);
  
            tRunner.ExecuteQueryAsync(this, this.callHotTrestle);
          },

          modelServices: function () {
            var self = this;
            this.intervalHandle = setInterval(function () {
              if (window.location.hash == "#/activity/ZACT_BILLET_FRNC2") {
                if (self.appData.intervalState == true) {
                  self.getHotTrestle();
                  self.oView.setBusy(false);
                }
              }
            console.log("Sıcak Sehpa sayfa yenileme");
            }, 5000);
          },
  
          changeIntervalState: function (oEvent) {
            oButton = this.getView().byId("chkIntervalState");
            if (this.appData.intervalState == true) {
              this.appData.intervalState = false;
              oButton.setType("Reject");
            } else {
              this.appData.intervalState = true;
              this.getView().byId("chkIntervalState").setType("Accept");
            }
          },
    
        }
      );
    }
  );
  