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
    "sap/ui/model/FilterType",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MenuItem",
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
    FilterType,
    BusyIndicator,
    Fragment,
    MessageToast,
    MenuItem
  ) {
    "use strict";

    this.screenObj;
    var that;
    var iDelay = 1000; // default
    var iDuration = 500;

    return Controller.extend("customActivity.controller.oeeRefractory", {
      /**
       * Called when a controller is instantiated and its View controls (if available) are already created.
       * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
       */

      formatter: formatter,

      onInit: function () {
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.interfaces = this.appComponent.getODataInterface();
        that = this;
        this.screenObj = {};
        this.getDate();
        this.getCastNoList();
        this.loadMasterDetailData();

      },

      hideBusyIndicator: function () {
        BusyIndicator.hide();
      },


      getDate: function () {
        var oDate = new Date();
        //var tomorrow = new Date();
        //tomorrow.setDate(tomorrow.getDate() + 1);
        var idDatePicker = this.byId("idDatePicker");
        idDatePicker.setDateValue(oDate);

        this.screenObj.selectedDate = idDatePicker.getValue();
      },

      callCastNoList: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "castNoList");

        if (p_data.Rowsets.Rowset[0].Row) {
          var castNo = p_data.Rowsets.Rowset[0].Row[0].CASTID;
          p_this.findCastNo(castNo);
          p_this.screenObj.castNo = castNo;
          p_this.getRefractoryDetail(castNo);
        }
      },

      getCastNoList: function () {
        var plant = this.appData.plant;

        var params = { "Param.1": plant, "Param.2": this.screenObj.selectedDate };
        var tRunner = new TransactionRunner(
          "MES/UI/Refractory/getCastNoListQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callCastNoList);
      },

      changeDatePicker: function () {
        BusyIndicator.show(iDelay);
        if (iDuration && iDuration > 0) {
          if (this._sTimeoutId) {
            clearTimeout(this._sTimeoutId);
            this._sTimeoutId = null;
          }

          this._sTimeoutId = setTimeout(
            function () {

              var selectedDate = this.byId("idDatePicker").getValue();
              this.screenObj.selectedDate = selectedDate;
              if (!selectedDate) {
                this.getDate();
              }
              this.getCastNoList();
              this.getRefractoryReport();

              this.hideBusyIndicator();
            }.bind(this),
            iDuration
          );
        }


      },

      selectedCastNo: function (oEvent) {
        BusyIndicator.show(iDelay);
        if (iDuration && iDuration > 0) {
          if (this._sTimeoutId) {
            clearTimeout(this._sTimeoutId);
            this._sTimeoutId = null;
          }

          this._sTimeoutId = setTimeout(
            function () {

              var masterList = this.getView().byId("masterList").getSelectedItem();

              this.screenObj.castNo = masterList.mProperties.title;

              this.getRefractoryDetail(this.screenObj.castNo);

              this.hideBusyIndicator();
            }.bind(this),
            iDuration
          );
        }

      },
      /*
            callRefractoryDetail: function (p_this, p_data) {
              var oModel = new sap.ui.model.json.JSONModel();
              oModel.setData(p_data.Rowsets.Rowset[0]);
              if (p_data.Rowsets.Rowset[0].Row) {
      
                var result = p_data.Rowsets.Rowset[0].Row[0].CAST_ID;
                p_this.getView().setModel(oModel, "refractoryDetail");
                p_this.loadMasterDetailData();
      
                return result;
      
              }
              p_this.loadMasterDetailData();
      
            },
      */
      getRefractoryDetail: function (castNo) {


        BusyIndicator.show(iDelay);
        if (iDuration && iDuration > 0) {
          if (this._sTimeoutId) {
            clearTimeout(this._sTimeoutId);
            this._sTimeoutId = null;
          }

          this._sTimeoutId = setTimeout(
            function () {

              this.loadMasterDetailData();
              this.getView().byId("castNo").setText(castNo);

              var params = { "Param.1": this.appData.plant, "Param.2": castNo };
              var tRunner = new TransactionRunner(
                "MES/UI/Refractory/getRefractoryDetail",
                params
              );
              //tRunner.ExecuteQueryAsync(this, this.callRefractoryDetail);

              if (!tRunner.Execute()) {
                MessageBox.error(tRunner.GetErrorMessage());
                return null;
              }
              var oData = tRunner.GetJSONData();
              var oModel = new sap.ui.model.json.JSONModel();
              oModel.setData(oData[0]);
              this.getView().setModel(oModel, "refractoryDetail");
              if (oData[0].Row) {

                //return oData[0].Row[0].CAST_ID;
                return oData[0].Row[0];
              }

            }.bind(this),
            iDuration
          );
        }

      },

      loadMasterDetailData: function () {
        BusyIndicator.show(iDelay);
        if (iDuration && iDuration > 0) {
          if (this._sTimeoutId) {
            clearTimeout(this._sTimeoutId);
            this._sTimeoutId = null;
          }

          this._sTimeoutId = setTimeout(
            function () {

              this.getEquipmentNo();
              this.getEquipmentBase();
              this.getUsageStatus();
              this.getPersonnel();
              this.getRefractoryReport();
              this.getLastCounters();
              this.hideBusyIndicator();
              this.hideBusyIndicator();
            }.bind(this),
            iDuration
          );
        }
      },

      callEquipmentNo: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "equipmentNo");
      },

      getEquipmentNo: function () {

        var params = { "Param.1": this.appData.node.nodeID, "Param.2": this.appData.plant };
        var tRunner = new TransactionRunner(
          "MES/UI/Refractory/getEquipmentNo",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callEquipmentNo);
      },

      callLastCounters: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        //p_this.getView().setModel(oModel, "equipmentCounter");
        if (p_data.Rowsets.Rowset[0].Row) {
          var equipmentCounter = p_data.Rowsets.Rowset[0].Row[0].EQUIPMENT_COUNTER + 1;
          var equipmentBaseCounter = p_data.Rowsets.Rowset[0].Row[0].EQUIPMENT_BASE_COUNTER + 1;

          p_this.getView().byId("idEquipmentCounter").setValue(equipmentCounter);
          p_this.getView().byId("idEquipmentBaseCounter").setValue(equipmentBaseCounter);
        }
        else {

          p_this.getView().byId("idEquipmentCounter").setValue("0");
          p_this.getView().byId("idEquipmentBaseCounter").setValue("0");
        }

      },

      getLastCounters: function () {

        var params = { "Param.1": this.appData.plant, "Param.2": this.screenObj.castNo };
        var tRunner = new TransactionRunner(
          "MES/UI/Refractory/getLastCounters",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callLastCounters);
      },

      callEquipmentBase: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "equipmentBase");
      },

      getEquipmentBase: function () {

        var params = { "Param.1": this.appData.plant };
        var tRunner = new TransactionRunner(
          "MES/UI/Refractory/getEquipmentBase",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callEquipmentBase);
      },


      callUsageStatus: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "usageStatus");
      },

      getUsageStatus: function () {

        var tRunner = new TransactionRunner(
          "MES/UI/Refractory/getUsageStatus"
        );
        tRunner.ExecuteQueryAsync(this, this.callUsageStatus);
      },

      callPersonnel: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "personnel");
      },

      getPersonnel: function () {

        var tRunner = new TransactionRunner(
          "MES/UI/Refractory/getPersonnel"
        );
        tRunner.ExecuteQueryAsync(this, this.callPersonnel);
      },

      callRefractoryReport: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "refractoryReport");

      },

      getRefractoryReport: function () {

        var params = { "Param.1": this.appData.plant, "Param.2": this.screenObj.selectedDate };
        var tRunner = new TransactionRunner(
          "MES/UI/Refractory/getRefractoryReport",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callRefractoryReport);
      },

      IsEmpty: function (objID) {
        var loElement = this.getView().byId(objID);

        if (loElement.getMetadata().getName() == "sap.m.MultiComboBox") {
          if (loElement.getSelectedKeys().length == 0) return true;
        }
        if (loElement.getMetadata().getName() == "sap.m.ComboBox") {
          if (loElement.getSelectedKey().length == 0) return true;
        }
        if (loElement.getMetadata().getName() == "sap.m.Select") {
          if (loElement.getSelectedKey().length == 0) return true;
        }
        if (loElement.getMetadata().getName() == "sap.m.Input") {
          if (loElement.getValue().length == 0) return true;
        }

        return false;
      },

      ErrorMessage: function (msgi18n) {
        sap.m.MessageBox.error(
          this.getView().getModel("i18n").getResourceBundle().getText(msgi18n)
        );
      },

      saveRefractory: function () {

        if (!this.screenObj.castNo) {
          this.ErrorMessage("OEE_ERROR_CAST_NO_NOT_SELECTED");
          return false;
        }
        if (this.IsEmpty("idEquipmentNumber")) {
          this.ErrorMessage("OEE_ERROR_EQUIPMENT_NUMBER");
          return false;
        }
        if (this.IsEmpty("idEquipmentCounter")) {
          this.ErrorMessage("OEE_ERROR_COUNTER");
          return false;
        }
        if (this.IsEmpty("idUsegeStatus")) {
          this.ErrorMessage("OEE_ERROR_USAGE_STATUS");
          return false;
        }
        if (this.IsEmpty("idEquipmentBase")) {
          this.ErrorMessage("OEE_ERROR_EQUIPMENT");
          return false;
        }
        if (this.IsEmpty("idEquipmentBaseCounter")) {
          this.ErrorMessage("OEE_ERROR_EQUIPMENT_COUNTER");
          return false;
        }
        if (this.IsEmpty("idCompany")) {
          this.ErrorMessage("OEE_ERROR_COMPANY");
          return false;
        }
        if (this.IsEmpty("idPersonnel")) {
          this.ErrorMessage("OEE_ERROR_PERSONAL");
          return false;
        }

        var equipmentNumber = this.getView().byId("idEquipmentNumber").getSelectedKey();
        var equipmentCounter = this.getView().byId("idEquipmentCounter").getValue();
        var usegeStatus = this.getView().byId("idUsegeStatus").getSelectedKey();
        var equipmentBase = this.getView().byId("idEquipmentBase").getSelectedKey();
        var equipmentBaseCounter = this.getView().byId("idEquipmentBaseCounter").getValue();
        var company = this.getView().byId("idCompany").getSelectedKey();
        var personnel = this.getView().byId("idPersonnel").getSelectedKey();

        var params = {
          I_PLANT: this.appData.plant,
          I_NODE_ID: this.appData.node.nodeID,
          I_CAST_NO: this.screenObj.castNo,
          I_EQUIPMENT_NUMBER: equipmentNumber,
          I_EQUIPMENT_COUNTER: equipmentCounter,
          I_USAGE_STATUS: usegeStatus,
          I_EQUIPMENT_BASE: equipmentBase,
          I_EQUIPMENT_BASE_COUNTER: equipmentBaseCounter,
          I_COMPANY: company,
          I_PERSONNEL: personnel,
          I_USER: this.appData.user.userID,
        };

        var tRunner = new TransactionRunner(
          "MES/UI/Refractory/Operations/saveRefractoryXqry",
          params
        );
        //tRunner.ExecuteQueryAsync(this, this.callSaveRefractory);
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());

          return false;
        }
        var jsData = tRunner.GetJSONData();
        sap.m.MessageToast.show(
          this.screenObj.castNo + " dökümü kaydedildi."
          //this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
        );

        this.getRefractoryReport();
      },

      /*
      callSaveRefractory: function (p_this, p_data) {
        sap.m.MessageToast.show(
          p_this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
          );
      },

      */

      onPressNextCastNo: function () {
        BusyIndicator.show(iDelay);
        if (iDuration && iDuration > 0) {
          if (this._sTimeoutId) {
            clearTimeout(this._sTimeoutId);
            this._sTimeoutId = null;
          }

          this._sTimeoutId = setTimeout(
            function () {

              if (!this.screenObj.castNo) {
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OEE_ERROR_SELECTED_CAST_NO")
                );
                this.hideBusyIndicator();
                return;
              }

              var nextCastNo = parseInt(this.screenObj.castNo) + 1;
              if (this.findCastNo(nextCastNo)) {
                this.screenObj.castNo = nextCastNo;
                this.getRefractoryDetail(nextCastNo);
              }
              this.hideBusyIndicator();
            }.bind(this),
            iDuration
          );
        }
      },

      findCastNo: function (nextCastNo) {
        var lo_model = this.getView().getModel("castNoList");
        if (!lo_model) return false;
        var rows = lo_model.getData()["Row"];
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].CASTID == nextCastNo) {
            var masterList = this.getView().byId("masterList");
            masterList.setSelectedItem(masterList.getItems()[i]);
            return true;
          }
        }
        return false;
      },

      changeUsageStatus: function () {

        BusyIndicator.show(iDelay);
        if (iDuration && iDuration > 0) {
          if (this._sTimeoutId) {
            clearTimeout(this._sTimeoutId);
            this._sTimeoutId = null;
          }

          this._sTimeoutId = setTimeout(
            function () {

              var usageStatus = this.getView().byId("idUsegeStatus").getSelectedKey();
              if (usageStatus == "10") {
                var result = this.getRefractoryDetail(this.screenObj.castNo);
                if (result) {
                  this.getView().byId("idEquipmentCounter").setValue(result.EQUIPMENT_COUNTER);
                  this.getView().byId("idEquipmentBaseCounter").setValue(result.EQUIPMENT_BASE_COUNTER);
                }
                else {
                  this.getLastCounters();
                }
              }
              else if (usageStatus == "20") {
                this.getView().byId("idEquipmentCounter").setValue(1);
                this.getView().byId("idEquipmentBaseCounter").setValue(1);
              }

              this.hideBusyIndicator();
            }.bind(this),
            iDuration
          );
        }
      },


      onPressRefreshCastNo: function () {

        BusyIndicator.show(iDelay);
        if (iDuration && iDuration > 0) {
          if (this._sTimeoutId) {
            clearTimeout(this._sTimeoutId);
            this._sTimeoutId = null;
          }

          this._sTimeoutId = setTimeout(
            function () {

              this.getDate();
              this.getCastNoList();
              this.clearScreen();
              this.getRefractoryReport();

              this.hideBusyIndicator();
            }.bind(this),
            iDuration
          );
        }

      },


      clearScreen: function () {
        var oModel = new sap.ui.model.json.JSONModel();
        var clearArr = [
          ["castNo", "text"],
          ["idEquipmentNumber", "select"],
          ["idEquipmentCounter", "input"],
          ["idUsegeStatus", "select"],
          ["idEquipmentBase", "select"],
          ["idEquipmentBaseCounter", "input"],
          ["idCompany", "select"],
          ["idPersonnel", "select"],
          ["refractoryDetail", "model"],
          //["multiComboboxCastNo", "multiSelect"],

        ];

        clearArr.forEach(function (item, index) {
          var oView = this.getView();
          if (item[1] == "text") oView.byId(item[0]).setText("");
          else if (item[1] == "select") {
            oView.byId(item[0]).setSelectedKey("");
            oView.byId(item[0]).setValue("");
          } else if (item[1] == "multiSelect") {
            oView.byId(item[0]).setSelectedKeys(null);
            oView.byId(item[0]).setValue(null);
          } else if (item[1] == "model") {
            oModel.setData(null);
            oView.setModel(oModel, item[0]);
          } else if (item[1] == "input") oView.byId(item[0]).setValue("");
        }, this);
      },



    });
  }
);
