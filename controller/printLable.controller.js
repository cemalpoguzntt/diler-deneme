sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "customActivity/scripts/custom",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "customActivity/scripts/customStyle",
    "sap/ui/model/FilterType"
  ],

  function (
    Controller,
    JSONModel,
    MessageBox,
    customScripts,
    formatter,
    Filter,
    FilterOperator,
    customStyle,
    FilterType
  ) {
    //"use strict";
    var that;
    var interVal;
    var newItem;
    var selectedRow;
    return Controller.extend("customActivity.controller.printLable", {
      formatter: formatter,

      onInit: function () {
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.interfaces = this.appComponent.getODataInterface();

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
    this.getCastList();
    this.onPressSearch();
      },
onPressSearch: function (oEvent) {
            var plant = this.appData.plant;
        var workcenterID = this.appData.node.workcenterID;
        var nodeID = this.appData.node.nodeID;

        var filterSearch = this.getView().byId("filterSearch").getValue();
        var workcenterID = this.appData.node.workcenterID;
        var selectedDatePeriod = this.getView().byId("idDatePicker").getValue();
        var selectedSecondDate = new Date(
          this.getView().byId("idDatePicker").getSecondDateValue()
        );
        var selectedSecondNextDate = new Date(selectedSecondDate);
        selectedSecondNextDate.setDate(selectedSecondNextDate.getDate() + 1);
        var selectedSecondNextDateValue =
          selectedSecondNextDate.getDate() +
          "." +
          (selectedSecondNextDate.getMonth() + 1) +
          "." +
          selectedSecondNextDate.getFullYear();
        var selectedDatePeriodValues = selectedDatePeriod.split(" - ");
        var SelectCast = this.getView().byId("idSelectCast").getSelectedKey();

        var standart=this.getView().byId("STD").getSelected();
        var standartdisi=this.getView().byId("STD_DISI").getSelected();
        var sapma=this.getView().byId("SAPMA").getSelected();
        var kısaktk=this.getView().byId("KISAKTK").getSelected();
        var hurda=this.getView().byId("HURDA").getSelected();
        var karisim=this.getView().byId("KARISIM").getSelected();


            if (standart == true) {
		standart="S"
            } 

            if (standartdisi == true) {
		standart="X"
            } 

            if (standart == false) {
		standart=""
            } 
            if (sapma == true) {
		sapma="X"
              
            } else {
            	sapma=""
            }
            if (kısaktk == true) {
		kısaktk="X"
              
            } else {
            	kısaktk=""
            }
            if (hurda == true) {
		hurda="X"
              
            } else {
            	hurda=""
            }
            if (karisim == true) {
		karisim="X"
              
            } else {
            	karisim=""
            }



        var params = {
          "Param.1": SelectCast,
          "Param.2": selectedDatePeriodValues[0],
          "Param.3": selectedDatePeriodValues[1],
          "Param.4": plant,
          "Param.5": standart,
          "Param.6": sapma,
          "Param.7": kısaktk,
          "Param.8": hurda,
          "Param.9": karisim
        };

            var tRunner = new TransactionRunner("MES/UI/PrintLable/getLabelDataQry",params);
            if (!tRunner.Execute()) {
                MessageBox.error(tRunner.GetErrorMessage());
                return null;
            };
            var odata = tRunner.GetJSONData();
            var oModel = new JSONModel();
            oModel.setData(odata);
            this.getView().setModel(oModel, "genelData");
        },
            getCastList: function () {
                var plant = this.appData.plant;
                var selectedSecondDate = new Date(
                    this.getView().byId("idDatePicker").getSecondDateValue()
                );
                var selectedSecondNextDate = new Date(selectedSecondDate);
                selectedSecondNextDate.setDate(selectedSecondNextDate.getDate() + 1);
                var selectedSecondNextDateValue =
                    selectedSecondNextDate.getDate() +
                    "." +
                    (selectedSecondNextDate.getMonth() + 1) +
                    "." +
                    selectedSecondNextDate.getFullYear();
                var selectedDatePeriod = this.getView().byId("idDatePicker").getValue();
                var selectedDatePeriodValues = selectedDatePeriod.split(" - ");

                var params = {
                    "Param.1": plant,
                    "Param.2": selectedDatePeriodValues[0],
                    "Param.3": selectedSecondNextDateValue,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/PrintLable/getCastNoQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callCastList);
            },
            callCastList: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "castListModel");
            },
            onChangeCastNumber: function (oEvent) {
                var rows = this.getView().getModel("castListModel").oData;
                if (!rows) return;
                var newInformation;
                var castSelected = this.appData.castSelected;
                var type = oEvent.getSource().getType();
                if (type == "Accept") {
                    newInformation = rows[parseFloat(castSelected) + 1];
                    if (!!newInformation)
                        this.appData.castSelected = parseFloat(castSelected) + 1;
                } else if (type == "Reject") {
                    newInformation = rows[parseFloat(castSelected) - 1];
                    if (!!newInformation)
                        this.appData.castSelected = parseFloat(castSelected) - 1;
                }
                if (!!newInformation) {
                    var cast = this.getView().byId("idSelectCast");
                    cast.setValue(newInformation.CASTID);
                    cast.setSelectedKey(newInformation.SUP_AUFNR);
                }

                this.onPressSearch();
            },
            changeCastingNumber: function (oEvent) {
var selectCast = this.getView().byId("idSelectCast");
                if (!!oEvent)
                    this.appData.castSelected = oEvent
                        .getSource()
                        .getSelectedItem()
                        .oBindingContexts.castListModel.sPath.split("/")[1]; 
                var plant = this.appData.plant;
                

            },
        onPressPrintManual: function (oEvent) {
          selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.genelData.sPath.split( "/")[3];

          var noSelected = this.appComponent.oBundle.getText(
            "OEE_LABEL_ERROR_NO_SELECTED"
          );
          if (selectedRow < 0) {
            MessageBox.error(noSelected);
            return;
          } else {
            sap.m.MessageBox.success(
              this.appComponent.oBundle.getText(
                "Etiket çıkartmak istediğinize emin misiniz?"
              ),
              {
                actions: [
                  this.appComponent.oBundle.getText("EVET"),
                  this.appComponent.oBundle.getText("HAYIR"),
                ],
                onClose: function (oAction) {
                  if (oAction == "EVET") {
		this.printLableQuan();
                   // this.printLabelManual(selectedRow);
                  }
                }.bind(this),
              }
            );
          }
        },
       onSelectConfirmType: function (oEvent) {
          if (!oEvent.getParameter("selected")) {
            return;
          }
          var prm = oEvent.getParameter("id").split("--")[1];
          this.prm = prm;
  
          var aufnr = this.appData.selected.order.orderNo;
          var plant = this.appData.plant;
          var workCenterId = this.appData.node.workcenterID;
          var params = { I_AUFNR: aufnr, I_PLANT: plant, I_SELECTEDTYPE: prm,I_WORKCENTERID:workCenterId };
  
          var tRunner = new TransactionRunner(
            "MES/UI/Haddehane/Package/changeRadioButtonXqueryY",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callChangeRadioButton);
  
    
        },

        printLabelManual: function () {
          var tableModel = this.getView().getModel("genelData").oData;

          var ENTRY_ID = tableModel[0].Row[selectedRow].ENTRY_ID;
          var aufnr = tableModel[0].Row[selectedRow].AUFNR;
          var workcenterid = this.appData.node.workcenterID;
            var quantity = this.getView().byId("quantity").getValue();


          var plant = this.appData.plant;
          var params = {
             I_ENTRYID:ENTRY_ID,
            I_AUFNR:aufnr,
            I_WERKS: plant,
            I_WORKCENTER: workcenterid,
	  I_QUANTITY:quantity,
          };
          var tRunner = new TransactionRunner(
            "MES/Integration/Label/DCH/sendLabelDCHXqry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callPrintManual);
        },
          callPrintManual: function (p_this, p_data, oAction) {
          p_this.handleCancel();
          sap.m.MessageToast.show("Manuel etiket çıkarma başarılı");
        },
          printLableQuan: function (oEvent) {
            var oView = this.getView();
            var oDialog = oView.byId("addBilletToFurnaceMill");
            if (!oDialog) {
              oDialog = sap.ui.xmlfragment(
                oView.getId(),
                "customActivity.fragmentView.printLableQuan",
                this
              );
              oView.addDependent(oDialog);
            }
            this.appData.oDialog = oDialog;
            oDialog.open();            
          },
	handleCancel:function(oEvent){
		 this.appData.oDialog.close()
	},

    });
  }

);