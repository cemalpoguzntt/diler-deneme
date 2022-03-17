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
        return Controller.extend(
            "customActivity.controller.dnaTelCekmeBobinler",

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
                    this.getModelActive();
                    this.getModelComboBox();

                },

                liveChange: function () {

                    //NUMERIC İÇİN
                    var _oInput = this.getView().byId("inputBobinEkle");
                    var val = _oInput.getValue();
                    val = val.replace(/[^\d]/g, "");
                    _oInput.setValue(val);

                },

                liveChange2: function () {

                    //NUMERIC İÇİN
                    var _oInput = this.getView().byId("inputWeight");
                    var val = _oInput.getValue();
                    val = val.replace(/[^\d]/g, "");
                    _oInput.setValue(val);

                },

                onPressHistoryButton: function (oEvent) {
                    var selectedIndex = this.getView().byId("idAktifBobinWeight").getSelectedContextPaths();
                    if (selectedIndex == "") {
                        MessageBox.error("Lütfen bir satır seçiniz.");
                        return;
                    }
                    var selectedIndex = selectedIndex[0][1];
                    var oTableData = this.getView().byId("idAktifBobinWeight").getModel().getData()[selectedIndex];
                    var bobbinno = oTableData.BOBBINNO;

                    this.HistoryButton(bobbinno);

                },

                HistoryButton: function (bobbinno) {
                    if (!this._oDialog1) {
                        this._oDialog1 = sap.ui.xmlfragment(
                            "HistoryButton",
                            "customActivity.fragmentView.dnaBobinlerHistory",

                            this
                        );
                        this.getView().addDependent(this._oDialog1);
                    }
                    this._oDialog1.open();

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/dnaTelCekmeBobinler/T_HISTORY",
                        {
                            I_BOBBINNO: bobbinno,

                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    tableModel.setSizeLimit(5000);

                    sap.ui.core.Fragment.byId("HistoryButton", "idHistoryTable").setModel(tableModel);

                    sap.ui.core.Fragment.byId("HistoryButton", "idHistoryTable").getModel().refresh();

                },

                onCancelFrag1: function () {
                    this._oDialog1.close();
                },


                getModelActive: function () {

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/dnaTelCekmeBobinler/T_SelectActive",
                        {

                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    tableModel.setSizeLimit(5000);

                    this.getView().byId("idAktifBobinWeight").setModel(tableModel);
                    this.getView().byId("idAktifBobinWeight").getModel().refresh();

                },

                newBobinEkle: function () {

                    var bobbinno = this.getView().byId("inputBobinEkle").getValue();
                    if (bobbinno == "") {
                        MessageBox.error("Lütfen bobin numarası giriniz.");
                        return;
                    }
                    var INPUT = "NEW"

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/dnaTelCekmeBobinler/T_Insert",
                        {
                            I_BOBBINNO: bobbinno,
                            I_INPUT: INPUT,

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }
                    else {
                        MessageBox.information("İşlem Başarılı");
                    }

                    this.getView().byId("inputBobinEkle").setValue("");
                    this.getModelActive();
                    this.getModelComboBox();

                },

                comboBoxBobinSave: function () {

                    var bobbinno = this.getView().byId("idBobinNo").getSelectedKey();

                    if (bobbinno == "") {
                        MessageBox.error("Lütfen bobin numarası seçiniz.");
                        return;
                    }

                    var Weight = this.getView().byId("inputWeight").getValue();

                    if (Weight == "") {
                        MessageBox.error("Lütfen ağırlık giriniz.");
                        return;
                    }

                    var INPUT = "OLD"

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/dnaTelCekmeBobinler/T_Insert",
                        {
                            I_BOBBINNO: bobbinno,
                            I_WEIGHT: Weight,
                            I_INPUT: INPUT,

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }
                    else {
                        MessageBox.information("İşlem Başarılı");
                    }

                    this.getView().byId("inputWeight").setValue("");
                    this.getModelActive();
                    this.getModelComboBox();


                },

                getModelComboBox: function () {


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/dnaTelCekmeBobinler/T_SelectDistinctBobbinNo",
                        {

                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    tableModel.setSizeLimit(5000);

                    this.getView().byId("idBobinNo").setModel(tableModel);
                    this.getView().byId("idBobinNo").getModel().refresh();

                },

                onPressKantarTartım: function () {

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/dnaTelCekmeBobinler/T_SelectKantarTartım",
                        {

                        },
                        "O_JSON"
                    );

                    var tartım = response[0].Rowsets.Rowset.Row.Brut;
                    this.getView().byId("inputWeight").setValue(tartım);

                },

                createColumns: function () {
                    return [{
                        label: 'Bobin No',
                        property: 'BOBBINNO',
                        width: '20'
                    }, {
                        label: 'Ağırlık',
                        property: 'WEIGHT',
                        width: '20'
                    }, {
                        label: 'Insdate',
                        property: 'INSDATE',
                        width: '20'
                    }

                    ];
                },

                onExport: function (oEvent) {

                    var oColumns = this.createColumns();
                    var tableModel = this.getView().byId("idAktifBobinWeight").getModel();
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
                        fileName: "Bobin_Verileri"
                    };
                    var oSheet = new Spreadsheet(oSettings);
                    oSheet.build().then(function () {
                        MessageToast.show("Tablo Excel'e aktarıldı.");
                    });
                },

                createColumnsHistory: function () {
                    return [
                        {
                            label: 'Bobin No',
                            property: 'BOBBINNO',
                            width: '20'
                        },
                        {
                            label: 'Ağırlık',
                            property: 'WEIGHT',
                            width: '20'
                        },
                        {
                            label: 'Aktif',
                            property: 'ACTIVE',
                            width: '20'
                        },
                        {
                            label: 'Insdate',
                            property: 'INSDATE',
                            width: '20'
                        }

                    ];
                },

                onExportHistory: function (oEvent) {

                    var oColumns = this.createColumnsHistory();
                    var tableModel = sap.ui.core.Fragment.byId("HistoryButton", "idHistoryTable").getModel();
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
                        fileName: "Bobin_Verileri_Geçmiş"
                    };
                    var oSheet = new Spreadsheet(oSettings);
                    oSheet.build().then(function () {
                        MessageToast.show("Tablo Excel'e aktarıldı.");
                    });
                },


                onPressDelete: function () {
                    
                    var selectedIndex = this.getView().byId("idAktifBobinWeight").getSelectedContextPaths();
                    if (selectedIndex == "") {
                        MessageBox.error("Lütfen bir satır seçiniz.");
                        return;
                    }
                    var selectedIndex = selectedIndex[0][1];
                    var oTableData = this.getView().byId("idAktifBobinWeight").getModel().getData()[selectedIndex];
                    var bobbinno = oTableData.BOBBINNO;

                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/dnaTelCekmeBobinler/T_Update",
                        {
                            I_BOBBINNO: bobbinno,  
                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }
                    else {
                        MessageBox.information("İşlem Başarılı");
                    }

                    this.getModelActive();
                    this.getModelComboBox();

                },

            }
        );
    }
);
