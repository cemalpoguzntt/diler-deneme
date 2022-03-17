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
        "customActivity/scripts/customStyle",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
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
        customStyle,
        TransactionCaller,
        Fragment
    ) {
        Array.prototype.localArrFilter = function (e) {
            var found = false;
            for (var i = 0; i < this.length; i++) {
                if (this[i].VALUE == e) {
                    found = true;
                    break;
                }
            }
            //console.log(this);
            return found;
        };
        return Controller.extend("customActivity.controller.dogManageOrders", {
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
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.appData.intervalState = true;
               this.appComponent.getEventBus().subscribe(
                    this.appComponent.getId(),
                    "shiftChanged",
                    //  this.refreshOrderData,
                    this
                );

                
            },





           
        });
    }
);

