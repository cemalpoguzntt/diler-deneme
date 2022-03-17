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
        "customActivity/scripts/transactionCaller",
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
        TransactionCaller
    ) {
        var that;
        var screenComponents = [
            "BUTON_EK_METRAJ",
            "SEKME_GENEL",
            "SEKME_PARTI_SEC",
            "BUTON_KAYNAK_EKLE",
            "TOPLAM TONAJ",
            "BUTON_PARTI_YARAT",
            "YENIDEN İŞLEME",
            "SAĞLAM MIKTAR",
            "REWORK",
            "SEKME_TEYIT_LISTESI",
            "GOOD QUANTITY",
            "COLUMN_COMPONENT",
            "HURDA",
            "SCRAP",
            "BOBBIN_NO",
            "MC_SN",
            "MC NO",
            "MC METRAJ"
        ];
        var interval;
        var aufnrInterval;
        var focusCount = 0;
        var isWeldList = null;
        var isSaveRecordsComponent = false;
        var isSaveRecords = false;
        var isSavePcStrand = false;
        var bobbinNoModel;
        var pastRunId;

        return Controller.extend("customActivity/controller/oeeReportQuantityDNA", {
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
                this.appData.intervalState = true;

                this.appComponent
                    .getEventBus()
                    .subscribe(
                        this.appComponent.getId(),
                        "orderChanged",
                        this.refreshScreenOnOrderChange,
                        this
                    );
                this.checkShift();
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
                if (this.appData.characteristic[0].Row[0].OBJEK == "3007DUMMY_MC") {
                    // Orme - Last MC Info
                    this.setVisibleLastMcInfo();
                }
                if (this.appData.characteristic[0].Row[0].OBJEK.includes("SCTEL")) {
                    this.getView().byId("selectedBatchHBox").setVisible(true);
                }
                that = this;
                
                this.reportProductionContent();
                this.getBatchnumbList();
                this.getProdRunInformation();
                this.checkNode();
                this.getKaynakMetraj();
                if (this.appData.node.description.includes("Fosfatlama")) {
                    this.setFocusToBatchQuantity();
                }
                else {
                    this.setVisibleResetPartiNo();
                }

                this.getActiveOrder();

                aufnrInterval = setInterval(function () {
                    that.getActiveOrder();
                }, 60000)

                this.getBobbinNo();
                this.modelServices();
            },
            modelServices: function () {

                oTrigger = new sap.ui.core.IntervalTrigger(4000);
                oTrigger.addListener(() => {
                    if (this.appData.intervalState) {
                        this.production100();
                    }

                }, this);
            },
            checkShift: function () {
                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/CheckActiveStaffInShift/T_GET_ACTIVE_STAFF_IN_SHIFT",
                    {
                        I_CLIENT: this.appData.client,
                        I_PLANT: this.appData.plant,
                        I_NODE_ID: this.appData.node.nodeID
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    this.openCheckShiftFragment();
                }

            },
            openCheckShiftFragment: function () {
                if (!this._oDialog99) {
                    this._oDialog99 = sap.ui.xmlfragment(
                        "checkShiftMessageFragment",
                        "customActivity.fragmentView.checkShiftMessageFragment",

                        this
                    );
                    this.getView().addDependent(this._oDialog99);
                }
                this._oDialog99.open();

            },
            onCancelFrag99: function () {
                this._oDialog99.close();
            },
            redirectToShiftScreen: function () {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_SHIFT_STAFF";
                window.location.href = origin + pathname + navToPage;
            },
            getActiveOrder: function () {
                if (!!!(this.getView().byId("reportProductionQuantityTable"))) {
                    clearInterval(aufnrInterval);
                    return;
                }
                TransactionCaller.async("MES/Itelli/DNA/ActiveOrder/T_GET_ACTIVE_ORDER", {
                    I_CLIENT: this.appData.client,
                    I_PLANT: this.appData.plant,
                    I_NODE_ID: this.appData.node.nodeID
                },
                    "O_JSON",
                    this.getActiveOrderCB,
                    this,
                    "GET"
                );
            },
            getActiveOrderCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    clearInterval(aufnrInterval);
                    return;
                }
                var activeAufnr = iv_data[0].Rowsets.Rowset.Row.AUFNR;
                var currentAufnr = iv_scope.appData.selected.order.orderNo;
                if (activeAufnr != currentAufnr) {
                    document.location.reload();
                }
            },

            onPressResetPartiNo: function (oEvent) {
                var inputBatch = this.byId("reportProductionQuantityTable").mAggregations.items[0].mAggregations.cells[3].sId;
                var inputMiktar = this.byId("reportProductionQuantityTable").mAggregations.items[0].mAggregations.cells[1].sId;
                this.byId(inputBatch).setValue(null);
                this.byId(inputMiktar).setValue(null);
            },
            setVisibleResetPartiNo: function () {
                this.getView().byId("resetPartiNo").setVisible(true);
                this.getView().byId("idResetPartiNo").setVisible(true);
            },
            setVisibleLastMcInfo: function () {
                this.getView().byId("idOrmeFB").setVisible(true);
                this.getLastBobbinInfo("KAYNAK_METRAJI");
            },
            getLastBobbinInfo: function (type) {
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;

                TransactionCaller.async(
                    "MES/Itelli/DNA/GetLastRowAndWeld/T_GET_LAST_RN_AND_WM",
                    {
                        I_CLIENT: client,
                        I_PLANT: plant,
                        I_NODE_ID: nodeID,
                        I_WELD_TYPE: type,
                    },
                    "O_JSON",
                    this.getLastBobbinInfoCB,
                    this,
                    "GET"
                );

            },
            getLastBobbinInfoCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                } else {
                    var lastBobbinNo = "";
                    var weldMeterageString = "";
                    if (!!!(iv_data[0].Rowsets.Rowset.Row[0])) {
                        lastBobbinNo = iv_data[0].Rowsets.Rowset.Row?.ROW_NUMBER;
                        weldMeterageString = iv_data[0].Rowsets.Rowset.Row?.QUANTITY;
                    } else {
                        lastBobbinNo = iv_data[0].Rowsets.Rowset.Row[0]?.ROW_NUMBER;
                        var modelArr = Array.isArray(iv_data[0].Rowsets.Rowset.Row) ? iv_data[0].Rowsets.Rowset.Row : new Array(iv_data[0].Rowsets.Rowset.Row);
                        modelArr.forEach((item) => { weldMeterageString = weldMeterageString + ", " + item.QUANTITY; })
                        weldMeterageString = weldMeterageString.substring(2);
                    }
                    iv_scope.getView().byId("idLastMCRNLabel").setText(lastBobbinNo);
                    iv_scope.getView().byId("idLastMCWMLabel").setText(weldMeterageString);
                }
            },
            setFocusToBatchQuantity: function () {
                var batchInput = this.byId("reportProductionQuantityTable")
                    .mAggregations.items[0].mAggregations.cells[3].sId;
                focusCount = 0;
                interval = setInterval(function () {
                    that.byId(batchInput).focus();
                    focusCount++;
                    if (focusCount == 15) {
                        clearInterval(interval);
                    }
                }, 100);
            },

            checkNode: function () {
                var objek = this.appData.characteristic[0].Row[0].OBJEK;
                if (
                    objek == "3007SCTEL1" ||
                    objek == "3007SCTEL2" ||
                    objek == "3007DUMMY_MC" ||
                    objek == "3007PCSTRAND"
                ) {
                    this.getView()
                        .byId("reportProductionQuantityTable2")
                        .setVisible(true);
                }
                if (objek == "3007PCSTRAND") {
                    this.getView().byId("idKaynak").setText("Ek Metraj");
                }
                else {
                    this.getView().byId("idKaynak").setText("Kaynak Metraj");
                }
                if (objek == "3007FOSFAT") {
                    this.getView().byId("idFosfatFB").setVisible(true);
                }
            },

            getKaynakMetraj: function (oEvent) {
                var nodeid = this.appData.node.nodeID;
                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/ReportProduction/getNullKaynakMetraj",
                    {
                        I_NODEID: nodeid,
                    },
                    "O_JSON"
                );
                response[0].Rowsets.Rowset.Row = Array.isArray(
                    response[0].Rowsets?.Rowset.Row
                )
                    ? response[0].Rowsets.Rowset.Row
                    : new Array(response[0].Rowsets.Rowset.Row);
                var tableModel = new sap.ui.model.json.JSONModel();
                tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
                this.getView()
                    .byId("reportProductionQuantityTable2")
                    .setModel(tableModel);
                this.getView()
                    .byId("reportProductionQuantityTable2")
                    .getModel()
                    .refresh();
            },

            onPressDelete: function (oEvent) {
                var oButton = oEvent.getSource();
                var oBindingContext = oButton.getBindingContext();
                var oBindingObject = oBindingContext.getObject();
                var entryID = oBindingObject?.ENTRY_ID;
                MessageBox.warning("Dikkat! Kaynak Metraj SİLİNECEKTİR.", {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction == "OK") {
                            that.deleteMetraj(entryID);
                        }
                    },
                });
            },

            deleteMetraj: function (entryID) {
                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/ReportProduction/deleteKaynakMetraj",
                    {
                        I_ENTRYID: entryID,
                    },
                    "O_JSON"
                );
                this.getKaynakMetraj();
                MessageBox.information("Seçilen Kaynak Silindi.");
            },

            onSelectBatchTableChange: function (oEvent) {
                var selectedItem = this.getView()
                    .byId("tblComponents1")
                    .getSelectedItem();
                var batchNumber = selectedItem.mAggregations.cells[1].mProperties.text;
                this.getView().byId("selectedBatchNumber").setValue(batchNumber);
                this._oSelectedSıraNo =
                    selectedItem.mAggregations.cells[0].mProperties.text;
            },
            onPressClearSelectedBatchNumber: function (oEvent) {
                this.getView().byId("selectedBatchNumber").setValue(null);
                this._oSelectedSıraNo = null;
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

                visibleJSON[0].K_CAP = this.appData.node.description.includes("Tel Çekme");

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
                    item.objek = objek;
                    if (
                        objek == "3007SCTEL1" ||
                        objek == "3007SCTEL2" ||
                        objek == "3007DUMMY_MC" ||
                        //objek == "3007PCSTRAND" || // DHS için oto quantity false
                        objek == "3007PCWIRE"
                    ) {
                        if (item.dcElement == "GOOD_QUANTITY") {
                            item.uom = "M";
                            item.uomText = "m";
                            if (!!item.batchNumber) {
                                if (!!this.appData.allCharacteristic) {
                                    var metrajArr = [
                                        "Y_METRAJ",
                                        "Y_CEVRE_TEL_METRAJ",
                                        "Y_MERKEZ_TEL_METRAJ",
                                    ];
                                    metrajArr.forEach((metraj) => {
                                        if (!!this.appData.allCharacteristic[metraj]) {
                                            if (!!this.appData.allCharacteristic[metraj]?.VALUE)
                                                item.quantity = this.appData.allCharacteristic[
                                                    metraj
                                                ]?.VALUE;
                                        }
                                    });
                                }
                            }
                        } else if (item.dcElement == "SCRAP") {
                            item.uom = "KG";
                            item.uomText = "kg";
                        }
                    }
                    // DHS için miktar alanı m gelsin
                    else if (objek == "3007PCSTRAND") {
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
                //this.refreshProductionQuantityReported();
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
                var objek = this.appData.characteristic[0].Row[0].OBJEK;

                if (objek == "3007DUMMY_MC") {
                    var sId = this.getView().byId("reportProductionQuantityTable")
                        .mAggregations.items[0].mAggregations.cells[1].sId;

                    var value = this.byId(sId).getValue();

                    var partiSId = this.getView().byId("reportProductionQuantityTable")
                        .mAggregations.items[0].mAggregations.cells[3].sId;

                    var parti = this.byId(partiSId).getValue();

                    if (!parti) {
                        MessageBox.error("Parti alanı boş bırakılamaz");
                        return;
                    }

                    if (!value) {
                        MessageBox.error("Miktar boş bırakılamaz");
                        return;
                    }

                    if (isNaN(parseInt(value))) {
                        MessageBox.error("Miktar formatı yanlıştır.");
                        return;
                    }
                }

                if (objek == "3007PCWIRE") {
                    var pcw_qty = this.getView().byId("reportProductionQuantityTable").mAggregations.items[0].mAggregations.cells[1].getValue();
                    if (pcw_qty == "") {
                        MessageBox.error("Miktar boş bırakılamaz");
                        return;
                    }
                    var pcw_batch = this.getView().byId("reportProductionQuantityTable").mAggregations.items[0].mAggregations.cells[3].getValue();
                    if (pcw_batch == "") {
                        MessageBox.error("Parti oluşturulması gerekiyor");
                        return;
                    }
                }

                var checkMetraj = false;
                if (objek != "3007FOSFAT" && objek != "3007PCSTRAND" && objek != "3007PCWIRE") {
                    checkMetraj = true;
                }
                if (checkMetraj) {
                    var array = [];
                    var metrajArray = this.getView()
                        .byId("reportProductionQuantityTable2")
                        .getModel()
                        .getData();
                    for (i = 0; i < metrajArray.length; i++) {
                        if (!!metrajArray[i]?.QUANTITY) {
                            array.push(metrajArray[i].QUANTITY);
                        }
                    }
                    if (array.length != 0) {
                        var max = array.reduce(function (a, b) {
                            return Math.max(a, b);
                        });
                    } else {
                        checkMetraj = false;
                    }
                }
                var quantity = this.getView()
                    .byId("reportProductionQuantityTable")
                    .getModel()
                    .getData().productionData[0].quantity;

                if (checkMetraj && quantity < max) {
                    MessageBox.error("Kaynak metrajı üretim miktarından fazla olamaz");
                } else {
                    var oTable = this.getView().byId("reportProductionQuantityTable");
                    var oModel = oTable.getModel();
                    var oData = oModel.oData;
                    var productionData = oData.productionData;
                    var errorLineQuantity = 0;
                    for (i = 0; i < productionData.length; i++) {
                        if (
                            productionData[i].quantity != "" &&
                            !!productionData[i].quantity
                        )
                            errorLineQuantity++;
                    }
                    if (errorLineQuantity > 1) {
                        sap.m.MessageToast.show(
                            this.appComponent.oBundle.getText("OEE_LABEL_ERROR_CONFIRM")
                        );
                        this.clearReportQuantityInputs();
                        return;
                    }
                    var movetype = 101;
                    var workcenterID = this.appData.node.workcenterID;
                    var objek = this.appData.characteristic[0].Row[0].OBJEK;                    
                    // if (
                    //     productionData.length == 1 &&
                    //     productionData[0]?.dcElement == "GOOD_QUANTITY"
                    // ) {
                    //     var cntGQ = 0,
                    //         index;
                    //     var isBatchFilledGQ = false;
                    //     if (!!productionData[0].batchNumber)
                    //     isBatchFilledGQ = true;
                    //     for (var i = 0; i < productionData.length; i++) {
                    //         if (productionData[i].dcElement == "GOOD_QUANTITY" && !!productionData[i].quantity) {
                    //             cntGQ++;
                    //             index = i;
                    //         }
                    //     }

                    // }
                    // if ((cntGQ == 0 && isBatchFilledGQ) || (cntGQ > 0 && !isBatchFilledGQ)) {
                    //     sap.m.MessageToast.show(
                    //         this.appComponent.oBundle.getText("OEE_ERROR_FILL_ALL_INPUTS")
                    //     );
                    //     this.clearReportQuantityInputs();
                    //     return;
                    // }

                    var cnt = 0,
                        index;
                    for (var i = 0; i < productionData.length; i++) {
                        if (
                            productionData[i].dcElement == "GOOD_QUANTITY" &&
                            !!productionData[i].batchNumber &&
                            !!productionData[i].quantity
                        ) {
                            cnt++;
                            index = i;
                        }
                    }
                    

                    if (
                        productionData.length == 2 &&
                        productionData[1]?.dcElement == "SCRAP"
                    ) {
                        var scp = 0,
                            index;
                        for (var i = 0; i < productionData.length; i++) {
                            if (
                                productionData[i].dcElement == "SCRAP" &&
                                !!productionData[i].quantity
                            ) {
                                scp++;
                                index = i;
                            }
                        }

                    }
                    if ((cnt == 0 && scp == 0) || (cnt == 0 && objek == "3007PCSTRAND")) {
                        sap.m.MessageToast.show(
                            this.appComponent.oBundle.getText("OEE_ERROR_FILL_ALL_INPUTS")
                        );
                        this.clearReportQuantityInputs();
                        return;
                    }

                    if (
                        productionData.length == 2 &&
                        productionData[1]?.dcElement == "REWORK"
                    ) {
                        var rw = 0,
                            index;
                        var isBatchFilled = false;
                        if (!!productionData[1].batchNumber)
                            isBatchFilled = true;
                        for (var i = 0; i < productionData.length; i++) {
                            if (productionData[i].dcElement == "REWORK" && !!productionData[i].quantity) {
                                rw++;
                                index = i;
                            }
                        }

                    }
                    if ((rw == 0 && isBatchFilled) || (rw > 0 && !isBatchFilled)) {
                        sap.m.MessageToast.show(
                            this.appComponent.oBundle.getText("OEE_ERROR_FILL_ALL_INPUTS")
                        );
                        this.clearReportQuantityInputs();
                        return;
                    }
                    if (rw > 0) {
                        var plant = this.appData.plant;
                        var nodeID = this.appData.node.nodeID;
                        var batchControl = this.getView().byId("reportProductionQuantityTable").getModel().getData().productionData[1]?.batchNumber;
                        var rc1 = this.getView().byId("reportProductionQuantityTable").getModel().getData().productionData[1]?.reasonCodeData?.reasonCode1;
                        var rc2 = this.getView().byId("reportProductionQuantityTable").getModel().getData().productionData[1]?.reasonCodeData?.reasonCode2;
                        var rc3 = this.getView().byId("reportProductionQuantityTable").getModel().getData().productionData[1]?.reasonCodeData?.reasonCode3;
                        var rc4 = this.getView().byId("reportProductionQuantityTable").getModel().getData().productionData[1]?.reasonCodeData?.reasonCode4;
                        var rc5 = this.getView().byId("reportProductionQuantityTable").getModel().getData().productionData[1]?.reasonCodeData?.reasonCode5;

                        var responseRC = TransactionCaller.sync(
                            "MES/Itelli/DNA/ReportProduction/FosfatRC/getQMCatalogCodeTrns",
                            {
                                I_PLANT: plant,
                                I_NODE_ID: nodeID,
                                I_BATCH: batchControl,
                                I_RC1: rc1,
                                I_RC2: rc2,
                                I_RC3: rc3,
                                I_RC4: rc4,
                                I_RC5: rc5,
                            },
                            "O_JSON"
                        );
                        if (responseRC[1] == "E") {
                            MessageBox.error(responseRC[0]);
                            return;
                        } else {
                            reasonCode = responseRC[0];
                        }
                    }
                }
                if (objek == "3007FOSFAT") {

                    var paramsCNT2 = {
                        "Param.1": "FS_REP_QNT_TOP_LMT",
                    };
                    var tRunnerCNT2 = new TransactionRunner("MES/Itelli/DNA/AdminPanel/selectModelbyKeyQry", paramsCNT2);
                    if (!tRunnerCNT2.Execute()) {
                        MessageBox.error(tRunnerCNT2.GetErrorMessage());
                        return;
                    }
                    var oDataCNT2 = tRunnerCNT2.GetJSONData();
                    var value2 = Number(oDataCNT2[0].Row[0].VALUE) / 1000;

                    if (parseFloat(productionData[index].quantity) > value2) {
                        MessageBox.error("Belirlenen limitten ( " + value2 + " ton ) fazlasını giremezsiniz!");
                        return;
                    }

                    var DateTimePicker = this.getView().byId("DateTimePicker")?.getValue();

                    if (!!DateTimePicker) {

                        var paramsCNT2 = {
                            "Param.1": this.appData.client,
                            "Param.2": this.appData.plant,
                            "Param.3": this.appData.node.nodeID,

                        };
                        var tRunnerCNT2 = new TransactionRunner("MES/Itelli/PastActivity/getWorkplaceQry", paramsCNT2);
                        if (!tRunnerCNT2.Execute()) {
                            MessageBox.error(tRunnerCNT2.GetErrorMessage());
                            return;
                        }
                        var oDataCNT99 = tRunnerCNT2.GetJSONData();

                        var responseCNT99 = TransactionCaller.sync(
                            "MES/Itelli/PastActivity/T_GetFilterModel",
                            {
                                I_CLIENT: this.appData.client,
                                I_PLANT: this.appData.plant,
                                I_WORKPLACE: oDataCNT99[0].Row[0].NAME,
                                I_DATE: moment(DateTimePicker).format("DD-MM-YYYY"),    // seçili teyitin tarihi
                                I_TEYIT_CONDITION: "X",

                            },
                            "O_JSON"
                        );
                        if (responseCNT99[1] == "E") {
                            MessageBox.error("Gün kapatılmıştır geriye dönük teyit verilemez.");
                            return;
                        }


                        var response = TransactionCaller.sync(
                            "MES/UI/ReportQuantity/PastConfirmation/T_Get_Runid",
                            {
                                I_CLIENT: this.appData.client,
                                I_PLANT: this.appData.plant,
                                I_NODEID: this.appData.node.nodeID,
                                I_AUFNR: this.appData.selected.order.orderNo,
                                I_TIME: moment(DateTimePicker).valueOf() / 1000,
                            },
                            "O_JSON"
                        );

                        if (response[1] == "E") {
                            MessageBox.error(response[0]);

                            return;
                        }
                        else {
                            this.pastRunId = response[0].Rowsets?.Rowset?.Row?.RUN_ID;
                        }

                    }

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
                    // Bileşen tayin yapılmadan üretim bildir yapılması durumu
                    if (!!!jsData[0]?.Row) {
                        MessageBox.error("İlgili partiye bileşen tayini yapılmamış");
                        this.clearReportQuantityInputs();
                        return;
                    }
                    // Fosfatlama
                    // Tonaj kontrolü
                    // Katsayı : 0.10
                    var inputQuantity = parseFloat(productionData[index].quantity);
                    var quantityReported = parseFloat(
                        this.appData.selected.quantityReported
                    );
                    var quantityReleased = parseFloat(
                        this.appData.selected.quantityReleased
                    );

                    var paramsCNT = {
                        "Param.1": "FS_PLN_LMT",
                    };
                    var tRunnerCNT = new TransactionRunner("MES/Itelli/DNA/AdminPanel/selectModelbyKeyQry", paramsCNT);
                    if (!tRunnerCNT.Execute()) {
                        MessageBox.error(tRunnerCNT.GetErrorMessage());
                        return;
                    }
                    var oDataCNT = tRunnerCNT.GetJSONData();
                    var value = Number(oDataCNT[0].Row[0].VALUE);


                    if (
                        !(
                            quantityReported + inputQuantity <=
                            quantityReleased + quantityReleased * (value / 100)
                        )
                    ) {
                        MessageBox.error(
                            "Girilen tonaj değeri toplam planlanan miktarı geçemez"
                        );
                        this.clearReportQuantityInputs();
                        return;
                    }
                    this.screenObj.inputChar.push({
                        CHAR_NAME: "Y_DOKUMNO",
                        CHAR_VALUE: jsData[0].Row[0].ATWRT,
                    });

                    if (rw > 0) {
                        this.screenObj.inputChar.push({
                            CHAR_NAME: "Y_HATAKODU",
                            CHAR_VALUE: reasonCode,
                        });
                    }

                    this.insertConsumptionFosfat();
                } else if (objek == "3007SCTEL1" || objek == "3007SCTEL2") {

                    var goodQuantityBatch = this.getView().byId("reportProductionQuantityTable").mAggregations.items[0].mAggregations.cells[3].getValue();

                    if (goodQuantityBatch != "") {
                        var measuredDiameter = this.getView().byId("reportProductionQuantityTable").mAggregations.items[0].mAggregations.cells[4].getValue();

                        if (measuredDiameter == "") {
                            MessageBox.show("Parti okutmadan önce ölçülen çap girilmeli");
                            return;
                        } else if (!measuredDiameter.includes(".")) {
                            MessageBox.show("Ölçülen Çap değeri için basamak '.'(nokta) ile ayrılmalıdır");
                            return;
                        } else {

                            var aufnrM = this.appData.selected.order.orderNo;
                            var aprioM = this.appData.selected.operationNo;
                            var userIDM = this.appData.user.userID;

                            var response = TransactionCaller.sync(
                                "MES/Itelli/DNA/MeasuredDiameter/T_MEASURED_DIAMETER",
                                {
                                    I_AUFNR: aufnrM,
                                    I_APRIO: aprioM,
                                    I_BATCH: goodQuantityBatch,
                                    I_DIAMETER: measuredDiameter,
                                    I_USER: userIDM,
                                },
                                "O_JSON"
                            );
                            if (response[1] == "E") {
                                MessageBox.error(response[0]);
                                return;
                            }
                        }
                    }
                    var oView = this.getView();
                    var oDialog = oView.byId("getConfirmInformation");
                    var castComboBox = oView.byId("castID");
                    var deleteButon = oView.byId("deleteButton");
                    var saveButton = oView.byId("saveButton");
                    if (castComboBox != undefined) {
                        castComboBox.destroy();
                    }
                    if (deleteButon != undefined) {
                        deleteButon.destroy();
                    }
                    if (saveButton != undefined) {
                        saveButton.destroy();
                    }
                    if (!!oDialog) {
                        oDialog.destroy();
                        oDialog = null;
                    }
                    if (!!!oDialog) {
                        oDialog = sap.ui.xmlfragment(
                            oView.getId(),
                            "customActivity.fragmentView.getConfirmInformation",
                            this
                        );
                    }
                    if (!!oDialog) {
                        oView.addDependent(oDialog);
                        this.appData.oDialog = oDialog;
                    }
                    isSaveRecords = true;
                    oDialog.open();
                    this.getConfirmInformation();
                } else if (objek == "3007DUMMY_MC") {
                    var oView = this.getView();
                    var oDialog = oView.byId("openComponentsListDNA");
                    var confirmTable = oView.byId("confirmTable");
                    if (confirmTable != undefined) {
                        confirmTable.destroy();
                    }
                    var inputKgValue = oView.byId("inputKgValue");
                    if (inputKgValue != undefined) {
                        inputKgValue.destroy();
                    }
                    if (!!oDialog) {
                        oDialog.destroy();
                        oDialog = null;
                    }
                    if (!!!oDialog) {
                        oDialog = sap.ui.xmlfragment(
                            oView.getId(),
                            "customActivity.fragmentView.openComponentsListORME",
                            this
                        );
                    }
                    if (!!oDialog) {
                        oView.addDependent(oDialog);
                        this.appData.oDialog = oDialog;
                    }
                    isSaveRecordsComponent = true;
                    oDialog.open();
                    this.getConfirmComponentList();
                } else if (objek == "3007PCSTRAND" || objek == "3007PCWIRE") {
                    var oView = this.getView();
                    var oDialog = oView.byId("pcStrandDialog");
                    if (!!oDialog) {
                        oDialog.destroy();
                        oDialog = null;
                    }
                    if (!!!oDialog) {
                        oDialog = sap.ui.xmlfragment(
                            oView.getId(),
                            "customActivity.fragmentView.pcWireDialog",
                            this
                        );
                    }
                    if (!!oDialog) {
                        oView.addDependent(oDialog);
                        this.appData.oDialog = oDialog;
                    }
                    isSavePcStrand = true;
                    oDialog.open();
                    this.getPCStrandQry();
                } else this.onClickSaveReportedQuantity(movetype);

            },
            callPcStrandQry: function (p_data, p_this) {
                var tableCharRows = p_this.getCharacteristic();
                var oModel = new sap.ui.model.json.JSONModel();
                var oData = p_data[0].Rowsets.Rowset.Row;
                oData = Array.isArray(oData) ? oData : new Array(oData);
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
                TransactionCaller.async(
                    "MES/UI/ReportQuantity/getPcStrandTrns",
                    {
                        I_AUFNR: aufnr,
                        I_WORKCENTER: workcenterID,
                    },
                    "O_JSON",
                    this.callPcStrandQry,
                    this,
                    "GET"
                );
            },
            callConfirmComponentList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                var tableCharacteristic = p_this.getCharacteristic();
                var rows = p_data.Rowsets.Rowset[0].Row;
                if (!Array.isArray(rows)) {
                    var dummyArr = [];
                    dummyArr.push(rows);
                    rows = [];
                    rows.push(dummyArr);
                }

                if (rows.length == 1 && (Array.isArray(rows[0]))) {
                    rows = [];
                }
                // Örme kısmen/tamamen tüketim
                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/ReportProduction/T_REMAINING_DATA_MODEL",
                    {
                        I_AUFNR: p_this.appData.selected.order.orderNo,
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                rows.forEach((item) => {
                    item.T_METERAGE = item.METERAGE;
                });
                var appendRows = Array.isArray(response[0].Rowsets?.Rowset?.Row)
                    ? response[0].Rowsets?.Rowset?.Row
                    : new Array(response[0].Rowsets?.Rowset?.Row);
                if (!!appendRows && appendRows.length > 0 && !!appendRows[0]) {
                    appendRows.forEach((item) => {
                        item.QUANTITY = (
                            ((Math.pow(item.Y_TEL_CAP_MM_SC, 2) / 100 / 4) *
                                3.14159 *
                                7.85 *
                                (item.METERAGE * 100)) /
                            1000 /
                            1000
                        ).toFixed(3);
                        item.T_METERAGE = item.METERAGE;
                        rows.push(item);
                    });
                }
                if (!!!rows) {
                    p_this.getView().byId("deleteComponent").setEnabled(false);
                    return;
                }
                var merkezCount = 0;
                var cevreCount = 0;
                for (var i = 0; i < rows.length; i++) {
                    for (var k = 0; k < tableCharacteristic.length; k++) {
                        if (rows[i].BARCODE == tableCharacteristic[k].BARCODE) {
                            rows[i][tableCharacteristic[k].ATNAM] =
                                tableCharacteristic[k].ATWRT;
                        }
                    }
                    if (rows[i].Y_MERKEZ_CEVRE == "MERKEZ") {
                        rows[i].COLOR = "Emphasized";
                        merkezCount++;
                    } else if (rows[i].Y_MERKEZ_CEVRE == "ÇEVRE") {
                        cevreCount++;
                    }
                    if (!!rows[i]?.QUANTITY)
                        rows[i].QUANTITY = rows[i].QUANTITY?.toString();
                    if (!!rows[i]?.METERAGE)
                        rows[i].METERAGE = rows[i].METERAGE?.toString();
                }
                if (!(merkezCount >= 1)) {
                    p_this.getView().byId("deleteComponent").setEnabled(false);
                    MessageBox.error("Merkez sayısı en az 1 olmalıdır");
                } else if (!(cevreCount >= 6)) {
                    p_this.getView().byId("deleteComponent").setEnabled(false);
                    MessageBox.error("Çevre sayısı en az 6 olmalıdır");
                }
                oModel.setData(rows);
                p_this.getView().byId("confirmTable").setModel(oModel);
            },
            getConfirmComponentList: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var objek = this.appData.characteristic[0].Row[0].OBJEK;
                var params = {
                    "Param.1": aufnr,
                    "Param.2": workcenterID,
                };
                if (objek == "3007DUMMY_MC") {
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getConfirmComponentListORMEQry",
                        params
                    );

                } else {
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getConfirmComponentListQry",
                        params
                    );
                }
                tRunner.ExecuteQueryAsync(this, this.callConfirmComponentList);
            },
            onChangeMeterageInput: function (oEvent) {
                this.getView().byId("inputConversion").setValue("");
                var meterage = oEvent.getSource().getValue();
                if (!!!meterage) {
                    return;
                }
                var cap = oEvent.getSource().oParent.mAggregations.cells[1].mProperties
                    .text;
                cap = parseFloat(cap);
                var quantity = (
                    ((Math.pow(cap, 2) / 100 / 4) * 3.14159 * 7.85 * (meterage * 100)) /
                    1000 /
                    1000
                ).toFixed(3);
                oEvent.getSource().oParent.mAggregations.cells[4].mProperties.text = quantity.toString();
                var sId = oEvent.getSource().sId;
                var index = sId.substr(sId.lastIndexOf("-") + 1, sId.length);
                var changedRows = this.byId("confirmTable").getModel().getData();
                changedRows[index].QUANTITY = quantity.toString();
                changedRows[index].METERAGE = meterage.toString();
                if (parseFloat(meterage) > parseFloat(changedRows[index].T_METERAGE)) {
                    oEvent.getSource().mProperties.value = ""
                    changedRows[index].METERAGE = "";
                    changedRows[index].QUANTITY = 0
                    MessageBox.error("Girilen metraj toplam metrajdan büyük olamaz");
                }
                var model = new sap.ui.model.json.JSONModel();
                model.setData(changedRows);
                this.byId("confirmTable").setModel(model);
            },
            callComponentDetails: function (p_this, p_data) {
                var tableCharRows = p_this.getCharacteristic();
                var rows = p_data.Rowsets.Rowset[0].Row;
                if (!!rows && rows?.length > 0) {
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
                    if (!!p_this.appData.allCharacteristic?.Y_TEL_CAP_MM_SC?.VALUE) {
                        var saglamMiktar = p_this.getView().byId("reportProductionQuantityTable").mAggregations.items[0].mAggregations.cells[1].mProperties.value
                        var cap = p_this.appData.allCharacteristic.Y_TEL_CAP_MM_SC.VALUE
                        cap = parseFloat(cap);
                        var toplamMiktar = (((Math.pow(cap, 2) / 100 / 4) *
                            3.14159 *
                            7.85 *
                            (saglamMiktar * 100)) /
                            1000 /
                            1000
                        ).toFixed(3);
                        p_this.getView().byId("idTamamenSum").setText("Güncel Miktar : 0");
                        p_this.getView().byId("idTamamenSum").setVisible(true);
                        p_this.getView().byId("idRemaining").setText(`Fark : ${toplamMiktar}`);

                        toplamMiktar = `Toplam Miktar : ${toplamMiktar}`;
                        p_this.getView().byId("idToplamMiktar").setText(toplamMiktar);
                        p_this.getView().byId("idToplamMiktar").setVisible(true);
                        p_this.getView().byId("idRemaining").setVisible(true);
                        p_this.getView().byId("idHeader").setVisible(true);
                    }

                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(p_data.Rowsets.Rowset[0].Row);
                    p_this.getView().byId("confirmTable").setModel(oModel);
                }
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

                var DateTimePicker = this.getView().byId("DateTimePicker")?.getValue();

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

                    //İş yerleri için teyit birimi metrajdan tonaja çevrildi.
                    //quantityTon alanı Metraj değerini saklamak için kullanılacak.
                    if (this.appData.characteristic[0].Row[0].OBJEK == "3007SCTEL1" ||
                        this.appData.characteristic[0].Row[0].OBJEK == "3007SCTEL2" ||
                        this.appData.characteristic[0].Row[0].OBJEK == "3007DUMMY_MC" ||
                        this.appData.characteristic[0].Row[0].OBJEK == "3007PCSTRAND" ||
                        this.appData.characteristic[0].Row[0].OBJEK == "3007PCWIRE") {
                        var qty_mtr = goodAndRejectedDataCollection[0].quantity;
                        var qty_ton = this.screenAllValue[0].quantityTon;

                        goodAndRejectedDataCollection[0].uom = "TO";
                        goodAndRejectedDataCollection[0].quantity = qty_ton;
                        goodAndRejectedDataCollection[0].quantityTon = qty_mtr;
                    }

                    // isOldRecord  
                    if (!!DateTimePicker) {
                        // moment("11-14-2021 11:23:50").valueOf()     // Gives Timestamp
                        goodAndRejectedDataCollection[0].startTimestamp = moment(DateTimePicker).valueOf(); // Gives Timestamp
                        goodAndRejectedDataCollection[0].endTimestamp = moment(DateTimePicker).valueOf();
                        goodAndRejectedDataCollection[0].startDateOLD = DateTimePicker;
                        goodAndRejectedDataCollection[0].endDateOLD = DateTimePicker;
                        goodAndRejectedDataCollection[0].isOldRecord = "X";
                        goodAndRejectedDataCollection[0].runID = this.pastRunId;

                    }
                    else {
                        goodAndRejectedDataCollection[0].startTimestamp = new Date().getTime();
                        goodAndRejectedDataCollection[0].endTimestamp = new Date().getTime();
                    }


                    var params = {
                        inputXML: JSON.stringify(goodAndRejectedDataCollection[0]),
                        inputChar: JSON.stringify(this.screenObj.inputChar),
                    };
                    // MES/UI/ReportQuantity/reportConfirmation/reportConfirmationTrns
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/reportConfirmation/reportConfirmationXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        this.clearReportQuantityInputs();
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
                    this.clearReportQuantityInputs();
                    this.getKaynakMetraj();
                }
            },
            clearReportQuantityInputs: function () {
                var sIdArr = [];
                var table = this.getView().byId("reportProductionQuantityTable");
                if (!!!table) {
                    return;
                }
                var itemArr = table.getItems();
                if (itemArr.length > 0) {
                    itemArr?.forEach((item) => {
                        sIdArr.push(item.mAggregations?.cells[1].sId); // Miktar
                        sIdArr.push(item.mAggregations?.cells[3].sId); // Parti
                    });
                    sIdArr.forEach((id) => {
                        this.getView().byId(id).setValue(null);
                    });
                }
                this.setFocusToBatchQuantity();
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
                if (!Array.isArray(oData[0].Row)) {
                    var dummyArr = [];
                    dummyArr.push(oData[0].Row);
                    oData[0].Row = [];
                    oData[0].Row.push(dummyArr[0]);
                }
                if (objek == "3007DUMMY_MC") {
                    oData[0].Row.forEach((item) => {
                        var entryId = item.ENTRY_ID;
                        var params1 = {
                            "Param.1": entryId,
                        };
                        var tRunner1 = new TransactionRunner(
                            "MES/UI/ReportQuantity/getCastListForKnittingQry",
                            params1
                        );
                        if (!tRunner1.Execute()) {
                            MessageBox.error(tRunner1.GetErrorMessage());
                            return null;
                        }
                        var oCastData = tRunner1.GetJSONData();
                        if (!oCastData[0].Row) return;
                        if (!Array.isArray(oCastData[0].Row)) {
                            var dummyArr = [];
                            dummyArr.push(oCastData[0].Row);
                            oCastData[0].Row = [];
                            oCastData[0].Row.push(dummyArr[0]);
                        }
                        if (oCastData[0].Row.length == 1) {
                            item.CASTNO = oCastData[0].Row[0];
                        }
                        var castsArr = [];
                        oCastData[0].Row.sort((a, b) =>
                            a.CHAR_VALUE > b.CHAR_VALUE
                                ? 1
                                : b.CHAR_VALUE > a.CHAR_VALUE
                                    ? -1
                                    : 0
                        );

                        var currentCastNo = oCastData[0].Row[0].CHAR_VALUE;
                        var currentCount = 1;

                        for (let i = 1; i < oCastData[0].Row.length; i++) {
                            if (currentCastNo == oCastData[0].Row[i].CHAR_VALUE) {
                                currentCount++;
                            } else {
                                var castObj = { CASTNO: currentCastNo, COUNT: currentCount };
                                castsArr.push(castObj);
                                currentCastNo = oCastData[0].Row[i].CHAR_VALUE;
                                currentCount = 1;
                            }
                            if (oCastData[0].Row.length - 1 == i) {
                                var castObj = { CASTNO: currentCastNo, COUNT: currentCount };
                                castsArr.push(castObj);
                            }
                        }
                        castsArr.sort((a, b) =>
                            a.COUNT >= b.COUNT ? -1 : b.COUNT > a.COUNT ? 1 : 0
                        );
                        item.CASTNO = castsArr[0].CASTNO;
                    });
                }
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "batchList");
                if (!!this.appData.allCharacteristic)
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
                if (!!this.appData.allCharacteristic)
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
                var objek = this.appData.characteristic[0].Row[0].OBJEK;
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
                    if (objek == "3007DUMMY_MC" || objek == "3007PCSTRAND") {
                        this.handleAddConfirm();
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
                if (objek == "3007DUMMY_MC" || objek == "3007PCSTRAND") {
                    selectKey = "Sağlam Miktar";
                    type = "new";
                } else if (type == "new")
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
                var objek = this.appData.characteristic[0].Row[1].OBJEK;
                if (objek == "3007DUMMY_MC" || objek == "3007PCSTRAND") {
                    selectRow = 0; // Sağlam Miktar
                } else {
                    selectRow = this.getView().byId("selectType").getSelectedIndex();
                }

                var selectedTableRow = this.getView()
                    .byId("reportProductionQuantityTable")
                    .getModel().oData.productionData[selectRow];
                if (
                    selectedTableRow?.batchNumber != "" &&
                    selectedTableRow?.batchNumber != undefined
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
                if (selectRow == 0) {
                    if (objek == "3007DUMMY_MC") {
                        oModel_productionQuantityModel.oData.productionData[0].quantity = this.appData.allCharacteristic?.Y_MERKEZ_TEL_METRAJ?.VALUE;
                    } else if (objek != "3007PCSTRAND" && objek != "3007PCWIRE") {
                        oModel_productionQuantityModel.oData.productionData[0].quantity = this.appData.allCharacteristic?.Y_METRAJ?.VALUE;
                        if (
                            !!!oModel_productionQuantityModel.oData.productionData[0].quantity
                        ) {
                            oModel_productionQuantityModel.oData.productionData[0].quantity = this.appData.allCharacteristic?.Y_CEVRE_TEL_METRAJ?.VALUE;
                        }
                    }
                }

                this.byId("reportProductionQuantityTable").setModel(
                    oModel_productionQuantityModel
                );
                if (objek != "3007DUMMY_MC") this.handleCancel(oEvent);
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
                if (
                    this.appData.plant == "3007" &&
                    this.appData.node.description == "Fosfatlama"
                ) {
                    if (!inputValue.includes("|")) {
                        return;
                    }
                    let splittedArr = inputValue.split("|");
                    if (splittedArr[0].length == 4) {
                        // Yeni Etiket
                        inputValue = splittedArr[2];
                    } else {
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

                if (!p_data.Rowsets.Rowset[0].Row?.[0].QUANTITY) {
                    MessageBox.error("Mevcut siparişte bileşen kaydı bulunamadı");
                    p_this.reportedProductionData[selectRow].batchNumber = "";
                    return;
                }

                var meterage = p_data.Rowsets.Rowset[0].Row?.[0].QUANTITY;
                var oModel_productionQuantityModel = new sap.ui.model.json.JSONModel();
                oModel_productionQuantityModel.setData({
                    productionData: p_this.reportedProductionData,
                });
                oModel_productionQuantityModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                p_this.reportedProductionData[selectRow].quantity = meterage;
                p_this.byId("reportProductionQuantityTable").setModel(oModel_productionQuantityModel);
            },
            handleCancel: function (oEvent) {
                this.appData.oDialog.destroy();
                this.appData.oDialog = null;
            },
            onPressAddSource: function () {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_GENERIC_DNA";
                window.location.href = origin + pathname + navToPage;
            },
            onPressAddMeterage: function () {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_GENERIC_DNA";
                window.location.href = origin + pathname + navToPage;
            },
            getAllCharacteristic: function () {
                var allCharJSON = {};
                var workorder = this.appData.selected.order.orderNo;
                if (!workorder) return;
                var tRunner;
                var params;
                var path = "";
                var objek = this.appData.characteristic[0].Row[1].OBJEK;
                if (objek.includes("3007SCTEL")) {
                    path = "MES/Itelli/DNA/Characteristics/Q_GET_CHARACTERISTICS_FF";
                } else if (objek.includes("3007FOSFAT")) {
                    path = "MES/Itelli/DNA/Characteristics/Q_GET_CHARACTERISTICS_FF";
                } else if (
                    objek.includes("3007DUMMY_MC") ||
                    objek.includes("3007PCSTRAND")
                ) {
                    path = "MES/Itelli/DNA/Characteristics/Q_GET_CHARACTERISTICS_FF";
                }
                if (!!path) {
                    params = {
                        "Param.1": workorder,
                    };
                    tRunner = new TransactionRunner(path, params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                } else {
                    params = {
                        "Param.1": workorder,
                    };
                    tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getAufnrInformationQry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                }
                var oData = tRunner.GetJSONData();
                var jsData = oData[0].Row;

                if (!(!!jsData)) {
                    return;
                }
                var responseExtra;
                if (objek.includes("3007SCTEL")) {
                    responseExtra = TransactionCaller.sync("MES/Itelli/DNA/Characteristics/getExtraCharList/T_GET_SALES_CHAR_LIST", {
                        I_AUFNR: this.appData.selected.order.orderNo
                    },
                        "O_JSON"
                    );
                    if (responseExtra[1] == "E") {
                        MessageBox.show(response[0]);
                        return;
                    }
                    var oldJsData = JSON.parse(JSON.stringify(jsData));
                    jsData = [];
                    var responseArr = Array.isArray(responseExtra[0].Rowsets.Rowset.Row) ? responseExtra[0].Rowsets.Rowset.Row : new Array(responseExtra[0].Rowsets.Rowset.Row);
                    jsData = [...oldJsData, ...responseArr];
                }

                if (jsData == undefined) return;
                for (i = 0; i < jsData.length; i++) {
                    if (!!jsData[i]) {
                        allCharJSON[jsData[i].CHARCODE] = {};
                        var value = jsData[i].CHARVALUE;
                        if (!!value)
                            value = value.toString().replaceAll(",", ".");
                        if (!!value && !isNaN(parseFloat(value))) {
                            var dotIndex = (value + "").indexOf(".");
                            if (!!dotIndex && dotIndex >= 0) {
                                var isFullZero = true;
                                for (let i = dotIndex + 1; i < value.length; i++) {
                                    if (value.charAt(i) != "0") {
                                        isFullZero = false;
                                    }
                                }
                                if (isFullZero) {
                                    value = value.substr(0, dotIndex);
                                }
                            }
                        }
                        allCharJSON[jsData[i].CHARCODE].VALUE = value;
                        allCharJSON[jsData[i].CHARCODE].DESC = jsData[i].CHARDESC;
                    }
                }

                this.appData.allCharacteristic = allCharJSON;
                var atnam = "ZMII_TEYIT_KARAKTERISTIK";
                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/Characteristics/getObjekChars/T_GET_CHAR_LIST",
                    {
                        I_ATNAM: atnam,
                        I_OBJEK: this.appData.characteristic[0].Row[1].OBJEK,
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.show(response[0]);
                    return;
                }
                var responseArr = response[0].Rowsets?.Rowset?.Row;
                if (!(!!responseArr && responseArr.length > 0)) {
                    return;
                }
                var result1Arr = [];
                var result2Arr = [];
                var resultArr = [];

                resultArr = responseArr.filter(
                    (item) => !screenComponents.includes(item.ATWRT)
                );
                /*
                if (resultArr.length <= 10)
                    this.byId(
                        sap.ui.core.Fragment.createId(
                            "orderCardFragment",
                            "idCharacteristicTable2"
                        )
                    ).setVisible(false);
                */
                var totalCount = resultArr.length;
                var eachTable = parseInt(totalCount / 2);
                if (eachTable < parseFloat(totalCount / 2)) {
                    eachTable++;
                }
                if (this.appData.characteristic[0].Row[0].OBJEK.includes("3007SCTEL") && !!this.appData.allCharacteristic?.Y_FLM_DEGISIM) {
                    this.appData.allCharacteristic.Y_FLM_DEGISIM.DESC = "Filmaşin Kalite Değişikliği";
                }
                resultArr.forEach((item, index) => {
                    var chars = item.ATWRT;
                    var value = this.appData.allCharacteristic[chars]?.VALUE || "";
                    var desc = this.appData.allCharacteristic[chars]?.DESC || chars;
                    var obj = { CHARS: chars, VALUE: value, DESC: desc };
                    index < eachTable ? result1Arr.push(obj) : result2Arr.push(obj);
                });

                this.byId(
                    sap.ui.core.Fragment.createId(
                        "orderCardFragment",
                        "idCharacteristicTable1"
                    )
                ).setVisibleRowCount(eachTable);

                this.byId(
                    sap.ui.core.Fragment.createId(
                        "orderCardFragment",
                        "idCharacteristicTable2"
                    )
                ).setVisibleRowCount(eachTable);

                var table1Model = new sap.ui.model.json.JSONModel();
                var table2Model = new sap.ui.model.json.JSONModel();
                table1Model.setData(result1Arr);
                table2Model.setData(result2Arr);
                this.byId(
                    sap.ui.core.Fragment.createId(
                        "orderCardFragment",
                        "idCharacteristicTable1"
                    )
                ).setModel(table1Model);
                this.byId(
                    sap.ui.core.Fragment.createId(
                        "orderCardFragment",
                        "idCharacteristicTable2"
                    )
                ).setModel(table2Model);

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
                if (this.getView().byId("weldTable") != undefined)
                    this.getView.byId("weldTable").destroy();
                if (oDialog != undefined) {
                    oDialog.destroy();
                    oDialog = null;
                }
                if (!!!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.getComponentWeldsInfoDNA",
                        this
                    );
                    oView.addDependent(oDialog);
                    this.appData.oDialogWeld = oDialog;
                }
                oDialog.open();
            },
            callWeldDetails: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                if (!isWeldList) {
                    if (!!p_this.oComponentWeldDialog) {
                        p_this.oComponentWeldDialog.destroy();
                        p_this.oComponentWeldDialog = null;
                    }

                    if (!!!p_this.oComponentWeldDialog) {
                        p_this.oComponentWeldDialog = sap.ui.xmlfragment(
                            "getComponentWeldsInfo",
                            "customActivity.fragmentView.getComponentWeldsInfoDNA",
                            this
                        );
                        p_this.getView().addDependent(p_this.oComponentWeldDialog);
                    }
                    p_this.oComponentWeldDialog.open();
                    sap.ui.core.Fragment.byId(
                        "getComponentWeldsInfo",
                        "weldTable"
                    ).setModel(oModel);
                }
            },
            onPressCloseComponentsWelds: function (oEvent) {
                console.log("clicked");
                this.oComponentWeldDialog.close();
            },
            getWeldDetails: function (batchNo) {
                isWeldList = true;
                if (!!!batchNo?.length) {
                    isWeldList = false;
                    batchNo =
                        batchNo.oSource.oParent.mAggregations.cells[0].mProperties.text;
                }
                var aufnr = this.appData.selected.order.orderNo;
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var nodeid = this.appData.node.nodeID;
                // var oSource = oEvent.getSource();
                // var barcode = oSource.getParent().getCells()[0].getText();
                var params = {
                    "Param.1": batchNo,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/getWeldDetailsQry",
                    params
                );

                tRunner.ExecuteQueryAsync(this, this.callWeldDetails);

                if (isWeldList) {
                    sap.ui.core.Fragment.byId("weldList", "weldTable").setModel(
                        fragModel
                    );
                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/ReportProduction/getBatchKaynakMetraj",
                        {
                            I_BATCH: batchNo,
                            I_NODEID: nodeid,
                        },
                        "O_JSON"
                    );
                    response[0].Rowsets.Rowset.Row = Array.isArray(
                        response[0].Rowsets?.Rowset.Row
                    )
                        ? response[0].Rowsets.Rowset.Row
                        : new Array(response[0].Rowsets.Rowset.Row);
                    var fragModel = new sap.ui.model.json.JSONModel();

                    fragModel.setData(response[0]?.Rowsets?.Rowset?.Row);
                    sap.ui.core.Fragment.byId("weldList", "weldTable").setModel(
                        fragModel
                    );
                }
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
                // var oView = this.getView();
                // var oDialog = oView.byId("weldList");
                // // create dialog lazily
                // // create dialog via fragment factory
                // if (oDialog != undefined) oDialog.destroy();
                // oDialog = sap.ui.xmlfragment(
                //     oView.getId(),
                //     "customActivity.fragmentView.weldList",
                //     this
                // );
                // oView.addDependent(oDialog);
                // this.appData.oDialog = oDialog;
                // oDialog.open();
                if (!this._oDialogWeldlist) {
                    this._oDialogWeldlist = sap.ui.xmlfragment(
                        "weldList",
                        "customActivity.fragmentView.weldList",
                        this
                    );
                    this.getView().addDependent(this._oDialogWeldlist);
                }
                this._oDialogWeldlist.open();
                this.getWeldDetails(batchNo);
            },
            onCancelFrag: function () {
                this._oDialogWeldlist.close();
            },
            onSaveRecords: function (oEvent) {
                if (isSaveRecords) {
                    isSaveRecords = false;
                    if (!(!!this.appData.allCharacteristic?.Y_TEL_CAP_MM_SC?.VALUE)) {
                        MessageBox.error("Bu siparişte Y_TEL_CAP_MM_SC karakteristiği gelmemiştir");
                        isSaveRecords = true;
                        return;
                    }
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

                    var objek = this.appData.characteristic[0].Row[0].OBJEK;

                    if (objek == "3007SCTEL1" || objek == "3007SCTEL2") {
                        if (!!this.byId("reportProductionQuantityTable")) {
                            var oldBatch = "";
                            var tableRows = this.byId("reportProductionQuantityTable")
                                .mAggregations.items;
                            if (!!tableRows && tableRows?.length > 0) {
                                tableRows.forEach((item) => {
                                    if (
                                        item.mAggregations.cells[0].mProperties.text.includes(
                                            "Sağlam"
                                        )
                                    ) {
                                        oldBatch = this.byId("reportProductionQuantityTable")
                                            .mAggregations.items[0].mAggregations.cells[3].mProperties
                                            .value;
                                    }
                                });
                                var ekBatch = oldBatch;
                                var ekBobinSira = this._oSelectedSıraNo;
                                if (!!ekBatch && !!ekBobinSira) {
                                    var response = TransactionCaller.sync(
                                        "MES/Itelli/DNA/OldRowNumber/updateRowNumberTrns",
                                        {
                                            I_BATCHNO: ekBatch,
                                            I_OLDROWNUMBER: ekBobinSira,
                                        },
                                        "O_JSON"
                                    );

                                    if (response[1] == "E") {
                                        MessageBox.error(response[0]);
                                        isSaveRecords = true;
                                        return;
                                    }
                                    this.onPressClearSelectedBatchNumber();
                                }
                            }
                        }
                    }

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
                            isSaveRecords = true;
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
                            isSaveRecords = true;
                            return null;
                        }
                        var jsData = tRunner.GetJSONData();
                        quantity = jsData[0].Row[0].QUANTITY;
                        this.screenAllValue[0].quantityTon = quantity;
                    } else {
                        movetype = 101;
                        material = matnr;
                        var cap = this.appData.allCharacteristic?.Y_TEL_CAP_MM_SC?.VALUE;
                        var tonnage = (((Math.pow(cap, 2) / 100 / 4) * 3.14159 * 7.85 * (sumQuantity * 100)) /
                            1000 /
                            1000
                        ).toFixed(3);
                        /*
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
                            isSaveRecords = true;
                            return null;
                        }
                        var jsData = tRunner.GetJSONData();
                        quantity = jsData[0].Row[0].QUANTITYTONNAGE;
                        */
                        quantity = tonnage;
                        this.screenAllValue[0].quantityTon = tonnage;
                    }
                    var sumConsumptionQuantity = 0;
                    oData.forEach(function (item, index) {
                        if (item.CHOSENROW == "X") sumConsumptionQuantity += item.QUANTITY;
                    }, this);
                    if (quantity > sumConsumptionQuantity) {
                        message = "Tüketim miktarı üretim miktarından az olamaz!";
                        errorStatus = true;
                    }
                    if (errorStatus) {
                        MessageBox.error(message);
                        isSaveRecords = true;
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
                            isSaveRecords = true;
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
                            isSaveRecords = true;
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
                    //Max 2 tamamen
                    var tamamenCount = 0;
                    tableArr.forEach((item) => {
                        if (oData[item].CONSUMPTIONTYPE == "30") {
                            tamamenCount++;
                        }
                    });
                    if (tamamenCount > 2) {
                        MessageBox.error("En fazla 2 tamamen tüketimi yapılabilir");
                        return;
                    }
                    tableArr.forEach(function (item, index) {
                        if (Number(oData[item].QUANTITY) < quantity) {
                            quantity = Number((quantity - oData[item].QUANTITY).toFixed(3));
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
                                isSaveRecords = true;
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
                            isSaveRecords = true;
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
                    isSaveRecords = true;
                }
            },
            consumptionType: function (oEvent) {
                var oTable = this.getView().byId("confirmTable");
                var sId = oEvent.getSource().oParent.mAggregations.cells[1].sId;
                var rowIndex = sId.substr(sId.lastIndexOf("-") + 1, sId.length - 1);
                var oData = oTable.getModel().oData;
                oData[rowIndex].CONSUMPTIONTYPE = oEvent.getSource().getSelectedKey();
                oData[rowIndex].CHOSENROW = "X";
                var changedIndex = rowIndex;
                if (oData[rowIndex].CONSUMPTIONTYPE == "20") {
                    oData.forEach((item, index) => {
                        if (item.CONSUMPTIONTYPE == "20" && index != changedIndex) {
                            item.CONSUMPTIONTYPE = "10";
                            item.CHOSENROW = null;
                            var combosId = this.getView().byId("confirmTable").mAggregations.items[index].mAggregations.cells[1].sId;
                            this.getView().byId(combosId).setSelectedKey(null);
                        }
                    });
                }
                if (oData[rowIndex].CONSUMPTIONTYPE == "30") {
                    var selectedBeforeCount = 0;
                    oData.forEach((item, index) => {
                        if (item.CONSUMPTIONTYPE == "30" && index != changedIndex) {
                            selectedBeforeCount++;
                        }
                    });
                    if (selectedBeforeCount == 2) {
                        oData[changedIndex].CONSUMPTIONTYPE = "10";
                        oData[changedIndex].CHOSENROW = null;
                        var combosId = this.getView().byId("confirmTable").mAggregations.items[changedIndex].mAggregations.cells[1].sId;
                        this.getView().byId(combosId).setSelectedKey(null);
                        MessageBox.error("En fazla 2 parti tamamen tüketilebilir");
                        return;
                    }
                }
                this.calculateHeaderLabels(oData);

            },
            calculateHeaderLabels: function (oData) {
                if (this.getView().byId("idTamamenSum").getVisible()) {
                    var tamamenToplam = 0;
                    oData.forEach((item) => {
                        if (item.CONSUMPTIONTYPE == "30") {
                            tamamenToplam += parseFloat(item.QUANTITY);
                        }
                    });
                    var toplamSplit = this.getView().byId("idToplamMiktar").getText().split(" ");
                    var toplamMiktar = toplamSplit[toplamSplit.length - 1];
                    var fark = (parseFloat(toplamMiktar) - parseFloat(tamamenToplam)).toFixed(3);
                    this.getView().byId("idTamamenSum").setText(`Güncel Miktar : ${tamamenToplam.toFixed(3)}`);
                    this.getView().byId("idRemaining").setText(`Fark : ${fark}`);
                }
            },
            onDeleteCombo: function (oEvent) {
                var oData = this.getView().byId("confirmTable").getModel().getData();
                var combosId = oEvent.getSource().oParent.mAggregations.cells[1].sId;
                var rowIndex = combosId.substr(
                    combosId.lastIndexOf("-") + 1,
                    combosId.length - 1
                );
                oData[rowIndex].CHOSENROW = null;
                oData[rowIndex].CONSUMPTIONTYPE = "10";
                this.getView().byId(combosId).setSelectedKey(null);
                this.calculateHeaderLabels(oData);

            },
            onConfirmTableSelectedChanged: function (oEvent) {
                this.getView().byId("inputConversion").setValue("");
            },
            onSaveRecordsComponent: function (oEvent) {
                var value = this.getView().byId("inputConversion").getValue();

                if (!value) {
                    MessageBox.error("Hesaplama Alanı Boş Bırakılamaz")
                    return;

                }
                var selectedIndexes = this.getView().byId("confirmTable").getSelectedContextPaths();
                var modelArr = this.getView().byId("confirmTable").getModel().getData();

                if (!(!!modelArr && modelArr.length > 0)) {
                    MessageBox.error("Tabloda veri yok");
                    return;
                }

                if (!(!!selectedIndexes && selectedIndexes.length > 0)) {
                    MessageBox.error("Tablodan seçim yapınız");
                    return;
                }

                var selectedItems = [];

                selectedIndexes = selectedIndexes.map((item) => item.split("/")[1]);

                selectedIndexes.forEach((i) => {
                    selectedItems.push(modelArr[i]);
                });

                var merkezCount = 0;
                var cevreCount = 0;
                selectedItems.forEach((item) => {
                    item?.Y_MERKEZ_CEVRE == "MERKEZ" ? merkezCount++ : cevreCount++;
                });

                if (!(merkezCount >= 1) || !(cevreCount >= 6)) {
                    MessageBox.error("Seçilen satırlarda en az 1 merkez 6 çevre bulunmalıdır");
                    return;
                }
                if (isSaveRecordsComponent) {
                    isSaveRecordsComponent = false;
                    if (this.appData.node.description == "Örme") {
                        var aufnr = this.appData.selected.order;
                        var tableModel = this.getView()
                            .byId("reportProductionQuantityTable")
                            .getModel()
                            .getData();
                        var sIdBatch = this.byId("reportProductionQuantityTable")
                            .mAggregations.items[0].mAggregations.cells[3].sId;
                        var batchValue = this.byId(sIdBatch).getValue();
                        var quantity = tableModel.productionData[0].quantity;

                        this.screenObj.inputChar.push({
                            CHAR_NAME: "Y_METRAJ",
                            CHAR_VALUE: quantity,
                        });

                        var totalValue = this.getView().byId("inputConversion").getValue();
                        var ratio = (totalValue / quantity) * 1000 + 0.001;
                        ratio = ratio.toString();
                        ratio = ratio.substring(0, 5);
                        ratio = parseFloat(ratio);
                        var requestData = { DATA: selectedItems };
                        var response = TransactionCaller.sync(
                            "MES/Itelli/DNA/ReportProduction/T_INSERT_DNA_CONS",
                            {
                                I_AUFNR: this.appData.selected.order.orderNo,
                                I_DATA: JSON.stringify(requestData),
                                I_YKGM: ratio,
                                I_PRODBATCH: batchValue
                            },
                            "O_JSON"
                        );
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
                    var oData = selectedItems

                    // var inputKgValue = this.getView().byId("inputKgValue").getValue();
                    var tableModel = this.getView()
                        .byId("reportProductionQuantityTable")
                        .getModel()
                        .getData();
                    var quantity = tableModel.productionData[0].quantity;
                    var totalValue = this.getView().byId("inputConversion").getValue();
                    var ratio = (totalValue / quantity) * 1000 + 0.001;
                    ratio = ratio.toString();
                    ratio = ratio.substring(0, 5);
                    ratio = parseFloat(ratio);

                    var inputConversion = this.getView()
                        .byId("inputConversion")
                        .getValue();
                    var inputKgValue = ratio;

                    // if (!!inputKgValue) {
                    //     inputKgValue = inputKgValue.replaceAll(",", ".");
                    // } else {
                    //     MessageBox.error("Hesaplama alanı boş bırakılamaz");
                    //     return;
                    // }

                    // if (
                    //     !!!inputKgValue ||
                    //     !!!inputConversion ||
                    //     inputKgValue == 0 ||
                    //     inputConversion == 0
                    // ) {
                    //     MessageBox.error("Hesaplama alanı boş veya formatı yanlış");
                    //     return;
                    // }

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
                        isSaveRecordsComponent = true;
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
                        isSaveRecordsComponent = true;
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
                        isSaveRecordsComponent = true;
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
                            isSaveRecordsComponent = true;
                            return null;
                        }
                    }
                    this.onClickSaveReportedQuantity(movetype, material);
                }
            },
            callCheckBox: function (oEvent) {
                var oTable = this.getView().byId("pcStrandDialogTable");
                var processRow = oTable.aDelegates[0].oDelegate.iFocusedIndex - 1;
                if (oTable.getModel().oData[processRow].checkBox)
                    oTable.getModel().oData[processRow].checkBox = false;
                else oTable.getModel().oData[processRow].checkBox = true;
            },
            onSavePcStrand: function (oEvent) {

                var objek = this.appData.characteristic[0].Row[0].OBJEK;
                var workCenter = this.appData.node.workcenterID
                var batchInput = this.byId("reportProductionQuantityTable")
                    .mAggregations.items[0].mAggregations.cells[3].sId;
                var selectedContextPath = this.getView()
                    .byId("pcStrandDialogTable")
                    .getSelectedContextPaths("rows")[0];

                var selectedLine = this.getView()
                    .byId("pcStrandDialogTable")
                    .getModel()
                    .getObject(selectedContextPath);
                if (objek == "3007PCSTRAND") {

                    var orderNo = this.appData.selected.order.orderNo;

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/BabyCoilRowNumber/T_UPDATE_ROW_NUMBER_PCS",
                        {
                            I_AUFNR: orderNo,
                            I_CONSUMED_BATCH: selectedLine.BARCODE,
                            I_NEW_BATCH: this.byId(batchInput).getValue(),
                            I_WORKCENTER_ID: workCenter

                        },
                        "O_JSON"
                    );
                }
                if (isSavePcStrand) {
                    isSavePcStrand = false;

                    var oTable = this.getView().byId("pcStrandDialogTable");
                    if (oTable.getSelectedItems().length == 0) {
                        sap.m.MessageToast.show(
                            this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("OEE_LABEL_PLEASECHOOSE")
                        );
                        isSavePcStrand = true;
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
                    if (!!!idWeight.getValue() || idWeight.getValue() == "0") {
                        sap.m.MessageToast.show(
                            this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("OEE_LABEL_SAVE_CONTROLE")
                        );
                        isSavePcStrand = true;
                        return;
                    }

                    var selectedWeight = this.getView()
                        .byId("pcStrandDialogTable")
                        .getSelectedItem().mAggregations.cells[3].mProperties.text;
                    selectedWeight = parseFloat(selectedWeight) * 1000;
                    var currentWeight = parseFloat(idWeight.getValue());
                    if (isNaN(currentWeight)) {
                        MessageBox.error("Ağırlık alanı formatı yanlış");
                        isSavePcStrand = true;
                        return;
                    }
                    if (currentWeight > selectedWeight) {
                        MessageBox.error(
                            "Ağırlık(KG) seçilen bobin ağırlığını(TON) geçemez"
                        );
                        isSavePcStrand = true;
                        return;
                    }
                    var params = {
                        "Param.1": matnr,
                        "Param.2": currentWeight,
                        "Param.3": "KG",
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/getConversionQry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        isSavePcStrand = true;
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
                        CHAR_VALUE:
                            parseFloat(idWeight.getValue()) / parseFloat(newQuantity),
                    });
                    var chosenRow = oTable.getSelectedContextPaths()[0].split("/")[1];
                    var oData = [];
                    oData.push(oTable.getModel().oData[chosenRow]);
                    if (oData[0].checkBox) {
                        var params = {
                            "Param.1": aufnr,
                            "Param.2": plant,
                            "Param.3": aprio,
                            "Param.4": objek == "3007PCWIRE" ? 217 : 214,
                        };
                        var tRunner = new TransactionRunner(
                            "MES/UI/ReportQuantity/getDispoMatnrQry",
                            params
                        );
                        if (!tRunner.Execute()) {
                            MessageBox.error(tRunner.GetErrorMessage());
                            isSavePcStrand = true;
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
                            isSavePcStrand = true;
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
                    if (objek == "3007PCSTRAND") {
                        var response = TransactionCaller.sync(
                            "MES/UI/ReportQuantity/getBabyCoilCastNo",
                            {
                                I_MC_BATCH: oData[0].BARCODE,
                            },
                            "O_JSON"
                        );
                        if (response[1] == "E") {
                            MessageBox.error(response[0]);
                        } else {
                            this.screenObj.inputChar.push({
                                CHAR_NAME: "Y_DOKUMNO",
                                CHAR_VALUE: response[0].Rowsets?.Rowset?.Row?.DOKUM_NO,
                            });
                        }
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
                            isSavePcStrand = true;
                            return null;
                        }
                    }
                    movetype = 101;
                    this.onClickSaveReportedQuantity(movetype);
                    isSavePcStrand = true;
                }
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

                //Check and clean failed consumptions.
                var responseCFC = TransactionCaller.sync(
                    "MES/Itelli/DNA/checkFailedConsumption/checkFailedConsumptionsTrns",
                    {
                        I_CLIENT: this.appData.client,
                        I_PLANT: this.appData.plant,
                        I_NODEID: this.appData.node.nodeID,
                        I_AUFNR: this.appData.selected.order.orderNo,
                        I_APRIO: this.appData.selected.operationNo
                    },
                    "O_JSON"
                );
                if (responseCFC[1] == "E") {
                    MessageBox.error(responseCFC[0]);
                    return;
                }

                var userID = appData.user.userID;
                var matnr = appData.selected.material.id;
                var movetype = 261;
                var reportProductionQuantityTable = this.getView().byId("reportProductionQuantityTable");
                var productionData = reportProductionQuantityTable.getModel().oData.productionData;
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
                    this.clearReportQuantityInputs();
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
                if (this.appData.characteristic[0].Row[0].OBJEK == "3007DUMMY_MC") {
                    var arraySum = [];

                    for (
                        i = 0;
                        i <
                        this.getView().byId("confirmTable").getSelectedContextPaths()
                            .length;
                        i++
                    ) {
                        var object = this.getView()
                            .byId("confirmTable")
                            .getModel()
                            .getObject(
                                this.getView().byId("confirmTable").getSelectedContextPaths()[i]
                            );

                        var quantity = object.QUANTITY;

                        quantity = parseFloat(quantity);

                        arraySum.push(quantity);
                    }

                    var totalQuantity = arraySum.reduce((a, b) => a + b, 0);

                    this.getView().byId("inputConversion").setValue(totalQuantity);

                    this.screenAllValue[0].quantityTon = totalQuantity;
                } else {
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
                }
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
                if (!!this.appData.allCharacteristic) {
                    this.appData.allCharacteristic.MC_SN = jsData[0].Row[0].ROW_NUMBER;
                    this.appData.allCharacteristic.MC_METERAGE = jsData[0].Row[0].QUANTITY;
                }

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
                if (meterage == "") return;
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

            getBobbinNo: function () {
                var response = TransactionCaller.sync(
                    "MES/Itelli/EREN/dnaTelCekmeBobinler/T_SelectDistinctBobbinNo", {},
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                this.getView().byId("reportProductionQuantityTable").getModel().setProperty("/BOBBIN", response[0].Rowsets.Rowset.Row);
            },
            onPressGetWeightFS: function () {
                var response = TransactionCaller.sync(
                    "MES/Itelli/DNA/ReportProduction/FosfatRC/ScaleIntegration/getWeightFromFSScaleTrns", {},
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                var selectRow = this.screenAllValue[0].Row;
                var meterage = parseInt(response[0]) / 1000;
                var oModel_productionQuantityModel = new sap.ui.model.json.JSONModel();
                oModel_productionQuantityModel.setData({
                    productionData: this.reportedProductionData,
                });
                oModel_productionQuantityModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                this.reportedProductionData[selectRow].quantity = meterage;
                this.byId("reportProductionQuantityTable").setModel(oModel_productionQuantityModel);
            },

            handleChange: function (oEvent) {
                var oText = this.getView().byId("DateTimePicker"),
                    sValue = oEvent.getParameter("value");


                oText.setValue(sValue);

            },

            openDatePicker: function () {

                this.getView().byId("openDatePicker").setVisible(false);

                this.getView().byId("closeDatePicker").setVisible(true);
                this.getView().byId("DateTimePicker").setVisible(true);

            },


            closeDatePicker: function () {

                this.getView().byId("openDatePicker").setVisible(true);

                this.getView().byId("closeDatePicker").setVisible(false);
                this.getView().byId("DateTimePicker").setVisible(false);


                this.getView().byId("DateTimePicker").setValue(null);

            },

            production100: function () {

                var oTable = this.getView().byId("reportProductionQuantityTable");
                var oModel = oTable?.getModel();
                var oData = oModel?.oData;
                var productionData = oData?.productionData;
                var errorLineQuantity = 0;
                for (i = 0; i < productionData.length; i++) {
                    if (
                        productionData[i].quantity != "" &&
                        !!productionData[i].quantity
                    )
                        errorLineQuantity++;
                }
                if (errorLineQuantity > 1) {
                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_LABEL_ERROR_CONFIRM")
                    );
                    this.clearReportQuantityInputs();
                    return;
                }
                
                var cnt = 0,
                    index;
                for (var i = 0; i < productionData.length; i++) {
                    if (
                        productionData[i].dcElement == "GOOD_QUANTITY" &&
                        !!productionData[i].batchNumber &&
                        !!productionData[i].quantity
                    ) {
                        cnt++;
                        index = i;
                    }
                }

                if (
                    productionData.length == 2 &&
                    productionData[1]?.dcElement == "REWORK"
                ) {
                    var rw = 0,
                        index;
                    var isBatchFilled = false;
                    if (!!productionData[1].batchNumber)
                        isBatchFilled = true;
                    for (var i = 0; i < productionData.length; i++) {
                        if (productionData[i].dcElement == "REWORK" && !!productionData[i].quantity) {
                            rw++;
                            index = i;
                        }
                    }

                }

                var inputQuantity = parseFloat(productionData[index]?.quantity);
                var quantityReported = parseFloat(
                    this.appData.selected.quantityReported
                );
                var quantityReleased = parseFloat(
                    this.appData.selected.quantityReleased
                );


                if (!!(quantityReleased <= quantityReported + inputQuantity)) {

                    this.getView().byId("idProduction100").setVisible(true);
                }
                else {
                    this.getView().byId("idProduction100").setVisible(false);
                }

            },
        });
    }
);
