sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"customActivity/scripts/custom"
], function(Controller, JSONModel, MessageBox, customScripts) {
	// "use strict";
	return Controller.extend("customActivity.controller.oeeComponentAssignmentLib", {
	onInit: function() {
		this.appComponent = this.getView().getViewData().appComponent;
		this.appData = this.appComponent.getAppGlobalData();
		this.interfaces = this.appComponent.getODataInterface();
		this.bindDataToCard();
		this.getOrders();
                        this.setVisibleForReWriteButton();
                        
	},

	bindDataToCard : function(){
		sap.oee.ui.Utils.updateCurrentOrderDetails(this.appComponent,this);
		sap.oee.ui.Utils.attachChangeOrderDetails(this.appComponent,"orderCardFragment",this);
	},

	getOrders: function(){
		var params = {"Param.1": this.appData.node.nodeID};
		var tRunner = new TransactionRunner("MES/ComponentAssignment/getOrdersXqry",params);
		if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		};
		var oData = tRunner.GetJSONData();
		var oModel = new sap.ui.model.json.JSONModel();
		oModel.setSizeLimit(1000);
		this.fillDataForProducedQuantity(oData);
		oModel.setData(oData);
		this.byId("ordersTable").setModel(oModel);

	},

setVisibleForReWriteButton: function() {
	var options = this.getActivityOptionValues("resend");
	var oModel = new JSONModel();
	var oData;
	var userOpt = options.find(x => x.optionValue == this.appData.user.userID);
	if(userOpt)
		oData = {ISPERMITTED: 1};
	else
		oData = {ISPERMITTED: 0};

	// oData = {ISPERMITTED: 1};
	oModel.setData(oData);
	this.getView().setModel(oModel, "viewModel");
},

getActivityOptionValues : function(obj){
	if(this.getView().getViewData().viewOptions && this.getView().getViewData().viewOptions.length>0){
		for(var i=0; i<this.getView().getViewData().viewOptions.length; i++){
			if(this.getView().getViewData().viewOptions[i].activityOptionValueDTOList && this.getView().getViewData().viewOptions[i].activityOptionValueDTOList.results && this.getView().getViewData().viewOptions[i].activityOptionValueDTOList.results.length>0){
				if(this.getView().getViewData().viewOptions[i].optionName == obj){
					return this.getView().getViewData().viewOptions[i].activityOptionValueDTOList.results;
				}
			}
		}
	}
},

	getHandlingUnits: function(oEvent){
		var objTable = this.byId("ordersTable");
		var aufnrList = "";

		if(objTable.getSelectedItems().length == 0) {
			this.byId("handlingUnitsTable").getModel().oData = [];
			this.byId("handlingUnitsTable").getModel().updateBindings();
			return;
		}

		objTable.getSelectedItems().forEach(function(oItem) {
			var selObj = oItem.getBindingContext().getObject();
			if(aufnrList == "")
				aufnrList = "'" + selObj.AUFNR + "'";
			else
				aufnrList = aufnrList + ", '" + selObj.AUFNR + "'";
		});
		var params = {"Param.1": aufnrList};
		var tRunner = new TransactionRunner("MES/ComponentAssignment/getHandlingUnitsXqry",params);
		if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		};
		var oData = tRunner.GetJSONData();
		var arrayData = oData[0].Row;
		var newData = { "child" : [] };
		if(arrayData)
		for(var data of arrayData) {
			if(data.MATERIAL == ""){
				data.child = [];
				for(var childData of arrayData) {
					if(data.EXIDV == childData.EXIDV && childData.MATERIAL != "") {
						data.child.push(childData);
					}
				}
				newData.child.push(data);
			}
		}
		var oModel = new sap.ui.model.json.JSONModel();
		oModel.setData(newData);
		// this.byId("handlingUnitsTable").setModel(oModel);
		this.byId("TreeTableBasic").setModel(oModel);
	},

	fillDataForProducedQuantity(data) {
		var row = data[0].Row;
		if(!row) return;
		row.forEach(function(oItem) { oItem.PROD_QUANT = this.appData.selected.quantityReported}.bind(this));
		/*for(var o of data[0].Row) {
			o.PROD_QUANT = this.appData.selected.quantityReported;
		}*/
	},

	openBarcodeDialog: function(oEvent) {
		var selectedOrdersLength = this.byId("ordersTable").getSelectedItems().length;
		var noOrdersSelected = this.appComponent.oBundle.getText("OEE_ERROR_NO_ORDER_SELECTED");
		if(selectedOrdersLength <= 0) {
			MessageBox.error(noOrdersSelected);
			return;
		}

		var oView = this.getView();
		var oDialog = oView.byId("BarcodeDialog");
		// create dialog lazily
		if (!oDialog) {
			// create dialog via fragment factory
			oDialog = sap.ui.xmlfragment(oView.getId(), "customActivity.fragmentView.readBarcode", this);
			// connect dialog to view (models, lifecycle)
			oView.addDependent(oDialog);
		}
		//this.getLocation();
		oDialog.open();
	},

              openToleranceDialog: function(oEvent) {
		var selectedOrdersLength = this.byId("ordersTable").getSelectedItems().length;
		var noOrdersSelected = this.appComponent.oBundle.getText("OEE_ERROR_NO_ORDER_SELECTED");
		if(selectedOrdersLength <= 0) {
			MessageBox.error(noOrdersSelected);
			return;
		}                       
                            var oView = this.getView();
		var oDialog = oView.byId("SendToleranceQuan");
		// create dialog lazily
		if (!oDialog) {
			// create dialog via fragment factory
			oDialog = sap.ui.xmlfragment(oView.getId(), "customActivity.fragmentView.sendToleranceQuan", this);
			// connect dialog to view (models, lifecycle)
			oView.addDependent(oDialog);
		}
		//this.getLocation();
		oDialog.open();
 		
		var aufnr = this.byId("ordersTable").getSelectedItem().getBindingContext().getObject().AUFNR;
		var input=this.getView().byId("idToleranceMax");
	            var params = {"I_AUFNR": aufnr};
	            var tRunner = new TransactionRunner("MES/Integration/HandlingUnit/additionalQuantity/toleranceQuantityXqry",params);
                        if (!tRunner.Execute()) {
		MessageBox.error(tRunner.GetErrorMessage());
		return null;
		};
                              	var oData = tRunner.GetJSONData();
			var addQuan=oData[0].Row[0].ADD_QUAN;
			input.setValue(addQuan);
	},
  onCloseTolerance: function(oEvent) {
		//this.clearInputs();
		oEvent.oSource.getParent().close();
	},

onCloseBarcode: function(oEvent) {
		this.clearInputs();
		oEvent.oSource.getParent().close();
	},


sendToleranceQuan: function(oEvent){
                        var aufnr = this.byId("ordersTable").getSelectedItem().getBindingContext().getObject().AUFNR;
		var params = {"I_ADD_QUANTITY":this.getView().byId("idSendToleranceQuan").getValue()
			, "I_ARBID": this.appData.node.workcenterID
                                     , "I_AUFNR":aufnr};

		var tRunner = new TransactionRunner("MES/Integration/HandlingUnit/additionalQuantity/additionalQuantityXqry", params);
		if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return false;
		};
		var oMsg = tRunner.GetMessage();
		sap.oee.ui.Utils.toast(oMsg);
		this.onCloseTolerance(oEvent);
	},


