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
        coreLibrary,
         Core,
         Spreadsheet     
    ) {
        "use strict";
        var that;
        var intervalState=true;
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.flmCamSignalLogs", 

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
                    this.getView().byId("picker0").setValue(this.time());
                    var intervalState=true;
                 this.getModelData();
                 this.modelServices();
                 this.haschange();
                   
                    
                    
              
                },

                time: function () {
                    var day1 = new Date().getDate();
                    var month1 = new Date().getMonth() + 1;
                    var fullyear1 = new Date().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                    
                },
                date1: function () {
                    if( this.getView().byId("picker0").getDateValue()==null)
                    {alert("Lütfen From-To(Tarih Aralığı) alanını boş bırakmayınız");}
                        var day1 = this.getView().byId("picker0").getDateValue().getDate(); 
                        var month1 =this.getView().byId("picker0").getDateValue().getMonth() + 1;
                        var fullyear1 = this.getView().byId("picker0").getDateValue().getFullYear();
                        return fullyear1 + "-" + month1 + "-" + day1;
                      },
                      date2: function () {
                        if( this.getView().byId("picker0").getDateValue()==null)
                        {alert("Lütfen From-To(Tarih Aralığı) alanını boş bırakmayınız");}
                            var day1 = this.getView().byId("picker0").getDateValue().getDate()+1; 
                            var month1 =this.getView().byId("picker0").getDateValue().getMonth() + 1;
                            var fullyear1 = this.getView().byId("picker0").getDateValue().getFullYear();
                            return fullyear1 + "-" + month1 + "-" + day1;
                          },
  


                getModelData: function () {

                    var date = this.date1();
                    var date2 = this.date2();
                    
                    var response = TransactionCaller.sync(                 
                       "MES/Itelli/FLM/FLM_CAMERA/T_GETTIN_CAM_LOGS",  
                        {
                            I_DATE: date,
                            I_DATE2: date2,
                
                        },
                        "O_JSON"
                    );

                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    
                    if (response[0].Rowsets.Rowset.Row == null) {
                      

                    }
                    else {
                        
                
                    
                                     
                    
                    this.KtkNumber(tableModel);
                    }
                },

                KtkNumber: function(tableModel){
                    for (var i = tableModel.oData.length, k=0; i > 0 ; i--) {
                        if(tableModel.oData[i-1].BARCODE!="NoRead"){
                            k++;
                        }

                    }
                    
                    for (var i = 0;  i < tableModel.oData.length; i++) {
                       if(tableModel.oData[i].BARCODE!="NoRead"){
                        tableModel.oData[i].SIRA=k;
                        k--;
                    }
                    else{
                    tableModel.oData[i].SIRA="-";
                   
                    
                    }
                    }
                    this.getView().byId("table0").setModel(tableModel); 
                    this.getView().byId("table0").getModel().setSizeLimit(10000); 

                },
                modelServices: function () {
                 
                   var oTrigger = new sap.ui.core.IntervalTrigger(7000);
                    oTrigger.addListener(() => {
                        if (intervalState==true) {
                      
                            this.getModelData();

                        
                        console.log("interval çalışıyor");
                        }
                    }, this);
                },
                haschange:function(){
                    window.onhashchange=function(){
                         if(window.location.href.includes("Z_CamLogs"))
                      {
                          
                        }
                           else{
                              clearInterval(this.modelServices);
                              clearInterval(that.modelServices);
                              clearInterval(self.modelServices);
                              intervalState=false;
                             
                                     }
                                      };
                      },
          


                stateChange:function(){

                

                if(intervalState==true){
                    intervalState=false;
                    this.getView().byId("guncelleme").setText("Güncelleme Kapalı");
                    this.getView().byId("guncelleme").setType("Reject");

                }
                else{
                    intervalState=true;
                    this.getView().byId("guncelleme").setText("Güncelleme Açık");
                    this.getView().byId("guncelleme").setType("Accept");
                    
                }

                },
                
                createColumns : function () {
                    return [{
                        label: 'GÜNÜN KÜTÜK SAYISI',
                        property: 'SIRA',
                        width: '20'
                    }, {
                        label: 'ADRESS',
                        property: 'ADRESS',
                        width: '20'
                    }, {
                        label: 'BARCODE',
                        property: 'BARCODE',
                        width: '20'
                    },
                    {
                        label: 'INSDATE',
                        property: 'INSDATE',
                        width: '20'
                    }
                ];
            },
            exceldate1: function () {
                var day1 = this.getView().byId("picker0").getDateValue().getDate();
                var month1 = this.getView().byId("picker0").getDateValue().getMonth() + 1;
                var fullyear1 = this.getView().byId("picker0").getDateValue().getFullYear();
                return day1 + "." + month1 + "." + fullyear1;
            },

            onExport: function (oEvent) {

                var oColumns = this.createColumns();
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
                    fileName: "CameraLogs" + this.exceldate1() 
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