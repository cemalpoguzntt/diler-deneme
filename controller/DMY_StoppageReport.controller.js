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
        "sap/ui/core/BusyIndicator",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "customActivity/scripts/customStyle",
        'sap/ui/core/library',
        "sap/ui/core/Core",
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
        customStyle,
        coreLibrary,
        Core,
        Spreadsheet,
        BusyIndicator
    ) {
        "use strict";
        var that;
        var TableData;
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.DMY_StoppageReport",

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
                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();
                    this.interfaces = this.appComponent.getODataInterface();
                    var date = new Date();
                    this.getView().byId("Date").setDateValue(date);
                    this.onDateChange();
                    this.getView().byId("dailyMultiheader").setHeaderSpan([4,1]);
                    this.getView().byId("monthlyMultiheader").setHeaderSpan([4,1]);
                    this.getView().byId("yearlyMultiheader").setHeaderSpan([4,1]);

                },
                getProdPlace: function (TBT) {
                    //Üretim yerlerini çağıran fonksiyon
                    this.getView().byId("idproduction").setModel(TBT);
                },
                onDateChange: function () {
                    //Tarih seçimi yapıldıktan sonra SQL query için uygun format çevrilir
                    var date = this.getView().byId("Date").getDateValue();
                    let formatedDate = this.dateFormatter(date);
                    this.getComboboxDetails(formatedDate);
                },
                onProdPlace: function () {
                    //Üretim yeri seçildikten sonra İş Yeri Combobox'ını filtreleyen fonksiyon
                    let ProdPlace = (this.getView().byId("idproduction").getSelectedItem() !== null ) ? parseInt(this.getView().byId("idproduction").getSelectedItem().getKey()) : null;
                    let combobox = [...new Map(TableData.filter(item => { if (item.URETIM_YERI === ProdPlace) { return item } else if (ProdPlace === null) { return item} }).map(item => [item["PP_ISYERI"], item])).values()]
                    let comboboxFill = new sap.ui.model.json.JSONModel(combobox)
                    this.getView().byId("idworkplace").setModel(comboboxFill);
                },
                onWorkcenter: function () {
                    //Üretim Yeri ve İş Yeri seçildikten sonra Duruş Ana başlık Combobox'ını düzenleyen Fonksiyon
                    let conditions = []
                    let ProdPlace =  (this.getView().byId("idproduction").getSelectedItem() !== null ) ? parseInt(this.getView().byId("idproduction").getSelectedItem().getKey()) : null;
                    let WorkCenter = (this.getView().byId("idworkplace").getSelectedItem() !== null) ? this.getView().byId("idworkplace").getSelectedItem().getKey() : null;
                    
                    let combobox = [...new Map(TableData.filter(item => { 
                        if(ProdPlace!==null)
                        { 
                            conditions.push(item.URETIM_YERI === ProdPlace)
                        }
                        if(WorkCenter!==null)
                        { 
                            conditions.push(item.PP_ISYERI === WorkCenter)
                        }


                        if (conditions.length === 0){
                            return item
                        }
                        else if (!conditions.includes(false)) 
                        { 
                            return item 

                        }

                        while(conditions.length){
                            conditions.pop();
                        }
                    }
                    ).map(item => [item["DURUS_ANA_BASLIK"], item])).values()]

                    let comboboxFill = new sap.ui.model.json.JSONModel();
                    comboboxFill.setSizeLimit(1500);
                    comboboxFill.setData(combobox);
                    this.getView().byId("iddowntimegroup").setModel(comboboxFill);

                },//MES/Itelli/STOPPAGE_REPORTS/STOPPAGE_REPORT_1/GET_CATREASON
                onCatgroup: function () {
                    //Üretim Yeri, İş Yeri ve Duruş Ana Başlık seçildikten sonra Duruş Neden Combobox'ını düzenleyen fonksiyon
                    let conditions = []
                    let ProdPlace =  (this.getView().byId("idproduction").getSelectedItem() !== null ) ? parseInt(this.getView().byId("idproduction").getSelectedItem().getKey()) : null;
                    let WorkCenter = (this.getView().byId("idworkplace").getSelectedItem() !== null) ? this.getView().byId("idworkplace").getSelectedItem().getKey() : null;
                    let CatGroup = (this.getView().byId("idworkplace").getSelectedItem() !== null) ? this.getView().byId("iddowntimegroup").getSelectedItem().getKey() : null;
                    let combobox = [...new Map(TableData.filter(item => {
                        if(ProdPlace!==null)
                        { 
                            conditions.push(item.URETIM_YERI === ProdPlace)
                        }
                        if(WorkCenter!==null)
                        { 
                            conditions.push(item.PP_ISYERI === WorkCenter)
                        }
                        if(CatGroup!==null)
                        { 
                            conditions.push(item.DURUS_ANA_BASLIK === CatGroup)
                        }

                        if (conditions.length === 0)
                        {
                            return item
                        }
                        else if (!conditions.includes(false))
                        { 
                             return item
                        }
                        
                        while(conditions.length){
                            conditions.pop();
                        }
                        }).map(item => [item["DURUS_NEDENI"], item])).values()]
                    let comboboxFill = new sap.ui.model.json.JSONModel();
                    comboboxFill.setSizeLimit(1500);
                    comboboxFill.setData(combobox);
                    this.getView().byId("iddowntimereason").setModel(comboboxFill);

                },
                getComboboxDetails: function (formatedDate) {
                    //Günlük, Aylık ve Yıllık olmak üzere prosedürü oluşturulan Tabloyu çağıran fonksiyon
                    sap.ui.core.BusyIndicator.show(0)
                    TransactionCaller.async(
                        "MES/Itelli/STOPPAGE_REPORTS/STOPPAGE_REPORT_1/GET_DMY_STOPPAGETABLES",
                        {
                            iv_date: formatedDate
                        },
                        "O_JSON",
                        this.getComboboxDetailsCB,
                        this,
                        "GET",
                        {}
                    );
                },

                getComboboxDetailsCB: function (iv_data, iv_scope) {
                    var myModel = new sap.ui.model.json.JSONModel();
                    myModel.setSizeLimit(3000);
                    if (Array.isArray(iv_data[0].Rowsets?.Rowset?.Row)) {
                        myModel.setData(iv_data[0]);
                    } else if (!iv_data[0].Rowsets?.Rowset?.Row) {
                        myModel.setData(null);
                    } else {
                        var obj_iv_data = iv_data[0];
                        var dummyData = [];
                        dummyData.push(iv_data[0].Rowsets.Rowset.Row);
                        obj_iv_data.Rowsets.Rowset.Row = dummyData;
                        myModel.setData(obj_iv_data);
                    }
                    sap.ui.core.BusyIndicator.hide();
                    TableData = myModel.oData.Rowsets.Rowset.Row;
                    //Her bir Combobox için uygun olacak şekilde model oluşturuluyor
                    let PROD_PLACE = [...new Map(myModel.oData.Rowsets.Rowset.Row.map(item => [item["URETIM_YERI"], item])).values()];
                    let PP_WRK = [...new Map(myModel.oData.Rowsets.Rowset.Row.map(item => [item["PP_ISYERI"], item])).values()];
                    let CATGROUP = [...new Map(myModel.oData.Rowsets.Rowset.Row.map(item => [item["DURUS_ANA_BASLIK"], item])).values()];
                    let CATREASON = [...new Map(myModel.oData.Rowsets.Rowset.Row.map(item => [item["DURUS_NEDENI"], item])).values()];

                    var sheets = [new sap.ui.model.json.JSONModel(PROD_PLACE),
                    new sap.ui.model.json.JSONModel(PP_WRK),
                    new sap.ui.model.json.JSONModel(CATGROUP),
                    new sap.ui.model.json.JSONModel()]
                    sheets[3].setSizeLimit(1500);
                    sheets[3].setData(CATREASON)  
                    var comboBox = [that.getView().byId("idproduction"),
                    that.getView().byId("idworkplace"),
                    that.getView().byId("iddowntimegroup"),
                    that.getView().byId("iddowntimereason")]

                    comboBox.forEach((element, index) => {
                        element.setModel(sheets[index])
                    });
                    iv_scope.getProdPlace(TableData);
                }
                ,
                openReportScreen: function () {
                    //Seçim ekranından rapoer ekranına geçişi sağlayan methode
                    this.getView().byId("selectionScreen").setVisible(false);
                    this.getView().byId("idflexbox").setVisible(true);
                },
                backMainPanel: function () {
                    //Rapor ekranından Seçim ekranına geçişi sağlayan methode
                    this.getView().byId("selectionScreen").setVisible(true);
                    this.getView().byId("idflexbox").setVisible(false);
                },
                dateFormatter: function (date) {
                    //Tarih bilgisini yyyy-mm-dd formatına çeviren methode
                    let day = new Date(date).getDate(),
                        month = new Date(date).getMonth() + 1,
                        year = new Date(date).getFullYear()
                    if (day < 10) {
                        day = '0' + day;
                    }
                    if (month < 10) {
                        month = '0' + month;
                    }
                    return `${year}-${month}-${day}`;
                },
                searchData: function () {
                    //Filterelenen Dataların Tabloya basıldığı fonksiyon
                    let conditions = [];
                    let ProdPlace = (this.getView().byId("idproduction").getSelectedItem() !== null) ? parseInt(this.getView().byId("idproduction").getSelectedItem().getKey()) : null;
                    let WorkCenter = (this.getView().byId("idworkplace").getSelectedItem() !== null) ? this.getView().byId("idworkplace").getSelectedItem().getKey() : null;
                    let CatGroup = (this.getView().byId("iddowntimegroup").getSelectedItem() !== null) ? this.getView().byId("iddowntimegroup").getSelectedItem().getKey() : null;
                    let CatReason = (this.getView().byId("iddowntimereason").getSelectedItem() !== null)? this.getView().byId("iddowntimereason").getSelectedItem().getKey() : null;

                    sap.ui.core.BusyIndicator.show();
                    let FilteredData = TableData.filter(item => { 
                       
                        if(ProdPlace !== null){
                            conditions.push(item.URETIM_YERI === ProdPlace)
                        }
                        if(WorkCenter !== null){
                            conditions.push(item.PP_ISYERI === WorkCenter)
                        }
                        if(CatGroup !== null){
                            conditions.push(item.DURUS_ANA_BASLIK === CatGroup)
                        }
                        if(CatReason !== null){
                            conditions.push(item.DURUS_NEDENI === CatReason)
                        }
                        if (!conditions.includes(false)) 
                        {
                             return item
                        } 
                        while (conditions.length) { 
                            conditions.pop(); 
                        }
                
                    })

                    var TableFill = new sap.ui.model.json.JSONModel()
                    TableFill.setSizeLimit(2500);
                    TableFill.setData(FilteredData);
                    this.getView().byId("Table").setModel(TableFill);

                    this.getView().byId("selectionScreen").setVisible(false);
                    this.getView().byId("idflexbox").setVisible(true);
                    sap.ui.core.BusyIndicator.hide();

                }

            }
        );
    }
);

//myModel.oData.Rowsets.Rowset.Row[].URETIM_YERI