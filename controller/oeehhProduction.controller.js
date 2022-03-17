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
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        return Controller.extend(
            "customActivity.controller.oeehhProduction",

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

                    this.getModelData();

                },

                time: function () {
                    var day1 = new Date().getDate();
                    var month1 = new Date().getMonth() + 1;
                    var fullyear1 = new Date().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                },
                date1: function () {
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 = this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("datePicker").getDateValue().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;

                },
                date2: function () {
                    var day2 = this.getView().byId("datePicker").getSecondDateValue().getDate();
                    var month2 = this.getView().byId("datePicker").getSecondDateValue().getMonth() + 1;
                    var fullyear2 = this.getView().byId("datePicker").getSecondDateValue().getFullYear();
                    return fullyear2 + "-" + month2 + "-" + day2;

                },
                exceldate1: function () {
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 = this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("datePicker").getDateValue().getFullYear();
                    return day1 + "." + month1 + "." + fullyear1;

                },
                exceldate2: function () {
                    var day2 = this.getView().byId("datePicker").getSecondDateValue().getDate();
                    var month2 = this.getView().byId("datePicker").getSecondDateValue().getMonth() + 1;
                    var fullyear2 = this.getView().byId("datePicker").getSecondDateValue().getFullYear();
                    return day2 + "." + month2 + "." + fullyear2;

                },



                searchData: function () {

                    var toplamUretim = 0;
                    var toplamTuketim = 0;

                    var date1 = this.date1();                    
                    var date2 = this.date2();

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/T_SELECT_MPM_PROD_RUN_HDR",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeid,

                        },
                        "O_JSON"
                    );
		
	       
            
                },

                getModelData: function () {

                    var toplamUretimY1 = 0;
                    var toplamUretimY2 = 0;
                    var date1 = this.time();
                    var date2 = this.time();

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/T_SELECT_MPM_PROD_RUN_HDR",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeid,

                        },
                        "O_JSON"
                    );
                   
                    this.getView().byId("datePicker").setValue(this.time()+" " + "- "+ " " + this.time());

                },


                createColumns: function () {
                    return [{
                        label: 'Tarih',
                        property: 'TARIH',
                        width: '20'
                    }, {
                        label: 'Vardiya',
                        property: 'VARDIYA',
                        width: '20'
                    }
                    ];
                },

                createColumns: function () {
                    return [{
                        label: 'Tarih',
                        property: 'TARIH',
                        width: '20'
                    }, {
                        label: 'Vardiya',
                        property: 'VARDIYA',
                        width: '20'
                    }, {
                        label: 'Satış Sip No.',
                        property: 'SATIS_SIP',
                        width: '20'
                    }, {
                        label: 'Üretim Sip No.',
                        property: 'URETIM_SIP',
                        width: '20'
                    }

                    ];
                },

                

                onExport: function (oEvent) {

                    var oColumns = this.createColumns();
                    var tableModel = this.getView().byId("tblHhReport").getModel();
                    if (!(!!tableModel?.oData)) {
                        MessageBox.error("Tabloda veri bulunmamaktadır.");
                        return;
                    }
                    var oDatas = tableModel.getData();
                    if (!(!!oDatas)) {
                        MessageBox.error("Tabloda veri bulunmamaktadır.");
                        return;
                    }
                    var oSettings = {
                        workbook: {
                            columns: oColumns
                        },
                        dataSource: oDatas,
                        fileName: "Hadde_Rapor_" + this.exceldate1() + "-" + this.exceldate2()
                    };
                    var oSheet = new Spreadsheet(oSettings);
                    oSheet.build().then(function () {
                        MessageToast.show("Tablo Excel'e aktarıldı.");
                    });
                },




            }
        );
    }
);