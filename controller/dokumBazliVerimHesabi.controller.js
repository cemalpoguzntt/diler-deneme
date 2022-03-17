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
    return Controller.extend("customActivity.controller.dokumBazliVerimHesabi", {
      onInit: function () {
        this.appComponent = this.getView().getViewData().appComponent;

        this.appData = this.appComponent.getAppGlobalData();

        this.interfaces = this.appComponent.getODataInterface();
      },
      changeDatePicker: function () {
     this.getCastNoList();
      },
      getCastNoList: function () {
        var plant = this.appData.plant;       
         TransactionCaller.async(
          "MES/Itelli/CELIKHANE/PCO_REPORT/DOKUM_BAZLI_VERIM_HESABI/T_GETCASTNUMBER",
          {
            I_PLANT: plant,
            I_ENDDATE: moment(this.byId("idDateRangeSelection").getValue().split(' - ')[1],'YYYY-MM-DD').add('days',1).format('YYYY-MM-DD') ,
            I_STARTDATE: this.byId("idDateRangeSelection").getValue().split(' - ')[0],
          },
          "O_JSON",
          this.callCastNoList,
          this
        );
      },
      callCastNoList: function (iv_data, iv_scope) {
        if (iv_data[1] == "E") {
          MessageBox.error(iv_data[0]);
          return;
        }
        var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
          ? iv_data[0]?.Rowsets?.Rowset?.Row
          : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(myArrr);
        iv_scope.getView().setModel(oModel, "castIds");
        return;
      },
      onPressSearchFilter: function () {
        if (
          this.byId("idDateRangeSelection").getValue() == ""
        ) {
          MessageBox.error("Lütfen tarih aralığı giriniz.");
          return false;
        }
        
        this.getTableData();
      },
      getTableData: function () {
        var plant = this.appData.plant;
        TransactionCaller.async(
          "MES/Itelli/CELIKHANE/PCO_REPORT/DOKUM_BAZLI_VERIM_HESABI/T_GETTABLEDATA",
          {
            I_ENDDATE: moment(this.byId("idDateRangeSelection").getValue().split(' - ')[1],'YYYY-MM-DD').add('days',1).format('YYYY-MM-DD') ,
            I_STARTDATE: moment(this.byId("idDateRangeSelection").getValue().split(' - ')[0],'YYYY/MM/DD').format('YYYY-MM-DD'),
            I_WERKS:plant
          },
          "O_JSON",
          this.callGetTableData,
          this
        );
      },
      callGetTableData: function (iv_data, iv_scope) {
        if (iv_data[1] == "E") {
          MessageBox.error(iv_data[0]);
          return;
        }
      
        var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
          ? iv_data[0]?.Rowsets?.Rowset?.Row
          : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          if (myArrr[0] == undefined) {
            MessageBox.error("Bu tarih aralığında bir veri bulunmamaktadır.");
            return false;
          }
        myArrr.forEach((element) => {
          element.CASTID = JSON.stringify(element.CASTID);
          element.ORAN = JSON.stringify(element.ORAN);
          element.HURDA = JSON.stringify(element.HURDA);
          element.KUTUK = JSON.stringify(element.KUTUK);
        });
       
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(myArrr);

        var oTable = iv_scope.getView().byId("idReportTable");
        oTable.setModel(oModel);
      },
    });
  }
);
