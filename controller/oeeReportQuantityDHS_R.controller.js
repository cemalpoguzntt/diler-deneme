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
        "customActivity/scripts/custom",
        "customActivity/scripts/customStyle",
        "../model/formatter",
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
        customScripts,
        customStyle,
        formatter
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        var pastRunId;

        return Controller.extend(
            "customActivity/controller/oeeReportQuantityDHS_R",

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
                    this.screenAllValue = [{}];
                    this.screenObj = [];
                    this.screenObj.inputChar = [];


                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();
                    this.interfaces = this.appComponent.getODataInterface();
                    this.checkShift();
                    this.reworkControl();
                    this.getModel();

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

                getModel: function () {

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var activeAufnr = parseFloat(this.appData.selected.order.orderNo);
                    // var activeAufnr = parseFloat("000025000549");
                    var VORNR = this.appData.selected.operationNo;


                    var params = {
                        "Param.1": client,
                        "Param.2": plant,
                        "Param.3": activeAufnr
                    };
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/reportQuantityDHS_R/getOrderInfo", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);

                    this.getView().byId("orderInformations").setModel(oModel);

                    var params2 = {
                        "Param.1": client,
                        "Param.2": plant,
                        "Param.3": activeAufnr,
                        "Param.4": VORNR

                    };
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/reportQuantityDHS_R/getComponentInfo", params2);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData2 = tRunner.GetJSONData();
                    var oModel2 = new sap.ui.model.json.JSONModel();
                    oModel2.setData(oData2[0].Row);

                    this.getView().byId("componentsInformations").setModel(oModel2);
                    this.getView().byId("producedMATNR").setText(this.appData?.selected?.material?.id);

                },

                reworkControl: function () {

                    var activeAufnr = this.appData.selected.order.orderNo;
                    // var activeAufnr = "000025000549";


                    var params = {
                        "Param.1": parseFloat(activeAufnr)
                    };
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/reportQuantityDHS_R/selectAUART", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();

                    if (oData[0].Row[0].AUART == "YP16") {


                    }
                    else {
                        // MessageBox.confirm("Aktif Sipariş, Rework Sipariş değildir. Siparişi kontrol ediniz.");
                        this.appComponent.getRouter().navTo("activity", {
                            activityId: "ZACT_REP_QTY_DHS",
                        });
                    }


                },

                changeBarcodeInput: function (oEvent) {

                    var inputValue = oEvent.getSource()._getInputValue();


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

                    var batchNumber = inputValue;


                    var compTableModel = this.getView().byId("componentsInformations")?.getModel()?.getData();


                    if (!!!(compTableModel.filter((i) => (i.PARTI === batchNumber))[0])) {

                        MessageBox.error("Yanlış Parti okuttunuz!");
                        return;
                    }

                    // if (!!(compTableModel.filter((i) => (i.CT_REWORK === "10" || i.CT_REWORK === "20"))[0])) {

                    //     MessageBox.error("Okutulmuş Parti bulunmaktadır.");
                    //     return;
                    // }

                    var client = this.appData.client;
                    var werks = this.appData.plant;
                    var nodeID = this.appData.node.nodeID;
                    var workcenterID = this.appData.node.workcenterID;
                    var userID = this.appData.user.userID;
                    var aufnr = this.appData.selected.order.orderNo;
                    // var aufnr = "000025000549";
                    var aprio = this.appData.selected.operationNo;
                    var matnr = this.getView().byId("componentsInformations")?.getModel()?.getData()[0]?.MALZEME;
                    var objek = "3007PCSTRAND";

                    // Consumption'a 10'lu kayıt
                    var params = {
                        "Param.1": client,
                        "Param.2": werks,
                        "Param.3": nodeID,
                        "Param.4": workcenterID,
                        "Param.5": batchNumber,
                        "Param.6": userID,
                        "Param.7": aufnr,
                        "Param.8": aprio,
                        "Param.9": matnr,
                        "Param.10": objek,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ComponentAssignment/insertConsumptionXqueryDHS_R",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    this.getView().byId("idBatch").setValue("");
                    this.getModel();
                },

                onSave: function () {

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

                    var selectedIndex = this.getView().byId("componentsInformations")?.getSelectedContextPaths()[0]?.split("/")[1];
                    if (!!!selectedIndex) {
                        MessageBox.error("Tüketim yapılacak satırı seçiniz!");
                        return;
                    }


                    var currentWeight = parseFloat(this.getView().byId("teyitQuantity").getValue()); //KG
                    if (!!!currentWeight) {
                        MessageBox.error("Tüketim Miktarı Giriniz.");
                        return;
                    }


                    var compTableModel = this.getView().byId("componentsInformations")?.getModel()?.getData()[selectedIndex];



                    var oData = [];
                    oData.push(compTableModel);

                    if (oData[0].KALAN * 1000 < currentWeight) {
                        MessageBox.error("Kalan Miktardan daha fazla miktar girilmez.");
                        return;
                    }

                    var DateTimePicker = this.getView().byId("DateTimePicker")?.getValue();

                    if (!!DateTimePicker) {

                        var params = {
                            "Param.1": this.appData.client,
                            "Param.2": this.appData.plant,
                            "Param.3": this.appData.node.nodeID,
                        
                        };
                        var tRunner = new TransactionRunner("MES/Itelli/PastActivity/getWorkplaceQry", params);
                        if (!tRunner.Execute()) {
                            MessageBox.error(tRunner.GetErrorMessage());                            
                            return;
                        }
                        var oData99 = tRunner.GetJSONData();       
                        
                        var response99 = TransactionCaller.sync(
                            "MES/Itelli/PastActivity/T_GetFilterModel",
                            {
                                I_CLIENT: this.appData.client,
                                I_PLANT: this.appData.plant,
                                I_WORKPLACE: oData99[0].Row[0].NAME,
                                I_DATE: moment(DateTimePicker).format("DD-MM-YYYY"),    // seçili teyitin tarihi
                                I_TEYIT_CONDITION: "X",
                        
                            },
                            "O_JSON"
                        );
                        if (response99[1] == "E") {
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
                                // I_AUFNR: "000025000549",
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


                    var type = "new";
                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeID = this.appData.node.nodeID;
                    var aufnr = this.appData.selected.order.orderNo;
                    // var aufnr = "000025000549";

                    var workcenterID = this.appData.node.workcenterID;
                    var aprio = this.appData.selected.operationNo;
                    var userID = this.appData.user.userID;
                    var matnr = this.getView().byId("componentsInformations")?.getModel()?.getData()[0]?.MALZEME;
                    var selectKey = "Sağlam Miktar";
                    var objek = "3007PCSTRAND"
                    var checkBox = this.getView().byId("idCheckbox").getSelected();



                    // Yeni batch numarası almak için
                    var params = {
                        I_CLIENT: client,
                        I_WERKS: plant,
                        I_NODEID: nodeID,
                        I_WORKCENTERID: workcenterID,
                        I_AUFNR: aufnr,
                        I_APRIO: aprio,
                        I_USERID: userID,
                        I_PRODTYPE: selectKey,
                        I_TYPE: type,
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


                    var batchData = tRunner.GetJSONData();
                    var newBatchNumber = batchData[0].Row[0].BATCH;





                    // MC row number update
                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/BabyCoilRowNumber/T_UPDATE_ROW_NUMBER_PCS",
                        {
                            I_AUFNR: aufnr,
                            I_CONSUMED_BATCH: oData[0].MC_NO,
                            I_NEW_BATCH: newBatchNumber,
                            I_WORKCENTER_ID: workcenterID

                        },
                        "O_JSON"
                    );

                    var selectedWeight = oData[0].KALAN;
                    selectedWeight = parseFloat(selectedWeight) * 1000;
                    oData[0].UOM = "TO";

                    this.screenObj.inputChar.push({
                        CHAR_NAME: "Y_BRUT_AGIRLIK",
                        CHAR_VALUE: (currentWeight + 16) / 1000,
                    });

                    this.screenObj.inputChar.push({
                        CHAR_NAME: "Y_KGM",
                        CHAR_VALUE: oData[0].KGM,
                    });
                    this.screenObj.inputChar.push({
                        CHAR_NAME: "Y_MASTERCOIL",
                        CHAR_VALUE: oData[0].MC_NO,
                    });
                    this.screenObj.inputChar.push({
                        CHAR_NAME: "Y_DOKUMNO",
                        CHAR_VALUE: oData[0].DOKUMNO,
                    });

                    var metraj = Number(currentWeight / parseFloat(oData[0].KGM)).toFixed(0);


                    this.screenObj.inputChar.push({
                        CHAR_NAME: "Y_METRAJ",
                        CHAR_VALUE: metraj,
                    });


                    if (!!checkBox) {
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
                            // isSaveSKP = true;
                            return null;
                        }
                        var jsData = tRunner.GetJSONData();
                        if (!jsData[0].Row) {
                            sap.m.MessageBox.alert(this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_MISSING_MATERIAL_IN_PRODUCT_TREE"));
                            // isSaveSKP = true;
                            return;
                        }


                        oData[oData.length] = {};
                        oData[oData.length - 1].KALAN = (selectedWeight - currentWeight) / 1000;
                        oData[oData.length - 1].movetype = jsData[0].Row[0].BWART;
                        oData[oData.length - 1].PARTI = oData[0].PARTI;
                        oData[oData.length - 1].MALZEME = jsData[0].Row[0].MATNR;
                        oData[oData.length - 1].UOM = oData[0].UOM;
                        oData[oData.length - 1].CT_REWORK = "30";
                    }

                    oData[0].movetype = 261;

                    if (!!checkBox) {
                        oData[0].KALAN = selectedWeight / 1000; // Hurda tiklendiyse tamamını tüket

                        oData[0].CT_REWORK = "30";
                    }
                    else {
                        //Kısmen
                        if (selectedWeight - currentWeight > 0) {
                            oData[0].CT_REWORK = "20";
                            oData[0].KALAN = currentWeight / 1000;
                        }
                        //Tamamen
                        else if (selectedWeight - currentWeight == 0) {
                            oData[0].CT_REWORK = "30";
                            oData[0].KALAN = currentWeight / 1000;
                        }
                    }
                    this.screenAllValue[0].quantityTon = currentWeight / 1000;



                    oData.forEach(function (item, index) {
                        var params = {};
                        params = {
                            I_CLIENT: client,
                            I_WERKS: plant,
                            I_NODEID: nodeID,
                            I_WORKCENTERID: workcenterID,
                            I_AUFNR: aufnr,
                            I_APRIO: aprio,
                            I_USERID: userID,
                            I_BARCODE: item.PARTI,
                            I_QUANTITY: item.KALAN,
                            I_CONSUMPTIONTYPE: item?.CT_REWORK,
                            I_MATNR: item.MALZEME,
                            I_NEWBATCH: newBatchNumber,
                            I_MOVETYPE: item.movetype,
                            I_UOM: item.UOM,
                            I_MATERIAL: matnr,
                        };
                        var tRunner = new TransactionRunner(
                            "MES/UI/ReportQuantity/Operations/insertPCStrandXquery",
                            params
                        );
                        if (!tRunner.Execute()) {
                            MessageBox.error(tRunner.GetErrorMessage());
                            isSaveSKP = true;
                            return null;
                        }
                    }, this);

                    var movetype = 101;

                    this.onClickSaveReportedQuantity(movetype, matnr, newBatchNumber, metraj);
                    this.getModel();


                },

                onClickSaveReportedQuantity: function (movetype, material, newBatchNumber, metraj) {
                    var selectKey = "Sağlam Miktar";
                    var DateTimePicker = this.getView().byId("DateTimePicker")?.getValue();
                    var quantity = this.screenAllValue[0].quantityTon;

                    // quantity girilmiş mi kontrolü

                    if (!!!quantity) {
                        sap.m.MessageToast.show(this.appComponent.oBundle.getText("OEE_LABEL_ASSIGN_ERROR"));
                        return;
                    }


                    quantity = quantity.toString();
                    quantity = quantity.replace(".", ",");


                    var goodAndRejectedDataCollection = [{}];


                    goodAndRejectedDataCollection[0].client = this.appData.client;
                    goodAndRejectedDataCollection[0].plant = this.appData.plant;
                    goodAndRejectedDataCollection[0].nodeID = this.appData.node.nodeID;
                    goodAndRejectedDataCollection[0].aufnr = this.appData.selected.order.orderNo;
                    // goodAndRejectedDataCollection[0].aufnr = "000025000549";
                    goodAndRejectedDataCollection[0].movetype = movetype;
                    goodAndRejectedDataCollection[0].runID = this.appData.selected.runID;
                    goodAndRejectedDataCollection[0].comments = "";
                    goodAndRejectedDataCollection[0].releasedID = this.appData.selected.releasedID
                    goodAndRejectedDataCollection[0].dcElementType = "GOOD_QUANTITY";
                    goodAndRejectedDataCollection[0].dcElement = "GOOD_QUANTITY";
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

                    goodAndRejectedDataCollection[0].batchNo = newBatchNumber;
                    goodAndRejectedDataCollection[0].material = material;

                    goodAndRejectedDataCollection[0].objek = "3007PCSTRAND"


                    // goodAndRejectedDataCollection[0].quantityTon = this.screenAllValue[0].quantityTon;

                    //İş yerleri için teyit birimi metrajdan tonaja çevrildi.
                    //quantityTon alanı Metraj değerini saklamak için kullanılacak.

                    var qty_mtr = metraj;
                    var qty_ton = this.screenAllValue[0].quantityTon;

                    goodAndRejectedDataCollection[0].uom = "TO";
                    goodAndRejectedDataCollection[0].quantity = qty_ton;
                    goodAndRejectedDataCollection[0].quantityTon = qty_mtr;


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

                        return null;
                    }
                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                    );

                    this.getView().byId("idBatch").setValue("");
                    this.getView().byId("teyitQuantity").setValue("");
                    this.getView().byId("idCheckbox").setSelected(false);
                    this.getView().byId("DateTimePicker").setValue(null);

                    this.screenObj.inputChar = [];




                },

                deleteComponent: function (oEvent) {

                    var selectedIndex = oEvent.oSource.getParent().getBindingContext()?.getPath()?.split("/")[1];
                    var oTableData = this.getView().byId("componentsInformations")?.getModel()?.getData();
                    var partiNo = oTableData[selectedIndex].PARTI;
                    var consid = oTableData[selectedIndex].CONSID;
                    var aufnr = this.appData.selected.order.orderNo;
                    // var aufnr = "000025000549";

                    var params = {
                        "Param.1": partiNo,
                        "Param.2": this.appData.user.userID,
                        "Param.3": this.appData.plant,
                        "Param.4": aufnr,
                        "Param.5": this.appData.node.nodeID,
                        "Param.6": this.appData.selected.operationNo,
                        "Param.7": consid,

                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/ComponentAssignment/Operations/deleteCompXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }

                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                    );

                    this.getModel();


                },


                selectionBarcodeControl: function (oEvent) {

                    var selectedIndex = oEvent.oSource.getSelectedContextPaths()[0]?.split("/")[1];
                    var oTableData = oEvent.oSource.getModel()?.getData();
                    var CT_REWORK = oTableData[selectedIndex].CT_REWORK;



                    if (CT_REWORK == "0") {

                        MessageBox.error("Okutulmamış parti seçilemez!");
                        oEvent.oSource.setSelectedItem(oEvent.oSource.getSelectedItem(), false);
                        return;

                    }

                    if (CT_REWORK == "30") {

                        MessageBox.error("Tamamen tüketilmiş parti seçilemez!");
                        oEvent.oSource.setSelectedItem(oEvent.oSource.getSelectedItem(), false);
                        return;

                    }

                    if (!!!oTableData[selectedIndex].DOKUMNO) {
                        MessageBox.error("Seçilen partinin Y_DOKUMNO karakteristiği hatalıdır.\nSAP tarafında MSC3N ekranında kontrol ediniz.");
                        oEvent.oSource.setSelectedItem(oEvent.oSource.getSelectedItem(), false);
                        return;
                    }
                    if (!!!oTableData[selectedIndex].KGM) {
                        MessageBox.error("Seçilen partinin Y_KGM karakteristiği hatalıdır.\nSAP tarafında MSC3N ekranında kontrol ediniz.");
                        oEvent.oSource.setSelectedItem(oEvent.oSource.getSelectedItem(), false);
                        return;
                    }
                    if (!!!oTableData[selectedIndex].MC_NO) {
                        MessageBox.error("Seçilen partinin Y_MASTERCOIL karakteristiği hatalıdır.\nSAP tarafında MSC3N ekranında kontrol ediniz.");
                        oEvent.oSource.setSelectedItem(oEvent.oSource.getSelectedItem(), false);
                        return;
                    }


                },

                onPressGetWeightDHS: function () {
                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/ReportProduction/DHS/getWeightDHSTrns",
                        {},
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    } else {
                        this.getView().byId("teyitQuantity").setValue(response[0]);
                    }
                },
                confirmationInfos: function () {

                    this.getView().byId("batchFlexbox").setVisible(false);
                    this.getView().byId("componentFlexbox").setVisible(false);
                    this.getView().byId("confirmationFlexbox").setVisible(false);

                    var aufnr = this.appData.selected.order.orderNo;
                    // var aufnr = "000025000549";
                    var workcenterID = this.appData.node.workcenterID;

                    var params2 = {
                        "Param.1": aufnr,
                        "Param.2": workcenterID,

                    };
                    var tRunner = new TransactionRunner("MES/Itelli/DNA/reportQuantityDHS_R/getConfirmationsQry", params2);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData2 = tRunner.GetJSONData();
                    var oModel2 = new sap.ui.model.json.JSONModel();
                    oModel2.setData(oData2[0].Row);

                    this.getView().byId("confirmationListTable").setModel(oModel2);

                    this.getView().byId("confirmationList").setVisible(true);

                },


                generalInfos: function () {

                    this.getView().byId("confirmationList").setVisible(false);


                    this.getModel();

                    this.getView().byId("batchFlexbox").setVisible(true);
                    this.getView().byId("componentFlexbox").setVisible(true);
                    this.getView().byId("confirmationFlexbox").setVisible(true);


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

                isInputNumber: function (oEvent) {
                    var _oInput = oEvent.getSource();
                    var val = _oInput.getValue();
                    val = val.replace(/[^\d]/g, "");
                    _oInput.setValue(val);
                }

            });
    }
);