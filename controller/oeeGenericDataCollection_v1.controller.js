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
        "customActivity/scripts/customStyle",
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
        customStyle,
        History
    ) {
        // "use strict";
        return Controller.extend(
            "customActivity.controller.oeeGenericDataCollection",
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
                    this.bindDataToCard();

                    this.getAllCharacteristic();
                    this.getAllQuantityTon();
                    this.getVisibleStatusCharacteristic();
                    this.getChargeList();
                    this.renderUI();
                    this.getTableData();
                },

                getVisibleStatusCharacteristic: function () {
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
                        visibleJSON[0][oData[0].Row[i].VALUE] = oData[0].Row[i].VALUE;
                    }
                    this.appData.visibleJSON = visibleJSON[0];
                    this.appData.characteristic = oData;
                },

                getAllCharacteristic: function () {
                    var allCharJSON = {};
                    var workorder = this.appData.selected.order.orderNo;
                    if (!workorder) return;
                    var params = {
                        "Param.1": workorder,
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

                    if (jsData == undefined) return;
                    for (i = 0; i < jsData.length; i++) {
                        allCharJSON[jsData[i].CHARCODE] = jsData[i].CHARVALUE;
                    }
                    this.appData.allCharacteristic = allCharJSON;

                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row[0]);
                    this.getView().setModel(oModel, "allCharacteristicModel");
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
                        }
                    }

                    var response;
                    var timeElementList = [{}];
                    var distinctElements;
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
                    }

                    var contextBased =
                        this.interfaces.interfacesGetTotalQuantityCollectedForDCElementsInBaseUom(
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
                                contextBased.prodRunDataList.results[i].assignRCLink =
                                    this.appComponent.oBundle.getText("OEE_LABEL_ASSIGN");
                                for (var j = 0; j < tempDCElements.length; j++) {
                                    if (
                                        tempDCElements[j].dcElement ==
                                        contextBased.prodRunDataList.results[i].dcElement
                                    ) {
                                        contextBased.prodRunDataList.results[i].dcElementType =
                                            tempDCElements[j].dcElementType;
                                        contextBased.prodRunDataList.results[i].defaultUOMText =
                                            this.interfaces.interfacesGetTextForUOM(
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
                },

                dataPreparationAndBinding: function (oContext) {
                    this.oContextQuantityType = [];
                    var contextDataModelForQuantityType =
                        new sap.ui.model.json.JSONModel();
                    var reasonCodeColumnVisibilityForQuantityType = false;
                    var contextQuantityRowIndex = 0;

                    for (i = 0; i < oContext.prodRunDataList.results.length; i++) {
                        if (
                            oContext.prodRunDataList.results[i].dcElementType ==
                            this.appData.constDCElementTypeForQuantity
                        ) {
                            oContext.prodRunDataList.results[i].rowIndex =
                                contextQuantityRowIndex;
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
                                genericDataCollectionDataQuantityType:
                                    this.oContextQuantityType,
                            });
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
                        .getObject().ROWINDEX;
                    var oIndex = 0;

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
                    this.oResults = oEvent.getSource().getBindingContext().getObject();
                    commentBox.setValue(""); // Clear
                    if (this.oResults.COMMENTS != "") {
                        sap.ui
                            .getCore()
                            .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"))
                            .setValue(this.oResults.COMMENTS);
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
                    this.oResults.COMMENTS = oCommentBox.getValue();

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
                    var bindingContext = oEvent.getSource().getBindingContext().getObject();
                    var ModelDatas = oEvent.getSource().getBindingContext().oModel.oData.genericDataCollectionDataQuantityType;
                    var oQuantity = oEvent.getSource().getValue();
                    var oUOM = oEvent.getSource().getBindingContext().getObject().DEFAULTUOM;
                    var oDC = oEvent.getSource().getBindingContext().getObject().DC_ELEMENT;
                    if (oUOM == "ROL") {
                        var oQuan = oQuantity.toUpperCase()
                        if (oDC.indexOf("DC_2001_SDM_POTAACD") >= 0) {
                            if (oQuan == "O" || oQuan == "K") {
                                oEvent.getSource().setValue(oQuan);
                                bindingContext.QUANTITY_BOOELEAN = true;
                            }
                            else {
                                oQuan = "";
                                oEvent.getSource().setValue(oQuan)
                                bindingContext.QUANTITY_BOOELEAN = false;
                                sap.m.MessageToast.show("Lütfen geçerli değer giriniz.\n\nOksijenli=O  Kendi=K");
                            }
                        }
                        else if (oDC.indexOf("DC_2001_PO_SOFTBUB") >= 0) {
                            if (oQuan == "E" || oQuan == "H") {
                                oEvent.getSource().setValue(oQuan);
                                bindingContext.QUANTITY_BOOELEAN = true;
                            }
                            else {
                                oQuan = "";
                                oEvent.getSource().setValue(oQuan);
                                bindingContext.QUANTITY_BOOELEAN = false;
                                sap.m.MessageToast.show("Lütfen geçerli değer giriniz.\n\nEvet=E  Hayır=H");
                            }
                        }
                        else {
                            oQuan = "";
                            oEvent.getSource().setValue(oQuan)
                            bindingContext.QUANTITY_BOOELEAN = true;
                        }
                    }
                    else if (oUOM == "H") {
                        bindingContext.QUANTITY_BOOELEAN = true;
                        if (this.appData.plant == '2001') {
                            if (oDC.indexOf("DC_2001_AO_TEDALSA") >= 0) {
                                var TEDALSA = oQuantity;
                                for (var i = 0; i < ModelDatas.length; i++) {
                                    if (ModelDatas[i].DC_ELEMENT.indexOf("DC_2001_AO_TEDTIRS") >= 0) {
                                        var TEDTIRS = ModelDatas[i].QUANTITY;
                                        ModelDatas[i].QUANTITY_BOOELEAN = true;
                                    }
                                    else if (ModelDatas[i].DC_ELEMENT.indexOf("DC_2001_AO_TEDTBSU") >= 0) {
                                        var iTEDTBSU = i;
                                        var TEDTBSU = ModelDatas[i].QUANTITY;
                                        ModelDatas[i].QUANTITY_BOOELEAN = true;
                                    }
                                }
                                var dt1 = new Date();
                                var dat1 = new Date(dt1.toISOString().substr(0,10)+' '+TEDALSA+':00:0000');
                                var dat2 = new Date(dt1.toISOString().substr(0,10)+' '+TEDTIRS+':00:0000');
                                var dat3 = new Date(dt1.toISOString().substr(0,10)+' 00:00:00:0000');
                                var datdiff = (dat1-dat2)/1000
                                dat3.setSeconds(dat3.getSeconds()+datdiff);
                                TEDTBSU = dat3.toLocaleTimeString().substr(0,5);
                                ModelDatas[iTEDTBSU].QUANTITY = TEDTBSU;
                            }

                            if (oDC.indexOf("DC_2001_AO_TEDTIRS") >= 0) {
                                var TEDTIRS = oQuantity;
                                for (var i = 0; i < ModelDatas.length; i++) {
                                    if (ModelDatas[i].DC_ELEMENT.indexOf("DC_2001_AO_TEDALSA") >= 0) {
                                        var TEDALSA = ModelDatas[i].QUANTITY;
                                        ModelDatas[i].QUANTITY_BOOELEAN = true;
                                    }
                                    else if (ModelDatas[i].DC_ELEMENT.indexOf("DC_2001_AO_TEDTBSU") >= 0) {
                                        var iTEDTBSU = i;
                                        var TEDTBSU = ModelDatas[i].QUANTITY;
                                        ModelDatas[i].QUANTITY_BOOELEAN = true;
                                    }
                                }
                                var dt1 = new Date();
                                var dat1 = new Date(dt1.toISOString().substr(0,10)+' '+TEDALSA+':00:0000');
                                var dat2 = new Date(dt1.toISOString().substr(0,10)+' '+TEDTIRS+':00:0000');
                                var dat3 = new Date(dt1.toISOString().substr(0,10)+' 00:00:00:0000');
                                var datdiff = (dat1-dat2)/1000
                                dat3.setSeconds(dat3.getSeconds()+datdiff);
                                TEDTBSU = dat3.toLocaleTimeString().substr(0,5);
                                ModelDatas[iTEDTBSU].QUANTITY = TEDTBSU;
                            }
                        }
                        if (this.appData.plant == '3001') {
                            if (oDC.indexOf("DC_3001_PO_GIRSAAT") >= 0) {
                                var GIRSAAT = oQuantity;
                                for (var i = 0; i < ModelDatas.length; i++) {
                                    if (ModelDatas[i].DC_ELEMENT.indexOf("DC_3001_PO_CIKSAAT") >= 0) {
                                        var CIKSAAT = ModelDatas[i].QUANTITY;
                                        ModelDatas[i].QUANTITY_BOOELEAN = true;
                                    }
                                    else if (ModelDatas[i].DC_ELEMENT.indexOf("DC_3001_PO_TTOPSUR") >= 0) {
                                        var iTTOPSUR = i;
                                        var TTOPSUR = ModelDatas[i].QUANTITY;
                                        ModelDatas[i].QUANTITY_BOOELEAN = true;
                                    }
                                }
                            }

                            if (oDC.indexOf("DC_3001_PO_CIKSAAT") >= 0) {
                                var CIKSAAT = oQuantity;
                                for (var i = 0; i < ModelDatas.length; i++) {
                                    if (ModelDatas[i].DC_ELEMENT.indexOf("DC_3001_PO_GIRSAAT") >= 0) {
                                        var GIRSAAT = ModelDatas[i].QUANTITY;
                                        ModelDatas[i].QUANTITY_BOOELEAN = true;
                                    }
                                    else if (ModelDatas[i].DC_ELEMENT.indexOf("DC_3001_PO_TTOPSUR") >= 0) {
                                        var iTTOPSUR = i;
                                        var TTOPSUR = ModelDatas[i].QUANTITY;
                                        ModelDatas[i].QUANTITY_BOOELEAN = true;
                                    }
                                }
                            }
                            if(ModelDatas[iTTOPSUR].QUANTITY_BOOELEAN){
                                var dt1 = new Date();
                                var dat1 = new Date(dt1.toISOString().substr(0,10)+' '+GIRSAAT+':00:0000');
                                var dat2 = new Date(dt1.toISOString().substr(0,10)+' '+CIKSAAT+':00:0000');
                                var dat3 = new Date(dt1.toISOString().substr(0,10)+' 00:00:00:0000');
                                var dat4 = new Date(dt1.toISOString().substr(0,10)+' 00:00:00:0000');
                                var datdiff = (dat2-dat1)/1000;
                                dat3.setSeconds(dat3.getSeconds()+datdiff);
                                TTOPSUR = (dat3-dat4)/60000;
                                if(TTOPSUR<0){TTOPSUR=1440+TTOPSUR}
                                ModelDatas[iTTOPSUR].QUANTITY = TTOPSUR;
                            }
                        }
                    }
                    else {
                        if (oQuantity == "") oQuantity = 0;
                        var quantity = parseFloat(oQuantity);
                        if (quantity > 0) bindingContext.QUANTITY_BOOELEAN = true;
                        else bindingContext.QUANTITY_BOOELEAN = false;
                    }
                    if (oDC.indexOf("DC_2001_PO_SIVICEL") >= 0) {
                        var SIVICEL = oQuantity;
                        for (var i = 0; i < ModelDatas.length; i++) {
                            if (ModelDatas[i].DC_ELEMENT.indexOf("DC_2001_PO_BOSPOTA") >= 0) {
                                var BOSPOTA = ModelDatas[i].QUANTITY;
                                ModelDatas[i].QUANTITY_BOOELEAN = true;
                            }
                            else if (ModelDatas[i].DC_ELEMENT.indexOf("DC_2001_PO_SICENET") >= 0) {
                                var iSICENET = i;
                                var SICINET = ModelDatas[i].QUANTITY;
                                ModelDatas[i].QUANTITY_BOOELEAN = true;
                            }
                        }
                        SICINET = SIVICEL - BOSPOTA;
                        ModelDatas[iSICENET].QUANTITY = SICINET;
                    }
                    else if (oDC.indexOf("DC_2001_PO_BOSPOTA") >= 0) {
                        var BOSPOTA = oQuantity;
                        for (var i = 0; i < ModelDatas.length; i++) {
                            if (ModelDatas[i].DC_ELEMENT.indexOf("DC_2001_PO_SIVICEL") >= 0) {
                                var SIVICEL = ModelDatas[i].QUANTITY;
                                ModelDatas[i].QUANTITY_BOOELEAN = true;
                            }
                            else if (ModelDatas[i].DC_ELEMENT.indexOf("DC_2001_PO_SICENET") >= 0) {
                                var iSICENET = i;
                                var SICINET = ModelDatas[i].QUANTITY;
                                ModelDatas[i].QUANTITY_BOOELEAN = true;
                            }
                        }
                        SICINET = SIVICEL - BOSPOTA;
                        ModelDatas[iSICENET].QUANTITY = SICINET;
                    }
                    oEvent.getSource().getBindingContext().oModel.refresh();
                },

                onPressDetails: function (oEvent) {
                    var bindingContext = oEvent
                        .getSource()
                        .getBindingContext()
                        .getObject();

                    var params = {
                        "Param.1": bindingContext.ENTRY_ID,
                    };

                    var oView = this.getView();
                    var oDialog = oView.byId("dataCollectionDetails");
                    if (!oDialog) {
                        oDialog = sap.ui.xmlfragment(
                            oView.getId(),
                            "customActivity.fragmentView.dataCollectionDetails",
                            this
                        );
                        oView.addDependent(oDialog);
                    }
                    oDialog.open();
                    this.appData.oDialog = oDialog;

                    this.getButtonDetailsQry(params);
                },

                callButtonDetailsQry: function (p_this, p_data) {
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(p_data.Rowsets.Rowset[0].Row);
                    p_this.getView().setModel(oModel, "buttonDetailsModel");
                },

                getButtonDetailsQry: function (params) {
                    var tRunner = new TransactionRunner(
                        "MES/UI/GenericDataCollection/getDetailsFragmentQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callButtonDetailsQry);
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

                callDataCollection: function (p_this, p_data) {
                    p_this.byId("genericDataSaveButton").setEnabled(true)
                    sap.m.MessageToast.show(
                        p_this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                    );
                    p_this.getTableData();
                },

                reportData: function (oEvent) {
                    var dataCollectionArray = [];
                    var appData = this.appData;
                    var rows = this.getView()
                        .byId("reportGenericDataCollectionTableQuantityType")
                        .getModel().oData.genericDataCollectionDataQuantityType;
                    var client = appData.client;
                    var plant = appData.plant;
                    var nodeID = appData.node.nodeID;
                    var runID = appData.selected.runID;
                    rows.forEach(function (item, index) {
                        if (item.QUANTITY_BOOELEAN) {
                            dataCollectionArray.push({
                                client: client,
                                plant: plant,
                                nodeID: nodeID,
                                runID: runID,
                                dcElementType: item.DC_ELEM_TYPE,
                                dcElement: item.DC_ELEMENT,
                                quantity: item.QUANTITY.toString(),
                                comments: item.COMMENTS,
                                uom: item.DEFAULTUOM,
                            });
                        }
                    }, this);
                    for (var i = 0; i < dataCollectionArray.length; i++) {
                        if (dataCollectionArray[i].dcElement.indexOf("DC_2001_PO_SICENET") >= 0) {
                            if (dataCollectionArray[i].quantity < 0) {
                                sap.m.MessageToast.show("Sıvı Çelik Net Ağırlığı 0'dan küçük olamaz.");
                                return;
                            }
                        }
                        else if(dataCollectionArray[i].uom=="H"){
                            var dt1 = new Date();
                            var timeQuan = dataCollectionArray[i].quantity;
                            var dat1 = new Date(dt1.toISOString().substr(0,10)+' '+timeQuan+':00:0000');
                            var dat2 = new Date(dt1.toISOString().substr(0,10)+' 00:00:00:0000');
                            dataCollectionArray[i].quantity=(dat1-dat2)/1000

                        }
                    }

                    this.byId("genericDataSaveButton").setEnabled(false);
                    var chargeNo = this.getView().byId("chargeList").getSelectedKey();
                    var userID = this.appData.user.userID;
                    var params = {
                        I_DATACOLLECTIONARRAY: JSON.stringify(dataCollectionArray),
                        I_CHARGE: chargeNo,
                        I_USERID: userID,
                        I_OBJEK: this.appData.characteristic[0].Row[0].OBJEK,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/GenericDataCollection/interfacesReportQuantitiesForAllDataCollectionXquery",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callDataCollection);
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

                openWeldList: function (oEvent) {
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
                    oDialog.open();
                    //  }
                    this.getWeldDetails();
                },

                getWeldDetails: function () {
                    var nodeid = this.appData.node.nodeID;
                    var werks = this.appData.plant;
                    var aufnr = this.appData.selected.order.orderNo;
                    var params = {
                        "Param.1": aufnr,
                        "Param.2": werks,
                        "Param.3": nodeid,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getWeldDetailsQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callWeldInfo);
                },

                callWeldInfo: function (p_this, p_data) {
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(p_data.Rowsets.Rowset[0]);
                    p_this.getView().setModel(oModel, "WeldTable");
                },

                onPressGoConfirmScreen: function (oEvent) {
                    var origin = window.location.origin;
                    var pathname = window.location.pathname;
                    var navToPage = "#/activity/ZACT_REP_QTY";
                    window.location.href = origin + pathname + navToPage;
                },

                handleCancel: function (oEvent) {
                    oEvent.oSource.getParent().close();
                },

                getChargeList: function () {
                    var oModel = new sap.ui.model.json.JSONModel();
                    var castingList = [
                        { CHARGE: 1 },
                        { CHARGE: 2 },
                        { CHARGE: 3 },
                        { CHARGE: 4 },
                        { CHARGE: 5 },
                        { CHARGE: "Genel" },
                    ];
                    oModel.setData(castingList);
                    this.getView().setModel(oModel, "chargeListModel");
                },

                checkIfValueReported: function (obj) {
                    if (obj) {
                        return true;
                    } else return false;
                },

                callTableData: function (p_this, p_data) {
                    var chargeNumber = p_this
                        .getView()
                        .byId("chargeList")
                        .getSelectedKey();
                    var rows = p_data.Rowsets.Rowset[0].Row;
                    var objek = p_this.appData.characteristic[0].Row[0].OBJEK;
                    var jsonData = [];
                    if (objek == "3001AO") {
                        if (chargeNumber == "Genel") {
                            var jsonData = [];
                            for (var i = 0; i < rows.length; i++) {
                                if (
                                    rows[i].DC_ELEMENT == "DC_3001_AO_DEVOKSJ" ||
                                    rows[i].DC_ELEMENT == "DC_3001_AO_DEVSICA" ||
                                    rows[i].DC_ELEMENT == "DC_3001_AO_DEVKARB" ||
                                    rows[i].DC_ELEMENT == "DC_3001_AO_OKSBSNC" ||
                                    rows[i].DC_ELEMENT == "DC_3001_AO_ELEKILA"
                                ) {
                                    jsonData.push(rows[i]);
                                }
                            }
                            rows = jsonData;
                        } else if (chargeNumber == "") {
                        }
                        if (chargeNumber != "Genel") {
                            for (var i = 0; i < rows?.length; i++) {
                                if (
                                    rows[i].DC_ELEMENT == "DC_3001_AO_EENERJI" ||
                                    rows[i].DC_ELEMENT == "DC_3001_AO_OKSTUKE"
                                ) {
                                    jsonData.push(rows[i]);
                                }
                            }
                            rows = jsonData;
                        }
                    }

                    var oModel = new sap.ui.model.json.JSONModel();
                    var tableData = { genericDataCollectionDataQuantityType: rows };
                    oModel.setData(tableData);
                    p_this
                        .getView()
                        .byId("reportGenericDataCollectionTableQuantityType")
                        .setModel(oModel);
                },

                getTableData: function () {
                    var nodeID = this.appData.node.nodeID;
                    var workorder = this.appData.selected.order.orderNo;
                    var castingList = this.getView().byId("chargeList").getSelectedKey();

                    if (
                        this.appData.plant == "3001" &&
                        this.appData.node.description == "Ark Ocağı"
                    ) {
                        if (castingList == "") castingList = 1;
                    }
                    var params = {
                        "Param.1": nodeID,
                        "Param.2": workorder,
                        "Param.3": castingList,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/GenericDataCollection/getTableDataQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callTableData);
                },

                openConsuptionFragment: function () {
                    var oView = this.getView();
                    var oDialog = oView.byId("reportDataAo");
                    if (!oDialog) {
                        oDialog = sap.ui.xmlfragment(
                            oView.getId(),
                            "customActivity.fragmentView.reportDataAo",
                            this
                        );
                        oView.addDependent(oDialog);
                    }
                    oDialog.open();
                    this.appData.oDialog = oDialog;
                    this.getDataCollection();
                    this.getConsumption();
                    this.getDataCollectionGeneral();
                },

                callDataCollectionTable: function (p_this, p_data) {
                    var jsData = p_data.Rowsets.Rowset[0].Row;
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(jsData);
                    p_this.getView().setModel(oModel, "dataCollectionModel");
                },
                getDataCollection: function () {
                    var params = {
                        "Param.1": this.appData.selected.order.orderNo,
                        "Param.2": this.appData.node.nodeID,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/GenericDataCollection/getDataCollectionQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callDataCollectionTable);
                },

                callConsumption: function (p_this, p_data) {
                    var jsData = p_data.Rowsets.Rowset[0].Row;
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(jsData);
                    p_this.getView().setModel(oModel, "consumptionModel");
                },

                getConsumption: function () {
                    var params = {
                        "Param.1": this.appData.selected.order.orderNo,
                        "Param.2": this.appData.node.nodeID,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/GenericDataCollection/getConsumptionDataQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callConsumption);
                },

                callDataCollectionGeneral: function (p_this, p_data) {
                    var jsData = p_data.Rowsets.Rowset[0].Row[0];
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(jsData);
                    p_this.getView().setModel(oModel, "dataCollectionGeneralModel");
                },

                getDataCollectionGeneral: function () {
                    var params = {
                        "Param.1": this.appData.selected.order.orderNo,
                        "Param.2": this.appData.node.nodeID,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/GenericDataCollection/getDataCollectionGeneralQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callDataCollectionGeneral);
                },
                getAllQuantityTon: function () {
                    var runID = this.appData.selected.runID;
                    var workorder = this.appData.selected.order.orderNo;
                    var nodeID = this.appData.node.nodeID;

                    if (runID == undefined || workorder == undefined) return;
                    var params = { "Param.1": runID, "Param.2": workorder, "Param.3": nodeID };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantitySteelChrac/getAllQuantityQry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }

                    var jsData = tRunner.GetJSONData();

                    this.appData.allCharacteristic.quantityReportedCustom =
                        " : " + jsData[0].Row[1].QUANTITYTON + " ton";
                    this.appData.allCharacteristic.totalQuantityProducedInRunCustom =
                        " : " + jsData[0].Row[0].QUANTITYTON + " ton";
                    this.appData.allCharacteristic.quantityReleasedCustom =
                        " : " + parseFloat(this.appData.selected.quantityReleased) + " ton";
                    var remainingQuantity = parseFloat(
                        parseFloat(this.appData.selected.quantityReleased) -
                        jsData[0].Row[1].QUANTITYTON
                    ).toFixed(2);

                    this.appData.allCharacteristic.remainingQuantity =
                        " : " + remainingQuantity + " ton";
                },
                handleExit: function () {
                    this.appData.oDialog.destroy();
                },
            }
        );
    }
);