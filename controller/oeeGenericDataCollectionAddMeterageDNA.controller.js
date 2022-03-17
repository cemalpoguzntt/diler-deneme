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
        "jquery.sap.global",
        "sap/ui/model/Sorter",
        "sap/ui/core/routing/History",
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        jQuery,
        Sorter,
        History
    ) {
        // "use strict";
        var focusCount = 0;
        var interval;
        return Controller.extend(
            "customActivity.controller.oeeGenericDataCollectionAddMeterageDNA",
            {
                onInit: function () {
                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();
                    this.interfaces = this.appComponent.getODataInterface();
                    this.appComponent
                        .getEventBus()
                        .subscribe(
                            this.appComponent.getId(),
                            "orderChanged",
                            this.renderUI,
                            this
                        );
                    that = this;
                    this.bindDataToCard();
                    this.renderUI();
                    this.setFocusToMeterage();
                },
                setFocusToMeterage: function () {
                    var meterageInput = this.getView().byId("reportGenericDataCollectionTableQuantityType").mAggregations.items[0].mAggregations.cells[1].sId;
                    focusCount = 0;
                    interval = setInterval(function () {
                        that.byId(meterageInput).focus();
                        focusCount++;
                        if (focusCount == 15) {
                            clearInterval(interval);
                        }
                    }, 100);

                },
                renderUI: function () {
                    /*
                     * Getting Data Collection Elements and Quantity
                     * Consumed details for Context - Start
                     */

                    if (!this.appData.anyOrderRunningInShift()) {
                        // Do not proceed if not.
                        return;
                    }

                    var context = "";
                    var dcElements = [];
                    var tempDCElements = [];
                    if (this.getView().getViewData() != undefined) {
                        var viewOptions = this.getView().getViewData().viewOptions;
                        if (viewOptions != undefined && viewOptions.length > 0) {
                            for (var i = 0; i < viewOptions.length; i++) {
                                if (viewOptions[i].optionName == "CONTEXT") {
                                    if (viewOptions[i].activityOptionValueDTOList != undefined) {
                                        if (
                                            viewOptions[i].activityOptionValueDTOList.results !=
                                            undefined
                                        ) {
                                            var contextOptions =
                                                viewOptions[i].activityOptionValueDTOList.results;
                                            if (contextOptions.length > 0) {
                                                context = contextOptions[0].optionValue;
                                            }
                                        }
                                    }
                                } else if (viewOptions[i].optionName == "DCELEMENT") {
                                    if (viewOptions[i].activityOptionValueDTOList != undefined) {
                                        if (
                                            viewOptions[i].activityOptionValueDTOList.results !=
                                            undefined
                                        ) {
                                            var contextOptions =
                                                viewOptions[i].activityOptionValueDTOList.results;
                                            if(this.appData.node.description.includes("Düzenli")){
                                                contextOptions.forEach((item) => {
                                                    item.optionValue="EK METRAJ";
                                                });
                                            }
                                            for (
                                                var cIndex = 0;
                                                cIndex < contextOptions.length;
                                                cIndex++
                                            ) {
                                                dcElements.push({
                                                    client: this.appData.client,
                                                    dcElement: contextOptions[cIndex].optionValue,
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            sap.oee.ui.Utils.createMessage(
                                this.appComponent.oBundle.getText("OEE_ERR_MSG_NO_CONFIG"),
                                sap.ui.core.MessageType.Error
                            );
                            return;
                        }
                    } else {
                        sap.oee.ui.Utils.createMessage(
                            this.appComponent.oBundle.getText("OEE_ERR_MSG_NO_CONFIG"),
                            sap.ui.core.MessageType.Error
                        );
                        return;
                    }

                    var response;
                    if (context) {
                        response = this.interfaces.getNonSAPDeliveredDCElementsForContext(
                            this.appData.client,
                            context
                        );
                    } else {
                        response = this.interfaces.getDCElementDetails(dcElements);
                    }
                    if (
                        response &&
                        response.dataCollectionElements &&
                        response.dataCollectionElements.results
                    ) {
                        for (
                            var i = 0;
                            i < response.dataCollectionElements.results.length;
                            i++
                        ) {
                            var tempDCElement = response.dataCollectionElements.results[i];
                            dcElements.push({ dcElement: tempDCElement.dcElement });

                            tempDCElements.push({
                                dcElement: tempDCElement.dcElement,
                                reportingUom: tempDCElement.reportingUom,
                                dcElementType: tempDCElement.dcElementType,
                                description: tempDCElement.description,
                                timeElementcategory: tempDCElement.timeElementcategory,
                            });
                        }
                    } else {
                        sap.oee.ui.Utils.createMessage(
                            this.appComponent.oBundle.getText("OEE_ERR_MSG_NO_CONFIG"),
                            sap.ui.core.MessageType.Error
                        );
                        return;
                    }

                    var contextBased = this.interfaces.interfacesGetTotalQuantityCollectedForDCElementsInBaseUom(
                        dcElements
                    );
                    if (
                        contextBased &&
                        contextBased.prodRunDataList != undefined &&
                        contextBased.prodRunDataList.results != undefined
                    )
                        if (contextBased.prodRunDataList.results.length > 0) {
                            for (
                                var i = 0;
                                i < contextBased.prodRunDataList.results.length;
                                i++
                            ) {
                                var tempProdRunData = contextBased.prodRunDataList.results[i];
                                contextBased.prodRunDataList.results[i].quantityReported =
                                    tempProdRunData.quantityInStdRateUom;
                                contextBased.prodRunDataList.results[
                                    i
                                ].assignRCLink = this.appComponent.oBundle.getText(
                                    "OEE_LABEL_ASSIGN"
                                );
                                for (var j = 0; j < tempDCElements.length; j++) {
                                    if (
                                        tempDCElements[j].dcElement ==
                                        contextBased.prodRunDataList.results[i].dcElement
                                    ) {
                                        contextBased.prodRunDataList.results[i].dcElementType =
                                            tempDCElements[j].dcElementType;
                                        contextBased.prodRunDataList.results[
                                            i
                                        ].defaultUOMText = this.interfaces.interfacesGetTextForUOM(
                                            tempDCElements[j].reportingUom
                                        );
                                        contextBased.prodRunDataList.results[i].defaultUOM =
                                            tempDCElements[j].reportingUom;
                                        contextBased.prodRunDataList.results[i].description =
                                            tempDCElements[j].description;
                                        contextBased.prodRunDataList.results[i].lossType = false;
                                        if (
                                            tempDCElements[j].timeElementcategory ==
                                            sap.oee.ui.oeeConstants.timeElementCategoryForLoss
                                        ) {
                                            contextBased.prodRunDataList.results[i].lossType = true;
                                        }
                                        break;
                                    }
                                }
                                //contextBased.prodRunDataList.results[i].startTime = "";
                                //contextBased.prodRunDataList.results[i].endTime = "";
                                contextBased.prodRunDataList.results[i].firstFillField = "";
                                contextBased.prodRunDataList.results[i].secondFillField = "";
                                contextBased.prodRunDataList.results[i].isSelected = false;
                                contextBased.prodRunDataList.results[
                                    i
                                ].timeStampOfSelectedStartTime = "";
                                contextBased.prodRunDataList.results[
                                    i
                                ].timeStampOfSelectedEndTime = "";
                                contextBased.prodRunDataList.results[i].lastReportedTimestamp =
                                    tempProdRunData.changeTimestamp;
                                contextBased.prodRunDataList.results[i].quantityReportedNew =
                                    "";
                                contextBased.prodRunDataList.results[i].comments = "";
                                contextBased.prodRunDataList.results[i].durationInMinutes = "";
                            }
                            this.dataPreparationAndBinding(contextBased);
                        }
                    //			disable the Save Button and detail button
                    //this.byId("genericDataSaveButton").setEnabled(false);
                },

                dataPreparationAndBinding: function (oContext) {
                    this.oContextQuantityType = [];
                    var contextDataModelForQuantityType = new sap.ui.model.json.JSONModel();
                    var reasonCodeColumnVisibilityForQuantityType = false;
                    var contextQuantityRowIndex = 0;

                    for (i = 0; i < oContext.prodRunDataList.results.length; i++) {
                        if (
                            oContext.prodRunDataList.results[i].dcElementType ==
                            this.appData.constDCElementTypeForQuantity
                        ) {
                            oContext.prodRunDataList.results[
                                i
                            ].rowIndex = contextQuantityRowIndex;
                            this.oContextQuantityType.push(
                                oContext.prodRunDataList.results[i]
                            );
                            contextQuantityRowIndex++;
                            if (oContext.prodRunDataList.results[i].lossType == true) {
                                reasonCodeColumnVisibilityForQuantityType = true;
                            }
                        }
                    }
                    this.getView()
                        .byId("commentColumnForQuantityType")
                        .setVisible(reasonCodeColumnVisibilityForQuantityType);
                    this.getView()
                        .byId("reasonCodeColumnForQuantityType")
                        .setVisible(reasonCodeColumnVisibilityForQuantityType);

                    if (this.oContextQuantityType != undefined) {
                        if (this.oContextQuantityType.length > 0) {
                            contextDataModelForQuantityType.setData({
                                genericDataCollectionDataQuantityType: this
                                    .oContextQuantityType,
                            });
                            this.byId(
                                "reportGenericDataCollectionTableQuantityType"
                            ).setModel(contextDataModelForQuantityType);
                        } else if (this.oContextQuantityType.length == 0) {
                            this.getView()
                                .byId("reportGenericDataCollectionTableQuantityType")
                                .setVisible(false);
                        }
                    }
                },

                handleValueHelpRequest: function (oEvent) {
                    var uomListModel;
                    var oIndex = 0;
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
                            this.uomList = { uomList: uomList };
                            uomListModel = new sap.ui.model.json.JSONModel(this.uomList);
                        }

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
                    this.selectedRowIndex = oEvent
                        .getSource()
                        .getBindingContext()
                        .getObject().rowIndex;
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
                    if (oResults.comments != "") {
                        sap.ui
                            .getCore()
                            .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"))
                            .setValue(oResults.comments);
                    }
                    this.oDialogComment.open();
                },

                onCommentDialogCancelButton: function (oEvent) {
                    this.oDialogComment.close();
                },

                onCommentDialogSaveButton: function (oEvent) {
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
                                "reportGenericDataCollectionTableQuantityType"
                            ).getModel()
                        );
                    }
                    this.oDialogComment.close();
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
                    /*if(oQuantity != ""){
                              this.byId("genericDataSaveButton").setEnabled(true);
                          }else{
                              this.byId("genericDataSaveButton").setEnabled(false);
                          }*/
                    this.oContextQuantityType[oIndex].quantityReported = oQuantity;
                    sap.oee.ui.Utils.updateModel(
                        this.byId("reportGenericDataCollectionTableQuantityType").getModel()
                    );
                },

                onPressDetails: function (oEvent) {
                    var bindingContext = oEvent
                        .getSource()
                        .getBindingContext()
                        .getObject();

                    var oData = {
                        description: bindingContext.description,
                        dcElement: bindingContext.dcElement,
                        isLossType: bindingContext.lossType,
                        dataRefreshMethod: this.renderUI,
                        oMainController: this.getView().getController(),
                    };

                    this.appComponent
                        .getEventBus()
                        .publish(this.appComponent.getId(), "openDetailsHandler", oData);
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

                reportData: function (oEvent) {
                    var workcenterid = this.appData.node.workcenterID;

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
                            if (this.oContextQuantityType[index].quantityReportedNew != "") {
                                var orderIndependentData = {};
                                orderIndependentData.client = this.appData.client;
                                orderIndependentData.plant = this.appData.plant;
                                orderIndependentData.nodeID = this.appData.node.nodeID;
                                orderIndependentData.runID = this.appData.selected.runID;
                                orderIndependentData.dcElementType =
                                    sap.oee.ui.oeeConstants.dcElementTypeForOtherQuantity;
                                orderIndependentData.dcElement = this.oContextQuantityType[
                                    index
                                ].dcElement;
                                orderIndependentData.quantity = this.oContextQuantityType[
                                    index
                                ].quantityReportedNew;
                                if (
                                    !sap.oee.ui.Utils.isQuantityValidForLocale(
                                        orderIndependentData.quantity
                                    )
                                ) {
                                    return;
                                } else {
                                    orderIndependentData.quantity = floatFormatter.parse(
                                        orderIndependentData.quantity
                                    );
                                }
                                orderIndependentData.comments = this.oContextQuantityType[
                                    index
                                ].comments;
                                orderIndependentData.uom = this.oContextQuantityType[
                                    index
                                ].defaultUOM;
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
                                var currentTimeStamp = new Date().getTime();
                                var shiftStartTimeStamp = this.appData.shift.startTimestamp;
                                var shiftEndTimeStamp = this.appData.shift.endTimestamp;
                                if (currentTimeStamp < shiftEndTimeStamp) {
                                    orderIndependentData.startTimestamp = currentTimeStamp;
                                    orderIndependentData.endTimestamp = currentTimeStamp;
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
                                // this.updateLastReportedDateTime(dataCollectionArray);
                                // Sakla sonrası teyit ekranına geri dönsün
                                this.onPressGoConfirmScreen();
                                // this.renderUI();
                            }
                        }
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
                                    dataed[i].dcElement
                                ) {
                                    this.oContextQuantityType[index].lastReportedDateTime =
                                        oDate + " " + oTime;
                                }
                            }
                            sap.oee.ui.Utils.updateModel(
                                this.byId(
                                    "reportGenericDataCollectionTableQuantityType"
                                ).getModel()
                            );
                        }
                    }
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
                            "orderChanged",
                            this.renderUI,
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

                openAddtionMeterage: function (oEvent) {
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
                    var sPath = oEvent.getSource().getParent().getBindingContextPath();
                    var chosenRow = sPath.split("/genericDataCollectionDataQuantityType/")[1];
                    var tableData = this.getView().byId("reportGenericDataCollectionTableQuantityType").getModel().oData.genericDataCollectionDataQuantityType;
                    var dcElement = tableData[chosenRow].dcElement;
                    this.getAdditionDetails(dcElement);
                },

                getAdditionDetails: function (dcElement) {
                    var nodeid = this.appData.node.nodeID;
                    var werks = this.appData.plant;
                    var aufnr = this.appData.selected.order.orderNo;
                    var params = {
                        "Param.1": aufnr,
                        "Param.2": werks,
                        "Param.3": nodeid,
                        "Param.4": dcElement
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getAdditionDetailsQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callAdditionInfo);
                },

                callAdditionInfo: function (p_this, p_data) {
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(p_data.Rowsets.Rowset[0]);
                    p_this.getView().setModel(oModel, "AdditionTable");
                },

                onPressGoConfirmScreen: function (oEvent) {
                    var origin = window.location.origin;
                    var pathname = window.location.pathname;
                    if (this.appData.node.description.includes("Örme")) {
                        var navToPage = "#/activity/ZACT_REP_QTY_ORME";
                    } else if (this.appData.node.description.includes("Düzenli")) {
                        var navToPage = "#/activity/ZACT_REP_QTY_DHS";
                    } else if (this.appData.node.description.includes("Tel Çekme")) {
                        var navToPage = "#/activity/ZACT_REP_QTY_SCT";
                    }
                    window.location.href = origin + pathname + navToPage;
                },

                handleCancel: function (oEvent) {
                    oEvent.oSource.getParent().close();
                },

                checkIfValueReported: function (obj) {
                    if (obj) {
                        return true;
                    } else return false;
                },
            }
        );
    }
);
