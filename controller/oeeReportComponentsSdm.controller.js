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
        customScript
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
        var oDialog;
        return Controller.extend("customActivity/controller/oeeReportComponentsSdm", {
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
                var self = this;
                this.intervalHandle = setInterval(function () {
                    if (window.location.hash == "#/activity/ZACT_RAW_MAT") {
                        self.getAllCharacteristic();
                    }
                }, 3000);


                //this.getNewMaterialData();
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
                this.bindDataToCard();

                sap.oee.ui.Utils.attachChangeOrderDetails(
                    this.appComponent,
                    "orderCardFragment",
                    this
                );
                this.getVisibleCharacteristic();
                this.getAllCharacteristic();
                //this.getAllQuantityTon();
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
                if (
                    this.appData.plant == "3007" &&
                    this.appData.node.description.includes("Fosfat")
                ) {
                    this.getView().byId("idPage").setShowFooter(false);
                }
                // this.getComponentDetails();

                //	this.bindRawMaterialsToDialog();
            },
            slashFunction: function (inputValue) {
                return (!inputValue) ? "" : " / " + inputValue;
            },
            /*
                                                                              bindRawMaterialsToDialog : function(){
                                                                                  this.rawMaterialsReportingModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);	
                                                                                  this.oDialog.setModel(this.rawMaterialsReportingModel);
                                                                              },*/


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
                    "Param.2": this.appData.plant,
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

            onPressGetTagValues: function () {

                var params = {
                    I_PLANT: this.appData.plant,
                    I_NODE_ID: this.appData.node.nodeID,
                    I_RELEASED_ID: this.appData.selected.releasedID
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/TagValues/getTagValuesXqry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                /*
                                  if(oData[0].Row){
            	
                                      return oData[0].Row[0];
            	
                                  }
                                  */
                var tableData = this.getView().byId("componentsTable").getModel();
                //oModel.setData(tableData);

                var rows = tableData.oData.modelData.rawMaterialData;

                for (i = 0; i < rows?.length; i++) {

                    if (this.appData.plant == "3001") {
                        //3001_AO
                        if (rows[i].matID == "1054" && oData[0].Row[0].AO_TOZ_KARBON != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].AO_TOZ_KARBON;
                            rows[i].QUANTITY_BOOELEAN = true;
                        }    
                    }
                    
                    if (this.appData.plant == "2001") {
                        //2001_AO
                        if (rows[i].matID == "1054" && oData[0].Row[0].ENJEKTE_ANTRASIT != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].ENJEKTE_ANTRASIT;
                            rows[i].QUANTITY_BOOELEAN = true;
                        }
                        //2001_AO
                        if (rows[i].matID == "1058" && oData[0].Row[0].ENJEKTE_KIREC != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].ENJEKTE_KIREC;
                            rows[i].QUANTITY_BOOELEAN = true;
                        }

                        //2001_AO
                        if (rows[i].matID == "1056" && oData[0].Row[0].GRANKOK != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].GRANKOK;
                        }

                        //2001_AO-1053 İLE YER DEĞİŞTİRİLDİ
                        if (rows[i].matID == "1056" && oData[0].Row[0].KIREC != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].KIREC;
                        }


                        //2001_PO
                        if (rows[i].matID == "1013" && oData[0].Row[0].BOKSIT != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].BOKSIT;
                        }
                        //2001_PO
                        if (rows[i].matID == "1029" && oData[0].Row[0].FEP != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FEP;
                        }
                        //2001_PO                                    
                        if (rows[i].matID == "1019" && oData[0].Row[0].FEMNLC != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FEMNLC;
                        }
                        //2001_PO          
                        if (rows[i].matID == "1035" && oData[0].Row[0].FEMO != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FEMO;
                        }
                        //2001_PO matID KONTROL EDİLECEK
                        if (rows[i].matID == "1017" && oData[0].Row[0].FESIMNLC != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FESIMNLC;
                        }
                        //2001_PO
                        if (rows[i].matID == "1018" && oData[0].Row[0].FESILAI != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FESILAI;
                        }
                        //2001_PO
                        if (rows[i].matID == "1016" && oData[0].Row[0].FECRHC != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FECRHC;
                        }
                        //2001_PO matID KONTROL EDİLECEK
                        if (rows[i].matID == "1009" && oData[0].Row[0].FLORIT != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FLORIT;
                        }
                        //2001_PO matID KONTROL EDİLECEK
                        if (rows[i].matID == "1022" && oData[0].Row[0].FESI != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FESI;
                        }
                        //2001_PO matID KONTROL EDİLECEK
                        if (rows[i].matID == "1026" && oData[0].Row[0].FESIMN != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FESIMN;
                        }
                        //2001_PO matID KONTROL EDİLECEK
                        if (rows[i].matID == "1020" && oData[0].Row[0].FEMNHC != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].FEMNHC;
                        }
                        //2001_PO matID KONTROL EDİLECEK
                        if (rows[i].matID == "1052" && oData[0].Row[0].ANTRASITDAZOTLU != "NA") {
                            rows[i].qtyReportedNew = oData[0].Row[0].ANTRASITDAZOTLU;
                            rows[i].QUANTITY_BOOELEAN = true;
                        }
                    }

                }
                tableData.refresh();
            },












            /*getNewMaterialData: function () {
	
                var params = { 
              "Param.1": this.appData.node.nodeID,
                    "Param.2": this.appData.selected.order.orderNo,
                    "Param.3": this.appData.selected.operationNo
                    };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/ReportConsumptionLang/T_getConsumptionLangXqry", params);
               if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
 var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        var panelJSON = [];
        var rows = oData[0].Row;

        panelJSON = [
          { MAKTX: "AL", AL: {} },
          { MAKTX: "AL_CURUFU", AL_CURUFU: {} },
          { MAKTX: "AL_GRANUL", AL_GRANUL: {} },
          { MAKTX: "AZOTSUZ_C", AZOTSUZ_C: {} },
          { MAKTX: "BOKSIT", BOKSIT: {} },
          { MAKTX: "C", C: {} },
          { MAKTX: "CAF2", CAF2: {} },
          { MAKTX: "CAO", CAO: {} },
          { MAKTX: "CASI", CASI: {} },
          { MAKTX: "CA_SOLID_TEL", CA_SOLID_TEL: {} },
          { MAKTX: "FECRHC", FECRHC: {} },
          { MAKTX: "FEMNHC", FEMNHC: {} },
          { MAKTX: "FEMNLOWC", FEMNLOWC: {} },
          { MAKTX: "FESI70", FESI70: {} },
          { MAKTX: "FESILOWAL", FESILOWAL: {} },
          { MAKTX: "FESIMN6030", FESIMN6030: {} },          
          { MAKTX: "FESIMN70", FESIMN70: {} },
          { MAKTX: "FETI", FETI: {} },
          //{ MAKTX: "K-140-11,90-S220-AC-X-DILER", K-140-11,90-S220-AC-X-DILER: {} },
          { MAKTX: "KOLAMANIT", KOLAMANIT: {} },
          { MAKTX: "SILISKUMU", SILISKUMU: {} },
          { MAKTX: "SIVI_ÇELİK_EŞ_Ü", SIVI_ÇELİK_EŞ_Ü: {} },
          { MAKTX: "SIVI_ÇELİK_EŞ_Ü", SIVI_ÇELİK_EŞ_Ü: {} },
          { MAKTX: "SIVI_ÇELİK_HURDASI", SIVI_ÇELİK_HURDASI: {} },
        ];

        for (var i = 0; i < rows.length; i++) {
          for (var k = 0; k < panelJSON.length; k++) {
            if (rows[i].MAKTX == panelJSON[k].MAKTX)
              panelJSON[k][rows[i].MAKTX][
                Object.keys(panelJSON[k][rows[i].MAKTX]).length
              ] = rows[i];
          }
        }
	
        oModel.setData(panelJSON);
        this.getView().setModel(oModel, "panelsJSON");
        var table = this.byId("componentsTable");
        if (table != undefined) table.setModel(oModel);
        return oData;

            },*/


            getAllCharacteristic: function () {
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
                    this.getView().getModel("allCharacteristicModel").oData.Ordes2 = oData2[0].Row[0]
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
                this.appData.visibleJSON = visibleJSON[0];
                this.appData.characteristic = oData;
                this.appData.customizationVisible =
                    this.appData.customizationValues[this.appData.node.nodeID];
            },

            increaseCycleNo: function (oEvent) {
                var pModel = this.getView().getModel("cycleNo");
                var pData = pModel.getData();
                var cyc = pData.Row[0].CHAR_VALUE;
                var plant = this.appData.plant;
                var oData;
                //ERP Grup No - Çevrim No Kontrolü
                var erpGrupNo =
                    this.getView().getModel("erpGroupNo").oData.Row[0].GRUP_NO;
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
                        rawMaterialDataRecord.defaultUOMText =
                            this.interfaces.interfacesGetTextForUOM(
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
                oModel_rawMaterialsModel.setData({
                    modelData: modelData
                });

                for (var i = 0; i < oModel_rawMaterialsModel.oData.modelData.rawMaterialData.length; i++) {
                    var params = {
                        "Param.1": this.appData.node.nodeID,
                        "Param.2": this.appData.selected.order.orderNo,
                        "Param.3": this.appData.selected.operationNo,
                        "Param.4": tableData[i].matID
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantity/ReportConsumptionLang/T_getConsumptionLangXqry", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    var oData = tRunner.GetJSONData();

                    if (oData[0].Row != undefined) {
                        oModel_rawMaterialsModel.oData.modelData.rawMaterialData[i].MAKTX = oData[0].Row[0].MAKTX;
                    }


                }


                this.byId("componentsTable").setModel(oModel_rawMaterialsModel);

                this.initializeToolbarButtons();
            },

            getDataCollectionElementsForRawMaterial: function () {
                this.key = this.STANDALONE;
                this.rawMaterialDataCollectionElements =
                    this.interfaces.getDataCollectionElementsForRawMaterial(
                        this.appData.client,
                        this.key
                    );
            },

            bindDataCollectionElementsToIconTabBar: function () {
                var oModel_DataCollectionElementsModel =
                    new sap.ui.model.json.JSONModel();
                oModel_DataCollectionElementsModel.setData({
                    rawMaterialDataCollectionElements: this.rawMaterialDataCollectionElements.dataCollectionElements
                        .results,
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
                                var defaultDCE =
                                    this.getView().getViewData().viewOptions[i]
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

                var activityOptionValuesForDefaultFilters =
                    this.getActivityOptionValues(
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
                            this.rawMaterialDataCollection[i].dcElement =
                                this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                    this.selectedRawMaterialDCEIndex
                                ].dcElement;
                            this.rawMaterialDataCollection[i].timeElementcategory =
                                this.rawMaterialDataCollectionElements.dataCollectionElements.results[
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

                    var rawMaterialDataCollectionTemp =
                        this.interfaces.getRawMaterialsForYieldBasedConsumption(
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
                            this.rawMaterialDataCollection[i].dcElement =
                                this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                    this.selectedRawMaterialDCEIndex
                                ].dcElement;
                            this.rawMaterialDataCollection[i].timeElementcategory =
                                this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                    this.selectedRawMaterialDCEIndex
                                ].timeElementcategory;
                            this.rawMaterialDataCollection[i].qtyReportedNew = parseFloat(
                                this.rawMaterialDataCollection[i].qtyReq
                            );
                            this.rawMaterialDataCollection[i].defaultUOMText =
                                this.interfaces.interfacesGetTextForUOM(
                                    this.rawMaterialDataCollection[i].defaultUOM
                                );
                            this.rawMaterialDataCollection[i].reasonCodeData = {};
                        }
                    }
                }
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
                            rawMaterialData.dcElement =
                                this.rawMaterialDataCollectionElements.dataCollectionElements.results[
                                    this.selectedRawMaterialDCEIndex
                                ].dcElement;
                            rawMaterialData.material =
                                this.rawMaterialDataCollection[i].matID;
                            rawMaterialData.quantity =
                                "" + this.rawMaterialDataCollection[i].qtyReportedNew;
                            rawMaterialData.uom =
                                this.rawMaterialDataCollection[i].defaultUOM;
                            rawMaterialData.comments =
                                this.rawMaterialDataCollection[i].comments;
                            rawMaterialData.dcElementType = "OTHER_QUANTITY";

                            if (
                                this.rawMaterialDataCollection[i].reasonCodeData != undefined
                            ) {
                                rawMaterialData.rc1 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode1;
                                rawMaterialData.rc2 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode2;
                                rawMaterialData.rc3 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode3;
                                rawMaterialData.rc4 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode4;
                                rawMaterialData.rc5 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode5;
                                rawMaterialData.rc6 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode6;
                                rawMaterialData.rc7 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode7;
                                rawMaterialData.rc8 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode8;
                                rawMaterialData.rc9 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode9;
                                rawMaterialData.rc10 =
                                    this.rawMaterialDataCollection[i].reasonCodeData.reasonCode10;
                            }
                            if (this.rawMaterialDataCollection[i].batchRelevant) {
                                if (
                                    this.rawMaterialDataCollection[i].batchNumber != undefined &&
                                    this.rawMaterialDataCollection[i].batchNumber != ""
                                ) {
                                    rawMaterialData.batchNo =
                                        this.rawMaterialDataCollection[i].batchNumber;
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
                                rawMaterialData.serialNo =
                                    this.rawMaterialDataCollection[i].serialNumber;
                            }

                            var currentTime = new Date().getTime();
                            var shiftEndTime = this.appData.shift.endTimestamp;
                            var shiftStartTime = this.appData.shift.startTimestamp;

                            if (currentTime < shiftEndTime) {
                                rawMaterialData.startTimestamp = currentTime;
                                rawMaterialData.endTimestamp = currentTime;
                            } else {
                                var mostRecentReportingTime =
                                    sap.oee.ui.Utils.getMostRecentReportingTime(
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
                //this.getShowDetailsRecords();

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
                this.getShowDetailsRecords(bindingContext.MAKTX);
            },

            getShowDetailsRecords: function (MAKTX) {
                var oModel = new sap.ui.model.json.JSONModel();
                var runID = this.appData.selected.runID;
                var chargeID = "";
                var plant = this.appData.plant;

                if (this.getView().byId("chargeID").getVisible())
                    chargeID = this.getView().byId("chargeID").getSelectedKey();

                var params = {
                    "Param.1": runID,
                    "Param.2": MAKTX,
                    "Param.3": chargeID,
                    "Param.4": plant
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

                    var runID = this.appData.selected.runID;
                    var plant = this.appData.plant;
                    var params = {
                        "Param.1": runID,
                        "Param.2": plant
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ComponentAssignment/isClosedCastID",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    var oData = tRunner.GetJSONData();
                    if (!oData[0].Row) {
                        sap.m.MessageToast.show("Döküm SDM tarafından kapatılmış.\nİşlem yapılamaz");
                        return;
                    }

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
                                MATNR: data[i].matID,
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
                var oModel_yieldBasedConsumptionModel =
                    new sap.ui.model.json.JSONModel();
                var yieldBasedConsumptionData = {};
                yieldBasedConsumptionData.rawMaterialData =
                    this.rawMaterialDataCollection;
                yieldBasedConsumptionData.qty = "";
                yieldBasedConsumptionData.uom =
                    this.appData.selected.quantityReleasedUOM;
                yieldBasedConsumptionData.description =
                    this.interfaces.interfacesGetTextForUOM(
                        this.appData.selected.quantityReleasedUOM
                    );
                yieldBasedConsumptionData.visibilitySpecificData =
                    this.visibilitySpecificData;

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
                var yieldBasedConsumptionData =
                    this.yieldBasedConsumptionModel.getData();
                var qty = yieldBasedConsumptionData.yieldBasedConsumptionData.qty;
                var uom = yieldBasedConsumptionData.yieldBasedConsumptionData.uom;
                var description =
                    yieldBasedConsumptionData.yieldBasedConsumptionData.description;
                this.getRawMaterialsForSelection(qty, uom);
                yieldBasedConsumptionData.rawMaterialData =
                    this.rawMaterialDataCollection;
                yieldBasedConsumptionData.qty = qty;
                yieldBasedConsumptionData.uom = uom;
                yieldBasedConsumptionData.description = description;
                yieldBasedConsumptionData.visibilitySpecificData =
                    this.visibilitySpecificData;
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
                modelData.yieldBasedConsumptionData.uom =
                    this.appData.selected.quantityReleasedUOM;
                modelData.yieldBasedConsumptionData.description =
                    this.interfaces.interfacesGetTextForUOM(
                        this.appData.selected.quantityReleasedUOM
                    );
                sap.oee.ui.Utils.updateModel(this.yieldBasedConsumptionModel);
            },

            checkIfLossType: function (obj) {
                return obj == sap.oee.ui.oeeConstants.timeElementCategoryForLoss;
            },

            onClickOpenReasonCodeUtilityPopup: function (oEvent) {
                var reasonCodeLink = oEvent.getSource();
                var selectedElement = oEvent
                    .getSource()
                    .getBindingContext()
                    .getObject().dcElement;
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

            handleAddConfirm: function (inputValue, line) {
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
                    erpGrupNo =
                        this.getView().getModel("erpGroupNo").oData.Row[0].GRUP_NO;
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
                if (
                    objekID == "2002FLMCAN1" ||
                    objekID == "2002FLMCAN2" ||
                    objekID == "2002FLMCAN3"
                ) {
                    if (this.getView().getModel("cycleNo").oData.Row != undefined)
                        cycleNo =
                            this.getView().getModel("cycleNo").oData.Row[0].CHAR_VALUE;
                }

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

                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "customActivity.fragmentView.getBarcodeInformation",
                    this
                );
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
                if (rows != undefined) {
                    var werks = p_this.appData.plant;
                    var workcenterID = p_this.appData.node.workcenterID;
                    var aufnr = p_this.appData.selected.order.orderNo;
                    var boolean;

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
                }
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData);
                p_this.getView().setModel(oModel, "componentList");
            },

            getComponentDetails: function () {
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;

                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterID,
                    "Param.3": aufnr,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/getComponentListQry",
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
                if (this.appData.plant == "3007") {
                    if (!inputValue.includes("|")) {
                        return;
                    }
                    let splittedArr = inputValue.split("|");
                    let batchNo = "";
                    if (splittedArr[0].length == 4) {
                        // Yeni Etiket
                        batchNo = splittedArr[2];
                    } else {
                        // Eski Etiket
                        batchNo = splittedArr[0];
                    }
                    this.handleAddConfirm(batchNo, line);
                    this.getView().byId(oEvent.getSource().sId).setValue(null);
                } else if (valueLength == 10) {
                    this.handleAddConfirm(inputValue, line);
                }

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
                    "Param.1": data[20].batchNumber,
                    "Param.2": plant,
                    I_SUMQUANTITY: sumQuantity
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ComponentAssignment/batchQuantityControleQry",
                    params
                );

                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var jsData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(jsData[0].Row);
                this.getView().setModel(oModel, "UOMmodel");

                if (sumQuantity > this.getView().getModel("UOMmodel").oData[0].QUANTITY) {
                    sap.m.MessageToast.show("Miktar aşıldı: " + data[20].batchNumber + " partisine girilebilecek en yüksek miktar = " + jsData[0].Row[0].QUANTITY + " ");
                    //return null;
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

                //Filmaşin Çan Fırını Lokasyon Kontrolü

                var dependentLength = this.oView.getDependents().length - 1;
                this.oView.getDependents()[dependentLength].destroyContent();
                this.oView.getDependents()[dependentLength].destroy();
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
                        .getSelectedContextPaths()[i].split("/prodList/")[1];

                    var castID = this.getView().getModel("allCharacteristicModel").oData.CASTID;
                    var plant = this.appData.plant;
                    var entryID = oTable.getModel().oData.prodList[chosenRow].ENTRY_ID;
                    var nodeID = this.appData.node.nodeID;
                    var params = {
                        I_ENTRYID: entryID,
                        I_NODEID: nodeID,
                        I_CASTID: castID,
                        I_PLANT: plant
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
                this.handleExitPopup();

            },

            handleExitPopup: function () {
                this.appData.oDialog.destroy();
            },

            getChargeData: function () {
                var oModel = new sap.ui.model.json.JSONModel();
                var data = [{
                    CHARGE: 1
                },
                {
                    CHARGE: 2
                },
                {
                    CHARGE: 3
                },
                {
                    CHARGE: 4
                },
                {
                    CHARGE: 5
                },
                {
                    CHARGE: "Genel"
                },
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
                    "Param.2": this.appData.node.nodeID
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
                    "Param.2": this.appData.node.nodeID
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
                    "Param.1": plant,
                    "Param.2": castID,
                    "Param.3": note,
                    "Param.4": columnName
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/General/updateZmpmCreateCastNoteQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                sap.m.MessageToast.show("Başarılı");
                this.handleExit(oEvent);
                //this.oeeRefreshActivity();
            },

            handleExit: function (oEvent) {
                // this.getView().byId("castNote").destroy();
                oEvent.getSource().getParent().close();
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
                    I_NOTIFDESC: note,
                    I_USER: user,
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
            handleTitleSelectorPress: function () {
                var ordersModel = new sap.ui.model.json.JSONModel();
                var outputOrderStatusList = this.interfaces.interfacesGetOrderStatusForRunsStartedInShiftInputSync(this.appData.node.nodeID, this.appData.client, this.appData.plant, this.appData.shift.shiftID, this.appData.shift.shiftGrouping, this.appData.shift.startTimestamp, this.appData.shift.endTimestamp, false);
                if (outputOrderStatusList != undefined) {
                    if (outputOrderStatusList.orderStatusList != undefined) {
                        if (outputOrderStatusList.orderStatusList.results != undefined) {
                            if (outputOrderStatusList.orderStatusList.results.length != 0) {
                                ordersModel.setData({
                                    orders: outputOrderStatusList.orderStatusList.results
                                });
                                for (var i = 0; i < ordersModel.oData.orders.length; i++) {
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
                                    outputOrderStatusList.orderStatusList.results[i]["CASTID"] = jsData[0].Row[0].CASTID

                                }
                            }
                        }
                    }
                }

                if (this.oPopOver == undefined) {
                    this.oPopOver = sap.ui.xmlfragment("popoverReport", "sap.oee.ui.fragments.orderChangeDialog", this);
                    this.oPopOver.setTitle(this.appComponent.oBundle.getText("OEE_HEADING_SELECT_ORDER"));
                    var buttonTemplate = new sap.m.ObjectListItem({
                        title: "{parts : [{path: 'order'},{path: 'CASTID'}], formatter : 'sap.oee.ui.Formatter.formatOrderNumber'}",
                        attributes: [new sap.m.ObjectAttribute({
                            text: "{material_desc}"
                        }), new sap.m.ObjectAttribute({
                            text: "{parts : [{path: 'orderStartTimestamp'},{path: 'appData>/plantTimezoneOffset'},{path : 'appData>/plantTimezoneKey'}], formatter : 'sap.oee.ui.Formatter.formatTimeStampWithoutLabel'}"
                        })],
                        type: "Active",
                        firstStatus: new sap.m.ObjectStatus({
                            text: "{parts : [{path: 'statusDescription'},{path: 'productionActivity'}], formatter : 'sap.oee.ui.Formatter.formatStatusTextAndActivity'}"
                        })
                    });

                    this.oPopOver.bindAggregation("items", "/orders", buttonTemplate);
                    this.oPopOver.attachConfirm(this.selectOrder, this);
                    this.oPopOver.attachSearch(this.orderSearch, this);
                    this.oPopOver.attachLiveChange(this.orderSearch, this);
                }

                this.oPopOver.setModel(ordersModel);
                this.oPopOver.open();
            },
            selectOrder: function (oEvent) {
                var oSource = oEvent.getParameter("selectedItem");
                if (oSource != undefined) {
                    var sRunID = oSource.getBindingContext().getProperty("runID");
                    if (sRunID != undefined) {
                        this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChange", {
                            runID: sRunID
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

                sap.oee.ui.Utils.fuzzySearch(this, this.oPopOver.getModel(), oEvent.getParameter("value"),
                    this.oPopOver.getBinding("items"), oEvent.getSource(), properties);
            },
            openFrgBatch: function (oEvent) {
                var oView = this.getView();
                oDialog = oView.byId("batchQty");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.reportCompBatch",
                        this
                    );
                    oView.addDependent(oDialog);
                }



                var path = oEvent.getSource().getBindingContext().getPath();
                path = path.split("/")[3];
                this.appData.path = path;
                var allData = oEvent.getSource().getModel().getData();
                var matData = allData.modelData.rawMaterialData[path].matID;

                var nodeID = this.appData.node.nodeID;
                var plant = this.appData.plant;

                var params = {
                    "Param.1": matData,
                    "Param.2": plant
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/getbatchQtyQry", params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return false;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new JSONModel();
                oModel.setData(oData);
                this.getView().byId("tblBacthQty").setModel(oModel);
                this.getView().setModel(oModel, "BacthQty");
                oDialog.open();


                var oModel = this.getView().getModel("BacthQty");
                var length = oModel.oData[0].Row.length;
                var cellLength = this.getView().byId("tblBacthQty").mAggregations.items[0].mAggregations.cells.length;
                var sId;
                for (var i = 0; i < length; i++) {
                    sId = this.getView().byId("tblBacthQty").mAggregations.items[i].sId;
                    if (oModel.oData[0].Row[i].STATUS == "Başarılı") {
                        for (var j = 0; j < cellLength; j++) {
                            document.getElementById(sId).style.backgroundColor = "#b5e7a0";

                        }
                        continue;
                    }
                    if (oModel.oData[0].Row[i].STATUS == "Başarısız") {
                        for (var j = 0; j < cellLength; j++) {
                            document.getElementById(sId).style.backgroundColor = "lightcoral";

                        }
                        continue;
                    }


                }


            },
            handleCloseBtn: function () {

                oDialog.close();
            },

            AssignDoc: function () {

                var doc = this.getTableSelected("tblBacthQty", "BATCH_NO");

            },

            getTableSelected: function (id, tparam) {

                var inputs = "";
                var doc;
                var spath;
                var table = this.getView().byId(id);
                var path = table.getSelectedContextPaths();
                var tableitems = table.getItems().length;
                var tableLength = path.length;

                for (var i = 0; i <= tableLength - 1; i++) {

                    spath = path[i].slice(path[i].lastIndexOf("/") + 1, path[i].length);

                    doc = table.getModel().oData[0].Row[spath][tparam];

                    if (inputs == "")
                        inputs = doc;
                    else
                        inputs += "," + doc;
                }
                return inputs;

            },
            onSaveBatch: function () {
                var row = this.appData.path;
                var batchNo = this.getTableSelected("tblBacthQty", "BATCH_NO");
                var statu = this.getTableSelected("tblBacthQty", "MESSAGE")
                if(statu != '') {
                    MessageBox.error("Başarısız teyit seçilemez. Teyidi kontrol ediniz.")
                    return;
                }
                this.getView().byId("componentsTable").getModel().oData.modelData.rawMaterialData[row].batchNumber = batchNo;

                this.handleCloseBtn();
                this.bindRawMaterialsToTable();
            },
        });
    }
);