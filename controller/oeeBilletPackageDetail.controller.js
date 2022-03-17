sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/m/MessageBox",
      "sap/m/MessageToast",
      "customActivity/scripts/custom",
      "../model/formatter",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
      "sap/ui/model/FilterType",
      "sap/ui/core/util/Export",
      "sap/ui/core/util/ExportTypeCSV",
      "customActivity/scripts/customStyle",
    ],
  
    function (
      Controller,
      JSONModel,
      MessageBox,
      MessageToast,
      customScripts,
      formatter,
      Filter,
      FilterOperator,
      FilterType,
      Export,
      ExportTypeCSV,
      customScript
    ) {
      //"use strict";
      var that;
  
      return Controller.extend("customActivity.controller.oeeBilletPackageDetail", {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         */
  
        formatter: formatter,
  
        onInit: function () {
	that=this;
          this.appComponent = this.getView().getViewData().appComponent;
          this.appData = this.appComponent.getAppGlobalData();
          this.appData.intervalState = true;
          this.interfaces = this.appComponent.getODataInterface();
          this.getNameFromWorkcenter();
          //Filtrelemede bugünün tarihini seçer
          var today = new Date();
          setYest =
            today.getDate() +
            "." +
            (today.getMonth() + 1) +
            "." +
            today.getFullYear();
          setTom =
            today.getDate() +
            "." +
            (today.getMonth() + 1) +
            "." +
            today.getFullYear();
          this.getView()
            .byId("idDatePicker")
            .setValue(setYest + " - " + setTom);
          this.getPackageDetailListACT();
          //this.modelServices();
          //this.getCASTIDFilter();
          this.getOrderFilter();
         // this.getPackageQuanDetail();
        },
        setTodayMain: function (oEvent) {
          var today = new Date();
          setYest =
            today.getDate() +
            "." +
            (today.getMonth() + 1) +
            "." +
            today.getFullYear();
          setTom =
            today.getDate() +
            "." +
            (today.getMonth() + 1) +
            "." +
            today.getFullYear();
          this.getView()
            .byId("idDatePicker")
            .setValue(setYest + " - " + setTom);
        },
        setTodayReturnedBillet: function (oEvent) {
          var today = new Date();
          setYest =
            today.getDate() +
            "." +
            (today.getMonth() + 1) +
            "." +
            today.getFullYear();
          setTom =
            today.getDate() +
            "." +
            (today.getMonth() + 1) +
            "." +
            today.getFullYear();
          this.getView()
            .byId("idDatePickerReturned")
            .setValue(setYest + " - " + setTom);
        },
        getDateTime: function (oEvent) {
          var dateS = oEvent.getSource().getValue();
          var dateValues = dateS.split(" - ");
          console.log(dateValues[0]);
          console.log(dateValues[1]);
        },
  
 getNameFromWorkcenter :function(){
              var wc = this.appData.node.workcenterID;
              var params = {
                "Param.1": wc
              };
              var tRunner = new TransactionRunner(
               "MES/UI/Haddehane/getNameFromWorkcenterQry",
                params
              );
              tRunner.ExecuteQueryAsync(this, this.callName);
          },
  
  getTotalPlannedQuantity: function (oEvent) {
    var aufnr = this.getView().byId("searchFieldOrder").getValue();
    aufnr =+ aufnr;
    var params = {
        "Param.1": aufnr.toString(),  
      };
      var tRunner = new TransactionRunner(
        "MES/UI/Haddehane/PackageDetail/getTotalPlannedQuantity",
        params
      );
      tRunner.ExecuteQueryAsync(this, this.callTotalPlannedQuantity);
},
callTotalPlannedQuantity: function (p_this, p_data){
    var tableData = p_data;
    var oModel = new sap.ui.model.json.JSONModel();
    oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
    p_this.getView().setModel(oModel, "packageTotalPlanned");
},
        callPackageDetailList: function (p_this, p_data) {
          var tableData = p_data;
          /* // database'den geldiği için yoruma alındı. 09.10.2020 //
                            var tableCharacteristic = p_data.Rowsets.Rowset[0];
                            var rows = p_data.Rowsets.Rowset[0].Row;
                            var characteristic = [];
                            var tableData = [];
                            var boolean;
                        if(!rows)
                            return null;
                    for (var i = 0; i < rows.length; i++) {
                                boolean = true;
                                for (var k = 0; k < tableData.length; k++) {
                                  if (rows[i].KTKID == tableData[k].KTKID) boolean = false;
                                }
                    
                                if (boolean) tableData.push(rows[i]);
                              }
                              for (i = 0; i < rows.length; i++) {
                                for (k = 0; k < tableData.length; k++) {
                                  if (tableData[k].KTKID == rows[i].KTKID)
                                    tableData[k][rows[i].CHARC] = rows[i].CHARC_VALUE;
                                }
                              }
                    */
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
          oModel.setSizeLimit(100000);
          p_this.getView().setModel(oModel, "packageDetailList");
          p_this.getPackageQuanDetail();
          p_this.addRowColor();
          p_this.getTotalPlannedQuantity();
        },

        createColumnConfig: function () {
          return [
            {
              name: "PAKETLEME ZAMANI",
              template: {
                content: "{INSDATE}",
              },
            },
                  {
              name: "VARDIYA",
              template: {
                content: "{SHIFT}",
              },
            },
            {
              name: "YOL",
              template: {
                content: "{NAME}",
              },
            },
           {
              name: "BAG_ID",
              template: {
                content: "{ENTRY_ID}",
              },
            },
            {
              name: "SIPARIS NO",
              template: {
                content: "{AUFNR}",
              },
            },
            {
              name: "DOKUM NO",
              template: {
                content: "{CASTID}",
              },
            },
            {
              name: "KTKID",
              template: {
                content: "{KTKID}",
              },
            },
            {
              name: "CAP",
              template: {
                content: "{Y_CAP_CBK_MM}",
              },
            },
            {
              name: "BOY",
              template: {
                content: "{Y_BOY_CBK_M}",
              },
            },
            {
              name: "STANDART",
              template: {
                content: "{Y_STANDART_CBK}",
              },
            },
            {
              name: "M. KALITE",
              template: {
                content: "{Y_KALITE_CBK}",
              },
            },
            {
              name: "PAKET S.",
              template: {
                content: "{PACKAGE_COUNT}",
              },
            },
            {
              name: "DURUM",
              template: {
                content: "{Y_STATU}",
              },
            },
            {
              name: "Hata K.",
              template: {
                content: "{Y_HATAKODU}",
              },
            },
            {
              name: "AGIRLIK",
              template: {
                content: "{LABEL_WEIGHT}",
              },
            },
           {
              name: "K.AGIRLIK",
              template: {
                content: "{PACKAGE_NET_WEIGHT}",
              },
            },
             {
              name: "FARK",
              template: {
                content: "{FARK}",
              },
            },
            {
              name: "ULKE",
              template: {
                content: "{Y_ULKE}",
              },
            },
           {
              name: "ERP TEYIT NO",
              template: {
                content: "{CONF_NUMBER}",
              },
            },
           {
              name: "ERP TEYIT SAYACI",
              template: {
                content: "{CONF_COUNTER}",
              },
            },
            {
              name: "TEYIT DURUMU",
              template: {
                content: "{QUEUE_MESSAGE}",
              },
            },
          ];
        },

        onDataExport: function (oEvent) {
          var aCols, oExcData, oSettings, oSheet;
          aCols = this.createColumnConfig();
          oExcData = this.getView()
            .getModel("packageDetailList")
            .getProperty("/");
          var oExport = new sap.ui.core.util.Export({
            exportType: new sap.ui.core.util.ExportTypeCSV({
              separatorChar: "\t",
              mimeType: "application/vnd.ms-excel",
              charset: "utf-8",
              fileExtension: "xls",
            }),
            models: oExcData,
            rows: {
              path: "/",
            },
            columns: aCols,
          });
          oExport.setModel(this.getView().getModel("packageDetailList"));
  
          oExport.saveFile("Kutuk_Takip_Data").always(function () {
            //    this.destroy();
          });
        },
  
	getPackageDetailListACT: function (oEvent) {
          var wc_name = this.appData.name;
          var werks = this.appData.plant;
          var aufnr = this.appData.selected.order.orderNo;
          var workcenterid = this.appData.node.workcenterID;
	 this.getView().byId("searchFieldOrder").setValue(aufnr);
          var dateS = this.getView().byId("idDatePicker").getValue();
          var pickerSecondDate = new Date(
            this.getView().byId("idDatePicker").getSecondDateValue()
          );
          var tomorrowDay = new Date(pickerSecondDate);
          tomorrowDay.setDate(tomorrowDay.getDate() + 1);
          var secondaryDate =
            tomorrowDay.getDate() +
            "." +
            (tomorrowDay.getMonth() + 1) +
            "." +
            tomorrowDay.getFullYear();
          var dateValues = dateS.split(" - ");
          var params = {
            "Param.1": werks,
            "Param.2": workcenterid,
            "Param.3": dateValues[0],
            "Param.4": secondaryDate,
            "Param.5": aufnr,  
          };
          var tRunner = new TransactionRunner(
            "MES/UI/Haddehane/PackageDetail/getPackageDetailListQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callPackageDetailList);
        },


      getPackageDetailList: function (oEvent) {
          var wc_name = this.appData.name;
          var werks = this.appData.plant;
          //var aufnr = this.appData.selected.order.orderNo;
          var workcenterid = this.appData.node.workcenterID;

          var dateS = this.getView().byId("idDatePicker").getValue();
        //  var castParameter = this.getView().byId("searchFieldCASTID").getValue();
          var orderParameter = this.getView().byId("searchFieldOrder").getValue();
            if (!orderParameter) {
              MessageToast.show(
                this.appComponent.oBundle.getText("Sipariş Seçmelisiniz!")
              );
              return false;
            }
          var pickerSecondDate = new Date(
            this.getView().byId("idDatePicker").getSecondDateValue()
          );
          var tomorrowDay = new Date(pickerSecondDate);
          tomorrowDay.setDate(tomorrowDay.getDate() + 1);
          var secondaryDate =
            tomorrowDay.getDate() +
            "." +
            (tomorrowDay.getMonth() + 1) +
            "." +
            tomorrowDay.getFullYear();
          var dateValues = dateS.split(" - ");
          if (!orderParameter) orderParameter = "";
          var params = {
            "Param.1": werks,
            "Param.2": workcenterid,
            "Param.3": dateValues[0],
            "Param.4": secondaryDate,
            "Param.5": orderParameter,  
          };
          var tRunner = new TransactionRunner(
            "MES/UI/Haddehane/PackageDetail/getPackageDetailListQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callPackageDetailList);
        },
  

  getPackageDailyList: function (oEvent) {
          var wc_name = this.appData.name;
          var werks = this.appData.plant;
          //var aufnr = this.appData.selected.order.orderNo;
          var workcenterid = this.appData.node.workcenterID;

          var dateS = this.getView().byId("idDatePicker").getValue();
        //  var castParameter = this.getView().byId("searchFieldCASTID").getValue();
         // var orderParameter = this.getView().byId("searchFieldOrder").getValue();
          var pickerSecondDate = new Date(
            this.getView().byId("idDatePicker").getSecondDateValue()
          );
          var tomorrowDay = new Date(pickerSecondDate);
          tomorrowDay.setDate(tomorrowDay.getDate() + 1);
          var secondaryDate =
            tomorrowDay.getDate() +
            "." +
            (tomorrowDay.getMonth() + 1) +
            "." +
            tomorrowDay.getFullYear();
          var dateValues = dateS.split(" - ");
          var params = {
            "Param.1": werks,
            "Param.2": workcenterid,
            "Param.3": dateValues[0],
            "Param.4": secondaryDate,
            "Param.5": ""
          };
          var tRunner = new TransactionRunner(
            "MES/UI/Haddehane/PackageDetail/getPackageDetailListQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callPackageDailyList);
        },

  callPackageDailyList: function (p_this, p_data) {
          var tableData = p_data;
          var daily = "X";
          var oModel = new sap.ui.model.json.JSONModel();
         oModel.setSizeLimit(2000);
          oModel.setData(tableData.Rowsets.Rowset[0]?.Row);         
          p_this.getView().setModel(oModel, "packageDetailList"); 
         p_this.getPackageQuanDetail(daily);
         p_this.addRowColor();
  
        },

    getPackageQuanDetail: function (daily) {
          var wc_name = this.appData.name;
          var werks = this.appData.plant;
          //var aufnr = this.appData.selected.order.orderNo;
          var workcenterid = this.appData.node.workcenterID;

          var dateS = this.getView().byId("idDatePicker").getValue();
        //  var castParameter = this.getView().byId("searchFieldCASTID").getValue();
          var orderParameter = this.getView().byId("searchFieldOrder").getValue();
          var pickerSecondDate = new Date(
            this.getView().byId("idDatePicker").getSecondDateValue()
          );
          var tomorrowDay = new Date(pickerSecondDate);
          tomorrowDay.setDate(tomorrowDay.getDate() + 1);
          var secondaryDate =
            tomorrowDay.getDate() +
            "." +
            (tomorrowDay.getMonth() + 1) +
            "." +
            tomorrowDay.getFullYear();
          var dateValues = dateS.split(" - ");
          if (!orderParameter) orderParameter = "";
          var params = {
            "Param.1": werks,
            "Param.2": workcenterid,
            "Param.3": dateValues[0],
            "Param.4": secondaryDate,
            "Param.5": orderParameter,  
          };
       if(daily == "X"){
          var tRunner = new TransactionRunner(
            "MES/UI/Haddehane/PackageDetail/getPackageQuanDailyQry",
            params
          );
} else {
            var tRunner = new TransactionRunner(
            "MES/UI/Haddehane/PackageDetail/getPackageQuanDetailQry",
            params
          );
}
          tRunner.ExecuteQueryAsync(this, this.callPackageQuanDetail);
        },
  

   callPackageQuanDetail: function (p_this, p_data) {
          var tableData = p_data;
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
          p_this.getView().setModel(oModel, "packageQuanDetail");
  
        },
     
        /* getCASTIDFilter: function () {
          var params = { "Param.1": this.appData.plant };
          var tRunner = new TransactionRunner(
            "MES/UI/Haddehane/getFilterCastIdMonitorQry",
            params
          );
          if (!tRunner.Execute()) return null;
          var oData = tRunner.GetJSONData();
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(oData[0]);
          this.getView().setModel(oModel, "castFilterModel");
        },
*/
      
        getOrderFilter: function () {
        var dateS = this.getView().byId("idDatePicker").getValue();
        var pickerSecondDate = new Date(
            this.getView().byId("idDatePicker").getSecondDateValue()
          );
          var tomorrowDay = new Date(pickerSecondDate);
          tomorrowDay.setDate(tomorrowDay.getDate() + 1);
          var secondaryDate =
            tomorrowDay.getDate() +
            "." +
            (tomorrowDay.getMonth() + 1) +
            "." +
            tomorrowDay.getFullYear();
          var dateValues = dateS.split(" - ");
          var params = { 
           "Param.1": this.appData.plant,
           "Param.2":this.appData.node.workcenterID,
            "Param.3": dateValues[0],
            "Param.4": secondaryDate
};
          var tRunner = new TransactionRunner(
            "MES/UI/Haddehane/PackageDetail/getFilterOrderMonitorQry",
            params
          );
          if (!tRunner.Execute()) return null;
          var oData = tRunner.GetJSONData();
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(oData[0]);
          this.getView().setModel(oModel, "orderFilterModel");
        },
 
  
        handleCancel: function () {
          this.appData.oDialog.destroy(); 
        },
      
  
        modelServices: function () {
          var self = this;
          this.intervalHandle = setInterval(function () {
            if (window.location.hash == "#/activity/ZACT_PACKAGE_DETAIL") {
              if (self.appData.intervalState == true) {
             self.getBilletList();
             self.getRemaningPackageQuan();
}
            }
            console.log("ktk takip sayfa yenileme");
          }, 5000);
        },
  
        refreshData: function (oEvent) {
          this.getConfirmReportList();
        },

   addRowColor: function () {
                var status;
                var items = this.getView().byId("tblPackageDetail").getItems();
                for (i = 0; i < items.length; i++) {
                    items[i].removeStyleClass("E");
                    status = this.getView().getModel("packageDetailList").oData[i]
                        .SUCCESS;
                    items[i].addStyleClass(status);
                }
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
  