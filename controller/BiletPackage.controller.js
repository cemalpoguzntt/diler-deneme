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
	"sap/ui/core/Core"
               
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
         Core       
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.BiletPackage", 

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

                // time: function () {
                //     var day1 = new Date().getDate();
                //     var month1 = new Date().getMonth() + 1;
                //     var fullyear1 = new Date().getFullYear();
                //     return fullyear1 + "-" + month1 + "-" + day1;
                // },
                getModelData: function () {

                    
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 = this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("datePicker").getDateValue().getFullYear();
                    var hour = this.getView().byId("datePicker").getDateValue().getHours();
                    var minute = this.getView().byId("datePicker").getDateValue().getMinutes();
                    var second = this.getView().byId("datePicker").getDateValue().getSeconds();
                    var date1 = fullyear1 + "-" + month1 + "-" + day1 +"T" + hour+ ":"+minute + ":" +second;

                     var day2 = this.getView().byId("datePicker2").getDateValue().getDate();
                    var month2 = this.getView().byId("datePicker2").getDateValue().getMonth() + 1;
                    var fullyear2 = this.getView().byId("datePicker2").getDateValue().getFullYear();
                    var hour2 = this.getView().byId("datePicker2").getDateValue().getHours();
                    var minute2 = this.getView().byId("datePicker2").getDateValue().getMinutes();
                    var second2 = this.getView().byId("datePicker2").getDateValue().getSeconds();
                    var date2 = fullyear2 + "-" + month2 + "-" + day2 + "T" + hour2+ ":"+minute2 + ":" +second2;


                    var response = TransactionCaller.sync(
                        
                        "MES/Itelli/EMRE/T_rEPORT",

                        {
                            I_FirstDate: date1,
                            I_EndDate: date2,
                           
                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                      
                    this.getView().byId("reporttable").setModel(tableModel);
                    this.getView().byId("reporttable").getModel().refresh();
                },
                   
              
                

            }
        );
    }
);