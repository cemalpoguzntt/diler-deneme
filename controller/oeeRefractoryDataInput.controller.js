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
    "customActivity/scripts/transactionCaller",
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
    MenuItem,
    TransactionCaller
  ) {
    "use strict";

    this.screenObj;
    var that;
    var iDelay = 1000; // default
    var iDuration = 500;

    return Controller.extend(
      "customActivity.controller.oeeRefractoryDataInput",
      {
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

          //Ekrandan çık gir yapıldığında alanları clearla
          var clearArr = [
            ["idEquipmentObjType", "select"],
            ["equipmentObjType", "model"],
            ["idEquipmentNumber", "select"],
            ["equipmentNumber", "model"],
            ["idMaterialInfo", "select"],
            ["materialInfo", "model"],
            ["idRefracStatus", "select"],
            ["idCompany", "select"],
            ["companyList", "model"],
            ["idRefracQuality", "input"],
            ["idFormen", "select"],
            ["formen", "model"],
            ["idRefracDescription", "input"],
            ["idRefracDate", "date"],
            ["idRefracLine", "select"],
            ["idRefracQuantity", "input"],
            ["idQuantityOB", "select"],
          ];

          this.clearScreen(clearArr);
          // this.getLineName();
          var oModel = new sap.ui.model.json.JSONModel();
          var oTable = this.getView().byId("idReportTable");
          oTable.setModel(oModel);

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
        getLineList: function () {
          var oData = [
            { LINE: "1" },
            { LINE: "2" },
            { LINE: "3" },
            { LINE: "4" },
            { LINE: "5" },
            { LINE: "6" },
          ];

          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(oData);
          this.getView().setModel(oModel, "lineList");
        },
        getUnitList: function () {
          var oData = [{ UNIT: "KG" }];

          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(oData);
          this.getView().setModel(oModel, "unitList");
        },
        findCastNo: function (nextCastNo) {
          var lo_model = this.getView().getModel("castNoList");
          if (!lo_model) return false;
          var rows = lo_model.getData();
          for (var i = 0; i < rows.length; i++) {
            if (rows[i].CASTID == nextCastNo) {
              var masterList = this.getView().byId("masterList");
              masterList.setSelectedItem(masterList.getItems()[i]);
              return true;
            }
          }
          return false;
        },
        callCastNoList: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }

          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(myArrr);
          iv_scope.getView().setModel(oModel, "castNoList");

          if (iv_data[0]?.Rowsets?.Rowset?.Row) {
            var castNo = iv_data[0].Rowsets.Rowset.Row[0].CASTID;
            iv_scope.findCastNo(castNo);
            iv_scope.screenObj.castNo = castNo;
            iv_scope.getRefractoryDetail(castNo);
          }
          return;
        },
        getCastNoList: function () {
          var plant = this.appData.plant;

          TransactionCaller.async(
            "MES/Itelli/Refractory/DataInput/T_GET_CASTNO_LIST",
            {
              I_PLANT: plant,
              I_DATE: this.screenObj.selectedDate,
            },
            "O_JSON",
            this.callCastNoList,
            this
          );
        },
        callUsageStatus: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }

          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(myArrr);
          iv_scope.getView().setModel(oModel, "refracSatus");
          return;
        },
        getUsageStatus: function () {
          TransactionCaller.async(
            "MES/Itelli/Refractory/DataInput/T_GET_USAGE_STATUS",
            {
              I_EQART: this.getView()
                .byId("idEquipmentObjType")
                .getSelectedKey(),
              I_ZREFMLZ: this.getView().byId("idMaterialInfo").getSelectedKey(),
              I_WERKS: this.appData.plant,
            },
            "O_JSON",
            this.callUsageStatus,
            this
          );
        },
        callFormen: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }

          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(myArrr);
          iv_scope.getView().setModel(oModel, "formen");
          return;
        },
        getFormen: function (eqart) {
          TransactionCaller.async(
            "MES/Itelli/Refractory/DataInput/T_GET_PERSONEL",
            {
              I_EQART: eqart,
              I_PLANT: this.appData.plant,
            },
            "O_JSON",
            this.callFormen,
            this
          );
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
                //this.getRefractoryReport();

                //Tarih değiştiğinde alanları clear yap
                var clearArr = [
                  ["idEquipmentObjType", "select"],
                  ["idEquipmentNumber", "select"],
                  ["equipmentNumber", "model"],
                  ["idMaterialInfo", "select"],
                  ["materialInfo", "model"],
                  ["idRefracStatus", "select"],
                  ["idCompany", "select"],
                  ["companyList", "model"],
                  ["idRefracQuality", "input"],
                  ["idFormen", "select"],
                  //["formen", "model"],  //ilerde bu kısmıda clear yapabiliriz.
                  ["idRefracDescription", "input"],
                  ["idRefracDate", "date"],
                  ["idRefracLine", "select"],
                  ["idRefracQuantity", "input"],
                  ["idQuantityOB", "select"],
                ];
                this.clearScreen(clearArr);
                this.getQuantityTable();
                var oModel = new sap.ui.model.json.JSONModel();
                var oTable = this.getView().byId("idReportTable");
                oTable.setModel(oModel);

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
            var clearArr = [
              ["idEquipmentObjType", "select"],
              ["idEquipmentNumber", "select"],
              ["equipmentNumber", "model"],
              ["idMaterialInfo", "select"],
              ["materialInfo", "model"],
              ["idRefracStatus", "select"],
              ["idCompany", "select"],
              ["companyList", "model"],
              ["idRefracQuality", "input"],
              ["idFormen", "select"],
              //["formen", "model"],  //ilerde bu kısmıda clear yapabiliriz.
              ["idRefracDescription", "input"],
              ["idRefracDate", "date"],
              ["idRefracLine", "select"],
              ["idRefracQuantity", "input"],
              ["idQuantityOB", "select"],
            ];
            this.clearScreen(clearArr);
            this.clearDateAndHour();
            this._sTimeoutId = setTimeout(
              function () {
                var masterList = this.getView()
                  .byId("masterList")
                  .getSelectedItem();

                this.screenObj.castNo = masterList.mProperties.title;

                this.getRefractoryDetail(this.screenObj.castNo);

                this.hideBusyIndicator();
              }.bind(this),
              iDuration
            );
          }
        },
        getRefractoryDetail: function (castNo) {
          this.getView().byId("castNo").setText(castNo);
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
                this.getEquipmentObjType();
                this.getLineList();
                this.getUnitList();

                this.hideBusyIndicator();
              }.bind(this),
              iDuration
            );
          }
        },
        callEquipmentObjType: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(p_data.Rowsets.Rowset[0]);
          p_this.getView().setModel(oModel, "equipmentObjType");
        },
        callEquipmentObjType2: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }

          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(myArrr);
          iv_scope.getView().setModel(oModel, "equipmentObjType");
          return;
        },
        getEquipmentObjType: function () {
          TransactionCaller.async(
            "MES/Itelli/Refractory/DataInput/T_GET_EQUIPMENT_OBJECT_TYPE",
            {
              I_PLANT: this.appData.plant,
              I_NODEID: this.appData.node.nodeID,
            },
            "O_JSON",
            this.callEquipmentObjType2,
            this
          );
        },
        changeEquipmentObjType: function () {
          var clearArr = [
            ["idEquipmentNumber", "select"],
            ["equipmentNumber", "model"],
            ["idMaterialInfo", "select"],
            ["materialInfo", "model"],
            ["idRefracStatus", "select"],
            ["idCompany", "select"],
            ["companyList", "model"],
            ["idRefracQuality", "input"],
            ["idFormen", "select"],
            ["formen", "model"],
            ["idRefracDescription", "input"],
            ["idRefracDate", "date"],
            ["idRefracLine", "select"],
            ["idRefracQuantity", "input"],
            ["idQuantityOB", "select"],
          ];

          this.clearScreen(clearArr);
          var oModel = new sap.ui.model.json.JSONModel();
          var oTable = this.getView().byId("idReportTable");
          oTable.setModel(oModel);

          var vObjectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          var vl = this.getView().byId("idRefracControl");
          if (vObjectType == "ZKOKİL") vl.setVisible(true);
          else vl.setVisible(false);
          var v4 = this.getView().byId("idTarih");
          var v5 = this.getView().byId("idSaat");
          if (vObjectType == "ZPOTA") {
            v4.setVisible(true);
            v5.setVisible(true);
          }
          else {
            v4.setVisible(false);
            v5.setVisible(false);
          }
          var v2 = this.getView().byId("idRefracQty");
          var v3 = this.getView().byId("idRefracUnit");
          var v4 = this.getView().byId("idMiktarPanel");
          if (vObjectType == "ZÇANAK") {
            v2.setVisible(true);
            v3.setVisible(true);
            v4.setVisible(true);
            this.getQuantityTable();
          } else {
            v2.setVisible(false);
            v3.setVisible(false);
            v4.setVisible(false);
          }
          this.getFormen(vObjectType);
          this.getEquipmentNumber(vObjectType);
          this.getMaterialInfo(vObjectType);
          this.getLifespanReportData("", "");
        },
        changeEquipmentNumber: function () {
          var clearArr = [
            ["idMaterialInfo", "select"],
            ["idRefracStatus", "select"],
            ["idCompany", "select"],
            ["companyList", "model"],
            ["idRefracQuality", "input"],
            ["idFormen", "select"],
            ["idRefracDescription", "input"],
            ["idRefracDate", "date"],
            ["idRefracLine", "select"],
            ["idRefracQuantity", "input"],
            ["idQuantityOB", "select"],
          ];

          this.clearScreen(clearArr);
          this.getCustomDataWithStatus();
          // var equipmentNumber = this.getView()
          //   .byId("idEquipmentNumber")
          //   .getSelectedKey();

          // this.getLifespanReportData(equipmentNumber, "");
        },
        getCustomDataWithStatus: function () {

          let EQUIPMENT = this.getView()
            .byId("idEquipmentNumber")
            .getSelectedKey();
          let plant = this.appData.plant;

          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GET_LASTDATE",
            {
              I_EQUIPMENT: EQUIPMENT,
              I_PLANT: plant,
            },
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          if (response[0]?.Rowsets?.Rowset?.Row) {
            let rsData = response[0]?.Rowsets?.Rowset?.Row;


            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData(rsData);
            this.getView().setModel(oModel, "dateModel");
            return;
          }
          else {
            this.clearDateAndHour();
          }



        },
        changeRefracStatus: function () {
          /* 
          //Şimdilik dursun, sorumuzu sorup alacağımız cevaba göre şekillenecek.
          var clearArr = [
            ["idCompany", "select"],
            ["idRefracQuality", "input"],
            ["idFormen", "select"],
            ["idRefracDescription", "input"],
            ["idRefracDate", "date"],
            ["idRefracLine", "select"],
            ["idRefracQuantity", "input"],
            ["idQuantityOB", "select"]
          ];
 
          this.clearScreen(clearArr);
          */

          //Ekrandaki verileri otomatik doldurma kısmı
          if (!this.screenObj.castNo) {
            return false;
          }
          if (this.IsEmpty("idEquipmentObjType")) {
            return false;
          }
          if (this.IsEmpty("idEquipmentNumber")) {
            return false;
          }
          if (this.IsEmpty("idMaterialInfo")) {
            return false;
          }
          if (this.IsEmpty("idRefracStatus")) {
            return false;
          }

          var refDate = this.getView().byId("idDatePicker").getValue();
          var objectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          var equipmentNumber = this.getView()
            .byId("idEquipmentNumber")
            .getSelectedKey();
          var refMalz = this.getView().byId("idMaterialInfo").getSelectedKey();
          var usegeStatus = this.getView()
            .byId("idRefracStatus")
            .getSelectedKey();

          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GET_REFRACTORY_SCREEN_DATA",
            {
              I_PLANT: this.appData.plant,
              I_CASTNO: this.screenObj.castNo,
              I_REFDATE: refDate,
              I_OBJECTTYPE: objectType,
              I_EQUIPMENTNUMBER: equipmentNumber,
              I_REFMALZ: refMalz,
              I_USEGESTATUS: usegeStatus,
            },
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          if (response[0]?.Rowsets?.Rowset?.Row) {
            var jsData = Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
              ? response[0]?.Rowsets?.Rowset?.Row
              : new Array(response[0]?.Rowsets?.Rowset?.Row);
            var selectedRow = jsData[0];
            this.getView()
              .byId("idCompany")
              .setSelectedKey(selectedRow.COMPANY);
            this.getView()
              .byId("idRefracQuality")
              .setValue(selectedRow.QUALITY_TEXT);
            this.getView().byId("idFormen").setSelectedKey(selectedRow.PERNR);
            this.getView()
              .byId("idRefracDescription")
              .setValue(selectedRow.DESCRIPTION);

            if (selectedRow.ORUM_TARIH != "TimeUnavailable") {
              this.getView()
                .byId("idRefracDate")
                .setValue(selectedRow.ORUM_TARIH);
            } else {
              this.getView()
                .byId("idRefracDate")
                .setValue("");
            }

            this.getView()
              .byId("idRefracLine")
              .setSelectedKey(selectedRow.REF_LINE);
            this.getView()
              .byId("idRefracQuantity")
              .setValue(selectedRow.QUANTITY);
            this.getView()
              .byId("idQuantityOB")
              .setSelectedKey(selectedRow.UNIT);
          }
        },
        callEquipmentNumber: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }

          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(myArrr);
          iv_scope.getView().setModel(oModel, "equipmentNumber");
          return;
        },
        getEquipmentNumber: function (pObjType) {
          TransactionCaller.async(
            "MES/Itelli/Refractory/DataInput/T_GET_EQUIPMENT_NUMBER",
            {
              I_PLANT: this.appData.plant,
              I_OBJTYPE: pObjType,
            },
            "O_JSON",
            this.callEquipmentNumber,
            this
          );
        },
        callMaterialInfo: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }

          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(myArrr);
          iv_scope.getView().setModel(oModel, "materialInfo");
          return;
        },
        getMaterialInfo: function (pObjType) {
          TransactionCaller.async(
            "MES/Itelli/Refractory/DataInput/T_GET_MATERIAL_INFO",
            {
              I_PLANT: this.appData.plant,
              I_OBJTYPE: pObjType,
            },
            "O_JSON",
            this.callMaterialInfo,
            this
          );
        },
        changeMaterialInfo: function () {
          var clearArr = [
            ["idRefracStatus", "select"],
            ["idCompany", "select"],
            ["companyList", "model"],
            ["idRefracQuality", "input"],
            ["idFormen", "select"],
            ["idRefracDescription", "input"],
            ["idRefracDate", "date"],
            ["idRefracLine", "select"],
            ["idRefracQuantity", "input"],
            ["idQuantityOB", "select"],
          ];

          this.clearScreen(clearArr);
          var equipmentNumber = this.getView()
            .byId("idEquipmentNumber")
            .getSelectedKey();
          var vMaterialInfo = this.getView()
            .byId("idMaterialInfo")
            .getSelectedKey();
          this.getCompany(vMaterialInfo);
          this.getUsageStatus();
          this.checkRefractoryData();
        },
        checkRefractoryData: function () {
          let rs = this.getRefractoryHeadData();
          rs = rs[0];
          if (rs == undefined) return false;
          this.getView()
            .byId("idRefracStatus")
            .setSelectedKey(rs.USAGE_STATUS_CODE);
          this.getView().byId("idCompany").setSelectedKey(rs.COMPANY);
          this.getView()
            .byId("idRefracQuality")
            .setSelectedKey(rs.QUALITY_TEXT);
          this.getView()
            .byId("idRefracStatus")
            .setSelectedKey(rs.USAGE_STATUS_CODE);
          this.getView().byId("idFormen").setSelectedKey(rs.PERNR);
          this.getView().byId("idRefracDescription").setValue(rs.DESCRIPTION);
          this.getView()
            .byId("idRefracDate")
            .setValue(moment(rs.REF_DATE).format("DD.MM.YYYY"));
          this.getView().byId("idRefracLine").setSelectedKey(rs.REF_LINE);
          this.getView().byId("idRefracQuantity").setValue(rs.QUANTITY);
          this.getView().byId("idRefracLine").setSelectedKey(rs.REF_LINE);
          this.getView().byId("idQuantityOB").setSelectedKey(rs.UNIT);
        },
        callCompany: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }

          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(myArrr);
          iv_scope.getView().setModel(oModel, "companyList");
          return;
        },
        getCompany: function (pMaterialInfo) {
          TransactionCaller.async(
            "MES/Itelli/Refractory/DataInput/T_GET_COMPANY",
            {
              I_PLANT: this.appData.plant,
              I_MATERIALINFO: pMaterialInfo,
            },
            "O_JSON",
            this.callCompany,
            this
          );
        },
        saveRefractory: function () {
          //Kontroller

          if (!this.screenObj.castNo) {
            this.ErrorMessage("OEE_ERROR_CAST_NO_NOT_SELECTED");
            return false;
          }
          if (this.IsEmpty("idEquipmentObjType")) {
            this.ErrorMessage("OEE_ERROR_SELECT_OBJECT_TYPE");
            return false;
          }
          if (this.IsEmpty("idEquipmentNumber")) {
            this.ErrorMessage("OEE_ERROR_SELECT_EQUIPMENT_NO");
            return false;
          }
          if (this.IsEmpty("idMaterialInfo")) {
            this.ErrorMessage("OEE_ERROR_SELECT_MATERIAL_INFO");
            return false;
          }
          if (this.IsEmpty("idRefracStatus")) {
            this.ErrorMessage("OEE_ERROR_SELECT_USAGE_STATUS");
            return false;
          }
          if (this.IsEmpty("idCompany")) {
            this.ErrorMessage("OEE_ERROR_SELECT_REFR_COMPANY");
            return false;
          }
          if (this.IsEmpty("idFormen")) {
            this.ErrorMessage("OEE_ERROR_SELECT_REFR_FORMEN");
            return false;
          }

          if (
            this.getView().byId("idEquipmentObjType").getSelectedKey() ==
            "ZKOKİL"
          ) {
            if (this.IsEmpty("idRefracLine")) {
              this.ErrorMessage("OEE_ERROR_SELECT_REFR_LINE");
              return false;
            }
          }
          var selectedMatIndex = this.getView()
            .byId("idMaterialInfo")
            .getSelectedItemId()
            .split("idMaterialInfo-")[1];
          var selectedMatLine = this.getView()
            .getModel("materialInfo")
            .getData()[selectedMatIndex];
          this.selectedMatLine = this.getView()
            .getModel("materialInfo")
            .getData()[selectedMatIndex];

          var usegeStatus = this.getView()
            .byId("idRefracStatus")
            .getSelectedKey();
          //Kayıt İşlemi
          var refDate = this.getView().byId("idDatePicker").getValue();
          var objectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          var equipmentNumber = this.getView()
            .byId("idEquipmentNumber")
            .getSelectedKey();
          var refMalz = this.getView().byId("idMaterialInfo").getSelectedKey();

          var company = this.getView().byId("idCompany").getSelectedKey();
          var qualityText = this.getView().byId("idRefracQuality").getValue();
          var formen = this.getView().byId("idFormen").getSelectedKey();
          var description = this.getView()
            .byId("idRefracDescription")
            .getValue();
          var knitDate = this.getView().byId("idRefracDate").getValue();
          var refLine = this.getView().byId("idRefracLine").getSelectedKey();
          var quantity = this.getView().byId("idRefracQuantity").getValue();
          var unit = this.getView().byId("idQuantityOB").getSelectedKey();

          var params = {
            I_PLANT: this.appData.plant,
            I_CAST_NO: this.screenObj.castNo,
            I_REF_DATE: refDate,
            I_OBJECTTYPE: objectType,
            I_EQUIPMENT: equipmentNumber,
            I_ZREFMLZ: refMalz,
            I_USAGE_STATUS: usegeStatus,
            I_NODE_ID: this.appData.node.nodeID,
            I_COMPANY: company,
            I_QUALITY_TEXT: qualityText,
            I_FORMEN: formen,
            I_DESCRIPTION: description,
            I_KNIT_DATE: knitDate,
            I_REF_LINE: refLine,
            I_QUANTITY: quantity,
            I_UNIT: unit,
            I_USER: this.appData.user.userID,
          };

          var cu_response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataControl/T_Refractory_Control",
            params,
            "O_JSON"
          );
          if (cu_response[1] == "E") {
            MessageBox.error(cu_response[0]);
            return;
          }

          if (selectedMatLine.ANA_MALZEME == "X") {
            if (
              usegeStatus == "10" ||
              usegeStatus == "30" ||
              usegeStatus == "40"
            ) {
              this.openFragment(selectedMatLine.CAST_ID);
              return false;
            }
          }

          if (selectedMatLine.KALITE_ZORUNLULUK == "X") {
            if (this.IsEmpty("idRefracQuality")) {
              sap.m.MessageBox.error(
                this.getView().byId("idMaterialInfo").getSelectedKey() 
                + " Malzemesi için kalite girişi zorunludur."
              );
              /*this.ErrorMessage(
                this.getView().byId("idMaterialInfo").getSelectedKey() +
                "OEE_ERROR_REFR_QUALITY"
              );*/
              return false;
            }
          }
          if (selectedMatLine.MIKTAR_ZORUNLU == "X") {
            if (this.IsEmpty("idRefracQuantity")) {
              sap.m.MessageBox.error(
                this.getView().byId("idMaterialInfo").getSelectedKey() 
                + " Malzemesi için miktar girişi zorunludur."
              );
              /*this.ErrorMessage(
                this.getView().byId("idMaterialInfo").getSelectedKey() +
                "OEE_ERROR_REFR_QUANTITY"
              );*/
              return false;
            }
            if (this.IsEmpty("idQuantityOB")) {
              sap.m.MessageBox.error(
                this.getView().byId("idMaterialInfo").getSelectedKey() 
                + " Malzemesi için ölçü birimi girişi zorunludur."
              );
              /*this.ErrorMessage(
                this.getView().byId("idMaterialInfo").getSelectedKey() +
                "OEE_ERROR_REFR_QUALITY"
              );*/
              return false;
            }
          }


          /*  var cu_response = TransactionCaller.sync(
              "MES/Itelli/Refractory/DataControl/T_Refractory_Control",
              params,
              "O_JSON"
            );
            if (cu_response[1] == "E") {
              MessageBox.error(cu_response[0]);
              return;
            }*/

          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_SAVE_REFACTORY_DATA",
            params,
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          sap.m.MessageToast.show(response[0]);
          this.getLifespanReportData("", "");
          this.getQuantityTable();
          //Rapor kısmını ekleyince bu kısmı yapıcaz
          //this.getRefractoryReport();
        },
        showDetail: function () {
          let selectedIndex = this.getView().byId("idReportTable").getSelectedIndex();
          let selectedItem = this.getView().byId("idEquipmentObjType").getSelectedKey();
          if (selectedItem == '') {

            MessageBox.error("Lütfen teknik nesne türü seçiniz")
            return false;
          }
          if (selectedIndex == -1) {
            MessageBox.error("Lütfen tablodan veri seçiniz")
            return false;
          }


          let params = {
            I_CASTID: this.getView().byId("idReportTable").getModel().oData.rows[selectedIndex].CAST_ID,
            I_EQUIPMENT: this.getView().byId("idReportTable").getModel().oData.rows[selectedIndex].EQUIPMENT_NUMBER,
            I_OBJECTTYPE: selectedItem
          }

          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GET_DATA_DETAIL",
            params,
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }
          if (response[0]?.Rowsets?.Rowset?.Row) {
            var jsData = Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
              ? response[0]?.Rowsets?.Rowset?.Row
              : new Array(response[0]?.Rowsets?.Rowset?.Row);
            this.showDetailFragment(jsData)
          } else {

          }

        },
        showDetailFragment: function (data) {
          let _this = this;
          if (!this._oDialog2) {
            this._oDialog2 = sap.ui.xmlfragment(
              "idDetailFragment",
              "customActivity.fragmentView.refractoryFragmentDetail",
              this
            );

          }

          this.getView().addDependent(this._oDialog2);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(data);

          var oTable = sap.ui.core.Fragment.byId(
            "idDetailFragment",
            "idDetailFragmentTable"
          );

          oTable.setModel(oModel);
          var vl = sap.ui.core.Fragment.byId(
            "idDetailFragment",
            "idfragmentLine"
          );
          var vObjectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          if (vObjectType == "ZKOKİL") vl.setVisible(true);
          else vl.setVisible(false);

          var v2 = sap.ui.core.Fragment.byId(
            "idDetailFragment",
            "idfragmentQty"
          );
          var v3 = sap.ui.core.Fragment.byId(
            "idDetailFragment",
            "idfragmentUnit"
          );

          if (vObjectType == "ZÇANAK") {
            v2.setVisible(true);
            v2.setVisible(true);
          } else {
            v2.setVisible(false);
            v3.setVisible(false);
          }
          this._oDialog2.open();
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
        clearScreen: function (clearArr) {
          var oModel = new sap.ui.model.json.JSONModel();
          /*
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
          */
          clearArr.forEach(function (item, index) {
            var oView = this.getView();
            if (item[1] == "text") oView.byId(item[0]).setText("");
            else if (item[1] == "date") oView.byId(item[0]).setValue("");
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
        getLifespanReportData: function (equipmentNumber, refMalz) {
          var refDate = this.getView().byId("idDatePicker").getValue();
          var objectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();

          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GET_LIFESPAN_REPORT_DATA",
            {
              I_PLANT: this.appData.plant,
              I_REF_DATE: refDate,
              I_OBJECTYPE: objectType,
              I_EQUIPMENT_NUMBER: equipmentNumber,
              I_REFMALZ: refMalz,
            },
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }
          var vObjectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          if (response[0]?.Rowsets?.Rowset?.Row) {
            var jsData = Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
              ? response[0]?.Rowsets?.Rowset?.Row
              : new Array(response[0]?.Rowsets?.Rowset?.Row);
            var newColumnData = [
              { colName: "CAST_ID" },
              { colName: "EQUIPMENT_DESC" },
            ];
            if (vObjectType == "ZKOKİL") newColumnData.push({ colName: "YOL" });
            if (vObjectType == "ZPOTA") newColumnData.push({ colName: "TARIH" });
            var newRowData = [];
            var equipments = [];

            for (var i = 0; i < jsData.length; i++) {
              var element = jsData[i];

              var newArray = newColumnData.filter(function (obj) {
                return obj.colName == element.NESNE;
              });

              if (newArray.length == 0) {
                newColumnData.push({ colName: element.NESNE });
              }
            }

            for (var i = 0; i < jsData.length; i++) {
              var element = jsData[i];

              var filter = {
                EQUIPMENT_DESC: element.EQUIPMENT_DESC,
                CAST_ID: element.CAST_ID,
              };
              var newArray = equipments.filter(function (item) {
                for (var key in filter) {
                  if (item[key] === undefined || item[key] != filter[key])
                    return false;
                }
                return true;
              });

              if (newArray.length == 0) {
                equipments.push({
                  EQUIPMENT_DESC: element.EQUIPMENT_DESC,
                  CAST_ID: element.CAST_ID,
                });
              }
            }

            for (let index = 0; index < equipments.length; index++) {
              const element = equipments[index];
              var filter = {
                EQUIPMENT_DESC: element.EQUIPMENT_DESC,
                CAST_ID: element.CAST_ID,
              };

              var newArray = jsData.filter(function (item) {
                for (var key in filter) {
                  if (item[key] === undefined || item[key] != filter[key])
                    return false;
                }
                return true;
              });
              let newObj = {};
              for (let index = 0; index < newArray.length; index++) {
                const element = newArray[index];

                newObj[element.NESNE] = element.OMUR;
                newObj.EQUIPMENT_DESC = element.EQUIPMENT_DESC;
                newObj.CAST_ID = element.CAST_ID;
                newObj.YOL = element.YOL;
                newObj.TARIH = element.TARIH;
                newObj["BAKIM_SAYACI"] = element["BAKIM_SAYACI"];
                newObj["EQUIPMENT_NUMBER"] = element["EQUIPMENT_NUMBER"];
              }

              newRowData.push(newObj);
            }
            if (vObjectType == "ZKOKİL") newColumnData.push({ colName: "BAKIM_SAYACI" });
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData({
              rows: newRowData,
              columns: newColumnData,
            });

            var oTable = this.getView().byId("idReportTable");
            oTable.setModel(oModel);
            oTable.bindColumns("/columns", function (sId, oContext) {
              var columnName = oContext.getObject().colName;
              var colDesc = columnName;
              if (columnName == 'CAST_ID') {
                colDesc = "Döküm No";
              } else if (columnName == 'EQUIPMENT_DESC') {
                colDesc = "Ekipman";
              } else if (columnName == 'TARIH') {
                colDesc = "Kayıt Tarihi";
              } else if (columnName == 'BAKIM_SAYACI') {
                colDesc = "Bakım Sayacı";
              }
              return new sap.ui.table.Column({
                label: colDesc,
                template: columnName,
                width: "15rem",
                filterProperty: columnName,
                sortProperty: columnName,
              });
            });
            oTable.bindRows("/rows");
          } else {
            var oModel = new sap.ui.model.json.JSONModel();
            var oTable = this.getView().byId("idReportTable");
            oTable.setModel(oModel);
          }
        },
        closeFragment: function () {
          this._oDialog.close();
        },
        closeFragment2: function () {
          this._oDialog2.close();
        },
        openFragment: function () {
          let _this = this;
          if (!this._oDialog) {
            this._oDialog = sap.ui.xmlfragment(
              "refractoryDataInput",
              "customActivity.fragmentView.refractoryDataInput",
              this
            );
          }

          this.getView().addDependent(this._oDialog);
          let metData = _this.getHeadMaterialData();
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(metData);

          var oTable = sap.ui.core.Fragment.byId(
            "refractoryDataInput",
            "idFragmentTable"
          );

          oTable.setModel(oModel);
          var vl = sap.ui.core.Fragment.byId(
            "refractoryDataInput",
            "idfragmentLine"
          );
          var vObjectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          if (vObjectType == "ZKOKİL") vl.setVisible(true);
          else vl.setVisible(false);

          var v2 = sap.ui.core.Fragment.byId(
            "refractoryDataInput",
            "idfragmentQty"
          );
          var v3 = sap.ui.core.Fragment.byId(
            "refractoryDataInput",
            "idfragmentUnit"
          );

          if (vObjectType == "ZÇANAK") {
            v2.setVisible(true);
            v2.setVisible(true);
          } else {
            v2.setVisible(false);
            v3.setVisible(false);
          }
          this._oDialog.open();
        },
        getHeadMaterialData: function () {
          let eqart = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          var equipmentNumber = this.getView()
            .byId("idEquipmentNumber")
            .getSelectedKey()

          let plant = this.appData.plant;

          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GET_HEAD_MATERIAL",
            {
              I_EQART: eqart,
              I_PLANT: plant,
            },
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          if (response[0]?.Rowsets?.Rowset?.Row) {
            let rsData = response[0]?.Rowsets?.Rowset?.Row;

            var colData = [];
            let fragLine = this.getView()
              .byId("idRefracLine")
              .getSelectedItem();
            if (rsData.length == undefined) {
              var element = rsData;

              colData.push({
                selectedQuantity: "KG",
                selectedFormen: this.getView()
                  .byId("idFormen")
                  .getSelectedKey(),
                MaterialInfo: element.ZREFMLZ,
                CAST_ID: this.screenObj.castNo,
                EquipmentObjType: this.getView()
                  .byId("idEquipmentObjType")
                  .getSelectedItem()
                  .getText(),
                EquipmentNumber: equipmentNumber,
                KALITE_ZORUNLULUK: element.KALITE_ZORUNLULUK,
                MIKTAR_ZORUNLU: element.MIKTAR_ZORUNLU,
                ANA_MALZEME: element.ANA_MALZEME,
                STATUS: this.getView().byId("idRefracStatus").getSelectedKey(),
                COMPANY: element.ANA_MALZEME == 'X' ? this.getView().byId("idCompany").getSelectedKey() : (this.getView().byId("idRefracStatus").getSelectedKey() == '10' ? this.getDataCompany(element.ZREFMLZ, this.screenObj.castNo, equipmentNumber) : ''),
                QUALITY: this.getView().byId("idRefracQuality").getValue(),
                DESCRIPTION: this.getView().byId("idRefracDescription").getValue(),
                ORUM_DATE: this.getView().byId("idRefracDate").getValue(),
                Input_QUANTITY: "",
                //LINE: "",
                LINE: fragLine == null ? "" : fragLine.getText(),
                FIRMA: this.getCompanyFragment(element.ZREFMLZ),
                STATUS_DATA: this.getStatusFragment(
                  this.getView()
                    .byId("idEquipmentObjType")
                    .getSelectedItem()
                    .getText(),
                  element.ZREFMLZ
                ),
                QUANTITY: "0"
              });
            }

            for (var i = 0; i < rsData.length; i++) {
              var element = rsData[i];
              colData.push({
                selectedQuantity: "KG",
                selectedFormen: this.getView()
                  .byId("idFormen")
                  .getSelectedKey(),
                MaterialInfo: element.ZREFMLZ,
                CAST_ID: this.screenObj.castNo,
                EquipmentObjType: this.getView()
                  .byId("idEquipmentObjType")
                  .getSelectedItem()
                  .getText(),
                EquipmentNumber: equipmentNumber,
                KALITE_ZORUNLULUK: element.KALITE_ZORUNLULUK,
                MIKTAR_ZORUNLU: element.MIKTAR_ZORUNLU,
                ANA_MALZEME: element.ANA_MALZEME,
                STATUS: this.getView().byId("idRefracStatus").getSelectedKey(),
                COMPANY: element.ANA_MALZEME == 'X' ? this.getView().byId("idCompany").getSelectedKey() : (this.getView().byId("idRefracStatus").getSelectedKey() == '10' ? this.getDataCompany(element.ZREFMLZ, this.screenObj.castNo, equipmentNumber) : ''),
                QUALITY: this.getView().byId("idRefracQuality").getValue(),
                DESCRIPTION: this.getView().byId("idRefracDescription").getValue(),
                ORUM_DATE: this.getView().byId("idRefracDate").getValue(),
                Input_QUANTITY: "",
                // LINE: "",
                LINE: fragLine == null ? "" : fragLine.getText(),
                FIRMA: this.getCompanyFragment(element.ZREFMLZ),
                STATUS_DATA: this.getStatusFragment(
                  this.getView()
                    .byId("idEquipmentObjType")
                    .getSelectedItem()
                    .getText(),
                  element.ZREFMLZ
                ),
                QUANTITY: "0"
              });
            }

            return colData;
          }
        },
        saveFragmentData: function () {
          var vError = this.checkFragmentTableData();
          if (vError) return;

          var tableData = JSON.stringify(
            sap.ui.core.Fragment.byId(
              "refractoryDataInput",
              "idFragmentTable"
            ).getModel().oData
          );
          var refDate = this.getView().byId("idDatePicker").getValue();
          var objectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          var equipmentNumber = this.getView()
            .byId("idEquipmentNumber")
            .getSelectedKey();
          var refMalz = this.getView().byId("idMaterialInfo").getSelectedKey();
          var usegeStatus = this.getView()
            .byId("idRefracStatus")
            .getSelectedKey();
          var refLine = this.getView().byId("idRefracLine").getSelectedKey();

          var params = {
            I_DATA: this.filterModelData(tableData),
            I_PLANT: this.appData.plant,
            I_CAST_NO: this.screenObj.castNo,
            I_REF_DATE: refDate,
            I_OBJECTTYPE: objectType,
            I_EQUIPMENT: equipmentNumber,
            I_ZREFMLZ: refMalz,
            I_REF_LINE: refLine,
            I_USAGE_STATUS: usegeStatus,
            I_NODE_ID: this.appData.node.nodeID,
            I_USER: this.appData.user.userID,
          };

          // var cu_response = TransactionCaller.sync(
          //   "MES/Itelli/Refractory/DataControl/T_Refractory_Control",
          //   params,
          //   "O_JSON"
          // );
          // if (cu_response[1] == "E") {
          //   MessageBox.error(cu_response[0]);
          //   return;
          // }
          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_SAVE_REFACTORY_DATA_POPUP",
            params,
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }
          this.getLifespanReportData("", "");
          this.closeFragment();
          sap.m.MessageToast.show(response[0]);
        },
        getDataCompany: function (zrefmlz, castno, equipment) {

          let _this = this;
          let response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GETDATACOMPANY",
            {
              I_ZREFMLZ: zrefmlz,
              I_CASTID: castno,
              I_EQUIPMENT: equipment,
            },
            "O_JSON"
          );
          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          return (response[0]?.Rowsets?.Rowset?.Row) ? (response[0]?.Rowsets?.Rowset?.Row).COMPANY : ''


        },
        checkFragmentTableData: function () {
          let _this = this;
          var oData = sap.ui.core.Fragment.byId(
            "refractoryDataInput",
            "idFragmentTable"
          ).getModel().oData;
          for (let index = 0; index < oData.length; index++) {
            const element = oData[index];

            if (_this.checkMiktarZorunluluk(element)) {
              MessageBox.error(
                element.MaterialInfo + " İçin Miktar Girmek Zorunludur."
              );
              return true;
            }

            if (_this.checkKaliteZorunluluk(element)) {
              MessageBox.error(
                element.MaterialInfo + " İçin Kalite Girmek Zorunludur."
              );
              return true;
            }

            if (_this.checkCompanyFragment(element)) {
              MessageBox.error(
                element.MaterialInfo + "İçin Firma Girmek Zorunludur."
              );
              return true;
            }
          }

          return false;
        },
        checkMiktarZorunluluk: function (obj) {
          if (obj.MIKTAR_ZORUNLU == "X") {
            if (obj.QUANTITY == "") return true;
          }
          return false;
        },
        checkKaliteZorunluluk: function (obj) {
          if (obj.KALITE_ZORUNLULUK == "X") {
            if (obj.QUALITY == "") return true;
          }
          return false;
        },
        checkCompanyFragment: function (obj) {
          if (obj.COMPANY == "") return true;

          return false;
        },
        getCompanyFragment: function (pMaterialInfo) {
          let _this = this;
          let response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GET_COMPANY",
            {
              I_PLANT: this.appData.plant,
              I_MATERIALINFO: pMaterialInfo,
            },
            "O_JSON"
          );
          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          return Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
            ? response[0]?.Rowsets?.Rowset?.Row
            : new Array(response[0]?.Rowsets?.Rowset?.Row);
        },
        getStatusFragment: function (eqart, zrefmlz) {
          let _this = this;
          let response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GET_USAGE_STATUS",
            {
              I_EQART: eqart,
              I_ZREFMLZ: zrefmlz,
              I_WERKS: _this.appData.plant,
            },
            "O_JSON"
          );
          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          return Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
            ? response[0]?.Rowsets?.Rowset?.Row
            : new Array(response[0]?.Rowsets?.Rowset?.Row);
        },
        getRefractoryHeadData: function () {
          let _this = this;
          let response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_CHECKHEADDATA",
            {
              I_CASTID: _this.screenObj.castNo,
              I_EQUIPMENT: _this
                .getView()
                .byId("idEquipmentNumber")
                .getSelectedKey(),
              I_OBJECTTYPE: _this
                .getView()
                .byId("idEquipmentObjType")
                .getSelectedKey(),
              I_ZREFMLZ: _this
                .getView()
                .byId("idMaterialInfo")
                .getSelectedKey(),
            },
            "O_JSON"
          );
          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          return Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
            ? response[0]?.Rowsets?.Rowset?.Row
            : new Array(response[0]?.Rowsets?.Rowset?.Row);
        },
        filterModelData: function (data) {
          let newArr = [];
          data = JSON.parse(data);
          for (let index = 0; index < data.length; index++) {
            const element = data[index];
            delete data[index].MIKTAR_ZORUNLU;
            delete data[index].KALITE_ZORUNLULUK;
            delete data[index].Input_QUANTITY;
            delete data[index].ANA_MALZEME;
            delete data[index].STATUS_DATA;
          }
          return JSON.stringify(data);
        },
        clearDateAndHour: function () {

          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData({ TARIH: '', SAAT: '' });
          this.getView().setModel(oModel, "dateModel");

        },
        getQuantityTable: function () {
          var refDate = this.getView().byId("idDatePicker").getValue();
          let response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_QUANTITY_TABLE",
            {
              I_REFDATE: refDate
            },
            "O_JSON"
          );
          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          let rs = Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
            ? response[0]?.Rowsets?.Rowset?.Row
            : new Array(response[0]?.Rowsets?.Rowset?.Row);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(rs);
          var oTable = this.getView().byId("idQuantityTable");
          oTable.setModel(oModel);
        },
        refreshTable: function () {
          this.getLifespanReportData("", "");
          MessageToast.show("Tablo Verisi Yenilendi");
        }
      }
    );
  }
);
