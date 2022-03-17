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
      "sap/ui/core/library",
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
        "customActivity.controller.Input_Sayac_Screen",
  
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
            // this.getModelData();
            this.getTableModel();
          },
  
          openFragment: function () {
            if (!this._oDialogSayac) {
              this._oDialogSayac = sap.ui.xmlfragment(
                "Fragment3",
                "customActivity.fragmentView.Sayac",
                this
              );
              this.getView().addDependent(this._oDialogSayac);
            }
            this._oDialogSayac.open();
            this.GetModel();
          },
          onCancelFragment: function () {
            this._oDialogSayac.close();
          },

          openFragment2: function () {
            if (!this._oDialogSayac2) {
              this._oDialogSayac2 = sap.ui.xmlfragment(
                "Fragment2",
                "customActivity/fragmentView/Manuel_Sayac_Giris",  
                this
              );
              this.getView().addDependent(this._oDialogSayac2);
            }
            this._oDialogSayac2.open();
            
          },
          onCancelFragment2: function () {
            this._oDialogSayac2.close();
          },


          day: function () {
            var date1 = new Date();
            var a = date1.getTime();
            var b = sap.ui.core.Fragment.byId("Fragment2","dateRange").getDateValue().getTime();
            var c = 24 * 60 * 60 * 1000,
            diffDays = Math.round((a - b) / c);
            // diffDays=diffDays-1;
            if (diffDays < 1) {
              MessageBox.information(
                "Lütfen bugünün tarihinden önce bir tarih seçimi yapınız! "
              );
         
              sap.ui.core.Fragment.byId("Fragment2", "label8").setText("");
            }
            
            else {
              sap.ui.core.Fragment.byId("Fragment2", "label8").setText(diffDays);

            }
        },
  
        gonder : function(){
  
                         
  
  
  
            var diffDays = sap.ui.core.Fragment.byId("Fragment2", "label8").getText();
  
            if (diffDays < 1) {
                MessageBox.information(
                  "Lutfen Yeni tarih seçiniz "
                );
                sap.ui.core.Fragment.byId("Fragment2", "label8").setText("");
              }
              
              else {
                
              
          
            var response = TransactionCaller.sync(
              "MES/Empty/T_SEND_SAYAC_VALUES_NEW", 
  
              {
                I_DATE : diffDays
              },
              "O_JSON"
            );
  
            if (response[1] == "E") {
              alert(response[0]);
              sap.ui.core.Fragment.byId("Fragment2", "label8").setText("");
            } else {
              
              MessageBox.information("Veri Başarılı bir şekilde gönderildi");
              sap.ui.core.Fragment.byId("Fragment2", "label8").setText("");
            }
        }
        

      
          },


  
          getTableModel: function () {
            var response = TransactionCaller.sync(
              "MES/Empty/T_GET_TABLEMODEL",
              {},
              "O_JSON"
            );
    
            response[0].Rowsets.Rowset.Row = Array.isArray(
              response[0].Rowsets?.Rowset.Row
            )
              ? response[0].Rowsets.Rowset.Row
              : new Array(response[0].Rowsets.Rowset.Row);
            var tableModel = new sap.ui.model.json.JSONModel();
            tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
            this.getView().byId("Table1").setModel(tableModel);
            this.getView().byId("Table1").getModel().refresh();
          },
  
          GetModel: function () {
            var response = TransactionCaller.sync(
              "MES/Empty/T_GET_OLCUMNO",
              {},
              "O_JSON"
            );
  
            response[0].Rowsets.Rowset.Row = Array.isArray(
              response[0].Rowsets?.Rowset.Row
            )
              ? response[0].Rowsets.Rowset.Row
              : new Array(response[0].Rowsets.Rowset.Row);
            var fragmentModel = new sap.ui.model.json.JSONModel();
            fragmentModel.setData(response[0]?.Rowsets?.Rowset?.Row);
  
            sap.ui.core.Fragment.byId("Fragment3", "id1").setModel(fragmentModel);
            sap.ui.core.Fragment.byId("Fragment3", "id1").getModel().refresh();
          },
  
  
  
  
          onPressSave: function () {
            var input1 = sap.ui.core.Fragment.byId(
              "Fragment3",
              "id1"
            ).getSelectedKey();
            var input2 = sap.ui.core.Fragment.byId(
              "Fragment3",
              "selectBox"
            ).getSelectedKey();
  
            var input3 = sap.ui.core.Fragment.byId(
              "Fragment3",
              "id1"
            ).getValue();
            var words = input3.split('- ');
            input3 = words[1];
    
           
    
            if (input1 == "" || input2 == ""||  input3 == "") {
              MessageBox.error("Lütfen gerekli alanları doldurunuz");
              return;
            }
    
            var response = TransactionCaller.sync(
              "MES/Empty/T_INSERT_SAYAC",
              {
                I_SAYACID: input1,
                I_PLANT: input2,
                I_NAME:input3
              },
              "O_JSON"
            );
    
            if (response[1] == "E") {
              MessageBox.information(response[0]);
              sap.ui.core.Fragment.byId("Fragment3", "id1").setValue("");
              sap.ui.core.Fragment.byId("Fragment3", "selectBox").setValue("");
    
              return;
            }
    
            this.onCancelFragment();
            MessageBox.information("Kayıt Başarılı");
            sap.ui.core.Fragment.byId("Fragment3", "id1").setValue("");
            sap.ui.core.Fragment.byId("Fragment3", "selectBox").setValue("");
  
            this.getTableModel();
            
          },
          deletefunction: function () {
              var selected = this.getView().byId("Table1").getSelectedContextPaths();
    
              selected.forEach(function (item, i) {
                var a = selected[i];
                var selectedModel = that.getView().byId("Table1").getModel().getObject(a);
                var key = selectedModel.DEVICE_ID;
                var response = TransactionCaller.sync(
                  "MES/Empty/T_DELETE_SECILI",
                  {
                    I_IDKEY: key
                  },
                  "O_JSON"
                );
              });
              this.getTableModel();
            },
  
  
            createColumns : function () {
              return [{
                  label: 'DEVICE_ID',
                  property: 'DEVICE_ID',
                  width: '20'
              }, {
                  label: 'NAME',
                  property: 'NAME',
                  width: '20'
              }, {
                  label: 'PLANT',
                  property: 'PLANT',
                  width: '20'
                }
  
              ];
          },
  
          onExport: function (oEvent) {
  
            var oColumns = this.createColumns();
            var tableModel = this.getView().byId("Table1").getModel();
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
                fileName: "Sayac_Girisleri"
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
  