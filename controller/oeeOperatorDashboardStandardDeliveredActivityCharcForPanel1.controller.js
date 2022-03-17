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
        FilterType
    ) {
        return Controller.extend("customActivity.controller.oeeOperatorDashboardStandardDeliveredActivityCharcForPanel1", {
            orderCardView: undefined,
            openDownsCardView: undefined,
            /**
            * Called when a controller is instantiated and its View controls (if available) are already created.
            * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
            * @memberOf componentexample.Main
            */
            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.viewOptions = [];

                if (this.getView().getViewData().viewOptions && this.getView().getViewData().viewOptions.length > 0) {
                    for (var i = 0; i < this.getView().getViewData().viewOptions.length; i++) {
                        var viewOption = this.getView().getViewData().viewOptions[i];
                        this.viewOptions.push(viewOption);
                    }
                }

                this.appComponent.getEventBus().subscribe(this.appComponent.getId(), "_hideOrShowStandardOpenDowntimesView", this.hideOrShowStandardOpenDowntimesView, this);
                this.createViewsAndAddToLayout();
            },

            oeeRefreshActivity: function () {
                if (this.orderCardView && this.orderCardView.getController() && typeof this.orderCardView.getController().oeeRefreshActivity === "function") { // Refresh function Exists
                    this.orderCardView.getController().oeeRefreshActivity(); //Refresh Activity  
                }

                if (this.openDownsCardView && this.openDownsCardView.getController() && typeof this.openDownsCardView.getController().oeeRefreshActivity === "function") { // Refresh function Exists
                    this.openDownsCardView.getController().oeeRefreshActivity(); //Refresh Activity
                }
            },

            createViewsAndAddToLayout: function () {
                this.orderCardView = sap.ui.view({
                    viewName: "customActivity.view.orderCardCharcTile", type: sap.ui.core.mvc.ViewType.XML,
                    width: "100%",
                    layoutData: new sap.ui.layout.GridData({ span: "L7 M7 S7" }), viewData: {
                        "viewOptions": [],
                        "appComponent": this.appComponent
                    }
                });


                this.openDownsCardView = sap.ui.view({
                    viewName: "sap.oee.ui.openDownsTile", type: sap.ui.core.mvc.ViewType.XML,
                    width: "100%",
                    layoutData: new sap.ui.layout.GridData({ span: "L5 M5 S5" }), viewData: {
                        "viewOptions": this.viewOptions,
                        "appComponent": this.appComponent
                    }
                });
                /*
                */

                this.byId("panel1").addContent(this.orderCardView).addContent(this.openDownsCardView);
            },

            hideOrShowStandardOpenDowntimesView: function (channelId, eventId, data) {
                if (eventId === "_hideOrShowStandardOpenDowntimesView") {
                    var oStandardPanel1 = this.byId("panel1");

                    oStandardPanel1.removeAllContent();

                    oStandardPanel1.addContent(this.orderCardView);
                    if (data != undefined && data.show) //Show by Default
                    {
                        this.orderCardView.setLayoutData(new sap.ui.layout.GridData({ span: "L7 M7 S7" }));
                        oStandardPanel1.addContent(this.openDownsCardView);
                    } else {
                        this.orderCardView.setLayoutData(new sap.ui.layout.GridData({ span: "L12 M12 S12" }));
                    }
                    oStandardPanel1.rerender();
                }
            },

            /**
            * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
            * (NOT before the first rendering! onInit() is used for that one!).
            * @memberOf componentexample.Main
            */
            //	onBeforeRendering: function() {
            //
            //	},

            /**
            * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
            * This hook is the same one that SAPUI5 controls get after being rendered.
            * @memberOf componentexample.Main
            */
            //	onAfterRendering: function() {
            //
            //	},

            /**
            * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
            * @memberOf componentexample.Main
            */
            onExit: function () {
                this.appComponent.getEventBus().unsubscribe(this.appComponent.getId(), "_hideOrShowStandardOpenDowntimesView", this.hideOrShowStandardOpenDowntimesView, this);
            }

        })
    });