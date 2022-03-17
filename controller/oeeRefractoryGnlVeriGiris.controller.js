sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "customActivity/scripts/transactionCaller",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/ButtonType",
  ],

  function (
    Controller,
    JSONModel,
    MessageBox,
    MessageToast,
    TransactionCaller,
    Dialog,
    DialogType,
    Button,
    Text,
    ButtonType
  ) {
    "use strict";

    return Controller.extend(
      "customActivity.controller.oeeRefractoryGnlVeriGiris",
      {
        onInit: function () {
          this.appComponent = this.getView().getViewData().appComponent;
          this.appData = this.appComponent.getAppGlobalData();
          this.interfaces = this.appComponent.getODataInterface();
          this.getEquipmentObjType();
        },
        changeStartDatePicker: function () {
          if (
            this.byId("idDatePickerEnd").getValue() != "" &&
            this.byId("idDatePickerStart").getValue() >
            this.byId("idDatePickerEnd").getValue()
          ) {
            this.byId("idDatePickerStart").setValue("");
            MessageBox.error("Başlangıç Tarihi Bitiş Tarihinden Büyük Olamaz");
          }
          if (this.byId("idDatePickerEnd").getValue() != "") {
            this.getCastNoList();
          }
        },
        changeEndDatePicker: function () {
          if (
            this.byId("idDatePickerStart").getValue() != "" &&
            this.byId("idDatePickerStart").getValue() >
            this.byId("idDatePickerEnd").getValue()
          ) {
            this.byId("idDatePickerEnd").setValue("");
            MessageBox.error("Bitiş Tarihi Başlangıç Tarihinden Küçük Olamaz");
          }
          if (this.byId("idDatePickerEnd").getValue() != "") {
            this.getCastNoList();
          }
        },
        changeStartCast: function () {
          if (
            this.byId("endCast").getValue() != "" &&
            this.byId("startCast").getValue() > this.byId("endCast").getValue()
          ) {
            this.byId("startCast").setValue("");
            MessageBox.error("Başlangıç Dökümü Bitiş Dökümünden Büyük Olamaz");
          }
          if (this.byId("endCast").getValue() != "") {
          }
        },
        changeEndCast: function () {
          if (
            this.byId("startCast").getValue() != "" &&
            this.byId("startCast").getValue() > this.byId("endCast").getValue()
          ) {
            this.byId("endCast").setValue("");
            MessageBox.error("Bitiş Dökümü Başlangıç Dökümünden Küçük Olamaz");
          }
          if (this.byId("endCast").getValue() != "") {
          }
        },
        getCastNoList: function () {
          var plant = this.appData.plant;

          TransactionCaller.async(
            "MES/Itelli/Refractory/REPORTS/T_GETCASTNUMBER",
            {
              I_PLANT: plant,
              I_ENDDATE: this.byId("idDatePickerEnd").getValue(),
              I_STARTDATE: this.byId("idDatePickerStart").getValue(),
            },
            "O_JSON",
            this.callCastNoList,
            this
          );
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
          oModel.setData(myArrr);
          iv_scope.getView().setModel(oModel, "castIds");
          return;
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
            "MES/Itelli/Refractory/REPORTS/T_GET_EQUIPMENT_OBJECT_TYPE",
            {
              I_PLANT: this.appData.plant,
              I_NODEID: this.appData.node.nodeID,
            },
            "O_JSON",
            this.callEquipmentObjType2,
            this
          );
        },
        onPressSearchFilter: function () {
          if (
            (this.byId("startCast").getValue() == "" ||
              this.byId("endCast").getValue() == "") &&
            (this.byId("idDatePickerStart").getValue() == "" ||
              this.byId("idDatePickerEnd").getValue() == "")
          ) {
            MessageBox.error("Döküm veya tarih Seçmek Zorunludur.");
            return false;
          }
          this.getTableData();
        },
        onPressCleanFilter: function () {
          this.byId("endCast").setValue("");
          this.byId("startCast").setValue("");
          this.byId("idDatePickerEnd").setValue("");
          this.byId("idDatePickerStart").setValue("");
          this.byId("idEquipmentObjType").setValue("");
        },
        getTableData: function () {
          TransactionCaller.async(
            "MES/Itelli/Refractory/REPORTS/T_genelRapor",
            {
              I_PLANT: this.appData.plant,
              I_ENDDATE: this.byId("idDatePickerEnd").getValue(),
              I_STARTDATE: this.byId("idDatePickerStart").getValue(),
              I_STARTCAST: this.byId("startCast").getValue(),
              I_ENDCAST: this.byId("endCast").getValue(),
              I_TNESNE: this.byId("idEquipmentObjType").getValue(),
            },
            "O_JSON",
            this.callTableData,
            this
          );
        },
        callTableData: function (iv_data, iv_scope) {
          if (iv_data[1] == "E") {
            MessageBox.error(iv_data[0]);
            return;
          }

          var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
            ? iv_data[0]?.Rowsets?.Rowset?.Row
            : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
          if (myArrr[0] == undefined) {
            MessageBox.error("Aranan filtrelere göre veri bulunamadı.");
          }
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(myArrr);

          var oTable = iv_scope.getView().byId("idReportTable");
          oTable.setModel(oModel);
          // return;
        },
        onPressEdit: function (oEvent) {
          var oButton = oEvent.getSource();
          var oBindingContext = oButton.getBindingContext();
          var oBindingObject = oBindingContext.getObject();

          var oModel = new JSONModel();
          oModel.setData(oBindingObject);

          this.openFragment();
          var lv_object = sap.ui.core.Fragment.byId(
            "refractoryGnlRapor",
            "idFragmentForm"
          );

          lv_object.setModel(oModel);
        },
        onPressDelete: function (oEvent) {
          var oButton = oEvent.getSource();
          var oBindingContext = oButton.getBindingContext();
          var oBindingObject = oBindingContext.getObject();
          this.selectedLine = oBindingObject;
          this.openConfirmDialog();
        },
        openFragment: function () {
          let _this = this;
          if (!this._oDialog) {
            this._oDialog = sap.ui.xmlfragment(
              "refractoryGnlRapor",
              "customActivity.fragmentView.refracterGnlRapor",
              this
            );
          }

          this._oDialog.open();
        },
        closeFragment: function () {
          this._oDialog.close();
        },
        saveFragmentData: function () {
          let {
            EKIPMAN_SAYAC,
            MALZEME_SAYAC,
            MALZEME_SAYAC_2,
            ID,
            DOKUM_NO,
            URETIM_YER,
            T_NESNE,
            EKIPMAN,
            MIKTAR
          } = sap.ui.core.Fragment.byId(
            "refractoryGnlRapor",
            "idFragmentForm"
          ).getModel().oData;

          this.saveCounterData({
            EKIPMAN_SAYAC,
            DOKUM_NO,
            URETIM_YER,
            T_NESNE,
            EKIPMAN,
            MALZEME_SAYAC,
            MALZEME_SAYAC_2,
            ID,
            MIKTAR
          });
          this.getTableData();
          this.closeFragment();
        },
        saveCounterData: function (data) {
          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/REPORTS/T_UPDATECOUNTDATA",
            {
              I_DOKUM_NO: data.DOKUM_NO,
              I_T_NESNE: data.T_NESNE,
              I_EKIPMAN: data.EKIPMAN,
              I_EKIPMAN_SAYAC: data.EKIPMAN_SAYAC,
              I_URETIM_YER: data.URETIM_YER,
              I_MALZEME_SAYAC: data.MALZEME_SAYAC,
              I_MALZEME_SAYAC_2: data.MALZEME_SAYAC_2,
              I_ID: data.ID,
              I_QUANTITY: data.MIKTAR
            },
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          sap.m.MessageToast.show(response[0]);
        },
        openConfirmDialog: function () {
          let _this = this;
          if (!this.oApproveDialog) {
            this.oApproveDialog = new Dialog({
              type: DialogType.Message,
              title: "Genel Rapor Veri Sil",
              content: new Text({
                text: "Verileri Silmek İstediğinize Emin Misiniz?",
              }),
              beginButton: new Button({
                type: ButtonType.Reject,
                text: "Sil",
                press: function () {
                  let response = this.deleteDataQry(this.selectedLine);
                  if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                  }
                  sap.m.MessageToast.show(response[0]);
                  this.getTableData();
                  this.oApproveDialog.close();
                  this.selectedLine = undefined
                }.bind(this),
              }),
              endButton: new Button({
                text: "İptal",
                press: function () {
                  this.oApproveDialog.close();
                }.bind(this),
              }),
            });
          }

          this.oApproveDialog.open();
        },
        deleteDataQry: function (data) {
          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/REPORTS/T_DELETEDATA",
            {
              I_DOKUM_NO: data.DOKUM_NO,
              I_T_NESNE: data.T_NESNE,
              I_EKIPMAN: data.EKIPMAN,
              I_URETIM_YER: data.URETIM_YER,
            },
            "O_JSON"
          );

          return response;
        },
      }
    );
  }
);
