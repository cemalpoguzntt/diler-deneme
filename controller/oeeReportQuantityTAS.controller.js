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
        "customActivity/scripts/transactionCaller"
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
        var activeOrderData;
        var that;
        return Controller.extend("customActivity/controller/oeeReportQuantityTAS", {
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
                that = this;

                this.getObjek();
                interval = setInterval(function func() {
                    that.getActiveOrderDatas();
                }, 10000);
                this.getActiveOrderDatasSync();

            },
            getActiveOrderDatas: function () {
                TransactionCaller.async("MES/Itelli/TAS/T_GET_ACTIVE_ORDER",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID,
                        I_PLANT: this.appData.plant,
                        I_NODEID: this.appData.node.nodeID
                    },
                    "O_JSON",
                    this.onActiveOrderDatasCB,
                    this,
                    "GET"
                );
            },
            onActiveOrderDatasCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                if (iv_scope.isEmptyObject(iv_data[0]?.RESULT)) {
                    return;
                }
                activeOrderData = iv_data[0]?.RESULT;
                if (!(!!iv_scope.getView().byId("idAufnr"))) {
                    clearInterval(interval);
                    return;
                }
                iv_scope.getView().byId("idAufnr").setText(activeOrderData.AUFNR);
                iv_scope.getView().byId("idKdauf").setText(activeOrderData.KDAUF);
                iv_scope.getView().byId("idMalzeme").setText(activeOrderData.MALZEME);
                iv_scope.getView().byId("idMensei").setText(activeOrderData.MENSEI);
                iv_scope.getView().byId("idKalite").setText(activeOrderData.KALITE);
                iv_scope.getView().byId("idEbat").setText(activeOrderData.EBAT);
                iv_scope.getView().byId("idBoy").setText(activeOrderData.BOY);
                iv_scope.getView().byId("idVakum").setText(activeOrderData.VAKUM);
            },
            getActiveOrderDatasSync: function () {
                var response = TransactionCaller.sync(
                    "MES/Itelli/TAS/T_GET_ACTIVE_ORDER",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID,
                        I_PLANT: this.appData.plant,
                        I_NODEID: this.appData.node.nodeID
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                activeOrderData = response[0]?.RESULT;
                this.getView().byId("idAufnr").setText(activeOrderData.AUFNR);
                this.getView().byId("idKdauf").setText(activeOrderData.KDAUF);
                this.getView().byId("idMalzeme").setText(activeOrderData.MALZEME);
                this.getView().byId("idMensei").setText(activeOrderData.MENSEI);
                this.getView().byId("idKalite").setText(activeOrderData.KALITE);
                this.getView().byId("idEbat").setText(activeOrderData.EBAT);
                this.getView().byId("idBoy").setText(activeOrderData.BOY);
                this.getView().byId("idVakum").setText(activeOrderData.VAKUM);
            },
            isEmptyObject: function (obj) {
                if (!(!!obj)) {
                    return true;
                }
                var x;
                for (x in obj) {
                    return false;
                }
                return true;
            },
            getObjek: function () {
                TransactionCaller.async("MES/Itelli/CAN_FRN/T_GET_OBJEK",
                    {
                        I_NODEID: this.appData.node.nodeID
                    },
                    "O_JSON",
                    this.onGetObjekCB,
                    this,
                    "GET"
                );
            },
            onGetObjekCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                iv_scope._oObjek = iv_data[0].Rowsets.Rowset.Row.OBJEK;
            },
            onSubmitBatch:function(oEvent){
                var batch = this.getView().byId("idBatch").getValue();
                if(!!batch){
                    this.getComponentQuantity(batch);
                }
            },
            getComponentQuantity(inputValue) {
                var objek = this._oObjek;
                var inputBarcodeValue = inputValue;
                var aufnr = activeOrderData.AUFNR;
                var workcenterid = this.appData.node.workcenterID;
                var plant = this.appData.plant;
                var type = 0;
                if (objek == "2002KTKTAS" || objek == "2002KTKBOYA") type = 1;

                var params = {
                    "Param.1": aufnr,
                    "Param.2": inputBarcodeValue,
                    "Param.3": workcenterid,
                    "Param.4": plant,
                    "Param.5": type,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantityFlm/getTableQuantityQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callMeterage);
            },

            callMeterage: function (p_this, p_data) {
                var meterage = "";
                var consumptionMatnr = "";
                if (!!p_data.Rowsets.Rowset[0]?.Row) {
                    var meterage = p_data.Rowsets.Rowset[0]?.Row[0].QUANTITY;
                    if (!!meterage) {
                        meterage = parseFloat(meterage) / 1000;
                    }
                    consumptionMatnr = p_data.Rowsets.Rowset[0].Row[0].MATNR;
                    p_this._selectedMeterage = meterage;
                    p_this._selectedConsumptionMatnr = consumptionMatnr;
                }
                if (!(!!meterage) || !(!!consumptionMatnr)) {
                    p_this._selectedMeterage = "";
                    p_this._selectedConsumptionMatnr = "";
                }
                p_this.getView().byId("idQuantity").setValue(p_this._selectedMeterage);

            },
            insertConsumption: function () {
                var appData = this.appData;
                var client = appData.client;
                var plant = appData.plant;
                var nodeID = appData.node.nodeID;
                var workcenterID = appData.node.workcenterID;
                var aufnr = activeOrderData.AUFNR;
                var aprio = "0010";
                var userID = appData.user.userID;
                var matnr = "TASLANMIS_KUTUK";

                var movetype = 261;

            

                var newBatch, quantity, uom, consumptionMatnr;
                
                newBatch = this.getView().byId("idBatch").getValue();
                quantity = this.getView().byId("idQuantity").getValue();
                uom="TO";
                consumptionMatnr = this._selectedConsumptionMatnr;

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
                    I_MATNR: consumptionMatnr,
                    I_NEWBATCH: newBatch,
                    I_MOVETYPE: movetype,
                    I_QUANTITY: quantity,
                    I_UOM: uom,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantityFlm/insertConsumptionXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                sap.m.MessageToast.show(
                    this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                );

                movetype = 101;
                this.onClickSaveReportedQuantity(movetype);
            },
            onClickSaveReportedQuantity: function (movetype, material) {

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
                        goodAndRejectedDataCollection[0].releasedID = activeOrderData.RELEASED_ID;
                    goodAndRejectedDataCollection[0].aufnr = activeOrderData.AUFNR;
                    goodAndRejectedDataCollection[0].movetype = movetype;

                    if (!!material) goodAndRejectedDataCollection[0].material = material;

                    goodAndRejectedDataCollection[0].objek = this._oObjek;

                    var objek = this._oObjek;
                    this.screenObj.inputChar=[];
                    var params = {
                        inputXML: JSON.stringify(goodAndRejectedDataCollection[0]),
                        inputChar: JSON.stringify(this.screenObj.inputChar),
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ReportQuantityFlm/reportConfirmationXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    sap.m.MessageToast.show(
                        this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
                    );
                }
            },
            onPressNotConfirmedBatchList:function(oEvent){
                if (!this._oDialogNotConfirmed) {
                    this._oDialogNotConfirmed = sap.ui.xmlfragment(
                        "notConfirmedList",
                        "customActivity.fragmentView.notConfirmedList",
                        this
                    );
                    this.getView().addDependent(this._oDialogNotConfirmed);
                }
                this._oDialogNotConfirmed.open();
                TransactionCaller.async("MES/Itelli/TAS/T_GET_NOT_CONFIRMED_BATCH",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID,
                        I_NODEID: this.appData.node.nodeID,
                        I_WERKS: this.appData.plant,
                        I_AUFNR:activeOrderData.AUFNR
                    },
                    "O_JSON",
                    this.getNotConfirmedCB,
                    this,
                    "GET"
                );
                sap.ui.core.Fragment.byId("notConfirmedList", "idNotConfirmedTable").setBusy(true);
            },
            getNotConfirmedCB: function (iv_data, iv_scope) {
                sap.ui.core.Fragment.byId("notConfirmedList", "idNotConfirmedTable").setBusy(false);
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var myModel = new sap.ui.model.json.JSONModel();
                if (Array.isArray(iv_data[0].Rowsets.Rowset.Row)) {
                    myModel.setData(iv_data[0]);
                } else if (!iv_data[0].Rowsets.Rowset.Row) {
                    myModel.setData(null);
                } else {
                    var obj_iv_data = iv_data[0];
                    var dummyData = [];
                    dummyData.push(iv_data[0].Rowsets.Rowset.Row);
                    obj_iv_data.Rowsets.Rowset.Row = dummyData;
                    myModel.setData(obj_iv_data);
                }
                sap.ui.core.Fragment.byId("notConfirmedList", "idNotConfirmedTable").setModel(myModel);
            },
            onNotConfirmedClose: function (oEvent) {
                this._oDialogNotConfirmed.close();
            },
            reportProductionQuantity: function () {
                jQuery.sap.require("sap.ui.core.format.NumberFormat");
                var floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance();
                this.goodQuantityDataCollection = [];
                this.rejectedQuantityDataCollection = [];
                var mostRecentReportingTime = sap.oee.ui.Utils.getMostRecentReportingTime(
                    this.appData.shift.startTimestamp,
                    this.appData.shift.endTimestamp,
                    this.appData.selected.startTimestamp
                );
                var quantityToBeReported = this.getView().byId("idQuantity").getValue();
                var uomForQuantityToBeReported = "TO";
                if (
                    quantityToBeReported != undefined &&
                    quantityToBeReported != "" &&
                    uomForQuantityToBeReported != ""
                ) {
                    var reportedData = {};
                    if (
                        isNaN(parseFloat(quantityToBeReported))
                    ) {
                        return false;
                    } else {
                        quantityToBeReported = parseFloat(
                            quantityToBeReported
                        );
                    }
                    reportedData.client = this.appData.client;
                    reportedData.plant = this.appData.plant;
                    reportedData.runID = activeOrderData.RUN_ID;
                    reportedData.nodeID = this.appData.node.nodeID;
                    reportedData.material = "TASLANMIS_KUTUK";
                    reportedData.comments = "";
                    reportedData.batchNo = this.getView().byId("idBatch").getValue();
                    reportedData.serialNo = "";
                    reportedData.dcElementType = "GOOD_QUANTITY";

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
                    reportedData.dcElement = "GOOD_QUANTITY";
                    reportedData.quantity = this.getView().byId("idQuantity").getValue();;
                    reportedData.uom = "TO";
                    this.goodQuantityDataCollection.push(reportedData);
                }
                return true;
            },
        });
    }
);