onClickReadBarcode: function(oEvent) {
		var inputBarcode = this.byId("inputBarcode");
		var selectLocation = this.byId("selectLocation");
		var barcode = inputBarcode.getValue();
		var location = selectLocation.getSelectedKey();
		var errorNoInputs = this.appComponent.oBundle.getText("OEE_ERROR_FILL_ALL_INPUTS");
		var operationDesc = this.appData.selected.operationDesc;
		var arbid = this.appData.node.workcenterID;
                        var aufnr = this.byId("ordersTable").getSelectedItem().getBindingContext().getObject().AUFNR;
		
		//Check inputs
		if((!barcode) || (location == "" || location == null) ) {
			inputBarcode.focus();
			MessageBox.error(errorNoInputs);
			return;
		}



		var selectedItems = this.byId("ordersTable").getSelectedItems();
		var oItems = selectedItems.map(x=>x.getBindingContext().getObject());

		var JSONItems = JSON.stringify(oItems);
		var params = {"Param.1": JSONItems, "Param.2": barcode, "Param.3": location, "Param.4": operationDesc, "Param.5": arbid, "Param.6": aufnr};
		var tRunner = new TransactionRunner("MES/ComponentAssignment/assignComponentXqry",params);
		if (!tRunner.Execute()) {
			inputBarcode.focus();
			MessageBox.error(tRunner.GetErrorMessage());
			return null;
		};
		var oMsg = tRunner.GetMessage();
		sap.oee.ui.Utils.toast(oMsg);
		this.clearInputs();
		inputBarcode.focus();

		// MessageBox.success(oMsg);
		// this.getOrders();
		// this.onCloseBarcode(oEvent);
	},

	clearInputs: function() {
		var inputBarcode = this.byId("inputBarcode");
		var selectLocation = this.byId("selectLocation");
		inputBarcode.setValue("");
		selectLocation.setSelectedKey(null);
	},

	handleNotificationSearch : function(oEvent){
		var val = oEvent.getParameter("newValue");
		var tab = this.getView().byId("ordersTable");
		var oBinding = tab.getBinding("items");
		var oFilter = new sap.ui.model.Filter({
			filters: [
				new sap.ui.model.Filter({
					path: 'AUFNR',
					operator: sap.ui.model.FilterOperator.Contains,
					value1: val
				}),
				new sap.ui.model.Filter({
					path: 'MAKTX',
					operator: sap.ui.model.FilterOperator.Contains,
					value1: val
				})
			],
			and: false
		})


		if (val || val === "") {
			tab.setShowOverlay(false);
			oBinding.filter([oFilter]);
		}
	},

	onPressResendPLC : function(oEvent){
		var oSource = oEvent.getSource();
                        var aufnr =oSource.getParent().getCells()[0].getText();
		var arbid = this.appData.node.workcenterID;
		var location = oSource.getParent().getCells()[2].getText();
		var exidv = oSource.getParent().getCells()[1].getText();

		var params = {"I_LOCATION":location
			, "I_ARBID": arbid
                                     , "I_AUFNR":aufnr
                                      , "I_BARCODE":exidv};

		var tRunner = new TransactionRunner("MES/ComponentAssignment/SendComponent/sendComponentParamsXqry", params);
		if (!tRunner.Execute()) {
			MessageBox.error(tRunner.GetErrorMessage());
			return false;
		};
		var oMsg = tRunner.GetMessage();
		sap.oee.ui.Utils.toast(oMsg);
	},

	onExit : function(){
		// this.appComponent.getEventBus().unsubscribe(this.appComponent.getId(), "shiftChanged", this.onRefresh, this);
	}
	});
});
