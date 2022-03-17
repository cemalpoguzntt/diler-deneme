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
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.Gun_Sayisi", 

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
                    //this.getModelData();
                  
                                      
                },
                day: function () {
                    var date1 = new Date();
                    var a = date1.getTime();
                    var b = this.getView().byId("dateRange").getDateValue().getTime();
                    var c = 24 * 60 * 60 * 1000,
                    diffDays = Math.round((a - b) / c);
                    diffDays=diffDays-1;
                    if (diffDays < 1) {
                      MessageBox.information(
                        "Lütfen bugünün tarihinden önce bir tarih seçimi yapınız! "
                      );
                      this.getView().byId("label8").setText("");
                    }
                    
                    else {
                      this.getView().byId("label8").setText(diffDays);
                    }
                },
          
                gonder : function(){
          
                                  var d1 = (this.getView().byId("dateRange").getDateValue().getDate()).toString();
                                  if (d1.length == "1"){ d1 = "0" + d1 ; }
                                  else{d1=d1};
                                   
                                  var m1 = (this.getView().byId("dateRange").getDateValue().getMonth()+1).toString();
                                  if (m1.length == "1"){ m1 = "0" + m1 ; }
                                  else{m1=m1};
          
                                  var y1 = this.getView().byId("dateRange").getDateValue().getFullYear();
                                  var datenow= y1+""+ m1+""+ d1;
          
                                  
          
          
                  var response = TransactionCaller.sync(
                    "Automation/CELIKHANE/SINTER01-02/T_CHECKING_DATE",
          
                    {
                      I_DATE : datenow,
                    },
                    "O_JSON"
                  );
          
                  if (response[1] == "E") {
                    alert(response[0]);
          
                  } else {
          
          
          
                    var diffDays = this.getView().byId("label8").getText();
          
                    if (diffDays < 1) {
                        MessageBox.information(
                          "Lutfen Yeni tarih seçiniz "
                        );
                        this.getView().byId("label8").setText("");
                      }
                      
                      else {
                        this.getView().byId("label8").setText("");
                      
                  
                    var response = TransactionCaller.sync(
                      "Automation/CELIKHANE/SINTER01-02/T_SINTERS_WORKFLOW",
          
                      {
                        I_DAYSBEFORE : diffDays
                      },
                      "O_JSON"
                    );
          
                    if (response[1] == "E") {
                      alert(response[0]);
                    } else {
                      
                      MessageBox.information("Veri Başarılı bir şekilde gönderildi");
                     
                    }
                }
              }
                  },
          

                   
              
                

            }
        );
    }
);