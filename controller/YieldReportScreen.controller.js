  sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/m/MessageBox",
      "customActivity/scripts/custom",
      "../model/formatter",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
      "customActivity/scripts/customStyle",
      "sap/ui/model/FilterType",
      "sap/ui/core/BusyIndicator",
      "sap/ui/core/Fragment",
      "sap/m/MessageToast",
      "sap/m/MenuItem",
      "customActivity/scripts/transactionCaller",
    ],

    function (
      Controller,
      JSONModel,
      MessageBox,
      customScripts,
      formatter,
      Filter,
      FilterOperator,
      customStyle,
      FilterType,
      BusyIndicator,
      Fragment,
      MessageToast,
      MenuItem,
      TransactionCaller
    ) {
      "use strict";
      return Controller.extend("customActivity.controller.YieldReportScreen", {
        onInit: function () {
          this.appComponent = this.getView().getViewData().appComponent;

          this.appData = this.appComponent.getAppGlobalData();

          this.interfaces = this.appComponent.getODataInterface();
          this.getNameQry()
          this.getPlantQry()
          //this.getPlantData()
        },
        getCastFirstList: function (params) {
        //   let selecteds=this.byId("isYeriMCB").getSelectedItems()
        //   let selectedItems = ""
        // for (let i = 0; i < selecteds.length; i++) {
        //   const element = selecteds[i];
        //   selectedItems =+ element.getKey()
        // }
          TransactionCaller.async(
            "MES/UI/Haddehane/Yield/T_getYieldShortPieceData",
            params,
            "O_JSON",
            this.callCastFirstList,
            this
          );
        },
        getCastSecondList: function (params) {    
        //   let selecteds=this.byId("isYeriMCB").getSelectedItems()
        //   let selectedItems = ""
        // for (let i = 0; i < selecteds.length; i++) {
        //   const element = selecteds[i];
        //   selectedItems =+ element.getKey()
          
        // }
          TransactionCaller.async(
            "MES/UI/Haddehane/Yield/T_getYieldDataByOrder",
            params,
            "O_JSON",
            this.callCastSecondList,
            this
          );
        },
        getCastThirdList: function (params) {
        //   let selecteds=this.byId("isYeriMCB").getSelectedItems()
        //   let selectedItems = ""
        // for (let i = 0; i < selecteds.length; i++) {
        //   const element = selecteds[i];
        //   selectedItems =+ element.getKey()
          
        // }
          //var plant = this.appData.plant;       
          TransactionCaller.async(
            "MES/UI/Haddehane/Yield/T_getYieldDataByShift",
            params,
            "O_JSON",
            this.callCastThirdList,
            this
          );
        },
        callCastFirstList: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }
          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData(myArrr);
            var oTable = iv_scope.getView().byId("idKisaParcaTable");
            oTable.setModel(oModel);
            // iv_scope.getView().setModel(oModel, "idKisaParcaTable");
          return;
        },
        callCastSecondList: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }
          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData(myArrr);
            var oTable = iv_scope.getView().byId("idSiparisBazindaTable");
            oTable.setModel(oModel);
          return;
        },
        callCastThirdList: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }
          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData(myArrr);
            var oTable = iv_scope.getView().byId("idVardiyaBazindaTable");
            oTable.setModel(oModel);
          return;
        },
        onPressSearchFilter: function () {
          if (
            this.byId("isYeriMCB").getSelectedItems() == ""
          )
          {
            MessageBox.error("Lütfen İş Yeri Seçiniz.");
            return false;
          }
          if (
            this.byId("DP1").getValue() == ""
          )
          {
            MessageBox.error("Lütfen tarih giriniz.");
            return false;
          }
          let selecteds=this.byId("isYeriMCB").getSelectedItems()
          let selectedItems = "'",
          plantCB = this.byId("plantCB").getValue(),
          DP1 =  this.byId("DP1").getValue().split(' - ')[0]
        for (let i = 0; i < selecteds.length; i++) {
          const element = selecteds[i];
          selectedItems += element.getKey()
          if(selecteds.length != i+1)
          {
            selectedItems +="','"
          }
        }
        selectedItems += "'"

        let params =   {
          I_PLANT: plantCB,
          I_STARTDATE: DP1,
          I_ARBPL: selectedItems,
        }
          
          this.getCastFirstList(params);
          this.getCastSecondList(params);
          this.getCastThirdList(params);
        },
        getPlantData: function (){
  
          TransactionCaller.async(
            "MES/UI/Haddehane/Yield/getPlantQry",
            {},
            "O_JSON",
            this.callPlantData,
            this
          );
        },
        callPlantData: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }
          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData(myArrr);
            var ıv = iv_scope.getView().byId("idPlant");
            ıv.setModel(oModel);
            // iv_scope.getView().setModel(oModel, "idKisaParcaTable");
          return;
        }, 
        getNameQry: function () {
          var plant = this.getView().byId("plantCB").getSelectedKey();     
          TransactionCaller.async(
            "MES/UI/Haddehane/Yield/getNameQryTrns",
            {
                I_PLANT: plant,
            },
            "O_JSON",
            this.callNameQry,
            this
          );
        },
        callNameQry: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }
          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData(myArrr);
            var oTable = iv_scope.getView().byId("isYeriMCB");
            oTable.setModel(oModel);
          return;
        },
        getPlantQry: function () {
          var plant = this.appData.plant;       
          TransactionCaller.async(
            "MES/UI/Haddehane/Yield/getPlantQryTrns",
            {},
            "O_JSON",
            this.callPlantQry,
            this
          );
        },
        callPlantQry: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }
          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData(myArrr);
            var oTable = iv_scope.getView().byId("plantCB");
            oTable.setModel(oModel);
          return;
        },
      });
    }
  );
