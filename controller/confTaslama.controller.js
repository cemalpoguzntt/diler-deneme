sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "customActivity/scripts/custom",
        "customActivity/scripts/customStyle",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterType",
        "sap/ui/core/Fragment",
        "sap/m/Dialog",
        "sap/m/Label",
        "sap/m/Button",
        "sap/m/ButtonType",
        "customActivity/scripts/transactionCaller"
  
    ],
  
    function (
        Controller,
        JSONModel,
        MessageBox,
        customScripts,
        customStyle,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        Fragment,
        Dialog,
        Label,
        Button,
        ButtonType,
        TransactionCaller
    ) {
        //"use strict";
        var that;
  
        return Controller.extend("customActivity.controller.confTaslama", {
           
  
            formatter: formatter,
  
            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.appData.intervalState = true;
                that = this;
                
              
                this.modelServices();
                
                this.haschange();
                this.getOnlyQuantity(); 
  
                //Filtrelemede bugünün tarihini seçer
                var today = new Date();
                setYest =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                setTom =
                    today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                this.getView()
                    .byId("idDatePicker")
                    .setValue(setYest + " - " + setTom);
                    
                    this.getBilletList();
            },

            callLabelQuan: function () { },
  
            
            onChangeLabelQuan: function () {
                var labelQuan = this.getView().byId("setLabelQuan").getValue();

                TransactionCaller.async(
                    "MES/UI/Filmasin/TASLAMA ETİKET/labelQuantity",
                    {
                        I_ADET: labelQuan,
                    },
                    "O_JSON",
                 this.onChangeLabelQuanCB,
                    this
                );
            },

            onChangeLabelQuanCB: function (iv_data, iv_scope) {
                var myModel = new sap.ui.model.json.JSONModel();
                if (Array.isArray(iv_data[0].Rowsets?.Rowset?.Row)) {
                    myModel.setData(iv_data[0]);   
                    
                    var adet = iv_data[0].LABELQUANTITY;
                    this.getView().byId("setLabelQuan").setValue(adet);
                }
              
              
            },

            getOnlyQuantity:function(){
                TransactionCaller.async(
                    "MES/UI/Filmasin/TASLAMA ETİKET/onlyGetQuantity",
                    {
                       
                    },
                    "O_JSON",
                    this.getOnlyQuantityCB,
                    this
                );

            },
            getOnlyQuantityCB:function(iv_data, iv_scope){
                var myModel = new sap.ui.model.json.JSONModel();
                var adet = iv_data[0].Rowsets.Rowset.Row.LABELQUANTITY
           
                that.getView().byId("setLabelQuan").setValue(adet);
                


            },

   
  
            getBilletList: function (oEvent) {
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
              
                var date1 = this.date1();
                      var date2 = this.date2();
                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM_TAS/confTaslama",
                    {
                       I_DATE1: date1,
                       I_DATE2: date2,
                        
                    },
                    "O_JSON"
                  );

                  var ObjArr = Array.isArray(response[0].Rowsets.Rowset.Row)? response[0].Rowsets.Rowset.Row
                : new Array(response[0].Rowsets.Rowset.Row);
                var Model = new sap.ui.model.json.JSONModel(ObjArr);
                          
                 this.getView().byId("CONFTaslama").setModel(Model);
                
      
            },
            date1: function () {
                if( that.getView().byId("idDatePicker").getDateValue()==null){

                    return  today.getDate() +
                    "." +
                    (today.getMonth() + 1) +
                    "." +
                    today.getFullYear();
                }
               
                    var day1 =  this.getView().byId("idDatePicker")?.getDateValue()?.getDate();
                    var month1 =
                      this.getView().byId("idDatePicker")?.getDateValue()?.getMonth() + 1;
                    var fullyear1 = this.getView()
                      .byId("idDatePicker")?.getDateValue()?.getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                  },


                  date2: function () {
                    if( this.getView().byId("idDatePicker").getSecondDateValue()==null){

                       return  today.getDate() +
                        "." +
                        (today.getMonth() + 1) +
                        "." +
                        today.getFullYear();
                    }
                 
                        var day1 = this.getView().byId("idDatePicker")?.getSecondDateValue()?.getDate()+1;
                        
                        var month1 =
                          this.getView().byId("idDatePicker")?.getSecondDateValue()?.getMonth() + 1;
                          if(month1==02||month1==04||month1==06||month1==09||month1==11&&day1==31){
                            day1=1;
                            month1=month1+1;
                        } 
                        var fullyear1 = this.getView()?.byId("idDatePicker")?.getSecondDateValue()?.getFullYear();
                        return fullyear1 + "-" + month1 + "-" + day1;
                      },

            changeIntervalState: function (oEvent) {
                oButton = this.getView().byId("chkIntervalState");
                if (this.appData.intervalState == true) {
                    this.appData.intervalState = false;
                    oButton.setType("Reject");
                    oButton.setText("Otomatik Güncelleme Kapalı");
                } else {
                    var selectedItems = this.getView().byId("CONFTaslama").getSelectedItems();
                    var selectedLength = selectedItems.length;
                    if(selectedLength<1){
                    this.appData.intervalState = true;
                    this.getView().byId("chkIntervalState").setType("Accept");
                    oButton.setText("Otomatik Yenileme Açık");
                }
            else{

                MessageBox.error("Önce seçili Satırları Kaldırınız!")
            }}
            },
  
            billetItemSelected: function (oEvent) {
                var stat =
                    this.getView().byId("CONFTaslama").getSelectedItems()
                        .length > 0 ? true : false;
     
                if (stat > 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
                    //   rejectedButton.setEnabled(true);
                } else if (stat == 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
                    //  rejectedButton.setEnabled(true);
                } else {
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                    // rejectedButton.setEnabled(false);
                }
  
  
            },

            modelServices: function() {
                var self = this;
                this.intervalHandle = setInterval(function() { 
                    if (self.appData.intervalState == true) {
                        console.log("int çalışıyor")
                        self.getBilletList();
                    }
                 },  6000);
          },
  
          

            LabelTas :function(){
              
                var selectedItems = this.getView().byId("CONFTaslama").getSelectedItems();
                var selectedLength = selectedItems.length;
                var searchData = this.getView().byId("CONFTaslama").getModel().oData;

                if (selectedLength <= 0) {
                    MessageBox.error("Lütfen Seçim yapınız!");
                    return;
                }
                var labelQuan = this.getView().byId("setLabelQuan").getValue();

                var IDS = [];
                for (var index = 0; index < selectedLength; index++) {
                var path = selectedItems[index].oBindingContexts.undefined.sPath.substring(1);
                var id= searchData[path].ID;  
                IDS.push(id);
                
              
                }
                var IDList = IDS.toString().replace('"', "");

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM_TAS/ETİKET/T_SEND_LABEL_TAS",
        
                    {
                      I_ADET:labelQuan,
                      I_IDLIST:IDList
                    },
                    "O_JSON"
                  );
                  if (response[1] == "E") {
                    MessageBox.error(response[0]);
                  } else {
                    MessageBox.information(
                      "Etiketler Çıkıyor"
                    );
       }
      

            },
            TeyitIptal : function (oEvent) {
              
               
                var searchData = this.getView().byId("CONFTaslama").getModel().oData;
                selectedIndex=oEvent.oSource.getParent().getBindingContextPath().split("/")[1]
                var confo= searchData[selectedIndex].CONFNO;  
                var counter= searchData[selectedIndex].COUNTER;
                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM_TAS/TEYIT IPTAL/teyitIptal",
        
                    {
                      I_CONFNO : confo,
                      I_COUNTER : counter
                    },
                    "O_JSON"
                  );
                  if (response[1] == "E") {
                    MessageBox.error("Teyit İptal edilemedi");
                  } else {
                    MessageBox.information(
                      "Teyip İptal Edildi"
                    );
                }
            
                      

                          

                  
                
            },
            haschange:function(){

          window.onhashchange=function(){
               if(window.location.href.includes("Z_CONF_TAS"))
            {
                
              }
                 else{
                    clearInterval(this.intervalHandle);
                    clearInterval(that.intervalHandle);
                    clearInterval(self.intervalHandle);
                           }

                            };


            },

            onExit: function () {
                this.appComponent
                    .getEventBus()
                    .unsubscribe(
                        this.appComponent.getId(),
                        "orderChanged",
                        this.refreshReported,
                        this
                    );
                if (this.intervalHandle) clearInterval(this.intervalHandle);
                
            },
        });
    }
  );