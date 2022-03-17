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
    "use strict";

    var intVal;

    Array.prototype.localArrFilter = function (e) {
      var found = false;
      for (var i = 0; i < this.length; i++) {
        if (this[i].VALUE == e) {
          found = true;
          break;
        }
      }
      //console.log(this);
      return found;
    };

    return Controller.extend("customActivity.controller.oeeCreateCast", {
      /**
       * Called when a controller is instantiated and its View controls (if available) are already created.
       * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
       */

      formatter: formatter,

      onInit: function () {
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.interfaces = this.appComponent.getODataInterface();

        this.clearInt();

        this.getAllCharacteristic();
        this.getVisibleStatusCharacteristic();
        this.getSearchFieldWorkorder();
        this.onSearch();
        this.getOrderDetails();

       //değerlerin kaybedilmesinden dolayı ekran yenileme yoruma alınmıştır.
        intVal = setInterval(this.refreshData.bind(this), 5000);


        //this.modelServices();
      },

      getVisibleStatusCharacteristic: function () {
        var werks = this.appData.plant;
        var workcenterID = this.appData.node.workcenterID;
        var params = { "Param.1": werks, "Param.2": workcenterID };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getVisibleStatusCharacteristicQry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData[0]);
        this.getView().setModel(oModel, "visibleStatusModel");
      },

      refreshData: function () {
        this.onSearch();
      },

      clearInt: function () {
        if (!intVal) return;
        clearInterval(intVal);
        intVal = null;
      },

      getSearchFieldWorkorder: function () {
        var werks = this.appData.plant;
        var workcenterID = this.appData.node.workcenterID;
        var params = { "Param.1": werks, "Param.2": workcenterID };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getAufnrListFilterXquery",
          // "MES/CreateCast/getCreateCastListFilterXquery",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData[0]);
        this.getView().setModel(oModel, "ProdOrder");
      },
      callOrderDetails: function (p_this, p_data) {
        var ordersTable = p_this.getView().byId("idOrdersTable");
        var selectedItem = ordersTable.getSelectedItem();
        var oModel = new sap.ui.model.json.JSONModel();
        var allChar = p_this.appData.allCharacteristic;
        var tableCharacteristic = allChar;

        var tableData = [];
        var rows = p_data.Rowsets.Rowset[0].Row;
        var boolean;

        oModel.setData(rows);
        p_this.byId("idOrdersTable").setModel(oModel);
        p_this.appData.ordersTableModel = oModel.oData;
        var sumQuantity = 0;
        for (var i = 0; i < oModel.oData.length; i++) {
          sumQuantity = Number(sumQuantity) + oModel.oData[i].QUANTITY;
        }
        p_this.getView().byId("sumQuantity").setText(sumQuantity);

        if (!!p_this.byId("orderNoList")) {
          p_this.byId("orderNoList").setModel(oModel);
        }
        ordersTable.setSelectedItem(selectedItem);
      },

      getOrderDetails: function (oEvent) {
        var input = "";
        if (oEvent != undefined) input = oEvent.getSource().getValue();

        var date = this.appData.shift.startDate;
        var plant = this.appData.plant;
        var arbid = this.appData.node.workcenterID;
        var params = {
          "Param.1": plant,
          "Param.2": arbid,
          "Param.3": input,
          "Param.4": date,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getOrderDetailsXqry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callOrderDetails);
      },

      getAllCharacteristic: function () {
        var plant = this.appData.plant;
        var arbid = this.appData.node.workcenterID;
        var params = { "Param.1": plant, "Param.2": arbid };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getAllCharacteristicQry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();
        this.appData.allCharacteristic = oData[0];
      },

      onSuggest: function (oEvent) {
        var value = oEvent.getParameter("suggestValue");
        var filters = [];
        if (value) {
          filters = [
            new sap.ui.model.Filter(
              [
                new sap.ui.model.Filter("AUFNR", function (sText) {
                  return (
                    (sText || "").toUpperCase().indexOf(value.toUpperCase()) >
                    -1
                  );
                }),
              ],
              false
            ),
          ];
        }
        var osF = oEvent.oSource;
        osF.getBinding("suggestionItems").filter(filters);
        osF.suggest();
        this.onSearch();
      },

      onPressCraeteCasting: function () {
        sap.m.MessageBox.warning(
          this.appComponent.oBundle.getText("OEE_LABEL_SURE_FOR_CREATE_CAST"),
          {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: function (oAction) {
              if (oAction == "YES") {
                var logsTable = this.getView().byId("idOrdersTable");
                var modelTable = logsTable.getModel();
                var modelData = modelTable.getData();
                var selectedItems = logsTable.getSelectedContexts();

                if (selectedItems.length == 0) {
                  sap.m.MessageToast.show("Lütfen seçim yapınız!");
                  return;
                }
                this.callCreateCast();
              } else {
                return;
              }
            }.bind(this),
          }
        );
      },

      callCreateCast: function () {
        var logsTable = this.getView().byId("idOrdersTable");
        var modelTable = logsTable.getModel();
        var modelData = modelTable.getData();
        var selectedItems = logsTable.getSelectedContexts();

        var selectedRow = selectedItems[0].sPath.split("/")[1];
        var workorder = modelData[selectedRow].AUFNR;
        var userID = this.appData.user.userID;
        var client = this.appData.client;
        var werks = this.appData.plant;
        var workcenterID = this.appData.node.workcenterID;

        var params = {
          "Param.1": werks,
          "Param.2": workorder,
        };

        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/controleNewCastXquery",
          params
        );

        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();

        if (oData[0].Row[0].item == "true") this.errorMessage();
        else this.insertCast();
      },

      errorMessage: function () {
        sap.m.MessageBox.warning(
          this.appComponent.oBundle.getText("OEE_LABEL_COUNT_ERROR"),
          {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: function (oAction) {
              if (oAction == "YES") {
                this.insertCast();
              } else {
                return;
              }
            }.bind(this),
          }
        );
      },

      insertCast: function () {
        var logsTable = this.getView().byId("idOrdersTable");
        var modelTable = logsTable.getModel();
        var modelData = modelTable.getData();
        var selectedItems = logsTable.getSelectedContexts();

        var selectedRow = selectedItems[0].sPath.split("/")[1];
        var workorder = modelData[selectedRow].AUFNR;
        var userID = this.appData.user.userID;
        var client = this.appData.client;
        var werks = this.appData.plant;
        var matnr = modelData[selectedRow].MATNR;
        var workcenterID = this.appData.node.workcenterID;
        var params = {
          "Param.1": workorder,
          "Param.2": userID,
          "Param.3": client,
          "Param.4": werks,
          "Param.5": workcenterID,
          "Param.6": matnr,
        };

        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/insertCastIDXquery",
          params
        );

        tRunner.ExecuteQueryAsync(this, this.callBack);
      },

      callBack(p_this, p_data) {
        sap.m.MessageToast.show("Başarılı");
        p_this.getOrderDetails();
        setTimeout(500);
        p_this.onSearch();
      },

      handleCancel: function (oEvent) {
        this.oView.getDependents()[0].destroyContent();
        this.oView.getDependents()[0].destroy();
intVal = setInterval(this.refreshData.bind(this), 5000);
      },

      onSearch: function () {
        if (window.location.hash != "#/activity/ZACT_CRT_CAST") {
          this.clearInt();
          return;
        }
        var searchField = this.getView().byId("searchNotification");

        var workorder = searchField.getValue();
        var plant = this.appData.plant;
        var date = this.appData.shift.startDate;
        var params = {
          "Param.1": workorder,
          "Param.2": plant,
          "Param.3": date,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getCastListXquery",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }

        var castTable = this.getView().byId("castTable");
        var selectedItem = castTable.getSelectedItem();

        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData);
        this.byId("castTable").setModel(oModel);

        castTable.setSelectedItem(selectedItem);

        this._setFilters(oData);
        this.getOrderDetails();
      },
      _setFilters: function (data) {
        var oView = this.getView();
        var modelFilter = new sap.ui.model.json.JSONModel();

        if (!data[0].Row) data[0].Row = [{}];

        var arrMatnr = Array.from(new Set(data[0].Row.map((s) => s.MATNR))).map(
          (MATNR) => {
            return {
              MATNR: MATNR,
            };
          }
        );
        modelFilter.setData(arrMatnr);
        this.getView().setModel(modelFilter, "materialModel");
      },

      openChangeOrder: function (oEvent) {
        var logsTable = this.getView().byId("castTable");
        var modelTable = logsTable.getModel();
        var modelData = modelTable.getData();
        var selectedItems = logsTable.getSelectedContexts();

        if (selectedItems.length == 0) {
          sap.m.MessageToast.show("Lütfen seçim yapınız!");
          return;
        }

        var selectedRow = selectedItems[0].sPath.split("/0/Row/")[1];

        var castID = modelData[0].Row[selectedRow].CRTCASTID;
        var aufnr = modelData[0].Row[selectedRow].SUP_AUFNR;

        var oView = this.getView();
        var oDialog = oView.byId("changeOrder");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.changeOrder",
            this
          );
          oView.addDependent(oDialog);
        }
        oDialog.open();
        this.appData.oDialog = oDialog;
