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
        
	    'sap/ui/core/library',
	    "sap/ui/core/Core",
        "customActivity/scripts/customStyle",
               
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
        coreLibrary,
         Core  ,
        customStyle,
    ) {
		"use strict";
		var that;
		var jsonDataForPriorityChange;
		return Controller.extend(
			"customActivity.controller.compileData",

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

				
					this.cGroupCB1();
                    this.table1select();
                    this.table2select();
					
				},


				cGroupCB1 : function (){

					var response = TransactionCaller.sync(
                        "MES/Itelli/PM_SCREEN/Data_Gathering/ComboBox_Items/T_CGROUP_CB1",
                        {},
                        "O_JSON"
                    ); // distinct komutlu transaction sonucu geliyor.

                    var tableModel2 = new sap.ui.model.json.JSONModel(); // json modelinde bir değişken yaratı
                    tableModel2.setData(response[0]?.Rowsets?.Rowset?.Row); //içinde data set ediliyor
                    this.getView().byId("getPlant1").setModel(tableModel2); 
					this.getView().byId("getPlant2").setModel(tableModel2); 


                    var response1 = TransactionCaller.sync(
                        "MES/Itelli/PM_SCREEN/compileData/T_SELECT_OLCU",
                        {},
                        "O_JSON"
                    ); // distinct komutlu transaction sonucu geliyor.

                    var tableModel2 = new sap.ui.model.json.JSONModel(); // json modelinde bir değişken yaratı
                    tableModel2.setData(response1[0]?.Rowsets?.Rowset?.Row); //içinde data set ediliyor
                    this.getView().byId("getOlcu").setModel(tableModel2); 
					this.getView().byId("getOlcu").setModel(tableModel2); 


				},

                wCenterCB2 : function () {

					var plant = this.getView().byId("getPlant2").getSelectedKey();

					var response = TransactionCaller.sync(
                        "MES/Itelli/PM_SCREEN/compileData/T_COUNTER_SELECT",
                        {
							I_PLANT : plant
						},
                        "O_JSON"
                    ); // distinct komutlu transaction sonucu geliyor.
                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel2 = new sap.ui.model.json.JSONModel(modelArr); // json modelinde bir değişken yaratı
                     //içinde data set ediliyor
                    this.getView().byId("getPPworkCenter2").setModel(tableModel2); 


				},

			


				//insert fonksiyonu1
                save1: function () {

                    var q = "switch1" ;
					var NotifiedUser = this.appData.user.userID;
                    var getPlant1 = this.getView().byId("getPlant1").getSelectedKey();
					var sayacadi = (this.getView().byId("input1").getValue()).trim();
                    var olcu = this.getView().byId("getOlcu").getSelectedKey();

					if ( getPlant1 === "" || sayacadi === "" || olcu === "") {

						MessageToast.show("Lütfen tüm alanları doldurunuz.");
						return;


					}


					var response = TransactionCaller.sync(
						"MES/Itelli/PM_SCREEN/compileData/T_compileData_INS",
						{
							I_NotifiedUser: NotifiedUser,
							I_getPlant1: getPlant1,
                            I_sayacadi: sayacadi,
							I_q: q, 
                            I_OLCU : olcu,
							
						},
						"O_JSON"
					);

					if (response[1] == "E") {
						alert(response[0]);
					} else {
						/* this.createNotificationCancel(); */
	
						MessageBox.information("Bilgiler başarılı bir şekilde kaydedildi.");
					}

					this.getView().byId("input1").setValue("");
					this.getView().byId("getPlant1").setSelectedKey("");
                    this.getView().byId("getOlcu").setSelectedKey("");
                    this.getView().byId("getOlcu").setValue("");
					

					this.table1select();
                    this.table2select();
					

                    

				},


				//insert fonksiyonu1
				save2: function() {

					var q = "switch2" ;
					var NotifiedUser = this.appData.user.userID;
					var getPlant2 = this.getView().byId("getPlant2").getSelectedKey();
					var getPPworkCenter2 = this.getView().byId("getPPworkCenter2").getSelectedKey();
					var idexp = this.getView().byId("input12").getValue();


					if ( getPlant2 === "" || getPPworkCenter2 === "" || idexp === "" ) {

						MessageToast.show("Lütfen tüm alanları doldurunuz.");
						return;


					}

					var response = TransactionCaller.sync(
						"MES/Itelli/PM_SCREEN/compileData/T_compileData_INS",
						{
							I_NotifiedUser: NotifiedUser,
							I_getPlant2: getPlant2,
							I_getPPworkCenter2: getPPworkCenter2,
							I_idexp : idexp,
							I_q: q, 
							
						},
						"O_JSON"
					);

					if (response[1] == "E") {
						alert(response[0]);
					} else {
						/* this.createNotificationCancel(); */
	
						MessageBox.information("Bilgiler başarılı bir şekilde kaydedildi.");
					}

					this.getView().byId("input12").setSelectedKey("");
					this.getView().byId("getPlant2").setSelectedKey("");
					this.getView().byId("getPPworkCenter2").setSelectedKey("");

					this.table2select();
                    this.table1select();
					

					




				},


				table1select : function() {


					var response = TransactionCaller.sync(
						"MES/Itelli/PM_SCREEN/compileData/T_SELECT_compileData1",
	
						{
								
						},
						"O_JSON"
					);
					var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArr);
					this.getView().byId("WPCodeGroup").setModel(tableModel);
						
					this.getView().byId("WPCodeGroup").getModel().refresh();
				},


				table2select : function() {


					var response = TransactionCaller.sync(
						"MES/Itelli/PM_SCREEN/compileData/T_SELECT_compileData2",
	
						{
								
						},
						"O_JSON"
					);
					var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArr);
					this.getView().byId("PmWorkCenter").setModel(tableModel);
						
					this.getView().byId("PmWorkCenter").getModel().refresh();
				},

				delete1 : function () {
					var selected = this.getView().byId("WPCodeGroup").getSelectedIndex();
					if (selected === -1) {
						MessageToast.show("Lütfen tablodan satır seçiniz");
						return;
					}

                    var cevap = confirm("Bu satırı silmek istediğinize emin misiniz?");

                    if (cevap === true) {
				   
					var tableData = this.getView().byId("WPCodeGroup").getModel().getData();
									  
							var a = tableData[selected];                       
							var idkey = a.ID ;
	
							var response = TransactionCaller.sync(
								"MES/Itelli/PM_SCREEN/compileData/T_compileData_DELETE1",
								{
									I_ID : idkey
								},
	
								"O_JSON"
																
							);
	
										  
	
						MessageBox.information("Veriler Başarılı bir şekilde silindi");

						
						this.getView().byId("getPlant1").setSelectedKey("");
                        this.getView().byId("input1").setSelectedKey("");

						
					
						
						this.table2select(); 
                        this.table1select(); 
                        
                    }

				},

				delete2 : function () {

					var selected = this.getView().byId("PmWorkCenter").getSelectedIndex();
					if (selected === -1) {
						MessageToast.show("Lütfen tablodan satır seçiniz");
						return;
					}


                    var cevap = confirm("Bu satırı silmek istediğinize emin misiniz?");

                    if (cevap === true) {
				   
					var tableData = this.getView().byId("PmWorkCenter").getModel().getData();
									  
							var a = tableData[selected];                       
							var idkey = a.ID ;
	
							var response = TransactionCaller.sync(
								"MES/Itelli/PM_SCREEN/compileData/T_compileData_DELETE2",
								{
									I_ID : idkey
								},
	
								"O_JSON"
																
							);
	
										  
	
						MessageBox.information("Veriler Başarılı bir şekilde silindi");

						this.getView().byId("input12").setValue("");
						this.getView().byId("getPlant2").setSelectedKey("");
                        this.getView().byId("getPPworkCenter2").setSelectedKey("");


                       
						
					
						this.table2select(); 
                        this.table1select();  

                            }

				},
				

				
			});
	}
);