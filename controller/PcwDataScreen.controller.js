sap.ui.define(
  [
      "sap/m/MessageBox",
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/m/MessageToast",
      "customActivity/scripts/transactionCaller",
      "sap/ui/core/Fragment",
      "sap/m/Dialog",
      "sap/m/Text",
      "sap/m/TextArea",
      "sap/m/Button",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
      "sap/ui/export/library",
      "sap/ui/export/Spreadsheet",
  ],

  function (
      MessageBox,
      Controller,
      JSONModel,
      MessageToast,
      TransactionCaller,
      Fragment,
      Dialog,
      Text,
      TextArea,
      Button,
      Filter,
      FilterOperator,
      exportLibrary,
      Spreadsheet
  ) {
      "use strict";
      var that;
      var jsonDataForPriorityChange;
      return Controller.extend(
          "customActivity.controller.PcwDataScreen",
          {
              selectedOrder: {
                  orderNumber: "",
                  status: "",
                  routingOperNo: "",
                  productionActivity: "",
                  releasedHeaderID: "",
                  releasedID: "",
                  baseUOM: "",
                  quantityReleased: "",
                  quantityReleasedUOM: "",
                  material: "",
                  startDate: "",
                  startTime: "",
                  activity: "",
                  runID: "",
                  numberOfCapacities: "",
              },

              onInit: function () {
                  that = this;
                  jsonDataForPriorityChange = [];
                  // this.router = sap.ui.core.UIComponent.getRouterFor(this);
                  // this.router.attachRouteMatched(this._fnRouteMatched, this);
                  //  this.router = new sap.ui.core.routing.Router(this);

                  this.appComponent = this.getView().getViewData().appComponent;
                  this.appData = this.appComponent.getAppGlobalData();

                  this.interfaces = this.appComponent.getODataInterface();

                  this.getModelData();
              },                
              kaydet: function () {
                  var Input1 = this.getView().byId("input1").getValue();
                  var Input2 = this.getView().byId("input2").getValue();
                  var Input3 = this.getView().byId("input3").getValue();
                  var Input4 = this.getView().byId("input4").getValue();                   
            
                  var client = this.appData.client;
                  var plant = this.appData.plant;
                  var nodeid = this.appData.node.nodeID;
                  var shift = this.appData.shift.shiftID;
                  var aufnr = this.appData.selected.order.orderNo;
                  var ınsuser = this.appData.user.userID;

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/GergiYuku/T_INSERT_GERGI_YUKU",

                      {                            
                          I_CLIENT: client,
                          I_PLANT: plant,
                          I_NODEID: nodeid,
                          I_SHIFT: shift,
                          I_AUFNR: aufnr,
                          I_INSUSER: ınsuser,
                          I_INPUT1: Input1,
                          I_INPUT2: Input2,
                          I_INPUT3: Input3,
                          I_INPUT4: Input4,
                      },
                      "O_JSON"
                  );
                  if (response[1] == "E") {
                      alert(response[0]);
                  } else {

                      MessageBox.information("Veriler Başarılı bir şekilde kayıt edildi");
                  }

                  this.getModelData();

                  var Input1 = this.getView().byId("input1").setValue("");
                  var Input2 = this.getView().byId("input2").setValue("");
                  var Input3 = this.getView().byId("input3").setValue("");
                  var Input4 = this.getView().byId("input4").setValue("");
              },
              openRaporEkranı: function () {
                  this.getView().byId("gergiYuku").setVisible(false);
                  this.getView().byId("raporBox").setVisible(true);
              },
              openHaddeSerisi: function () {
                  this.getView().byId("raporBox").setVisible(false);
                  this.getView().byId("gergiYuku").setVisible(true);
              },
              searchData: function () {                    
                  var date1 = this.getView().byId("datePicker").getDateValue().toDateString();
                  var date2 = this.getView().byId("datePicker").getSecondDateValue().toDateString();
              
                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/GergiYuku/T_SELECT_TABLE_GERGI",

                      {
                          I_DATE1: date1,
                          I_DATE2: date2,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                  // tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
                  
                  this.getView().byId("gergiYukuTable").setModel(tableModel);
                  this.getView().byId("gergiYukuTable").getModel().refresh();
                  var myColumns=response[0].Rowsets.Rowset.Columns.Column;
                  return myColumns;
              },
              getModelData: function () {
                  var date1 = new Date().toDateString();
                  var date2 = new Date().toDateString();

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/GergiYuku/T_SELECT_TABLE_GERGI",

                      {
                          I_DATE1: date1,
                          I_DATE2: date2,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);  
              
                  this.getView().byId("datePicker").setValue(date1 + " " + "- " + " " + date2);
                  this.getView().byId("gergiYukuTable").setModel(tableModel);                    
                  this.getView().byId("gergiYukuTable").getModel().refresh();
                  var myColumns=response[0].Rowsets.Rowset.Columns.Column;
                  return myColumns;
              },

              createColumns : function () {
                if(this.getView().byId("datePicker").getDateValue()==null){
                  var myColumns= this.getModelData()
                }
                else{
                  var myColumns= this.searchData()
                }
                 
                 var dynamicExcel = [];
                 for(var i=0; i< myColumns.length; i++) {
                     dynamicExcel.push({label: myColumns[i]["@Description"],
                                        property: myColumns[i]["@Description"],
                                        width: '20'
                 });
                 }  
                 return dynamicExcel
             },
             onExport: function (oEvent) {
              var oColumns = this.createColumns();
                                 var tableModel = this.getView().byId("gergiYukuTable").getModel();
                                 if (!(!!tableModel?.oData)) {
                                     MessageBox.error("Tabloda veri bulunmamaktadır.");
                                     return;
                                 }
                                 var oDatas = tableModel.getData();
                                 if (!(!!oDatas)) {
                                     MessageBox.error("Tabloda veri bulunmamaktadır.");
                                     return;
                                 }
                                 var oSettings = {
                                     workbook: {
                                         columns: oColumns
                                     },
                                     dataSource: oDatas,
                                     fileName: "RAPOR" 
                                 };
                                 var oSheet = new Spreadsheet(oSettings);
                                 oSheet.build().then(function () {
                                     MessageToast.show("Tablo Excel'e aktarıldı.");
                                 });
                             },

              PCoGetir: function () {
                  var response = TransactionCaller.sync(
                      "MES/Itelli/DNA/Integration/PC Wire/getPCWProcessParametersTrns",
                      {
                      },
                      "O_JSON"
                  );
                  if (response[1] == "E") {
                      MessageToast(response[0]);
                      return;
                  }
                  var modelData = response[0].Rowsets?.Rowset?.Row;

                  if (!!modelData.MaterialTemperature) {
                      this.getView().byId("input3").setValue(modelData.MaterialTemperature);
                  }
                  if (!!modelData.LineSpeed) {
                      this.getView().byId("input4").setValue(modelData.LineSpeed);
                  }
              },
          }
      );
  }
);
