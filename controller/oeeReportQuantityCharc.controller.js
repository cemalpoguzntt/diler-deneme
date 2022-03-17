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
    "use strict";
    this.screenObj;
    return Controller.extend(
      "customActivity/controller/oeeReportQuantityCharc",
      {
        goodQuantityDataCollection: undefined,
        rejectedQuantityDataCollection: undefined,
        dataCollectionElements: undefined,
        dataCollectionElementKeys: undefined,
        reportedProductionData: undefined,

        onInit: function () {
          this.appComponent = this.getView().getViewData().appComponent;
          this.appData = this.appComponent.getAppGlobalData();
          this.interfaces = this.appComponent.getODataInterface();
          this.appComponent
            .getEventBus()
            .subscribe(
              this.appComponent.getId(),
              "orderChanged",
              this.refreshScreenOnOrderChange,
              this
            );
          this.bindDataToCard();
          sap.oee.ui.Utils.attachChangeOrderDetails(
            this.appComponent,
            "orderCardFragment",
            this
          );
          this.reportProductionContent();
        },

        bindDataToCard: function () {
          sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent, this);
        },

        reportProductionContent: function () {
          if (!this.appData.anyOrderRunningInShift()) {
            // Do not proceed if not.
            return;
          }

          this.getDataCollectionElementsForProductionAndRejectedQuantities();
          this.getReportedProductionData();
          this.bindProductionDataToTable();
        },

        getDataCollectionElementsForProductionAndRejectedQuantities: function () {
          if (this.appData.dataCollectionElementListProduction == undefined) {
            this.appData.dataCollectionElementListProduction = this.interfaces.interfacesGetDCElementsForProductionAndRejectedQuantities();
            var dcElementListData = this.appData
              .dataCollectionElementListProduction;
          } else {
            var dcElementListData = this.appData
              .dataCollectionElementListProduction;
          }

          if (this.appData.defaultUom == undefined) {
            this.appData.defaultUom = this.interfaces.getCustomizationValueForNode(
              this.appData.client,
              this.appData.plant,
              this.appData.node.nodeID,
              sap.oee.ui.oeeConstants.customizationNames
                .defaultuomforproductionreporting
            );
          }
          if (this.appData.defaultUom != undefined) {
            if (
              this.appData.defaultUom.value ==
              sap.oee.ui.oeeConstants.uomType.productionUom
            ) {
              this.defaultUom = this.appData.selected.productionUom;
              this.defaultUomText = this.appData.selected.productionUomText;
            } else if (
              this.appData.defaultUom.value ==
              sap.oee.ui.oeeConstants.uomType.standardRateUom
            ) {
              this.defaultUom = this.appData.selected.standardRateUom;
              this.defaultUomText = this.appData.selected.stdRateUOMText;
            } else {
              this.defaultUom = this.appData.selected.order.baseUoM;
              this.defaultUomText = this.appData.selected.quantityReleasedUOMText;
            }
          } else {
            if (this.appData.selected.order.baseUoM != undefined) {
              this.defaultUom = this.appData.selected.order.baseUoM;
              this.defaultUomText = this.interfaces.interfacesGetTextForUOM(
                this.appData.selected.order.baseUoM
              );
            }
          }

          if (dcElementListData != undefined) {
            if (dcElementListData.dataCollectionElements != undefined) {
              if (dcElementListData.dataCollectionElements.results != null) {
                var dcElements =
                  dcElementListData.dataCollectionElements.results;
                if (dcElements != undefined && dcElements.length > 0) {
                  this.dataCollectionElements = [];
                  this.dataCollectionElementKeys = [];

                  for (var i = 0; i < dcElements.length; i++) {
                    this.dataCollectionElements.push(dcElements[i]);
                    this.dataCollectionElementKeys.push({
                      rowIndex: i,
                      dcElement: dcElements[i].dcElement,
                      quantity: "",
                      uom: this.defaultUom,
                      defaultUom: this.defaultUom,
                      uomText: this.defaultUomText,
                      defaultUomText: this.defaultUomText,
                      description: dcElements[i].description,
                      reasonCodeData: {},
                    });
                  }
                }
              }
            }
          }
        },

        getDataCollectionForDCElementKey: function (
          productionRunDataList,
          key
        ) {
          if (key != undefined && key != "") {
            for (var i = 0; i < productionRunDataList.length; i++) {
              if (productionRunDataList[i].dcElement == key) {
                return productionRunDataList[i];
              }
            }
          }
        },

        getDataCollectionElementForKey: function (key) {
          if (key != undefined && key != "") {
            for (var i = 0; i < this.dataCollectionElements.length; i++) {
              if (this.dataCollectionElements[i].dcElement == key) {
                return this.dataCollectionElements[i];
              }
            }
          }
        },

        handleValueHelpRequest: function (oEvent) {
          var uomListModel;
          var orunId = this.appData.selected.runID;
          this._inputFieldForWhichValueHelpRequested = oEvent.getSource(); // Is Marked Private as can only be accessed once value help is Fired.
          if (this.uomList == undefined) {
            var oResults = this.interfaces.getUOMByFilter(orunId, ["ALT"]);
            if (oResults != undefined) {
              if (oResults.uomList != undefined) {
                this.uomList = { uomList: oResults.uomList.results };
              }
            }
            uomListModel = new sap.ui.model.json.JSONModel(this.uomList);
            if (this.oUomDialog == undefined) {
              this.oUomDialog = sap.ui.xmlfragment(
                "sap.oee.ui.fragments.UOMPopup",
                this
              );
              this.getView().addDependent(this.oUomDialog);
              this.oUomDialog.setModel(uomListModel);
              this.oUomDialog.attachSearch(this.uomSearch, this);
              this.oUomDialog.attachLiveChange(this.uomSearch, this);
            }
          }
          this.oUomDialog.open();
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
              .getObject().uom = sUom;
            this._inputFieldForWhichValueHelpRequested
              .getBindingContext()
              .getObject().uomText = sUomText;
            this._inputFieldForWhichValueHelpRequested.getModel().checkUpdate();
          }
        },

        getReportedProductionData: function () {
          var productionData;
          this.reportedProductionData = [];
          if (
            this.dataCollectionElementKeys != undefined &&
            this.dataCollectionElementKeys.length > 0
          ) {
            this.dcElementList = [];
            for (i in this.dataCollectionElementKeys) {
              this.dcElementList.push({
                dcElement: this.dataCollectionElementKeys[i].dcElement,
              });
            }
            productionData = this.interfaces.interfacesGetTotalQuantityCollectedForDCElementsInBaseUom(
              this.dcElementList,
              this.appData.node.nodeID,
              "",
              true
            );
            if (productionData != undefined) {
              if (productionData.prodRunDataList != undefined) {
                var prodRunDataListResults =
                  productionData.prodRunDataList.results;
                for (var i = 0; i < this.dataCollectionElements.length; i++) {
                  var productionRunData = this.getDataCollectionForDCElementKey(
                    prodRunDataListResults,
                    this.dataCollectionElements[i].dcElement
                  );
                  if (productionRunData != undefined) {
                    var productionRun = {};
                    productionRun.rowIndex = i;
                    productionRun.dcElement = productionRunData.dcElement;
                    productionRun.batchNo = productionRunData.batchNo;
                    productionRun.serialNo = productionRunData.serialNo;

                    var dataCollectionElement = this.getDataCollectionElementForKey(
                      productionRunData.dcElement
                    );
                    if (dataCollectionElement != undefined) {
                      productionRun.description =
                        dataCollectionElement.description;
                      productionRun.dcElementType =
                        dataCollectionElement.dcElementType;
                      productionRun.quantity = "";
                      if (this.appData.selected.order.baseUoM != undefined) {
                        if (this.appData.defaultUom != undefined) {
                          if (
                            this.appData.defaultUom.value ==
                            sap.oee.ui.oeeConstants.uomType.productionUom
                          ) {
                            productionRun.defaultUom = this.appData.selected.productionUom;
                            productionRun.defaultUOMText = this.appData.selected.productionUomText;
                            productionRun.uom = this.appData.selected.productionUom;
                            productionRun.uomText = this.appData.selected.productionUomText;
                            productionRun.quantityReported = new Number(
                              productionRunData.quantityInProductionUom
                            ).toFixed(this.appData.decimalPrecision);
                          } else if (
                            this.appData.defaultUom.value ==
                            sap.oee.ui.oeeConstants.uomType.standardRateUom
                          ) {
                            productionRun.defaultUom = this.appData.selected.standardRateUom;
                            productionRun.defaultUOMText = this.appData.selected.stdRateUOMText;
                            productionRun.uom = this.appData.selected.standardRateUom;
                            productionRun.uomText = this.appData.selected.stdRateUOMText;
                            productionRun.quantityReported = new Number(
                              productionRunData.quantityInStdRateUom
                            ).toFixed(this.appData.decimalPrecision);
                          } else {
                            productionRun.defaultUom = this.appData.selected.order.baseUoM;
                            productionRun.defaultUOMText = this.appData.selected.quantityReleasedUOMText;
                            productionRun.uom = this.appData.selected.order.baseUoM;
                            productionRun.uomText = this.appData.selected.quantityReleasedUOMText;
                            productionRun.quantityReported = new Number(
                              productionRunData.quantityInBaseUom
                            ).toFixed(this.appData.decimalPrecision);
                          }
                        } else {
                          productionRun.defaultUom = this.appData.selected.order.baseUoM;
                          productionRun.defaultUOMText =
                            productionRunData.baseUomDesc;
                          productionRun.uom = this.appData.selected.order.baseUoM;
                          productionRun.uomText = this.appData.selected.quantityReleasedUOMText;
                          productionRun.quantityReported = new Number(
                            productionRunData.quantityInBaseUom
                          ).toFixed(this.appData.decimalPrecision);
                        }
                      } else {
                        productionRun.quantityReported = new Number(
                          "0"
                        ).toFixed(this.appData.decimalPrecision);
                        productionRun.defaultUom = "";
                        productionRun.defaultUOMText = "";
                        productionRun.uom = this.appData.selected.order.baseUoM;
                        productionRun.uomText = this.appData.selected.quantityReleasedUOMText;
                      }
                      productionRun.reportedBy = productionRunData.reportedBy;
                      productionRun.comments = "";
                      if (reasonCodeLink != undefined) {
                        reasonCodeLink.setText("Assign");
                      }
                      productionRun.reportedByTimeStamp =
                        productionRunData.changeTimestamp;
                    }
                    this.reportedProductionData.push(productionRun);
                  }
                }
              }
            }
          }
        },

        bindProductionDataToTable: function () {
          var oModel_productionQuantityModel = new sap.ui.model.json.JSONModel();
          oModel_productionQuantityModel.setData({
            productionData: this.reportedProductionData,
          });
          oModel_productionQuantityModel.setDefaultBindingMode(
            sap.ui.model.BindingMode.TwoWay
          );
          this.byId("reportProductionQuantityTable").setModel(
            oModel_productionQuantityModel
          );
        },

        checkIfNotLossType: function (obj) {
          return (
            obj == sap.oee.ui.oeeConstants.dcElementTypeForRejectedQuantity
          );
        },

        checkIfValueReported: function (obj) {
          if (obj) {
            return true;
          } else return false;
        },

        onClickShowListOfProductionData: function (oEvent) {
          var bindingContext = oEvent
            .getSource()
            .getBindingContext()
            .getObject();

          var oData = {
            description: bindingContext.description,
            dcElement: bindingContext.dcElement,
            isLossType:
              bindingContext.dcElementType ==
              sap.oee.ui.oeeConstants.dcElementTypeForRejectedQuantity,
            dataRefreshMethod: this.refreshProductionQuantityReported,
            oMainController: this.getView().getController(),
          };

          this.appComponent
            .getEventBus()
            .publish(this.appComponent.getId(), "openDetailsHandler", oData);
        },

        onClickOpenReasonCodeUtilityPopup: function (oEvent) {
          var reasonCodeLink = oEvent.getSource();
          var selectedElement = oEvent
            .getSource()
            .getBindingContext()
            .getObject().dcElement;
          var selectedRowId = oEvent.getSource().getBindingContext().getObject()
            .rowIndex;
          var oContextObject = this.reportedProductionData[selectedRowId];
          var oInterfaceReference = this.interfaces;
          var oAppData = this.appData;
          var oController = this.getView().getController();
          var callback = function () {
            if (oContextObject.reasonCodeData != undefined) {
            }
          };
          sap.oee.ui.rcUtility.createReasonCodeToolPopup(
            this,
            reasonCodeLink,
            this.appData.client,
            this.appData.plant,
            this.appData.node.nodeID,
            selectedElement,
            this.reportedProductionData[selectedRowId],
            "reasonCodeData",
            undefined,
            callback
          );
        },

        onClickAddComments: function (oEvent) {
          var selectedRowIndex = oEvent
            .getSource()
            .getBindingContext()
            .getObject().rowIndex;
          var oResultsObject = this.reportedProductionData[selectedRowIndex];
          if (!oResultsObject) {
            var oResultsObject = oEvent
              .getSource()
              .getBindingContext()
              .getObject();
          }

          this.selectedRowIndex = selectedRowIndex;

          if (this.oCommentsDialog == undefined) {
            this.oCommentsDialog = sap.ui.xmlfragment(
              "commentPopup",
              "sap.oee.ui.fragments.commentPopup",
              this
            );
            this.getView().addDependent(this.oCommentsDialog);
          }
          var commentBox = sap.ui
            .getCore()
            .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"));
          commentBox.setValue(""); // Clear

          if (oResultsObject != undefined) {
            if (oResultsObject.comments != "") {
              sap.ui
                .getCore()
                .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"))
                .setValue(oResultsObject.comments);
            }
          }
          this.oCommentsDialog.open();
        },

        onCommentDialogCancelButton: function (oEvent) {
          var oResultsObject = this.reportedProductionData[
            this.selectedRowIndex
          ];
          this.oCommentsDialog.close();
        },

        onCommentDialogSaveButton: function (oEvent) {
          var oResultsObject = this.reportedProductionData[
            this.selectedRowIndex
          ];
          var oCommentBox = sap.ui
            .getCore()
            .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"));
          if (oResultsObject) {
            this.reportedProductionData[
              this.selectedRowIndex
            ].comments = oCommentBox.getValue();
            sap.oee.ui.Utils.updateModel(
              this.byId("reportProductionQuantityTable").getModel()
            );
          }

          this.oCommentsDialog.close();
        },

        refreshProductionQuantityReported: function () {
          this.bindDataToCard();
          this.getReportedProductionData();
          this.bindProductionDataToTable();
        },

        refreshScreenOnOrderChange: function () {
          this.getDataCollectionElementsForProductionAndRejectedQuantities();
          this.refreshProductionQuantityReported();
        },

        onClickRefreshScreen: function (oEvent) {
          this.refreshProductionQuantityReported();
        },

        reportProductionQuantity: function () {
          jQuery.sap.require("sap.ui.core.format.NumberFormat");
          var floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance();
          this.goodQuantityDataCollection = [];
          this.rejectedQuantityDataCollection = [];
          if (
            this.reportedProductionData != undefined &&
            this.reportedProductionData.length > 0
          ) {
            for (i in this.reportedProductionData) {
              var mostRecentReportingTime = sap.oee.ui.Utils.getMostRecentReportingTime(
                this.appData.shift.startTimestamp,
                this.appData.shift.endTimestamp,
                this.appData.selected.startTimestamp
              );
              var quantityToBeReported = this.reportedProductionData[i]
                .quantity;
              var uomForQuantityToBeReported = this.reportedProductionData[i]
                .uom;
              if (
                quantityToBeReported != undefined &&
                quantityToBeReported != "" &&
                uomForQuantityToBeReported != ""
              ) {
                var reportedData = {};
                if (
                  !sap.oee.ui.Utils.isQuantityValidForLocale(
                    quantityToBeReported
                  )
                ) {
                  return false;
                } else {
                  quantityToBeReported = floatFormatter.parse(
                    quantityToBeReported
                  );
                }

                reportedData.client = this.appData.client;
                reportedData.plant = this.appData.plant;
                reportedData.runID = this.appData.selected.runID;
                reportedData.nodeID = this.appData.node.nodeID;
                reportedData.material = this.appData.selected.material.id;
                reportedData.comments = this.reportedProductionData[i].comments;
                reportedData.batchNo = this.reportedProductionData[
                  i
                ].batchNumber;
                reportedData.serialNo = this.reportedProductionData[i].serialNo;
                reportedData.dcElementType = this.reportedProductionData[
                  i
                ].dcElementType;
                if (
                  this.reportedProductionData[i].reasonCodeData != undefined
                ) {
                  reportedData.rc1 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode1;
                  reportedData.rc2 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode2;
                  reportedData.rc3 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode3;
                  reportedData.rc4 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode4;
                  reportedData.rc5 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode5;
                  reportedData.rc6 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode6;
                  reportedData.rc7 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode7;
                  reportedData.rc8 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode8;
                  reportedData.rc9 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode9;
                  reportedData.rc10 = this.reportedProductionData[
                    i
                  ].reasonCodeData.reasonCode10;
                }
                var currentTime = new Date().getTime();
                var shiftEndTime = this.appData.shift.endTimestamp;
                if (currentTime < shiftEndTime) {
                  reportedData.startTimestamp = currentTime;
                  reportedData.endTimestamp = currentTime;
                } else {
                  if (mostRecentReportingTime != undefined) {
                    reportedData.startTimestamp = mostRecentReportingTime;
                    reportedData.endTimestamp = mostRecentReportingTime;
                  }
                }
                reportedData.dcElement = this.reportedProductionData[
                  i
                ].dcElement;
                reportedData.quantity = quantityToBeReported;
                reportedData.uom = uomForQuantityToBeReported;
                if (
                  this.reportedProductionData[i].dcElementType ==
                  "GOOD_QUANTITY"
                ) {
                  this.goodQuantityDataCollection.push(reportedData);
                } else if (
                  this.reportedProductionData[i].dcElementType ==
                  "REJECTED_QUANTITY"
                ) {
                  this.rejectedQuantityDataCollection.push(reportedData);
                }
              }
            }
          }

          return true;
        },

        onClickSaveReportedQuantity: function (oEvent) {
          var result;
          var validDC = this.reportProductionQuantity();

          if (validDC) {
            var goodAndRejectedDataCollection = [];
            if (
              this.goodQuantityDataCollection != undefined &&
              this.goodQuantityDataCollection.length > 0
            ) {
              goodAndRejectedDataCollection = goodAndRejectedDataCollection.concat(
                this.goodQuantityDataCollection
              );
            }
            if (
              this.rejectedQuantityDataCollection != undefined &&
              this.rejectedQuantityDataCollection.length > 0
            ) {
              goodAndRejectedDataCollection = goodAndRejectedDataCollection.concat(
                this.rejectedQuantityDataCollection
              );
            }
            if (
              goodAndRejectedDataCollection != undefined &&
              goodAndRejectedDataCollection.length > 0
            ) {
              result = this.interfaces.interfacesReportQuantitiesForAllDataCollection(
                goodAndRejectedDataCollection
              );
            }
            if (result != undefined && result.outputCode != undefined) {
              if (result.outputCode == 0) {
                this.refreshProductionQuantityReported();
                sap.oee.ui.Utils.toast(
                  this.appComponent.oBundle.getText(
                    "OEE_MESSAGE_SUCCESSFUL_SAVE"
                  )
                );
              }
            } else {
              sap.oee.ui.Utils.createMessage(
                this.appComponent.oBundle.getText("OEE_ERR_MSG_NO_QTY"),
                sap.ui.core.MessageType.Error
              );
            }
          }
        },

        onChangeValidateQuantity: function (oEvent) {
          sap.oee.ui.Utils.isQuantityValidForLocale(
            oEvent.getParameter("newValue"),
            oEvent.getSource()
          );
        },

        checkIfBatchRelevant: function () {
          if (this.appData.selected.material.batchRelevant) {
            var batchNoMandatory = this.interfaces.getCustomizationValueForNode(
              this.appData.client,
              this.appData.plant,
              this.appData.node.nodeID,
              sap.oee.ui.oeeConstants.customizationNames.batchNumberMandatory
            );
            if (batchNoMandatory.value == "YES") return true;
            else return false;
          }
          return this.appData.selected.material.batchRelevant;
        },

        checkIfSerialRelevant: function () {
          if (this.appData.selected.material.serialNoRelevant) {
            var serialNoMandatory = this.interfaces.getCustomizationValueForNode(
              this.appData.client,
              this.appData.plant,
              this.appData.node.nodeID,
              sap.oee.ui.oeeConstants.customizationNames.serialNumberMandatory
            );
            if (serialNoMandatory.value == "YES") return true;
            else return false;
          }

          return this.appData.selected.material.serialNoRelevant;
        },

        onSelectEnableDeleteButton: function () {
          var oDetailsTable = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId("detailsFragment", "detailsTable")
            );
          if (oDetailsTable.getSelectedItems().length > 0) {
            sap.ui
              .getCore()
              .byId(
                sap.ui.core.Fragment.createId("detailsFragment", "deleteButton")
              )
              .setEnabled(true);
          } else {
            sap.ui
              .getCore()
              .byId(
                sap.ui.core.Fragment.createId("detailsFragment", "deleteButton")
              )
              .setEnabled(false);
          }
        },

        onExit: function () {
          if (this.oCommentsDialog != undefined) {
            this.oCommentsDialog.destroy();
          }

          if (this.detailsDialog != undefined) {
            this.detailsDialog.destroy();
          }

          this.appComponent
            .getEventBus()
            .unsubscribe(
              this.appComponent.getId(),
              "orderChanged",
              this.refreshScreenOnOrderChange,
              this
            );
        },
      }
    );
  }
);
