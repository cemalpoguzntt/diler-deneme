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
      "customActivity/scripts/custom",
      "customActivity/scripts/customStyle",
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
      Spreadsheet,
      customScripts,
      customStyle
  ) {
      "use strict";
      var that;
      var jsonDataForPriorityChange;
      var EdmType = exportLibrary.EdmType;
      return Controller.extend(
          "customActivity.controller.orme",

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
                  this.getModelData();
                  this.getTolerans();



              },

              Execute: function () {

                  var input1 = this.getView().byId("input1").getValue(); // gergi yükü kg
                  var input2 = this.getView().byId("input2").getValue(); // gergi yükü kn
                  var input3 = this.getView().byId("input3").getValue(); // fırın sıcaklığı
                  var input4 = this.getView().byId("input4").getValue(); // soğutma çıkışı halat sıcaklığı
                  var input5 = this.getView().byId("input5").getValue(); //sogutma havuzu
                  var input6 = this.getView().byId("input6").getValue(); // örüm yönü
                  var input7 = this.getView().byId("input7").getValue(); // lay uzunluğu
                  var input8 = this.getView().byId("input8").getValue(); // makine hızı

                  var aufnr = parseFloat(this.appData.selected.order.orderNo);



                  var params = {
                      "Param.1": aufnr
                  };
                  var tRunner = new TransactionRunner("MES/Itelli/DNA/OrmeToleranslar/getCharValues", params);
                  if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return;
                  }
                  var oData = tRunner?.GetJSONData();
                  var cap = parseFloat(oData[0]?.Row[0]?.CAP);
                  var kalite = oData[0]?.Row[0]?.KALITE;

                  var client = this.appData.client;
                  var plant = this.appData.plant;
                  var nodeid = this.appData.node.nodeID;
                  var shift = this.appData.shift.shiftID;
                  var aufnr = this.appData.selected.order.orderNo;
                  var insuser = this.appData.user.userID;






                  var response = TransactionCaller.sync(
                      "MES/Itelli/ORME/T_INSERT",
                      {

                          I_1: input1,
                          I_2: input2,
                          I_3: input3,
                          I_4: input4,
                          I_5: input5,
                          I_6: input6,
                          I_7: input7,
                          I_8: input8,
                          I_AUFNR: aufnr,
                          I_CLIENT: client,
                          I_INSUSER: insuser,
                          I_NODE_ID: nodeid,
                          I_PLANT: plant,
                          I_SHIFT: shift,
                          I_CAP: cap,
                          I_KALITE: kalite
                      },
                      "O_JSON"
                  );

                  if (response[1] == "E") {
                      alert(response[0]);
                  } else {


                      MessageBox.information("Veriler Başarılı bir şekilde kayıt edildi");
                  }

                  this.getView().byId("input1").setValue("");
                  this.getView().byId("input2").setValue("");
                  this.getView().byId("input3").setValue("");
                  this.getView().byId("input4").setValue("");
                  this.getView().byId("input5").setValue("");
                  this.getView().byId("input6").setValue("");
                  this.getView().byId("input7").setValue("");
                  this.getView().byId("input8").setValue("");

                  this.getModelData();


              },

              Transfer1: function () {

                  this.getView().byId("raporBox1").setVisible(false);
                  this.getView().byId("raporBox").setVisible(true);


              },

              Transfer2: function () {

                  this.getView().byId("raporBox1").setVisible(true);
                  this.getView().byId("raporBox").setVisible(false);


              },

              Search: function () {
                  var startdate = this.getView().byId("dateRange").getDateValue().toDateString();
                  var enddate = this.getView().byId("dateRange").getSecondDateValue().toDateString();




                  /* this.getView().byId("dateRange").setValue(startdate + " - " + enddate);  */




                  var response = TransactionCaller.sync(
                      "MES/Itelli/ORME/T_SELECT",

                      {
                          I_DATE1: startdate,
                          I_DATE2: enddate,


                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);






                  this.getView().byId("ormereport").setModel(tableModel);

                  this.getView().byId("ormereport").getModel().refresh();
                  var myColumns=response[0].Rowsets.Rowset.Columns.Column;
                  return myColumns;
              },

              getModelData: function () {


                  var date1 = new Date().toDateString();
                  var date2 = new Date().toDateString();
                  this.getView().byId("dateRange").setValue(date1 + " - " + date2);


                  var response = TransactionCaller.sync(
                      "MES/Itelli/ORME/T_SELECT",

                      {
                          I_DATE1: date1,
                          I_DATE2: date2,


                      },
                      "O_JSON"
                  );
                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                  this.getView().byId("ormereport").setModel(tableModel);

                  this.getView().byId("ormereport").getModel().refresh();
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
                                 var tableModel = this.getView().byId("ormereport").getModel();
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
                      "MES/Itelli/DNA/Integration/getOrmeProcessParametersTrns",

                      {

                      },
                      "O_JSON"
                  );

                  var modelData = response[0].Rowsets?.Rowset?.Row;

                  if (modelData.SAP_Orme1_Orum_yonu == 1) {
                      var orumYonu = "Sağ";
                  }
                  else if (modelData.SAP_Orme1_Orum_yonu == 0) {
                      var orumYonu = "Sol";
                  }

                  this.getView().byId("input1").setValue(modelData.SAP_Orme1_Gergi_KG.toFixed(2)); // gergi yükü kg
                  var inputIdPCo = "input1";
                  this.WarningPCo(inputIdPCo);
                  this.getView().byId("input2").setValue(modelData.SAP_Orme1_gergi.toFixed(2)); // gergi yükü kn
                  var inputIdPCo = "input2";
                  this.WarningPCo(inputIdPCo);
                  this.getView().byId("input3").setValue(modelData.SAP_Orme1_firin_sicaklik.toFixed(2)); // fırın sıcaklığı
                  var inputIdPCo = "input3";
                  this.WarningPCo(inputIdPCo);
                  this.getView().byId("input4").setValue(modelData.SAP_Orme1_tank_cikisi_sicaklik.toFixed(2)); // soğutma çıkışı halat sıcaklığı
                  var inputIdPCo = "input4";
                  this.WarningPCo(inputIdPCo);
                  this.getView().byId("input5").setValue(modelData.SAP_Orme1_Tank_su_sicaklik.toFixed(2)); //sogutma havuzu
                  var inputIdPCo = "input5";
                  this.WarningPCo(inputIdPCo);
                  this.getView().byId("input6").setValue(orumYonu); // örüm yönü                    
                  this.getView().byId("input7").setValue(modelData.SAP_Orme1_Lay_length.toFixed(2)); // lay uzunluğu
                  var inputIdPCo = "input7";
                  this.WarningPCo(inputIdPCo);
                  this.getView().byId("input8").setValue(modelData.SAP_Orme1_hiz.toFixed(2)); // makine hızı
                  var inputIdPCo = "input8";
                  this.WarningPCo(inputIdPCo);



              },

              getTolerans: function () {


                  var aufnr = parseFloat(this.appData.selected.order.orderNo);



                  var params = {
                      "Param.1": aufnr
                  };
                  var tRunner = new TransactionRunner("MES/Itelli/DNA/OrmeToleranslar/getCharValues", params);
                  if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return;
                  }
                  var oData = tRunner?.GetJSONData();
                  var cap = parseFloat(oData[0]?.Row[0]?.CAP);
                  var kalite = oData[0]?.Row[0]?.KALITE;
                  this.getView().byId("ActiveCap").setText(cap + " mm");
                  this.getView().byId("ActiveKalite").setText(kalite);



                  var params = {
                      "Param.1": cap,
                      "Param.2": kalite
                  };
                  var tRunner = new TransactionRunner("MES/Itelli/DNA/OrmeToleranslar/Q_SELECT", params);
                  if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return;
                  }
                  var oDataSelect = tRunner?.GetJSONData();


                  if (!!!oDataSelect[0]?.Row) {
                      return;
                  } else {
                      var obj = oDataSelect[0]?.Row[0];

                      var result = Object.keys(obj).map((key) => [Number(key), obj[key]]);
                      for (let i = 1, j = 8, k = 9; i < 6 && j < 18 && k < 18; i++, j += 2, k += 2) {
                          this.getView().byId("input" + i + "-1").setText("Min: " + result[j][1])
                          this.getView().byId("input" + i + "-2").setText("Max: " + result[k][1])
                      }
                      for (let i = 7, j = 18, k = 19; i < 9 && j < 22 && k < 22; i++, j += 2, k += 2) {
                          this.getView().byId("input" + i + "-1").setText("Min: " + result[j][1])
                          this.getView().byId("input" + i + "-2").setText("Max: " + result[k][1])
                      }
                  }



              },

              WarningPCo: function (inputIdPCo) {

                  var inputValue = this.getView().byId(inputIdPCo).getValue();

                  var minValue = parseFloat(this.getView().byId(inputIdPCo + "-1")?.getText().split(":")[1])
                  var maxValue = parseFloat(this.getView().byId(inputIdPCo + "-2")?.getText().split(":")[1])

                  if (!((minValue <= inputValue) && (inputValue <= maxValue)) && (inputValue != "")) {
                      document.getElementById(this.getView().byId(inputIdPCo).sId + "-inner").classList.add("neon");
                      document.getElementById(this.getView().byId(inputIdPCo + "-1").sId).classList.add("neon");
                      document.getElementById(this.getView().byId(inputIdPCo + "-2").sId).classList.add("neon");
                  } else {
                      document.getElementById(this.getView().byId(inputIdPCo).sId + "-inner").classList.remove("neon");
                      document.getElementById(this.getView().byId(inputIdPCo + "-1").sId).classList.remove("neon");
                      document.getElementById(this.getView().byId(inputIdPCo + "-2").sId).classList.remove("neon");
                  }


              },

              Warning: function (oEvent) {


                  var inputid = oEvent?.getSource()?.sId;

                  var inputValue = oEvent?.getSource()?.getValue();


                  var minValue = parseFloat(this.getView().byId(inputid + "-1")?.getText().split(":")[1])
                  var maxValue = parseFloat(this.getView().byId(inputid + "-2")?.getText().split(":")[1])

                  if (!((minValue <= inputValue) && (inputValue <= maxValue)) && (inputValue != "")) {
                      document.getElementById(inputid + "-inner").classList.add("neon");
                      document.getElementById(inputid + "-1").classList.add("neon");
                      document.getElementById(inputid + "-2").classList.add("neon");
                  } else {
                      document.getElementById(inputid + "-inner").classList.remove("neon");
                      document.getElementById(this.getView().byId(inputid + "-1").sId).classList.remove("neon");
                      document.getElementById(this.getView().byId(inputid + "-2").sId).classList.remove("neon");
                  }



              },


          }
      );
  }
);