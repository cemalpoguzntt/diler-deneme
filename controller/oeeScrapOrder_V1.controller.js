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
        "sap/ui/core/BusyIndicator",
        "sap/ui/core/Fragment",
        "sap/m/MessageToast",
        "sap/m/MenuItem"

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
        BusyIndicator,
        Fragment,
        MessageToast,
        MenuItem
    ) {
        "use strict";

        this.screenObj;
        var iDelay = 1000; // default
        var iDuration = 500;
        var that;

        Array.prototype.localArrFilter = function (e) {
            var found = false;
            for (var i = 0; i < this.length; i++) {
                if (this[i].DESCRIPTION == e) {
                    found = true;
                    break;
                }
            }
            //console.log(this);
            return found;
        };

        return Controller.extend("customActivity.controller.oeeScrapOrder", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */

            formatter: formatter,

          
            onInit: function () {
                
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.getVisibleStatus();
                this.getStatusList();
                this.getChargeNoList();
                this.getMasterDetailList();
                this.getBasketNoList();
                this.getBasketTypeList();
                this.getLocationGroupList();
                this.getLocationList();
                this.getChargeTypeList();
                this.getScrapTypeJargon();
                this.getScrapTypeMaterialList();
                this.getPernrList();
                this.getPreheatingDetails();
                
                this.screenObj = {};
                //this.getDate();
                that = this;
                var workcenter = this.appData.node.workcenterID;
                if (workcenter == "10000203") {
                    this.getView().byId("statusSelect").setSelectedKey("340");
                };


//this.setCastColor();
            },

            hideBusyIndicator: function () {
                BusyIndicator.hide();
            },

            /*
                        onPressWF: function (pWFId, pScrOdrId) {
                            alert(pWFId + ' - ' + pScrOdrId);
              
                        },
                        */

            onPressGetTagValues: function () {
                var params = { I_PLANT: this.appData.plant, I_SCRORDID: this.screenObj.scrordid };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/TagValues/getTagValuesXqry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();

                if (oData[0].Row[0].HBI != "NA") {
                    this.getView().byId("scrapQuantityHBI").setValue(oData[0].Row[0].HBI);
                    //return oData[0].Row[0];
                }
            },
            getVisibleStatus: function (statusCodeKey) {
                var plant = this.appData.plant;
                /*var workcenter =  this.appData.node.workcenterID
          
              if(workcenter == "10000351" )
          {
          this.getView().byId("statusSelect").setSelectedKey("340");
          };*/

                if (!statusCodeKey) var statusCodeKey = "0";
                var params = { "Param.1": plant, "Param.2": statusCodeKey };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapOrderWorkflowQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                if (oData[0].Row == undefined) oData[0].Row = [];
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "visibleStatusModel");

                this.getView().byId("menuButton").setVisible(true);

                /*
                                                var scrapHeadModel = this.getView().getModel("scrapHeadModel");
                                
                                                if (scrapHeadModel) {
                                                    var scrOrdId = this.getView().getModel("scrapHeadModel").oData.Row[0].SCRORDID;
                                                }
                                
                                                var oFlexBox = new sap.m.FlexBox();
                                
                                                for (var i = 0; i < oData[0].Row.length; i++) {
                                                    //eval("(function(){ that.onPressWF("+ pWFId + "," + pScrOdrId + ");})")
                                                    //setVisibleFalsePanel
                                
                                                    var pWFId = oData[0].Row[i].SCRWFLWID;
                                                    var pScrOdrId = scrOrdId;
                                
                                                    var btn = new sap.m.Button({
                                                        text: oData[0].Row[i].DESCRIPTION,
                                                        press: eval("(function(){ that.onPressWF("+ pWFId + "," + pScrOdrId + ");})"),
                                                        type: "Emphasized",
                                                        //id: "button" + i,
                                                        //add your custom data here.. this is an aggregation which means you can add as many customDatas as required.
                                                        customData: new sap.ui.core.CustomData({
                                                            key: "key",
                                                            value: i
                                                        })
                                                    });
                                                    oFlexBox.addItem(btn);
                                                }
                                                oFlexBox.placeAt('__xmlview2--otbFooter');
                                                */
            },

            /*
                                    getDate: function () {
                                        var oDate = new Date();
                                        //var tomorrow = new Date();
                                        //tomorrow.setDate(tomorrow.getDate() + 1);
                                        var idDatePicker = this.byId("DTP1");
                                        idDatePicker.setDateValue(oDate);
                                    },
                        
                                    */

            callScrapTypeMaterialList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "scrapTypeMaterial");
            },

            getScrapTypeMaterialList: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getMaterialQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapTypeMaterialList);
            },

	setCastColor: function() {
		var elems = document.getElementsByClassName('sapMObjLTitle');
		for(var i=0; i< elems.length; i++)
		{
			elems[i].style.color = '#FF3333';
		}
	},
            callPernrList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "pernrList");
            },

            getPernrList: function () {
                var tRunner = new TransactionRunner("MES/UI/ScrapOrder/getPernrQry");
                tRunner.ExecuteQueryAsync(this, this.callPernrList);
            },

            callCastingNumberList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "castingNumber");
            },

            getCastingNumberList: function (statusCodeKey) {
                //this.getView().byId("castingNumberList").setSelectedIndex(0);

                var plant = this.appData.plant;
                var dateVal = "";
                // if(statusCodeKey==240 || statusCodeKey==340)dateVal = this.appData.shift.startDate;
                var params = {
                    "Param.1": plant,
                    "Param.2": statusCodeKey,
                    "Param.3": dateVal,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getCastingNumberListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callCastingNumberList);
            },

            callMasterDetailList: function (p_this, p_data) {
		
                var masterList = p_this.getView().byId("masterList");
                var selectedItem = masterList.getSelectedItem();
                var lv_sel_scrordid = p_this.getSelectedScrapOrderId();

                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "masterDetailList");

                if (p_this.findScrapOrderId(lv_sel_scrordid)) {
                    masterList.setSelectedItem(selectedItem);
		//p_this.onPressNewEntry();
		//p_this.onPressScrapCharge();
                    //p_this.getSelectMasterCastID();
                }
//p_this.setCastColor();
		
            },

            getMasterDetailList: function (statusCodeKey) {
                var castingNumberList = this.getView()
                    .byId("castingNumberList")
                    .getSelectedKey();

                var plant = this.appData.plant;

                var orderBy = "ASC";

                if (statusCodeKey) {
                    if (statusCodeKey == 260 || statusCodeKey == 360) var orderBy = "DESC";
                }
                //var dateVal="";
                //if(statusCodeKey==240 || statusCodeKey==340)dateVal = this.appData.shift.startDate;
                var params = {
                    "Param.1": plant,
                    "Param.2": statusCodeKey,
                    "Param.3": castingNumberList,
                    "Param.4": orderBy,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapMasterQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callMasterDetailList);
            },

            callScrapOrderWorkflowQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                var visibleJSON = [{}];
                var rowset = p_data.Rowsets.Rowset[0];
                if (!rowset.Row) return;
                visibleJSON[0][rowset.Columns.Column[0].Name] =
                    rowset.Row[0].CURR_STATUSCODE;
                oModel.setData(visibleJSON[0]);
                p_this.getView().setModel(oModel, "visibleJSON");
            },

            getScrapOrderWorkflowQry: function (statusCodeKey) {
                var plant = this.appData.plant;
                var params = { "Param.1": plant, "Param.2": statusCodeKey };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapOrderWorkflowQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapOrderWorkflowQry);
            },

            onChangeStatusList: function (oEvent) {
                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            this.getView().byId("castingNumberList").setSelectedKey("");
                            var statusCodeKey = this.getView()
                                .byId("statusSelect")
                                .getSelectedKey();
                            //var selectedCastNo = this.getView().byId("castingNumberList").getSelectedKey();
                            this.getVisibleStatus(0);
                            this.screenObj.statusSelect = statusCodeKey;
                            this.getMasterDetailList(statusCodeKey);
                            this.getCastingNumberList(statusCodeKey);
                            this.getStatusCode(statusCodeKey);
                            this.clearScreen();
                            this.setVisibleFalsePanel();
                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            onChangeCastingNumberList: function (oEvent) {
                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            var statusCodeKey = this.getView()
                                .byId("statusSelect")
                                .getSelectedKey();
                            //var selectedCastNo = this.getView().byId("castingNumberList").getSelectedKey();
                            //this.getVisibleStatus(0);
                            //this.screenObj.statusSelect = statusCodeKey;
                            this.getMasterDetailList(statusCodeKey);
                            //this.getCastingNumberList(statusCodeKey);
                            //this.getStatusCode(statusCodeKey);
                            //this.clearScreen();
                            //this.setVisibleFalsePanel();
                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            callScrapTypeJargon: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "scrapTypeJargon");
            },

            getScrapTypeJargon: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getJargonQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapTypeJargon);
            },

            callStatusList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "statusList");
                //p_this.getVisibleStatus(p_data.Rowsets.Rowset[0].Row[0].STATUSCODE);
                p_this.getMasterDetailList(p_data.Rowsets.Rowset[0].Row[0].STATUSCODE);
                p_this.getCastingNumberList(p_data.Rowsets.Rowset[0].Row[0].STATUSCODE);
                p_this.screenObj.statusSelect =
                    p_data.Rowsets.Rowset[0].Row[0].STATUSCODE;
            },

            setVisibleFalsePanel: function () {
                this.getView().byId("scrapPreheatingPanel").setVisible(false);
                this.getView().byId("masterListTable").setVisible(false);
                this.getView().byId("idCastTable").setVisible(false);
                this.getView().byId("castDetailToolbar").setVisible(false);
                this.getView().byId("scrapReportPanel").setVisible(false);
                this.getView().byId("scrapReportToolbar").setVisible(false);
                this.getView().byId("deleteButton").setVisible(false);
                this.getView().byId("saveButton").setVisible(false);
                this.getView().byId("menuButton").setVisible(false);
                this.getView().byId("chargeEdit").setVisible(false);
            },

            setVisibleTruePanel: function () {
                this.getView().byId("scrapPreheatingPanel").setVisible(false);
                this.getView().byId("masterListTable").setVisible(true);
                this.getView().byId("idCastTable").setVisible(true);
                this.getView().byId("castDetailToolbar").setVisible(true);
                this.getView().byId("scrapReportPanel").setVisible(true);
                this.getView().byId("scrapReportToolbar").setVisible(true);
            },

            getStatusList: function () {
                this.setVisibleFalsePanel();

                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapOrderStatusQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callStatusList);
            },

            callStatusCode: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "statusCode");
            },

            getStatusCode: function (statusCodeKey) {
                //this.getView().byId("castingNumberList").setSelectedKey("");

                var plant = this.appData.plant;
                var params = { "Param.1": plant, "Param.2": statusCodeKey };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapOrderStatusCodeQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callStatusCode);
            },

            callCastNoList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(1000);
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "castNoList");
            },

            getCastNoList: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getCastNoListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callCastNoList);
            },

            callChargeGroupList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "chargeGroupList");
            },

            getChargeTypeList: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getChargeGroupQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callChargeGroupList);
            },

            callLocationGroupList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "locationGroupList");
            },

            getLocationGroupList: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getLocationGroupQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callLocationGroupList);
            },

            callLocationList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "locationList");
            },

            getLocationList: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getLocationQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callLocationList);
            },

            callBasketNoList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "basketNoList");
            },

            getBasketNoList: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getBasketNoQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBasketNoList);
            },

            callBasketTypeList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "basketTypeList");
            },

            getBasketTypeList: function () {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getBasketTypeQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBasketTypeList);
            },

            callChargeNoList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                if (p_this.screenObj.statusSelect != "40")
                    p_this.getView().setModel(oModel, "chargeNoList");
                p_this.getView().setModel(oModel, "editChargeNo");
            },

            getChargeNoList: function (charges) {
                var plant = this.appData.plant;
                var params = { "Param.1": plant, "Param.2": charges };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getChargeNoQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callChargeNoList);
            },

            onChangeBasketNo: function (oEvent) {
                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            var plant = this.appData.plant;
                            //var basketNo = this.getView().byId("basketNoSelect").getSelectedKey();
                            var oData = this.getView().getModel("scrapHeadModel").oData;
                            var basketNo = oData.Row[0].BASKET_NO;
                            var basketType = oData.Row[0].BASKET_TYPE;
                            /*
                                              if (
                                                  plant == "2001" &&
                                                  basketType == "YUVARLAK" &&
                                                  basketNo != "YUVARLAK"
                                              ) {
                                                  MessageBox.error(
                                                      this.getView()
                                                          .getModel("i18n")
                                                          .getResourceBundle()
                                                          .getText("OEE_ERROR_BASKET_TYPE")
                                                  );
                                                  this.getView()
                                                      .byId("basketNoSelect")
                                                      .setSelectedKey("YUVARLAK");
                                                  this.hideBusyIndicator();
                                                  return;
                                              }
                                              if (
                                                  plant == "2001" &&
                                                  basketType != "YUVARLAK" &&
                                                  basketNo == "YUVARLAK"
                                              ) {
                                                  MessageBox.error(
                                                      this.getView()
                                                          .getModel("i18n")
                                                          .getResourceBundle()
                                                          .getText("OEE_ERROR_BASKET_TYPE_OTHER")
                                                  );
                                                  this.getView()
                                                      .byId("basketNoSelect")
                                                      .setSelectedKey("");
                                                  this.hideBusyIndicator();
                                                  return;
                                              }
                                          */
                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            onPressNewEntry: function (oEvent) {
                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            var statuscode = this.screenObj.statusSelect;

                            if (statuscode == "310") {
                                var statusSelect = "300";
                            } else if (statuscode == "320") {
                                var statusSelect = "301";
                            } else {
                                var statusSelect = this.appData.plant.substr(0, 3);
                            }

                            var buttonText = this.getView().byId("newEntry").getText();

                            //this.screenObj.statusSelect = statusSelect;
                            //this.screenObj.buttonText = buttonText;

                            this.setVisibleTruePanel();
                            this.getScrapStatusEditable(statusSelect);
                            //this.getMasterDetailList(this.screenObj.statusSelect);
                            this.getCastNoList();
                            this.getView().byId("multiComboboxCastNo").setVisible(true);
                            this.getView().byId("multiComboboxCastNo").setEnabled(true);
                            this.getView().byId("selectCastNo").setVisible(false);
                            this.getView().byId("selectCastNo").setEnabled(false);
                            this.clearScreen();

                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
    
                this.getLastCastIdGroup();
                //this.getAllCharge();
            },

            handleCancel: function () {
                this.appData.oDialog.close();
            },
            getLastCastIdGroup: function (charges) {
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getLastCastIdGroupQry");
                
                //    tRunner.ExecuteQueryAsync(this, this.callgetLastCastIdGroup);

                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                //return oData[0].Row[0].O_IS_VAL;
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0].Row);
                var multiComboboxCastNo = this.getView().byId("multiComboboxCastNo");
                for (var i = 0; i < oData[0].Row.length; i++) {
                    multiComboboxCastNo.mProperties.selectedKeys.push(oData[0].Row[i].CASTID)

                }
                
                //var castNo = multiComboboxCastNo.mProperties.selectedKeys;
               
                //this.getView().byId("multiComboboxCastNo").setSelectedItems();
       /*
                this.getView().addEventDelegate({
                    onBeforeShow: this.onPressScrapCharge,
                  }, this);
*/
                //this.onPressScrapCharge(castNo);
            },
