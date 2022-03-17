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
      "sap/m/MessageToast",
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
      MessageToast
    ) {
      // "use strict";
      return Controller.extend("customActivity.controller.orderDetails", {
        formatter: formatter,
  
		onInit: function() {
		this.appComponent = this.getView().getViewData().appComponent;  
		this.appData = this.appComponent.getAppGlobalData();
		this.interfaces = this.appComponent.getODataInterface();
		if(this.appData.statusList == undefined){
			this.appData.statusList = this.interfaces.interfacesGetAllStatus(this.appData.client,this.appData.plant); 
			this.statusList = this.appData.statusList;
		}
		else{
			this.statusList = this.appData.statusList;
		}
		if(this.appData.productionActivities == undefined){
			this.appData.productionActivities = this.readProductionActivities();  
			this.prodActivityList = this.appData.productionActivities;
		}
		else {
			this.prodActivityList = this.appData.productionActivities;
		}
		/*this.prodActivityList = this.readProductionActivities();
		this.statusList = this.interfaces.interfacesGetAllStatus(this.appData.client,this.appData.plant);*/
		//this.appComponent.getEventBus().subscribe(this.appComponent.getId(), "orderChanged", this.bindOrderDetailsToTable, this);
		this.bindDataToCard();
		this.prepareOrderDetails();
		//this.orderDetails = this.interfaces.interfacesGetOrderDetailsAndProductionRunIntervals(this.appData.node.nodeID,this.appData.selected.order.orderNo,this.appData.selected.operationNo);
		this.bindOrderDetailsToTable();
		//this.bindActivityDetails();
		this.enableRevertAction();
		this.enableAbortAction();
		this.intervalsOtherThanStartAndComplete = ""; 
	},
	
	bindDataToCard : function(){
		
		var viewData = {};
		viewData.runIDList = [];
		viewData.runIDList.push({runID:this.getView().getViewData().mode});
		var orderDetailsCard =	sap.ui.view({viewName : "sap.oee.ui.orderDetailsCard" ,type : sap.ui.core.mvc.ViewType.XML,
			width : "100%",
			layoutData : new sap.ui.layout.GridData({span: "L12 M12 S12"}), viewData : {data:viewData,
			"viewOptions" : [],
			"appComponent" : this.appComponent
		}}) ;   
		this.byId("orderCardFragment").removeAllContent();
		this.byId("orderCardFragment").addContent(orderDetailsCard);
	},
	
	prepareOrderDetails : function(){
		if (!this.oOrderDetails) {
            this.oOrderDetails = sap.ui.xmlfragment("orderDetailsDialog", "sap.oee.ui.fragments.orderDetails", this);
			this.getView().addDependent(this.oOrderDetails);
		}
		if(!this.detailModel){
			this.detailModel = new sap.ui.model.json.JSONModel();
		}
		this.oOrderDetails.setModel(this.detailModel);
	},
	onPressDetails:function(oEvent){
		var details = [], count, intervalcapacityLength; capacityString="";
		var selectedData = oEvent.getSource().getParent().getBindingContext().getObject();
		var source = oEvent.getSource();
		if(selectedData.updatedBy && selectedData.updatedBy !== "" ){
			details.push({label : this.appComponent.oBundle.getText("REPORTED_LAST_CHANGED_BY_LABEL"), value : selectedData.updatedBy});
		}
		if(selectedData.updatedTimestamp && selectedData.updatedTimestamp !== ""){
			details.push({label : this.appComponent.oBundle.getText("OEE_LABEL_DATE_TIME_LAST_REPORTED"), value : sap.oee.ui.Formatter.formatTimeStampWithoutLabel(selectedData.updatedTimestamp,this.appData.plantTimezoneOffset,this.appData.plantTimezoneKey)});
		}
		
		intervalcapacityLength = selectedData.intervalCapacityNodes.results.length;
		if(intervalcapacityLength > 0){
			for(count=0; count<intervalcapacityLength; count++ ){
				if(count === intervalcapacityLength - 1){
					capacityString = capacityString + selectedData.intervalCapacityNodes.results[count].plantHierarchyNode.capacityIDDesc;
				}else{
					capacityString = capacityString + selectedData.intervalCapacityNodes.results[count].plantHierarchyNode.capacityIDDesc + ", ";
				}
			}
			
			if(selectedData.updatedTimestamp && selectedData.updatedTimestamp !== ""){
				details.push({label : this.appComponent.oBundle.getText("OEE_LABEL_WORK_UNIT_CAPACITIES"), value : capacityString });
			}
		}
		
		this.detailModel.setData({details:details});
		this.oOrderDetails.openBy(source);
	},
	bindOrderDetailsToTable : function(){ 
		try{
			
		this.orderDetails = this.interfaces.interfacesGetOrderDetailsAndProductionRunIntervals(this.appData.node.nodeID,this.appData.selected.order.orderNo,this.appData.selected.operationNo,this.appData.selected.releasedID.toString());
		if(this.orderDetails !== undefined){
			
			if(!this.orderDetailsJSONModel){
				this.orderDetailsJSONModel = new sap.ui.model.json.JSONModel;
			}
			
			if(this.orderDetails.productionOrderDetails && this.orderDetails.productionOrderDetails.productionRunIntervals && this.orderDetails.productionOrderDetails.productionRunIntervals.results.length > 0){
				var intervals = this.orderDetails.productionOrderDetails.productionRunIntervals.results;
				var runs = this.orderDetails.productionOrderDetails.productionRuns.results ; 
				var status = "",i ,prodActivity;
				
				for(i=0 ; i < intervals.length ; i++){
					/*Iterate through runs array in order to get shift and compare 
					the interval's start time and end time with the run's start time 
					and end time to get the action performed at the interval's start time and end time*/
					for(var j=0 ; j < runs.length; j++){
						if(intervals[i].runId === runs[j].runId){ 

							intervals[i].updatedBy = runs[j].updatedBy;
						    intervals[i].updatedTimestamp = runs[j].updatedTimestamp;
							intervals[i].shift = runs[j].shift ;
								
							//For Action1
							if(intervals[i].existingTimeInterval.startTimestamp === this.orderDetails.productionOrderDetails.timeInterval.startTimestamp){
								intervals[i].action1 = this.interfaces.oOEEBundle.getText("OEE_BTN_START") ;//If the interval's start time is equal to order's start time then action1 is "START"
						     }else{
									if(intervals[i].existingTimeInterval.startTimestamp === runs[j].shift.timeInterval.startTimestamp){ //If its not equal to order start time then check with the runs start time (if equal then set it to "Continued from previous shift")
										if(intervals[i-1].action2 === this.interfaces.oOEEBundle.getText("OEE_LABEL_END_OF_SHIFT")){ 
												intervals[i].action1 = this.interfaces.oOEEBundle.getText("OEE_LABEL_CONTINUED_FROM_PREVIOUS_SHIFT");    
										}else{
												intervals[i].action1 = this.interfaces.oOEEBundle.getText("OEE_BTN_RESUME");
												status = sap.oee.ui.oeeConstants.RESUME;
										}
									}else{
										
										if(intervals[i-1].action2 === this.interfaces.oOEEBundle.getText("OEE_LABEL_ACTIVITY_ASSIGNED")){
											intervals[i].action1 = this.interfaces.oOEEBundle.getText("OEE_LABEL_ACTIVITY_ASSIGNED");
										}else{
										if(intervals[i-1].action2 ===  this.interfaces.oOEEBundle.getText("OEE_LABEL_END_OF_SHIFT")){
											intervals[i].action1 = this.interfaces.oOEEBundle.getText("OEE_LABEL_CONTINUED_FROM_PREVIOUS_SHIFT");
										}else{
										if(status === ""){  
											status = sap.oee.ui.oeeConstants.HOLD ; 
											intervals[i].action1 = this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");  
										}else{   
											if(status === sap.oee.ui.oeeConstants.HOLD){
												intervals[i].action1 = this.interfaces.oOEEBundle.getText("OEE_BTN_RESUME");
												status = sap.oee.ui.oeeConstants.RESUME
											}else{
												intervals[i].action1 = this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");  
												status = sap.oee.ui.oeeConstants.HOLD      
												}                                 
										  }
										}
									    }
									  }
									//}
									
							 }
								
								
							//For Action2
							/*Firtly compare with Order end time .If interval's end time is equal to order end time then set action2 to "COMPLETE"
							   But check if end time is 0.Then make action button as invisible and set action2 to "".
							   Also check that whether its the last interval or not .If not then set the action2 accordindly to "HOLD"
							*/
							if(intervals[i].existingTimeInterval.endTimestamp === this.orderDetails.productionOrderDetails.timeInterval.endTimestamp ){
								if(intervals[i].existingTimeInterval.endTimestamp === "0"){
									intervals[i].existingTimeInterval.endTimestamp = 0 ; //add formatter to it make it invisible
									intervals[i].action2 = "";
									
								}else{
									if(intervals[i+1] !== undefined){  //To check whether it is the last interval or not
										if(status === ""){
											status = sap.oee.ui.oeeConstants.HOLD ;
											intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");  
										}else{ 
											if(status === sap.oee.ui.oeeConstants.HOLD){
												intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_BTN_RESUME");
												status = sap.oee.ui.oeeConstants.RESUME   
											}else{
												intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");  
												status = sap.oee.ui.oeeConstants.HOLD
											}       
										}
									}else{
										intervals[i].action2 =  this.interfaces.oOEEBundle.getText("OEE_BTN_COMPLETE") ;
									} 
								}
							}else{
								if(intervals[i].existingTimeInterval.endTimestamp === runs[j].shift.timeInterval.endTimestamp){//Compare with run's end time
									if(intervals[i+1] && intervals[i+1].existingTimeInterval.startTimestamp === runs[j+1].shift.timeInterval.startTimestamp){
									intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_LABEL_END_OF_SHIFT");
									}else{
										status = sap.oee.ui.oeeConstants.HOLD ; 
										intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");
									}
								}else{ 
									
									if(  runs[j].shift.timeInterval.startTimestamp < intervals[i].existingTimeInterval.endTimestamp && intervals[i+1] 
										  && intervals[i].existingTimeInterval.endTimestamp === intervals[i+1].existingTimeInterval.startTimestamp
										 ){
											 intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_LABEL_ACTIVITY_ASSIGNED");
										}else{
									
									if(status === ""){
										status = sap.oee.ui.oeeConstants.HOLD ;
										intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");  
									}else{  
										if(status === sap.oee.ui.oeeConstants.HOLD){
											intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_BTN_RESUME");
											status = sap.oee.ui.oeeConstants.RESUME
										}else{
											intervals[i].action2 = this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");  
											status = sap.oee.ui.oeeConstants.HOLD
											}       
										} 
										
									}
									
									} 
							
								}
							
							
							//Crew Size Default
							if(this.appData.node.crewSize === sap.oee.ui.oeeConstants.checkBooleanValue.TRUE){
							if(intervals[i].crewSize === ""){
								intervals[i].crewSize = 0;
							}
							intervals[i].crewSize = parseFloat(intervals[i].crewSize) ;
							}
							
							//For Production Activity Column
							if(intervals[i].productionActivity !== ""){
								prodActivity = "X" ;
							}
							break;
						}
					}
					
				}
				if(prodActivity === "X"){
					this.byId("productionActivity").setVisible(true);
				}else{
					this.byId("productionActivity").setVisible(false);
				}
				
				this.orderDetailsJSONModel.setData({orderDetailsData :intervals});
				this.byId("idOrderDetails").setModel(this.orderDetailsJSONModel);
			}
			
		}
	
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,sap.ui.core.MessageType.Error);
		}
		
	},
	
	/*bindActivityDetails : function(){
		var orderDetails = this.interfaces.interfacesGetOrderDetailsAndProductionRunIntervals(this.appData.node.nodeID,this.appData.selected.order.orderNo,this.appData.selected.operationNo);
		if(orderDetails != undefined){
		if(orderDetails.productionOrderDetails != undefined){
			if(orderDetails.productionOrderDetails.productionRuns != undefined){
				var productionRuns = orderDetails.productionOrderDetails.productionRunIntervals.results;
				this.activityDetailsJSONModel = new sap.ui.model.json.JSONModel;
				var prodRunIntervals = [];
			for(i in productionRuns){
				if(productionRuns[i].productionActivity != undefined && productionRuns[i].productionActivity != ""){
					var prodRunInt = {};
					prodRunInt.productionActivityDesc = this.productionActivitiesFormatter(productionRuns[i].productionActivity);
					prodRunInt.startDate = productionRuns[i].existingTimeInterval.startTimestamp;
					if(productionRuns[i].existingTimeInterval.endTimestamp == "0" && ((parseInt(i)+1) <= productionRuns.length -1)  ){
						prodRunInt.endDate = productionRuns[parseInt(i)+1].existingTimeInterval.startTimestamp;
					}
					else{
						prodRunInt.endDate = productionRuns[i].existingTimeInterval.endTimestamp;
					}
					prodRunIntervals.push(prodRunInt);
				}
			}
			if(prodRunIntervals.length == 0){
				this.byId("orderActivityDetails").setVisible(false);
			}
			this.activityDetailsJSONModel.setData({activityDetailsData :prodRunIntervals});
			}
			this.byId("idActivityDetails").setModel(this.activityDetailsJSONModel);
		}
		}
	},
	*/
	
	readProductionActivities : function(){
		var prodActivities = this.interfaces.getProductionActivityForNode(this.appData.client,this.appData.plant,this.appData.node.nodeID);
		if(prodActivities != undefined && prodActivities.ioProductionActivityList != undefined){
			return prodActivities.ioProductionActivityList.results;
		}
	},
	
	productionActivitiesFormatter : function(obj) {
		if (!obj)
			return;
		if (this.prodActivityList != undefined) {
			for ( var prodActivityCounter = 0; prodActivityCounter < this.prodActivityList.length; prodActivityCounter++) {
				if (obj == this.prodActivityList[prodActivityCounter].prodActivity)
					return this.prodActivityList[prodActivityCounter].description;
			}
			return "";
		}
	},
	
	checkTimeStampValue : function(obj){
		if(obj!= undefined && parseFloat(obj) >0)
			return true;
			else return false;
	},
	
	openEnterDateTimeDialog : function(timeText,date){
		this.oEnterTimeModel = new sap.ui.model.json.JSONModel();
		if(this.oEnterTimeDialog == undefined){
			this.oEnterTimeDialog = sap.ui.xmlfragment("enterDateTimeFragment","customActivity.fragmentView.enterDateTime",this);
			this.getView().addDependent(this.oEnterTimeDialog);
		}

		this.oEnterTimeModel.setData({timeLabel : timeText,
			editDate:date, editTime : date});
		this.oEnterTimeModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		this.oEnterTimeModel.refresh();
		this.oEnterTimeDialog.setModel(this.oEnterTimeModel);
		this.oEnterTimeDialog.open();
	},
	
	checkDate : function(oEvent){
		var dateControl = sap.ui.core.Fragment.byId("enterDateTimeFragment","inputDate");
		var bValid = oEvent.getParameter("valid");
    	if (bValid) {
    		oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
			dateControl.setDateValue(oEvent.getSource().getValue());
    	     var okButtonofEnterTime = sap.ui.core.Fragment.byId("enterDateTimeFragment","okButton2");
		      if(okButtonofEnterTime)
		    	  {
		    	  okButtonofEnterTime.setEnabled(true);
		    	  }
		} else {
			oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
			var okButtonofEnterTime = sap.ui.core.Fragment.byId("enterDateTimeFragment","okButton2");
		      if(okButtonofEnterTime)
		    	  {
		    	  okButtonofEnterTime.setEnabled(false);
		    	  }
		}
	},
	
	checkTime : function(oEvent){
		var timeControl = sap.ui.core.Fragment.byId("enterDateTimeFragment","inputTime");
		var bValid = oEvent.getParameter("valid");
    	if (bValid) {
    		oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
			timeControl.setValue(oEvent.getSource().getValue());
    	     var okButtonofEnterTime = sap.ui.core.Fragment.byId("enterDateTimeFragment","okButton2");
		      if(okButtonofEnterTime)
		    	  {
		    	  okButtonofEnterTime.setEnabled(true);
		    	  }
		} else {
			oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
			var okButtonofEnterTime = sap.ui.core.Fragment.byId("enterDateTimeFragment","okButton2");
		      if(okButtonofEnterTime)
		    	  {
		    	  okButtonofEnterTime.setEnabled(false);
		    	  }
		}
	},
	
	editStartDate : function(oEvent){
		this.selectedOrderDetails = oEvent.getSource().getBindingContext().getObject() ;
		this.intervalsOtherThanStartAndComplete = "" ;
		if(oEvent.getSource().getBindingContext().getObject().action1 !== this.interfaces.oOEEBundle.getText("OEE_BTN_START")){
		this.intervalsOtherThanStartAndComplete = "X" ;
		}
		var timeText = this.interfaces.oOEEBundle.getText("OEE_LABEL_START_TIME");
		
		this.isEditStartDate = true;
		
		//var startTime = oEvent.getSource().getModel().getData().orderDetailsData.startDate;
		var startTime = parseFloat(oEvent.getSource().getBindingContext().getObject().existingTimeInterval.startTimestamp) ;
		this.openEnterDateTimeDialog(timeText,new Date(this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(startTime)));
	},
	
	editEndDate : function(oEvent){ 
		this.selectedOrderDetails = oEvent.getSource().getBindingContext().getObject() ;
		this.intervalsOtherThanStartAndComplete = "" ;
		if(oEvent.getSource().getBindingContext().getObject().action2 !== this.interfaces.oOEEBundle.getText("OEE_BTN_COMPLETE") ){
		this.intervalsOtherThanStartAndComplete = "X" ;
		}
		var timeText = this.interfaces.oOEEBundle.getText("OEE_LABEL_END_TIME");
		this.isEditStartDate = false;
		//var endTime = oEvent.getSource().getModel().getData().orderDetailsData.endDate;
		var endTime = parseFloat(oEvent.getSource().getBindingContext().getObject().existingTimeInterval.endTimestamp) ;
		this.openEnterDateTimeDialog(timeText,new Date(this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(endTime)));
	},
	
	
	onPressSetCurDate : function(oEvent){
		var dateObject;
		var dateControl = sap.ui.core.Fragment.byId("enterDateTimeFragment","inputDate");
		var timeControl = sap.ui.core.Fragment.byId("enterDateTimeFragment","inputTime");
		
		dateObject = new Date(this.interfaces.interfacesGetCurrentTimeInMsAfterTimeZoneAdjustments());
		//var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "dd.MM.yyyy kk:mm"});
		//var currentDate = dateFormat.format(new Date(this.interfaces.interfacesGetCurrentTimeInMsAfterTimeZoneAdjustments()));
		this.oEnterTimeModel.setProperty("/editDate",dateObject);
		this.oEnterTimeModel.setProperty("/editTime",dateObject);
		
		this.oEnterTimeModel.refresh();

		timeControl.setDateValue(dateObject);
		if(dateControl){
			dateControl.setValueState(sap.ui.core.ValueState.None);
		}
		if(timeControl){
			timeControl.setValueState(sap.ui.core.ValueState.None);
		}
		var okButtonofEnterTime = sap.ui.core.Fragment.byId("enterDateTimeFragment","okButton2");
		if(okButtonofEnterTime)
		{
			okButtonofEnterTime.setEnabled(true);
		}
	},
	
	handleOKTime : function(oEvent){
		var date, time, valueStateDate, valueStateTime, combinedDate;
		valueStateDate = sap.ui.core.Fragment.byId("enterDateTimeFragment","inputDate").getValueState();
		valueStateTime = sap.ui.core.Fragment.byId("enterDateTimeFragment","inputTime").getValueState();
		if(valueStateDate == "None" && valueStateTime == "None"){	
			try{
				date = sap.ui.core.Fragment.byId("enterDateTimeFragment", "inputDate").getDateValue();
				time = sap.ui.core.Fragment.byId("enterDateTimeFragment", "inputTime").getDateValue();
				if(date && time && date !="" && time !=""){
					combinedDate =createTimestampFromDateTimeLocal(date, time);

					//var timeStampTemp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp();
					var timeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(combinedDate.getTime(), this.appData.plantTimezoneOffset);
					var newStartTimeStamp = 0;
					var newEndTimeStamp = 0;
					if(this.isEditStartDate)
						newStartTimeStamp = timeStamp;
					else
						newEndTimeStamp = timeStamp;
					if(this.intervalsOtherThanStartAndComplete === "X"){
						this.updateStartTimeOrEndTimeOfOrderInterval(newStartTimeStamp,newEndTimeStamp); //Other Actions
					}else{
						this.checkForDataLossOnOrderModification(newStartTimeStamp,newEndTimeStamp); //Start and Complete Action
					}
				}
			}catch(e){
				sap.oee.ui.Utils.createMessage(e.message,sap.ui.core.MessageType.Error);
			}
		}
	},
	
	//To Update the Start Time Or End Time For Order Interval
	updateStartTimeOrEndTimeOfOrderInterval : function(newStartTimeStamp,newEndTimeStamp){
							var data ={}	;
							data.orderNumber = 	this.appData.selected.order.orderNo;
							data.operationNumber = this.appData.selected.operationNo ;
							data.plant = this.appData.plant ;
							data.capacityId = this.appData.node.capacityID ;
							data.client = this.appData.client;
							data.workcenterId = this.appData.node.workcenterID ;
							data.nodeId = this.appData.node.nodeID ;
							data.intervalId = this.selectedOrderDetails.intervalId ;
							data.productionActivity = this.selectedOrderDetails.productionActivity;
							data.runId = this.selectedOrderDetails.runId ;
							data.crewSize = this.selectedOrderDetails.crewSize.toString() ;
			
			if (newStartTimeStamp === 0){
				data.intervalStartTimestamp = parseFloat(this.selectedOrderDetails.existingTimeInterval.startTimestamp) ;
			}else{
				data.intervalStartTimestamp = parseFloat(newStartTimeStamp);
			}
			
			if(newEndTimeStamp === 0){
				data.intervalEndTimestamp = parseFloat(this.selectedOrderDetails.existingTimeInterval.endTimestamp) ;
			}else{
				data.intervalEndTimestamp = parseFloat(newEndTimeStamp);
			}
			
			data.orderStartTimestamp = parseFloat(this.orderDetails.productionOrderDetails.timeInterval.startTimestamp) ;
			data.orderEndTimestamp = parseFloat(this.orderDetails.productionOrderDetails.timeInterval.endTimestamp) ;
			var result = this.interfaces.setCrewSizeOrStartTimeOrEndTimeOfOrderInterval(data);
			
			if(result.outputCode === 0){ 
				this.oEnterTimeDialog.close();
				this.bindOrderDetailsToTable();
				this.bindDataToCard();
				sap.oee.ui.Utils.toast(this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE"));
			}
			
	},
	
	checkForDataLossOnOrderModification : function(newStartTimeStamp,newEndTimeStamp){
		var oController = this.getView().getController();
		try{
			var allowModifyOrder = function(bConfirm){
				if(bConfirm == sap.m.MessageBox.Action.OK){
					
			var result = oController.interfaces.interfacesPerformOrderSimplificationChanges(oController.appData.node.nodeID,oController.appData.selected.order.orderNo,oController.appData.selected.operationNo,oController.appData.selected.releasedID.toString(),newStartTimeStamp,newEndTimeStamp);
			
					oController.bindOrderDetailsToTable();
					oController.bindDataToCard();
					oController.oEnterTimeDialog.close();
				}else{
					return;
				}
			};
		var output = this.interfaces.getAffectedProductionDataForOrderSimplificationInput(this.appData.node.nodeID,this.appData.selected.order.orderNo,this.appData.selected.operationNo,this.appData.selected.releasedID.toString(),newStartTimeStamp,newEndTimeStamp);
		if ((output != undefined && output.productionRunDataToBeModified != undefined && output.productionRunDataToBeModified.results != undefined && output.productionRunDataToBeModified.results.length >0)
				|| (output != undefined && output.productionRunDataToBeDeleted != undefined && output.productionRunDataToBeDeleted.results != undefined && output.productionRunDataToBeDeleted.results.length >0)) {
			sap.m.MessageBox.confirm(this.interfaces.oOEEBundle.getText("OEE_MESSAGE_MODIFY_ORDER_PROCEED"),allowModifyOrder);
		}
		else{
			this.performOrderChanges(newStartTimeStamp,newEndTimeStamp);
		}
		
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,sap.ui.core.MessageType.Error);
		}
	},
	
	performOrderChanges : function(newStartTimeStamp,newEndTimeStamp){
		var result = this.interfaces.interfacesPerformOrderSimplificationChanges(this.appData.node.nodeID,this.appData.selected.order.orderNo,this.appData.selected.operationNo,this.appData.selected.releasedID.toString(),newStartTimeStamp,newEndTimeStamp);
		if(result.outputCode === 0){
		this.bindOrderDetailsToTable();
		this.oEnterTimeDialog.close();
		this.bindDataToCard();
		sap.oee.ui.Utils.toast(this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE"));
		}
	},
	
	handleCancelTime : function(oEvent){
		sap.ui.core.Fragment.byId("enterDateTimeFragment","okButton2").setEnabled(true);
		sap.ui.core.Fragment.byId("enterDateTimeFragment","inputDate").setValueState(sap.ui.core.ValueState.None);
		sap.ui.core.Fragment.byId("enterDateTimeFragment","inputTime").setValueState(sap.ui.core.ValueState.None);
		this.oEnterTimeDialog.close();
	},
	
	checkIfCurrentShift : function(){
		var currentTime = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(new Date().getTime());
		var shiftStartTimestamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(this.appData.shift.startTimestamp);
		var shiftEndTimestamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(this.appData.shift.endTimestamp);
		if(currentTime >= shiftStartTimestamp && currentTime <= shiftEndTimestamp){
			return true;
		}
		return false;
	},
	
	enableRevertAction :function(){
		var state = this.statusFormatter(sap.oee.ui.oeeConstants.status.NEW);
		this.byId("revert").setText(this.interfaces.oOEEBundle.getText("OEE_BTN_SET_STATE",[state]));
		this.byId("revert").setEnabled(false);
		if(this.checkIfCurrentShift){
			var runs = this.interfaces.interfacesGetActiveRunsForShiftInputWithoutAutoRestartRun(this.appData.shift.shiftID,this.appData.shift.startTimestamp);
			if(runs != undefined){
				for(var i=0; i<runs.length;i++){
					if(runs[i] == this.getView().getViewData().mode){
						this.byId("revert").setEnabled(true);
					}
				}
			}
		}
	},
	
	onPressRevertAction : function(oEvent){
		try{
			var state = this.statusFormatter(sap.oee.ui.oeeConstants.status.NEW);
			var oController = this.getView().getController();
			var allowRevertOrder = function(bConfirm){
				if(bConfirm == sap.m.MessageBox.Action.OK){
					var result = oController.interfaces.interfacesRevertOrderAction(oController.getView().getViewData().mode);
					if(result.status){
						oController.byId("revert").setEnabled(false);
						sap.m.MessageBox.alert(oController.interfaces.oOEEBundle.getText("OEE_MSG_SET_STATE_SUCCESS",[state]));
						oController.appComponent.getEventBus().publish(oController.appComponent.getId(), "clearOrderContext");
						oController.router = oController.appComponent.getRouter();
						oController.router.navTo("activity",{activityId :sap.oee.ui.oeeConstants.defaultWorkerUIActivites.ACTIVITY_ORDER_SELECTION});
					}else{
						sap.m.MessageBox.alert(oController.interfaces.oOEEBundle.getText("OEE_MSG_SET_STATE_FAILED",[state]));
					}
				}else{
					return;
				}
			};
			sap.m.MessageBox.confirm(this.interfaces.oOEEBundle.getText("OEE_MSG_SET_STATE_CONFIRM",[state]),allowRevertOrder);
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,sap.ui.core.MessageType.Error);
		}
	},
	
	enableAbortAction : function(){
		var state = this.statusFormatter(sap.oee.ui.oeeConstants.status.ABORTED);
		this.byId("abort").setText(this.interfaces.oOEEBundle.getText("OEE_BTN_SET_STATE",[state]));
		var outputOrderStatusList = this.interfaces.interfacesGetOrderStatusForListOfRunsInputSync([this.getView().getViewData().mode]);
		if(outputOrderStatusList != undefined && outputOrderStatusList.orderStatusList != undefined && 
				outputOrderStatusList.orderStatusList.results != undefined && outputOrderStatusList.orderStatusList.results.length != 0){
			var status = outputOrderStatusList.orderStatusList.results[0].status;
			if(status == sap.oee.ui.oeeConstants.status.HOLD){
				this.byId("abort").setEnabled(true);
			}else{
				this.byId("abort").setEnabled(false);
			}
		}
			
	},
	
	onPressAbortAction : function(oEvent){
		try{
			
			var oController = this.getView().getController();
			var state = oController.statusFormatter(sap.oee.ui.oeeConstants.status.ABORTED);
			var allowAbortAction = function(bConfirm){
				if(bConfirm == sap.m.MessageBox.Action.OK){
						oController.interfaces.abortProductionRun(oController.getView().getViewData().mode);
						oController.byId("abort").setEnabled(false);
						sap.m.MessageBox.alert(oController.interfaces.oOEEBundle.getText("OEE_MSG_SET_STATE_SUCCESS",[state]));
						oController.router = oController.appComponent.getRouter();
						oController.router.navTo("activity",{activityId :sap.oee.ui.oeeConstants.defaultWorkerUIActivites.ACTIVITY_ORDER_SELECTION});
				}else{
					return;
				}
			};
			sap.m.MessageBox.confirm(this.interfaces.oOEEBundle.getText("OEE_MSG_SET_STATE_CONFIRM",[state]),allowAbortAction);
		}catch(e){
			var state = this.statusFormatter(sap.oee.ui.oeeConstants.status.ABORTED);
			sap.m.MessageBox.alert(oController.interfaces.oOEEBundle.getText("OEE_MSG_SET_STATE_FAILED",[state]));
			sap.oee.ui.Utils.createMessage(e.message,sap.ui.core.MessageType.Error);
		}
		},
		
		statusFormatter : function(obj) {
			  if (!obj) return;
			  for(var statusCounter=0;statusCounter< this.statusList.length;statusCounter++)
			  {
				  if(obj == this.statusList[statusCounter].status)
				  {
					  return this.statusList[statusCounter].description;
				  }
			  }
			  return "";
		},
	
		onExit : function(){
		if(this.oEnterTimeDialog != undefined){
			this.oEnterTimeDialog.destroy();
		}
		},
		
		handleClose : function(oEvent){
			oEvent.getSource().getParent().close();
			
		},
	
		editCrewSize : function(oEvent){
			if(!this.oEnterCrewSizeModel){
			this.oEnterCrewSizeModel =  new sap.ui.model.json.JSONModel();
			}
		
			if(!this.oEnterCrewSizeDialog){
				this.oEnterCrewSizeDialog = sap.ui.xmlfragment("enterCrewSizeFragment","sap.oee.ui.fragments.enterCrewSize",this);
				this.getView().addDependent(this.oEnterCrewSizeDialog);
				this.oEnterCrewSizeDialog.setModel(this.oEnterCrewSizeModel);
			}
		
			this.selectedOrderDetails = oEvent.getSource().getBindingContext().getObject() ;
			this.oEnterCrewSizeModel.setData({crewSize : oEvent.getSource().getBindingContext().getObject().crewSize});
			this.oEnterCrewSizeDialog.setModel(this.oEnterCrewSizeModel);
			this.oEnterCrewSizeDialog.open();
		
		
		},
		
		handleOKCrewSize : function(){
			jQuery.sap.require("sap.ui.core.format.NumberFormat");
    		var floatFormatter= sap.ui.core.format.NumberFormat.getFloatInstance();
			var crewSize = sap.ui.core.Fragment.byId("enterCrewSizeFragment","CrewSizeInput").getValue();
			if(crewSize != ""){
				var value = floatFormatter.parse(crewSize);
				if(isNaN(value) || value < 0) {
					sap.ui.core.Fragment.byId("enterCrewSizeFragment","CrewSizeInput").setValue("");
					sap.oee.ui.Utils.createMessage(this.appComponent.oBundle.getText("OEE_ERR_MSG_CREW_SIZE"),sap.ui.core.MessageType.Error);
					 return;
				}
				crewSize = value;
			}
			else{
				crewSize = parseFloat(0);
			}
			var data ={}	;
			data.orderNumber = 	this.appData.selected.order.orderNo;
			data.operationNumber = this.appData.selected.operationNo ;
			data.plant = this.appData.plant ;
			data.capacityId = this.appData.node.capacityID ;
			data.client = this.appData.client;
			data.workcenterId = this.appData.node.workcenterID ;
			data.nodeId = this.appData.node.nodeID ;
			data.intervalId = this.selectedOrderDetails.intervalId ;
			data.productionActivity = this.selectedOrderDetails.productionActivity;
			data.runId = this.selectedOrderDetails.runId ;
			data.crewSize = crewSize.toString() ;
			data.intervalStartTimestamp = parseFloat(this.selectedOrderDetails.existingTimeInterval.startTimestamp) ;
			data.intervalEndTimestamp = parseFloat(this.selectedOrderDetails.existingTimeInterval.endTimestamp) ;
			data.orderStartTimestamp = parseFloat(this.orderDetails.productionOrderDetails.timeInterval.startTimestamp) ;
			data.orderEndTimestamp = parseFloat(this.orderDetails.productionOrderDetails.timeInterval.endTimestamp) ;
			
			var result = this.interfaces.setCrewSizeOrStartTimeOrEndTimeOfOrderInterval(data);
			
			if(result.outputCode === 0){
				this.oEnterCrewSizeDialog.close();
				this.bindOrderDetailsToTable();
				this.bindDataToCard();
				sap.oee.ui.Utils.toast(this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE"));
			}
				
			
		}
		
		//this.appComponent.getEventBus().unsubscribe(this.appComponent.getId(), "orderChanged", this.bindOrderDetailsToTable, this);
		
	
		
	
     });
    }
  );
  