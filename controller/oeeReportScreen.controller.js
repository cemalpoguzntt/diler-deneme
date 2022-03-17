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
      var that;
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
  
      return Controller.extend("customActivity.controller.oeeReportScreen", {
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
          var today = new Date();
          var selectedPastTime =
            today.getDate() +
            "." +
            (today.getMonth() + 1) +
            "." +
            today.getFullYear();
          var selectedFutureTime =
            today.getDate() +
            "." +
            (today.getMonth() + 1) +
            "." +
            today.getFullYear();
          this.getView()
            .byId("idDatePicker")
            .setValue(selectedPastTime + " - " + selectedFutureTime);
          this.getCastList();
        },
  
        callCastList: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "castListModel");
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
            "MES/UI/CloseCast/getCastNoQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callCastList);
        },
        changeCastingNumber: function (oEvent) {
          if (!!oEvent)
            this.appData.castSelected = oEvent
              .getSource()
              .getSelectedItem()
              .oBindingContexts.castListModel.sPath.split("/")[1];
          var plant = this.appData.plant;
          var selectCast = this.getView().byId("idSelectCast");
          var castingNumber = selectCast._getSelectedItemText();
          var oData = this.getView().getModel("castListModel").oData;
  
          var selectInformation = oData.find(
            (casting) => casting.CASTID == castingNumber
          );
  
          this.getActivitiesData(plant, castingNumber);
          this.getProductionData(plant, castingNumber);
          this.getScrapData(plant, castingNumber);
          this.getConsumptionData(plant, castingNumber);
          this.getProductionLiquidSteelQry(plant, castingNumber);
          this.getScreenCharacteristic(plant, castingNumber);
        },
        callActivitiesData: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "activitiesModel");
        },
        getActivitiesData: function (plant, castingNumber) {
          var params = { "Param.1": plant, "Param.2": castingNumber };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/getActivitiesDataQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callActivitiesData);
        },
        callProductionDataQry: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "productionModel");
        },
        getProductionData: function (plant, castingNumber) {
          var params = { "Param.1": plant, "Param.2": castingNumber };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/getProductionDataQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callProductionDataQry);
        },
        callScrapData: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "scrapModel");
        },
        getScrapData: function (plant, castingNumber) {
          var params = { "Param.1": plant, "Param.2": castingNumber };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/getScrapDataQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callScrapData);
        },
        callConsumptionData: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "consumptionModel");
        },
        getConsumptionData: function (plant, castingNumber) {
          var params = { "Param.1": plant, "Param.2": castingNumber };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/getConsumptionDataQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callConsumptionData);
        },
  
        callProductionLiquidSteelQry: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(p_data.Rowsets.Rowset[0].Row);
          p_this.getView().setModel(oModel, "productionLiquidSteelModel");
        },
  
        getProductionLiquidSteelQry: function (plant, castingNumber) {
          var params = { "Param.1": plant, "Param.2": castingNumber };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/getProductionLiquidSteelQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callProductionLiquidSteelQry);
        },
  
        callScreenCharacteristic: function (p_this, p_data) {
          var oModel = new sap.ui.model.json.JSONModel();
          var rows = p_data.Rowsets.Rowset[0].Row;
          var charJSON = {};
          rows?.forEach(function (item, index) {
            charJSON[item.CHARCODE] = item.CHARVALUE;
          }, this);
  
          oModel.setData([charJSON]);
  
          p_this.getView().setModel(oModel, "screenCharacteristicModel");
        },
  
        getScreenCharacteristic: function (plant, castingNumber) {
          var params = { "Param.1": plant, "Param.2": castingNumber };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/getScreenCharacteristicQry",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callScreenCharacteristic);
        },
  
        callConfirm: function (p_this, p_data) {
          sap.m.MessageToast.show(
            p_this
              .getView()
              .getModel("i18n")
              .getResourceBundle()
              .getText("OEE_LABEL_SUCCESS")
          );
          p_this.getCastList();
        },
  
        onClickConfirm: function (oEvent) {
          var errorStatus = false;
          var message = "";
          var oView = this.getView();
          var nodeID = this.appData.node.nodeID;
          var activitiesData = oView.getModel("activitiesModel").oData;
          var productionData = oView.getModel("productionModel").oData;
          var scrapData = oView.getModel("scrapModel").oData;
          var consumptionData = oView.getModel("consumptionModel").oData;
  
          var params = { "Param.1": nodeID };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/getAllWorkcenterNameQry",
            params
          );
          if (!tRunner.Execute()) {
            MessageBox.error(tRunner.GetErrorMessage());
            return null;
          }
          var oData = tRunner.GetJSONData();
          var allWorkcenterNameLength = oData[0].Row.length;
  
          var consumptionDataLength = Array.from(
            new Set(consumptionData?.map((s) => s.NAME))
          ).map((NAME) => {
            return {
              NAME: NAME,
            };
          });
  
          if (allWorkcenterNameLength != consumptionDataLength) {
            message =
              "Tüm iş yerleri için tüketim girilmemiş, yinede dökümü kapatmak istiyor musunuz?";
            errorStatus = true;
          }
  
          if (scrapData?.length < 2) {
            message =
              "Hiç hurda girilmemiş, yinede dökümü kapatmak istiyor musunuz?" +
              "\n" +
              message;
            errorStatus = true;
          }
  
          if (productionData?.length < 1 || !productionData) {
            message =
              "Üretim girilmemiş, yinede dökümü kapatmak istiyor musunuz?" +
              "\n" +
              message;
            errorStatus = true;
          }
  
          var activitiesDataLength = Array.from(
            new Set(activitiesData?.map((s) => s.NAME))
          ).map((NAME) => {
            return {
              NAME: NAME,
            };
          });
          if (allWorkcenterNameLength != activitiesDataLength) {
            message =
              "Tüm iş yerleri için aktivite girilmemiş, yinede dökümü kapatmak istiyor musunuz?" +
              "\n" +
              message;
            errorStatus = true;
          }
  
          if (errorStatus) {
            sap.m.MessageBox.warning(message, {
              actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
              onClose: function (oAction) {
                if (oAction == "YES") {
                  this.callClickConfirm();
                } else {
                  return;
                }
              }.bind(this),
            });
          } else this.callClickConfirm();
        },
  
        callClickConfirm: function () {
          var selectCast = this.getView().byId("idSelectCast");
          var client = this.appData.client;
          var plant = this.appData.plant;
          var nodeID = this.appData.node.nodeID;
          var workcenterID = this.appData.node.workcenterID;
          var aufnr = selectCast.getSelectedKey();
          var castID = selectCast._getSelectedItemText();
          var aprio = this.appData.selected.operationNo;
          var userID = this.appData.user.userID;
          var activityData = this.getView().getModel("activitiesModel").oData;
          var scrapData = this.getView().getModel("scrapModel").oData;
          var consumptionData = this.getView().getModel("consumptionModel").oData;
          var params = {
            I_CLIENT: client,
            I_PLANT: plant,
            I_NODEID: nodeID,
            I_WORKCENTERID: workcenterID,
            I_AUFNR: aufnr,
            I_APRIO: aprio,
            I_CASTID: castID,
            I_USERID: userID,
            I_ACTIVITYDATA: JSON.stringify(activityData),
            I_SCRAPDATA: JSON.stringify(scrapData),
            I_CONSUMPTIONDATA: JSON.stringify(consumptionData),
            I_STARTTIMESTAMP: this.appData.shift.startTimestamp,
            I_ENDTIMESTAMP: this.appData.shift.endTimestamp,
          };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/reportConfirmation/reportConfirmationXquery",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callConfirm);
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
  
          this.changeCastingNumber();
        },
  
        onClickConfirmCancel: function () {
          sap.m.MessageBox.warning("Döküm açmak istediğinize emin misiniz?", {
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: function (oAction) {
              if (oAction == "YES") {
                this.callCancelConfirm();
              } else {
                return;
              }
            }.bind(this),
          });
        },
        

        onPressEnterNote: function (oEvent) {
            let cast =this.getView().byId("idSelectCast")._getSelectedItemText() ;
            if(cast != ""){
            var oView = this.getView();
            var oDialog = oView.byId("castNoteReport");
            if (!oDialog) {
                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "customActivity.fragmentView.castNoteReport",
                    this
                );
                oView.addDependent(oDialog);
            }
            oDialog.open();
            this.getCastNote();
        }
        else
        {
            MessageBox.error("Döküm No Giriniz !");
        }
        },

        getCastNote: function () {
            var params = {
                "Param.1": this.getView().byId("idSelectCast")._getSelectedItemText()                ,
                "Param.2":this.appData.plant,
            };

            var tRunner = new TransactionRunner(
                "MES/UI/General/getCreateCastNoteQry",
                params
            );
            if (!tRunner.Execute()) {
                MessageBox.error(tRunner.GetErrorMessage());
                return null;
            }
            var jsData = tRunner.GetJSONData();
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(jsData[0].Row);
            this.getView().setModel(oModel, "castNoteModel");
        },



        onPressEnterShiftNote: function (oEvent) {
            var oView = this.getView();
            var oDialog = oView.byId("shiftNoteReport");
            if (!oDialog) {
                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "customActivity.fragmentView.shiftNoteReport",
                    this
                );
                oView.addDependent(oDialog);
            }
            oDialog.open();
            this.getShiftNote();
        },

        getShiftNote: function () {

            var params = {
                "Param.1": this.appData.node.nodeID,
                "Param.2": this.appData.shift.startDate,
                "Param.3": this.appData.shift.startTime,
            };

            var tRunner = new TransactionRunner(
                "MES/UI/General/ShiftNote/getShiftNote",
                params
            );
            if (!tRunner.Execute()) {
                MessageBox.error(tRunner.GetErrorMessage());
                return null;
            }
            var jsData = tRunner.GetJSONData();
            var oModel = new sap.ui.model.json.JSONModel();

            if (!jsData[0].Row) {
                var result = "";
            }
            else {
                var result = jsData[0].Row[0].NOTE;
            }
            this.getView().byId("shiftNoteText").setValue(result);
            //this.getView().setModel(oModel, "shiftNoteModel");
        },
        handleExit: function (oEvent) {
            oEvent.getSource().getParent().close();
          },
  
        callConfirmCancelReason: function (p_this, p_data) {
          sap.m.MessageToast.show(
            p_this
              .getView()
              .getModel("i18n")
              .getResourceBundle()
              .getText("OEE_LABEL_SUCCESS")
          );
          p_this.changeCastingNumber();
        },
  
        callCancelConfirm: function () {
          var aufnr = this.getView().byId("idSelectCast").getSelectedKey();
          var plant = this.appData.plant;
          var params = { I_AUFNR: aufnr, I_PLANT: plant };
          var tRunner = new TransactionRunner(
            "MES/UI/CloseCast/cancelConfirmXquery",
            params
          );
          tRunner.ExecuteQueryAsync(this, this.callConfirmCancelReason);
        },
      });
    }
  );
  