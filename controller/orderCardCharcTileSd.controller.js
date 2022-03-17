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
      FilterType
    ) {
      return Controller.extend("customActivity.controller.orderCardCharcTileSd", {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         */
        currentShift: undefined,
        restartRunInNextShift: false,
        onInit: function () {
          this.appComponent = this.getView().getViewData().appComponent;
          this.appData = this.appComponent.getAppGlobalData();
          this.interfaces = this.appComponent.getODataInterface();
          if (this.appData.defaultUom == undefined) {
            this.appData.defaultUom =
              this.interfaces.getCustomizationValueForNode(
                this.appData.client,
                this.appData.plant,
                this.appData.node.nodeID,
                sap.oee.ui.oeeConstants.customizationNames
                  .defaultuomforproductionreporting
              );
          }
          this.bindDataToCard();
  
          sap.oee.ui.Utils.attachChangeOrderDetails(
            this.appComponent,
            "orderCardFragment",
            this
          );
  
          this.getVisibleCharacteristic();
  
          //this.getAllCharacteristic();
        },
        slashFunction: function(inputValue){
          return (!inputValue) ? "" : " / " + inputValue;
        },
        getAllQuantityTon: function () {
            var runID = this.appData.selected.runID;
            var workorder = this.appData.selected.order.orderNo;
  
            var params = { "Param.1": runID, "Param.2": workorder , "Param.3" : this.appData.node.nodeID};
  
            var tRunner = new TransactionRunner(
              "MES/UI/ReportQuantitySteelChrac/getAllQuantityQry",
              params
            );
            if (!tRunner.Execute()) {
              MessageBox.error(tRunner.GetErrorMessage());
              return null;
            }
  
            var jsData = tRunner.GetJSONData();
            return jsData;
        },
        getAllCharacteristic: function () {
          var allCharJSON = {};
          var workorder;
          workorder = this.appData.selected.order.orderNo;
          if (!workorder) {
            var nodeID = this.appData.node.nodeID;
            var params = { "Param.1": nodeID };
            var tRunner = new TransactionRunner(
              "MES/UI/General/getActiveOrderQry",
              params
            );
            if (!tRunner.Execute()) {
              MessageBox.error(tRunner.GetErrorMessage());
              return null;
            }
            var oData = tRunner.GetJSONData();
            if (!oData[0].Row) return;
            workorder = oData[0].Row[0].AUFNR;
          }
          var params = {
            "Param.1": workorder,
            "Param.2": this.appData.selected.material.id
          };
          var tRunner = new TransactionRunner(
            "MES/UI/OrderCardDetail/getAufnrInformationQry",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          var oData = tRunner.GetJSONData();
          var jsData = oData[0].Row;

          var params = {
            "Param.1": workorder,
          };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getAufnrQuantityQry",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          var oData1 = tRunner.GetJSONData();
          var jspData = oData1[0].Row;

          var allQuantityTon = this.getAllQuantityTon();
  
          if (jsData == undefined) return;
          for (i = 0; i < jsData.length; i++) {
            allCharJSON[jsData[i].CHARCODE] = jsData[i].CHARVALUE;
          }
          allCharJSON.NOTE = oData[0].Row[0].NOTE;
          this.appData.allCharacteristic = allCharJSON;
  
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(oData[0].Row[0]);
          //this.getView().setModel(oModel, "allCharacteristicModel");
          this.appData.allCharacteristic.quantityReportedCustom =
              " : " +
              jspData[0].SUM_QUANTITY +
              " adt / " +
              jspData[0].SUM_QUANTITYTON +
              " ton";
            this.appData.allCharacteristic.totalQuantityProducedInRunCustom =
              " : " +
              allQuantityTon[0].Row[0].QUANTITY +
              " adt / " +
              allQuantityTon[0].Row[0].QUANTITYTON +
              " ton";
            this.appData.allCharacteristic.quantityReleasedCustom =
              " : " +
              parseFloat(this.appData.selected.quantityReleased) +
              " ton";
              var remainingQuantity = parseFloat(parseFloat(this.appData.selected.quantityReleased) - allQuantityTon[0].Row[1].QUANTITYTON).toFixed(2);
              
              
              this.appData.allCharacteristic.remainingQuantity = " : " + remainingQuantity + " ton";
              sap.oee.ui.Utils.updateModel(this.appComponent.getModel("appData"));
          var operationNo;
          if (this.appData.plant == 2001) operationNo = "0050";
          else if (this.appData.plant == 3001) operationNo = "0040";
  
          var params = {
            "Param.1": this.appData.plant,
            "Param.2": workorder,
            "Param.3": this.appData.selected.material.id,
          };
          var tRunner3 = new TransactionRunner(
            "MES/UI/OrderCardDetail/getCommonProductInfoQry",
            params
          );
  
          if (!tRunner3.Execute()) {
            MessageBox.error(tRunner3.GetErrorMessage());
            return null;
          }
          var oData2 = tRunner3.GetJSONData();
          if (!(oData2[0].Row == null)) {
            //var oModel = new sap.ui.model.json.JSONModel();
            //oModel.setData(oData2[0].Row);
            var sData = oModel.getData();
            sData.Ordes2 = oData2[0].Row[0];
            oModel.setData(sData);
            //this.getView().getModel("allCharacteristicModel").oData.Ordes2 =
            //  oData2[0].Row[0];
            //this.getView().setModel(oModel, "CommonProductInfo");
          }
          //this.getView().getModel("allCharacteristicModel").refresh();

          this.getView().setModel(oModel, "allCharacteristicModel");

          var params = {
            "Param.1": workorder,
            "Param.2": operationNo,
          };
          var tRunner2 = new TransactionRunner(
            "MES/UI/OrderCardDetail/getTaretTimeQry",
            params
          );
  
          if (!tRunner2.Execute()) {
            MessageBox.error(tRunner2.GetErrorMessage());
            return null;
          }
          var oData1 = tRunner2.GetJSONData();
          if (!oData1[0].Row) return;
          this.appData.allCharacteristic.taretTime = oData1[0].Row[0].TARET;
          sap.oee.ui.Utils.updateModel(this.appComponent.getModel("appData"));
        },
  
        getVisibleCharacteristic: function () {
          var screenCharacteristic = [
            ["filterCons2", "SEKME_PARTI_SEC"],
            ["addBarcode", "BUTON_PARTI_YARAT"],
            ["addSource", "BUTON_KAYNAK_EKLE"],
            ["filterCons3", "SEKME_PARTI_LISTESI"],
          ];
          var werks = this.appData.plant;
          var workcenterID = this.appData.node.workcenterID;
          var params = { "Param.1": werks, "Param.2": workcenterID };
          var tRunner = new TransactionRunner(
            "MES/UI/OrderCardDetail/getVisibleStatusCharacteristicQry",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          var oData = tRunner.GetJSONData();
          var visibleJSON = [{}];
  
          if (!oData[0].Row) return;
          for (i = 0; i < oData[0].Row.length; i++) {
            if (oData[0].Row[i].ATNAM == "ZMII_TEYIT_KARAKTERISTIK")
              visibleJSON[0][oData[0].Row[i].VALUE] = oData[0].Row[i].VALUE;
          }
          this.appData.visibleJSON = visibleJSON[0];
          this.appData.characteristic = oData;
          this.appData.customizationVisible =
            this.appData.customizationValues[this.appData.node.nodeID];
        },
  
        oeeRefreshActivity: function () {
          this.loadData();
        },
  
        bindDataToCard: function () {
          this.byId("orderCardTile").setBusy(true);
          sap.oee.ui.Utils.attachChangeOrderDetails(
            this.appComponent,
            "orderCardFragment",
            this
          ); // Attach Order Change
          this.loadData();
        },
  
        loadData: function () {
          try {
            this.interfaces.interfacesGetOrderStatusForRunsStartedInShift(
              this.appData.node.nodeID,
              this.appData.client,
              this.appData.plant,
              this.appData.shift.shiftID,
              this.appData.shift.shiftGrouping,
              this.appData.shift.startTimestamp,
              this.appData.shift.endTimestamp,
              this.renderOrderCards,
              this.getView().getController(),
              this.restartRunInNextShift
            );
          } catch (error) {
            this.byId("orderCardTile").setBusy(false);
          }
        },
  
        renderOrderCards: function (outputOrderStatusList) {
          // Render Order Cards
          var activeOrdersModel = new sap.ui.model.json.JSONModel();
          var results = [];
          var orderAvailable = false;
          var orderStatusJSON;
          if (outputOrderStatusList != undefined) {
            if (outputOrderStatusList.orderStatusList != undefined) {
              if (outputOrderStatusList.orderStatusList.results != undefined) {
                if (outputOrderStatusList.orderStatusList.results.length != 0) {
                  var order;
                  orderAvailable = true;
                  if (this.appData.selected.runID != undefined) {
                    var orderMatched = false;
                    for (order in outputOrderStatusList.orderStatusList.results) {
                      if (
                        this.appData.selected.runID ==
                        outputOrderStatusList.orderStatusList.results[order].runID
                      ) {
                        orderStatusJSON =
                          outputOrderStatusList.orderStatusList.results[order];
                        orderMatched = true;
                      }
                    }
  
                    if (!orderMatched) {
                      var selectedOrderDetailsJSON =
                        this.interfaces.interfacesGetOrderStatusForListOfRunsInputSync(
                          [this.appData.selected.runID]
                        );
                      if (
                        selectedOrderDetailsJSON.orderStatusList != undefined &&
                        selectedOrderDetailsJSON.orderStatusList.results !=
                          undefined &&
                        selectedOrderDetailsJSON.orderStatusList.results.length >
                          0
                      ) {
                        orderStatusJSON =
                          selectedOrderDetailsJSON.orderStatusList.results[0];
                      }
                    }
                  } else {
                    orderStatusJSON =
                      outputOrderStatusList.orderStatusList.results[0];
                  }
  
                  if (orderStatusJSON != undefined) {
                    //changes to set all the quantities of the order card in the UOM which will be maintained in customiztion(Production UoM, Base UoM, Standard Rate UoM)
                    if (this.appData.defaultUom != undefined) {
                      if (
                        this.appData.defaultUom.value ==
                        sap.oee.ui.oeeConstants.uomType.productionUom
                      ) {
                        orderStatusJSON.quantityReleasedUOMText =
                          orderStatusJSON.productionUOMDesc;
                        orderStatusJSON.quantityReleased =
                          orderStatusJSON.productionUomQuantity;
                        orderStatusJSON.totalQuantityProducedInRun =
                          orderStatusJSON.totalQuantityProducedInProductionUomInRun;
                        orderStatusJSON.totalProducedQuantity =
                          orderStatusJSON.totalProducedInProductionUom;
                        orderStatusJSON.totalRemainngQuantity =
                          orderStatusJSON.totalRemainingQuantityInProductionUom;
                      } else if (
                        this.appData.defaultUom.value ==
                        sap.oee.ui.oeeConstants.uomType.standardRateUom
                      ) {
                        orderStatusJSON.quantityReleasedUOMText =
                          orderStatusJSON.stdRateUOMDesc;
                        orderStatusJSON.quantityReleased =
                          orderStatusJSON.quantityInStdRateUom;
                        orderStatusJSON.totalQuantityProducedInRun =
                          orderStatusJSON.totalQuantityProducedInStdRateUomInRun;
                        orderStatusJSON.totalProducedQuantity =
                          orderStatusJSON.totalProducedInStdRateUom;
                        orderStatusJSON.totalRemainngQuantity =
                          orderStatusJSON.totalRemainingQuantityInStdRateUom;
                      } else {
                        orderStatusJSON.quantityReleasedUOMText =
                          orderStatusJSON.quantityReleasedUOMDesc;
                      }
                    } else {
                      orderStatusJSON.quantityReleasedUOMText =
                        orderStatusJSON.quantityReleasedUOMDesc;
                    }
                    orderStatusJSON.timeUom =
                      this.interfaces.interfacesGetTextForUOM(
                        orderStatusJSON.timeUom
                      );
                    //orderStatusJSON.quantityReleasedUOMText = this.interfaces.interfacesGetTextForUOM(orderStatusJSON.quantityReleasedUOM);
                    this.appData.setSelectedOrderDetails(orderStatusJSON); // Change Selected Order Context
                    emphasized = true;
  
                    var isProdActMaintained = false;
                    if (orderStatusJSON.productionActivity != "") {
                      isProdActMaintained = true;
                    }
                    var obj = {
                      releasedHeaderID: orderStatusJSON.releasedHeaderID,
                      releasedID: orderStatusJSON.releasedID,
                      order: orderStatusJSON.order,
                      routingOperNo: orderStatusJSON.routingOperNo,
                      operationDesc: orderStatusJSON.operationDesc,
                      parentOperationDesc: orderStatusJSON.parentOperationDesc,
                      material: orderStatusJSON.material,
                      material_desc: orderStatusJSON.material_desc,
                      quantityReleased: orderStatusJSON.quantityReleased,
                      quantityReleasedUOM: orderStatusJSON.quantityReleasedUOM,
                      quantityReleasedUOMText:
                        orderStatusJSON.quantityReleasedUOMText,
                      releaseDemandStatus: orderStatusJSON.releaseDemandStatus,
                      runID: orderStatusJSON.runID,
                      totalQuantityProducedInRun:
                        orderStatusJSON.totalQuantityProducedInRun,
                      startDate: orderStatusJSON.orderStartDate,
                      startTime: orderStatusJSON.orderStartTime,
                      reportingShiftId: orderStatusJSON.reportingShiftId,
                      shiftGrouping: orderStatusJSON.shiftGrouping,
                      workBreakSchedule: orderStatusJSON.workBreakSchedule,
                      productionMode: orderStatusJSON.productionMode,
                      isProdActMaintained: isProdActMaintained,
                      productionActivity: orderStatusJSON.productionActivity,
                      productionVersion: orderStatusJSON.productionVersion,
                      quantityRemaining: orderStatusJSON.totalRemainngQuantity,
                      quantityRejected: orderStatusJSON.totalRejectedQuantity,
                      standardRateQty: orderStatusJSON.standardRateQty,
                      standardRateUom: orderStatusJSON.standardRateUom,
                      totalProduced: orderStatusJSON.totalProducedQuantity,
                      timeQty: orderStatusJSON.timeQty,
                      timeUom: orderStatusJSON.timeUom,
                      currentSpeed: orderStatusJSON.currentSpeed,
                      nominalSpeed: orderStatusJSON.nominalSpeed,
                      remainingTime: orderStatusJSON.remainingTime,
                      emphasized: emphasized,
                      status: orderStatusJSON.status,
                      differenceInSpeed: orderStatusJSON.differenceInSpeed,
                      remainingTimeInSecs: orderStatusJSON.remainingTimeInSecs,
                      differenceInSpeedValue:
                        orderStatusJSON.differenceInSpeedValue,
                      speedUOM: orderStatusJSON.speedUOM,
                      statusText: orderStatusJSON.statusDescription,
                      salesOrderNumber: orderStatusJSON.salesOrderNumber,
                      batchNumber: orderStatusJSON.batchNumber,
                    };
  
                    results.push(obj);
                  }
                }
              }
            }
  
            activeOrdersModel.setData({ modelData: results });
          }
          var dataForCard;
          //TODO Correct UOM for ISO units here - quantityReleasedUOM is in ISO
          for (var int = 0; int < results.length; int++) {
            if (results[int].emphasized) {
              dataForCard = results[int];
            }
          }
  
          sap.oee.ui.Utils.updateModel(this.appComponent.getModel("appData"));
          this.getAllCharacteristic();
          this.byId("orderCardTile").setBusy(false);
        },
  
        IsOrderRunning: function (obj) {
          if (obj != undefined && obj != "") return true;
          else return false;
        },
  
        showIfNoOrderRunning: function (obj) {
          if (obj != undefined && obj != "") return false;
          else return true;
        },
  
        onAfterRendering: function () {},
  
        onPressEnterNote: function (oEvent) {
          var oView = this.getView();
          var oDialog = oView.byId("castNote");
          if (!oDialog) {
            oDialog = sap.ui.xmlfragment(
              oView.getId(),
              "customActivity.fragmentView.castNote",
              this
            );
            oView.addDependent(oDialog);
          }
          oDialog.open();
          this.getCastNote();
        },
  
                  getCastNote: function () {
                      var params = {
                          "Param.1": this.getView().getModel("allCharacteristicModel").oData.CASTID,
             "Param.2":this.appData.plant,
                      };
  
                      var tRunner = new TransactionRunner(
                          "MES/UI/General/getCreateCastNoteQry",
                          params
                      );
                      if (!tRunner.Execute()) {
                          MessageBox.error(tRunner.GetErrorMessage());
                          return null;
                      }
                      var jsData = tRunner.GetJSONData();
                      var oModel = new sap.ui.model.json.JSONModel();
                      oModel.setData(jsData[0].Row);
                      this.getView().setModel(oModel, "castNoteModel");
                  },
  
        onPressEnterShiftNote: function (oEvent) {
          var oView = this.getView();
          var oDialog = oView.byId("shiftNote");
          if (!oDialog) {
            oDialog = sap.ui.xmlfragment(
              oView.getId(),
              "customActivity.fragmentView.shiftNote",
              this
            );
            oView.addDependent(oDialog);
          }
          oDialog.open();
          this.getShiftNote();
        },
  
        getShiftNote: function () {
          var params = {
            "Param.1": this.appData.node.nodeID,
            "Param.2": this.appData.shift.startDate,
            "Param.3": this.appData.shift.startTime,
          };
  
          var tRunner = new TransactionRunner(
            "MES/UI/General/ShiftNote/getShiftNote",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          var jsData = tRunner.GetJSONData();
          var oModel = new sap.ui.model.json.JSONModel();
  
          if (!jsData[0].Row) {
            var result = "";
          } else {
            var result = jsData[0].Row[0].NOTE;
          }
          this.getView().byId("shiftNoteText").setValue(result);
          //this.getView().setModel(oModel, "shiftNoteModel");
        },
  
        onSaveShiftCommentDialog: function (oEvent) {
          var plant = this.appData.plant;
          var nodeId = this.appData.node.nodeID;
          var startDate = this.appData.shift.startDate;
          var startTime = this.appData.shift.startTime;
          var endDate = this.appData.shift.endDate;
          var endTime = this.appData.shift.endTime;
          var user = this.appData.user.userID;
          var note = this.getView().byId("shiftNoteText").getValue();
  
          var params = {
            I_PLANT: plant,
            I_NODE_ID: nodeId,
            I_START_DATE: startDate,
            I_START_TIME: startTime,
            I_END_DATE: endDate,
            I_END_TIME: endTime,
            // I_NOTE: note,
            I_USER: user,
            I_NOTIFDESC: note,
          };
  
          var tRunner = new TransactionRunner(
            "MES/UI/General/ShiftNote/updateShiftNoteXqry",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          sap.m.MessageToast.show("Başarılı");
          this.handleExitShiftNote();
        },
        handleExitShiftNote: function () {
          this.getView().byId("shiftNote").destroy();
        },
  
        /*
        onPressChangeOrderByCastNo: function (oEvent) {
          var oView = this.getView();
          var oDialog = oView.byId("changeOrderByCastNo");
          if (!oDialog) {
            oDialog = sap.ui.xmlfragment(
              oView.getId(),
              "customActivity.fragmentView.changeOrderByCastNo",
              this
            );
            oView.addDependent(oDialog);
          }
          oDialog.open();
          this.getChangeOrderByCastNo();
        },
  
        getChangeOrderByCastNo: function () {
          var params = {
            "Param.1": this.appData.node.nodeID,
          };
  
          var tRunner = new TransactionRunner(
            "MES/UI/General/getOrderByCastNo",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          var jsData = tRunner.GetJSONData();
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(jsData[0].Row);
          this.getView().setModel(oModel, "orderByCastNo");
        },
  
  
        onPressChangeOrder: function () {
  
  
  
        },
  
  */
        onCommentDialogSaveButton1: function (oEvent) {
          var plant = this.appData.plant;
          var note = "";
          var columnName = "";
          switch (this.appData.node.description) {
            case "Ark Ocağı":
              note = this.getView().byId("commentAo").getValue();
              columnName = "AO_NOTE";
              break;
            case "Pota Ocağı":
              note = this.getView().byId("commentPo").getValue();
              columnName = "PO_NOTE";
              break;
            case "Sürekli Döküm":
              note = this.getView().byId("commentSdm").getValue();
              columnName = "SDM_NOTE";
              break;
          }
  
          var castID = this.getView().getModel("allCharacteristicModel").oData
            .CASTID;
          var params = {
            I_PLANT: plant,
            I_CASTID: castID,
            I_NOTIFDESC: note,
            I_COLUMN_NAME: columnName,
          };
  
          var tRunner = new TransactionRunner(
            "MES/UI/General/updateCastNoteXqry",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          sap.m.MessageToast.show("Başarılı");
          this.handleExit();
          this.oeeRefreshActivity();
        },
  
        handleExit: function () {
          this.getView().byId("castNote").destroy();
        },
  
        onExit: function () {
          if (this.oPopOver) {
            this.oPopOver.destroy();
          }
        },
        handleTitleSelectorPress: function () {
          var ordersModel = new sap.ui.model.json.JSONModel();
          var outputOrderStatusList =
            this.interfaces.interfacesGetOrderStatusForRunsStartedInShiftInputSync(
              this.appData.node.nodeID,
              this.appData.client,
              this.appData.plant,
              this.appData.shift.shiftID,
              this.appData.shift.shiftGrouping,
              this.appData.shift.startTimestamp,
              this.appData.shift.endTimestamp,
              false
            );
          if (outputOrderStatusList != undefined) {
            if (outputOrderStatusList.orderStatusList != undefined) {
              if (outputOrderStatusList.orderStatusList.results != undefined) {
                if (outputOrderStatusList.orderStatusList.results.length != 0) {
                  ordersModel.setData({
                    orders: outputOrderStatusList.orderStatusList.results,
                  });
                  ordersModel.oData.orders.sort((a, b) => a.order - b.order);
                  console.log(ordersModel.oData.orders);
                  for (var i = 0; i < ordersModel.oData.orders.length; i++) {
                    var params = {
                      "Param.1": ordersModel.oData.orders[i].order,
                    };
  
                    var tRunner = new TransactionRunner(
                      "MES/UI/OrderCardDetail/getCastIDQry",
                      params
                    );
                    if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return null;
                    }
                    var jsData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    outputOrderStatusList.orderStatusList.results[i]["CASTID"] =
                      jsData[0].Row[0].CASTID;
                  }
                }
              }
            }
          }
  
          if (this.oPopOver == undefined) {
            this.oPopOver = sap.ui.xmlfragment(
              "popoverOrderCard",
              "sap.oee.ui.fragments.orderChangeDialog",
              this
            );
            this.oPopOver.setTitle(
              this.appComponent.oBundle.getText("OEE_HEADING_SELECT_ORDER")
            );
            var buttonTemplate = new sap.m.ObjectListItem({
              title:
                "{parts : [{path: 'order'},{path: 'CASTID'}], formatter : 'sap.oee.ui.Formatter.formatOrderNumber'}",
              attributes: [
                new sap.m.ObjectAttribute({ text: "{material_desc}" }),
                new sap.m.ObjectAttribute({
                  text: "{parts : [{path: 'orderStartTimestamp'},{path: 'appData>/plantTimezoneOffset'},{path : 'appData>/plantTimezoneKey'}], formatter : 'sap.oee.ui.Formatter.formatTimeStampWithoutLabel'}",
                }),
              ],
              type: "Active",
              firstStatus: new sap.m.ObjectStatus({
                text: "{parts : [{path: 'statusDescription'},{path: 'productionActivity'}], formatter : 'sap.oee.ui.Formatter.formatStatusTextAndActivity'}",
              }),
            });
  
            this.oPopOver.bindAggregation("items", "/orders", buttonTemplate);
            this.oPopOver.attachConfirm(this.selectOrder, this);
            this.oPopOver.attachSearch(this.orderSearch, this);
            this.oPopOver.attachLiveChange(this.orderSearch, this);
          }
          ordersModel.oData.orders.sort((a, b) => a.CASTID - b.CASTID);
          this.oPopOver.setModel(ordersModel);
          this.oPopOver.open();
        },
        selectOrder: function (oEvent) {
          var oSource = oEvent.getParameter("selectedItem");
          if (oSource != undefined) {
            var sRunID = oSource.getBindingContext().getProperty("runID");
            if (sRunID != undefined) {
              this.appComponent
                .getEventBus()
                .publish(this.appComponent.getId(), "orderChange", {
                  runID: sRunID,
                });
            }
          }
        },
        orderSearch: function (oEvent) {
          var properties = [];
          properties.push("order");
          properties.push("routingOperNo");
          properties.push("statusDescription");
          properties.push("material_desc");
          properties.push("productionActivity");
  
          sap.oee.ui.Utils.fuzzySearch(
            this,
            this.oPopOver.getModel(),
            oEvent.getParameter("value"),
            this.oPopOver.getBinding("items"),
            oEvent.getSource(),
            properties
          );
        },
      });
    }
  );
  