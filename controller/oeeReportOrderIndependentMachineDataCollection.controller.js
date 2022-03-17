sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/m/MessageBox",
      "customActivity/scripts/custom",
      "../model/formatter",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
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
      FilterType
    ) {

    "use strict";
/*
    Array.prototype.localArrFilter = function (e) {
      var found = false;
      for (var i = 0; i < this.length; i++) {
        if (this[i].VALUE == e) {
          found = true;
          break;
        }
      }
      //console.log(this);
      return found;
    };
*/
      return Controller.extend(
        "customActivity.controller.oeeReportOrderIndependentMachineDataCollection",
        {
          onInit: function () {
            this.appComponent = this.getView().getViewData().appComponent;
            this.appData = this.appComponent.getAppGlobalData();
            this.interfaces = this.appComponent.getODataInterface();
  
            this.appComponent
              .getEventBus()
              .subscribe(
                this.appComponent.getId(),
                "shiftChanged",
                this.renderUI,
                this
              );
  
            this.bindMachineList();
  
            this.appData.user.currentUserLastName = "pcouser";
          },
  
          bindMachineList: function () {
            this.prepareWorkUnitDetails();
  
            var payload = {
              controller: this,
              fItemSelect: this.onSelectWU,
              sFragmentId: "machineListFragment",
              data: this.workUnitList, // Optional Parameter data - Pass if overriding needed if not passed  only machine List will be populated, it is being sent here as it is a variant and needs technical object as well when processing on selecting an item
              // Optional Parameter markBottleneck - if bottleneck has to be marked in List
              // Optional Parameter dcElementForBottleneck - if you want to determine bottleneck for a particular DCELEMENT example UNSCHEDULED DOWNTIME
              // Optional Parameter template as parameter - if default parameter needs to be overriden
              // Optional Parameter properties to be shown not more than 3 can be passed as parameters, which shall be shown including machine name(first property is assumed to be machine description if data is passed by you) if default template is used They also are used for search
            };
            sap.oee.ui.Utils.bindMachineList(payload); // Last three params optional, Pass data only if different than list of machines needed, Properties List to show in the item template, Template override if need arises to not use default template.
          },
  
          prepareWorkUnitDetails: function () {
            this.workUnitList = [];
            var node = sap.oee.ui.Utils.getMachineListForCurrentWC(false); // Set First Parameter to true if bottleneck machine details needed, pass dcElement for which bottleneck info is needed
  
            var nodeDetails = node.details.results;
            if (nodeDetails !== undefined && nodeDetails.length > 0) {
              for (var i = 0; i < nodeDetails.length; i++) {
                var wuTemp = {};
  
                wuTemp.nodeID = nodeDetails[i].nodeId;
                wuTemp.description = nodeDetails[i].description;
                wuTemp.name = nodeDetails[i].name;
                wuTemp.nodeType = nodeDetails[i].type;
  
                this.workUnitList.push(wuTemp);
              }
            }
          },
          onSelectWU: function (oEvent) {
            this.selectedWU = oEvent
              .getParameter("listItem")
              .getBindingContext()
              .getObject();
            this.renderUI();
          },
  
          onClickRefreshScreen: function () {
            this.renderUI();
          },
          renderUI: function () {
            /*
             * Getting Data Collection Elements and Quantity
             * Consumed details for Context - Start
             */
            if (this.appData.dcElementsDataForOrdIndDataCollection == undefined) {
              this.appData.dcElementsDataForOrdIndDataCollection = this.interfaces.interfacesGetDCElementsForOrderIndependent(
                this.appData.client
              );
              this.dcElementsData = this.appData.dcElementsDataForOrdIndDataCollection;
            } else {
              this.dcElementsData = this.appData.dcElementsDataForOrdIndDataCollection;
            }
  
            this.orderIndependentRun = this.interfaces.getOrderIndependentRunForNodeAndTime(
              this.appData.client,
              this.appData.plant,
              this.appData.node.nodeID,
              this.appData.shift.startTimestamp
            );
            var reportedData;
            if (this.orderIndependentRun && this.orderIndependentRun.runID) {
              var dcElements = [];
              if (
                this.dcElementsData &&
                this.dcElementsData.dataCollectionElements &&
                this.dcElementsData.dataCollectionElements.results
              ) {
                for (
                  var i = 0;
                  i < this.dcElementsData.dataCollectionElements.results.length;
                  i++
                ) {
                  var tempDCElement = this.dcElementsData.dataCollectionElements
                    .results[i];
                  dcElements.push({
                    dcElement: tempDCElement.dcElement,
                  });
                }
              }
  
              reportedData = this.interfaces.interfacesGetTotalQuantityCollectedForDCElementsInBaseUomForOrderIndependentRun(
                this.orderIndependentRun.runID,
                dcElements,
                this.selectedWU.nodeID
              );
              if (
                reportedData != undefined &&
                reportedData.prodRunDataList != undefined &&
                reportedData.prodRunDataList.results != undefined
              ) {
                for (
                  var i = 0;
                  i < this.dcElementsData.dataCollectionElements.results.length;
                  i++
                ) {
                  for (
                    var j = 0;
                    j < reportedData.prodRunDataList.results.length;
                    j++
                  ) {
                    if (
                      this.dcElementsData.dataCollectionElements.results[i]
                        .dcElement ==
                      reportedData.prodRunDataList.results[j].dcElement
                    ) {
                      this.dcElementsData.dataCollectionElements.results[
                        i
                      ].lastReportedDateTime =
                        reportedData.prodRunDataList.results[j].changeTimestamp;
                    }
                  }
                }
              }
            }
            if (
              this.dcElementsData != undefined &&
              this.dcElementsData.dataCollectionElements != undefined &&
              this.dcElementsData.dataCollectionElements.results != undefined
            ) {
              if (this.dcElementsData.dataCollectionElements.results.length > 0) {
                for (
                  i = 0;
                  i < this.dcElementsData.dataCollectionElements.results.length;
                  i++
                ) {
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].quantityReported = "";
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].assignRCLink = this.appComponent.oBundle.getText(
                    "OEE_LABEL_ASSIGN"
                  );
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].defaultUOMText = this.interfaces.interfacesGetTextForUOM(
                    this.dcElementsData.dataCollectionElements.results[i]
                      .reportingUom
                  );
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].defaultUOM = this.dcElementsData.dataCollectionElements.results[
                    i
                  ].reportingUom;
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].startTime = "";
                  this.dcElementsData.dataCollectionElements.results[i].endTime =
                    "";
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].firstFillField = "";
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].secondFillField = "";
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].isSelected = false;
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].timeStampOfSelectedStartTime = "";
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].timeStampOfSelectedEndTime = "";
                  this.dcElementsData.dataCollectionElements.results[i].comments =
                    "";
                  if (
                    this.oContextQuantityType != undefined ||
                    this.oContextTimeType != undefined
                  ) {
                    var oIndex = 0;
                    if (
                      this.dcElementsData.dataCollectionElements.results[i]
                        .dcElementType ==
                      this.appData.constDCElementTypeForQuantity
                    ) {
                      for (j = 0; j < this.oContextQuantityType.length; j++) {
                        if (
                          this.dcElementsData.dataCollectionElements.results[i]
                            .dcElement == this.oContextQuantityType[j].dcElement
                        ) {
                          break;
                        }
                        oIndex++;
                      }
                      //this.dcElementsData.dataCollectionElements.results[i].lastReportedDateTime = this.oContextQuantityType[oIndex].lastReportedDateTime;
                    }
                  }
                  /*else{
                                        this.dcElementsData.dataCollectionElements.results[i].lastReportedDateTime = "";		
                                    }*/
                  this.dcElementsData.dataCollectionElements.results[
                    i
                  ].durationInMinutes = "";
                }
                this.dataPreparationAndBinding(
                  this.dcElementsData.dataCollectionElements
                );
              }
            }
            //			disable the Save Button and detail button
            // this.byId("genericDataSaveButton").setEnabled(false);
          },
  
          dataPreparationAndBinding: function (oContext) {
            var tRunner = new TransactionRunner(
              "MES/Test/DataCollection/getDatatest"
            );
            if (!tRunner.Execute()) {
              MessageBox.error(tRunner.GetErrorMessage());
              return null;
            }
            var oData = tRunner.GetJSONData();
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(oData[0]);
  
            this.oContextTimeType = [];
            this.oContextQuantityType = [];
            var contextDataModelForTimeType = new sap.ui.model.json.JSONModel();
            var contextDataModelForQuantityType = new sap.ui.model.json.JSONModel();
            var reasonCodeColumnVisibilityForQuantityType = false;
            var reasonCodeColumnVisibilityForTimeType = false;
  
            for (i = 0; i < oContext.results.length; i++) {
              if (
                oContext.results[i].dcElementType ==
                this.appData.constDCElementTypeForQuantity
              ) {
                this.oContextQuantityType.push(oContext.results[i]);
                if (
                  oContext.results[i].timeElementcategory ==
                  sap.oee.ui.oeeConstants.timeElementCategoryForLoss
                ) {
                  reasonCodeColumnVisibilityForQuantityType = true;
                }
              }
            }
  
            this.getView()
              .byId("reasonCodeColumnForQuantityType")
              .setVisible(reasonCodeColumnVisibilityForQuantityType);
  
            if (this.oContextQuantityType != undefined) {
              if (this.oContextQuantityType.length > 0) {
                contextDataModelForQuantityType.setData({
                  genericDataCollectionDataQuantityType: this
                    .oContextQuantityType,
                });
  
                for (
                  i = 0;
                  i <
                  contextDataModelForQuantityType.oData
                    .genericDataCollectionDataQuantityType.length;
                  i++
                ) {
                  for (k = 0; k < oData[0].Row.length; k++) {
                    if (
                      contextDataModelForQuantityType.oData
                        .genericDataCollectionDataQuantityType[i].description ==
                      oData[0].Row[k].NAME
                    )
                      contextDataModelForQuantityType.oData.genericDataCollectionDataQuantityType[
                        i
                      ].quantityReported = oData[0].Row[k].VALUE + "";
                  }
                }
  
                this.byId(
                  "reportOrderIndependentDataCollectionTableQuantityType"
                ).setModel(contextDataModelForQuantityType);
              } else if (this.oContextQuantityType.length == 0) {
                this.getView()
                  .byId("reportOrderIndependentDataCollectionTableQuantityType")
                  .setVisible(false);
              }
            }
          },
  
          handleValueHelpRequest: function (oEvent) {
            var uomListModel;
            var oIndex = 0;
            var oUOM = [];
            this._inputFieldForWhichValueHelpRequested = oEvent.getSource(); // Is Marked Private as can only be accessed once value help is Fired.
            if (
              this.oContextQuantityType != undefined &&
              this.oContextQuantityType.length > 0
            ) {
              for (i = 0; i < this.oContextQuantityType.length; i++) {
                if (
                  oEvent.getSource().getBindingContext().getObject().dcElement ==
                  this.oContextQuantityType[i].dcElement
                ) {
                  break;
                }
                oIndex++;
              }
              var oResults = this.interfaces.findAllUomsForAGivenUOM(
                this.appData.client,
                this.oContextQuantityType[oIndex].defaultUOM
              );
              if (
                oResults != undefined &&
                oResults.uomList &&
                oResults.uomList.results
              ) {
                var uomList = oResults.uomList.results;
                /*if (uomList.length > 0) {
                                    var getUOMTextRequest = [];
                                    for(var j=0; j<uomList.length ; j++){
                                        var temp = {"uom" : uomList[j]};
                                        getUOMTextRequest[j] = temp;
                                    }
                                    var uomTextList = this.interfaces.interfacesGetUOMTextsFromCache(getUOMTextRequest);
                                }*/
  
                /*for (var index = 0; index < uomList.length; index++) {
                                    var oUOMList = {};
                                    oUOMList.uom = uomList[index];
                                    oUOMList.description = uomTextList[uomList[index]];
                                    oUOM.push(oUOMList);
                                }
                                if(oResults != undefined){
                                    this.uomList =  {uomList : oUOM};
                                }*/
                uomListModel = new sap.ui.model.json.JSONModel({
                  uomList: uomList,
                });
                if (this.oUomDialog == undefined) {
                  this.oUomDialog = sap.ui.xmlfragment(
                    "sap.oee.ui.fragments.UOMPopup",
                    this
                  );
                  this.getView().addDependent(this.oUomDialog);
                  this.oUomDialog.attachSearch(this.uomSearch, this);
                  this.oUomDialog.attachLiveChange(this.uomSearch, this);
                }
                this.oUomDialog.setModel(uomListModel);
                this.oUomDialog.open();
              }
            }
          },
  
          uomSearch: function (oEvent) {
            var properties = [];
            properties.push("description");
            properties.push("uom");
            sap.oee.ui.Utils.uomSearch(
              oEvent.getSource()._oSearchField,
              this.oUomDialog.getModel(),
              this.oUomDialog.getBinding("items"),
              properties
            );
          },
  
          handleSelect: function (oEvent) {
            var oSource = oEvent.getParameter("selectedItem");
            var sUom = oSource.getBindingContext().getProperty("uom");
            var sUomText = oSource.getBindingContext().getProperty("description");
            if (this._inputFieldForWhichValueHelpRequested != undefined) {
              this._inputFieldForWhichValueHelpRequested
                .getBindingContext()
                .getObject().defaultUOM = sUom;
              this._inputFieldForWhichValueHelpRequested
                .getBindingContext()
                .getObject().defaultUOMText = sUomText;
              this._inputFieldForWhichValueHelpRequested.getModel().checkUpdate();
            }
          },
  
          handleCancel: function (oEvent) {
            if (this.detailsDialog != undefined) {
              sap.ui
                .getCore()
                .byId(
                  sap.ui.core.Fragment.createId("detailsFragment", "deleteButton")
                )
                .setEnabled(false);
            }
            oEvent.getSource().getParent().close();
          },
  
          onPressAddComments: function (oEvent) {
            var oIndex = 0;
  
            if (
              oEvent.getSource().getBindingContext().getObject().dcElementType ==
              this.appData.constDCElementTypeForQuantity
            ) {
              for (i = 0; i < this.oContextQuantityType.length; i++) {
                if (
                  oEvent.getSource().getBindingContext().getObject().dcElement ==
                  this.oContextQuantityType[i].dcElement
                ) {
                  break;
                }
                oIndex++;
              }
              var oResults = this.oContextQuantityType[oIndex];
            }
            this.oContextObject = oResults;
            /*if(oResults != undefined){
                            oCommentData =  {oComment : oResults};
                            var oCommentModel = new sap.ui.model.json.JSONModel();
                            oCommentModel.setData({oCommentData:{oComment: oResults}});
                        }*/
            if (this.oDialogComment == undefined) {
              this.oDialogComment = sap.ui.xmlfragment(
                "commentPopup",
                "sap.oee.ui.fragments.commentPopup",
                this
              );
              this.getView().addDependent(this.oDialogComment);
            }
            //this.oDialogComment.setModel(oCommentModel);
            var commentBox = sap.ui
              .getCore()
              .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"));
            commentBox.setValue(""); // Clear
            if (oResults.comments != "") {
              sap.ui
                .getCore()
                .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"))
                .setValue(oResults.comments);
            }
            this.oDialogComment.open();
          },
  
          onCommentDialogCancelButton: function (oEvent) {
            //oEvent.getSource().getModel().oData.oCommentData.oComment.comments = "" ;
            this.oDialogComment.close();
          },
  
          onCommentDialogSaveButton: function (oEvent) {
            /*var oCommentBox = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("commentPopup","comment"));
                        oEvent.getSource().getModel().getData().oCommentData.oComment.comments = oCommentBox.getValue();
                        oCommentBox.setValue("");
                        this.oDialogComment.close(); */
            var oCommentBox = sap.ui
              .getCore()
              .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"));
            this.oContextObject.comments = oCommentBox.getValue();
            //oCommentBox.setValue("");
            if (
              this.oContextObject.dcElementType ==
              this.appData.constDCElementTypeForQuantity
            ) {
              sap.oee.ui.Utils.updateModel(
                this.byId(
                  "reportOrderIndependentDataCollectionTableQuantityType"
                ).getModel()
              );
            } else {
              sap.oee.ui.Utils.updateModel(
                this.byId(
                  "reportOrderIndependentDataCollectionTableTimeType"
                ).getModel()
              );
            }
  
            this.oDialogComment.close();
          },
  
          onClickAddComments: function (oEvent) {
            var oContextObject = oEvent
              .getSource()
              .getBindingContext()
              .getObject();
            this.oContextObject = oContextObject;
            if (this.oDialogComment == undefined) {
              this.oDialogComment = sap.ui.xmlfragment(
                "commentPopup",
                "sap.oee.ui.fragments.commentPopup",
                this
              );
              this.getView().addDependent(this.oDialogComment);
            }
            var commentBox = sap.ui
              .getCore()
              .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"));
            commentBox.setValue(""); // Clear
            if (oContextObject.comments != "") {
              sap.ui
                .getCore()
                .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"))
                .setValue(oContextObject.comments);
            }
            this.oDialogComment.open();
          },
  
          onClickReasonCode: function (oEvent) {
            var reasonCodeLink = oEvent.getSource();
            sap.oee.ui.rcUtility.createReasonCodeToolPopup(
              this,
              reasonCodeLink,
              this.appData.client,
              this.appData.plant,
              this.appData.node.nodeID,
              reasonCodeLink.getBindingContext().getObject().dcElement,
              reasonCodeLink.getBindingContext().getObject(),
              "reasonCodeData"
            );
          },
  
          onChangeReportedQuantity: function (oEvent) {
            var oQuantity = oEvent.getSource().getValue();
            var qty = 0;
            if (
              this.oContextQuantityType != undefined &&
              this.oContextQuantityType.length > 0
            ) {
              var oIndex = 0;
              for (i = 0; i < this.oContextQuantityType.length; i++) {
                if (
                  oEvent.getSource().getBindingContext().getObject().dcElement ==
                  this.oContextQuantityType[i].dcElement
                ) {
                  break;
                }
                oIndex++;
              }
            }
            this.oContextQuantityType[oIndex].quantityReported = oQuantity;
            for (i = 0; i < this.oContextQuantityType.length; i++) {
              if (this.oContextQuantityType[i].quantityReported != "") {
                qty += parseFloat(this.oContextQuantityType[i].quantityReported);
              }
            }
            if (qty > 0) {
              this.byId("genericDataSaveButton").setEnabled(true);
              this.appData.user.currentUserLastName = this.appData.user.userID;
            } else {
              // this.byId("genericDataSaveButton").setEnabled(false);
            }
  
            sap.oee.ui.Utils.updateModel(
              this.byId(
                "reportOrderIndependentDataCollectionTableQuantityType"
              ).getModel()
            );
          },
  
          getSelectedTimeIn24HourFormat: function (oTime) {
            var oTemp1 = oTime.split(":");
            oTemp1[2] = "00";
            if (oTemp1[0] < 10) {
              oTemp1[0] = "0" + oTemp1[0];
            }
            var oTemp2 = oTemp1[1].split(" ");
            if (oTemp2[1] == "AM" && oTemp1[0] == 12) {
              oTemp1[0] = parseInt(oTemp1[0]) - 12;
            } else if (oTemp2[1] == "PM" && oTemp1[0] < 12) {
              oTemp1[0] = parseInt(oTemp1[0]) + 12;
            }
            return oTemp1[0] + ":" + oTemp2[0] + ":" + oTemp1[2];
          },
  
          getTimeFromMillisecondsTo12HourFormat: function (timeinMilliseconds) {
            var oEndTimeTemp1 = new Date(timeinMilliseconds)
              .toLocaleTimeString()
              .split(" ");
            var oEndTimeTemp2 = oEndTimeTemp1[0].split(" ")[0].split(":");
            return (
              oEndTimeTemp2[0] + ":" + oEndTimeTemp2[1] + " " + oEndTimeTemp1[1]
            );
          },
  
          timeStampOfSelectedTime: function (oSelectedTime) {
            return new Date(
              new Date(this.appData.shift.startTimestamp).toDateString() +
                " " +
                oSelectedTime
            ).getTime();
          },
  
          onPressDetails: function (oEvent) {
            var bindingContext = oEvent
              .getSource()
              .getBindingContext()
              .getObject();
  
            var oData = {
              description: bindingContext.description,
              dcElement: bindingContext.dcElement,
              isLossType:
                bindingContext.timeElementcategory ==
                sap.oee.ui.oeeConstants.timeElementCategoryForLoss,
              nodeId: this.selectedWU.nodeID,
              timeInterval: {
                startTimestamp: this.appData.shift.startTimestamp,
                endTimestamp: this.appData.shift.endTimestamp,
              },
              isMachineDataCollection: true,
              runForDataRetreival: this.orderIndependentRun.runID,
              dataRefreshMethod: this.renderUI,
              oMainController: this.getView().getController(),
            };
  
            this.appComponent
              .getEventBus()
              .publish(this.appComponent.getId(), "openDetailsHandler", oData);
          },
  
          reportData: function (oEvent) {
            jQuery.sap.require("sap.ui.core.format.NumberFormat");
            var floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance();
            var dataCollectionArray = [];
            if (
              this.oContextQuantityType != undefined &&
              this.oContextQuantityType.length > 0
            ) {
              for (
                var index = 0;
                index < this.oContextQuantityType.length;
                index++
              ) {
                if (
                  !sap.oee.ui.Utils.isQuantityValidForLocale(
                    this.oContextQuantityType[index].quantityReported
                  )
                ) {
                  return;
                }
                if (this.oContextQuantityType[index].quantityReported != "") {
                  var quantityToBeReported = floatFormatter.parse(
                    this.oContextQuantityType[index].quantityReported
                  );
                  var orderIndependentData = {};
                  orderIndependentData.client = this.appData.client;
                  orderIndependentData.plant = this.appData.plant;
                  orderIndependentData.nodeID = this.selectedWU.nodeID;
                  orderIndependentData.dcElementType =
                    sap.oee.ui.oeeConstants.dcElementTypeForOrderIndependentQuantity;
                  //orderIndependentData.runID = this.appData.selected.runID;
                  orderIndependentData.dcElement = this.oContextQuantityType[
                    index
                  ].dcElement;
                  orderIndependentData.quantity = quantityToBeReported;
                  orderIndependentData.uom = this.oContextQuantityType[
                    index
                  ].defaultUOM;
                  orderIndependentData.comments = this.oContextQuantityType[
                    index
                  ].comments;
                  if (
                    this.oContextQuantityType[index].reasonCodeData != undefined
                  ) {
                    if (this.oContextQuantityType[index].reasonCodeData != "") {
                      orderIndependentData.rc1 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode1;
                      orderIndependentData.rc2 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode2;
                      orderIndependentData.rc3 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode3;
                      orderIndependentData.rc4 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode4;
                      orderIndependentData.rc5 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode5;
                      orderIndependentData.rc6 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode6;
                      orderIndependentData.rc7 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode7;
                      orderIndependentData.rc8 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode8;
                      orderIndependentData.rc9 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode9;
                      orderIndependentData.rc10 = this.oContextQuantityType[
                        index
                      ].reasonCodeData.reasonCode10;
                    }
                  }
                  var currentTimeStamp = new Date(
                    this.interfaces.interfacesGetCurrentTimeInMsAfterTimeZoneAdjustments()
                  );
                  var shiftStartTimeStamp = new Date(
                    this.appData.shift.startDate +
                      " " +
                      this.appData.shift.startTime
                  );
                  var shiftEndTimeStamp = new Date(
                    this.appData.shift.endDate + " " + this.appData.shift.endTime
                  );
                  if (currentTimeStamp < shiftEndTimeStamp) {
                    orderIndependentData.startTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                      currentTimeStamp.getTime(),
                      this.appData.plantTimezoneOffset
                    );
                    orderIndependentData.endTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                      currentTimeStamp.getTime(),
                      this.appData.plantTimezoneOffset
                    );
                  } else {
                    var mostRecentReportingTime = sap.oee.ui.Utils.getMostRecentReportingTime(
                      this.appData.shift.startTimestamp,
                      this.appData.shift.endTimestamp,
                      this.appData.selected.startTimestamp
                    );
                    if (mostRecentReportingTime != undefined) {
                      orderIndependentData.startTimestamp = mostRecentReportingTime;
                      orderIndependentData.endTimestamp = mostRecentReportingTime;
                    }
                  }
                  this.insertTableTest(orderIndependentData);
                  dataCollectionArray.push(orderIndependentData);
                }
              }
            }
  
            if (dataCollectionArray.length > 0) {
              var reportContextDataResult = this.interfaces.interfacesReportQuantitiesForAllDataCollection(
                dataCollectionArray
              );
              if (reportContextDataResult != undefined) {
                if (reportContextDataResult.outputCode == 0) {
                  sap.oee.ui.Utils.toast(
                    this.appComponent.oBundle.getText(
                      "OEE_MESSAGE_SUCCESSFUL_SAVE"
                    )
                  );
                  //this.updateLastReportedDateTime(dataCollectionArray);
                  this.renderUI();
                }
              }
            }
          },
  
          insertTableTest: function (orderIndependentData) {
            var params = {
              "Param.1": orderIndependentData.dcElement,
              "Param.2": orderIndependentData.quantity,
              "Param.3": this.appData.user.currentUserLastName,
            };
  
            var tRunner = new TransactionRunner(
              "MES/Test/DataCollection/insertTestDataXquery",params
            );
            if (!tRunner.Execute()) {
              MessageBox.error(tRunner.GetErrorMessage());
              return null;
            }
          },
  
          updateLastReportedDateTime: function (dataReported) {
            var oTime = this.getTimeFromMillisecondsTo12HourFormat(
              new Date(
                new Date().toDateString() +
                  " " +
                  new Date().toTimeString().split(" ")[0]
              ).getTime()
            );
            var oDate = new Date().toDateString();
            for (i = 0; i < dataReported.length; i++) {
              if (
                this.oContextTimeType != undefined &&
                this.oContextTimeType.length > 0
              ) {
                for (index = 0; index < this.oContextTimeType.length; index++) {
                  if (
                    this.oContextTimeType[index].dcElement ==
                    dataReported[i].dcElement
                  ) {
                    this.oContextTimeType[index].lastReportedDateTime =
                      oDate + " " + oTime;
                  }
                }
                sap.oee.ui.Utils.updateModel(
                  this.byId(
                    "reportOrderIndependentDataCollectionTableTimeType"
                  ).getModel()
                );
              }
              if (
                this.oContextQuantityType != undefined &&
                this.oContextQuantityType.length > 0
              ) {
                for (
                  index = 0;
                  index < this.oContextQuantityType.length;
                  index++
                ) {
                  if (
                    this.oContextQuantityType[index].dcElement ==
                    dataReported[i].dcElement
                  ) {
                    this.oContextQuantityType[index].lastReportedDateTime =
                      oDate + " " + oTime;
                  }
                }
                sap.oee.ui.Utils.updateModel(
                  this.byId(
                    "reportOrderIndependentDataCollectionTableQuantityType"
                  ).getModel()
                );
              }
            }
          },
  
          checkIfValueReported: function (obj) {
            if (obj) {
              return true;
            } else return false;
          },
  
          onExit: function () {
            if (this.oDialogComment != undefined) {
              this.oDialogComment.destroy();
            }
  
            if (this.oUomDialog != undefined) {
              this.oUomDialog.destroy();
            }
            if (this.detailsDialog != undefined) {
              this.detailsDialog.destroy();
            }
  
            this.appComponent
              .getEventBus()
              .unsubscribe(
                this.appComponent.getId(),
                "shiftChanged",
                this.renderUI,
                this
              );
          },
  
          checkIfNotLossType: function (obj) {
            return obj == sap.oee.ui.oeeConstants.timeElementCategoryForLoss;
          },
        }
      );
    }
  );
  