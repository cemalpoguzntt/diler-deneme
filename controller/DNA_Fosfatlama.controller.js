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
        "sap/ui/model/FilterOperator"        
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
        FilterOperator        
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.DNA_Fosfatlama", 

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
                    // this.getModelData();
                                      
                },

                // getModelData: function () {
                //  var datestart="2021-06-30";
                //  var dateend="2021-06-30";
                //  var client="2021-06-30";
                //  var dateend="2021-06-30";
                //  var dateend="2021-06-30";
                 

                //     var response = TransactionCaller.sync(
                //       "BACKEND_TRANSACTIONS_TEST/EMRE/T_TABLE_MODEL",
                //       {



                //       },
                //       "O_JSON"
                //     );
                //     var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row)
                //       ? response[0].Rowsets.Rowset.Row
                //       : new Array(response[0].Rowsets.Rowset.Row);
                //     var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
                //     // tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
                //     this.getView().byId("mytable").setModel(tableModel);
                //     this.getView().byId("mytable").getModel().refresh();
                //   },
                
                
                

            }
        );
    }
);