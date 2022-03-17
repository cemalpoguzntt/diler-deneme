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
    ],
  
    function (
      Controller,
      JSONModel,
      MessageBox,
      customScripts,
      formatter,
      Filter,
      FilterOperator,
      FilterType
    ) {
      "use strict";
	var that;
      return Controller.extend("customActivity.controller.oeePersonnelEntry", {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         */
  
        formatter: formatter,
  
        onInit: function () {
	    that = this;
          this.appComponent = this.getView().getViewData().appComponent;
          this.appData = this.appComponent.getAppGlobalData();
          this.interfaces = this.appComponent.getODataInterface();
        }
    })
    });