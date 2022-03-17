sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "sap/m/Label",
        "sap/m/Dialog",
        "sap/m/DialogType",
        "sap/m/Button",
        "sap/m/ButtonType",
        "sap/ui/core/CustomData",
        "customActivity/scripts/custom",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "customActivity/scripts/customStyle",
        "sap/ui/model/FilterType",
        "sap/m/MessageToast",
        "customActivity/scripts/transactionCaller",
        "sap/m/library"
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        Label,
        Dialog,
        DialogType,
        Button,
        ButtonType,
        CustomData,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        customStyle,
        FilterType,
        MessageToast,
        TransactionCaller,
        mLibrary
    ) {
        var vis = "false";
        var that;
        var oCurrentLine = {};
        var componentHeader = [
            { AUFNR: "idAufnr" },
            { Y_PAKET_AGIRLIK_KG: "idAgirlik" },
            { customerName: "idCustomer" },
            { orderERPGroupNo: "idGroup" },
            { Y_KALITE_TAVFLM: "idKalite" },
            { Miktar: "idMiktar" },
            { Y_URETILECEK_PAKSAY: "idPaketSayisi" },
            { Y_CAP_FLM_MM: "idCap" },
            { Y_KUTUK_MENSEI: "idMensei" },
            { Y_PAKET_AGIRLIK_KG: "idAgirlik" },
            { Y_AYT: "idAYT" },
            { Y_URETIM_YONTEMI_FLM: "idUretim" },
            { Y_MENSEI_FLM: "idFMensei" }
        ];
        return Controller.extend("customActivity/controller/oeeSelectOrderCAN", {

            onInit: function () {
                that = this;
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                

                this.fetchOrders();
                this.getObjek();
                this.setOnlyNumberListener();
                //this.batchFocusListener();
                this.haschange() ;
            },
            batchFocusListener: function (oEvent) {
                var batchInput = this.getView().byId("idBatch");
                batchInput.addEventDelegate({
                    onfocusin: function () {
                        jQuery.sap.require("sap.ndc.BarcodeScanner");
                        sap.ndc.BarcodeScanner.scan(
                            function (mResult) {
                                alert("We got a bar code\n" +
                                    "Result: " + mResult.text + "\n" +
                                    "Format: " + mResult.format + "\n" +
                                    "Cancelled: " + mResult.cancelled);
                            },
                            function (Error) {
                                alert("Scanning failed: " + Error);
                            },
                        );
                    }
                })
            },
            resetLocation: function () {
                this.getView().byId("idRadioUst").setSelected(false);
                this.getView().byId("idRadioOrta").setSelected(false);
                this.getView().byId("idRadioAlt").setSelected(false);
                this.getView().byId("idRadioOrta").setEnabled(true);
            },
            getObjek: function () {
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_GET_OBJEK",
                    {
                        I_NODEID: this.appData.node.nodeID
                    },
                    "O_JSON",
                    this.getObjekCB,
                    this,
                    "GET"
                );
            },
            getObjekCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                iv_scope.oObjek = iv_data[0]?.Rowsets?.Rowset?.Row?.OBJEK;
            },
            fetchOrders: function () {
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var client = this.appData.client;
                var startTimeStamp = this.appData.shift.startTimestamp;
                var endTimestamp = this.appData.shift.endTimestamp;
                var userlocal = this.appData.userLocale;
                var obj = {
                    client: client,
                    plant: plant,
                    nodeID: nodeID,
                    startTimeStamp: startTimeStamp,
                    endTimeStamp: endTimestamp,
                    status: [
                        { name: "NEW" },
                        { name: "ACT" },
                    ],
                    shiftRelated: true,
                    extensionClient: client,
                    extensionPlant: plant,
                    extensionNodeID: nodeID,
                    userLocale: userlocal,
                    plantTimezoneOffset: 0,
                };
                this.getView().byId("idOrdersTable").setBusy(true);
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_GET_ORDER_FIELDS",
                    {
                        I_DATA: nodeID
                    },
                    "O_JSON",
                    this.fetchOrdersCB,
                    this,
                    "GET"
                );
            },
            onPressAufnrDetails: function (oEvent) {
                var pressedAufnr = oEvent.getSource().getText();
                if (!this._oAufnrDialog) {
                    this._oAufnrDialog = sap.ui.xmlfragment(
                        "aufnrDetails",
                        "customActivity.fragmentView.aufnrDetails",
                        this
                    );
                    this.getView().addDependent(this._oAufnrDialog);
                }
                this._oAufnrDialog.open();
                var myModel = new sap.ui.model.json.JSONModel();
                sap.ui.core.Fragment.byId("aufnrDetails", "idAufnrDetails").setModel(myModel);
                this.getAufnrDetails(pressedAufnr);
            },
            getAufnrDetails: function (aufnr) {
                TransactionCaller.async("MES/Itelli/CAN_FRN/AUFNR_DETAILS/T_AUFNR_DETAILS",
                    {
                        I_AUFNR: aufnr
                    },
                    "O_JSON",
                    this.getAufnrDetailsCB,
                    this,
                    "GET"
                );
            },
            getAufnrDetailsCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var atnamArr = ["Y_ROTOR_TIPI", "Y_PAKETLEME_TAVFLM", "Y_MENSEI_FLM", "Y_BOYAMA", "Y_ULKE", "Y_ACIKLAMA", "Y_KALITE_TAVFLM", "Y_KALITE_FLM"];
                if (!!iv_data[0]?.Rowsets?.Rowset?.Row) {
                    var resultArr = [];
                    var responseArr = Array.isArray(iv_data[0].Rowsets.Rowset.Row) ? iv_data[0].Rowsets.Rowset.Row : new Array(iv_data[0].Rowsets.Rowset.Row);
                    var obj = {};
                    responseArr.forEach((item) => {
                        var key = `${item.CHARC}_VAL`;
                        obj[key] = item.CHARC_VALUE;
                    });
                    resultArr.push(obj);
                    var myModel = new sap.ui.model.json.JSONModel();
                    myModel.setData(resultArr);
                    sap.ui.core.Fragment.byId("aufnrDetails", "idAufnrDetails").setModel(myModel);
                }

            },
            onAufnrDetailsClose: function (oEvent) {
                this._oAufnrDialog.close();
            },
            getERPGroupNo: function (ordersResponse) {
                var aufnr = this.splittedWithCommaAufnrs(ordersResponse, true);
                var aprio = "0010"
                var plant = this.appData.plant;
                var params = {
                    "Param.1": plant,
                    "Param.2": aprio,
                    "Param.3": aufnr,
                };
                var tRunner = new TransactionRunner(
                    "MES/Itelli/CAN_FRN/Q_GET_ERP_GROUP_NO",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var oData = tRunner.GetJSONData();

                return oData[0];
            },
            getCustomerNames: function (musteriCodeArr) {
                var customerCode = this.splittedWithCommaAufnrs(musteriCodeArr, true, "CHARVALUE")
                var params = {
                    "Param.1": customerCode
                };
                var tRunner = new TransactionRunner(
                    "MES/Itelli/CAN_FRN/Q_GET_CUSTOMER_NAMES",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var oData = tRunner.GetJSONData();

                return oData[0];
            },
            fetchOrdersCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    this.getView().byId("idOrdersTable").setBusy(false);
                    MessageBox.show(iv_data[0]);
                }
                var result = [];
                if (!!iv_data[0]?.Rowsets?.Rowset?.Row) {
                    result = Array.isArray(iv_data[0].Rowsets.Rowset.Row) ? iv_data[0].Rowsets.Rowset.Row : new Array(iv_data[0].Rowsets.Rowset.Row);
                }
                if (result.length > 0) {
                    var charResult = iv_scope.getCharacteristic(result);
                    var groupResult = iv_scope.getERPGroupNo(result);
                    var aciklamaResult = iv_scope.getAciklama(result);
                    var kaliteFlmResult = iv_scope.getKaliteFLM(result);

                    if (charResult?.Row.length > 0) {
                        var musteriCodeArr = charResult.Row.filter(musteri => musteri.CHARCODE == "Y_MUSTERI");
                        var customerResult = iv_scope.getCustomerNames(musteriCodeArr);
                        result.forEach((item) => {
                            var filteredCharacteristics = charResult.Row.filter((filterItem) => item.AUFNR == filterItem.AUFNR);
                            if (!!aciklamaResult) {
                                var isAciklama = aciklamaResult.filter((ack) => ack.AUFNR == item.AUFNR)[0];
                                var aciklamaStatus = !!isAciklama.ACIKLAMA ? true : false;
                            }
                            if (filteredCharacteristics.length > 0) {
                                filteredCharacteristics.forEach((filterItems) => {
                                    item[filterItems.CHARCODE] = filterItems.CHARVALUE;
                                });
                            }
                            if (!!groupResult && groupResult?.Row?.length > 0) {
                                item.orderERPGroupNo = groupResult.Row.filter((group) => group.AUFNR == item.AUFNR)[0]?.GRUP_NO;
                            }
                            if (!!customerResult && customerResult?.Row?.length > 0) {
                                item.customerName = customerResult.Row.filter((name) => name.MUSTERI_KODU == item.Y_MUSTERI)[0]?.MUSTERI_ADI;
                            }
                            if (!!kaliteFlmResult && kaliteFlmResult[0].length > 0) {
                                item.Y_KALITE_FLM = kaliteFlmResult[0].filter((kalite) => kalite.AUFNR == item.AUFNR)[0]?.Y_KALITE_FLM;
                            }

                            item.ACIKLAMA = aciklamaStatus
                        });
                    }

                    result.sort((a, b) => ((parseInt(a.orderERPGroupNo) > parseInt(b.orderERPGroupNo)) ? 1 : (parseInt(b.orderERPGroupNo) > parseInt(a.orderERPGroupNo)) ? -1 : 0));

                    var myModel = new sap.ui.model.json.JSONModel();
                    myModel.setData(result);
                    iv_scope.getView().byId("idOrdersTable").setModel(myModel);

                    iv_scope.tableBackground();
                }
                iv_scope.getView().byId("idOrdersTable").setBusy(false);
                if (!!iv_scope.oView?.oViewData?.mode) {
                    var aufnr = iv_scope.oView.oViewData.mode;
                    var filteredArr = result.filter((item) => item.AUFNR == aufnr);
                    if (filteredArr.length > 0) {
                        var currentLineObj = filteredArr[0];
                        iv_scope.onPressActive(null, currentLineObj);
                    }
                }
            },
            getKaliteFLM: function (aufnrArr) {
                var dummyAufnrArr = JSON.parse(JSON.stringify(aufnrArr));
                var str = "";
                dummyAufnrArr.forEach((item, index) => {
                    str = str + item.AUFNR;
                    if (index != dummyAufnrArr.length - 1) {
                        str = str + ",";
                    }
                })
                var response = TransactionCaller.sync(
                    "MES/Itelli/CAN_FRN/KALITE_FLM/T_GET_KALITE_FLM",
                    {
                        I_AUFNRS: str
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                if (!!response[0]?.RESULT?.item) {
                    var responseArr = Array.isArray(response[0].RESULT.item.Row) ? response[0].RESULT.item : new Array(response[0].RESULT.item);
                    return responseArr;
                }
                return null;
            },
            getAciklama: function (ordersResponse) {
                var aufnrs = this.splittedWithCommaAufnrs(ordersResponse, false, false, false);
                var response = TransactionCaller.sync(
                    "MES/Itelli/CAN_FRN/AUFNR_DETAILS/T_IS_AUFNR_ACIKLAMA_EXISTS",
                    {
                        I_AUFNRS: aufnrs
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                if (!!response[0]?.Rowsets?.Rowset?.Row) {
                    var responseArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    return responseArr;
                }
                return null;

            },
            paketAgirlikTon(kg) {
                return !!kg && !isNaN(parseFloat(kg)) ? parseFloat(kg) / 1000 : kg;
            },
            tableBackground: function () {
                var tableItems = this.getView().byId("idOrdersTable")?.getItems();
                if (!!tableItems && tableItems.length > 0) {
                    tableItems.forEach((item) => item.removeStyleClass("canTableBackground"));
                    var aufnr = this.getLastAufnrForCurrentCycle();
                    if (!!aufnr) {
                        var currentModel = this.getView().byId("idOrdersTable").getModel();
                        var index = currentModel?.oData?.findIndex((item) => item.AUFNR == aufnr);
                        if (index != undefined && index > -1) {
                            tableItems[index].addStyleClass("canTableBackground");
                            this.getView().byId("idOrdersTable").getModel().refresh();
                        }
                    }
                }


            },
            getLastAufnrForCurrentCycle: function () {
                var response = TransactionCaller.sync(
                    "MES/Itelli/CAN_FRN/T_GET_ACTIVE_AUFNR_FOR_CYCLE",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID
                    },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                if (!!response[0]?.Rowsets?.Rowset?.Row) {
                    var lastAufnrObj = response[0].Rowsets.Rowset.Row;
                    return lastAufnrObj?.AUFNR;
                }
                return null;
            },
            onRadioGroupSelect: function (oEvent) {
                //idRadioGroup
            },
            onPressTableRow: function (oEvent) {

            },
            onPressClearBatchInput: function (oEvent) {
                this.getView().byId("idBatch").setValue("");
                this.getView().byId("idPalet").setValue("");
                this.resetLocation();
                MessageToast.show("Alanlar temizlendi");
            },
            onPressClearBatchFields: function (oEvent) {
                var batch = this.getView().byId("idBatch").getValue();
                if (!!batch) {
                    this.oBatchDelete = new Dialog({
                        type: 'Message',
                        title: "Parti Sil",
                        content: new Label({ text: "Parti silinecektir. Onaylıyor musunuz?", customData: new CustomData({ key: "canBatch", value: "TITLE", writeToDom: true }) }),
                        beginButton: new Button({
                            text: "Evet",
                            class: "cycleBtnInner",
                            press: function () {
                                this.clearBatch();
                                this.oBatchDelete.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "İptal",
                            class: "cycleBtnInner",
                            press: function () {
                                this.oBatchDelete.close();
                            }.bind(this)
                        })
                    });

                    this.getView().addDependent(this.oBatchDelete);

                    this.oBatchDelete.open();
                }
                else {
                    this.getView().byId("idBatchWeight").setValue("");
                    this.getView().byId("idBatch").setValue("");
                    this.getView().byId("idBatch").setEnabled(true);
                    this.getView().byId("idPalet").setValue("");
                    this.resetLocation();
                }

            },
            clearBatch: function () {
                var batch = this.getView().byId("idBatch").getValue();
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/CLEAR_BATCH/T_CLEAR_BATCH",
                    {
                        I_BATCH: batch
                    },
                    "O_JSON",
                    this.clearBatchCB,
                    this,
                    "GET"
                );
            },
            clearBatchCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                iv_scope.getView().byId("idBatchWeight").setValue("");
                iv_scope.getView().byId("idBatch").setValue("");
                iv_scope.getView().byId("idPalet").setValue("");
                iv_scope.getView().byId("idBatch").setEnabled(true);
                iv_scope.resetLocation();
                MessageBox.information("Parti silindi");
            },
          

            onSubmitPartiNo: function () {
                this.byId("idBatch").setBusy(true);
                var agirlik = this.getView().byId("idBatchWeight").getValue();
                var aufnr1 = parseInt(oCurrentLine?.AUFNR);
                var aufnr = `0000${aufnr1}`;
                var batch = this.getView().byId("idBatch").getValue();
                var client = this.appData.client;
                var musteri = oCurrentLine?.Y_MUSTERI;
                var currentCycleNo = this.getView().byId("idCycleNo").getValue();
                var groupNo = this.getView().byId("idGroup").getText();
                var matnr = oCurrentLine?.MATNR;
                var kutukMensei = oCurrentLine?.Y_KUTUK_MENSEI;
                var nodeid=this.appData.node.nodeID;
                var objeck=this.oObjek;
                var operation = "0010";
                var paketSayisi = this.getView().byId("idPaketSayisi").getText();
                var plant = "2002";
                var user = this.appData.user.userID;
                var paketAgirlik = this.getView().byId("idAgirlik").getText();
                var WORKCENTERID = this.appData.node.workcenterID;
                var remainingBatch = this.getView().byId("idRemainingBatch").getValue();
                var textMusteri = oCurrentLine?.customerName;
                var salesorder = oCurrentLine?.SALESORDER;
                if (remainingBatch <= 0) {
                    MessageBox.error("Bu sipariş için daha fazla parti okutulamaz");
                    sap.ui.core.BusyIndicator.hide();
                    return;
                }

                if (!(!!currentCycleNo)) {
                    MessageBox.error("Çevrim girilmeden parti okutulamaz");
                    sap.ui.core.BusyIndicator.hide();
                    return;
                }

                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_CHECK_BEFORE_CONS",
                    {   I_SALESORDER:salesorder,
                        I_TEXTMUSTERI:textMusteri,
                        I_AUFNR:aufnr,
                        I_BATCH:batch,
                        I_CLIENT:client,
                        I_COSTUMER:musteri,
                        I_CYCLENO:currentCycleNo,
                        I_GROUPNO:groupNo,
                        I_MATNR:matnr,
                        I_MENSEI:kutukMensei,
                        I_NODEID:nodeid,    
                        I_OBJECK:objeck,
                        I_OPERATION:operation,
                        I_PAKSAY:paketSayisi,
                        I_PLANT:plant,
                        I_USER:user,
                        I_WEIGHT:paketAgirlik,
                        I_WORKCENTERID:WORKCENTERID,
                        I_BARCODEWEIGHT:agirlik

                    },
                    "O_JSON",
                    this.onSubmitPartiNoCB,
                    this
                );
            },
            onSubmitPartiNoCB: function (iv_data, iv_scope) {

                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    iv_scope.getView().byId("idBatch").setValue("");
                    iv_scope.byId("idBatch").setBusy(false);
                    return;
                }


                if (iv_data[1] == "S") {
                    iv_scope.getView().byId("idBatchWeight").setValue(iv_data[0].RESULT.WEIGHT);
                    iv_scope.getView().byId("idBatch").setValue(iv_data[0].RESULT.BATCH);
                    iv_scope.getView().byId("idRadioOrta").setEnabled(Boolean(iv_data[0].RESULT.MIDDLE));
                    iv_scope.getView().byId("idBatch").setEnabled(false);
                    iv_scope.byId("idBatch").setBusy(false);
                    MessageBox.information("Parti numarası kaydedildi");

                }
                iv_scope.byId("idBatch").setBusy(false);

                that.getView().byId("idPalet").setEnabled(true);


              
            },


            setOnlyNumberListener: function () {
                this.getView().byId("idPalet").onkeypress = function (e) {
                    that.valueInputFilter(that, e, "idPalet");
                }
            },
            valueInputFilter: function (that, e, inputId) {
                var val = that.getView().byId(inputId).getValue();
                var maxLength = inputId == "idCycleNo" ? 6 : 3;
                var charValue = String.fromCharCode(e.keyCode);
                if (val.includes('.') || val.includes(',')) {
                    if (charValue == ',' || charValue == '.') {
                        e.preventDefault();
                    }
                }
                if (val.length >= maxLength) {
                    e.preventDefault();
                }
                if (((isNaN(parseInt(charValue))) || (e.which == 8) || charValue == ',' || charValue == '.')) { // BSP KB code is 8
                    e.preventDefault();
                }
                if (e.keyCode == 46) {
                    e.preventDefault();
                }
                return true;
            },

            onPressEditCycleNo: function (oEvent) {
                this.currentCycleNo = this.getView().byId("idCycleNo").getValue() || "";
                this.getView().byId("idCycleNoEdit").setVisible(false);
                //this.getView().byId("idCycleNoConfirm").setVisible(true);

            },
            // onPressSaveCycleNo: function (oEvent) {
            //   var newCycleNo = this.getView().byId("idCycleNo").getValue();
            //   if (!(!!newCycleNo)) {
            //     MessageBox.error("Çevrim numarası boş bırakılamaz");
            //     this.getView().byId("idCycleNo").setValue(this.currentCycleNo);
            //     this.resetCycleNoFields();
            //     return;
            //   }
            //   if (isNaN(parseInt(newCycleNo))) {
            //     MessageBox.error("Çevrim numarasında harf veya karakter olamaz");
            //     this.resetCycleNoFields();
            //     return;
            //   }
            //   if (!!this.currentCycleNo) {
            //     TransactionCaller.async(
            //       "MES/Itelli/CAN_FRN/T_UPDATE_CYCLE_NO",
            //       {
            //         I_NEWCYCLENO: newCycleNo,
            //         I_OLDCYCLENO: this.currentCycleNo || ""
            //       },
            //       "O_JSON",
            //       this.updateCycleNoCB,
            //       this,
            //       "GET"
            //     );
            //   }

            // },
            // updateCycleNoCB: function (iv_data, iv_scope) {
            //   if (iv_data[1] == "E") {
            //     MessageBox.error(iv_data[0]);
            //     return;
            //   }
            //   MessageToast.show("Çevrim sayısı güncellendi");
            //   iv_scope.getView().byId("idCycleNoConfirm").setVisible(false);
            //   iv_scope.getView().byId("idCycleNoEdit").setVisible(true);
            // },
            resetCycleNoFields: function () {
                this.getView().byId("idCycleNoConfirm").setVisible(false);
                //this.getView().byId("idCycleNoEdit").setVisible(true);
            },


            navigateCevrim: function () {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_CYCLE";
                window.location.href = origin + pathname + navToPage;
            },



            changeVisible: function (oEvent) {
                this.fetchOrders();
                if (!vis) {
                    this.getView().byId("idPage1").setVisible(false);
                    this.getView().byId("idPage2").setVisible(true);
                    vis = true;
                }
                else {
                    this.getView().byId("idPage1").setVisible(true);
                    this.getView().byId("idPage2").setVisible(false);
                    vis = false;
                }

                
            },
            onPressActive: function (oEvent, objFromCycle) {
                oCurrentLine = {};
                var selectedAufnr="";
                var selectedAgirlik="";
                if (!!objFromCycle) {
                    selectedAufnr = objFromCycle.AUFNR;
                    selectedAgirlik = objFromCycle.Y_PAKET_AGIRLIK_KG;
                    oCurrentLine = JSON.parse(JSON.stringify(objFromCycle));
                }
                else{
                    selectedAufnr = oEvent.getSource().getBindingContext().getObject().AUFNR
                    selectedAgirlik = oEvent.getSource().getBindingContext().getObject().Y_PAKET_AGIRLIK_KG
                    oCurrentLine = oEvent.getSource().getBindingContext().getObject();
                }

                if (!(!!selectedAufnr)) {
                    MessageBox.error("Sipariş seçilemedi");
                    return;
                }
                var currentDate = new Date();
                currentDate.setTime(currentDate.getTime() + (3 * 60 * 60 * 1000));
                var dateString = currentDate.toISOString().split('.')[0];
                this.getView().byId("idOrdersTable").setBusy(true);
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_START_ORDER_ACT",
                    {
                        I_NODEID: this.appData.node.nodeID,
                        I_ORDERNO: selectedAufnr,
                        I_STRTTIME: dateString,
						I_AUFNR: selectedAufnr,
                        I_ACTIVE: "E0002"

                    },
                    "O_JSON",
                    this.startOrderCB,
                    this,
                    "GET",
                    oCurrentLine
                );

                

            },



            haschange : function () {

                window.onhashchange = function (){
                    
                    

                    if(!!window.location.href.includes("ZACT_ORD_CAN")){
                        
                    }
                    else{
                        clearInterval(focusInterval);                
                    }
                    
                };


            },

            startFocusInterval : function () {
                
               

                that.getView().byId("idBatch").focus();

              

               
            },

            EndFocusInterval : function () {

                

                var a = setTimeout(() => {

                    document.getElementsByClassName("cNo")[0].addEventListener("click", function()  {

                        
                        
                        clearInterval(focusInterval);  
                    
                    });
                    
                }, 2000);

                


               
                

               

            },



            startOrderCB: function (iv_data, iv_scope, oCurrentLine) {

                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    iv_scope.getView().byId("idOrdersTable").setBusy(false);
                    return;
                }
                iv_scope.getRemainingBatch(oCurrentLine);

            },
            getRemainingBatch: function (oCurrentLine) {
                var aufnr = "0000" + parseInt(oCurrentLine.AUFNR);
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_GET_REMAINING_BATCH",
                    {
                        I_AUFNR: aufnr

                    },
                    "O_JSON",
                    this.getRemainingBatchCB,
                    this,
                    "GET",
                    oCurrentLine
                );
            },
            getRemainingBatchCB: function (iv_data, iv_scope, oCurrentLine) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    iv_scope.getView().byId("idOrdersTable").setBusy(false);

                    return;
                }
                if (!!iv_data[0]?.REMAINING_BATCH) {
                    oCurrentLine.REMAINING_BATCH = iv_data[0].REMAINING_BATCH;
                }
                iv_scope.toReadBatchPage(oCurrentLine);


            },
            toReadBatchPage: function (selectedObj) {
                var aufnr = selectedObj.AUFNR;
                var agirlik = selectedObj.Y_PAKET_AGIRLIK_KG;
                this.getView().byId("idAufnr").setText(aufnr);
                var response = TransactionCaller.sync(
                    "MES/Itelli/CAN_FRN/T_GET_LAST_CYCLE_NO", {
                    I_WORKCENTERID: this.appData.node.workcenterID
                },
                    "O_JSON"
                );
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                var cycleNo = response[0]?.CYCLENO;
                this.getView().byId("idCycleNo").setValue(cycleNo || "");
                this.getView().byId("idOrdersTable").setBusy(false);
                this.getView().byId("idRemainingBatch").setValue(selectedObj?.REMAINING_BATCH || "");
                this.resetPage2();
                if (agirlik >= 2000) {
                    this.getView().byId("idRadioOrta").setEnabled(false);
                }
                this.getView().byId("idAgirlik").setText(agirlik);
                this.setComponentHeader(selectedObj);
            },
            setComponentHeader: function (obj) {
                componentHeader.forEach((item) => {
                    var prop = Object.keys(item)[0];
                    var id = Object.values(item)[0];
                    var val = obj[prop];
                    that.getView().byId(id).setText(val);
                })
            },
            toOrdersPage: function () {
                var hashArr = window.location.hash.split("/");
                var maybeAufnr = hashArr[hashArr.length - 1];
                if (!isNaN(parseInt(maybeAufnr))) {
                    this.appComponent.getRouter().navTo("activity", {
                        activityId: "ZACT_ORD_CAN"
                    });
                }
                else {
                    this.getView().byId("idPage1").setVisible(true);
                    this.getView().byId("idPage2").setVisible(false);
                    this.fetchOrders();
                    this.getObjek();
                }
            },
            resetPage2: function () {
                this.getView().byId("idCycleNoConfirm").setVisible(false);
                //this.getView().byId("idCycleNoEdit").setVisible(true);
                this.getView().byId("idBatch").setValue("");
                this.getView().byId("idPalet").setValue("");
                this.resetLocation();

                //Change View
                this.getView().byId("idPage1").setVisible(false);
                this.getView().byId("idPage2").setVisible(true);
                focusInterval = setInterval( that.startFocusInterval, 1000);
                this.EndFocusInterval();
            },
            getCharacteristic: function (ordersResponse) {
                var splittedArr = this.splittedWithCommaAufnrs(ordersResponse);

                var params = {
                    "Param.1": this.appData.node.workcenterID.toString(),
                    "Param.2": splittedArr
                }
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/getCharacteristicColumnsQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var oData = tRunner.GetJSONData();

                return oData[0];
            },
            splittedWithCommaAufnrs: function (aufnrArr, isInt, type, addZeros) {
                var dummyAufnrArr = JSON.parse(JSON.stringify(aufnrArr));
                var prop = "AUFNR";
                if (!!type)
                    prop = type;
                var splittedArr = "";
                dummyAufnrArr.forEach((item, index) => {
                    if (isInt)
                        item[prop] = parseInt(item[prop]);
                    if (!!addZeros)
                        item[prop] = '0000' + item[prop];
                    splittedArr = splittedArr + `'${item[prop]}'`;
                    if (dummyAufnrArr.length - 1 != index) {
                        splittedArr = splittedArr + ',';
                    }
                });
                return splittedArr;
            },
            onPressPartiSakla: function (oEvent) {

                
                    focusInterval = setInterval( that.startFocusInterval, 1000);
                    
                

                this.EndFocusInterval();

                
                if (!(!!this.getView().byId("idRadioGroup").getSelectedButton())) {
                    MessageBox.error("Lokasyon seçin");
                    return;
                }
                if (!(!!this.getView().byId("idPalet").getValue())) {
                    MessageBox.error("Palet numarası boş bırakılamaz");
                    return;
                }
                var cycleNo = this.getView().byId("idCycleNo").getValue();
                var batch = this.getView().byId("idBatch").getValue();
                var pallet = this.getView().byId("idPalet").getValue();
                var agirlik = this.getView().byId("idBatchWeight").getValue();
                var konum = this.getView().byId("idRadioGroup").getSelectedButton().mProperties.text;
                if (pallet == 0) {
                    MessageBox.error("Palet numarası 0 olamaz");
                    return;
                }
                var response = TransactionCaller.sync(
                    "MES/Itelli/CAN_FRN/T_UPDATE_CAN_CYCLE",
                    {

                        I_BATCH: batch,
                        I_PALETNO: pallet,
                        I_KONUM: konum,
                        I_CYCLENO: cycleNo,
                        I_AGIRLIK:agirlik
                    },
                    "O_JSON"
                );


                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }

                MessageBox.information("Başarılı")

                this.getView().byId("idBatch").setValue("");
                this.getView().byId("idBatch").setEnabled(true);
                this.getView().byId("idBatchWeight").setValue("");
                this.getView().byId("idPalet").setValue("");
                this.resetLocation();
                this.getRemainingBatch(oCurrentLine);

                that.getView().byId("idPalet").setEnabled(false);
                
                

            },
            onRedirectConfirmBatch: function (oEvent) {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_BATCH_CONFIRM";
                window.location.href = origin + pathname + navToPage;
            },
            onPressPartiBitir: function (oEvent) {
                this.resetPage2();
                this.getView().byId("idPage1").setVisible(true);
                this.getView().byId("idPage2").setVisible(false);
                this.fetchOrders();
            }

        });
    }
);
