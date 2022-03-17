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
    "sap/ui/core/BusyIndicator",
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
    BusyIndicator
  ) {
    //"use strict";
    var that;

    return Controller.extend("customActivity.controller.oeeBilletCutting", {
      formatter: formatter,

      onInit: function () {
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.interfaces = this.appComponent.getODataInterface();
        this.billetOdata = {
          BilletInfo: [],
        };
        this.jModel = new sap.ui.model.json.JSONModel();
        this.jModel.setData(this.billetOdata);
        this.getView().setModel(this.jModel, "infoTableModel");
        this.getWorkCenterNameQry();
        this.getLengthBillet();
      },
      deleteRow: function (oEvent) {
        var oRowIndex = oEvent
          .getSource()
          .oPropagatedProperties.oBindingContexts.infoTableModel.getPath()
          .substring(12);
        var oTable = this.getView().byId("tblBilletCharacteristic");
        var data = this.jModel.getData();
        data.BilletInfo.splice(oRowIndex, 1);
        this.jModel.setData(data);
        this.jModel.refresh();
        this.getView().setModel(this.jModel, "infoTableModel");
      },
      onPressAdd: function (oArg) {
        var batch = this.getView().getModel("batchModel").getData();
        var batchIndex = batch.findIndex((item) => item.REF === "X");
        var currentBatchData = batch[batchIndex];
        currentBatchData.LENGTH = 0;
        currentBatchData.QUANTITY = 0;
        var newRow = {};
        Object.assign(newRow, currentBatchData);
        newRow.CALCULATED_WEIGHT = 0;
        this.billetOdata.BilletInfo.push(newRow);
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData({ BilletInfo: this.billetOdata.BilletInfo });
        this.getView().setModel(oModel, "infoTableModel");
      },

      onClickSave: function () {
        var message = "";
        var totalyQuantity = this.getView().byId("totalyQuantity").getValue();
        var remainingQuantity = this.getView()
          .byId("remainingQuantity")
          .getValue();
        message = message =
          "Üretilecek toplam miktar : " +
          (
            parseFloat(totalyQuantity) - parseFloat(remainingQuantity)
          ).toLocaleString("en-US", {
            maximumFractionDigits: 3,
            minimumFractionDigits: 0,
          }) +
          " Ton\n" +
          "Hurda miktarı : " +
          remainingQuantity +
          " Ton\n" +
          this.appComponent.oBundle.getText("OEE_LABEL_TRANSACTION_ACCEPT");
        sap.m.MessageBox.warning(message, {
          id: "onClickSaveMessageBox",
          styleClass: "onClickSaveMessageBox",
          actions: [
            this.appComponent.oBundle.getText("EVET"),
            this.appComponent.oBundle.getText("HAYIR"),
          ],
          onClose: function (oAction) {
            if (oAction == "EVET") {
              this.onPressSave();
            } else {
              return;
            }
          }.bind(this),
        });
      },

      onPressSave: function () {
        //BWART ve HESAPLANAN AĞIRLIK MODELE EKLENİYOR
        var infoTableModel = this.billetOdata.BilletInfo;
        var oTable = this.getView().byId("tblBilletCharacteristic");
        var selectedBWART;
        var calculatedQuantity;
        for (var row = 0; row < infoTableModel.length; row++) {
          selectedBWART = oTable.getItems()[row].getCells()[0].getSelectedKey();
          calculatedQuantity = oTable.getItems()[row].getCells()[3].getText();
          infoTableModel[row].BWART = selectedBWART;
          infoTableModel[row].CALCULATEDQUANTITY = calculatedQuantity;
          if (
            parseFloat(infoTableModel[row].LENGTH) *
            parseFloat(infoTableModel[row].QUANTITY) >
            parseFloat(infoTableModel[row].ADET) *
            parseFloat(infoTableModel[row].Y_BOY_KTK)
          ) {
            MessageBox.error("Girilen değerleri kontrol ediniz!");
            return;
          }
        }
        // this.getView().setBusy(true);
        var batchData = this.getView().getModel("batchModel").oData;
        //BWART ve HESAPLANAN AĞIRLIK MODELE EKLENİYOR
        //JSON'a çevrildi
        var sInfoJSON =
          '{"item":' + JSON.stringify(this.billetOdata.BilletInfo) + "}"; //Tablodakiler
        var sAllBatchJSON = '{"item":' + JSON.stringify(batchData) + "}"; //Parti bilgileri
        //JSON'a çevrildi

        var totalyQuantity = this.getView().byId("totalyQuantity").getValue();
        var remainingQuantity = this.getView()
          .byId("remainingQuantity")
          .getValue();

        var params = {
          allBatchJSON: sAllBatchJSON,
          infoJSON: sInfoJSON,
          I_ARBPL: this.appData.workCenterName,
          I_PLANT: this.appData.plant,
          I_NODEID: this.appData.node.nodeID,
          I_TOTALQUANTITY: totalyQuantity,
          I_REMAININGQUANTITY: remainingQuantity,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/BilletCutting/saveBilletCuttingInfoXqry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        sap.m.MessageToast.show(tRunner.GetMessage());
        this.onPressClean();
        this.getView().setBusy(false);
      },
      onPressFetch: function () {
        this.appData.selectedBatch = [];
        var billetQuantity = this.getView()
          .byId("billetQuantityInput")
          .getValue();
        var selectedBatchComboBox = this.getView().byId("billetPartyNo");
        if (!(parseFloat(billetQuantity) >= 1)) {
          this.getView()
            .byId("billetQuantityInput")
            .setValueState(sap.ui.core.ValueState.Error)
            .setValueStateText("Lütfen 0'dan büyük bir sayı giriniz");
          return null;
        } else if (selectedBatchComboBox.getSelectedItem() == null) {
          this.getView()
            .byId("billetQuantityInput")
            .setValueState(sap.ui.core.ValueState.Success);
          selectedBatchComboBox.setValueState(sap.ui.core.ValueState.Error);
          return null;
        } else {
          selectedBatchComboBox.setValueState(sap.ui.core.ValueState.Success);
          this.getView()
            .byId("billetQuantityInput")
            .setValueState(sap.ui.core.ValueState.Success);
        }
        this.onFetchedControls();
      },
      onSearchResultsSelected: function () {
        var oTable = this.getView().byId("tblBilletSelect");
        var oTableSelected = oTable.getSelectedItems();
        var selectedLength = oTableSelected.length;
        var oModel = this.getView().getModel("searchTableModel");
        var modelRows = oModel.oData.Row;
        var selectedItems = [];
        var path;
        for (var i = 0; i < selectedLength; i++) {
          path = oTableSelected[
            i
          ].oBindingContexts.searchTableModel.sPath.substring(5);
          selectedItems.push(modelRows[path]);
        }
        selectedItems.forEach(function (item, index) {
          item.REF = undefined;
        }, this);

        var batchModel = new sap.ui.model.json.JSONModel();
        batchModel.setData(selectedItems);
        this.getView().setModel(batchModel, "batchModel");

        this.getView()
          .byId("billetQuantityInput")
          .setValue(
            batchModel.oData.reduce(
              (ADET, row) => parseFloat(ADET) + parseFloat(row.ADET),
              0
            )
          );

        if (selectedItems != null) {
          var firstItem = this.getView().byId("billetPartyNo").getItems()[0];
          this.getView().byId("billetPartyNo").setSelectedItem(firstItem);
        }
        this.handleCancel();
        this.selectRefBillet();
        if (selectedItems.length > 0) this.onPressFetch();
      },

      handleSearchResults: function () {
        this.getView().setBusy(true);
        this.getView().byId("tblBilletSelect").destroyItems();
        //ARAMA PARAMETRELERI
        var PLANT = this.appData.plant;
        var DEPO = this.getView().byId("srcStockRoom").getValue();
        if (DEPO == "") {
          this.getView()
            .byId("srcStockRoom")
            .setValueState(sap.ui.core.ValueState.Error);
          sap.m.MessageToast.show("Depo Yeri parametresi zorunludur");
          return null;
        } else
          this.getView()
            .byId("srcStockRoom")
            .setValueState(sap.ui.core.ValueState.None);
        var DOKUMNO = this.getView().byId("srcCastNo").getValue();
        var EBAT = this.getView().byId("billetSize").getValue();
        var BOY_KTK = this.getView().byId("billetLength").getValue();
        var Y_KALITE = this.getView().byId("billetQuality").getValue();
        var VAKUM = this.getView().byId("vacuumSelect").getSelectedKey();
        var MENSEI = this.getView().byId("billetOrigin").getValue();
        var SAPMA = this.getView().byId("billetDeflection").getValue();
        var DOKUM_TIPI = this.getView().byId("castType").getValue();
        var IKINCI_KALITE = this.getView().byId("billetScndQuality").getValue();
        var KARISIM = this.getView().byId("billetMix").getValue();
        var KARISIM_KAL = this.getView().byId("billetMixQuality").getValue();
        //ARAMA PARAMETRELERI
        var params = {
          I_PLANT: PLANT,
          I_DEPO: DEPO,
          I_DOKUMNO: DOKUMNO,
          I_EBAT: EBAT,
          I_BOY_KTK: BOY_KTK,
          I_Y_KALITE: Y_KALITE,
          I_VAKUM: VAKUM,
          I_MENSEI: MENSEI,
          I_SAPMA: SAPMA,
          I_DOKUM_TIPI: DOKUM_TIPI,
          I_IKINCI_KALITE: IKINCI_KALITE,
          I_KARISIM: KARISIM,
          I_KARISIM_KAL: KARISIM_KAL,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/BilletCutting/searchBilletCuttingInfoXqry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callAvailableBillets);
      },
      callAvailableBillets: function (p_this, p_data) {
        if (p_data.Rowsets == undefined) {
          MessageBox.error("Bu parametreler ile veri bulunamadı.");
          return null;
        }
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "searchTableModel");
        p_this.getView().setBusy(false);
      },
      onSearchDialog: function () {
        var oView = this.getView();
        var oDialog = oView.byId("addBilletCuttingDetails");
        if (oDialog != undefined) oDialog.destroy();
        oDialog = sap.ui.xmlfragment(
          oView.getId(),
          "customActivity.fragmentView.addBilletCuttingDetails",
          this
        );
        oView.addDependent(oDialog);
        oDialog.open();
        this.appData.oDialog = oDialog;
        this.getWarehousePlace();
      },

      callWarehousePlace: function (p_this, p_data) {
        var warehousePlace = p_data.Rowsets.Rowset[0]?.Row[0].VALUE;
        p_this.getView().byId("srcStockRoom").setValue(warehousePlace);
      },

      getWarehousePlace: function () {
        var nodeID = this.appData.node.nodeID;
        var params = { "Param.1": nodeID };

        var tRunner = new TransactionRunner(
          "MES/UI/BilletCutting/getWarehousePlaceQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callWarehousePlace);
      },

      selectRefBillet: function (oEvent) {
        var oModel = new sap.ui.model.json.JSONModel();
        var oData = this.getView().getModel("batchModel").oData;
        var batchNumber;
        if (!oData[0]?.CHARG) return;
        if (!oEvent) batchNumber = oData[0].CHARG;
        else {
          batchNumber = oEvent.getSource().getSelectedKey();

          oData.forEach(function (item, index) {
            item.REF = undefined;
          }, this);
        }

        oData.find((e) => e.CHARG == batchNumber).REF = "X";

        oModel.setData(oData);
        this.getView().setModel(oModel, "batchModel");
        if(oData.length < 2){
          this.getView()
          .byId("totalyQuantity")
          .setValue(
            oData[0].MENGE
          );
        } else{
          cu = 0;
          for(i=0;i<oData.length;i++){
            cu = cu + parseFloat(oData[i].MENGE);
          }
          this.getView()
          .byId("totalyQuantity")
          .setValue(
            cu
          );
        }
        

        this.totalyQuantity =
          parseFloat(oData?.find((e) => e.REF == "X").Y_KGADT) *
          oData
            ?.reduce((ADET, row) => parseFloat(ADET) + parseFloat(row.ADET), 0)
            .toFixed(3);
        this.calculateRemaining();
      },

      onPressClean: function () {
        var allScreen = [
          ["billetPartyNo", "select"],
          ["billetQuantityInput", "input"],
          ["totalyQuantity", "input"],
          ["remainingQuantity", "input"],
          ["batchModel", "model"],
          ["infoTableModel", "model"],
        ];

        allScreen.forEach(function (item, index) {
          var oView = this.getView();
          if (item[1] == "input") oView.byId(item[0]).setValue(0);
          else if (item[1] == "select") {
            oView.byId(item[0]).setSelectedKey("");
            oView.byId(item[0]).setValue("");
          } else if (item[1] == "model") {
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(null);
            oView.setModel(oModel, item[0]);
          }
        }, this);
        this.billetOdata.BilletInfo = [];
      },

      callWorkCenterNameQry: function (p_this, p_data) {
        p_this.appData.workCenterName = p_data.Rowsets.Rowset[0].Row[0].NAME;
      },

      getWorkCenterNameQry: function () {
        var nodeID = this.appData.node.nodeID;
        var params = { "Param.1": nodeID };

        var tRunner = new TransactionRunner(
          "MES/UI/BilletCutting/getWorkcenterNameQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callWorkCenterNameQry);
      },

      onFetchedControls: function () {
        this.getView().byId("btnAdd").setEnabled(true);
        this.getView().byId("btnSave").setEnabled(true);
      },
      handleCancel: function (oEvent) {
        this.appData.oDialog.close();
      },

      selectCheckBox: function (oEvent) {
        var sPath = oEvent.getSource().getParent().getBindingContextPath();
        var chosenRow = sPath.split("/BilletInfo/")[1];
        var tableData = this.getView().getModel("infoTableModel").oData
          .BilletInfo;
        var selectBoolean;
        if (oEvent.getSource().getSelected()) selectBoolean = "X";
        else selectBoolean = "";

        var id = oEvent
          .getSource()
          .getId()
          .split("__xmlview2--")[1]
          .split("-")[0];

        switch (id) {
          case "secondQuality":
            tableData[chosenRow].Y_IKINCIKLT = selectBoolean;
            break;
          case "deflection":
            tableData[chosenRow].Y_SAPMA = selectBoolean;
            break;
          case "nonstandard":
            tableData[chosenRow].Y_STANDART = selectBoolean;
            break;
        }
      },

      onChangeBilletQuantity: function (oEvent) {
        var quantity = oEvent.getSource().getValue();
        if (parseFloat(quantity) < 0) oEvent.getSource().setValue(0);
      },

      callLengthBillet: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0].Row);
        p_this.getView().setModel(oModel, "lengthBilletModel");
      },

      getLengthBillet: function () {
        var tRunner = new TransactionRunner(
          "MES/UI/BilletCutting/getLengthBilletQry"
        );
        tRunner.ExecuteQueryAsync(this, this.callLengthBillet);
      },

      calculateWeight: function (oEvent) {
        var sPath = oEvent.getSource().getParent().getBindingContextPath();
        var chosenRow = sPath.split("/BilletInfo/")[1];
        if (!!oEvent.getSource().getValue) {
          if (parseFloat(oEvent.getSource().getValue()) < 0) {
            oEvent.getSource().setValue(0);
            sap.m.MessageToast.show(
              this.appComponent.oBundle.getText(
                "OEE_LABEL_CANNOT_ENTRY_NEGATIVE_VALUE"
              )
            );
          }
          this.getView().getModel("infoTableModel").oData.BilletInfo[
            chosenRow
          ].QUANTITY = oEvent.getSource().getValue();
        } else
          this.getView().getModel("infoTableModel").oData.BilletInfo[
            chosenRow
          ].LENGTH_BILLET = oEvent.getSource().getSelectedKey();

        var BilletInfo = this.getView().getModel("infoTableModel").oData
          .BilletInfo;

        var rowInfo = BilletInfo[chosenRow];
        rowInfo.CALCULATED_WEIGHT = parseFloat(
          (
            (parseFloat(rowInfo.Y_KGADT) / parseFloat(rowInfo.Y_BOY_KTK)) *
            parseFloat(rowInfo.LENGTH_BILLET) *
            parseFloat(rowInfo.QUANTITY)
          ).toFixed(3)
        );

        rowInfo.CALCULATED_KGADT = parseFloat(
          (
            (parseFloat(rowInfo.Y_KGADT) / parseFloat(rowInfo.Y_BOY_KTK)) *
            parseFloat(rowInfo.LENGTH_BILLET)
          ).toFixed(3)
        );

        rowInfo.CALCULATED_WEIGHTTEXT = parseFloat(
          (rowInfo.CALCULATED_WEIGHT / 1000).toFixed(3)
        );

        BilletInfo[chosenRow] = rowInfo;
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData({ BilletInfo: BilletInfo });
        this.getView().setModel(oModel, "infoTableModel");
        this.calculateRemaining();
      },

      onPressOpenConfirmList: function () {
        var oView = this.getView();
        var oDialog = oView.byId("confirmListBilletCutting");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.confirmListBilletCutting",
            this
          );
          oView.addDependent(oDialog);
        }
        oDialog.open();
        this.appData.oDialog = oDialog;
        var day = new Date();
        var day =
          day.getDate() + "." + (day.getMonth() + 1) + "." + day.getFullYear();
        this.getView().byId("idDatePicker").setValue(day);

        this.getConfirmListBilletCutting();
      },

      callConfirmBilletCutting: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0].Row);
        p_this.getView().setModel(oModel, "confirmListBilletCuttingModel");
      },

      getConfirmListBilletCutting: function () {
        var nodeID = this.appData.node.nodeID;
        var date = this.getView().byId("idDatePicker").getValue();

        var params = { "Param.1": nodeID, "Param.2": date };

        var tRunner = new TransactionRunner(
          "MES/UI/BilletCutting/getConfirmBilletCuttingQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callConfirmBilletCutting);
      },
      cancelConfirm: function (oEvent) {
        var pressRow = oEvent
          .getSource()
          .getParent()
          .getBindingContextPath()
          .split("/")[1];
        var rows = this.getView().getModel("confirmListBilletCuttingModel")
          .oData;

        var params = {
          I_CONF_NUMBER: rows[pressRow].CONF_NUMBER,
          I_CONF_COUNTER: rows[pressRow].CONF_COUNTER,
        };

        sap.m.MessageBox.warning(
          this.appComponent.oBundle.getText("OEE_ALERT_FLM_CONFIRM_CANCEL"),
          {
            actions: [
              this.appComponent.oBundle.getText("EVET"),
              this.appComponent.oBundle.getText("HAYIR"),
            ],
            onClose: function (oAction) {
              if (oAction == "EVET") {
                this.cancelConfirmSave(params);
              } else {
                return;
              }
            }.bind(this),
          }
        );
      },

      callCancelConfirmXquery: function (p_this, p_data) {
        sap.m.MessageToast.show(
          p_this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
        );
        p_this.getConfirmListBilletCutting();
      },

      cancelConfirmSave: function (params) {
        var tRunner = new TransactionRunner(
          "MES/UI/BilletCutting/cancelConfirmXquery",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callCancelConfirmXquery);
      },

      calculateRemaining: function () {
        var totalyQuantity = this.getView().byId("totalyQuantity").getValue();
        var BilletInfo = this.getView().getModel("infoTableModel").oData
          .BilletInfo;
        var sumQuantity = parseFloat(
          BilletInfo?.reduce(
            (CALCULATED_WEIGHT, row) =>
              parseFloat(CALCULATED_WEIGHT) + parseFloat(row.CALCULATED_WEIGHT),
            0
          ).toFixed(3)
        );

        var remainingQuantityID = this.getView().byId("remainingQuantity");

        var remainingQuantity = (
          ((parseFloat(totalyQuantity) * 1000) - parseFloat(sumQuantity)) /
          1000
        );
        remainingQuantityID.setValue(parseFloat(remainingQuantity).toFixed(3));
        var tableRow = this.getView().getModel("batchModel").getData();
        var tableRowLength = tableRow.length;
        if(tableRowLength > 1){
          remainingQuantity = 0;
          for (i = 0; i < tableRowLength; i++) {
            remainingQuantity = remainingQuantity + parseFloat(tableRow[i].MENGE);
          }
          remainingQuantity = ((remainingQuantity * 1000) - parseFloat(sumQuantity)) / 1000;
        }
        
        if (!(BilletInfo[0] == undefined)) {
          if (tableRowLength < 2) {
            // istenilen adet oluşturulabilecek adetten fazla mı diye kontrol ediyor - tek data geldi ise bu kontrol yapılır, değilse total ağırlık kontrolü yapılır
            if (parseFloat(BilletInfo[0].QUANTITY) > parseInt(parseFloat(BilletInfo[0].Y_BOY_KTK) / parseFloat(BilletInfo[0].LENGTH_BILLET)) * parseFloat(BilletInfo[0].ADET)) {
              this.getView().byId("btnSave").setEnabled(false);
              sap.m.MessageBox.error("Girilebilecek maksimum miktarı aştınız!");
              remainingQuantityID.setValueState(sap.ui.core.ValueState.Error);
              return;
            } else if (parseFloat(BilletInfo[0].QUANTITY) < parseInt(parseFloat(BilletInfo[0].Y_BOY_KTK) / parseFloat(BilletInfo[0].LENGTH_BILLET)) * parseFloat(BilletInfo[0].ADET)) {
              this.getView().byId("btnSave").setEnabled(true);
            }
            remainingQuantityID.setValueState(sap.ui.core.ValueState.None);
          }
          //total ağırlık kontrolü yapılıyor
          else {
            if (remainingQuantity < 0) {
              this.getView().byId("btnSave").setEnabled(false);
              sap.m.MessageBox.error("Kalan miktar 0'ın altındadır!");
              remainingQuantityID.setValueState(sap.ui.core.ValueState.Error);
              return;
            } else if (remainingQuantity > 0)
              this.getView().byId("btnSave").setEnabled(true);
            remainingQuantityID.setValueState(sap.ui.core.ValueState.None);
          }
        }
      },
    });
  }
);