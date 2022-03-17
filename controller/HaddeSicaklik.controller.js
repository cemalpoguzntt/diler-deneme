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
      var EdmType = exportLibrary.EdmType;
      return Controller.extend(
          "customActivity.controller.HaddeSicaklik",

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
                  this.appComponent = this.getView().getViewData().appComponent;
                  this.appData = this.appComponent.getAppGlobalData();
                  this.interfaces = this.appComponent.getODataInterface();
                  this.getModelData() ;
                  

              },

              
              Execute : function (){


                  var input1 = this.getView().byId("input1").getValue() ;
                  var input11 = this.getView().byId("input11").getValue() ;
                  var input2 = this.getView().byId("input2").getValue() ;
                  var input22 = this.getView().byId("input22").getValue() ;
                  var input3 = this.getView().byId("input3").getValue() ;
                  var input33 = this.getView().byId("input33").getValue() ;
                  var input4 = this.getView().byId("input4").getValue() ;
                  var input44 = this.getView().byId("input44").getValue() ;
                  var input5 = this.getView().byId("input5").getValue() ;
                  var input55 = this.getView().byId("input55").getValue() ;
                  var input6 = this.getView().byId("input6").getValue() ;
                  var input66 = this.getView().byId("input66").getValue() ;
                  var input7 = this.getView().byId("input7").getValue() ;
                  var input77 = this.getView().byId("input77").getValue() ;
                  var input8 = this.getView().byId("input8").getValue() ;
                  var input88 = this.getView().byId("input88").getValue() ;
                  var input9 = this.getView().byId("input9").getValue() ;
                  var input99 = this.getView().byId("input99").getValue() ;

                  var client = this.appData.client;
                  var plant = this.appData.plant;
                  var nodeid = this.appData.node.nodeID;
                  var shift = this.appData.shift.shiftID;
                  var aufnr = this.appData.selected.order.orderNo;
                  var insuser =  this.appData.user.userID ;
                  

                  var response = TransactionCaller.sync(
          "MES/Itelli/HADDESICAKLIK/T_INSERT",
          {
            
            I_1 : input1,
                          I_11 : input11,
                          I_2 : input2,
                          I_22 : input22,
                          I_3 : input3,
                          I_33 : input33,
                          I_4 : input4,
                          I_44 : input44,
                          I_5 : input5,
                          I_55 : input55,
                          I_6 : input6,
                          I_66 : input66,
                          I_7 : input7,
                          I_77 : input77,
                          I_8 : input8,
                          I_88 : input88,
                          I_9 : input9,
                          I_99 : input99,
                          I_AUFNR : aufnr,
                          I_CLIENT : client,
                          I_INSUSER : insuser, 
                          I_NODE_ID : nodeid,
                          I_PLANT : plant,
                          I_SHIFT : shift
          },
          "O_JSON"
        );

        if (response[1] == "E") {
          alert(response[0]);
        } else {
          

          MessageBox.information("Veriler Başarılı bir şekilde kayıt edildi");
        }
                  this.getView().byId("input1").setValue("") ;
                  this.getView().byId("input11").setValue("") ;
                  this.getView().byId("input2").setValue("") ;
                  this.getView().byId("input22").setValue("") ;
                  this.getView().byId("input3").setValue("") ;
                  this.getView().byId("input33").setValue("") ;
                  this.getView().byId("input4").setValue("") ;
                  this.getView().byId("input44").setValue("") ;
                  this.getView().byId("input5").setValue("") ;
                  this.getView().byId("input55").setValue("") ;
                  this.getView().byId("input6").setValue("") ;
                  this.getView().byId("input66").setValue("") ;
                  this.getView().byId("input7").setValue("") ;
                  this.getView().byId("input77").setValue("") ;
                  this.getView().byId("input8").setValue("") ;
                  this.getView().byId("input88").setValue("") ;
                  this.getView().byId("input9").setValue("") ;
                  this.getView().byId("input99").setValue("") ;

                  
                  
                  this.getModelData();
                  



              },

              Transfer1: function () {

                  this.getView().byId("box0").setVisible(false);
                  this.getView().byId("raporBox").setVisible(true);


              },

              Transfer2: function () {

                  this.getView().byId("box0").setVisible(true);
                  this.getView().byId("raporBox").setVisible(false);


              },

              Search: function () {
                  var startdate = this.getView().byId("dateRange").getDateValue().toDateString() ;
                  var enddate = this.getView().byId("dateRange").getSecondDateValue().toDateString() ;
                  
                 
                 

                  /* this.getView().byId("dateRange").setValue(startdate + " - " + enddate);  */

                  


                  var response = TransactionCaller.sync(
                      "MES/Itelli/HADDESICAKLIK/T_SELECT",

                      {
                          I_DATE1: startdate,
                          I_DATE2: enddate,
                          

                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                  

                  

                  
                  this.getView().byId("HaddeSicaklik").setModel(tableModel);
                 
                  this.getView().byId("HaddeSicaklik").getModel().refresh();
                  var myColumns=response[0].Rowsets.Rowset.Columns.Column;
                  return myColumns;
              },

              getModelData: function () {

                 
                  var date1 = new Date().toDateString();
                  var date2 = new Date().toDateString(); 
                  this.getView().byId("dateRange").setValue(date1 + " - " + date2);

                  

                  


                  var response = TransactionCaller.sync(
                      "MES/Itelli/HADDESICAKLIK/T_SELECT",

                      {
                          I_DATE1: date1,
                          I_DATE2: date2,
                          

                      },
                      "O_JSON"
                  );
                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                  // tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);  
                 
                  
                  

                 

              
                  this.getView().byId("HaddeSicaklik").setModel(tableModel);
                  
                  this.getView().byId("HaddeSicaklik").getModel().refresh();
                  var myColumns=response[0].Rowsets.Rowset.Columns.Column;
                  return myColumns;
              },

              createColumns : function () {
                if(this.getView().byId("dateRange").getDateValue()==null){
                  var myColumns= this.getModelData()
                }
                else{
                  var myColumns= this.Search()
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
                                 var tableModel = this.getView().byId("HaddeSicaklik").getModel();
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



              
           




          }
      );
  }
);