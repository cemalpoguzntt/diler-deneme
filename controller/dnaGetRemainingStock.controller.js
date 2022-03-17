sap.ui.define(
    [
        "sap/m/MessageBox",
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
        "sap/m/Dialog",
        "sap/m/Text",
        "sap/m/TextArea",
        "sap/m/Button",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/export/library",
        "sap/ui/export/Spreadsheet",
        'sap/ui/core/library',
        "customActivity/scripts/custom",
    ],

    function (
        MessageBox,
        Controller,
        JSONModel,
        MessageToast,
        TransactionCaller,
        Fragment,
        Dialog,
        Text,
        TextArea,
        Button,
        Filter,
        FilterOperator,
        exportLibrary,
        Spreadsheet,
        coreLibrary,
        customScripts
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        var ValueState = coreLibrary.ValueState;
        return Controller.extend(
            "customActivity.controller.dnaGetRemainingStock",

            {
                selectedOrder: {
                    orderNumber: "",
                    status: "",
                    routingOperNo: "",
                    productionActivity: "",
                    releasedHeaderID: "",
                    releasedID: "",
                    baseUOM: "",
                    quantityReleased: "",
                    quantityReleasedUOM: "",
                    material: "",
                    startDate: "",
                    startTime: "",
                    activity: "",
                    runID: "",
                    numberOfCapacities: "",
                },

                onInit: function () {
                    that = this;
                    jsonDataForPriorityChange = [];
                    // this.router = sap.ui.core.UIComponent.getRouterFor(this);
                    // this.router.attachRouteMatched(this._fnRouteMatched, this);
                    //  this.router = new sap.ui.core.routing.Router(this);

                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();

                    this.interfaces = this.appComponent.getODataInterface();
                    this.selectPrinterID();




                },

                changeBarcodeInput: function (oEvent) {

                    var inputValue = oEvent.getSource()._getInputValue();
                    // var objek = this.appData.characteristic.Row[0].OBJEK;
                    var werks = this.appData.plant;


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

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/GetRemainingStock/T_GetRemainingStock", {
                        I_BATCHNO: batchNo,
                        I_WERKS: werks
                    },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    } else {
                        MessageBox.information("İşlem Başarılı");
                    }


                    this.getView().byId("idBatchNo").setText(batchNo);
                    this.getView().byId("idWeight").setText(response[0]);
                    this.getView().byId("inputBarcodeRead").setValue(null);

                },

                onPressGetLabel: function () {

                    var batchNo = this.getView().byId("idBatchNo").getText();
                    var weight = this.getView().byId("idWeight").getText();
                    var werks = this.appData.plant;
                    var client = this.appData.client;
                    var printName = this.getView().byId("idPrinter").getSelectedKey();
                    var arrModel = [{}];

                    if (!!!batchNo || !!!weight) {
                        MessageBox.error("Barcode okutunuz.");
                        return;
                    }

                    var params2 = {
                        "Param.1": batchNo
                    };
                    var tRunner2 = new TransactionRunner("MES/Itelli/DNA/GetRemainingStock/getKgmQry", params2);
                    if (!tRunner2.Execute()) {
                        MessageBox.error(tRunner2.GetErrorMessage());
                        return;
                    }
                    var oData2 = tRunner2.GetJSONData();
                    

                    arrModel[0].batchNo = batchNo;
                    arrModel[0].weight = weight;
                    arrModel[0].printName = printName;
                    
                    // kgm kaydı var mı yok mu kontrolü
                    if (!!!oData2[0]?.Row) {


                        this.openFragment1(arrModel);
                    }
                    else {

                        var kgm = oData2[0]?.Row[0]?.ATFLV;

                        var params = {
                            "Param.1": batchNo,
                            "Param.2": werks,
                        };

                        // QRY fosfatlama teyit ekranından Z'lendi
                        var tRunner = new TransactionRunner(
                            "MES/Itelli/DNA/GetRemainingStock/getRSLabelValues",
                            params
                        );
                        if (!tRunner.Execute()) {
                            MessageBox.error(tRunner.GetErrorMessage());
                            return;
                        }

                        
                        // var kgm = 0.151429;

                        var kalanMetraj = weight * 1000 / kgm;

                        var aufnr = tRunner.GetJSONData()[0].Row[0].AUFNR;
                        var node_id = tRunner.GetJSONData()[0].Row[0].NODE_ID;
                        var entry_id = tRunner.GetJSONData()[0].Row[0].ENTRY_ID;


                        var response = TransactionCaller.sync(
                            "MES/Itelli/DNA/Etiket/API/RESEND_ETIKET/T_RESEND_ETIKET", {
                            I_AUFNR: aufnr,
                            I_PLANT: werks,
                            I_CLIENT: client,
                            I_ENTRYID: entry_id,
                            I_NODEID: node_id,
                            I_MANUEL: "X",
                            I_CURRENT_QTY: weight,
                            I_KALAN_METRAJ: Number(kalanMetraj.toFixed(0)),
                            I_PRINT_NAME: printName

                        },
                            "O_JSON"
                        );
                        if (response[1] == "E") {
                            MessageBox.error(response[0]);
                            return;
                        } else {
                            MessageBox.information("İşlem Başarılı");
                        }

                        this.getView().byId("idBatchNo").setText(null);
                        this.getView().byId("idWeight").setText(null);
                        this.getView().byId("inputBarcodeRead").setValue(null);

                    }





                },

                openFragment1: function (arrModel) {
                    if (!this._oDialog01) {
                        this._oDialog01 = sap.ui.xmlfragment(
                            "remainingStockFragment",
                            "customActivity.fragmentView.remainingStockFragment",

                            this
                        );
                        this.getView().addDependent(this._oDialog01);
                    }
                    this._oDialog01.open();


                    sap.ui.core.Fragment.byId("remainingStockFragment", "remainingStockDialog").setModel(arrModel);

                },
                onCancelFrag01: function () {
                    this._oDialog01.close();
                },

                onPressLabel: function () {

                    var selectedModelfromDialog = sap.ui.core.Fragment.byId("remainingStockFragment", "remainingStockDialog")?.getModel();
                    var batchNo = selectedModelfromDialog[0].batchNo;
                    var weight = selectedModelfromDialog[0].weight;
                    var printName = selectedModelfromDialog[0].printName;                    

                    var params = {
                        "Param.1": batchNo,
                        "Param.2": this.appData.plant,
                    };

                    // QRY fosfatlama teyit ekranından Z'lendi
                    var tRunner = new TransactionRunner(
                        "MES/Itelli/DNA/GetRemainingStock/getRSLabelValues",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    

                    var aufnr = tRunner.GetJSONData()[0].Row[0].AUFNR;
                    var node_id = tRunner.GetJSONData()[0].Row[0].NODE_ID;
                    var entry_id = tRunner.GetJSONData()[0].Row[0].ENTRY_ID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/Etiket/API/RESEND_ETIKET/T_RESEND_ETIKET", {
                        I_AUFNR: aufnr,
                        I_PLANT: this.appData.plant,
                        I_CLIENT: this.appData.client,
                        I_ENTRYID: entry_id,
                        I_NODEID: node_id,
                        I_MANUEL: "X",
                        I_CURRENT_QTY: weight,
                        I_PRINT_NAME: printName

                    },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    } else {
                        MessageBox.information("İşlem Başarılı");
                    }

                    this.getView().byId("idBatchNo").setText(null);
                    this.getView().byId("idWeight").setText(null);
                    this.getView().byId("inputBarcodeRead").setValue(null);



                },

                selectPrinterID: function () {


                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/Etiket/API/RESEND_ETIKET/T_Select_Node_Infos",
                        {
                            I_CLIENT: this.appData.client,
                            I_PLANT: this.appData.plant,
                            I_NODE_ID: this.appData.node.nodeID,
                        },
                        "O_JSON"
                    );

                    var name = response[0].Rowsets.Rowset.Row.NAME;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/PRINTERS/T_GET_ID_MODEL",
                        {

                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0]?.Rowsets?.Rowset?.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    this.getView().byId("idPrinter").setModel(tableModel);
                    this.getView().byId("idPrinter").setSelectedKey(name);


                },

            }
        );
    }
);