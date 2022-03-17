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
      customScripts
  ) {
      "use strict";
      var that;
      var jsonDataForPriorityChange;
      var EdmType = exportLibrary.EdmType;
      return Controller.extend(
          "customActivity.controller.oeeSelectOrderFIRK",

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
                  this.appData.intervalState = true;
                  this.modelServices();

                  this.getmodelManageOrders();
                  this.getmodelOrderStatusACT();
                  this.filterKalite();
                  this.filterCap();
                  this.filterBoy();
                  this.filterStandart();
                  this.filterUlke();
                  this.getView().byId("ManageOrders").setVisible(false);

              },

              modelServices: function () {

                  var oTrigger = new sap.ui.core.IntervalTrigger(5000);
                  oTrigger.addListener(() => {
                      if (this.appData.intervalState) {
                          this.getmodelManageOrders();
                          this.getmodelOrderStatusACT();
                      }

                  }, this);
              },


              getmodelManageOrders: function () {

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_SelectManageOrders",
                      {
                          I_NODEID: nodeid,
                      },
                      "O_JSON"
                  );
                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                  this.getView().byId("ManageOrders").setModel(tableModel);

              },

              getmodelOrderStatusACT: function () {

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_SelectOrderStatusACT",
                      {
                          I_NODEID: nodeid,
                      },
                      "O_JSON"
                  );
                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                  this.getView().byId("AktifSip").setModel(tableModel);

              },

              filterKalite: function () {

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_SelectBox",
                      {
                          I_NODEID: nodeid,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Model.Kalite.Rowset.Row) ? response[0].Model.Kalite.Rowset.Row : new Array(response[0].Model.Kalite.Rowset.Row);
                  var tableModel2 = new sap.ui.model.json.JSONModel(modelArr);
                  // tableModel2.setData(response[0]);
                  this.getView().byId("idKalite").setModel(tableModel2);
              },

              filterCap: function () {

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_SelectBox",
                      {
                          I_NODEID: nodeid,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Model.Cap.Rowset.Row) ? response[0].Model.Cap.Rowset.Row : new Array(response[0].Model.Cap.Rowset.Row);
                  var tableModel2 = new sap.ui.model.json.JSONModel(modelArr);
                  // tableModel2.setData(response[0]);
                  this.getView().byId("idCap").setModel(tableModel2);
              },

              filterBoy: function () {

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_SelectBox",
                      {
                          I_NODEID: nodeid,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Model.Boy.Rowset.Row) ? response[0].Model.Boy.Rowset.Row : new Array(response[0].Model.Boy.Rowset.Row);
                  var tableModel2 = new sap.ui.model.json.JSONModel(modelArr);
                  // tableModel2.setData(response[0]);
                  this.getView().byId("idBoy").setModel(tableModel2);
              },

              filterStandart: function () {

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_SelectBox",
                      {
                          I_NODEID: nodeid,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Model.Standart.Rowset.Row) ? response[0].Model.Standart.Rowset.Row : new Array(response[0].Model.Standart.Rowset.Row);
                  var tableModel2 = new sap.ui.model.json.JSONModel(modelArr);
                  // tableModel2.setData(response[0]);
                  this.getView().byId("idStandart").setModel(tableModel2);
              },

              filterUlke: function () {

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_SelectBox",
                      {
                          I_NODEID: nodeid,
                      },
                      "O_JSON"
                  );

                  var modelArr = Array.isArray(response[0].Model.Ulke.Rowset.Row) ? response[0].Model.Ulke.Rowset.Row : new Array(response[0].Model.Ulke.Rowset.Row);
                  var tableModel2 = new sap.ui.model.json.JSONModel(modelArr);
                  // tableModel2.setData(response[0]);
                  this.getView().byId("idUlke").setModel(tableModel2);
              },

              onPressidTemizle: function () {

                  this.appData.intervalState = true;

                  this.getView().byId("idUlke").setForceSelection(false);
                  this.getView().byId("idKalite").setForceSelection(false);
                  this.getView().byId("idCap").setForceSelection(false);
                  this.getView().byId("idBoy").setForceSelection(false);
                  this.getView().byId("idStandart").setForceSelection(false);

                  this.getView().byId("idUlke").setSelectedKey(null);
                  this.getView().byId("idKalite").setSelectedKey(null);
                  this.getView().byId("idCap").setSelectedKey(null);
                  this.getView().byId("idBoy").setSelectedKey(null);
                  this.getView().byId("idStandart").setSelectedKey(null);

                  this.getView().byId("idAUFNR").setValue("");
              },

              onPressidGetir: function () {

                  this.appData.intervalState = false;

                  var ulke = this.getView().byId("idUlke").getSelectedKey();
                  var kalite = this.getView().byId("idKalite").getSelectedKey();
                  var cap = this.getView().byId("idCap").getSelectedKey();
                  var boy = this.getView().byId("idBoy").getSelectedKey();
                  var standart = this.getView().byId("idStandart").getSelectedKey();
                  var aufnr = this.getView().byId("idAUFNR").getValue();

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_SelectManageOrders",
                      {
                          I_NODEID: nodeid,
                      },
                      "O_JSON"
                  );
                  var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                  var tableModel = new sap.ui.model.json.JSONModel(modelArr);


                  var newStatusArray = modelArr.filter((i) => (((i.AUFNR).includes(aufnr) || (aufnr == "")) && ((i.Y_ULKE == ulke) || (ulke == "")) && ((i.Y_KALITE_FRK == kalite) || (kalite == "")) && ((i.Y_STANDART_FRK == standart) || (standart == "")) && ((i.Y_CAP_FRK_MM == cap) || (cap == "")) && ((i.Y_BOY_FRK_M == boy) || (boy == ""))));
                  var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);



                  this.getView().byId("ManageOrders").setVisible(true);
                  this.getView().byId("ManageOrders").setModel(myNEWModel);

              },


              // newStartButton: function (oEvent) {
              //     var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
              //     var oTableData = this.getView().byId("ManageOrders").getModel().getData()[selectedIndex];

              //     this.StartButton(oTableData);

              // },

              // StartButton: function (oTableData) {
              //     if (!this._oDialog01) {
              //         this._oDialog01 = sap.ui.xmlfragment(
              //             "StartButton",
              //             "customActivity.fragmentView.StartButtonFragment",
              //             this
              //         );
              //         this.getView().addDependent(this._oDialog01);
              //     }
              //     this._oDialog01.open();

              //     sap.ui.core.Fragment.byId("StartButton", "idStartDialog").setModel(oTableData);


              // },

              StartButtonOK: function (oEvent) {

                  var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                  var oTableData = this.getView().byId("ManageOrders").getModel().getData()[selectedIndex];

                  // if (sap.ui.core.Fragment.byId("StartButton", "idStartDialog").getModel().AUFNR.length != 12) {
                  //     var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("StartButton", "idStartDialog").getModel().AUFNR);
                  // }
                  // else if (sap.ui.core.Fragment.byId("StartButton", "idStartDialog").getModel().AUFNR.length == 12) {
                  //     var orderNumber = sap.ui.core.Fragment.byId("StartButton", "idStartDialog").getModel().AUFNR;
                  // }

                  // var orderNumber = sap.ui.core.Fragment.byId("StartButton", "idStartDialog").getModel().AUFNR;

                  if (oTableData.AUFNR.length != 12) {
                      var orderNumber = "0000" + String(oTableData.AUFNR);
                  }
                  else if (oTableData.AUFNR.length == 12) {
                      var orderNumber = oTableData.AUFNR;
                  }

                  var orderNumber = oTableData.AUFNR;

                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";


                  var statuscheck = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_StatusCheck",
                      {
                          I_NODEID: nodeid,
                          I_AUFNR: orderNumber,
                      },
                      "O_JSON"
                  );

                  if (statuscheck[0].Rowsets?.Rowset?.Row?.STATUS == "NEW") {
                      var targetStatus = "ACT";
                  }
                  else if (statuscheck[0].Rowsets?.Rowset?.Row?.STATUS == "HOLD") {
                      var targetStatus = "RESUME";
                  }
                  else {
                      return;
                  }



                  var operationNumber = "0010"
                  var crewSize = "1";

                  // var idStartYıl = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getFullYear(); //2021
                  // var idStartAy = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getMonth() + 1; //ay
                  // if (idStartAy < 10) {
                  //     idStartAy = "0" + idStartAy;
                  // }
                  // var idStartGün = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getDate(); //gün
                  // if (idStartGün < 10) {
                  //     idStartGün = "0" + idStartGün;
                  // }
                  // var idStartDate = String(idStartYıl) + "-" + String(idStartAy) + "-" + String(idStartGün);
                  // var idExecStartTime = sap.ui.core.Fragment.byId("StartButton", "idStartTimePicker").getValue();
                  // var StartTime = String(idStartDate) + "T" + String(idExecStartTime);

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_START_ORDER_FLM",
                      {
                          I_ORDER_NUMBER: orderNumber,
                          I_OPERATION_NUMBER: operationNumber,
                          I_NODEID: nodeid,
                          I_TARGET_STATUS: targetStatus,
                          I_CREWSIZE: crewSize,
                          // I_StartTime: StartTime,
                      },
                      "O_JSON"
                  );

                  if (response[1] == "E") {
                      MessageBox.error(response[0]);
                      return;
                  }
                  else {
                      MessageBox.information("İşlem Başarılı");

                  }
                  var response2 = TransactionCaller.sync(
                    "MES/Integration/RFC/ZPP_000_STATUS_UPDATE_RFC/T_ZPP_000_STATUS_UPDATE_RFC_ORDER",
        
                    {
                      I_AUFNR:orderNumber,
                      I_ACTIVE:"E0002"
                    },
                    "O_JSON"
                  );


                  this.onPressidTemizle();
                  this.getmodelManageOrders();
                  this.getmodelOrderStatusACT();
                  this.getView().byId("ManageOrders").setVisible(false);
                  // this.onCancelFrag01();

              },

              // onCancelFrag01: function () {
              //     this._oDialog01.close();
              // },

              // newHoldButton: function (oEvent) {
              //     var oTableData = this.getView().byId("AktifSip").getModel().getData()[0];
              //     if (oTableData == null) {
              //         MessageBox.error("Aktifte Sipariş Bulunmamaktadır!");
              //         return;
              //     }
              //     else {
              //         this.HoldButton(oTableData);
              //     }


              // },

              // HoldButton: function (oTableData) {
              //     if (!this._oDialog02) {
              //         this._oDialog02 = sap.ui.xmlfragment(
              //             "HoldButton",
              //             "customActivity.fragmentView.HoldButtonFragment",

              //             this
              //         );
              //         this.getView().addDependent(this._oDialog02);
              //     }
              //     this._oDialog02.open();

              //     sap.ui.core.Fragment.byId("HoldButton", "idHoldDialog").setModel(oTableData);

              // },

              HoldButtonOK: function (oEvent) {

                  var oTableData = this.getView().byId("AktifSip").getModel().getData()[0];

                  if (oTableData.AUFNR.length != 12) {
                      var orderNumber = "0000" + String(oTableData.AUFNR);
                  }
                  else if (oTableData.AUFNR.length == 12) {
                      var orderNumber = oTableData.AUFNR;
                  }

                  var operationNumber = "0010"
                  var nodeid = this.appData.node.nodeID;
                  // var nodeid = "899D5E81A7991EEBA085388AA019710E";
                  var targetStatus = "HOLD";
                  var crewSize = "1";

                  // var idHoldYıl = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getFullYear();
                  // var idHoldAy = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getMonth() + 1; //ay
                  // if (idHoldAy < 10) {
                  //     idHoldAy = "0" + idHoldAy;
                  // }
                  // var idHoldGün = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getDate(); //gün
                  // if (idHoldGün < 10) {
                  //     idHoldGün = "0" + idHoldGün;
                  // }
                  // var idHoldDate = String(idHoldYıl) + "-" + String(idHoldAy) + "-" + String(idHoldGün);
                  // var idExecHoldTime = sap.ui.core.Fragment.byId("HoldButton", "idBitisTimePicker").getValue();
                  // var HoldTime = String(idHoldDate) + "T" + String(idExecHoldTime);

                  var response = TransactionCaller.sync(
                      "MES/Itelli/EREN/FirketeManageOrders/T_START_ORDER_FLM",
                      {
                          I_ORDER_NUMBER: orderNumber,
                          I_OPERATION_NUMBER: operationNumber,
                          I_NODEID: nodeid,
                          I_TARGET_STATUS: targetStatus,
                          I_CREWSIZE: crewSize,
                          // I_ENDTIME: HoldTime,
                      },
                      "O_JSON"
                  );

                  if (response[1] == "E") {
                      MessageBox.error(response[0]);
                      return;
                  }
                  else {
                      MessageBox.information("İşlem Başarılı");
                  }

                  var response3 = TransactionCaller.sync(
                    "MES/Integration/RFC/ZPP_000_STATUS_UPDATE_RFC/T_ZPP_000_STATUS_UPDATE_RFC_ORDER",
        
                    {
                      I_AUFNR:orderNumber,
                      I_ACTIVE:"E0003"
                    },
                    "O_JSON"
                  );

                  this.onPressidTemizle();
                  this.getmodelOrderStatusACT();
                  this.getmodelManageOrders();
                  // this.onCancelFrag02();

              },

              onPressOpenCharacteristic: function (oEvent) {
                  var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                  var oTableData = oEvent.getSource().getModel().getData()[selectedIndex];
                  var orderNo = parseInt(oTableData.AUFNR);

                  var oView = this.getView();
                  var oDialog = oView.byId("getCharacteristicOrder");
                  // create dialog lazily
                  if (!oDialog) {
                      // create dialog via fragment factory
                      oDialog = sap.ui.xmlfragment(
                          oView.getId(),
                          "customActivity.fragmentView.getCharacteristicOrder",
                          this
                      );
                      // connect dialog to view (models, lifecycle)
                      oView.addDependent(oDialog);
                  }
                  oDialog.open();
                  this.getCharacteristic(orderNo);
                  // this.byId("inputBarcode").setValue("");
              },

              getCharacteristic: function (workorder) {
                  var params = {
                      I_AUFNR: workorder,
                  };
                  var tRunner = new TransactionRunner(
                      "MES/UI/selectOrder/getCharacteristicsInfoXqry",
                      params
                  );
                  if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return false;
                  }
                  var oData = tRunner.GetJSONData();
                  var oModel = new sap.ui.model.json.JSONModel();
                  var panelJSON = [];
                  var rows = oData[0].Row;

                  panelJSON = [
                      { ATKLA: "Y_GNL", Y_GNL: {} },
                      { ATKLA: "Y_KIM", Y_KIM: {} },
                      { ATKLA: "Y_MEK", Y_MEK: {} },
                      { ATKLA: "Y_TLR", Y_TLR: {} },
                  ];

                  for (var i = 0; i < rows.length; i++) {
                      for (var k = 0; k < panelJSON.length; k++) {
                          if (rows[i].ATKLA == panelJSON[k].ATKLA)
                              panelJSON[k][rows[i].ATKLA][
                                  Object.keys(panelJSON[k][rows[i].ATKLA]).length
                              ] = rows[i];
                      }
                  }

                  oModel.setData(panelJSON);
                  this.getView().setModel(oModel, "panelsJSON");
                  var table = this.byId("CharacteristicTable1");
                  if (table != undefined) table.setModel(oModel);
                  return oData;
              },


              onPressOpenDescription: function (oEvent) {

                  var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                  var oTableData = oEvent.getSource().getModel().getData()[selectedIndex];
                  var orderNo = parseInt(oTableData.AUFNR);

                  // load fragment
                  var oView = this.getView();
                  var oDialog = oView.byId("orderDetailsDialog");
                  // create dialog lazily
                  if (!oDialog) {
                      // create dialog via fragment factory
                      oDialog = sap.ui.xmlfragment(
                          oView.getId(),
                          "customActivity.fragmentView.getOrderDetails",
                          this
                      );
                      // connect dialog to view (models, lifecycle)
                      oView.addDependent(oDialog);
                  }
                  oDialog.open();
                  this.getOrderDetails(orderNo);
              },

              getOrderDetails: function (orderNo) {

                  var werks = this.appData.plant;

                  var params = {
                      "Param.1": werks,
                      "Param.2": orderNo,
                  };
                  var tRunner = new TransactionRunner(
                      "MES/UI/CreateCast/getInformationCharacteristicQry",
                      params
                  );
                  if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return null;
                  }
                  var oData = tRunner.GetJSONData();
                  var oModel = new sap.ui.model.json.JSONModel();
                  var newOrderDetailsData = [];
                  if (oData[0].Row != undefined) {
                      for (var i = 0; i < oData[0].Row.length; i++) {
                          newOrderDetailsData[i] = oData[0].Row[i];
                      }
                  }
                  oModel.setData(newOrderDetailsData);
                  this.getView().setModel(oModel, "orderDetailsModel");
              },


              handleCancel: function (oEvent) { // karakteristik fragment close
                  oEvent.getSource().getParent().close();
              },

              handleCancelOrderDetails: function (oEvent) { // açıklama fragment close
                  oEvent.getSource().getParent().close();
              },























              // onCancelFrag02: function () {
              //     this._oDialog02.close();
              // },

              // onPressSetCurDateSTART: function (oEvent) {
              //     var daynow = new Date().getDate();
              //     var monthnow = new Date().getMonth() + 1;
              //     var fullyearnow = new Date().getFullYear();
              //     if (monthnow < 10) {
              //         monthnow = "0" + monthnow;
              //     }
              //     if (daynow < 10) {
              //         daynow = "0" + daynow;
              //     }
              //     var idStartDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
              //     sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").setValue(idStartDate);

              //     var hournow = new Date().getHours();
              //     var minutesnow = new Date().getMinutes();
              //     var secondsnow = new Date().getSeconds();

              //     if (hournow < 10) {
              //         hournow = "0" + hournow;
              //     }
              //     if (minutesnow < 10) {
              //         minutesnow = "0" + minutesnow;
              //     }
              //     if (secondsnow < 10) {
              //         secondsnow = "0" + secondsnow;
              //     }
              //     var idStartSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
              //     sap.ui.core.Fragment.byId("StartButton", "idStartTimePicker").setValue(idStartSaat);

              // },

              // onPressSetCurDateHOLD: function (oEvent) {
              //     var daynow = new Date().getDate();
              //     var monthnow = new Date().getMonth() + 1;
              //     var fullyearnow = new Date().getFullYear();
              //     if (monthnow < 10) {
              //         monthnow = "0" + monthnow;
              //     }
              //     if (daynow < 10) {
              //         daynow = "0" + daynow;
              //     }
              //     var idStartDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
              //     sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").setValue(idStartDate);

              //     var hournow = new Date().getHours();
              //     var minutesnow = new Date().getMinutes();
              //     var secondsnow = new Date().getSeconds();

              //     if (hournow < 10) {
              //         hournow = "0" + hournow;
              //     }
              //     if (minutesnow < 10) {
              //         minutesnow = "0" + minutesnow;
              //     }
              //     if (secondsnow < 10) {
              //         secondsnow = "0" + secondsnow;
              //     }
              //     var idStartSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
              //     sap.ui.core.Fragment.byId("HoldButton", "idBitisTimePicker").setValue(idStartSaat);

              // },


          }
      );
  }
);