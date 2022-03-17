sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "customActivity/scripts/custom",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
  ],

  function (
    Controller,
    JSONModel,
    MessageBox,
    customScripts,
    formatter,
    Filter,
    FilterOperator,
    FilterType
  ) {
    //"use strict";
    var that;

    return Controller.extend("customActivity.controller.oeeRoleKTKIDList", {
      /**
       * Called when a controller is instantiated and its View controls (if available) are already created.
       * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
       */

      formatter: formatter,

      onInit: function () {
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.interfaces = this.appComponent.getODataInterface();
       this.getBilletList();
       this.modelServices();
      },
/**
      onOpenRejectDialog:function(oEvent){
          var selectedBilletLength = this.byId("tblBilletMaster").getSelectedItems()
          .length;
           var noBilletSelected = this.appComponent.oBundle.getText(
          "OEE_LABEL_ERROR_NO_BILLET_SELECTED"
           );
           if (selectedBilletLength <= 0) {
           MessageBox.error(noBilletSelected);
          return;
        }

        var oView = this.getView();
        var oDialog = oView.byId("rejectedNotifs");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.rejectedNotifs",
            this
          );
          oView.addDependent(oDialog);
        }
        this.appData.oDialog = oDialog;
        oDialog.open();
        this.getBilletDetail();
        this.getBilletRejectType();
      },
*/
callBilletDetail: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "rejectionModel");
},

getBilletDetail: function (oEvent) {
          var plant = this.appData.plant;
          var tableModel = this.getView().getModel("confirmBilletList").oData;
          var oTable = this.getView().byId("tblBilletMaster");
          var selectedRows = oTable.getSelectedContexts()[0].sPath;
          var selectedRow = selectedRows.split("/")[1];
          var Ktkid = tableModel[selectedRow].KTKID;
          this.getView().byId("rejectedKtkid").setSelectedKey(Ktkid);
          var params = { "Param.1": Ktkid };
          var tRunner = new TransactionRunner(
          "MES/UI/Filmasin/getKTKIDForRejectQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callBilletDetail);
      },


callRejectType: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "rejectedNotifTypes");
},

getBilletRejectType: function (oEvent) {
          var plant = this.appData.plant;
          var tRunner = new TransactionRunner(
          "MES/UI/Filmasin/getTypeOfRejectQry"
        );
        tRunner.ExecuteQueryAsync(this, this.callRejectType);
      },



callRejectReason: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "rejectedNotifReasons");
},

onSelectRejectType: function (oEvent) {
          var plant = this.appData.plant;
          var Type;
          var RejectType =  this.getView().byId("selectType").getSelectedKey();
          if(RejectType == "İade") {
Type="IADE"
} else  if(RejectType == "Hadde Bozuğu") {
Type="HADDE_BOZ"
} 
           var params ={ "Param.1":Type};
          var tRunner = new TransactionRunner(
          "MES/UI/Filmasin/getReasonOfRejectQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callRejectReason);
      },

 
callConfirmReject: function (p_this, p_data) {
p_this.handleCancel();
sap.m.MessageToast.show("Uygunsuzluk kaydedildi");
},

 onConfirmBilletReject: function (oEvent) {
          var plant = this.appData.plant;
          var workcenterid = this.appData.node.workcenterID;
          var reasonType = this.getView().byId("selectType").getSelectedKey();
           var reason = this.getView().byId("selectReason").getSelectedKey();
          var ktkid = this.byId("rejectedKtkid").getSelectedKey();
          var user = this.appData.user.userID;
          var desc = this.byId("description").mProperties.value;
           var params ={ 
          "I_WORKCENTERID":workcenterid,
           "I_REASON_TYPE":reasonType,
           "I_REASON":reason,
           "I_DESCRIPTION":desc,
            "I_KTKID": ktkid,
            "I_USER":user
            };
          var tRunner = new TransactionRunner(
          "MES/Integration/RFC/BilletReject/insertBilletRejectReasonXqry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callConfirmReject);
      },


      callBilletList: function (p_this, p_data) {
         var tableCharacteristic = p_data.Rowsets.Rowset[0];
          var rows = p_data.Rowsets.Rowset[0].Row;
          var characteristic = [];
          for (i = 0; i < rows.length; i++) {
            var status = true;
            for (k = 0; k < characteristic.length; k++) {
              if (characteristic[k].KTKID == rows[i].KTKID) status = false;
            }
            if (status) {
              characteristic[characteristic.length] = {};
              characteristic[characteristic.length - 1].KTKID = rows[i].KTKID;
              characteristic[k][tableCharacteristic.Columns.Column[5].Description]=rows[i].AUFNR;
              characteristic[k][tableCharacteristic.Columns.Column[6].Description] = rows[i].AUFNR_LINE;
              characteristic[k][tableCharacteristic.Columns.Column[7].Description] = rows[i].APRIO;
              characteristic[k][tableCharacteristic.Columns.Column[9].Description]=rows[i].CASTID;
              characteristic[k][tableCharacteristic.Columns.Column[11].Description] = rows[i].CHARG;
              characteristic[k][tableCharacteristic.Columns.Column[12].Description] = rows[i].SIGNAL_POINT;
              characteristic[k][tableCharacteristic.Columns.Column[13].Description]=rows[i].ENTRY_WEIGHT;
              characteristic[k][tableCharacteristic.Columns.Column[14].Description] = rows[i].BTABLE;
              characteristic[k][tableCharacteristic.Columns.Column[16].Description] = rows[i].FURNACE_ENTRY_TIME;
              characteristic[k][tableCharacteristic.Columns.Column[17].Description]=rows[i].FURNACE_STAY_TIME;
            }
          }

          for(i=0;i<rows.length; i++){
            for(k=0;k<characteristic.length; k++){
                if(characteristic[k].KTKID == rows[i].KTKID)
                     characteristic[k][rows[i].CHARC] = rows[i].CHARC_VALUE;                    
            }
        }

        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(characteristic);
          p_this.getView().setModel(oModel, "confirmBilletList");
          // p_this.bindRawMaterialsToTable(p_data.Rowsets.Rowset[0]);
        
        },

      getBilletList: function (oEvent) {
        var plant = this.appData.plant;
        var aufnr = this.appData.selected.order.orderNo;
        var params = { "Param.1": aufnr };
        var tRunner = new TransactionRunner(
          "MES/UI/Filmasin/getBilletDetailsQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callBilletList);
      },

      onConfirmDialog:function(){
        this.handleCancel();
      },

      handleCancel: function () {
        this.appData.oDialog.destroy();
      },


      modelServices: function () {
        var self = this;
        this.intervalHandle = setInterval(function () {
          if (window.location.hash == "#/activity/ZACT_BILLET_MNTR")
            self.getBilletList();
          console.log(1);
        }, 10000);
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
