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
    "sap/m/MessageToast",
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
    MessageToast
  ) {
    //"use strict";
    var that;
    var interVal;
    var newItem;
    var oTrigger;
    return Controller.extend("customActivity.controller.oeeChemicalAnalysis", {
      formatter: formatter,

      onInit: function () {
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.interfaces = this.appComponent.getODataInterface();
        that = this;

        this.getCastID();
        this.refreshFunction();
        this.getVisibleStatusCharacteristic();

        oTrigger = setInterval(() => {
          if (window.location.hash == "#/activity/ZACT_CHEMICAL_ANALYS") {
            var castID = that.getView().byId("castID");
            var castNumber = castID.getValue();
            this.loadTables();
            this.getCastID(castNumber);
            MessageToast.show("Tablo Güncellendi");
          }
        }, 10000);
      },

      getVisibleStatusCharacteristic: function () {
        var nodeID = this.appData.node.nodeID;
        var params = { "Param.1": nodeID };
        var tRunner = new TransactionRunner(
          "MES/UI/CreateCast/getVisibleStatusCharacteristicQry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();
        var visibleJSON = [{}];
        if (!oData[0].Row) return;
        for (i = 0; i < oData[0].Row.length; i++) {
          visibleJSON[0][oData[0].Row[i].VALUE] = oData[0].Row[i].VALUE;
        }
        this.appData.visibleJSON = visibleJSON[0];
        this.appData.characteristic = oData;
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
        var visibleJSON = [{}];
        if (!oData[0].Row) return;
        for (i = 0; i < oData[0].Row.length; i++) {
          visibleJSON[0][oData[0].Row[i].VALUE] = oData[0].Row[i].VALUE;
        }
        this.appData.visibleJSON = visibleJSON[0];
        this.appData.characteristic = oData;
      },

      getCastID: function (oldCastID) {
        var plant = this.appData.plant;
        var params = {
          "Param.1": plant,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/ChemicalAnalysis/getCastIDListQry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return false;
        }

        var jsData = tRunner.GetJSONData();
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(jsData[0]);
        this.getView().setModel(oModel, "castList");

        if (oldCastID) {
          var castID = this.getView().byId("castID");

          let dd = castID.getItemByKey(oldCastID);

          if (!dd) {
            newItem = new sap.ui.core.Item({ key: oldCastID, text: oldCastID });
            castID.addItem(newItem);
            castID.setSelectedKey(oldCastID);
          }
        }
      },

      loadTables: function (oEvent) {
        var castID = that.getView().byId("castID");
        if (castID != undefined) {
          var castNumber = castID.getValue();

          if (castNumber == "") {
            if (oEvent == undefined) return;
            castNumber = oEvent.getSource().getSelectedKey();
            // oEvent.getSource().setSelectedKey(castNumber);
          }
          that.getCastDetailsTable(castNumber);
          that.getMinMaxValues(castNumber);
          that.getTablesData(castNumber);
        }
      },

      callCastDetailsTable: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        if (p_data.Rowsets.Rowset[0].Row == undefined) {
          oModel.setData(null);
          p_this.getView().setModel(oModel, "castDetailsTable");
          return;
        }
        //var boolean = false;
        //var tableData = [];
        var rows = p_data.Rowsets.Rowset[0].Row;

        /*for (var i = 0; i < rows.length; i++) {
          boolean = true;
          for (var k = 0; k < tableData.length; k++) {
            if (rows[i].AUFNR == tableData[k].AUFNR) boolean = false;
          }

          if (boolean) tableData.push(rows[i]);
        }

        for (i = 0; i < rows.length; i++) {
          for (k = 0; k < tableData.length; k++) {
            if (tableData[k].AUFNR == rows[i].AUFNR)
              tableData[k][rows[i].ATNAM] = rows[i].ATWRT;
          }
        }*/

        oModel.setData(rows);
        p_this.getView().setModel(oModel, "castDetailsTable");
      },

      getCastDetailsTable: function (castID) {
        var plant = this.appData.plant;
        var params = { "Param.1": castID, "Param.2": plant };
        var tRunner = new TransactionRunner(
          "MES/UI/ChemicalAnalysis/getCastDetailsTableQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callCastDetailsTable);
      },

      callMinMaxValues: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();

        tableDataMinMax = [{}, {}];
        var rows = p_data.Rowsets.Rowset[0].Row;
        if (rows == undefined) {
          oModel.setData(null);
          p_this.getView().setModel(oModel, "tableDataMinMax");
          return;
        }
        var lv_tol_lmt, up_tol_lmt, value;
        for (var i = 0; i < rows.length; i++) {
          var value = "";
          lv_tol_lmt = rows[i].LW_TOL_LMT;
          value = lv_tol_lmt;
          tableDataMinMax[0][rows[i].CHAR_DESCR] = value;
          tableDataMinMax[0].TYPE = "Min";
        }

        for (var i = 0; i < rows.length; i++) {
          var value = "";
          up_tol_lmt = rows[i].UP_TOL_LMT;
          value = up_tol_lmt;
          tableDataMinMax[1][rows[i].CHAR_DESCR] = value;
          tableDataMinMax[1].TYPE = "Max";
        }

        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(tableDataMinMax);
        p_this.getView().setModel(oModel, "tableDataMinMax");
      },

      getMinMaxValues: function (castID) {
        var plant = this.appData.plant;
        var description = this.appData.node.description;
        var params = {
          "Param.1": castID,
          "Param.2": plant,
          "Param.3": description,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/ChemicalAnalysis/getMinMaxValuesQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callMinMaxValues);
      },

      callTablesData: function (p_this, p_data) {
        var rows = p_data.Rowsets.Rowset[0].Row;
        var characteristicoModel = new sap.ui.model.json.JSONModel();
        characteristicoModel.setData(rows);
        p_this.getView().setModel(characteristicoModel, "tablesData");
        var oModel = new sap.ui.model.json.JSONModel();
        var tablesData = [];
        var boolean;
        var tableLocation = [];
        if (!rows) oModel.setData(null);
        else {
          for (var i = 0; i < rows.length; i++) {
            boolean = true;
            for (var k = 0; k < tableLocation.length; k++) {
              if (rows[i].SINGLE_INSPSAMPLE == tableLocation[k])
                boolean = false;
            }
            if (boolean) {
              tableLocation.push(rows[i].SINGLE_INSPSAMPLE);
              tablesData[tablesData.length] = {};
            }
          }
          var rowsLength = 0;
          tableLocation.forEach(function (item, index) {
            for (var i = rowsLength; i < rows.length; i++) {
              if (tableLocation[index] == rows[i].SINGLE_INSPSAMPLE) {
                tablesData[index][rows[i].CHAR_DESCR] =
                  rows[i].SINGLE_RES_VALUE;
                tablesData[index].USERC1 = rows[i].USERC1;
                tablesData[index].ZZDOKNO = rows[i].CASTID;
                tablesData[index].SINGLE_INSPSAMPLE = rows[i].SINGLE_INSPSAMPLE;
                tablesData[index].COLOUR = rows[i].COLOUR;
              }
              rowsLength = rowsLength++;
            }
          }, this);
          oModel.setData(tablesData);
        }

        p_this.getView().byId("tablesData1").setModel(oModel);
        p_this.getView().byId("tablesData2").setModel(oModel);
        p_this.getView().byId("tablesData3").setModel(oModel);
        p_this.setColourCells(p_this);
      },

      getTablesData: function (aufnr) {
        var plant = this.appData.plant;
        var params = {
          "Param.1": aufnr,
          "Param.2": plant,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/ChemicalAnalysis/getTablesDataQry",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callTablesData);
      },

      setColourCells: function (lv_this) {
        var tables = ["tablesData1", "tablesData2", "tablesData3"];
        tables.forEach(function (item, index) {
          var oTable = lv_this.getView().byId(item);
          var aItems = oTable.getItems();
          var rows = lv_this.getView().getModel("tablesData").oData;
          rows?.forEach(function (item, index) {
            if (parseFloat(item.SINGLE_RES_VALUE) > parseFloat(item.UP_TOL_LMT))
              item.COLOUR = "red";
            else if (
              parseFloat(item.SINGLE_RES_VALUE) < parseFloat(item.LW_TOL_LMT)
            )
              item.COLOUR = "blue";
          }, this);
          for (var i = 0; i < aItems.length; i++) {
            var columns = aItems[i].getCells();
            for (var k = 0; k < columns.length; k++) {
              for (var j = 0; j < rows.length; j++) {
                if (
                  rows[j].CHAR_DESCR ==
                    columns[k].mBindingInfos.text.binding.sPath &&
                  i + 1 == rows[j].SINGLE_INSPSAMPLE
                ) {
                  columns[k].removeStyleClass("red");
                  columns[k].removeStyleClass("blue");
                  columns[k].addStyleClass(rows[j].COLOUR);
                }
              }
            }
          }
        }, this);
      },

      refreshFunction: function () {
        /*   interVal = setInterval(function () {
          that.loadTables();
          var hash = window.location.hash;
          var activity = hash.split("#/activity/")[1];
          if (activity != "ZACT_CHEMICAL_ANALYS") clearInterval(interVal);
        }, 25000);*/
        var castID = that.getView().byId("castID");
        var castNumber = castID.getValue();
        this.loadTables();
        this.getCastID(castNumber);
      },

      onClickQualityChange: function (oEvent) {
        var oView = this.getView();
        var oDialog = oView.byId("qualityChangeDecision");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.qualityChangeDecision",
            this
          );
          oView.addDependent(oDialog);
        }
        oDialog.open();
        this.appData.oDialog = oDialog;
        this.getE1cawnmQualityKtkQry();
      },

      callE1cawnmQualityKtkQry: function (p_this, p_data) {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setSizeLimit(10000);
        oModel.setData(p_data.Rowsets.Rowset[0].Row);
        p_this.getView().setModel(oModel, "qualities");
      },

      getE1cawnmQualityKtkQry: function () {
        var tRunner = new TransactionRunner(
          "MES/UI/ChemicalAnalysis/getE1cawnmQualityQry"
        );
        tRunner.ExecuteQueryAsync(this, this.callE1cawnmQualityKtkQry);
      },

      callZmpmOrderChracXquery: function (p_this, p_data) {
        sap.m.MessageToast.show(
          p_this.interfaces.oOEEBundle.getText("OEE_LABEL_SUCCESS")
        );
        p_this.handleExit();
        p_this.qualityOrder(p_this, p_data);
        p_this.loadTables();
      },

      qualityOrder: function (p_this, p_data, oEvent) {
        var oView = p_this.getView();
        var oDialog = oView.byId("qualityOrder");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(
            oView.getId(),
            "customActivity.fragmentView.qualityOrder",
            this
          );
          oView.addDependent(oDialog);
        }
        oDialog.open();
        p_this.appData.oDialog = oDialog;
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setSizeLimit(10000);
        oModel.setData(p_data.Rowsets.Rowset[0].Row);
        p_this.getView().setModel(oModel, "CharacteristicTable4");
      },

      onPressSaveChanges: function (oEvent) {
        var castID = this.getView().byId("castID").getValue();
        var quality = this.getView().byId("quality").getSelectedKey();

        if (castID != "" && quality != "") {
          var appData = this.appData;
          var client = appData.client;
          var userID = appData.user.userID;

          var plant = this.appData.plant;
          var dimensions =
            this.getView().getModel("castDetailsTable").oData[0].Y_EBAT;
          var workcenterID = this.appData.node.workcenterID;
          var params = {
            I_CLIENT: client,
            I_CASTID: castID,
            I_KALITE_KTK: quality,
            I_USERID: userID,
            I_PLANT: plant,
            I_WORKCENTERID: workcenterID,
            I_DIMENSIONS: dimensions,
          };
          var tRunner = new TransactionRunner(
            "MES/UI/ChemicalAnalysis/insertZmpmOrderChracXquery",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callZmpmOrderChracXquery);
        } else {
          MessageBox.error("Kalite Veya Döküm Seçim Alanı Boş Bırakılamaz.");
        }
      },

      handleExit: function () {
        this.appData.oDialog.destroy();
      },

      onExit: function () {},
      onChangeCastNumber: function (oEvent) {
        var buttonType = oEvent.getSource().getType();
        var castID = this.getView().byId("castID");
        var oldCastID = castID.getValue();
        var newCastID;
        if (oldCastID != "") {
          if (buttonType == "Accept") newCastID = parseFloat(oldCastID) + 1;
          else if (buttonType == "Reject")
            newCastID = parseFloat(oldCastID) - 1;
        } else {
          newCastID = castID.getKeys()[castID.getKeys().length - 1];
        }
        // castID.setValue(newCastID);
        //castID.setSelectedKey(newCastID);
        if (newItem) {
          castID.removeItem(newItem);
        }
        let dd = castID.getItemByKey(newCastID);
        if (!dd) {
          newItem = new sap.ui.core.Item({ key: newCastID, text: newCastID });
        }

        castID.addItem(newItem);
        castID.setSelectedKey(newCastID);
        this.loadTables();
      },
    });
  }
);
