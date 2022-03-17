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
        "customActivity/scripts/customStyle",
        "customActivity/scripts/transactionCaller",
        "sap/m/Dialog",
        "sap/m/DialogType",
        "sap/m/Button",
        "sap/m/ButtonType",
        "sap/m/MessageToast",
        "sap/m/Text",
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
        customScript,
        TransactionCaller,
        Dialog,
        DialogType,
        Button,
        ButtonType,
        MessageToast,
        Text
    ) {
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
        var focusInterval;
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
            "COLUMNREWORK"
        ];
        var interval;
        var aufnrInterval;
        var focusCount = 0;
        return Controller.extend("customActivity/controller/oeeReportComponentsDNA", {
            goodQuantityDataCollection: undefined,
            dataCollectionElements: undefined,
            rawMaterialDataCollectionElements: undefined,
            dataCollectionElementKeys: undefined,
            reportedProductionData: undefined,
            STANDALONE: "STANDALONE",
            YIELD_BASED_CONSUMPTION: "YIELD_BASED_CONSUMPTION",
            key: undefined,
            rawMaterialData: undefined,
            selectedRawMaterialDCEIndex: undefined,
            rawMaterialsReportingModel: undefined,
            rawMaterialDataCollection: undefined,
            visibilitySpecificData: undefined,

            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */
            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.appData.intervalState = true;
                this.appData.totalProductionSCT = [] ;
                this.appData.totalProductionSCT.quantityRemaining = "50";
                 

                /*if(this.oDialog == undefined){
                                                                                              this.oDialog = sap.ui.xmlfragment("reportComponentsDialog","sap.oee.ui.fragments.reportComponentsDialog",this);
                                                                                              this.getView().addDependent(this.oDialog);
                                                                                          }*/

                this.appComponent
                    .getEventBus()
                    .subscribe(
                        this.appComponent.getId(),
                        "orderChanged",
                        this.refreshReported,
                        this
                    );
                this.checkShift();
                this.bindDataToCard();

                sap.oee.ui.Utils.attachChangeOrderDetails(
                    this.appComponent,
                    "orderCardFragment",
                    this
                );
                this.getVisibleCharacteristic();
                this.getAllCharacteristic();

                if (!this.appData.anyOrderRunningInShift()) {
                    // Do not proceed if not.
                    return;
                }
                this.getVisibleStatusCharacteristic();
                this.getDataCollectionElementsForRawMaterial();
                this.bindDataCollectionElementsToIconTabBar();
                this.getRawMaterialsForSelection();
                this.formatRawMaterialData();
                this.setDefaultFilters();
                this.bindRawMaterialsToTable();
                this.getCycleNo();
                this.getChargeData();
                sap.ui.commons.Dialog.prototype.onsapescape = function () {
                    console.log("ssss");
                };
                if (this.appData.plant == "3007" && this.appData.node.description.includes("Fosfat")) {
                    this.getView().byId("idPage").setShowFooter(false);
                }
                // this.getComponentDetails();
                that = this;
                if (this.appData.node.description.includes("Tel") || this.appData.node.description.includes("Fosfat")) {
                    this.setFocusToBatchQuantity();
                }
                // Hepsinde Sakla Kaldır
                this.getView().byId("saveButton").setVisible(false);
                //	this.bindRawMaterialsToDialog();

                this.getActiveOrder();

                aufnrInterval = setInterval(function () {
                    that.getActiveOrder();
                }, 60000)

                this.modelServices();
                if (this.appData.node.description.includes("Tel")) {
                    this.getView().byId("idcheckDeletedBatchflexbox").setVisible(true);
                }

            },
            /*
            bindRawMaterialsToDialog : function(){
            this.rawMaterialsReportingModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);	
            this.oDialog.setModel(this.rawMaterialsReportingModel);
            },*/

            modelServices: function () {

                oTrigger = new sap.ui.core.IntervalTrigger(5000);
                oTrigger.addListener(() => {
                    if (this.appData.intervalState) {
                        this.checkDeletedBatch();
                        this.getProductionData();
                    }

                }, this);
            },

            checkDeletedBatch: function () {

                var params = {                    
                };
                var tRunner = new TransactionRunner("MES/Itelli/DNA/checkDeletedBatchOrderChange/checkDeletedBatch", params);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0].Row);

                this.getView().byId("checkDeletedBatch").setModel(oModel);                

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

                if (!!!(this.getView().byId("componentsTable"))) {
                    clearInterval(aufnrInterval);
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
            setFocusToBatchQuantity: function () {
                var batchInput = this.getView().byId("componentsTable").mAggregations.items[0].mAggregations.cells[6].sId;
                focusCount = 0;
                interval = setInterval(function () {
                    if (!!!that.byId(batchInput)) {
                        clearInterval(interval);
                        return;
                    }
                    that.byId(batchInput).focus();
                    focusCount++;
                    if (focusCount == 15) {
                        clearInterval(interval);
                    }
                }, 100);

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
                } else if (objek.includes("3007DUMMY_MC") || objek.includes("3007PCSTRAND")) {
                    path = "MES/Itelli/DNA/Characteristics/Q_GET_CHARACTERISTICS_FF";
                }
                if (!!path) {
                    params = {
                        "Param.1": workorder,
                    };
                    tRunner = new TransactionRunner(
                        path,
                        params
                    );
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
                        MessageBox.show(responseExtra[0]);
                        return;
                    }
                    var oldJsData = JSON.parse(JSON.stringify(jsData));
                    jsData = [];
                    var responseArr = Array.isArray(responseExtra[0].Rowsets.Rowset.Row) ? responseExtra[0].Rowsets.Rowset.Row : new Array(responseExtra[0].Rowsets.Rowset.Row);
                    jsData = [...oldJsData, ...responseArr];
                }

                if (!!jsData) {
                    for (i = 0; i < jsData.length; i++) {
                        if (!!jsData[i]) {
                            allCharJSON[jsData[i].CHARCODE] = {};
                            allCharJSON[jsData[i].CHARCODE].VALUE = jsData[i].CHARVALUE;
                            allCharJSON[jsData[i].CHARCODE].DESC = jsData[i].CHARDESC;
                        }
                    }
                    this.appData.allCharacteristic = allCharJSON;
                }



                var atnam = "ZMII_BILESEN_KARAKTERISTIK";
                var response = TransactionCaller.sync("MES/Itelli/DNA/Characteristics/getObjekChars/T_GET_CHAR_LIST", {
                    I_ATNAM: atnam,
                    I_OBJEK: this.appData.characteristic[0].Row[1].OBJEK
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

                resultArr = responseArr.filter((item) => !screenComponents.includes(item.ATWRT));
                /*
                if (resultArr.length <= 8)
                    this.byId(sap.ui.core.Fragment.createId("orderCardFragment", "idCharacteristicTable2")).setVisible(false);
                */
                var totalCount = resultArr.length;
                var eachTable = parseInt(totalCount / 2);
                if (eachTable < parseFloat(totalCount / 2)) {
                    eachTable++;
                }

                var totalCount = resultArr.length;
                var eachTable = parseInt(totalCount / 2);
                if (eachTable < parseFloat(totalCount / 2)) {
                    eachTable++;
                }

                if (!!this.appData.allCharacteristic) {
                    resultArr.forEach((item, index) => {
                        var chars = item.ATWRT;
                        var value = this.appData.allCharacteristic[chars]?.VALUE || "";
                        var desc = this.appData.allCharacteristic[chars]?.DESC || chars;
                        var obj = {
                            CHARS: chars,
                            VALUE: value,
                            DESC: desc
                        };
                        (index < eachTable) ? result1Arr.push(obj) : result2Arr.push(obj);
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
                    this.byId(sap.ui.core.Fragment.createId("orderCardFragment", "idCharacteristicTable1")).setModel(table1Model);
                    this.byId(sap.ui.core.Fragment.createId("orderCardFragment", "idCharacteristicTable2")).setModel(table2Model);
                }
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
                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterID
                };
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
                    visibleJSON[0][oData[0].Row[i].VALUE] = oData[0].Row[i].VALUE;
                }

                visibleJSON[0].TIP = this.appData.node.description.includes("Örme");
                visibleJSON[0].CAP = this.appData.node.description.includes("Örme");
                visibleJSON[0].LOCATION = this.appData.node.description.includes("Örme");

                this.appData.visibleJSON = visibleJSON[0];
                this.appData.characteristic = oData;
                this.appData.customizationVisible = this.appData.customizationValues[
                    this.appData.node.nodeID
                ];
            },

            increaseCycleNo: function (oEvent) {
                var pModel = this.getView().getModel("cycleNo");
                var pData = pModel.getData();
                var cyc = pData.Row[0].CHAR_VALUE;
                var plant = this.appData.plant;
                var oData;
                //ERP Grup No - Çevrim No Kontrolü
                var erpGrupNo = this.getView().getModel("erpGroupNo").oData.Row[0]
                    .GRUP_NO;
                var paramsForCheck = {
                    "Param.1": erpGrupNo,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/checkErpGroupNoQry",
                    paramsForCheck
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                oData = tRunner.GetJSONData();
                var countErpGroupNo = oData[0].Row[0].GROUP_NO_COUNT;
                if (countErpGroupNo > 0) {
                    MessageBox.error(
                        "Bu Grup Numarasına atanmış bir çevrim sayısı var. Çevrim sayısını artırmak için ERP Grup No. değişmeli."
                    );
                    return null;
                }
                //ERP Grup No - Çevrim No Kontrolü

                var params = {
                    "Param.1": this.appData.node.workcenterID,
                    "Param.2": plant,
                };
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_LABEL_SURE_INC_CYCLE_NO"), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction == "YES") {
                            var tRunner = new TransactionRunner(
                                "MES/UI/ComponentAssignment/getNextCycleNoQry",
                                params
                            );
                            if (!tRunner.Execute()) {
                                MessageBox.error(tRunner.GetErrorMessage());
                                return null;
                            }
                            oData = tRunner.GetJSONData();
                            cyc = oData[0].Row[0].CHAR_VALUE;
                            pData.Row[0].CHAR_VALUE = parseInt(cyc);
                            pModel.setData(pData);
                        } else {
                            return;
                        }
                    }.bind(this),
                }
                );
            },
            callCycleNo: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "cycleNo");
                p_this.getERPGroupNo();
            },
            getCycleNo: function () {
                var workcenterID = this.appData.node.workcenterID;
                var userID = this.appData.user.userID;
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                var plant = this.appData.plant;
                var params = {
                    "Param.1": workcenterID,
                    "Param.2": plant,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/getCurrentCycleNoQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callCycleNo);
            },

            callERPGroupNo: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "erpGroupNo");
            },
            getERPGroupNo: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                var plant = this.appData.plant;
                var params = {
                    "Param.1": plant,
                    "Param.2": aprio,
                    "Param.3": aufnr,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/getERPGroupNo",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callERPGroupNo);
            },

            formatRawMaterialData: function () {
                if (this.visibilitySpecificData == undefined) {
                    this.visibilitySpecificData = {};
                }

                this.visibilitySpecificData.batchRelevant = false;
                this.visibilitySpecificData.serialRelevant = false;
                this.visibilitySpecificData.reasonCodeRelevant = false;
                this.visibilitySpecificData.commentsRelevant = false;

                if (
                    this.checkIfLossType(
                        this.rawMaterialDataCollectionElements.dataCollectionElements
                            .results[this.selectedRawMaterialDCEIndex].timeElementcategory
                    )
                ) {
                    this.visibilitySpecificData.reasonCodeRelevant = true;
                    this.visibilitySpecificData.commentsRelevant = true;
                }

                if (
                    this.rawMaterialDataCollection != null &&
                    this.rawMaterialDataCollection != undefined
                ) {
                    for (var i = 0; i < this.rawMaterialDataCollection.length; i++) {
                        var rawMaterialDataRecord = this.rawMaterialDataCollection[i];
                        rawMaterialDataRecord.defaultUOMText = this.interfaces.interfacesGetTextForUOM(
                            rawMaterialDataRecord.defaultUOM
                        );
                        rawMaterialDataRecord.defaultUOMTextForNonEditableFields =
                            rawMaterialDataRecord.defaultUOMText;
                        rawMaterialDataRecord.qtyReq = parseFloat(
                            rawMaterialDataRecord.qtyReq
                        );
                        if (rawMaterialDataRecord.batchRelevant) {
                            this.visibilitySpecificData.batchRelevant = true;
                        }
                        if (rawMaterialDataRecord.serialRelevant) {
                            this.visibilitySpecificData.serialRelevant = true;
                        }
                    }
                }
            },
            onRadioSelectChanged: function (oEvent) {
                var textArr = ["MERKEZ", "CEVRE"];
                var sId = oEvent.getSource().sId;
                var index = sId.substr(sId.length - 1, 1);
                var selectedText = this.byId(sId).mProperties.text;
                var selectedState;
                this.byId(sId).aRBs.forEach((item) => {
                    if (!item.mProperties.selected) {
                        selectedText = item.mProperties.text;
                        selectedState = item.mProperties.selected;
                    }
                })

                var table = oEvent.getSource().oParent.oParent.sId;

                var newText = "";
                if (selectedState) {
                    if (selectedText == "MERKEZ")
                        newText = "Merkez";
                    else
                        newText = "Cevre";
                } else {
                    if (selectedText == "MERKEZ")
                        newText = "Cevre";
                    else
                        newText = "Merkez";
                }



                var nextIndex = index == 0 ? 1 : 0;
                var nextRadioArr = this.byId(table).mAggregations.items[nextIndex].mAggregations.cells[2].aRBs;
                /*
                nextRadioArr.forEach((item) => {
                    if(item.mProperties.text==newText){
                        item.mProperties.selected=true;
                    }
                    else{
                        item.mProperties.selected=false;
                    }
                });
                */
                var ids = nextRadioArr.filter((item) => item.sId.includes(newText));
                var newRadiosId = ids[0].sId
                nextRadioArr.forEach((item) => {
                    var select = item.sId == newRadiosId ? false : true;
                    this.byId(item.sId).setSelected(select);
                });

            },
            bindRawMaterialsToTable: function (oData) {
                var oModel_rawMaterialsModel = new sap.ui.model.json.JSONModel();
                var modelData = {};
                var workcenterid = this.appData.node.workcenterID;
                modelData.rawMaterialData = this.rawMaterialDataCollection;
                modelData.visibilitySpecificData = this.visibilitySpecificData;
                oModel_rawMaterialsModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                var tableData = [];

                modelData.rawMaterialData.forEach(function (item, index) {
                    if (!item.coProduct) tableData.push(item);
                }, this);

                modelData.rawMaterialData = tableData;


                if (this.appData.node.description.includes("Örme")) {
                    var SCTEL = "SOGUK_CEKILMIS_TEL"
                    var sogukCekilmisTel = [];
                    var masterCoilIndex = 0;
                    modelData.rawMaterialData.sort((a, b) => ((a.matID == SCTEL && b.matID != SCTEL) ? -1 : ((b.matID == SCTEL && a.matID != SCTEL) ? 1 : 0)));
                    modelData.rawMaterialData.forEach((item, index) => {
                        if (item.matID == SCTEL) {
                            item.MERKEZ_CEVRE = [];
                            var merkez = {
                                NAME: "MERKEZ"
                            };
                            var cevre = {
                                NAME: "CEVRE"
                            };
                            item.MERKEZ_CEVRE.push(merkez, cevre);
                            item.MERKEZ = "";
                            item.CEVRE = "";
                            var obj = {
                                index: index,
                                quantity: item.qtyReq
                            };
                            sogukCekilmisTel.push(obj);
                        } else if (item.matID.includes("MASTER")) {
                            masterCoilIndex = index;
                        }
                    });
                    sogukCekilmisTel.sort((a, b) => ((a.quantity > b.quantity) ? -1 : ((b.quantity > a.quantity) ? 1 : 0)));
                    modelData.rawMaterialData[sogukCekilmisTel[0].index].CEVRE = "X";
                    modelData.rawMaterialData[sogukCekilmisTel[1].index].MERKEZ = "X";
                    // remove master coil
                    modelData.rawMaterialData.splice(masterCoilIndex, 1);
                }

                oModel_rawMaterialsModel.setData({
                    modelData: modelData
                });

                this.byId("componentsTable").setModel(oModel_rawMaterialsModel);

                this.initializeToolbarButtons();
            },

            getDataCollectionElementsForRawMaterial: function () {
                this.key = this.STANDALONE;
                this.rawMaterialDataCollectionElements = this.interfaces.getDataCollectionElementsForRawMaterial(
                    this.appData.client,
                    this.key
                );
            },

            bindDataCollectionElementsToIconTabBar: function () {
                var oModel_DataCollectionElementsModel = new sap.ui.model.json.JSONModel();
                oModel_DataCollectionElementsModel.setData({
                    rawMaterialDataCollectionElements: this
                        .rawMaterialDataCollectionElements.dataCollectionElements.results,
                });
                this.byId("reportComponentsIconTabBar").setModel(
                    oModel_DataCollectionElementsModel
                );
                //Any Better way to set Custom data?
                var items = this.byId("reportComponentsIconTabBar").getItems();
                for (var i = 0; i < items.length; i++) {
                    var customData = new sap.ui.core.CustomData({
                        key: "index",
                        value: i,
                    });
                    items[i].addCustomData(customData);
                }
                this.selectedRawMaterialDCEIndex = 0;
                if (
                    this.getView().getViewData().viewOptions &&
                    this.getView().getViewData().viewOptions.length > 0
                ) {
                    for (
                        var i = 0; i < this.getView().getViewData().viewOptions.length; i++
                    ) {
                        if (
                            this.getView().getViewData().viewOptions[i]
                                .activityOptionValueDTOList &&
                            this.getView().getViewData().viewOptions[i]
                                .activityOptionValueDTOList.results &&
                            this.getView().getViewData().viewOptions[i]
                                .activityOptionValueDTOList.results.length > 0
                        ) {
                            if (
                                this.getView().getViewData().viewOptions[i].optionName ==
                                sap.oee.ui.oeeConstants.activityOptionNameDefaultTab
                            ) {
                                var defaultDCE = this.getView().getViewData().viewOptions[i]
                                    .activityOptionValueDTOList.results[0].optionValue;
                                for (
                                    var j = 0; j <
                                    this.rawMaterialDataCollectionElements.dataCollectionElements
                                        .results.length; j++
                                ) {
                                    if (
                                        this.rawMaterialDataCollectionElements
                                            .dataCollectionElements.results[j].dcElement == defaultDCE
                                    ) {
                                        this.byId("reportComponentsIconTabBar").setSelectedKey(
                                            defaultDCE
                                        );
                                        this.selectedRawMaterialDCEIndex = j;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            },

            setDefaultFilters: function () {
                var coProductCheckBox = this.byId("coProductCheckBox");
                var byProductCheckBox = this.byId("byProductCheckBox");
                var backflushCheckBox = this.byId("backflushCheckBox");
                var nonBackflushCheckBox = this.byId("nonBackflushCheckBox");

                var activityOptionValuesForDefaultFilters = this.getActivityOptionValues(
                    sap.oee.ui.oeeConstants.activityOptionNameDefaultFilters
                );

                if (
                    activityOptionValuesForDefaultFilters &&
                    activityOptionValuesForDefaultFilters.length > 0
                ) {
                    for (
                        var i = 0; i < activityOptionValuesForDefaultFilters.length; i++
                    ) {
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.componentTypes.CO_PRODUCT
                        ) {
                            coProductCheckBox.setSelected(true);
                        }
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.componentTypes.BY_PRODUCT
                        ) {
                            byProductCheckBox.setSelected(true);
                        }
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.componentTypes.BACKFLUSH
                        ) {
                            backflushCheckBox.setSelected(true);
                        }
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.componentTypes.NON_BACKFLUSH
                        ) {
                            nonBackflushCheckBox.setSelected(true);
                        }
                    }
                }
            },

            getActivityOptionValues: function (obj) {
                if (
                    this.getView().getViewData().viewOptions &&
                    this.getView().getViewData().viewOptions.length > 0
                ) {
                    for (
                        var i = 0; i < this.getView().getViewData().viewOptions.length; i++
                    ) {
                        if (
                            this.getView().getViewData().viewOptions[i]
                                .activityOptionValueDTOList &&
                            this.getView().getViewData().viewOptions[i]
                                .activityOptionValueDTOList.results &&
                            this.getView().getViewData().viewOptions[i]
                                .activityOptionValueDTOList.results.length > 0
                        ) {
                            if (
                                this.getView().getViewData().viewOptions[i].optionName == obj
                            ) {
                                return this.getView().getViewData().viewOptions[i]
                                    .activityOptionValueDTOList.results;
                            }
                        }
                    }
                }
            },

            getOrderAfterFormatting: function (orderNumber) {
                var orderNumberLength = 12;
                if (orderNumber != undefined) {
                    if (orderNumber.length != orderNumberLength) {
                        while (orderNumber.length != orderNumberLength) {
                            orderNumber = "0" + orderNumber;
                        }
                    }
                }
                return orderNumber;
            },

            getRawMaterialsForSelection: function (
                referenceProductionQuantity,
                referenceProductionQuantityUOM
            ) {
                if (this.key == this.STANDALONE) {
                    var rawMaterialDataCollectionTemp = this.interfaces.getRawMaterials(
                        this.appData.client,
                        this.appData.plant,
                        this.getOrderAfterFormatting(this.appData.selected.order.orderNo),
                        this.appData.selected.operationNo,
                        this.appData.selected.order.releasedQuantity,
                        this.appData.selected.runID,
                        this.rawMaterialDataCollectionElements.dataCollectionElements
                            .results[this.selectedRawMaterialDCEIndex].dcElement,
                        this.rawMaterialDataCollectionElements.dataCollectionElements
                            .results[this.selectedRawMaterialDCEIndex].timeElementType
                    );

                    if (
                        rawMaterialDataCollectionTemp != null &&
                        rawMaterialDataCollectionTemp != undefined &&
                        rawMaterialDataCollectionTemp.details != null &&
                        rawMaterialDataCollectionTemp.details != undefined &&
                        rawMaterialDataCollectionTemp.details.results != null &&
                        rawMaterialDataCollectionTemp.details.results != undefined
                    ) {
                        this.rawMaterialDataCollection =
                            rawMaterialDataCollectionTemp.details.results;
                        for (i in this.rawMaterialDataCollection) {
                            this.rawMaterialDataCollection[
                                i
                            ].dcElement = this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                this.selectedRawMaterialDCEIndex
                            ].dcElement;
                            this.rawMaterialDataCollection[
                                i
                            ].timeElementcategory = this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                this.selectedRawMaterialDCEIndex
                            ].timeElementcategory;
                            this.rawMaterialDataCollection[i].reasonCodeData = {};
                        }
                    }
                }
                if (this.key == this.YIELD_BASED_CONSUMPTION) {
                    var dcQuantities = [];

                    dcQuantities.push({
                        quantity: referenceProductionQuantity,
                        uom: referenceProductionQuantityUOM,
                    });

                    var rawMaterialDataCollectionTemp = this.interfaces.getRawMaterialsForYieldBasedConsumption(
                        this.appData.client,
                        this.appData.plant,
                        this.appData.node.nodeID,
                        this.getOrderAfterFormatting(this.appData.selected.order.orderNo),
                        this.appData.selected.operationNo,
                        this.appData.selected.runID,
                        null,
                        dcQuantities
                    );
                    if (
                        rawMaterialDataCollectionTemp != null &&
                        rawMaterialDataCollectionTemp != undefined &&
                        rawMaterialDataCollectionTemp.details != null &&
                        rawMaterialDataCollectionTemp.details != undefined &&
                        rawMaterialDataCollectionTemp.details.results != null &&
                        rawMaterialDataCollectionTemp.details.results != undefined
                    ) {
                        this.rawMaterialDataCollection =
                            rawMaterialDataCollectionTemp.details.results;
                        for (i in this.rawMaterialDataCollection) {
                            this.rawMaterialDataCollection[
                                i
                            ].dcElement = this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                this.selectedRawMaterialDCEIndex
                            ].dcElement;
                            this.rawMaterialDataCollection[
                                i
                            ].timeElementcategory = this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                this.selectedRawMaterialDCEIndex
                            ].timeElementcategory;
                            this.rawMaterialDataCollection[i].qtyReportedNew = parseFloat(
                                this.rawMaterialDataCollection[i].qtyReq
                            );
                            this.rawMaterialDataCollection[
                                i
                            ].defaultUOMText = this.interfaces.interfacesGetTextForUOM(
                                this.rawMaterialDataCollection[i].defaultUOM
                            );
                            this.rawMaterialDataCollection[i].reasonCodeData = {};
                        }
                    }
                }
                // Fosfatlama parti no girişi olmayanlar visible false
                var dummyArr = [];
                this.rawMaterialDataCollection.forEach((item) => {
                    if (!!item.batchRelevant) {
                        dummyArr.push(item);
                    }
                });
                this.rawMaterialDataCollection = [];
                this.rawMaterialDataCollection = Array.from(dummyArr);
            },

            onSelectCheckBoxFilters: function () {
                var coProductCheckBox = this.byId("coProductCheckBox").getSelected();
                var byProductCheckBox = this.byId("byProductCheckBox").getSelected();
                var backflushCheckBox = this.byId("backflushCheckBox").getSelected();
                var nonBackflushCheckBox = this.byId(
                    "nonBackflushCheckBox"
                ).getSelected();

                var coProductFilter = new sap.ui.model.Filter(
                    "coProduct",
                    "EQ",
                    coProductCheckBox
                );
                var byProductFilter = new sap.ui.model.Filter(
                    "byProduct",
                    "EQ",
                    byProductCheckBox
                );
                var backflushFilter = new sap.ui.model.Filter(
                    "backflush",
                    "EQ",
                    backflushCheckBox
                );
                var nonBackflush = new sap.ui.model.Filter(
                    "backflush",
                    "NE",
                    nonBackflushCheckBox
                );

                var oFilter = [];
                if (coProductCheckBox) {
                    oFilter.push(coProductFilter);
                }
                if (byProductCheckBox) {
                    oFilter.push(byProductFilter);
                }
                if (backflushCheckBox) {
                    oFilter.push(backflushFilter);
                }
                if (nonBackflushCheckBox) {
                    oFilter.push(nonBackflush);
                }

                this.byId("componentsTable").getBinding("items").filter(oFilter);
                //this.oDialog.getBinding("FormContainer").filter(oFilter);
            },

            onSelectReportComponentsIconTabBar: function (eventItem) {
                this.selectedRawMaterialDCEIndex = eventItem
                    .getParameter("item")
                    .data("index");

                this.getRawMaterialsForSelection();
                this.formatRawMaterialData();
                this.bindRawMaterialsToTable();
                //this.bindRawMaterialsToDialog();
            },

            bindDataToCard: function () {
                sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent, this);
                sap.oee.ui.Utils.attachChangeOrderDetails(
                    this.appComponent,
                    "orderCardFragment",
                    this
                );
            },

            reportRawMaterials: function () {
                var dataCollectionArray = [];
                if (this.rawMaterialDataCollection != undefined) {
                    for (var i = 0; i < this.rawMaterialDataCollection.length; i++) {
                        if (
                            this.rawMaterialDataCollection[i].qtyReportedNew != undefined &&
                            this.rawMaterialDataCollection[i].qtyReportedNew != ""
                        ) {
                            var rawMaterialData = {};
                            if (
                                !sap.oee.ui.Utils.isQuantityValid(
                                    this.rawMaterialDataCollection[i].qtyReportedNew
                                )
                            ) {
                                return;
                            }
                            rawMaterialData.client = this.appData.client;
                            rawMaterialData.plant = this.appData.plant;
                            rawMaterialData.nodeID = this.appData.node.nodeID;
                            rawMaterialData.runID = this.appData.selected.runID;
                            rawMaterialData.dcElement = this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                this.selectedRawMaterialDCEIndex
                            ].dcElement;
                            rawMaterialData.material = this.rawMaterialDataCollection[
                                i
                            ].matID;
                            rawMaterialData.quantity =
                                "" + this.rawMaterialDataCollection[i].qtyReportedNew;
                            rawMaterialData.uom = this.rawMaterialDataCollection[
                                i
                            ].defaultUOM;
                            rawMaterialData.comments = this.rawMaterialDataCollection[
                                i
                            ].comments;
                            rawMaterialData.dcElementType = "OTHER_QUANTITY";

                            if (
                                this.rawMaterialDataCollection[i].reasonCodeData != undefined
                            ) {
                                rawMaterialData.rc1 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode1;
                                rawMaterialData.rc2 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode2;
                                rawMaterialData.rc3 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode3;
                                rawMaterialData.rc4 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode4;
                                rawMaterialData.rc5 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode5;
                                rawMaterialData.rc6 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode6;
                                rawMaterialData.rc7 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode7;
                                rawMaterialData.rc8 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode8;
                                rawMaterialData.rc9 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode9;
                                rawMaterialData.rc10 = this.rawMaterialDataCollection[
                                    i
                                ].reasonCodeData.reasonCode10;
                            }
                            if (this.rawMaterialDataCollection[i].batchRelevant) {
                                if (
                                    this.rawMaterialDataCollection[i].batchNumber != undefined &&
                                    this.rawMaterialDataCollection[i].batchNumber != ""
                                ) {
                                    rawMaterialData.batchNo = this.rawMaterialDataCollection[
                                        i
                                    ].batchNumber;
                                } else {
                                    sap.m.MessageToast.show(
                                        this.appComponent.oBundle.getText(
                                            "OEE_ERROR_FILL_ALL_INPUTS"
                                        )
                                    );
                                    return;
                                }
                            }

                            if (
                                this.rawMaterialDataCollection[i].serialNumber != undefined &&
                                this.rawMaterialDataCollection[i].serialNumber != ""
                            ) {
                                rawMaterialData.serialNo = this.rawMaterialDataCollection[
                                    i
                                ].serialNumber;
                            }

                            var currentTime = new Date().getTime();
                            var shiftEndTime = this.appData.shift.endTimestamp;
                            var shiftStartTime = this.appData.shift.startTimestamp;

                            if (currentTime < shiftEndTime) {
                                rawMaterialData.startTimestamp = currentTime;
                                rawMaterialData.endTimestamp = currentTime;
                            } else {
                                var mostRecentReportingTime = sap.oee.ui.Utils.getMostRecentReportingTime(
                                    this.appData.shift.startTimestamp,
                                    this.appData.shift.endTimestamp,
                                    this.appData.selected.startTimestamp
                                );
                                if (mostRecentReportingTime != undefined) {
                                    rawMaterialData.startTimestamp = mostRecentReportingTime;
                                    rawMaterialData.endTimestamp = mostRecentReportingTime;
                                }
                            }

                            dataCollectionArray.push(rawMaterialData);
                        }
                    }

                    var charge = "";

                    if (this.getView().byId("chargeID").getVisible())
                        charge = this.getView().byId("chargeID").getSelectedKey();

                    var params = {
                        I_DATACOLLECTIONARRAY: JSON.stringify(dataCollectionArray),
                        I_CHARGE: charge,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ComponentAssignment/reportRawMaterialXquery",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callReportRawMaterial);
                    this.insertConsumption(dataCollectionArray);
                }
            },

            callReportRawMaterial: function (p_this, p_data) {
                sap.oee.ui.Utils.toast(
                    p_this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE")
                );
                p_this.refreshReported();
            },

            insertConsumption: function (dataCollectionArray) {
                var workcenterID = this.appData.node.workcenterID;
                var userID = this.appData.user.userID;
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                for (var i = 0; i < dataCollectionArray.length; i++) {
                    var params = {
                        I_CLIENT: dataCollectionArray[i].client,
                        I_PLANT: dataCollectionArray[i].plant,
                        I_NODEID: dataCollectionArray[i].nodeID,
                        I_WORKCENTERID: workcenterID,
                        I_QUANTITY: dataCollectionArray[i].quantity,
                        I_USER: userID,
                        I_AUFNR: aufnr,
                        I_APRIO: aprio,
                        I_BARCODE: "",
                        I_MATNR: dataCollectionArray[i].material,
                        I_UOM: dataCollectionArray[i].uom,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ComponentAssignment/insertConsumptionGoodsXquery",
                        params
                    );

                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                }
                this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS");
            },

            /*  Aynı isim ile bir fonksiyon daha mevcut. Bu çalışmıyor...
            handleCancel: function (oEvent) {
                if (this.detailsDialog != undefined) {
                    sap.ui
                        .getCore()
                        .byId(
                            sap.ui.core.Fragment.createId("detailsFragment", "deleteButton")
                        )
                        .setEnabled(false);
                }
                this.detailsDialog.close();
            },
            */

            refreshReported: function () {
                if (!this.appData.anyOrderRunningInShift()) {
                    // Do not proceed if not.
                    return;
                }

                this.getRawMaterialsForSelection();
                this.formatRawMaterialData();
                this.bindRawMaterialsToTable();
                this.onSelectCheckBoxFilters();
                //this.bindRawMaterialsToDialog();
            },

            handleValueHelpRequest: function (oEvent) {
                var uomListModel;
                this._inputFieldForWhichValueHelpRequested = oEvent.getSource(); // Is Marked Private as can only be accessed once value help is Fired.
                if (this.uomList == undefined) {
                    var oResults = this.interfaces.interfacesGetAllUOMs();
                    if (oResults != undefined) {
                        this.uomList = {
                            uomList: oResults.results
                        };
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
                    if (
                        this._inputFieldForWhichValueHelpRequested.getBindingContext() !=
                        undefined
                    ) {
                        this._inputFieldForWhichValueHelpRequested
                            .getBindingContext()
                            .getObject().defaultUOM = sUom;
                        this._inputFieldForWhichValueHelpRequested
                            .getBindingContext()
                            .getObject().defaultUOMText = sUomText;
                        this._inputFieldForWhichValueHelpRequested.getModel().checkUpdate();
                    } else {
                        if (this.yieldBasedConsumptionModel != undefined) {
                            var modelData = this.yieldBasedConsumptionModel.getData();
                            modelData.yieldBasedConsumptionData.uom = sUom;
                            modelData.yieldBasedConsumptionData.description = sUomText;
                            sap.oee.ui.Utils.updateModel(this.yieldBasedConsumptionModel);
                        }
                    }
                }
            },

            onClickShowListOfProductionData: function (oEvent) {
                var bindingContext = oEvent.getSource().getBindingContext().getObject();

                var oView = this.getView();
                var oDialog = oView.byId("showDetailsRecords");
                // create dialog lazily
                if (!oDialog) {
                    // create dialog via fragment factory
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.showDetailsRecords",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                oDialog.open();
                this.appData.oDialog = oDialog;
                this.getShowDetailsRecords(bindingContext.matDesc);
            },

            getShowDetailsRecords: function (matDesc) {
                var oModel = new sap.ui.model.json.JSONModel();
                var runID = this.appData.selected.runID;

                var params = {
                    "Param.1": runID,
                    "Param.2": matDesc
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/getShowDetailsRecordsQry",
                    params
                );

                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var jsData = tRunner.GetJSONData();
                var oData = {
                    prodList: jsData[0].Row
                };
                oModel.setData(oData);
                this.getView().byId("detailsTable").setModel(oModel);
            },
            onClickReportQuantity: function (oEvent) {
                var objek = this.appData.characteristic.Row[0].OBJEK;
                if (
                    objek == "2001AO" ||
                    objek == "2001PO" ||
                    objek == "2001SDM" ||
                    objek == "3001AO" ||
                    objek == "3001PO" ||
                    objek == "3001SDM"
                ) {
                    var oTable = this.getView().byId("componentsTable");
                    var data = oTable.getModel().oData.modelData.rawMaterialData;
                    var runID = this.appData.selected.runID;
                    var aufnr = this.appData.selected.order.orderNo;
                    var arrInput = [];
                    var plant = this.appData.plant;
                    var sumQuantity = 0;
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].batchNumber != "" && data[i].qtyReportedNew != "0") {
                            arrInput.push({
                                MATNR: data[i].matDesc,
                                BATCH_NO: data[i].batchNumber,
                            });
                            sumQuantity = sumQuantity + parseFloat(data[i].qtyReportedNew);
                        }
                    }
                    var params = {
                        I_RUNID: runID,
                        I_PLANT: plant,
                        I_AUFNR: aufnr,
                        I_ARRINPUT: JSON.stringify(arrInput),
                        I_SUMQUANTITY: sumQuantity,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ComponentAssignment/batchControleXquery",
                        params
                    );

                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                }
                this.reportRawMaterials();
                this.refreshReported();
            },

            checkIfValueReported: function (obj) {
                if (obj) {
                    return true;
                } else return false;
            },

            onChangeValidateQuantity: function (oEvent) {
                sap.oee.ui.Utils.isQuantityValid(
                    oEvent.getParameter("newValue"),
                    oEvent.getSource()
                );
            },

            onExit: function () {
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
                        this.refreshReported,
                        this
                    );
            },

            onClickYieldBasedConsumption: function () {
                if (this.yieldBasedConsumptionDialog == undefined) {
                    this.yieldBasedConsumptionDialog = sap.ui.xmlfragment(
                        "yieldBasedConsumptionDialog",
                        "sap.oee.ui.fragments.yieldBasedConsumptionDialog",
                        this
                    );
                    this.getView().addDependent(this.yieldBasedConsumptionDialog);
                }
                this.getView().addDependent(this.yieldBasedConsumptionDialog);

                this.prepareYieldBasedConsumptionDialog();
                var rawMaterialDataFormContainer = sap.ui
                    .getCore()
                    .byId(
                        sap.ui.core.Fragment.createId(
                            "yieldBasedConsumptionDialog",
                            "rawMaterialDataFormContainer"
                        )
                    );
                rawMaterialDataFormContainer.setVisible(false);

                this.yieldBasedConsumptionDialog.open();
            },

            prepareYieldBasedConsumptionDialog: function () {
                this.formatRawMaterialData();
                this.key = this.YIELD_BASED_CONSUMPTION;
                this.bindRawMaterialsToYieldBasedConsumptionDialog();
            },

            bindRawMaterialsToYieldBasedConsumptionDialog: function () {
                var oModel_yieldBasedConsumptionModel = new sap.ui.model.json.JSONModel();
                var yieldBasedConsumptionData = {};
                yieldBasedConsumptionData.rawMaterialData = this.rawMaterialDataCollection;
                yieldBasedConsumptionData.qty = "";
                yieldBasedConsumptionData.uom = this.appData.selected.quantityReleasedUOM;
                yieldBasedConsumptionData.description = this.interfaces.interfacesGetTextForUOM(
                    this.appData.selected.quantityReleasedUOM
                );
                yieldBasedConsumptionData.visibilitySpecificData = this.visibilitySpecificData;

                oModel_yieldBasedConsumptionModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                oModel_yieldBasedConsumptionModel.setData({
                    yieldBasedConsumptionData: yieldBasedConsumptionData,
                });
                this.yieldBasedConsumptionDialog.setModel(
                    oModel_yieldBasedConsumptionModel
                );
                this.yieldBasedConsumptionModel = oModel_yieldBasedConsumptionModel;
            },

            onPressCalculate: function () {
                var yieldBasedConsumptionData = this.yieldBasedConsumptionModel.getData();
                var qty = yieldBasedConsumptionData.yieldBasedConsumptionData.qty;
                var uom = yieldBasedConsumptionData.yieldBasedConsumptionData.uom;
                var description =
                    yieldBasedConsumptionData.yieldBasedConsumptionData.description;
                this.getRawMaterialsForSelection(qty, uom);
                yieldBasedConsumptionData.rawMaterialData = this.rawMaterialDataCollection;
                yieldBasedConsumptionData.qty = qty;
                yieldBasedConsumptionData.uom = uom;
                yieldBasedConsumptionData.description = description;
                yieldBasedConsumptionData.visibilitySpecificData = this.visibilitySpecificData;
                this.yieldBasedConsumptionModel.setData({
                    yieldBasedConsumptionData: yieldBasedConsumptionData,
                });

                sap.oee.ui.Utils.updateModel(this.yieldBasedConsumptionModel);
                var rawMaterialDataFormContainer = sap.ui
                    .getCore()
                    .byId(
                        sap.ui.core.Fragment.createId(
                            "yieldBasedConsumptionDialog",
                            "rawMaterialDataFormContainer"
                        )
                    );
                rawMaterialDataFormContainer.setVisible(true);
                this.yieldBasedConsumptionDialog.rerender();
            },

            handleOkForYieldBasedConsumptionDialog: function () {
                this.reportRawMaterials();
                this.yieldBasedConsumptionDialog.close();
                this.key = this.STANDALONE;
                this.refreshReported();
            },

            handleCancelForYieldBasedConsumptionDialog: function () {
                this.yieldBasedConsumptionDialog.close();
                this.key = this.STANDALONE;
                this.getRawMaterialsForSelection();
                this.formatRawMaterialData();
                this.bindRawMaterialsToTable();
            },

            onPressReset: function () {
                var rawMaterialDataFormContainer = sap.ui
                    .getCore()
                    .byId(
                        sap.ui.core.Fragment.createId(
                            "yieldBasedConsumptionDialog",
                            "rawMaterialDataFormContainer"
                        )
                    );
                rawMaterialDataFormContainer.setVisible(false);
                var modelData = rawMaterialDataFormContainer.getModel().getData();
                modelData.yieldBasedConsumptionData.qty = "";
                modelData.yieldBasedConsumptionData.uom = this.appData.selected.quantityReleasedUOM;
                modelData.yieldBasedConsumptionData.description = this.interfaces.interfacesGetTextForUOM(
                    this.appData.selected.quantityReleasedUOM
                );
                sap.oee.ui.Utils.updateModel(this.yieldBasedConsumptionModel);
            },

            checkIfLossType: function (obj) {
                return obj == sap.oee.ui.oeeConstants.timeElementCategoryForLoss;
            },

            onClickOpenReasonCodeUtilityPopup: function (oEvent) {
                var reasonCodeLink = oEvent.getSource();
                var selectedElement = oEvent.getSource().getBindingContext().getObject()
                    .dcElement;
                //var selectedRowId = oEvent.getSource().getBindingContext().getObject().rowIndex;
                var oContextObject = oEvent.getSource().getBindingContext().getObject();
                var preReasonCodeCollection = oEvent
                    .getSource()
                    .getBindingContext()
                    .getObject().reasonCodeData;
                var oInterfaceReference = this.interfaces;
                var oAppData = this.appData;
                var oController = this.getView().getController();

                sap.oee.ui.rcUtility.createReasonCodeToolPopup(
                    this,
                    reasonCodeLink,
                    this.appData.client,
                    this.appData.plant,
                    this.appData.node.nodeID,
                    selectedElement,
                    oEvent.getSource().getBindingContext().getObject(),
                    "reasonCodeData",
                    undefined,
                    undefined
                );
            },

            onClickAddComments: function (oEvent) {
                var oContextObject = oEvent.getSource().getBindingContext().getObject();
                this.oContextObject = oContextObject;
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
                if (oContextObject.comments != "") {
                    sap.ui
                        .getCore()
                        .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"))
                        .setValue(oContextObject.comments);
                }
                this.oCommentsDialog.open();
            },

            onCommentDialogCancelButton: function (oEvent) {
                this.oCommentsDialog.close();
            },

            onCommentDialogSaveButton: function (oEvent) {
                var oCommentBox = sap.ui
                    .getCore()
                    .byId(sap.ui.core.Fragment.createId("commentPopup", "comment"));
                this.oContextObject.comments = oCommentBox.getValue();
                sap.oee.ui.Utils.updateModel(this.byId("componentsTable").getModel());
                if (this.yieldBasedConsumptionDialog != undefined) {
                    sap.oee.ui.Utils.updateModel(this.yieldBasedConsumptionModel);
                }
                this.oCommentsDialog.close();
            },

            onClickReadBarcode: function (oEvent) {
                var oView = this.getView();
                var oDialog = oView.byId("readBarcodeDialog");
                // create dialog lazily
                if (!oDialog) {
                    // create dialog via fragment factory
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.readBarcodeDialog",
                        this
                    );
                    oView.addDependent(oDialog);
                }

                oDialog.open();
                this.byId("inputBarcode").setValue("");
            },

            handleAddConfirm: function (inputValue, line, cmp_prd_ts) {
                var inputBarcode = this.getView().byId("inputBarcode");
                var inputBarcodeValue = inputValue;
                var warning = false;
                for (i = 0; i < inputBarcodeValue.length; i++) {
                    if (inputBarcodeValue[i] == " ") var warning = true;
                }

                if (warning) {
                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_ERROR_FILL_ALL_INPUTS")
                    );
                    return;
                }
                var row = this.getView().byId("componentsTable").getModel().oData
                    .modelData.rawMaterialData[line];

                var erpGrupNo;
                if (!!this.getView().getModel("erpGroupNo").oData.Row)
                    erpGrupNo = this.getView().getModel("erpGroupNo").oData.Row[0]
                        .GRUP_NO;
                var cycleNo;
                var client = this.appData.client;
                var werks = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var workcenterID = this.appData.node.workcenterID;
                var userID = this.appData.user.userID;
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                var matnr = row.matID;
                var objekID = this.appData.characteristic.Row[0].OBJEK;
                var selectedType = "";
                if (objekID == "3007DUMMY_MC") {
                    this.byId("componentsTable").mAggregations.items[line].mAggregations.cells[2].aRBs.forEach((item) => {
                        if (item.mProperties.selected) {
                            selectedType = item.mProperties.text;
                        }
                    });
                }

                if (
                    objekID == "2002FLMCAN1" ||
                    objekID == "2002FLMCAN2" ||
                    objekID == "2002FLMCAN3"
                ) {
                    if (this.getView().getModel("cycleNo").oData.Row != undefined)
                        cycleNo = this.getView().getModel("cycleNo").oData.Row[0]
                            .CHAR_VALUE;
                }
                if (objekID == "3007DUMMY_MC") {
                    var cap = this.getView().byId("componentsTable").mAggregations.items[line].mAggregations.cells[3].mProperties.value;
                    var lokasyon = this.getView().byId("componentsTable").mAggregations.items[line].mAggregations.cells[4].getSelectedKey();
                    if (!!!cap) {
                        MessageBox.show("Parti okutmadan önce çap giriniz");
                        return;
                    } else if (!!!lokasyon || lokasyon == "0") {
                        MessageBox.show("Parti okutmadan önce lokasyon seçiniz");
                        return;
                    } else if (selectedType == "MERKEZ" && lokasyon != "MERKEZ") {
                        MessageBox.show("'MERKEZ' bobini sadece 'MERKEZ' lokasyonuna okutulabilir");
                        return;
                    }
                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/MeasuredDiameter/T_MEASURED_DIAMETER",
                        {
                            I_AUFNR: aufnr,
                            I_APRIO: aprio,
                            I_BATCH: inputValue,
                            I_DIAMETER: cap,
                            I_USER: userID,
                            I_LOCATION: lokasyon,
                        },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }
                }
                //aufnr = parseInt(aufnr);
                var params = {
                    "Param.1": client,
                    "Param.2": werks,
                    "Param.3": nodeID,
                    "Param.4": workcenterID,
                    "Param.5": inputBarcodeValue,
                    "Param.6": userID,
                    "Param.7": aufnr,
                    "Param.8": aprio,
                    "Param.9": matnr,
                    "Param.10": this.appData.characteristic.Row[0].OBJEK,
                    "Param.11": cycleNo,
                    "Param.12": erpGrupNo,
                    "Param.13": selectedType,
                    "Param.15": cmp_prd_ts
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/insertConsumptionXquery",
                    params
                );

                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS");
                this.openBarcodeListFragment();
            },

            openBarcodeListFragment: function () {
                var oView = this.getView();
                var oDialog = oView.byId("getBarcodeInformation");
                // create dialog lazily
                // if (!oDialog) {
                // create dialog via fragment factory
                if (oDialog != undefined) {
                    oDialog.destroy();
                }

                this.getView().byId("locationSelect")?.destroy();
                this.getView().byId("palletNoInput")?.destroy();
                var objek = this.appData.characteristic.Row[0].OBJEK;
                if (objek == "3007SCTEL1" || objek == "3007SCTEL2") {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.getBarcodeInformationDNASCT",
                        this
                    );
                } else if (objek == "3007DUMMY_MC") {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.getBarcodeInformationDNAMC",
                        this
                    );
                } else {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.getBarcodeInformationDNA",
                        this
                    );
                }
                oDialog.setEscapeHandler(function (o) {
                    o.reject();
                });
                oView.addDependent(oDialog);
                oDialog.open();
                //  }
                this.getComponentDetails();
            },

            callComponentDetails: function (p_this, p_data) {
                var tableData = [];
                var characteristic = [];
                var rows = p_data.Rowsets.Rowset[0].Row;
                var OBJEKforCAP = p_this.appData.characteristic.Row[0].OBJEK;
                if (rows != undefined) {
                    var werks = p_this.appData.plant;
                    var workcenterID = p_this.appData.node.workcenterID;
                    var aufnr = p_this.appData.selected.order.orderNo;
                    var boolean;

                    for (var i = 0; i < rows.length; i++) {
                        boolean = true;
                        for (var k = 0; k < tableData.length; k++) {
                            if (rows[i].BARCODE == tableData[k]?.BARCODE) boolean = false;
                        }

                        if (boolean) tableData.push(rows[i]);
                    }

                    for (i = 0; i < rows.length; i++) {
                        for (k = 0; k < tableData.length; k++) {
                            if (tableData[k].BARCODE == rows[i]?.BARCODE)
                                tableData[k][rows[i]?.ATNAM] = rows[i]?.ATWRT;
                        }
                    }
                }
                if (OBJEKforCAP == "3007FOSFAT" || OBJEKforCAP == "3007SCTEL1" || OBJEKforCAP == "3007SCTEL2" || OBJEKforCAP == "3007SKINPASS") {
                    tableData.forEach(function (item, index) {

                        tableData[index].Y_CAP_FLM_MM = Number((tableData[index]?.Y_CAP_FLM_MM)?.replace(',', '.'))?.toFixed(2);


                    })
                }
                else if (OBJEKforCAP == "3007DUMMY_MC" || OBJEKforCAP == "3007PCWIRE") {

                    tableData.forEach(function (item, index) {

                        tableData[index].Y_TEL_CAP_MM_SC = Number((tableData[index]?.Y_TEL_CAP_MM_SC)?.replace(',', '.'))?.toFixed(2);


                    })

                }
                else if (OBJEKforCAP == "3007PCSTRAND") {

                    tableData.forEach(function (item, index) {

                        tableData[index].Y_CAP_PCS_MM = Number((tableData[index]?.Y_CAP_PCS_MM)?.replace(',', '.'))?.toFixed(2);


                    })

                }



                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData);
                p_this.getView().setModel(oModel, "componentList");
            },

            getComponentDetails: function () {
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;

                var path = "";
                if (this.appData.node.description.includes("Örme")) {
                    path = "MES/UI/ComponentAssignment/getComponentListQryORME";
                }
                else {
                    path = "MES/UI/ComponentAssignment/getComponentListQry";
                }

                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterID,
                    "Param.3": aufnr,
                };
                var tRunner = new TransactionRunner(
                    path,
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callComponentDetails);
            },

            openComponetWeldsFragment: function (oEvent) {
                var oView = this.getView();
                var oDialog = oView.byId("getComponentWeldsInfo");
                // create dialog lazily
                // if (!oDialog) {
                // create dialog via fragment factory
                if (oDialog != undefined) oDialog.destroy();

                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "customActivity.fragmentView.getComponentWeldsInfo",
                    this
                );
                oView.addDependent(oDialog);
                oDialog.open();
                //  }
                //this.getWeldDetails();
            },

            callWeldDetails: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "weldDetails");
                p_this.openComponetWeldsFragment();
            },

            getWeldDetails: function (oEvent) {
                //setTimeout(10000);
                var aufnr = this.appData.selected.order.orderNo;
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var sPath = oEvent.getSource().getParent().getBindingContextPath();
                var chosenRow = sPath.split("/")[1];
                var oData = this.getView().getModel("componentList").oData;
                var barcode = oData[chosenRow].BARCODE;

                var params = {
                    "Param.1": barcode,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/getWeldDetailsQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callWeldDetails);
            },

            getVisibleStatusCharacteristic: function () {
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/getComponentCharacteristicQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "visibleStatusModel");
                this.appData.characteristic = oData[0];
            },

            onPressDeleteComponent: function (oEvent) {
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_LABEL_SURE_FOR_DELETE"), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction == "YES") {
                            this.callDeleteComponent();
                        } else {
                            return;
                        }
                    }.bind(this),
                }
                );
            },

            callDeleteComponent: function (oEvent) {
                var logsTable = this.getView().byId("confirmTable");
                var selectedItems = logsTable.getSelectedContexts();
                if (selectedItems.length == 0) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_PLEASECHOOSE")
                    );
                    return;
                }

                var selectedRow = selectedItems[0].sPath.split("/")[1];
                var modelTable = this.getView().getModel("componentList");
                var rows = modelTable.oData;
                var rowInformation = rows[selectedRow];

                var params = {
                    "Param.1": rowInformation.BARCODE,
                    "Param.2": this.appData.user.userID,
                    "Param.3": this.appData.plant,
                    "Param.4": this.appData.selected.order.orderNo,
                    "Param.5": this.appData.node.nodeID,
                    "Param.6": this.appData.selected.operationNo,
                    "Param.7": rowInformation.CONSID,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/Operations/deleteCompXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callDeleteComp);
            },

            callDeleteComp: function (p_this, p_data) {
                sap.m.MessageToast.show("Kayıt Silindi");
                // p_this.handleCancel();
                p_this.getComponentDetails();
                // p_this.getBarcodeList();
                // var quality = this.getView().byId("comboboxSearch");
            },

            changeBarcodeInput: function (oEvent) {
                var line = oEvent
                    .getSource()
                    .getParent()
                    .getBindingContextPath()
                    .split("/modelData/rawMaterialData/")[1];
                var inputValue = oEvent.getSource()._getInputValue();
                var valueLength = inputValue.length;
                var objek = this.appData.characteristic.Row[0].OBJEK;
                var batchLineID = oEvent.getSource().sId;
                if (this.appData.plant == "3007") {
                    if (!inputValue.includes("|")) {
                        return;
                    }
                    let splittedArr = inputValue.split("|");
                    let batchNo = "";
                    let cmp_prd_ts = "";
                    if (splittedArr[0].length == 4) {
                        // Yeni Etiket
                        batchNo = splittedArr[2];
                    } else {
                        // Eski Etiket
                        batchNo = splittedArr[0];
                        cmp_prd_ts = splittedArr[7];
                    }

                    if (objek == "3007SCTEL1" || objek == "3007SCTEL2") {

                        var deletedBatchModel = this.getView().byId("checkDeletedBatch")?.getModel()?.getData();

                        // is Model empty?

                        if (!!deletedBatchModel) {

                            var filter = deletedBatchModel.filter((i) => i.BARCODE == batchNo)

                            if (!!!filter[0]) {
                                MessageBox.error("Tüketimi olan partinin okutulması zorunludur!");
                                return;
                            }                            
                        }
                    }


                    if (objek == "3007SCTEL1" || objek == "3007SCTEL2") {
                        var nodeID = this.appData.node.nodeID;
                        var response = TransactionCaller.sync(
                            "MES/Itelli/DNA/checkReadBeforeSCT/T_CHECK_BARCODE_READ", {
                            I_BATCH: batchNo,
                            I_NODE_ID: nodeID,
                            I_AUFNR: this.appData.selected.order.orderNo,
                            I_APRIO: this.appData.selected.operationNo
                        },
                            "O_JSON"
                        );
                        if (response[1] == "E") {
                            MessageBox.error(response[0]);
                            return;
                        } else {
                            this.handleAddConfirm(batchNo, line);
                            this.getView().byId(batchLineID).setValue(null);
                        }
                    }
                    else {
                        this.handleAddConfirm(batchNo, line, cmp_prd_ts);
                        this.getView().byId(oEvent.getSource().sId).setValue(null);
                    }
                } else if (valueLength == 10) {
                    this.handleAddConfirm(inputValue, line);
                }
            },

            handleCancel: function (oEvent) {
                //Filmaşin Çan Fırını Lokasyon Kontrolü
                var objek = this.appData.characteristic.Row[0].OBJEK;
                if (
                    this.oView.getDependents()[0] ==
                    this.oView.byId("getBarcodeInformation") &&
                    (objek == "2002FLMCAN1" ||
                        objek == "2002FLMCAN2" ||
                        objek == "2002FLMCAN3") &&
                    !this.checkLocationBeforeClose()

                ) {
                    return null;
                }

                if (objek == "3007DUMMY_MC") {
                    this.getView().byId("componentsTable").mAggregations.items[0].mAggregations.cells[3].setValue("");
                    this.getView().byId("componentsTable").mAggregations.items[0].mAggregations.cells[4].setSelectedKey("0");

                    this.getView().byId("componentsTable").mAggregations.items[1].mAggregations.cells[3].setValue("");
                    this.getView().byId("componentsTable").mAggregations.items[1].mAggregations.cells[4].setSelectedKey("0");
                }

                //Filmaşin Çan Fırını Lokasyon Kontrolü

                var dependentLength = this.oView.getDependents().length - 1;
                this.oView.getDependents()[dependentLength].destroyContent();
                this.oView.getDependents()[dependentLength].destroy();
                this.setFocusToBatchQuantity();
            },

            checkLocationBeforeClose: function () {
                var oTable = this.getView().byId("confirmTable");
                this.getComponentDetails();
                oTable.setBusy(true);
                oTable.setBusyIndicatorDelay(0);
                setTimeout(() => {
                    oTable.setBusy(false);
                    var dataList = this.getView().getModel("componentList").oData;
                    var tableItems = oTable.getItems();
                    var noLocationIndexes = dataList
                        .map(function (item, i) {
                            if (item.LOCATION == "X") return i;
                        })
                        .filter(function (item) {
                            return item != undefined;
                        });
                    tableItems.forEach((item) => item.removeStyleClass("errorComponent"));
                    if (noLocationIndexes.length > 0) {
                        for (i = 0; i < noLocationIndexes.length; i++)
                            tableItems[noLocationIndexes[i]].addStyleClass("errorComponent");
                        MessageBox.error("Kaydedilmemiş Lokasyonlar Var!");
                        return false;
                    } else {
                        var dependentLength = this.oView.getDependents().length - 1;
                        this.oView.getDependents()[dependentLength].destroyContent();
                        this.oView.getDependents()[dependentLength].destroy();
                    }
                }, 1200);
            },

            saveBarcodeParameters: function (oEvent) {
                var oTable = this.getView().byId("confirmTable");
                var selectedRow = oEvent
                    .getSource()
                    .getParent()
                    .oBindingContexts.componentList.sPath.substring(1);
                var oData = this.getView().getModel("componentList").oData[selectedRow];
                var BARCODE = oData.BARCODE;
                var LOCATION = oData.LOCATION;
                var PALET_NO = oData.PALET_NO;
                var MATNR = oData.MATNR;
                var params = {
                    "Param.1": BARCODE,
                    "Param.2": LOCATION,
                    "Param.3": PALET_NO,
                    "Param.4": MATNR,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/Operations/updateComponentConsumptionQry",
                    params
                );

                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                oTable.getItems()[selectedRow].removeStyleClass("errorComponent");
                this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS");
                //  oEvent.oSource.getParent().getParent().getParent().close();
                this.getView().byId("palletNoInput")?.destroy();
                this.getView().byId("locationSelect")?.destroy();
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
                //   this.appData.oDialog = oDialog;
                oDialog.open();
                this.getCastList(oEvent);
            },

            callCastList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "castModel");
            },

            handleDeletion: function (oEvent) {
                var oTable = this.getView().byId("detailsTable");

                for (var i = 0; i < oTable.getSelectedContextPaths().length; i++) {
                    var chosenRow = oTable
                        .getSelectedContextPaths()[i]
                        .split("/prodList/")[1];

                    var entryID = oTable.getModel().oData.prodList[chosenRow].ENTRY_ID;
                    var nodeID = this.appData.node.nodeID;
                    var params = {
                        I_ENTRYID: entryID,
                        I_NODEID: nodeID
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ComponentAssignment/deleteRawMaterialXquery",
                        params
                    );

                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                }
                this.refreshReported();
                this.handleExit();
            },
            handleExit: function () {
                this.appData.oDialog.destroy();
            },

            getChargeData: function () {
                var oModel = new sap.ui.model.json.JSONModel();
                var data = [{
                    CHARGE: 1
                }, {
                    CHARGE: 2
                }, {
                    CHARGE: 3
                }, {
                    CHARGE: 4
                }, {
                    CHARGE: 5
                },
                {
                    CHARGE: "Genel"
                }
                ];
                oModel.setData(data);
                this.getView().setModel(oModel, "chargeModel");
            },

            getCastList: function (oEvent) {
                var selectedRow = oEvent
                    .getSource()
                    .getParent()
                    .oBindingContexts.componentList.sPath.substring(1);
                var rows = this.getView().getModel("componentList").oData;
                var batchNo = rows[selectedRow].BARCODE;

                var plant = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var workcenterID = this.appData.node.workcenterID;
                var params = {
                    "Param.1": plant,
                    "Param.2": aufnr,
                    "Param.3": batchNo,
                    "Param.4": workcenterID,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getCastListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callCastList);
            },
            initializeToolbarButtons: function () {
                var yieldBasedConsumptionButton = this.byId(
                    "yieldBasedConsumptionButton"
                );
                var saveButton = this.byId("saveButton");
                if (
                    this.rawMaterialDataCollection &&
                    this.rawMaterialDataCollection.length > 0
                ) {
                    yieldBasedConsumptionButton.setEnabled(true);
                    saveButton.setEnabled(true);
                } else {
                    yieldBasedConsumptionButton.setEnabled(false);
                    saveButton.setEnabled(false);
                }
            },

            getProductionData: function () {

                var tempModel = [
                    {
                        "NAME": "Üretilen (Ton)",
                        "SCTEL1": 0,
                        "SCTEL2": 0,
                        "SCTEL3": 0,
                        "SCTEL4": 0,
                        "TOTAL": 0
                    },
                    {
                        "NAME": "HURDA",
                        "SCTEL1": 0,
                        "SCTEL2": 0,
                        "SCTEL3": 0,
                        "SCTEL4": 0,
                        "TOTAL": 0
                    },
            
                ];
            
                var responseQTY = TransactionCaller.sync(
                    "MES/Itelli/DNA/CombinedProductionSCT/getProductionDataSCT",
                    {
                        I_AUFNR: this.appData.selected.order.orderNo,
                    },
                    "O_JSON"
                );
                var modelArr = Array.isArray(responseQTY[0].Rowsets.Rowset.Row) ? responseQTY[0].Rowsets.Rowset.Row : new Array(responseQTY[0].Rowsets.Rowset.Row);
                var totalGQ = 0;
                var totalSCRAP = 0;
            
                if (!!modelArr[0]) {
                    var QTYfilter = modelArr.filter((i) => (i.DC_ELEMENT == "GOOD_QUANTITY"));
                    if (!!QTYfilter) {
                        for (var i = 0; i < QTYfilter.length; i++) {
                            var totalGQ = QTYfilter[i].TOTAL_QTY + totalGQ;
                        }
                        tempModel[0].TOTAL = totalGQ;
                        this.appData.selected.sctTotalQuantity = totalGQ;
                        this.appData.selected.sctRemainingQty = this.appData.selected.quantityReleased - this.appData.selected.sctTotalQuantity;
                    }
                }
                if (!!modelArr[0]) {
                    var QTYfilter = modelArr.filter((i) => (i.DC_ELEMENT == "SCRAP"));
                    if (!!QTYfilter) {
                        for (var i = 0; i < QTYfilter.length; i++) {
                            var totalSCRAP = QTYfilter[i].TOTAL_QTY + totalSCRAP;
                        }
                        tempModel[1].TOTAL = totalSCRAP;
                    }
                }
                if (!!modelArr[0]) {
                    var sctel1Filter = modelArr.filter((i) => (i.DC_ELEMENT == "GOOD_QUANTITY" && i.NAME == "SCTEL1"));
                    if (!!sctel1Filter[0]) {
                        tempModel[0].SCTEL1 = sctel1Filter[0]?.TOTAL_QTY;
                    }
            
                    var sctel2Filter = modelArr.filter((i) => (i.DC_ELEMENT == "GOOD_QUANTITY" && i.NAME == "SCTEL2"));
                    if (!!sctel2Filter[0]) {
                        tempModel[0].SCTEL2 = sctel2Filter[0]?.TOTAL_QTY;
                    }
            
                    var sctel3Filter = modelArr.filter((i) => (i.DC_ELEMENT == "GOOD_QUANTITY" && i.NAME == "SCTEL3"));
                    if (!!sctel3Filter[0]) {
                        tempModel[0].SCTEL3 = sctel3Filter[0]?.TOTAL_QTY;
                    }
            
                    var sctel4Filter = modelArr.filter((i) => (i.DC_ELEMENT == "GOOD_QUANTITY" && i.NAME == "SCTEL4"));
                    if (!!sctel4Filter[0]) {
                        tempModel[0].SCTEL4 = sctel4Filter[0]?.TOTAL_QTY;
                    }
            
                }
            
                if (!!modelArr[0]) {
                    var sctel1FilterS = modelArr.filter((i) => (i.DC_ELEMENT == "SCRAP" && i.NAME == "SCTEL1"));
                    if (!!sctel1FilterS[0]) {
                        tempModel[1].SCTEL1 = sctel1FilterS[0]?.TOTAL_QTY;
                    }
            
                    var sctel2FilterS = modelArr.filter((i) => (i.DC_ELEMENT == "SCRAP" && i.NAME == "SCTEL2"));
                    if (!!sctel2FilterS[0]) {
                        tempModel[1].SCTEL2 = sctel2FilterS[0]?.TOTAL_QTY;
                    }
            
                    var sctel3FilterS = modelArr.filter((i) => (i.DC_ELEMENT == "SCRAP" && i.NAME == "SCTEL3"));
                    if (!!sctel3FilterS[0]) {
                        tempModel[1].SCTEL3 = sctel3FilterS[0]?.TOTAL_QTY;
                    }
            
                    var sctel4FilterS = modelArr.filter((i) => (i.DC_ELEMENT == "SCRAP" && i.NAME == "SCTEL4"));
                    if (!!sctel4FilterS[0]) {
                        tempModel[1].SCTEL4 = sctel4FilterS[0]?.TOTAL_QTY;
                    }
            
                }
                var tableModel = new sap.ui.model.json.JSONModel(tempModel);
                this.getView().byId("idGetProductionData").setModel(tableModel);
            
            
            },
        });
    }
);