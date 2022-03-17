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
    FilterType
  ) {
    return Controller.extend("customActivity.controller.orderCardTileDNASCT", {
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 */
	currentShift : undefined,
	restartRunInNextShift : false,
	onInit: function() {
	this.appComponent = this.getView().getViewData().appComponent;
	this.appData = this.appComponent.getAppGlobalData();
	this.interfaces = this.appComponent.getODataInterface();
	if(this.appData.defaultUom == undefined){
		this.appData.defaultUom = this.appData.getCustomizationValues(this.appData.node.nodeID, sap.oee.ui.oeeConstants.customizationNames.defaultuomforproductionreporting);  
	}
	this.bindDataToCard();
},

oeeRefreshActivity : function(){
	this.loadData();
},

bindDataToCard : function(){
	this.byId("orderCardTileDNASCT").setBusy(true);
	sap.oee.ui.Utils.attachChangeOrderDetails(this.appComponent,"orderCardFragmentDNASCT",this); // Attach Order Change
	this.loadData();
},

loadData : function(){
	try{
		this.interfaces.interfacesGetOrderStatusForRunsStartedInShift(this.appData.node.nodeID,this.appData.client,this.appData.plant,this.appData.shift.shiftID,this.appData.shift.shiftGrouping,this.appData.shift.startTimestamp,this.appData.shift.endTimestamp,this.renderOrderCards,this.getView().getController(),this.restartRunInNextShift);
	}catch(error){
		this.byId("orderCardTileDNASCT").setBusy(false);
	}
},

 renderOrderCards : function(outputOrderStatusList){ // Render Order Cards
			var activeOrdersModel = new sap.ui.model.json.JSONModel();
			var results = [];
			var orderAvailable = false;
			var orderStatusJSON;
				if(outputOrderStatusList != undefined){
					if(outputOrderStatusList.orderStatusList != undefined){
						if(outputOrderStatusList.orderStatusList.results != undefined){
							if(outputOrderStatusList.orderStatusList.results.length != 0){
								var order;
								orderAvailable = true;
								if(this.appData.selected.runID != undefined)
								{
									var orderMatched = false;
									for(order in outputOrderStatusList.orderStatusList.results)
									{
										if(this.appData.selected.runID == outputOrderStatusList.orderStatusList.results[order].runID)
										{
											orderStatusJSON = outputOrderStatusList.orderStatusList.results[order];
											orderMatched = true;
										}
									}

									if(!orderMatched)
									{
										var selectedOrderDetailsJSON =  this.interfaces.interfacesGetOrderStatusForListOfRunsInputSync([this.appData.selected.runID]);
										var activeRunsList = this.interfaces.interfacesGetAllActiveHoldAndCompletedRunsForShiftInput(this.appData.node.nodeID,this.appData.client,this.appData.plant,this.appData.shift.shiftID,this.appData.shift.shiftGrouping,this.appData.shift.startTimestamp);
										var activeOrderDetailsJSON =  this.interfaces.interfacesGetOrderStatusForListOfRunsInputSync(activeRunsList);
									
											orderStatusJSON = outputOrderStatusList.orderStatusList.results[0];
									
										if(selectedOrderDetailsJSON.orderStatusList !=undefined && selectedOrderDetailsJSON.orderStatusList.results != undefined && selectedOrderDetailsJSON.orderStatusList.results.length > 0){
												for(order in activeOrderDetailsJSON.orderStatusList.results)
									              {
										            if(selectedOrderDetailsJSON.orderStatusList.results[0].runID == activeOrderDetailsJSON.orderStatusList.results[order].runID && selectedOrderDetailsJSON.orderStatusList.results[0].status == sap.oee.ui.oeeConstants.status.ACTIVE)
										             {
											           orderStatusJSON = selectedOrderDetailsJSON.orderStatusList.results[0];
											
										              }
								                	}
										}
									}
								}
								else
								{
									orderStatusJSON = outputOrderStatusList.orderStatusList.results[0];
								}
								
								if(orderStatusJSON != undefined)
								{
										//changes to set all the quantities of the order card in the UOM which will be maintained in customiztion(Production UoM, Base UoM, Standard Rate UoM)
									   if(this.appData.defaultUom != null){
										   if(this.appData.defaultUom.value == sap.oee.ui.oeeConstants.uomType.productionUom){
											   orderStatusJSON.quantityReleasedUOMText = orderStatusJSON.productionUOMDesc;
											   orderStatusJSON.quantityReleased = orderStatusJSON.productionUomQuantity;
											   orderStatusJSON.totalQuantityProducedInRun = orderStatusJSON.totalQuantityProducedInProductionUomInRun; 
											   orderStatusJSON.totalProducedQuantity = orderStatusJSON.totalProducedInProductionUom; 
											   orderStatusJSON.totalRemainngQuantity = orderStatusJSON.totalRemainingQuantityInProductionUom; 
											   orderStatusJSON.totalRejectedQuantity = orderStatusJSON.totalRejectedQuantityInProductionUom;
										   }
										   else if (this.appData.defaultUom.value == sap.oee.ui.oeeConstants.uomType.standardRateUom){
											   orderStatusJSON.quantityReleasedUOMText = orderStatusJSON.stdRateUOMDesc;
											   orderStatusJSON.quantityReleased = orderStatusJSON.quantityInStdRateUom;
											   orderStatusJSON.totalQuantityProducedInRun = orderStatusJSON.totalQuantityProducedInStdRateUomInRun;
											   orderStatusJSON.totalProducedQuantity = orderStatusJSON.totalProducedInStdRateUom; 
											   orderStatusJSON.totalRemainngQuantity = orderStatusJSON.totalRemainingQuantityInStdRateUom;
											   orderStatusJSON.totalRejectedQuantity = orderStatusJSON.totalRejectedQuantityInStdRateUom;
										   }
										   else{
											   orderStatusJSON.quantityReleasedUOMText = orderStatusJSON.quantityReleasedUOMDesc;
										   }
									   }
									   else{
										   orderStatusJSON.quantityReleasedUOMText = orderStatusJSON.quantityReleasedUOMDesc;
									   }
									   orderStatusJSON.timeUom = this.interfaces.interfacesGetTextForUOM(orderStatusJSON.timeUom);
										//orderStatusJSON.quantityReleasedUOMText = this.interfaces.interfacesGetTextForUOM(orderStatusJSON.quantityReleasedUOM);
										this.appData.setSelectedOrderDetails(orderStatusJSON); // Change Selected Order Context
										emphasized = true;

										var isProdActMaintained = false;
										if(orderStatusJSON.productionActivity != ""){
											isProdActMaintained = true;
										}
										var obj = {
											releasedHeaderID: orderStatusJSON.releasedHeaderID,
											releasedID: orderStatusJSON.releasedID,
											order : orderStatusJSON.order,
											routingOperNo: orderStatusJSON.routingOperNo,
											operationDesc: orderStatusJSON.operationDesc,
											parentOperationDesc: orderStatusJSON.parentOperationDesc,
											material: orderStatusJSON.material,
											material_desc: orderStatusJSON.material_desc,
											quantityReleased: orderStatusJSON.quantityReleased,
											quantityReleasedUOM: orderStatusJSON.quantityReleasedUOM,
											quantityReleasedUOMText: orderStatusJSON.quantityReleasedUOMText,
											releaseDemandStatus: orderStatusJSON.releaseDemandStatus,
											runID: orderStatusJSON.runID,
											totalQuantityProducedInRun : orderStatusJSON.totalQuantityProducedInRun,
											startDate: orderStatusJSON.orderStartDate,
											startTime: orderStatusJSON.orderStartTime,
											reportingShiftId: orderStatusJSON.reportingShiftId,
											shiftGrouping: orderStatusJSON.shiftGrouping,
											workBreakSchedule: orderStatusJSON.workBreakSchedule,
											productionMode: orderStatusJSON.productionMode,
											isProdActMaintained: isProdActMaintained,
											productionActivity: orderStatusJSON.productionActivity,
											productionVersion: orderStatusJSON.productionVersion, 
											quantityRemaining : orderStatusJSON.totalRemainngQuantity,
											quantityRejected : orderStatusJSON.totalRejectedQuantity,
											standardRateQty : orderStatusJSON.standardRateQty,
											standardRateUom : orderStatusJSON.standardRateUom,
											totalProduced : orderStatusJSON.totalProducedQuantity,
											timeQty : orderStatusJSON.timeQty,
											timeUom : orderStatusJSON.timeUom,
											currentSpeed : orderStatusJSON.currentSpeed,
											nominalSpeed : orderStatusJSON.nominalSpeed,
											remainingTime : orderStatusJSON.remainingTime,
											emphasized: emphasized,
											status: orderStatusJSON.status,
											differenceInSpeed : orderStatusJSON.differenceInSpeed,
											remainingTimeInSecs : orderStatusJSON.remainingTimeInSecs,
											differenceInSpeedValue : orderStatusJSON.differenceInSpeedValue,
											speedUOM : orderStatusJSON.speedUOM,
											statusText : orderStatusJSON.statusDescription,
											salesOrderNumber : orderStatusJSON.salesOrderNumber,
											batchNumber : orderStatusJSON.batchNumber
									};
								
									results.push(obj); 
							}
					}else{
						this.appComponent.getEventBus().publish(this.appComponent.getId(), "clearOrderContext");
					}
				}
			}
		
		activeOrdersModel.setData({modelData: results});
	}else{
		this.appData.clearSelectedOrderContext(); // if No Order Exists clear order Context
	}
				var dataForCard;
				//TODO Correct UOM for ISO units here - quantityReleasedUOM is in ISO
				for ( var int = 0; int < results.length; int++) {
					if(results[int].emphasized){
						dataForCard = results[int];
					}
				}	
				if(outputOrderStatusList.orderStatusList.results.length==0){
					this.appData.selected.runID=undefined;
				}
				sap.oee.ui.Utils.updateModel(this.appComponent.getModel("appData"));
				this.byId("orderCardTileDNASCT").setBusy(false);

},

IsOrderRunning : function(obj){
	if(obj != undefined && obj != "")
		return true;
	else
		return false;
},

showIfNoOrderRunning : function(obj){
	if(obj != undefined && obj != "")
		return false;
	else
		return true;
},

onAfterRendering: function() {
},

onExit : function(){
	if (this.oPopOver) {
	    this.oPopOver.destroy();
	}
}
});
