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
      return Controller.extend(
          "customActivity.controller.telCekmeHaddeSerisi",

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
                  this.getTolerans();
              },

              kaydet: function () {

                  var Input1 = this.getView().byId("input1").getValue();
                  var Input2 = this.getView().byId("input2").getValue();
                  var Input3 = this.getView().byId("input3").getValue();
                  var Input4 = this.getView().byId("input4").getValue();
                  var Input5 = this.getView().byId("input5").getValue();
                  var Input6 = this.getView().byId("input6").getValue();
                  var Input7 = this.getView().byId("input7").getValue();
                  var Input8 = this.getView().byId("input8").getValue();
                  var Input9 = this.getView().byId("input9").getValue();

                  var Checkbox1 = this.getView().byId("checkbox1").getSelected();
                  var Checkbox2 = this.getView().byId("checkbox2").getSelected();
                  var Checkbox3 = this.getView().byId("checkbox3").getSelected();
                  var Checkbox4 = this.getView().byId("checkbox4").getSelected();
                  var Checkbox5 = this.getView().byId("checkbox5").getSelected();
                  var Checkbox6 = this.getView().byId("checkbox6").getSelected();
                  var Checkbox7 = this.getView().byId("checkbox7").getSelected();
                  var Checkbox8 = this.getView().byId("checkbox8").getSelected();
                  var Checkbox9 = this.getView().byId("checkbox9").getSelected();

                  if (!!Input1 && !!Checkbox1) {
                      var Checkbox1 = "VAR";
                  }
                  else if (!Input1) {
                      var Checkbox1 = "";
                  }
                  else {
                      var Checkbox1 = "YOK";
                  }


                  if (!!Input2 && !!Checkbox2) {
                      var Checkbox2 = "VAR";
                  }
                  else if (!Input2) {
                      var Checkbox2 = "";
                  }
                  else {
                      var Checkbox2 = "YOK";
                  }


                  if (!!Input3 && !!Checkbox3) {
                      var Checkbox3 = "VAR";
                  }
                  else if (!Input3) {
                      var Checkbox3 = "";
                  }
                  else {
                      var Checkbox3 = "YOK";
                  }


                  if (!!Input4 && !!Checkbox4) {
                      var Checkbox4 = "VAR";
                  }
                  else if (!Input4) {
                      var Checkbox4 = "";
                  }
                  else {
                      var Checkbox4 = "YOK";
                  }


                  if (!!Input5 && !!Checkbox5) {
                      var Checkbox5 = "VAR";
                  }
                  else if (!Input5) {
                      var Checkbox5 = "";
                  }
                  else {
                      var Checkbox5 = "YOK";
                  }


                  if (!!Input6 && !!Checkbox6) {
                      var Checkbox6 = "VAR";
                  }
                  else if (!Input6) {
                      var Checkbox6 = "";
                  }
                  else {
                      var Checkbox6 = "YOK";
                  }


                  if (!!Input7 && !!Checkbox7) {
                      var Checkbox7 = "VAR";
                  }
                  else if (!Input7) {
                      var Checkbox7 = "";
                  }
                  else {
                      var Checkbox7 = "YOK";
                  }


                  if (!!Input8 && !!Checkbox8) {
                      var Checkbox8 = "VAR";
                  }
                  else if (!Input8) {
                      var Checkbox8 = "";
                  }
                  else {
                      var Checkbox8 = "YOK";
                  }


                  if (!!Input9 && !!Checkbox9) {
                      var Checkbox9 = "VAR";
                  }
                  else if (!Input9) {
                      var Checkbox9 = "";
                  }
                  else {
                      var Checkbox9 = "YOK";
                  }


                  var client = this.appData.client;
                  var plant = this.appData.plant;
                  var nodeid = this.appData.node.nodeID;
                  var shift = this.appData.shift.shiftID;
                  var aufnr = this.appData.selected.order.orderNo;
                  var ınsuser = this.appData.user.userID;

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/TelCekmeHaddeSerisi/T_INSERT_Hadde_Serisi",

                      {
                          I_CLIENT: client,
                          I_PLANT: plant,
                          I_NODEID: nodeid,
                          I_SHIFT: shift,
                          I_AUFNR: aufnr,
                          I_INSUSER: ınsuser,
                          I_CHECKBOX1: Checkbox1,
                          I_CHECKBOX2: Checkbox2,
                          I_CHECKBOX3: Checkbox3,
                          I_CHECKBOX4: Checkbox4,
                          I_CHECKBOX5: Checkbox5,
                          I_CHECKBOX6: Checkbox6,
                          I_CHECKBOX7: Checkbox7,
                          I_CHECKBOX8: Checkbox8,
                          I_CHECKBOX9: Checkbox9,
                          I_INPUT1: Input1,
                          I_INPUT2: Input2,
                          I_INPUT3: Input3,
                          I_INPUT4: Input4,
                          I_INPUT5: Input5,
                          I_INPUT6: Input6,
                          I_INPUT7: Input7,
                          I_INPUT8: Input8,
                          I_INPUT9: Input9,

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
                  var Input5 = this.getView().byId("input5").setValue("");
                  var Input6 = this.getView().byId("input6").setValue("");
                  var Input7 = this.getView().byId("input7").setValue("");
                  var Input8 = this.getView().byId("input8").setValue("");
                  var Input9 = this.getView().byId("input9").setValue("");

                  var Checkbox1 = this.getView().byId("checkbox1").setSelected(false);
                  var Checkbox2 = this.getView().byId("checkbox2").setSelected(false);
                  var Checkbox3 = this.getView().byId("checkbox3").setSelected(false);
                  var Checkbox4 = this.getView().byId("checkbox4").setSelected(false);
                  var Checkbox5 = this.getView().byId("checkbox5").setSelected(false);
                  var Checkbox6 = this.getView().byId("checkbox6").setSelected(false);
                  var Checkbox7 = this.getView().byId("checkbox7").setSelected(false);
                  var Checkbox8 = this.getView().byId("checkbox8").setSelected(false);
                  var Checkbox9 = this.getView().byId("checkbox9").setSelected(false);



              },
              openRaporEkranı: function () {
                  this.getView().byId("haddeSerisi").setVisible(false);
                  this.getView().byId("raporBox").setVisible(true);
              },
              openHaddeSerisi: function () {
                  this.getView().byId("raporBox").setVisible(false);
                  this.getView().byId("haddeSerisi").setVisible(true);
              },

              searchData: function () {
                
                  var date1 = this.getView().byId("datePicker").getDateValue().toDateString();
                  var date2 = this.getView().byId("datePicker").getSecondDateValue().toDateString();

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/TelCekmeHaddeSerisi/T_SELECT_TABLE",

                      {
                          I_DATE1: date1,
                          I_DATE2: date2,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                  // tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);

                  this.getView().byId("haddeSerisiTable").setModel(tableModel);
                  this.getView().byId("haddeSerisiTable").getModel().refresh();
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
                                 var tableModel = this.getView().byId("haddeSerisiTable").getModel();
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


              getModelData: function () {
                  var date1 = new Date().toDateString();
                  var date2 = new Date().toDateString();

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/TelCekmeHaddeSerisi/T_SELECT_TABLE",

                      {
                          I_DATE1: date1,
                          I_DATE2: date2,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);

                  this.getView().byId("datePicker").setValue(date1 + " " + "- " + " " + date2);
                  this.getView().byId("haddeSerisiTable").setModel(tableModel);
                  this.getView().byId("haddeSerisiTable").getModel().refresh();
                  var myColumns=response[0].Rowsets.Rowset.Columns.Column;
                  return myColumns;
              },


              Warning: function (oEvent) {


                  var inputid = oEvent.getSource().sId;

                  var inputValue = oEvent.getSource().getValue();

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


              getTolerans: function () {


                  var aufnr = parseFloat(this.appData.selected.order.orderNo);



                  var params = {
                      "Param.1": aufnr
                  };
                  var tRunner = new TransactionRunner("MES/Itelli/DNA/haddeSerisiToleranslar/getOrderCapChar", params);
                  if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return;
                  }
                  var oData = tRunner?.GetJSONData();
                  var cap = parseFloat(oData[0]?.Row[0]?.CHAR_DEGER);
                  this.getView().byId("activeCap").setText("Çap: " + cap + " mm");

                  var params = {
                      "Param.1": cap
                  };
                  var tRunner = new TransactionRunner("MES/Itelli/DNA/haddeSerisiToleranslar/SelectComboBox/getDatabyCap", params);
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
                      for (let i = 1, j = 7, k = 8; i < 19 && j < 25 && k < 25; i++, j += 2, k += 2) {
                          this.getView().byId("input" + i + "-1").setText("Min: " + result[j][1])
                          this.getView().byId("input" + i + "-2").setText("Max: " + result[k][1])
                      }
                  }
                  



              },





          }
      );
  }
);
