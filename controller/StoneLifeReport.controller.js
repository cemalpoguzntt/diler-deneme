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
            "customActivity.controller.StoneLifeReport",

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
                    

                    this.getMessageModel();

                },

                


         

         
    

                getMessageModel: function (date1,date2) {
                                  
               /*      var d1 = moment(date1).format('YYYY-MM-DD');
                    var d2 = moment(date2).format('YYYY-MM-DD'); */

                    var response = TransactionCaller.sync(
						"MES/Itelli/TAS/T_STONELIFE",
						{
                           
                        },
						"O_JSON"
					);
					var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
					var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
					
					this.getView().byId("idOrdersTable").setModel(tableModel);
					this.getView().byId("idOrdersTable").getModel().refresh();

                    
                   
                                   
                },

                tasBazli: function (date1,date2) {
                                  
                    /*      var d1 = moment(date1).format('YYYY-MM-DD');
                         var d2 = moment(date2).format('YYYY-MM-DD'); */
              
                         var response = TransactionCaller.sync(
                             "MES/Itelli/TAS/T_STONELIFE",
                             {
                                 I_TASBAZLI:"X"
                                
                             },
                             "O_JSON"
                         );
                         var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                         var tableModel = new sap.ui.model.json.JSONModel(modelArrr);
                         
                         this.getView().byId("idOrdersTable").setModel(tableModel);
                         this.getView().byId("idOrdersTable").getModel().refresh();
     
                         
                        
                                        
                     },
                
        //         guncelle : function () {
               
        //           var selected= this.getView().byId("idOrdersTable")?.getSelectedContextPaths()[0].split("/")[1];
        //           var id=this.getView().byId("idOrdersTable")?.getModel().oData[selected].ID
        //           var year = sap.ui.core.Fragment.byId("updateStoneTime", "idStartDatePicker").getDateValue().getFullYear();
        //           var month = sap.ui.core.Fragment.byId("updateStoneTime", "idStartDatePicker").getDateValue().getMonth()+1;
        //           var day =sap.ui.core.Fragment.byId("updateStoneTime", "idStartDatePicker").getDateValue().getDate();
        //           var date= year+"-"+month+"-"+day;

        //           var response = TransactionCaller.sync(
        //             "MES/Itelli/TAS/TAS_GUNCELLEME/updateManuByStone",
        //             {
        //                I_ID:id,
        //                I_DATE:date
        //             },
        //             "O_JSON"
        //         );
        //         if (response[1] == "E") {
        //       alert(response[0]);
        //     } else {
        //         sap.ui.core.Fragment.byId("updateStoneTime", "idStartDatePicker").setValue("");
        //         this.onCancelFrag01();
        //       MessageBox.information(
        //         "Veriler Başarılı bir şekilde kayıt edildi");
               
        //                   }

                         
        //         },
        //         updateStoneTimeFragment: function () {

        //             if(this.getView().byId("idOrdersTable")?.getSelectedContextPaths().length<=0){
        //                 MessageBox.error(
        //                     "Lütfen seçim yapınız");
        //                     return;
        //               }
    
    
                      
        //               var selected= this.getView().byId("idOrdersTable")?.getSelectedContextPaths()[0].split("/")[1];
        //               if (selected != (this.getView().byId("idOrdersTable")?.getModel()?.getData().length -1)) {
        //                 MessageBox.error("Son sıradaki taş güncelleneblir.");
        //                 return;
        //             }
        //             if (!this._oDialog01) {
        //                 this._oDialog01 = sap.ui.xmlfragment(
        //                     "updateStoneTime",
        //                     "customActivity.fragmentView.updateStoneTime",
        //                     this
        //                 );
        //                 this.getView().addDependent(this._oDialog01);
        //             }
        //             this._oDialog01.open();

    
        //              },
          
        //   onCancelFrag01: function () {
        //             this._oDialog01.close();
        //           },

             


             

                backMainPanel : function () {

                    this.appComponent.getRouter().navTo("activity", {
                         activityId: "Z_FilmasinReport",
 
                         
                        });

                },


                createColumns: function () {
                                        return [{
                                            label: 'Kayıt Tarihi',
                                            property: 'INSDATE',
                                            width: '20'
                                        }, {
                                            label: 'Taş Kodu',
                                            property: 'STONE_CODE',
                                            width: '20'
                                        }, {
                                            label: 'Menşei',
                                            property: 'MENSEI',
                                            width: '20'
                                        }, {
                                            label: 'MODEL',
                                            property: 'MODEL',
                                            width: '20'
                                        }, {
                                            label: 'Toplam Üretim',
                                            property: 'TOPLAMU',
                                            width: '20'
                                        }, 
                                       
                                     
                                        ];
                                    },
                                    onExport: function (oEvent) {
                                        var oColumns = this.createColumns();
                                        var tableModel = this.getView().byId("idOrdersTable").getModel();
                                        if (!(!!tableModel?.oData)) { // 2 adet ünlem konursa işlemi booelan olarak verir yani eğer data varsa içerisi true olur en baştaki ünlem ile tekrar false olur ve if çalışmaz
                                            MessageBox.error("Tabloda veri bulunmamaktadır.");
                                            return;
                                        }
                                        var oDatas = tableModel.getData();
                                        if (!(!!oDatas)) {
                                            MessageBox.error("Tabloda veri bulunmamaktadır.");
                                            return;
                                        }
                                        var oSettings = {
                                            workbook: {
                                                columns: oColumns
                                            },
                                            dataSource: oDatas,
                                            fileName: "Tas_Rapor"
                                        };
                                        var oSheet = new Spreadsheet(oSettings);
                                        oSheet.build().then(function () {
                                            MessageToast.show("Tablo Excel'e aktarıldı.");
                                        });
                                    },

                  


               




    }
);
    }
);