/*
            callgetLastCastIdGroup: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                var multiComboboxCastNo = p_this.getView().byId("multiComboboxCastNo");
                for (var i = 0; i < p_data.Rowsets.Rowset[0].Row.length; i++) {
                    multiComboboxCastNo.mProperties.selectedKeys.push(p_data.Rowsets.Rowset[0].Row[i].CASTID)

                }

                //p_this.onPressScrapCharge();
            },
            */

            clearScreen: function () {
                var oModel = new sap.ui.model.json.JSONModel();
                var clearArr = [
                    ["workOrderText", "text"],
                    ["selectCastNo", "select"],
                    ["multiComboboxCastNo", "multiSelect"],
                    ["chargeGroupSelect", "select"],
                    ["basketTypeSelect", "select"],
                    ["chargeNoSelect", "select"],
                    ["basketNoSelect", "select"],
                    ["forPernr", "select"],
                    ["scrPernr", "select"],
                    ["basketPernr", "select"],
                    ["castDetailModel", "model"],
                    ["sumQuantityTeo", "input"],
                    ["sumQuantityFor", "input"],
                    ["sumQuantityScr", "input"],
                ];

                clearArr.forEach(function (item, index) {
                    var oView = this.getView();
                    if (item[1] == "text") oView.byId(item[0]).setText("");
                    else if (item[1] == "select") {
                        oView.byId(item[0]).setSelectedKey("");
                        oView.byId(item[0]).setValue("");
                    } else if (item[1] == "multiSelect") {
                        oView.byId(item[0]).setSelectedKeys(null);
                        oView.byId(item[0]).setValue(null);
                    } else if (item[1] == "model") {
                        oModel.setData(null);
                        oView.setModel(oModel, item[0]);
                    } else if (item[1] == "input") oView.byId(item[0]).setValue("");
                }, this);
            },


            onPressScrapCharge: function (oEvent) {
                //FARKLI BAKIR ORANI KONTROLÜ
                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            var multiComboboxCastNo = this.getView().byId(
                                "multiComboboxCastNo"
                            );
                            if (multiComboboxCastNo.getSelectedItems().length > 1) {
                                var chargeGroup = this.getView()
                                    .byId("chargeGroupSelect")
                                    .getSelectedKey();
                                var castNo = multiComboboxCastNo.mProperties.selectedKeys.toString();
                                var plant = this.appData.plant;
                                var params = {
                                    I_PLANT: plant,
                                    I_CASTID: castNo,
                                    I_CHARGE_GROUP: chargeGroup,
                                };
                                var tRunner = new TransactionRunner(
                                    "MES/UI/ScrapOrder/getCastNosDetailXquery",
                                    params
                                );
                                if (!tRunner.Execute()) {
                                    MessageBox.error(tRunner.GetErrorMessage());
                                    this.hideBusyIndicator();
                                    return null;
                                }
                                //var oData = tRunner.GetJSONData();
                            }

                            var oSelect = this.getView().byId("multiComboboxCastNo");
                            var items = oSelect.getSelectedItems();
                            var charcValue;
                            var prevCharcValue;
                            for (var i = 0; i < items.length; i++) {
                                if (i == 0) {
                                    charcValue = oSelect.getSelectedItems()[i].mProperties
                                        .additionalText;
                                    prevCharcValue = oSelect.getSelectedItems()[i].mProperties
                                        .additionalText;
                                } else {
                                    charcValue = oSelect.getSelectedItems()[i].mProperties
                                        .additionalText;
                                    prevCharcValue = oSelect.getSelectedItems()[i - 1].mProperties
                                        .additionalText;
                                }

                                if (prevCharcValue != charcValue) {
                                    oSelect.removeSelectedItem(items[i]);
                                    sap.m.MessageToast.show(
                                        this.getView()
                                            .getModel("i18n")
                                            .getResourceBundle()
                                            .getText("OEE_LABEL_COPPER_RATE_ERROR")
                                    );
                                    this.hideBusyIndicator();
                                    return;
                                }
                            }

                            if (oSelect.getSelectedItems().length > 0)
                                this.screenObj.copperRate = oSelect.getSelectedItems()[0].mProperties.additionalText;
                            if (oSelect.getSelectedItems()[0] == undefined) {
                                this.getView().byId("chargeGroupSelect").setValue("");
                                this.getView().byId("chargeGroupSelect").setSelectedKey("");
                                this.getView().byId("locationGroupSelect").setSelectedKey("");
                                this.onChangeComp();
                            } else {
                                this.setChargeGroup(
                                    oSelect.getSelectedItems()[0].mProperties.key
                                );
                                this.setLocationGroup(
                                    oSelect.getSelectedItems()[0].mProperties.key
                                );
                                this.getCastChargeNoList(
                                    oSelect.mProperties.selectedKeys.toString()
                                );
                                this.onChangeComp();
                            }

                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            checkEmptyForCast: function () {
                var castNo;
                if (this.getView().byId("selectCastNo").getVisible())
                    castNo = this.getView().byId("selectCastNo").getSelectedKey();
                else
                    castNo = this.getView()
                        .byId("multiComboboxCastNo")
                        .getSelectedItems()[0];

                var chargeGroup = this.getView()
                    .byId("chargeGroupSelect")
                    .getSelectedKey();
                var chargeNo = this.getView().byId("chargeNoSelect").getSelectedKey();
                if (!chargeGroup || !chargeNo || !castNo) {
                    var oModel = this.getView().getModel("castDetailModel");
                    //oModel.setData({modelData:{}});
                    oModel.setData(null);
                    oModel.updateBindings(true);
                    this.getView().byId("sumQuantityTeo").setValue("");
                    this.getView().byId("sumQuantityFor").setValue("");
                    this.getView().byId("sumQuantityScr").setValue("");
                    return true;
                }
                return false;
            },

            callOnChangeComp: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();

                if (p_data.Rowsets.Rowset[0].Row) {
                    var basketType = p_data.Rowsets.Rowset[0].Row[0].BASKET_TYPE;
                    p_this.getView().byId("basketTypeSelect").setSelectedKey(basketType);

                    var location = p_data.Rowsets.Rowset[0].Row[0].LOCATION;
                    p_this.getView().byId("locationSelect").setSelectedKey(location);

                    var data = p_this.orderByDescLayer(p_data.Rowsets.Rowset[0]);
                }

                oModel.setData(data);
                p_this.getView().setModel(oModel, "castDetailModel");

                p_this.getAllCharge();

                if (p_data.Rowsets.Rowset[0].Row) {
                    p_this.calculateSumQuantity(p_data.Rowsets.Rowset[0].Row);
                }
            },

            onChangeComp: function (oEvent) {
                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            if (this.checkEmptyForCast()) {
                                this.hideBusyIndicator();
                                return;
                            }

                            var multiCastLength = this.getView()
                                .byId("multiComboboxCastNo")
                                .getSelectedItems().length;

                            if (multiCastLength > 0) {
                                var multiSelectedItem = this.getView()
                                    .byId("multiComboboxCastNo")
                                    .getSelectedItems()[0];
                                var castNo = multiSelectedItem.mProperties.key;
                                var copperRate = Number(
                                    multiSelectedItem.mProperties.additionalText
                                );
                            } else {
                                var castNo = "";
                                var copperRate = 0;
                            }

                            //var chargeNo = this.getCastChargeNoList(castNo);
                            this.getView().byId("chargeNoSelect").setSelectedIndex(0);

                            var plant = this.appData.plant;
                            var chargeGroup = this.getView()
                                .byId("chargeGroupSelect")
                                .getSelectedKey();

                            var chargeNo = this.getView()
                                .byId("chargeNoSelect")
                                .getSelectedKey();
                            //var basketNo = this.getView().byId("basketNoSelect").getSelectedKey();
                            var locationGroup = this.getView()
                                .byId("locationGroupSelect")
                                .getSelectedKey();
                            if (!locationGroup) {
                                var locationGroup = "";
                            }

                            var params = {
                                "Param.1": plant,
                                "Param.2": copperRate,
                                "Param.3": chargeNo,
                                "Param.4": chargeGroup,
                                "Param.5": locationGroup,
                            };
                            var tRunner = new TransactionRunner(
                                "MES/UI/ScrapOrder/getChargeCompQry",
                                params
                            );
                            tRunner.ExecuteQueryAsync(this, this.callOnChangeComp);

                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            IsEmpty: function (objID) {
                var loElement = this.getView().byId(objID);
                if (loElement && loElement.getEnabled()) {
                    if (loElement.getMetadata().getName() == "sap.m.MultiComboBox") {
                        if (loElement.getSelectedKeys().length == 0) return true;
                    }
                    if (loElement.getMetadata().getName() == "sap.m.ComboBox") {
                        if (loElement.getSelectedKey().length == 0) return true;
                    }
                    if (loElement.getMetadata().getName() == "sap.m.Select") {
                        if (loElement.getSelectedKey().length == 0) return true;
                    }
                    if (loElement.getMetadata().getName() == "sap.m.Input") {
                        if (loElement.getValue().length == 0) return true;
                    }
                }
                return false;
            },

            ErrorMessage: function (msgi18n) {
                sap.m.MessageBox.error(
                    this.getView().getModel("i18n").getResourceBundle().getText(msgi18n)
                );
            },

            TableControl: function (tblName) {
                var result = true;
                var tblComponents = this.getView().byId(tblName);
                var lv_prev_scraptype = "";
                tblComponents.getItems().forEach(function (tblItem) {
                    tblItem.getCells().forEach(function (tblCell) {
                        if (
                            tblCell.getMetadata().getName() == "sap.m.MultiComboBox" &&
                            tblCell.getEnabled()
                        ) {
                            if (tblCell.getSelectedKeys().length == 0) {
                                sap.m.MessageBox.error(
                                    tblCell.getLabels()[0].getText() + " boş olamaz"
                                );
                                result = false;
                                return;
                            }
                        }
                        if (result == false) return;

                        if (
                            tblCell.getMetadata().getName() == "sap.m.ComboBox" &&
                            tblCell.getEnabled()
                        ) {
                            if (tblCell.getSelectedKey().length == 0) {
                                sap.m.MessageBox.error(
                                    tblCell.getLabels()[0].getText() + " boş olamaz"
                                );
                                result = false;
                                return;
                            }
                        }
                        if (result == false) return;

                        if (
                            tblCell.getMetadata().getName() == "sap.m.Select" &&
                            tblCell.getEnabled()
                        ) {
                            if (tblCell.getSelectedKey().length == 0) {
                                sap.m.MessageBox.error(
                                    tblCell.getLabels()[0].getText() + " boş olamaz"
                                );
                                result = false;
                                return;
                            }
                        }
                        if (result == false) return;

                        if (
                            tblCell.getMetadata().getName() == "sap.m.Input" &&
                            tblCell.getEnabled()
                        ) {
                            if (tblCell.getValue().length == 0) {
                                sap.m.MessageBox.error(
                                    tblCell.getPlaceholder() + " boş olamaz"
                                );
                                result = false;
                            }
                            if (result == false) return;

                            if (tblCell.getValue() == 0) {
                                sap.m.MessageBox.error(
                                    tblCell.getPlaceholder() + " sıfır olamaz"
                                );
                                result = false;
                                return;
                            }
                            if (result == false) return;
                        }

                        if (
                            tblCell.getLabels &&
                            tblCell.getLabels().length > 0 &&
                            tblCell.getLabels()[0].getText() == "Hurda Tipi"
                        ) {
                            if (
                                lv_prev_scraptype.length > 0 &&
                                lv_prev_scraptype == tblCell.getSelectedKey()
                            ) {
                                sap.m.MessageBox.error(
                                    tblCell.getSelectedKey() +
                                    " hurdası üst üste iki tabakada olamaz."
                                );
                                result = false;
                                return;
                            }
                            lv_prev_scraptype = tblCell.getSelectedKey();
                        }
                        if (result == false) return;
                    });
                });
                return result;
            },

            saveChargeScrap: function (oEvent) {

                var oData = this.getView().getModel("castDetailModel").oData;

                if(!oData){
                    this.ErrorMessage("OEE_ERROR_ENTRY_SCRAP_CHARGE");
                        return false;
                }


                if (this.screenObj.statusSelect == "330" && this.screenObj.buttonText == "Ark Ocağına (Isıtmalı)") {
                    this.onPressEndTemp();
                }

                var validation = this.getValidations();

                if (validation == "T") {
                    if (this.IsEmpty("multiComboboxCastNo")) {
                        this.ErrorMessage("OEE_ERROR_SELECT_CASTNO");

                        return false;
                    }
                    if (this.IsEmpty("selectCastNo")) {
                        this.ErrorMessage("OEE_ERROR_SELECT_CASTNO");

                        return false;
                    }
                    if (this.IsEmpty("chargeGroupSelect")) {
                        this.ErrorMessage("OEE_ERROR_SELECT_CHARGE_GROUP");

                        return false;
                    }
                    if (this.IsEmpty("locationGroupSelect")) {
                        this.ErrorMessage("OEE_ERROR_SELECT_LOCATION_GROUP");

                        return false;
                    }
                    if (this.IsEmpty("locationSelect")) {
                        this.ErrorMessage("OEE_ERROR_SELECT_LOCATION_GROUP");

                        return false;
                    }
                    if (this.IsEmpty("chargeNoSelect")) {
                        this.ErrorMessage("OEE_ERROR_SELECT_CHARGE_NO");

                        return false;
                    }
                    if (this.IsEmpty("basketNoSelect")) {
                        this.ErrorMessage("OEE_ERROR_SELECT_BASKET_NO");

                        return false;
                    }
                    if (this.IsEmpty("basketTypeSelect")) {
                        this.ErrorMessage("OEE_ERROR_SELECT_BASKET_TYPE");

                        return false;
                    }
                    if (this.IsEmpty("forPernr")) {
                        this.ErrorMessage("OEE_ERROR_FORMEN_NAME");

                        return false;
                    }
                    if (this.IsEmpty("scrPernr")) {
                        this.ErrorMessage("OEE_ERROR_OPER_NAME");

                        return false;
                    }
                    if (this.IsEmpty("basketPernr")) {
                        this.ErrorMessage("OEE_ERROR_OPER_NAME");

                        return false;
                    }

                    //var tblName = "idCastTable";
                    if (!this.TableControl("idCastTable")) {
                        return false;
                    }

                    //var tblModel = "castDetailModel";
                    if (!this.TableControlZero("castDetailModel")) {
                        return false;
                    }

                    if (!this.overTonnageScrapControl()) {
                        return false;
                    }
                }

                var chargeGroup = this.getView()
                    .byId("chargeGroupSelect")
                    .getSelectedKey();
                var locationGroup = this.getView()
                    .byId("locationGroupSelect")
                    .getSelectedKey();
                var location = this.getView().byId("locationSelect").getSelectedKey();
                var chargeNo = this.getView().byId("chargeNoSelect").getSelectedKey();
                var basketNo = this.getView().byId("basketNoSelect").getSelectedKey();
                var basketType = this.getView()
                    .byId("basketTypeSelect")
                    .getSelectedKey();
                var forPernr = this.getView().byId("forPernr").getSelectedKey();
                var scrPernr = this.getView().byId("scrPernr").getSelectedKey();
                var basketPernr = this.getView().byId("basketPernr").getSelectedKey();

                var werks = this.appData.plant;
                var scrOrdId = this.getView().byId("workOrderText").getText();

                var castNoId = this.getView().byId("selectCastNo");
                if (castNoId.getVisible()) {
                    var castNo = castNoId.getSelectedKey().toString();
                    var spath = this.getView().byId("masterList")._aSelectedPaths[0];
                    if (!spath) {
                        this.ErrorMessage("OEE_ERROR_SELECT_CASTNO");
                        this.hideBusyIndicator();
                        return false;
                    }
                    var selectMaster = spath.split("/Row/")[1];
                    var rows = this.getView().getModel("masterDetailList").oData.Row;
                    var copperRate = rows[selectMaster].COPPER_RATE;
                    var scrOrdId = rows[selectMaster].SCRORDID;
                }

                var multiComboboxCastNo = this.getView().byId("multiComboboxCastNo");
                if (multiComboboxCastNo.getEnabled()) {
                    var multiCastItems = [];
                    var multiCastLength = multiComboboxCastNo.getSelectedItems().length;

                    if (
                        werks == "2001" &&
                        multiCastLength > 1 &&
                        chargeGroup == "YUVARLAK"
                    ) {
                        sap.m.MessageToast.show(
                            this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("OEE_ERROR_BASKET_TYPE_SELECTED")
                        );
                        return;
                    }

                    for (var i = 0; i < multiCastLength; i++)
                        multiCastItems.push(
                            this.getView().byId("multiComboboxCastNo").getSelectedItems()[i]
                                .mProperties.key
                        );
                    var castNo = multiCastItems.toString();
                    var copperRate = Number(
                        multiComboboxCastNo.getSelectedItems()[0].mProperties.additionalText
                    );
                }

                this.screenObj.castNo = castNo;
                this.screenObj.chargeNo = chargeNo;

                var componentsOData = [{ Row: [] }];
                var tablesData = [{ Rowset: [] }];
                var tblComponents = this.getView().byId("idCastTable");

                var oData =
                    tblComponents.oPropagatedProperties.oModels.castDetailModel.oData;

                if (!oData || oData.Row.length == 0) {
                    sap.m.MessageBox.error(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_ERROR_SELECT_SCRAP_ENTRY")
                    );

                    return false;
                }

                oData.Row.forEach(function (obj) {
                    if (obj.CUMQUAN == "") obj.CUMQUAN = 0;
                    var currentItem = {
                        LAYER: obj.LAYER,
                        MATERIAL: obj.MATNR,
                        JARGON: obj.JARGON,
                        BASKET_TYPE: obj.BASKETTYPE,
                        TEOQUAN: obj.TEOQUAN,
                        FORQUAN: obj.FORQUAN,
                        SCRQUAN: obj.SCRQUAN,
                        CUMQUAN: obj.CUMQUAN,
                    };
                    componentsOData[0].Row.push(currentItem);
                });
                //   tablesData[0].Rowset.push(componentsOData[0]);
                var tableData = JSON.stringify(componentsOData[0]);
                var params = {
                    I_PLANT: werks,
                    I_CASTID: castNo,
                    I_TABLE_DATA: tableData,
                    I_CHARGE_GROUP: chargeGroup,
                    I_CHARGE_NO: chargeNo,
                    I_LOCATION_GROUP: locationGroup,
                    I_LOCATION: location,
                    I_BASKET_TYPE: basketType,
                    I_COPPER_RATE: copperRate,
                    I_USER: this.appData.user.userID,
                    I_STATUSCODE: this.screenObj.statusSelect,
                    I_STATUSDESC: this.screenObj.buttonText,
                    I_BASKET_NO: basketNo,
                    I_FOR_PERNR: forPernr,
                    I_SCR_PERNR: scrPernr,
                    I_BASKET_PERNR: basketPernr,
                    I_SCRORDID: scrOrdId,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Operations/insertScrapOrderXquery",
                    params
                );
                //tRunner.ExecuteQueryAsync(this, this.callInsertScrapCharge);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());

                    return false;
                }

                var jsData = tRunner.GetJSONData();

                sap.m.MessageToast.show(
                    this.screenObj.castNo +
                    " dökümün " +
                    this.screenObj.chargeNo +
                    " numaralı şarjı kaydedildi."
                    //this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
                );

                this.getMasterDetailList(this.screenObj.statusSelect);
                //p_this.setVisibleFalsePanel();

                this.getAllCharge();
                if (this.getView().byId("multiComboboxCastNo").getVisible()) {
                    this.getCastChargeNoList(this.screenObj.castNo);
                    this.setChargeGroup(this.screenObj.castNo);
                    this.setLocationGroup(this.screenObj.castNo);
                    this.onChangeComp();
                    this.onChangeStatusList();
                }
                //this.onChangeStatusList();

                return true;
            },

            /*
                                        var busyIndicator = this.getView();
                                        busyIndicator.setBusyIndicatorDelay(0);
                                        busyIndicator.setBusy(true);
                                        BusyIndicator.show();
                      
                                        setTimeout(function () {
                                            var tRunner = new TransactionRunner(
                                                "MES/UI/ScrapOrder/Operations/insertScrapOrderXquery", params);
                                            tRunner.ExecuteQueryAsync(this, this.callInsertScrapCharge);
                                  
                                            busyIndicator.setBusy(false);
                                            busyIndicator.setBusyIndicatorDelay(1000); // default
                      
                                        }.bind(this), 500)
                                            },
                                            */

            /*
                                    callInsertScrapCharge: function (p_this, p_data) {
                        
                                        sap.m.MessageToast.show(
                                            p_this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
                                        );
                                        p_this.getMasterDetailList(p_this.screenObj.statusSelect);
                                        //p_this.setVisibleFalsePanel();
                        
                                        p_this.getAllCharge();
                                        if (p_this.getView().byId("multiComboboxCastNo").getVisible()) {
                                            p_this.getCastChargeNoList(p_this.screenObj.castNo);
                                            p_this.setChargeGroup(p_this.screenObj.castNo);
                                            p_this.setLocationGroup(p_this.screenObj.castNo);
                                            p_this.onChangeComp();
                                        }
                        
                                    },
                                    */
            onPressDeleteRow: function (oEvent) {
                if (!this.getView().getModel("castDetailModel")) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_GET_DATA")
                    );
                    return;
                }
                var errorStatus = false;

                var selectedPath = this.getView().byId("idCastTable").getSelectedItem();
                if (!selectedPath) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_ROW_ERROR")
                    );
                    return;
                }

                var selectedPath = this.getView().byId("idCastTable").getSelectedItem()
                    .oBindingContexts.castDetailModel.sPath;
                var oData = this.getView().getModel("castDetailModel").oData;
                var rows = oData.Row;

                var selectedRow = selectedPath.split("/Row/")[1];
                var layer = oData.Row[selectedRow].LAYER;
                this.appData.currentTableSelectedPath = selectedPath;
                sap.m.MessageBox.warning(
                    layer + ". tabakayı silmek istediğinize emin misiniz?",
                    {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction == "YES") {
                                var maxLayer = 0;
                                //En üstteki tabaka bulunur
                                for (var i = 0; i < rows.length; i++) {
                                    if (rows[i].LAYER > maxLayer) maxLayer = rows[i].LAYER;
                                }
                                if (Number(layer != Number(maxLayer))) errorStatus = true;
                                if (errorStatus) {
                                    sap.m.MessageToast.show(
                                        this.getView()
                                            .getModel("i18n")
                                            .getResourceBundle()
                                            .getText("OEE_LABEL_ERROR_LAST_LAYER")
                                    );
                                    return;
                                }

                                this.deleteAccept(layer);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
                this.getView().byId("idCastTable").removeSelections();
            },

            callDeleteAccept: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.getSelectMasterCastID();
                p_this.getAllCharge();
            },

            deleteAccept: function (layer) {
                var castID;
                var oData = this.getView().getModel("castDetailModel").oData;
                var rows = oData.Row;
                var selectCastNo = this.getView().byId("selectCastNo");
                var multiComboboxCastNo = this.getView().byId("multiComboboxCastNo");
                if (selectCastNo.getVisible()) castID = selectCastNo.getSelectedKey();
                else if (multiComboboxCastNo.getVisible())
                    castID = multiComboboxCastNo.getSelectedKeys()[0];
                if (rows[0].SCRORDITEMID == undefined) {
                    {
                        for (var i = 0; i < oData.Row.length; i++) {
                            if (oData.Row[i].LAYER == Number(layer)) oData.Row.splice(i, 1);
                        }
                        var oModel = new sap.ui.model.json.JSONModel();
                        this.calculateSumQuantity(oData.Row);
                        var data = this.orderByDescLayer(oData);
                        oModel.setData(data);
                        this.getView().setModel(oModel, "castDetailModel");
                        return;
                    }
                }
                var plant = this.appData.plant;
                var userID = this.appData.user.userID;
                var chargeNoSelect = this.getView()
                    .byId("chargeNoSelect")
                    .getSelectedKey();
                var params = {
                    I_PLANT: plant,
                    I_CASTID: castID,
                    I_CHARGE_NO: chargeNoSelect,
                    I_LAYER_NO: layer,
                    I_USER: userID,
                };

                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            var tRunner = new TransactionRunner(
                                "MES/UI/ScrapOrder/Operations/deleteScrapLayerNoXquery",
                                params
                            );
                            tRunner.ExecuteQueryAsync(this, this.callDeleteAccept);
                            this.calculateCumulative();
                            this.calculateSumQuantity(rows);
                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            onPressAddScrapHBI: function () {
                if (!this.getView().getModel("castDetailModel")) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_GET_DATA")
                    );
                    return;
                }
                var oView = this.getView();
                var oDialog = oView.byId("scrapOrderAddScrapHBI");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.scrapOrderAddScrapHBI",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                var oData = this.getView().getModel("castDetailModel").oData;

                if (oData) {
                    var rows = oData.Row;
                    var maxLayer = 0;
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].LAYER > maxLayer) maxLayer = rows[i].LAYER;
                    }
                }
                if (maxLayer == 6) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_ERR_MAX_LAYER")
                    );
                    return;
                }
                if (maxLayer == undefined) maxLayer = 0;
                if (maxLayer != 6) maxLayer = Number(maxLayer) + 1;
                var layer = this.getView().byId("nextLayerHBI");
                layer.setText(maxLayer);

                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].JARGON == "HBI") {
                        var layer = this.getView().byId("nextLayerHBI");
                        layer.setText(rows[i].LAYER);
                        var scrapQuantity = this.getView().byId("scrapQuantityHBI");
                        scrapQuantity.setValue(rows[i].SCRQUAN);
                    }
                }

                oDialog.open();
                this.appData.oDialog = oDialog;
            },

            onPressAddRow: function () {
                if (!this.getView().getModel("castDetailModel")) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_GET_DATA")
                    );
                    return;
                }
                var selectedCastNo;
                if (this.getView().byId("selectCastNo").getVisible())
                    selectedCastNo = this.getView().byId("selectCastNo").getSelectedKey();
                else {
                    var castNo = this.getView()
                        .byId("multiComboboxCastNo")
                        .getSelectedKeys();
                    if (castNo.length == 0) {
                        sap.m.MessageToast.show(
                            this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("OEE_ERROR_SELECT_CASTNO")
                        );
                        return;
                    } else {
                        selectedCastNo = this.getView()
                            .byId("multiComboboxCastNo")
                            .getSelectedItems()[0].mProperties.key;
                    }
                }

                var oView = this.getView();
                var oDialog = oView.byId("scrapOrderAddScrap");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.scrapOrderAddScrap",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                var oData = this.getView().getModel("castDetailModel").oData;
                if (oData) {
                    var rows = oData.Row;
                    var maxLayer = 0;
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].LAYER > maxLayer) maxLayer = rows[i].LAYER;
                    }
                }
                if (maxLayer == 6) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_ERR_MAX_LAYER")
                    );
                    return;
                }
                if (maxLayer == undefined) maxLayer = 0;
                if (maxLayer != 6) maxLayer = Number(maxLayer) + 1;
                var layer = this.getView().byId("nextLayer");
                layer.setText(maxLayer);
                oDialog.open();

                this.getView().byId("scrapQuantity").setValue("");
                this.getView().byId("scrapType").setValue("");
                this.getView().byId("scrapType").setSelectedKey("");
                this.appData.oDialog = oDialog;
            },

            getSelectedScrapOrderId: function () {
                var lo_model = this.getView().getModel("masterDetailList");
                if (!lo_model) return null;

                var lo_mlist = this.getView().byId("masterList");
                if (!lo_mlist) return null;

                var rows = lo_model.getData()["Row"];
                if (!rows) return null;

                var selectedItem = lo_mlist.getSelectedItem();
                if (!selectedItem) return null;

                var selectedRow = selectedItem
                    .getBindingContextPath()
                    .split("/Row/")[1];

                return rows[selectedRow].SCRORDID;
            },

            findScrapOrderId: function (p_scrordid) {
                var lo_model = this.getView().getModel("masterDetailList");
                if (!lo_model) return false;

                var rows = lo_model.getData()["Row"];

                for (var i = 0; rows && i < rows.length; i++) {
                    if (rows[i].SCRORDID == p_scrordid) return true;
                }
                return false;
            },

            getSelectMasterCastID: function (oEvent) {
                var mcCastNo = this.getView().byId("multiComboboxCastNo");
                mcCastNo.setVisible(false);
                mcCastNo.setEnabled(false);
                var selectCastNo = this.getView().byId("selectCastNo");
                selectCastNo.setVisible(true);
                if (oEvent != undefined) {
                    this.screenObj.copper_rate = oEvent
                        .getSource()
                        .getSelectedItem().mProperties.number;
                }
                var oData = this.getView().getModel("masterDetailList").oData;
                var sPath = this.getView().byId("masterList").getSelectedItem()
                    .oBindingContexts.masterDetailList.sPath;
                var selectedRow = sPath.split("/Row/")[1];

                var scrordid = oData.Row[selectedRow].SCRORDID;
                var chargeNo = oData.Row[selectedRow].CHARGE_NO;

                this.screenObj.scrordid = scrordid;
                this.screenObj.chargeNo = chargeNo;

                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            this.getChargeNoList();
                            this.getScrapHead(scrordid);
                            this.getScrapDetailModel(scrordid);
                            this.getScrapPreheatingDetail(scrordid);
                            this.getScrapStatusEditable(this.screenObj.statusSelect);
                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            callScrapStatusEditable: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                //oModel.setSizeLimit(1000);
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "scrapStatusEditable");
            },

            getScrapStatusEditable: function (statusCodeKey) {
                var params = { "Param.1": statusCodeKey };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapStatusEditableQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapStatusEditable);
            },

            callScrapHeadQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(1000);
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "scrapHeadModel");

                p_this.getVisibleStatus(p_this.screenObj.statusSelect);
                p_this.getAllCharge();
            },

            getScrapHead: function (scrordid) {
                var params = { "Param.1": scrordid };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapHeadQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapHeadQry);
            },

            callScrapDetailModel: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(1000);
                if (p_data.Rowsets.Rowset[0].Row) {
                    var data = p_this.orderByDescLayer(p_data.Rowsets.Rowset[0]);
                }
                oModel.setData(data);
                p_this.getView().setModel(oModel, "castDetailModel");

                if (p_data.Rowsets.Rowset[0].Row) {
                    p_this.calculateSumQuantity(p_data.Rowsets.Rowset[0].Row);
                }

                //p_this.getAllCharge();
            },

            getScrapDetailModel: function (scrordid) {
                var params = { "Param.1": scrordid };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapDetailQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapDetailModel);
            },

            onPressDeleteChargeComp: function (oEvent) {
                this.getView().byId("castingNumberList").setSelectedKey("");

                var rows = this.getView().getModel("masterDetailList").oData.Row;
                var table = this.getView().byId("masterList");
                var tableContexts = table.getSelectedContexts()[0];
                if (!tableContexts) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_ERROR_SELECT_DELETE_SCRAP")
                    );
                    return;
                }
                sap.m.MessageBox.warning(
                    this.getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_TRANSACTION_ACCEPT"),
                    {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction == "YES") {
                                this.acceptDeleteChargeComp();
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },

            acceptDeleteChargeComp: function () {
                var rows = this.getView().getModel("masterDetailList").oData.Row;
                var table = this.getView().byId("masterList");
                var tableContexts = table.getSelectedContexts()[0];
                var sPath = tableContexts.sPath;
                var selectedRow = sPath.split("/Row/")[1];
                var rowInformation = rows[selectedRow];
                var scrordid = rowInformation.SCRORDID;
                var plant = this.appData.plant;
                var params = { I_WERKS: plant, I_SCRORDID: scrordid };

                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            var tRunner = new TransactionRunner(
                                "MES/UI/ScrapOrder/Operations/deleteChargeCompXquery",
                                params
                            );
                            tRunner.ExecuteQueryAsync(this, this.callDeleteChargeComp);

                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            callDeleteChargeComp: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.getMasterDetailList(p_this.screenObj.statusSelect);
                p_this.setVisibleFalsePanel();
                p_this.getCastingNumberList(p_this.screenObj.statusSelect);
                p_this.getVisibleStatus(0);
            },

            onPressAddEntry: function (oEvent) {
                var castID;
                var oView = this.getView();

                var scrapType = oView.byId("scrapType").getSelectedKey();
                var scrapQuantity = oView.byId("scrapQuantity").getValue();
                if (scrapType == "" || scrapQuantity == "") {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_BLANKS_ERROR")
                    );
                    return true;
                }
                var selectCastNo = oView.byId("selectCastNo");
                var multiComboboxCastNo = oView.byId("multiComboboxCastNo");
                if (selectCastNo.getVisible()) castID = selectCastNo.getSelectedKey();
                else if (multiComboboxCastNo.getVisible())
                    castID = multiComboboxCastNo.getSelectedKeys()[0];
                var basketNoSelect = oView.byId("basketNoSelect").getSelectedKey();
                var basketTypeSelect = oView.byId("basketNoSelect").getSelectedKey();
                var chargeGroupSelect = oView
                    .byId("chargeGroupSelect")
                    .getSelectedKey();
                var copperRate;
                if (multiComboboxCastNo.getVisible())
                    copperRate = this.screenObj.copperRate;
                else
                    copperRate = this.getView().byId("masterList")._oSelectedItem
                        .mProperties.number;
                var layer = this.getView().byId("nextLayer").getText();
                var locationGroupSelect = oView
                    .byId("locationGroupSelect")
                    .getSelectedKey();
                var chargeNoSelect = oView.byId("chargeNoSelect").getSelectedKey();
                var tableData = oView.getModel("castDetailModel").oData;
                if (tableData != null) {
                    if (tableData.Row.length > 0) {
                        if (this.appData.plant == 2001) {
                            if (tableData.Row[0].JARGON == scrapType) {
                                MessageBox.error(
                                    "Son tabaka ile aynı malzeme seçemezsiniz!",
                                    "E"
                                );
                                return;
                            }
                        } else {
                            if (tableData.Row[tableData.Row.length - 1].JARGON == scrapType) {
                                MessageBox.error(
                                    "Son tabaka ile aynı malzeme seçemezsiniz!",
                                    "E"
                                );
                                return;
                            }
                        }
                    }
                }
                var params = {
                    "Param.1": this.appData.plant,
                    "Param.2": scrapType,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getMatnrQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var jsData = tRunner.GetJSONData();

                var xfor,
                    xscr,
                    scrquan = 0,
                    forquan = 0,
                    cumquan = 0;
                if (this.appData.plant == 2001) {
                    if (this.screenObj.statusSelect == 210) {
                        //xfor = "X";
                        forquan = scrapQuantity;
                        cumquan = 0;
                    } else {
                        //xscr = "X";
                        scrquan = scrapQuantity;
                        cumquan = 0;
                    }
                } else if (this.appData.plant == 3001) {
                    if (this.screenObj.statusSelect == 310) {
                        //xfor = "X";
                        forquan = scrapQuantity;
                        cumquan = 0;
                    } else {
                        //xscr = "X";
                        scrquan = 0;
                        cumquan = scrapQuantity;
                    }
                }

                var tableData = oView.getModel("castDetailModel").oData;
                if (tableData == null) {
                    tableData = {};
                    tableData.Row = [];
                }
                tableData.Row[tableData.Row.length] = {
                    BASKET_NO: basketNoSelect,
                    BASKET_TYPE: basketTypeSelect,
                    CASTID: castID,
                    CHARGE_GROUP: chargeGroupSelect,
                    CHARGE_NO: chargeNoSelect,
                    COPPER_RATE: copperRate,
                    CUMQUAN: cumquan,
                    FORQUAN: forquan,
                    JARGON: scrapType,
                    LAYER: layer,
                    LOCATION_GROUP: locationGroupSelect,
                    MATNR: jsData[0].Row[0].MATNR,
                    SCRQUAN: scrquan,
                    TEOQUAN: 0,
                    XFOR: xfor,
                    XSCR: xscr,
                };

                var orderedArr = [];
                var oModel = new sap.ui.model.json.JSONModel();

                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            var data = this.orderByDescLayer(tableData);
                            oModel.setData(data);

                            oView.setModel(oModel, "castDetailModel");
                            this.handleCancel();
                            if (this.appData.plant == 3001) {
                                this.calculateCumulative();
                            }

                            this.calculateSumQuantity(tableData.Row);

                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            onPressAddEntryHBI: function (oEvent) {
                var castID;
                var oView = this.getView();
                var plant = this.appData.plant;

                var scrapType = oView.byId("scrapTypeHBI").getSelectedKey();
                var scrapQuantity = oView.byId("scrapQuantityHBI").getValue();
                if (scrapType == "" || scrapQuantity == "") {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_BLANKS_ERROR")
                    );
                    return true;
                }

                var sumAllScrQuantity = this.getView().byId("sumAllScrQuantity").getValue();
                var totalQuantity = parseFloat(sumAllScrQuantity) + parseFloat(scrapQuantity);

                if (plant == 2001) {
                    if (totalQuantity > 165000) {
                        sap.m.MessageBox.error("Tonaj Aşıldı. (" + totalQuantity + " kg)");
                        return;
                    }
                } else if (plant == 3001) {
                    if (totalQuantity > 120000) {
                        sap.m.MessageBox.error("Tonaj Aşıldı. (" + totalQuantity + " kg)");
                        return;
                    }
                }


                if (!this.overTonnageScrapControl(scrapQuantity)) {
                    return false;
                }

                var scrordid = this.screenObj.scrordid;
                var layer = this.getView().byId("nextLayerHBI").getText();
                var plant = this.appData.plant;
                var user = this.appData.user.userID;
                var params = {
                    I_PLANT: plant,
                    I_SCRORDID: scrordid,
                    I_LAYER: layer,
                    I_JARGON: scrapType,
                    I_QUANTITY: scrapQuantity,
                    I_USER: user,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Operations/updateScrapItemXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var jsData = tRunner.GetJSONData();

		this.getMasterDetailList(this.screenObj.statusSelect);
                this.getScrapDetailModel(scrordid);

                this.handleCancel();
                this.getAllCharge();
            },

            onPressWorkflow: function (oEvent) {
                //MessageToast.show(oEvent.getParameter("item").getKey() + "-" + oEvent.getParameter("item").getText() );

                var buttonText = oEvent.getParameter("item").getText();
                this.screenObj.buttonText = oEvent.getParameter("item").getText();
                this.screenObj.workFlowId = oEvent.getParameter("item").getKey();
                MessageBox.warning(
                    this.getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText(buttonText + " gönderme işlemini onaylıyor musunuz?"),
                    {
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction == "YES") {
                                if (!this.saveChargeScrap()) return false;
                                this.getControlChargeNoSeq(buttonText);
                                //this.sendBulkOperation(buttonText);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },



            getControlChargeNoSeq: function (buttonText) {
                var validation = this.getControlChargeNo();
                if (validation == 1) {
                    MessageBox.warning(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_CHARGE_NO_SEQ"),
                        {
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (oAction) {
                                if (oAction == "YES") {
                                    this.getCastNoSeq(buttonText);
                                } else {
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                } else this.getCastNoSeq(buttonText);
            },


            getCastNoSeq: function (buttonText) {
                var validation = this.getCastNoSeqControl();
                if (validation == 1) {
                    MessageBox.warning(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_CASTNOSEQ"),
                        {
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (oAction) {
                                if (oAction == "YES") {
                                    this.sendCopperRateChange(buttonText);
                                } else {
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                } else this.sendCopperRateChange(buttonText);
            },

            sendCopperRateChange: function (buttonText) {
                var copperRateChange = this.getCopperRateChange();
                if (copperRateChange.IS_COPPER_RATE_CHANGE == "T") {
                    MessageBox.warning(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("Sipariş değiştirildiğinden dolayı bakır oranı farklıdır. Devam etmek istiyor musunuz? " + " ( Bakır Oranı: " + (copperRateChange.FIRST_COPPER_RATE) + " => " + (copperRateChange.COPPER_RATE) + " ) "),
                        {
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (oAction) {
                                if (oAction == "YES") {
                                    //this.updateCopperRateChange();
                                    this.saveScrapTransitions(buttonText);
                                } else {
                                    return;
                                    //this.updateChangeOrder();
                                }
                            }.bind(this),
                        }
                    );
                } else this.saveScrapTransitions(buttonText);
            },

            sendBulkOperation: function (buttonText) {
                var bulk = this.getBulk();
                if (bulk == "T") {
                    MessageBox.warning(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_CASTBULKCHARGE"),
                        {
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (oAction) {
                                if (oAction == "YES") {
                                    this.saveScrapTransitions(buttonText);
                                } else {
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                } else this.saveScrapTransitions(buttonText);
            },

            saveScrapTransitions: function () {
                if (!this.overTonnageControl()) {
                    return false;
                }

                this.updateScrapTransitions();
                var statusCodeKey = this.getView()
                    .byId("statusSelect")
                    .getSelectedKey();
                this.getMasterDetailList(statusCodeKey);
                this.onChangeStatusList();
                this.clearScreen();
                this.setVisibleFalsePanel();
                this.getAllCharge();
            },

            updateScrapTransitions: function () {
                var params = {
                    I_SCRORDID: this.screenObj.scrordid,
                    I_WORKFLOWID: this.screenObj.workFlowId,
                    I_USER: this.appData.user.userID,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Transitions/updateScrapTransitionsXquery",
                    params
                );

                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                //var jsData = tRunner.GetJSONData();

                sap.m.MessageToast.show(
                    this.getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
            },
            /*
                              updateChangeOrder: function () {
                                  var params = {
                                      I_PLANT: this.appData.plant,
                                      I_CASTID: this.screenObj.castNo,
                                      I_USER: this.appData.user.userID,
                                  };
                  
                                  var tRunner = new TransactionRunner(
                                      "MES/UI/ScrapOrder/ChangeOrder/updateChangeOrderXquery",
                                      params
                                  );
                  
                                  if (!tRunner.Execute()) {
                                      MessageBox.error(tRunner.GetErrorMessage());
                                      return null;
                                  }
                  
                                  //var jsData = tRunner.GetJSONData();
                  
                                  sap.m.MessageToast.show(
                                      this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
                                  );
                                  var statusCodeKey = this.getView().byId("statusSelect").getSelectedKey();
                                  this.getMasterDetailList(statusCodeKey);
                                  this.onChangeStatusList();
                                  this.clearScreen();
                                  this.setVisibleFalsePanel();
                                  this.getAllCharge();
                              },
                  */
            /*
                              updateCopperRateChange: function () {
                                  var changeOrderStatus = "F";
                  
                                  var params = {
                                      "Param.1": this.screenObj.scrordid,
                                      "Param.2": changeOrderStatus,
                                  };
                  
                                  var tRunner = new TransactionRunner(
                                      "MES/UI/ScrapOrder/Transitions/updateCopperRateChangeQry",
                                      params
                                  );
                  
                                  if (!tRunner.Execute()) {
                                      MessageBox.error(tRunner.GetErrorMessage());
                                      return null;
                                  }
                  
                                  //var jsData = tRunner.GetJSONData();
                                
                                                  sap.m.MessageToast.show(
                                                      this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
                                                  );
                                                  
                              },
                  */
            overTonnageControl: function () {
                var result = true;

                var statuscode = this.screenObj.statusSelect.substr(1, 2);

                if (statuscode == 10) {
                    var totalQuantity = this.getView()
                        .byId("sumAllForQuantity")
                        .getValue();
                } else {
                    var totalQuantity = this.getView()
                        .byId("sumAllScrQuantity")
                        .getValue();
                }

                var plant = this.appData.plant;
                if (plant == "2001") {
                    if (parseInt(totalQuantity) > 165000) {
                        sap.m.MessageBox.error("Tonaj Aşıldı. (" + totalQuantity + " kg)");
                        result == false;
                        return;
                    }
                } else if (plant == "3001") {
                    if (parseInt(totalQuantity) > 120000) {
                        sap.m.MessageBox.error("Tonaj Aşıldı. (" + totalQuantity + " kg)");
                        result == false;
                        return;
                    }
                }
                return result;
            },

            overTonnageScrapControl: function (scrapQuantity) {
                var result = true;
                var statuscode = this.screenObj.statusSelect.substr(1, 2);

                var oModel = this.getView().getModel("castDetailModel");
                var oData = oModel.oData;
                var rows = oData.Row;

                if (statuscode == 10) {
                    var tonnage = 0;
                    for (var i = 0; i < rows.length; i++) {
                        tonnage = tonnage + parseInt(rows[i].FORQUAN);
                    }
                } else {
                    var tonnage = 0;
                    for (var i = 0; i < rows.length; i++) {
                        tonnage = tonnage + parseInt(rows[i].SCRQUAN);
                    }
                }

                if (tonnage > 0 && scrapQuantity) {
                    tonnage = tonnage + parseInt(scrapQuantity);
                }

                var plant = this.appData.plant;
                if (plant == "2001") {
                    if (parseInt(tonnage) > 165000) {
                        sap.m.MessageBox.error("Tonaj Aşıldı. (" + tonnage + " kg)");
                        result == false;
                        return;
                    }
                } else if (plant == "3001") {
                    if (parseInt(tonnage) > 120000) {
                        sap.m.MessageBox.error("Tonaj Aşıldı. (" + tonnage + " kg)");
                        result == false;
                        return;
                    }
                }
                return result;
            },

            /*
                        saveScrapTransitions: function (buttonText) {
                            var errorBoolean = false;
                            var statuscode = (this.screenObj.statusSelect).substr(1, 3);
              
                            if (statuscode = 10) {
                                var totalQuantity = this.getView().byId("sumAllForQuantity").getValue();
                            }
                            else {
                                var totalQuantity = this.getView().byId("sumAllScrQuantity").getValue();
                            }
              
                            var plant = this.appData.plant;
                            if (plant == "2001") {
                                if (parseInt(totalQuantity) > 165000) errorBoolean = true;
                            } else if (plant == "3001") {
                                if (parseInt(totalQuantity) > 120000) errorBoolean = true;
                            }
              
                            if (errorBoolean) {
                                MessageBox.error("Tonaj aşıldı!");
                                return;
                            }
              
                            var errorStatus = this.tableControleZero();
              
                            if (errorStatus) {
                                MessageBox.error("Girilen değerleri kontrol ediniz!");
                                return;
                            }
              
                            BusyIndicator.show(iDelay);
                            if (iDuration && iDuration > 0) {
                                if (this._sTimeoutId) {
                                    clearTimeout(this._sTimeoutId);
                                    this._sTimeoutId = null;
                                }
              
                                this._sTimeoutId = setTimeout(function () {
                                    this.updateScrapOrder(buttonText);
                                    this.hideBusyIndicator();
                                }.bind(this), iDuration);
                            }
                        },
              
                        callUpdateScrapOrder: function (p_this, p_data) {
                            sap.m.MessageToast.show(
                                p_this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
                            );
                            var statusCodeKey = p_this.getView().byId("statusSelect").getSelectedKey();
                            p_this.getMasterDetailList(statusCodeKey);
                            p_this.clearScreen();
                            p_this.setVisibleFalsePanel();
                            p_this.getAllCharge();
                        },
                        */

            calculateSumQuantity: function (rows) {
                var sumQuantityTeoID = this.getView().byId("sumQuantityTeo");
                var sumQuantityTeo = 0;
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].TEOQUAN == "") rows[i].TEOQUAN = 0;
                    sumQuantityTeo = sumQuantityTeo + parseInt(rows[i].TEOQUAN);
                }
                sumQuantityTeoID.setValue(sumQuantityTeo);

                var sumQuantityForID = this.getView().byId("sumQuantityFor");
                var sumQuantityFor = 0;
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].FORQUAN == "") rows[i].FORQUAN = 0;
                    sumQuantityFor = sumQuantityFor + parseInt(rows[i].FORQUAN);
                }
                sumQuantityForID.setValue(sumQuantityFor);

                var sumQuantityScrID = this.getView().byId("sumQuantityScr");
                var sumQuantityScr = 0;
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].SCRQUAN == "") rows[i].SCRQUAN = 0;
                    sumQuantityScr = sumQuantityScr + parseInt(rows[i].SCRQUAN);
                }
                sumQuantityScrID.setValue(sumQuantityScr);
            },

            changeSumQuantity: function (oEvent) {
                var changeQuantity = oEvent.getSource().getValue();

                if (parseInt(changeQuantity) < 0) {
                    sap.m.MessageToast.show("Negatif değer girilemez!");
                    oEvent.getSource().setValue(0);
                    return;
                }

                if (changeQuantity == "") changeQuantity = 0;
                var rows = this.getView().getModel("castDetailModel").oData.Row;
                var selectedRow = oEvent.getSource().getParent().oBindingContexts.castDetailModel.sPath.split("/Row/")[1];
                if (oEvent.getSource().getTooltip() == "teoQuan") {
                    rows[selectedRow].TEOQUAN = parseInt(changeQuantity);
                    this.calculateSumQuantity(rows);
                } else if (oEvent.getSource().getTooltip() == "forQuan") {
                    rows[selectedRow].FORQUAN = parseInt(changeQuantity);
                    this.calculateSumQuantity(rows);
                } else if (oEvent.getSource().getTooltip() == "scrQuan") {
                    rows[selectedRow].SCRQUAN = parseInt(changeQuantity);
                    this.calculateSumQuantity(rows);
                } else if (oEvent.getSource().getTooltip() == "cumQuan") {
                    rows[selectedRow].SCRQUAN = parseInt(changeQuantity);
                    this.calculateSumQuantity(rows);
                }
            },

            calculateSumQuantity: function (rows) {
                var sumQuantityTeoID = this.getView().byId("sumQuantityTeo");
                var sumQuantityTeo = 0;
                var dividedNumber
                var dividedNumber1
                var dividedNumber2
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].TEOQUAN == "") rows[i].TEOQUAN = 0;
                    sumQuantityTeo = sumQuantityTeo + parseInt(rows[i].TEOQUAN);
                }
                dividedNumber = sumQuantityTeo.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1' + ".");
                sumQuantityTeoID.setValue(dividedNumber);

                var sumQuantityForID = this.getView().byId("sumQuantityFor");
                var sumQuantityFor = 0;
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].FORQUAN == "") rows[i].FORQUAN = 0;
                    sumQuantityFor = sumQuantityFor + parseInt(rows[i].FORQUAN);
                }
                dividedNumber1 = sumQuantityFor.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1' + ".");
                sumQuantityForID.setValue(dividedNumber1);

                var sumQuantityScrID = this.getView().byId("sumQuantityScr");
                var sumQuantityScr = 0;
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].SCRQUAN == "") rows[i].SCRQUAN = 0;
                    sumQuantityScr = sumQuantityScr + parseInt(rows[i].SCRQUAN);
                }
                dividedNumber2 = sumQuantityScr.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1' + ".");
                sumQuantityScrID.setValue(dividedNumber2);
            },

            openChargeEditDialog: function (oEvent) {
                if (this.getView().byId("masterList").getSelectedItems().length < 1) {
                    sap.m.MessageToast.show(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_PLEASECHOOSE")
                    );
                    return;
                }
                var oView = this.getView();
                var oDialog = oView.byId("scrapChargeEdit");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.scrapChargeEdit",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                oDialog.open();
                this.appData.oDialog = oDialog;
                //this.getCastNoArcOven();
                this.getCastNoList();
                this.getChargeNoList();
            },
            /*
                                    callCastNoArcOven: function (p_this, p_data) {
                                        var oModel = new sap.ui.model.json.JSONModel();
                                        oModel.setData(p_data.Rowsets.Rowset[0].Row);
                                        p_this.getView().setModel(oModel, "arcOvenData");
                                    },
                        
                                    getCastNoArcOven: function () {
                                        var plant = this.appData.plant;
                                        var params = { "Param.1": plant };
                                        var tRunner = new TransactionRunner(
                                            "MES/UI/ScrapOrder/getCastNoArcOvenQry",
                                            params
                                        );
                                        tRunner.ExecuteQueryAsync(this, this.callCastNoArcOven);
                                    },
                                    */
            calculateCumulative: function (oEvent) {
                var Tare = 0;
                var prevValue = parseInt(Tare);
                var lastValue = 0;

                var _model = this.getView().getModel("castDetailModel");
                if (_model == undefined) return;

                var _table = this.getView().byId("idCastTable").getItems();
                for (var i = 0; i < _table.length; i++) {
                    //Tablonun son kolonu Kümülatif Input alanı olacak şekilde ayarlandı.
                    //Tablonun sonuna yeni kolon eklenirse [] içindeki bölüm değiştirilmeli. @ubaltas
                    lastValue = parseInt(
                        _table[i].getCells()[_table[i].getCells().length - 1].getValue()
                    );
                    if (lastValue != "" && lastValue >= prevValue) {
                        _model.oData.Row[i].SCRQUAN = lastValue - prevValue;
                    } else {
                        _model.oData.Row[i].SCRQUAN = 0;
                    }
                    prevValue = lastValue;
                }

                _model.refresh();

                var oData = this.getView().getModel("castDetailModel").oData;
                this.calculateSumQuantity(oData.Row);
            },

            onPressChargeEdit: function (oEvent) {
                //var plant = this.appData.plant;
                var list = this.getView().byId("masterList");
                var selectedIndex = list._aSelectedPaths[0].split("/")[2];
                var rows = this.getView().getModel("masterDetailList").oData.Row;
                var rowInformation = rows[selectedIndex];
                var editCastSelect = this.getView().byId("editCastSelect");
                var newCastID = editCastSelect.getSelectedKey();
                var editCastNoList = this.getView().byId("editCastNoList");
                var newChargeNo = editCastNoList.getSelectedKey();
                //var newChargeNo = editCastSelect.getSelectedItem().getAdditionalText();
                //var userID = this.appData.user.userID;

                var copperRate = this.getCopperRate(newCastID, newChargeNo);

                if (rowInformation.COPPER_RATE != copperRate) {
                    MessageBox.warning(
                        this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("OEE_LABEL_DIFF_COPPER_RATE"),
                        {
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (oAction) {
                                if (oAction == "YES") {
                                    this.getScrapChargeEdit();
                                } else {
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                } else {
                    this.getScrapChargeEdit();
                }
            },

            callChargeEdit: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.handleCancel();
                p_this.getMasterDetailList(p_this.screenObj.statusSelect);
                p_this.clearScreen();
                p_this.getSelectMasterCastID();
            },

            getScrapChargeEdit: function () {
                var plant = this.appData.plant;
                var list = this.getView().byId("masterList");
                var selectedIndex = list._aSelectedPaths[0].split("/")[2];
                var rows = this.getView().getModel("masterDetailList").oData.Row;
                var rowInformation = rows[selectedIndex];
                var editCastSelect = this.getView().byId("editCastSelect");
                var newCastID = editCastSelect.getSelectedKey();
                var editCastNoList = this.getView().byId("editCastNoList");
                var newChargeNo = editCastNoList.getSelectedKey();
                //var newChargeNo = editCastSelect.getSelectedItem().getAdditionalText();
                var userID = this.appData.user.userID;

                var plant = this.appData.plant;
                var params = {
                    I_PLANT: plant,
                    I_SCRORDID: rowInformation.SCRORDID,
                    I_CASTID: rowInformation.CASTID,
                    I_CHARGE_NO: rowInformation.CHARGE_NO,
                    I_BASKET_NO: rowInformation.BASKET_NO,
                    I_COPPER_RATE: rowInformation.COPPER_RATE,
                    I_NEWCASTID: newCastID,
                    I_NEWCHARGE_NO: newChargeNo,
                    I_USER: userID,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Operations/updateScrapChargeEditXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callChargeEdit);
            },

            callScrapPreheatingDetail: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "ScrapPreheatingDetail");

                p_this.screenObj.temp_BeginTime =
                    p_data.Rowsets.Rowset[0].Row[0].TEMP_BEGINTIME;
                /*
                                        var tempBeginTime = p_data.Rowsets.Rowset[0].Row[0].TEMP_BEGINTIME;
                                        var idDatePicker = p_this.byId("DTP1");
                                        idDatePicker.setDateValue(tempBeginTime);
                                     
                                        */
            },

            getScrapPreheatingDetail: function (scrordid) {
                var params = { "Param.1": scrordid };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapPreheatingDetailQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapPreheatingDetail);
                /*
                                if (!tRunner.Execute()) {
                                    MessageBox.error(tRunner.GetErrorMessage());
                                    return null;
                                }
                                var oData = tRunner.GetJSONData();
                                var oModel = new sap.ui.model.json.JSONModel();
                                if (oData[0].Row == undefined) oData[0].Row = [];
                                oModel.setData(oData[0]);
                                this.getView().setModel(oModel, "ScrapPreheatingDetail");
                  
                                this.screenObj.temp_BeginTime = oData[0].Row[0].TEMP_BEGINTIME;
                                //return oData[0].Row[0].TEMP_BEGINTIME;
                                */
            },

            callSavePreheating: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.getScrapPreheatingDetail(p_this.screenObj.scrordid);
                p_this.getAllCharge();
                p_this.getMasterDetailList(p_this.screenObj.statusSelect);
            },

            onPressSavePreheating: function (oEvent) {
                //this.getView().byId("selectStation").setSelectedIndex(0);

                var plant = this.appData.plant;
                var oTable = this.getView().getModel("ScrapPreheatingDetail").oData[0];
                var station = oTable.TEMP_STATION;
                var tempBegin = oTable.TEMP_BEGIN;
                var userID = this.appData.user.userID;
                var statusCode = this.screenObj.statusSelect;
                var statusDesc = oEvent.getSource().mProperties.text;
                //var selectStation = this.getView().byId("selectStation").getSelectedKey();
                var params = {
                    I_PLANT: plant,
                    I_SCRORDID: oTable.SCRORDID,
                    I_STATION: station,
                    I_TEMP_BEGIN: tempBegin,
                    I_TEMP_BEGINTIME: oTable.TEMP_BEGINTIME,
                    I_TEMP_END: oTable.TEMP_END,
                    I_TEMP_ENDTIME: oTable.TEMP_ENDTIME,
                    I_USER: userID,
                    I_STATUSCODE: statusCode,
                    I_STATUSDESC: statusDesc,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Operations/updatePreheatingXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callSavePreheating);
            },

            callUpdatePreheatingBegin: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.getScrapPreheatingDetail(p_this.screenObj.scrordid);
                p_this.getAllCharge();
            },

            updatePreheatingBegin: function (oEvent) {
                var plant = this.appData.plant;
                var oTable = this.getView().getModel("ScrapPreheatingDetail").oData[0];
                var station = oTable.TEMP_STATION;
                var tempBegin = oTable.TEMP_BEGIN;
                var userID = this.appData.user.userID;
                var statusCode = this.screenObj.statusSelect;
                var statusDesc = oEvent.getSource().mProperties.text;
                var selectStation = this.getView()
                    .byId("selectStation")
                    .getSelectedKey();
                var params = {
                    I_PLANT: plant,
                    I_SCRORDID: oTable.SCRORDID,
                    I_STATION: station,
                    I_TEMP_BEGIN: tempBegin,
                    I_USER: userID,
                    I_STATUSCODE: statusCode,
                    I_STATUSDESC: statusDesc,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Operations/updatePreheatingBeginXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdatePreheatingBegin);
            },

            onChangeScrapType: function (oEvent) {
                var selectMaster;
                var rowItem;
                var oModel = new sap.ui.model.json.JSONModel();
                var selectValue = oEvent.getSource().getSelectedKey();
                var oData = this.getView().getModel("castDetailModel").oData;

                var plant = this.appData.plant;
                var table = this.getView().byId("idCastTable");
                var selectedRow = oEvent.getSource().getParent().oBindingContexts.castDetailModel.sPath.split("/Row/")[1];
                var spath = this.getView().byId("masterList")._aSelectedPaths[0];
                if (!spath) {
                    var oView = this.getView();
                    rowItem = {};
                    rowItem.CHARGE_NO = oView.byId("chargeNoSelect").getSelectedKey();
                    rowItem.CHARGE_GROUP = oView
                        .byId("chargeGroupSelect")
                        .getSelectedKey();
                    rowItem.LOCATION_GROUP = oView
                        .byId("locationGroupSelect")
                        .getSelectedKey();
                    rowItem.COPPER_RATE = this.screenObj.copperRate;
                } else {
                    selectMaster = spath.split("/Row/")[1];
                    //rowItem = this.screenObj.masterDetailList.Row[selectMaster];
                    //rowItem = oData.Row[selectMaster];
                    rowItem = oData.Row[selectedRow];
                }
                /*
                                              for (var i = 0; i < oData.Row.length; i++) {
                                                  if (oData.Row[i].SCRORDID != rowItem.SCRORDID) {
                                                      if (oData.Row[i].JARGON == selectValue) {
                                                          oData.Row[i].JARGON = oData.Row[i].setSelectedKey(selectValue);
                                                          sap.m.MessageToast.show(
                                                              this.getView().getModel("i18n").getResourceBundle().getText("OEE_ERROR_SAME_JARGON")
                                                          );
                                                          return;
                                                      }
                                                  }
                                              }
                                              */
                var params = {
                    "Param.1": this.appData.plant,
                    "Param.2": selectValue,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getChangeScrapTypeQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var jsData = tRunner.GetJSONData();
                if (jsData[0].Row.length > 0) {
                    if (jsData[0].Row[0].MATNR != oData.Row[selectedRow].MATNR) {
                        oData.Row[selectedRow].MATNR = jsData[0].Row[0].MATNR;
                        oData.Row[selectedRow].TEOQUAN = 0;
                    }
                }

                if (rowItem.SCRORDID) {
                    var params = {
                        "Param.1": rowItem.SCRORDID,
                        "Param.2": rowItem.LAYER,
                        "Param.3": rowItem.JARGON,
                    };
                    var tRunner2 = new TransactionRunner(
                        "MES/UI/ScrapOrder/getChangeScrapQuanQry",
                        params
                    );
                    if (!tRunner2.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    var jsData2 = tRunner2.GetJSONData();
                    if (jsData2[0].Row != undefined) {
                        //oData.Row[selectedRow].FORQUAN = jsData2[0].Row[0].FORQUAN;
                        oData.Row[selectedRow].SCRQUAN = jsData2[0].Row[0].SCRQUAN;
                        oData.Row[selectedRow].CUMQUAN = jsData2[0].Row[0].CUMQUAN;
                    } else {
                        //oData.Row[selectedRow].FORQUAN = 0;
                        oData.Row[selectedRow].SCRQUAN = 0;
                        oData.Row[selectedRow].CUMQUAN = 0;
                    }

                    var oTable = this.getView().getModel("scrapHeadModel").oData.Row[0];

                    var params = {
                        "Param.1": plant,
                        "Param.2": oData.Row[selectedRow].MATNR,
                        "Param.3": oTable.CHARGE_NO,
                        "Param.4": oTable.CHARGE_GROUP,
                        "Param.5": oTable.LOCATION_GROUP,
                        "Param.6": oTable.COPPER_RATE,
                        "Param.7": oData.Row[selectedRow].LAYER,
                    };

                    var tRunner1 = new TransactionRunner(
                        "MES/UI/ScrapOrder/getNewQuantityQry",
                        params
                    );
                    if (!tRunner1.Execute()) {
                        MessageBox.error(tRunner1.GetErrorMessage());
                        return null;
                    }
                    var jsData1 = tRunner1.GetJSONData();
                    if (jsData1[0].Row != undefined)
                        oData.Row[selectedRow].TEOQUAN = jsData1[0].Row[0].TEOQUAN;

                    var data = this.orderByDescLayer(oData);
                    oModel.setData(data);
                    this.getView().setModel(oModel, "castDetailModel");
                    // this.calculateSumQuantity(oData.Row);
                } else {
                    oData.Row[selectedRow].TEOQUAN = 0;
                    oData.Row[selectedRow].FORQUAN = 0;
                    oData.Row[selectedRow].SCRQUAN = 0;
                    oData.Row[selectedRow].CUMQUAN = 0;
                }

                oEvent.getSource().setValue(oEvent.getSource().getSelectedKey());
            },

            saveScrapComp: function (oEvent) {
                var buttonText = oEvent.getSource().mProperties.text;
                sap.m.MessageBox.warning(
                    this.getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_TRANSACTION_ACCEPT"),
                    {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction == "YES") {
                                this.sendSaveScrapComp(buttonText);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },

            callsendSaveScrapComp: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                var statusCodeKey = p_this
                    .getView()
                    .byId("statusSelect")
                    .getSelectedKey();
                p_this.getMasterDetailList(statusCodeKey);
                p_this.clearScreen();
            },

            sendSaveScrapComp: function (buttonText) {
                BusyIndicator.show(iDelay);
                if (iDuration && iDuration > 0) {
                    if (this._sTimeoutId) {
                        clearTimeout(this._sTimeoutId);
                        this._sTimeoutId = null;
                    }

                    this._sTimeoutId = setTimeout(
                        function () {
                            this.updateScrapOrder(buttonText);
                            this.hideBusyIndicator();
                        }.bind(this),
                        iDuration
                    );
                }
            },

            getPreheatingDetails: function () {
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getPreheatingStationsQry"
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "ScrapPreheatTable");
            },

            callupdatePreheatingEnd: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.getScrapPreheatingDetail(p_this.screenObj.scrordid);
                p_this.getAllCharge();
            },

            updatePreheatingEnd: function (oEvent) {
                var plant = this.appData.plant;
                var oTable = this.getView().getModel("ScrapPreheatingDetail").oData[0];
                var station = oTable.TEMP_STATION;
                var tempBegin = oTable.TEMP_BEGIN;
                var tempEnd = oTable.TEMP_END;
                var userID = this.appData.user.userID;
                var statusCode = this.screenObj.statusSelect;
                var statusDesc = oEvent.getSource().mProperties.text;
                var selectStation = this.getView()
                    .byId("selectStation")
                    .getSelectedKey();
                var params = {
                    I_PLANT: plant,
                    I_SCRORDID: oTable.SCRORDID,
                    I_STATION: station,
                    //  I_TEMP_BEGIN: tempBegin,
                    I_TEMP_END: tempEnd,
                    I_USER: userID,
                    I_STATUSCODE: statusCode,
                    I_STATUSDESC: statusDesc,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Operations/updatePreheatingEndXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callupdatePreheatingEnd);
            },

            callGetBeginTemp: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.getScrapPreheatingDetail(p_this.screenObj.scrordid);
                p_this.getAllCharge();
            },

            onPressBeginTemp: function (oEvent) {
                var plant = this.appData.plant;
                var oTable = this.getView().getModel("ScrapPreheatingDetail").oData[0];
                var station = oTable.TEMP_STATION;
                var userID = this.appData.user.userID;
                var statusCode = this.screenObj.statusSelect;
                var params = {
                    I_PLANT: plant,
                    I_SCRORDID: oTable.SCRORDID,
                    I_STATION: station,
                    I_USER: userID,
                    I_STATUSCODE: statusCode,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Operations/getBeginTempXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callGetBeginTemp);
            },

            callGetEndTemp: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this
                        .getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("OEE_LABEL_SUCCESS")
                );
                p_this.getScrapPreheatingDetail(p_this.screenObj.scrordid);
                p_this.getAllCharge();
            },

            onPressEndTemp: function (oEvent) {
                var plant = this.appData.plant;
                var oTable = this.getView().getModel("ScrapPreheatingDetail").oData[0];

                var tempBeginTime = oTable.TEMP_BEGINTIME;

                if (tempBeginTime == " ") {
                    MessageBox.error("Ön ısıtma başlatılmadan bitirilemez.");
                    return;
                }

                var station = oTable.TEMP_STATION;
                var userID = this.appData.user.userID;
                var statusCode = this.screenObj.statusSelect;
                var params = {
                    I_PLANT: plant,
                    I_SCRORDID: oTable.SCRORDID,
                    I_STATION: station,
                    I_USER: userID,
                    I_STATUSCODE: statusCode,
                };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Operations/getEndTempXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callGetEndTemp);
            },

            onPressFormenReport: function (oEvent) {
                var origin = window.location.origin;
                var pathname = window.location.pathname;
                var navToPage = "#/activity/ZACT_SCR_PRE_REP_SCR";
                window.location.href = origin + pathname + navToPage;
            },

            callChargesList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                var oData = null;
                if (p_data.Rowsets.Rowset[0].Row == undefined) {
                    oModel.setData(oData);
                    p_this.getView().setModel(oModel, "tableCharges");
                    return null;
                }
                var jsData = p_data.Rowsets.Rowset[0].Row;

                var chargeJSON = [{}, {}, {}, {}, {}];
                for (var i = 0; i < jsData.length; i++) {
                    var chargeType = jsData[i].CHARGE_NO;
                    chargeJSON[Number(chargeType) - 1][
                        Object.keys(chargeJSON[Number(chargeType) - 1]).length
                    ] = jsData[i];
                }
                for (var i = 0; i < chargeJSON.length; i++) {
                    var tableName = "cell-";
                    var table = tableName + i;

                    // if(chargeJSON[i][0] == undefined)
                    if (Object.keys(chargeJSON[i]).length == 0) {
                        p_this.getView().byId(table).setVisible(false);
                    } else {
                        p_this.getView().byId(table).setVisible(true);
                    }
                }

                oModel.setData(chargeJSON);
                p_this.getView().setModel(oModel, "tableCharges");
            },

            getAllCharge: function () {
                var oTable = this.getView().getModel("scrapHeadModel");

                var multiComboBoxVisible = this.getView()
                    .byId("multiComboboxCastNo")
                    .getVisible();

                if (!oTable || multiComboBoxVisible) {
                    var castNo = this.getView()
                        .byId("multiComboboxCastNo")
                        .getSelectedKeys()[0];
                    if (castNo) {
                        var copperRate = this.getView()
                            .byId("multiComboboxCastNo")
                            .getSelectedItems()[0].mProperties.additionalText;
                    } else {
                        var copperRate = undefined;
                    }
                    var chargeGroup = this.getView()
                        .byId("chargeGroupSelect")
                        .getSelectedKey();
                    var locationGroup = this.getView()
                        .byId("locationGroupSelect")
                        .getSelectedKey();
                    //var chargeNo = this.getView().byId("chargeNoSelect").getSelectedKey();
                } else {
                    var tableObj = oTable.oData.Row[0];
                    var castNo = tableObj.CASTID;
                    var chargeGroup = tableObj.CHARGE_GROUP;
                    var locationGroup = tableObj.LOCATION_GROUP;
                    var copperRate = tableObj.COPPER_RATE;
                }

                var plant = this.appData.plant;

                var orderBy;
                if (plant == 2001) orderBy = "DESC";
                else orderBy = "ASC";

                var params = {
                    "Param.1": plant,
                    "Param.2": castNo,
                    "Param.3": chargeGroup,
                    "Param.4": locationGroup,
                    "Param.5": copperRate,
                    "Param.6": orderBy,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getScrapReportQry",
                    params
                );

                tRunner.ExecuteQueryAsync(this, this.callChargesList);
            },
            /*
            
                        tableControleZero: function () {
                            var errorStatus = false;
                            var oData = this.getView().getModel("castDetailModel");
            
                            if (!oData)
                                errorStatus = true;
            
                            var rows = oData.Row;
            
                            if (this.screenObj.statusSelect == 10) {
                                for (var i = 0; i < rows.length; i++) {
                                    if (rows[i].FORQUAN == "" || rows[i].FORQUAN == "0")
                                        errorStatus = true;
                                }
                            }
                            if (this.screenObj.statusSelect == 20) {
                                for (var i = 0; i < rows.length; i++) {
                                    if (rows[i].SCRQUAN == "" || rows[i].SCRQUAN == "0")
                                        errorStatus = true;
                                }
                            }
            
                            return errorStatus;
                        },
            */
            TableControlZero: function (tblModel) {
                var result = true;
                var oModel = this.getView().getModel(tblModel);

                if (!oModel) result = false;

                var oData = oModel.oData;
                var rows = oData.Row;

                var statuscode = this.screenObj.statusSelect.substr(1, 2);
                if (statuscode == 10) {
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].FORQUAN == "" || rows[i].FORQUAN == "0") {
                            sap.m.MessageBox.error(
                                rows[i].LAYER + " nolu tabakanın operatör miktarı sıfır olamaz."
                            );
                            result = false;
                            return;
                        }
                    }
                }
                if (statuscode == 20) {
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].SCRQUAN == "" || rows[i].SCRQUAN == "0") {
                            sap.m.MessageBox.error(
                                rows[i].LAYER + " nolu tabakanın operatör miktarı sıfır olamaz."
                            );
                            result = false;
                            return;
                        }
                    }
                }

                return result;
            },

            callsetChargeGroup: function (p_this, p_data) {
                var chargeGroupSelect = p_this.getView().byId("chargeGroupSelect");
                if (p_data.Rowsets.Rowset[0].Row == undefined) {
                    chargeGroupSelect.setEnabled(true);
                    return;
                }
                var charge_group = p_data.Rowsets.Rowset[0].Row[0].CHARGE_GROUP;
                chargeGroupSelect.setValue(charge_group);
                chargeGroupSelect.setSelectedKey(charge_group);
                chargeGroupSelect.setEnabled(false);
            },

            setChargeGroup: function (castID) {
                var plant = this.appData.plant;

                var params = { "Param.1": plant, "Param.2": castID };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getCastChargeGroupQry",
                    params
                );

                //tRunner.ExecuteQueryAsync(this, this.callsetChargeGroup);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();

                //var oModel = new sap.ui.model.json.JSONModel();
                //oModel.setData(oData[0]);
                //this.getView().setModel(oModel, "chargeGroupList");
                //return oData[0].Row[0].CHARGE_GROUP;

                var chargeGroupSelect = this.getView().byId("chargeGroupSelect");
                if (oData[0].Row == undefined) {
                    chargeGroupSelect.setEnabled(true);
                    return;
                }

                var charge_group = oData[0].Row[0].CHARGE_GROUP;
                chargeGroupSelect.setValue(charge_group);
                chargeGroupSelect.setSelectedKey(charge_group);
                chargeGroupSelect.setEnabled(false);
            },

            setLocationGroup: function (castID) {
                var plant = this.appData.plant;

                var params = { "Param.1": plant, "Param.2": castID };

                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getCastLocationGroupQry",
                    params
                );

                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();

                var locationGroupSelect = this.getView().byId("locationGroupSelect");
                if (oData[0].Row == undefined) {
                    locationGroupSelect.setEnabled(true);
                    return;
                }

                var location_group = oData[0].Row[0].LOCATION_GROUP;
                locationGroupSelect.setValue(location_group);
                locationGroupSelect.setSelectedKey(location_group);
                locationGroupSelect.setEnabled(false);
            },

            /*
                                    callCastChargeNoList: function (p_this, p_data) {
                                        var oModel = new sap.ui.model.json.JSONModel();
                                        if (p_data.Rowsets.Rowset[0].Row == undefined) return;
                                        oModel.setData(p_data.Rowsets.Rowset[0]);
                                        p_this.getView().setModel(oModel, "chargeNoList");
                                    },
                                    */
            getCastChargeNoList: function (charges) {
                var plant = this.appData.plant;
                var params = { "Param.1": plant, "Param.2": charges };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getCastChargeNoListQry",
                    params
                );
                //tRunner.ExecuteQueryAsync(this, this.callCastChargeNoList);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "chargeNoList");
                if (oData[0].Row) {
                    return oData[0].Row[0].ATWRT;
                }
            },

            onPressShowHide: function (oEvent) {
                var oSplitContainer = this.getView().byId("workListSplit");
                oSplitContainer.setMode(sap.m.SplitAppMode.PopoverMode);
                if (oSplitContainer.isMasterShown()) {
                    oSplitContainer.setMode(sap.m.SplitAppMode.HideMode);
                }
            },

            orderByDescLayer(data) {
                var orderedArr = [];
                if (this.appData.plant == "2001") {
                    for (var i = 0; i < data.Row.length; i++) {
                        if (orderedArr.length == 0) orderedArr.push(data.Row[i]);
                        else if (orderedArr[0].LAYER > data.Row[i].LAYER)
                            orderedArr.push(data.Row[i]);
                        else orderedArr.unshift(data.Row[i]);
                    }
                    data.Row = orderedArr;
                }
                return data;
            },

            getCastNoSeqControl: function () {
                var params = {
                    I_SCRORDID: this.screenObj.scrordid,
                    I_SCRWFLWID: this.screenObj.workFlowId,
                    I_PLANT: this.appData.plant,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/Transitions/getCastNoSeqXquery",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                return oData[0].Row[0].O_IS_VAL;
            },

            getCopperRate: function (newCastID, newChargeNo) {
                var plant = this.appData.plant;

                var params = {
                    "Param.1": plant,
                    "Param.2": newCastID,
                    "Param.3": newChargeNo,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getCopperRateQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                return oData[0].Row[0].COPPER_RATE;

            },

            getValidations: function () {
                var workFlowId = this.screenObj.workFlowId;
                if (!workFlowId) {
                    return "T";
                } else {
                    var params = {
                        "Param.1": this.screenObj.workFlowId,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/ScrapOrder/Transitions/getValidationsQry",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                    var oData = tRunner.GetJSONData();
                    return oData[0].Row[0].IS_VAL;
                }
            },

            getCopperRateChange: function () {
                var params = {
                    "Param.1": this.screenObj.scrordid,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getCopperRateChangeQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                //return oData[0].Row[0].IS_COPPER_RATE_CHANGE;
                return oData[0].Row[0];
            },

            getBulk: function () {
                var plant = this.appData.plant;
                var statuscode = this.screenObj.statusSelect;
                var description = this.screenObj.buttonText;
                var params = {
                    "Param.1": plant,
                    "Param.2": statuscode,
                    "Param.3": description,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getBulkQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                return oData[0].Row[0].BULK;

            },


            getControlChargeNo: function () {
                var params = {
                    I_PLANT: this.appData.plant,
                    I_CASTID: this.screenObj.castNo,
                    I_CHARGE_NO: this.screenObj.chargeNo,
                    I_STATUSCODE: this.screenObj.statusSelect,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ScrapOrder/getControlChargeNoXqry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                return oData[0].Row[0].O_IS_VAL;
            },


        });
    }
);