this.clearInt();
        this.getOrderDetails();
      },

      callChangeOrder: function (p_this, p_data) {
        sap.m.MessageToast.show(
          p_this
            .getView()
            .getModel("i18n")
            .getResourceBundle()
            .getText("OEE_LABEL_SUCCESS")
        );
p_this.getView().byId("changeOrderBtn").setEnabled(true);
        p_this.handleCancel();
        p_this.onSearch();
      },

      onPressChangeOrder: function (oEvent) {
this.getView().byId("changeOrderBtn").setEnabled(false);
        var plant = this.appData.plant;
        var userID = this.appData.user.userID;
        var logsTable = this.getView().byId("castTable");
        var modelTable = logsTable.getModel();
        var modelData = modelTable.getData();
        var selectedItems = logsTable.getSelectedContexts();

        if (selectedItems.length == 0) {
          sap.m.MessageToast.show("Lütfen seçim yapınız!");
          return;
        }

        var selectedRow = selectedItems[0].sPath.split("/0/Row/")[1];

        var crtCastID = modelData[0].Row[selectedRow].CRTCASTID;
        var aufnr = modelData[0].Row[selectedRow].SUP_AUFNR;

        var orderNoList = this.getView().byId("orderNoList");
        var orderNo = orderNoList.getSelectedKey();
        if (!orderNo) {
          sap.m.MessageToast.show("Lütfen seçim yapınız!");
          return;
        }
        var matnr = orderNoList.getSelectedItem().mProperties.additionalText;
        
        var oprNo = "";
        if (plant == "2001") oprNo = "0050";
        else oprNo = "0040";

	var params = {
    "Param.1": aufnr,
    "Param.2": oprNo
        };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/checkOperStatusSDMQry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
this.getView().byId("changeOrderBtn").setEnabled(true);
          return false;
        }
        var oData = tRunner.GetJSONData();
	if(oData[0].Row[0].C == "1"){
          MessageBox.error("Sipariş SDM de aktif veya tamamlanmış durumdadır. Siparişe değişim yapılamaz.");
this.getView().byId("changeOrderBtn").setEnabled(true);
	this.handleCancel();
        this.onSearch();
		}
	else{
        var params = {
          I_CRTCASTID: crtCastID,
          I_AUFNR: orderNo,
          I_MATNR: matnr,
          I_USER: userID,
          I_PLANT: plant,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/updateChangeOrderXquery",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callChangeOrder);
this.getView().byId("changeOrderBtn").setEnabled(true);
        /*
                                        if (!tRunner.Execute()) {
                                          MessageBox.error(tRunner.GetErrorMessage());
                                          return null;
                                        }
                                        sap.m.MessageToast.show(
                                          this.getView().getModel("i18n").getResourceBundle().getText("OEE_LABEL_SUCCESS")
                                        );
                                          this.onSearch();
                                          */
       }
      },

      onPressDeleteList: function (oEvent) {
        var logsTable = this.getView().byId("castTable");
        var modelTable = logsTable.getModel();
        var modelData = modelTable.getData();
        var selectedItems = logsTable.getSelectedContexts();

        if (selectedItems.length == 0) {
          sap.m.MessageToast.show("Lütfen seçim yapınız!");
          return;
        }

        var selectedRow = selectedItems[0].sPath.split("/0/Row/")[1];

        var castID = modelData[0].Row[selectedRow].CRTCASTID;

        var params = { "Param.1": castID };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/deleteCastListXquery",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }

        this.onSearch();
      },
      /*
                                          modelServices: function () {
                                            var self = this;
                                            this.intervalHandle = setInterval(function () {
                                              if (window.location.hash == "#/activity/ZACT_CRT_CAST")
                                                self.onSearch();
                                              console.log(2);
                                            }, 10000);
                                          },
                                    */
      onExit: function () {
        this.appComponent
          .getEventBus()
          .unsubscribe(
            this.appComponent.getId(),
            "orderChanged",
            this.refreshReported,
            this
          );

        this.clearInt();

        //if (this.intervalHandle) clearInterval(this.intervalHandle);
      },
      getCharacteristic: function (workorder,quan) {
        var params = {
          I_AUFNR: workorder,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/selectOrder/getCharacteristicsInfoXqry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return false;
        }
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        var panelJSON = [];
        var rows = oData[0].Row;

        panelJSON = [
          { ATKLA: "Y_GNL", Y_GNL: {} },
          { ATKLA: "Y_KIM", Y_KIM: {} },
          { ATKLA: "Y_MEK", Y_MEK: {} },
          { ATKLA: "Y_TLR", Y_TLR: {} },
        ];

        for (var i = 0; i < rows.length; i++) {
          for (var k = 0; k < panelJSON.length; k++) {
            if (rows[i].ATKLA == panelJSON[k].ATKLA)
              panelJSON[k][rows[i].ATKLA][
                Object.keys(panelJSON[k][rows[i].ATKLA]).length
              ] = rows[i];
          }
          if(rows[i].CHARDESC == "LC Miktar" || rows[i].CHARDESC == "Uretilecek Kutuk Tonaji")
          {
            rows[i].CHARVALUE = quan
          }
        }

        oModel.setData(panelJSON);
        this.getView().setModel(oModel, "panelsJSON");
        var table = this.byId("CharacteristicTable");
        if (table != undefined) table.setModel(oModel);
        return oData;
      },

      pressRetryQueueCastNumber: function () {
        // Hatalı durumunda butona basıldığı için RFC yi tekrar çağırıyor. Sipariş ekranında NA olan dökümler oluştuğu için return yapılmıştır. ERPSTATUS status için Bekleniyor statusu eklendiğinde aktifleştirelecektir. -- CANSU TOKYUZ--08.04.2021

        return;

        var table = this.getView().byId("castTable");
        var selectedRow = table.aDelegates[0].oDelegate.iFocusedIndex - 1;

        if (selectedRow == -1) {
          sap.m.MessageBox.error(
            this.getView()
              .getModel("i18n")
              .getResourceBundle()
              .getText("OEE_LABEL_PLEASE_CHOSEN")
          );
          return;
        }

        var rowInformation = table.getModel().oData[0].Row[selectedRow];
        if (rowInformation.ERPSTATUS == "20") {
          sap.m.MessageBox.error(
            this.getView()
              .getModel("i18n")
              .getResourceBundle()
              .getText("OEE_LABEL_RETRY_ERROR")
          );
          return;
        }

        var params = {
          I_WERKS: this.appData.plant,
          I_AUFNR: rowInformation.AUFNR,
          I_CASTID: rowInformation.CASTID,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/updateRetryCastIdXquery",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callRetryCastId);
      },

      callRetryCastId: function (p_this, p_data) {
        sap.m.MessageBox.success(
          p_this
            .getView()
            .getModel("i18n")
            .getResourceBundle()
            .getText("OEE_LABEL_SUCCESS")
        );
      },

      onPressOpenCharacteristic: function (oEvent) {
        var modelTable = this.getView().byId("idOrdersTable").getModel();
        var tableData = modelTable.oData;
        var selectedItems = oEvent.getSource().oPropagatedProperties
          .oBindingContexts.undefined.sPath;
        var selectedRow = selectedItems.split("/")[1];
        var rows = modelTable.oData;
        var rowInformation = rows[selectedRow];

        var oView = this.getView();
        var oDialog = oView.byId("getCharacteristic");
        // create dialog lazily
        if (!oDialog) {
          // create dialog via fragment factory
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.getCharacteristic",
            this
          );
          // connect dialog to view (models, lifecycle)
          oView.addDependent(oDialog);
        }

        oDialog.open();
        this.getCharacteristic(rowInformation.AUFNR,rowInformation.QUANTITY);
        this.getWorkorderNoteQry(rowInformation.AUFNR,rows);

        // this.byId("inputBarcode").setValue("");
      },

      onPressCastDelete: function () {
        var logsTable = this.getView().byId("castTable");
        var modelTable = logsTable.getModel();
        var modelData = modelTable.getData();
        var selectedItems = logsTable.getSelectedContexts();
        if (selectedItems.length == 0) {
          sap.m.MessageToast.show("Lütfen seçim yapınız!");
          return;
        }

        sap.m.MessageBox.warning(
          this.appComponent.oBundle.getText("OEE_LABEL_SURE_FOR_DELETE"),
          {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: function (oAction) {
              if (oAction == "YES") {
                this.callDeleteCastID(selectedItems);
              } else {
                return;
              }
            }.bind(this),
          }
        );
      },

      callDeleteCastID: function (selectedItems) {
        var plant = this.appData.plant;
        var logsTable = this.getView().byId("castTable");
        var rows = logsTable.getModel().oData[0].Row;
        var sPath = selectedItems[0].sPath;
        var selectedRow = sPath.split("/Row/")[1];
        var rowInformation = rows[selectedRow];
        if (selectedRow != "0") {
          sap.m.MessageBox.error(
            this.appComponent.oBundle.getText("OEE_LABEL_TOPROW_ERROR")
          );
          return;
        }
        var castID = rowInformation.CASTID;

        var params = {
          I_WERKS: plant,
          I_CASTID: castID,
        };

        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/castCancelXquery",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callReason);
      },
      callReason: function (p_this, p_data) {
        sap.m.MessageBox.success(
          p_this
            .getView()
            .getModel("i18n")
            .getResourceBundle()
            .getText("OEE_LABEL_SUCCESS")
        );
        p_this.onSearch();
      },

      changeTable: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getSelectedKey();

        var oFilter1 = new sap.ui.model.Filter(
          "MATNR",
          sap.ui.model.FilterOperator.Contains,
          sQuery
        );

        var allFilter = new sap.ui.model.Filter([oFilter1], false);

        var oTable = this.getView().byId("castTable");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(allFilter);
      },

      getDownTableCharacteristic: function (data) {
        var rows = data[0].Row;
        var aufnrs = "'0'";
        if (!rows) return null;
        rows.forEach(function (item, index) {
          aufnrs = "'" + item.SUP_AUFNR + "'," + aufnrs;
        }, this);

        var plant = this.appData.plant;

        var params = {
          "Param.1": plant,
          "Param.2": aufnrs,
        };

        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getAufnrInformationQry",
          params
        );

        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();

        return oData;
      },

      getOrderFilter: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();

        var oFilter1 = new sap.ui.model.Filter(
          "MATNR",
          sap.ui.model.FilterOperator.Contains,
          sQuery
        );

        var oFilter2 = new sap.ui.model.Filter(
          "Y_DOKUM_TIPI",
          sap.ui.model.FilterOperator.Contains,
          sQuery
        );

        var oFilter3 = new sap.ui.model.Filter(
          "Y_VAKUM",
          sap.ui.model.FilterOperator.Contains,
          sQuery
        );

        var oFilter4 = new sap.ui.model.Filter(
          "Y_KALITE_KTK",
          sap.ui.model.FilterOperator.Contains,
          sQuery
        );

        var allFilter = new sap.ui.model.Filter(
          [oFilter1, oFilter2, oFilter3, oFilter4],
          false
        );
        var oTable = this.getView().byId("idOrdersTable");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(allFilter);
      },

      callWorkorderNoteQry: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        var textNote;
        if (!!p_data.Rowsets.Rowset[0].Row)
          textNote = p_data.Rowsets.Rowset[0].Row[0].TDLINE;
        else textNote = "";
        var data = { TDLINE: textNote };
        oModel.setData(data);
        p_this.getView().setModel(oModel, "textModel");
      },

      getWorkorderNoteQry: function (workorder) {
        var params = { "Param.1": workorder };

        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getAfkolLongTextQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callWorkorderNoteQry);
      },
      onPressChange: function () {
        var plant = this.appData.plant;
	var castNo =this.getView().byId("changeCast").getValue();
        var params = { "Param.1": plant,
			    "Param.2": castNo };

        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/updateCastNoQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callWorkorderNoteQry);
      },
      onPressOpenDescription: function (oEvent) {
        // load fragment
        var oView = this.getView();
        var oDialog = oView.byId("orderDetailsDialog");
        // create dialog lazily
        if (!oDialog) {
          // create dialog via fragment factory
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.getOrderDetails",
            this
          );
          // connect dialog to view (models, lifecycle)
          oView.addDependent(oDialog);
        }
        oDialog.open();
        var aufnr = this.getView().byId("idOrdersTable").getModel().oData[
          oEvent.getSource().getParent().getBindingContextPath().split("/")[1]
        ].AUFNR;
        this.getDescription(aufnr);
      },
	handleCancelOrderDetails: function (oEvent) {
        oEvent.getSource().getParent().close();
      },

      getDescription: function (aufnr) {
        var werks = this.appData.plant;
        var params = {
          "Param.1": werks,
          "Param.2": aufnr,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getInformationCharacteristicQry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        var newOrderDetailsData = [];
        if (oData[0].Row != undefined) {
          for (var i = 0; i < oData[0].Row.length; i++) {
            newOrderDetailsData[i] = oData[0].Row[i];
          }
        }
        oModel.setData(newOrderDetailsData);
        this.getView().setModel(oModel, "orderDetailsModel");
      },
    });
  }
);