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
         Spreadsheet     
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.AnaVeri", 

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
                    console.log("wuuhuu");
                    jsonDataForPriorityChange = [];

                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();

                    this.interfaces = this.appComponent.getODataInterface();
                   
                    var today = new Date();
              var   setToday =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
              var   setTom =
                    today.getDate()+
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                  this.getView()
                    .byId("datePicker")
                    .setValue(setToday + " - " + setTom);

                  
                    this.handleChange();
                    
                    setTimeout(() => {
                        

                        document.getElementById(this.getView().byId("button5").sId+"-label-bdi").classList.add("anaVeri");
                        document.getElementById(this.getView().byId("button6").sId+"-label-bdi").classList.add("anaVeri");
                        document.getElementById(this.getView().byId("button7").sId+"-label-bdi").classList.add("anaVeri");
                        document.getElementById(this.getView().byId("button8").sId+"-label-bdi").classList.add("anaVeri");




                    }, 2000);
                      
                },

                setKtkidToCombo: function(){
                        var TF= this.getView().byId("button5").getSelected();
                        var UH=  this.getView().byId("button6").getSelected();
                        var PH= this.getView().byId("button7").getSelected();
                        var TM= this.getView().byId("button8").getSelected();
                        if(TF){
                            var ComboModel= this.getView().byId("table0").getModel()
                          if(!!ComboModel){
                            this.getView().byId("ktkid").setModel(ComboModel);
                    }
                    else{
                        return;
                    }


                        }
                        if(UH){
                            var ComboModel= this.getView().byId("table1").getModel()
                    if(!!ComboModel){
                    this.getView().byId("ktkid").setModel(ComboModel);
                    }
                    else{
                        return;
                    }

                        }
                        if(PH){
                            var ComboModel= this.getView().byId("table2").getModel()
                    if(!!ComboModel){
                    this.getView().byId("ktkid").setModel(ComboModel);
                    }
                    else{
                        return;
                    }

                        }
                        if(TM){
                            var ComboModel= this.getView().byId("table3").getModel()
                    if(!!ComboModel){
                    this.getView().byId("ktkid").setModel(ComboModel);
                    }
                    else{
                        return;
                    }
                        }
                        
                    


                },

                onSearch(oEvent) {
                   var ktkid= this.getView().byId("ktkid").getSelectedKey()
                    
                    this.setFilter(ktkid);
                },
                setFilter: function (ktkid) {
                    var TF= this.getView().byId("button5").getSelected();
                        var UH=  this.getView().byId("button6").getSelected();
                        var PH= this.getView().byId("button7").getSelected();
                        var TM= this.getView().byId("button8").getSelected();

                    this.getModelData();
                   if(TF){
                    var gModel = this.getView().byId("table0").getModel();
                    
                   }
                   if(UH){
                    var gModel = this.getView().byId("table1").getModel();
                   }
                   if(PH){
                    var gModel = this.getView().byId("table2").getModel();
                   }
                   if(TM){
                    var gModel = this.getView().byId("table3").getModel();
                   }

                    var filtCounter;
                    var characteristic = gModel.getData();
                    var filteredCharacteristic = [];
                    filtCounter = 0;

                    if (ktkid != "") {
                        for (var j = 0; j < characteristic.length; j++) {
                            if (characteristic[j].KTKID == ktkid) {
                                filteredCharacteristic[filtCounter] = characteristic[j];
                                filtCounter++;
                            }
                        }
                    }
                    filtCounter = 0;
                   

                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(filteredCharacteristic);
                    if(TF){
                        this.getView().byId("table0").setModel(oModel);
                       }
                       if(UH){
                        this.getView().byId("table1").setModel(oModel);
                       }
                       if(PH){
                        this.getView().byId("table2").setModel(oModel);
                       }
                       if(TM){
                        this.getView().byId("table3").setModel(oModel);
                       }
                    
                   
                },



                handleChange: function (oEvent) {
                         
                        var TF= this.getView().byId("button5").getSelected();
                        var UH=  this.getView().byId("button6").getSelected();
                        var PH= this.getView().byId("button7").getSelected();
                        var TM= this.getView().byId("button8").getSelected();
                        
                       


                         if(TF){
                          this.getView().byId("box1").setVisible(true)
                          this.getView().byId("box2").setVisible(false)
                          this.getView().byId("box3").setVisible(false)
                          this.getView().byId("box4").setVisible(false)
                          this.getModelData();

                         }
                         if(UH){
                            this.getView().byId("box2").setVisible(true)
                            this.getView().byId("box1").setVisible(false)
                          this.getView().byId("box3").setVisible(false)
                          this.getView().byId("box4").setVisible(false)
                          this.getModelData();
                             
                        }
                        if(PH){
                            this.getView().byId("box3").setVisible(true)
                            this.getView().byId("box1").setVisible(false)
                          this.getView().byId("box2").setVisible(false)
                          this.getView().byId("box4").setVisible(false)
                          this.getModelData();
                             
                        }
                        if(TM){
                            this.getView().byId("box4").setVisible(true)
                            this.getView().byId("box1").setVisible(false)
                          this.getView().byId("box2").setVisible(false)
                          this.getView().byId("box3").setVisible(false)
                          this.getModelData();
                             
                        }
                      


                },
              
                
                time: function () {
                    var day1 = new Date().getDate();
                    var month1 = new Date().getMonth() + 1;
                    var fullyear1 = new Date().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                },

                exceldate1: function () {
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 = this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("datePicker").getDateValue().getFullYear();
                    return day1 + "." + month1 + "." + fullyear1;
                },
                    exceldate2: function () {
                        var day1 = this.getView().byId("datePicker").getSecondDateValue();
                        var month1 = this.getView().byId("datePicker").getSecondDateValue().getMonth() + 1;
                        var fullyear1 = this.getView().byId("datePicker").getSecondDateValue().getFullYear();
                        return day1 + "." + month1 + "." + fullyear1;

                    },

                getModelData: function () {
                    var dateS = this.getView().byId("datePicker").getDateValue();
                    var  dateS2 = this.getView().byId("datePicker").getSecondDateValue()
                         var d1 = moment(dateS).format('YYYY-MM-DD');
                         var d2 = moment(dateS2).format('YYYY-MM-DD');
                          d1=d1+" 00:00:01";
                          d2=d2+" 23:59:59";
                
                    
                        var TF= this.getView().byId("button5").getSelected();
                        var UH=  this.getView().byId("button6").getSelected();
                        var PH= this.getView().byId("button7").getSelected();
                        var TM= this.getView().byId("button8").getSelected();
                        var page;
                     if(TF==true){
                     page="A";
                     }
                     if(UH==true){
                        page="B";
                     }
                     if(PH==true){
                         page="C";
                     }
                     if(TM==true){
                        page="D";
                    }
                    var ktkid = this.getView().byId("ktkid").getSelectedKey();
            
                    var response = TransactionCaller.sync(
                        
                       "MES/Itelli/FLM/PROCESS_PARAMETERS/T_PLC_VERILER_MODEL",  

                        {
                           
                           I_DATE1: d1,
                           I_DATE2: d2,
                           I_PAGE: page
                           
                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    
                    if (response[0].Rowsets.Rowset.Row == null) {

                    }
                    else {
                   if(page="A"){
                    this.getView().byId("table0").setModel(tableModel);
                
                   }

                   if(page="B"){
                    this.getView().byId("table1").setModel(tableModel);  
                            
                   }

                   if(page="C"){
                    this.getView().byId("table2").setModel(tableModel);                    
                   }
                   if(page="D"){
                    this.getView().byId("table3").setModel(tableModel);                    
                   }

                }
                this.setKtkidToCombo();
                var myColumns=response[0].Rowsets.Rowset.Columns.Column;
                 return myColumns;
                },


                createColumnsA : function () {

                   var myColumns= this.getModelData()

                    var dynamicExcel = [];
                    for(var i=0; i< myColumns.length; i++) {

                        dynamicExcel.push({label: myColumns[i]["@Description"], 
                                           property: myColumns[i]["@Description"],
                                           width: '20'
                    });
                    }   

                    return dynamicExcel
                },
                createColumnsD : function () {

                    var myColumns= this.getModelData()
 
                     var dynamicExcel = [];
                     for(var i=0; i< myColumns.length; i++) {
 
                         dynamicExcel.push({label: myColumns[i]["@Description"], 
                                            property: myColumns[i]["@Description"],
                                            width: '20'
                     });
                     }   
 
                     return dynamicExcel
                 },

                createColumnsB : function () {
                    return [{
                        label: 'FURNACE_ENTRY_TIME',
                        property: 'FURNACE_ENTRY_TIME',
                        width: '20'
                    }, {
                        label: 'FURNACE_EXIT_TIME',
                        property: 'FURNACE_EXIT_TIME',
                        width: '20'
                    }, {
                        label: 'KTKID',
                        property: 'KTKID',
                        width: '20'
                    }, {
                        label: 'CASTID',
                        property: 'CASTID',
                        width: '20'
                    }, {
                        label: 'Y_CAP_FLM_MM',
                        property: 'Y_CAP_FLM_MM',
                        width: '20'
                    }, {
                        label: 'Y_KALITE_KTK',
                        property: 'Y_KALITE_KTK',
                        width: '20'
                    }, {
                        label: 'Y_KALITE_FLM',
                        property: 'Y_KALITE_FLM',
                        width: '20'
                    },

                    {
                        label: 'TURBO_SERME_KAFA_DEVREDE_STATUS',
                        property: 'TURBO_SERME_KAFA_DEVREDE_STATUS',
                       
                        width: '20'
                    },

                    {
                        label: 'STANDART_SERME_KAFA_DEVREDE_STATUS',
                        property: 'STANDART_SERME_KAFA_DEVREDE_STATUS',
                        
                        width: '20'
                    },

                    {
                        label: 'NORMALIZING_ROLLING_STATUS',
                        property: 'NORMALIZING_ROLLING_STATUS',
                        
                        width: '20'
                    },

                    {
                        label: 'LOW_TEMPERATURE_ROLLING_STATUS',
                        property: 'LOW_TEMPERATURE_ROLLING_STATUS',
                       
                        width: '20'
                    },
                    {
                        label: 'DESCALER_SU_BASINCI',
                        property: 'DESCALER_SU_BASINCI',
 
                        width: '20'
                    },
                    {
                        label: 'FIRIN_CIKIS_SICAKLIK',
                        property: 'FIRIN_CIKIS_SICAKLIK',
                        width: '20'
                    },
                    {
                        label: 'M1_KAFA_KESIM',
                        property: 'M1_KAFA_KESIM',
                        width: '20'
                    },
                    {
                        label: 'M1_KUYRUK_KESIM',
                        property: 'M1_KUYRUK_KESIM',
                        width: '20'
                    },
                    {
                        label: 'M2_KAFA_KESIM',
                        property: 'M2_KAFA_KESIM',
                        width: '20'
                    },
                    {
                        label: 'M2_KUYRUK_KESIM',
                        property: 'M2_KUYRUK_KESIM',
                        width: '20'
                    },
                    {
                        label: 'M3_KAFA_KESIM',
                        property: 'M3_KAFA_KESIM',
                        width: '20'
                    },
                    {
                        label: 'M3_KUYRUK_KESIM',
                        property: 'M3_KUYRUK_KESIM',
                        width: '20'
                    },
                    {
                        label: 'M4_KAFA_KESIM',
                        property: 'M4_KAFA_KESIM',
                        width: '20'
                    },
                    {
                        label: 'M4_KUYRUK_KESIM',
                        property: 'M4_KUYRUK_KESIM',
                        width: '20'
                    },
                    {
                        label: 'HADDE_FINIS_HIZI',
                        property: 'HADDE_FINIS_HIZI',
                        width: '20'
                    },
                    {
                        label: 'MONOBLOK_GIRIS_SICAKLIGI',
                        property: 'MONOBLOK_GIRIS_SICAKLIGI',
                        width: '20'
                    },
                    {
                        label: 'HADDELEME_SURESI',
                        property: 'HADDELEME_SURESI',
                        width: '20'
                    },
                    {
                        label: 'MONOBLOK_HIZI',
                        property: 'MONOBLOK_HIZI',
                        width: '20'
                    },
                    {
                        label: 'WB01_ACTUALFLOW',
                        property: 'WB01_ACTUALFLOW',
                        width: '20'
                    },
                    {
                        label: 'WB01_ENTERPRES_SURE',
                        property: 'WB01_ENTERPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB01_OUTPRES_SURE',
                        property: 'WB01_OUTPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB02_ACTUALFLOW',
                        property: 'WB02_ACTUALFLOW',
                        width: '20'
                    },
                    {
                        label: 'WB02_ENTERPRES_SURE',
                        property: 'WB02_ENTERPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB02_OUTPRES_SURE',
                        property: 'WB02_OUTPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB03_ACTUALFLOW',
                        property: 'WB03_ACTUALFLOW',
                        width: '20'
                    },
                    {
                        label: 'WB03_ENTERPRES_SURE',
                        property: 'WB03_ENTERPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB03_OUTPRES_SURE',
                        property: 'WB03_OUTPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB04_ACTUALFLOW',
                        property: 'WB04_ACTUALFLOW',
                        width: '20'
                    },
                    {
                        label: 'WB04_ENTERPRES_SURE',
                        property: 'WB04_ENTERPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB04_OUTPRES_SURE',
                        property: 'WB04_OUTPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB05_ACTUALFLOW',
                        property: 'WB05_ACTUALFLOW',
                        width: '20'
                    },
                    {
                        label: 'WB05_ENTERPRES_SURE',
                        property: 'WB05_ENTERPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB05_OUTPRES_SURE',
                        property: 'WB05_OUTPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB06_ACTUALFLOW',
                        property: 'WB06_ACTUALFLOW',
                        width: '20'
                    },
                    {
                        label: 'WB06_ENTERPRES_SURE',
                        property: 'WB06_ENTERPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'WB06_OUTPRES_SURE',
                        property: 'WB06_OUTPRES_SURE',
                        width: '20'
                    },
                    {
                        label: 'TMB4_MODUL_HIZI',
                        property: 'TMB4_MODUL_HIZI',
                        width: '20'
                    },
                    {
                        label: 'TMB_MODUL_SICAKLIK',
                        property: 'TMB_MODUL_SICAKLIK',
                        width: '20'
                    },
                    {
                        label: 'MHIZLI_ENABLE',
                        property: 'MHIZLI_ENABLE',
                        width: '20'
                    }, {
                        label: 'MHIZLI_KAFA_KESIM',
                        property: 'MHIZLI_KAFA_KESIM',
                        width: '20'
                    },
                    {
                        label: 'MHIZLI_KUYRUK_KESIM',
                        property: 'MHIZLI_KUYRUK_KESIM',
                        width: '20'
                    },
                   
                    ];
                },
                createColumnsC : function () {
                    return [{
                        label: 'FURNACE_ENTRY_TIME',
                        property: 'FURNACE_ENTRY_TIME',
                        width: '20'
                    }, {
                        label: 'FURNACE_EXIT_TIME',
                        property: 'FURNACE_EXIT_TIME',
                        width: '20'
                    }, {
                        label: 'KTKID',
                        property: 'KTKID',
                        width: '20'
                    }, {
                        label: 'CASTID',
                        property: 'CASTID',
                        width: '20'
                    }, {
                        label: 'Y_CAP_FLM_MM',
                        property: 'Y_CAP_FLM_MM',
                        width: '20'
                    }, {
                        label: 'Y_KALITE_KTK',
                        property: 'Y_KALITE_KTK',
                        width: '20'
                    }, {
                        label: 'Y_KALITE_FLM',
                        property: 'Y_KALITE_FLM',
                        width: '20'
                    },

                    {
                        label: 'ROLEYOLU_BASLANGIC_HIZI_x0020_msn',
                        property: 'ROLEYOLU_BASLANGIC_HIZI_x0020_msn',
                       
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_1',
                        property: 'CALISANFAN_1',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_2',
                        property: 'CALISANFAN_2',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_3',
                        property: 'CALISANFAN_3',
                       
                        width: '20'
                    },
                    {
                        label: 'CALISANFAN_4',
                        property: 'CALISANFAN_4',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_5',
                        property: 'CALISANFAN_5',
                       
                        width: '20'
                    },
                    {
                        label: 'CALISANFAN_6',
                        property: 'CALISANFAN_6',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_7',
                        property: 'CALISANFAN_7',
                       
                        width: '20'
                    },
                    {
                        label: 'CALISANFAN_8',
                        property: 'CALISANFAN_8',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_9',
                        property: 'CALISANFAN_9',
                       
                        width: '20'
                    },
                    {
                        label: 'CALISANFAN_10',
                        property: 'CALISANFAN_10',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_11',
                        property: 'CALISANFAN_11',
                       
                        width: '20'
                    },
                    {
                        label: 'CALISANFAN_12',
                        property: 'CALISANFAN_12',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_13',
                        property: 'CALISANFAN_13',
                       
                        width: '20'
                    },
                    {
                        label: 'CALISANFAN_14',
                        property: 'CALISANFAN_14',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_15',
                        property: 'CALISANFAN_15',
                       
                        width: '20'
                    },
                    {
                        label: 'CALISANFAN_16',
                        property: 'CALISANFAN_16',
                        
                        width: '20'
                    },

                    {
                        label: 'CALISANFAN_17',
                        property: 'CALISANFAN_17',
                       
                        width: '20'
                    },
                    {
                        label: 'CALISANFAN_18',
                        property: 'CALISANFAN_18',
                        
                        width: '20'
                    },

                    {
                        label: 'KAPAK_1_DURUM',
                        property: 'KAPAK_1_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_2_DURUM',
                        property: 'KAPAK_2_DURUM',
                        
                        width: '20'
                    },

                    {
                        label: 'KAPAK_3_DURUM',
                        property: 'KAPAK_3_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_4_DURUM',
                        property: 'KAPAK_4_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_5_DURUM',
                        property: 'KAPAK_5_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_6_DURUM',
                        property: 'KAPAK_6_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_7_DURUM',
                        property: 'KAPAK_7_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_8_DURUM',
                        property: 'KAPAK_8_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_9_DURUM',
                        property: 'KAPAK_9_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_10_DURUM',
                        property: 'KAPAK_10_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_11_DURUM',
                        property: 'KAPAK_11_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_12_DURUM',
                        property: 'KAPAK_12_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_13_DURUM',
                        property: 'KAPAK_13_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_14_DURUM',
                        property: 'KAPAK_14_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_15_DURUM',
                        property: 'KAPAK_15_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_16_DURUM',
                        property: 'KAPAK_16_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_17_DURUM',
                        property: 'KAPAK_17_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_18_DURUM',
                        property: 'KAPAK_18_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_19_DURUM',
                        property: 'KAPAK_19_DURUM',
                       
                        width: '20'
                    },
                    {
                        label: 'KAPAK_20_DURUM',
                        property: 'KAPAK_20_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_21_DURUM',
                        property: 'KAPAK_21_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_22_DURUM',
                        property: 'KAPAK_22_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_23_DURUM',
                        property: 'KAPAK_23_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_24_DURUM',
                        property: 'KAPAK_24_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_25_DURUM',
                        property: 'KAPAK_25_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_26_DURUM',
                        property: 'KAPAK_26_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_27_DURUM',
                        property: 'KAPAK_27_DURUM',
                        
                        width: '20'
                    },
                    {
                        label: 'KAPAK_28_DURUM',
                        property: 'KAPAK_28_DURUM',
                        
                        width: '20'
                    },

                    ];
                },

                onExport: function (oEvent) {
                          var TF= this.getView().byId("button5").getSelected();
                        var UH=  this.getView().byId("button6").getSelected();
                        var PH= this.getView().byId("button7").getSelected();
                        var TM= this.getView().byId("button8").getSelected();
                         var page;
                     if(TF==true){
                     page="A";
                     }
                     if(UH==true){
                        page="B";
                     }
                     if(PH==true){
                         page="C";
                     }
                     if(TM==true){
                        page="D";
                    }

                    
                    if(page=="A"){
                        var oColumns = this.createColumnsA();
 
                    var tableModel = this.getView().byId("table0").getModel();
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
                        fileName: "TAV_FIRIN" + this.exceldate1() + "-" + this.exceldate2()
                    };
                    var oSheet = new Spreadsheet(oSettings);
                    oSheet.build().then(function () {
                        MessageToast.show("Tablo Excel'e aktarıldı.");
                    });
                }



                if(page=="B"){
                    var oColumns = this.createColumnsB();

                var tableModel = this.getView().byId("table1").getModel();
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
                    fileName: "URETIM_HATTI" + this.exceldate1() + "-" + this.exceldate2()
                };
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build().then(function () {
                    MessageToast.show("Tablo Excel'e aktarıldı.");
                });
            }
            if(page=="C"){
                var oColumns = this.createColumnsC();

            var tableModel = this.getView().byId("table2").getModel();
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
                fileName: "PAKETLEME_HATTI" + this.exceldate1() + "-" + this.exceldate2()
            };
            var oSheet = new Spreadsheet(oSettings);
            oSheet.build().then(function () {
                MessageToast.show("Tablo Excel'e aktarıldı.");
            });
        }

        if(page=="D"){
            var oColumns = this.createColumnsD();

        var tableModel = this.getView().byId("table3").getModel();
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
            fileName: "TÜM_VERILER" + this.exceldate1() + "-" + this.exceldate2()
        };
        var oSheet = new Spreadsheet(oSettings);
        oSheet.build().then(function () {
            MessageToast.show("Tablo Excel'e aktarıldı.");
        });
    }







                  
                },
                   

            }
        );
    }
);