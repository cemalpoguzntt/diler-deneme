sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/m/MessageBox",
      "sap/m/MessageToast",
      "customActivity/scripts/custom",
      "customActivity/scripts/customStyle",
      "../model/formatter",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
      "sap/ui/model/FilterType",
      "sap/ui/model/Sorter",
      "customActivity/scripts/customStyle",
    "customActivity/scripts/transactionCaller"
    ],
  
    function (
      Controller,
      JSONModel,
      MessageBox,
      MessageToast,
      customScripts,
      customStyle,
      formatter,
      Filter,
      FilterOperator,
      FilterType,
      Sorter,
      customStyle,
    TransactionCaller
    ) {
      //"use strict";
      var that;
  
      return Controller.extend(
        "customActivity.controller.oeeBilletInsideFurnaceHH",
        {
          /**
           * Called when a controller is instantiated and its View controls (if available) are already created.
           * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
           */
  
          formatter: formatter,
  
          onInit: function () {
          //  this.getAdminPermission();
            this.appComponent = this.getView().getViewData().appComponent;
            this.appData = this.appComponent.getAppGlobalData();
            this.appData.intervalState = true;
            this.interfaces = this.appComponent.getODataInterface();
            this.getBilletFurnaceCount();
            this.getFirstBilletDetail();
            this.getChargeTypeQuan();
            this.getBilletList();
            this.getNameFromWorkcenter();
            //Filtreleme için 5sn.de bir yenileme iptal
            this.modelServices();
	        this.getUserRoles();
            this.getTableData();
          },
  
          getAdminPermission: function () {
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getLocationAdminXqry",
              {}
            );
            tRunner.ExecuteQueryAsync(this, this.getAdminPermissionCB);
          },
  
          getAdminPermissionCB: function (p_this, p_data) {
            debugger;
          },
  
          setTodayReturnedBillet: function (oEvent) {
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
              .byId("idDatePickerReturned")
              .setValue(setYest + " - " + setTom);
          },
  
          getNameFromWorkcenter: function () {
            var wc = this.appData.node.workcenterID;
            var params = {
              "Param.1": wc,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getNameFromWorkcenterQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callName);
          },
  
          callName: function (p_this, p_data) {
            p_this.appData.name = p_data.Rowsets.Rowset[0].Row[0].NAME;
          },
  
          callGetAlert: function (p_this, p_data) {
            var data = p_data.Rowsets.Rowset[0].Row;
            if (data != undefined) {
              var alertMessage = p_data.Rowsets.Rowset[0].Row[0].LONGTEXT;
              var alertID = p_data.Rowsets.Rowset[0].Row[0].ID;
              sap.m.MessageBox.warning(
                p_this.appComponent.oBundle.getText(alertMessage),
                {
                  actions: [p_this.appComponent.oBundle.getText("TAMAM")],
                  onClose: function (oAction) {
                    if (oAction == "TAMAM") {
                      p_this.appData.intervalState = true;
                      p_this.getView().byId("chkIntervalState").setPressed(true);
                      p_this.updateAlertStatus(alertID);
                    } else {
                      return;
                    }
                  }.bind(p_this),
                }
              );
            } else {
              p_this.appData.intervalState = true;
              p_this.getView().byId("chkIntervalState").setPressed(true);
            }
          },
  
          getAlert: function (oEvent) {
            var plant = this.appData.plant;
            var workcenterid = this.appData.node.workcenterID;
            var shortText = plant + "" + "FRG_ALERT" + workcenterid;
            var params = {
              "Param.1": shortText,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/AlertViewer/getNewAlertQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callGetAlert);
            this.appData.intervalState = false;
            this.getView().byId("chkIntervalState").setPressed(false);
          },
  
          updateAlertStatus: function (alertID) {
            var params = {
              I_ALERTID: alertID,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/AlertViewer/updateAlertStatusXqry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callUpdateAlert);
          },
  
          callUpdateAlert: function (p_this, p_data) {
            p_this.appData.intervalState = true;
            p_this.getView().byId("chkIntervalState").setPressed(true);
          },
  
          callFirstBillet: function (p_this, p_data) {
            var tableData = [];
            var characteristic = [];
            var rows = p_data.Rowsets?.Rowset[0]?.Row;
            //  if (rows === undefined) {
            //   return;
            //  }
            var werks = p_this.appData.plant;
            var workcenterID = p_this.appData.node.workcenterID;
            var aufnr = p_this.appData.selected.order.orderNo;
            var boolean;
            if (rows === undefined) {
              oModel.setData(tableData);
              p_this.getView().setModel(oModel, "firstBilletDetail");
              return false;
            }
            for (var i = 0; i < rows.length; i++) {
              boolean = true;
              for (var k = 0; k < tableData.length; k++) {
                if (rows[i].KTKID == tableData[k].KTKID) boolean = false;
              }
  
              if (boolean) tableData.push(rows[i]);
            }
            for (i = 0; i < rows.length; i++) {
              for (k = 0; k < tableData.length; k++) {
                if (tableData[k].KTKID == rows[i].KTKID)
                  tableData[k][rows[i].CHARC] = rows[i].CHARC_VALUE;
  
                var charList = [
                  "Y_IKINCIKLT",
                  "Y_SAPMA",
                  "Y_STDDISI",
                  "Y_KARISIM",
                ];
                if (charList.includes(rows[i].CHARC)) {
                  tableData[k].KTKST = rows[i].CHARC;
                }
              }
            }
  
            for (var i = 0; i < tableData.length; i++) {
              if (
                tableData[i].SIGNAL_POINT != "Fırın Girişi" &&
                tableData[i].STATUS == "ERR"
              )
                tableData[i].COLOR = "Error";
            }
  
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(tableData);
            p_this.getView().setModel(oModel, "firstBilletDetail");
          },
  
          getFirstBilletDetail: function () {
            var plant = this.appData.plant;
            var workcenterid = this.appData.node.workcenterID;
            var params = {
              "Param.1": plant,
              "Param.2": workcenterid,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getFirstBilletDetailQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callFirstBillet);
          },
  
          changeIntervalState: function (oEvent) {
            var stat = oEvent.getParameter("pressed");
            this.appData.intervalState = stat;
          },
  
          onOpenRejectDialog: function (oEvent) {
            var plant = this.appData.plant;
            var oTable = this.getView().byId("tblBilletMaster");
            var tableModel = this.getView().getModel("confirmBilletList").oData;
            var tableModelLength = tableModel.length;
            var oSelectedRowLength = oTable.getSelectedContexts().length;
            for (i = 0; i < oSelectedRowLength; i++) {
              var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
              var selectedRow = selectedRowPath.split("/")[1];
            }
            if (selectedRow == undefined) {
              sap.m.MessageBox.warning("Lütfen bir kütük seçiniz !");
              return;
            } else if (oSelectedRowLength > 1 && plant == 3001) {
              sap.m.MessageBox.warning("1 den fazla kütük iadesi yapılamaz.");
              return;
            } else if (
              plant == 3001 &&
              tableModel[selectedRow].BILLET_SEQ != 0 &&
              tableModel[selectedRow].BILLET_SEQ > 15 &&
              tableModelLength - tableModel[selectedRow].BILLET_SEQ > 15
            ) {
              sap.m.MessageBox.warning(
                "İade işlemi için ilk 15 yada son 15 kütükten seçim yapılmalıdır."
              );
              return;
            } else {
              if (!this.getBilletDetail()) {
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
              this.getBilletRejectType();
            }
          },
  
          onMenuAction: function (oEvent) {
            var selectedItem = oEvent.getParameter("item").mAggregations.tooltip;
            switch (selectedItem) {
              case "0":
                this.onOpenEditLocationDialog();
                break;
              case "1":
                this.onOpenEditWeightDialog();
                break;
            }
          },
  
          onOpenEditLocationDialog: function (oEvent) {
            var oView = this.getView();
            var oDialog = oView.byId("editBilletLocationFLM");
            if (!oDialog) {
              this.getView().byId("editBilletLocationFLM")?.destroyContent();
              this.getView().byId("editBilletLocationFLM")?.destroy();
              oDialog = sap.ui.xmlfragment(
                oView.getId(),
                "customActivity.fragmentView.editBilletLocationFLM",
                this
              );
              oView.addDependent(oDialog);
            }
            this.appData.oDialog = oDialog;
            oDialog.open();
            this.getBilletLocationList();
          },
  
          onOpenEditWeightDialog: function (oEvent) {
            var oView = this.getView();
            var oDialog = oView.byId("editBilletWeightFLM");
  
            if (!oDialog) {
              this.getView().byId("editBilletWeightFLM")?.destroyContent();
              this.getView().byId("editBilletWeightFLM")?.destroy();
              oDialog = sap.ui.xmlfragment(
                oView.getId(),
                "customActivity.fragmentView.editBilletWeightFLM",
                this
              );
              oView.addDependent(oDialog);
            }
            this.appData.oDialog = oDialog;
            oDialog.open();
          },
  
          addBilletToFurnaceDialog: function (oEvent) {
            var oView = this.getView();
            var oDialog = oView.byId("addBilletToFurnaceMill");
            if (!oDialog) {
              oDialog = sap.ui.xmlfragment(
                oView.getId(),
                "customActivity.fragmentView.addBilletToFurnaceMill",
                this
              );
              oView.addDependent(oDialog);
            }
            this.appData.oDialog = oDialog;
            oDialog.open();
          },
  
          onConfirmAddBillet: function () {
            var wc_name = this.appData.name;
            if (wc_name == "HHYOL1" || wc_name == "HHYOL2") {
              var name = "HHYOL1";
            } else {
              var name = "YZC2HAD";
            }
            var plant = this.appData.plant;
            var workcenterid = this.appData.node.workcenterID;
            var quantity = this.getView().byId("quantity").getValue();
            var kutuks = "1";
            var location = "FRI";
            var table = this.getView()
              .byId("idDialogSelectTable")
              ._getSelectedItemText();
            var wgh = this.getView().byId("idDialogWeight").getValue();
            /*
              if (wgh == "" || quantity == "") {
                MessageToast.show(
                  this.appComponent.oBundle.getText("OEE_LABEL_PLEASE_CONTROL")
                );
    
                return;
              }
    */
  
            if (quantity > 10) {
              sap.m.MessageBox.warning(
                "En fazla 10 adet kütük ekleyebilirsiniz !!"
              );
              return;
            }
            var params = {
              I_PLANT: plant,
              //    I_WORKCENTER: workcenterid,
              I_NAME: name,
              I_KUTUKS: kutuks,
              I_LOCATION: location,
              I_SEHPA: table,
              I_WEIGHT: wgh,
              I_QUANTITY: quantity,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/Manual/manualInsertBilletToFurnaceXqry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callAddBillet);
            this.handleCancel();
          },
  
          callAddBillet: function (p_this, p_data) {
            p_this.getBilletList();
            p_this.handleCancel();
            sap.m.MessageToast.show("Kütük ekleme başarılı");
          },
  
          callBilletDetail: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(p_data.Rowsets.Rowset[0]);
            p_this.getView().setModel(oModel, "rejectionModel");
          },
  
          getBilletDetail: function (param) {
            var plant = this.appData.plant;
            var tableModel = this.getView().getModel("confirmBilletList").oData;
            var oTable = this.getView().byId("tblBilletMaster");
            var selectedRows = oTable.getSelectedContexts()[0]?.sPath;
            if (!selectedRows) {
              MessageToast.show(
                this.appComponent.oBundle.getText("OEE_ROW_ERROR")
              );
              return false;
            }
            var selectedRow = selectedRows.split("/")[1];
            var Ktkid = tableModel[selectedRow].KTKID;
            /*  this.getView().byId("rejectedKtkid").setSelectedKey(Ktkid); */
            var params = { "Param.1": Ktkid };
            var tRunner = new TransactionRunner(
              "MES/UI/Filmasin/getKTKIDForRejectQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callBilletDetail);
            return true;
          },
  
          getBilletRejectType: function (oEvent) {
            var plant = this.appData.plant;
            var wc = this.appData.node.workcenterID;
            var params = { "Param.1": plant, "Param.2": wc };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getTypeOfRejectQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callRejectType);
          },
          callRejectType: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(p_data.Rowsets.Rowset[0]);
            p_this.getView().setModel(oModel, "rejectedNotifTypes");
          },
  
          onSelectRejectType: function (oEvent) {
            var plant = this.appData.plant;
            var wc = this.appData.node.workcenterID;
            var selectRejectType = this.getView().byId("selectType");
            var RejectType = selectRejectType.getSelectedKey();
            var params = {
              "Param.1": plant,
              "Param.2": wc,
              "Param.3": RejectType,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getReasonOfRejectQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callRejectReason);
            selectRejectType.setValueState("Success");
          },
  
          callRejectReason: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(p_data.Rowsets.Rowset[0]);
            p_this.getView().setModel(oModel, "rejectedNotifReasons");
          },
  
          onSelectRejectReason: function (oEvent) {
            var plant = this.appData.plant;
            var selectRejectReason = this.getView().byId("selectReason");
            var RejectType = selectRejectReason.getSelectedKey();
            var params = { "Param.1": RejectType, "Param.2": plant };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getDetailOfReasonQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callRejectDetail);
            selectRejectReason.setValueState("Success");
          },
  
          callRejectDetail: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(p_data.Rowsets.Rowset[0]);
            p_this.getView().setModel(oModel, "rejectedNotifDetails");
          },
  
          onSelectRejectDetail: function (oEvent) {
            var selectRejectDetail = this.getView().byId("selectDetail");
            selectRejectDetail.setValueState("Success");
          },
  
          /*25.09.2020*/
          onConfirmBilletReject: function (oEvent) {
            var tableModel = this.getView().getModel("confirmBilletList").oData;
            var oTable = this.getView().byId("tblBilletMaster");
            var typeSelect = this.getView().byId("selectType");
            var reasonSelect = this.getView().byId("selectReason");
            var detailSelect = this.getView().byId("selectDetail");
  
            var selectedKtkIdList = [];
            var oSelectedRowLength = oTable.getSelectedContexts().length;
            for (i = 0; i < oSelectedRowLength; i++) {
              var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
              var selectedRow = selectedRowPath.split("/")[1];
              var Ktkid = tableModel[selectedRow].KTKID;
              selectedKtkIdList.push(Ktkid);
            }
  
            var plant = this.appData.plant;
            var workcenterid = this.appData.node.workcenterID;
            var reasonType = this.getView().byId("selectType").getSelectedKey();
            var reason = this.getView().byId("selectReason").getSelectedKey();
            var user = this.appData.user.userID;
            var desc = this.byId("description").mProperties.value;
            var detail = this.getView()
              .byId("selectDetail")
              .getSelectedItem()
              ?.getText();
            var reasonText = reasonSelect.getSelectedItem()?.getText();
            if (detail != undefined)
              var detailKey = this.getView()
                .byId("selectDetail")
                .getSelectedKey();
  
            if (reasonType == "") {
              typeSelect.setValueState("Error");
              sap.m.MessageToast.show("Uygunsuzluk türü seçmelisiniz!");
              return null;
            }
            if (reason == "") {
              typeSelect.setValueState("Success");
              reasonSelect.setValueState("Error");
              sap.m.MessageToast.show("Uygunsuzluk nedeni seçmelisiniz!");
              return null;
            }
            var detailCount = this.getView().getModel("rejectedNotifDetails")
              .oData.Row?.length;
            if (
              detailCount != undefined &&
              detailCount > 0 &&
              detail == undefined
            ) {
              typeSelect.setValueState("Success");
              reasonSelect.setValueState("Success");
              detailSelect.setValueState("Error");
              sap.m.MessageToast.show(
                "Bu uygunsuzluk nedeni için detay seçmelisiniz!"
              );
              return null;
            }
            typeSelect.setValueState("Success");
            reasonSelect.setValueState("Success");
            detailSelect.setValueState("Success");
            var params = {
              I_WORKCENTERID: workcenterid,
              I_REASON_TYPE: reasonType,
              I_REASON: reason,
              I_REASONTEXT: reasonText,
              I_DESCRIPTION: desc,
              I_DETAIL: detail,
              I_DETAILKEY: detailKey,
              ElementList_TRNS: selectedKtkIdList.toString(),
              I_USER: user,
            };
            this.handleCancel();
            var tRunner = new TransactionRunner(
              "MES/Integration/OPC/BilletReject/insertBilletRejectReasonXqry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callConfirmReject);
          },
          /*25.09.2020*/
  
          callConfirmReject: function (p_this, p_data) {
            //p_this.handleCancel();
            sap.m.MessageToast.show("Uygunsuzluk kaydedildi");
            p_this.onInit();
          },
  
          addRowColor: function () {
            var status;
            var items = this.getView().byId("tblBilletMaster").getItems();
            for (i = 0; i < items.length; i++) {
              status =
                this.getView().getModel("confirmBilletList").oData[i]
                  .BILLET_STATUS;
              if (status == "OTO_IADE") {
                items[i].addStyleClass("HURDA");
              }
            }
          },
  
          callBilletList: function (p_this, p_data) {
            p_this.getView().byId("tblBilletMaster").setBusy(false);
            var tableData = [];
            var characteristic = [];
            var rows = p_data.Rowsets?.Rowset[0]?.Row;
            //  if (rows === undefined) {
            //   return;
            //  }
            var werks = p_this.appData.plant;
            var workcenterID = p_this.appData.node.workcenterID;
            var aufnr = p_this.appData.selected.order.orderNo;
            var boolean;
            if (rows === undefined) {
              oModel.setData(tableData);
              p_this.getView().setModel(oModel, "confirmBilletList");
              return false;
            }
            for (var i = 0; i < rows.length; i++) {
              boolean = true;
              for (var k = 0; k < tableData.length; k++) {
                if (rows[i].KTKID == tableData[k].KTKID) boolean = false;
              }
  
              if (boolean) tableData.push(rows[i]);
            }
            for (i = 0; i < rows.length; i++) {
              for (k = 0; k < tableData.length; k++) {
                if (tableData[k].KTKID == rows[i].KTKID)
                  tableData[k][rows[i].CHARC] = rows[i].CHARC_VALUE;
  
                var charList = [
                  "Y_IKINCIKLT",
                  "Y_SAPMA",
                  "Y_STDDISI",
                  "Y_KARISIM",
                ];
                if (charList.includes(rows[i].CHARC)) {
                  tableData[k].KTKST = rows[i].CHARC;
                }
              }
            }
  
            for (var i = 0; i < tableData.length; i++) {
              if (
                tableData[i].SIGNAL_POINT != "Fırın Girişi" &&
                tableData[i].STATUS == "ERR"
              )
                tableData[i].COLOR = "Error";
            }
  
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(tableData);
            p_this.getView().setModel(oModel, "confirmBilletList");
            p_this._setFilters(tableData);
            p_this.addRowColor();
          },
  
          _setFilters: function (dataset) {
            var oView = this.getView();
            var modelFilter = new sap.ui.model.json.JSONModel();
            var arrQuality = Array.from(
              new Set(dataset.map((s) => s.Y_KALITE_KTK))
            ).map((Y_KALITE_KTK) => {
              return {
                Y_KALITE_KTK: Y_KALITE_KTK,
              };
            });
  
            modelFilter.setData(arrQuality);
            oView.byId("searchFieldQuality").setModel(modelFilter);
          },
  
          getBilletList: function (oEvent) {
            var chosenQuality = this.getView()
              .byId("searchFieldQuality")
              .getValue();
  
            var werks = this.appData.plant;
            var workcenterid = this.appData.node.workcenterID;
            //var aufnr = this.appData.selected.order.orderNo;
            var params = {
              "Param.1": werks,
              "Param.2": workcenterid,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getBilletListForFurnaceQry",
              params
            );
            this.getView().byId("tblBilletMaster").setBusy(true);
  
            tRunner.ExecuteQueryAsync(this, this.callBilletList);
          },
  
          getBilletFurnaceCount: function () {
            var werks = this.appData.plant;
            var workcenterid = this.appData.node.workcenterID;
            var params = {
              "Param.1": werks,
              "Param.2": workcenterid,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getBilletCountInFurnaceQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callBilletCount);
          },
  
          callChargeQuan: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            var data = p_data.Rowsets?.Rowset[0].Row;
            oModel.setData(data);
            p_this.getView().setModel(oModel, "ChargeTypeQuan");
          },
  
          getChargeTypeQuan: function () {
            var werks = this.appData.plant;
            var workcenterid = this.appData.node.workcenterID;
            var params = {
              "Param.1": werks,
              "Param.2": workcenterid,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getChargeTypeQuanQry",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callChargeQuan);
          },
  
          callBilletCount: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            var data = p_data.Rowsets?.Rowset[0].Row;
            oModel.setData(data);
            p_this.getView().setModel(oModel, "BilletCount");
            //p_this.appData.BILLET_COUNT = data[0].BILLET_COUNT;
          },
  
          getCapFilter: function () {
            var aufnr = this.appData.selected.order.orderNo;
            var werks = this.appData.plant;
            var workcenterID = this.appData.node.workcenterID;
            var SIGNAL_POINT = "FRI";
            var params = {
              "Param.1": aufnr,
              "Param.3": werks,
              "Param.4": workcenterID,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Filmasin/getFilterCapQry",
              params
            );
            if (!tRunner.Execute()) return null;
            var oData = tRunner.GetJSONData();
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(oData[0]);
            this.getView().setModel(oModel, "capFilterModel");
          },
  
          getQualityFilter: function () {
            var aufnr = this.appData.selected.order.orderNo;
            var werks = this.appData.plant;
            var workcenterID = this.appData.node.workcenterID;
            var SIGNAL_POINT = "FRI";
            var params = {
              "Param.1": aufnr,
              "Param.3": werks,
              "Param.4": workcenterID,
            };
            var tRunner = new TransactionRunner(
              "MES/UI/Filmasin/getFilterQualityQry",
              params
            );
            if (!tRunner.Execute()) return null;
            var oData = tRunner.GetJSONData();
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(oData[0]);
            this.getView().setModel(oModel, "qualityFilterModel");
          },
  
          /* 22.09*/
          /* //expression binding ile çözüldü. //
                      getInsideFurnaceCount : function(){
                      let view = this.getView();
                      let data = view.getModel('confirmBilletList')?.getData();
                      let cnt = data?.length===undefined?0:data.length;
                      view.byId("idMainSum").setText(cnt);
                      },
                  */
          onConfirmDialog: function () {
            this.handleCancel();
          },
  
          handleCancel: function () {
            this.appData.oDialog.destroy();
            // this.getView().byId("chkIntervalState").setPressed(this.appData.intervalState);
            this.getView().byId("chkIntervalState").setPressed(true);
            this.appData.intervalState = true;
          },
  
          refreshData: function (oEvent) {
            this.getBilletList();
            this.getTableData();
          },
          callReturnedBilletDetail: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(p_data.Rowsets.Rowset[0]);
            p_this.getView().setModel(oModel, "returnedBilletModel");
          },
  
          openReturnedBilletList: function (oEvent) {
            let oView = this.getView();
            let oDialog = oView.byId("openReturnedBilletList");
            if (!oDialog) {
              oDialog = sap.ui.xmlfragment(
                oView.getId(),
                "customActivity.fragmentView.openReturnedBilletList",
                this
              );
              oView.addDependent(oDialog);
            }
            this.setTodayReturnedBillet(oEvent);
            let werks = this.appData.plant;
            let workcenterID = this.appData.node.workcenterID;
            var dateS = this.getView().byId("idDatePickerReturned").getValue();
            var pickerSecondDate = new Date(
              this.getView().byId("idDatePickerReturned").getSecondDateValue()
            );
            var tomorrowDay = new Date(pickerSecondDate);
            tomorrowDay.setDate(tomorrowDay.getDate() + 1);
            var secondaryDate =
              tomorrowDay.getDate() +
              "." +
              (tomorrowDay.getMonth() + 1) +
              "." +
              tomorrowDay.getFullYear();
            var dateValues = dateS.split(" - ");
            var params = {
              "Param.1": werks,
              "Param.2": workcenterID,
              "Param.3": dateValues[0],
              "Param.4": secondaryDate,
            };
  
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getReturnedBilletList",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callReturnedBilletDetail);
            this.appData.oDialog = oDialog;
            oDialog.open();
          },
  
          getReturnedBilletList: function () {
            var werks = this.appData.plant;
            var workcenterID = this.appData.node.workcenterID;
            var dateS = this.getView().byId("idDatePickerReturned").getValue();
            var pickerSecondDate = new Date(
              this.getView().byId("idDatePickerReturned").getSecondDateValue()
            );
            var tomorrowDay = new Date(pickerSecondDate);
            tomorrowDay.setDate(tomorrowDay.getDate() + 1);
            var secondaryDate =
              tomorrowDay.getDate() +
              "." +
              (tomorrowDay.getMonth() + 1) +
              "." +
              tomorrowDay.getFullYear();
            var dateValues = dateS.split(" - ");
            var params = {
              "Param.1": werks,
              "Param.2": workcenterID,
              "Param.3": dateValues[0],
              "Param.4": secondaryDate,
            };
  
            var tRunner = new TransactionRunner(
              "MES/UI/Haddehane/getReturnedBilletList",
              params
            );
            tRunner.ExecuteQueryAsync(this, this.callSearchReturnedBillet);
          },
  
          callSearchReturnedBillet: function (p_this, p_data) {
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(p_data.Rowsets.Rowset[0]);
            p_this.getView().setModel(oModel, "returnedBilletModel");
          },
  
          handleCancelBilletReturned: function () {
            this.getView().byId("openReturnedBilletList").destroy();
            this.getView().byId("chkIntervalState").setPressed(true);
            this.appData.intervalState = true;
          },
          callConfirmReject: function (p_this, p_data) {
            p_this.handleCancel();
            sap.m.MessageToast.show("Uygunsuzluk kaydedildi");
          },
  
          onChangeLocation: function (oEvent) {
            var plant = this.appData.plant;
            var oTable = this.getView().byId("tblBilletMaster");
            var tableModel = this.getView().getModel("confirmBilletList").oData;
            var tableModelLength = tableModel.length;
            var selectedKtkIdList = [];
            var oSelectedRowLength = oTable.getSelectedContexts().length;
            var signalPoint = "";
            for (i = 0; i < oSelectedRowLength; i++) {
              var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
              var selectedRow = selectedRowPath.split("/")[1];
              var Ktkid = tableModel[selectedRow].KTKID;
              selectedKtkIdList.push(Ktkid);
              signalPoint = tableModel[selectedRow].SIGNAL_POINT;
            }
            if (selectedRow == undefined) {
              sap.m.MessageBox.warning("Lütfen bir kütük seçiniz !");
              return;
            } else if (tableModel[selectedRow].BILLET_STATUS == "OTO_IADE") {
              sap.m.MessageBox.warning(
                "İade kütük için lokayon değiştirilemez..."
              );
              return;
            } else if (oSelectedRowLength > 1) {
              sap.m.MessageBox.warning(
                "Manuel işlem yapılırken 1 den fazla kütük seçilemez."
              );
              return;
            } else if (
              plant == 2001 &&
              tableModel[selectedRow].BILLET_SEQ != tableModelLength &&
              tableModel[selectedRow].BILLET_SEQ != 0
            ) {
              sap.m.MessageBox.warning(
                "Manuel işlem yapılırken ilk sıradaki kütük seçilmelidir."
              );
              return;
            } else if (
              plant == 3001 &&
              tableModel[selectedRow].BILLET_SEQ != 0 &&
              tableModel[selectedRow].BILLET_SEQ > 15 &&
              tableModelLength - tableModel[selectedRow].BILLET_SEQ > 15
            ) {
              sap.m.MessageBox.warning(
                "Manuel işlem yapılırken ilk 15 yada son 15 kütükten seçim yapılmalıdır."
              );
              return;
            } else {
              var wc_name = this.appData.name;
              var workcenterid = this.appData.node.workcenterID;
              var user = this.appData.user.userID;
              var params = {
                I_WORKCENTERID: workcenterid,
                KTKIDLIST_TRNS: selectedKtkIdList.toString(),
                I_WERKS: plant,
                I_USER: user,
                I_WCSWITCH: "",
                I_SEND_IZGARA: "",
              };
  
              let lv_actions = [
                this.appComponent.oBundle.getText("EVET"),
                this.appComponent.oBundle.getText("HAYIR"),
                this.appComponent.oBundle.getText("1.IZGARAYA GÖNDER"),
                this.appComponent.oBundle.getText("2.IZGARAYA GÖNDER"),
              ];
  
              if (signalPoint == "FIRIN ÇIKIŞI") {
                lv_actions = [
                  this.appComponent.oBundle.getText("1.YOLA GÖNDER"),
                  this.appComponent.oBundle.getText("2.YOLA GÖNDER"),
                  this.appComponent.oBundle.getText("HAYIR"),
                ];
              }
              if (wc_name == "YZC2HAD" && signalPoint == "FIRIN İÇİ") {
                lv_actions = [
                  this.appComponent.oBundle.getText("EVET"),
                  this.appComponent.oBundle.getText("HAYIR"),
                  this.appComponent.oBundle.getText("1.IZGARAYA GÖNDER"),
                ];
              }
  
              if (wc_name == "YZC2HAD" && signalPoint == "FIRIN ÇIKIŞI") {
                lv_actions = [
                  this.appComponent.oBundle.getText("1.YOLA GÖNDER"),
                  this.appComponent.oBundle.getText("HAYIR"),
                ];
              }
  
              sap.m.MessageBox.warning(
                this.appComponent.oBundle.getText("OEE_TEXT_CHANGE_LOC_QUESTION"),
                {
                  actions: lv_actions,
                  emphasizedAction: "2.YOLA GÖNDER",
                  onClose: function (oAction) {
                    if (oAction === null || oAction === "HAYIR") {
                      return false;
                    }
                    if (oAction !== "HAYIR") {
                      if (oAction !== "EVET") {
                        if (oAction !== "1.YOLA GÖNDER") {
                          if (oAction !== "1.IZGARAYA GÖNDER") {
                            params.I_WCSWITCH = "X";
                            params.I_SEND_IZGARA = "Z2";
                          } else if (oAction === "1.IZGARAYA GÖNDER") {
                            params.I_WCSWITCH = "X";
                            params.I_SEND_IZGARA = "Z1";
                          }
                        }
                      }
  
                      var tRunner = new TransactionRunner(
                        "MES/UI/Haddehane/Manual/updateBilletLocationXqry",
                        params
                      );
  
                      if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                      }
                      this.getBilletList();
                    } else {
                      return;
                    }
                  }.bind(this),
                }
              );
              this.getBilletList();
              this.getView().byId("chkIntervalState").setPressed(true);
              this.appData.intervalState = true;
            }
          },
  
          billetItemSelected: function (oEvent) {
            var stat =
              oEvent.getSource().getSelectedItems().length > 0 ? false : true;
            this.appData.intervalState = stat;
            this.getView().byId("chkIntervalState").setPressed(stat);
  
            //Seçilen satırlarda  FRI var ise Hata Bildir Disable olur
            var btnChangeLocation = this.getView().byId("btnChangeLocation");
            var selectedItemRow;
            var itemSignalPoint;
            var friRowCount = 0;
            var changeButton = this.getView().byId("btnChangeLocation");
            var rowCount = this.getView()
              .byId("tblBilletMaster")
              .getSelectedItems().length;
            if (rowCount == 0) {
              this.appData.intervalState = false;
              this.changeIntervalState(oEvent);
              btnChangeLocation.setEnabled(true);
            } else {
              this.appData.intervalState = true;
              this.changeIntervalState(oEvent);
            }
            if (rowCount > 0) {
              changeButton.setEnabled(true);
              for (var i = 0; i < rowCount; i++) {
                selectedItemRow = this.getView()
                  .byId("tblBilletMaster")
                  .getSelectedItems()
                  [i].oBindingContexts.confirmBilletList.sPath.substring(1);
  
                itemSignalPoint =
                  this.getView().getModel("confirmBilletList").oData[
                    selectedItemRow
                  ].SIGNAL_POINT;
                var plant = this.appData.plant;
                if (itemSignalPoint == "FIRIN İÇİ") friRowCount++;
              }
            }
            if (friRowCount > 0 && plant == 30111)
              this.getView().byId("btnRejected").setEnabled(false);
            else this.getView().byId("btnRejected").setEnabled(true);
            //Seçilen satırlarda  FRI var ise Hata Bildir Disable olur
          },

          onChangeLocationAdmin: function (oEvent) {
            var plant = this.appData.plant;
            var oTable = this.getView().byId("tblBilletMaster");
            var tableModel = this.getView().getModel("confirmBilletList").oData;
            var tableModelLength = tableModel.length;
            var selectedKtkIdList = [];
            var oSelectedRowLength = oTable.getSelectedContexts().length;
            var signalPoint = "";
            for (i = 0; i < oSelectedRowLength; i++) {
              var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
              var selectedRow = selectedRowPath.split("/")[1];
              var Ktkid = tableModel[selectedRow].KTKID;
              selectedKtkIdList.push(Ktkid);
              signalPoint = tableModel[selectedRow].SIGNAL_POINT;
            }
            if (selectedRow == undefined) {
              sap.m.MessageBox.warning("Lütfen bir kütük seçiniz !");
              return;
            } else if (tableModel[selectedRow].BILLET_STATUS == "OTO_IADE") {
              sap.m.MessageBox.warning(
                "İade kütük için lokayon değiştirilemez..."
              );
              return;
            } else if (oSelectedRowLength > 1) {
              sap.m.MessageBox.warning(
                "Manuel işlem yapılırken 1 den fazla kütük seçilemez."
              );
              return;
            } else {
              var wc_name = this.appData.name;
              var workcenterid = this.appData.node.workcenterID;
              var user = this.appData.user.userID;
              var params = {
                I_WORKCENTERID: workcenterid,
                KTKIDLIST_TRNS: selectedKtkIdList.toString(),
                I_WERKS: plant,
                I_USER: user,
                I_WCSWITCH: "",
                I_SEND_IZGARA: "",
              };
  
              let lv_actions = [
                this.appComponent.oBundle.getText("EVET"),
                this.appComponent.oBundle.getText("HAYIR"),
                this.appComponent.oBundle.getText("1.IZGARAYA GÖNDER"),
                this.appComponent.oBundle.getText("2.IZGARAYA GÖNDER"),
              ];
  
              if (signalPoint == "FIRIN ÇIKIŞI") {
                lv_actions = [
                  this.appComponent.oBundle.getText("1.YOLA GÖNDER"),
                  this.appComponent.oBundle.getText("2.YOLA GÖNDER"),
                  this.appComponent.oBundle.getText("HAYIR"),
                ];
              }
              if (wc_name == "YZC2HAD" && signalPoint == "FIRIN İÇİ") {
                lv_actions = [
                  this.appComponent.oBundle.getText("EVET"),
                  this.appComponent.oBundle.getText("HAYIR"),
                  this.appComponent.oBundle.getText("1.IZGARAYA GÖNDER"),
                ];
              }
  
              if (wc_name == "YZC2HAD" && signalPoint == "FIRIN ÇIKIŞI") {
                lv_actions = [
                  this.appComponent.oBundle.getText("1.YOLA GÖNDER"),
                  this.appComponent.oBundle.getText("HAYIR"),
                ];
              }
  
              sap.m.MessageBox.warning(
                this.appComponent.oBundle.getText("OEE_TEXT_CHANGE_LOC_QUESTION"),
                {
                  actions: lv_actions,
                  emphasizedAction: "2.YOLA GÖNDER",
                  onClose: function (oAction) {
                    if (oAction === null || oAction === "HAYIR") {
                      return false;
                    }
                    if (oAction !== "HAYIR") {
                      if (oAction !== "EVET") {
                        if (oAction !== "1.YOLA GÖNDER") {
                          if (oAction !== "1.IZGARAYA GÖNDER") {
                            params.I_WCSWITCH = "X";
                            params.I_SEND_IZGARA = "Z2";
                          } else if (oAction === "1.IZGARAYA GÖNDER") {
                            params.I_WCSWITCH = "X";
                            params.I_SEND_IZGARA = "Z1";
                          }
                        }
                      }
  
                      var tRunner = new TransactionRunner(
                        "MES/UI/Haddehane/Manual/updateBilletLocationXqry",
                        params
                      );
  
                      if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                      }
                      this.getBilletList();
                    } else {
                      return;
                    }
                  }.bind(this),
                }
              );
              this.getBilletList();
              this.getView().byId("chkIntervalState").setPressed(true);
              this.appData.intervalState = true;
            }
          },

  
          onChange: function (oEvent) {
            var aFilters = [];
            var sQuery = oEvent.getSource().getValue();
  
            var oFilter1 = new sap.ui.model.Filter(
              "Y_KALITE_KTK",
              sap.ui.model.FilterOperator.Contains,
              sQuery
            );
  
            var allFilter = new sap.ui.model.Filter([oFilter1], false);
  
            oTable = this.getView().byId("tblBilletMaster");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(allFilter);
  
            var a = oBinding.aLastContextData;
            var hot_count = 0;
            var cold_count = 0;
            for (i = 0; i < a.length; i++) {
              var row = JSON.parse(a[i]);
              if (row.CHARGE_TYPE == "SOĞUK" && row.SIGNAL_POINT == "FIRIN İÇİ") {
                cold_count = cold_count + 1;
              } else if (
                row.CHARGE_TYPE == "SICAK" &&
                row.SIGNAL_POINT == "FIRIN İÇİ"
              ) {
                hot_count = hot_count + 1;
              }
            }
  
            this.getView().byId("idHotCharge").setText(hot_count);
            this.getView().byId("idColdCharge").setText(cold_count);
  
            this.getView().byId("chkIntervalState").setPressed(false);
            this.appData.intervalState = false;
          },
  
          modelServices: function () {
            var self = this;
            this.intervalHandle = setInterval(function () {
              if (window.location.hash == "#/activity/ZACT_BILLET_FRNC") {
                if (self.appData.intervalState == true) {
                  self.getBilletList();
                  self.getAlert();
                  self.getBilletFurnaceCount();
                  self.getFirstBilletDetail();
                  self.getChargeTypeQuan();
                  self.getTableData();
                }
                //console.clear();
              }
            }, 10000);
          },

	getUserRoles: function () {
            var tRunner = new TransactionRunner("Default/T_userGet");
            if (!tRunner.Execute()) {
                MessageBox.error(tRunner.GetErrorMessage());
                return null;
            }
            var oData = tRunner.GetJSONData();
            for (let i = 0; i < oData[0]["Row"].length; i++) {
                const element = oData[0]["Row"][i];
                // if(this.getView().getControlsByFieldGroupId(element.Role).length>0){
                //     this.getView().getControlsByFieldGroupId(element.Role).setVisible(true)
                //     }

                this.getView()
                    .getControlsByFieldGroupId(element.Role)[0]
                    ?.setVisible(true);
            }
        },

        getTableData: function () {
            TransactionCaller.async(
              "MES/Integration/Label/DHH/getTotalBilletTrns",
              {
                I_WORKCENTER_ID:this.appData.node.workcenterID
              },
              "O_JSON",
              this.callGetTableData,
              this
            );
          },
          callGetTableData: function (iv_data, iv_scope) {
            if (iv_data[1] == "E") {
              MessageBox.error(iv_data[0]);
              return;
            }
          
            var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
              ? iv_data[0]?.Rowsets?.Rowset?.Row
              : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
            myArrr.forEach((element) => {
            });
           
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(myArrr);
    
            var oTable = iv_scope.getView().byId("idReportTable");
            oTable.setModel(oModel);
          },

          // 28.09
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
        }
      );
    }
  );
  