sap.ui.define(
	[
	  "sap/m/MessageBox",
	  "sap/ui/core/mvc/Controller",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageToast",
	  "customActivity/scripts/transactionCaller",
	  "sap/ui/core/Fragment",
	  "sap/m/Dialog",
	  "sap/m/Text",
	  "sap/m/TextArea",
	  "sap/m/Button",
	  "sap/ui/model/Filter",
	  "sap/ui/model/FilterOperator",
	  "sap/ui/export/library",
	  "sap/ui/export/Spreadsheet",
	],
  
	function (
	  MessageBox,
	  Controller,
	  JSONModel,
	  MessageToast,
	  TransactionCaller,
	  Fragment,
	  Dialog,
	  Text,
	  TextArea,
	  Button,
	  Filter,
	  FilterOperator,
	  exportLibrary,
	  Spreadsheet
	) {
	  "use strict";
	  var that;
	  var intervalState=1;
	  var jsonDataForPriorityChange;
	  var EdmType = exportLibrary.EdmType;
	  return Controller.extend(
		"customActivity.controller.uretimDegisim",
  
		{
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
			that = this;
			jsonDataForPriorityChange = [];
			// this.router = sap.ui.core.UIComponent.getRouterFor(this);
			// this.router.attachRouteMatched(this._fnRouteMatched, this);
			//  this.router = new sap.ui.core.routing.Router(this);
  
			this.appComponent = this.getView().getViewData().appComponent;
			this.appData = this.appComponent.getAppGlobalData();
  
			this.interfaces = this.appComponent.getODataInterface();
			this.appComponent = this.getView().getViewData().appComponent;
			this.appData = this.appComponent.getAppGlobalData();
			this.interfaces = this.appComponent.getODataInterface();
		   this.appData.intervalState=1;
			this.getMessageModel();
		   this.modelServices();
		   this.haschange();
  
  
		  },
		  handleChange1: function (oEvent) {
			var oText = this.getView().byId("DateTimePicker1"),
			  sValue = oEvent.getParameter("value");
  
			oText.setValue(sValue);
		  },
  
		  handleChange2: function (oEvent) {
			var oText = this.getView().byId("DateTimePicker2"),
			  sValue = oEvent.getParameter("value");
  
			oText.setValue(sValue);
		  },
  
		  handleFChange1: function (oEvent) {
			var oText = sap.ui.core.Fragment.byId("updatestonedata", "DTP1");
			var sValue = oEvent.getParameter("value");
  
			oText.setValue(sValue);
		  },
  
		  handleFChange2: function (oEvent) {
			var oText = sap.ui.core.Fragment.byId("updatestonedata", "DTP2");
			var sValue = oEvent.getParameter("value");
  
			oText.setValue(sValue);
		  },
		  openTasFrag: function () {
			this.appData.intervalState=0;
			var secili = this.getView()
			  .byId("idOrdersTable")
			  .getSelectedContextPaths().length;
			if (secili > 2) {
			  MessageBox.error("Aralık seçimi  İki satırdan büyük olamaz");
			  return;
			}
			if (secili < 1) {
			  MessageBox.error("En az bir satır seçiniz");
			  return;
			}
			if (!this.createNotificationFragment) {
			  this.createNotificationFragment = sap.ui.xmlfragment(
				"updatestonedata",
				"customActivity.fragmentView.updatestonedata",
				this
			  );
			  this.getView().addDependent(this.createNotificationFragment);
			}
  
			this.createNotificationFragment.open();
		  },
  
		  openTasFragCancel: function () {
			this.createNotificationFragment.close();
			
		  },
  
		  getMessageModel: function () {
			  if(this.getView().byId("DateTimePicker1")?.getValue()?.length<2||this.getView().byId("DateTimePicker2")?.getValue()?.length<2){
			var date1 = new Date().toISOString().split('T')[0] + " " + "00" + ":" +"00"       
			var hour = '' + new Date().getHours();
			if (hour.length < 2) {
				hour = "0" + hour;
			}
			var dakika = '' + new Date().getMinutes()
			if (dakika.length < 2) {
				dakika = "0" + dakika;
			}
			var date2 = new Date().toISOString().split('T')[0] + " " + hour + ":" + dakika
		  
		}
		else{
			var date1 = this.getView().byId("DateTimePicker1").getValue();
			var date2 = this.getView().byId("DateTimePicker2").getValue();
		  
		}
			var response = TransactionCaller.sync(
			  "MES/Itelli/TAS/TAS_GUNCELLEME/T_tasliUretimler",
			  {
				I_DATE1: date1,
				I_DATE2: date2,
			  },
			  "O_JSON"
			);
			var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row)
			  ? response[0].Rowsets.Rowset.Row
			  : new Array(response[0].Rowsets.Rowset.Row);
			var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
			tableModel.setSizeLimit("15000");
  
			this.getView().byId("idOrdersTable").setModel(tableModel);
			this.getView().byId("idOrdersTable").getModel().refresh();
			this.appData.intervalState=1;
			return tableModel;
			
		 
			
			
			
		  },
  
		  getMessageModelSetsiz: function () {
			if(this.getView().byId("DateTimePicker1")?.getValue()?.length<2||this.getView().byId("DateTimePicker2")?.getValue()?.length<2){
		  var date1 = new Date().toISOString().split('T')[0] + " " + "00" + ":" +"00"       
		  var hour = '' + new Date().getHours();
		  if (hour.length < 2) {
			  hour = "0" + hour;
		  }
		  var dakika = '' + new Date().getMinutes()
		  if (dakika.length < 2) {
			  dakika = "0" + dakika;
		  }
		  var date2 = new Date().toISOString().split('T')[0] + " " + hour + ":" + dakika
		
	  }
	  else{
		  var date1 = this.getView().byId("DateTimePicker1").getValue();
		  var date2 = this.getView().byId("DateTimePicker2").getValue();
		
	  }
		  var response = TransactionCaller.sync(
			"MES/Itelli/TAS/TAS_GUNCELLEME/T_tasliUretimler",
			{
			  I_DATE1: date1,
			  I_DATE2: date2,
			},
			"O_JSON"
		  );
		  var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row)
			? response[0].Rowsets.Rowset.Row
			: new Array(response[0].Rowsets.Rowset.Row);
		  var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
		  tableModel.setSizeLimit("15000");
  
		  this.appData.intervalState=1;
		  return tableModel;
		  
	   
		  
		  
		  
		},
  
  
		  guncelle: function () {
			var secili = this.getView()
			.byId("idOrdersTable")
			.getSelectedContextPaths().length;
			
  
			if (secili == 2) {
			  var frstindex = Number(
				this.getView()
				  .byId("idOrdersTable")
				  .getSelectedContextPaths()[0]
				  .split("/")[1]
			  );
			  var scndindex = Number(
				this.getView()
				  .byId("idOrdersTable")
				  .getSelectedContextPaths()[1]
				  ?.split("/")[1]);

				  if(frstindex>=scndindex){
                   var tmp;
                    tmp = frstindex;
                    frstindex = scndindex;
					scndindex = tmp;
				  }
				  scndindex=scndindex+1;
			  
			  var array = [];
  
			  for (var i = frstindex; i < scndindex; i++) {
				var IDS = this.getView().byId("idOrdersTable").getModel().oData[i].ID;
				array.push(IDS);
			  }
			  var IDList = array.toString().replace('"', "");
  
			  var stonecode = sap.ui.core.Fragment.byId(
				"updatestonedata",
				"stonecode"
			  ).getValue();
			  var mensei = sap.ui.core.Fragment.byId(
				"updatestonedata",
				"mensei"
			  ).getValue();
			  var model = sap.ui.core.Fragment.byId(
				"updatestonedata",
				"stonemodel"
			  ).getValue();
  
			  TransactionCaller.async(
				"MES/Itelli/TAS/TAS_GUNCELLEME/updateManuByStone",
				{
				  I_IDLIST: IDList,
				  I_MENSEI: mensei,
				  I_MODEL: model,
				  I_STONE_CODE: stonecode,
				},
				"O_JSON",
				this.sonucCB,
				this
			  );
			}
  
			if (secili == 1) {
  
			  var frstindex = Number(
				this.getView()
				  .byId("idOrdersTable")
				  .getSelectedContextPaths()[0]
				  .split("/")[1]
			  );
			  var IDList = this.getView().byId("idOrdersTable").getModel().oData[frstindex].ID;
			  
			  var stonecode = sap.ui.core.Fragment.byId(
				"updatestonedata",
				"stonecode"
			  ).getValue();
			  var mensei = sap.ui.core.Fragment.byId(
				"updatestonedata",
				"mensei"
			  ).getValue();
			  var model = sap.ui.core.Fragment.byId(
				"updatestonedata",
				"stonemodel"
			  ).getValue();
  
			  TransactionCaller.async(
				"MES/Itelli/TAS/TAS_GUNCELLEME/updateManuByStone",
				{
				  I_IDLIST: IDList,
				  I_MENSEI: mensei,
				  I_MODEL: model,
				  I_STONE_CODE: stonecode,
				},
				"O_JSON",
				this.sonucCB,
				this
			  );
			
			  
  
  
  
			}
		  },
  
		  
  
		  sonucCB: function (iv_data, iv_scope) {
			if (iv_data[1] == "S") {
			  iv_scope.openTasFragCancel();
			  MessageBox.information("Veriler Başarılı bir şekilde kayıt edildi");
			} else {
			  MessageBox.error(iv_data[0]);
			}
			iv_scope.getMessageModel();
		  },
  
	
		  filtreleStone: function () {
			if (this.appData.intervalState==0) {
			  return;
			}
			var stoneModel= this.getMessageModelSetsiz();
			if(stoneModel.oData.length<2){
				 return;
			}
			 var rowNumber= stoneModel.oData.length
			 var stones= [];
	   
			 
  
			 for (var i = 0; i < rowNumber; i++) {
			  var stone = stoneModel.oData[i]?.STONE_CODE;
	
			  if(!(stones.includes(stone)))
			  {
  
				  stones.push(stone);
			  }
  
			   }
  
  
			  
	
  
			
			   stoneModel.oData.length = stones.length;
			   for(var i=0; i<stones.length; i++){
				  stoneModel.oData[i].STONE_CODE=stones[i]
			   }
			   this.getView().byId("kod").setModel(stoneModel);
  
  
		 
			  
		  },
  
		  
  
  
		  filtreleMensei: function () {
			if (this.appData.intervalState==0) {
			  return;
			}
			var menseiModel =this.getMessageModelSetsiz();
			if(menseiModel.oData.length<2){
			  return;
		 }
			var rowNumber= menseiModel.oData.length
		  
			var menseis= [];
		 
  
  
			for (var i = 0; i < rowNumber; i++) {
  
			 var mensei = menseiModel.oData[i]?.MENSEI;
  
  
			 if(!(menseis.includes(mensei)))
			 {
  
				 menseis.push(mensei);
			 }
  
  
			  }
  
  
			  
  
  
			  menseiModel.oData.length = menseis.length;
			  for(var i=0; i<menseis.length; i++){
				 menseiModel.oData[i].MENSEI=menseis[i]
			  }
			  this.getView().byId("mensei").setModel(menseiModel);
			},
  
			filtreleModel: function () {
			  if (this.appData.intervalState==0) {
				return;
			  }
  
				var modelModel =this.getMessageModelSetsiz();
				if(modelModel.oData.length<2){
				  return;
			 }
				var rowNumber= modelModel.oData.length
			
				var models = [];
	 
	 
				for (var i = 0; i < rowNumber; i++) {
			
				 var model =  modelModel.oData[i]?.MODEL;
				
	 
				 if(!(models.includes(model)))
				 
				   models.push(model);
	 
				  }
	 
	 
  
   
				  modelModel.oData.length = models.length;
				  for(var i=0; i<models.length; i++){
					 modelModel.oData[i].MODEL=models[i]
				  }
				  this.getView().byId("model").setModel(modelModel);
				},
  
  
				modelServices: function () {
				  
				  if (this.appData.intervalState==1) {
			   var oTrigger = new sap.ui.core.IntervalTrigger(3000);
				  oTrigger.addListener(() => {
					if (this.appData.intervalState==0){
  
						return;
					  }
					this.filtreleStone();
					this.filtreleModel();
					this.filtreleMensei();
  
					 
	
				  }, this);
				}
				
			  },
  
			  haschange:function(){
				window.onhashchange=function(){
					 if(window.location.href.includes("Z_uretimDegisim"))
				  {
					  
					}
					   else{
						  clearInterval(this.intervalHandle);
						  clearInterval(that.intervalHandle);
						  clearInterval(self.intervalHandle);
								 }
								  };
				  },
  
  
				  selectChange:function(){
					this.appData.intervalState=0;
  
  
				  },
  
				 
	  
  
				  onSearchSC(oEvent) {
					
					var stone_code= this.getView().byId("kod").getSelectedKey()
					 
					 this.setFilterSC(stone_code);
				 },
				 setFilterSC: function (stone_code) {
					
				
					 var gModel = this.getMessageModelSetsiz();
					 
					 var filtCounter;
					 var characteristic = gModel.getData();
					 var filteredCharacteristic = [];
					 filtCounter = 0;
  
					 if (stone_code != "") {
						 for (var j = 0; j < characteristic.length; j++) {
							 if (characteristic[j].STONE_CODE == stone_code) {
								 filteredCharacteristic[filtCounter] = characteristic[j];
								 filtCounter++;
							 }
						 }
					 }
					 filtCounter = 0;
					
  
					 var oModel = new sap.ui.model.json.JSONModel();
					 oModel.setData(filteredCharacteristic);
					
						 this.getView().byId("idOrdersTable").setModel(oModel);
						 this.appData.intervalState=0;
						 
  
				 },
  
  
				 onSearchMens(oEvent) {
				  var mensei= this.getView().byId("mensei").getSelectedKey()
				   
				   this.setFilterSMens(mensei);
			   },
			   setFilterSMens: function (mensei) {
				  
			  
				   var gModel = this.getMessageModelSetsiz();
				   
				   var filtCounter;
				   var characteristic = gModel.getData();
				   var filteredCharacteristic = [];
				   filtCounter = 0;
  
				   if (mensei != "") {
					   for (var j = 0; j < characteristic.length; j++) {
						   if (characteristic[j].MENSEI == mensei) {
							   filteredCharacteristic[filtCounter] = characteristic[j];
							   filtCounter++;
						   }
					   }
				   }
				   filtCounter = 0;
				  
  
				   var oModel = new sap.ui.model.json.JSONModel();
				   oModel.setData(filteredCharacteristic);
				  
					   this.getView().byId("idOrdersTable").setModel(oModel);
					   this.appData.intervalState=0;
					   
  
			   },
  
			   onSearchModel(oEvent) {
				var model= this.getView().byId("model").getSelectedKey()
				 
				 this.setFilterModel(model);
			 },
			 setFilterModel: function (model) {
				
			
				 var gModel = this.getMessageModelSetsiz();
				 
				 var filtCounter;
				 var characteristic = gModel.getData();
				 var filteredCharacteristic = [];
				 filtCounter = 0;
  
				 if (model != "") {
					 for (var j = 0; j < characteristic.length; j++) {
						 if (characteristic[j].MODEL == model) {
							 filteredCharacteristic[filtCounter] = characteristic[j];
							 filtCounter++;
						 }
					 }
				 }
				 filtCounter = 0;
				
  
				 var oModel = new sap.ui.model.json.JSONModel();
				 oModel.setData(filteredCharacteristic);
				
					 this.getView().byId("idOrdersTable").setModel(oModel);
					 this.appData.intervalState=0;
					 
  
			 },
  
  
  
  
  
  
  
  
		}
	  );
	}
  );
  