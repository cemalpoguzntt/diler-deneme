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
        "sap/ui/core/Core",
        "sap/ui/core/library",
        "sap/ui/unified/library",
        "sap/ui/unified/DateTypeRange"
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
        Spreadsheet,
        Core,
        CoreLibrary,
        UnifiedLibrary,
        DateTypeRange
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        return Controller.extend(
            "customActivity.controller.firketeReportScreen",

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

                handleChange1: function (oEvent) {
                    var oText = this.getView().byId("DateTimePicker1"),
                        sValue = oEvent.getParameter("value");
        
                    
                    oText.setValue(sValue);        
                
                },

                handleChange2: function (oEvent) {
                    var oText = this.getView().byId("DateTimePicker2"),
                        sValue = oEvent.getParameter("value");
        
                    
                    oText.setValue(sValue);        
                
                },
                
                exceldate1: function () {
                    var day1 = this.getView().byId("DateTimePicker1").getDateValue().getDate();
                    var month1 = this.getView().byId("DateTimePicker1").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("DateTimePicker1").getDateValue().getFullYear();
                    return day1 + "." + month1 + "." + fullyear1;

                },
                exceldate2: function () {
                    var day1 = this.getView().byId("DateTimePicker2").getDateValue().getDate();
                    var month1 = this.getView().byId("DateTimePicker2").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("DateTimePicker2").getDateValue().getFullYear();
                    return day1 + "." + month1 + "." + fullyear1;

                },

                searchData: function () {

                    var toplamUretim = 0;
                    var toplamAdet = 0;
                    if (this.getView().byId("DateTimePicker1").getValue() == null) {
                        MessageBox.error("Lütfen tarih giriniz.");
                        return;
                    }
                    else if (this.getView().byId("DateTimePicker2").getValue() == null) {
                        MessageBox.error("Lütfen tarih giriniz.");
                        return;
                    }
                    var date1 = this.getView().byId("DateTimePicker1").getValue();
                    var date2 = this.getView().byId("DateTimePicker2").getValue();

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    // var nodeid = this.appData.node.nodeID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/Firkete Report/T_Firkete_Report",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,

                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0]?.Rowsets?.Rowset?.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    // tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
                    if (response[0]?.Rowsets?.Rowset?.Row == null) {
                        this.getView().byId("toplamUretim").setText(0);
                        this.getView().byId("toplamAdet").setText(0);

                    }
                    else {
                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamUretim = modelArr[i].TOPLAM_URETIM + toplamUretim;
                        }
                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamAdet = modelArr[i].URETIM_ADET + toplamAdet;
                        }
                        this.getView().byId("toplamUretim").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamAdet").setText(toplamAdet);
                    }

                    this.getView().byId("firketeReport").setModel(tableModel);
                    this.getView().byId("firketeReport").getModel().refresh();
                },


                getModelData: function () {

                    var toplamUretim = 0;
                    var toplamAdet = 0;

                    var date1 = new Date().toISOString().split('T')[0] + " " + "00" + ":" +"00"
                    
                    var hour = '' + new Date().getHours();
                    if (hour.length < 2) {
                        hour = "0" + hour;
                    }
                    var dakika = '' + new Date().getMinutes()
                    if (dakika.length < 2) {
                        dakika = "0" + dakika;
                    }

                    var date2 = new Date().toISOString().split('T')[0] + " " + hour + ":" + dakika

                    var client = this.appData.client;
                    var plant = this.appData.plant;
                    var nodeid = this.appData.node.nodeID;


                    var response = TransactionCaller.sync(
                        "MES/Itelli/EREN/Firkete Report/T_Firkete_Report",

                        {
                            I_DATE1: date1,
                            I_DATE2: date2,
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_NODEID: nodeid,

                        },
                        "O_JSON"
                    );
                    var modelArr = Array.isArray(response[0]?.Rowsets?.Rowset?.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    // tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);                    
                    if (response[0]?.Rowsets?.Rowset?.Row == null) {
                        this.getView().byId("toplamUretim").setText(0);
                        this.getView().byId("toplamAdet").setText(0);

                    }
                    else {
                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamUretim = modelArr[i].TOPLAM_URETIM + toplamUretim;
                        }
                        for (var i = 0; i < modelArr.length; i++) {
                            var toplamAdet = modelArr[i].URETIM_ADET + toplamAdet;
                        }
                        this.getView().byId("toplamUretim").setText(toplamUretim.toFixed(3));
                        this.getView().byId("toplamAdet").setText(toplamAdet);
                    }
                   
                    this.getView().byId("firketeReport").setModel(tableModel);
                    this.getView().byId("firketeReport").getModel().refresh();

                    this.getView().byId("DateTimePicker1").setValue(date1)
                    this.getView().byId("DateTimePicker2").setValue(date2)
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
                        label: 'İş Yeri',
                        property: 'ISYERI',
                        width: '20'
                    }, {
                        label: 'Satış Sip No.',
                        property: 'SIPARIS_NO',
                        width: '20'
                    }, {
                        label: 'Toplam Üretim',
                        property: 'TOPLAM_URETIM',
                        width: '20'
                    }, {
                        label: 'Birim',
                        property: 'BIRIM',                       
                        width: '20'
                    }, {
                        label: 'Üretim Adet',
                        property: 'URETIM_ADET',
                        width: '20'
                    },

                    {
                        label: 'Belge türü',
                        property: 'BELGETURU',
                        width: '20'
                    },
                    
                    {
                        label: 'Üretim Yönetimi',
                        property: 'URETIM_YONETIMI',
                        width: '20'
                    },

                    {
                        label: 'Boyama',
                        property: 'BOYAMA',
                        width: '20'
                    },

                    {
                        label: 'Üretim Şekli',
                        property: 'URETIM_SEKLI',
                        width: '20'
                    },

                    {
                        label: 'Faturalama',
                        property: 'FATURALAMA',                       
                        width: '20'
                    },

                    {
                        label: 'Nervuz Düz',
                        property: '{NERVUR_DUZ}',
                        type: EdmType.Number,
                        width: '20'
                    },

                    {
                        label: 'Üretim Yeri',
                        property: 'URETIMYERI',
                        width: '20'
                    },
                    {
                        label: 'Üretim Yeri Sip.',
                        property: 'URETIMYERI_SIPARIS',
                        width: '20'
                    },
                    {
                        label: 'Kütük Menşei',
                        property: 'KUTUK_MENSEI',
                        width: '20'
                    },
                    {
                        label: 'Miktar (ton)',
                        property: 'MIKTAR_TON',
                        width: '20'
                    },
                    {
                        label: 'Ülke',
                        property: 'ULKE',
                        width: '20'
                    },
                    {
                        label: 'Hedef Üretim Miktar',
                        property: 'HEDEF_URETIM_MIKTAR',
                        width: '20'
                    },
                    {
                        label: 'Miktar Ton Sip.',
                        property: 'MIKTAR_TON_SIPARIS',
                        width: '20'
                    },
                    {
                        label: 'STDHADDE Tol Max',
                        property: 'STDHADDE_TOL_MAX',
                        width: '20'
                    },
                    {
                        label: 'STDHADDE Tol Min',
                        property: 'STDHADDE_TOL_MIN',
                        width: '20'
                    },
                    {
                        label: 'HADDE Tol Max Hedef',
                        property: 'HADDE_TOL_MAX_HEDEF',
                        width: '20'
                    },
                    {
                        label: 'HADDE Tol Min Hedef',
                        property: 'HADDE_TOL_MIN_HEDEF',
                        width: '20'
                    },
                    {
                        label: 'Birim Ağırlık Kg M Nom',
                        property: 'BIRIM_AGIRLIK_KG_M_NOM',
                        width: '20'
                    },
                    {
                        label: 'Marka',
                        property: 'MARKA',
                        width: '20'
                    },
                    {
                        label: 'Müşteri',
                        property: 'MUSTERI',
                        width: '20'
                    },
                    {
                        label: 'Sipariş Malzeme',
                        property: 'SIPARIS_MALZEME',
                        width: '20'
                    },
                    {
                        label: 'Standart FRK',
                        property: 'STANDART_FRK',
                        width: '20'
                    },
               
                    {
                        label: 'CBK KDOG',
                        property: 'CBK_KDOG',
                        width: '20'
                    },
                    {
                        label: 'FIRK Süre',
                        property: 'FIRK_SURE',
                        width: '20'
                    },
                    {
                        label: 'Kalite FRK',
                        property: 'KALITE_FRK',
                        width: '20'
                    },
                    {
                        label: 'Birim Ağırlık Hedef Min',
                        property: 'BIRIM_AGIRLIK_HEDEF_MIN',
                        width: '20'
                    },
                    {
                        label: 'Birim Ağırlık Hedef Max',
                        property: 'BIRIM_AGIRLIK_HEDEF_MAX',
                        width: '20'
                    },
                    {
                        label: 'Çap FRK MM',
                        property: 'CAP_FRK_MM',
                        width: '20'
                    },
                    {
                        label: 'Boy FRK M',
                        property: 'BOY_FRK_M',
                        width: '20'
                    },
                    {
                        label: 'Birim Ağırlık KG M Max',
                        property: 'BIRIM_AGIRLIK_KG_M_MAX',
                        width: '20'
                    },
                    {
                        label: 'Birim Ağırlık KG M Min',
                        property: 'BIRIM_AGIRLIK_KG_M_MIN',
                        width: '20'
                    },
                    {
                        label: 'Çubuk Sayısı',
                        property: 'CUBUK_SAYISI',
                        width: '20'
                    },
                    {
                        label: 'Paket Ağırlık KG',
                        property: 'PAKET_AGIRLIK_KG',
                        width: '20'
                    }

                    ];
                },

                onExport: function (oEvent) {                    

                    var oColumns = this.createColumns();
                    var tableModel = this.getView().byId("firketeReport").getModel();
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
                        fileName: "Firkete_" + this.exceldate1() + "-" + this.exceldate2()
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