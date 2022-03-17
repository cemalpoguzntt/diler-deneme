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
      "sap/ui/core/Fragment",
      "sap/m/Dialog",
      "sap/m/Label",
      "sap/m/Button",
      "sap/m/ButtonType",
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
      FilterType,
      Fragment,
      Dialog,
      Label,
      Button,
      ButtonType
    ) {
      "use strict";
      this.screenObj;
      return Controller.extend(
        "customActivity.controller.oeeReportQuantitySteelSdm",
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
            this.screenObj = {};
            this.getAllCharacteristic();
           // this.getAllQuantityTon();
         /*   this.appComponent
              .getEventBus()
              .subscribe(
                this.appComponent.getId(),
                "orderChanged",
                this.refreshScreenOnOrderChange,
                this
              );*/
            this.bindDataToCard();
            sap.oee.ui.Utils.attachChangeOrderDetails(
              this.appComponent,
              "orderCardFragment",
              this
            );
            this.reportProductionContent();
          },
          slashFunction: function(inputValue){
            return (!inputValue) ? "" : " / " + inputValue;
          },
  
          bindDataToCard: function () {
            sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent, this);
          },
  
          reportProductionContent: function () {
            if (!this.appData.anyOrderRunningInShift()) {
              // Do not proceed if not.
              return;
            }
  
            this.getReportedProductionData();
            this.bindProductionDataToTable();
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
             
              if(!jsData[0].Row){
                  var result = "";
              }
              else{
                  var result = jsData[0].Row[0].NOTE;
              }
              this.getView().byId("shiftNoteText").setValue(result); 
              //this.getView().setModel(oModel, "shiftNoteModel");
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
              productionData =
                this.interfaces.interfacesGetTotalQuantityCollectedForDCElementsInBaseUom(
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
  
                      var dataCollectionElement =
                        this.getDataCollectionElementForKey(
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
                              productionRun.defaultUom =
                                this.appData.selected.productionUom;
                              productionRun.defaultUOMText =
                                this.appData.selected.productionUomText;
                              productionRun.uom =
                                this.appData.selected.productionUom;
                              productionRun.uomText =
                                this.appData.selected.productionUomText;
                              productionRun.quantityReported = new Number(
                                productionRunData.quantityInProductionUom
                              ).toFixed(this.appData.decimalPrecision);
                            } else if (
                              this.appData.defaultUom.value ==
                              sap.oee.ui.oeeConstants.uomType.standardRateUom
                            ) {
                              productionRun.defaultUom =
                                this.appData.selected.standardRateUom;
                              productionRun.defaultUOMText =
                                this.appData.selected.stdRateUOMText;
                              productionRun.uom =
                                this.appData.selected.standardRateUom;
                              productionRun.uomText =
                                this.appData.selected.stdRateUOMText;
                              productionRun.quantityReported = new Number(
                                productionRunData.quantityInStdRateUom
                              ).toFixed(this.appData.decimalPrecision);
                            } else {
                              productionRun.defaultUom =
                                this.appData.selected.order.baseUoM;
                              productionRun.defaultUOMText =
                                this.appData.selected.quantityReleasedUOMText;
                              productionRun.uom =
                                this.appData.selected.order.baseUoM;
                              productionRun.uomText =
                                this.appData.selected.quantityReleasedUOMText;
                              productionRun.quantityReported = new Number(
                                productionRunData.quantityInBaseUom
                              ).toFixed(this.appData.decimalPrecision);
                            }
                          } else {
                            productionRun.defaultUom =
                              this.appData.selected.order.baseUoM;
                            productionRun.defaultUOMText =
                              productionRunData.baseUomDesc;
                            productionRun.uom =
                              this.appData.selected.order.baseUoM;
                            productionRun.uomText =
                              this.appData.selected.quantityReleasedUOMText;
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
                          productionRun.uomText =
                            this.appData.selected.quantityReleasedUOMText;
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
            var productionData = this.reportedProductionData;
            var confirmMaterial = this.getConfirmMaterial();
            var confirmModel = [];
  
            if (confirmMaterial != undefined) {
              confirmMaterial.forEach(function (item, index) {
                confirmModel.push({
                  batchNo: undefined,
                  comments: "",
                  dcElement: "GOOD_QUANTITY",
                  dcElementType: "GOOD_QUANTITY",
                  defaultUOMText: item.UOM_T,
                  defaultUom: item.UOM_K,
                  description: item.MATNR,
                  quantity: "",
                  quantityReported: item.QUANTITY,
                  reportedBy: undefined,
                  reportedByTimeStamp: productionData[0]?.reportedByTimeStamp,
                  rowIndex: item.ROWINDEX - 1,
                  serialNo: undefined,
                  uom: item.UOM_K,
                  uomText: item.UOM_T,
                  XCHPF: item.XCHPF,
                });
              }, this);
            }
            if (confirmMaterial != undefined) {
              if (confirmMaterial.length > 0)
                this.screenObj.uom = confirmMaterial[0];
            }
  
            var oModel = new sap.ui.model.json.JSONModel();
            confirmModel = this.filterSiviClkEsUrun(confirmModel);
            oModel.setData({
              productionData: confirmModel,
            });
  
            this.byId("reportProductionQuantityTable").setModel(oModel);
          },
  
          checkIfNotLossType: function (obj) {
            return (
              obj == sap.oee.ui.oeeConstants.dcElementTypeForRejectedQuantity
            );
          },
          filterSiviClkEsUrun: function (obj) {
            let esUrunElement;
            for (let index = 0; index < obj.length; index++) {
              const element = obj[index];
  
              if (element.description == "SIVI_CELIK_ES_U") {
                esUrunElement = element;
                obj.splice(index, 1);
                obj.push(esUrunElement);
              }
            }
  
            return obj;
          },
          checkIfValueReported: function (obj) {
            if (obj) {
              return true;
            } else return false;
          },
  
          onClickShowListOfProductionData: function (oEvent) {
            var oView = this.getView();
            var oDialog = oView.byId("confirmScreenButtonDetails");
            if (!oDialog) {
              oDialog = sap.ui.xmlfragment(
                oView.getId(),
                "customActivity.fragmentView.liquidSteelConfirmScreenButtonDetails",
                this
              );
              oView.addDependent(oDialog);
            }
            oDialog.open();
            this.appData.oDialog = oDialog;
            var sPath = oEvent.getSource().getParent().getBindingContextPath();
            var chosenRow = sPath.split("/productionData/")[1];
            var material = this.getView()
              .byId("reportProductionQuantityTable")
              .getModel().oData.productionData[chosenRow].description;
            var releasedID = this.appData.selected.releasedID;
            this.screenObj.material = material;
            this.getliquidSteelConfirmButtonDetails(releasedID);
          },
  
          getliquidSteelConfirmButtonDetails: function (releasedID) {
            var aufnr = this.appData.selected.order.orderNo;
            var params = { "Param.1": aufnr, "Param.2": this.screenObj.material };
            var tRunner = new TransactionRunner(
              "MES/UI/ReportQuantitySteel/getButtonDetailsQry",
              params
            );
            if (!tRunner.Execute()) {
              MessageBox.error(tRunner.GetErrorMessage());
              return null;
            }
            var oData = tRunner.GetJSONData();
            var jsData = oData[0].Row;
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(jsData);
            this.getView().byId("productionTableFragment").setModel(oModel);
          },
  
          onClickOpenReasonCodeUtilityPopup: function (oEvent) {
            var reasonCodeLink = oEvent.getSource();
            var selectedElement = oEvent
              .getSource()
              .getBindingContext()
              .getObject().dcElement;
            var selectedRowId = oEvent
              .getSource()
              .getBindingContext()
              .getObject().rowIndex;
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
            var oResultsObject =
              this.reportedProductionData[this.selectedRowIndex];
            this.oCommentsDialog.close();
          },
  
          onCommentDialogSaveButton: function (oEvent) {
            var oResultsObject =
              this.reportedProductionData[this.selectedRowIndex];
            var oCommentBox = sap.ui
              .getCore()
              .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"));
            if (oResultsObject) {
              this.reportedProductionData[this.selectedRowIndex].comments =
                oCommentBox.getValue();
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
            this.refreshProductionQuantityReported();
          },
  
          onClickRefreshScreen: function (oEvent) {
            this.refreshProductionQuantityReported();
          },
  
          reportProductionQuantity: function () {
            jQuery.sap.require("sap.ui.core.format.NumberFormat");
            var floatFormatter =
              sap.ui.core.format.NumberFormat.getFloatInstance();
            this.goodQuantityDataCollection = [];
            this.rejectedQuantityDataCollection = [];
            if (
              this.reportedProductionData != undefined &&
              this.reportedProductionData.length > 0
            ) {
              for (i in this.reportedProductionData) {
                var mostRecentReportingTime =
                  sap.oee.ui.Utils.getMostRecentReportingTime(
                    this.appData.shift.startTimestamp,
                    this.appData.shift.endTimestamp,
                    this.appData.selected.startTimestamp
                  );
                var quantityToBeReported =
                  this.reportedProductionData[i].quantity;
                var uomForQuantityToBeReported =
                  this.reportedProductionData[i].uom;
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
                    quantityToBeReported =
                      floatFormatter.parse(quantityToBeReported);
                  }
  
                  reportedData.client = this.appData.client;
                  reportedData.plant = this.appData.plant;
                  reportedData.runID = this.appData.selected.runID;
                  reportedData.nodeID = this.appData.node.nodeID;
                  reportedData.material = this.appData.selected.material.id;
                  reportedData.comments = this.reportedProductionData[i].comments;
                  reportedData.batchNo =
                    this.reportedProductionData[i].batchNumber;
                  reportedData.serialNo = this.reportedProductionData[i].serialNo;
                  reportedData.dcElementType =
                    this.reportedProductionData[i].dcElementType;
                  if (
                    this.reportedProductionData[i].reasonCodeData != undefined
                  ) {
                    reportedData.rc1 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode1;
                    reportedData.rc2 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode2;
                    reportedData.rc3 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode3;
                    reportedData.rc4 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode4;
                    reportedData.rc5 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode5;
                    reportedData.rc6 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode6;
                    reportedData.rc7 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode7;
                    reportedData.rc8 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode8;
                    reportedData.rc9 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode9;
                    reportedData.rc10 =
                      this.reportedProductionData[i].reasonCodeData.reasonCode10;
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
                  reportedData.dcElement =
                    this.reportedProductionData[i].dcElement;
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
  
          callReportConfirmation: function (p_this, p_data) {
            sap.m.MessageToast.show(
              p_this
                .getView()
                .getModel("i18n")
                .getResourceBundle()
                .getText("OEE_DETAILSPAGE_STATUS")
            );
            p_this.onInit()
          },
  
          onClickSaveReportedQuantity: function (oEvent) {
            var table = this.getView().byId("reportProductionQuantityTable");
            var productionData = table.getModel().oData.productionData;
            var appData = this.appData;
            var runID = appData.selected.runID;
            var client = appData.client;
            var nodeID = appData.node.nodeID;
            var plant = this.appData.plant;
            var aufnr = this.appData.selected.order.orderNo;
            var userID = this.appData.user.userID;
            var tableData = JSON.stringify(productionData);
            var params = {
              I_RUNID: runID,
              I_CLIENT: client,
              I_PLANT: plant,
              I_NODEID: nodeID,
              I_AUFNR: aufnr,
              I_TABLEDATA: tableData,
              I_USERID: userID,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/ReportQuantitySteel/reportConfirmation/reportConfirmationXquery",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callReportConfirmation);
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
              var serialNoMandatory =
                this.interfaces.getCustomizationValueForNode(
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
    bindDataToCard: function () {
                      sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent, this);
                      sap.oee.ui.Utils.attachChangeOrderDetails(
                          this.appComponent,
                          "orderCardFragment",
                          this
                      );
                  },
  
          getConfirmMaterial: function () {
            var plant = this.appData.plant;
            var aufnr = this.appData.selected.order.orderNo;
            var nodeID = this.appData.node.nodeID;
            var language = this.appData.userLocale.split("-")[0];
            var params = {
              "Param.1": plant,
              "Param.2": aufnr,
              "Param.3": nodeID,
              "Param.4": language,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/ReportQuantitySteel/getConfirmMaterialQry",
              params
            );
            if (!tRunner.Execute()) {
              MessageBox.error(tRunner.GetErrorMessage());
              return null;
            }
  
            var jsData = tRunner.GetJSONData();
            return jsData[0].Row;
          },
          onClickOpenNewMaterial: function () {
            var oView = this.getView();
            var oDialog = oView.byId("openNewMaterial");
            if (!oDialog) {
              oDialog = sap.ui.xmlfragment(
                oView.getId(),
                "customActivity.fragmentView.openNewMaterial",
                this
              );
              oView.addDependent(oDialog);
            }
            oDialog.open();
            this.appData.oDialog = oDialog;
            this.getNewMaterials();
          },
  
          callNewMaterials: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            if (!p_data.Rowsets.Rowset[0].Row) return;
            oModel.setData(p_data.Rowsets.Rowset[0].Row);
            p_this.getView().setModel(oModel, "materialsModel");
          },
  
          getNewMaterials: function () {
            var plant = this.appData.plant;
            var language = this.appData.userLocale.split("-")[0];
            var params = { "Param.1": plant, "Param.2": language };
            var tRunner = new TransactionRunner(
              "MES/UI/ReportQuantitySteel/getNewMaterialsQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callNewMaterials);
          },
  
          onPressInsertMaterial: function () {
            var errorStatus = false;
            var newProduction = {};
            var selectMaterial = this.getView()
              .byId("selectMaterial")
              .getSelectedKey();
            var table = this.getView().byId("reportProductionQuantityTable");
            var rows = table.getModel().oData.productionData;
            for (var i = 0; i < rows.length; i++) {
              if (selectMaterial == rows[i].description) errorStatus = true;
            }
  
            if (errorStatus) {
              sap.m.MessageBox.error(
                this.getView()
                  .getModel("i18n")
                  .getResourceBundle()
                  .getText("OEE_LABEL_PLEASE_CONTROL")
              );
              return;
            }
  
            rows.push({
              batchNo: undefined,
              comments: "",
              dcElement: "GOOD_QUANTITY",
              dcElementType: "GOOD_QUANTITY",
              defaultUOMText: "ton",
              defaultUom: "TO",
              description: selectMaterial,
              quantity: "",
              quantityReported: "0.00",
              reportedBy: undefined,
              reportedByTimeStamp: "",
              rowIndex: rows.length + 1,
              serialNo: undefined,
              uom: "TO",
              uomText: "ton",
            });
  
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({
              productionData: rows,
            });
            this.byId("reportProductionQuantityTable").setModel(oModel);
            this.handleCancel();
          },
  
          callrefreshTableQuantity: function (p_this, p_data) {
            var rows = p_data.Rowsets.Rowset[0].Row;
            var oTable = p_this.getView().byId("reportProductionQuantityTable");
            var tableRows = oTable.getModel().oData.productionData;
  
            for (var i = 0; i < rows.length; i++) {
              for (var k = 0; k < tableRows.length; k++) {
                if (rows[i].MATNR == tableRows[k].description) {
                  tableRows[k].quantity = "";
                  tableRows[k].quantityReported = rows[i].QUANTITY;
                }
              }
            }
            var oModel = new sap.ui.model.json.JSONModel();
  
            oModel.setData({
              productionData: tableRows,
            });
  
            p_this.bindProductionDataToTable();
  
            p_this.getView("reportProductionQuantityTable").setModel(oModel);
          },
  
          refreshTableQuantity: function () {
            var nodeID = this.appData.node.nodeID;
            var aufnr = this.appData.selected.order.orderNo;
            var params = { "Param.1": nodeID, "Param.2": aufnr };
            var tRunner = new TransactionRunner(
              "MES/UI/ReportQuantitySteel/getQuantityReportedQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callrefreshTableQuantity);
          },
  
          handleCancel: function () {
            this.appData.oDialog.close();
          },
          getAllCharacteristic: function () {
              var i;
            var allCharJSON = {};
                    var workorder = this.appData.selected.order.orderNo;
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
                        /*var oModell = new sap.ui.model.json.JSONModel();
                        oModell.setData(oData2[0].Row);
                        this.getView().getModel("allCharacteristicModel").oData.Ordes2 = oData2[0].Row[0];
                        this.getView().getModel("allCharacteristicModel").refresh();*/
                        var sData = oModel.getData();
                        sData.Ordes2 = oData2[0].Row[0];
                        oModel.setData(sData);
                    }

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
  
          onPressDeleteConfirmation: function (p_this, p_data) {
            var oTable = this.getView().byId("productionTableFragment");
            var oData = oTable.getModel().oData;
            var sPath = oTable.getSelectedContextPaths();
            var chosenRow = sPath[0].split("/")[1];
  
            var textMessage = "Teyidi iptal etmek istediğinize emin misiniz?";
            var self = this;
  
            var oDialog = new Dialog({
              title: "Yeniden Dene",
              type: "Message",
              content: [
                new Label({
                  text: textMessage,
                }),
              ],
              beginButton: new Button("id", {
                type: ButtonType.Accept,
                text: "Onayla",
                press: function () {
                  sap.ui.getCore().byId("id").setEnabled(false);
                  window.setTimeout(function () {
                    var params = {
                      I_CONF_NUMBER: oData[chosenRow].CONF_NUMBER,
                      I_CONF_COUNTER: oData[chosenRow].CONF_COUNTER,
                      I_ENTRYID: oData[chosenRow].ENTRY_ID,
                      I_AUFNR: oData[chosenRow].AUFNR,
                      I_STATUS: oData[chosenRow].STATU,
                    };
                    var tRunner = new TransactionRunner(
                      "MES/UI/ConfirmationList/confirmCancelXquery",
                      params
                    );
                    if (!tRunner.Execute()) {
                      MessageBox.error(tRunner.GetErrorMessage());
                      return null;
                    }
  
                    oDialog.close();
                  }, 500);
                },
              }),
              endButton: new Button({
                text: "İptal",
                press: function () {
                  oDialog.close();
                },
              }),
              afterClose: function () {
                oDialog.destroy();
                self.bindProductionDataToTable();
              },
            });
            oDialog.open();
          },
  
  
  
    onCommentDialogSaveButton1: function (oEvent) {
            var plant = this.appData.plant;
            //var note = "";
        var note = this.getView().byId("commentSdm").getValue();
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
           "I_PLANT": plant,
                          "I_CASTID": castID,
                          "I_NOTIFDESC": note,
                          "I_COLUMN_NAME": columnName
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
            //this.oeeRefreshActivity();
          },
    
          handleExit: function () {
            this.getView().byId("castNote").destroy();
          },
    
          onExit: function () {
            if (this.oPopOver) {
              this.oPopOver.destroy();
            }
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
      I_NOTIFDESC: note
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
       handleTitleSelectorPress : function(){ 
            var ordersModel = new sap.ui.model.json.JSONModel();
            var outputOrderStatusList = this.interfaces.interfacesGetOrderStatusForRunsStartedInShiftInputSync(this.appData.node.nodeID,this.appData.client,this.appData.plant,this.appData.shift.shiftID,this.appData.shift.shiftGrouping,this.appData.shift.startTimestamp,this.appData.shift.endTimestamp,false);
            if(outputOrderStatusList != undefined){
              if(outputOrderStatusList.orderStatusList != undefined){
                if(outputOrderStatusList.orderStatusList.results != undefined){
                  if(outputOrderStatusList.orderStatusList.results.length != 0){
                    ordersModel.setData({orders : outputOrderStatusList.orderStatusList.results});
                    for( var i =0; i < ordersModel.oData.orders.length; i++){ 
                     var params = {
                      "Param.1": ordersModel.oData.orders[i].order
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
                    outputOrderStatusList.orderStatusList.results[i]["CASTID"]=jsData[0].Row[0].CASTID
                    
                  }
                }
              }
            }
          }
          
          if(this.oPopOver == undefined){
            this.oPopOver = sap.ui.xmlfragment("popoverReportQS","sap.oee.ui.fragments.orderChangeDialog",this);
            this.oPopOver.setTitle(this.appComponent.oBundle.getText("OEE_HEADING_SELECT_ORDER"));
            var buttonTemplate = new sap.m.ObjectListItem({title : "{parts : [{path: 'order'},{path: 'CASTID'}], formatter : 'sap.oee.ui.Formatter.formatOrderNumber'}",attributes : [new sap.m.ObjectAttribute({text : "{material_desc}"}),new sap.m.ObjectAttribute({text : "{parts : [{path: 'orderStartTimestamp'},{path: 'appData>/plantTimezoneOffset'},{path : 'appData>/plantTimezoneKey'}], formatter : 'sap.oee.ui.Formatter.formatTimeStampWithoutLabel'}"})],type : "Active",firstStatus : new sap.m.ObjectStatus({text:"{parts : [{path: 'statusDescription'},{path: 'productionActivity'}], formatter : 'sap.oee.ui.Formatter.formatStatusTextAndActivity'}"})});
            
            this.oPopOver.bindAggregation("items","/orders",buttonTemplate);
            this.oPopOver.attachConfirm(this.selectOrder,this);
            this.oPopOver.attachSearch(this.orderSearch,this);
            this.oPopOver.attachLiveChange(this.orderSearch,this);
          }
          
          this.oPopOver.setModel(ordersModel);
          this.oPopOver.open();
        },
        selectOrder : function(oEvent){
          var oSource = oEvent.getParameter("selectedItem");
          if(oSource != undefined){
            var sRunID = oSource.getBindingContext().getProperty("runID");
            if(sRunID != undefined){
              this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChange",{runID : sRunID});
            }
          }
  
   this.getAllCharacteristic();
            //this.getAllQuantityTon();
  
            this.bindDataToCard();
            sap.oee.ui.Utils.attachChangeOrderDetails(
              this.appComponent,
              "orderCardFragment",
              this
            );
            this.reportProductionContent();
        },
        
        orderSearch : function(oEvent){
          var properties = [];
          properties.push("order");
          properties.push("routingOperNo");
          properties.push("statusDescription");
          properties.push("material_desc");
          properties.push("productionActivity");
  
          sap.oee.ui.Utils.fuzzySearch(this,this.oPopOver.getModel(),oEvent.getParameter("value"),
            this.oPopOver.getBinding("items"),oEvent.getSource(),properties);
        },
        }
      );
    }
  );