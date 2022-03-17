sap.ui.define(
	[
	  "sap/ui/core/mvc/Controller",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageBox",
	  "customActivity/scripts/custom",
	  "../model/formatter",
	  "sap/ui/model/Filter",
	  "sap/ui/model/FilterOperator",
	  "sap/ui/model/FilterType"
	],
  
	function(
	  Controller,
	  JSONModel,
	  MessageBox,
	  customScripts,
	  formatter,
	  Filter,
	  FilterOperator,
	  FilterType
	) {
	  // "use strict";
	  return Controller.extend("customActivity.controller.oeeReportPacking", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 */
  
		formatter: formatter,
  
onInit: function() {
		  this.appComponent = this.getView().getViewData().appComponent;
		  this.appData = this.appComponent.getAppGlobalData();
		  this.interfaces = this.appComponent.getODataInterface();
		  this.getPackingColumns();
		  // this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE");
  
		  this.appComponent
			.getEventBus()
			.subscribe(
			  this.appComponent.getId(),
			  "orderChanged",
			  this.refreshReported,
			  this
			);
		  this.bindDataToCard();
		  if (!this.appData.anyOrderRunningInShift()) {
			// Do not proceed if not.
			return;
		  }
		  this.getPackingDetails();
		  this.modelServices();
		  this.setVisibleForReWriteButton();
		},
  
onSearch: function(oEvent) {
		  var aFilters = [];
		  var sQuery = oEvent.getSource().getValue();
		  if (sQuery && sQuery.length > 0) {
			aFilters = [
			  new Filter(
				[
				  new Filter("AUFNR", FilterOperator.Contains, sQuery),
				  new Filter("HUNUMBER", FilterOperator.Contains, sQuery)
				],
				false
			  )
			];
		  }
  
		  // update list binding
		  var oList = this.byId("confirmTable");
		  var oBinding = oList.getBinding("items");
		  oBinding.filter(aFilters, FilterType.Applications);
		},
  
		bindDataToCard: function() {
		  sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent, this);
		  sap.oee.ui.Utils.attachChangeOrderDetails(this.appComponent,"orderCardFragment",this);
		},
  
getPackingColumns: function() {
		  var nodeID = this.appData.node.nodeID;
		  var params = { "Param.1": nodeID };
		  var tRunner = new TransactionRunner(
			"MES/ReportPacking/getPackingColumnsXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		  }
		  var oData = tRunner.GetJSONData();
		  var oModel = new sap.ui.model.json.JSONModel();
		  oModel.setData(oData[0].Row[0]);
		  this.getView().setModel(oModel, "ColumnVisibleModel");
		},
  
getPackingDetails: function() {  
		  var orderNo = this.appData.selected.order.orderNo;
		  var params = { "Param.1": orderNo };
		  var tRunner = new TransactionRunner(
			"MES/ReportPacking/getPackingXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		  }
		  var oData = tRunner.GetJSONData();
		  var oModel = new sap.ui.model.json.JSONModel();
		  oModel.setData(oData);
		   if(this.byId("confirmTable") != undefined)
			this.byId("confirmTable").setModel(oModel);

		},
  
setVisibleForReWriteButton: function() {
		  var options = this.getActivityOptionValues("reprint");
		  var oModel = new JSONModel();
		  var oData;
		  var userOpt = options.find(
			x => x.optionValue == this.appData.user.userID
		  );
		  if (userOpt) oData = { ISPERMITTED: 1 };
		  else oData = { ISPERMITTED: 0 };
  
		  // oData = {ISPERMITTED: 1};
		  oModel.setData(oData);
		  this.getView().setModel(oModel, "viewModel");
		},
  
getActivityOptionValues: function(obj) {
		  if (
			this.getView().getViewData().viewOptions &&
			this.getView().getViewData().viewOptions.length > 0
		  ) {
			for (
			  var i = 0;
			  i < this.getView().getViewData().viewOptions.length;
			  i++
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
  
onClickAddQuantity: function() {
		  var oView = this.getView();
		  var oDialog = oView.byId("addConfirmDialog");
		  // create dialog lazily
		  if (!oDialog) {
			// create dialog via fragment factory
			oDialog = sap.ui.xmlfragment(
			  oView.getId(),
			  "customActivity.fragmentView.addConfirmDialog",
			  this
			);
			// connect dialog to view (models, lifecycle)
			oView.addDependent(oDialog);
		  }
  
		  oDialog.open();
		  // this.byId("inputBarcode").setValue("");
		},
  
handleAddConfirm: function(oEvent) {
		  // var huID = this.byId("inputHUID").getValue();
		  // var location = this.byId("inputLocation").getValue();
		  var location = this.byId("inputLocation")
			.getSelectedItem()
			.getKey();
		  var quantity1 = this.byId("inputQuantity1").getValue();
		  var quantity2 = this.byId("inputQuantity2").getValue();
		  var quantity3 = this.byId("inputQuantity3").getValue();
		  var quantity4 = this.byId("inputQuantity4").getValue();
		  var quantity5 = this.byId("inputQuantity5").getValue();
		  var inputScrap = this.byId("inputScrap").getValue();
		  // var huNo = this.byId("inputHuNo").getValue();
		  var aufnr = this.appData.selected.order.orderNo;
  
		  var params = {
			"Param.2": location,
			"Param.3": quantity1,
			"Param.4": quantity2,
			"Param.5": quantity3,
			"Param.6": quantity4,
			"Param.7": aufnr,
			"Param.8": inputScrap,
			"Param.9": quantity5
		  };
  
		  var tRunner = new TransactionRunner(
			"MES/ReportPacking/insertConfirmXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		  }
		  var oMsg = tRunner.GetMessage();
		  // MessageBox.success(oMsg);
		  sap.oee.ui.Utils.toast(oMsg);
		  this.getPackingDetails();
		  this.handleCancel(oEvent);
		},
  
handleCancel: function(oEvent) {
		  this.clearDialogInputs();
		  oEvent.oSource.getParent().close();
		},
  
		///////////
  
onClickEditQuantity: function(oEvent) {
		  var oView = this.getView();
		  var data = oEvent
			.getSource()
			.getBindingContext()
			.getObject();
		  var oModel = new JSONModel();
		  oModel.setData(data);
		  this.getView().setModel(oModel, "editRow");
		  var oDialog = oView.byId("addConfirmEditDialog");
		  // create dialog lazily
		  if (!oDialog) {
			// create dialog via fragment factory
			oDialog = sap.ui.xmlfragment(
			  oView.getId(),
			  "customActivity.fragmentView.addConfirmEditDialog",
			  this
			);
			// connect dialog to view (models, lifecycle)
			oView.addDependent(oDialog);
		  }
		  oDialog.open();
		},
handleEditCancel: function(oEvent) {
		  //	this.clearDialogInputs();
		  oEvent.oSource.getParent().destroy();
		},
  
handleEditConfirm: function(oEvent) {
		  var oModel = this.getView().getModel("editRow");
		  var data = oModel.getData();
  
		  var params = {
			"Param.1": data.PACKID,
			"Param.2": data.QUANTITY1,
			"Param.3": data.QUANTITY2,
			"Param.4": data.QUANTITY3,
			"Param.5": data.QUANTITY4,
			"Param.6": this.appData.selected.material.id,
			"Param.7": this.appData.plant,
			"Param.8": this.appData.node.nodeID,
			"Param.9": this.appData.selected.order.orderNo,
			"Param.10": data.SCRAP,
			//	, "Param.11": selectedRc
			"Param.12": this.appData.selected.operationNo,
			//	, "Param.13": rc1
			//	, "Param.14": rc2
			//	, "Param.15": rc3
			//	, "Param.16": rc4
			"Param.17": this.appData.client,
			"Param.18": this.appData.selected.runID,
			"Param.19": data.QUANTITY5,
			"Param.20": data.LOCATION,
			"Param.21": this.appData.node.workcenterID
		  };
  
		  var tRunner = new TransactionRunner(
			"MES/ReportPacking/updateConfirmXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent, this);
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		  }
		  this.handleEditCancel(oEvent);
		  var oMsg = tRunner.GetMessage();
		  // MessageBox.success(oMsg);
		  this.getPackingDetails();
		  sap.oee.ui.Utils.toast(oMsg);
		},
  
		///////////
  
onClickConfirm: function(oEvent) {
		  var data = oEvent
			.getSource()
			.getBindingContext()
			.getObject();
  
		  var selectedRc = "";
		  var rc1 = "";
		  var rc2 = "";
		  var rc3 = "";
		  var rc4 = "";
  
		  if (data.reasonCodeData) {
			selectedRc = data.reasonCodeData.reasonCode3.substr(
			  data.reasonCodeData.reasonCode3.length - 4
			);
			rc1 = data.reasonCodeData.reasonCode1;
			rc2 = data.reasonCodeData.reasonCode2;
			rc3 = data.reasonCodeData.reasonCode3;
			rc4 = data.reasonCodeData.reasonCode4;
		  }
  
		  var params = {
			"Param.1": data.PACKID,
			"Param.2": data.QUANTITY1,
			"Param.3": data.QUANTITY2,
			"Param.4": data.QUANTITY3,
			"Param.5": data.QUANTITY4,
			"Param.6": this.appData.selected.material.id,
			"Param.7": this.appData.plant,
			"Param.8": this.appData.node.nodeID,
			"Param.9": this.appData.selected.order.orderNo,
			"Param.10": data.SCRAP,
			"Param.11": selectedRc,
			"Param.12": this.appData.selected.operationNo,
			"Param.13": rc1,
			"Param.14": rc2,
			"Param.15": rc3,
			"Param.16": rc4,
			"Param.17": this.appData.client,
			"Param.18": this.appData.selected.runID,
			"Param.19": data.QUANTITY5
                                    
		  };
  
		  var tRunner = new TransactionRunner(
			"MES/ReportPacking/callConfirmXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent, this);
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		  }
		  var oMsg = tRunner.GetMessage();
		  // MessageBox.success(oMsg);
		  this.getPackingDetails();
		  sap.oee.ui.Utils.toast(oMsg);
		  this.bindDataToCard();
		},
  
onClickRePrint: function(oEvent) {
		  var data = oEvent
			.getSource()
			.getBindingContext()
			.getObject();
  
		  if (data.HUNUMBER == "" || data.HUNUMBER.length == 0) {
			return false;
		  }
  
		  var params = {
			"Param.1": data.HUNUMBER,
			"Param.2": this.appData.node.nodeID,
			"Param.3": this.appData.node.workcenterID
		  };
  
		  var tRunner = new TransactionRunner(
			"MES/ReportPacking/PackingLabel/callPrintRFCXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			//	sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent,this);
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		  }
		  var oMsg = tRunner.GetMessage();
		  sap.oee.ui.Utils.toast(oMsg);
		},
  
onClickRemove: function(oEvent) {
		  var deleteMsg = this.appComponent.oBundle.getText("OEE_MESSAGE_DELETE");
		  var approveMsg = this.appComponent.oBundle.getText(
			"OEE_BTN_NOTIF_APPROVE"
		  );
		  var source = oEvent.oSource;
		  MessageBox.confirm(
			deleteMsg,
			this.removeCallBack.bind(this, source),
			approveMsg
		  );
		},
  
removeCallBack: function(oParams, oAction) {
		  if (oAction != "OK") return;
		  var obj = oParams.getBindingContext().getObject();
		  var aufnr = obj.AUFNR;
		  var packid = obj.PACKID;
		  var params = { "Param.1": aufnr, "Param.2": packid };
  
		  var tRunner = new TransactionRunner(
			"MES/ReportPacking/removePackingXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			//	sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent,this);
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		  }
		  var oMsg = tRunner.GetMessage();
		  sap.oee.ui.Utils.toast(oMsg);
		  this.getPackingDetails();
		},
  
clearDialogInputs: function() {
		  // this.byId("inputHUID").setValue("");
		  this.byId("inputLocation").setSelectedItem(null);
		  // this.byId("inputLocation").setValue("");
		  this.byId("inputQuantity1").setValue("");
		  this.byId("inputQuantity2").setValue("");
		  this.byId("inputQuantity3").setValue("");
		  this.byId("inputQuantity4").setValue("");
		  this.byId("inputScrap").setValue("");
		  this.byId("inputQuantity5").setValue("");
		  // this.byId("inputHuNo").setValue("");
		},
  
refreshReported: function() {
		  if (!this.appData.anyOrderRunningInShift()) {
			// Do not proceed if not.
			return;
		  }
  
		  this.getPackingDetails();
		},
  
onClickOpenReasonCodeUtilityPopup: function(oEvent) {
		  var reasonCodeLink = oEvent.getSource();
		  var oContextObject = oEvent
			.getSource()
			.getBindingContext()
			.getObject();
  
		  var oInterfaceReference = this.interfaces;
		  var oAppData = this.appData;
		  var oController = this.getView().getController();
		  var callback = function() {
			if (oContextObject.reasonCodeData != undefined) {
			  // debugger;
			}
		  };
  
		  sap.oee.ui.rcUtility.createReasonCodeToolPopup(
			this,
			reasonCodeLink,
			this.appData.client,
			this.appData.plant,
			this.appData.node.nodeID,
			"SCRAP",
			oContextObject,
			"reasonCodeData",
			undefined,
			callback
		  );
		},
  
openCoverQuan: function() {
		  var oView = this.getView();
		  var oDialog = oView.byId("SendCoverQuan");
		  // create dialog lazily
		  if (!oDialog) {
			// create dialog via fragment factory
			oDialog = sap.ui.xmlfragment(
			  oView.getId(),
			  "customActivity.fragmentView.sendCoverQuan",
			  this
			);
			// connect dialog to view (models, lifecycle)
			oView.addDependent(oDialog);
		  }
		  //this.getLocation();
		  oDialog.open();
		},
		closeCoverQuan: function(oEvent) {
		  var oView = this.getView();
		  var oDialog = oView.byId("SendCoverQuan");
		  oEvent.oSource.getParent().close();
		},
  
sendCoverQuan: function(oEvent) {
		  var params = {
			I_QUANTITY: this.getView()
			  .byId("idSendSecondQualityQuan")
			  .getValue(),
			I_ARBID: this.appData.node.workcenterID
		  };
  
		  var tRunner = new TransactionRunner(
			"MES/Integration/HandlingUnit/addSecondQuality/addSecondQualityXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return false;
		  }
		  var oMsg = tRunner.GetMessage();
		  sap.oee.ui.Utils.toast(oMsg);
		  this.closeCoverQuan(oEvent);
		},
  
onChangeSendSecondQualityQuan: function(oEvent) {
		  var val = oEvent.getParameter("newValue");
		  var oSource = oEvent.getSource();
		  var min = 0,
			max = 7;
		  if (val < min) {
			oSource.setValue(min);
			return false;
		  }
		  if (val > max) {
			oSource.setValue(max);
			return false;
		  }
		  return true;
		},
  
openQualityEntrance: function() {
		  var oView = this.getView();
		  var oDialog = oView.byId("EnterQualityID");
		  // create dialog lazily
		  if (!oDialog) {
			// create dialog via fragment factory
			oDialog = sap.ui.xmlfragment(
			  oView.getId(),
			  "customActivity.fragmentView.enterQualityID",
			  this
			);
			// connect dialog to view (models, lifecycle)
			oView.addDependent(oDialog);
		  }
		  //this.getLocation();
		  oDialog.open();
  
		  var input = this.getView().byId("idQualityID");
		  var params = { I_ARBID: this.appData.node.workcenterID };
		  var tRunner = new TransactionRunner(
			"MES/Integration/QualityID/getActiveQualityIDXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return false;
		  }
		  var oData = tRunner.GetJSONData();
		  var activeQualityID = oData[0].Row[0].Kaliteci_ID;
		  input.setValue(activeQualityID);
		},
  
onEnterQualityID: function(oEvent) {
		   var qualityID = this.appData.user.userID;
		  var params = {
			I_QUALITYID: qualityID,
			I_ARBID: this.appData.node.workcenterID
		  };
		  var tRunner = new TransactionRunner(
			"MES/Integration/QualityID/sendQualityIDXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return false;
		  }
		  var oMsg = tRunner.GetMessage();
		  sap.oee.ui.Utils.toast(oMsg);
		  this.onCloseQualityID(oEvent);
		},

onExitQualityID: function(oEvent) {
                          var qualityID = this.appData.user.userID;
                          var act_qualityID = this.getView().byId("idQualityID").getValue();
		  var params = {
                                    I_ACT_QUALITYID: act_qualityID,
                                    I_QUALITYID: qualityID,
			I_ARBID: this.appData.node.workcenterID
		  };
		  var tRunner = new TransactionRunner(
			"MES/Integration/QualityID/exitQualityIDXqry",
			params
		  );
		  if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return false;
		  }
		  var oMsg = tRunner.GetMessage();
		  sap.oee.ui.Utils.toast(oMsg);
		  this.onCloseQualityID(oEvent);
		},
  
		onCloseQualityID: function(oEvent) {
		  //this.clearInputs();
		  oEvent.oSource.getParent().close();
		},

modelServices: function() {
  var self = this;
  this.intervalHandle = setInterval(function() {
if (window.location.hash =="#/activity/ZACT_REPORT_PACKING")
  self.getPackingDetails();
//console.log(1);
  }, 6000);
},


onExit: function() {
		  this.appComponent
			.getEventBus()
			.unsubscribe(
			  this.appComponent.getId(),
			  "orderChanged",
			  this.refreshReported,
			  this
			);
                           if (this.intervalHandle) 
                           clearInterval(this.intervalHandle) ;
		}
	  });
	}
  );
  