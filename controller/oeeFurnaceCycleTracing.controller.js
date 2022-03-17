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
        "sap/ui/core/util/Export",
        "sap/ui/core/util/ExportTypeCSV",
        "customActivity/scripts/customStyle"
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
        Export,
        ExportTypeCSV,
        customScript
    ) {
        //"use strict";
        var that;

        return Controller.extend("customActivity.controller.oeeFurnaceCycleTracing", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */

            formatter: formatter,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.appData.intervalState = true;
                this.interfaces = this.appComponent.getODataInterface();


	 var workcenterid = this.appData.node.workcenterID;
            
               var params = { "Param.1": workcenterid };
                var tRunner = new TransactionRunner(
                   "MES/UI/Filmasin/Annealing/getBarcodeQry",
	        params                  
                );
               // tRunner.ExecuteQuery();
	 var oData = tRunner.GetJSONData();
            var oModel = new JSONModel();
            oModel.setData(oData);
	 this.getView().setModel(oModel, "cycleTrackingList");
                this.getBilletList();
                this.modelServices();
		
            },
             onCycleNoSave: function(oEvent){ 
  
	    var table = this.getView().byId("tblFurnaceCycle");
	    if(!table.getSelectedItem()){
		MessageBox.warning("Lütfen değiştirmek istediğiniz Çevrim Numarasını giriniz!");
                  return;
	}
	  
	    var selectedValue =  table.getSelectedItem().mAggregations.cells[0].mProperties.value;
                var selectedItemBarcode = table.getSelectedItem().mAggregations.cells[2].mProperties.text;
	    var params = {"Param.1": selectedValue, "Param.2": selectedItemBarcode, "Param.3": ''};
	     var tRunner = new TransactionRunner(
                   "MES/UI/Filmasin/Annealing/updateCycleNoQry",
	        params                  
                );
                 if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }tRunner.Execute();
	     MessageBox.success( selectedItemBarcode+" Parti numarasına ait Çevrim No güncellendi.");
	},
            callBilletList: function (p_this, p_data) {
	    var tableData = p_data;                
                    var tableCharacteristic = p_data.Rowsets.Rowset[0];
                    var rows = p_data.Rowsets.Rowset[0].Row;
                    var characteristic = [];
                    var tableData = [];
                    var boolean;
                    if(!rows)
                        return null;
                for (var i = 0; i < rows.length; i++) {
                            boolean = true;
                            for (var k = 0; k < tableData.length; k++) {
                              if (rows[i].BARCODE == tableData[k].BARCODE) boolean = false;
                            }
            	
                            if (boolean) tableData.push(rows[i]);
                          }
                          for (i = 0; i < rows.length; i++) {
                            for (k = 0; k < tableData.length; k++) {
                              if (tableData[k].BARCODE == rows[i].BARCODE)
                                tableData[k][rows[i].CHARC] = rows[i].CHARC_VALUE;
                            }
                          }

                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData);
                p_this.getView().setModel(oModel, "cycleTrackingList");
            },

            getBilletList: function (oEvent) {
                var werks = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
	    var client = this.appData.client
                var workcenterid = this.appData.node.workcenterID;
            
               var params = { "Param.1": workcenterid };
                var tRunner = new TransactionRunner(
                   "MES/UI/Filmasin/Annealing/getBarcodeQry",
	        params                  
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletList);
            },

            onConfirmDialog: function () {
                this.handleCancel();
            },
            handleCancel: function () {
                this.appData.oDialog.destroy();
            },

	onSaveEdit: function(oEvent) {
		this.changeBack(oEvent);
		oTable = this.getView().byId("tblFurnaceCycle");
		 var context = oItem.getBindingContext("cycleTrackingList");
    		 var selectedRow = context.oModel.getProperty(context.sPath);
		oIndex = oTable.indexOfItem(oItem);                       


	          var params = {
			"Param.1": selectedRow.CHAR_VALUE,
			 "Param.2": selectedRow.BARCODE,
 			 "Param.3":selectedRow.CONSID};
	         var tRunner = new TransactionRunner(
                   "MES/UI/Filmasin/Annealing/updateCycleNoQry",
	        params                  
                );
                 if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }tRunner.Execute();
	     MessageBox.success(selectedRow.BARCODE +" Parti numarasına ait Çevrim No güncellendi.");
		
	},
	
	onCancelEdit: function(oEvent){
		this.changeBack(oEvent);
	}, 
	
	changeBack: function(oEvent) {
		var oItem = oEvent.getSource().getParent();
		oModel = this.getView().getModel("cycleTrackingList");
		oModel.setProperty("/oIndex", undefined);
		this.onPress(oItem, false);
	},
   
            modelServices: function () {
                var self = this;
                this.intervalHandle = setInterval(function () {
                    if (window.location.hash == "#/activity/ZACT_BILLET_MNTR")
                        if (self.appData.intervalState == true) {
                            self.getBilletList();
                            self.callGetAlertList();
                        }
                    console.log(1);
                }, 10000);
            },
 	onEdit: function(oEvent) {
		oItem = oEvent.getSource();
		oTable = this.getView().byId("tblFurnaceCycle");
		 var context = oItem.getBindingContext("cycleTrackingList");
    		 var selectedItem = context.oModel.getProperty(context.sPath);
		oIndex = oTable.indexOfItem(oItem);
		oModel = this.getView().getModel("cycleTrackingList");
		oFlag = oModel.getProperty("/oIndex");
		if (oFlag === undefined) {
			oModel.setProperty("/oIndex", oIndex);
			this.onPress(oItem, true);
		} else {
		  jQuery.sap.require("sap.m.MessageBox");
			sap.m.MessageBox.confirm("Önce seçili değeri kaydet!", {
				title: "Confirm",
				onClose: function(btn){
					if(btn === "OK") {
						//POST
						var oPreviousItem = oTable.getItems()[oFlag];
						that.onPress(oPreviousItem, false);
						var oCurrentItem = oTable.getItems()[oIndex];
						that.onPress(oCurrentItem, true);
						oModel.setProperty("/oIndex", oIndex);
					}
				}
			});
		}
	},
	onPress: function(oItem, oFlag) {
		oItem.getDetailControl().setVisible(!oFlag);
		var oCells = oItem.getCells();
		$(oCells).each(function(i) {
			var oCell = oCells[i];
			if(oCell instanceof sap.m.Input) {
				oCell.setEditable(oFlag);
			}else if(oCell instanceof sap.m.Button) {
				oCell.setVisible(oFlag);                      
			}
		});
	},
        
            onExit: function () {
                this.appComponent
                    .getEventBus()
                    .unsubscribe(
                        this.appComponent.getId(),
                        "orderChanged",
                        this.refreshReported,
                        this
                    );
                if (this.intervalHandle) clearInterval(this.intervalHandle);
            },
        });
    }
);
