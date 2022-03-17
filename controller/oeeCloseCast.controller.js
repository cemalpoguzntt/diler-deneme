sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "customActivity/scripts/custom",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator",
        "customActivity/scripts/customStyle",
        "sap/ui/model/FilterType",
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
	BusyIndicator,
        customStyle,
        FilterType
    ) {
        "use strict";

        var intVal;
        var that;
	var iDelay = 1000; // default
        var iDuration = 500;

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

        return Controller.extend("customActivity.controller.oeeCloseCast", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */

            formatter: formatter,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                that = this;
                var today = new Date();
                var selectedPastTime =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                var selectedFutureTime =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                this.getView()
                    .byId("idDatePicker")
                    .setValue(selectedPastTime + " - " + selectedFutureTime);
		this.getCastList();
				var self = this;
				this.intervalHandle = setInterval(function() {
					if (window.location.hash == "#/activity/ZACT_CLOSE_CAST") {
						self.getCastList();
					}
				}, 5000);
                
            },

            callCastList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "castListModel");
            },
            getCastList: function () {
                var plant = this.appData.plant;
                var selectedSecondDate = new Date(
                    this.getView().byId("idDatePicker").getSecondDateValue()
                );
                var selectedSecondNextDate = new Date(selectedSecondDate);
                selectedSecondNextDate.setDate(selectedSecondNextDate.getDate() + 1);
                var selectedSecondNextDateValue =
                    selectedSecondNextDate.getDate() +
                    "." +
                    (selectedSecondNextDate.getMonth() + 1) +
                    "." +
                    selectedSecondNextDate.getFullYear();
                var selectedDatePeriod = this.getView().byId("idDatePicker").getValue();
                var selectedDatePeriodValues = selectedDatePeriod.split(" - ");

                var params = {
                    "Param.1": plant,
                    "Param.2": selectedDatePeriodValues[0],
                    "Param.3": selectedDatePeriodValues[1],
//                    "Param.3": selectedSecondNextDateValue,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getCastNoQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callCastList);
            },
            changeCastingNumber: function (oEvent) {
                if (!!oEvent)
                    this.appData.castSelected = oEvent
                        .getSource()
                        .getSelectedItem()
                        .oBindingContexts.castListModel.sPath.split("/")[1];
                var plant = this.appData.plant;
                var selectCast = this.getView().byId("idSelectCast");
                var castingNumber = selectCast._getSelectedItemText();
                var confirmButton = this.getView().byId("castCloseConfirm");
                var confirmCancelButton = this.getView().byId("confirmCancelButton");
                var oData = this.getView().getModel("castListModel").oData;

                var selectInformation = oData.find(
                    (casting) => casting.CASTID == castingNumber
                );

                if (selectInformation.IS_CLOSED == "T") {
                    confirmButton.setVisible(false);
                    confirmCancelButton.setVisible(true);
                } else {
                    confirmButton.setVisible(true);
                    confirmCancelButton.setVisible(false);
                }

                this.getActivitiesData(plant, castingNumber);
                this.getProductionData(plant, castingNumber);
                this.getScrapData(plant, castingNumber);
                this.getProductionLiquidSteelQry(plant, castingNumber);
                this.getConsumptionData(plant, castingNumber);
                this.getProductionLiquidSteelQry(plant, castingNumber);
            },
            callActivitiesData: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "activitiesModel");
            },
            getActivitiesData: function (plant, castingNumber) {
                var params = { "Param.1": plant, "Param.2": castingNumber };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getActivitiesDataQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callActivitiesData);
            },
            callProductionDataQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "productionModel");
            },
            getProductionData: function (plant, castingNumber) {
                var params = { "Param.1": plant, "Param.2": castingNumber };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getProductionDataQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callProductionDataQry);
            },
            callScrapData: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "scrapModel");
            },
            getScrapData: function (plant, castingNumber) {
                var params = { "Param.1": plant, "Param.2": castingNumber };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getScrapDataQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapData);
            },
            callConsumptionData: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "consumptionModel");
            },
            getConsumptionData: function (plant, castingNumber) {
                var params = { "Param.1": plant, "Param.2": castingNumber };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getConsumptionDataQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callConsumptionData);
            },

            callProductionLiquidSteelQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "productionLiquidSteelModel");
            },

            getProductionLiquidSteelQry: function (plant, castingNumber) {
                var params = { "Param.1": plant, "Param.2": castingNumber };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getProductionLiquidSteelQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callProductionLiquidSteelQry);
            },


            callProductionLiquidSteelQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "productionLiquidSteelModel");
            },

            getProductionLiquidSteelQry: function (plant, castingNumber) {
                var params = { "Param.1": plant, "Param.2": castingNumber };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getProductionLiquidSteelQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callProductionLiquidSteelQry);
            },

             callConfirm: function (p_this, p_data) {
             	var selectCast = p_this.getView().byId("idSelectCast");

             	/*var aufnr = "0000"+selectCast.getSelectedKey();
             	var status = "QUEUED"
             	
             	while(status == "QUEUED") {
             		
             		var params = { "Param.1": p_this.appData.selected.runID, "Param.2": aufnr };
             		var tRunner = new TransactionRunner(
             			"MES/UI/CloseCast/reportConfirmation/getErrorQueueMessageQry",
             			params
             			);
             		if (!tRunner.Execute()) {
             			MessageBox.error(tRunner.GetErrorMessage());
             			return null;
             		}
             		var oData = tRunner.GetJSONData(); 
             		status = oData[0].Row[0].STATUS;
             		console.log('yenileme devrede');
             		if (status=="FAILED"){
             			sap.m.MessageBox.error(oData[0].Row[0].MESSAGE);
             			p_this.getView().byId("castCloseConfirm").setVisible(true);
             		}
             		else if (status=="PASSED"){
             			p_this.getView().byId("castCloseConfirm").setVisible(false);
             			p_this.getView().byId("confirmCancelButton").setVisible(true);
             			sap.m.MessageToast.show(
             				p_this
             				.getView()
             				.getModel("i18n")
             				.getResourceBundle()
             				.getText("OEE_LABEL_SUCCESS")
             				);
             		}

             		

             	}*/
		p_this.getCastList();
             },

            onClickConfirm: function (oEvent) {
                let selectCastX = this.getView().byId("idSelectCast")._getSelectedItemText();
                let plant = this.appData.plant;
                var xRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getConsumptionDataQry");
                xRunner.AddParameter("Param.1", plant);
                xRunner.AddParameter("Param.2", selectCastX);
                if (!xRunner.Execute()) {
                    MessageBox.error(xRunner.GetErrorMessage());
                    return null;
                }

                var xData = xRunner.GetJSONData();
                if(xData[0].Row == undefined)
                {
                    MessageBox.error("Tüketimi Olmayan Döküm Kapatılamaz!");
                    return;
                } 
                this.showBusyIndicator(4000, 0);
                

                var params = {
                    "Param.1": 'SIVI_CELIK_ES_U',
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

                var selectCast = this.getView().byId("idSelectCast");
                var dokumNo =  selectCast._getSelectedItemText();

                if(oData[0].Row!==undefined){

                    for (let index = 0; index < oData[0].Row.length; index++) {
                        const element = oData[0].Row[index];
                        if (element.BATCH_NO == dokumNo) {
                            sap.m.MessageBox.error(`${dokumNo} No'lu Dökümden ${element.QUANTITY} Ton Sıvı Çelik Eş Ürün Kalmıştır. Döküm Kapatılamaz.`);
                    return;
                        }
                    }

                }

                var errorStatus = false;
                var message = "";
                var oView = this.getView();
                var nodeID = this.appData.node.nodeID;
                var activitiesData = oView.getModel("activitiesModel").oData;
                var productionData = oView.getModel("productionModel").oData;
                var scrapData = oView.getModel("scrapModel").oData;
                var consumptionData = oView.getModel("consumptionModel").oData;
                var productionLiquidSteelData = oView.getModel("productionLiquidSteelModel").oData;

                activitiesData.forEach(function (item, index) {
                    if (item.END_TIMESTAMP == "") {
                        errorStatus = true;
                    }
                }, this);

                if (errorStatus) {
                    sap.m.MessageBox.error("Lütfen Döküm Seç ekranı üzerinden dökümü Tamamlandı statüsüne çekiniz!");
                    return;
                }

                var params = { "Param.1": nodeID };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/getAllWorkcenterNameQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var allWorkcenterNameLength = oData[0].Row.length;
                var allWorkcenterNames = Array.from(
                    new Set(oData[0].Row?.map((s) => s.NAME))
                ).map((NAME) => {
                    return {
                        NAME: NAME,
                    };
                });;

                var consumptionDataNames = Array.from(
                    new Set(consumptionData?.map((s) => s.NAME))
                ).map((NAME) => {
                    return {
                        NAME: NAME,
                    };
                });
                var consumptionDataLength = consumptionDataNames.length;
                var messageConsNodeName = "";
                var tempNode = "";
                var isThereThisNode;
                if (allWorkcenterNameLength != consumptionDataLength) {
                    for (var i = 0; i < allWorkcenterNameLength; i++) {
                        if (consumptionDataLength > 0) {
                            for (var j = 0; j < consumptionDataLength; j++) {
                                if (consumptionDataNames[j].NAME == allWorkcenterNames[i].NAME) {
                                    isThereThisNode = true;
                                }
                                else if (consumptionDataNames[j].NAME != allWorkcenterNames[i].NAME && isThereThisNode != true) {
                                    isThereThisNode = false;
                                    tempNode = allWorkcenterNames[i].NAME;
                                }
                            }
                        }
                        else {
                            isThereThisNode = false;
                            tempNode = allWorkcenterNames[i].NAME;
                        }
                        if (isThereThisNode != true) {
                            tempNode = tempNode + ", ";
                            messageConsNodeName = messageConsNodeName + tempNode;
                        }
                        tempNode = "";
                        isThereThisNode = false
                    }
                    message =
                        "\n" +
                        messageConsNodeName.substring(0, messageConsNodeName.length - 1) + " iş yerlerinde tüketim yapılmamış. Yinede dökümü kapatmak istiyor musunuz?"
                    "\n";
                    errorStatus = true;
                }

                if (scrapData?.length < 2) {
                    message =
                        "\n" +
                        "Hiç hurda girilmemiş, yinede dökümü kapatmak istiyor musunuz?" +
                        "\n" +
                        message;
                    errorStatus = true;
                }
                var counter = 0;
                var AO = "Ark Ocağı";
                var PO = "Pota Ocağı";
                var SDM_PP = "Sürekli Döküm ";
                var SCH = "Sıvı Çelik Hurdası";
                for (const [key, value] of activitiesData.entries(activitiesData)) {

                    if (value.NAME == "AO" && counter < 2 && AO == "Ark Ocağı" ) {
                        counter += 1
                        AO = "";

                    } else if (value.NAME == "PO" && counter < 3 && PO == "Pota Ocağı") {
                        counter += 1
                        PO = "";

                    } else if (value.NAME == "SDM_PP" && counter < 4 && SDM_PP == "Sürekli Döküm ") {
                        counter += 1
                        SDM_PP = "";
                    }
                    else if (SDM_PP != "" && counter < 4 &&  SCH == "Sıvı Çelik Hurdası") {
                        counter += 1
                        SCH = "";
                    } else { }


                }
             /*   if (counter < 3) {
                    sap.m.MessageBox.error(SCH + " " + SDM_PP + " " + AO + " " + PO + " " + "  da döküm kapatılmalıdır");
                    return;
                }*/
                if (productionData?.length < 1 || !productionData) {
                    message =
                        "\n" +
                        "Üretim girilmemiş, yinede dökümü kapatmak istiyor musunuz?" +
                        "\n" +
                        message;
                    errorStatus = true;
                }

                var activitiesDataList = Array.from(
                    new Set(activitiesData?.map((s) => s.NAME))
                ).map((NAME) => {
                    return {
                        NAME: NAME,
                    };
                });
                var activitiesDataListLength = activitiesDataList.length;
                var messageActNodeName = "";
                var tempNode = "";
                var isThereThisNode;
                if (allWorkcenterNameLength != activitiesDataListLength) {
                    for (var i = 0; i < allWorkcenterNameLength; i++) {
                        if (activitiesDataListLength > 0) {
                            for (var j = 0; j < activitiesDataListLength; j++) {
                                if (activitiesDataList[j].NAME == allWorkcenterNames[i].NAME) {
                                    isThereThisNode = true;
                                }
                                else if (activitiesDataList[j].NAME != allWorkcenterNames[i].NAME && isThereThisNode != true) {
                                    isThereThisNode = false;
                                    tempNode = allWorkcenterNames[i].NAME;
                                }
                            }
                        }
                        else {
                            isThereThisNode = false;
                            tempNode = allWorkcenterNames[i].NAME;
                        }
                        if (isThereThisNode != true) {
                            tempNode = tempNode + ", ";
                            messageActNodeName = messageActNodeName + tempNode;
                        }
                        tempNode = "";
                        isThereThisNode = false
                    }
                    if (!(messageActNodeName == "")) {
                        message =
                            messageActNodeName.substring(0, messageActNodeName.length - 1) + " iş yerleri için aktivite girilmemiş, yinede dökümü kapatmak istiyor musunuz?" +
                            "\n" +
                            message;
                        errorStatus = true;
                    }
                }
                /*if (allWorkcenterNameLength != activitiesDataList.length) {
                    message =
                        "Tüm iş yerleri için aktivite girilmemiş, yinede dökümü kapatmak istiyor musunuz?" +
                        "\n" +
                        message;
                    errorStatus = true;
                }*/

                if (errorStatus) {
                    sap.m.MessageBox.warning(message, {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction == "YES") {
                                this.callClickConfirm();
                            } else {
                                return;
                            }
                        }.bind(this),
                    });
                } else this.callClickConfirm();
            },

            callClickConfirm: function () {
               
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                var selectCast = this.getView().byId("idSelectCast");
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeID = this.appData.node.nodeID;
                var workcenterID = this.appData.node.workcenterID;
                var aufnr = selectCast.getSelectedKey();
                var castID = selectCast._getSelectedItemText();
                var aprio = this.appData.selected.operationNo;
                var userID = this.appData.user.userID;
                var activityData = this.getView().getModel("activitiesModel").oData;
                var scrapData = this.getView().getModel("scrapModel").oData;
                var consumptionData = this.getView().getModel("consumptionModel").oData;
                var params = {
                    I_CLIENT: client,
                    I_PLANT: plant,
                    I_NODEID: nodeID,
                    I_WORKCENTERID: workcenterID,
                    I_AUFNR: aufnr,
                    I_APRIO: aprio,
                    I_CASTID: castID,
                    I_USERID: userID,
                    I_ACTIVITYDATA: JSON.stringify(activityData),
                    I_SCRAPDATA: JSON.stringify(scrapData),
                    I_CONSUMPTIONDATA: JSON.stringify(consumptionData),
                    I_STARTTIMESTAMP: this.appData.shift.startTimestamp,
                    I_ENDTIMESTAMP: this.appData.shift.endTimestamp,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/reportConfirmation/reportConfirmationXquery",params );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
               // tRunner.ExecuteQueryAsync(this, this.callConfirm);

                   /*  var aufnrr = "0000"+selectCast.getSelectedKey();
             	var status = "QUEUED"
             	
             	while(status == "QUEUED") {
             		
             		var params = { "Param.1": "", "Param.2": aufnrr };
             		var tRunner = new TransactionRunner(
             			"MES/UI/CloseCast/reportConfirmation/getErrorQueueMessageQry",
             			params
             			);
             		if (!tRunner.Execute()) {
             			MessageBox.error(tRunner.GetErrorMessage());
             			return null;
             		}
             		var oData = tRunner.GetJSONData(); 
             		status = oData[0].Row[0].STATUS;
             		console.log('yenileme devrede');
             		if (status=="FAILED"){
             			sap.m.MessageBox.error(oData[0].Row[0].MESSAGE);
             			this.getView().byId("castCloseConfirm").setVisible(true);
             		}
             		else if (status=="PASSED"){
             			this.getView().byId("castCloseConfirm").setVisible(false);
             			this.getView().byId("confirmCancelButton").setVisible(true);
             			sap.m.MessageToast.show(
             				this
             				.getView()
             				.getModel("i18n")
             				.getResourceBundle()
             				.getText("OEE_LABEL_SUCCESS")
             				);
             		}

             		

             	}*/
         			this.getView().byId("castCloseConfirm").setVisible(false);
             			this.getView().byId("confirmCancelButton").setVisible(true);
             			sap.m.MessageToast.show(
             				this
             				.getView()
             				.getModel("i18n")
             				.getResourceBundle()
             				.getText("OEE_LABEL_SUCCESS")
             				);
			this.getCastList();
            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            onChangeCastNumber: function (oEvent) {
                var rows = this.getView().getModel("castListModel").oData;
                if (!rows) return;
                var newInformation;
                var castSelected = this.appData.castSelected;
                var type = oEvent.getSource().getType();
                if (type == "Accept") {
                    newInformation = rows[parseFloat(castSelected) + 1];
                    if (!!newInformation)
                        this.appData.castSelected = parseFloat(castSelected) + 1;
                } else if (type == "Reject") {
                    newInformation = rows[parseFloat(castSelected) - 1];
                    if (!!newInformation)
                        this.appData.castSelected = parseFloat(castSelected) - 1;
                }
                if (!!newInformation) {
                    var cast = this.getView().byId("idSelectCast");
                    cast.setValue(newInformation.CASTID);
                    cast.setSelectedKey(newInformation.SUP_AUFNR);
                }

                this.changeCastingNumber();
            },

            onClickConfirmCancel: function () {
                this.showBusyIndicator(4000, 0);
                sap.m.MessageBox.warning("Döküm açmak istediğinize emin misiniz?", {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction == "YES") {
                            this.callCancelConfirm();
                        } else {
                            return;
                        }
                    }.bind(this),
                });
            },

            callConfirmCancelReason: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.changeCastingNumber();
                p_this.getCastList();
                p_this.getView().byId("castCloseConfirm").setVisible(true);
                p_this.getView().byId("confirmCancelButton").setVisible(false);
                p_this.hideBusyIndicator()
            },
hideBusyIndicator: function () {
  //      console.timeEnd('tarık')
                BusyIndicator.hide();
            },

            callCancelConfirm: function () {
                var selectCast = this.getView().byId("idSelectCast");
                var aufnr = this.getView().byId("idSelectCast").getSelectedKey();
                var plant = this.appData.plant;
                var castID = selectCast._getSelectedItemText();
                var userID = this.appData.user.userID;
                var params = { I_AUFNR: aufnr, I_PLANT: plant, I_CASTID: castID, I_USERID: userID };
                var tRunner = new TransactionRunner(
                    "MES/UI/CloseCast/cancelConfirmXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callConfirmCancelReason);
            },
            showBusyIndicator : function (iDuration, iDelay) {
                BusyIndicator.show(iDelay);
    
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }
    
                    this._sTimeoutId = setTimeout(function() {
                        this.hideBusyIndicator();
                    }.bind(this), iDuration);
                }
            },
        });
    }
);
