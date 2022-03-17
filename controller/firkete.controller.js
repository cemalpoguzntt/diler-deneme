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
        return Controller.extend("customActivity/controller/firkete", {

            onInit: function () {
                var that = this;
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.screenAllValue = [{}];
                this.screenObj = [];
                this.screenObj.inputChar = [];
                this.infoArr = [];
                this.appData.intervalState = true;
                this.modelServices();
                this.getVisibleStatusCharacteristic();
                this.getOrderCharacteristics();
                this.getEWMData();
                this.reloadProdTable();
            },
            onAfterRendering: function() {
                this.setFocusToBacth();
            },
            setFocusToBacth: function() {
                setTimeout(function setFocus() {   
                    this.byId("input0").focus();
                }, 0);
            },
            modelServices: function () {

                oTrigger = new sap.ui.core.IntervalTrigger(5000);
                oTrigger.addListener(() => {
                    if (this.appData.intervalState) {
                        this.reloadProdTable();
                        this.reloadProdTable2();
                    }
                    console.log("interval çalışıyor");
                }, this);
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
                    if (oData[0].Row[i].ATNAM == "ZMII_TEYIT_KARAKTERISTIK")
                        visibleJSON[0][oData[0].Row[i].VALUE] = oData[0].Row[i].VALUE;
                }
                this.appData.visibleJSON = visibleJSON[0];
                this.appData.characteristic = oData;
                this.appData.customizationVisible = this.appData.customizationValues[
                    this.appData.node.nodeID
                ];
            },
            getOrderCharacteristics: function () {
                var aufnr = this.appData.selected.order.orderNo;
                var kdauf = this.appData.selected.order.salesOrderNo;
                var menge = this.appData.selected.order.releasedQuantity;
                var plant = this.appData.plant;
                var bag_tel_chr = "";

                if(plant == "2001") {
                    bag_tel_chr = "Y_BAG_TELI_8MM";
                } else if (plant == "3001") {
                    bag_tel_chr = "Y_BAG_TELI_YUV_12MM";
                }

                if (aufnr == undefined) {
                    aufnr = "";
                }
                if (kdauf == undefined) {
                    kdauf = "";
                }
                if (menge == undefined) {
                    menge = "";
                }

                TransactionCaller.async("MES/Itelli/Firkete/Characteristic/getOrderCharacteristicsT", {
                    I_AUFNR: aufnr,
                    I_KDAUF: kdauf,
                    I_MENGE: menge,
                    I_BAG_TEL_CHR: bag_tel_chr
                },
                    "O_JSON",
                    this.getOrderCharacteristicsCB,
                    this,
                    "GET"
                );
            },
            getOrderCharacteristicsCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var modelArr = Array.isArray(iv_data[0].Rowsets?.Rowset?.Row) ? iv_data[0].Rowsets?.Rowset?.Row : new Array(iv_data[0].Rowsets?.Rowset?.Row);
                var myModel = new sap.ui.model.json.JSONModel(modelArr);

                iv_scope.getView().byId("tableOrderInfo").setModel(myModel);
                iv_scope.getView().byId("tableOrderInfo2").setModel(myModel);
            },
            reloadProdTable: function () {
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var aufnr = this.appData.selected.order.orderNo;

                TransactionCaller.async("MES/Itelli/Firkete/ProdTable/T_GET_PROD_TABLE", {
                    I_CLIENT: client,
                    I_PLANT: plant,
                    I_NODE_ID: nodeID,
                    I_AUFNR: aufnr,
                },
                    "O_JSON",
                    this.reloadProdTableCB,
                    this,
                    "GET"
                );

                TransactionCaller.async("MES/Itelli/Firkete/ProdTotal/T_GET_PROD_TOTAL", {
                    I_CLIENT: client,
                    I_PLANT: plant,
                    I_NODE_ID: nodeID,
                    I_AUFNR: aufnr,
                },
                    "O_JSON",
                    this.reloadProdTotalCB,
                    this,
                    "GET"
                );
            },
            reloadProdTableCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var modelArr = Array.isArray(iv_data[0].Rowsets?.Rowset?.Row) ? iv_data[0].Rowsets?.Rowset?.Row : new Array(iv_data[0].Rowsets?.Rowset?.Row);
                var myModel = new sap.ui.model.json.JSONModel(modelArr);

                iv_scope.getView().byId("tableReportedTie").setModel(myModel);
            },
            reloadProdTotalCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var modelArr = Array.isArray(iv_data[0].Rowsets?.Rowset?.Row) ? iv_data[0].Rowsets?.Rowset?.Row : new Array(iv_data[0].Rowsets?.Rowset?.Row);
                var myModel = new sap.ui.model.json.JSONModel(modelArr);

                var totalCount = iv_data[0].Rowsets.Rowset.Row.GOOD_COUNT;
                var totalQuantity = iv_data[0].Rowsets.Rowset.Row.GOOD_QUANTITY;
                var totalScrapCount = iv_data[0].Rowsets.Rowset.Row.SCRAP_COUNT;            // Hurda adedi ekranda istenilirse bu kullanılabilir.
                var totalScrapQuantity = iv_data[0].Rowsets.Rowset.Row.SCRAP_QUANTITY;

                iv_scope.getView().byId("label16").setText(totalCount);
                iv_scope.getView().byId("label18").setText(totalQuantity);
                iv_scope.getView().byId("label39").setText(totalScrapQuantity);
            },

            getEWMData: function () {
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;

                TransactionCaller.async("MES/Itelli/Firkete/EWM/T_GET_EWM_DEPO", {
                    I_WERKS: plant,
                    I_CLIENT: client,
                    I_NODEID: nodeID
                },
                    "O_JSON",
                    this.getEWMDataCB,
                    this,
                    "GET"
                );
            },
            getEWMDataCB: function (iv_data, iv_scope) {
                var objek = iv_scope.appData.characteristic[0].Row[0].OBJEK;
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var modelArr = Array.isArray(iv_data[0].Rowsets.Rowset[0].Row) ? iv_data[0].Rowsets.Rowset[0].Row : new Array(iv_data[0].Rowsets.Rowset[0].Row);
                var myModel = new sap.ui.model.json.JSONModel(modelArr);

                iv_scope.getView().byId("select0").setModel(myModel);

                // Default EWM DEPO for workcenters
                if (objek == "3001FIR1") { iv_scope.getView().byId("select0").setSelectedKey("3E02"); }
                else if (objek == "3001FIR2") { iv_scope.getView().byId("select0").setSelectedKey("3E02"); }
                else if (objek == "3001FIR3") { iv_scope.getView().byId("select0").setSelectedKey("3E02"); }
                else if (objek == "3001FIR4") { iv_scope.getView().byId("select0").setSelectedKey("3E03"); }
                else if (objek == "3001FIR5") { iv_scope.getView().byId("select0").setSelectedKey("3E03"); }
                else if (objek == "3001YZC2FIR1") { iv_scope.getView().byId("select0").setSelectedKey("3E05"); }
                else if (objek == "3001YZC2FIR2") { iv_scope.getView().byId("select0").setSelectedKey("3E05"); }
                else if (objek == "2001FIRKPARK") { iv_scope.getView().byId("select0").setSelectedKey("2E02"); }
                else if (objek == "2001FIRKKUYU") { iv_scope.getView().byId("select0").setSelectedKey("2E01"); }
                else { MessageBox.error(objek + " iş yeri için varsayılan depo yeri girilmeli"); }

                iv_scope.onChangeStorage();
            },

            onChangeStorage: function (oEvent) {
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var storageLoc = this.getView().byId("select0").getSelectedKey();

                TransactionCaller.async("MES/Itelli/Firkete/EWM/T_GET_EWM_ISTIF", {
                    I_WERKS: plant,
                    I_LGORT: storageLoc,
                    I_CLIENT: client,
                    I_NODEID: nodeID
                },
                    "O_JSON",
                    this.onChangeStorageCB,
                    this,
                    "GET"
                );
            },

            onChangeStorageCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var modelArr = Array.isArray(iv_data[0].Rowsets.Rowset[0].Row) ? iv_data[0].Rowsets.Rowset[0].Row : new Array(iv_data[0].Rowsets.Rowset[0].Row);
                var myModel = new sap.ui.model.json.JSONModel(modelArr);

                iv_scope.getView().byId("select1").setModel(myModel);
                //iv_scope.getView().byId("input3").setValue("");           //Sıra No temizlenmesi istenmedi.
            },

            onChangeBin: function (oEvent) {
                //this.getView().byId("input3").setValue("");               //Sıra No temizlenmesi istenmedi.
            },

            onPressShowTable: function () {
                this.getView().byId("MainBox1").setVisible(false);
                this.getView().byId("MainBox2").setVisible(true);
                this.reloadProdTable2();
            },

            onPressHideTable: function () {
                this.getView().byId("MainBox1").setVisible(true);
                this.getView().byId("MainBox2").setVisible(false);
                this.reloadProdTable();
                this.setFocusToBacth();
            },

            onPressShowTable2: function () {
                this.getView().byId("MainBox1").setVisible(false);
                this.getView().byId("MainBox3").setVisible(true);
                //this.reloadProdTable3();
            },

            onPressHideTable2: function () {
                this.getView().byId("MainBox1").setVisible(true);
                this.getView().byId("MainBox3").setVisible(false);
                this.reloadProdTable();

                var tableModel = new sap.ui.model.json.JSONModel();

                this.getView().byId("tableReportedTie3").setModel(tableModel);

                this.getView().byId("tableReportedTie3").getModel().refresh();
            },

            reloadProdTable2: function () {
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var aufnr = this.appData.selected.order.orderNo;

                TransactionCaller.async("MES/Itelli/Firkete/ProdTable/T_GET_PROD_TABLE2", {
                    I_CLIENT: client,
                    I_PLANT: plant,
                    I_NODE_ID: nodeID,
                    I_AUFNR: aufnr,
                },
                    "O_JSON",
                    this.reloadProdTable2CB,
                    this,
                    "GET"
                );
            },
            reloadProdTable2CB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var modelArr = Array.isArray(iv_data[0].Rowsets?.Rowset?.Row) ? iv_data[0].Rowsets?.Rowset?.Row : new Array(iv_data[0].Rowsets?.Rowset?.Row);
                var myModel = new sap.ui.model.json.JSONModel(modelArr);

                iv_scope.getView().byId("tableReportedTie2").setModel(myModel);
            },

            onSubmitBarcode: function (oEvent) {
                var barcode = this.getView().byId("input0").getValue();

                if (!(!!barcode)) { //Is batch input filled
                    MessageBox.error("Parti alanını doldurunuz!");
                    return;
                }

                if (!(barcode.includes("|"))) { //check barcode format (includes "|")
                    MessageBox.error("Barkod formatı uygun değil!");
                    return;
                }
                var barcode = this.getView().byId("input0").getValue();
                var barcodeArr = barcode.split("|"); //parse barcode into arrray

                var batch;
                if (barcodeArr[0].length == 4) {
                    // Yeni Etiket
                    batch = barcodeArr[3];
                } else {
                    // Eski Etiket
                    batch = barcodeArr[0];
                }
                if (!batch) {
                    MessageBox.error("Barkod formatı uygun değil!");
                    return;
                }
                this.getBagIDRFC(batch);
            },
            getBagIDRFC: function (barcode) {
                var params = {
                    I_BATCH_NO: barcode
                };
                var tRunner = new TransactionRunner(
                    "MES/Integration/RFC/ZPP_016_GET_BAGID_RFC/ZPP_016_GET_BAGID_RFCXquery",
                    params
                );
                /*
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                */
                tRunner.ExecuteQueryAsync(this, this.callBagIDRFC);
                this.getView().byId("input0").setValue("");
            },
            callBagIDRFC: function (p_this, p_data) {
                var client = p_this.appData.client;
                var plant = p_this.appData.plant;
                var nodeID = p_this.appData.node.nodeID;
                var workcenterID = p_this.appData.node.workcenterID;
                var aprio = p_this.appData.selected.operationNo;
                var aufnr = p_this.appData.selected.order.orderNo;
                var userID = p_this.appData.user.userID;

                var bagID = p_data.Rowsets.Rowset[0].Row[0].BAG_ID;
                var teoMenge = p_data.Rowsets.Rowset[0].Row[0].TEO_MENGE;
                var batch = p_data.Rowsets.Rowset[0].Row[0].CHARG;

                var response = TransactionCaller.sync(
                    "MES/Itelli/Firkete/BILESEN_KONTROL/componentControl", {
                    I_PLANT: plant,
                    I_AUFNR: aufnr,
                    I_BATCH: batch,
                    I_CLIENT: client,
                    I_NODE_ID: nodeID,
                    I_WORKCENTERID: workcenterID,
                    I_USER: userID,
                    I_APRIO: aprio
                },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    p_this.getView().byId("input0").setValue("");
                    return;
                } else {
                    p_this.getView().byId("input1").setText(bagID);
                    p_this.getView().byId("input2").setText(teoMenge);
                    p_this.getView().byId("label33").setText(response[0]);
                    p_this.infoArr = p_data.Rowsets.Rowset[0].Row[0];
                    p_this.getView().byId("input0").setValue("");
                }
            },
            insertConsumptionHairPin: function () {
                var bagID = this.getView().byId("input1").getText();
                var menge = this.getView().byId("input2").getText();
                if (!(!!bagID) || !(!!menge)) {
                    MessageBox.error("Çubuk okutulmalı");
                    this.getView().byId("input1").setText("");
                    this.getView().byId("input2").setText("");
                    return null;
                }

                var lgort = this.getView().byId("select0").getSelectedKey();
                if (!(!!lgort)) {
                    MessageBox.error("Depo Yeri seçilmeli");
                    return null;
                }

                var lgpla = this.getView().byId("select1").getSelectedKey();
                if (!(!!lgpla)) {
                    MessageBox.error("İstif Alanı seçilmeli");
                    return null;
                }

                var huident = this.getView().byId("input3").getValue();
                if (!(!!huident)) {
                    MessageBox.error("Sıra Numarası alanı doldurulmalı");
                    return null;
                } else if (huident.length > 3) {
                    MessageBox.error("Sıra Numarası en fazla 3 haneli olabilir.");
                    return null;
                }

                var checkBoxHurda = this.getView().byId("checkBoxHurda").getSelected();
                if (checkBoxHurda == true) {
                    var aufnr = this.appData.selected.order.orderNo;
                    var response = TransactionCaller.sync(
                        "MES/Itelli/Firkete/Production/T_Get_Scrap_Material",

                        {
                            I_AUFNR: aufnr,

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }

                    var movetype = 531;
                    var material = response[0];
                }
                else {
                    var aufnr = this.appData.selected.order.orderNo;
                    var response = TransactionCaller.sync(
                        "MES/Itelli/Firkete/Production/T_Get_Material",

                        {
                            I_AUFNR: aufnr,

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }

                    var movetype = 101;
                    var material = response[0];
                }

                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var workcenterID = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;
                var aprio = this.appData.selected.operationNo;
                var userID = this.appData.user.userID;
                var batch = this.infoArr.CHARG;
                var quantity = menge;

                var params = {
                    I_CLIENT: client,
                    I_PLANT: plant,
                    I_NODEID: nodeID,
                    I_WORKCENTERID: workcenterID,
                    I_AUFNR: aufnr,
                    I_APRIO: aprio,
                    I_BAGID: bagID,
                    I_USERID: userID,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantityFlm/hairpinConsumptionXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                this.onClickSaveReportedQuantity(movetype, material, batch, quantity);
            },
            Execute: function () {
                var dokumno = this.getView().byId("input4").getValue();
                var posnr = this.getView().byId("tableOrderInfo").getModel().oData[0].KDPOS;
                var vbeln = this.getView().byId("tableOrderInfo").getModel().oData[0].KDAUF;
                var nodeid = this.appData.node.nodeID;

                var response = TransactionCaller.sync(
                    "MES/Itelli/Firkete/GetAvailableBatch/ZPP_016_CUBUK_RFC",

                    {
                        I_CASTNO: dokumno,
                        I_KDAUF: vbeln,
                        I_KDPOS: posnr,
                        I_NODE_ID: nodeid

                    },
                    "O_JSON"
                );
                var modelArr = Array.isArray(response[0].ZPP_016_CUBUK_RFC.OUTPUT.ET_TABLE.item) ? response[0].ZPP_016_CUBUK_RFC.OUTPUT.ET_TABLE.item : new Array(response[0].ZPP_016_CUBUK_RFC.OUTPUT.ET_TABLE.item);
                var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                this.getView().byId("tableReportedTie3").setModel(tableModel);

                this.getView().byId("tableReportedTie3").getModel().refresh();
            },
            getData: function (oEvent) {

                        
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var selectedModel = oEvent.getSource().getModel().getData()[selectedIndex];
                
                if (!!!selectedModel.Y_PAKET_AGIRLIK_KG) {
                    MessageBox.error("Paket ağırlığı boş olan parti seçilemez.");
                    return;
                }
                if (!!!selectedModel.CHARG) {
                    MessageBox.error("Parti numarası boş olan parti seçilemez.");
                    return;
                }

                this.getDataFragment(selectedModel);

            },
            getDataFragment: function (selectedModel) {
                if (!this._oDialog01) {
                    this._oDialog01 = sap.ui.xmlfragment(
                        "getDataFragment",
                        "customActivity.fragmentView.firketeMessageFragment",

                        this
                    );
                    this.getView().addDependent(this._oDialog01);
                }
                this._oDialog01.open();

                sap.ui.core.Fragment.byId("getDataFragment", "getDataFragmentDialog").setModel(selectedModel);
                sap.ui.core.Fragment.byId("getDataFragment", "fragmentMessage").setText(selectedModel.CHARG + " numaralı parti ile devam etmek istiyor musunuz?");


            },
            getDataFragmentOK: function () {

                var selectedModelfromDialog = sap.ui.core.Fragment.byId("getDataFragment", "getDataFragmentDialog")?.getModel();

                TransactionCaller.async("MES/Itelli/Firkete/Teyit/T_CONFIRMATION_NON_BAGID", {
                    I_DATA: JSON.stringify(selectedModelfromDialog)
                },
                    "O_JSON",
                    this.getDataCB,
                    this,
                    "GET"
                );
                this.onCancelFrag01();

            },
            onCancelFrag01: function () {
                this._oDialog01.close();
            },



            getDataCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                } else {
                    var client = iv_scope.appData.client;
                    var plant = iv_scope.appData.plant;
                    var nodeID = iv_scope.appData.node.nodeID;
                    var workcenterID = iv_scope.appData.node.workcenterID;
                    var aprio = iv_scope.appData.selected.operationNo;
                    var aufnr = iv_scope.appData.selected.order.orderNo;
                    var userID = iv_scope.appData.user.userID;

                    var bagID = iv_data[0].Rowsets.Rowset.Row.BAG_ID;
                    var teoMenge = iv_data[0].Rowsets.Rowset.Row.TEO_MENGE;
                    var batch = iv_data[0].Rowsets.Rowset.Row.CHARG;

                    var response = TransactionCaller.sync(
                        "MES/Itelli/Firkete/BILESEN_KONTROL/componentControl", {
                        I_PLANT: plant,
                        I_AUFNR: aufnr,
                        I_BATCH: batch,
                        I_CLIENT: client,
                        I_NODE_ID: nodeID,
                        I_WORKCENTERID: workcenterID,
                        I_USER: userID,
                        I_APRIO: aprio
                    },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        iv_scope.getView().byId("input0").setValue("");
                        return;
                    } else {
                        iv_scope.getView().byId("input1").setText(bagID);
                        iv_scope.getView().byId("input2").setText(teoMenge);
                        iv_scope.getView().byId("label33").setText(response[0]);
                        iv_scope.infoArr = iv_data[0].Rowsets.Rowset.Row;
                        iv_scope.getView().byId("input0").setValue("");
                        iv_scope.onPressHideTable2();
                    }
                }

            },
            DataFilter: function () {
                var parti = this.getView().byId("input10").getValue();
                var dokumno2 = this.getView().byId("input11").getValue();
                var bag = this.getView().byId("input12").getValue();
                var pagırlık = this.getView().byId("input13").getValue();
                var cubuk = this.getView().byId("input14").getValue();
                var boy = this.getView().byId("input15").getValue();

                var dokumno = this.getView().byId("input4").getValue();
                var posnr = this.getView().byId("tableOrderInfo").getModel().oData[0].KDPOS;
                var vbeln = this.getView().byId("tableOrderInfo").getModel().oData[0].KDAUF;
                var nodeid = this.appData.node.nodeID;

                var response = TransactionCaller.sync(
                    "MES/Itelli/Firkete/GetAvailableBatch/ZPP_016_CUBUK_RFC",

                    {
                        I_CASTNO: dokumno,
                        I_KDAUF: vbeln,
                        I_KDPOS: posnr,
                        I_NODE_ID: nodeid

                    },
                    "O_JSON"
                );
                var modelArr = Array.isArray(response[0].ZPP_016_CUBUK_RFC.OUTPUT.ET_TABLE.item) ? response[0].ZPP_016_CUBUK_RFC.OUTPUT.ET_TABLE.item : new Array(response[0].ZPP_016_CUBUK_RFC.OUTPUT.ET_TABLE.item);

                var Finalstep = modelArr.filter((i) => (((i.Y_PAKET_AGIRLIK_KG == pagırlık) || (pagırlık == "")) && ((i.CHARG == parti) || (parti == "")) && ((i.Y_BOY_CBK_M == boy) || (boy == "")) && ((i.Y_CUBUK_SAYISI == cubuk) || (cubuk == "")) && ((i.BAG_SAYI == bag) || (bag == "")) && ((i.Y_DOKUMNO == dokumno2) || (dokumno2 == ""))));
                var tableModel = new sap.ui.model.json.JSONModel(Finalstep);
                this.getView().byId("tableReportedTie3").setModel(tableModel);
                this.getView().byId("tableReportedTie3").getModel().refresh();
            },
            onClickSaveReportedQuantity: function (movetype, material, batch, quantity) {
                var that = this;
                var bagID = that.getView().byId("input1").getText();
                var lgort = that.getView().byId("select0").getSelectedKey();
                var lgpla = that.getView().byId("select1").getSelectedKey();
                var huident = that.getView().byId("input3").getValue();
                var timestamp = new Date().getTime();
                var dc_element;

                if (movetype == 101) {
                    dc_element = "GOOD_QUANTITY";
                }
                else if (movetype == 531) {
                    dc_element = "SCRAP";
                }

                var bagTeli = this.getView().byId("tableOrderInfo").getModel().oData[0].BAG_TEL_KG;
                var newQuantity = Math.round((quantity * 1000) +  bagTeli)

                var inputXML = {};
                inputXML.client = that.appData.client;
                inputXML.plant = that.appData.plant;
                inputXML.runID = that.appData.selected.runID;
                inputXML.nodeID = that.appData.node.nodeID;
                inputXML.material = material;
                inputXML.comments = "";
                inputXML.batchNo = batch;
                inputXML.dcElementType = dc_element;
                inputXML.startTimestamp = timestamp;
                inputXML.endTimestamp = timestamp;
                inputXML.dcElement = dc_element;
                inputXML.quantity = newQuantity / 1000;
                inputXML.uom = "TO";
                inputXML.releasedID = that.appData.selected.releasedID;
                inputXML.aufnr = that.appData.selected.order.orderNo;
                inputXML.movetype = movetype;
                inputXML.objek = that.appData.characteristic[0].Row[0].OBJEK;
                inputXML.firkete = "X";
                inputXML.bag_id = bagID;
                inputXML.lgort = lgort;
                inputXML.lgpla = lgpla;
                inputXML.huident = huident;

                var inputChar = [];

                inputChar.push({
                    CHAR_NAME: "Y_PAKET_AGIRLIK_KG",
                    CHAR_VALUE: newQuantity,
                });

                var params = {
                    inputXML: JSON.stringify(inputXML),
                    inputChar: JSON.stringify(inputChar),
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/reportConfirmationFIRKXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                sap.m.MessageToast.show(
                    that.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                );
                that.getView().byId("input1").setText("");
                that.getView().byId("input2").setText("");
                that.getView().byId("label33").setText("");
                this.getView().byId("checkBoxHurda").setSelected(false);
                setTimeout(function () {
                    that.reloadProdTable();
                }, 5000);
            },
        });
    }
);