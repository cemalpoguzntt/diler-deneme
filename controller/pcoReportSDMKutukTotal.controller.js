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
    return Controller.extend("customActivity.controller.pcoReportSDMKutukTotal", {
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
          "MES/Itelli/CELIKHANE/PCO_REPORT/SDM_KUTUK_TOTAL/T_GETCASTNUMBER",
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
        TransactionCaller.async(
          "MES/Itelli/CELIKHANE/PCO_REPORT/SDM_KUTUK_TOTAL/T_GETTABLEDATA",
          {
            I_ENDDATE: moment(this.byId("idDateRangeSelection").getValue().split(' - ')[1],'YYYY-MM-DD').add('days',1).format('YYYY-MM-DD') ,
            I_STARTDATE: this.byId("idDateRangeSelection").getValue().split(' - ')[0],
            I_CASTNO:this.byId("startCast").getValue()
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
          element.CASTNO = JSON.stringify(element.CASTNO);
          element.PLANT = JSON.stringify(element.PLANT);
          element.YOL1_SICAK_SARJ = JSON.stringify(element.YOL1_SICAK_SARJ);
          element.YOL2_SICAK_SARJ = JSON.stringify(element.YOL2_SICAK_SARJ);
          element.YOL3_SICAK_SARJ = JSON.stringify(element.YOL3_SICAK_SARJ);
          element.YOL4_SICAK_SARJ = JSON.stringify(element.YOL4_SICAK_SARJ);
          element.YOL5_SICAK_SARJ = JSON.stringify(element.YOL5_SICAK_SARJ);
          element.YOL6_SICAK_SARJ = JSON.stringify(element.YOL6_SICAK_SARJ);
          element.YOL1_SOGUK_SARJ = JSON.stringify(element.YOL1_SOGUK_SARJ);
          element.YOL2_SOGUK_SARJ = JSON.stringify(element.YOL2_SOGUK_SARJ);
          element.YOL3_SOGUK_SARJ = JSON.stringify(element.YOL3_SOGUK_SARJ);
          element.YOL4_SOGUK_SARJ = JSON.stringify(element.YOL4_SOGUK_SARJ);
          element.YOL5_SOGUK_SARJ = JSON.stringify(element.YOL5_SOGUK_SARJ);
          element.YOL6_SOGUK_SARJ = JSON.stringify(element.YOL6_SOGUK_SARJ);
          element.SICAGA_GIDEN_AKTUEL = JSON.stringify(element.SICAGA_GIDEN_AKTUEL);
          element.SICAK_SARJ_TOPLAM_KUTUK = JSON.stringify(element.SICAK_SARJ_TOPLAM_KUTUK);
          element.SOGUK_SARJ_TOPLAM_KUTUK = JSON.stringify(element.SOGUK_SARJ_TOPLAM_KUTUK);
        });
       
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(myArrr);

        var oTable = iv_scope.getView().byId("idReportTable");
        oTable.setModel(oModel);
      },
    });
  }
);
