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
        return Controller.extend("customActivity/controller/oeeReportQuantity", {
            goodQuantityDataCollection: undefined,
            rejectedQuantityDataCollection: undefined,
            dataCollectionElements: undefined,
            dataCollectionElementKeys: undefined,
            reportedProductionData: undefined,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.screenAllValue = [{}];

                this.screenObj = [];
                this.screenObj.inputChar = [];

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

                this.getVisibleStatusCharacteristic();

                this.getAllCharacteristic();
                if (this.appData.characteristic[0].Row[0].OBJEK == "3007PCSTRAND") {
                    // düzenli halat sarıcı içindir!
                    this.getWeldMeterage();
                    this.getOrderDetailsFragment();
                }

                this.reportProductionContent();
                this.getBatchnumbList();
                this.getProdRunInformation();
            },

            getVisibleStatusCharacteristic: function () {
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
                    "MES/UI/CreateCast/getVisibleStatusCharacteristicQry",
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
                this.appData.customizationVisible = this.appData.customizationValues[
                    this.appData.node.nodeID
                ];
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

                var dcElementListResult =
                    dcElementListData.dataCollectionElements.results;

                //işyeri bazlı dcElement listelemesi için yapılmıştır. rayar 22.05.2020
                if (this.appData.characteristic != undefined) {
                    var characteristic = this.appData.characteristic[0].Row;
                    for (i = 0; i < dcElementListResult.length; i++) {
                        dcElementListData.dataCollectionElements.results[i].visible = false;
                        for (k = 0; k < characteristic.length; k++) {
                            if (
                                dcElementListResult[i].description.toUpperCase() ==
                                characteristic[k].VALUE.toUpperCase()
                            ) {
                                dcElementListData.dataCollectionElements.results[
                                    i
                                ].visible = true;
                            }
                        }
                    }
                }

                if (dcElementListData != undefined) {
                    if (dcElementListData.dataCollectionElements != undefined) {
                        if (dcElementListData.dataCollectionElements.results != null) {
                            var dcElements = dcElementListData.dataCollectionElements.results;
                            if (dcElements != undefined && dcElements.length > 0) {
                                this.dataCollectionElements = [];
                                this.dataCollectionElementKeys = [];

                                for (var i = 0; i < dcElements.length; i++) {
                                    //işyeri listelemesi için yapılmıştır.
                                    if (dcElements[i].visible) {
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
                }
            },

            getDataCollectionForDCElementKey: function (productionRunDataList, key) {
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
                                            productionRun.quantityReported = new Number("0").toFixed(
                                                this.appData.decimalPrecision
                                            );
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
                var type = 0;
                var batchNumber = this.getBatchNumber(type);
                var oModel_productionQuantityModel = new sap.ui.model.json.JSONModel();
                oModel_productionQuantityModel.setData({
                    productionData: this.reportedProductionData,
                });
                oModel_productionQuantityModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                if (batchNumber != false) {
                    for (
                        i = 0;
                        i < oModel_productionQuantityModel.oData.productionData.length;
                        i++
                    ) {
                        for (k = 0; k < batchNumber.length; k++) {
                            if (
                                oModel_productionQuantityModel.oData.productionData[i]
                                    .description == batchNumber[k].PROD_TYPE
                            )
                                oModel_productionQuantityModel.oData.productionData[
                                    i
                                ].batchNumber = batchNumber[k].BATCH;
                        }
                    }
                }

                oModel_productionQuantityModel.oData.productionData.forEach(function (
                    item,
                    index
                ) {
                    var objek = this.appData.characteristic[0].Row[0].OBJEK;
                    if (
                        objek == "3007SCTEL1" ||
                        objek == "3007SCTEL2" ||
                        objek == "3007DUMMY_MC" ||
                        objek == "3007PCSTRAND" ||
                        objek == "3007PCWIRE"
                    ) {
                        if (item.dcElement == "GOOD_QUANTITY") {
                            item.uom = "M";
                            item.uomText = "m";
                        }
                    }
                },
                    this);

                this.byId("reportProductionQuantityTable").setModel(
                    oModel_productionQuantityModel
                );
            },

            checkIfNotLossType: function (obj) {
                return obj == sap.oee.ui.oeeConstants.dcElementTypeForRejectedQuantity;
            },

            checkIfValueReported: function (obj) {
                if (obj) {
                    return true;
                } else return false;
            },

            onClickShowListOfProductionData: function (oEvent) {
                var bindingContext = oEvent.getSource().getBindingContext().getObject();

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
                var selectedElement = oEvent.getSource().getBindingContext().getObject()
                    .dcElement;
                var selectedRowId = oEvent.getSource().getBindingContext().getObject()
                    .rowIndex;

                if (selectedRowId == 3) selectedRowId = 2; //-1 tablodan kayıt eksiltme ile alaklı olup global yapılacaktır.

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
                var oResultsObject = this.reportedProductionData[this.selectedRowIndex];
                this.oCommentsDialog.close();
            },

            onCommentDialogSaveButton: function (oEvent) {
                var oResultsObject = this.reportedProductionData[this.selectedRowIndex];
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
                        var quantityToBeReported = this.reportedProductionData[i].quantity;
                        var uomForQuantityToBeReported = this.reportedProductionData[i].uom;
                        if (
                            quantityToBeReported != undefined &&
                            quantityToBeReported != "" &&
                            uomForQuantityToBeReported != ""
                        ) {
                            var reportedData = {};
                            if (
                                !sap.oee.ui.Utils.isQuantityValidForLocale(quantityToBeReported)
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
                            reportedData.batchNo = this.reportedProductionData[i].batchNumber;
                            reportedData.serialNo = this.reportedProductionData[i].serialNo;
                            reportedData.dcElementType = this.reportedProductionData[
                                i
                            ].dcElementType;
                            if (this.reportedProductionData[i].reasonCodeData != undefined) {
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
                            reportedData.dcElement = this.reportedProductionData[i].dcElement;
                            reportedData.quantity = quantityToBeReported;
                            reportedData.uom = uomForQuantityToBeReported;
                            if (
                                this.reportedProductionData[i].dcElementType == "GOOD_QUANTITY"
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

            onClickConfirm: function (oEvent) {
                var oTable = this.getView().byId("reportProductionQuantityTable");
                var oModel = oTable.getModel();
                var oData = oModel.oData;
                var productionData = oData.productionData;

                var errorLineQuantity = 0;
                for (i = 0; i < productionData.length; i++) {
                    if (productionData[i].quantity != "" && !!productionData[0].quantity)
                        errorLineQuantity++;
                }

                if (errorLineQuantity > 1) {
                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_LABEL_ERROR_CONFIRM")
                    );
                    return;
                }

                var movetype = 101;
                var workcenterID = this.appData.node.workcenterID;
                var objek = this.appData.characteristic[0].Row[0].OBJEK;

                var cnt = 0,
                    index;
                for (var i = 0; i < productionData.length; i++) {
                    if (
                        productionData[i].batchNumber != "" &&
                        productionData[i].quantity != ""
                    ) {
                        cnt++;
                        index = i;
                    }
                }

                if (cnt == 0 || cnt > 1) {
                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_ERROR_FILL_ALL_INPUTS")
                    );
                    return;
                }

                if (objek == "3007FOSFAT") {
                    var plant = this.appData.plant;
                    var batch = productionData[index].batchNumber;
                    var params = { "Param.1": plant, "Param.2": batch };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getCastNumberQry",
                        params
                    );

                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.getErrorMessage());
                        return null;
                    }
                    var jsData = tRunner.GetJSONData();
                    this.screenObj.inputChar.push({
                        CHAR_NAME: "Y_DOKUMNO",
                        CHAR_VALUE: jsData[0].Row[0].ATWRT,
                    });
                    this.insertConsumptionFosfat();
                } else if (objek == "3007SCTEL1" || objek == "3007SCTEL2") {
                    var oView = this.getView();
                    var oDialog = oView.byId("getConfirmInformation");
                    var castComboBox = oView.byId("castID");
                    if (oDialog != undefined) {
                        oDialog.destroy();
                    }

                    if (castComboBox != undefined) {
                        castComboBox.destroy();
                    }

                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.getConfirmInformation",
                        this
                    );
                    oView.addDependent(oDialog);
                    this.appData.oDialog = oDialog;
                    oDialog.open();
                    this.getConfirmInformation();
                } else if (objek == "3007DUMMY_MC") {
                    var oView = this.getView();
                    var oDialog = oView.byId("openComponentsList");
                    if (oDialog != undefined) oDialog.destroy();

                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.openComponentsList",
                        this
                    );
                    oView.addDependent(oDialog);
                    this.appData.oDialog = oDialog;
                    oDialog.open();
                    this.getConfirmComponentList();
                } else if (objek == "3007PCSTRAND" || objek == "3007PCWIRE") {
                    var oView = this.getView();
                    var oDialog = oView.byId("pcStrandDialog");
                    if (oDialog != undefined) oDialog.destroy();

                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.pcStrandDialog",
                        this
                    );
                    oView.addDependent(oDialog);
                    this.appData.oDialog = oDialog;
                    oDialog.open();
                    this.getPCStrandQry();
                } else this.onClickSaveReportedQuantity(movetype);
            },

            callPcStrandQry: function (p_this, p_data) {
                var tableCharRows = p_this.getCharacteristic();
                var oModel = new sap.ui.model.json.JSONModel();
                var oData = p_data.Rowsets.Rowset[0].Row;
                for (var i = 0; i < oData.length; i++) {
                    for (var k = 0; k < tableCharRows.length; k++) {
                        if (oData[i].BARCODE == tableCharRows[k].BARCODE)
                            oData[i][tableCharRows[k].ATNAM] = tableCharRows[k].ATWRT;
                    }
                }
                oModel.setData(oData);
                p_this.getView().byId("pcStrandDialogTable").setModel(oModel);
            },

            getPCStrandQry: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var workcenterID = this.appData.node.workcenterID;

                var params = {
                    "Param.1": aufnr,
                    "Param.2": workcenterID,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getPCStrandQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callPcStrandQry);
            },

            callConfirmComponentList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                var tableCharacteristic = p_this.getCharacteristic();
                var rows = p_data.Rowsets.Rowset[0].Row;

                for (var i = 0; i < rows.length; i++) {
                    for (var k = 0; k < tableCharacteristic.length; k++) {
                        if (rows[i].BARCODE == tableCharacteristic[k].BARCODE) {
                            rows[i][tableCharacteristic[k].ATNAM] =
                                tableCharacteristic[k].ATWRT;
                        }
                    }
                }
                oModel.setData(rows);

                p_this.getView().byId("confirmTable").setModel(oModel);
            },

            getConfirmComponentList: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;

                var params = {
                    "Param.1": aufnr,
                    "Param.2": workcenterID,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getConfirmComponentListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callConfirmComponentList);
            },

            callComponentDetails: function (p_this, p_data) {
                var tableCharRows = p_this.getCharacteristic();
                var rows = p_data.Rowsets.Rowset[0].Row;

                for (var i = 0; i < p_data.Rowsets.Rowset[0].Row.length; i++) {
                    if (p_data.Rowsets.Rowset[0].Row[i].CONSUMPTIONTYPE == 20)
                        p_data.Rowsets.Rowset[0].Row[i].COLOR = "Pending";
                    else if (p_data.Rowsets.Rowset[0].Row[i].CONSUMPTIONTYPE == 30)
                        p_data.Rowsets.Rowset[0].Row[i].COLOR = "Approved";
                }

                for (var i = 0; i < rows.length; i++) {
                    for (var k = 0; k < tableCharRows.length; k++) {
                        if (rows[i].BARCODE == tableCharRows[k].BARCODE) {
                            rows[i][tableCharRows[k].ATNAM] = tableCharRows[k].ATWRT;
                        }
                    }
                }

                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().byId("confirmTable").setModel(oModel);
            },

            getConfirmInformation: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;

                var params = {
                    "Param.1": aufnr,
                    "Param.2": workcenterID,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getConfirmInformationQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callComponentDetails);
            },

            callUpdateComp: function (p_this, p_data) { },

            updateCompMeterage: function () {
                var workcenterID = this.appData.node.workcenterID;
                if (workcenterID == 10000352) {
                    var oModel = this.getView().getModel("confirmComponentList");
                    var rows = oModel.oData;
                    var tableBatch = this.getView().byId("confirmTable");
                    var tableSelects = tableBatch.getSelectedItems();
                    var tableLength = tableSelects.length;
                    var selectedRows = "";
                    for (i = 0; i < tableLength; i++) {
                        var sPath =
                            tableSelects[i].oBindingContexts.confirmComponentList.sPath;
                        var row = sPath.split("/")[1];
                        selectedRows = rows[row].CONSID + "," + selectedRows;
                    }
                    selectedRows = selectedRows.slice(0, selectedRows.length - 1);
                    var params = {
                        I_CONSID: selectedRows,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/Operations/updateCompMeterageXqry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callUpdateComp);
                }
            },

            callConfirmation: function (p_this, p_data) {
                p_this.updateCompMeterage();
            },

            onClickSaveReportedQuantity: function (movetype, material) {
                var workcenterID = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                var oTable = this.getView().byId("reportProductionQuantityTable");
                var oModel = oTable.getModel();
                var oData = oModel.oData;
                var productionData = oData.productionData;

                if (
                    this.appData.characteristic[0].Row[0].OBJEK != "3007SCTEL1" &&
                    this.appData.characteristic[0].Row[0].OBJEK != "3007SCTEL2"
                ) {
                    for (i = 1; i < productionData.length; i++) {
                        if (productionData[i].quantity != "")
                            if (productionData[i].reasonCodeData == undefined) {
                                sap.m.MessageToast.show(
                                    this.appComponent.oBundle.getText("OEE_LABEL_ASSIGN_ERROR")
                                );
                                return;
                            }
                    }
                }

                var quantity = 0;
                var rowIndex;
                for (i = 0; i < productionData.length; i++) {
                    if (productionData[i].quantity != "") {
                        quantity = productionData[i].quantity;
                        rowIndex = i;
                    }
                }
                quantity = quantity.toString();
                quantity = quantity.replace(".", ",");
                this.getView()
                    .byId("reportProductionQuantityTable")
                    .getModel().oData.productionData[rowIndex].quantity = quantity;

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
                    )
                        goodAndRejectedDataCollection[0].releasedID = this.appData.selected.releasedID;
                    goodAndRejectedDataCollection[0].aufnr = this.appData.selected.order.orderNo;
                    goodAndRejectedDataCollection[0].movetype = movetype;

                    if (goodAndRejectedDataCollection[0].material == undefined)
                        goodAndRejectedDataCollection[0].material = material;

                    if (this.appData.characteristic[0].Row[0].OBJEK == "3007DUMMY_MC")
                        goodAndRejectedDataCollection[0].material = material;

                    if (
                        this.appData.characteristic[0].Row[0].OBJEK == "3007SCTEL1" ||
                        this.appData.characteristic[0].Row[0].OBJEK == "3007SCTEL2"
                    ) {
                        goodAndRejectedDataCollection[0].material = material;
                        goodAndRejectedDataCollection[0].movetype = movetype;
                    }

                    goodAndRejectedDataCollection[0].objek = this.appData.characteristic[0].Row[0].OBJEK;
                    goodAndRejectedDataCollection[0].quantityTon = this.screenAllValue[0].quantityTon;

                    var params = {
                        inputXML: JSON.stringify(goodAndRejectedDataCollection[0]),
                        inputChar: JSON.stringify(this.screenObj.inputChar),
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/reportConfirmation/reportConfirmationXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }

                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                    );

                    this.getBatchnumbList();
                    this.refreshScreenOnOrderChange();
                    this.screenObj.inputChar = [];
                    this.updateBatchListStatus();
                    //this.updateWeldDetails();
                    this.updateAdditionalMeterage();
                    this.getProdRunInformation();

                    this.getView()
                        .byId("reportProductionQuantityTable")
                        .getModel().oData.productionData[rowIndex].quantity = "";
                }
            },

            getBatchnumbList: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var objek = this.appData.characteristic[0].Row[0].OBJEK;
                setInterval(5000);

                var params = {
                    "Param.1": aufnr,
                    "Param.2": workcenterid,
                    "Param.3": objek,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getBatchListQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                if (!oData[0].Row) return;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "batchList");
                this.appData.allCharacteristic.BatchNumb = oData[0].Row[0].BATCH;
                this.appData.lastBobin = {
                    MAXBOBINNUMBER: oData[0].Row[0].MAXBOBINNUMBER,
                };
                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterid,
                    "Param.3": aufnr,
                    "Param.4": aprio,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getSumQuantityTonnageQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                if (!oData[0].Row) return;
                this.appData.allCharacteristic.BatchNumb = oData[0].Row[0].BATCH;
                this.appData.tonnage = {
                    SUMTONNAGE: oData[0].Row[0].SUM_QUANTITY_TONNAGE,
                };
            },

            callWeld: function (p_this, p_data) { },

            updateWeldDetails: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var nodeid = this.appData.node.nodeID;
                var params = {
                    I_WERKS: werks,
                    I_AUFNR: aufnr,
                    I_WORKCENTER: workcenterid,
                    I_NODE_ID: nodeid,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/Operations/updateWeldDetailsXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callWeld);
            },

            callAdditional: function (p_this, p_data) { },

            updateAdditionalMeterage: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var nodeid = this.appData.node.nodeID;
                var params = {
                    I_WERKS: werks,
                    I_AUFNR: aufnr,
                    I_WORKCENTER: workcenterid,
                    I_NODE_ID: nodeid,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/Operations/updateAdditionMeterageXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callAdditional);
            },

            callUpdateStatus: function (p_this, p_data) {
                var oModel_productionQuantityModel = new sap.ui.model.json.JSONModel();
                oModel_productionQuantityModel.setData({
                    productionData: p_this.reportedProductionData,
                });
                oModel_productionQuantityModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                for (
                    i = 0;
                    i < oModel_productionQuantityModel.oData.productionData.length;
                    i++
                ) {
                    oModel_productionQuantityModel.oData.productionData[i].batchNumber =
                        "";
                }
                p_this
                    .byId("reportProductionQuantityTable")
                    .setModel(oModel_productionQuantityModel);
            },

            updateBatchListStatus: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                var nodeID = this.appData.node.nodeID;
                var workcenterID = this.appData.node.workcenterID;

                var params = {
                    I_WORKORDER: aufnr,
                    I_OPERATION: aprio,
                    I_NODEID: nodeID,
                    I_WORKCENTERID: workcenterID,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/Operations/updateBatchListXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdateStatus);
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

            onClickReadBarcode: function (oEvent) {
                var oModel_productionQuantityModel = new sap.ui.model.json.JSONModel();
                var filterTab = this.getView().byId("idIconTabBar").getSelectedKey();
                var oTable = this.getView().byId("tblComponents1");
                if (filterTab == "filterCons2") {
                    if (oTable.getSelectedItem() == null) {
                        sap.m.MessageToast.show(
                            this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("OEE_LABEL_SAVE_CONTROLE")
                        );
                        return;
                    }
                    //Parti numarasının kontrolü sağlanmaktadır. Eğer input boş ise işlem gerçekleşir. *rayar*
                    if (
                        this.reportedProductionData[0].batchNumber != "" &&
                        this.reportedProductionData[0].batchNumber != undefined
                    ) {
                        sap.m.MessageToast.show(
                            this.appComponent.oBundle.getText("OEE_LABEL_WARNING_BARCODE")
                        );
                        return;
                    }

                    var batchList = oTable.getSelectedItem().oBindingContexts.batchList;
                    var sPath = batchList.sPath;
                    var selectedRows = sPath.split("/Row/")[1];
                    var rows = this.getView().getModel("batchList").oData.Row;
                    var row = rows[selectedRows];

                    if (row.PRODTYPE != "Sağlam Miktar") {
                        sap.m.MessageToast.show(
                            this.appComponent.oBundle.getText(
                                "OEE_LABEL_NOT_COMPATIBLE_PRODUCT_TYPE"
                            )
                        );
                        return;
                    }
                    var type = "old";
                    var batchNumber = this.getBatchNumber(type, row.BATCH, row.ROWNUMBER);

                    oModel_productionQuantityModel.setData({
                        productionData: this.reportedProductionData,
                    });
                    oModel_productionQuantityModel.setDefaultBindingMode(
                        sap.ui.model.BindingMode.TwoWay
                    );
                    for (
                        i = 0;
                        i < oModel_productionQuantityModel.oData.productionData.length;
                        i++
                    ) {
                        for (k = 0; k < batchNumber.length; k++) {
                            if (
                                oModel_productionQuantityModel.oData.productionData[i]
                                    .description == batchNumber[k].PROD_TYPE
                            )
                                oModel_productionQuantityModel.oData.productionData[
                                    i
                                ].batchNumber = batchNumber[k].BATCH;
                        }
                    }
                    this.byId("reportProductionQuantityTable").setModel(
                        oModel_productionQuantityModel
                    );
                } else {
                    var oView = this.getView();
                    var oDialog = oView.byId("readBarcodeForConfirm");
                    // create dialog lazily
                    if (!oDialog) {
                        // create dialog via fragment factory
                        oDialog = sap.ui.xmlfragment(
                            oView.getId(),
                            "customActivity.fragmentView.readBarcodeForConfirm",
                            this
                        );
                        oView.addDependent(oDialog);
                    }

                    var productType = this.getView().byId("selectType");
                    productType.setSelectedKey("");
                    var fragmentSelect = this.getView()
                        .byId("reportProductionQuantityTable")
                        .getModel();
                    this.getView().byId("selectType").setModel(fragmentSelect);
                    this.appData.oDialog = oDialog;
                    oDialog.open();
                }
            },

            getBatchNumber: function (type, batchNumber, rowNumber) {
                //type listeleme ile alakalı olup eğer önceden bir değer girilmişse ekran gir çık ile tekrardan gelsin diye yapılmıştır. rayar
                var selectKey;
                var client = this.appData.client;
                var werks = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var workcenterID = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                var userID = this.appData.user.userID;
                var objek = this.appData.characteristic[0].Row[0].OBJEK;

                if (type == "new")
                    selectKey = this.getView().byId("selectType").getSelectedKey();
                else selectKey = "Sağlam Miktar";

                var params = {
                    I_CLIENT: client,
                    I_WERKS: werks,
                    I_NODEID: nodeID,
                    I_WORKCENTERID: workcenterID,
                    I_AUFNR: aufnr,
                    I_APRIO: aprio,
                    I_USERID: userID,
                    I_PRODTYPE: selectKey,
                    I_TYPE: type,
                    I_OLDBATCHNO: batchNumber,
                    I_ROWNUMBER: rowNumber,
                    I_OBJEK: objek,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/Operations/getBatchXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                if (oData[0].Row != undefined) return oData[0].Row;
                else return false;
            },

            handleAddConfirm: function (oEvent) {
                var type = "new";
                var barcode;
                var selectRow = 0;
                var oModel_productionQuantityModel = new sap.ui.model.json.JSONModel();
                selectRow = this.getView().byId("selectType").getSelectedIndex();

                var selectedTableRow = this.getView()
                    .byId("reportProductionQuantityTable")
                    .getModel().oData.productionData[selectRow];

                if (
                    selectedTableRow.batchNumber != "" &&
                    selectedTableRow.batchNumber != undefined
                ) {
                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_LABEL_WARNING_BARCODE")
                    );
                    return;
                }
                var filterTab = this.getView().byId("idIconTabBar").getSelectedKey();
                if (filterTab == "filterCons2")
                    barcode = this.screenAllValue[0].BARCODE;
                else var batchNumber = this.getBatchNumber(type);

                oModel_productionQuantityModel.setData({
                    productionData: this.reportedProductionData,
                });
                oModel_productionQuantityModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                for (
                    i = 0;
                    i < oModel_productionQuantityModel.oData.productionData.length;
                    i++
                ) {
                    for (k = 0; k < batchNumber.length; k++) {
                        if (
                            oModel_productionQuantityModel.oData.productionData[i]
                                .description == batchNumber[k].PROD_TYPE
                        )
                            oModel_productionQuantityModel.oData.productionData[
                                i
                            ].batchNumber = batchNumber[k].BATCH;
                    }
                }

                if (selectRow == 0)
                    oModel_productionQuantityModel.oData.productionData[0].quantity = this.appData.allCharacteristic.Y_METRAJ;
                this.byId("reportProductionQuantityTable").setModel(
                    oModel_productionQuantityModel
                );

                this.handleCancel(oEvent);
            },

            changeBarcodeInput: function (oEvent) {
                var workcenterid = this.appData.node.workcenterID;
                var inputValue = oEvent.getSource()._getInputValue();
                var valueLength = inputValue.length;
                this.getView()
                    .byId("reportProductionQuantityTable")
                    .getModel()
                    .oData.productionData.forEach(function (item, index) {
                        item.quantity = "";
                        item.batchNumber = "";
                    }, this);
                var selectRow = oEvent
                    .getSource()
                    .getParent()
                    .getBindingContextPath()
                    .split("/productionData/")[1];
                this.screenAllValue[0].Row = selectRow;
                if (this.appData.plant == "3007" && this.appData.node.description == "Fosfatlama") {
                    if (!inputValue.includes("|")) {
                        return;
                    }
                    let splittedArr = inputValue.split("|");
                    if (splittedArr[0].length == 4) {
                        // Yeni Etiket
                        inputValue = splittedArr[2];
                    }
                    else {
                        // Eski Etiket
                        inputValue = splittedArr[0];
                    }
                }
                this.reportedProductionData[selectRow].batchNumber = inputValue;
                this.getComponentQuantity(inputValue);
            },

            getComponentQuantity(inputValue) {
                var inputBarcode = this.getView().byId("inputBarcode");
                var inputBarcodeValue = inputValue;
                var aufnr = this.appData.selected.order.orderNo;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                var params = {
                    "Param.1": aufnr,
                    "Param.2": inputBarcodeValue,
                    "Param.3": workcenterid,
                    "Param.4": plant,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getComponentQuantityQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callMeterage);
            },

            callMeterage: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                var length = p_this.dcElementList.length;
                var selectRow = p_this.screenAllValue[0].Row;
                var meterage = p_data.Rowsets.Rowset[0].Row?.[0].QUANTITY;

                var oModel_productionQuantityModel = new sap.ui.model.json.JSONModel();
                oModel_productionQuantityModel.setData({
                    productionData: p_this.reportedProductionData,
                });
                oModel_productionQuantityModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                p_this.reportedProductionData[selectRow].quantity = meterage;

                p_this
                    .byId("reportProductionQuantityTable")
                    .setModel(oModel_productionQuantityModel);
            },

            handleCancel: function (oEvent) {
                this.appData.oDialog.destroy();
            },

            onPressAddSource: function () {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_GENERIC";
                window.location.href = origin + pathname + navToPage;
            },

            onPressAddMeterage: function () {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_GENERIC_ADD";
                window.location.href = origin + pathname + navToPage;
            },

            getAllCharacteristic: function () {
                var allCharJSON = {};
                var workorder = this.appData.selected.order.orderNo;
                if (!workorder) return;
                var params = {
                    "Param.1": workorder,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getAufnrInformationQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var jsData = oData[0].Row;

                if (jsData == undefined) return;
                for (i = 0; i < jsData.length; i++) {
                    allCharJSON[jsData[i].CHARCODE] = jsData[i].CHARVALUE;
                }
                this.appData.allCharacteristic = allCharJSON;
            },

            footerVisibleStatus: function (oEvent) {
                var oTabBar = this.getView().byId("idIconTabBar").getSelectedKey();
                if (oTabBar == "filterCons2") this.getBatchnumbList();

                var workcenterID = this.appData.node.workcenterID;

                if (workcenterID == 10000352 || workcenterID == 10000300) {
                    var addBarcode = this.getView().byId("addBarcode");
                    if (oTabBar == "filterCons") addBarcode.setVisible(true);
                    else if (oTabBar == "filterCons2") addBarcode.setVisible(false);
                }
            },

            callChangeQuantity: function (oEvent) {
                var changeValue = Number(oEvent.getSource().getValue());
                if (changeValue == 0) return;
                var sPath = oEvent.getSource().oPropagatedProperties.oBindingContexts
                    .confirmComponentList.sPath;
                var row = sPath.split("/")[1];
                var oData = this.getView().getModel("confirmComponentList").oData;
                var rows = oData;
                var changeRow = rows[row];
                var entry_id = changeRow.ENTRY_ID;
                var params = { I_ENTRY_ID: entry_id, I_VALUE: changeValue };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/Operations/updateMpmProdRunDataTmpQuantityXquery",
                    params
                );

                tRunner.ExecuteQueryAsync(this, this.callUpdateTmpQuantity);
            },
            callUpdateTmpQuantity: function (p_this, p_data) { },

            callChangeMeterage: function (oEvent) {
                var aufnr = this.appData.selected.order.orderNo;
                var workcenterid = this.appData.node.workcenterID;
                var changeValue = Number(oEvent.getSource().getValue());
                if (changeValue == 0) return;
                var sPath = oEvent.getSource().oPropagatedProperties.oBindingContexts
                    .confirmComponentList.sPath;
                var row = sPath.split("/")[1];
                var oData = this.getView().getModel("confirmComponentList").oData;
                var rows = oData;
                var changeRow = rows[row];
                var batchNo = changeRow.BATCH_NO;
                var consid = changeRow.CONSID;
                var params = {
                    I_METERAGE: changeValue,
                    I_AUFNR: aufnr,
                    I_WORKCENTER: workcenterid,
                    I_BARCODE: batchNo,
                    I_CONSID: consid,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/Operations/updateTmpMeterageXqry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
            },

            openComponetWeldsFragment: function (oEvent) {
                var oView = this.getView();
                var oDialog = oView.byId("getComponentWeldsInfo");
                if (oDialog != undefined) oDialog.destroy();

                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "customActivity.fragmentView.getComponentWeldsInfo",
                    this
                );
                oView.addDependent(oDialog);
                this.appData.oDialogWeld = oDialog;
                oDialog.open();
            },

            callWeldDetails: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "weldDetails");
                p_this.openComponetWeldsFragment();
            },

            getWeldDetails: function (oEvent) {
                var aufnr = this.appData.selected.order.orderNo;
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var oSource = oEvent.getSource();
                var barcode = oSource.getParent().getCells()[0].getText();

                var params = {
                    "Param.1": barcode,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/getWeldDetailsQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callWeldDetails);
            },

            getWeldMeterage: function () {
                var weldMeterages;
                var nodeID = this.appData.node.nodeID;
                var workcenterID = this.appData.node.workcenterID;
                var workorder = this.appData.selected.order.orderNo;
                var operationNo = this.appData.selected.operationNo;

                var params = {
                    "Param.1": nodeID,
                    "Param.2": workcenterID,
                    "Param.3": workorder,
                    "Param.4": operationNo,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getWeldMeterageQry",
                    params
                );

                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var rows = oData[0].Row;
                if (rows == undefined) return;
                if (rows[0].QUANTITY == "NA") weldMeterages = "";
                else {
                    for (var i = 0; i < rows.length; i++) {
                        weldMeterages = weldMeterages + " - " + rows[i].QUANTITY;
                    }
                }
                this.appData.weldMeterages = {
                    weldMeterages: weldMeterages.split("undefined - ")[1],
                    METERAGE: oData[0].Row[0].METERAGE,
                };
            },

            callProdRunInformation: function (p_this, p_data) {
                var tableData = [];
                var characteristic = [];
                var rows = p_data.Rowsets.Rowset[0].Row;
                var werks = p_this.appData.plant;
                var workcenterID = p_this.appData.node.workcenterID;
                var aufnr = p_this.appData.selected.order.orderNo;
                var boolean;

                if (!rows) return;

                for (var i = 0; i < rows.length; i++) {
                    boolean = true;
                    for (var k = 0; k < tableData.length; k++) {
                        if (rows[i].BARCODE == tableData[k].BARCODE) boolean = false;
                    }

                    if (boolean) tableData.push(rows[i]);
                }

                for (i = 0; i < rows.length; i++) {
                    for (k = 0; k < tableData.length; k++) {
                        if (tableData[k].BARCODE == rows[i].BARCODE)
                            tableData[k][rows[i].ATNAM] = rows[i].ATWRT;
                    }
                }

                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData);
                p_this.getView().setModel(oModel, "prodRunModel");
            },
            getProdRunInformation: function () {
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;

                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterID,
                    "Param.3": aufnr,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getComponentListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callProdRunInformation);
            },

            openMeterage: function (oEvent) {
                var batchNo = oEvent.getSource().getTooltip();

                if (this.appData.node.description == "Düzenli Halat Sarıcı")
                    this.openAddtionMeterage(batchNo);
                else this.openWeldMeterage(batchNo);
            },

            openAddtionMeterage: function (batchNo) {
                var oView = this.getView();
                var oDialog = oView.byId("additionMeterageList");
                // create dialog lazily
                // create dialog via fragment factory
                if (oDialog != undefined) oDialog.destroy();
                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "customActivity.fragmentView.additionMeterageList",
                    this
                );
                oView.addDependent(oDialog);
                oDialog.open();
                this.appData.oDialog = oDialog;
                this.getAdditionDetails(batchNo);
            },

            getAdditionDetails: function (batchNo) {
                var nodeid = this.appData.node.nodeID;
                var werks = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var params = {
                    "Param.1": aufnr,
                    "Param.2": werks,
                    "Param.3": nodeid,
                    "Param.4": batchNo,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getBatchAdditionDetailsQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callAdditionInfo);
            },

            callAdditionInfo: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "AdditionTable");
            },

            openWeldMeterage: function (batchNo) {
                var oView = this.getView();
                var oDialog = oView.byId("weldList");
                // create dialog lazily
                // create dialog via fragment factory
                if (oDialog != undefined) oDialog.destroy();
                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "customActivity.fragmentView.weldList",
                    this
                );
                oView.addDependent(oDialog);
                this.appData.oDialog = oDialog;
                oDialog.open();

                this.getWeldDetails(batchNo);
            },

            onSaveRecords: function (oEvent) {
                var errorStatus = false;
                var message;
                var count = 0;

                var appData = this.appData;
                var client = appData.client;
                var plant = appData.plant;
                var nodeID = appData.node.nodeID;
                var workcenterID = appData.node.workcenterID;
                var aufnr = appData.selected.order.orderNo;
                var aprio = appData.selected.operationNo;
                var userID = appData.user.userID;
                var matnr = appData.selected.material.id;
                var oModel = new sap.ui.model.json.JSONModel();
                var matnr = appData.selected.material.id;
                var operationNo = this.appData.selected.operationNo;
                var movetype;
                var dcElement;
                var quantity;

                var oTable = this.getView().byId("confirmTable");
                var oData = oTable.getModel().oData;

                oData.forEach(function (item, index) {
                    if (item.CHOSENROW == "X") count = count + 1;
                }, this);

                if (count === 0) {
                    message = "Lütfen tüketim tipini seçiniz!";
                    errorStatus = true;
                }

                var dataJSON = JSON.stringify(oData);

                var reportProductionQuantityTable = this.getView().byId(
                    "reportProductionQuantityTable"
                );
                var productionData = reportProductionQuantityTable.getModel().oData
                    .productionData;

                productionData.forEach(function (item, index) {
                    if (!!item.quantity) dcElement = item.dcElement;
                }, this);

                var sumQuantity = 0;

                for (var i = 0; i < productionData.length; i++) {
                    if (
                        productionData[i].quantity == "" ||
                        productionData[i].quantity == undefined
                    )
                        productionData[i].quantity = 0;
                    sumQuantity =
                        Number(sumQuantity) + Number(productionData[i].quantity);
                }

                if (dcElement == "SCRAP") {
                    var params = {
                        "Param.1": aufnr,
                        "Param.2": plant,
                        "Param.3": operationNo,
                        "Param.4": 212,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getDispoMatnrQry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    var jsData = tRunner.GetJSONData();

                    if (!jsData[0].Row) {
                        sap.m.MessageBox.alert(
                            this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("OEE_LABEL_MISSING_MATERIAL_IN_PRODUCT_TREE")
                        );
                        return;
                    }

                    movetype = jsData[0].Row[0].BWART;
                    material = jsData[0].Row[0].MATNR;

                    var params = {
                        "Param.1": matnr,
                        "Param.2": sumQuantity,
                        "Param.3": "KG",
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getConversionQry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }

                    var jsData = tRunner.GetJSONData();
                    quantity = jsData[0].Row[0].QUANTITY;
                    this.screenAllValue[0].quantityTon = quantity;
                } else {
                    movetype = 101;
                    material = matnr;

                    var params = {
                        I_AUFNR: aufnr,
                        I_LENGTH: sumQuantity,
                        I_MATNR: matnr,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/TonnageQry/getTonageXqry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    var jsData = tRunner.GetJSONData();

                    quantity = jsData[0].Row[0].QUANTITYTONNAGE;
                    this.screenAllValue[0].quantityTon = jsData[0].Row[0].QUANTITYTONNAGE;
                }
                var sumConsumptionQuantity = 0;

                oData.forEach(function (item, index) {
                    if (item.CHOSENROW == "X") sumConsumptionQuantity += item.QUANTITY;
                }, this);

                if (quantity > sumConsumptionQuantity) {
                    message = "Tüketim miktarı üretim miktartından az olamaz!";
                    errorStatus = true;
                }

                if (errorStatus) {
                    MessageBox.error(message);
                    return;
                }

                if (dcElement == "SCRAP") {
                    var params = {
                        "Param.1": aufnr,
                        "Param.2": plant,
                        "Param.3": operationNo,
                        "Param.4": 212,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getDispoMatnrQry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    var jsData = tRunner.GetJSONData();

                    if (!jsData[0].Row) {
                        sap.m.MessageBox.alert(
                            this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("OEE_LABEL_MISSING_MATERIAL_IN_PRODUCT_TREE")
                        );
                        return;
                    }

                    movetype = jsData[0].Row[0].BWART;
                    material = jsData[0].Row[0].MATNR;
                } else {
                    movetype = 101;
                    material = matnr;
                }
                var tableArr = [];
                var newBatch;

                for (var i = 0; i < productionData.length; i++) {
                    if (
                        productionData[i].batchNumber != "" &&
                        productionData[i].batchNumber != "NA" &&
                        productionData[i].batchNumber != undefined
                    )
                        newBatch = productionData[i].batchNumber;
                }

                //Tamamen
                for (var i = 0; i < oData.length; i++) {
                    if (oData[i].CHOSENROW == "X") {
                        if (oData[i].CONSUMPTIONTYPE == "30") tableArr.push(i);
                    }
                }
                //Kısmen
                for (var i = 0; i < oData.length; i++) {
                    if (oData[i].CHOSENROW == "X") {
                        if (oData[i].CONSUMPTIONTYPE == "20") tableArr.push(i);
                    }
                }

                tableArr.forEach(function (item, index) {
                    if (Number(oData[item].QUANTITY) < quantity) {
                        quantity = Number((quantity - oData[item].QUANTITY).toFixed(1));
                    } else if (Number(oData[item].QUANTITY) > quantity) {
                        oData[item].QUANTITY = quantity;
                        quantity = 0;
                    }
                }, this);

                //tamamen tüketim kontrolü için yapılmıştır.

                var oldData = eval(dataJSON);

                for (var i = 0; i < oData.length; i++) {
                    for (var k = 0; k < oldData.length; k++) {
                        if (
                            oData[i].BARCODE == oldData[k].BARCODE &&
                            oData[i].CONSUMPTIONTYPE == "30" &&
                            oData[i].QUANTITY != oldData[k].QUANTITY
                        ) {
                            sap.m.MessageBox.alert(
                                this.getView()
                                    .getModel("i18n")
                                    .getResourceBundle()
                                    .getText("OEE_LABEL_ERROR_CONSUMPTION")
                            );
                            oModel.setData(oldData);
                            oTable.setModel(oModel);
                            return;
                        }
                    }
                }

                tableArr.forEach(function (item, index) {
                    var params = {};
                    params = {
                        I_CLIENT: client,
                        I_WERKS: plant,
                        I_NODEID: nodeID,
                        I_WORKCENTERID: workcenterID,
                        I_AUFNR: aufnr,
                        I_APRIO: aprio,
                        I_USERID: userID,
                        I_BARCODE: oData[item].BARCODE,
                        I_QUANTITY: oData[item].QUANTITY,
                        I_CONSUMPTIONTYPE: oData[item].CONSUMPTIONTYPE,
                        I_MATNR: matnr,
                        I_NEWBATCH: newBatch,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/Operations/insertConsumptionXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }

                    var charName = "Y_DOKUMNO" + (index + 1);
                    this.screenObj.inputChar.push({
                        CHAR_NAME: charName,
                        CHAR_VALUE: oData[index].Y_DOKUMNO,
                    });
                }, this);

                this.onClickSaveReportedQuantity(movetype, material);
                this.handleCancel(oEvent);
            },

            consumptionType: function (oEvent) {
                var oTable = this.getView().byId("confirmTable");
                var processRow = oTable.aDelegates[0].oDelegate.iFocusedIndex - 1;
                var oData = oTable.getModel().oData;
                oData[processRow].CONSUMPTIONTYPE = oEvent.getSource().getSelectedKey();
                oData[processRow].CHOSENROW = "X";
            },

            onSaveRecordsComponent: function (oEvent) {
                var appData = this.appData;
                var client = appData.client;
                var plant = appData.plant;
                var nodeID = appData.node.nodeID;
                var workcenterID = appData.node.workcenterID;
                var aufnr = appData.selected.order.orderNo;
                var aprio = appData.selected.operationNo;
                var userID = appData.user.userID;
                var matnr = appData.selected.material.id;

                var reportProductionQuantityTable = this.getView().byId(
                    "reportProductionQuantityTable"
                );
                var productionData = reportProductionQuantityTable.getModel().oData
                    .productionData;

                var newBatch;
                var movetype;
                var material;

                for (var i = 0; i < productionData.length; i++) {
                    if (
                        productionData[i].batchNumber != "" &&
                        productionData[i].batchNumber != "NA" &&
                        productionData[i].batchNumber != undefined
                    )
                        newBatch = productionData[i].batchNumber;
                }

                var oTable = this.getView().byId("confirmTable");
                var oData = oTable.getModel().oData;

                var inputKgValue = this.getView().byId("inputKgValue").getValue();
                var inputConversion = this.getView().byId("inputConversion").getValue();

                this.screenObj.inputChar.push({
                    CHAR_NAME: "Y_KGM",
                    CHAR_VALUE: inputKgValue,
                });

                var sumQuantity = 0;
                var tickedQuantity = 0;
                var remainingValue = 0;
                var quotientValue = 0;
                var tableArr = [];

                for (var i = 0; i < oData.length; i++) {
                    sumQuantity = sumQuantity + Number(oData[i].QUANTITY);
                    oData[i].movetype = 261;
                }

                remainingValue = sumQuantity - parseFloat(inputConversion);

                var scrap = false;
                for (var i = 0; i < oData.length; i++) {
                    if (oData[i].checkBox == true) {
                        tickedQuantity++;
                        scrap = true;
                        tableArr.push(i);
                    }
                }

                this.handleCancel(oEvent);

                var aufnr = this.appData.selected.order.orderNo;
                var plant = this.appData.plant;
                var operationNo = this.appData.selected.operationNo;

                var params = {
                    "Param.1": aufnr,
                    "Param.2": plant,
                    "Param.3": operationNo,
                    "Param.4": 214,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getDispoMatnrQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var jsData = tRunner.GetJSONData();

                if (!jsData[0].Row) {
                    sap.m.MessageBox.alert(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_MISSING_MATERIAL_IN_PRODUCT_TREE")
                    );
                    return;
                }

                var newLine = oData.length;
                oData[newLine] = {};
                oData[newLine].QUANTITY = remainingValue;
                oData[newLine].movetype = jsData[0].Row[0].BWART;
                oData[newLine].MATNR = jsData[0].Row[0].MATNR;

                var params = {
                    "Param.1": aufnr,
                    "Param.2": plant,
                    "Param.3": operationNo,
                    "Param.4": 138,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getDispoMatnrQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var jsData1 = tRunner.GetJSONData();

                if (!jsData[0].Row) {
                    sap.m.MessageBox.alert(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_MISSING_MATERIAL_IN_PRODUCT_TREE")
                    );
                    return;
                }

                movetype = jsData1[0].Row[0].BWART;
                material = jsData1[0].Row[0].MATNR;

                for (var i = 0; i < oData.length; i++) {
                    var params = {};

                    params = {
                        I_CLIENT: client,
                        I_WERKS: plant,
                        I_NODEID: nodeID,
                        I_WORKCENTERID: workcenterID,
                        I_AUFNR: aufnr,
                        I_APRIO: aprio,
                        I_USERID: userID,
                        I_BARCODE: oData[i].BARCODE,
                        I_QUANTITY: oData[i].QUANTITY,
                        I_CONSUMPTIONTYPE: 30,
                        I_MATNR: oData[i].MATNR,
                        I_NEWBATCH: newBatch,
                        I_MOVETYPE: oData[i].movetype,
                        I_MATERIAL: material,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/Operations/insertConsumptionCoilXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                }

                this.onClickSaveReportedQuantity(movetype, material);
            },

            callCheckBox: function (oEvent) {
                var oTable = this.getView().byId("pcStrandDialogTable");
                var processRow = oTable.aDelegates[0].oDelegate.iFocusedIndex - 1;

                if (oTable.getModel().oData[processRow].checkBox)
                    oTable.getModel().oData[processRow].checkBox = false;
                else oTable.getModel().oData[processRow].checkBox = true;
            },

            onSavePcStrand: function (oEvent) {
                var oTable = this.getView().byId("pcStrandDialogTable");

                if (oTable.getSelectedItems().length == 0) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_PLEASECHOOSE")
                    );
                    return;
                }

                var appData = this.appData;
                var client = appData.client;
                var plant = appData.plant;
                var nodeID = appData.node.nodeID;
                var workcenterID = appData.node.workcenterID;
                var aufnr = appData.selected.order.orderNo;
                var aprio = appData.selected.operationNo;
                var userID = appData.user.userID;
                var matnr = appData.selected.material.id;
                var objek = this.appData.characteristic[0].Row[0].OBJEK;
                var idWeight = this.getView().byId("idWeight");

                if (idWeight.getValue() == "") {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_SAVE_CONTROLE")
                    );
                    return;
                }

                var params = {
                    "Param.1": matnr,
                    "Param.2": idWeight.getValue(),
                    "Param.3": "KG",
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getConversionQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var jsData = tRunner.GetJSONData();

                var weightValue = parseFloat(jsData[0].Row[0].QUANTITY);
                this.screenAllValue[0].quantityTon = weightValue;

                var reportProductionQuantityTable = this.getView().byId(
                    "reportProductionQuantityTable"
                );
                var productionData = reportProductionQuantityTable.getModel().oData
                    .productionData;

                for (var i = 0; i < productionData.length; i++) {
                    if (
                        productionData[i].batchNumber != "" &&
                        productionData[i].batchNumber != undefined &&
                        productionData[i].batchNumber != "NA"
                    ) {
                        var newBatch = productionData[i].batchNumber;
                        var newQuantity = productionData[i].quantity;
                    }
                }

                this.screenObj.inputChar.push({
                    CHAR_NAME: "Y_KGM",
                    CHAR_VALUE: parseFloat(idWeight.getValue()) / parseFloat(newQuantity),
                });
                var chosenRow = oTable.getSelectedContextPaths()[0].split("/")[1];
                var oData = [];
                oData.push(oTable.getModel().oData[chosenRow]);

                if (oData[0].checkBox) {
                    var params = {
                        "Param.1": aufnr,
                        "Param.2": plant,
                        "Param.3": aprio,
                        "Param.4": 214,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getDispoMatnrQry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    var jsData = tRunner.GetJSONData();

                    if (!jsData[0].Row) {
                        sap.m.MessageBox.alert(
                            this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("OEE_LABEL_MISSING_MATERIAL_IN_PRODUCT_TREE")
                        );
                        return;
                    }

                    oData[oData.length] = {};
                    oData[oData.length - 1].QUANTITY = (
                        parseFloat(oData[0].QUANTITY) - parseFloat(weightValue)
                    ).toFixed(3);
                    oData[oData.length - 1].movetype = jsData[0].Row[0].BWART;
                    oData[oData.length - 1].BARCODE = oData[0].BARCODE;
                    oData[oData.length - 1].MATNR = jsData[0].Row[0].MATNR;
                    oData[oData.length - 1].UOM = oData[0].UOM;
                }

                if (objek == "3007PCSTRAND") {
                    this.screenObj.inputChar.push({
                        CHAR_NAME: "Y_MASTERCOIL",
                        CHAR_VALUE: oData[0].BARCODE,
                    });
                }

                oData[0].QUANTITY = parseFloat(weightValue);
                oData[0].movetype = 261;

                this.handleCancel();
                for (var i = 0; i < oData.length; i++) {
                    var params = {};

                    params = {
                        I_CLIENT: client,
                        I_WERKS: plant,
                        I_NODEID: nodeID,
                        I_WORKCENTERID: workcenterID,
                        I_AUFNR: aufnr,
                        I_APRIO: aprio,
                        I_USERID: userID,
                        I_BARCODE: oData[i].BARCODE,
                        I_QUANTITY: oData[i].QUANTITY,
                        I_CONSUMPTIONTYPE: 30,
                        I_MATNR: oData[i].MATNR,
                        I_NEWBATCH: newBatch,
                        I_MOVETYPE: oData[i].movetype,
                        I_UOM: oData[i].UOM,
                        I_MATERIAL: matnr,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/Operations/insertPCStrandXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                }

                movetype = 101;
                this.onClickSaveReportedQuantity(movetype);
            },

            callPcStrand: function (p_this, p_data) { },

            insertConsumptionFosfat: function () {
                var appData = this.appData;
                var client = appData.client;
                var plant = appData.plant;
                var nodeID = appData.node.nodeID;
                var workcenterID = appData.node.workcenterID;
                var aufnr = appData.selected.order.orderNo;
                var aprio = appData.selected.operationNo;
                var userID = appData.user.userID;
                var matnr = appData.selected.material.id;

                var movetype = 261;

                var reportProductionQuantityTable = this.getView().byId(
                    "reportProductionQuantityTable"
                );

                var productionData = reportProductionQuantityTable.getModel().oData
                    .productionData;

                var newBatch;
                var dcElement;

                for (var i = 0; i < productionData.length; i++) {
                    if (
                        productionData[i].batchNumber != "" &&
                        productionData[i].batchNumber != "NA" &&
                        productionData[i].batchNumber != undefined
                    ) {
                        newBatch = productionData[i].batchNumber;
                        dcElement = productionData[i].dcElement;
                    }
                }

                params = {
                    I_CLIENT: client,
                    I_WERKS: plant,
                    I_NODEID: nodeID,
                    I_WORKCENTERID: workcenterID,
                    I_AUFNR: aufnr,
                    I_APRIO: aprio,
                    I_USERID: userID,
                    I_BARCODE: newBatch,
                    I_CONSUMPTIONTYPE: 30,
                    I_MATNR: matnr,
                    I_NEWBATCH: newBatch,
                    I_MOVETYPE: movetype,
                    I_DCELEMENT: dcElement,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/Operations/insertConsumptionFosfatXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                movetype = 101;
                this.onClickSaveReportedQuantity(movetype);
            },

            callConsumptionFosfat: function (p_this, p_data) { },

            objValues: function (oEvent) {
                var char = oEvent.getSource().mBindingInfos.value.parts[0].path;
                var value = oEvent.getSource().getValue();
                for (var i = 0; i < this.screenObj.length; i++) {
                    if (this.screenObj[i].CHAR_NAME == char) this.screenObj.splice(i, 1);
                }
                this.screenObj.push({ CHAR_NAME: char, CHAR_VALUE: value });
            },

            getCharacteristic: function () {
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var aufnr = this.appData.selected.order.orderNo;

                var params = { "Param.1": plant, "Param.2": nodeID, "Param.3": aufnr };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getBatchListCharacteristicQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();

                return oData[0].Row;
            },

            openCastList: function (oEvent) {
                var oView = this.getView();
                var oDialog = oView.byId("castList");
                if (oDialog != undefined) oDialog.destroy();
                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "customActivity.fragmentView.castList",
                    this
                );
                oView.addDependent(oDialog);
                this.appData.oDialog = oDialog;
                oDialog.open();
                var sPath = oEvent.getSource().getParent().getBindingContextPath();
                var chosenRow = sPath.split("/Row/")[1];
                this.getCastList(chosenRow);
            },

            callCastList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "castModel");
            },

            getCastList: function (chosenRow) {
                var rows = this.getView().getModel("batchList").oData.Row;
                var entryID = rows[chosenRow].ENTRY_ID;
                var batchNo = rows[chosenRow].BATCH;

                var plant = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var params = {
                    "Param.1": entryID,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getCastListForKnittingQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callCastList);
            },

            onPressCalculate: function (oEvent) {
                var oView = this.getView();
                var inputValue = oView.byId("inputKgValue").getValue();
                if (inputValue == "") {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_PLEASE_CONTROL")
                    );
                    return;
                }
                var tableQuantity = oView
                    .byId("reportProductionQuantityTable")
                    .getModel().oData.productionData[0].quantity;
                var material = this.appData.selected.material.id;
                var quantity = parseFloat(inputValue) * parseFloat(tableQuantity);

                var params = {
                    "Param.1": material,
                    "Param.2": quantity,
                    "Param.3": "KG",
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getConversionQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var jsData = tRunner.GetJSONData();
                oView.byId("inputConversion").setValue(jsData[0].Row[0].QUANTITY);
                this.screenAllValue[0].quantityTon = jsData[0].Row[0].QUANTITY;
            },

            changeMeterage: function (oEvent) {
                //this.getView().byId("confirmTable").getModel().getProperty("BARCODE", oEvent.getSource().getBindingContext());
                var oModel = new sap.ui.model.json.JSONModel();
                var oTable = this.getView().byId("confirmTable");
                var sPath = oEvent.getSource().getBindingContext().sPath;
                var changeRow = sPath.split("/")[1];
                var rows = oTable.getModel().oData;
                var changeRowInformation = rows[changeRow];
                var matnr = changeRowInformation.MATNR;
                var quality = changeRowInformation.Y_KALITE_SC;
                var diameter = changeRowInformation.Y_TEL_CAP_MM_SC;
                var valueMeterage = oEvent.getSource().getValue();
                if (valueMeterage == "") valueMeterage = "0";
                var valueMeterageFloat = parseFloat(valueMeterage);

                var params = {
                    "Param.1": matnr,
                    "Param.2": quality,
                    "Param.3": diameter,
                    "Param.4": valueMeterageFloat,
                };
                this.getView().setBusy(true);
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getChangeMeterageQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var jsData = tRunner.GetJSONData();
                rows[changeRow].QUANTITY = jsData[0].Row[0].QUANTITY;
                rows[changeRow].METERAGE = valueMeterage;
                oModel.setData(rows);
                oTable.setModel(oModel);
                this.getView().setBusy(false);
            },

            getOrderDetailsFragment: function () {
                var workcenterID = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                var params = {
                    "Param.1": workcenterID,
                    "Param.2": aufnr,
                    "Param.3": aprio,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getOrderDetailsFragmentQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var jsData = tRunner.GetJSONData();

                if (!jsData[0].Row) return;
                this.appData.allCharacteristic.MC_SN = jsData[0].Row[0].ROW_NUMBER;
                this.appData.allCharacteristic.MC_METERAGE = jsData[0].Row[0].QUANTITY;
            },

            changeMeterage: function (oEvent) {
                var meterage = oEvent.getSource().getValue().replace(".", "");
                var selectRow = oEvent
                    .getSource()
                    .getParent()
                    .getBindingContextPath()
                    .split("/")[1];
                var oData = this.getView().byId("confirmTable").getModel().oData;
                oData[selectRow].METERAGE = meterage;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var aufnr = this.appData.selected.order.orderNo;
                var operationNo = this.appData.selected.operationNo;
                var barcode = oData[selectRow].BARCODE;
                var material = oData[selectRow].MATNR;

                if (meterage == "")
                    return;

                var params = {
                    "Param.1": plant,
                    "Param.2": nodeID,
                    "Param.3": aufnr,
                    "Param.4": operationNo,
                    "Param.5": barcode,
                    "Param.6": meterage,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getQuantityWithMeterageQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var jsData = tRunner.GetJSONData();

                oData[selectRow].QUANTITY = jsData[0].Row[0]?.VALUE;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData);
                this.getView().byId("confirmTable").setModel(oModel);
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
        });
    }
);
