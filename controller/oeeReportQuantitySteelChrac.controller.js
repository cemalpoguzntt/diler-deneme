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
    Dialog,
    Label,
    Button,
    ButtonType
  ) {
    "use strict";
    this.screenObj;
    return Controller.extend(
      "customActivity/controller/oeeReportQuantitySteelChrac",
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
          this.getAllCharacteristic();
          this.reportProductionContent();
          this.getScreenInformation();
          this.getE1cawnmQualityData();
          this.getLengthSelect();
          this.getOrderChracConfQry();
                  var self = this;
                  this.intervalHandle = setInterval(function () {
                      if (window.location.hash == "#/activity/ZACT_CONF_CHRAC") {
                          self.getAllCharacteristic();
                      }
                  }, 3000);
                  console.log("Yenileme Devrede.");
        },
        slashFunction: function(inputValue){
          return (!inputValue) ? "" : " / " + inputValue;
        },
        bindDataToCard: function () {
          this.getAllCharacteristic();
          sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent, this);
          this.getTableData();
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
 this.getOrderChracConfQry();
        },

        bindProductionDataToTable: function () {
          var oModel_productionQuantityModel =
            new sap.ui.model.json.JSONModel();
          oModel_productionQuantityModel.setData({
            productionData: this.reportedProductionData,
          });
          oModel_productionQuantityModel.setDefaultBindingMode(
            sap.ui.model.BindingMode.TwoWay
          ); /*
                                                    this.byId("reportProductionQuantityTable").setModel(
                                                      oModel_productionQuantityModel
                                                    );
                                                    */
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
          var oTable = this.getView().byId("reportProductionQuantityTable");
          this.router = this.appComponent.getRouter();
          var line = oTable
            .getModel()
            .getProperty("LINE", oEvent.getSource().getBindingContext());
          var boy = oTable
            .getModel()
            .getProperty("Y_BOY", oEvent.getSource().getBindingContext());
          var ebat = oTable
            .getModel()
            .getProperty("Y_EBAT", oEvent.getSource().getBindingContext());
          var params = line + ":" + boy + ":" + ebat;
          this.router.navTo("activity", {
            activityId: "ZACT_REP_QTY_DETAILS",
            mode: params,
          });
          /*
                                          this.router.navTo("activity", {
                                               activityId:"ZACT_DETAILS"
                                            });
                                        var bindingContext = oEvent
                                          .getSource()
                                          .getBindingContext()
                                          .getObject();
                              
                                        var aufnr = this.appData.selected.order.orderNo;
                                        var params = {
                                          "Param.1": aufnr,
                                          "Param.2": bindingContext.LINE,
                                          "Param.3": bindingContext.Y_BOY,
                                          "Param.4": bindingContext.Y_EBAT,
                                        };
                              
                                        var oView = this.getView();
                                        var oDialog = oView.byId("confirmScreenButtonDetails");
                                        if (!oDialog) {
                                          oDialog = sap.ui.xmlfragment(
                                            oView.getId(),
                                            "customActivity.fragmentView.confirmScreenButtonDetails",
                                            this
                                          );
                                          oView.addDependent(oDialog);
                                        }
                                        oDialog.open();
                                        this.appData.oDialog = oDialog;
                              
                                        this.getButtonDetailsQry(params);
                                        */
        },

        callButtonDetailsQry: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "buttonDetailsModel");
        },
              onPressDeleteConfirmation1: function (oEvent) {


          var oTable = this.getView().byId("reportProductionQuantityTable");
          this.router = this.appComponent.getRouter();
          var line = oTable
            .getModel()
            .getProperty("LINE", oEvent.getSource().getBindingContext());
          var boy = oTable
            .getModel()
            .getProperty("Y_BOY", oEvent.getSource().getBindingContext());
          var ebat = oTable
            .getModel()
            .getProperty("Y_EBAT", oEvent.getSource().getBindingContext());
          var params = line + ":" + boy + ":" + ebat;

                                        var bindingContext = oEvent
                                          .getSource()
                                          .getBindingContext()
                                          .getObject();
                              
                                        var aufnr = this.appData.selected.order.orderNo;
                                        var params = {
                                          "Param.1": aufnr,
                                          "Param.2": bindingContext.LINE,
                                          "Param.3": bindingContext.Y_BOY,
                                          "Param.4": bindingContext.Y_EBAT,
                                        };
                              
                                        var oView = this.getView();
                                        var oDialog = oView.byId("confirmScreenButtonDetails");
                                        if (!oDialog) {
                                          oDialog = sap.ui.xmlfragment(
                                            oView.getId(),
                                            "customActivity.fragmentView.confirmScreenButtonDetails",
                                            this
                                          );
                                          oView.addDependent(oDialog);
                                        }
                                        oDialog.open();
                                        this.appData.oDialog = oDialog;
                              
                                        this.getButtonDetailsQry(params);



              },

        getButtonDetailsQry: function (params) {
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getButtonDetailsQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callButtonDetailsQry);
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

        callCommentDialogSaveButton: function (p_this, p_data) {
          sap.m.MessageToast.show(
            p_this.interfaces.oOEEBundle.getText("OEE_LABEL_SUCCESS")
          );
          p_this.handleExit();
          //p_this.getTableData();
        },

        onCommentDialogSaveButton: function (oEvent) {
          var data = this.getView().getModel("commentModel").oData;
          var oModel = new sap.ui.model.json.JSONModel();
          var oTable = this.getView().byId("reportProductionQuantityTable");
          var oData = oTable.getModel().oData;
          oData.productionData[data.LINE - 1].BUTTONNAME = data.NOTE;
          oModel.setData(oData);
          oTable.setModel(oModel);
          var params = {
            I_AUFNR: data.AUFNR,
            I_LINE: data.LINE,
            I_NOTE: data.NOTE,
            I_YBOY: data.Y_BOY,
            I_YEBAT: data.Y_EBAT,
          };

          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/updateNoteChracItemXquery",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callCommentDialogSaveButton);
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

        onClickSaveReportedQuantity: function (oEvent) {
          var result;
          var validDC = this.reportProductionQuantity();

          if (validDC) {
            var goodAndRejectedDataCollection = [];
            if (
              this.goodQuantityDataCollection != undefined &&
              this.goodQuantityDataCollection.length > 0
            ) {
              goodAndRejectedDataCollection =
                goodAndRejectedDataCollection.concat(
                  this.goodQuantityDataCollection
                );
            }
            if (
              this.rejectedQuantityDataCollection != undefined &&
              this.rejectedQuantityDataCollection.length > 0
            ) {
              goodAndRejectedDataCollection =
                goodAndRejectedDataCollection.concat(
                  this.rejectedQuantityDataCollection
                );
            }
            if (
              goodAndRejectedDataCollection != undefined &&
              goodAndRejectedDataCollection.length > 0
            ) {
              result =
                this.interfaces.interfacesReportQuantitiesForAllDataCollection(
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
          this.getView().byId("clickButton").setEnabled(true);
          var quantity = oEvent.getSource().getValue();
          if (parseFloat(quantity) < 0) {
            oEvent.getSource().setValue(0);
            return;
          }
          if(quantity != "")
          oEvent.getSource().setValue(parseInt(quantity));
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

        callScreenInformation: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "screenInformation");
        },

        getScreenInformation: function () {
          var workorder = this.appData.selected.order.orderNo;
          var params = { "Param.1": workorder };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getScreenInformationQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callScreenInformation);
        },
        onClickOpenNewMaterial: function (oEvent) {
          debugger;
        },

        callTableData: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          var oTable = p_this.getView().byId("reportProductionQuantityTable");
          var rows = p_data.Rowsets.Rowset[0].Row;
          oModel.setData({ productionData: rows });
if (oModel.oData.productionData!=undefined){
          oTable.setModel(oModel);
}
        },

        getTableData: function () {
          var workorder = this.appData.selected.order.orderNo;
          var params = { "Param.1": workorder };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getTableDataQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callTableData);
        },

        callConfirm: function (p_this, p_data) {
          sap.m.MessageToast.show(
            p_this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE")
          );
          p_this.clearScreen();
          p_this.bindDataToCard();
          p_this.getOrderChracConfQry();
          p_this.getView().byId("clickButton").setEnabled(true);
        },

               onClickConfirm: function (p_this, p_data) {
          this.getView().byId("clickButton").setEnabled(false);
          var client = this.appData.client;
          var runID = this.appData.selected.runID;
          var dcElement = "GOOD_QUANTITY";
          var material = this.appData.selected.material.id;
          var nodeID = this.appData.node.nodeID;
          var plant = this.appData.plant;
          var tableData = this.getView()
            .byId("reportProductionQuantityTable")
            .getModel().oData.productionData;


          var workorder = this.appData.selected.order.orderNo;
          var params = { "Param.1": workorder };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/checkOrderClosedQry",params);
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var jsData3 = tRunner.GetJSONData();


          var errorStatus = false;
          var message;
 if (jsData3[0].Row[0].IS_CLOSED=="T") {
                    message = "Döküm kapatıldığından dolayı teyit verilemez!";
                    errorStatus = true;
                }else{

          tableData.forEach(function (item, index) {

                tableData.forEach(function (item2, index2) {
                    if (index != index2) {
                      if(item.Y_EBAT != item2.Y_EBAT)  {
                        if (item.HOT == 'X' && item2.HOT == 'X')
                        {
                           message ="Farklı ebatlarda aynı anda sıcak seçilemez!";
                            errorStatus = true;
                            return;
                        }

                      }
            
                      }
                 
                 } );
            }, this);


 //         var workorder = this.appData.selected.order.orderNo;
          var params = { "Param.1": workorder };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getTableDataQry",params);
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var jsData = tRunner.GetJSONData();
var jsDataRow=jsData[0].Row;
var ebatDegisim;

           tableData.forEach(function (item, index) {

               jsDataRow.forEach(function (item2, index2) {
                    if (index != index2) {
                      if(item.Y_BOY != item2.Y_BOY)  {
                    
    ebatDegisim=true;
                            return;
                        

                      }
            
                      }
                 
                 } );
            }, this);

          if (tableData[0].KURZTEXTCONTROL != "X") {
            tableData.forEach(function (item, index) {
              if (!!item.quantity) {
                if (item.COLD != "X" && item.HOT != "X") {
                  message = "Lütfen şarj seçiniz!";
                  errorStatus = true;
                }
              } else if (item.COLD == "X" || item.HOT == "X") {
                if (!item.quantity) {
                  message = "Lütfen miktar giriniz!";
                  errorStatus = true;
                }
              }
            }, this);
          }
}
          if (errorStatus) {
            sap.m.MessageToast.show(message);
            this.getView().byId("clickButton").setEnabled(true);
            return;
          }

          var quality = this.getView().byId("quality").getSelectedKey();
          var releasedID = this.appData.selected.releasedID;
          var workorder = this.appData.selected.order.orderNo;
          var userID = this.appData.user.userID;
          var checkBoxQuality = this.getView().byId("idCheckBox").getSelected();

          if (checkBoxQuality == true) {
            if (quality == "") {
              sap.m.MessageToast.show("Lütfen kalite seçimi yapınız!");
              return;
            }
          } else if (quality != "") {
            if (quality != "") {
              sap.m.MessageToast.show("Lütfen kalite tikine tıklayınız!");
              return;
            }
          }
if(ebatDegisim==true){
  sap.m.MessageBox.warning("Ebat değişimi yapıldı.Devam Etmek istermisiniz ", {
                actions: [
                  sap.m.MessageBox.Action.YES,
                  sap.m.MessageBox.Action.NO,
                ],
                onClose: function (oAction) {
                  if (oAction == "YES") {
                           var params = {
            I_CLIENT: client,
            I_RUNID: runID,
            I_DCELEMENT: dcElement,
            I_MATERIAL: material,
            I_NODEID: nodeID,
            I_PLANT: plant,
            I_TABLEDATA: JSON.stringify(tableData),
            I_RELEASEDID: releasedID,
            I_AUFNR: workorder.substr(4, 12),
            I_ENDTIMESTAMP: this.appData.shift.endTimestamp,
            I_STARTTIMESTAMP: this.appData.shift.startTimestamp,
            I_KARISIM: checkBoxQuality,
            I_KARISIM_KALITESI: quality,
            I_KALITE_KTK: tableData[0].Y_KALITE_KTK,
            I_DOKUM_TIPI: tableData[0].Y_DOKUM_TIPI,
            I_USER: userID,
          };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/reportConfirmationXquery",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callConfirm);
  
                  } else {
   errorStatus = true;
                   
                  }
                }.bind(this),
              });
return;
}else{
  if (errorStatus==false) {
          var params = {
            I_CLIENT: client,
            I_RUNID: runID,
            I_DCELEMENT: dcElement,
            I_MATERIAL: material,
            I_NODEID: nodeID,
            I_PLANT: plant,
            I_TABLEDATA: JSON.stringify(tableData),
            I_RELEASEDID: releasedID,
            I_AUFNR: workorder.substr(4, 12),
            I_ENDTIMESTAMP: this.appData.shift.endTimestamp,
            I_STARTTIMESTAMP: this.appData.shift.startTimestamp,
            I_KARISIM: checkBoxQuality,
            I_KARISIM_KALITESI: quality,
            I_KALITE_KTK: tableData[0].Y_KALITE_KTK,
            I_DOKUM_TIPI: tableData[0].Y_DOKUM_TIPI,
            I_USER: userID,
          };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/reportConfirmationXquery",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callConfirm);
          }
}
this.getTableData();
        },
        onPressNewCasting: function (oEvent) {
          var oView = this.getView();
          var oDialog = oView.byId("newEntryContinuousCasting");
          if (!oDialog) {
            oDialog = sap.ui.xmlfragment(
              oView.getId(),
              "customActivity.fragmentView.newEntryContinuousCasting",
              this
            );
            oView.addDependent(oDialog);
          }
          oDialog.open();
          this.appData.oDialog = oDialog;

          this.getRoadSelect();
          this.getDimensionsSelect();
          this.getLengthSelect();
        },
        getRoadSelect: function () {
          var oModel = new sap.ui.model.json.JSONModel();
          var roads = [];
          for (var i = 0; i < 6; i++) {
            roads.push({ LINE: i + 1 });
          }
          oModel.setData(roads);
          this.getView().setModel(oModel, "roads");
        },

        callDimensionsQry: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0]);
          p_this.getView().setModel(oModel, "dimensions");
        },
        getDimensionsSelect: function () {
          var tRunner = new TransactionRunner(
            "MES/UI/selectOrder/getE1cawnmDimensionsQry"
          );
          tRunner.ExecuteQueryAsync(this, this.callDimensionsQry);
        },

        callLengthKtkQry: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "lengths");
        },
        getLengthSelect: function () {
          var tRunner = new TransactionRunner(
            "MES/UI/selectOrder/getE1cawnmLengthKtkQry"
          );
          tRunner.ExecuteQueryAsync(this, this.callLengthKtkQry);
        },

        onPressSaveChanges: function (oEvent) {
          var errorStatus = false;
          var allSelect = [
            "idRoads",
            "idDimensions",
            "idLengths",
            "idReasonCode",
          ];
          allSelect.forEach(function (item, index) {
            var oView = this.getView();
            var select = oView.byId(item).getSelectedKey();
            if (select == "") errorStatus = true;
          }, this);
          errorStatus = false;
          if (errorStatus) {
            sap.m.MessageToast.show(
              this.interfaces.oOEEBundle.getText("OEE_ERR_MSG_FILL_CHOOSE")
            );
            return;
          }

          var oModel = new sap.ui.model.json.JSONModel();
          var oTable = this.getView().byId("reportProductionQuantityTable");
          var oData = oTable.getModel().oData;
          var road = this.getView().byId("idRoads").getSelectedKey();
          var lengths = this.getView().byId("idLengths").getSelectedKey();
          var dimensions = this.getView().byId("idDimensions").getSelectedKey();

          if (road == "" || lengths == "" || dimensions == "") {
            sap.m.MessageToast.show(
              this.interfaces.oOEEBundle.getText("OEE_LABEL_PLEASE_CONTROL")
            );
            return;
          }

          oData.productionData.push({
            LINE: road,
            SUM_QUANTITY: 0,
            UOM: "ST",
            UOMTEXT: "ADT",
            Y_BOY: lengths,
            Y_EBAT: dimensions,
          });
          oModel.setData(oData);
          oTable.setModel(oModel);
          this.handleExit();
        },

        onChangeType: function (oEvent) {
          var oTable = this.getView().byId("reportProductionQuantityTable");

          var sPath = oEvent.getSource().getBindingContext().sPath;
          var selectedRowIndex = sPath.split("/productionData/")[1];

          oTable.getModel().oData.productionData[selectedRowIndex].TYPE = oEvent
            .getSource()
            .getSelectedKey();
        },

        callE1cawnmQualityData: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "qualities");
        },

        getE1cawnmQualityData: function () {
          var plant = this.appData.plant;
          var workorder = this.appData.selected.order.orderNo;
          var params = { "Param.1": plant, "Param.2": workorder };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getE1cawnmQualityQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callE1cawnmQualityData);
        },

        callOrderChracConfQry: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "orderCharConfQryModel");
        },

        getOrderChracConfQry: function () {
          var workorder = this.appData.selected.order.orderNo;
          var params = { "Param.1": workorder };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getOrderChracConfQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callOrderChracConfQry);
        },

       /* handleExit: function () {
          this.appData.oDialog.destroy();
        },*/


 handleExit: function (oEvent) {
                oEvent.getSource().getParent().close();
              },


        clearScreen: function () {
          var checkBox = this.getView().byId("idCheckBox");
          var oTable = this.getView().byId("reportProductionQuantityTable");
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData({ productionData: [] });
          oTable.setModel(oModel);
          checkBox.setSelected(false);
          var quality = this.getView().byId("quality");
          quality.setValue("");
          quality.setSelectedKey("");
        },

        getAllCharacteristic: function () {
          var i;
          var allCharJSON = {};
          var workorder = this.appData.selected.order.orderNo;
          if (!workorder) return;
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
          this.appData.allCharacteristic = allCharJSON;

          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(oData[0].Row[0]);
          this.getView().setModel(oModel, "allCharacteristicModel");
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

          var params = {
            "Param.1": this.appData.selected.order.orderNo,
            "Param.2": this.appData.selected.operationNo,
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
                  var params = {
                      "Param.1": this.appData.plant,
                      "Param.2": workorder,
                      "Param.3": this.appData.selected.material.id ,
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
                  if(!(oData2[0].Row==null))    {
                      var oModell = new sap.ui.model.json.JSONModel();
                      oModell.setData(oData2[0].Row);
                      this.getView().getModel("allCharacteristicModel").oData.Ordes2=oData2[0].Row[0]
          this.getView().getModel("allCharacteristicModel").refresh();
        
    }


        },

        onClickOpenNote: function (oEvent) {
          var sPath = oEvent.getSource().getBindingContext().sPath;
          var row = sPath.split("/productionData/")[1];
          var data = this.byId("reportProductionQuantityTable").getModel().oData
            .productionData;
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(data[row]);
          var oView = this.getView();
          var oDialog = oView.byId("commentPopup");
          if (!oDialog) {
            oDialog = sap.ui.xmlfragment(
              oView.getId(),
              "customActivity.fragmentView.commentPopup",
              this
            );
            oView.addDependent(oDialog);
          }
          oDialog.open();
          this.appData.oDialog = oDialog;
          this.getView().setModel(oModel, "commentModel");
        },

        onChangeGetDimension: function (oEvent) {
          var tableRows = this.getView()
            .byId("reportProductionQuantityTable")
            .getModel().oData.productionData;
          var chosenRoad = oEvent.getSource().getSelectedKey();
          var dimension = tableRows.find(
            (user) => user.LINE == chosenRoad
          ).Y_EBAT;
          var dimensionSelect = this.getView().byId("idDimensions");
          dimensionSelect.setValue(dimension);
          dimensionSelect.setSelectedKey(dimension);
        },

        onClickNonStandard: function (oEvent) {
          var selectBoolean = oEvent.getSource().getSelected();
          var sPath = oEvent.getSource().getBindingContext().sPath;
          var selectedRowIndex = sPath.split("/productionData/")[1];
          var productionData = this.getView()
            .byId("reportProductionQuantityTable")
            .getModel().oData.productionData;

          if (selectBoolean)
            productionData[selectedRowIndex].KURZTEXT = "Standart Dışı";
          else productionData[selectedRowIndex].KURZTEXT = false;

          var productionData;
          var oModel = new sap.ui.model.json.JSONModel();
          var selectBoolean = oEvent.getSource().getSelected();
          var sPath = oEvent.getSource().getBindingContext().sPath;
          var selectedRowIndex = sPath.split("/productionData/")[1];
          var oTable = this.getView().byId("reportProductionQuantityTable");
          productionData = oTable.getModel().oData.productionData;

          if (selectBoolean) {
            productionData[selectedRowIndex].KURZTEXTBOOLEAN = selectBoolean;
            productionData[selectedRowIndex].COLD = "X";
            productionData[selectedRowIndex].HOT = "";
            productionData[selectedRowIndex].HOTENABLED = "X";
            productionData[selectedRowIndex].COLDENABLED = "X";
          } else {
            productionData[selectedRowIndex].KURZTEXTBOOLEAN = selectBoolean;
            productionData[selectedRowIndex].COLD = "";
            productionData[selectedRowIndex].HOTENABLED = "";
            productionData[selectedRowIndex].COLDENABLED = "";
          }
          oModel.setData({ productionData: productionData });
          oTable.setModel(oModel);
        },

        onClickShortBillet: function (oEvent) {
          var productionData;
          var oModel = new sap.ui.model.json.JSONModel();
          var selectBoolean = oEvent.getSource().getSelected();
          var sPath = oEvent.getSource().getBindingContext().sPath;
          var selectedRowIndex = sPath.split("/productionData/")[1];
          var oTable = this.getView().byId("reportProductionQuantityTable");
          productionData = oTable.getModel().oData.productionData;

          if (selectBoolean) {
            productionData[selectedRowIndex].SHORT_BILLET = selectBoolean;
            productionData[selectedRowIndex].COLD = "X";
            productionData[selectedRowIndex].HOT = "";
            productionData[selectedRowIndex].HOTENABLED = "X";
            productionData[selectedRowIndex].COLDENABLED = "X";
          } else {
            if (productionData[selectedRowIndex].KURZTEXT == "Standart Dışı") {
              productionData[selectedRowIndex].SHORT_BILLET = selectBoolean;
            } else {
              productionData[selectedRowIndex].SHORT_BILLET = selectBoolean;
              productionData[selectedRowIndex].COLD = "";

              productionData[selectedRowIndex].HOTENABLED = "";
              productionData[selectedRowIndex].COLDENABLED = "";
            }
          }
          oModel.setData({ productionData: productionData });
          oTable.setModel(oModel);
        },

        onClickCharge: function (oEvent) {
          var oModel = new sap.ui.model.json.JSONModel();
          var productionData;
          var oTable = this.getView().byId("reportProductionQuantityTable");
          var type = oEvent.getSource().getId().split("-")[2];
          var selectBoolean = oEvent.getSource().getSelected();
          var sPath = oEvent.getSource().getBindingContext().sPath;
          var selectedRowIndex = sPath.split("/productionData/")[1];
          productionData = oTable.getModel().oData.productionData;
          if (selectBoolean) {
            if (type == "hot") {
              productionData[selectedRowIndex].HOT = "X";
              productionData[selectedRowIndex].COLD = "";
            } else if (type == "cold") {
              productionData[selectedRowIndex].COLD = "X";
              productionData[selectedRowIndex].HOT = "";
            }
          } else {
            if (type == "hot") {
              productionData[selectedRowIndex].HOT = "";
              productionData[selectedRowIndex].COLD = "";
            } else if (type == "cold") {
              productionData[selectedRowIndex].COLD = "";
              productionData[selectedRowIndex].HOT = "";
            }
          }

          oModel.setData({ productionData: productionData });
          oTable.setModel(oModel);
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

        changeLength: function () {
          this.getView().byId("clickButton").setEnabled(true);
        },

        onPressReasonDeviation: function (oEvent) {
          var pressRow = oEvent
            .getSource()
            .getParent()
            .getBindingContextPath()
            .split("/productionData/")[1];
          var oView = this.getView();
          var oDialog = oView.byId("deflectionReason");
          if (!oDialog) {
            oDialog = sap.ui.xmlfragment(
              oView.getId(),
              "customActivity.fragmentView.deflectionReason",
              this
            );
            oView.addDependent(oDialog);
          }
          oDialog.open();
          this.appData.oDialog = oDialog;
          this.getDeflectionReason(pressRow);
        },

        getDeflectionReason: function (pressRow) {
          var params = {
            "Param.1": this.appData.plant,
            "Param.2": pressRow,
          };
          var tRunner = new TransactionRunner(
            "MES/UI/ReportQuantitySteelChrac/getZmpmDeflectionReasonQry",
            params
          );

          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          var jsData = tRunner.GetJSONData();

          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(jsData);
          this.getView().setModel(oModel, "deflectionReasonModel");
        },

        saveDeflectionReason: function (oEvent) {
          var line = this.getView().getModel("deflectionReasonModel").oData[0]
            .Row[0].LINE;
          var deflectionReasonText = this.getView()
            .byId("deflectionReasonSelect")
            ._getSelectedItemText();
          this.getView()
            .byId("reportProductionQuantityTable")
            .getModel().oData.productionData[line].DEFLECTION_REASON =
            deflectionReasonText;
          this.handleExit(oEvent);
        },

        qualityCheckBox: function () {
          this.getView().byId("clickButton").setEnabled(true);
        },

        qualityChange: function () {
          this.getView().byId("clickButton").setEnabled(true);
        },

        onPressDeleteConfirmation: function (oEvent) {
          var oTable = this.getView().byId("productionTableFragment");
          var allData = this.getView().getModel("buttonDetailsModel").oData;
          var sPath = oTable.getSelectedContexts()[0].sPath;
          var selectedRow = sPath.split("/")[1];
          var data = allData[selectedRow];
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
                    I_CONF_NUMBER: data.CONF_NUMBER,
                    I_CONF_COUNTER: data.CONF_COUNTER,
                    I_ENTRYID: data.ENTRY_ID,
                    I_AUFNR: data.AUFNR,
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
            tRunner.ExecuteQueryAsync(self, self.callConfirm);
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
              self.handleExit();
            },
          });
          oDialog.open();
        },
onCommentDialogSaveButton1: function (oEvent) {
        var plant = this.appData.plant;
        var note = "";
  //var note = this.getView().byId("commentSdm").getValue();
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
        this.handleExitNote();
        //this.oeeRefreshActivity();
      },

      handleExitNote: function () {
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
refreshData: function () {
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
          this.getAllCharacteristic();
          this.reportProductionContent();
          this.getScreenInformation();
          this.getE1cawnmQualityData();
          this.getLengthSelect();
          this.getOrderChracConfQry();
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
        this.oPopOver = sap.ui.xmlfragment("popoverReportSDM","sap.oee.ui.fragments.orderChangeDialog",this);
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