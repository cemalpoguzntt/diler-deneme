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
        "sap/ui/core/Fragment",
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
        customStyle,
        TransactionCaller,
        Fragment
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
        return Controller.extend("customActivity.controller.oeeSelectOrderTaslama", {
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
                that = this ;
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.appData.intervalState = true;
                
                this.appComponent.getEventBus().subscribe(
                    this.appComponent.getId(),
                    "shiftChanged",
                    //  this.refreshOrderData,
                    this
                );


                this.getTableModel();
                this.getStoneModel();
              
            },


            openTasFrag : function () {

                if (!this.createNotificationFragment) {
                    this.createNotificationFragment = sap.ui.xmlfragment("stonedata", "customActivity.fragmentView.stoneData", this);
                    this.getView().addDependent(this.createNotificationFragment);

                  
                   
                }

                this.createNotificationFragment.open();
                sap.ui.core.Fragment.byId("stonedata", "forget").setState(false);
                sap.ui.core.Fragment.byId("stonedata", "DTP1").setEditable(false);
                sap.ui.core.Fragment.byId("stonedata", "DTP2").setEditable(false);
                 


            },

            dateActive:function(){
                if(sap.ui.core.Fragment.byId("stonedata", "forget").getState()==0){

                    sap.ui.core.Fragment.byId("stonedata", "DTP1").setEditable(false);
                    
                    sap.ui.core.Fragment.byId("stonedata", "DTP1").setValue("");
					sap.ui.core.Fragment.byId("stonedata", "DTP2").setEditable(false);
                    
                    sap.ui.core.Fragment.byId("stonedata", "DTP2").setValue("");
               
                
                }
                if(sap.ui.core.Fragment.byId("stonedata", "forget").getState()==1){

                    sap.ui.core.Fragment.byId("stonedata", "DTP1").setEditable(true);
                    sap.ui.core.Fragment.byId("stonedata", "DTP2").setEditable(true);
                   
                
                }






            },
            handleFChange1: function (oEvent) {
                var oText = sap.ui.core.Fragment.byId("stonedata", "DTP1")
                var sValue = oEvent.getParameter("value");
      
                oText.setValue(sValue);
              },
			  handleFChange2: function (oEvent) {
                var oText = sap.ui.core.Fragment.byId("stonedata", "DTP2");
                var sValue = oEvent.getParameter("value");
      
                oText.setValue(sValue);
              },
      
             




            getStoneModel : function () {
                var response = TransactionCaller.sync(
                    "MES/Itelli/TAS/T_SELECT_DATA_OF_STONE",
                    {
                                           
                    },
                    "O_JSON"
                );

                var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
					/* tableModel.setData(response[0]?.Rowsets?.Rowset?.Row); */ // tableModel değişkenine setData fonki ile bu adresteki şeyleri bas
				/* 	this.getView().byId("serhatTable").setModel(tableModel); //serhatTable id'deki view'a setmodel fonk aracılıyla tableModel içindeki bilgileri bas
					this.getView().byId("serhatTable").getModel().refresh(); */
                    this.getView().byId("stonecode").setText(tableModel.oData[0].STONE_CODE);
                    this.getView().byId("stonemensei").setText(tableModel.oData[0].MENSEI);
                    this.getView().byId("stonemodel").setText(tableModel.oData[0].MODEL)




            },

            openTasFragCancel : function () {

                
                this.createNotificationFragment.close();

                
                sap.ui.core.Fragment.byId("stonedata", "stonecode")?.setValue("");   
                sap.ui.core.Fragment.byId("stonedata", "mensei")?.setValue(""); 
                sap.ui.core.Fragment.byId("stonedata", "stonemodel")?.setValue("");
                sap.ui.core.Fragment.byId("stonedata", "DTP1").setValue("");
                sap.ui.core.Fragment.byId("stonedata", "DTP2").setValue("");
                
                sap.ui.core.Fragment.byId("stonedata", "forget").setState(false);



            },

            stonaSave : function() {

                var stoneCode = sap.ui.core.Fragment.byId("stonedata", "stonecode")?.getValue();   
                var mensei = sap.ui.core.Fragment.byId("stonedata", "mensei")?.getValue(); 
                var stoneModel = sap.ui.core.Fragment.byId("stonedata", "stonemodel")?.getValue();  
                var nodeid = this.appData.node.nodeID;
                var NotifiedUser = this.appData.user.userID;
                var unutulmus = sap.ui.core.Fragment.byId("stonedata", "forget").getState();
                var date1 = sap.ui.core.Fragment.byId("stonedata", "DTP1")?.getValue();
                var date2 = sap.ui.core.Fragment.byId("stonedata", "DTP2")?.getValue();
   if(unutulmus==true){
    var unutulmusx="X"
    
var dateNow = new Date();
var a = dateNow.getTime();
b=sap.ui.core.Fragment.byId("stonedata", "DTP1")?.getDateValue().getTime();
var c = 24 * 60 * 60 * 1000,
diffDays = Math.round((a - b) / c);

b2=sap.ui.core.Fragment.byId("stonedata", "DTP2")?.getDateValue().getTime();

diffDays2 = Math.round((a - b2) / c);

var fark = diffDays-diffDays2;

var onay=  confirm( fark +" Günkü üretim bilgileri girdiğiniz veriler ile güncellenecek Devam etmek istiyor musunuz?");
                       if(!onay)
                       {
                           return;
                    }



   }
   else{
    var unutulmusx="Y"

   }
                
                
                var response = TransactionCaller.sync(
                    "MES/Itelli/TAS/T_STONE_INSERT",
                    {   I_DATE1:date1,
                       I_DATE2:date2,
                  
                        I_FORGOTTEN: unutulmusx,
                        I_stoneCode: stoneCode,
                        I_mensei: mensei,
                        I_stoneModel: stoneModel,
                        I_nodeid : nodeid,
                        I_NotifiedUser : NotifiedUser, 
                        
                    },
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {
                    MessageBox.information("İşlem Başarılı");
                }

                this.openTasFragCancel();
                this.getStoneModel();



            },
           
           
            getTableModel: function () {

                this.byId("idOrdersTable").setBusy(true);
                this.byId("idOrdersTable").setBusyIndicatorDelay(0);
                this.byId("statusBar").setBusy(true);
                this.byId("statusBar").setBusyIndicatorDelay(0);

                this.getView().byId("idColumnBaslat").setVisible(true);
                this.getView().byId("idColumnDevam").setVisible(true);
                this.getView().byId("idColumnBeklet").setVisible(true);
                this.getView().byId("idColumnTamamla").setVisible(true);
                this.getView().byId("idColumnTekrarHold").setVisible(true);
                this.getView().byId("idInfo").setVisible(true);

                var NewStatus = this.getView().byId("idNewStatus").getSelected();
                var ActiveStatus = this.getView().byId("idActiveStatus").getSelected();
                var HoldStatus = this.getView().byId("idHoldStatus").getSelected();
                var CompletedStatus = this.getView().byId("idCompletedStatus").getSelected();

                if (NewStatus == true) {
                    this.getView().byId("idColumnDevam").setVisible(false);
                    this.getView().byId("idColumnBeklet").setVisible(false);
                    this.getView().byId("idColumnTamamla").setVisible(false);
                    this.getView().byId("idColumnTekrarHold").setVisible(false);

                    var status = "NEW";
                }
                else if (ActiveStatus == true) {
                    this.getView().byId("idColumnBaslat").setVisible(false);
                    this.getView().byId("idColumnDevam").setVisible(false);
                    this.getView().byId("idColumnBeklet").setVisible(true);
                    this.getView().byId("idColumnTekrarHold").setVisible(false);

                    var status = "ACT";
                }
                else if (HoldStatus == true) {
                    this.getView().byId("idColumnBaslat").setVisible(false);
                    this.getView().byId("idColumnBeklet").setVisible(false);
                    this.getView().byId("idColumnTamamla").setVisible(false);
                    this.getView().byId("idColumnTekrarHold").setVisible(false);

                    var status = "HOLD";
                }
                else if (CompletedStatus == true) {
                    this.getView().byId("idColumnBaslat").setVisible(false);
                    this.getView().byId("idColumnDevam").setVisible(false);
                    this.getView().byId("idColumnBeklet").setVisible(false);
                    this.getView().byId("idColumnTamamla").setVisible(false);

                    var status = "CMPL";
                }

                this.getModelRenderOrderDetails(status);


            },
            getModelRenderOrderDetails: function (status) {

                
                this.byId("idOrdersTable").setBusy(true);
                this.byId("idOrdersTable").setBusyIndicatorDelay(0);
                this.byId("statusBar").setBusy(true);
                this.byId("statusBar").setBusyIndicatorDelay(0);

                TransactionCaller.async(
                    "MES/Itelli/FLM_TAS/T_GET_MANAGE_ORDER_MODEL_T",
                    {
                        I_STATUS: status,
                    },
                    "O_JSON",
                    this.getModel,
                    this,
                    "GET",
                    status

                );


            },
            getModel: function (iv_data, iv_scope, status) {

                var myModel = new sap.ui.model.json.JSONModel();
                if (Array.isArray(iv_data[0].Rowsets?.Rowset?.Row)) {
                    myModel.setData(iv_data[0]);
                } else if (!iv_data[0].Rowsets?.Rowset?.Row) {
                    myModel.setData(null);
                } else {
                    var obj_response = iv_data[0];
                    var dummyData = [];
                    dummyData.push(iv_data[0].Rowsets.Rowset.Row);
                    obj_response.Rowsets.Rowset.Row = dummyData;
                    myModel.setData(obj_response);
                }

                if (status == "NEW") {
                    var newStatusArray = iv_data[0].Rowsets?.Rowset?.Row?.filter((i) => i.STATUS == "NEW");
                    var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);
                }
                else if (status == "ACT") {
                    var newStatusArray = iv_data[0].Rowsets?.Rowset?.Row?.filter((i) => i.STATUS == "ACT");
                    var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);
                }
                else if (status == "HOLD") {
                    var newStatusArray = iv_data[0].Rowsets?.Rowset?.Row?.filter((i) => i.STATUS == "HOLD");
                    var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);
                }
                else if (status == "CMPL") {
                    var newStatusArray = iv_data[0].Rowsets?.Rowset?.Row?.filter((i) => i.STATUS == "CMPL");
                    var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);
                }

                //change button css
                
                iv_scope.byId("idOrdersTable").setBusy(false);
                iv_scope.byId("statusBar").setBusy(false);
                iv_scope.getView().byId("idOrdersTable").setModel(myNEWModel);
                 

            },
            newStartButton: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];

                this.StartButton(oTableData);

            },

            StartButton: function (oTableData) {
                if (!this._oDialog01) {
                    this._oDialog01 = sap.ui.xmlfragment(
                        "StartButton",
                        "customActivity.fragmentView.StartButtonFragment",
                        this
                    );
                    this.getView().addDependent(this._oDialog01);
                }
                this._oDialog01.open();

                sap.ui.core.Fragment.byId("StartButton", "idStartDialog").setModel(oTableData);


            },
            newResumeButton: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];

                this.ResumeButton(oTableData);

            },

            ResumeButton: function (oTableData) {
                if (!this._oDialog04) {
                    this._oDialog04 = sap.ui.xmlfragment(
                        "ResumeButton",
                        "customActivity.fragmentView.ResumeButtonFragment",
                        this
                    );
                    this.getView().addDependent(this._oDialog04);
                }
                this._oDialog04.open();

                sap.ui.core.Fragment.byId("ResumeButton", "idResumeDialog").setModel(oTableData);


            },
            newHoldButton: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];

                this.HoldButton(oTableData);

            },

            HoldButton: function (oTableData) {
                if (!this._oDialog02) {
                    this._oDialog02 = sap.ui.xmlfragment(
                        "HoldButton",
                        "customActivity.fragmentView.HoldButtonFragment",

                        this
                    );
                    this.getView().addDependent(this._oDialog02);
                }
                this._oDialog02.open();

                sap.ui.core.Fragment.byId("HoldButton", "idHoldDialog").setModel(oTableData);

            }, 
             newTekrarHoldAlma: function (oEvent) {
		
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];
                var orderNumber = "0000" + oTableData.AUFNR;
				var aufnr= "0000" + oTableData.AUFNR;
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeid = this.appData.node.nodeID;

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        client: client,
                        plant: plant,
                        I_NODEID: nodeid,
                        I_ORDER_NUMBER: orderNumber,
						I_AUFNR: aufnr,
						I_ACTIVE: "E0003"
						},
						"O_JSON"
						);
						
						if (response[1] == "E") {
						MessageBox.error(response[0]);
						return;
						}
						else {MessageBox.information("İşlem Başarılı");}
						
						

                var status = "CMPL";
                this.getModelRenderOrderDetails(status);


            },
            newBitirButton: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];

                this.BitirButton(oTableData);

            },

            BitirButton: function (oTableData) {
                if (!this._oDialog03) {
                    this._oDialog03 = sap.ui.xmlfragment(
                        "BitirButton",
                        "customActivity.fragmentView.BitirButtonFragment",
                        this
                    );
                    this.getView().addDependent(this._oDialog03);
                }
                this._oDialog03.open();

                sap.ui.core.Fragment.byId("BitirButton", "idBitirDialog").setModel(oTableData);
            },

            onPressOpenInfo: function (oEvent) {
                // load fragment
                var oView = this.getView();
                var oDialog = oView.byId("orderDetailsDialog");
                // create dialog lazily
                if (!oDialog) {
                    // create dialog via fragment factory
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.getOrderDetails",
                        this
                    );
                    // connect dialog to view (models, lifecycle)
                    oView.addDependent(oDialog);
                }
                oDialog.open();
                this.getOrderInfos(oEvent);
            },

            getOrderInfos: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];
                var aufnr = oTableData.AUFNR;
                var werks = this.appData.plant;

                var params = {
                    "Param.1": werks,
                    "Param.2": aufnr,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/CreateCast/getInformationCharacteristicQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                var newOrderDetailsData = [];
                if (oData[0].Row != undefined) {
                    for (var i = 0; i < oData[0].Row.length; i++) {
                        newOrderDetailsData[i] = oData[0].Row[i];
                    }
                }
                oModel.setData(newOrderDetailsData);
                this.getView().setModel(oModel, "orderDetailsModel");
            },
            onCancelFrag03: function () {
                this._oDialog03.close();
            },
            onCancelFrag01: function () {
                this._oDialog01.close();
            },
            onCancelFrag04: function () {
                this._oDialog04.close();
            },
            onCancelFrag02: function () {
                this._oDialog02.close();
            },

            onPressSetCurDateSTART: function (oEvent) {
                var daynow = new Date().getDate();
                var monthnow = new Date().getMonth() + 1;
                var fullyearnow = new Date().getFullYear();
                if (monthnow < 10) {
                    monthnow = "0" + monthnow;
                }
                if (daynow < 10) {
                    daynow = "0" + daynow;
                }
                var idStartDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
                sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").setValue(idStartDate);

                var hournow = new Date().getHours();
                var minutesnow = new Date().getMinutes();
                var secondsnow = new Date().getSeconds();

                if (hournow < 10) {
                    hournow = "0" + hournow;
                }
                if (minutesnow < 10) {
                    minutesnow = "0" + minutesnow;
                }
                if (secondsnow < 10) {
                    secondsnow = "0" + secondsnow;
                }
                var idStartSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
                sap.ui.core.Fragment.byId("StartButton", "idStartTimePicker").setValue(idStartSaat);

            },
            StartButtonOK: function (oEvent) {
				var aufnr= "0000"+ sap.ui.core.Fragment.byId("StartButton", "idStartTimePicker").getModel().AUFNR;
                var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("StartButton", "idStartDialog").getModel().AUFNR);
                var operationNumber = "0010"
                var nodeid = this.appData.node.nodeID;
                var targetStatus = "ACT";
                var crewSize = "1";

                var idStartYıl = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getFullYear(); //2021
                var idStartAy = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getMonth() + 1; //ay
                if (idStartAy < 10) {
                    idStartAy = "0" + idStartAy;
                }
                var idStartGün = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getDate(); //gün
                if (idStartGün < 10) {
                    idStartGün = "0" + idStartGün;
                }
                var idStartDate = String(idStartYıl) + "-" + String(idStartAy) + "-" + String(idStartGün);
                var idExecStartTime = sap.ui.core.Fragment.byId("StartButton", "idStartTimePicker").getValue();
                var StartTime = String(idStartDate) + "T" + String(idExecStartTime);

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        I_ORDER_NUMBER: orderNumber,
                        I_OPERATION_NUMBER: operationNumber,
                        I_NODEID: nodeid,
                        I_TARGET_STATUS: targetStatus,
                        I_CREWSIZE: crewSize,
                        I_StartTime: StartTime,
						I_AUFNR: aufnr,
						I_ACTIVE: "E0002"
						},
						"O_JSON"
						);
						
						if (response[1] == "E") {
						MessageBox.error(response[0]);
						return;
						}
						else {MessageBox.information("İşlem Başarılı");}
						
                var status = "NEW";
                this.getModelRenderOrderDetails(status);
                this.onCancelFrag01();

            },

            onPressSetCurDateResume: function (oEvent) {
                var daynow = new Date().getDate();
                var monthnow = new Date().getMonth() + 1;
                var fullyearnow = new Date().getFullYear();
                if (monthnow < 10) {
                    monthnow = "0" + monthnow;
                }
                if (daynow < 10) {
                    daynow = "0" + daynow;
                }
                var idResumeDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
                sap.ui.core.Fragment.byId("ResumeButton", "idResumeDatePicker").setValue(idResumeDate);

                var hournow = new Date().getHours();
                var minutesnow = new Date().getMinutes();
                var secondsnow = new Date().getSeconds();

                if (hournow < 10) {
                    hournow = "0" + hournow;
                }
                if (minutesnow < 10) {
                    minutesnow = "0" + minutesnow;
                }
                if (secondsnow < 10) {
                    secondsnow = "0" + secondsnow;
                }
                var idResumeSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
                sap.ui.core.Fragment.byId("ResumeButton", "idResumeTimePicker").setValue(idResumeSaat);

            },
            ResumeButtonOK: function (oEvent) {
				var aufnr= "0000"+ sap.ui.core.Fragment.byId("ResumeButton", "idResumeDialog").getModel().AUFNR;
                var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("ResumeButton", "idResumeDialog").getModel().AUFNR);
                var operationNumber = "0010"
                var nodeid = this.appData.node.nodeID;
                var targetStatus = "RESUME";
                var crewSize = "1";

                var idResumeYıl = sap.ui.core.Fragment.byId("ResumeButton", "idResumeDatePicker").getDateValue().getFullYear(); //2021
                var idResumeAy = sap.ui.core.Fragment.byId("ResumeButton", "idResumeDatePicker").getDateValue().getMonth() + 1; //ay
                if (idResumeAy < 10) {
                    idResumeAy = "0" + idResumeAy;
                }
                var idResumeGün = sap.ui.core.Fragment.byId("ResumeButton", "idResumeDatePicker").getDateValue().getDate(); //gün
                if (idResumeGün < 10) {
                    idResumeGün = "0" + idResumeGün;
                }
                var idResumeDate = String(idResumeYıl) + "-" + String(idResumeAy) + "-" + String(idResumeGün);
                var idExecResumeTime = sap.ui.core.Fragment.byId("ResumeButton", "idResumeTimePicker").getValue();
                var ResumeTime = String(idResumeDate) + "T" + String(idExecResumeTime);

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        I_ORDER_NUMBER: orderNumber,
                        I_OPERATION_NUMBER: operationNumber,
                        I_NODEID: nodeid,
                        I_TARGET_STATUS: targetStatus,
                        I_CREWSIZE: crewSize,
                        I_StartTime: ResumeTime,
						I_AUFNR: aufnr,
						I_ACTIVE: "E0002"
						},
						"O_JSON"
						);
						
						if (response[1] == "E") {
						MessageBox.error(response[0]);
						return;
						}
						else {MessageBox.information("İşlem Başarılı");}
						

                var status = "HOLD";
                this.getModelRenderOrderDetails(status);
                this.onCancelFrag04();

            },

            onPressSetCurDateHOLD: function (oEvent) {
                var daynow = new Date().getDate();
                var monthnow = new Date().getMonth() + 1;
                var fullyearnow = new Date().getFullYear();
                if (monthnow < 10) {
                    monthnow = "0" + monthnow;
                }
                if (daynow < 10) {
                    daynow = "0" + daynow;
                }
                var idStartDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
                sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").setValue(idStartDate);

                var hournow = new Date().getHours();
                var minutesnow = new Date().getMinutes();
                var secondsnow = new Date().getSeconds();

                if (hournow < 10) {
                    hournow = "0" + hournow;
                }
                if (minutesnow < 10) {
                    minutesnow = "0" + minutesnow;
                }
                if (secondsnow < 10) {
                    secondsnow = "0" + secondsnow;
                }
                var idStartSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
                sap.ui.core.Fragment.byId("HoldButton", "idBitisTimePicker").setValue(idStartSaat);

            },

            onPressSetCurDateBITIR: function (oEvent) {
                var daynow = new Date().getDate();
                var monthnow = new Date().getMonth() + 1;
                var fullyearnow = new Date().getFullYear();
                if (monthnow < 10) {
                    monthnow = "0" + monthnow;
                }
                if (daynow < 10) {
                    daynow = "0" + daynow;
                }
                var idStartDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
                sap.ui.core.Fragment.byId("BitirButton", "idBitirDatePickerBitis").setValue(idStartDate);

                var hournow = new Date().getHours();
                var minutesnow = new Date().getMinutes();
                var secondsnow = new Date().getSeconds();

                if (hournow < 10) {
                    hournow = "0" + hournow;
                }
                if (minutesnow < 10) {
                    minutesnow = "0" + minutesnow;
                }
                if (secondsnow < 10) {
                    secondsnow = "0" + secondsnow;
                }
                var idStartSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
                sap.ui.core.Fragment.byId("BitirButton", "idBitisTimePicker").setValue(idStartSaat);

            },
            HoldButtonOK: function (oEvent) {
				var aufnr= "0000"+ sap.ui.core.Fragment.byId("HoldButton", "idHoldDialog").getModel().AUFNR;
                var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("HoldButton", "idHoldDialog").getModel().AUFNR);
                var operationNumber = "0010"
                var nodeid = this.appData.node.nodeID;
                var targetStatus = "HOLD";
                var crewSize = "1";

                var idHoldYıl = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getFullYear();
                var idHoldAy = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getMonth() + 1; //ay
                if (idHoldAy < 10) {
                    idHoldAy = "0" + idHoldAy;
                }
                var idHoldGün = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getDate(); //gün
                if (idHoldGün < 10) {
                    idHoldGün = "0" + idHoldGün;
                }
                var idHoldDate = String(idHoldYıl) + "-" + String(idHoldAy) + "-" + String(idHoldGün);
                var idExecHoldTime = sap.ui.core.Fragment.byId("HoldButton", "idBitisTimePicker").getValue();
                var HoldTime = String(idHoldDate) + "T" + String(idExecHoldTime);

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        I_ORDER_NUMBER: orderNumber,
                        I_OPERATION_NUMBER: operationNumber,
                        I_NODEID: nodeid,
                        I_TARGET_STATUS: targetStatus,
                        I_CREWSIZE: crewSize,
                        I_ENDTIME: HoldTime,
						I_AUFNR: aufnr,
						I_ACTIVE: "E0003"
						},
						"O_JSON"
						);
						
						if (response[1] == "E") {
						MessageBox.error(response[0]);
						return;
						}
						else {MessageBox.information("İşlem Başarılı");}
						
						
						

                var status = "ACT";
                this.getModelRenderOrderDetails(status);
                this.onCancelFrag02();

            },
            BitirButtonOK: function (oEvent) {
				var aufnr = "0000" +sap.ui.core.Fragment.byId("BitirButton", "idBitirDialog").getModel().AUFNR;
                var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("BitirButton", "idBitirDialog").getModel().AUFNR);
                var operationNumber = "0010"
                var nodeid = this.appData.node.nodeID;
                var targetStatus = "CMPL";
                var crewSize = "1";

                var idBitirYıl = sap.ui.core.Fragment.byId("BitirButton", "idBitirDatePickerBitis").getDateValue().getFullYear();
                var idBitirAy = sap.ui.core.Fragment.byId("BitirButton", "idBitirDatePickerBitis").getDateValue().getMonth() + 1; //ay
                if (idBitirAy < 10) {
                    idBitirAy = "0" + idBitirAy;
                }
                var idBitirGün = sap.ui.core.Fragment.byId("BitirButton", "idBitirDatePickerBitis").getDateValue().getDate(); //gün
                if (idBitirGün < 10) {
                    idBitirGün = "0" + idBitirGün;
                }
                var idBitirDate = String(idBitirYıl) + "-" + String(idBitirAy) + "-" + String(idBitirGün);
                var idExecBitirTime = sap.ui.core.Fragment.byId("BitirButton", "idBitisTimePicker").getValue();
                var BitirTime = String(idBitirDate) + "T" + String(idExecBitirTime);

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        I_ORDER_NUMBER: orderNumber,
                        I_OPERATION_NUMBER: operationNumber,
                        I_NODEID: nodeid,
                        I_TARGET_STATUS: targetStatus,
                        I_CREWSIZE: crewSize,
                        I_ENDTIME: BitirTime,
						I_AUFNR: aufnr,
						I_ACTIVE: "E0004"
						},
						"O_JSON"
						);
						
						if (response[1] == "E") {
						MessageBox.error(response[0]);
						return;
						}
						else {MessageBox.information("İşlem Başarılı");}
						
						

                var status = "ACT";
                this.getModelRenderOrderDetails(status);
                this.onCancelFrag03();

            },
            handleCancelOrderDetails: function (oEvent) {
                oEvent.getSource().getParent().close();
            },



        });
    }
);
