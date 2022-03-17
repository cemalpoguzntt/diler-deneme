sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "customActivity/scripts/custom",
    "customActivity/scripts/customStyle",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType"
  ],

  function (
    Controller,
    JSONModel,
    MessageBox,
    customScripts,
    customStyle,
    formatter,
    Filter,
    FilterOperator,
    FilterType,
     customStyle
  ) {
    //"use strict";
    var that;

    return Controller.extend(
      "customActivity.controller.oeeRodScreen",
      {

        onInit: function () {
       // appData burada tanımlanıyor.
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.interfaces = this.appComponent.getODataInterface();
          this.getTableList();
        },
        getTableList: function(){
	// sorguda kullanacağımız değişken değerlerini alalım.
	var werks = this.appData.plant;
	var aufnr = this.appData.selected.order.orderNo;
 	var workcenterId = this.appData.node.workcenterID; 
	var params= {
	"Param.1":werks,
	"Param.2":workcenterId
	};
	var tRunner=new TransactionRunner("MES/UI/ScrapPreparation_v1/getRodDetailsQry", params);
	tRunner.ExecuteQueryAsync(this, this.callTableList);
         },
         callTableList:function(p_this, p_data){
	var tableData = p_data;
	var oModel = new sap.ui.model.json.JSONModel();
      	 oModel.setData(tableData.Rowsets.Rowset[0].Row);
       	 p_this.getView().setModel(oModel, "rodList");
	},
      }
    );
  }
);
