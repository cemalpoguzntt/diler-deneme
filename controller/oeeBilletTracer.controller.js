sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "customActivity/scripts/custom",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV",
    "customActivity/scripts/customStyle",
  ],

  function (
    Controller,
    JSONModel,
    MessageBox,
    MessageToast,
    customScripts,
    formatter,
    Filter,
    FilterOperator,
    FilterType,
    Export,
    ExportTypeCSV,
    customScript
  ) {
    //"use strict";
    var that;

    return Controller.extend("customActivity.controller.oeeBilletTracer", {
      /**
       * Called when a controller is instantiated and its View controls (if available) are already created.
       * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
       */

      formatter: formatter,

      onInit: function () {
        that = this;
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.appData.intervalState = true;
        this.interfaces = this.appComponent.getODataInterface();
        this.getNameFromWorkcenter();
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
        this.modelServices();
        //this.getCASTIDFilter();
        this.getOrderFilter();
        this.getSignalFilter();
        this.getYOLFilter();
        this.getRemaningPackageQuan();
        this.getBilletShiftQuan();
      },
      setTodayMain: function (oEvent) {
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
      getDateTime: function (oEvent) {
        var dateS = oEvent.getSource().getValue();
        var dateValues = dateS.split(" - ");
        console.log(dateValues[0]);
        console.log(dateValues[1]);
      },

      setDate: function () {
        this.getOrderFilter();

      },

      getNameFromWorkcenter: function () {
        var wc = this.appData.node.workcenterID;
        var params = {
          "Param.1": wc
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


      getRemaningPackageQuan: function () {
        var workcenterID = this.appData.node.workcenterID;
        var plant = this.appData.plant;
        var aufnr = this.appData.selected.order.orderNo;
        var params = {
          I_WORKCENTER: workcenterID,
          I_PLANT: plant
        };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getReaminingPackageQuanXqry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callRemaningPackage);
      },

      callRemaningPackage: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        var ReturnData = p_data.Rowsets.Rowset[0].Row;
        oModel.setData(ReturnData);
        p_this.getView().setModel(oModel, "remaningPackageQuan");
        if (ReturnData == undefined) { return; }
        else if (ReturnData[0].REMAINING_1 == 5 || ReturnData[0].REMAINING_1 == 15 || ReturnData[0].REMAINING_1 == 25) {
          p_this.getView().byId("labelBilletK").setText("YOL 1 Sipariş Değişimi için son  " + ReturnData[0].REMAINING_1 + "  paket kaldı.");
        } else if (ReturnData[0].REMAINING_2 == 5 || ReturnData[0].REMAINING_2 == 15 || ReturnData[0].REMAINING_2 == 25) {
          p_this.getView().byId("labelBilletK").setText("YOL 2 Sipariş Değişimi için son  " + ReturnData[0].REMAINING_2 + "  paket kaldı.");
        }
        else {
          p_this.getView().byId("labelBilletK").setText("");
        }
      },
      getBilletShiftQuan: function () {
        var workcenterID = this.appData.node.workcenterID;
        var plant = this.appData.plant;
        var aufnr = this.appData.selected.order.orderNo;
        var dateS = this.getView().byId("idDatePicker").getValue();
        var pickerSecondDate = new Date(
          this.getView().byId("idDatePicker").getSecondDateValue()
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
          I_WORKCENTER: workcenterID,
          I_PLANT: plant,
          I_FIRSTDATE: dateValues[0],
          I_SECONDDATE: secondaryDate
        };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getBilletShiftQuanXqry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData[0].Row[0]);
        this.getView().setModel(oModel, "billetShiftQuan");
      },

      onOpenReturnDialog: function (oEvent) {
        var selectedBilletLength = this.byId(
          "tblBilletMaster"
        ).getSelectedItems().length;
        var noBilletSelected = this.appComponent.oBundle.getText(
          "OEE_LABEL_ERROR_NO_BILLET_SELECTED"
        );
        if (selectedBilletLength <= 0) {
          MessageBox.error(noBilletSelected);
          return;
        }
        var oView = this.getView();
        var oDialog = oView.byId("returnNotifs");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.returnNotifs",
            this
          );
          oView.addDependent(oDialog);
        }
        this.appData.oDialog = oDialog;
        oDialog.open();
        this.getBilletReturnType();
      },

      getBilletReturnType: function (oEvent) {
        var plant = this.appData.plant;
        var wc = this.appData.node.workcenterID;
        var params = { "Param.1": plant, "Param.2": wc };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getTypeOfRejectQry", params
        );
        tRunner.ExecuteQueryAsync(this, this.callReturnType);
      },
      callReturnType: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "returnNotifTypes");
      },

      onSelectReturnType: function (oEvent) {
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
        tRunner.ExecuteQueryAsync(this, this.callReturnReason);
        selectRejectType.setValueState("Success");
      },

      callReturnReason: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "returnNotifReasons");
      },

      onSelectReturnReason: function (oEvent) {
        var plant = this.appData.plant;
        var selectRejectReason = this.getView().byId("selectReason");
        var RejectType = selectRejectReason.getSelectedKey();
        var params = { "Param.1": RejectType, "Param.2": plant };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getDetailOfReasonQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callReturnDetail);
        selectRejectReason.setValueState("Success");
      },

      callReturnDetail: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "returnNotifDetails");
      },

      onSelectReturnDetail: function (oEvent) {
        var selectRejectDetail = this.getView().byId("selectDetail");
        selectRejectDetail.setValueState("Success");
      },



      onConfirmBilletReturn: function (oEvent) {
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
          sap.m.MessageToast.show("İade türü seçmelisiniz!");
          return null;
        }
        if (reason == "") {
          typeSelect.setValueState("Success");
          reasonSelect.setValueState("Error");
          sap.m.MessageToast.show("İade nedeni seçmelisiniz!");
          return null;
        }
        var detailCount = this.getView().getModel("returnNotifDetails")
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
            "Bu iade nedeni için detay seçmelisiniz!"
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
        tRunner.ExecuteQueryAsync(this, this.callConfirmReturn);
      },
      /*25.09.2020*/

      callConfirmReturn: function (p_this, p_data) {
        // p_this.handleCancel();
        sap.m.MessageToast.show("Kütük iade alındı");
        p_this.onInit();
      },



      onOpenRejectDialog: function (oEvent) {
        var selectedBilletLength = this.byId(
          "tblBilletMaster"
        ).getSelectedItems().length;
        var noBilletSelected = this.appComponent.oBundle.getText(
          "OEE_LABEL_ERROR_NO_BILLET_SELECTED"
        );
        if (selectedBilletLength <= 0) {
          MessageBox.error(noBilletSelected);
          return;
        }

        if (!!this.getView().byId("selectType"))
          this.getView().byId("selectType").destroy();
        if (!!this.getView().byId("selectReason"))
          this.getView().byId("selectReason").destroy();
        if (!!this.getView().byId("description"))
          this.getView().byId("description").destroy();

        var oView = this.getView();
        var oDialog = oView.byId("rejectedNotifsBilletMonitor");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.rejectedNotifsBilletMonitor",
            this
          );
          oView.addDependent(oDialog);
        }
        this.appData.oDialog = oDialog;
        oDialog.open();
        this.getBilletDetail();
        this.getBilletRejectType();
      },

      onOpenBilletRejectDialog: function (oEvent) {
        var oView = this.getView();
        var oDialog = oView.byId("openBilletRejectDetail");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.openBilletRejectDetail",
            this
          );
          oView.addDependent(oDialog);
        }
        var selectedRow = oEvent
          .getSource()
          .oPropagatedProperties.oBindingContexts.confirmBilletList.sPath.split(
            "/"
          )[1];
        var oData = this.getView().getModel("confirmBilletList").oData[
          selectedRow
        ];
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData);
        this.getView().setModel(oModel, "rejectDetailModel");
        this.appData.oDialog = oDialog;
        oDialog.open();
      },

      onTransferToHB: function (oEvent) {
       this._onTransferTo(oEvent,"HB")
      },
      onTransferToHB: function (oEvent) {
       this._onTransferTo(oEvent,"MESH")
      },
      _onTransferTo: function (oEvent, destination) {
        var oView = this.getView();
        var selectedRow = oEvent
          .getSource()
          .oPropagatedProperties.oBindingContexts.confirmBilletList.sPath.split(
            "/"
          )[1];
        var oData = this.getView().getModel("confirmBilletList").oData[
          selectedRow
        ];
      },

      onSearch: function (oEvent) {
        var castParameter = this.getView().byId("searchFieldCASTID").getValue();
        var orderParameter = this.getView().byId("searchFieldOrder").getValue();
        var filterParameter = this.getView()
          .byId("searchFieldSignalPoint")
          .getSelectedKey();
        var dateS = this.getView().byId("idDatePicker").getValue();
        var dateValues = dateS.split(" - ");
        //dateValues[0]+="T00:00:00";
        //dateValues[1]+="T00:00:00";
        if (!castParameter && !orderParameter) this.getBilletList();
        var aFilters = [];
        aFilters = [
          new Filter(
            [
              //  new Filter("FURNACE_EXIT_TIME", FilterOperator.BT, (dateValues[0]+"T00:00:00"),(dateValues[1]+"T00:00:00")),
              new Filter("AUFNR", FilterOperator.Contains, orderParameter),
              new Filter("KTKID", FilterOperator.Contains, castParameter),
            ],
            true
          ),
        ];

        // update list binding
        var oList = this.byId("tblBilletMaster");
        var oBinding = oList.getBinding("items");
        var oModel = this.getView().getModel("confirmBilletList");
        var oData = oModel.oData;
        if (oData) oData.filter(aFilters, FilterType.Applications);
        oModel.setData(oData);
      },

      callBilletDetail: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "rejectionModel");
      },

      getBilletDetail2: function (oEvent) {
        var plant = this.appData.plant;
        var tableModel = this.getView().getModel("confirmBilletList").oData;
        var oTable = this.getView().byId("tblBilletMaster");
        var selectedRows = oTable.getSelectedContexts()[0].sPath;
        var selectedRow = selectedRows.split("/")[1];
        var Ktkid = tableModel[selectedRow].KTKID;
        this.getView().byId("rejectedKtkid").setSelectedKey(Ktkid);
        var params = { "Param.1": Ktkid };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getKTKIDForRejectQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callBilletDetail);
      },

      getScrapBilletList: function (oEvent) {

        var aFilters = [];
        //  var sQuery = oEvent.getSource().getValue();

        var oFilter1 = new sap.ui.model.Filter(
          "REASON_TYPE",
          sap.ui.model.FilterOperator.Contains,
          "HURDA"
        );

        var allFilter = new sap.ui.model.Filter([oFilter1], false);

        oTable = this.getView().byId("tblBilletMaster");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(allFilter);
        this.appData.intervalState == true;
        this.changeIntervalState();
      },

      getManualBilletList: function (oEvent) {

        var aFilters = [];
        //  var sQuery = oEvent.getSource().getValue();

        var oFilter1 = new sap.ui.model.Filter(
          "MANUAL",
          sap.ui.model.FilterOperator.Contains,
          "X"
        );

        var allFilter = new sap.ui.model.Filter([oFilter1], false);

        oTable = this.getView().byId("tblBilletMaster");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(allFilter);
        this.appData.intervalState == true;
        this.changeIntervalState();
      },

      callBilletList: function (p_this, p_data) {
        var tableData = p_data;
        /* // database'den geldiği için yoruma alındı. 09.10.2020 //
                          var tableCharacteristic = p_data.Rowsets.Rowset[0];
                          var rows = p_data.Rowsets.Rowset[0].Row;
                          var characteristic = [];
                          var tableData = [];
                          var boolean;
                      if(!rows)
                          return null;
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
                              }
                            }
                  */
        if (tableData.Rowsets != undefined) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(2000);
          oModel.setData(tableData.Rowsets?.Rowset[0]?.Row);
          p_this.getView().setModel(oModel, "confirmBilletList");
          // p_this.bindRawMaterialsToTable(p_data.Rowsets.Rowset[0]);
          //p_this.onSearch();
          p_this._setFilterCastID(tableData.Rowsets.Rowset[0]?.Row);
        }
      },


      getBilletList: function (oEvent) {
        var wc_name = this.appData.name;
        var werks = this.appData.plant;
        var aufnr = this.appData.selected.order.orderNo;
        var workcenterid = this.appData.node.workcenterID;
        if (wc_name == "YZC2HAD") {
          var yolParameter = wc_name;
          this.appData.name = yolParameter;
        } else if (this.getView().byId("searchFieldYOL").getValue() == "") {
          var yolParameter = "HHYOL";
        } else {
          var yolParameter = this.getView().byId("searchFieldYOL").getValue();
        }
        var dateS = this.getView().byId("idDatePicker").getValue();
        var castParameter = this.getView().byId("searchFieldCASTID").getValue();
        var orderParameter = this.getView().byId("searchFieldOrder").getValue();
        var filterParameter = this.getView()
          .byId("searchFieldSignalPoint")
          .getSelectedKey();
        var pickerSecondDate = new Date(
          this.getView().byId("idDatePicker").getSecondDateValue()
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
        if (!orderParameter) orderParameter = "";
        if (!castParameter) castParameter = "";
        var params = {
          "Param.1": aufnr,
          "Param.2": dateValues[0],
          "Param.3": secondaryDate,
          "Param.4": orderParameter,
          "Param.5": castParameter,
          "Param.6": werks,
          "Param.7": workcenterid,
          "Param.8": filterParameter,
          "Param.9": yolParameter
        };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getBilletTrackingListQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callBilletList);
        this.getBilletShiftQuan();
      },

      onConfirmDialog: function () {
        this.handleCancel();
      },

      _setFilterCastID: function (dataset) {
        var oView = this.getView();
        var modelFilter = new sap.ui.model.json.JSONModel();
        var arrQuality = Array.from(
          new Set(dataset.map((s) => s.CASTID))
        ).map((CASTID) => {
          return {
            CASTID: CASTID,
          };
        });
        modelFilter.setData(arrQuality);
        this.getView().setModel(modelFilter, "castFilterModel");
      },
      getCASTIDFilter: function () {
        var params = { "Param.1": this.appData.plant };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getFilterCastIdMonitorQry",
          params
        );
        if (!tRunner.Execute()) return null;
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData[0]);
        this.getView().setModel(oModel, "castFilterModel");
      },
      getYOLFilter: function () {
        var params = { "Param.1": this.appData.plant };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getFilterYolMonitorQry",
          params
        );
        if (!tRunner.Execute()) return null;
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData[0]);
        this.getView().setModel(oModel, "yolFilterModel");
      },
      getOrderFilter: function () {
        var dateS = this.getView().byId("idDatePicker").getValue();
        var pickerSecondDate = new Date(
          this.getView().byId("idDatePicker").getSecondDateValue()
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
          "Param.1": this.appData.plant,
          "Param.2": dateValues[0],
          "Param.3": secondaryDate
        };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getFilterOrderMonitorQry",
          params
        );
        if (!tRunner.Execute()) return null;
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData[0]);
        this.getView().setModel(oModel, "orderFilterModel");
      },
      getSignalFilter: function () {
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getSignalPointTracerQry"
        );
        if (!tRunner.Execute()) return null;
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData[0]);
        this.getView().setModel(oModel, "signalPointFilterModel");
      },

      handleCancel: function () {
        this.appData.oDialog.destroy();
        this.appData.intervalState = false;
        this.changeIntervalState();
      },
      handleCancelBilletReject: function () {
        this.getView().byId("openBilletRejectDetails").destroy();
      },
      handleCancelBilletReturned: function () {
        this.getView().byId("openReturnedBilletListHH").destroy();
      },
      //25.09 K.T
      createColumnConfig: function () {
        return [
          {
            name: "VRD",
            template: {
              content: "{SHIFT}",
            },
          },
          {
            name: "Yol",
            template: {
              content: "{NAME}",
            },
          },
          {
            name: "F. Giris Zaman",
            template: {
              content: "{FURNACE_ENTRY_TIME}",
            },
          },
          {
            name: "F. Cikis Zaman",
            template: {
              content: "{FURNACE_EXIT_TIME}",
            },
          },
          {
            name: "Sip. No",
            template: {
              content: "{AUFNR}",
            },
          },
          {
            name: "DNO",
            template: {
              content: "{CASTID}",
            },
          },
          {
            name: "KTKID",
            template: {
              content: "{KTKID}",
            },
          },
          {
            name: "Durum",
            template: {
              content: "{PRODUCT_STATUS}",
            },
          },
          {
            name: "K. Kalite",
            template: {
              content: "{Y_KALITE_KTK}",
            },
          },
          {
            name: "Ebat",
            template: {
              content: "{Y_EBAT}",
            },
          },
          {
            name: "Boy",
            template: {
              content: "{Y_BOY_KTK}",
            },
          },
          {
            name: "Cap",
            template: {
              content: "{Y_CAP_CBK_MM}",
            },
          },
          {
            name: "M. Kalite",
            template: {
              content: "{Y_KALITE_CBK}",
            },
          },
          {
            name: "ND",
            template: {
              content: "{Y_NERVUR_DUZ}",
            },
          },
          {
            name: "Mensei",
            template: {
              content: "{Y_KUTUK_MENSEI}",
            },
          },
          {
            name: "G.Tartim",
            template: {
              content: "{ENTRY_WEIGHT}",
            },
          },
          {
            name: "T. Tartim",
            template: {
              content: "{THEORETICAL_QUANTITY}",
            },
          },
          {
            name: "HB",
            template: {
              content: "{HB}",
            },
          },
          {
            name: "UB+UK",
            template: {
              content: "{UBUK}",
            },
          },
          {
            name: "Kisa P.",
            template: {
              content: "{SHORT_PIECE}",
            },
          },
          {
            name: "Mamul A.",
            template: {
              content: "{REMAIN_QUAN}",
            },
          },
          {
            name: "Tufal",
            template: {
              content: "{TUFAL}",
            },
          },
          {
            name: "Ilk Boy.",
            template: {
              content: "{ILKBOY}",
            },
          },
          {
            name: "Son Boy",
            template: {
              content: "{SONBOY}",
            },
          },
          {
            name: "Normal Boy",
            template: {
              content: "{NORMALBOY}",
            },
          },
          {
            name: "KisaParca Ayırma",
            template: {
              content: "{KISAPARCA_AYIRMA}",
            },
          },
          {
            name: "Tur",
            template: {
              content: "{REASON_TYPE}",
            },
          },
          {
            name: "Neden",
            template: {
              content: "{REASON}",
            },
          },
          {
            name: "Neden Kodu",
            template: {
              content: "{REASONCODE}",
            },
          },
          {
            name: "Aciklama",
            template: {
              content: "{DESCRIPTION}",
            },
          },
        ];
      },

      onDataExport: function (oEvent) {
        var aCols, oExcData, oSettings, oSheet;
        aCols = this.createColumnConfig();
        oExcData = this.getView()
          .getModel("confirmBilletList")
          .getProperty("/");
        var oExport = new sap.ui.core.util.Export({
          exportType: new sap.ui.core.util.ExportTypeCSV({
            separatorChar: "\t",
            mimeType: "application/vnd.ms-excel",
            charset: "utf-8",
            fileExtension: "xls",
          }),
          models: oExcData,
          rows: {
            path: "/",
          },
          columns: aCols,
        });
        oExport.setModel(this.getView().getModel("confirmBilletList"));

        oExport.saveFile("Kutuk_Takip_Data").always(function () {
          //    this.destroy();
        });
      },

      //25.09 K.T
      changeIntervalState: function (oEvent) {
        oButton = this.getView().byId("chkIntervalState");
        if (this.appData.intervalState == true) {
          this.appData.intervalState = false;
          oButton.setType("Reject");
        } else {
          this.appData.intervalState = true;
          this.getView().byId("chkIntervalState").setType("Accept");
        }
      },
      ////////HATA BILDIR
      getBilletDetail: function (param) {
        var plant = this.appData.plant;
        var tableModel = this.getView().getModel("confirmBilletList").oData;
        var oTable = this.getView().byId("tblBilletMaster");
        var selectedRows = oTable.getSelectedContexts()[0].sPath;
        var selectedRow = selectedRows.split("/")[1];
        var Ktkid = tableModel[selectedRow].KTKID;
        /*  this.getView().byId("rejectedKtkid").setSelectedKey(Ktkid); */
        var params = { "Param.1": Ktkid };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getKTKIDForRejectQry",
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
        var params = {
          "Param.1": plant
        };
        var tRunner = new TransactionRunner(
          "MES/Integration/OPC/BilletReject/getRejectTypesBilletMonitorQry", params
        );
        tRunner.ExecuteQueryAsync(this, this.callRejectType);
      },

      callRejectReason: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "rejectedNotifReasons");
      },

      onSelectRejectType: function (oEvent) {
        var params = {
          "Param.1": oEvent.getSource().getSelectedKey(),
          "Param.2": this.appData.plant,
        };
        var tRunner = new TransactionRunner(
          "MES/Integration/OPC/BilletReject/getRejectReasonBilletMonitorQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callRejectReason);
      },
      callRejectReasonSec: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "rejectedNotifReasonSec");
      },

      onSelectRejectReason: function (oEvent) {
        var params = { "Param.1": oEvent.getSource().getSelectedKey() };
        var tRunner = new TransactionRunner(
          "MES/Integration/OPC/BilletReject/getRejectReasonBlletMonitorSecQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callRejectReasonSec);
      },


      callConfirmReject: function (p_this, p_data) {
        p_this.handleCancel();
        sap.m.MessageToast.show("Uygunsuzluk kaydedildi");
        p_this.refreshData();
      },


      onConfirmBilletReject: function (oEvent) {
        sap.m.MessageBox.warning(
          this.appComponent.oBundle.getText("Değişiklikleri kaydetmek istediğinize emin misiniz?"),
          {
            actions: [
              this.appComponent.oBundle.getText("EVET"),
              this.appComponent.oBundle.getText("HAYIR"),

            ],
            onClose: function (oAction) {
              if (oAction == "EVET") {
                this.confirmBilletReject();
              } else {
                return;
              }
            }.bind(this),
          }
        );
      },

      confirmBilletReject: function (oEvent) {
        var reason;
        var oTable = this.getView().byId("tblBilletMaster");
        var tableModel = this.getView().getModel("confirmBilletList").oData;
        var reasonType = this.getView().byId("selectType").getSelectedKey();
        var oReasonFirst = this.getView().byId("selectReason");
        var reasonFirst;
        var reasonFirstKey;
        var reasonKey;
        if (reasonType == "") {
          sap.m.MessageToast.show("Tür seçmeden kayıt edemezsiniz.");
          return null;
        }

        if (oReasonFirst.getSelectedItem()) {
          reasonFirst = oReasonFirst.getSelectedItem().getText();
          reasonFirstKey = oReasonFirst.getSelectedKey();
        }
        var oReasonFirstData = this.getView().getModel("rejectedNotifReasons")
          .oData;
        if (oReasonFirstData.Row != undefined && reasonFirst == undefined) {
          sap.m.MessageToast.show("Bu tür için neden seçmelisiniz");
          return null;
        }
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
        var user = this.appData.user.userID;
        var desc = this.byId("description").mProperties.value;
        var params = {
          I_WORKCENTERID: workcenterid,
          I_REASON_TYPE: reasonType,
          I_REASON: reasonFirst,
          I_REASONKEY: reasonFirstKey,
          I_DESCRIPTION: desc,
          ElementList_TRNS: selectedKtkIdList.toString(),
          I_USER: user,
        };
        var tRunner = new TransactionRunner(
          "MES/Integration/OPC/BilletReject/insertBilletMonitorRejectReasonXqry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callConfirmReject);
      },
      ////////HATA BILDIR

      callReturnedBilletDetail: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(p_data.Rowsets.Rowset[0]);
        p_this.getView().setModel(oModel, "returnedBilletModel");
      },

      openReturnedBilletList: function (oEvent) {
        var oView = this.getView();
        var oDialog = oView.byId("openReturnedBilletListHH");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.openReturnedBilletListHH",
            this
          );
          oView.addDependent(oDialog);
        }
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
        oDialog.open();
        this.getReturnedBilletList();
        this.appData.oDialog = oDialog;
      },
      getReturnedBilletList: function () {
        var werks = this.appData.plant;
        var workcenterid = this.appData.node.workcenterID;
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
          "Param.2": workcenterid,
          "Param.3": dateValues[0],
          "Param.4": secondaryDate,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/Haddehane/getReturnedBilletList",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callReturnedBilletDetail);
      },


      refreshData: function (oEvent) {
        this.getBilletList();
      },

      onChangeLocation: function (oEvent) {
        var oTable = this.getView().byId("tblBilletMaster");
        var tableModel = this.getView().getModel("confirmBilletList").oData;
        var selectedKtkIdList = [];
        var oSelectedRowLength = oTable.getSelectedContexts().length;
        for (i = 0; i < oSelectedRowLength; i++) {
          var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
          var selectedRow = selectedRowPath.split("/")[1];
          var Aufnr = tableModel[selectedRow].AUFNR;
          var Ktkid = tableModel[selectedRow].KTKID;
          selectedKtkIdList.push(Ktkid);
        }
        if (selectedRow == undefined) {
          sap.m.MessageBox.warning("Lütfen bir kütük seçiniz !");
          return;
        }
        var plant = this.appData.plant;
        var workcenterid = this.appData.node.workcenterID;
        var user = this.appData.user.userID;
        var params = {
          I_WORKCENTERID: workcenterid,
          KTKIDLIST_TRNS: selectedKtkIdList.toString(),
          I_WERKS: plant,
          I_USER: user,
          I_WCSWITCH: "",
        };

        if (this.appData.name == "YZC2HAD") {
          sap.m.MessageBox.warning(
            this.appComponent.oBundle.getText("OEE_TEXT_CHANGE_LOC_QUESTION"),
            {
              actions: [
                this.appComponent.oBundle.getText("EVET"),
                this.appComponent.oBundle.getText("HAYIR"),
                this.appComponent.oBundle.getText("SİPARİŞ GÜNCELLE")
              ],
              onClose: function (oAction) {
                if (oAction === null || oAction === "HAYIR") {
                  return false;
                }
                if (oAction !== "HAYIR") {
                  if (oAction !== "EVET") {
                    if (oAction !== "SİPARİŞ GÜNCELLE") {
                      params.I_WCSWITCH = "X"
                      this.getBilletList();
                    } else if (oAction === "SİPARİŞ GÜNCELLE") {
                      params.I_WCSWITCH = "S"
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
                } else {
                  return;
                }
              }.bind(this),
            }
          );
        } else {
          sap.m.MessageBox.warning(
            this.appComponent.oBundle.getText("OEE_TEXT_CHANGE_LOC_QUESTION"),
            {
              actions: [
                this.appComponent.oBundle.getText("EVET"),
                this.appComponent.oBundle.getText("HAYIR"),
                this.appComponent.oBundle.getText("YOL DEĞİŞTİR"),
                this.appComponent.oBundle.getText("SİPARİŞ GÜNCELLE"),
              ],
              onClose: function (oAction) {
                if (oAction === null || oAction === "HAYIR") {
                  return false;
                }
                if (oAction !== "HAYIR") {
                  if (oAction !== "EVET") {
                    if (oAction !== "SİPARİŞ GÜNCELLE") {
                      params.I_WCSWITCH = "X"
                      this.getBilletList();
                    } else if (oAction === "SİPARİŞ GÜNCELLE") {
                      params.I_WCSWITCH = "S"
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
                } else {
                  return;
                }
              }.bind(this),
            }
          );
        }
        //this.onInit();            
        this.changeIntervalState();
      },
      onTableSelectionChange: function (oEvent) {
        //Seçilen satırlarda  FRI var ise Hata Bildir Disable olur
        var selectedItemRow;
        var itemSignalPoint;
        var friRowCount = 0;
        var changeButton = this.getView().byId("btnChangeLocation");
        var rowCount = this.getView().byId("tblBilletMaster").getSelectedItems()
          .length;
        if (rowCount == 0) {
          this.appData.intervalState = false;
          this.changeIntervalState();
          changeButton.setEnabled(true);
        } else {
          this.appData.intervalState = true;
          this.changeIntervalState();
          changeButton.setEnabled(true);
        }
        if (rowCount > 0) {
          for (var i = 0; i < rowCount; i++) {
            selectedItemRow = this.getView()
              .byId("tblBilletMaster")
              .getSelectedItems()
            [i].oBindingContexts.confirmBilletList.sPath.substring(1);
            itemSignalPoint = this.getView().getModel("confirmBilletList")
              .oData[selectedItemRow].SIGNAL_POINT;
            if (itemSignalPoint == "FRI") friRowCount++;
          }
        }
        if (friRowCount > 0) this.getView().byId("btnReject").setEnabled(false);
        else this.getView().byId("btnReject").setEnabled(true);
        //Seçilen satırlarda  FRI var ise Hata Bildir Disable olur
      },

      modelServices: function () {
        var self = this;
        this.intervalHandle = setInterval(function () {
          if (window.location.hash == "#/activity/ZACT_BILLET_TRACER") {
            if (self.appData.intervalState == true) {
              self.getBilletList();
              self.getRemaningPackageQuan();
              self.getBilletShiftQuan();
            }
          }
          console.log("ktk takip sayfa yenileme");
        }, 30000);
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
