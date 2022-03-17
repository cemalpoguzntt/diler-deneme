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
          "customActivity.controller.fosrap",

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

             
                  getModelData: function () {

                 
                 /*  var date1 = new Date().toDateString();
                  var date2 = new Date().toDateString(); 
                  this.getView().byId("dateRange").setValue(date1 + " - " + date2); */

                  var sql = "SELECT DATE,";

                  
                  var box = [] ;

                  for ( var i = 1 ; i < 25 ; i++) {
                      
                    

                      box[i] = this.getView().byId("box" + i).getSelected() ;
                      
                      }

                  if(box[1] === true) {sql = sql + "A_BKLM," ;}
                  if(box[2] === true) {sql = sql + "A_KON," ;}
                  if(box[3] === true) {sql = sql + "A_DMR," ;}
                  if(box[4] === true) {sql = sql + "A_SIC," ;}
                  if(box[5] === true) {sql = sql + "D1_PH," ;}
                  if(box[6] === true) {sql = sql + "D1_BKLM," ;}
                  if(box[7] === true) {sql = sql + "D2_PH," ;}
                  if(box[8] === true) {sql = sql + "D2_BKLM," ;}
                  if(box[9] === true) {sql = sql + "AB_PH," ;}
                  if(box[10] === true) {sql = sql + "AB_BKLM," ;}
                  if(box[11] === true) {sql = sql + "FD_PH," ;}
                  if(box[12] === true) {sql = sql + "FD_BKLM," ;}
                  if(box[13] === true) {sql = sql + "N_PH," ;}
                  if(box[14] === true) {sql = sql + "N_SIC," ;}
                  if(box[15] === true) {sql = sql + "N_BKLM," ;}
                  if(box[16] === true) {sql = sql + "SB_TA," ;}
                  if(box[17] === true) {sql = sql + "SB_SA," ;}
                  if(box[18] === true) {sql = sql + "SB_SIC," ;}
                  if(box[19] === true) {sql = sql + "SB_BKLM," ;}
                  if(box[20] === true) {sql = sql + "FB_TA," ;}
                  if(box[21] === true) {sql = sql + "FB_SA," ;}
                  if(box[22] === true) {sql = sql + "FB_HIZ," ;}
                  if(box[23] === true) {sql = sql + "FB_SIC," ;}
                  if(box[24] === true) {sql = sql + "FB_BKLM," ;}
                  
                  




               



                  sql =  sql + "SHIFT FROM SAPJAVA1.ZMPM_DNA_FS_PARAM " ;  
                
                  var d1 = (new Date().getDate()).toString();
                  if (d1.length == "1"){ d1 = "0" + d1 ; }
                  else{d1=d1};

                  var m1 = (new Date().getMonth() + 1).toString();
                  if (m1.length == 1){ m1 = "0" + m1 ; }
                  else{m1=m1};

                  var y1 = (new Date().getFullYear()).toString();


                  var d2 = (new Date().getDate()).toString();
                  if (d2.length == 1){ d2 = "0" + d2 ; }
                  else{d2=d2};

                  var m2 = (new Date().getMonth() + 1).toString();
                  if (m2.length == 1){ m2 = "0" + m2 ; }
                  else{m2=m2};

                  var y2 = (new Date().getFullYear()).toString();

                  var startdate = y1 + "-" + m1 + "-" + d1;
                  var enddate = y2 + "-" + m2 + "-" + d2;
                this.getView().byId("dateRange").setValue(startdate + " - " + enddate);

                sql = sql + "  WHERE INSDATE BETWEEN '" + startdate + "T00:00:01' AND '" + enddate + "T23:59:59'" ;         


                      //2021-07-30T11:54:41

                var response = TransactionCaller.sync(
                  "MES/Itelli/SERHAT/SelectBox/T_SELECT",

                  {
                      I_1 : sql

                  },
                  "O_JSON"
              );
              var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
              var tableModel = new sap.ui.model.json.JSONModel(modelArr);
              this.getView().byId("fosrap").setModel(tableModel);
                  
              this.getView().byId("fosrap").getModel().refresh();

             
                

              


                  },







                         

                         Cal: function () {

                          var selectall = this.getView().byId("selectall").getSelected() ;
                          

                          if(selectall === true){

                              for ( var i = 1 ; i < 25 ; i++) {

                                  this.getView().byId("box" + i).setSelected(true);
                                  
                                  }

                             


                          }
                          else {

                              for ( var i = 1 ; i < 25 ; i++) {

                                  this.getView().byId("box" + i).setSelected(false);
                                  
                                  }

                           }



                          

                         },

              Filter: function(){

                  var sql = "SELECT DATE,";

                  
                  var box = [] ;

                  for ( var i = 1 ; i < 25 ; i++) {
                      
                    

                      box[i] = this.getView().byId("box" + i).getSelected() ;
                      
                      }

                  if(box[1] === true) {sql = sql + "A_BKLM," ;}
                  if(box[2] === true) {sql = sql + "A_KON," ;}
                  if(box[3] === true) {sql = sql + "A_DMR," ;}
                  if(box[4] === true) {sql = sql + "A_SIC," ;}
                  if(box[5] === true) {sql = sql + "D1_PH," ;}
                  if(box[6] === true) {sql = sql + "D1_BKLM," ;}
                  if(box[7] === true) {sql = sql + "D2_PH," ;}
                  if(box[8] === true) {sql = sql + "D2_BKLM," ;}
                  if(box[9] === true) {sql = sql + "AB_PH," ;}
                  if(box[10] === true) {sql = sql + "AB_BKLM," ;}
                  if(box[11] === true) {sql = sql + "FD_PH," ;}
                  if(box[12] === true) {sql = sql + "FD_BKLM," ;}
                  if(box[13] === true) {sql = sql + "N_PH," ;}
                  if(box[14] === true) {sql = sql + "N_SIC," ;}
                  if(box[15] === true) {sql = sql + "N_BKLM," ;}
                  if(box[16] === true) {sql = sql + "SB_TA," ;}
                  if(box[17] === true) {sql = sql + "SB_SA," ;}
                  if(box[18] === true) {sql = sql + "SB_SIC," ;}
                  if(box[19] === true) {sql = sql + "SB_BKLM," ;}
                  if(box[20] === true) {sql = sql + "FB_TA," ;}
                  if(box[21] === true) {sql = sql + "FB_SA," ;}
                  if(box[22] === true) {sql = sql + "FB_HIZ," ;}
                  if(box[23] === true) {sql = sql + "FB_SIC," ;}
                  if(box[24] === true) {sql = sql + "FB_BKLM," ;}
                  
                  


                  

               



                sql =  sql + "SHIFT FROM SAPJAVA1.ZMPM_DNA_FS_PARAM " ;  
                console.log(sql) ;
                  var d1 = (this.getView().byId("dateRange").getDateValue().getDate()).toString();
                  if (d1.length == "1"){ d1 = "0" + d1 ; }
                  else{d1=d1};

                  var m1 = (this.getView().byId("dateRange").getDateValue().getMonth() + 1).toString();
                  if (m1.length == 1){ m1 = "0" + m1 ; }
                  else{m1=m1};

                  var y1 = (this.getView().byId("dateRange").getDateValue().getFullYear()).toString();


                  var d2 = (this.getView().byId("dateRange").getSecondDateValue().getDate()).toString();
                  if (d2.length == 1){ d2 = "0" + d2 ; }
                  else{d2=d2};

                  var m2 = (this.getView().byId("dateRange").getSecondDateValue().getMonth() + 1).toString();
                  if (m2.length == 1){ m2 = "0" + m2 ; }
                  else{m2=m2};

                  var y2 = (this.getView().byId("dateRange").getSecondDateValue().getFullYear()).toString();

                  var startdate = y1 + "-" + m1 + "-" + d1;
                  var enddate = y2 + "-" + m2 + "-" + d2;
                this.getView().byId("dateRange").setValue(startdate + " - " + enddate);

                sql = sql + "  WHERE INSDATE BETWEEN '" + startdate + "T00:00:01' AND '" + enddate + "T23:59:59' AND (" ; 
                
                if(box[1] === true) {sql = sql + "A_BKLM != '' OR " ;}
                if(box[2] === true) {sql = sql + "A_KON != '' OR " ;}
                if(box[3] === true) {sql = sql + "A_DMR != '' OR " ;}
                if(box[4] === true) {sql = sql + "A_SIC != '' OR " ;}
                if(box[5] === true) {sql = sql + "D1_PH != '' OR " ;}
                if(box[6] === true) {sql = sql + "D1_BKLM != '' OR " ;}
                if(box[7] === true) {sql = sql + "D2_PH != '' OR " ;}
                if(box[8] === true) {sql = sql + "D2_BKLM != '' OR " ;}
                if(box[9] === true) {sql = sql + "AB_PH != '' OR " ;}
                if(box[10] === true) {sql = sql + "AB_BKLM != '' OR " ;}
                if(box[11] === true) {sql = sql + "FD_PH != '' OR " ;}
                if(box[12] === true) {sql = sql + "FD_BKLM != '' OR " ;}
                if(box[13] === true) {sql = sql + "N_PH != '' OR " ;}
                if(box[14] === true) {sql = sql + "N_SIC != '' OR " ;}
                if(box[15] === true) {sql = sql + "N_BKLM != '' OR " ;}
                if(box[16] === true) {sql = sql + "SB_TA != '' OR " ;}
                if(box[17] === true) {sql = sql + "SB_SA != '' OR " ;}
                if(box[18] === true) {sql = sql + "SB_SIC != '' OR " ;}
                if(box[19] === true) {sql = sql + "SB_BKLM != '' OR " ;}
                if(box[20] === true) {sql = sql + "FB_TA != '' OR " ;}
                if(box[21] === true) {sql = sql + "FB_SA != '' OR " ;}
                if(box[22] === true) {sql = sql + "FB_HIZ != '' OR " ;}
                if(box[23] === true) {sql = sql + "FB_SIC != '' OR " ;}
                if(box[24] === true) {sql = sql + "FB_BKLM != '' OR " ;}

                if (box[1] === false && box[2] === false && box[3] === false && box[4] === false && box[5] === false && box[6] === false && box[7] === false && box[8] === false && box[9] === false && box[10] === false && box[11] === false && box[12] === false && box[13] === false && box[14] === false && box[15] === false && box[16] === false && box[17] === false && box[18] === false && box[19] === false && box[20] === false && box[21] === false && box[22] === false && box[23] === false && box[24] === false ){
                    alert("En az bir adet kolon seçimi yapmanız gereklidir.\nLütfen kolon seçip tekrar deneyiniz.");
                }

                sql = sql.substring(0,sql.length-4);
                sql = sql + ")" ;







                var response = TransactionCaller.sync(
                  "MES/Itelli/SERHAT/SelectBox/T_SELECT",

                  {
                      I_1 : sql

                  },
                  "O_JSON"
              );
              var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
              var tableModel = new sap.ui.model.json.JSONModel(modelArr);
              this.getView().byId("fosrap").setModel(tableModel);
                  
              this.getView().byId("fosrap").getModel().refresh();


              if(box[1] === true) {this.getView().byId("s1").setVisible(true);} else {this.getView().byId("s1").setVisible(false);} 
              if(box[2] === true) {this.getView().byId("s2").setVisible(true);} else {this.getView().byId("s2").setVisible(false);} 
              if(box[3] === true) {this.getView().byId("s3").setVisible(true);} else {this.getView().byId("s3").setVisible(false);} 
              if(box[4] === true) {this.getView().byId("s4").setVisible(true);} else {this.getView().byId("s4").setVisible(false);} 
              if(box[5] === true) {this.getView().byId("s5").setVisible(true);} else {this.getView().byId("s5").setVisible(false);} 
              if(box[6] === true) {this.getView().byId("s6").setVisible(true);} else {this.getView().byId("s6").setVisible(false);} 
              if(box[7] === true) {this.getView().byId("s7").setVisible(true);} else {this.getView().byId("s7").setVisible(false);} 
              if(box[8] === true) {this.getView().byId("s8").setVisible(true);} else {this.getView().byId("s8").setVisible(false);} 
              if(box[9] === true) {this.getView().byId("s9").setVisible(true);} else {this.getView().byId("s9").setVisible(false);} 
              if(box[10] === true) {this.getView().byId("s10").setVisible(true);} else {this.getView().byId("s10").setVisible(false);} 
              if(box[11] === true) {this.getView().byId("s11").setVisible(true);} else {this.getView().byId("s11").setVisible(false);} 
              if(box[12] === true) {this.getView().byId("s12").setVisible(true);} else {this.getView().byId("s12").setVisible(false);} 
              if(box[13] === true) {this.getView().byId("s13").setVisible(true);} else {this.getView().byId("s13").setVisible(false);} 
              if(box[14] === true) {this.getView().byId("s14").setVisible(true);} else {this.getView().byId("s14").setVisible(false);} 
              if(box[15] === true) {this.getView().byId("s15").setVisible(true);} else {this.getView().byId("s15").setVisible(false);} 
              if(box[16] === true) {this.getView().byId("s16").setVisible(true);} else {this.getView().byId("s16").setVisible(false);} 
              if(box[17] === true) {this.getView().byId("s17").setVisible(true);} else {this.getView().byId("s17").setVisible(false);} 
              if(box[18] === true) {this.getView().byId("s18").setVisible(true);} else {this.getView().byId("s18").setVisible(false);} 
              if(box[19] === true) {this.getView().byId("s19").setVisible(true);} else {this.getView().byId("s19").setVisible(false);} 
              if(box[20] === true) {this.getView().byId("s20").setVisible(true);} else {this.getView().byId("s20").setVisible(false);} 
              if(box[21] === true) {this.getView().byId("s21").setVisible(true);} else {this.getView().byId("s21").setVisible(false);} 
              if(box[22] === true) {this.getView().byId("s22").setVisible(true);} else {this.getView().byId("s22").setVisible(false);} 
              if(box[23] === true) {this.getView().byId("s23").setVisible(true);} else {this.getView().byId("s23").setVisible(false);} 
              if(box[24] === true) {this.getView().byId("s24").setVisible(true);} else {this.getView().byId("s24").setVisible(false);} 

              var myColumns=response[0].Rowsets.Rowset.Columns.Column;
              return myColumns;
                
              },

              createColumns : function () {
                var myColumns= this.Filter() //RETURN'Ü ALDI
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
                                 var tableModel = this.getView().byId("fosrap").getModel();
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