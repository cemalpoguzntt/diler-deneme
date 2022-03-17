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
		"sap/m/MessageBox",
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
		customStyle,
		FilterType,
		TransactionCaller,
		MessageBox,
		MessageToast
	) {
		var interval;
		var that;
		var activeOrderData = {};
        
		return Controller.extend(
			"customActivity/controller/oeeReportComponentsTAS",
			{
				goodQuantityDataCollection: undefined,
				dataCollectionElements: undefined,
				rawMaterialDataCollectionElements: undefined,
				dataCollectionElementKeys: undefined,
				reportedProductionData: undefined,
				STANDALONE: "STANDALONE",
				YIELD_BASED_CONSUMPTION: "YIELD_BASED_CONSUMPTION",
				key: undefined,
				rawMaterialData: undefined,
				selectedRawMaterialDCEIndex: undefined,
				rawMaterialsReportingModel: undefined,
				rawMaterialDataCollection: undefined,
				visibilitySpecificData: undefined,

				onInit: function () {
                    that = this;
					this.appComponent = this.getView().getViewData().appComponent;
					this.appData = this.appComponent.getAppGlobalData();
					this.interfaces = this.appComponent.getODataInterface();
					this.modelData();
					this.modelData2();
                    this.getView().byId("idBatch").setValue(null);
                    focusInterval = setInterval( that.inputSetFocus, 1000);
                    this.haschange() ;
                    this.getView().byId("pickerx").setValue(this.time());

					
				
                   
                  
                    
				},

                haschange : function () {

                    window.onhashchange = function (){
                        
                        

                        if(!!window.location.href.includes("ZACT_REPORT_PROD_TAS")){
                            
                        }
                        else{
                            clearInterval(focusInterval);                
                        }
                        
                    };


                },

 
				 datePickerInterval:function(){
					clearInterval(focusInterval);

				 },
				 dateChange:function(){
					focusInterval = setInterval( that.inputSetFocus, 1000);

				 },




            inputSetFocus : function () {
                console.log("Taşlama interval");
                if (!!that.getView().byId("box3")?.getVisible()) {


                if(!(!!that.getView().byId("idBatch"))){
                    clearInterval(focusInterval);
                    return;
                }
                that.getView().byId("idBatch").focus();
            
            }
            else{

                if(!(!!that.getView().byId("idBatch2"))){
                    clearInterval(focusInterval);
                    return;
                }
                that.getView().byId("idBatch2").focus();
            }

            /* this.object.addEventListener("hashchange", stopHC); */

            },
               

              


              


				onPressChangeType: function () {
                    
					var isConsVisible = this.getView().byId("box3").getVisible();

					if (isConsVisible) {
						this.getView().byId("box3").setVisible(false);
						this.getView().byId("box4").setVisible(true);
						this.getView().byId("labelCons").setVisible(false);
						this.getView().byId("labelProd").setVisible(true);
						this.getView().byId("labelx").setVisible(true);
						this.getView().byId("pickerx").setVisible(true);

                        setTimeout(() => {

                            document.getElementById(this.getView().byId("pickerx").sId)?.addEventListener("click",function(){

                                that.datePickerInterval();
                            });
    
                            
                        }, 1000);

                      
                       
					} else {
						this.getView().byId("box3").setVisible(true);
						this.getView().byId("box4").setVisible(false);
						this.getView().byId("labelCons").setVisible(true);
						this.getView().byId("labelProd").setVisible(false);
						this.getView().byId("labelx").setVisible(false);
						this.getView().byId("pickerx").setVisible(false);
                        
                   
					}
					this.modelData();
					this.modelData2();
				},
				onDeleteKTK: function (oEvent) {
					this.byId("box1").setBusy(true);
					var bindingObject = oEvent.oSource.getBindingContext().getObject();
                    var id = bindingObject.ID;
					TransactionCaller.async(
						"MES/Itelli/TAS/T_DELETE_TAS_KTK",
						{
							I_KTKID: id
						},
						"O_JSON",
						this.onDeleteKTKCB,
						this
					);
				},
				onDeleteKTKCB: function (iv_data, iv_scope) {
					if (iv_data[1] == "S") {
						MessageToast.show("Kütük Silindi");
						iv_scope.byId("box1").setBusy(false);
						iv_scope.modelData();
						iv_scope.modelData2();
					}

					if (iv_data[1] == "E") {
						MessageBox.error("İşlem Başarısız");
						iv_scope.byId("box1").setBusy(false);

						return;
					}
				},

				onSubmitBatch: function () {

                    

					var inputValue = this.getView().byId("idBatch").getValue();
					var aufnr = this.appData.selected.order.orderNo;
					this.getView().byId("idBatch").setValue("");

					var user = this.appData.user.userID;
					this.byId("box1").setBusy(true);
					var response = TransactionCaller.async(
						"MES/Itelli/TAS/T_PARSE_QR_VALUE",
						{
                           
							I_AUFNR: aufnr,
							I_QRVALUE: inputValue,
							I_USER: user,
						},
						"O_JSON",
						this.onSubmitBatchCB,
						this
					);
                   
                    
                    
				},

				plannedPiece : function () {

					var response = TransactionCaller.sync(
						"MES/Itelli/TAS/T_PADET",
						{},
						"O_JSON"
					);
					var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
				
					var qq = tableModel?.oData[0]?.PLANADET ;

					return qq 



				},

				onSubmitBatchCB: function (iv_data, iv_scope) {
					if (iv_data[1] == "S") {
						MessageBox.information("Kayıt Başarılı");
						iv_scope.byId("box1").setBusy(false);
						iv_scope.modelData();
					    iv_scope.modelData2();
					}

					if (iv_data[1] == "E") {
						MessageBox.error(iv_data[0]);
						iv_scope.byId("box1").setBusy(false);

						iv_scope.getView().byId("idBatch").setValue("");
					}
				},

				modelData: function () {
					var aufnr = this.appData.selected.order.orderNo;

					


					if (!!aufnr) {
						var response = TransactionCaller.sync(
							"MES/Itelli/TAS/T_GET_MODELDATA_TAS",
							{
								I_AUFNR: aufnr,
							},
							"O_JSON"
						);

						response[0].Rowsets.Rowset.Row = Array.isArray(
							response[0].Rowsets?.Rowset.Row
						)
							? response[0].Rowsets.Rowset.Row
							: new Array(response[0].Rowsets.Rowset.Row);
						var tableModel = new sap.ui.model.json.JSONModel();
						tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
					
						this.getView().byId("componentsTable").setModel(tableModel);
						this.getView().byId("componentsTable").getModel().refresh();
					} else {
						MessageBox.error("Hatta Aktif Sipariş Bulunmamaktadır.");
						return;
					}
				},

				modelData2: function () {
					var aufnr = this.appData.selected.order.orderNo;
					var node_id = this.appData.node.nodeID;
					var planadet = this.plannedPiece();
					if (planadet === undefined){
						planadet = "0";
					}

					if (!!aufnr) {
						var response = TransactionCaller.sync(
							"MES/Itelli/TAS/T_GET_TASLAMA_ACT_ORDER",
							{
								I_NODEID: node_id,
							},
							"O_JSON"
						);

						response[0].Rowsets.Rowset.Row = Array.isArray(
							response[0].Rowsets?.Rowset.Row
						)
							? response[0].Rowsets.Rowset.Row
							: new Array(response[0].Rowsets.Rowset.Row);
						var tableModel = new sap.ui.model.json.JSONModel();
						tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
						tableModel.oData[0].PLANADET = planadet ;
						this.getView().byId("tableOrderInfo").setModel(tableModel);
						this.getView().byId("tableOrderInfo").getModel().refresh();

                        this.getView().byId("aufnr").setText(response[0]?.Rowsets?.Rowset?.Row[0].AUFNR);
					} else {
						MessageBox.error("Hatta Aktif Sipariş Bulunmamaktadır.");

						return;
					}
				},

                time: function () {
                    var day1 = new Date().getDate();
                    var month1 = new Date().getMonth() + 1;
                    var fullyear1 = new Date().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                },

				onSubmitConfirm: function () {

                    var day1 = this.getView().byId("pickerx").getDateValue().getDate(); 
                    var month1 = this.getView().byId("pickerx").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("pickerx").getDateValue().getFullYear();
                    var chosenDate = fullyear1 + "-" + month1 + "-" + day1;

                    var today=this.time();

                    if(today!=chosenDate){
                     
                       var a=  confirm("Tarih bugüne ayarlı değil. Devam etmek istiyor musunuz?");
                       if(!a)
                       {
                           return;
                    }
                    }
					var aufnr = this.appData.selected.order.orderNo;
					var nodeID = this.appData.node.nodeID;
					var inputValue = this.getView().byId("idBatch2").getValue();

					var response = TransactionCaller.sync(
						"MES/Itelli/TAS/T_CALL_TASLAMA_CONF_DATA",
						{
                            I_DATE:chosenDate,
							I_AUFNR: aufnr,
							I_NODEID: nodeID,
							I_BARCODE: inputValue,
						},
						"O_JSON"
					);

					if (response[1] == "S") {
						MessageBox.information("Kayıt Başarılı");

						this.getView().byId("idBatch2").setValue("");
						this.modelData();
					    this.modelData2();
					}

					if (response[1] == "E") {
						MessageBox.error(response[0]);

						this.getView().byId("idBatch2").setValue("");
					}
                
				},
                openfragment: function () {
                    if (!this._oDialog1) {
                      this._oDialog1 = sap.ui.xmlfragment(
                        "uretimTaslama",
                        "customActivity.fragmentView.uretimTaslama",
                        this
                      );
                      this.getView().addDependent(this._oDialog1);
                    }
                    this._oDialog1.open();
                    this.UretimAyrinti();
                  },
          
          
          onCancelFrag1: function () {
                    this._oDialog1.close();
                  },

            UretimAyrinti: function () {
                aufnr=this.getView().byId("aufnr").getText();
                    TransactionCaller.async(
                        "MES/Itelli/FLM_CANFRN/uretimParti/uretimPartiTrns",
                        {
                          I_AUFNR:aufnr
                        },
                        "O_JSON",
                     this.UretimAyrintiCB,
                        this
                    );
                },
                UretimAyrintiCB: function (iv_data, iv_scope) {
                
                        var ObjArr = Array.isArray(iv_data[0].Rowsets.Rowset.Row)
                   ? iv_data[0].Rowsets.Rowset.Row
                 : new Array(iv_data[0].Rowsets.Rowset.Row);
                 var myModel = new sap.ui.model.json.JSONModel(ObjArr);
                 

                        sap.ui.core.Fragment.byId("uretimTaslama", "uretimTaslamaT").setModel(myModel)
                       
    
                },
    
          
			}
		);
	}
);
