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
        var vis = "false";
        var that;
        var readBarcodeInfo = {};
        var isConfirmClicked = false;
        return Controller.extend("customActivity/controller/oeeBatchConfirm", {

            onInit: function () {

                that = this;
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.getObjek();
                this.getLastCycle();
                this.haschange();
                focusInterval = setInterval( that.startFocusInterval, 1000);
                this.EndFocusInterval();
                this.getRemainingConf();
            },

            getRemainingConf:function(){

             var cycleNo = this.getView().byId("idCycleNo").getValue();
            var workcenterid = this.appData.node.workcenterID;
                var response = TransactionCaller.sync(
                  "MES/Itelli/CAN_FRN/TEYIT/T_REMAINING_CONF_BATCH",
                  {
                    I_CYCLENO: cycleNo,
                    I_WORKCENTERID:workcenterid
                  },
                  "O_JSON"
                );
               
                if(!!response[0].Rowsets.Rowset.Row.NONCONFBATCH){

                    this.getView().byId("idRemainingBatch").setValue(response[0].Rowsets.Rowset.Row.NONCONFBATCH);

                }
                   
            
            },



            
            haschange : function () {

                window.onhashchange = function (){
                    
                    

                    if(!!window.location.href.includes("ZACT_BATCH_CONFIRM")){
                        
                    }
                    else{
                        clearInterval(focusInterval);                
                    }
                    
                };


            },

            startFocusInterval : function () {
                
                

                that.getView().byId("idBatch").focus();
                that.getRemainingConf();
              
               
            },

            EndFocusInterval : function () {

                

                var a = setTimeout(() => {

                    document.getElementById(this.getView().byId("batchConfirmPage").sId).addEventListener("click" ,function  () {

        
                        clearInterval(focusInterval);  
                    
                    });
                    
                }, 2000);


               
                

               

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
            getLastCycle: function () {
                TransactionCaller.async(
                    "MES/Itelli/CAN_FRN/T_GET_LAST_CYCLE_NO",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID,
                        I_TEYIT:"X"
                    },
                    "O_JSON",
                    this.getLastCycleCB,
                    this,
                    "GET"
                );
            },
            getLastCycleCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var cycleNo = iv_data[0]?.CYCLENO;
                iv_scope.getView().byId("idCycleNo").setValue(cycleNo);
            },
            onSubmitBatch: function (oEvent) {
                readBarcodeInfo = {};
                var batch = this.getView().byId("idBatch").getValue();
                var cycleNo = this.getView().byId("idCycleNo").getValue();
                if (!(!!cycleNo)) {
                    MessageBox.error("Çevrim alanı boş bırakılamaz");
                    return;
                }
                if (!!batch) {
                    TransactionCaller.async("MES/Itelli/CAN_FRN/T_GET_BARCODE_DATAS",
                        {
                            I_CYCLENO: cycleNo,
                            I_WORKCENTERID: this.appData.node.workcenterID,
                            I_BATCH: batch,
                            I_PLANT: this.appData.plant
                        },
                        "O_JSON",
                        this.submitBatchCB,
                        this,
                        "GET"
                    );

                }
            },
            submitBatchCB: function (iv_data, iv_scope) {
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    iv_scope.clearBatchFields();
                    isConfirmClicked=false;
                    return;
                }
                if (!!iv_data[0]?.RESULT?.AUFNR) {
                    readBarcodeInfo = iv_data[0].RESULT;
                    iv_scope.getView().byId("idQuantity").setValue(readBarcodeInfo.QUANTITY);
                    iv_scope.getView().byId("idBatch").setValue(iv_data[0].RESULT.BATCH);
                    isConfirmClicked=false;

                }
            },
            clearBatchFields: function () {
                this.getView().byId("idBatch").setValue("");
                this.getView().byId("idQuantity").setValue("");
            },
            checkValidAndShowError: function (variable, message) {
                var result = false;
                if (!(!!variable)) {
                    MessageBox.error(message);
                    this.clearBatchFields();
                    result = true;
                }
                return result;
            },
            onCheckBeforeConfirm: function (oEvent) {

                focusInterval = setInterval( that.startFocusInterval, 1000);
                if (!isConfirmClicked) {
                    isConfirmClicked=true;
                    this.saveButtonEnabled(false);
                    var batch = this.getView().byId("idBatch").getValue();
                    var cycleNo = this.getView().byId("idCycleNo").getValue();
                    var quantity = this.getView().byId("idQuantity").getValue();
                    var aufnr = readBarcodeInfo?.AUFNR;
                    var checkArr = [
                        { variable: cycleNo, message: "Çevrim alanı boş bırakılamaz" },
                        { variable: batch, message: "Parti numarası boş bırakılamaz" },
                        { variable: aufnr, message: "Parti numarası girildikten sonra Enter tuşuna basın" },
                        { variable: quantity, message: "Sağlam miktar alanı boş bırakılamaz" }
                    ];
                    this.getView().byId("batchConfirmPage").setBusy(true);
                    var isReturn = false;
                    for(let i=0;i<checkArr.length;i++){
                        if (that.checkValidAndShowError(checkArr[i].variable, checkArr[i].message)) {
                            that.getView().byId("batchConfirmPage").setBusy(false);
                            isConfirmClicked=false;
                            this.saveButtonEnabled(true);
                            isReturn=true;
                            break;
                        }
                    }    
                    
                    if(isReturn)
                        return;

                    if (isNaN(parseFloat(quantity))) {
                        this.getView().byId("batchConfirmPage").setBusy(false);
                        isConfirmClicked=false;
                        this.saveButtonEnabled(true);
                        MessageBox.error("Sağlam miktar formatı hatalı");
                        return;
                    }

                    TransactionCaller.async("MES/Itelli/CAN_FRN/T_CHECK_BEFORE_CONFIRM",
                        {
                            I_CYCLENO: cycleNo,
                            I_WORKCENTERID: this.appData.node.workcenterID,
                            I_BATCH: batch,
                            I_AUFNR: aufnr,
                            I_PLANT: this.appData.plant,
                            I_NODEID: this.appData.node.nodeID
                        },
                        "O_JSON",
                        this.onCheckBeforeConfirmCB,
                        this,
                        "GET"
                    );
                    this.getView().byId("batchConfirmPage").setBusy(true);
                }

               

            },
            onCheckBeforeConfirmCB: function (iv_data, iv_scope) {
                iv_scope.getView().byId("batchConfirmPage").setBusy(false);
                if (iv_data[1] == "E") {
                    isConfirmClicked=false;
                    iv_scope.saveButtonEnabled(true);
                    iv_scope.clearBatchFields();
                    MessageBox.error(iv_data[0]);
                    return;
                }
                iv_scope.onClickConfirm();
                iv_scope.getRemainingConf();

            },
            onClickConfirm: function () {

                var batch = this.getView().byId("idBatch").getValue();
                var aufnr = readBarcodeInfo.AUFNR;
                var plant = this.appData.plant;
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var workcenterID = this.appData.node.workcenterID;
                var aprio = "0010"
                var userID = this.appData.user.userID;
                var matnr = "FILMASIN"
                var movetype = 261;
         
                TransactionCaller.async("MES/Itelli/CAN_FRN/TEYIT/T_CALL_CANFRN_CONF_DATA",
                {
                    I_AUFNR: aufnr,
                    I_BATCH: batch,
                    I_CONFDATE:"",
                    I_PLANT: plant,
                    I_USER: userID
                },
                "O_JSON",
                this.onClickConfirmCB,
                this,
                "GET"
            );
               
            },

            onClickConfirmCB: function(iv_data, iv_scope)  {
                
                iv_scope.clearBatchFields(); 
                iv_scope.saveButtonEnabled();
                iv_scope.getRemainingConf();
                if(iv_data[1]=="S"){

                    MessageBox.information("Teyit Başarılı Gönderildi.")


                }

                if(iv_data[1]=="E"){

                    MessageBox.error(iv_data[0])


                }



                       
            },
            saveButtonEnabled:function(state){
                this.getView().byId("idButton").setEnabled(state);
            },
            /*
            insertConsumption: function (quantity) {
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var workcenterID = this.appData.node.workcenterID;
                //var aufnr = appData.selected.order.orderNo;
                var aprio = "0010"
                var userID = this.appData.user.userID;
                var matnr = "FILMASIN"

                var movetype = 261;


                params = {
                    I_CLIENT: client,
                    I_WERKS: plant,
                    I_NODEID: nodeID,
                    I_WORKCENTERID: workcenterID,
                    I_AUFNR: aufnr,
                    I_APRIO: aprio,
                    I_USERID: userID,
                    I_BARCODE: batch,
                    I_CONSUMPTIONTYPE: 30,
                    I_MATNR: matnr,
                    I_NEWBATCH: batch,
                    I_MOVETYPE: movetype,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantity/Operations/insertConsumptionFosfatXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.insertConsumptionCB);

            },
            insertConsumptionCB:function(p_this,p_data){
                // Hata yönetimi

                p_this.reportConfirmation(101);
            },
            */

            reportConfirmation: function (movetype) {
                var timestamp = new Date().getTime();
                var inputXML = {};
                inputXML.client = this.appData.client;
                inputXML.plant = this.appData.plant;
                inputXML.runID = readBarcodeInfo.RUN_ID;
                inputXML.nodeID = this.appData.node.nodeID;
                inputXML.material = "TAVLANMISFILMASIN";
                inputXML.comments = "";
                inputXML.batchNo = this.getView().byId("idBatch").getValue();
                inputXML.dcElementType = "GOOD_QUANTITY";
                inputXML.startTimestamp = timestamp;
                inputXML.endTimestamp = timestamp;
                inputXML.dcElement = "GOOD_QUANTITY";
                inputXML.quantity = parseFloat(this.getView().byId("idQuantity").getValue());
                inputXML.uom = "TO";
                inputXML.releasedID = readBarcodeInfo.RELEASED_ID;
                inputXML.aufnr = readBarcodeInfo.AUFNR;
                inputXML.movetype = movetype;
                inputXML.objek = this.oObjek;

                var inputChar = [];

                var params = {
                    inputXML: JSON.stringify(inputXML),
                    inputChar: JSON.stringify(inputChar),
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ReportQuantityFlm/reportConfirmationXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.reportConfirmationCB);
                this.getView().byId("batchConfirmPage").setBusy(true);

            },
            reportConfirmationCB: function (p_this, p_data) {
                p_this.getView().byId("batchConfirmPage").setBusy(false);
                MessageBox.information("Teyit gönderildi");
                p_this.getView().byId("idBatch").setValue("");
                p_this.getView().byId("idQuantity").setValue("");
                readBarcodeInfo = {};
                isConfirmClicked=false;
                p_this.saveButtonEnabled(true);
            },
            navigateCevrim: function () {

                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_CYCLE";
                window.location.href = origin + pathname + navToPage;


            },
            onRedirectManageOrders: function (oEvent) {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_ORD_CAN";
                window.location.href = origin + pathname + navToPage;
            },

            onPressNotConfirmedList: function (oEvent) {
                var cycleNo = this.getView().byId("idCycleNo").getValue();
                if (!(!!cycleNo)) {
                    MessageBox.error("Çevrim alanı boş bırakılamaz");
                    return;
                }
                if (isNaN(parseInt(cycleNo))) {
                    MessageBox.error("Çevrim formatı hatalı");
                    return;
                }
                if (!this._oDialogNotConfirmed) {
                    this._oDialogNotConfirmed = sap.ui.xmlfragment(
                        "notConfirmedList",
                        "customActivity.fragmentView.notConfirmedList",
                        this
                    );
                    this.getView().addDependent(this._oDialogNotConfirmed);
                }
                this._oDialogNotConfirmed.open();
                sap.ui.core.Fragment.byId("notConfirmedList","idNotConfirmedTable").setModel(null);
                TransactionCaller.async("MES/Itelli/CAN_FRN/T_GET_NOT_CONFIRMED_BATCH",
                    {
                        I_WORKCENTERID: this.appData.node.workcenterID,
                        I_CYCLENO: cycleNo,
                        I_NODEID: this.appData.node.nodeID,
                        I_WERKS: this.appData.plant
                    },
                    "O_JSON",
                    this.getNotConfirmedCB,
                    this,
                    "GET"
                );
                var myModel = new sap.ui.model.json.JSONModel();
                sap.ui.core.Fragment.byId("notConfirmedList","idNotConfirmedTable").setModel(myModel);
                sap.ui.core.Fragment.byId("notConfirmedList", "idNotConfirmedTable").setBusy(true);
            },
            getNotConfirmedCB: function (iv_data, iv_scope) {
                sap.ui.core.Fragment.byId("notConfirmedList", "idNotConfirmedTable").setBusy(false);
                if (iv_data[1] == "E") {
                    var myModel = new sap.ui.model.json.JSONModel();
                    sap.ui.core.Fragment.byId("notConfirmedList","idNotConfirmedTable").setModel(myModel);
                    MessageBox.error(iv_data[0]);
                    return;
                }
                var result = [];
                var keyFields = ["BATCH","AGIRLIK","CAP","KALITE","CASTNO","MENSEI","MUSTERI"];
                if(!!iv_data[0]?.Rowsets?.Rowset?.Row){
                    var responseArr = Array.isArray(iv_data[0].Rowsets.Rowset.Row) ? iv_data[0].Rowsets.Rowset.Row : new Array(iv_data[0].Rowsets.Rowset.Row);
                    var distinctBatchArr = [...new Set(responseArr.map(item=>item.BATCH))];
                    distinctBatchArr.forEach((batch) => {
                        var currentBatchObj = {};
                        var filteredArr = responseArr.filter((item) => item.BATCH == batch);
                        keyFields.forEach((key) => {
                            currentBatchObj[key] = filteredArr[0][key];
                        });
                        filteredArr.forEach((item) => {
                            currentBatchObj[item.CHARCODE]=item.CHARVALUE;
                        });
                        result.push(currentBatchObj);
                    });
                }

                var myModel = new sap.ui.model.json.JSONModel();
                myModel.setData(result);
                sap.ui.core.Fragment.byId("notConfirmedList", "idNotConfirmedTable").setModel(myModel);
            },
            onNotConfirmedClose: function (oEvent) {
                this._oDialogNotConfirmed.close();
            },





        });
    }
);
