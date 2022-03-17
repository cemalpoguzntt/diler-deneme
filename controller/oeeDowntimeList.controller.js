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
    return Controller.extend("customActivity.controller.oeeDowntimeList", {
      downtimeData: undefined,
      dcElementList: undefined,
      phNodesData: undefined,
      machineBreakDownsLoaded: 0,

      setSelectedMode: sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN, // Default Mode
      /**
       * Called when a controller is instantiated and its View controls (if available) are already created.
       * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
       */
      onInit: function () {
        jQuery.sap.require("sap.ui.core.format.NumberFormat");
        this.appComponent = this.getView().getViewData().appComponent;
        this.appData = this.appComponent.getAppGlobalData();
        this.interfaces = this.appComponent.getODataInterface();
        this.appComponent
          .getEventBus()
          .subscribe(
            this.appComponent.getId(),
            "shiftChanged",
            this.checkForModeAndPopulateDowntimeTable,
            this
          );
        this.customScreenAllData = {};
        this.prepareDowntimeDialog(); //
        this.prepareDowntimeDetails();
        //bind modes to icon tab bar
        this.bindDtListModes();
        this.applyModes();
        this.initializeDowntimewithPMNotification();
        this.initializeDownTime();
        this.prepareWorkUnitDialog();
        this.prepareMaterialDialog();
        this.preparepmFLDialog();
        this.initializeNotification();
        this.getVisibleStatusCharacteristic();
        this.getAllCharacteristic();
      },

      // Thie method validates fields of type integer which includes Duration, Standard duration
      validateDurationFields: function (oEvent) {
        var control = oEvent.getSource();
        var sVal = oEvent.getParameter("newValue");
        var fVal = new Number(0);
        if (sVal == "") {
          control.setValueState(sap.ui.core.ValueState.None);
        }
        var integerFormatter = sap.ui.core.format.NumberFormat.getIntegerInstance();
        fVal = integerFormatter.parse(sVal);

        if (sVal !== "" && integerFormatter.parse(sVal) < 0) {
          control.setValueState(sap.ui.core.ValueState.Error);
          control.setValueStateText(
            this.appComponent.oBundle.getText("OEE_ERROR_MSG_INVALID_INPUT")
          );
          this.enableDisableOKButtonForErrorValueState();
          return;
        } else if (sVal !== "" && isNaN(fVal)) {
          control.setValueStateText(
            this.appComponent.oBundle.getText("OEE_ERROR_MSG_INVALID_INPUT")
          );
          control.setValueState(sap.ui.core.ValueState.Error);
          this.enableDisableOKButtonForErrorValueState();
          return;
        } else if (sVal !== "") {
          control.setValueState(sap.ui.core.ValueState.None);
          control.setValueStateText(undefined);
        } else {
          control.setValueState(sap.ui.core.ValueState.None);
          control.setValueStateText(undefined);
        }
        this.enableDisableOKButtonForErrorValueState();
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

      enableDisableOKButtonForErrorValueState: function () {
        var duration = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "durationforDowntime"
        );
        var standardDuration = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "standardDurationforDowntime"
        );
        var frequencyFields = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "frequency"
        );
        var startTimeFields = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        );
        var startDateFields = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startDate"
        );
        var endTimeFields = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endTime"
        );
        var endDateFields = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endDate"
        );
        var oOKButton = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "okButtonDowntimeDialog"
        );
        if (
          duration.getValueState() === sap.ui.core.ValueState.Error ||
          standardDuration.getValueState() === sap.ui.core.ValueState.Error ||
          frequencyFields.getValueState() === sap.ui.core.ValueState.Error ||
          startTimeFields.getValueState() === sap.ui.core.ValueState.Error ||
          endTimeFields.getValueState() === sap.ui.core.ValueState.Error ||
          startDateFields.getValueState() === sap.ui.core.ValueState.Error ||
          endDateFields.getValueState() === sap.ui.core.ValueState.Error
        ) {
          oOKButton.setEnabled(false);
        } else {
          oOKButton.setEnabled(true);
        }
      },

      applyModes: function () {
        var inputMode = this.getView().getViewData().mode;

        var activityOptionValuesForDefaultFilters = sap.oee.ui.Utils.getActivityOptionValues(
          this.getView().getViewData().viewOptions,
          sap.oee.ui.oeeConstants.activityOptionNameDefaultFilters
        );

        var bOpen = false,
          bBottleneck = false,
          bUntagged = false;
        if (inputMode == undefined) {
          if (
            activityOptionValuesForDefaultFilters &&
            activityOptionValuesForDefaultFilters.length > 0
          ) {
            for (
              var i = 0;
              i < activityOptionValuesForDefaultFilters.length;
              i++
            ) {
              if (
                activityOptionValuesForDefaultFilters[i].optionValue ==
                sap.oee.ui.oeeConstants.downtimeFilters.OPEN
              ) {
                bOpen = true;
              }
              if (
                activityOptionValuesForDefaultFilters[i].optionValue ==
                sap.oee.ui.oeeConstants.downtimeFilters.BOTTLENECK
              ) {
                bBottleneck = true;
              }
              if (
                activityOptionValuesForDefaultFilters[i].optionValue ==
                sap.oee.ui.oeeConstants.downtimeFilters.UNTAGGED
              ) {
                bUntagged = true;
              }
            }
          }
        } else {
          this.setSelectedMode = inputMode.split("(")[0];
          this.byId("dtListIconTabBar").setSelectedKey(this.setSelectedMode);
          var filterString = inputMode.split("(")[1];
          if (filterString != undefined && filterString != "") {
            var filters = filterString.split(")")[0].split(",");
            if (filters.length > 0) {
              var iterator = 0;
              for (iterator in filters) {
                if (
                  filters[iterator] ==
                  sap.oee.ui.oeeConstants.downtimeFilters.OPEN
                ) {
                  bOpen = true;
                } else if (
                  filters[iterator] ==
                  sap.oee.ui.oeeConstants.downtimeFilters.BOTTLENECK
                ) {
                  bBottleneck = true;
                } else if (
                  filters[iterator] ==
                  sap.oee.ui.oeeConstants.downtimeFilters.UNTAGGED
                ) {
                  bUntagged = true;
                }
              }
            }
          }
        }

        this.setDefaultFilters(bOpen, bBottleneck, bUntagged);

        this.checkForModeAndPopulateDowntimeTable();

        this.byId("openDowns").fireSelect({
          selected: bOpen,
        }); // Fire Selection Change on a random filter;
      },

      bindDataToRootCauseMachineDialog: function () {
        if (this.rootCauseMachineDialog == undefined) {
          this.rootCauseMachineDialog = sap.ui.xmlfragment(
            "rootCauseMachinePopup",
            "sap.oee.ui.fragments.rootCauseDialog",
            this
          );
          this.getView().addDependent(this.rootCauseMachineDialog);
        }

        this.populateRootCauseDowntimeTable();
        this.populateRootCauseMachineTable();
      },

      populateRootCauseDowntimeTable: function () {
        var oRootCauseDowntimesTable = sap.ui
          .getCore()
          .byId(
            sap.ui.core.Fragment.createId(
              "rootCauseMachinePopup",
              "eventsTable"
            )
          );

        oRootCauseDowntimesTable.removeSelections();

        var selectedDown = this.oContextOfSelectedDown.ioProductionRunDowntime;
        var selectContextNodeId = selectedDown.nodeID;
        var currentWorkcenterID = this.appData.node.nodeID;

        var isNotWorkUnit = function (obj) {
          if (obj == currentWorkcenterID || obj == selectContextNodeId)
            return false;
          return true;
        };

        var oMachineDescription = new sap.m.Text({
          text: "{ioProductionRunDowntime/nodeDescription}",
        });
        var oDuration = new sap.m.Text({
          text:
            "{parts : [{path : 'i18n>OEE_LABEL_MINUTES'},{path:'ioProductionRunDowntime/effectiveDuration'}], formatter : 'sap.oee.ui.Formatter.minsFormatter'}",
        });
        var oRcText = new sap.m.Text({
          text: "{ioProductionRunDowntime/descriptionOfReasonCode}",
        });

        var rowTemplate = new sap.m.ColumnListItem({
          selected: "{alreadyAssigned}",
          cells: [oMachineDescription, oDuration, oRcText],
          visible: {
            path: "ioProductionRunDowntime/nodeID",
            formatter: isNotWorkUnit,
          },
        });

        var aggregatedDataJSON = this.interfaces.interfacesGetMachineBreakdownsBetweenTimePeriod(
          this.appData.client,
          this.appData.plant,
          this.appData.node.nodeID,
          this.appData.shift.startTimestamp,
          this.appData.shift.endTimestamp
        );

        var events = [];
        if (
          aggregatedDataJSON.ioDowntimeList != undefined &&
          aggregatedDataJSON.ioDowntimeList.results != undefined
        ) {
          if (aggregatedDataJSON.ioDowntimeList.results.length != 0) {
            events = aggregatedDataJSON.ioDowntimeList.results;

            var alreadyAssignedEvents =
              selectedDown.associatedProductionEvents.results;

            $.each(
              aggregatedDataJSON.ioDowntimeList.results,
              function (index, obj) {
                obj.alreadyAssigned = false;

                $.each(alreadyAssignedEvents, function (index2, obj2) {
                  if (obj.ioProductionRunDowntime.downID == obj2.eventId) {
                    obj.alreadyAssigned = true;
                  }
                });
              }
            );
          }
        }

        oRootCauseDowntimesTable.bindAggregation(
          "items",
          "/downs",
          rowTemplate
        );

        var rcDowntimeModel;
        if (oRootCauseDowntimesTable.getModel() != undefined) {
          rcDowntimeModel = oRootCauseDowntimesTable.getModel();
        } else rcDowntimeModel = new sap.ui.model.json.JSONModel();

        rcDowntimeModel.setData({
          downs: events,
        });

        oRootCauseDowntimesTable.setModel(rcDowntimeModel);
      },

      populateRootCauseMachineTable: function () {
        if (
          this.plantHierarchyNodesList != undefined &&
          this.plantHierarchyNodesList.length > 0
        ) {
          var oRootCauseMachineTable = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "rootCauseMachinePopup",
                "rootCauseMachineTable"
              )
            );

          oRootCauseMachineTable.removeSelections();

          var rcButtonDesc = this.appComponent.oBundle.getText(
            "OEE_LABEL_ASSIGN"
          );

          var dataList = [];
          var selectedDown = this.oContextOfSelectedDown
            .ioProductionRunDowntime;
          $.each(this.plantHierarchyNodesList, function (index, obj) {
            var data = {};
            data.nodeId = obj.nodeId;
            data.description = obj.description;
            data.alreadyAssigned = false;
            data.rcDescription = rcButtonDesc;
            if (
              selectedDown != undefined &&
              selectedDown.rootcauseMachines != undefined &&
              selectedDown.rootcauseMachines.results != undefined &&
              selectedDown.rootcauseMachines.results.length > 0
            ) {
              $.each(
                selectedDown.rootcauseMachines.results,
                function (index, obj2) {
                  if (obj2.nodeId == obj.nodeId) {
                    data.reasonCodeData = {
                      reasonCode: {},
                    };
                    data.alreadyAssigned = true;

                    if (
                      obj2.descriptionOfReasonCode != undefined &&
                      obj2.descriptionOfReasonCode != ""
                    )
                      data.rcDescription = obj2.descriptionOfReasonCode;

                    sap.oee.ui.Utils.convertRcFieldsObjectToReasonCodeDataObject(
                      obj2,
                      data.reasonCodeData
                    );
                  }
                }
              );
            }

            dataList.push(data);
          });

          var oMachineDescription = new sap.m.Text({
            text: "{description}",
          });
          var oRcButton = new sap.m.Button({
            text: "{rcDescription}",
            icon: "sap-icon://value-help",
            press: [
              this.onClickOpenReasonCodeUtilityPopupFromRootCauseDialog,
              this,
            ],
          });

          var selectContextNodeId = selectedDown.nodeID;
          var currentWorkcenterID = this.appData.node.nodeID;

          var isNotWorkUnit = function (obj) {
            if (obj == currentWorkcenterID || obj == selectContextNodeId)
              return false;
            return true;
          };

          var rowTemplate = new sap.m.ColumnListItem({
            selected: "{alreadyAssigned}",
            cells: [oMachineDescription, oRcButton],
            visible: {
              path: "nodeId",
              formatter: isNotWorkUnit,
            },
          });

          oRootCauseMachineTable.bindAggregation(
            "items",
            "/phNodes",
            rowTemplate
          );

          var rootCauseMachinesListModel;
          if (oRootCauseMachineTable.getModel() != undefined) {
            rootCauseMachinesListModel = oRootCauseMachineTable.getModel();
          } else rootCauseMachinesListModel = new sap.ui.model.json.JSONModel();

          rootCauseMachinesListModel.setData({
            phNodes: dataList,
          });
          rootCauseMachinesListModel.setSizeLimit(10000);
          oRootCauseMachineTable.setModel(rootCauseMachinesListModel);
        }
      },

      handleRootCauseConfirm: function (oEvent) {
        var oRootCauseMachineTable = sap.ui
          .getCore()
          .byId(
            sap.ui.core.Fragment.createId(
              "rootCauseMachinePopup",
              "rootCauseMachineTable"
            )
          );
        var oRootCauseDowntimeTable = sap.ui
          .getCore()
          .byId(
            sap.ui.core.Fragment.createId(
              "rootCauseMachinePopup",
              "eventsTable"
            )
          );

        var oContextEventToNodeObjectList = sap.oee.ui.Utils.convertContextToJSONObjects(
          oRootCauseMachineTable.getSelectedContexts()
        );
        var oEventToNodeObjectList = [];
        var retrievedDowntime = this.oContextOfSelectedDown
          .ioProductionRunDowntime;

        var iterator;
        for (iterator in oContextEventToNodeObjectList) {
          var oEventToNodeObject = {};
          oEventToNodeObject.client = this.appData.client;
          oEventToNodeObject.plant = this.appData.plant;
          oEventToNodeObject.nodeId =
            oContextEventToNodeObjectList[iterator].nodeId;
          oEventToNodeObject.downId = retrievedDowntime.downID;
          if (
            oContextEventToNodeObjectList[iterator].reasonCodeData !=
              undefined &&
            oContextEventToNodeObjectList[iterator].reasonCodeData != ""
          ) {
            sap.oee.ui.Utils.convertReasonCodeDataObjectToRcFields(
              oEventToNodeObject,
              oContextEventToNodeObjectList[iterator].reasonCodeData
            );
          }
          oEventToNodeObjectList.push(oEventToNodeObject);
        }

        var oContextAssociatedEventObjectList = sap.oee.ui.Utils.convertContextToJSONObjects(
          oRootCauseDowntimeTable.getSelectedContexts()
        );
        var oAssociatedEventObjectList = [];

        iterator = 0;
        for (iterator in oContextAssociatedEventObjectList) {
          oAssociatedEventObjectList.push({
            eventId:
              oContextAssociatedEventObjectList[iterator]
                .ioProductionRunDowntime.downID,
          });
        }

        var output = this.interfaces.updateDowntimeData(
          retrievedDowntime.startTimestamp,
          retrievedDowntime.endTimestamp,
          retrievedDowntime,
          false,
          oAssociatedEventObjectList,
          oEventToNodeObjectList,
          retrievedDowntime.sharingProductionRuns.results
        );
        if (output != undefined) {
          if (output.outputCode == 0) {
            sap.oee.ui.Utils.toast(
              this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_UPDATE")
            );
            this.checkForModeAndPopulateDowntimeTable();
          }
        }

        this.rootCauseMachineDialog.close();
      },

      handleClose: function (oEvent) {
        oEvent.getSource().getParent().close();
      },

      onClickOpenReasonCodeUtilityPopupFromRootCauseDialog: function (oEvent) {
        var reasonCodeLink = oEvent.getSource();
        var selectedElement = this.defaultDcElement;
        var oContextObject = oEvent.getSource().getBindingContext().getObject();

        sap.oee.ui.rcUtility.createReasonCodeToolPopup(
          this,
          reasonCodeLink,
          this.appData.client,
          this.appData.plant,
          oContextObject.nodeId,
          selectedElement,
          oContextObject,
          "reasonCodeData",
          undefined
        );
      },

      openRootCauseMachineDialog: function (oEvent) {
        this.oContextOfSelectedDown = oEvent
          .getSource()
          .getBindingContext()
          .getObject();
        this.bindDataToRootCauseMachineDialog();
        this.rootCauseMachineDialog.open();
      },

      bindDtListModes: function () {
        var oController = this;
        var oDtListModesModel = new sap.ui.model.json.JSONModel();
        //Check if Other DC Elements Event Reporting is Enabled
        var validModes = {};
        validModes = $.extend(
          true,
          validModes,
          sap.oee.ui.oeeConstants.dtModes
        );
        //Set Texts
        $.each(validModes.dtListModes, function (index, obj) {
          switch (obj.dtListMode) {
            case sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN:
              obj.dtListTypeText = oController.appComponent.oBundle.getText(
                "OEE_HEADING_ALL_DOWNTIMES"
              );
              break;
            case sap.oee.ui.oeeConstants.dtTypes.MINOR:
              obj.dtListTypeText = oController.appComponent.oBundle.getText(
                "OEE_HEADING_MINOR_DOWNTIMES"
              );
              break;
            case sap.oee.ui.oeeConstants.dtTypes.LINEDOWN:
              obj.dtListTypeText = oController.appComponent.oBundle.getText(
                "OEE_LABEL_LINE_DOWNS"
              );
              break;
            case sap.oee.ui.oeeConstants.dtTypes.OVERLAPPING:
              obj.dtListTypeText = oController.appComponent.oBundle.getText(
                "OEE_LABEL_SHARED_DOWNTIMES"
              );
              break;
            case sap.oee.ui.oeeConstants.dtTypes.FLOWTIME:
              obj.dtListTypeText = oController.appComponent.oBundle.getText(
                "OEE_LABEL_FLOW_TIME"
              );
              break;
            case sap.oee.ui.oeeConstants.dtTypes.SHIFTBREAKS:
              obj.dtListTypeText = oController.appComponent.oBundle.getText(
                "OEE_LABEL_SHIFT_BRKS"
              );
              break;
            case sap.oee.ui.oeeConstants.dtTypes.OTHERS:
              obj.dtListTypeText = oController.appComponent.oBundle.getText(
                "OEE_HEADING_OTHER_EVENTS"
              );
              break;
          }
        });

        var allowedDCElementList = sap.oee.ui.Utils.getActivityOptionValues(
          this.getView().getViewData().viewOptions,
          "OTHER_REP_DCELEMS"
        );
        if (
          allowedDCElementList === undefined ||
          !(allowedDCElementList.length > 0)
        ) {
          validModes.dtListModes = $.grep(
            validModes.dtListModes,
            function (element, elementIndex) {
              if (element.dtListMode !== sap.oee.ui.oeeConstants.dtTypes.OTHERS)
                return true;
            }
          ); // Remove Others Mode
        }

        if (
          this.getView().getViewData().viewOptions &&
          this.getView().getViewData().viewOptions.length > 0
        ) {
          for (
            var i = 0;
            i < this.getView().getViewData().viewOptions.length;
            i++
          ) {
            if (
              this.getView().getViewData().viewOptions[i].optionName ===
                sap.oee.ui.oeeConstants.activityOptionNameAllowTabs &&
              this.getView().getViewData().viewOptions[i]
                .activityOptionValueDTOList.results.length > 0
            ) {
              var LModes = [];
              for (
                j = 0;
                j <
                this.getView().getViewData().viewOptions[i]
                  .activityOptionValueDTOList.results.length >
                0;
                j++
              ) {
                var Modes = {};
                Modes.dtListMode = this.getView().getViewData().viewOptions[
                  i
                ].activityOptionValueDTOList.results[j].optionValue;
                LModes.push(Modes);
              }
              validModes.dtListModes = $.grep(
                validModes.dtListModes,
                function (element, elementIndex) {
                  for (k = 0; k < LModes.length; k++) {
                    if (
                      element.dtListMode === LModes[k].dtListMode ||
                      element.dtListMode ===
                        sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN ||
                      element.dtListMode ===
                        sap.oee.ui.oeeConstants.dtTypes.LINEDOWN
                    )
                      return true;
                  }
                }
              );
            }
          }
        }

        var modes = [];
        for (i = 0; i < validModes.dtListModes.length; i++) {
          modes[i] = validModes.dtListModes[i].dtListMode;
        }

        oDtListModesModel.setData(validModes);
        this.byId("dtListIconTabBar").setModel(oDtListModesModel);
        this.byId("dtListIconTabBar").setSelectedKey(
          sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN
        );
        this.setSelectedMode = sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN;
        if (
          this.getView().getViewData().viewOptions &&
          this.getView().getViewData().viewOptions.length > 0
        ) {
          for (
            var i = 0;
            i < this.getView().getViewData().viewOptions.length;
            i++
          ) {
            if (
              this.getView().getViewData().viewOptions[i]
                .activityOptionValueDTOList &&
              this.getView().getViewData().viewOptions[i]
                .activityOptionValueDTOList.results &&
              this.getView().getViewData().viewOptions[i]
                .activityOptionValueDTOList.results.length > 0
            ) {
              //For the Visibility of the Report Notification Button(Visible only for ALLOW_PM_NOTIF Activity Option)
              if (
                this.getView().getViewData().viewOptions[i].optionName ==
                  sap.oee.ui.oeeConstants.activityOptions.ALLOW_PM_NOTIF &&
                this.getView().getViewData().viewOptions[i]
                  .activityOptionValueDTOList.results.length > 0
              ) {
                for (
                  var j = 0;
                  j <
                  this.getView().getViewData().viewOptions[i]
                    .activityOptionValueDTOList.results.length;
                  j++
                ) {
                  if (
                    this.getView().getViewData().viewOptions[i]
                      .activityOptionValueDTOList.results[j].optionName ==
                      sap.oee.ui.oeeConstants.activityOptions.ALLOW_PM_NOTIF &&
                    this.getView().getViewData().viewOptions[i]
                      .activityOptionValueDTOList.results[j].optionValue ==
                      sap.oee.ui.oeeConstants.check_boolean.TRUE
                  ) {
                    this.setVisible = true;
                    this.byId("reportButtonForNotification").setVisible(true);
                    this.byId("reportButtonForNotification").setEnabled(false);
                    sap.ui.core.Fragment.byId(
                      "downtimeDialog",
                      "reportPMNotification"
                    ).setVisible(true);
                    break;
                  } else {
                    this.byId("reportButtonForNotification").setVisible(false);
                    sap.ui.core.Fragment.byId(
                      "downtimeDialog",
                      "reportPMNotification"
                    ).setVisible(false);
                  }
                }
              } else {
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "reportPMNotification"
                ).setVisible(false);
              }

              if (
                this.getView().getViewData().viewOptions[i].optionName ==
                sap.oee.ui.oeeConstants.activityOptionNameDefaultTab
              ) {
                var defaultTab = this.getView().getViewData().viewOptions[i]
                    .activityOptionValueDTOList.results[0].optionValue,
                  modeFound;
                for (k = 0; k < modes.length; k++) {
                  if (modes[k] === defaultTab) {
                    modeFound = true;
                  }
                }

                if (modeFound) {
                  this.byId("dtListIconTabBar").setSelectedKey(defaultTab);
                  this.setSelectedMode = defaultTab;
                  break;
                } else {
                  sap.oee.ui.Utils.createMessage(
                    this.appComponent.oBundle.getText(
                      "OEE_ERROR_MSG_INCORRECT_VALUE_DEFAULTTAB"
                    ),
                    sap.ui.core.MessageType.Error
                  );
                }
              }
            }
          }
        }
      },

      setDefaultFilters: function (bOpen, bBottleneck, bUntagged) {
        this.byId("openDowns").setSelected(bOpen);
        this.byId("bottleneck").setSelected(bBottleneck);
        this.byId("untagged").setSelected(bUntagged);
      },

      onSelectDtListTab: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("item");
        var oContext = oSelectedItem.getBindingContext().getObject();
        this.setSelectedMode = oContext.dtListMode;
        this.aFilters = []; // Clear Filters on Change of Tab
        this.clearFilterSelections(); // Clear Selections Of Filters
        this.checkForModeAndPopulateDowntimeTable();
      },

      clearFilterSelections: function () {
        this.byId("bottleneck").setSelected(false);
        this.byId("untagged").setSelected(false);
        this.byId("openDowns").setSelected(false);
      },

      checkForModeAndPopulateDowntimeTable: function () {
        this.selectedDowntime = undefined;

        if (this.deleteNotif !== "X") {
          this.byId("downtimesTable").removeSelections();
        }

        this.byId("microDowntimesTable").removeSelections();
        this.byId("breakScheduleTable").removeSelections();

        if (this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.MINOR) {
          this.showMinorStoppagesTable();
        } else if (
          this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.SHIFTBREAKS
        ) {
          this.showBreakScheduleTable();
        } else {
          this.showDowntimesTable();
        }

        switch (this.setSelectedMode) {
          case sap.oee.ui.oeeConstants.dtTypes.MINOR:
            this.showMinorStoppages();
            this.byId("EditButtonForDowntime").setVisible(false);
            this.byId("deleteButtonForDowntime").setVisible(false);
            this.byId("reportUpButtonForDowntime").setVisible(false);
            this.byId("assignToOrderButtonForDowntime").setVisible(false);
            this.byId("splitButtonForDowntime").setVisible(true);
            this.byId("openDowns").setVisible(false);
            this.byId("bottleneck").setVisible(false);
            this.byId("untagged").setVisible(true);
            this.byId("reportButtonForDowntime").setVisible(true);
            this.byId("reportButtonForNotification").setVisible(false);
            this.byId("notificationIconLabel").setVisible(false); //
            this.byId("notificationIcon").setVisible(false); //
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "reportPMNotification"
            ).setVisible(false); //
            break;
          case sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN:
            this.showMajorStoppages();
            this.byId("EditButtonForDowntime").setVisible(true);
            this.byId("EditButtonForDowntime").setEnabled(false);
            this.byId("deleteButtonForDowntime").setVisible(true);
            this.byId("deleteButtonForDowntime").setEnabled(false);
            this.byId("reportUpButtonForDowntime").setEnabled(false);
            this.byId("reportUpButtonForDowntime").setVisible(true);
            this.byId("assignToOrderButtonForDowntime").setVisible(false);
            this.byId("splitButtonForDowntime").setVisible(true);
            this.byId("splitButtonForDowntime").setEnabled(false);
            this.byId("openDowns").setVisible(true);
            this.byId("bottleneck").setVisible(false);
            this.byId("untagged").setVisible(true);
            this.byId("assignedOrderColumn").setVisible(false);
            this.byId("rootCauseMachineForDowntimeColumn").setVisible(true);
            this.byId("reportButtonForDowntime").setVisible(true);
            if (this.setVisible === true) {
              this.byId("reportButtonForNotification").setVisible(true);
              this.byId("reportButtonForNotification").setEnabled(false);
              this.byId("notificationIconLabel").setVisible(true); //
              this.byId("notificationIcon").setVisible(true); //
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(true);
            } else {
              this.byId("reportButtonForNotification").setVisible(false);
              this.byId("notificationIconLabel").setVisible(false); //
              this.byId("notificationIcon").setVisible(false); //
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(false);
            }
            this.checkForMinorDowntimesActivityOption();
            break;
          case sap.oee.ui.oeeConstants.dtTypes.LINEDOWN:
            this.showLineAffectingStoppages();
            this.byId("EditButtonForDowntime").setVisible(true);
            this.byId("EditButtonForDowntime").setEnabled(false);
            this.byId("deleteButtonForDowntime").setVisible(true);
            this.byId("deleteButtonForDowntime").setEnabled(false);
            this.byId("reportUpButtonForDowntime").setEnabled(false);
            this.byId("reportUpButtonForDowntime").setVisible(true);
            this.byId("assignToOrderButtonForDowntime").setVisible(false);
            this.byId("splitButtonForDowntime").setVisible(true);
            this.byId("splitButtonForDowntime").setEnabled(false);
            this.byId("openDowns").setVisible(true);
            this.byId("bottleneck").setVisible(true);
            this.byId("untagged").setVisible(true);
            this.byId("assignedOrderColumn").setVisible(false);
            this.byId("rootCauseMachineForDowntimeColumn").setVisible(true);
            this.byId("reportButtonForDowntime").setVisible(true);
            if (this.setVisible === true) {
              this.byId("reportButtonForNotification").setVisible(true);
              this.byId("reportButtonForNotification").setEnabled(false);
              this.byId("notificationIconLabel").setVisible(true); //
              this.byId("notificationIcon").setVisible(true); //
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(true);
            } else {
              this.byId("reportButtonForNotification").setVisible(false);
              this.byId("notificationIconLabel").setVisible(false); //
              this.byId("notificationIcon").setVisible(false); //
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(false);
            }
            break;
          case sap.oee.ui.oeeConstants.dtTypes.OVERLAPPING:
            this.showSharedStoppages();
            this.byId("EditButtonForDowntime").setVisible(false);
            this.byId("deleteButtonForDowntime").setVisible(false);
            this.byId("reportUpButtonForDowntime").setVisible(false);
            this.byId("assignToOrderButtonForDowntime").setVisible(false);
            this.byId("assignToOrderButtonForDowntime").setEnabled(false);
            this.byId("splitButtonForDowntime").setVisible(false);
            this.byId("openDowns").setVisible(false);
            this.byId("bottleneck").setVisible(false);
            this.byId("untagged").setVisible(false);
            this.byId("assignedOrderColumn").setVisible(true);
            this.byId("rootCauseMachineForDowntimeColumn").setVisible(true);
            this.byId("reportButtonForDowntime").setVisible(false);
            this.byId("reportButtonForNotification").setVisible(false);
            this.byId("notificationIconLabel").setVisible(false); //
            this.byId("notificationIcon").setVisible(false); //
            break;
          case sap.oee.ui.oeeConstants.dtTypes.FLOWTIME:
            this.showFlowTimeStoppages();
            this.byId("EditButtonForDowntime").setVisible(true);
            this.byId("EditButtonForDowntime").setEnabled(false);
            this.byId("deleteButtonForDowntime").setVisible(true);
            this.byId("deleteButtonForDowntime").setEnabled(false);
            this.byId("reportUpButtonForDowntime").setVisible(true);
            this.byId("reportUpButtonForDowntime").setEnabled(false);
            this.byId("assignToOrderButtonForDowntime").setVisible(false);
            this.byId("splitButtonForDowntime").setVisible(true);
            this.byId("splitButtonForDowntime").setEnabled(false);
            this.byId("openDowns").setVisible(false);
            this.byId("bottleneck").setVisible(false);
            this.byId("untagged").setVisible(false);
            this.byId("assignedOrderColumn").setVisible(false);
            this.byId("rootCauseMachineForDowntimeColumn").setVisible(false);
            this.byId("reportButtonForDowntime").setVisible(true);
            this.byId("reportButtonForNotification").setVisible(false);
            this.byId("notificationIconLabel").setVisible(false); //
            this.byId("notificationIcon").setVisible(false); //
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "reportPMNotification"
            ).setVisible(false);
            break;
          case sap.oee.ui.oeeConstants.dtTypes.SHIFTBREAKS:
            this.showBreakSchedules();
            this.byId("EditButtonForDowntime").setVisible(false);
            this.byId("EditButtonForDowntime").setEnabled(false);
            this.byId("deleteButtonForDowntime").setVisible(false);
            this.byId("deleteButtonForDowntime").setEnabled(false);
            this.byId("reportUpButtonForDowntime").setVisible(false);
            this.byId("reportUpButtonForDowntime").setEnabled(false);
            this.byId("assignToOrderButtonForDowntime").setVisible(false);
            this.byId("splitButtonForDowntime").setVisible(false);
            this.byId("splitButtonForDowntime").setEnabled(false);
            this.byId("openDowns").setVisible(false);
            this.byId("bottleneck").setVisible(false);
            this.byId("untagged").setVisible(false);
            this.byId("assignedOrderColumn").setVisible(true);
            this.byId("rootCauseMachineForDowntimeColumn").setVisible(true);
            this.byId("reportButtonForDowntime").setVisible(false);
            this.byId("reportButtonForNotification").setVisible(false);
            this.byId("notificationIconLabel").setVisible(false); //
            this.byId("notificationIcon").setVisible(false); //
            break;
          case sap.oee.ui.oeeConstants.dtTypes.OTHERS:
            this.showOtherNonStandardEvents();
            this.byId("EditButtonForDowntime").setVisible(true);
            this.byId("EditButtonForDowntime").setEnabled(false);
            this.byId("deleteButtonForDowntime").setVisible(true);
            this.byId("deleteButtonForDowntime").setEnabled(false);
            this.byId("reportUpButtonForDowntime").setEnabled(false);
            this.byId("reportUpButtonForDowntime").setVisible(true);
            this.byId("assignToOrderButtonForDowntime").setVisible(false);
            this.byId("splitButtonForDowntime").setVisible(true);
            this.byId("splitButtonForDowntime").setEnabled(false);
            this.byId("openDowns").setVisible(true);
            this.byId("bottleneck").setVisible(false);
            this.byId("untagged").setVisible(false);
            this.byId("assignedOrderColumn").setVisible(false);
            this.byId("rootCauseMachineForDowntimeColumn").setVisible(true);
            this.byId("reportButtonForDowntime").setVisible(true);
            this.byId("reportButtonForNotification").setVisible(false);
            this.byId("notificationIconLabel").setVisible(false); //
            this.byId("notificationIcon").setVisible(false); //
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "reportPMNotification"
            ).setVisible(false);
            break;
          default:
            this.showMajorStoppages();
            break;
        }

        this.performFuzzySearch(this.byId("downsSearch")); // After Downs are loaded apply Search.
      },

      showMinorStoppagesTable: function () {
        this.byId("downtimesTable").setVisible(false);
        this.byId("microDowntimesTable").setVisible(true);
        this.byId("breakScheduleTable").setVisible(false);
      },

      showDowntimesTable: function () {
        this.byId("downtimesTable").setVisible(true);
        this.byId("microDowntimesTable").setVisible(false);
        this.byId("breakScheduleTable").setVisible(false);
      },

      showBreakScheduleTable: function () {
        this.byId("downtimesTable").setVisible(false);
        this.byId("microDowntimesTable").setVisible(false);
        this.byId("breakScheduleTable").setVisible(true);
      },

      showMinorStoppages: function () {
        this.setBusyMinorStoppages(true);
        this.interfaces.interfacesGetAggregatedMinorStoppagesForWorkcenterAndTimePeriod(
          this.appData.client,
          this.appData.plant,
          this.appData.node.nodeID,
          this.appData.shift.startTimestamp,
          this.appData.shift.endTimestamp,
          undefined,
          true,
          this.minorStoppagesLoaded,
          this
        );
      },

      setBusyMinorStoppages: function (bValue) {
        var busyIndicator = this.byId("downtimesBusyIndicator");
        var microDownsTable = this.byId("microDowntimesTable");
        if (busyIndicator) {
          busyIndicator.setVisible(bValue);
        }

        if (microDownsTable) {
          microDownsTable.setVisible(!bValue);
        }
      },

      minorStoppagesLoaded: function (aggregatedDataJSON) {
        if (this.oMicroEventsModel == undefined) {
          this.oMicroEventsModel = new sap.ui.model.json.JSONModel();
        }
        if (
          aggregatedDataJSON != undefined &&
          aggregatedDataJSON.aggregatedDowntimeList != undefined &&
          aggregatedDataJSON.aggregatedDowntimeList.results != undefined
        ) {
          this.setBusyMinorStoppages(false);
          if (aggregatedDataJSON.aggregatedDowntimeList.results.length != 0) {
            for (
              var i = 0;
              i < aggregatedDataJSON.aggregatedDowntimeList.results.length;
              i++
            ) {
              aggregatedDataJSON.aggregatedDowntimeList.results[
                i
              ].notificationIcon = null;

              for (
                var j = 0;
                j <
                aggregatedDataJSON.aggregatedDowntimeList.results[i]
                  .aggregatedData.results.length;
                j++
              ) {
                if (
                  aggregatedDataJSON.aggregatedDowntimeList.results[i]
                    .aggregatedData.results[j].ioProductionRunDowntime
                    .associatedPMNotifications.results.length > 0
                ) {
                  aggregatedDataJSON.aggregatedDowntimeList.results[
                    i
                  ].notificationIcon = "sap-icon://notification";
                }
              }
            }
            this.oMicroEventsModel.setData({
              aggregatedDowns:
                aggregatedDataJSON.aggregatedDowntimeList.results,
            });
            this.byId("microDowntimesTable").setModel(this.oMicroEventsModel);
            sap.oee.ui.Utils.updateModel(this.oMicroEventsModel);
            return;
          }
        }
        this.oMicroEventsModel.setData({
          aggregatedDowns: [],
        }); // Clear Model
      },

      showBreakSchedules: function () {
        var aggregatedDataJSON = this.interfaces.interfacesGetBreakScheduleForCurrentShift();
        if (this.oBreakScheduleModel == undefined) {
          this.oBreakScheduleModel = new sap.ui.model.json.JSONModel();
        }
        if (
          aggregatedDataJSON.breakSchedules != undefined &&
          aggregatedDataJSON.breakSchedules.results != undefined
        ) {
          if (aggregatedDataJSON.breakSchedules.results.length != 0) {
            this.oBreakScheduleModel.setData({
              breaks: aggregatedDataJSON.breakSchedules.results,
            });
            var oTable = this.byId("breakScheduleTable");
            oTable.setMode(sap.m.ListMode.None);
            oTable.setModel(this.oBreakScheduleModel);

            var oSorter = new sap.ui.model.Sorter("breakStartTimestamp", false);

            oTable.getBinding("items").sort(oSorter);
            sap.oee.ui.Utils.updateModel(this.oBreakScheduleModel);
            return;
          }
        }
        this.oBreakScheduleModel.setData({
          aggregatedDowns: [],
        }); // Clear Model
      },

      checkForMinorDowntimesActivityOption: function () {
        this.showMinorDowntimes = false;
        if (
          this.getView().getViewData().viewOptions &&
          this.getView().getViewData().viewOptions.length > 0
        ) {
          for (
            var i = 0;
            i < this.getView().getViewData().viewOptions.length;
            i++
          ) {
            if (
              this.getView().getViewData().viewOptions[i]
                .activityOptionValueDTOList &&
              this.getView().getViewData().viewOptions[i]
                .activityOptionValueDTOList.results &&
              this.getView().getViewData().viewOptions[i]
                .activityOptionValueDTOList.results.length > 0
            ) {
              //For the Visibility of the Minor Downtimes(Visible only for SHOW_MINOR_DOWNS Activity Option)
              if (
                this.getView().getViewData().viewOptions[i].optionName ===
                  sap.oee.ui.oeeConstants.activityOptions.SHOW_MINOR_DOWNS &&
                this.getView().getViewData().viewOptions[i]
                  .activityOptionValueDTOList.results.length > 0
              ) {
                for (
                  var j = 0;
                  j <
                  this.getView().getViewData().viewOptions[i]
                    .activityOptionValueDTOList.results.length;
                  j++
                ) {
                  if (
                    this.getView().getViewData().viewOptions[i]
                      .activityOptionValueDTOList.results[j].optionName ==
                      sap.oee.ui.oeeConstants.activityOptions
                        .SHOW_MINOR_DOWNS &&
                    this.getView().getViewData().viewOptions[i]
                      .activityOptionValueDTOList.results[j].optionValue ===
                      sap.oee.ui.oeeConstants.check_boolean.TRUE
                  ) {
                    this.showMinorDowntimes = true;
                    break;
                  }
                }
              }
            }
          }
        }
      },

      onSelectCheckBoxFilters: function (oEvent) {
        var isBottleneckFlag = this.byId("bottleneck").getSelected();
        var isUntaggedFlag = this.byId("untagged").getSelected();
        var isOpenDownFlag = this.byId("openDowns").getSelected();

        this.aFilters = [];
        if (!isBottleneckFlag && !isUntaggedFlag && !isOpenDownFlag) {
          if (this.setSelectedMode != sap.oee.ui.oeeConstants.dtTypes.MINOR) {
            if (this.showMinorDowntimes !== true) {
              this.aFilters.push(
                new sap.ui.model.Filter("isMinorStoppage", "EQ", false)
              );
            }
          }
          this.performFuzzySearch(this.byId("downsSearch"));
          return;
        }

        if (
          isUntaggedFlag &&
          this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.MINOR
        ) {
          this.aFilters.push(
            new sap.ui.model.Filter("reasonCodeDescription", "EQ", "")
          ); // for minor stoppages
        } else {
          if (isOpenDownFlag) {
            this.aFilters.push(
              new sap.ui.model.Filter(
                "ioProductionRunDowntime/endTimestamp",
                "EQ",
                ""
              )
            );
          }

          if (isUntaggedFlag) {
            this.aFilters.push(
              new sap.ui.model.Filter("ioProductionRunDowntime/rc1", "EQ", "")
            ); // for major stoppages
          }

          if (isBottleneckFlag) {
            this.aFilters.push(
              new sap.ui.model.Filter("isBottleneckMachineDown", "EQ", true)
            );
          }

          if (this.showMinorDowntimes !== true) {
            this.aFilters.push(
              new sap.ui.model.Filter("isMinorStoppage", "EQ", false)
            );
          }
        }

        var oFilter = new sap.ui.model.Filter({
          filters: this.aFilters,
        });

        //Only Apply Untagged filter
        this.performFuzzySearch(this.byId("downsSearch")); // Apply Fuzzy Search Again After selecting filters
      },

      onSearch: function (oEvent) {
        this.performFuzzySearch(oEvent.getSource());
      },

      performFuzzySearch: function (oSearchField) {
        if (
          this.setSelectedMode != sap.oee.ui.oeeConstants.dtTypes.MINOR &&
          this.setSelectedMode != sap.oee.ui.oeeConstants.dtTypes.SHIFTBREAKS
        ) {
          var properties = [];
          properties.push("ioProductionRunDowntime/nodeDescription");
          properties.push("ioProductionRunDowntime/changedBy");
          properties.push("ioProductionRunDowntime/descriptionOfReasonCode");
          properties.push("ioProductionRunDowntime/descriptionOfDcElement");
          //properties.push("orderReferences/results");

          sap.oee.ui.Utils.fuzzySearch(
            this,
            this.oMachineEventsModel,
            oSearchField.getValue(),
            this.byId("downtimesTable").getBinding("items"),
            oSearchField,
            properties,
            this.aFilters,
            true
          );
        } else if (
          this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.SHIFTBREAKS
        ) {
          var breakProps = [];
          breakProps.push("breakScheduleDescription");

          sap.oee.ui.Utils.fuzzySearch(
            this,
            this.oBreakScheduleModel,
            oSearchField.getValue(),
            this.byId("breakScheduleTable").getBinding("items"),
            oSearchField,
            breakProps,
            this.aFilters,
            true
          );
        } else {
          // Search Model Properties For Minor Stoppages
          var microProps = [];
          microProps.push("nodeDescription");
          microProps.push("totalDuration");
          microProps.push("reasonCodeDescription");

          sap.oee.ui.Utils.fuzzySearch(
            this,
            this.oMachineEventsModel,
            oSearchField.getValue(),
            this.byId("microDowntimesTable").getBinding("items"),
            oSearchField,
            microProps,
            this.aFilters,
            true
          );
        }
      },

      showFlowTimeStoppages: function () {
        this.setBusyDowntimesTable(true);
        //        this.interfaces.interfacesGetLineAffectingDownsForTimePeriod(
        //            this.appData.client, this.appData.plant, this.appData.node.nodeID,
        //            this.appData.shift.startTimestamp, this.appData.shift.endTimestamp, undefined, sap.oee.ui.oeeConstants.timeElementTypes.flowTime, true, this.flowTimeDataLoaded, this);
        this.interfaces.interfacesGetMachineBreakdownsBetweenTimePeriod(
          this.appData.client,
          this.appData.plant,
          this.appData.node.nodeID,
          this.appData.shift.startTimestamp,
          this.appData.shift.endTimestamp,
          null,
          true,
          this.flowTimeDataLoaded,
          this,
          [sap.oee.ui.oeeConstants.timeElementTypes.flowTime]
        );
      },

      flowTimeDataLoaded: function (aggregatedDataJSON) {
        if (this.oMachineEventsModel == undefined) {
          this.oMachineEventsModel = new sap.ui.model.json.JSONModel();
        }

        this.oMachineEventsModel.setData({
          downs: [],
        });

        if (
          aggregatedDataJSON != undefined &&
          aggregatedDataJSON.ioDowntimeList != undefined &&
          aggregatedDataJSON.ioDowntimeList.results != undefined
        ) {
          var lineDownList = [];
          for (
            var i = 0;
            i < aggregatedDataJSON.ioDowntimeList.results.length;
            i++
          ) {
            lineDownList.push(aggregatedDataJSON.ioDowntimeList.results[i]);
          }
          /*
                              for(var i = 0 ; i < lineDownList.length ; i++){
                                              lineDownList[i].notificationIcon = null;
                                              if(lineDownList[i].ioProductionRunDowntime.associatedPMNotifications.results.length > 0){
                                              lineDownList[i].notificationIcon = "sap-icon://notification" ;
                                              }
                              }
                              */
          this.setBusyDowntimesTable(false);
          if (lineDownList.length != 0) {
            this.oMachineEventsModel.setData({
              downs: lineDownList,
            });
            this.byId("downtimesTable").setMode(
              sap.m.ListMode.SingleSelectLeft
            );
            this.byId("downtimesTable").setModel(this.oMachineEventsModel);
            sap.oee.ui.Utils.updateModel(this.oMachineEventsModel);
            return;
          }
        }
        this.oMachineEventsModel.setData({
          downs: [],
        }); // Clear Model
      },

      showMajorStoppages: function () {
        if (this.oMachineEventsModel == undefined) {
          this.oMachineEventsModel = new sap.ui.model.json.JSONModel();
        }

        this.oMachineEventsModel.setSizeLimit(10000);
        this.oMachineEventsModel.setData({
          downs: [],
        });

        //  this.machineBreakDownsLoaded = 0;
        sap.oee.ui.Utils.updateModel(this.oMachineEventsModel);
        this.setBusyDowntimesTable(true);

        //Fetch Unscheduled, Scheduled and Changeover Downs
        this.interfaces.interfacesGetMachineBreakdownsBetweenTimePeriod(
          this.appData.client,
          this.appData.plant,
          this.appData.node.nodeID,
          this.appData.shift.startTimestamp,
          this.appData.shift.endTimestamp,
          null,
          true,
          this.addDownsToModelModified,
          this,
          [
            sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown,
            sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown,
            sap.oee.ui.oeeConstants.timeElementTypes.changeOver,
          ]
        );
      },
      addDownsToModelModified: function (response) {
        if (
          response.ioDowntimeList != undefined &&
          response.ioDowntimeList.results != undefined
        ) {
          if (response.ioDowntimeList.results.length != 0) {
            //
            for (var i = 0; i < response.ioDowntimeList.results.length; i++) {
              response.ioDowntimeList.results[i].notificationIcon = null;
              this.oContextOfSelected = null;

              if (
                response.ioDowntimeList.results[i].ioProductionRunDowntime
                  .associatedPMNotifications.results.length > 0
              ) {
                response.ioDowntimeList.results[i].notificationIcon =
                  "sap-icon://notification";
              }
            }

            this.oMachineEventsModel.setData({
              downs: response.ioDowntimeList.results,
            });
          }
        }
        this.byId("downtimesTable").setMode(sap.m.ListMode.SingleSelectLeft);
        this.byId("downtimesTable").setModel(this.oMachineEventsModel);
        sap.oee.ui.Utils.updateModel(this.oMachineEventsModel);

        if (this.showMinorDowntimes !== true) {
          this.aFilters.push(
            new sap.ui.model.Filter("isMinorStoppage", "EQ", false)
          );
          this.performFuzzySearch(this.byId("downsSearch"));
        }
        this.setBusyDowntimesTable(false);

        /*this.oMachineEventsModel.setData({
          downs: []
      });*/
        /* var response = this.interfaces.interfacesGetMachineBreakdownsBetweenTimePeriod(this.appData.client, this.appData.plant, this.appData.node.nodeID, this.appData.shift.startTimestamp, this.appData.shift.endTimestamp, null, true, this.downtimeDataLoaded, this, [sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown,sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown,sap.oee.ui.oeeConstants.timeElementTypes.changeOver]);
      // Fetch Unscheduled Downs
      this.interfaces.interfacesGetMachineBreakdownsBetweenTimePeriod(this.appData.client, this.appData.plant, this.appData.node.nodeID, this.appData.shift.startTimestamp, this.appData.shift.endTimestamp, sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown, true, this.downtimeDataLoaded, this);

      //Fetch Scheduled Downs
      this.interfaces.interfacesGetMachineBreakdownsBetweenTimePeriod(this.appData.client, this.appData.plant, this.appData.node.nodeID, this.appData.shift.startTimestamp, this.appData.shift.endTimestamp, sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown, true, this.downtimeDataLoaded, this);
  
  //Fetch changeover Downs
  this.interfaces.interfacesGetMachineBreakdownsBetweenTimePeriod(this.appData.client, this.appData.plant, this.appData.node.nodeID, this.appData.shift.startTimestamp, this.appData.shift.endTimestamp, sap.oee.ui.oeeConstants.timeElementTypes.changeOver, true, this.downtimeDataLoaded, this); */
      },

      downtimeDataLoaded: function (downs) {
        this.machineBreakDownsLoaded++;
        this.addDownsToModel(downs);
        if (this.machineBreakDownsLoaded == 2) {
          this.renderMachineBreakdownEvents();
          // Clear flag
          this.machineBreakDownsLoaded = 0;
        }
      },

      renderMachineBreakdownEvents: function () {
        this.byId("downtimesTable").setMode(sap.m.ListMode.SingleSelectLeft);
        this.byId("downtimesTable").setModel(this.oMachineEventsModel);
        sap.oee.ui.Utils.updateModel(this.oMachineEventsModel);

        if (this.showMinorDowntimes !== true) {
          this.aFilters.push(
            new sap.ui.model.Filter("isMinorStoppage", "EQ", false)
          );
          this.performFuzzySearch(this.byId("downsSearch"));
        }
        this.setBusyDowntimesTable(false);
      },

      setBusyDowntimesTable: function (bValue) {
        var busyIndicator = this.byId("downtimesBusyIndicator");
        var downsTable = this.byId("downtimesTable");
        if (busyIndicator) {
          busyIndicator.setVisible(bValue);
        }

        if (downsTable) {
          downsTable.setVisible(!bValue);
        }
      },

      addDownsToModel: function (downEvents) {
        if (
          downEvents.ioDowntimeList != undefined &&
          downEvents.ioDowntimeList.results != undefined
        ) {
          if (downEvents.ioDowntimeList.results.length != 0) {
            //
            for (var i = 0; i < downEvents.ioDowntimeList.results.length; i++) {
              downEvents.ioDowntimeList.results[i].notificationIcon = null;
              this.oContextOfSelected = null;

              if (
                downEvents.ioDowntimeList.results[i].ioProductionRunDowntime
                  .associatedPMNotifications.results.length > 0
              ) {
                downEvents.ioDowntimeList.results[i].notificationIcon =
                  "sap-icon://notification";
              }
            }
            var downsData = this.oMachineEventsModel.getData().downs;
            this.oMachineEventsModel.setData({
              downs: downsData.concat(downEvents.ioDowntimeList.results),
            });
          }
        }
      },

      showSharedStoppages: function () {
        this.setBusyDowntimesTable(true);
        this.interfaces.interfacesGetSharedDowntimesBetweenTimePeriod(
          this.appData.client,
          this.appData.plant,
          this.appData.node.nodeID,
          this.appData.shift.startTimestamp,
          this.appData.shift.endTimestamp,
          true,
          this.sharedStoppagesLoaded,
          this
        );
      },

      sharedStoppagesLoaded: function (aggregatedDataJSON) {
        if (this.oMachineEventsModel == undefined) {
          this.oMachineEventsModel = new sap.ui.model.json.JSONModel();
        }

        this.oMachineEventsModel.setData({
          downs: [],
        });

        if (
          aggregatedDataJSON.ioDowntimeList != undefined &&
          aggregatedDataJSON.ioDowntimeList.results != undefined
        ) {
          this.setBusyDowntimesTable(false);
          if (aggregatedDataJSON.ioDowntimeList.results.length != 0) {
            this.oMachineEventsModel.setData({
              downs: aggregatedDataJSON.ioDowntimeList.results,
            });
            this.byId("downtimesTable").setMode(sap.m.ListMode.None);
            this.byId("downtimesTable").setModel(this.oMachineEventsModel);
            sap.oee.ui.Utils.updateModel(this.oMachineEventsModel);
            return;
          }
        }
        this.oMachineEventsModel.setData({
          downs: [],
        }); // Clear Model
      },

      showLineAffectingStoppages: function () {
        this.setBusyDowntimesTable(true);
        this.interfaces.interfacesGetLineAffectingDownsForTimePeriod(
          this.appData.client,
          this.appData.plant,
          this.appData.node.nodeID,
          this.appData.shift.startTimestamp,
          this.appData.shift.endTimestamp,
          undefined,
          undefined,
          true,
          this.lineDownsLoaded,
          this
        );
      },

      lineDownsLoaded: function (aggregatedDataJSON) {
        if (this.oMachineEventsModel == undefined) {
          this.oMachineEventsModel = new sap.ui.model.json.JSONModel();
        }

        this.oMachineEventsModel.setData({
          downs: [],
        });

        if (
          aggregatedDataJSON.ioDowntimeList != undefined &&
          aggregatedDataJSON.ioDowntimeList.results != undefined
        ) {
          var lineDownList = [];
          for (
            var i = 0;
            i < aggregatedDataJSON.ioDowntimeList.results.length;
            i++
          ) {
            //                if (!aggregatedDataJSON.ioDowntimeList.results[i].isFlowtime) {
            //                    lineDownList.push(aggregatedDataJSON.ioDowntimeList.results[i]);
            //                }
            lineDownList.push(aggregatedDataJSON.ioDowntimeList.results[i]);
          }

          for (var i = 0; i < lineDownList.length; i++) {
            lineDownList[i].notificationIcon = null;
            if (
              lineDownList[i].ioProductionRunDowntime.associatedPMNotifications
                .results.length > 0
            ) {
              lineDownList[i].notificationIcon = "sap-icon://notification";
            } else {
              this.oContextOfSelected = null;
            }
          }

          this.setBusyDowntimesTable(false);
          if (lineDownList.length != 0) {
            this.oMachineEventsModel.setData({
              downs: lineDownList,
            });
            this.byId("downtimesTable").setMode(
              sap.m.ListMode.SingleSelectLeft
            );
            this.byId("downtimesTable").setModel(this.oMachineEventsModel);
            sap.oee.ui.Utils.updateModel(this.oMachineEventsModel);
            return;
          }
        }
        this.oMachineEventsModel.setData({
          downs: [],
        }); // Clear Model
      },

      showOtherNonStandardEvents: function () {
        this.setBusyDowntimesTable(true);
        this.interfaces.interfacesGetNonStandardReportEventsForLineAndChildrenForTimePeriod(
          this.appData.client,
          this.appData.plant,
          this.appData.node.nodeID,
          this.appData.shift.startTimestamp,
          this.appData.shift.endTimestamp,
          true,
          this.otherNonStandardEventsLoaded,
          this
        );
      },

      otherNonStandardEventsLoaded: function (downsList) {
        if (this.oMachineEventsModel == undefined) {
          this.oMachineEventsModel = new sap.ui.model.json.JSONModel();
        }

        this.oMachineEventsModel.setData({
          downs: [],
        });

        if (
          downsList != undefined &&
          downsList.details != undefined &&
          downsList.details.results != undefined
        ) {
          var otherDownsList = [];
          for (var i = 0; i < downsList.details.results.length; i++) {
            otherDownsList.push({
              ioProductionRunDowntime: downsList.details.results[i],
            });
          }

          for (var i = 0; i < otherDownsList.length; i++) {
            otherDownsList[i].notificationIcon = null;
            if (
              otherDownsList[i].ioProductionRunDowntime
                .associatedPMNotifications.results.length > 0
            ) {
              otherDownsList[i].notificationIcon = "sap-icon://notification";
            }
          }

          this.setBusyDowntimesTable(false);
          if (otherDownsList.length != 0) {
            this.oMachineEventsModel.setData({
              downs: otherDownsList,
            });
            this.byId("downtimesTable").setMode(
              sap.m.ListMode.SingleSelectLeft
            );
            this.byId("downtimesTable").setModel(this.oMachineEventsModel);
            sap.oee.ui.Utils.updateModel(this.oMachineEventsModel);
            return;
          }
        }
        this.oMachineEventsModel.setData({
          downs: [],
        }); // Clear Model
      },

      openSplitWindow: function (oEvent) {
        var downtimeToBeSplitData = this.byId("downtimesTable")
          .getSelectedItem()
          .getBindingContext()
          .getObject();

        if (
          downtimeToBeSplitData &&
          downtimeToBeSplitData.ioProductionRunDowntime
        ) {
          var durationToBeSplit = 0;
          this.downtimeToBeSplit =
            downtimeToBeSplitData.ioProductionRunDowntime;
          durationToBeSplit = Math.floor(
            parseFloat(this.downtimeToBeSplit.effectiveDuration) / 60
          );

          var titleTemp =
            this.appComponent.oBundle.getText("OEE_HEADER_DURATION_TO_SPLIT") +
            durationToBeSplit +
            this.appComponent.oBundle.getText("OEE_LBL_MINS");

          if (this.splitEventsDialog == undefined) {
            this.splitEventsDialog = sap.ui.xmlfragment(
              "splitEventsPopup",
              "sap.oee.ui.fragments.splitEventsPopup",
              this
            );
            this.splitEventsDialog.setTitle(titleTemp);
            this.getView().addDependent(this.splitEventsDialog);
          }
          this.splitEventsDialog.setTitle(titleTemp);
          this.totalSplitDuration = durationToBeSplit;
          this.breakdownEventsToBeReported = []; // Clear Model Data
          this.dcElementForSplit = this.downtimeToBeSplit.dcElement;
          this.breakdownEventsToBeReported.push({
            duration: "",
            reasonCode: undefined,
            dcElement: this.dcElementForSplit,
            nodeID: this.downtimeToBeSplit.nodeID,
          });
          this.breakdownEventsToBeReported.push({
            duration: "",
            reasonCode: undefined,
            dcElement: this.dcElementForSplit,
            nodeID: this.downtimeToBeSplit.nodeID,
          });

          this.validateSplitDuration(); // clear all values
          this.oBreakdownEventsModel = new sap.ui.model.json.JSONModel({
            splitEventsToBeReported: this.breakdownEventsToBeReported,
          });
          this.splitEventsDialog.setModel(this.oBreakdownEventsModel);
          this.splitEventsDialog.open();
        }
      },

      openSplitWindowForMinorBreakdowns: function (oEvent) {
        var downtimeToBeSplitData = this.byId("microDowntimesTable")
          .getSelectedItem()
          .getBindingContext()
          .getObject();

        if (downtimeToBeSplitData && downtimeToBeSplitData.totalDuration) {
          var durationToBeSplit = 0;
          this.downtimeToBeSplit = downtimeToBeSplitData;
          durationToBeSplit = Math.floor(
            parseFloat(this.downtimeToBeSplit.totalDuration) / 60
          );

          var titleTemp =
            this.appComponent.oBundle.getText("OEE_HEADER_DURATION_TO_SPLIT") +
            durationToBeSplit +
            this.appComponent.oBundle.getText("OEE_LBL_MINS");

          if (this.splitEventsDialog == undefined) {
            this.splitEventsDialog = sap.ui.xmlfragment(
              "splitEventsPopup",
              "sap.oee.ui.fragments.splitEventsPopup",
              this
            );
            this.splitEventsDialog.setTitle(titleTemp);
            this.getView().addDependent(this.splitEventsDialog);
          }
          this.splitEventsDialog.setTitle(titleTemp);
          this.totalSplitDuration = durationToBeSplit;
          this.breakdownEventsToBeReported = []; // Clear Model Data
          this.dcElementForSplit =
            downtimeToBeSplitData.aggregatedData.results[0].ioProductionRunDowntime.dcElement;
          this.breakdownEventsToBeReported.push({
            duration: "",
            reasonCode: undefined,
            dcElement: this.dcElementForSplit,
            nodeID: this.downtimeToBeSplit.nodeId,
          });
          this.breakdownEventsToBeReported.push({
            duration: "",
            reasonCode: undefined,
            dcElement: this.dcElementForSplit,
            nodeID: this.downtimeToBeSplit.nodeId,
          });

          this.validateSplitDuration(); // clear all values
          this.oBreakdownEventsModel = new sap.ui.model.json.JSONModel({
            splitEventsToBeReported: this.breakdownEventsToBeReported,
          });
          this.splitEventsDialog.setModel(this.oBreakdownEventsModel);
          this.splitEventsDialog.open();
        }
      },

      onPressSplit: function (oEvent) {
        if (this.setSelectedMode != sap.oee.ui.oeeConstants.dtTypes.MINOR) {
          this.openSplitWindow(oEvent);
        } else {
          this.openSplitWindowForMinorBreakdowns(oEvent);
        }
      },

      openReasonCodeFromSplitEvents: function (oEvent) {
        var reasonCodeLink = oEvent.getSource();
        var oContext = oEvent.getSource().getBindingContext().getObject();
        var dcElement = oContext.dcElement;
        sap.oee.ui.rcUtility.createReasonCodeToolPopup(
          this,
          reasonCodeLink,
          this.appData.client,
          this.appData.plant,
          oContext.nodeID,
          dcElement,
          oContext,
          "reasonCode",
          undefined,
          this.callbackReasonCodeSplitFromSplitEvents
        );
      },

      callbackReasonCodeSplitFromSplitEvents: function () {
        sap.oee.ui.Utils.updateModel(oController.oBreakdownEventsModel);
      },

      handleCloseButton: function (oEvent) {
        this.oPopOver.close();
      },

      onPressAssignToOrder: function (oEvent) {
        var downtimeToBeAssignedData = oEvent
          .getSource()
          .getBindingContext()
          .getObject();

        this.downtimeToBeAssignedDataForMultipleOrder = downtimeToBeAssignedData;
        if (
          downtimeToBeAssignedData &&
          downtimeToBeAssignedData.ioProductionRunDowntime
        ) {
          this.orderReferences = downtimeToBeAssignedData.orderReferences;
          var runList = [];
          for (var i = 0; i < this.orderReferences.results.length; i++) {
            runList.push(this.orderReferences.results[i].runId);
          }
          var outputOrderStatusList = this.interfaces.interfacesGetOrderStatusForListOfRunsInputSync(
            runList
          );
          this.ordersModel = new sap.ui.model.json.JSONModel();
          if (outputOrderStatusList != undefined) {
            if (outputOrderStatusList.orderStatusList != undefined) {
              if (outputOrderStatusList.orderStatusList.results != undefined) {
                if (outputOrderStatusList.orderStatusList.results.length != 0) {
                  if (this.orderReferences != undefined) {
                    for (
                      var i = 0;
                      i < outputOrderStatusList.orderStatusList.results.length;
                      i++
                    ) {
                      for (
                        var j = 0;
                        j < this.orderReferences.results.length;
                        j++
                      ) {
                        if (
                          outputOrderStatusList.orderStatusList.results[i]
                            .runID == this.orderReferences.results[j].runId
                        ) {
                          outputOrderStatusList.orderStatusList.results[
                            i
                          ].isMappedRecord = this.orderReferences.results[
                            j
                          ].isMappedRecord;
                          break;
                        }
                      }
                    }
                  }

                  this.ordersModel.setData({
                    orders: outputOrderStatusList.orderStatusList.results,
                  });
                }
              }
            }
            if (this.oPopOver == undefined) {
              this.oPopOver = sap.ui.xmlfragment(
                "popoverChange",
                "sap.oee.ui.fragments.orderChangeDialogForMultipleOrderAssign",
                this
              );
              this.getView().addDependent(this.oPopOver);
            }
            this.oPopOver.setModel(this.ordersModel);
            this.oPopOver.open();
          }
        }
      },

      onClickCancel: function () {
        if (this.oPopOver != undefined) {
          sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "popoverChange",
                "orderDataSearchField"
              )
            )
            .setValue("");
        }
        this.oPopOver.close();
      },

      onCloseFilter: function (oEvent) {
        var orderData = oEvent.getSource().getModel().getData();
        var selectedRuns = [];
        if (
          orderData != undefined &&
          orderData.orders != undefined &&
          orderData.orders.length > 0
        ) {
          for (var index = 0; index < orderData.orders.length; index++) {
            if (orderData.orders[index].isMappedRecord == true) {
              var runID = {
                runID: orderData.orders[index].runID,
              };
              selectedRuns.push(runID);
            }
          }

          var results = this.interfaces.updateDowntimeData(
            this.downtimeToBeAssignedDataForMultipleOrder
              .ioProductionRunDowntime.startTimestamp,
            this.downtimeToBeAssignedDataForMultipleOrder
              .ioProductionRunDowntime.endTimestamp,
            this.downtimeToBeAssignedDataForMultipleOrder
              .ioProductionRunDowntime,
            false,
            this.downtimeToBeAssignedDataForMultipleOrder
              .ioProductionRunDowntime.associatedProductionEvents.results,
            this.downtimeToBeAssignedDataForMultipleOrder
              .ioProductionRunDowntime.rootcauseMachines.results,
            selectedRuns
          );

          if (results.outputCode != undefined) {
            if (results.outputCode == 0) {
              sap.oee.ui.Utils.toast(
                this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE")
              );
              this.checkForModeAndPopulateDowntimeTable();
              if (this.oPopOver != undefined) {
                sap.ui
                  .getCore()
                  .byId(
                    sap.ui.core.Fragment.createId(
                      "popoverChange",
                      "orderDataSearchField"
                    )
                  )
                  .setValue("");
              }
              this.oPopOver.close();
            } else if (results.outputCode == 1) {
              sap.oee.ui.Utils.createMessage(
                results.outputMessage,
                sap.ui.core.MessageType.Error
              );
              if (this.oPopOver != undefined) {
                sap.ui
                  .getCore()
                  .byId(
                    sap.ui.core.Fragment.createId(
                      "popoverChange",
                      "orderDataSearchField"
                    )
                  )
                  .setValue("");
              }
            }
          }
        }
      },

      orderDataSearch: function (oEvent) {
        var properties = [];
        properties.push("order");
        properties.push("routingOperNo");
        properties.push("material_desc");
        properties.push("orderStartTimestamp");
        properties.push("productionActivity");
        properties.push("statusDescription");

        var orderList = sap.ui
          .getCore()
          .byId(
            sap.ui.core.Fragment.createId(
              "popoverChange",
              "orderAssignmentList"
            )
          );
        var oSearchField = oEvent.getSource();
        sap.oee.ui.Utils.fuzzySearch(
          this,
          this.ordersModel,
          oSearchField.getValue(),
          orderList.getBinding("items"),
          oSearchField,
          properties
        );
      },

      /*selectOrder: function(oEvent, downtimeToBeAssignedData) {
      var oSource = oEvent.getParameter("selectedItem");
      if (oSource != undefined) {
          var sRunID = oSource.getBindingContext().getProperty("runID");
          if (sRunID != undefined) {
              var selectedRuns = [];
              var runID = {
                  runID: sRunID
              };
              selectedRuns.push(runID);
          }

          var results = this.interfaces.updateDowntimeData(
              downtimeToBeAssignedData.ioProductionRunDowntime.startTimestamp,
              downtimeToBeAssignedData.ioProductionRunDowntime.endTimestamp,
              downtimeToBeAssignedData.ioProductionRunDowntime,
              false,
              downtimeToBeAssignedData.ioProductionRunDowntime.associatedProductionEvents.results,
              downtimeToBeAssignedData.ioProductionRunDowntime.rootcauseMachines.results,
              selectedRuns);

          if (results.outputCode != undefined) {
              if (results.outputCode == 0) {
                  sap.oee.ui.Utils.toast(this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE"));
                  this.checkForModeAndPopulateDowntimeTable();
                  this.oPopOver.close();
              } else if (results.outputCode == 1) {
                  sap.oee.ui.Utils.createMessage(results.outputMessage, sap.ui.core.MessageType.Error);
              }
          }

      }
  },*/

      onExit: function () {
        if (this.oWorkUnitDialog != undefined) {
          this.oWorkUnitDialog.destroy();
        }

        if (this.oPopOver != undefined) {
          this.oPopOver.destroy();
        }

        if (this.oDowntimeDialog != undefined) {
          this.oDowntimeDialog.destroy();
        }

        if (this.attachedMachineEventsDialog != undefined) {
          this.attachedMachineEventsDialog.destroy();
        }

        if (this.rootCauseMachineDialog != undefined) {
          this.rootCauseMachineDialog.destroy();
        }

        if (this.splitEventsDialog != undefined) {
          this.splitEventsDialog.destroy();
        }

        if (this.workUnitDialog != undefined) {
          this.workUnitDialog.destroy();
        }

        if (this.oSortDialog != undefined) {
          this.oSortDialog.destroy();
        }

        if (this.pmFLDialog != undefined) {
          this.pmFLDialog.destroy();
        }
        if (this.oPMNotificationDialog != undefined) {
          this.oPMNotificationDialog.destroy();
        }

        if (this.PMNotificationDetailsDialog != undefined) {
          this.PMNotificationDetailsDialog.destroy();
        }
        if (this.oOrderPopOver != undefined) {
          this.oOrderPopOver.destroy();
        }
        this.appComponent
          .getEventBus()
          .unsubscribe(
            this.appComponent.getId(),
            "shiftChanged",
            this.checkForModeAndPopulateDowntimeTable,
            this
          );
      },

      deleteSplitRow: function (oEvent) {
        var str = "" + oEvent.getSource().getBindingContext();
        var index = str.split("/")[2];
        if (index == 0) {
          this.addSplitRow(oEvent);
          return;
        }
        this.breakdownEventsToBeReported.splice(index, 1);

        this.validateSplitDuration();
        sap.oee.ui.Utils.updateModel(this.oBreakdownEventsModel);
        this.splitEventsDialog.rerender();
      },

      onClickReasonCode: function (oEvent) {
        var reasonCodeLink = oEvent.getSource();
        var aggregatedDowntimeData = oEvent
          .getSource()
          .getBindingContext()
          .getObject();

        var rcCode = {
          reasonCode: {},
        };

        var controllerReference = this.getView().getController();

        var callBack = function () {
          if (rcCode.reasonCode.reasonCode1 != undefined) {
            sap.oee.ui.Utils.convertReasonCodeDataObjectToRcFields(
              aggregatedDowntimeData.ioProductionRunDowntime,
              rcCode.reasonCode
            );
            var entryType =
              aggregatedDowntimeData.ioProductionRunDowntime.entryType;
            var selectedRuns = [];
            if (
              aggregatedDowntimeData.ioProductionRunDowntime
                .sharingProductionRuns.results.length > 0
            ) {
              var runID = {
                runID:
                  aggregatedDowntimeData.ioProductionRunDowntime
                    .sharingProductionRuns.results[0].runID,
              };
              selectedRuns.push(runID);
            }

            if (
              entryType ==
                sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
              entryType ==
                sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_MANUAL ||
              entryType ==
                sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
              entryType ==
                sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
            ) {
              var results = controllerReference.interfaces.updateDowntimeData(
                aggregatedDowntimeData.ioProductionRunDowntime.startTimestamp,
                aggregatedDowntimeData.ioProductionRunDowntime.endTimeStamp,
                aggregatedDowntimeData.ioProductionRunDowntime,
                false,
                aggregatedDowntimeData.ioProductionRunDowntime
                  .associatedProductionEvents.results,
                aggregatedDowntimeData.ioProductionRunDowntime.rootcauseMachines
                  .results,
                selectedRuns
              );
            } else {
              var results = controllerReference.interfaces.updateDowntimeData(
                aggregatedDowntimeData.ioProductionRunDowntime.startTimestamp,
                aggregatedDowntimeData.ioProductionRunDowntime.endTimestamp,
                aggregatedDowntimeData.ioProductionRunDowntime
              );
            }

            if (results.outputCode != undefined) {
              if (results.outputCode == 0) {
                sap.oee.ui.Utils.toast(
                  controllerReference.appComponent.oBundle.getText(
                    "OEE_MESSAGE_SUCCESSFUL_SAVE"
                  )
                );
                controllerReference.checkForModeAndPopulateDowntimeTable();
              } else if (results.outputCode == 1) {
                sap.oee.ui.Utils.createMessage(
                  results.outputMessage,
                  sap.ui.core.MessageType.Error
                );
              }
            }
          }
        };

        var reasonCodeAttachedCallback = jQuery.proxy(
          this.reasonCodeAttached,
          this
        );

        if (
          aggregatedDowntimeData.ioProductionRunDowntime.nodeID != undefined
        ) {
          sap.oee.ui.rcUtility.createReasonCodeToolPopup(
            this,
            reasonCodeLink,
            this.appData.client,
            this.appData.plant,
            aggregatedDowntimeData.ioProductionRunDowntime.nodeID,
            aggregatedDowntimeData.ioProductionRunDowntime.dcElement,
            rcCode,
            "reasonCode",
            undefined,
            callBack
          );
        }
      },

      addSplitRow: function (oEvent) {
        var bindingContextData = oEvent
          .getSource()
          .getBindingContext()
          .getModel()
          .getData();
        this.breakdownEventsToBeReported.unshift({
          duration: "",
          reasonCode: undefined,
          dcElement: bindingContextData.splitEventsToBeReported[0].dcElement,
          nodeID: bindingContextData.splitEventsToBeReported[0].nodeID,
        });
        sap.oee.ui.Utils.updateModel(this.oBreakdownEventsModel);
      },

      handleSplitComplete: function (oEvent) {
        this.reportBreakdownEvents();
        this.checkForModeAndPopulateDowntimeTable();
        this.splitEventsDialog.close();
      },

      handleAssignToOrderCancel: function (oEvent) {
        this.splitEventsDialog.close();
      },

      validateInputAndOverallSplitDuration: function (oEvent) {
        var control = oEvent.getSource();
        control.getBindingContext().getObject().duration = oEvent.getParameter(
          "newValue"
        );
        var sVal = oEvent.getParameter("newValue");
        var fVal = new Number(0);
        if (sVal == "") {
          control.setValueState(sap.ui.core.ValueState.None);
        }

        var floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance();

        fVal = floatFormatter.parse(sVal);

        var oOKButton = sap.ui
          .getCore()
          .byId(sap.ui.core.Fragment.createId("splitEventsPopup", "okButton"));

        if (sVal !== "" && floatFormatter.parse(sVal) < 0) {
          control.setValueState(sap.ui.core.ValueState.Error);
          control.setValueStateText(
            this.appComponent.oBundle.getText("OEE_ERROR_MSG_INVALID_INPUT")
          );
          oOKButton.setEnabled(false);
          return;
        } else if (sVal !== "" && isNaN(fVal)) {
          control.setValueStateText(
            this.appComponent.oBundle.getText("OEE_ERROR_MSG_INVALID_INPUT")
          );
          control.setValueState(sap.ui.core.ValueState.Error);
          oOKButton.setEnabled(false);
          return;
        } else {
          control.setValueState(sap.ui.core.ValueState.None);
          control.setValueStateText(undefined);
        }

        this.validateSplitDuration();

        sap.oee.ui.Utils.updateModel(this.oBreakdownEventsModel);
      },

      validateSplitDuration: function () {
        var oOKButton = sap.ui
          .getCore()
          .byId(sap.ui.core.Fragment.createId("splitEventsPopup", "okButton"));
        // Validate Overall Duration
        var fOverallDuration = 0;
        for (i in this.breakdownEventsToBeReported) {
          if (isNaN(this.breakdownEventsToBeReported[i].duration)) {
            return;
          }
          if (this.breakdownEventsToBeReported[i].duration != "") {
            fOverallDuration += parseFloat(
              this.breakdownEventsToBeReported[i].duration
            );
          }
        }

        if (this.totalSplitDuration >= fOverallDuration) {
          this.splitEventsDialog.setTitle(
            this.appComponent.oBundle.getText("OEE_HEADER_DURATION_TO_SPLIT") +
              new Number(this.totalSplitDuration - fOverallDuration) +
              this.appComponent.oBundle.getText("OEE_LBL_MINS")
          );
        }

        if (fOverallDuration > this.totalSplitDuration) {
          oOKButton.setEnabled(false);
          sap.oee.ui.Utils.createMessage(
            this.appComponent.oBundle.getText("OEE_ERROR_MSG_INVALID_INPUT"),
            sap.ui.core.MessageType.Error
          );
        } else oOKButton.setEnabled(true);
      },

      reportBreakdownEvents: function () {
        var downtimeToBeCreated = [];
        var downtimeToBeDeleted = [];
        var downtimeToBeSplitTemp = this.downtimeToBeSplit;
        var actsAsBottleneck;

        if (this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.MINOR) {
          for (
            var index = 0;
            index < downtimeToBeSplitTemp.aggregatedData.results.length;
            index++
          ) {
            var downtimeToBeDeletedObject = {
              downID:
                downtimeToBeSplitTemp.aggregatedData.results[index].downId,
              version:
                downtimeToBeSplitTemp.aggregatedData.results[index].version,
            };
            downtimeToBeDeleted.push(downtimeToBeDeletedObject);
          }
          actsAsBottleneck =
            downtimeToBeSplitTemp.aggregatedData.results[0]
              .ioProductionRunDowntime.actsAsBottleneck;
        } else {
          var downtimeToBeDeletedObject = {
            downID: downtimeToBeSplitTemp.downID,
            version: downtimeToBeSplitTemp.version,
          };
          downtimeToBeDeleted.push(downtimeToBeDeletedObject);
          actsAsBottleneck = downtimeToBeSplitTemp.actsAsBottleneck;
        }

        if (this.breakdownEventsToBeReported != undefined) {
          if (this.breakdownEventsToBeReported.length > 0) {
            for (var i = 0; i < this.breakdownEventsToBeReported.length; i++) {
              if (
                this.breakdownEventsToBeReported[i].duration != "" &&
                this.breakdownEventsToBeReported[i].duration != undefined &&
                !isNaN(this.breakdownEventsToBeReported[i].duration)
              ) {
                var breakdownEvent = {};
                var duration = this.breakdownEventsToBeReported[i].duration;
                breakdownEvent.plant = downtimeToBeSplitTemp.plant;
                breakdownEvent.effectiveDuration = duration * 60;
                breakdownEvent.client = downtimeToBeSplitTemp.client;
                breakdownEvent.actsAsBottleneck = actsAsBottleneck;
                if (this.breakdownEventsToBeReported[i].reasonCode) {
                  breakdownEvent.rc1 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode1;
                  breakdownEvent.rc2 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode2;
                  breakdownEvent.rc3 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode3;
                  breakdownEvent.rc4 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode4;
                  breakdownEvent.rc5 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode5;
                  breakdownEvent.rc6 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode6;
                  breakdownEvent.rc7 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode7;
                  breakdownEvent.rc8 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode8;
                  breakdownEvent.rc9 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode9;
                  breakdownEvent.rc10 = this.breakdownEventsToBeReported[
                    i
                  ].reasonCode.reasonCode10;
                }
                breakdownEvent.dcElement = this.dcElementForSplit;
                //breakdownEvent.startTimestamp = downtimeToBeSplitTemp.startTimestamp;
                //breakdownEvent.endTimestamp = downtimeToBeSplitTemp.endTimestamp;
                if (
                  this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.MINOR
                ) {
                  breakdownEvent.nodeID = downtimeToBeSplitTemp.nodeId;
                } else {
                  breakdownEvent.nodeID = downtimeToBeSplitTemp.nodeID;
                }

                downtimeToBeCreated.push(breakdownEvent);
              }
            }
          }
        }

        if (downtimeToBeCreated.length > 0 && downtimeToBeDeleted.length > 0) {
          var result = this.interfaces.interfacesBreakdownEvents(
            downtimeToBeCreated,
            downtimeToBeDeleted
          );
          if (result.outputCode == 0) {
            sap.oee.ui.Utils.toast(
              this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_UPDATE")
            );
          } /*else if (result.outputCode == 1) {
              sap.oee.ui.Utils.createMessage(result.outputMessage, sap.ui.core.MessageType.Error);
          }*/
        }
        this.byId("splitButtonForDowntime").setEnabled(false);
      },

      rootCauseMachineButtonFormatter: function (obj1, ioProdDowntime) {
        var associatedEventsExistsCheck =
          ioProdDowntime.associatedProductionEvents != undefined &&
          ioProdDowntime.associatedProductionEvents.results != undefined &&
          ioProdDowntime.associatedProductionEvents.results.length > 0;
        var rootCauseExistCheck =
          ioProdDowntime.rootcauseMachines != undefined &&
          ioProdDowntime.rootcauseMachines.results != undefined &&
          ioProdDowntime.rootcauseMachines.results.length > 0;
        if (
          (ioProdDowntime != undefined && associatedEventsExistsCheck) ||
          rootCauseExistCheck
        ) {
          if (rootCauseExistCheck) {
            // Root Cause takes precedence
            var rootCausesLength =
              rootCauseExistCheck && associatedEventsExistsCheck
                ? ioProdDowntime.associatedProductionEvents.results.length +
                  ioProdDowntime.rootcauseMachines.results.length
                : ioProdDowntime.rootcauseMachines.results.length;
            return rootCausesLength > 1
              ? this.appComponent.oBundle.getText("OEE_LABEL_MULTIPLE")
              : ioProdDowntime.rootcauseMachines.results[0].nodeDescription;
          } else if (associatedEventsExistsCheck) {
            //Associated Events
            return ioProdDowntime.associatedProductionEvents.results.length > 1
              ? this.appComponent.oBundle.getText("OEE_LABEL_MULTIPLE")
              : ioProdDowntime.associatedProductionEvents.results[0]
                  .productionEvent.nodeDescription;
          }
        }
        return obj1;
      },

      assignedToOrderButtonFormatter: function (obj1, orderReferences) {
        var count = 0;
        if (
          orderReferences != undefined &&
          orderReferences.results != undefined &&
          orderReferences.results.length > 0
        ) {
          if (orderReferences.results.length == 1) {
            return sap.oee.ui.Formatter.formatOrderNumber(
              orderReferences.results[0].orderNumber,
              orderReferences.results[0].operationNumber
            );
          }
          for (var i = 0; i < orderReferences.results.length; i++) {
            if (orderReferences.results[i].isMappedRecord == true) {
              count++;
            }
          }
          if (count > 1 || count == 0) {
            return obj1;
          } else if (count == 1) {
            for (var i = 0; i < orderReferences.results.length; i++) {
              if (orderReferences.results[i].isMappedRecord == true) {
                return sap.oee.ui.Formatter.formatOrderNumber(
                  orderReferences.results[i].orderNumber,
                  orderReferences.results[i].operationNumber
                );
              }
            }
          }
        }
      },

      assignReasonCodeToBatch: function (oEvent) {
        var reasonCodeLink = oEvent.getSource();

        var oContextObject = oEvent.getSource().getBindingContext().getObject();

        var oEvents = oContextObject.aggregatedData.results;
        var eventsData = [];

        var dcElement =
          oContextObject.aggregatedData.results[0].ioProductionRunDowntime
            .dcElement; // Pick DCELement for a down

        var rcCode = {
          reasonCode: {},
        };

        var controllerReference = this.getView().getController();

        var callBack = function () {
          if (rcCode.reasonCode.reasonCode1 != undefined) {
            $.each(oEvents, function (index, obj) {
              var down = {};
              sap.oee.ui.Utils.convertReasonCodeDataObjectToRcFields(
                obj.ioProductionRunDowntime,
                rcCode.reasonCode
              );
              eventsData.push(obj.ioProductionRunDowntime);
            });

            var results = controllerReference.interfaces.updateDowntimeDataInBatch(
              eventsData
            );
            if (results.outputCode != undefined) {
              if (results.outputCode == 0) {
                sap.oee.ui.Utils.toast(
                  controllerReference.appComponent.oBundle.getText(
                    "OEE_MESSAGE_SUCCESSFUL_UPDATE"
                  )
                );
                controllerReference.checkForModeAndPopulateDowntimeTable();
              } else if (results.outputCode == 1) {
                sap.oee.ui.Utils.createMessage(
                  results.outputMessage,
                  sap.ui.core.MessageType.Error
                );
              }
            }
          }
        };

        var reasonCodeAttachedCallback = jQuery.proxy(
          this.reasonCodeAttached,
          this
        );

        if (oContextObject.nodeId != undefined) {
          sap.oee.ui.rcUtility.createReasonCodeToolPopup(
            this,
            reasonCodeLink,
            this.appData.client,
            this.appData.plant,
            oContextObject.nodeId,
            dcElement,
            rcCode,
            "reasonCode",
            undefined,
            callBack
          );
        }
      },

      rootCauseMachineButtonStyleFormatter: function (obj1, ioProdDowntime) {
        if (
          (ioProdDowntime.rootcauseMachines != undefined &&
            ioProdDowntime.rootcauseMachines.results != undefined &&
            ioProdDowntime.rootcauseMachines.results.length > 0) ||
          (ioProdDowntime.associatedProductionEvents != undefined &&
            ioProdDowntime.associatedProductionEvents.results != undefined &&
            ioProdDowntime.associatedProductionEvents.results.length > 0)
        ) {
          return sap.m.ButtonType.Accept;
        }
        return sap.m.ButtonType.Default;
      },

      showEventsComprisingMicroStoppages: function (oEvent) {
        if (this.attachedMachineEventsDialog == undefined) {
          this.attachedMachineEventsDialog = sap.ui.xmlfragment(
            "minorEventsFragment",
            "sap.oee.ui.fragments.minorEventsTable",
            this
          );
          this.getView().addDependent(this.attachedMachineEventsDialog);
        }

        var oContextObject = oEvent.getSource().getBindingContext().getObject();

        var oEvents = oContextObject.aggregatedData.results;
        var eventsData = {
          events: [],
        };

        $.each(oEvents, function (index, obj) {
          var down = {};
          down.totalDuration = obj.ioProductionRunDowntime.effectiveDuration;
          down.nodeDescription = oContextObject.nodeDescription;
          down.reasonCodeDescription = oContextObject.reasonCodeDescription;
          down.downtimeRecord = obj.ioProductionRunDowntime;
          eventsData.events.push(down);
        });

        var eventsModel = new sap.ui.model.json.JSONModel();

        if (eventsData.events != undefined) {
          if (eventsData.events.length != 0) {
            eventsModel.setData({
              aggregatedDowns: eventsData.events,
            });
            this.attachedMachineEventsDialog.setModel(eventsModel);
            this.attachedMachineEventsDialog.open();
            return;
          }
        }

        this.attachedMachineEventsDialog.open();
      },

      formatImpactsLine: function (obj) {
        if (obj != undefined) {
          if (obj == "T") {
            return this.appComponent.oBundle.getText("OEE_LABEL_YES");
          } else {
            return this.appComponent.oBundle.getText("OEE_LABEL_NO");
          }
        }
      },

      initializeDownTime: function () {
        this.downtimeData = {};
        this.downtimeData.duration = "0";
        this.downtimeData.reasonCodeData = {};
        this.downtimeData.reasonCodeData.reasonCode1 = "";
        this.downtimeData.reasonCodeData.reasonCode2 = "";
        this.downtimeData.reasonCodeData.reasonCode3 = "";
        this.downtimeData.reasonCodeData.reasonCode4 = "";
        this.downtimeData.reasonCodeData.reasonCode5 = "";
        this.downtimeData.reasonCodeData.reasonCode6 = "";
        this.downtimeData.reasonCodeData.reasonCode7 = "";
        this.downtimeData.reasonCodeData.reasonCode8 = "";
        this.downtimeData.reasonCodeData.reasonCode9 = "";
        this.downtimeData.reasonCodeData.reasonCode10 = "";
        this.downtimeData.comments = "";
        this.downtimeData.actsAsBottleneck = false;
        this.downtimeData.startTime = undefined;
        this.downtimeData.endTime = undefined;
        this.downtimeData.startDate = undefined;
        this.downtimeData.endDate = undefined;
        if (this.appData.selected.order.crewSize) {
          this.downtimeData.crewSize = this.appData.selected.order.crewSize;
        } else {
          this.downtimeData.crewSize = "";
        }

        this.downtimeData.standardDuration = "";
        this.downtimeData.fromMaterial = "";
        this.downtimeData.toMaterial = "";
        this.workUnitIsBottleNeck = "";
        this.workUnitType = "";
        this.fromMaterial = "";
        this.toMaterial = "";
        if (this.appData.node.crewSize) {
          this.downtimeData.appDataCrewSize = this.appData.node.crewSize;
        }
        this.downtimeData.orderAssign = "";
        this.downtimeData.microStoppages = false;
        this.downtimeData.frequency = "";
        this.downtimeData.eventType = "";
        this.initializeDowntimewithPMNotification(); //
        // sap.ui.core.Fragment.byId("downtimeDialog", "downtimeDialog").setContentHeight("52%"); //

        //Fill Default DC Element
        if (this.dataCollectionElementsList == undefined) {
          if (this.appData.dcElementForUD == undefined) {
            this.appData.dcElementForUD = this.interfaces.getUnscheduledDowntimes();
            var eventsData = this.appData.dcElementForUD;
          } else {
            var eventsData = this.appData.dcElementForUD;
          }
          if (eventsData != undefined) {
            if (eventsData.dataCollectionElements != undefined) {
              if (eventsData.dataCollectionElements.results != undefined) {
                if (eventsData.dataCollectionElements.results.length > 1) {
                  showLink = true;
                }
                this.dataCollectionElementsList =
                  eventsData.dataCollectionElements.results;
              }
            }
          }
        }

        if (this.dataCollectionElementsList != undefined) {
          for (var i = 0; i < this.dataCollectionElementsList.length; i++) {
            if (
              this.dataCollectionElementsList[i].defaultDataCollectionElement ==
              true
            ) {
              this.defaultDcElement = this.dataCollectionElementsList[
                i
              ].dcElement;
              this.defaultDcElementDescription = this.dataCollectionElementsList[
                i
              ].description;
            }
          }
        }
      },

      prepareWorkUnitDialog: function () {
        if (this.oWorkUnitDialog == undefined) {
          this.oWorkUnitDialog = sap.ui.xmlfragment(
            "workUnitToolPopupForDowntime",
            "sap.oee.ui.fragments.workunitToolPopup",
            this
          );
          this.oWorkUnitDialog.addStyleClass("oeeComponent");
          this.oList = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "workUnitToolPopupForDowntime",
                "idProductsList"
              )
            );
          this.oNavBtn = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "workUnitToolPopupForDowntime",
                "machineGroupNavBtn"
              )
            );
          this.oInfo = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "workUnitToolPopupForDowntime",
                "oMachineGroupTitle"
              )
            );
          this.oSearch = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "workUnitToolPopupForDowntime",
                "searchWorkunit"
              )
            );
          this.workUnitTypesSelection = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "workUnitToolPopupForDowntime",
                "workUnitTypes"
              )
            );
          this.workUnitTypeCapacities = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "workUnitToolPopupForDowntime",
                "WorkUnitCapacities"
              )
            );
          this.workUnitTypeSimple = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "workUnitToolPopupForDowntime",
                "WorkUnit"
              )
            );
          this.workUnitDialogOkButton = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "workUnitToolPopupForDowntime",
                "okButton"
              )
            );
          this.oWorkUnitDialog.setTitle(
            this.appComponent.oBundle.getText("OEE_LABEL_REPORT_DOWNTIME")
          );
          this.getView().addDependent(this.oWorkUnitDialog);

          if (
            this.appData.node.lineBehavior == "MULTI_CAP_SINGLE_LINE" ||
            this.appData.node.lineBehavior ==
              "MULTI_CAP_SINGLE_LINE_REP_WITH_MULTIPLIER"
          ) {
            this.workUnitTypeCapacities.setSelected(true);
            this.workUnitDialogOkButton.setVisible(true);
            this.workUnitCapacitiesSelection = true;
          } else {
            this.workUnitTypeSimple.setSelected(true);
            this.workUnitTypesSelection.setVisible(false);
            this.workUnitDialogOkButton.setVisible(false);
            this.workUnitCapacitiesSelection = false;
          }
          // fetching workunit and binding to workunit dialog.
          // Preparing array of objects with all the machine groups with the associated machines
          if (this.plantHierarchyNodesList == undefined) {
            this.oWorkUnitDialog.setBusy(true);

            if (this.appData.selected.runID != undefined) {
              if (
                this.appData.dcElementListDowntime == undefined ||
                this.appData.dcElementListDowntime == ""
              ) {
                this.appData.dcElementListDowntime = this.interfaces.getDCElementsForDowntimes();
                this.dcElementList = this.appData.dcElementListDowntime;
                this.downtimeDCElementList = this.dcElementList;
                //this.dcElementList.dataCollectionElements.results = this.dcElementList.dataCollectionElements.results.concat
              } else {
                this.dcElementList = this.appData.dcElementListDowntime;
                this.downtimeDCElementList = this.dcElementList;
              }
              if (this.dcElementList.dataCollectionElements != undefined) {
                for (
                  var i = 0;
                  i < this.dcElementList.dataCollectionElements.results.length;
                  i++
                ) {
                  if (
                    this.dcElementList.dataCollectionElements.results[i]
                      .defaultDataCollectionElement
                  ) {
                    this.downtimeData.dcElement = this.dcElementList.dataCollectionElements.results[
                      i
                    ].dcElement;
                    this.downtimeData.eventType = this.dcElementList.dataCollectionElements.results[
                      i
                    ].timeElementType;
                    break;
                  }
                }
              }
            }
            if (this.appData.PHNodeDataForDowntimeScreen == undefined) {
              this.appData.PHNodeDataForDowntimeScreen = this.interfaces.getNodeAndImmediateChildrenDetails(
                this.appData.node.nodeID,
                this.appData.selected.operationNo,
                this.appData.selected.material.id,
                this.appData.selected.runID,
                this.downtimeData.dcElement
              );
              var phNodesData = this.appData.PHNodeDataForDowntimeScreen;
            } else {
              var phNodesData = this.appData.PHNodeDataForDowntimeScreen;
            }
            this.machineGroups = [];
            var matgroups = this.machineGroups;
            if (phNodesData != undefined) {
              if (phNodesData.details != undefined) {
                if (phNodesData.details.results != undefined) {
                  this.plantHierarchyNodesList = phNodesData.details.results;
                  $.each(phNodesData.details.results, function (index, obj) {
                    obj.reasonCodeData = {};
                    if (obj.assignedMachineGroup != undefined) {
                      if (
                        obj.assignedMachineGroup.results != undefined &&
                        obj.assignedMachineGroup.results.length > 0
                      ) {
                        $.each(
                          obj.assignedMachineGroup.results,
                          function (index1, obj1) {
                            var matchedList = $.grep(
                              matgroups,
                              function (element, elementindex) {
                                if (
                                  element.machineGroup.machineGroup ==
                                  obj1.machineGroup
                                )
                                  return element;
                              }
                            );
                            if (matchedList.length > 0) {
                              $.each(
                                matchedList,
                                function (matchedListIndex, matchedObject) {
                                  matchedObject.machineGroup.nodes.push(
                                    phNodesData.details.results[index]
                                  );
                                }
                              );
                              return;
                            } else {
                              obj1.nodes = [phNodesData.details.results[index]];
                              matgroups.push({
                                machineGroup: obj1,
                              });
                            }
                          }
                        );
                      }
                    }
                  });
                }
              }
            }
          }

          // Preparing a common array of objects to hold Line , Machine Groups and Unassigned Machines
          this.workUnitData = [];
          this.workUnitCapacityData = [];
          var workUnitList = this.workUnitData;

          if (matgroups != undefined && matgroups.length > 0) {
            for (i = 0; i < matgroups.length; i++) {
              var workUnitTemp = {};
              workUnitTemp.description =
                matgroups[i].machineGroup.machineGroupDescription;
              workUnitTemp.name = matgroups[i].machineGroup.machineGroup;
              workUnitTemp.machineGroup = matgroups[i].machineGroup;
              workUnitTemp.bottleNeck = false;
              this.workUnitData.push(workUnitTemp);
            }
          }

          if (this.plantHierarchyNodesList !== undefined) {
            var getNodeAndChildrenDetails = this.plantHierarchyNodesList;
            for (var i = 0; i < getNodeAndChildrenDetails.length; i++) {
              var workUnitTemp = {};
              var techObject = [];
              workUnitTemp.nodeId = getNodeAndChildrenDetails[i].nodeId;
              workUnitTemp.description =
                getNodeAndChildrenDetails[i].description;
              workUnitTemp.name = getNodeAndChildrenDetails[i].name;
              workUnitTemp.nodeType = getNodeAndChildrenDetails[i].type;
              workUnitTemp.machineGroup = undefined;
              workUnitTemp.bottleNeck = getNodeAndChildrenDetails[i].bottleNeck;
              workUnitTemp.capacityID = getNodeAndChildrenDetails[i].capacityID;
              workUnitTemp.isCapacity = getNodeAndChildrenDetails[i].isCapacity;

              var tObject =
                getNodeAndChildrenDetails[i].assignedTechnicalObjects.results;
              if (tObject !== undefined && tObject.length > 0) {
                for (var j = 0; j < tObject.length; j++) {
                  var techObj = {};
                  techObj.flocID = tObject[j].flocID;
                  techObj.equipmentID = tObject[j].equipmentID;
                  techObject.push(techObj);
                }
              }
              workUnitTemp.technicalObject = techObject;

              if (
                (this.appData.node.lineBehavior == "MULTI_CAP_SINGLE_LINE" ||
                  this.appData.node.lineBehavior ==
                    "MULTI_CAP_SINGLE_LINE_REP_WITH_MULTIPLIER") &&
                workUnitTemp.isCapacity === true
              ) {
                this.workUnitCapacityData.push(workUnitTemp);
              } else {
                this.workUnitData.push(workUnitTemp);
              }
            }
          }

          // oFilterMachineGroup is used to handle Filter on Machine Groups or Machines
          var oFilterMachineGroup = true;
        }
      },

      handleDeletionOfMicroStoppages: function (oEvent) {
        var oController = this.getView().getController();
        var deleteAfterConfirm = function (bConfirm) {
          if (bConfirm == sap.m.MessageBox.Action.OK) {
            var oDetailsTable = sap.ui
              .getCore()
              .byId(
                sap.ui.core.Fragment.createId(
                  "minorEventsFragment",
                  "eventsTable"
                )
              );
            var data = oController.attachedMachineEventsDialog
              .getModel()
              .getData();
            var aSelectedContextObjects = oDetailsTable.getSelectedContexts();

            var jsonContextObjects = sap.oee.ui.Utils.convertContextToJSONObjects(
              aSelectedContextObjects
            );
            var downs = [];

            $.each(jsonContextObjects, function (index, obj) {
              downs.push(obj.downtimeRecord);
            });

            var response = oController.interfaces.deleteDowntimeDataInBatch(
              downs
            );

            if (response != undefined) {
              if (response.outputCode == 0) {
                sap.oee.ui.Utils.toast(
                  oController.appComponent.oBundle.getText("OEE_LABEL_DELETED")
                );

                oDetailsTable.removeSelections(true);
                var matchedList = $.grep(
                  data.aggregatedDowns,
                  function (element, elementindex) {
                    var i;
                    for (i in aSelectedContextObjects) {
                      var downID = aSelectedContextObjects[i].getObject()
                        .downtimeRecord.downID;
                      if (element.downtimeRecord.downID === downID)
                        return false;
                      else continue;
                    }
                    return true;
                  }
                );
                if (matchedList.length == 0) {
                  oController.attachedMachineEventsDialog.close();
                }

                oController.attachedMachineEventsDialog.getModel().setData({
                  aggregatedDowns: matchedList,
                });
                oController.attachedMachineEventsDialog
                  .getModel()
                  .checkUpdate();
                oController.attachedMachineEventsDialog.rerender();
                oController.checkForModeAndPopulateDowntimeTable();
              }
            }
            if (oDetailsTable.getSelectedItems().length > 0) {
              sap.ui
                .getCore()
                .byId(
                  sap.ui.core.Fragment.createId(
                    "minorEventsFragment",
                    "deleteButton"
                  )
                )
                .setEnabled(true);
            } else {
              sap.ui
                .getCore()
                .byId(
                  sap.ui.core.Fragment.createId(
                    "minorEventsFragment",
                    "deleteButton"
                  )
                )
                .setEnabled(false);
            }
          }
        };

        sap.m.MessageBox.confirm(
          this.appComponent.oBundle.getText("OEE_MESSAGE_DELETE"),
          deleteAfterConfirm
        );
      },

      onSelectEnableDeleteButtonForMicroStoppages: function () {
        var oDetailsTable = sap.ui
          .getCore()
          .byId(
            sap.ui.core.Fragment.createId("minorEventsFragment", "eventsTable")
          );
        if (oDetailsTable.getSelectedItems().length > 0) {
          sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "minorEventsFragment",
                "deleteButton"
              )
            )
            .setEnabled(true);
        } else {
          sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "minorEventsFragment",
                "deleteButton"
              )
            )
            .setEnabled(false);
        }
      },

      onPressReportDowntime: function (oEvent) {
        this.byId("downtimesTable").removeSelections();
        this.byId("microDowntimesTable").removeSelections();
        this.byId("EditButtonForDowntime").setEnabled(false);
        this.byId("deleteButtonForDowntime").setEnabled(false);
        this.byId("splitButtonForDowntime").setEnabled(false);
        this.byId("reportButtonForNotification").setEnabled(false);
        this.downtimeMode = "New";
        if (this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.FLOWTIME) {
          var nodeDataList = [];
          var nodeDataTemp = {};
          nodeDataTemp.nodeID = this.appData.node.nodeID;
          nodeDataTemp.nodeDescription = this.appData.node.description;
          nodeDataTemp.nodeType = "LINE";
          nodeDataList.push(nodeDataTemp);
          this.downtimeData.nodeDataList = nodeDataList;
          this.initializeDowntimeDialog();
          this.getAndBindDCElementToDowntimeType();
          this.changeMarkLineDownVisibility();
          this.handleOkForReasonCodeDialog();
        } else {
          if (this.machineGroups != undefined) {
            var actsAsBottleneckLabel = sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "bottleneckForDowntimeLabel"
            );
            this.oModel = new sap.ui.model.json.JSONModel();

            if (
              this.appData.node.lineBehavior == "MULTI_CAP_SINGLE_LINE" ||
              this.appData.node.lineBehavior ==
                "MULTI_CAP_SINGLE_LINE_REP_WITH_MULTIPLIER"
            ) {
              workUnits = this.workUnitCapacityData;
              this.oModel.setData({
                modelData: workUnits,
              });
              this.workUnitTypeCapacities.setSelected(true);
              this.workUnitDialogOkButton.setVisible(true);
              this.workUnitCapacitiesSelection = true;
              this.bindCapacities();
            } else {
              workUnits = this.workUnitData;
              this.oModel.setData({
                modelData: workUnits,
              });
              this.oModel.setSizeLimit(10000);
              this.workUnitDialogOkButton.setVisible(false);
              this.bindMachineGroup();
            }

            this.oWorkUnitDialog.setBusy(false);
          }
          this.oWorkUnitDialog.open();
        }
      },

      bindMachineGroup: function (oFilterValue) {
        oFilterMachineGroup = true;
        this.oInfo.setText("");
        this.oIndexCounter = -1;
        this.oNavBtn.setVisible(false);
        this.oList.setModel(this.oModel);
        var oBindingInfo = {};
        oBindingInfo.path = "/modelData";
        oBindingInfo.factory = jQuery.proxy(function (sId, oContext) {
          var oMachineGroupTitle = oContext.getProperty("description");
          var oType = "";
          this.oIndexCounter++;
          if (oContext.getProperty("machineGroup") == undefined) {
            oType = "Active";
          } else {
            oType = "Navigation";
          }
          if (oContext.getProperty("bottleNeck") == true) {
            var oTemplate = new sap.m.StandardListItem({
              title: oMachineGroupTitle,
              type: oType,
              press: jQuery.proxy(function (oEvent) {
                this.getChildrens(oEvent);
              }, this),
            }).addStyleClass("bottleNeckMachine");
          } else {
            var oTemplate = new sap.m.StandardListItem({
              title: oMachineGroupTitle,
              type: oType,
              press: jQuery.proxy(function (oEvent) {
                this.getChildrens(oEvent); ////
              }, this),
            });
          }
          return oTemplate;
        }, this);
        if (oFilterValue != undefined) {
          oBindingInfo.filters = oFilterValue;
        }
        this.oList.bindAggregation("items", oBindingInfo);
        this.oList.setMode(sap.m.ListMode.None);
        this.oList.rerender();
      },

      getChildrens: function (oEvent) {
        var srcType = oEvent.getSource().getType();
        if (srcType == "Active") {
          this.handleOKForWorkunitDialog(oEvent);
        } else {
          var machineGroupsLength = this.machineGroups.length;
          for (i = 0; i < machineGroupsLength; i++) {
            if (
              this.machineGroups[i].machineGroup.machineGroup ==
              oEvent.getSource().getBindingContext().getObject().machineGroup
                .machineGroup
            ) {
              var getNodeAndChildrenDetails = this.machineGroups[i].machineGroup
                .nodes;
              this.oInfo.setText(
                this.machineGroups[i].machineGroup.machineGroupDescription
              );
            }
          }
          this.nodes = [];
          var machines = this.nodes;
          if (getNodeAndChildrenDetails != undefined) {
            for (var i = 0; i < getNodeAndChildrenDetails.length; i++) {
              machines.push(getNodeAndChildrenDetails[i]);
            }
            if (machines != undefined) {
              var oModel1 = new sap.ui.model.json.JSONModel();
              oModel1.setData({
                modelData: machines,
              });
              this.oList.unbindAggregation("items");
              this.oList.setModel(oModel1);
            }
          }
          this.bindMachine();
        }
      },

      bindMachine: function () {
        oFilterMachineGroup = false;
        this.oNavBtn.setVisible(true);
        var oBindingInfo = {};
        oBindingInfo.path = "/modelData";
        oBindingInfo.factory = jQuery.proxy(function (sId, oContext) {
          var oDesc = oContext.getProperty("description");
          if (oContext.getProperty("bottleNeck") == true) {
            var oTemplate = new sap.m.StandardListItem({
              title: oDesc,
              type: "Active",
              press: [this.handleOKForWorkunitDialog, this],
            }).addStyleClass("bottleNeckMachine");
          } else {
            var oTemplate = new sap.m.StandardListItem({
              title: oDesc,
              type: "Active",
              press: [this.handleOKForWorkunitDialog, this],
            });
          }
          return oTemplate;
        }, this);
        this.oList.bindAggregation("items", oBindingInfo);
        this.oList.rerender();
      },

      bindCapacities: function (oFilterValue) {
        oFilterMachineGroup = true;
        this.oInfo.setText("");
        this.oIndexCounter = -1;
        this.oNavBtn.setVisible(false);
        //Create new model for capacities here
        this.oList.setModel(this.oModel);
        var oBindingInfo = {};
        oBindingInfo.path = "/modelData";
        oBindingInfo.factory = jQuery.proxy(function (sId, oContext) {
          var oMachineGroupTitle = oContext.getProperty("description");
          var oTemplate = new sap.m.StandardListItem({
            title: oMachineGroupTitle, // set description here
            type: "Active",
          });
          return oTemplate;
        }, this);
        if (oFilterValue != undefined) {
          oBindingInfo.filters = oFilterValue;
        }
        this.oList.bindAggregation("items", oBindingInfo);
        this.oList.setMode(sap.m.ListMode.MultiSelect);
        this.oList.rerender();
      },

      navToMachineGroup: function () {
        this.oSearch.setValue("");
        this.oList.unbindAggregation("items");
        this.oNavBtn.setVisible(false);
        this.bindMachineGroup();
      },

      handleWorkUnitClose: function () {
        oFilterMachineGroup = true;
        this.oSearch.setValue("");
        this.oWorkUnitDialog.close();
      },

      handleSearch: function (oEvent) {
        var properties = [];
        properties.push("description");
        sap.oee.ui.Utils.fuzzySearch(
          this,
          this.oModel,
          oEvent.getSource().getValue(),
          this.oList.getBinding("items"),
          oEvent.getSource(),
          properties
        );
      },

      onChangeType: function (oEvent) {
        /*warningMessagePopup flag is added to track and close the second warning dialog which opens while selecting
         *  from unplanned to changeover type in Edit Downtime Dialog if there are no from and to materials found  */
        var warningMessagePopup = "",
          startDate,
          startTime,
          startDateTime,
          endDate,
          endTime,
          endDateTime;
        var type = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "typeforDowntime"
        );
        var reasonCode = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "reasonCodeforDowntime"
        );
        reasonCode.setValue("");

        var selectedDcElement = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "typeforDowntime"
        ).getSelectedKey();
        // Check and update the eventType on Change of Type and all the comparison has to be done based on Time Element Type rather that dcElement
        if (this.dcElementList.dataCollectionElements.results.length > 0) {
          for (
            var i = 0;
            i < this.dcElementList.dataCollectionElements.results.length;
            i++
          ) {
            if (
              this.dcElementList.dataCollectionElements.results[i].dcElement ==
              selectedDcElement
            ) {
              this.downtimeData.eventType = this.dcElementList.dataCollectionElements.results[
                i
              ].timeElementType;
            }
          }
        }
        if (
          this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
          this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.changeOver ||
          this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
        ) {
          this.downtimeData.crewSize = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "crewSizeforDowntime"
          ).getValue();
        }
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
        ) {
          this.downtimeData.standardDuration = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "standardDurationforDowntime"
          ).getValue();
        }

        /*if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === sap.oee.ui.oeeConstants.dcElementType.unplanned || 
     sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === sap.oee.ui.oeeConstants.dcElementType.changeover){
       this.downtimeData.crewSize = sap.ui.core.Fragment.byId("downtimeDialog", "crewSizeforDowntime").getValue();
  }
    
  if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === sap.oee.ui.oeeConstants.dcElementType.planned){
    this.downtimeData.standardDuration = sap.ui.core.Fragment.byId("downtimeDialog", "standardDurationforDowntime").getValue(); 
  }
  */

        // Changes are added Later Due to changes related to Duration Based and Micro Stoppages Downtime Reporting.PM should be disable for duration and micro stoppages downtime

        /*if (sap.ui.core.Fragment.byId("downtimeDialog", "checkPMNotification").getSelected() == true) {
          sap.ui.core.Fragment.byId("downtimeDialog", "functionalLocation").setVisible(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(true);

          if (this.notificationType && this.notificationType.length > 0) {
              if (this.notificationType.length === 1) {
                  sap.ui.core.Fragment.byId("downtimeDialog", "SinglePMNotificationType").setVisible(true);
                  sap.ui.core.Fragment.byId("downtimeDialog", "MultiPMNotificationType").setVisible(false);
                  this.notificationData.notificationType = this.notificationType[0].value;
              } else {
                  sap.ui.core.Fragment.byId("downtimeDialog", "SinglePMNotificationType").setVisible(false);
                  sap.ui.core.Fragment.byId("downtimeDialog", "MultiPMNotificationType").setVisible(true);
                  sap.ui.core.Fragment.byId("downtimeDialog", "MultiValue").setSelectedKey(this.notificationType[0].value);
                  this.notificationData.notificationTypes = this.notificationType;

              }
          }

      } else {
          sap.ui.core.Fragment.byId("downtimeDialog", "functionalLocation").setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "SinglePMNotificationType").setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "MultiPMNotificationType").setVisible(false);
      }*/

        startDate = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startDate"
        ).getDateValue();
        startTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        ).getDateValue();

        startDateTime = this.getDateObjectFromUI(startDate, startTime);
        if (startDateTime != undefined && startDateTime != "") {
          this.downtimeData.startDate = startDateTime;
          this.downtimeData.startTime = startDateTime;
          this.downtimeData.startTimeStamp = startDateTime.getTime();

          endDate = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "endDate"
          ).getDateValue();
          endTime = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "endTime"
          ).getDateValue();

          endDateTime = this.getDateObjectFromUI(endDate, endTime);
          var duration = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "durationforDowntime"
          ).getValue();

          if (endDateTime != undefined && endDateTime != "") {
            this.downtimeData.endDate = endDateTime;
            this.downtimeData.endTime = endDateTime;
            this.downtimeData.endTimeStamp = endDateTime.getTime();

            if (
              this.downtimeData.endTimeStamp < this.downtimeData.startTimeStamp
            ) {
              sap.oee.ui.Utils.createMessage(
                this.appComponent.oBundle.getText(
                  "START_TIME_GREATER_THAN_END_TIME_ERROR"
                ),
                sap.ui.core.MessageType.Error
              );
              return;
            }
          }
        }
        var comments = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "commentsForDowntime"
        ).getValue();
        if (comments != undefined && comments != "") {
          this.downtimeData.comments = comments;
        }
        var actsAsBottleneck = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "bottleneckForDowntime"
        ).getSelected();
        if (actsAsBottleneck != undefined && actsAsBottleneck != "") {
          this.downtimeData.actsAsBottleneck = actsAsBottleneck;
        }

        this.downtimeData.dcElement = type.getSelectedKey();

        // if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === sap.oee.ui.oeeConstants.dcElementType.changeover){
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.changeOver
        ) {
          this.downtimeData.selectedFromMaterial = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "fromMaterialforDowntime"
          ).getValue();
          if (
            this.downtimeData.selectedFromMaterial === "" ||
            this.downtimeData.selectedFromMaterial === undefined
          ) {
            if (this.downtimeData.startTimeStamp) {
              var fromMat = {};
              fromMat.materials = [];
              var startTimestampUTC = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                this.downtimeData.startTimeStamp,
                this.appData.plantTimezoneOffset
              );
              this.fromMaterialsData = this.interfaces.GetMaterialsForChangeOverForActiveHoldCompleteRuns(
                this.appData.client,
                this.appData.plant,
                startTimestampUTC,
                this.appData.node.nodeID
              );
              if (this.fromMaterialsData.materialDetails.results.length > 0) {
                fromMat.materials = this.fromMaterialsData.materialDetails.results;
                if (
                  fromMat.materials.length > 1 &&
                  fromMat.materials[0].matnr ===
                    this.downtimeData.selectedToMaterial
                ) {
                  this.downtimeData.selectedFromMaterial =
                    fromMat.materials[1].matnr;
                } else {
                  this.downtimeData.selectedFromMaterial =
                    fromMat.materials[0].matnr;
                }
              } else {
                if (warningMessagePopup !== "X") {
                  warningMessagePopup = "X";
                  this.downtimeData.selectedFromMaterial = undefined;
                  sap.m.MessageBox.show(
                    this.appComponent.oBundle.getText(
                      "OEE_MSG_CHANGEOVER_CANNOT_BE_REPORTED"
                    ),
                    {
                      icon: sap.m.MessageBox.Icon.WARNING,
                      title: this.appComponent.oBundle.getText(
                        "OEE_HEADER_WARNING"
                      ),
                      actions: [sap.m.MessageBox.Action.OK],
                    }
                  );
                }
              }
            }
          }

          this.downtimeData.selectedToMaterial = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "toMaterialforDowntime"
          ).getValue();
          if (
            this.downtimeData.selectedToMaterial === "" ||
            this.downtimeData.selectedToMaterial === undefined
          ) {
            if (
              this.downtimeData.endTimeStamp &&
              this.downtimeData.startTimeStamp
            ) {
              var toMat = {};
              toMat.materials = [];
              var endTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                this.downtimeData.endTimeStamp,
                this.appData.plantTimezoneOffset
              );
              this.toMaterialsData = this.interfaces.GetToMaterialsForChangeOverForActiveHoldCompleteRuns(
                this.appData.client,
                this.appData.plant,
                endTimestamp,
                this.appData.node.nodeID
              );
              if (this.toMaterialsData.materialDetails.results.length > 0) {
                toMat.materials = this.toMaterialsData.materialDetails.results;
                if (
                  toMat.materials.length > 1 &&
                  toMat.materials[0].matnr ===
                    this.downtimeData.selectedFromMaterial
                ) {
                  this.downtimeData.selectedToMaterial =
                    toMat.materials[1].matnr;
                } else {
                  this.downtimeData.selectedToMaterial =
                    toMat.materials[0].matnr;
                }
              } else {
                if (warningMessagePopup !== "X") {
                  warningMessagePopup = "X";
                  this.downtimeData.selectedToMaterial = undefined;
                  sap.m.MessageBox.show(
                    this.appComponent.oBundle.getText(
                      "OEE_MSG_CHANGEOVER_CANNOT_BE_REPORTED"
                    ),
                    {
                      icon: sap.m.MessageBox.Icon.WARNING,
                      title: this.appComponent.oBundle.getText(
                        "OEE_HEADER_WARNING"
                      ),
                      actions: [sap.m.MessageBox.Action.OK],
                    }
                  );
                }
              }
            }
          }
        }
        this.downtimeData.reasonCodeData = {};
        if (this.downtimeData.reasonCodeData !== undefined) {
          this.dataForReasonCode = this.downtimeData.reasonCodeData;
        }

        if (
          this.dataForReasonCode &&
          this.downtimeData.reasonCodeData === undefined
        ) {
          this.oDowntimeReportingModel.oData.downtimeDataForModel.reasonCodeData = this.dataForReasonCode;
        }
        sap.oee.ui.Utils.updateModel(this.oDowntimeReportingModel);

        this.openReasonCodeToolPopup();
      },

      getDateObjectFromUI: function (dateInput, timeInput) {
        var combinedDateTimeObject;
        if (dateInput && timeInput && dateInput != "" && timeInput != "") {
          combinedDateTimeObject = sap.oee.ui.Utils.createTimestampFromDateTime(
            dateInput,
            timeInput
          );
        }
        return combinedDateTimeObject;
      },

      handleOKForWorkunitDialog: function (oEvent) {
        if (this.workUnitCapacitiesSelection) {
          var selectedItems = this.oList.getSelectedItems();
          if (selectedItems != undefined && selectedItems.length > 0) {
            var nodeDataList = [];
            for (var i = 0; i < selectedItems.length; i++) {
              var nodeDataTemp = {};

              nodeDataTemp.nodeID = this.oList
                .getSelectedItems()
                [i].getBindingContext()
                .getObject().nodeId;
              nodeDataTemp.nodeDescription = this.oList
                .getSelectedItems()
                [i].getBindingContext()
                .getObject().description;
              nodeDataTemp.nodeType = this.oList
                .getSelectedItems()
                [i].getBindingContext()
                .getObject().nodeType;
              nodeDataTemp.bottleNeck = this.oList
                .getSelectedItems()
                [i].getBindingContext()
                .getObject().bottleNeck;
              nodeDataTemp.capacityID = this.oList
                .getSelectedItems()
                [i].getBindingContext()
                .getObject().capacityID;
              nodeDataTemp.isCapacity = this.oList
                .getSelectedItems()
                [i].getBindingContext()
                .getObject().isCapacity;
              nodeDataList.push(nodeDataTemp);
            }
            this.downtimeData.nodeDataList = nodeDataList;
          }
        } else {
          var nodeDataList = [];
          if (oEvent.getSource().getBindingContext().getObject() != undefined) {
            var nodeDataTemp = {};
            nodeDataTemp.nodeID = oEvent
              .getSource()
              .getBindingContext()
              .getObject().nodeId;
            nodeDataTemp.nodeDescription = oEvent
              .getSource()
              .getBindingContext()
              .getObject().description;
            nodeDataTemp.nodeType = oEvent
              .getSource()
              .getBindingContext()
              .getObject().nodeType;
            nodeDataTemp.bottleNeck = oEvent
              .getSource()
              .getBindingContext()
              .getObject().bottleNeck;
            nodeDataTemp.technicalObject = oEvent
              .getSource()
              .getBindingContext()
              .getObject().technicalObject;
            nodeDataTemp.capacityID = oEvent
              .getSource()
              .getBindingContext()
              .getObject().capacityID;
            nodeDataTemp.isCapacity = oEvent
              .getSource()
              .getBindingContext()
              .getObject().isCapacity;
            nodeDataList.push(nodeDataTemp);
            this.downtimeData.nodeDataList = nodeDataList;
          }
        }
        if (!this.workUnitCapacitiesSelection) {
          this.workUnitIsBottleNeck = oEvent
            .getSource()
            .getBindingContext()
            .getObject().bottleNeck; //Used in Changeover
          this.workUnitType = oEvent
            .getSource()
            .getBindingContext()
            .getObject().nodeType;
        }
        this.handleWorkUnitClose();
        this.initializeDowntimeDialog();
        this.getAndBindDCElementToDowntimeType();
        this.changeMarkLineDownVisibility();
        this.openReasonCodeToolPopup();
      },

      initializeDowntimeDialog: function () {
        if (this.oDowntimeDialog == undefined) {
          this.oDowntimeDialog = sap.ui.xmlfragment(
            "downtimeDialog",
            "sap.oee.ui.fragments.downtimeDialog",
            this
          );
          this.byId(
            sap.ui.core.Fragment.createId("downtimeDialog", "startTime")
          );
          this.byId(sap.ui.core.Fragment.createId("downtimeDialog", "endTime"));
          this.byId(
            sap.ui.core.Fragment.createId("downtimeDialog", "startDate")
          );
          this.byId(sap.ui.core.Fragment.createId("downtimeDialog", "endDate"));
          this.byId(
            sap.ui.core.Fragment.createId(
              "downtimeDialog",
              "durationforDowntime"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId("downtimeDialog", "typeforDowntime")
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "downtimeDialog",
              "commentsForDowntime"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "downtimeDialog",
              "bottleneckForDowntime"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "downtimeDialog",
              "bottleneckForDowntimeLabel"
            )
          );
          this.getView().addDependent(this.oDowntimeDialog);
        } else {
          sap.ui.core.Fragment.byId("downtimeDialog", "startTime").setEnabled(
            true
          );
          sap.ui.core.Fragment.byId("downtimeDialog", "endTime").setEnabled(
            true
          );
          sap.ui.core.Fragment.byId("downtimeDialog", "startDate").setEnabled(
            true
          );
          sap.ui.core.Fragment.byId("downtimeDialog", "endDate").setEnabled(
            true
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "durationforDowntime"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "setCurrentForStartTime"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "setCurrentForEndTime"
          ).setEnabled(true);
        }
      },

      changeMarkLineDownVisibility: function () {
        if (this.downtimeData.nodeDataList != undefined) {
          var actsAsBottleneckLabel = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "bottleneckForDowntimeLabel"
          );
          var actsAsBottleneck = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "bottleneckForDowntime"
          );
          if (this.downtimeData.nodeDataList.length > 1) {
            actsAsBottleneckLabel.setVisible(true);
            actsAsBottleneck.setVisible(true);
            actsAsBottleneck.setEnabled(false);
          } else {
            if (this.downtimeData.nodeDataList[0].nodeType == "LINE") {
              actsAsBottleneckLabel.setVisible(true);
              actsAsBottleneck.setVisible(true);
              actsAsBottleneck.setEnabled(false);
            } else if (
              this.downtimeData.nodeDataList[0].nodeType == "MACHINE" &&
              this.downtimeData.nodeDataList[0].bottleNeck == false &&
              this.downtimeData.nodeDataList[0].isCapacity === false
            ) {
              actsAsBottleneckLabel.setVisible(true);
              actsAsBottleneck.setVisible(true);
              actsAsBottleneck.setEnabled(true);
            } else if (
              (this.downtimeData.nodeDataList[0].nodeType == "MACHINE" &&
                this.downtimeData.nodeDataList[0].bottleNeck == true) ||
              this.downtimeData.nodeDataList[0].isCapacity === true
            ) {
              actsAsBottleneckLabel.setVisible(true);
              actsAsBottleneck.setVisible(true);
              actsAsBottleneck.setEnabled(false);
            }
          }
        }
      },

      getAndBindDCElementToDowntimeType: function () {
        if (this.flowTimeDCElementList == undefined) {
          this.flowTimeDCElementList = this.interfaces.getDCElementsForFlowTime();
        }
        if (this.downtimeDCElementList == undefined) {
          this.downtimeDCElementList = this.interfaces.getDCElementsForDowntimes();
        }
        if (this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.FLOWTIME) {
          this.dcElementList = this.flowTimeDCElementList;
          if (this.dcElementList.dataCollectionElements != undefined) {
            this.downtimeData.dcElement = this.dcElementList.dataCollectionElements.results[0].dcElement;
            this.downtimeData.eventType = this.dcElementList.dataCollectionElements.results[0].timeElementType;
          }
        } else if (
          this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.OTHERS
        ) {
          var allowedDCElementList = sap.oee.ui.Utils.getActivityOptionValues(
            this.getView().getViewData().viewOptions,
            "OTHER_REP_DCELEMS"
          );

          if (allowedDCElementList && allowedDCElementList.length > 0) {
            var dcElemList = [];
            var appData = this.appData;
            $.each(allowedDCElementList, function (index, obj) {
              dcElemList[index] = {
                client: appData.client,
                dcElement: allowedDCElementList[index].optionValue,
              };
            });

            this.dcElementList = this.interfaces.getDCElementDetails(
              dcElemList
            );

            if (this.dcElementList.dataCollectionElements != undefined) {
              this.downtimeData.dcElement = this.dcElementList.dataCollectionElements.results[0].dcElement;
              this.downtimeData.eventType = this.dcElementList.dataCollectionElements.results[0].timeElementType;
            }
          }
        } else {
          this.dcElementList = this.downtimeDCElementList;
        }

        if (this.dcElementList.dataCollectionElements != undefined) {
          var type = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "typeforDowntime"
          );
          if (type != undefined) {
            type.removeAllItems();
          }

          for (
            var i = 0;
            i < this.dcElementList.dataCollectionElements.results.length;
            i++
          ) {
            //if(this.dcElementList.dataCollectionElements.results[i].dcElement !== sap.oee.ui.oeeConstants.dcElementType.changeover){
            if (
              this.dcElementList.dataCollectionElements.results[i]
                .timeElementType !==
              sap.oee.ui.oeeConstants.timeElementTypes.changeOver
            ) {
              if (this.downtimeMode == "Edit") {
                type.setSelectedKey(this.downtimeData.dcElement);
              } else if (this.downtimeMode == "New") {
                if (
                  this.dcElementList.dataCollectionElements.results[i]
                    .defaultDataCollectionElement
                ) {
                  this.downtimeData.dcElement = this.dcElementList.dataCollectionElements.results[
                    i
                  ].dcElement;
                  this.downtimeData.eventType = this.dcElementList.dataCollectionElements.results[
                    i
                  ].timeElementType;
                  type.setSelectedKey(this.downtimeData.dcElement);
                }
              }

              type.addItem(
                new sap.ui.core.Item({
                  text: this.dcElementList.dataCollectionElements.results[i]
                    .description,
                  key: this.dcElementList.dataCollectionElements.results[i]
                    .dcElement,
                })
              );
            } else {
              //if(this.dcElementList.dataCollectionElements.results[i].dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
              if (
                this.dcElementList.dataCollectionElements.results[i]
                  .timeElementType ===
                sap.oee.ui.oeeConstants.timeElementTypes.changeOver
              ) {
                if (
                  sap.oee.ui.Utils.workUnitSelectedIsCapacityMachine(
                    this.downtimeData
                  ) ||
                  this.workUnitType === sap.oee.ui.oeeConstants.lineType ||
                  this.setChangeOverType === "X"
                ) {
                  if (this.downtimeMode == "Edit") {
                    type.setSelectedKey(this.downtimeData.dcElement);
                  } else if (this.downtimeMode == "New") {
                    if (
                      this.dcElementList.dataCollectionElements.results[i]
                        .defaultDataCollectionElement
                    ) {
                      this.downtimeData.dcElement = this.dcElementList.dataCollectionElements.results[
                        i
                      ].dcElement;
                      this.downtimeData.eventType = this.dcElementList.dataCollectionElements.results[
                        i
                      ].timeElementType;
                      type.setSelectedKey(this.downtimeData.dcElement);
                    }
                  }
                  type.addItem(
                    new sap.ui.core.Item({
                      text: this.dcElementList.dataCollectionElements.results[i]
                        .description,
                      key: this.dcElementList.dataCollectionElements.results[i]
                        .dcElement,
                    })
                  );
                }
              }
            }
          }
        }
      },

      openReasonCodeToolPopup: function () {
        var callback = function () {
          var isReasonCodeSelectedFromPopUp = false; // Initially giving the value false to this variable
          if (oController.downtimeData != undefined) {
            if (oController.downtimeData.reasonCodeData != undefined) {
              var type = sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "typeforDowntime"
              );
              /*if (oController.downtimeData.reasonCodeData == "NOT SELECTED") { // skip assignment will revert dcelement selection
                                                                  oController.downtimeData.dcElement = type.getSelectedKey();
                                                  } else {
                                                                  type.setSelectedKey(oController.downtimeData.dcElement);
                                                  }*/
              type.setSelectedKey(oController.downtimeData.dcElement);
              oController
                .getView()
                .getController()
                .handleOkForReasonCodeDialog();
              isReasonCodeSelectedFromPopUp = true;
            }

            if (isReasonCodeSelectedFromPopUp === false) {
              if (oController.dataForReasonCode !== undefined) {
                oController.oDowntimeReportingModel.oData.downtimeDataForModel.reasonCodeData =
                  oController.dataForReasonCode;
              }
            }
          }
        };

        var tempButton = new sap.m.Button({
          visible: false,
        });

        sap.oee.ui.rcUtility.createReasonCodeToolPopupWithDCElement(
          this,
          tempButton,
          this.appData.client,
          this.appData.plant,
          this.downtimeData.nodeDataList[0].nodeID,
          this.downtimeData.dcElement,
          this.downtimeData,
          "reasonCodeData",
          undefined,
          this.dcElementList,
          callback,
          this.downtimeData.nodeDataList[0].nodeDescription
        );
      },

      handleOkForReasonCodeDialog: function () {
        var techObj1 = [];
        var actsAsBottleneckLabel = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "bottleneckForDowntimeLabel"
        );
        if (this.downtimeData.dcElement == undefined) {
          this.getAndBindDCElementToDowntimeType();
        } else {
          //add eventType for the corresponding dcElement
          for (
            var i = 0;
            i < this.dcElementList.dataCollectionElements.results.length;
            i++
          ) {
            if (this.dcElementList.dataCollectionElements.results.length) {
              if (
                this.dcElementList.dataCollectionElements.results[i]
                  .dcElement == this.downtimeData.dcElement
              ) {
                this.downtimeData.eventType = this.dcElementList.dataCollectionElements.results[
                  i
                ].timeElementType;
              }
            }
          }
        }
        //Adding the current running order detail in the object.If no order is running orderAssign value will be empty
        if (
          this.appData.selected.order != undefined ||
          this.appData.selected.order != ""
        ) {
          this.downtimeData.orderAssign = {
            orderNo: this.appData.selected.order.orderNo,
            operationNo: this.appData.selected.operationNo,
            runId: this.appData.selected.runID,
          };
        } else {
          this.downtimeData.orderAssign = "";
        }
        if (this.downtimeMode == "Edit") {
          this.downtimeData.firstFillField = "START_TIME";

          this.oDowntimeReportingModel = new sap.ui.model.json.JSONModel({
            downtimeDataForModel: this.downtimeData,
          });
          this.oDowntimeReportingModel.setDefaultBindingMode(
            sap.ui.model.BindingMode.TwoWay
          );
          this.oDowntimeReportingModel.setProperty(
            "/startTime",
            this.downtimeData.startTime
          );
          this.oDowntimeReportingModel.setProperty(
            "/endTime",
            this.downtimeData.endTime
          );
          this.oDowntimeReportingModel.setProperty(
            "/startDate",
            this.downtimeData.startDate
          );
          this.oDowntimeReportingModel.setProperty(
            "/endDate",
            this.downtimeData.endDate
          );

          this.oDowntimeDialog.setModel(this.oDowntimeReportingModel);
          this.oDowntimeDialog.setTitle(
            this.appComponent.oBundle.getText("OEE_LABEL_DOWNTIME_EDIT")
          );
        } else if (this.downtimeMode == "New") {
          //this.downtimeData.startTimeStamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(new Date().getTime());
          //this.downtimeData.firstFillField = "START_TIME";
          this.oDowntimeReportingModel = new sap.ui.model.json.JSONModel({
            downtimeDataForModel: this.downtimeData,
          });
          this.oDowntimeReportingModel.setDefaultBindingMode(
            sap.ui.model.BindingMode.TwoWay
          );
          //this.oDowntimeReportingModel.setProperty("/startTime", new Date(this.downtimeData.startTimeStamp));

          this.oDowntimeReportingModel.setProperty(
            "/startDate",
            new Date(
              this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                this.appData.shift.startTimestamp
              )
            )
          );
          this.oDowntimeReportingModel.setProperty(
            "/endDate",
            new Date(
              this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                this.appData.shift.startTimestamp
              )
            )
          );

          this.oDowntimeDialog.setModel(this.oDowntimeReportingModel);
          this.oDowntimeReportingModel.refresh();
          this.oDowntimeDialog.setTitle(
            this.appComponent.oBundle.getText("OEE_LABEL_REPORT_DOWNTIME")
          );
        }

        //
        if (
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "checkPMNotification"
          ).getSelected() == true
        ) {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "functionalLocation"
          ).setVisible(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(
            true
          );
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(
            true
          );

          if (this.notificationType && this.notificationType.length > 0) {
            if (this.notificationType.length === 1) {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "SinglePMNotificationType"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiPMNotificationType"
              ).setVisible(false);
              this.PMNotification.notificationType = this.notificationType[0].value;
            } else {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "SinglePMNotificationType"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiPMNotificationType"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiValue"
              ).setSelectedKey(this.notificationType[0].value);
              this.PMNotification.notificationTypes = this.notificationType;
            }
          }
        } else {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "functionalLocation"
          ).setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(
            false
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "SinglePMNotificationType"
          ).setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(
            false
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "MultiPMNotificationType"
          ).setVisible(false);
        }

        if (this.downtimeData.nodeDataList !== undefined) {
          if (this.downtimeData.nodeDataList[0].technicalObject !== undefined) {
            for (
              var i = 0;
              i < this.downtimeData.nodeDataList[0].technicalObject.length;
              i++
            ) {
              if (
                this.downtimeData.nodeDataList[0].technicalObject[i]
                  .equipmentID !== "" &&
                this.downtimeData.nodeDataList[0].technicalObject[i].flocID !==
                  ""
              ) {
                techObj1.push(
                  this.downtimeData.nodeDataList[0].technicalObject[i]
                );
              }
            }

            this.oModel1 = new sap.ui.model.json.JSONModel();
            this.oModel1.setData({
              modelData: techObj1,
            });
            this.pmFLDialog.setModel(this.oModel1);

            var oBindingInfo = {};
            oBindingInfo.path = "/modelData";

            oBindingInfo.factory = jQuery.proxy(function (sId, oContext) {
              var oFloc = oContext.getProperty("flocID");
              var oEquip = oContext.getProperty("equipmentID");
              var oTemplate = new sap.m.ColumnListItem({
                cells: [
                  new sap.m.Text({
                    text: "{flocID}",
                  }),
                  new sap.m.Text({
                    text:
                      "{path:'equipmentID' , formatter:'sap.oee.ui.Formatter.formatRemoveLeadingZero'}",
                  }),
                ],
                type: "Active",
                press: [this.handleOKForFLDialog, this],
              });

              return oTemplate;
            }, this);

            this.pmList.bindAggregation("items", oBindingInfo);
            this.pmList.rerender();
          }
        }

        //Handled Later
        /*if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
    sap.ui.core.Fragment.byId("downtimeDialog", "downtimeDialog").setContentHeight("80%");
      }else{
    sap.ui.core.Fragment.byId("downtimeDialog", "downtimeDialog").setContentHeight("52%");
  }*/
        //Added to handle Field Visibilty on downtime dialog due to duration/Micro Stoppage changes
        this.handleFieldVisibilityOfDowntimeDialog();
        this.oDowntimeDialog.open();
      },

      handleCancel: function (oEvent) {
        oEvent.getSource().getParent().close();
      },

      checkShiftForLabelOfSetCurrent: function () {
        var oController = this;
        var shiftStartTime = this.appData.shift.startTimestamp;
        var shiftEndTime = this.appData.shift.endTimestamp;
        var currentDate = new Date(
          this.interfaces.interfacesGetCurrentTimeInMsAfterTimeZoneAdjustments()
        );
        var endTimeStamp_create = this.getUTCForCurrentDate(currentDate);
        if (
          endTimeStamp_create >= shiftStartTime &&
          endTimeStamp_create <= shiftEndTime
        ) {
          this.setEndTimeButton.setText(
            oController.appComponent.oBundle.getText("OEE_BUTTON_SET_CURRENT")
          );
          this.setStartTimeButton.setText(
            oController.appComponent.oBundle.getText("OEE_BUTTON_SET_CURRENT")
          );
          this.setEndTimeButton.setTooltip(
            oController.appComponent.oBundle.getText("OEE_BUTTON_SET_CURRENT")
          );
          this.setStartTimeButton.setTooltip(
            oController.appComponent.oBundle.getText("OEE_BUTTON_SET_CURRENT")
          );
        } else {
          this.setEndTimeButton.setText(
            oController.appComponent.oBundle.getText("OEE_BTN_SET_SHIFT_START")
          );
          this.setStartTimeButton.setText(
            oController.appComponent.oBundle.getText("OEE_BTN_SET_SHIFT_START")
          );
          this.setEndTimeButton.setTooltip(
            oController.appComponent.oBundle.getText("OEE_BTN_SET_SHIFT_START")
          );
          this.setStartTimeButton.setTooltip(
            oController.appComponent.oBundle.getText("OEE_BTN_SET_SHIFT_START")
          );
        }
      },

      getUTCForCurrentDate: function (date) {
        var offsetInMinutes;
        if (date != null && date != undefined && date != "") {
          var browserTimezoneOffset =
            new Date(date.getTime()).getTimezoneOffset() * 60000;
          var UTCDateInTimeStamp,
            plantTimezoneOffset = this.appData.plantTimezoneOffset,
            offsetInMinutes,
            dateTimeString;

          /*
           * Adjusting plantTimezoneOffset based on DST if applicable
           */
          if (this.appData) {
            dateTimeString = sap.oee.ui.Utils.getDateTimeStringFromTimestamp(
              date.getTime()
            );
            offsetInMinutes = sap.oee.ui.Utils.getPlantTimezoneOffsetBasedOnTimezoneKey(
              dateTimeString,
              this.appData.plantTimezoneKey
            );
            if (offsetInMinutes) {
              plantTimezoneOffset = parseFloat(offsetInMinutes);
            }
          }

          UTCDateInTimeStamp =
            date.getTime() - (browserTimezoneOffset + plantTimezoneOffset);
          return UTCDateInTimeStamp;
        } else {
          return null;
        }
      },

      onPressResetStartDate: function (oEvent) {
        var currentTimeStamp, dateObject;
        var startDateTimeText = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "setCurrentForStartTime"
        ).getText();
        if (
          startDateTimeText ==
          this.appComponent.oBundle.getText("OEE_BUTTON_SET_CURRENT")
        ) {
          currentTimeStamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
            new Date().getTime()
          );
          this.downtimeData.startTimeStamp = currentTimeStamp;
        } else {
          currentTimeStamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
            this.appData.shift.startTimestamp
          );
          this.downtimeData.startTimeStamp = currentTimeStamp;
        }
        //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.changeOver
        ) {
          var fromMat = {};
          fromMat.materials = [];
          var startTimestampUTC = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
            this.downtimeData.startTimeStamp,
            this.appData.plantTimezoneOffset
          );
          this.fromMaterialsData = this.interfaces.GetMaterialsForChangeOverForActiveHoldCompleteRuns(
            this.appData.client,
            this.appData.plant,
            startTimestampUTC,
            this.appData.node.nodeID
          );
          if (this.fromMaterialsData.materialDetails.results.length > 0) {
            fromMat.materials = this.fromMaterialsData.materialDetails.results;
            if (
              fromMat.materials.length > 1 &&
              fromMat.materials[0].matnr ===
                this.downtimeData.selectedToMaterial
            ) {
              this.downtimeData.selectedFromMaterial =
                fromMat.materials[1].matnr;
            } else {
              this.downtimeData.selectedFromMaterial =
                fromMat.materials[0].matnr;
            }
          }
        }
        dateObject = new Date(currentTimeStamp);
        this.oDowntimeReportingModel.setProperty("/startDate", dateObject);
        this.oDowntimeReportingModel.setProperty("/startTime", dateObject);
        this.oDowntimeReportingModel.refresh();
        var startDateField = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startDate"
        );
        var startTimeField = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        );
        startDateField.setValueState(sap.ui.core.ValueState.None);
        startTimeField.setValueState(sap.ui.core.ValueState.None);
        this.enableDisableOKButtonForErrorValueState();
        this.setStartTime();
      },

      onPressResetEndDate: function (oEvent) {
        var currentTimeStamp, dateObject;
        var startDateTimeText = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "setCurrentForEndTime"
        ).getText();
        if (
          startDateTimeText ==
          this.appComponent.oBundle.getText("OEE_BUTTON_SET_CURRENT")
        ) {
          currentTimeStamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
            new Date().getTime()
          );
          this.downtimeData.endTimeStamp = currentTimeStamp;
        } else {
          currentTimeStamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
            this.appData.shift.startTimestamp
          );
          this.downtimeData.endTimeStamp = currentTimeStamp;
        }
        //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.changeOver
        ) {
          var toMat = {};
          toMat.materials = [];
          var endTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
            this.downtimeData.endTimeStamp,
            this.appData.plantTimezoneOffset
          );
          this.toMaterialsData = this.interfaces.GetToMaterialsForChangeOverForActiveHoldCompleteRuns(
            this.appData.client,
            this.appData.plant,
            endTimestamp,
            this.appData.node.nodeID
          );
          if (this.toMaterialsData.materialDetails.results.length > 0) {
            toMat.materials = this.toMaterialsData.materialDetails.results;

            if (
              toMat.materials.length > 1 &&
              toMat.materials[0].matnr ===
                this.downtimeData.selectedFromMaterial
            ) {
              this.downtimeData.selectedToMaterial = toMat.materials[1].matnr;
            } else {
              this.downtimeData.selectedToMaterial = toMat.materials[0].matnr;
            }
          }
        }

        dateObject = new Date(currentTimeStamp);

        this.oDowntimeReportingModel.setProperty("/endDate", dateObject);
        this.oDowntimeReportingModel.setProperty("/endTime", dateObject);
        this.oDowntimeReportingModel.refresh();
        var endDateField = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endDate"
        );
        var endTimeField = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endTime"
        );
        endDateField.setValueState(sap.ui.core.ValueState.None);
        endTimeField.setValueState(sap.ui.core.ValueState.None);
        this.enableDisableOKButtonForErrorValueState();
        this.setEndTime();
      },

      onPressClearDatesAndDuration: function (oEvent) {
        this.downtimeData.firstFillField = undefined;
        this.downtimeData.secondFillField = undefined;
        sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
          this.downtimeData,
          sap.ui.core.Fragment.byId("downtimeDialog", "startDate"),
          sap.ui.core.Fragment.byId("downtimeDialog", "startTime"),
          sap.ui.core.Fragment.byId("downtimeDialog", "endDate"),
          sap.ui.core.Fragment.byId("downtimeDialog", "endTime"),
          sap.ui.core.Fragment.byId("downtimeDialog", "durationforDowntime"),
          sap.ui.core.Fragment.byId("downtimeDialog", "setCurrentForStartTime"),
          sap.ui.core.Fragment.byId("downtimeDialog", "setCurrentForEndTime"),
          this.interfaces
        );

        //this.downtimeData.startTimeStamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(new Date().getTime());
        this.downtimeData.startTimeStamp = undefined;
        this.downtimeData.endTimeStamp = undefined;

        this.oDowntimeReportingModel.setProperty("/startDate", "");
        this.oDowntimeReportingModel.setProperty("/endDate", "");
        this.oDowntimeReportingModel.setProperty("/startTime", "");
        this.oDowntimeReportingModel.setProperty("/endTime", "");
        this.downtimeData.selectedFromMaterial = "";
        this.downtimeData.selectedToMaterial = "";
        this.fromMaterialsData = "";
        this.toMaterialsData = "";
        this.oDowntimeReportingModel.refresh();

        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "durationforDowntime"
        ).setValueState(sap.ui.core.ValueState.None);
        sap.ui.core.Fragment.byId("downtimeDialog", "startDate").setValueState(
          sap.ui.core.ValueState.None
        );
        sap.ui.core.Fragment.byId("downtimeDialog", "startTime").setValueState(
          sap.ui.core.ValueState.None
        );
        sap.ui.core.Fragment.byId("downtimeDialog", "endDate").setValueState(
          sap.ui.core.ValueState.None
        );
        sap.ui.core.Fragment.byId("downtimeDialog", "endTime").setValueState(
          sap.ui.core.ValueState.None
        );
        this.oDowntimeDialog.rerender();
      },

      handleCancelForDowntimeDialog: function () {
        this.oDowntimeDialog.close();
        this.initializeDownTime();
        this.resetValueStateForDurationFields();
        this.byId("reportButtonForNotification").setEnabled(false); //
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "downtimeDialog"
        ).setContentHeight("70%"); //
      },

      resetValueStateForDurationFields: function () {
        var duration = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "durationforDowntime"
        );
        var standardDuration = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "standardDurationforDowntime"
        );
        var frequencyFields = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "frequency"
        );
        var startDateTimeField = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        );
        var endDateTimeField = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endTime"
        );
        var endDateTimeField = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endTime"
        );
        var oOKButton = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "okButtonDowntimeDialog"
        );
        oOKButton.setEnabled(true);
        duration.setValueState(sap.ui.core.ValueState.None);
        standardDuration.setValueState(sap.ui.core.ValueState.None);
        frequencyFields.setValueState(sap.ui.core.ValueState.None);
        startDateTimeField.setValueState(sap.ui.core.ValueState.None);
        endDateTimeField.setValueState(sap.ui.core.ValueState.None);
      },

      checkStartDateTimeInputs: function (oEvent) {
        var startDate, startTime, bValid;
        startDate = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startDate"
        ).getDateValue();
        startTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        ).getValue();
        bValid = oEvent.getParameter("valid");

        if (bValid) {
          oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
          this.enableDisableOKButtonForErrorValueState();
          if (startDate && startTime && startDate != "" && startTime != "") {
            this.setStartTime();
          }
        } else {
          oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
          this.enableDisableOKButtonForErrorValueState();
          //oEvent.oSource.setValue("");
        }
      },

      checkEndDateTimeInputs: function (oEvent) {
        var endDate, endTime, bValid;
        endDate = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endDate"
        ).getDateValue();
        endTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endTime"
        ).getValue();
        bValid = oEvent.getParameter("valid");

        if (bValid) {
          oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
          this.enableDisableOKButtonForErrorValueState();
          if (endDate && endTime && endDate != "" && endTime != "") {
            this.setEndTime();
          }
        } else {
          oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
          this.enableDisableOKButtonForErrorValueState();
          //oEvent.oSource.setValue("");
        }
      },

      checkStartDateTimeInputsPM: function (oEvent) {
        var startDate, startTime;
        startDate = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startDateforPMNotification"
        ).getDateValue();
        startTime = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startTimeforPMNotification"
        ).getValue();
        if (startDate && startTime && startDate != "" && startTime != "") {
          this.setStartTimePM();
        }
      },

      checkEndDateTimeInputsPM: function (oEvent) {
        var endDate, endTime;
        endDate = sap.ui.core.Fragment.byId(
          "PMDialog",
          "endDateforPMNotification"
        ).getDateValue();
        endTime = sap.ui.core.Fragment.byId(
          "PMDialog",
          "endTimeforPMNotification"
        ).getValue();
        if (endDate && endTime && endDate != "" && endTime != "") {
          this.setEndTimePM();
        }
      },

      setStartTime: function () {
        var startDate = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startDate"
        ).getDateValue();
        var startTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        ).getDateValue();
        if (startDate && startTime && startDate != "" && startTime != "") {
          this.downtimeData.startTimeStamp = sap.oee.ui.Utils.createTimestampFromDateTime(
            startDate,
            startTime
          ).getTime();
          if (this.downtimeData.startTimeStamp != undefined) {
            if (this.downtimeData.firstFillField == undefined) {
              this.downtimeData.firstFillField = "START_TIME";
            } else {
              if (this.downtimeData.firstFillField != "START_TIME") {
                this.downtimeData.secondFillField = "START_TIME";
              }
            }
            /*if (this.downtimeData.secondFillField == undefined && this.downtimeMode == "Edit") {
                                       this.downtimeData.secondFillField = "END_TIME";
                                 }*/
            sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
              this.downtimeData,
              sap.ui.core.Fragment.byId("downtimeDialog", "startDate"),
              sap.ui.core.Fragment.byId("downtimeDialog", "startTime"),
              sap.ui.core.Fragment.byId("downtimeDialog", "endDate"),
              sap.ui.core.Fragment.byId("downtimeDialog", "endTime"),
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "durationforDowntime"
              ),
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "setCurrentForStartTime"
              ),
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "setCurrentForEndTime"
              ),
              this.interfaces
            );
          }
        } else {
          if (this.downtimeData.firstFillField == "START_TIME") {
            if (this.downtimeData.secondFillField != undefined) {
              this.downtimeData.firstFillField = this.downtimeData.secondFillField;
              this.downtimeData.secondFillField = undefined;
            } else {
              this.downtimeData.firstFillField = undefined;
            }
          }

          if (this.downtimeData.secondFillField == "START_TIME") {
            this.downtimeData.secondFillField = undefined;
          }

          sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
            this.downtimeData,
            sap.ui.core.Fragment.byId("downtimeDialog", "startDate"),
            sap.ui.core.Fragment.byId("downtimeDialog", "startTime"),
            sap.ui.core.Fragment.byId("downtimeDialog", "endDate"),
            sap.ui.core.Fragment.byId("downtimeDialog", "endTime"),
            sap.ui.core.Fragment.byId("downtimeDialog", "durationforDowntime"),
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "setCurrentForStartTime"
            ),
            sap.ui.core.Fragment.byId("downtimeDialog", "setCurrentForEndTime"),
            this.interfaces
          );
        }

        //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.changeOver
        ) {
          var fromMat = {},
            startTimestamp;
          fromMat.materials = [];
          var startDate = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "startDate"
          ).getDateValue();
          var startTime = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "startTime"
          ).getDateValue();
          if (startDate && startTime && startDate != "" && startTime != "") {
            var combinedStartDateTime = sap.oee.ui.Utils.createTimestampFromDateTime(
              startDate,
              startTime
            ).getTime();
            startTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
              combinedStartDateTime,
              this.appData.plantTimezoneOffset
            );
          }
          this.fromMaterialsData = this.interfaces.GetMaterialsForChangeOverForActiveHoldCompleteRuns(
            this.appData.client,
            this.appData.plant,
            startTimestamp,
            this.appData.node.nodeID
          );
          if (this.fromMaterialsData.materialDetails.results.length > 0) {
            fromMat.materials = this.fromMaterialsData.materialDetails.results;

            if (
              fromMat.materials.length > 1 &&
              fromMat.materials[0].matnr ===
                this.downtimeData.selectedToMaterial
            ) {
              this.downtimeData.selectedFromMaterial =
                fromMat.materials[1].matnr;
            } else {
              this.downtimeData.selectedFromMaterial =
                fromMat.materials[0].matnr;
            }
          } else {
            this.downtimeData.selectedFromMaterial = undefined;
            sap.m.MessageBox.show(
              this.appComponent.oBundle.getText(
                "OEE_MSG_CHANGEOVER_CANNOT_BE_REPORTED"
              ),
              {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: this.appComponent.oBundle.getText("OEE_HEADER_WARNING"),
                actions: [sap.m.MessageBox.Action.OK],
              }
            );
          }

          if (this.downtimeData.firstFillField === "DURATION") {
            var toMat = {};
            toMat.materials = [];
            var endDate = sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "endDate"
            ).getDateValue();
            var endTime = sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "endTime"
            ).getDateValue();
            if (endDate && endTime && endDate != "" && endTime != "") {
              var combinedDateTimeEnd = sap.oee.ui.Utils.createTimestampFromDateTime(
                endDate,
                endTime
              );
              var endTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                combinedDateTimeEnd.getTime(),
                this.appData.plantTimezoneOffset
              );
              this.toMaterialsData = this.interfaces.GetToMaterialsForChangeOverForActiveHoldCompleteRuns(
                this.appData.client,
                this.appData.plant,
                endTimestamp,
                this.appData.node.nodeID
              );
            }
            if (this.toMaterialsData.materialDetails.results.length > 0) {
              toMat.materials = this.toMaterialsData.materialDetails.results;

              if (
                toMat.materials.length > 1 &&
                toMat.materials[0].matnr ===
                  this.downtimeData.selectedFromMaterial
              ) {
                this.downtimeData.selectedToMaterial = toMat.materials[1].matnr;
              } else {
                this.downtimeData.selectedToMaterial = toMat.materials[0].matnr;
              }
            } else {
              this.downtimeData.selectedToMaterial = undefined;
              sap.m.MessageBox.show(
                this.appComponent.oBundle.getText(
                  "OEE_MSG_CHANGEOVER_CANNOT_BE_REPORTED"
                ),
                {
                  icon: sap.m.MessageBox.Icon.WARNING,
                  title: this.appComponent.oBundle.getText(
                    "OEE_HEADER_WARNING"
                  ),
                  actions: [sap.m.MessageBox.Action.OK],
                }
              );
            }
          }
        }
      },

      setDurationInMins: function () {
        var valueStateForStartTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        ).getValueState();
        var valueStateForEndTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endTime"
        ).getValueState();
        jQuery.sap.require("sap.ui.core.format.NumberFormat");
        var floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance();

        var duration = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "durationforDowntime"
        ).getValue();
        if (duration != undefined) {
          this.downtimeData.duration = floatFormatter.parse(duration);
          if (
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "startTime"
            ).getVisible() == true &&
            (sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "microStoppage"
            ).getVisible() == false ||
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "microStoppage"
              ).getSelected() == false)
          ) {
            if (floatFormatter.parse(duration) > 0) {
              this.downtimeData.duration = floatFormatter.parse(duration);
              if (this.downtimeData.firstFillField == undefined) {
                this.downtimeData.firstFillField = "DURATION";
              } else {
                if (this.downtimeData.firstFillField != "DURATION") {
                  this.downtimeData.secondFillField = "DURATION";
                }
              }
              if (
                valueStateForStartTime == "None" &&
                valueStateForEndTime == "None"
              ) {
                sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
                  this.downtimeData,
                  sap.ui.core.Fragment.byId("downtimeDialog", "startDate"),
                  sap.ui.core.Fragment.byId("downtimeDialog", "startTime"),
                  sap.ui.core.Fragment.byId("downtimeDialog", "endDate"),
                  sap.ui.core.Fragment.byId("downtimeDialog", "endTime"),
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "durationforDowntime"
                  ),
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "setCurrentForStartTime"
                  ),
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "setCurrentForEndTime"
                  ),
                  this.interfaces
                );
              }
            } else if (duration.length == 0) {
              this.downtimeData.duration = "";
              if (this.downtimeData.firstFillField == "DURATION") {
                if (this.downtimeData.secondFillField != undefined) {
                  this.downtimeData.firstFillField = this.downtimeData.secondFillField;
                  this.downtimeData.secondFillField = undefined;
                } else {
                  this.downtimeData.firstFillField = undefined;
                }
              }

              if (this.downtimeData.secondFillField == "DURATION") {
                this.downtimeData.secondFillField = undefined;
              }
              if (
                valueStateForStartTime == "None" &&
                valueStateForEndTime == "None"
              ) {
                sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
                  this.downtimeData,
                  sap.ui.core.Fragment.byId("downtimeDialog", "startDate"),
                  sap.ui.core.Fragment.byId("downtimeDialog", "startTime"),
                  sap.ui.core.Fragment.byId("downtimeDialog", "endDate"),
                  sap.ui.core.Fragment.byId("downtimeDialog", "endTime"),
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "durationforDowntime"
                  ),
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "setCurrentForStartTime"
                  ),
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "setCurrentForEndTime"
                  ),
                  this.interfaces
                );
              }
            }
          }
        }
        if (
          valueStateForStartTime == "None" &&
          valueStateForEndTime == "None"
        ) {
          if (
            this.downtimeData.firstFillField &&
            this.downtimeData.firstFillField === "START_TIME"
          ) {
            //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
            if (
              this.downtimeData.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.changeOver
            ) {
              var toMat = {};
              toMat.materials = [];
              var endTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                this.downtimeData.endTimeStamp,
                this.appData.plantTimezoneOffset
              );
              this.toMaterialsData = this.interfaces.GetToMaterialsForChangeOverForActiveHoldCompleteRuns(
                this.appData.client,
                this.appData.plant,
                endTimestamp,
                this.appData.node.nodeID
              );
              if (this.toMaterialsData.materialDetails.results.length > 0) {
                toMat.materials = this.toMaterialsData.materialDetails.results;

                if (
                  toMat.materials.length > 1 &&
                  toMat.materials[0].matnr ===
                    this.downtimeData.selectedFromMaterial
                ) {
                  this.downtimeData.selectedToMaterial =
                    toMat.materials[1].matnr;
                } else {
                  this.downtimeData.selectedToMaterial =
                    toMat.materials[0].matnr;
                }
              } else {
                this.downtimeData.selectedToMaterial = undefined;
                sap.m.MessageBox.show(
                  this.appComponent.oBundle.getText(
                    "OEE_MSG_CHANGEOVER_CANNOT_BE_REPORTED"
                  ),
                  {
                    icon: sap.m.MessageBox.Icon.WARNING,
                    title: this.appComponent.oBundle.getText(
                      "OEE_HEADER_WARNING"
                    ),
                    actions: [sap.m.MessageBox.Action.OK],
                  }
                );
              }
            }
          }

          if (
            this.downtimeData.firstFillField &&
            this.downtimeData.firstFillField === "END_TIME"
          ) {
            //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
            if (
              this.downtimeData.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.changeOver
            ) {
              var fromMat = {};
              fromMat.materials = [];
              var startTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                this.downtimeData.startTimeStamp,
                this.appData.plantTimezoneOffset
              );
              this.fromMaterialsData = this.interfaces.GetMaterialsForChangeOverForActiveHoldCompleteRuns(
                this.appData.client,
                this.appData.plant,
                startTimestamp,
                this.appData.node.nodeID
              );
              if (this.fromMaterialsData.materialDetails.results.length > 0) {
                fromMat.materials = this.fromMaterialsData.materialDetails.results;

                if (
                  fromMat.materials.length > 1 &&
                  fromMat.materials[0].matnr ===
                    this.downtimeData.selectedToMaterial
                ) {
                  this.downtimeData.selectedFromMaterial =
                    fromMat.materials[1].matnr;
                } else {
                  this.downtimeData.selectedFromMaterial =
                    fromMat.materials[0].matnr;
                }
              } else {
                this.downtimeData.selectedFromMaterial = undefined;
                sap.m.MessageBox.show(
                  this.appComponent.oBundle.getText(
                    "OEE_MSG_CHANGEOVER_CANNOT_BE_REPORTED"
                  ),
                  {
                    icon: sap.m.MessageBox.Icon.WARNING,
                    title: this.appComponent.oBundle.getText(
                      "OEE_HEADER_WARNING"
                    ),
                    actions: [sap.m.MessageBox.Action.OK],
                  }
                );
              }
            }
          }
        }
      },

      checkEndTime: function (oEvent) {
        var bValid = oEvent.getParameter("valid");
        if (bValid) {
          oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
          this.enableDisableOKButtonForErrorValueState();
          this.setEndTime();
        } else {
          oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
          this.enableDisableOKButtonForErrorValueState();
          //oEvent.oSource.setValue("");
        }
      },

      setEndTime: function () {
        var endDate = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endDate"
        ).getDateValue();
        var endTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endTime"
        ).getDateValue();
        if (endDate && endTime && endDate != "" && endTime != "") {
          this.downtimeData.endTimeStamp = sap.oee.ui.Utils.createTimestampFromDateTime(
            endDate,
            endTime
          ).getTime();
          if (this.downtimeData.endTimeStamp != undefined) {
            if (this.downtimeData.firstFillField == undefined) {
              this.downtimeData.firstFillField = "END_TIME";
            } else {
              if (this.downtimeData.firstFillField != "END_TIME") {
                this.downtimeData.secondFillField = "END_TIME";
              }
            }
            sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
              this.downtimeData,
              sap.ui.core.Fragment.byId("downtimeDialog", "startDate"),
              sap.ui.core.Fragment.byId("downtimeDialog", "startTime"),
              sap.ui.core.Fragment.byId("downtimeDialog", "endDate"),
              sap.ui.core.Fragment.byId("downtimeDialog", "endTime"),
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "durationforDowntime"
              ),
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "setCurrentForStartTime"
              ),
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "setCurrentForEndTime"
              ),
              this.interfaces
            );
          }
        } else {
          this.downtimeData.endTimeStamp = undefined;
          if (this.downtimeData.firstFillField == "END_TIME") {
            if (this.downtimeData.secondFillField != undefined) {
              this.downtimeData.firstFillField = this.downtimeData.secondFillField;
              this.downtimeData.secondFillField = undefined;
            } else {
              this.downtimeData.firstFillField = undefined;
            }
          }

          if (this.downtimeData.secondFillField == "END_TIME") {
            this.downtimeData.secondFillField = undefined;
          }

          sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
            this.downtimeData,
            sap.ui.core.Fragment.byId("downtimeDialog", "startDate"),
            sap.ui.core.Fragment.byId("downtimeDialog", "startTime"),
            sap.ui.core.Fragment.byId("downtimeDialog", "endDate"),
            sap.ui.core.Fragment.byId("downtimeDialog", "endTime"),
            sap.ui.core.Fragment.byId("downtimeDialog", "durationforDowntime"),
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "setCurrentForStartTime"
            ),
            sap.ui.core.Fragment.byId("downtimeDialog", "setCurrentForEndTime"),
            this.interfaces
          );
        }

        //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.changeOver
        ) {
          var toMat = {};
          toMat.materials = [];
          var endDate = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "endDate"
          ).getDateValue();
          var endTime = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "endTime"
          ).getDateValue();
          if (endDate && endTime && endDate != "" && endTime != "") {
            var combinedEndDateTime = sap.oee.ui.Utils.createTimestampFromDateTime(
              endDate,
              endTime
            ).getTime();
            var endTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
              combinedEndDateTime,
              this.appData.plantTimezoneOffset
            );
            this.toMaterialsData = this.interfaces.GetToMaterialsForChangeOverForActiveHoldCompleteRuns(
              this.appData.client,
              this.appData.plant,
              endTimestamp,
              this.appData.node.nodeID
            );
          }
          if (this.toMaterialsData.materialDetails.results.length > 0) {
            toMat.materials = this.toMaterialsData.materialDetails.results;

            if (
              toMat.materials.length > 1 &&
              toMat.materials[0].matnr ===
                this.downtimeData.selectedFromMaterial
            ) {
              this.downtimeData.selectedToMaterial = toMat.materials[1].matnr;
            } else {
              this.downtimeData.selectedToMaterial = toMat.materials[0].matnr;
            }
          } else {
            this.downtimeData.selectedToMaterial = undefined;
            sap.m.MessageBox.show(
              this.appComponent.oBundle.getText(
                "OEE_MSG_CHANGEOVER_CANNOT_BE_REPORTED"
              ),
              {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: this.appComponent.oBundle.getText("OEE_HEADER_WARNING"),
                actions: [sap.m.MessageBox.Action.OK],
              }
            );
          }

          if (this.downtimeData.firstFillField === "DURATION") {
            var fromMat = {},
              startTimestamp;
            fromMat.materials = [];
            var startDate = sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "startDate"
            ).getDateValue();
            var startTime = sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "startTime"
            ).getDateValue();
            if (startDate && startTime && startDate != "" && startTime != "") {
              var combinedStartDateTime = sap.oee.ui.Utils.createTimestampFromDateTime(
                startDate,
                startTime
              ).getTime();
              startTimestamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                combinedStartDateTime,
                this.appData.plantTimezoneOffset
              );
            }
            this.fromMaterialsData = this.interfaces.GetMaterialsForChangeOverForActiveHoldCompleteRuns(
              this.appData.client,
              this.appData.plant,
              startTimestamp,
              this.appData.node.nodeID
            );
            if (this.fromMaterialsData.materialDetails.results.length > 0) {
              fromMat.materials = this.fromMaterialsData.materialDetails.results;

              if (
                fromMat.materials.length > 1 &&
                fromMat.materials[0].matnr ===
                  this.downtimeData.selectedToMaterial
              ) {
                this.downtimeData.selectedFromMaterial =
                  fromMat.materials[1].matnr;
              } else {
                this.downtimeData.selectedFromMaterial =
                  fromMat.materials[0].matnr;
              }
            } else {
              this.downtimeData.selectedFromMaterial = undefined;
              sap.m.MessageBox.show(
                this.appComponent.oBundle.getText(
                  "OEE_MSG_CHANGEOVER_CANNOT_BE_REPORTED"
                ),
                {
                  icon: sap.m.MessageBox.Icon.WARNING,
                  title: this.appComponent.oBundle.getText(
                    "OEE_HEADER_WARNING"
                  ),
                  actions: [sap.m.MessageBox.Action.OK],
                }
              );
            }
          }
        }
      },

      handleOkForDowntimeDialog: function () {

	this.customScreenAllData.longText = sap.ui.core.Fragment.byId(
  "downtimeDialog",
  "commentsForDowntime"
).getValue();

this.customScreenAllData.msaus = sap.ui.core.Fragment.byId(
  "downtimeDialog",
  "breakDownForPMNotification"
).getSelected();

this.customScreenAllData.ausvn = sap.ui.core.Fragment.byId(
  "downtimeDialog",
  "startDate"
).getValue();

this.customScreenAllData.auztv = sap.ui.core.Fragment.byId(
  "downtimeDialog",
  "startTime"
).getValue();

this.customScreenAllData.ausbs = sap.ui.core.Fragment.byId(
  "downtimeDialog",
  "endDate"
).getValue();

this.customScreenAllData.auztb = sap.ui.core.Fragment.byId(
  "downtimeDialog",
  "endTime"
).getValue();

this.customScreenAllData.zzmsaus = sap.ui.core.Fragment.byId(
  "downtimeDialog",
  "bottleneckForDowntime"
).getSelected();

this.customScreenAllData.checkPMNotification = sap.ui.core.Fragment.byId(
  "downtimeDialog",
  "checkPMNotification"
).getSelected();


        if (this.downtimeData != undefined) {
          if (
            this.downtimeData.nodeDataList != undefined &&
            this.downtimeData.nodeDataList.length > 0
          ) {
            if (
              this.downtimeData.dcElement != undefined &&
              this.downtimeData.dcElement != ""
            ) {
              var isMicroStoppage = sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "microStoppage"
              );
              var frequencyInput = sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "frequency"
              );

              //If a event Type is changeover then start and end time value is fetching from the Input Field and entry type will be start end.
              if (
                this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.changeOver
              ) {
                var startTime = this.downtimeData.startTimeStamp;
                var endTime = this.downtimeData.endTimeStamp;
                if (
                  this.downtimeData.entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO ||
                  this.downtimeData.entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                  this.downtimeData.entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
                ) {
                  var entryType =
                    sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO;
                } else {
                  var entryType =
                    sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL;
                }
              } else if (
                this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
                this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
              ) {
                if (this.downtimeMode == "Edit") {
                  /*In case of Edit Mode with- Check if start time Input field is visible or not. Since we are allowing to change the downtime entry type, we need to identify which is the type of downtime reported after edit
                   * For Micro Stoppage and Duration based downtime start and end time will be shift start time for rest it will be picked from input field
                   *  */
                  if (this.startTimeInput.getVisible() == true) {
                    //if start time visible check is Micro Stoppage is checked or not.If checked ,downtime will be Micro Stoppage.
                    if (isMicroStoppage.getSelected() == true) {
                      var startTime = this.appData.shift.startTimestamp;
                      var endTime = this.appData.shift.startTimestamp;
                      //Since we can edit the downtime auto reported by machine we are doing this check. If downtime reported was in Auto mode ,it should be auto mode even after edit
                      if (
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .START_END_AUTO ||
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .MICRO_STOPPAGE_AUTO
                      ) {
                        var entryType =
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .MICRO_STOPPAGE_AUTO;
                      } else {
                        var entryType =
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .MICRO_STOPPAGE_MANUAL;
                      }
                      var effectiveDuration = this.downtimeData.duration;
                      if (
                        frequencyInput.getValue() === "" ||
                        frequencyInput.getValue() == "0"
                      ) {
                        sap.oee.ui.Utils.createMessage(
                          this.appComponent.oBundle.getText(
                            "OEE_ERR_MSG_NO_FREQUENCY"
                          ),
                          sap.ui.core.MessageType.Error
                        );
                        return;
                      } else {
                        var frequency = frequencyInput.getValue();
                      }
                      if (
                        this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                      ) {
                        if (
                          this.impactOrderInput.getValue() == "" ||
                          this.impactOrderInput.getValue() == "Select Order"
                        ) {
                          sap.oee.ui.Utils.createMessage(
                            this.appComponent.oBundle.getText(
                              "OEE_ERR_MSG_NO_ORDER_SELECTED"
                            ),
                            sap.ui.core.MessageType.Error
                          );
                          return;
                        } else {
                          var oModelData = this.impactOrderInput
                            .getModel()
                            .getData().downtimeDataForModel;
                          var oRunID = oModelData.orderAssign.runId;
                        }
                      }
                    } else {
                      // if Start time input field is visible and micro stoppage checkbox is not checked then dowtime will be start end manual/Auto
                      if (
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .START_END_AUTO ||
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .MICRO_STOPPAGE_AUTO
                      ) {
                        var entryType =
                          sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO;
                      } else {
                        var entryType =
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .START_END_MANUAL;
                      }
                      var startTime = this.downtimeData.startTimeStamp;
                      var endTime = this.downtimeData.endTimeStamp;
                    }
                  } else {
                    // if Start time input field is hidden and micro stoppage checkbox is checked then downtime reported will be Micro Stoppages
                    if (isMicroStoppage.getSelected() == true) {
                      var startTime = this.appData.shift.startTimestamp;
                      var endTime = this.appData.shift.startTimestamp;
                      if (
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .START_END_AUTO ||
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .MICRO_STOPPAGE_AUTO
                      ) {
                        var entryType =
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .MICRO_STOPPAGE_AUTO;
                      } else {
                        var entryType =
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .MICRO_STOPPAGE_MANUAL;
                      }
                      var effectiveDuration = this.downtimeData.duration;
                      if (
                        frequencyInput.getValue() === "" ||
                        frequencyInput.getValue() == "0"
                      ) {
                        sap.oee.ui.Utils.createMessage(
                          this.appComponent.oBundle.getText(
                            "OEE_ERR_MSG_NO_FREQUENCY"
                          ),
                          sap.ui.core.MessageType.Error
                        );
                        return;
                      } else {
                        var frequency = frequencyInput.getValue();
                      }
                      if (
                        this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                      ) {
                        if (
                          this.impactOrderInput.getValue() == "" ||
                          this.impactOrderInput.getValue() == "Select Order"
                        ) {
                          sap.oee.ui.Utils.createMessage(
                            this.appComponent.oBundle.getText(
                              "OEE_ERR_MSG_NO_ORDER_SELECTED"
                            ),
                            sap.ui.core.MessageType.Error
                          );
                          return;
                        } else {
                          var oModelData = this.impactOrderInput
                            .getModel()
                            .getData().downtimeDataForModel;
                          var oRunID = oModelData.orderAssign.runId;
                        }
                      }
                    } else {
                      //if micro stoppage is not checked and start time input field is hidden then downtime reported will be duration based.
                      var startTime = this.appData.shift.startTimestamp;
                      var endTime = this.appData.shift.startTimestamp;
                      if (
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .START_END_AUTO ||
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                        this.downtimeData.entryType ==
                          sap.oee.ui.oeeConstants.downtimeEntry
                            .MICRO_STOPPAGE_AUTO
                      ) {
                        var entryType =
                          sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO;
                      } else {
                        var entryType =
                          sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL;
                      }
                      var effectiveDuration = this.downtimeData.duration;
                      if (
                        this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                      ) {
                        if (
                          this.impactOrderInput.getValue() == "" ||
                          this.impactOrderInput.getValue() == "Select Order"
                        ) {
                          sap.oee.ui.Utils.createMessage(
                            this.appComponent.oBundle.getText(
                              "OEE_ERR_MSG_NO_ORDER_SELECTED"
                            ),
                            sap.ui.core.MessageType.Error
                          );
                          return;
                        } else {
                          var oModelData = this.impactOrderInput
                            .getModel()
                            .getData().downtimeDataForModel;
                          var oRunID = oModelData.orderAssign.runId;
                        }
                      }
                    }
                  }
                } else if (this.downtimeMode == "New") {
                  /*In case of New mode(for entryType Scheduled or unscheduled)- check the configuration Setting for the downtime Entry type. Start and end 
                        time Input field will be hidden ,therefore start and end time will be shift start and end time Order field will be visible only if eventType is 
                        unscheduled downtime and downtime reported is either duration based or microstoppage*/
                  if (
                    this.appData.node.downtimeEntryType ==
                    sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
                  ) {
                    if (
                      this.downtimeData.eventType ===
                      sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                    ) {
                      if (
                        this.impactOrderInput.getValue() == "" ||
                        this.impactOrderInput.getValue() == "Select Order"
                      ) {
                        sap.oee.ui.Utils.createMessage(
                          this.appComponent.oBundle.getText(
                            "OEE_ERR_MSG_NO_ORDER_SELECTED"
                          ),
                          sap.ui.core.MessageType.Error
                        );
                        return;
                      } else {
                        var oModelData = this.impactOrderInput
                          .getModel()
                          .getData().downtimeDataForModel;
                        var oRunID = oModelData.orderAssign.runId;
                      }
                    }
                    var startTime = this.appData.shift.startTimestamp;
                    var endTime = this.appData.shift.startTimestamp;
                    var effectiveDuration = sap.ui.core.Fragment.byId(
                      "downtimeDialog",
                      "durationforDowntime"
                    ).getValue();
                    if (isMicroStoppage.getSelected() === true) {
                      if (
                        frequencyInput.getValue() === "" ||
                        frequencyInput.getValue() == "0"
                      ) {
                        sap.oee.ui.Utils.createMessage(
                          this.appComponent.oBundle.getText(
                            "OEE_ERR_MSG_NO_FREQUENCY"
                          ),
                          sap.ui.core.MessageType.Error
                        );
                        return;
                      } else {
                        var frequency = frequencyInput.getValue();
                      }
                      var entryType =
                        sap.oee.ui.oeeConstants.downtimeEntry
                          .MICRO_STOPPAGE_MANUAL;
                    } else {
                      var entryType =
                        sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL;
                    }
                    if (
                      this.downtimeData.duration == "0" ||
                      this.downtimeData.duration == ""
                    ) {
                      sap.oee.ui.Utils.createMessage(
                        this.appComponent.oBundle.getText(
                          "OEE_ERR_MSG_NO_DURATION"
                        ),
                        sap.ui.core.MessageType.Error
                      );
                      return;
                    }
                  } else {
                    if (isMicroStoppage.getSelected() === true) {
                      var startTime = this.appData.shift.startTimestamp;
                      var endTime = this.appData.shift.startTimestamp;
                      var entryType =
                        sap.oee.ui.oeeConstants.downtimeEntry
                          .MICRO_STOPPAGE_MANUAL;
                      var effectiveDuration = sap.ui.core.Fragment.byId(
                        "downtimeDialog",
                        "durationforDowntime"
                      ).getValue();
                      if (
                        frequencyInput.getValue() === "" ||
                        frequencyInput.getValue() == "0"
                      ) {
                        sap.oee.ui.Utils.createMessage(
                          this.appComponent.oBundle.getText(
                            "OEE_ERR_MSG_NO_FREQUENCY"
                          ),
                          sap.ui.core.MessageType.Error
                        );
                        return;
                      } else {
                        var frequency = frequencyInput.getValue();
                      }
                      if (
                        this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                      ) {
                        if (
                          this.impactOrderInput.getValue() == "" ||
                          this.impactOrderInput.getValue() == "Select Order"
                        ) {
                          sap.oee.ui.Utils.createMessage(
                            this.appComponent.oBundle.getText(
                              "OEE_ERR_MSG_NO_ORDER_SELECTED"
                            ),
                            sap.ui.core.MessageType.Error
                          );
                          return;
                        } else {
                          var oModelData = this.impactOrderInput
                            .getModel()
                            .getData().downtimeDataForModel;
                          var oRunID = oModelData.orderAssign.runId;
                        }
                      }
                    } else {
                      var startTime = this.downtimeData.startTimeStamp;
                      var endTime = this.downtimeData.endTimeStamp;
                      var entryType =
                        sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL;
                    }
                  }
                }
              } else {
                var startTime = this.downtimeData.startTimeStamp;
                var endTime = this.downtimeData.endTimeStamp;
                if (
                  this.downtimeData.entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO ||
                  this.downtimeData.entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                  this.downtimeData.entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
                ) {
                  var entryType =
                    sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO;
                } else {
                  var entryType =
                    sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL;
                }
              }
              if (effectiveDuration !== undefined) {
                if (effectiveDuration === "0" || effectiveDuration === "") {
                  sap.oee.ui.Utils.createMessage(
                    this.appComponent.oBundle.getText(
                      "OEE_ERR_MSG_NO_DURATION"
                    ),
                    sap.ui.core.MessageType.Error
                  );
                  return;
                }
              }
              // var startTime = sap.ui.core.Fragment.byId("downtimeDialog", "startTime").getDateValue();
              if (startTime != undefined && startTime != "") {
                if (
                  this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.changeOver
                ) {
                  //if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === sap.oee.ui.oeeConstants.dcElementType.changeover){
                  var selectedFromMaterial = sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "fromMaterialforDowntime"
                  ).getValue();
                  if (
                    selectedFromMaterial === undefined ||
                    selectedFromMaterial === ""
                  ) {
                    sap.oee.ui.Utils.createMessage(
                      this.appComponent.oBundle.getText(
                        "OEE_ERR_MSG_FROM_MATERIAL"
                      ),
                      sap.ui.core.MessageType.Error
                    );
                    return;
                  }
                }

                // var endTime = sap.ui.core.Fragment.byId("downtimeDialog", "endTime").getDateValue();
                if (endTime != undefined && endTime != "") {
                  if (
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL ||
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO
                  ) {
                    if (endTime <= startTime) {
                      sap.oee.ui.Utils.createMessage(
                        this.appComponent.oBundle.getText(
                          "START_TIME_GREATER_THAN_END_TIME_ERROR"
                        ),

                        sap.ui.core.MessageType.Error
                      );
                      return;
                    }
                  }
                  if (
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry
                        .MICRO_STOPPAGE_MANUAL ||
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
                  ) {
                    this.downtimeData.endTimeStamp = endTime;
                    var endtimeStampTemp = this.downtimeData.endTimeStamp;
                  } else {
                    var endtimeStampTemp = this.downtimeData.endTimeStamp;
                    this.downtimeData.endTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                      this.removeSecondsFromDowntimeStartAndEndTime(
                        endtimeStampTemp
                      ),
                      this.appData.plantTimezoneOffset
                    );
                  }
                  //var endTimeStampTemp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(endTime.getTime());
                  /* this.downtimeData.endTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(endTime.getTime(),

                             this.appData.plantTimezoneOffset);*/

                  if (
                    this.downtimeData.eventType ===
                    sap.oee.ui.oeeConstants.timeElementTypes.changeOver
                  ) {
                    //if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === sap.oee.ui.oeeConstants.dcElementType.changeover){
                    var selectedToMaterial = sap.ui.core.Fragment.byId(
                      "downtimeDialog",
                      "toMaterialforDowntime"
                    ).getValue();
                    if (
                      selectedToMaterial === undefined ||
                      selectedToMaterial === ""
                    ) {
                      sap.oee.ui.Utils.createMessage(
                        this.appComponent.oBundle.getText(
                          "OEE_ERR_MSG_TO_MATERIAL"
                        ),
                        sap.ui.core.MessageType.Error
                      );
                      return;
                    }
                  }
                }
                if (
                  entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
                  entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry
                      .MICRO_STOPPAGE_MANUAL ||
                  entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                  entryType ==
                    sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
                ) {
                  this.downtimeData.startTimeStamp = startTime;
                  var startTimeStampTemp = this.downtimeData.startTimeStamp;
                } else {
                  var startTimeStampTemp = this.downtimeData.startTimeStamp;
                  this.downtimeData.startTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                    this.removeSecondsFromDowntimeStartAndEndTime(
                      startTimeStampTemp
                    ),
                    this.appData.plantTimezoneOffset
                  );
                }
                // var startTimeStampTemp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(startTime.getTime());
                /*  this.downtimeData.startTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(startTime.getTime(),

                          this.appData.plantTimezoneOffset);*/
                var duration = sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "durationforDowntime"
                ).getValue();

                var comments = sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "commentsForDowntime"
                ).getValue();
                if (comments != undefined && comments != "") {
                  this.downtimeData.comments = comments;
                }
                var actsAsBottleneck = sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "bottleneckForDowntime"
                ).getSelected();
                if (actsAsBottleneck != undefined) {
                  this.downtimeData.actsAsBottleneck = actsAsBottleneck;
                }

                //

                var reportPMNotification = sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "checkPMNotification"
                ).getSelected();
                if (reportPMNotification == true) {
                  this.downtimeData.reportPMNotification = reportPMNotification;

                  var fLocation = sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "floc"
                  ).getValue();
                  if (fLocation != undefined) {
                    this.PMNotification.fLocation = fLocation;
                  }

                  var equipment = sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "equip"
                  ).getValue();
                  if (equipment != undefined) {
                    this.PMNotification.equipment = equipment;
                  }

                  var actsAsBreakdown = sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "breakDownForPMNotification"
                  ).getSelected();
                  if (actsAsBreakdown != undefined) {
                    this.PMNotification.actsAsBreakdown = actsAsBreakdown;
                  }

                  var notifDataTemp = {};
                  notifDataTemp.plant = this.appData.plant;
                  notifDataTemp.client = this.appData.client;
                  notifDataTemp.startTimeStamp = this.downtimeData.startTimeStamp;

                  if (this.notificationType.length === 1) {
                    notifDataTemp.notificationType = this.notificationType[0].value;
                  } else {
                    notifDataTemp.notificationType = sap.ui.core.Fragment.byId(
                      "downtimeDialog",
                      "MultiValue"
                    ).getSelectedKey();
                  }
                  notifDataTemp.technicalObject = {
                    client: notifDataTemp.client,
                    plant: notifDataTemp.plant,
                    nodeID: this.downtimeData.nodeDataList[0].nodeID,
                    flocID: this.PMNotification.fLocation,
                    equipmentID: this.PMNotification.equipment,
                  };
                }
                //
                var results = undefined;
                if (this.downtimeMode == "Edit") {
                  jQuery.sap.require("sap.ui.core.format.NumberFormat");
                  var floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance();
                  var oCrewSize;
                  if (
                    this.appData.node.crewSize ===
                    sap.oee.ui.oeeConstants.checkBooleanValue.TRUE
                  ) {
                    if (
                      this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes
                          .unscheduledDown ||
                      this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes.changeOver ||
                      this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
                    ) {
                      oCrewSize = sap.ui.core.Fragment.byId(
                        "downtimeDialog",
                        "crewSizeforDowntime"
                      ).getValue();
                      if (oCrewSize != "") {
                        var value = floatFormatter.parse(oCrewSize);
                        if (isNaN(value) || value < 0) {
                          sap.ui.core.Fragment.byId(
                            "downtimeDialog",
                            "crewSizeforDowntime"
                          ).setValue("");
                          sap.oee.ui.Utils.createMessage(
                            this.appComponent.oBundle.getText(
                              "OEE_ERR_MSG_CREW_SIZE"
                            ),
                            sap.ui.core.MessageType.Error
                          );
                          return;
                        }
                        oCrewSize = value;
                      } else {
                        oCrewSize = parseFloat(0);
                      }
                    } else {
                      oCrewSize = "";
                    }
                  } else {
                    oCrewSize = "";
                  }

                  var oStandardDuration, standardDurationInSec;
                  if (
                    this.downtimeData.eventType ===
                    sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
                  ) {
                    //if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === sap.oee.ui.oeeConstants.dcElementType.planned ){
                    oStandardDuration = sap.ui.core.Fragment.byId(
                      "downtimeDialog",
                      "standardDurationforDowntime"
                    ).getValue();
                    if (oStandardDuration != "") {
                      oStandardDuration = floatFormatter.parse(
                        oStandardDuration
                      );
                    }

                    standardDurationInSec = oStandardDuration * 60;
                    var value = new Number(standardDurationInSec);
                    if (
                      isNaN(value) ||
                      value < 0 ||
                      /\d+(\.\d*)$/g.test(value)
                    ) {
                      sap.ui.core.Fragment.byId(
                        "downtimeDialog",
                        "standardDurationforDowntime"
                      ).setValue("");
                      sap.oee.ui.Utils.createMessage(
                        this.appComponent.oBundle.getText(
                          "OEE_ERR_MSG_STANDARD_DURATION"
                        ),
                        sap.ui.core.MessageType.Error
                      );
                      return;
                    }
                    oStandardDuration = parseFloat(value);
                  } else {
                    oStandardDuration = "";
                  }

                  var oSelectedFromMaterial;
                  if (
                    this.downtimeData.eventType ===
                      sap.oee.ui.oeeConstants.timeElementTypes.changeOver &&
                    startTime
                  ) {
                    oSelectedFromMaterial = selectedFromMaterial;
                  } else {
                    oSelectedFromMaterial = "";
                  }

                  var oSelectedToMaterial;
                  if (
                    this.downtimeData.eventType ===
                      sap.oee.ui.oeeConstants.timeElementTypes.changeOver &&
                    endTime
                  ) {
                    oSelectedToMaterial = selectedToMaterial;
                  } else {
                    oSelectedToMaterial = "";
                  }

                  if (
                    this.downtimeData.eventType ===
                    sap.oee.ui.oeeConstants.timeElementTypes.changeOver
                  ) {
                    if (oSelectedFromMaterial && oSelectedToMaterial) {
                      if (oSelectedFromMaterial === oSelectedToMaterial) {
                        sap.oee.ui.Utils.createMessage(
                          this.appComponent.oBundle.getText(
                            "OEE_ERR_MSG_CHANGEOVER"
                          ),
                          sap.ui.core.MessageType.Error
                        ); //both from and to materials cannot be equal
                        return;
                      }
                    }
                  }

                  if (this.downtimeData.reasonCodeData) {
                    this.selectedDowntime.ioProductionRunDowntime.rc1 = this.downtimeData.reasonCodeData.reasonCode1;
                    this.selectedDowntime.ioProductionRunDowntime.rc2 = this.downtimeData.reasonCodeData.reasonCode2;
                    this.selectedDowntime.ioProductionRunDowntime.rc3 = this.downtimeData.reasonCodeData.reasonCode3;
                    this.selectedDowntime.ioProductionRunDowntime.rc4 = this.downtimeData.reasonCodeData.reasonCode4;
                    this.selectedDowntime.ioProductionRunDowntime.rc5 = this.downtimeData.reasonCodeData.reasonCode5;
                    this.selectedDowntime.ioProductionRunDowntime.rc6 = this.downtimeData.reasonCodeData.reasonCode6;
                    this.selectedDowntime.ioProductionRunDowntime.rc7 = this.downtimeData.reasonCodeData.reasonCode7;
                    this.selectedDowntime.ioProductionRunDowntime.rc8 = this.downtimeData.reasonCodeData.reasonCode8;
                    this.selectedDowntime.ioProductionRunDowntime.rc9 = this.downtimeData.reasonCodeData.reasonCode9;
                    this.selectedDowntime.ioProductionRunDowntime.rc10 = this.downtimeData.reasonCodeData.reasonCode10;
                  }

                  this.selectedDowntime.ioProductionRunDowntime.dcElement = this.downtimeData.dcElement;
                  this.selectedDowntime.ioProductionRunDowntime.comments = this.downtimeData.comments;

                  var cActsAsBottleneck;
                  if (this.downtimeData.actsAsBottleneck == true)
                    cActsAsBottleneck = "T";
                  else cActsAsBottleneck = "F";

                  this.selectedDowntime.ioProductionRunDowntime.actsAsBottleneck = cActsAsBottleneck;
                  this.selectedDowntime.ioProductionRunDowntime.crewSize = oCrewSize;
                  this.selectedDowntime.ioProductionRunDowntime.standardDuration = oStandardDuration;
                  this.selectedDowntime.ioProductionRunDowntime.material = oSelectedFromMaterial;
                  this.selectedDowntime.ioProductionRunDowntime.toMaterial = oSelectedToMaterial;
                  this.selectedDowntime.ioProductionRunDowntime.entryType = entryType;

                  if (effectiveDuration !== undefined) {
                    this.selectedDowntime.ioProductionRunDowntime.effectiveDuration =
                      60 * effectiveDuration;
                  }
                  if (frequency !== undefined) {
                    this.selectedDowntime.ioProductionRunDowntime.frequency = frequency;
                  } else {
                    if (
                      this.selectedDowntime.ioProductionRunDowntime.frequency
                    ) {
                      delete this.selectedDowntime.ioProductionRunDowntime
                        .frequency;
                    }
                  }
                  var selectedRuns = [];
                  if (oRunID !== undefined) {
                    var runID = {
                      runID: oRunID,
                    };
                    selectedRuns.push(runID);
                  }
                  /*For downtime entry type duration based and micro stoppages we need to pass the impacted order detail
                   *  if the dcelement is unschedule downtime else order will be empty. The dependencies of order is created/deleted accordingly
                   *  WhereAs for Start End Manual/Auto Entry type we can use the same old way to update the downtime */
                  if (
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry
                        .MICRO_STOPPAGE_MANUAL ||
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                    entryType ==
                      sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
                  ) {
                    results = this.interfaces.updateDowntimeData(
                      this.downtimeData.startTimeStamp,
                      this.downtimeData.endTimeStamp,
                      this.selectedDowntime.ioProductionRunDowntime,
                      false,
                      this.selectedDowntime.ioProductionRunDowntime
                        .associatedProductionEvents.results,
                      this.selectedDowntime.ioProductionRunDowntime
                        .rootcauseMachines.results,
                      selectedRuns
                    );
                  } else {
                    results = this.interfaces.updateDowntimeData(
                      this.downtimeData.startTimeStamp,
                      this.downtimeData.endTimeStamp,
                      this.selectedDowntime.ioProductionRunDowntime
                    );
                  }

                  /* results = this.interfaces.updateDowntimeData(
                              this.downtimeData.startTimeStamp,
                              this.downtimeData.endTimeStamp,
                              this.selectedDowntime.ioProductionRunDowntime);*/

                  if (results.outputCode != undefined) {
                    if (results.outputCode == 0) {
                      sap.oee.ui.Utils.toast(
                        this.appComponent.oBundle.getText(
                          "OEE_MESSAGE_SUCCESSFUL_SAVE"
                        )
                      );
                      this.checkForModeAndPopulateDowntimeTable();
                      this.oDowntimeDialog.close();
                      this.initializeDownTime();
                      this.byId("EditButtonForDowntime").setEnabled(false);
                      this.byId("downtimesTable").removeSelections();
                      this.updateAufnrCastId(0);
                    } else if (results.outputCode == 1) {
                      this.downtimeData.endTimeStamp = endtimeStampTemp;
                      this.downtimeData.startTimeStamp = startTimeStampTemp;
                      //sap.oee.ui.Utils.createMessage(results.outputMessage, sap.ui.core.MessageType.Error);
                    }
                  }
                } else if (this.downtimeMode == "New") {
                  jQuery.sap.require("sap.ui.core.format.NumberFormat");
                  var floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance();
                  if (
                    this.downtimeData &&
                    this.downtimeData.nodeDataList &&
                    this.downtimeData.nodeDataList.length > 0
                  ) {
                    var reportDowntimeMultipleRequest = [];
                    for (
                      var i = 0;
                      i < this.downtimeData.nodeDataList.length;
                      i++
                    ) {
                      var oCrewSize;
                      if (
                        this.appData.node.crewSize ===
                        sap.oee.ui.oeeConstants.checkBooleanValue.TRUE
                      ) {
                        if (
                          this.downtimeData.eventType ===
                            sap.oee.ui.oeeConstants.timeElementTypes
                              .unscheduledDown ||
                          this.downtimeData.eventType ===
                            sap.oee.ui.oeeConstants.timeElementTypes
                              .changeOver ||
                          this.downtimeData.eventType ===
                            sap.oee.ui.oeeConstants.timeElementTypes
                              .scheduledDown
                        ) {
                          oCrewSize = sap.ui.core.Fragment.byId(
                            "downtimeDialog",
                            "crewSizeforDowntime"
                          ).getValue();
                          if (oCrewSize != "") {
                            var value = floatFormatter.parse(oCrewSize);
                            if (isNaN(value) || value < 0) {
                              sap.ui.core.Fragment.byId(
                                "downtimeDialog",
                                "crewSizeforDowntime"
                              ).setValue("");
                              sap.oee.ui.Utils.createMessage(
                                this.appComponent.oBundle.getText(
                                  "OEE_ERR_MSG_CREW_SIZE"
                                ),
                                sap.ui.core.MessageType.Error
                              );
                              return;
                            }
                            oCrewSize = value;
                          } else {
                            oCrewSize = parseFloat(0);
                          }
                        }
                      }

                      var oStandardDuration, standardDurationInSec;
                      if (
                        this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
                      ) {
                        //if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === sap.oee.ui.oeeConstants.dcElementType.planned){
                        oStandardDuration = sap.ui.core.Fragment.byId(
                          "downtimeDialog",
                          "standardDurationforDowntime"
                        ).getValue();
                        if (oStandardDuration != "") {
                          oStandardDuration = floatFormatter.parse(
                            oStandardDuration
                          );
                        }
                        standardDurationInSec = oStandardDuration * 60;
                        var value = new Number(standardDurationInSec);
                        if (
                          isNaN(value) ||
                          value < 0 ||
                          /\d+(\.\d*)$/g.test(value)
                        ) {
                          sap.ui.core.Fragment.byId(
                            "downtimeDialog",
                            "standardDurationforDowntime"
                          ).setValue("");
                          sap.oee.ui.Utils.createMessage(
                            this.appComponent.oBundle.getText(
                              "OEE_ERR_MSG_STANDARD_DURATION"
                            ),
                            sap.ui.core.MessageType.Error
                          );
                          return;
                        }
                        oStandardDuration = parseFloat(value);
                      }

                      var oSelectedFromMaterial;
                      if (
                        this.downtimeData.eventType ===
                          sap.oee.ui.oeeConstants.timeElementTypes.changeOver &&
                        startTime
                      ) {
                        oSelectedFromMaterial = selectedFromMaterial;
                      }

                      var oSelectedToMaterial;
                      if (
                        this.downtimeData.eventType ===
                          sap.oee.ui.oeeConstants.timeElementTypes.changeOver &&
                        endTime
                      ) {
                        oSelectedToMaterial = selectedToMaterial;
                      }
                      if (
                        this.downtimeData.eventType ===
                        sap.oee.ui.oeeConstants.timeElementTypes.changeOver
                      ) {
                        if (oSelectedFromMaterial && oSelectedToMaterial) {
                          if (oSelectedFromMaterial === oSelectedToMaterial) {
                            sap.oee.ui.Utils.createMessage(
                              this.appComponent.oBundle.getText(
                                "OEE_ERR_MSG_CHANGEOVER"
                              ),
                              sap.ui.core.MessageType.Error
                            ); //both from and to materials cannot be equal
                            return;
                          }
                        }
                      }
                      var downtimeDataTemp = {};
                      downtimeDataTemp.plant = this.appData.plant;
                      downtimeDataTemp.nodeID = this.downtimeData.nodeDataList[
                        i
                      ].nodeID;
                      downtimeDataTemp.client = this.appData.client;
                      downtimeDataTemp.dcElement = this.downtimeData.dcElement;
                      downtimeDataTemp.startTimestamp = this.downtimeData.startTimeStamp;
                      if (this.downtimeData.endTimeStamp) {
                        downtimeDataTemp.endTimestamp = this.downtimeData.endTimeStamp;
                      }
                      if (this.downtimeData.reasonCodeData) {
                        downtimeDataTemp.rc1 = this.downtimeData.reasonCodeData.reasonCode1;
                        downtimeDataTemp.rc2 = this.downtimeData.reasonCodeData.reasonCode2;
                        downtimeDataTemp.rc3 = this.downtimeData.reasonCodeData.reasonCode3;
                        downtimeDataTemp.rc4 = this.downtimeData.reasonCodeData.reasonCode4;
                        downtimeDataTemp.rc5 = this.downtimeData.reasonCodeData.reasonCode5;
                        downtimeDataTemp.rc6 = this.downtimeData.reasonCodeData.reasonCode6;
                        downtimeDataTemp.rc7 = this.downtimeData.reasonCodeData.reasonCode7;
                        downtimeDataTemp.rc8 = this.downtimeData.reasonCodeData.reasonCode8;
                        downtimeDataTemp.rc9 = this.downtimeData.reasonCodeData.reasonCode9;
                        downtimeDataTemp.rc10 = this.downtimeData.reasonCodeData.reasonCode10;
                      }
                      downtimeDataTemp.comments = this.downtimeData.comments;
                      downtimeDataTemp.actsAsBottleneck = this.downtimeData.actsAsBottleneck;

                      if (reportPMNotification == true) {
                        downtimeDataTemp.technicalObject =
                          notifDataTemp.technicalObject;
                        downtimeDataTemp.notificationType =
                          notifDataTemp.notificationType;
                        downtimeDataTemp.breakdown = this.PMNotification.actsAsBreakdown;
                      }

                      if (oCrewSize !== undefined) {
                        downtimeDataTemp.crewSize = oCrewSize;
                      }
                      if (oStandardDuration !== undefined) {
                        downtimeDataTemp.standardDuration = oStandardDuration;
                      }
                      if (oSelectedFromMaterial !== undefined) {
                        downtimeDataTemp.fromMaterial = selectedFromMaterial;
                      }
                      if (oSelectedToMaterial !== undefined) {
                        downtimeDataTemp.toMaterial = selectedToMaterial;
                      }
                      downtimeDataTemp.entryType = entryType;
                      if (effectiveDuration !== undefined) {
                        downtimeDataTemp.effectiveDuration =
                          60 * effectiveDuration;
                      }
                      if (frequency !== undefined) {
                        downtimeDataTemp.frequency = frequency;
                      }
                      if (oRunID !== undefined) {
                        downtimeDataTemp.sharingProductionRuns = {};
                        downtimeDataTemp.sharingProductionRuns.results = [];
                        var runID = {
                          runID: oRunID,
                        };
                        downtimeDataTemp.sharingProductionRuns.results.push(
                          runID
                        );
                      }
                      reportDowntimeMultipleRequest.push(downtimeDataTemp);
                    }
                    results = this.interfaces.reportDowntimeMultiple(
                      reportDowntimeMultipleRequest
                    );

                    if (results.outputCode == 0) {
                      sap.oee.ui.Utils.toast(
                        this.appComponent.oBundle.getText(
                          "OEE_MESSAGE_SUCCESSFUL_SAVE"
                        )
                      );
		this.reportRfc(reportDowntimeMultipleRequest);
                      this.checkForModeAndPopulateDowntimeTable();

                      this.oDowntimeDialog.close();
                      this.initializeDownTime();
                      this.byId("EditButtonForDowntime").setEnabled(false);
                      this.byId("downtimesTable").removeSelections();
                    } /*else {
                                  sap.oee.ui.Utils.createMessage(results.outputMessage, sap.ui.core.MessageType.Error);
                              }*/ else if (
                      results.outputCode == 1
                    ) {
                      this.downtimeData.endTimeStamp = endtimeStampTemp;
                      this.downtimeData.startTimeStamp = startTimeStampTemp;
                    }
                  }
                }
              } else {
                sap.oee.ui.Utils.createMessage(
                  this.appComponent.oBundle.getText(
                    "OEE_ERR_MSG_ENTER_START_TIME"
                  ),

                  sap.ui.core.MessageType.Error
                );
                return;
              }
            } else {
              sap.oee.ui.Utils.createMessage(
                this.appComponent.oBundle.getText("OEE_ERR_MSG_SELECT_DCE"),
                sap.ui.core.MessageType.Error
              );
              return;
            }
          } else {
            sap.oee.ui.Utils.createMessage(
              this.appComponent.oBundle.getText("OEE_ERR_MSG_SELECT_WC"),
              sap.ui.core.MessageType.Error
            );
            return;
          }
        }
      },

      removeSecondsFromDowntimeStartAndEndTime: function (obj1) {
        if (obj1) {
          var dateTime = new Date(parseInt(obj1));
          var seconds = dateTime.getSeconds();
          obj1 = obj1 / 1000;
          obj1 = obj1 - seconds;
          obj1 = obj1 * 1000;
          return obj1;
        }
        return "";
      },

      onDowntimeSelect: function (oEvent) {
        this.byId("reportButtonForNotification").setEnabled(true);
        var item = oEvent.getParameter("listItem");
        var path = item.getBindingContext().getPath();

        if (this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.MINOR) {
          this.byId("EditButtonForDowntime").setEnabled(false);
          this.byId("deleteButtonForDowntime").setEnabled(false);
          this.byId("splitButtonForDowntime").setEnabled(true);
          this.selectedDowntime = this.byId("microDowntimesTable")
            .getModel()
            .getProperty(path);
        } else {
          if (
            this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.OVERLAPPING
          ) {
            this.byId("assignToOrderButtonForDowntime").setEnabled(true);
          }

          this.byId("splitButtonForDowntime").setEnabled(true);
          this.byId("EditButtonForDowntime").setEnabled(true);
          this.byId("deleteButtonForDowntime").setEnabled(true);
          this.selectedDowntime = this.byId("downtimesTable")
            .getModel()
            .getProperty(path);

          if (
            (this.selectedDowntime.ioProductionRunDowntime.endTimestamp == "" ||
              this.selectedDowntime.ioProductionRunDowntime.endTimestamp ==
                undefined) &&
            this.selectedDowntime.ioProductionRunDowntime.eventType !==
              sap.oee.ui.oeeConstants.timeElementTypes.changeOver
          ) {
            this.byId("reportUpButtonForDowntime").setEnabled(true);
            this.byId("splitButtonForDowntime").setEnabled(false);
          } else {
            this.byId("reportUpButtonForDowntime").setEnabled(false);
          }
        }
      },

      onPressDeleteDowntime: function (oEvent) {
        this.disableAllSelectionsForEditMode();
        var oController = this.getView().getController();
        var deleteAfterConfirm = function (bConfirm) {
          if (bConfirm == sap.m.MessageBox.Action.OK) {
            var responseOData = oController.interfaces.deleteDowntimeData(
              oController.selectedDowntime.ioProductionRunDowntime
            );
            if (responseOData != undefined && responseOData.outputCode == 0) {
              oController.checkForModeAndPopulateDowntimeTable();
            }
          }
        };
        sap.m.MessageBox.confirm(
          this.appComponent.oBundle.getText("OEE_MESSAGE_DELETE"),
          {
            onClose: deleteAfterConfirm,
          }
        );
      },

      disableAllSelectionsForEditMode: function () {
        this.byId("EditButtonForDowntime").setEnabled(false);
        this.byId("deleteButtonForDowntime").setEnabled(false);
        this.byId("reportUpButtonForDowntime").setEnabled(false);
        this.byId("splitButtonForDowntime").setEnabled(false);
        this.byId("downtimesTable").removeSelections();
      },

      onPressEditDowntime: function (oEvent) {
        var bottleneck = false,
          nodeType,
          isCapacity,
          dateObjectStart,
          timeObjectStart,
          dateObjectEnd,
          timeObjectEnd;
        this.setChangeOverType = "";
        var actsAsBottleneckLabel = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "bottleneckForDowntimeLabel"
        );
        this.disableAllSelectionsForEditMode();
        this.downtimeMode = "Edit";

        if (this.oDowntimeDialog == undefined) {
          this.oDowntimeDialog = sap.ui.xmlfragment(
            "downtimeDialog",
            "sap.oee.ui.fragments.downtimeDialog",
            this
          );
          this.byId(
            sap.ui.core.Fragment.createId("downtimeDialog", "startTime")
          );
          this.byId(sap.ui.core.Fragment.createId("downtimeDialog", "endTime"));
          this.byId(
            sap.ui.core.Fragment.createId(
              "downtimeDialog",
              "durationforDowntime"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "downtimeDialog",
              "commentsForDowntime"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "downtimeDialog",
              "bottleneckForDowntime"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId("downtimeDialog", "typeforDowntime")
          );
          this.getView().addDependent(this.oDowntimeDialog);
        } /*else {
          sap.ui.core.Fragment.byId("downtimeDialog", "startTime").setEnabled(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "endTime").setEnabled(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "durationforDowntime").setEnabled(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "setCurrentForStartTime").setEnabled(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "setCurrentForEndTime").setEnabled(true);
      }*/

        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "reportPMNotification"
        ).setVisible(false); //

        this.initializeDownTime();
        this.enableDisableOnDowntimeDialogOnEdit();
        var nodeDataList = [];
        var nodeDataTemp = {};
        nodeDataTemp.nodeID = this.selectedDowntime.nodeId;
        nodeDataTemp.nodeDescription = this.selectedDowntime.ioProductionRunDowntime.nodeDescription;
        if (this.selectedDowntime.isLineDown) {
          nodeDataTemp.nodeType = "LINE";
          this.workUnitType = "LINE";
        }
        if (this.selectedDowntime.isMachineDown) {
          nodeDataTemp.nodeType = "MACHINE";
        }
        nodeDataList.push(nodeDataTemp);
        this.downtimeData.nodeDataList = nodeDataList;
        this.downtimeData.entryType = this.selectedDowntime.ioProductionRunDowntime.entryType;
        this.downtimeData.eventType = this.selectedDowntime.ioProductionRunDowntime.eventType;
        this.downtimeData.reasonCodeData.description = this.selectedDowntime.ioProductionRunDowntime.descriptionOfReasonCode;
        sap.oee.ui.Utils.convertRcFieldsObjectToReasonCodeDataObject(
          this.selectedDowntime.ioProductionRunDowntime,
          this.downtimeData.reasonCodeData
        );
        this.downtimeData.dcElement = this.selectedDowntime.ioProductionRunDowntime.dcElement;
        this.downtimeData.comments = this.selectedDowntime.ioProductionRunDowntime.comments;

        if (
          this.selectedDowntime.ioProductionRunDowntime.actsAsBottleneck == "F"
        ) {
          this.downtimeData.actsAsBottleneck = false;
        } else {
          this.downtimeData.actsAsBottleneck = true;
        }

        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.changeOver
        ) {
          //if (this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover) {
          this.setChangeOverType = "X";
        } else {
          this.setChangeOverType = "";
        }

        dateObjectStart = new Date(
          this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
            parseFloat(
              this.selectedDowntime.ioProductionRunDowntime.startTimestamp
            )
          )
        );

        this.downtimeData.startDate = dateObjectStart;
        this.downtimeData.startTime = dateObjectStart;

        this.downtimeData.startTimeStamp = dateObjectStart.getTime();

        if (this.selectedDowntime.ioProductionRunDowntime.endTimestamp != "") {
          dateObjectEnd = new Date(
            this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
              parseFloat(
                this.selectedDowntime.ioProductionRunDowntime.endTimestamp
              )
            )
          );

          this.downtimeData.endDate = dateObjectEnd;
          this.downtimeData.endTime = dateObjectEnd;

          this.downtimeData.endTimeStamp = dateObjectEnd.getTime();

          this.downtimeData.duration = new Number(
            this.selectedDowntime.ioProductionRunDowntime.effectiveDuration / 60
          ).toFixed(0);
        }

        if (
          this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
          this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.changeOver ||
          this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
        ) {
          //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.unplanned || this.downtimeData.dcElement ===  sap.oee.ui.oeeConstants.dcElementType.changeover){
          if (this.selectedDowntime.ioProductionRunDowntime.crewSize !== "") {
            this.downtimeData.crewSize = this.selectedDowntime.ioProductionRunDowntime.crewSize;
          }
        }
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
        ) {
          //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.planned){
          if (
            this.selectedDowntime.ioProductionRunDowntime.standardDuration !==
            ""
          ) {
            this.downtimeData.reasonCodeData.targetInMin =
              this.selectedDowntime.ioProductionRunDowntime.standardDuration /
              60;
            //this.downtimeData.reasonCodeData.isFixed = this.selectedDowntime.ioProductionRunDowntime.isFixed ;
            this.downtimeData.reasonCodeData.isFixed = this.selectedDowntime.ioProductionRunDowntime.isFixed;
          }
        }
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.changeOver
        ) {
          //if(this.downtimeData.dcElement === sap.oee.ui.oeeConstants.dcElementType.changeover){
          if (this.selectedDowntime.ioProductionRunDowntime.material !== "") {
            this.downtimeData.selectedFromMaterial = this.selectedDowntime.ioProductionRunDowntime.material;
          }
          if (this.selectedDowntime.ioProductionRunDowntime.toMaterial !== "") {
            this.downtimeData.selectedToMaterial = this.selectedDowntime.ioProductionRunDowntime.toMaterial;
          }
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "downtimeDialog"
          ).setContentHeight("80%");
        } else {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "downtimeDialog"
          ).setContentHeight("70%");
        }

        if (this.selectedDowntime.orderReferences) {
          var orderList = this.selectedDowntime.orderReferences.results;
          var orderSelected = {};
          for (i = 0; i < orderList.length; i++) {
            if (orderList[i].isMappedRecord == true) {
              orderSelected.orderNo = orderList[i].orderNumber;
              orderSelected.operationNo = orderList[i].operationNumber;
              orderSelected.runId = orderList[i].runId;
            }
          }
          if ($.isEmptyObject(orderSelected) == false) {
            this.downtimeData.orderAssign = {
              orderNo: orderSelected.orderNo,
              operationNo: orderSelected.operationNo,
              runId: orderSelected.runId,
            };
          } else {
            if (
              this.appData.selected.order != undefined ||
              this.appData.selected.order != ""
            ) {
              this.downtimeData.orderAssign = {
                orderNo: this.appData.selected.order.orderNo,
                operationNo: this.appData.selected.operationNo,
                runId: this.appData.selected.runID,
              };
            } else {
              this.downtimeData.orderAssign = "";
            }
          }
        }

        this.oDowntimeReportingModel = new sap.ui.model.json.JSONModel({
          downtimeDataForModel: this.downtimeData,
        });
        this.oDowntimeReportingModel.setDefaultBindingMode(
          sap.ui.model.BindingMode.TwoWay
        );
        this.oDowntimeReportingModel.setProperty(
          "/startTime",
          this.downtimeData.startTime
        );
        this.oDowntimeReportingModel.setProperty(
          "/endTime",
          this.downtimeData.endTime
        );
        this.oDowntimeReportingModel.setProperty(
          "/startDate",
          this.downtimeData.startDate
        );
        this.oDowntimeReportingModel.setProperty(
          "/endDate",
          this.downtimeData.endDate
        );

        this.oDowntimeDialog.setModel(this.oDowntimeReportingModel);

        this.downtimeData.firstFillField = "START_TIME";

        this.oDowntimeDialog.setTitle(
          this.appComponent.oBundle.getText("OEE_LABEL_DOWNTIME_EDIT")
        );

        for (var i = 0; i < this.workUnitData.length; i++) {
          if (
            this.selectedDowntime.ioProductionRunDowntime.nodeID ===
            this.workUnitData[i].nodeId
          ) {
            nodeType = this.workUnitData[i].nodeType;
            isCapacity = this.workUnitData[i].isCapacity;
            if (this.workUnitData[i].bottleNeck === true) {
              var bottleneck = true;
              this.setChangeOverType = "X";
            }
            break;
          }
        }
        //Check if its Multi-Capacity Machine
        if (i === this.workUnitData.length) {
          for (i = 0; i < this.workUnitCapacityData.length; i++) {
            if (
              this.selectedDowntime.ioProductionRunDowntime.nodeID ===
              this.workUnitCapacityData[i].nodeId
            ) {
              nodeType = this.workUnitCapacityData[i].nodeType;
              isCapacity = this.workUnitCapacityData[i].isCapacity;
              if (this.workUnitCapacityData[i].bottleNeck === true) {
                var bottleneck = true;
                this.setChangeOverType = "X";
              }
              break;
            }
          }
        }
        //
        if (this.downtimeData.nodeDataList != undefined) {
          var actsAsBottleneckLabel = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "bottleneckForDowntimeLabel"
          );
          var actsAsBottleneck = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "bottleneckForDowntime"
          );
          if (this.downtimeData.nodeDataList.length > 1) {
            actsAsBottleneckLabel.setVisible(true);
            actsAsBottleneck.setVisible(true);
            actsAsBottleneck.setEnabled(false);
          } else {
            if (nodeType == "LINE") {
              actsAsBottleneckLabel.setVisible(true);
              actsAsBottleneck.setVisible(true);
              actsAsBottleneck.setEnabled(false);
            } else if (nodeType == "MACHINE" && bottleneck == false) {
              actsAsBottleneckLabel.setVisible(true);
              actsAsBottleneck.setVisible(true);
              actsAsBottleneck.setEnabled(true);
            } else if (
              (nodeType == "MACHINE" && bottleneck == true) ||
              isCapacity === true
            ) {
              actsAsBottleneckLabel.setVisible(true);
              actsAsBottleneck.setVisible(true);
              actsAsBottleneck.setEnabled(false);
            }
          }
        }

        this.getAndBindDCElementToDowntimeType();
        //this.changeMarkLineDownVisibility();
        this.setChangeOverType = "";

        this.oDowntimeDialog.open();
      },

      onPressReportUptime: function (oEvent) {
        this.byId("downtimesTable").removeSelections();
        this.byId("reportUpButtonForDowntime").setEnabled(false);
        var endTimeStamp = new Date().getTime();
        var endTimeStampWithoutSeconds = this.removeSecondsFromDowntimeStartAndEndTime(
          endTimeStamp
        );
        var results = this.interfaces.updateDowntimeData(
          this.selectedDowntime.ioProductionRunDowntime.startTimestamp,
          endTimeStampWithoutSeconds,
          this.selectedDowntime.ioProductionRunDowntime
        ); // Report Up at current time

        if (results.outputCode != undefined) {
          if (results.outputCode == 0) {
            sap.oee.ui.Utils.toast(
              this.appComponent.oBundle.getText("OEE_MESSAGE_SUCCESSFUL_SAVE")
            );
            this.checkForModeAndPopulateDowntimeTable();
          } else if (results.outputCode == 1) {
            sap.oee.ui.Utils.createMessage(
              results.outputMessage,
              sap.ui.core.MessageType.Error
            );
          }
        }
      },

      onSelectWorkUnit: function (oEvent) {
        if (
          this.workUnitTypeCapacities == undefined ||
          this.workUnitTypeCapacities.getSelected() == false
        ) {
          this.workUnitCapacitiesSelection = false;
          workUnits = this.workUnitData;
          this.oModel.setData({
            modelData: workUnits,
          });
          this.oModel.setSizeLimit(10000);
          this.workUnitDialogOkButton.setVisible(false);
          this.bindMachineGroup();
        } else {
          workUnits = this.workUnitCapacityData;
          this.oModel.setData({
            modelData: workUnits,
          });
          this.workUnitDialogOkButton.setVisible(true);
          this.workUnitCapacitiesSelection = true;
          this.bindCapacities();
        }
      },

      workunitDescriptionFormatter: function (obj) {
        if (!obj) return;
        if (obj != undefined && obj.length > 0) {
          var description = "";
          for (var i = 0; i < obj.length; i++) {
            if (i > 0) {
              description = description + "; ";
            }
            description = description + obj[i].nodeDescription;
          }
          return description;
        }
      },

      showDuration: function (obj) {
        if (obj == undefined || obj == "") return false;
        else return true;
      },

      setSortSettings: function () {
        if (this.oSortDialog == undefined) {
          this.oSortDialog = sap.ui.xmlfragment(
            "sortFragment",
            "sap.oee.ui.fragments.sorterDialog",
            this
          );
          this.getView().addDependent(this.oSortDialog);
        }

        var sortOptionsData = [];

        if (this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.MINOR) {
          var totalDurationSorterOption = {
            sortOptionName: this.interfaces.oOEEBundle.getText(
              "DURATION_LABEL"
            ),
            sortOptionKey: "totalDuration",
            isSortOptionSelected: false,
          };

          sortOptionsData.push(totalDurationSorterOption);
        } else if (
          this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.SHIFTBREAKS
        ) {
          var startTimeSortingOption = {
            sortOptionName: this.interfaces.oOEEBundle.getText(
              "OEE_LABEL_START_TIME"
            ),
            sortOptionKey: "breakStartTimestamp",
            isSortOptionSelected: true,
          };

          sortOptionsData.push(startTimeSortingOption);

          var endTimeSortingOption = {
            sortOptionName: this.interfaces.oOEEBundle.getText(
              "OEE_LABEL_END_TIME"
            ),
            sortOptionKey: "breakEndTimestamp",
            isSortOptionSelected: false,
          };

          sortOptionsData.push(endTimeSortingOption);

          var durationSortingOption = {
            sortOptionName: this.interfaces.oOEEBundle.getText(
              "DURATION_LABEL"
            ),
            sortOptionKey: "breakLengthInSeconds",
            isSortOptionSelected: false,
          };

          sortOptionsData.push(durationSortingOption);
        } else {
          // Do not apply these filters for Minor Stoppages.
          var startTimeSortingOption = {
            sortOptionName: this.interfaces.oOEEBundle.getText(
              "OEE_LABEL_START_TIME"
            ),
            sortOptionKey: "ioProductionRunDowntime/startTimestamp",
            isSortOptionSelected: true,
          };

          sortOptionsData.push(startTimeSortingOption);

          var endTimeSortingOption = {
            sortOptionName: this.interfaces.oOEEBundle.getText(
              "OEE_LABEL_END_TIME"
            ),
            sortOptionKey: "ioProductionRunDowntime/endTimestamp",
            isSortOptionSelected: false,
          };

          sortOptionsData.push(endTimeSortingOption);

          var durationSortingOption = {
            sortOptionName: this.interfaces.oOEEBundle.getText(
              "DURATION_LABEL"
            ),
            sortOptionKey: "ioProductionRunDowntime/effectiveDuration",
            isSortOptionSelected: false,
          };

          sortOptionsData.push(durationSortingOption);
        }

        this.sortModel = this.sortModel || new sap.ui.model.json.JSONModel();

        this.sortModel.setData({
          sortOptions: sortOptionsData,
        });

        var sorterOptionTemplate = new sap.m.ViewSettingsItem({
          text: "{sortOptionName}",
          key: "{sortOptionKey}",
          selected: "{isSortOptionSelected}",
        });

        var sortViewDialog = sap.ui
          .getCore()
          .byId(sap.ui.core.Fragment.createId("sortFragment", "sortDialog"));

        sortViewDialog.bindAggregation(
          "sortItems",
          "/sortOptions",
          sorterOptionTemplate
        );

        this.oSortDialog.setModel(this.sortModel);
      },

      sortDowntimes: function (oEvent) {
        this.setSortSettings();
        this.oSortDialog.open();
      },

      handleSortingConfirm: function (oEvent) {
        var p = oEvent.getParameters(),
          oSorter = null;
        if (p.sortItem) {
          oSorter = new sap.ui.model.Sorter(p.sortItem.getKey(), false);
          oSorter.fnCompare = function (val1, val2) {
            var value1 = isNaN(val1) ? val1 : parseFloat(val1);
            var value2 = isNaN(val2) ? val2 : parseFloat(val2);

            if (!p.sortDescending) {
              // Ascending Order
              if (value1 < value2) return -1;
              if (value1 == value2) return 0;
              if (value1 > value2) return 1;
            } else {
              // Descending Order
              if (value1 < value2) return 1;
              if (value1 == value2) return 0;
              if (value1 > value2) return -1;
            }
          };

          if (oSorter) {
            if (this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.MINOR) {
              this.byId("microDowntimesTable")
                .getBinding("items")
                .sort(oSorter);
            } else if (
              this.setSelectedMode ==
              sap.oee.ui.oeeConstants.dtTypes.SHIFTBREAKS
            ) {
              this.byId("breakScheduleTable").getBinding("items").sort(oSorter);
            } else {
              this.byId("downtimesTable").getBinding("items").sort(oSorter);
            }
          }
        }
      },

      refreshDowntimes: function () {
        this.fireRefreshCompletedHandler =
          this.fireRefreshCompletedHandler ||
          sap.oee.ui.Utils.debounceCall(
            this,
            this.checkForModeAndPopulateDowntimeTable,
            500,
            true
          );
        this.fireRefreshCompletedHandler();
        //this.checkForModeAndPopulateDowntimeTable();
      },

      // Get Downtime details

      prepareDowntimeDetails: function () {
        if (!this.oDowntimeDetails) {
          this.oDowntimeDetails = sap.ui.xmlfragment(
            "downtimeDetailsDialog",
            "sap.oee.ui.fragments.downtimeDetails",
            this
          );
          this.getView().addDependent(this.oDowntimeDetails);
        }
        if (!this.detailModel) {
          this.detailModel = new sap.ui.model.json.JSONModel();
        }
        this.oDowntimeDetails.setModel(this.detailModel);
      },

      onPressDetails: function (oEvent) {
        var details = [],
          that = this;
        var selectedData = oEvent
          .getSource()
          .getParent()
          .getBindingContext()
          .getObject();
        var source = oEvent.getSource();

        if (
          selectedData.ioProductionRunDowntime.entryType &&
          selectedData.ioProductionRunDowntime.entryType !== ""
        ) {
          if (
            selectedData.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_MANUAL ||
            selectedData.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
          ) {
            details.push({
              label: this.appComponent.oBundle.getText(
                "OEE_LABEL_DOWNTIME_ENTRY_TYPE"
              ),
              value: this.appComponent.oBundle.getText(
                "OEE_LABEL_MICRO_STOPPAGE"
              ),
            });
            if (
              selectedData.ioProductionRunDowntime.frequency &&
              selectedData.ioProductionRunDowntime.frequency !== ""
            ) {
              details.push({
                label: this.appComponent.oBundle.getText("OEE_LABEL_FREQUENCY"),
                value: selectedData.ioProductionRunDowntime.frequency,
              });
            }
          }
          if (
            selectedData.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL ||
            selectedData.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO
          ) {
            details.push({
              label: this.appComponent.oBundle.getText(
                "OEE_LABEL_DOWNTIME_ENTRY_TYPE"
              ),
              value: this.appComponent.oBundle.getText(
                "OEE_LABEL_TIME_INTERVAL"
              ),
            });
          }
          if (
            selectedData.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
            selectedData.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO
          ) {
            details.push({
              label: this.appComponent.oBundle.getText(
                "OEE_LABEL_DOWNTIME_ENTRY_TYPE"
              ),
              value: this.appComponent.oBundle.getText(
                "OEE_LABEL_DURATION_BASED"
              ),
            });
          }
        }
        if (selectedData.ioProductionRunDowntime.eventType) {
          if (
            selectedData.ioProductionRunDowntime.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
            selectedData.ioProductionRunDowntime.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.changeOver ||
            selectedData.ioProductionRunDowntime.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
          ) {
            if (
              selectedData.ioProductionRunDowntime.crewSize &&
              parseFloat(selectedData.ioProductionRunDowntime.crewSize) !== 0
            ) {
              details.push({
                label: this.appComponent.oBundle.getText("OEE_LABEL_CREWSIZE"),
                value: selectedData.ioProductionRunDowntime.crewSize,
              });
            }
          }
          if (
            selectedData.ioProductionRunDowntime.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
          ) {
            if (
              selectedData.ioProductionRunDowntime.standardDuration &&
              selectedData.ioProductionRunDowntime.standardDuration !== "0"
            ) {
              details.push({
                label: this.appComponent.oBundle.getText(
                  "OEE_LABEL_STANDARD_DURATION"
                ),
                value:
                  selectedData.ioProductionRunDowntime.standardDuration / 60,
              });
            }
          }
          if (
            selectedData.ioProductionRunDowntime.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.changeOver
          ) {
            if (
              selectedData.ioProductionRunDowntime.material &&
              selectedData.ioProductionRunDowntime.material !== ""
            ) {
              details.push({
                label: this.appComponent.oBundle.getText(
                  "OEE_LABEL_FROM_MATERIAL"
                ),
                value: selectedData.ioProductionRunDowntime.material,
              });
            }
            if (
              selectedData.ioProductionRunDowntime.toMaterial &&
              selectedData.ioProductionRunDowntime.toMaterial !== ""
            ) {
              details.push({
                label: this.appComponent.oBundle.getText(
                  "OEE_LABEL_TO_MATERIAL"
                ),
                value: selectedData.ioProductionRunDowntime.toMaterial,
              });
            }
          }
        }

        /*	if(selectedData.isLineDown || selectedData.isActAsBottleneckMachineDown){
    details.push({label : this.appComponent.oBundle.getText("OEE_LABEL_IMPACTS_LINE"), value : this.appComponent.oBundle.getText("OEE_LABEL_YES")});
  }else{
    details.push({label : this.appComponent.oBundle.getText("OEE_LABEL_IMPACTS_LINE"), value : this.appComponent.oBundle.getText("OEE_LABEL_NO")});
  }*/
        if (
          selectedData.ioProductionRunDowntime.comments &&
          selectedData.ioProductionRunDowntime.comments !== ""
        ) {
          details.push({
            label: this.appComponent.oBundle.getText("OEE_LABEL_COMMENTS"),
            value: selectedData.ioProductionRunDowntime.comments,
          });
        }
        if (
          this.appData &&
          this.appData.node &&
          this.appData.node.lineBehavior
        ) {
          if (
            this.appData.node.lineBehavior ===
            sap.oee.ui.oeeConstants.multiplierLineBehaviourConstant
          ) {
            if (selectedData.ioProductionRunDowntime.multiplier) {
              details.push({
                label: this.appComponent.oBundle.getText(
                  "OEE_LABEL_MULTIPLIER"
                ),
                value: selectedData.ioProductionRunDowntime.multiplier,
              });
            }
          }
        }
        if (
          selectedData.ioProductionRunDowntime.changedBy &&
          selectedData.ioProductionRunDowntime.changedBy !== ""
        ) {
          details.push({
            label: this.appComponent.oBundle.getText(
              "REPORTED_LAST_CHANGED_BY_LABEL"
            ),
            value: selectedData.ioProductionRunDowntime.changedBy,
          });
        }
        if (
          selectedData.ioProductionRunDowntime.changeTimestamp &&
          selectedData.ioProductionRunDowntime.changeTimestamp !== ""
        ) {
          details.push({
            label: this.appComponent.oBundle.getText(
              "OEE_LABEL_DATE_TIME_LAST_REPORTED"
            ),
            value: sap.oee.ui.Formatter.formatTimeStampWithoutLabel(
              selectedData.ioProductionRunDowntime.changeTimestamp,
              that.appData.plantTimezoneOffset,
              this.appData.plantTimezoneKey
            ),
          });
        }
        this.detailModel.setData({ details: details });
        this.oDowntimeDetails.openBy(source);
      },

      //Press Button To Report Notification

      onPressReportNotification: function (oEvent) {
        this.initializeNotif();
        this.reportNotificationMode = "NEW";
        var techObj1 = [];
        this.downWithNotif = "X";
        this.byId("downtimesTable").removeSelections();
        this.byId("microDowntimesTable").removeSelections();
        this.byId("EditButtonForDowntime").setEnabled(false);
        this.byId("deleteButtonForDowntime").setEnabled(false);
        this.byId("splitButtonForDowntime").setEnabled(false);
        this.byId("reportButtonForNotification").setEnabled(false);
        this.byId("reportUpButtonForDowntime").setEnabled(false);

        var results = [];
        var results = this.checkNotifType(
          this.appData.client,
          this.appData.plant,
          this.selectedDowntime.nodeId
        );
        if (results.outputCode != 1) {
          if (results.customizationValues.results.length > 0) {
            this.notificationType = results.customizationValues.results;

            if (this.selectedDowntime.nodeId !== undefined) {
              var nodeId = this.selectedDowntime.nodeId;
              for (var i = 0; i < this.workUnitData.length; i++) {
                if (nodeId == this.workUnitData[i].nodeId) {
                  var technicalObject = [];
                  technicalObject = this.workUnitData[i].technicalObject;
                  this.selectedDowntime.technicalObject = technicalObject;
                  break;
                }
              }
            }

            //For setSelectedMode (Based on selected Mode it will bind the node description)
            if (
              this.setSelectedMode ==
                sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN ||
              this.setSelectedMode ==
                sap.oee.ui.oeeConstants.dtTypes.LINEDOWN ||
              this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.FLOWTIME
            ) {
              this.selectedDowntime.nodeDesc = this.selectedDowntime.ioProductionRunDowntime.nodeDescription;
            } else {
              this.selectedDowntime.nodeDesc = this.selectedDowntime.nodeDescription;
            }

            if (this.selectedDowntime.nodeId !== undefined) {
              if (this.selectedDowntime.technicalObject !== undefined) {
                for (
                  var i = 0;
                  i < this.selectedDowntime.technicalObject.length;
                  i++
                ) {
                  if (
                    this.selectedDowntime.technicalObject[i].equipmentID !==
                      "" ||
                    this.selectedDowntime.technicalObject[i].flocID !== ""
                  ) {
                    techObj1.push(this.selectedDowntime.technicalObject[i]);
                  }
                }
                this.oModel1 = new sap.ui.model.json.JSONModel();
                this.oModel1.setData({
                  modelData: techObj1,
                });
                this.pmFLDialog.setModel(this.oModel1);

                var oBindingInfo = {};
                oBindingInfo.path = "/modelData";

                oBindingInfo.factory = jQuery.proxy(function (sId, oContext) {
                  var oFloc = oContext.getProperty("flocID");
                  var oEquip = oContext.getProperty("equipmentID");
                  var oTemplate = new sap.m.ColumnListItem({
                    cells: [
                      new sap.m.Text({
                        text: "{flocID}",
                      }),
                      new sap.m.Text({
                        text:
                          "{path:'equipmentID' , formatter:'sap.oee.ui.Formatter.formatRemoveLeadingZero'}",
                      }),
                    ],
                    type: "Active",
                    press: [this.handleOKForFLDialog, this],
                  });

                  return oTemplate;
                }, this);

                this.pmList.bindAggregation("items", oBindingInfo);
                this.pmList.rerender();
              }
            }
            this.pmFLDialog.setTitle(
              this.appComponent.oBundle.getText(
                "OEE_LABEL_SELECT_TECHINALOBJECT"
              )
            );
            this.pmFLDialog.open();
          } else {
            sap.oee.ui.Utils.createMessage(
              this.appComponent.oBundle.getText(
                "OEE_MESSAGE_MAINTAIN_PM_NOTIFICATION_TYPE"
              ),
              sap.ui.core.MessageType.Error
            );
          }
        }
      },

      checkNotifType: function (client, plant, nodeID) {
        var notif_data = [];
        notifdata = this.interfaces.getAllCustomizationValuesForNode(
          client,
          plant,
          nodeID,
          sap.oee.ui.oeeConstants.customizationNames.notificationType
        );
        return notifdata;
      },
      //Prepare pmFLDialog

      preparepmFLDialog: function () {
        if (this.pmFLDialog == undefined) {
          this.pmFLDialog = sap.ui.xmlfragment(
            "pmFL",
            "sap.oee.ui.fragments.technicalObjectDialog",
            this
          );
          this.pmList = sap.ui.core.Fragment.byId("pmFL", "techTable");
          this.search = sap.ui.core.Fragment.byId("pmFL", "searchTechObject");
        }
        this.getView().addDependent(this.pmFLDialog);
      },

      prepareDowntimeDialog: function () {
        if (this.oDowntimeDialog == undefined) {
          this.oDowntimeDialog = sap.ui.xmlfragment(
            "downtimeDialog",
            "sap.oee.ui.fragments.downtimeDialog",
            this
          );

          this.DwnStartTime = sap.ui.core.Fragment.createId(
            "downtimeDialog",
            "startTime"
          );
          this.DwnEndTime = sap.ui.core.Fragment.createId(
            "downtimeDialog",
            "endTime"
          );
          this.DwnDuration = sap.ui.core.Fragment.createId(
            "downtimeDialog",
            "durationforDowntime"
          );
          this.DwnComment = sap.ui.core.Fragment.createId(
            "downtimeDialog",
            "commentsForDowntime"
          );
          this.DwnBottleneck = sap.ui.core.Fragment.createId(
            "downtimeDialog",
            "bottleneckForDowntime"
          );
          this.Dwntype = sap.ui.core.Fragment.createId(
            "downtimeDialog",
            "typeforDowntime"
          );
          this.DwnNotif = sap.ui.core.Fragment.createId(
            "downtimeDialog",
            "reportPMNotification"
          );
          this.DwnCrewSize = sap.ui.core.Fragment.createId(
            "downtimeDialog",
            "crewSize"
          );
          this.getView().addDependent(this.oDowntimeDialog);
        }
      },

      initializeNotification: function () {
        this.notificationData = {};
        this.notificationData.duration = null;
        this.notificationData.breakdown = "false";
        this.notificationData.startTime = null;
        this.notificationData.endTime = null;
        this.notificationData.startDate = null;
        this.notificationData.endDate = null;
        this.notificationData.comments = null;
        this.notificationData.notificationType = null;
      },

      handleOKForFLDialog: function (oEvent) {
        var startTimeDown, endTimeDown;
        if (this.downWithNotif === "X") {
          if (
            this.notificationData.startTime === null &&
            this.notificationData.endTime === null
          ) {
            this.notificationData = this.selectedDowntime;

            if (
              this.setSelectedMode ==
                sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN ||
              this.setSelectedMode ==
                sap.oee.ui.oeeConstants.dtTypes.LINEDOWN ||
              this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.FLOWTIME
            ) {
              startTimeDown = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                parseFloat(
                  this.selectedDowntime.ioProductionRunDowntime.startTimestamp
                )
              );
            } else {
              startTimeDown = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                parseFloat(
                  this.selectedDowntime.aggregatedData.results[0]
                    .ioProductionRunDowntime.startTimestamp
                )
              );
            }

            if (
              this.setSelectedMode ==
                sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN ||
              this.setSelectedMode ==
                sap.oee.ui.oeeConstants.dtTypes.LINEDOWN ||
              this.setSelectedMode == sap.oee.ui.oeeConstants.dtTypes.FLOWTIME
            ) {
              endTimeDown = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                parseFloat(
                  this.selectedDowntime.ioProductionRunDowntime.endTimestamp
                )
              );
            } else {
              endTimeDown = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                parseFloat(
                  this.selectedDowntime.aggregatedData.results[0]
                    .ioProductionRunDowntime.endTimestamp
                )
              );
            }
          } else {
            startTimeDown = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
              parseFloat(this.notificationData.startTimeStamp)
            );
            endTimeDown = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
              parseFloat(this.notificationData.endTimeStamp)
            );
          }

          this.notificationData.startDate = new Date(startTimeDown);
          this.notificationData.endDate = new Date(endTimeDown);
          this.notificationData.startTime = new Date(startTimeDown);
          this.notificationData.endTime = new Date(endTimeDown);

          var selected = oEvent.getSource().getBindingContext().getObject();
          this.notificationData.fLocation = selected.flocID;
          this.notificationData.equipment = selected.equipmentID;
          if (
            startTimeDown !== "" &&
            endTimeDown !== "" &&
            startTimeDown !== undefined &&
            endTimeDown !== undefined
          ) {
            var duratn = endTimeDown - startTimeDown;
            var duration = parseInt(duratn / (1000 * 60));
            this.notificationData.duration = duration;
          } else {
            this.notificationData.duration = null;
          }

          if (this.oPMNotificationDialog == undefined) {
            this.oPMNotificationDialog = sap.ui.xmlfragment(
              "PMDialog",
              "sap.oee.ui.fragments.PMNotificationDialog",
              this
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "startTimeforPMNotification"
              )
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "endTimeforPMNotification"
              )
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "startDateforPMNotification"
              )
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "endDateforPMNotification"
              )
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "durationforPMNotification"
              )
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "commentsForPMNotification"
              )
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "breakDownForPMNotification"
              )
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "SinglePMNotificationType"
              )
            );
            this.byId(
              sap.ui.core.Fragment.createId(
                "PMDialog",
                "MultiPMNotificationType"
              )
            );
            this.getView().addDependent(this.oPMNotificationDialog);
          } else {
            sap.ui.core.Fragment.byId(
              "PMDialog",
              "startTimeforPMNotification"
            ).setEnabled(true);
            sap.ui.core.Fragment.byId(
              "PMDialog",
              "endTimeforPMNotification"
            ).setEnabled(true);
            sap.ui.core.Fragment.byId(
              "PMDialog",
              "startDateforPMNotification"
            ).setEnabled(true);
            sap.ui.core.Fragment.byId(
              "PMDialog",
              "endDateforPMNotification"
            ).setEnabled(true);
            sap.ui.core.Fragment.byId(
              "PMDialog",
              "durationforPMNotification"
            ).setEnabled(true);
            sap.ui.core.Fragment.byId(
              "PMDialog",
              "setCurrentForStartTimePM"
            ).setEnabled(true);
            sap.ui.core.Fragment.byId(
              "PMDialog",
              "setCurrentForEndTimePM"
            ).setEnabled(true);
          }

          var results = this.checkNotifType(
            this.appData.client,
            this.appData.plant,
            this.selectedDowntime.nodeId
          );
          if (results.outputCode != 1) {
            if (results.customizationValues.results.length > 0) {
              this.notificationType = results.customizationValues.results;
            }
          }

          this.notificationTypeValue();
          this.oPMNotificationDialogReportingModel = new sap.ui.model.json.JSONModel(
            {
              notificationDataForModel: this.notificationData,
            }
          );
          this.oPMNotificationDialogReportingModel.setDefaultBindingMode(
            sap.ui.model.BindingMode.TwoWay
          );
          this.oPMNotificationDialogReportingModel.setProperty(
            "/startTime",
            this.notificationData.startTime
          );
          this.oPMNotificationDialogReportingModel.setProperty(
            "/endTime",
            this.notificationData.endTime
          );
          this.oPMNotificationDialogReportingModel.setProperty(
            "/startDate",
            this.notificationData.startDate
          );
          this.oPMNotificationDialogReportingModel.setProperty(
            "/endDate",
            this.notificationData.endDate
          );

          this.oPMNotificationDialog.setModel(
            this.oPMNotificationDialogReportingModel
          );
          //
          if (this.reportNotificationMode === "UPDATE") {
            this.oPMNotificationDialog.setTitle(
              this.appComponent.oBundle.getText("OEE_LABEL_UPDATE_NOTIFICATION")
            );
          } else {
            this.oPMNotificationDialog.setTitle(
              this.appComponent.oBundle.getText("OEE_LABEL_CREATE_NOTIFICATION")
            );
          }
          this.search.setValue("");
          this.pmFLDialog.close();
          this.oPMNotificationDialog.open();
        } else {
          var selected = oEvent.getSource().getBindingContext().getObject();
          this.PMNotification.fLocation = selected.flocID;
          this.PMNotification.equipment = selected.equipmentID;
          if (this.notificationType && this.notificationType.length > 0) {
            if (this.notificationType.length === 1) {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "SinglePMNotificationType"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiPMNotificationType"
              ).setVisible(false);
              this.PMNotification.notificationType = this.notificationType[0].value;
            } else {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "SinglePMNotificationType"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiPMNotificationType"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiValue"
              ).setSelectedKey(this.notificationType[0].value);
              this.PMNotification.notificationTypes = this.notificationType;
            }
          }
          if (!this.oTechObjModel)
            this.oTechObjModel = new sap.ui.model.json.JSONModel();
          this.oTechObjModel.setData({
            downtimeDataForModel: this.PMNotification,
          });
          this.oTechObjModel.setDefaultBindingMode(
            sap.ui.model.BindingMode.TwoWay
          );
          this.oDowntimeDialog.setModel(this.oTechObjModel, "PMNotification");
          this.search.setValue("");

          this.pmFLDialog.close();
        }
      },

      notificationTypeValue: function () {
        if (
          this.reportNotificationMode === "UPDATE" &&
          this.selectedPMNotification.notificationNo !== ""
        ) {
          this.notificationData.notificationType = this.selectedPMNotification.notificationType;
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "SinglePMNotificationType"
          ).setVisible(true);
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "MultiPMNotificationType"
          ).setVisible(false);
        } else {
          if (this.notificationType && this.notificationType.length > 0) {
            if (this.notificationType.length === 1) {
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "SinglePMNotificationType"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "MultiPMNotificationType"
              ).setVisible(false);
              this.notificationData.notificationType = this.notificationType[0].value;
            } else {
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "SinglePMNotificationType"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "MultiPMNotificationType"
              ).setVisible(true);
              var changeNotificationType = sap.ui.core.Fragment.byId(
                "PMDialog",
                "MultiValue"
              ).getSelectedKey();
              if (this.reportNotificationMode === "UPDATE") {
                sap.ui.core.Fragment.byId(
                  "PMDialog",
                  "MultiValue"
                ).setSelectedKey(changeNotificationType);
              } else {
                sap.ui.core.Fragment.byId(
                  "PMDialog",
                  "MultiValue"
                ).setSelectedKey(this.notificationType[0].value);
              }

              this.notificationData.notificationTypes = this.notificationType;
            }
          }
        }
      },

      onChangeTypePM: function (oEvent) {
        var startDate, startTime, startDateTime, endDate, endTime, endDateTime;
        startDate = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startDateforPMNotification"
        ).getDateValue();
        startTime = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startTimeforPMNotification"
        ).getDateValue();

        startDateTime = this.getDateObjectFromUI(startDate, startTime);

        if (startDateTime != undefined && startDateTime != "") {
          this.notificationData.startDate = startDateTime;
          this.notificationData.startTime = startDateTime;
          this.notificationData.startTimeStamp = startDateTime.getTime();

          endDate = sap.ui.core.Fragment.byId(
            "PMDialog",
            "endDateforPMNotification"
          ).getDateValue();
          endTime = sap.ui.core.Fragment.byId(
            "PMDialog",
            "endTimeforPMNotification"
          ).getDateValue();
          endDateTime = this.getDateObjectFromUI(endDate, endTime);
          var duration = sap.ui.core.Fragment.byId(
            "PMDialog",
            "durationforPMNotification"
          ).getValue();

          if (endDateTime != undefined && endDateTime != "") {
            this.notificationData.endDate = endDateTime;
            this.notificationData.endTime = endDateTime;
            this.notificationData.endTimeStamp = endDateTime.getTime();

            if (
              this.notificationData.endTimeStamp <
              this.notificationData.startTimeStamp
            ) {
              sap.oee.ui.Utils.createMessage(
                this.appComponent.oBundle.getText(
                  "START_TIME_GREATER_THAN_END_TIME_ERROR"
                ),
                sap.ui.core.MessageType.Error
              );
              return;
            }
          }
        }
        var comments = sap.ui.core.Fragment.byId(
          "PMDialog",
          "commentsForPMNotification"
        ).getValue();
        if (comments != undefined && comments != "") {
          this.notificationData.comments = comments;
        }
        var actsAsBreakdown = sap.ui.core.Fragment.byId(
          "PMDialog",
          "breakDownForPMNotification"
        ).getSelected();
        if (actsAsBreakdown != undefined && actsAsBreakdown != "") {
          this.notificationData.actsAsBreakdown = actsAsBreakdown;
        }

        this.pmFLDialog.setTitle(
          this.appComponent.oBundle.getText("OEE_LABEL_SELECT_TECHINALOBJECT")
        );
        this.pmFLDialog.open();
      },

      //

      onChangeTypeDownTechObj: function (oEvent) {
        var type = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "typeforDowntime"
        );

        //
        if (
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "checkPMNotification"
          ).getSelected() == true
        ) {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "functionalLocation"
          ).setVisible(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(
            true
          );
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(
            true
          );
        } else {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "functionalLocation"
          ).setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(
            false
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "SinglePMNotificationType"
          ).setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(
            false
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "SinglePMNotificationType"
          ).setVisible(false);
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "MultiPMNotificationType"
          ).setVisible(false);
        }

        //
        var startTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        ).getDateValue();
        if (startTime != undefined && startTime != "") {
          this.downtimeData.startTime = startTime;
          this.downtimeData.startTimeStamp = startTime.getTime();
          var endTime = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "endTime"
          ).getDateValue();
          var duration = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "durationforDowntime"
          ).getValue();

          if (endTime != undefined && endTime != "") {
            this.downtimeData.endTime = endTime;
            this.downtimeData.endTimeStamp = endTime.getTime();

            if (
              this.downtimeData.endTimeStamp < this.downtimeData.startTimeStamp
            ) {
              sap.oee.ui.Utils.createMessage(
                this.appComponent.oBundle.getText(
                  "START_TIME_GREATER_THAN_END_TIME_ERROR"
                ),
                sap.ui.core.MessageType.Error
              );
              return;
            }
          }
        }
        var comments = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "commentsForDowntime"
        ).getValue();
        if (comments != undefined && comments != "") {
          this.downtimeData.comments = comments;
        }
        var actsAsBottleneck = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "bottleneckForDowntime"
        ).getSelected();
        if (actsAsBottleneck != undefined && actsAsBottleneck != "") {
          this.downtimeData.actsAsBottleneck = actsAsBottleneck;
        }

        this.downtimeData.dcElement = type.getSelectedKey();
        this.downtimeData.reasonCodeData = {};

        if (
          this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
          this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
        ) {
          //if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === "UNSCHEDULED_DOWN"){
          this.downtimeData.crewSize = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "crewSizeforDowntime"
          ).getValue();
        }
        if (
          this.downtimeData.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
        ) {
          //if(sap.ui.core.Fragment.byId("downtimeDialog", "typeforDowntime").getSelectedKey() === "SCHEDULED_DOWN"){
          this.downtimeData.standardDuration = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "standardDurationforDowntime"
          ).getValue();
        }

        this.pmFLDialog.setTitle(
          this.appComponent.oBundle.getText("OEE_LABEL_SELECT_TECHINALOBJECT")
        );
        this.pmFLDialog.open();
      },

      handleCancelForPMDialog: function () {
        this.oPMNotificationDialog.close();
      },

      //For PM Dialog set Start Time
      setStartTimePM: function () {
        var startDate = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startDateforPMNotification"
        ).getDateValue();
        var startTime = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startTimeforPMNotification"
        ).getDateValue();
        var duration = sap.ui.core.Fragment.byId(
          "PMDialog",
          "durationforPMNotification"
        ).getValue();
        if (startDate && startTime && startDate != "" && startTime != "") {
          if (duration !== undefined && duration !== null && duration !== "") {
            this.notificationData.startTimeStamp = sap.oee.ui.Utils.createTimestampFromDateTime(
              startDate,
              startTime
            ).getTime();
            this.notificationData.firstFillField = "DURATION";
          }
          this.notificationData.startTimeStamp = sap.oee.ui.Utils.createTimestampFromDateTime(
            startDate,
            startTime
          ).getTime();
          if (this.notificationData.startTimeStamp != undefined) {
            if (this.notificationData.firstFillField == undefined) {
              this.notificationData.firstFillField = "START_TIME";
            } else {
              if (this.notificationData.firstFillField != "START_TIME") {
                this.notificationData.secondFillField = "START_TIME";
              }
            }

            sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
              this.notificationData,
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "startDateforPMNotification"
              ),
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "startTimeforPMNotification"
              ),
              sap.ui.core.Fragment.byId("PMDialog", "endDateforPMNotification"),
              sap.ui.core.Fragment.byId("PMDialog", "endTimeforPMNotification"),
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "durationforPMNotification"
              ),
              sap.ui.core.Fragment.byId("PMDialog", "setCurrentForStartTimePM"),
              sap.ui.core.Fragment.byId("PMDialog", "setCurrentForEndTimePM"),
              this.interfaces
            );
          }
        } else {
          if (this.notificationData.firstFillField == "START_TIME") {
            if (this.notificationData.secondFillField != undefined) {
              this.notificationData.firstFillField = this.notificationData.secondFillField;
              this.notificationData.secondFillField = undefined;
            } else {
              this.notificationData.firstFillField = undefined;
            }
          }

          if (this.notificationData.secondFillField == "START_TIME") {
            this.notificationData.secondFillField = undefined;
          }

          sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
            this.notificationData,
            sap.ui.core.Fragment.byId("PMDialog", "startDateforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "startTimeforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "endDateforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "endTimeforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "durationforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "setCurrentForStartTimePM"),
            sap.ui.core.Fragment.byId("PMDialog", "setCurrentForEndTimePM"),
            this.interfaces
          );
        }
      },

      //For PM Dialog Button Press Function for Reset Start Date
      onPressResetStartDatePM: function (oEvent) {
        var currentTimeStamp, dateObject;

        currentTimeStamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
          new Date().getTime()
        );
        dateObject = new Date(currentTimeStamp);

        this.oPMNotificationDialogReportingModel.setProperty(
          "/startDate",
          dateObject
        );
        this.oPMNotificationDialogReportingModel.setProperty(
          "/startTime",
          dateObject
        );
        this.oPMNotificationDialogReportingModel.refresh();

        this.setStartTimePM();
      },

      //For PM Dialog set End Time
      setEndTimePM: function () {
        var startDate = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startDateforPMNotification"
        ).getDateValue();
        var startTime = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startTimeforPMNotification"
        ).getDateValue();
        var endDate = sap.ui.core.Fragment.byId(
          "PMDialog",
          "endDateforPMNotification"
        ).getDateValue();
        var endTime = sap.ui.core.Fragment.byId(
          "PMDialog",
          "endTimeforPMNotification"
        ).getDateValue();
        if (startDate && startTime && startDate != "" && startTime != "") {
          this.notificationData.startTimeStamp = sap.oee.ui.Utils.createTimestampFromDateTime(
            startDate,
            startTime
          ).getTime();
          this.notificationData.firstFillField = "START_TIME";
        }
        if (endTime != undefined) {
          this.notificationData.endTimeStamp = sap.oee.ui.Utils.createTimestampFromDateTime(
            endDate,
            endTime
          ).getTime();
          if (this.notificationData.endTimeStamp != undefined) {
            if (this.notificationData.firstFillField == undefined) {
              this.notificationData.firstFillField = "END_TIME";
            } else {
              if (this.notificationData.firstFillField != "END_TIME") {
                this.notificationData.secondFillField = "END_TIME";
              }
            }
            sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
              this.notificationData,
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "startDateforPMNotification"
              ),
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "startTimeforPMNotification"
              ),
              sap.ui.core.Fragment.byId("PMDialog", "endDateforPMNotification"),
              sap.ui.core.Fragment.byId("PMDialog", "endTimeforPMNotification"),
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "durationforPMNotification"
              ),
              sap.ui.core.Fragment.byId("PMDialog", "setCurrentForStartTimePM"),
              sap.ui.core.Fragment.byId("PMDialog", "setCurrentForEndTimePM"),
              this.interfaces
            );
          }
        } else {
          if (this.notificationData.firstFillField == "END_TIME") {
            if (this.notificationData.secondFillField != undefined) {
              this.notificationData.firstFillField = this.notificationData.secondFillField;
              this.notificationData.secondFillField = undefined;
            } else {
              this.notificationData.firstFillField = undefined;
            }
          }

          if (this.notificationData.secondFillField == "END_TIME") {
            this.notificationData.secondFillField = undefined;
          }

          sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
            this.notificationData,
            sap.ui.core.Fragment.byId("PMDialog", "startDateforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "startTimeforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "endDateforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "endTimeforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "durationforPMNotification"),
            sap.ui.core.Fragment.byId("PMDialog", "setCurrentForStartTimePM"),
            sap.ui.core.Fragment.byId("PMDialog", "setCurrentForEndTimePM"),
            this.interfaces
          );
        }
      },

      //For PM Dialog Button Press Function for Reset End Date
      onPressResetEndDatePM: function (oEvent) {
        var currentTimeStamp, dateObject;

        currentTimeStamp = this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
          new Date().getTime()
        );
        dateObject = new Date(currentTimeStamp);

        this.oPMNotificationDialogReportingModel.setProperty(
          "/endDate",
          dateObject
        );
        this.oPMNotificationDialogReportingModel.setProperty(
          "/endTime",
          dateObject
        );
        this.oPMNotificationDialogReportingModel.refresh();
        this.setEndTimePM();
      },

      //For PM Dialog set Duration in Mins
      setDurationInMinsPM: function () {
        var startDate = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startDateforPMNotification"
        ).getDateValue();
        var startTime = sap.ui.core.Fragment.byId(
          "PMDialog",
          "startTimeforPMNotification"
        ).getDateValue();
        var duration = sap.ui.core.Fragment.byId(
          "PMDialog",
          "durationforPMNotification"
        ).getValue();
        if (startDate && startTime && startDate != "" && startTime != "") {
          this.notificationData.startTimeStamp = sap.oee.ui.Utils.createTimestampFromDateTime(
            startDate,
            startTime
          ).getTime();
          this.notificationData.firstFillField = "START_TIME";
        }
        if (duration != undefined) {
          this.notificationData.duration = duration;
          if (parseInt(duration) > 0) {
            this.notificationData.duration = duration;
            if (this.notificationData.firstFillField == undefined) {
              this.notificationData.firstFillField = "DURATION";
            } else {
              if (this.notificationData.firstFillField != "DURATION") {
                this.notificationData.secondFillField = "DURATION";
              }
            }
            sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
              this.notificationData,
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "startDateforPMNotification"
              ),
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "startTimeforPMNotification"
              ),
              sap.ui.core.Fragment.byId("PMDialog", "endDateforPMNotification"),
              sap.ui.core.Fragment.byId("PMDialog", "endTimeforPMNotification"),
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "durationforPMNotification"
              ),
              sap.ui.core.Fragment.byId("PMDialog", "setCurrentForStartTimePM"),
              sap.ui.core.Fragment.byId("PMDialog", "setCurrentForEndTimePM"),
              this.interfaces
            );
          } else if (duration.length == 0) {
            if (this.notificationData.firstFillField == "DURATION") {
              if (this.notificationData.secondFillField != undefined) {
                this.notificationData.firstFillField = this.notificationData.secondFillField;
                this.notificationData.secondFillField = undefined;
              } else {
                this.notificationData.firstFillField = undefined;
              }
            }

            if (this.notificationData.secondFillField == "DURATION") {
              this.notificationData.secondFillField = undefined;
            }

            sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
              this.notificationData,
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "startDateforPMNotification"
              ),
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "startTimeforPMNotification"
              ),
              sap.ui.core.Fragment.byId("PMDialog", "endDateforPMNotification"),
              sap.ui.core.Fragment.byId("PMDialog", "endTimeforPMNotification"),
              sap.ui.core.Fragment.byId(
                "PMDialog",
                "durationforPMNotification"
              ),
              sap.ui.core.Fragment.byId("PMDialog", "setCurrentForStartTimePM"),
              sap.ui.core.Fragment.byId("PMDialog", "setCurrentForEndTimePM"),
              this.interfaces
            );
          }
        }
      },

      //For PM Dialog button to clear the date and duration

      onPressClearDatesAndDurationForPMDialog: function (oEvent) {
        this.notificationData.firstFillField = undefined;
        this.notificationData.secondFillField = undefined;
        sap.oee.ui.Utils.calculateStartAndEndDatesWithDuration(
          this.notificationData,
          sap.ui.core.Fragment.byId("PMDialog", "startDateforPMNotification"),
          sap.ui.core.Fragment.byId("PMDialog", "startTimeforPMNotification"),
          sap.ui.core.Fragment.byId("PMDialog", "endDateforPMNotification"),
          sap.ui.core.Fragment.byId("PMDialog", "endTimeforPMNotification"),
          sap.ui.core.Fragment.byId("PMDialog", "durationforPMNotification"),
          sap.ui.core.Fragment.byId("PMDialog", "setCurrentForStartTimePM"),
          sap.ui.core.Fragment.byId("PMDialog", "setCurrentForEndTimePM"),
          this.interfaces
        );

        this.notificationData.startTimeStamp = undefined;
        this.notificationData.endTimeStamp = undefined;

        this.oPMNotificationDialogReportingModel.setProperty("/startDate", "");
        this.oPMNotificationDialogReportingModel.setProperty("/endDate", "");
        this.oPMNotificationDialogReportingModel.setProperty("/startTime", "");
        this.oPMNotificationDialogReportingModel.setProperty("/endTime", "");
        this.oPMNotificationDialogReportingModel.refresh();

        this.oPMNotificationDialog.rerender();
      },

      //Search for Technical Objects Dialog

      handleSearchForTechnicalObjects: function (oEvent) {
        var properties = [];
        properties.push("flocID");
        properties.push("equipmentID");

        sap.oee.ui.Utils.fuzzySearch(
          this,
          this.oModel1,
          oEvent.getSource().getValue(),
          this.pmList.getBinding("items"),
          oEvent.getSource(),
          properties
        );
      },

      handleCloseForTechnicalObjects: function () {
        this.search.setValue("");
        this.initializeDowntimewithPMNotification();

        this.pmFLDialog.close();
      },

      initializeNotif: function () {
        this.notificationData.startTime = null;
        this.notificationData.endTime = null;
        this.notificationData.startDate = null;
        this.notificationData.endDate = null;
        this.notificationData.duration = null;
        this.notificationData.comments = null;
        this.notificationData.notificationType = null;
        this.notificationData.actsAsBreakdown = null;
        this.notificationData.notificationType = null;
      },

      //Handle OK for PM Dialog
      handleOkForPMDialog: function () {

        if (this.notificationData !== undefined) {
          var combinedStartDate, combinedEndDate;
          var startDate = sap.ui.core.Fragment.byId(
            "PMDialog",
            "startDateforPMNotification"
          ).getDateValue();
          var startTime = sap.ui.core.Fragment.byId(
            "PMDialog",
            "startTimeforPMNotification"
          ).getDateValue();
          if (startDate && startTime && startDate != "" && startTime != "") {
            var endDate = sap.ui.core.Fragment.byId(
              "PMDialog",
              "endDateforPMNotification"
            ).getDateValue();
            var endTime = sap.ui.core.Fragment.byId(
              "PMDialog",
              "endTimeforPMNotification"
            ).getDateValue();
            if (endDate && endTime && endDate != "" && endTime != "") {
              combinedStartDate = sap.oee.ui.Utils.createTimestampFromDateTime(
                startDate,
                startTime
              );
              combinedEndDate = sap.oee.ui.Utils.createTimestampFromDateTime(
                endDate,
                endTime
              );
              if (combinedEndDate <= combinedStartDate) {
                sap.oee.ui.Utils.createMessage(
                  this.appComponent.oBundle.getText(
                    "START_TIME_GREATER_THAN_END_TIME_ERROR"
                  ),
                  sap.ui.core.MessageType.Error
                );
                return;
              }
              this.notificationData.endTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
                combinedEndDate.getTime(),
                this.appData.plantTimezoneOffset
              );
            }

            this.notificationData.startTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
              combinedStartDate.getTime(),
              this.appData.plantTimezoneOffset
            );

            var duration = sap.ui.core.Fragment.byId(
              "PMDialog",
              "durationforPMNotification"
            ).getValue();
            var comments = sap.ui.core.Fragment.byId(
              "PMDialog",
              "commentsForPMNotification"
            ).getValue();
            var breakdown = sap.ui.core.Fragment.byId(
              "PMDialog",
              "breakDownForPMNotification"
            ).getSelected();

            if (comments !== undefined && comments !== "") {
              this.notificationData.comments = comments;
            }
            if (breakdown !== undefined) {
              this.notificationData.breakdown = breakdown;
            }

            if (duration !== undefined) {
              this.notificationData.duration = duration;
            }

            var results = undefined;
            if (this.notificationData) {
              var notifDataTemp = {};
              notifDataTemp.plant = this.appData.plant;
              notifDataTemp.client = this.appData.client;
              notifDataTemp.nodeID = this.notificationData.nodeId;
              notifDataTemp.startTimeStamp = this.notificationData.startTimeStamp;

              if (
                this.reportNotificationMode === "UPDATE" &&
                this.selectedPMNotification.notificationNo !== ""
              ) {
                notifDataTemp.notificationType = this.selectedPMNotification.notificationType;
                sap.ui.core.Fragment.byId(
                  "PMDialog",
                  "SinglePMNotificationType"
                ).setVisible(true);
                sap.ui.core.Fragment.byId(
                  "PMDialog",
                  "MultiPMNotificationType"
                ).setVisible(false);
              } else {
                if (this.notificationType && this.notificationType.length > 0) {
                  if (this.notificationType.length === 1) {
                    sap.ui.core.Fragment.byId(
                      "PMDialog",
                      "SinglePMNotificationType"
                    ).setVisible(true);
                    sap.ui.core.Fragment.byId(
                      "PMDialog",
                      "MultiPMNotificationType"
                    ).setVisible(false);
                    notifDataTemp.notificationType = this.notificationType[0].value;
                  } else {
                    sap.ui.core.Fragment.byId(
                      "PMDialog",
                      "SinglePMNotificationType"
                    ).setVisible(false);
                    sap.ui.core.Fragment.byId(
                      "PMDialog",
                      "MultiPMNotificationType"
                    ).setVisible(true);
                    var changeNotificationType = sap.ui.core.Fragment.byId(
                      "PMDialog",
                      "MultiValue"
                    ).getSelectedKey();
                    if (this.reportNotificationMode === "UPDATE") {
                      sap.ui.core.Fragment.byId(
                        "PMDialog",
                        "MultiValue"
                      ).setSelectedKey(changeNotificationType);
                    } else {
                      sap.ui.core.Fragment.byId(
                        "PMDialog",
                        "MultiValue"
                      ).setSelectedKey(this.notificationType[0].value);
                    }

                    notifDataTemp.notificationType = changeNotificationType;
                  }
                }
              }

              if (this.notificationData.endTimeStamp) {
                notifDataTemp.endTimeStamp = this.notificationData.endTimeStamp;
              }

              notifDataTemp.technicalObject = {
                client: notifDataTemp.client,
                plant: notifDataTemp.plant,
                nodeID: notifDataTemp.nodeID,
                flocID: this.notificationData.fLocation,
                equipmentID: this.notificationData.equipment,
              };

              notifDataTemp.comments = this.notificationData.comments;
              notifDataTemp.actsAsBreakdown = this.notificationData.breakdown;

              if (this.notificationData.downId) {
                notifDataTemp.downtimeEventID = this.notificationData.downId;
                notifDataTemp.downtimeMapped = true;
              } else {
                notifDataTemp.downtimeEventID = this.notificationData.aggregatedData.results[0].downId;
                notifDataTemp.downtimeMapped = true;
              }

              if (this.reportNotificationMode === "UPDATE") {
                results = this.interfaces.updatePMNotificationDetails(
                  notifDataTemp.client,
                  notifDataTemp.plant,
                  notifDataTemp.nodeID,
                  notifDataTemp.startTimeStamp,
                  notifDataTemp.endTimeStamp,
                  notifDataTemp.technicalObject,
                  notifDataTemp.notificationType,
                  notifDataTemp.actsAsBreakdown,
                  notifDataTemp.comments,
                  this.selectedPMNotification.oeeNotificationID,
                  this.selectedPMNotification.notificationNo,
                  this.selectedPMNotification.oeeStatus,
                  true,
                  notifDataTemp.downtimeEventID
                );
                var items = sap.ui.core.Fragment.byId(
                  "PMNotificationDetailsDialog",
                  "notifTable"
                ).getItems();
                if (results.oeeNotificationID !== undefined) {
                  this.onRefresh();
                }
              } else if (this.reportNotificationMode === "NEW") {
                results = this.interfaces.createPMNotification(
                  notifDataTemp.client,
                  notifDataTemp.plant,
                  notifDataTemp.nodeID,
                  notifDataTemp.startTimeStamp,
                  notifDataTemp.endTimeStamp,
                  notifDataTemp.technicalObject,
                  notifDataTemp.notificationType,
                  notifDataTemp.actsAsBreakdown,
                  notifDataTemp.comments,
                  notifDataTemp.downtimeMapped,
                  notifDataTemp.downtimeEventID
                );
                if (results.oeeNotificationID !== undefined) {
                  this.refreshDowntimes();
                  this.initializeNotif();
                }
              }
              if (results.oeeNotificationID !== undefined) {
                sap.oee.ui.Utils.toast(
                  this.appComponent.oBundle.getText(
                    "OEE_MESSAGE_SUCCESSFUL_SAVE"
                  )
                );
                this.oPMNotificationDialog.close();
                this.updateAufnrCastId(1);
              } else {
                sap.oee.ui.Utils.createMessage(
                  results.outputMessage,
                  sap.ui.core.MessageType.Error
                );
              }
            }
          } else {
            sap.oee.ui.Utils.createMessage(
              this.appComponent.oBundle.getText("OEE_ERR_MSG_ENTER_START_TIME"),
              sap.ui.core.MessageType.Error
            );
            return;
          }
        }
      },

      onPressPMNotificationIcon: function (oEvent) {
        this.oContextOfSelected = oEvent
          .getSource()
          .getBindingContext()
          .getObject();

        var downItems = this.getView().byId("downtimesTable").getItems();
        for (var i = 0; i < downItems.length; i++) {
          if (
            downItems[i].getBindingContext().getObject().downId ==
            this.oContextOfSelected.downId
          ) {
            this.selectedDowntime = downItems[i]
              .getBindingContext()
              .getObject();
            downItems[i].setSelected(true);
            break;
          }
        }
        this.byId("splitButtonForDowntime").setEnabled(true);
        this.byId("EditButtonForDowntime").setEnabled(true);
        this.byId("deleteButtonForDowntime").setEnabled(true);
        this.byId("reportButtonForNotification").setEnabled(true);

        if (
          this.selectedDowntime.ioProductionRunDowntime.endTimestamp == "" ||
          this.selectedDowntime.ioProductionRunDowntime.endTimestamp ==
            undefined
        ) {
          this.byId("reportUpButtonForDowntime").setEnabled(true);
          this.byId("splitButtonForDowntime").setEnabled(false);
        } else {
          this.byId("reportUpButtonForDowntime").setEnabled(false);
        }

        this.bindDataToPMNotificationDetailsDialog();

        this.PMNotificationDetailsDialog.setTitle(
          this.appComponent.oBundle.getText("OEE_BTN_NOTIF_DETAILS")
        );

        var items = sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "notifTable"
        ).getItems();
        items[0].setSelected(true);

        this.selectedPMNotification = items[0].getBindingContext().getObject();

        this.checkStatusforNotification(this.selectedPMNotification.oeeStatus);
        this.PMNotificationDetailsDialog.open();
      },

      bindDataToPMNotificationDetailsDialog: function () {
        if (this.PMNotificationDetailsDialog == undefined) {
          this.PMNotificationDetailsDialog = sap.ui.xmlfragment(
            "PMNotificationDetailsDialog",
            "sap.oee.ui.fragments.PMNotificationDetailsDialog",
            this
          );
          this.getView().addDependent(this.PMNotificationDetailsDialog);
        }

        this.populatePMNotificationDetailsTable();
      },

      populatePMNotificationDetailsTable: function () {
        if (this.oContextOfSelected !== null) {
          var oeeNotificationIDList = [];
          for (
            i = 0;
            i <
            this.oContextOfSelected.ioProductionRunDowntime
              .associatedPMNotifications.results.length;
            i++
          ) {
            var notifId = {};
            notifId.client = this.appData.client;
            notifId.oeeNotificationID = this.oContextOfSelected.ioProductionRunDowntime.associatedPMNotifications.results[
              i
            ].oeeNotificationID;
            oeeNotificationIDList.push(notifId);
          }

          var idListObject = {};

          idListObject.client = this.appData.client;
          idListObject.oeeNotificationIDList = oeeNotificationIDList;
          var results = this.interfaces.retrievePMNotificationsForIDList(
            idListObject
          );

          //
          var notifDetails = {};
          if (!this.oNotifDetailsModel) {
            this.oNotifDetailsModel = new sap.ui.model.json.JSONModel();
          }

          this.oNotifDetailsModel.setData({
            notificationDetails: results.notifications.results,
          });
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "notifTable"
          ).setModel(this.oNotifDetailsModel);
          this.oNotifDetailsModel.refresh(true);
        }
      },

      onSelectNotification: function (oEvent) {
        this.selectedPMNotification = oEvent
          .getParameter("listItem")
          .getBindingContext()
          .getObject();
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "rejectButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "approveButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "deleteButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "syncButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "updateButtonNotification"
        ).setEnabled(false);
        this.checkStatusforNotification(this.selectedPMNotification.oeeStatus);
      },
      checkStatusforNotification: function (oeeStatus) {
        if (
          this.selectedPMNotification.oeeStatus === "NEW" ||
          (this.selectedPMNotification.oeeStatus === "UPD" &&
            this.selectedPMNotification.notificationNo === "")
        ) {
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "rejectButtonNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "approveButtonNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "updateButtonNotification"
          ).setEnabled(true);
        }
        if (
          this.selectedPMNotification.oeeStatus === "UPD" &&
          this.selectedPMNotification.notificationNo != ""
        ) {
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "approveButtonNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "updateButtonNotification"
          ).setEnabled(true);
        }
        if (this.selectedPMNotification.oeeStatus === "E_F") {
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "updateButtonNotification"
          ).setEnabled(true);
        }
        if (
          this.selectedPMNotification.oeeStatus === "E_F" &&
          this.selectedPMNotification.notificationNo === ""
        ) {
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "rejectButtonNotification"
          ).setEnabled(true);
        }
        if (oeeStatus === "REJ") {
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "deleteButtonNotification"
          ).setEnabled(true);
        }
        if (oeeStatus === "E_C") {
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "syncButtonNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "updateButtonNotification"
          ).setEnabled(true);
        }
        if (oeeStatus === "E_U") {
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "syncButtonNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "updateButtonNotification"
          ).setEnabled(true);
        }
      },
      onApproveNotification: function () {
        this.interfaces.triggerPMNotification(
          this.selectedPMNotification.oeeNotificationID
        );
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "notifTable"
        ).removeSelections();
        this.onRefresh();
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "rejectButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "approveButtonNotification"
        ).setEnabled(false);
        sap.oee.ui.Utils.toast(
          this.appComponent.oBundle.getText("OEE_MESSAGE_TRIGGER_NOTIFICATION")
        );
      },

      onRejectNotification: function () {
        var that = this;
        sap.m.MessageBox.show(
          this.appComponent.oBundle.getText("OEE_MSG_CHECK_REJECT"),
          {
            icon: sap.m.MessageBox.Icon.WARNING,
            title: this.appComponent.oBundle.getText(
              "OEE_LABEL_CONFIRM_REJECTION"
            ),
            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            onClose: function (oAction) {
              if (oAction === sap.m.MessageBox.Action.YES) {
                that.interfaces.rejectPMNotification(
                  that.selectedPMNotification.oeeNotificationID
                );
                sap.oee.ui.Utils.toast(
                  that.appComponent.oBundle.getText(
                    "OEE_MESSAGE_REJECT_NOTIFICATION"
                  )
                );
              }
              sap.ui.core.Fragment.byId(
                "PMNotificationDetailsDialog",
                "notifTable"
              ).removeSelections();
              that.onRefresh();
              sap.ui.core.Fragment.byId(
                "PMNotificationDetailsDialog",
                "rejectButtonNotification"
              ).setEnabled(false);
              sap.ui.core.Fragment.byId(
                "PMNotificationDetailsDialog",
                "approveButtonNotification"
              ).setEnabled(false);
            },
          }
        );
      },

      onDeleteNotification: function () {
        this.interfaces.deletePMNotification(
          this.selectedPMNotification.oeeNotificationID
        );
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "notifTable"
        ).removeSelections();

        this.deleteNotif = "X";
        this.refreshDowntimes();

        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "deleteButtonNotification"
        ).setEnabled(false);
        sap.oee.ui.Utils.toast(
          this.appComponent.oBundle.getText("OEE_MESSAGE_DELETE_NOTIFICATION")
        );

        if (
          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "notifTable"
          ).getItems().length == 1
        ) {
          this.oNotifDetailsModel.setData({
            notificationDetails: [],
          }); //remove

          sap.ui.core.Fragment.byId(
            "PMNotificationDetailsDialog",
            "notifTable"
          ).setModel(this.oNotifDetailsModel);
          this.oNotifDetailsModel.refresh(true);
        } else {
          this.populatePMNotificationDetailsTable();
        }
      },

      onRefresh: function () {
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "approveButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "deleteButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "syncButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "updateButtonNotification"
        ).setEnabled(false);
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "rejectButtonNotification"
        ).setEnabled(false);
        this.checkStatusforNotification(this.selectedPMNotification.oeeStatus);
        this.bindDataToPMNotificationDetailsDialog();
      },

      handleCancelForPMNotifictionDetailsDilaog: function () {
        this.PMNotificationDetailsDialog.close();
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "notifTable"
        ).removeSelections();
      },

      formatTechnicalObject: function (floc, eq) {
        var tObj;
        if (floc !== "") {
          if (eq !== "") {
            eq = eq.replace(/^0+/g, "");
            tObj =
              this.appComponent.oBundle.getText("OEE_LABEL_FLOC") +
              ": " +
              floc +
              "\n\n" +
              this.appComponent.oBundle.getText("OEE_LABEL_EQUIPMENT") +
              " : " +
              eq;
          } else {
            tObj =
              this.appComponent.oBundle.getText("OEE_LABEL_FLOC") +
              " : " +
              floc;
          }
        } else {
          if (eq !== "") {
            eq = eq.replace(/^0+/g, "");
            tObj =
              this.appComponent.oBundle.getText("OEE_LABEL_EQUIPMENT") +
              " : " +
              eq;
          }
        }
        return tObj;
      },

      formatOeeStatus: function (status) {
        switch (status) {
          case "NEW":
            return this.appComponent.oBundle.getText("OEE_LABEL_STATUS_NEW");
            break;
          case "E_C":
            return this.appComponent.oBundle.getText("OEE_LABEL_STATUS_EC");
            break;
          case "E_N":
            return this.appComponent.oBundle.getText("OEE_LABEL_STATUS_EN");
            break;
          case "E_F":
            return this.appComponent.oBundle.getText("OEE_LABEL_STATUS_EF");
            break;
          case "UPD":
            return this.appComponent.oBundle.getText("OEE_LABEL_STATUS_NEW");
            break;
          case "E_U":
            return this.appComponent.oBundle.getText("OEE_LABEL_STATUS_EU");
            break;
          case "REJ":
            return this.appComponent.oBundle.getText("OEE_LABEL_STATUS_REJ");
            break;
        }
      },

      openReportPMNotification: function () {
        this.downWithNotif = " ";
        if (
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "checkPMNotification"
          ).getSelected() == true
        ) {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "downtimeDialog"
          ).setContentHeight("100%");
          var results = [];
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "commentsForDowntime"
          ).attachLiveChange(this.checkComments, this);
          results = this.interfaces.getAllCustomizationValuesForNode(
            this.appData.client,
            this.appData.plant,
            this.appData.node.nodeID,
            sap.oee.ui.oeeConstants.customizationNames.notificationType
          );
          if (results.outputCode != 1) {
            if (results.customizationValues.results.length > 0) {
              this.notificationType = results.customizationValues.results;

              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "functionalLocation"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "equipment"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "breakDown"
              ).setVisible(true);

              this.pmFLDialog.setTitle(
                this.appComponent.oBundle.getText(
                  "OEE_LABEL_SELECT_TECHINALOBJECT"
                )
              );
              this.pmFLDialog.open();
            } else {
              sap.oee.ui.Utils.createMessage(
                this.appComponent.oBundle.getText(
                  "OEE_MESSAGE_MAINTAIN_PM_NOTIFICATION_TYPE"
                ),
                sap.ui.core.MessageType.Error
              );
            }
          }
        } else {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "downtimeDialog"
          ).setContentHeight("70%");
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "functionalLocation"
          ).setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(
            false
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "SinglePMNotificationType"
          ).setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(
            false
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "MultiPMNotificationType"
          ).setVisible(false);
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "commentsForDowntime"
          ).detachLiveChange(this.checkComments, this);
        }
      },

      checkComments: function (oEvent) {
        var comments = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "commentsForDowntime"
        ).getValue();
        if (comments.length > 40) {
          sap.oee.ui.Utils.createMessage(
            this.appComponent.oBundle.getText("OEE_COMMENTS_LENGTH"),
            sap.ui.core.MessageType.Error
          );
          return;
        }
      },

      initializeDowntimewithPMNotification: function () {
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "checkPMNotification"
        ).setSelected(false);
        this.PMNotification = {};
        this.PMNotification.fLocation = null;
        this.PMNotification.equipment = null;
        this.PMNotification.actsAsBreakdown = true;
        this.PMNotification.notificationType = null;
        this.PMNotification.notificationTypes = null;
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "functionalLocation"
        ).setVisible(false);
        sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(
          false
        );
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "SinglePMNotificationType"
        ).setVisible(false);
        sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(
          false
        );
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "MultiPMNotificationType"
        ).setVisible(false);
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "commentsForDowntime"
        ).detachLiveChange(this.checkComments, this);
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "downtimeDialog"
        ).setContentHeight("70%");
      },

      checkIfNotificationReported: function (obj) {
        if (obj) {
          return true;
        } else return false;
      },

      onUpdateNotification: function (oEvent) {
        this.downWithNotif = "X";
        this.reportNotificationMode = "UPDATE";
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "notifTable"
        ).removeSelections();
        this.checkStatusforNotification(this.selectedPMNotification.oeeStatus);
        this.techObjData = [];
        if (this.selectedDowntime.nodeId !== undefined) {
          var nodeId = this.selectedDowntime.nodeId;
          for (var i = 0; i < this.workUnitData.length; i++) {
            if (nodeId == this.workUnitData[i].nodeId) {
              var technicalObject = [];
              technicalObject = this.workUnitData[i].technicalObject;
              this.selectedDowntime.technicalObject = technicalObject;
              break;
            }
          }
        }

        var techObj1 = [];
        if (this.selectedDowntime.nodeId !== undefined) {
          this.notificationData.nodeDesc = this.selectedDowntime.ioProductionRunDowntime.nodeDescription;
          this.notificationData.nodeId = this.selectedDowntime.nodeId;
          this.notificationData.downId = this.selectedDowntime.downId;
          if (this.selectedDowntime.technicalObject !== undefined) {
            for (
              var i = 0;
              i < this.selectedDowntime.technicalObject.length;
              i++
            ) {
              if (
                this.selectedDowntime.technicalObject[i].equipmentID !== "" ||
                this.selectedDowntime.technicalObject[i].flocID !== ""
              ) {
                techObj1.push(this.selectedDowntime.technicalObject[i]);
              }
            }
            this.oModel1 = new sap.ui.model.json.JSONModel();
            this.oModel1.setData({
              modelData: techObj1,
            });
            this.pmFLDialog.setModel(this.oModel1);

            var oBindingInfo = {};
            oBindingInfo.path = "/modelData";

            oBindingInfo.factory = jQuery.proxy(function (sId, oContext) {
              var oFloc = oContext.getProperty("flocID");
              var oEquip = oContext.getProperty("equipmentID");
              var oTemplate = new sap.m.ColumnListItem({
                cells: [
                  new sap.m.Text({
                    text: "{flocID}",
                  }),
                  new sap.m.Text({
                    text:
                      "{path:'equipmentID' , formatter:'sap.oee.ui.Formatter.formatRemoveLeadingZero'}",
                  }),
                ],
                type: "Active",
                press: [this.handleOKForFLDialog, this],
              });

              return oTemplate;
            }, this);

            this.pmList.bindAggregation("items", oBindingInfo);
            this.pmList.rerender();
          }
        }

        this.notificationData.startDate = new Date(
          this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
            parseFloat(this.selectedPMNotification.startTimestamp)
          )
        );
        this.notificationData.endDate = new Date(
          this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
            parseFloat(this.selectedPMNotification.endTimestamp)
          )
        );
        this.notificationData.startTime = this.notificationData.startDate;
        this.notificationData.endTime = this.notificationData.endDate;

        if (this.oPMNotificationDialog == undefined) {
          this.oPMNotificationDialog = sap.ui.xmlfragment(
            "PMDialog",
            "sap.oee.ui.fragments.PMNotificationDialog",
            this
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "PMDialog",
              "startTimeforPMNotification"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "PMDialog",
              "endTimeforPMNotification"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "PMDialog",
              "startDateforPMNotification"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "PMDialog",
              "endDateforPMNotification"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "PMDialog",
              "durationforPMNotification"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "PMDialog",
              "commentsForPMNotification"
            )
          );
          this.byId(
            sap.ui.core.Fragment.createId(
              "PMDialog",
              "breakDownForPMNotification"
            )
          );
          this.getView().addDependent(this.oPMNotificationDialog);
        } else {
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "startTimeforPMNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "endTimeforPMNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "startDateforPMNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "endDateforPMNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "durationforPMNotification"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "setCurrentForStartTimePM"
          ).setEnabled(true);
          sap.ui.core.Fragment.byId(
            "PMDialog",
            "setCurrentForEndTimePM"
          ).setEnabled(true);
        }
        if (!this.oPMNotificationDialogReportingModel) {
          this.oPMNotificationDialogReportingModel = new sap.ui.model.json.JSONModel();
        }
        this.notificationData.fLocation = this.selectedPMNotification.flocID;
        this.notificationData.equipment = this.selectedPMNotification.equipmentID;
        var startTime = this.selectedPMNotification.startTimestamp;
        var endTime = this.selectedPMNotification.endTimestamp;

        if (startTime != "" && endTime != "") {
          var duratn = endTime - startTime;
          var duration = parseInt(duratn / (1000 * 60));
          this.notificationData.duration = duration;
        } else {
          this.notificationData.duration = null;
        }

        this.notificationData.comments = this.selectedPMNotification.comments;
        this.notificationData.actsAsBreakdown = this.selectedPMNotification.breakdown;

        var results = this.checkNotifType(
          this.appData.client,
          this.appData.plant,
          this.selectedDowntime.nodeId
        );
        if (results.outputCode != 1) {
          if (results.customizationValues.results.length > 0) {
            this.notificationType = results.customizationValues.results;
          }
        }

        this.notificationTypeValue();

        this.oPMNotificationDialogReportingModel.setData({
          notificationDataForModel: this.notificationData,
        });
        this.oPMNotificationDialogReportingModel.setDefaultBindingMode(
          sap.ui.model.BindingMode.TwoWay
        );
        this.oPMNotificationDialogReportingModel.setProperty(
          "/startTime",
          this.notificationData.startTime
        );
        this.oPMNotificationDialogReportingModel.setProperty(
          "/endTime",
          this.notificationData.endTime
        );
        this.oPMNotificationDialogReportingModel.setProperty(
          "/startDate",
          this.notificationData.startDate
        );
        this.oPMNotificationDialogReportingModel.setProperty(
          "/endDate",
          this.notificationData.endDate
        );
        this.oPMNotificationDialog.setModel(
          this.oPMNotificationDialogReportingModel
        );
        this.oPMNotificationDialog.setTitle(
          this.appComponent.oBundle.getText("OEE_LABEL_UPDATE_NOTIFICATION")
        );
        this.oPMNotificationDialog.open();
      },

      _busyIndicator: function () {
        var busyIndicator = new sap.m.BusyDialog();
        return busyIndicator;
      },
      onSyncNotification: function () {
        var busyIndicator = this._busyIndicator();
        sap.ui.core.Fragment.byId(
          "PMNotificationDetailsDialog",
          "notifTable"
        ).removeSelections();
        this.getView().addDependent(busyIndicator);
        jQuery.sap.syncStyleClass(
          "sapUiSizeCompact",
          this.getView(),
          busyIndicator
        );
        busyIndicator.open();
        this.checkStatusforNotification(this.selectedPMNotification.oeeStatus);
        var inputXML =
          "<?xml version='1.0' encoding='UTF-8'?><BAPI_ALM_NOTIF_GET_DETAIL Description=''><INPUT><NUMBER>" +
          this.selectedPMNotification.notificationNo +
          "</NUMBER></INPUT></BAPI_ALM_NOTIF_GET_DETAIL>";
        var nodeID = this.selectedPMNotification.nodeID;
        var notificationID = this.selectedPMNotification.oeeNotificationID;
        var transactionPath =
          "SAPMPM/ERPShopFloorIntegration/PlantMaintenance/SyncPMNotification";
        var url =
          "/XMII/Runner?Transaction=" +
          transactionPath +
          "&LogType=Info&inputXML=" +
          inputXML +
          "&client=" +
          this.appData.client +
          "&plant=" +
          this.appData.plant +
          "&nodeID=" +
          nodeID +
          "&notificationID=" +
          notificationID +
          "&OutputParameter=*&Content-Type=text/XML";
        var that = this;
        jQuery.ajax({
          type: "GET",
          url: url,
          contentType: "text/XML",
          Accept: "text/XML",
          cache: false,
          async: true,
          success: function (xmlDoc, textStatus, jqXHR) {
            if (jQuery(xmlDoc).find("message").text()) {
              busyIndicator.close();
              sap.oee.ui.Utils.createMessage(
                jQuery(xmlDoc).find("message").text(),
                sap.ui.core.MessageType.Error
              );
              return;
            }
            that.onRefresh();
            busyIndicator.close();
            sap.oee.ui.Utils.toast(
              that.appComponent.oBundle.getText("OEE_MESSAGE_SYNC_NOTIFICATION")
            );
          },
          crossDomain: true,
          error: function (data, textStatus, jqXHR) {
            busyIndicator.close();
            sap.oee.ui.Utils.toast(
              this.appComponent.oBundle.getText(
                "OEE_MESSAGE_SYNC_FAILED_NOTIFICATION"
              )
            );
          },
        });
      },

      //prepare from material and to material dialogs
      prepareMaterialDialog: function () {
        if (this.materialDialog == undefined) {
          this.materialDialog = sap.ui.xmlfragment(
            "materialPopupForDowntime",
            "sap.oee.ui.fragments.materialPopup",
            this
          );
          this.materialList = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "materialPopupForDowntime",
                "materialsList"
              )
            );
          this.materialListSearch = sap.ui
            .getCore()
            .byId(
              sap.ui.core.Fragment.createId(
                "materialPopupForDowntime",
                "searchMachine"
              )
            );
          this.materialDialog.setTitle(
            this.appComponent.oBundle.getText("OEE_LABEL_SELECT_MATERIAL")
          );
          this.getView().addDependent(this.materialDialog);
        }
      },

      onSelectMaterial: function (oEvent) {
        if (this.fromMaterial === "X") {
          this.downtimeData.selectedFromMaterial = oEvent
            .getParameter("listItem")
            .getBindingContext()
            .getObject().matnr;
        }
        if (this.toMaterial === "X") {
          this.downtimeData.selectedToMaterial = oEvent
            .getParameter("listItem")
            .getBindingContext()
            .getObject().matnr;
        }
        sap.oee.ui.Utils.updateModel(this.oDowntimeReportingModel);
        this.fromMaterial = "";
        this.toMaterial = "";
        oEvent.getSource().getParent().close();
      },
      onChangeFromMaterial: function () {
        var that = this;
        this.fromMaterial = "X";
        var startDate = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startDate"
        ).getDateValue();
        var startTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "startTime"
        ).getDateValue();
        if (startDate && startTime && startDate != "" && startTime != "") {
          var combinedStartDateTime = sap.oee.ui.Utils.createTimestampFromDateTime(
            startDate,
            startTime
          );
        }
        if (combinedStartDateTime) {
          var fromMaterialList = [];
          var startTimestampUTC = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
            this.downtimeData.startTimeStamp,
            this.appData.plantTimezoneOffset
          );
          this.fromMaterialsData = this.interfaces.GetMaterialsForChangeOverForActiveHoldCompleteRuns(
            this.appData.client,
            this.appData.plant,
            startTimestampUTC,
            this.appData.node.nodeID
          );
          fromMaterialList = this.fromMaterialsData.materialDetails.results;
          if (!this.fromMaterialModel) {
            this.fromMaterialModel = new sap.ui.model.json.JSONModel();
          }
          this.fromMaterialModel.setData({ materialModel: fromMaterialList });

          var template = new sap.m.ObjectListItem({
            type: "Active",
            title:
              "{parts : [{path : 'matnr'} , {path : 'materialText'}], formatter: 'sap.oee.ui.Formatter.formatIDAndDescriptionText'}",
          });

          this.materialList.bindAggregation(
            "items",
            "/materialModel",
            template
          );

          this.materialList.setModel(this.fromMaterialModel);
          this.fromMaterialModel.refresh();
          this.materialList.removeSelections();
          this.materialDialog.open();
        }
      },

      onChangeToMaterial: function () {
        this.toMaterial = "X";
        var endDate = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endDate"
        ).getDateValue();
        var endTime = sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "endTime"
        ).getDateValue();
        if (endDate && endTime && endDate != "" && endTime != "") {
          var combinedEndDateTime = sap.oee.ui.Utils.createTimestampFromDateTime(
            endDate,
            endTime
          );
        }
        if (combinedEndDateTime) {
          var toMaterialList = [];
          var endTimestampUTC = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(
            this.downtimeData.endTimeStamp,
            this.appData.plantTimezoneOffset
          );
          this.toMaterialsData = this.interfaces.GetToMaterialsForChangeOverForActiveHoldCompleteRuns(
            this.appData.client,
            this.appData.plant,
            endTimestampUTC,
            this.appData.node.nodeID
          );
          toMaterialList = this.toMaterialsData.materialDetails.results;
          if (!this.toMaterialModel) {
            this.toMaterialModel = new sap.ui.model.json.JSONModel();
          }

          this.toMaterialModel.setData({ materialModel: toMaterialList });

          var template = new sap.m.ObjectListItem({
            type: "Active",
            title:
              "{parts : [{path : 'matnr'} , {path : 'materialText'}], formatter: 'sap.oee.ui.Formatter.formatIDAndDescriptionText'}",
          });

          this.materialList.bindAggregation(
            "items",
            "/materialModel",
            template
          );

          this.materialList.setModel(this.toMaterialModel);
          this.toMaterialModel.refresh();
          this.materialList.removeSelections();
          this.materialDialog.open();
        }
      },

      handleCloseMaterial: function (oEvent) {
        this.fromMaterial = "";
        this.toMaterial = "";
        this.materialListSearch.setValue(undefined);
        oEvent.getSource().getParent().close();
      },

      handleSearchForMaterials: function (oEvent) {
        var properties = [];
        properties.push("matnr");
        sap.oee.ui.Utils.fuzzySearch(
          this,
          this.fromMaterialModel,
          oEvent.getSource().getValue(),
          this.materialList.getBinding("items"),
          oEvent.getSource(),
          properties
        );
      },

      //Initialize downtime Dialog input field
      initilizeInputFieldsForDowntimeDialog: function () {
        if (!this.startTimeInput) {
          this.startTimeInput = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "startTime"
          );
        }
        if (!this.startDateInput) {
          this.startDateInput = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "startDate"
          );
        }
        if (!this.startTimeInputLabel) {
          this.startTimeInputLabel = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "startTimeLabel"
          );
        }
        if (!this.setStartTimeButton) {
          this.setStartTimeButton = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "setCurrentForStartTime"
          );
        }
        if (!this.endTimeInput) {
          this.endTimeInput = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "endTime"
          );
        }
        if (!this.endDateInput) {
          this.endDateInput = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "endDate"
          );
        }
        if (!this.endTimeInputLabel) {
          this.endTimeInputLabel = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "endTimeLabel"
          );
        }
        if (!this.setEndTimeButton) {
          this.setEndTimeButton = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "setCurrentForEndTime"
          );
        }
        if (!this.resetTimeButton) {
          this.resetTimeButton = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "resetTimeButton"
          );
        }
        if (!this.microStoppageInput) {
          this.microStoppageInput = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "microStoppage"
          );
        }
        if (!this.microStoppageLabel) {
          this.microStoppageLabel = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "microStoppageLabel"
          );
        }
        if (!this.frequencyInput) {
          this.frequencyInput = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "frequency"
          );
        }
        if (!this.frequencyLabel) {
          this.frequencyLabel = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "frequencyLabel"
          );
        }
        if (!this.impactOrderInput) {
          this.impactOrderInput = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "assignOrder"
          );
        }
        if (!this.impactOrderLabel) {
          this.impactOrderLabel = sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "assignToOrderLabel"
          );
        }
      },

      /*Handle the time related field visibility on downtime dialog. 
  First Parameter is for visibility
  second parameter is for enabling/disabling  fields*/
      handleTimeRelatedFieldsVisibility: function (oVisible, oEnabled) {
        this.initilizeInputFieldsForDowntimeDialog();
        this.checkShiftForLabelOfSetCurrent();
        this.startTimeInput.setVisible(oVisible);
        this.startTimeInputLabel.setVisible(oVisible);
        this.setStartTimeButton.setVisible(oVisible);
        this.endTimeInput.setVisible(oVisible);
        this.endTimeInputLabel.setVisible(oVisible);
        this.setEndTimeButton.setVisible(oVisible);
        this.resetTimeButton.setVisible(oVisible);
        if (oEnabled != undefined) {
          this.startTimeInput.setEnabled(oEnabled);
          this.startDateInput.setEnabled(oEnabled);
          this.setStartTimeButton.setEnabled(oEnabled);
          this.endDateInput.setEnabled(oEnabled);
          this.endTimeInput.setEnabled(oEnabled);
          this.setEndTimeButton.setEnabled(oEnabled);
          this.resetTimeButton.setEnabled(oEnabled);
        }
      },

      /* handle Micro Stoppages and frequencey field visibility on downtime dialog
      first parameter - visibility of micro stoppage
      Second Parament - Visibility of Frequency*/
      handleMicroStoppageAndFrequencyVisibility: function (oMicro, oFrequency) {
        this.initilizeInputFieldsForDowntimeDialog();
        this.microStoppageInput.setVisible(oMicro);
        this.microStoppageLabel.setVisible(oMicro);
        this.frequencyInput.setVisible(oFrequency);
        this.frequencyLabel.setVisible(oFrequency);
      },

      //handle impact order field visibility.
      handleImpactOrderVisibility: function (oImpactOrderVisible) {
        this.initilizeInputFieldsForDowntimeDialog();
        this.impactOrderInput.setVisible(oImpactOrderVisible);
        this.impactOrderInput.setEnabled(oImpactOrderVisible);
        this.impactOrderLabel.setVisible(oImpactOrderVisible);
      },

      // Reset the start and end time stamp
      resetStartEndTimeStamp: function () {
        this.initilizeInputFieldsForDowntimeDialog();
        this.downtimeData.startTimeStamp = undefined;
        this.downtimeData.startTime = undefined;
        this.downtimeData.startDate = undefined;
        this.downtimeData.endTimeStamp = undefined;
        this.downtimeData.endTime = undefined;
        this.downtimeData.endDate = undefined;
        this.downtimeData.firstFillField = undefined;
        this.downtimeData.secondFillField = undefined;
        this.startTimeInput.setValue(undefined);
        this.endTimeInput.setValue(undefined);
        this.startDateInput.setValue(undefined);
        this.endDateInput.setValue(undefined);
      },
      //enable disable PM related input field depending upon PM Notification checkbox is checked/Unchecked
      enableDisablePMNotifictationRelatedInputFields: function () {
        if (
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "checkPMNotification"
          ).getSelected() == true
        ) {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "functionalLocation"
          ).setVisible(true);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(
            true
          );
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(
            true
          );
          if (this.notificationType && this.notificationType.length > 0) {
            if (this.notificationType.length === 1) {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "SinglePMNotificationType"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiPMNotificationType"
              ).setVisible(false);
              this.notificationData.notificationType = this.notificationType[0].value;
            } else {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "SinglePMNotificationType"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiPMNotificationType"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "MultiValue"
              ).setSelectedKey(this.notificationType[0].value);
              this.notificationData.notificationTypes = this.notificationType;
            }
          }
        } else {
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "functionalLocation"
          ).setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "equipment").setVisible(
            false
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "SinglePMNotificationType"
          ).setVisible(false);
          sap.ui.core.Fragment.byId("downtimeDialog", "breakDown").setVisible(
            false
          );
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "MultiPMNotificationType"
          ).setVisible(false);
        }
      },

      enableDisablePMNotifCheckBox: function () {
        switch (this.setSelectedMode) {
          case sap.oee.ui.oeeConstants.dtTypes.MINOR:
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "reportPMNotification"
            ).setVisible(false);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "checkPMNotification"
            ).setVisible(false);
            break;
          case sap.oee.ui.oeeConstants.dtTypes.BREAKDOWN:
            if (this.setVisible === true) {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setEnabled(true);
            } else {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setVisible(false);
            }
            break;
          case sap.oee.ui.oeeConstants.dtTypes.LINEDOWN:
            if (this.setVisible === true) {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setVisible(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setEnabled(true);
            } else {
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setVisible(false);
            }
            break;
          case sap.oee.ui.oeeConstants.dtTypes.OVERLAPPING:
            break;
          case sap.oee.ui.oeeConstants.dtTypes.FLOWTIME:
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "reportPMNotification"
            ).setVisible(false);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "checkPMNotification"
            ).setVisible(false);
            break;
          case sap.oee.ui.oeeConstants.dtTypes.SHIFTBREAKS:
            break;
          case sap.oee.ui.oeeConstants.dtTypes.OTHERS:
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "reportPMNotification"
            ).setVisible(false);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "checkPMNotification"
            ).setVisible(false);
            break;
          default:
            break;
        }
      },

      onSelectMicroStoppages: function (oEvent) {
        var isChecked = oEvent.getParameters().selected;
        if (this.downtimeMode === "Edit") {
          //Handled scenario when event type is change from changeover to schedule or unschedule down
          if (
            this.selectedDowntime.ioProductionRunDowntime.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.changeOver
          ) {
            if (isChecked == true) {
              if (
                this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
              ) {
                this.handleImpactOrderVisibility(true);
              } else {
                this.handleImpactOrderVisibility(false);
              }
              this.handleFrequencyAndDurationBasedOnMicroStoppage(
                true,
                1,
                0,
                true
              );
              this.resetStartEndTimeStamp();
              if (
                this.appData.node.downtimeEntryType ==
                sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
              ) {
                this.handleTimeRelatedFieldsVisibility(false);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("60%");
              } else if (
                this.appData.node.downtimeEntryType ==
                sap.oee.ui.oeeConstants.downtimeEntryType.timeIntervalBased
              ) {
                this.handleTimeRelatedFieldsVisibility(true, false);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("70%");
              }
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "durationforDowntime"
              ).setEnabled(true);
            } else {
              this.handleFrequencyAndDurationBasedOnMicroStoppage(
                false,
                undefined,
                0,
                true
              );
              this.resetStartEndTimeStamp();
              if (
                this.appData.node.downtimeEntryType ==
                sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
              ) {
                this.handleTimeRelatedFieldsVisibility(false);
                if (
                  this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                ) {
                  this.handleImpactOrderVisibility(true);
                } else {
                  this.handleImpactOrderVisibility(false);
                }
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("60%");
              } else if (
                this.appData.node.downtimeEntryType ==
                sap.oee.ui.oeeConstants.downtimeEntryType.timeIntervalBased
              ) {
                this.handleTimeRelatedFieldsVisibility(true, false);
                this.resetStartEndTimeStamp();
                this.handleImpactOrderVisibility(false);
              }
            }
          } else {
            //handled scenario when edited downtime entryType is either schedule or unschedule
            if (isChecked == true) {
              this.handleFrequencyAndDurationBasedOnMicroStoppage(
                true,
                1,
                0,
                true
              );
              if (
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO
              ) {
                this.handleTimeRelatedFieldsVisibility(false);
                if (
                  this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                ) {
                  this.handleImpactOrderVisibility(true);
                } else {
                  this.handleImpactOrderVisibility(false);
                }
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "durationforDowntime"
                ).setEnabled(true);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("70%");
              } else if (
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO
              ) {
                this.handleTimeRelatedFieldsVisibility(true, false);
                this.resetStartEndTimeStamp();
                if (
                  this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                ) {
                  this.handleImpactOrderVisibility(true);
                } else {
                  this.handleImpactOrderVisibility(false);
                }
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("70%");
              } else {
                if (
                  this.appData.node.downtimeEntryType ==
                  sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
                ) {
                  this.handleTimeRelatedFieldsVisibility(false);
                  if (
                    this.downtimeData.eventType ===
                    sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                  ) {
                    this.handleImpactOrderVisibility(true);
                  } else {
                    this.handleImpactOrderVisibility(false);
                  }
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "durationforDowntime"
                  ).setEnabled(true);
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "downtimeDialog"
                  ).setContentHeight("70%");
                } else {
                  this.handleTimeRelatedFieldsVisibility(true, false);
                  this.resetStartEndTimeStamp();
                  if (
                    this.downtimeData.eventType ===
                    sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                  ) {
                    this.handleImpactOrderVisibility(true);
                  } else {
                    this.handleImpactOrderVisibility(false);
                  }
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "durationforDowntime"
                  ).setEnabled(true);
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "downtimeDialog"
                  ).setContentHeight("70%");
                }
              }
            } else {
              this.handleFrequencyAndDurationBasedOnMicroStoppage(
                false,
                undefined,
                0,
                true
              );
              if (
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO
              ) {
                this.handleTimeRelatedFieldsVisibility(false);
                if (
                  this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                ) {
                  this.handleImpactOrderVisibility(true);
                } else {
                  this.handleImpactOrderVisibility(false);
                }
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("70%");
              } else if (
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO
              ) {
                this.handleTimeRelatedFieldsVisibility(true, true);
                this.handleImpactOrderVisibility(false);
                this.resetStartEndTimeStamp();
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("70%");
              } else {
                if (
                  this.appData.node.downtimeEntryType ==
                  sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
                ) {
                  this.handleTimeRelatedFieldsVisibility(false);
                  this.resetStartEndTimeStamp();
                  if (
                    this.downtimeData.eventType ===
                    sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                  ) {
                    this.handleImpactOrderVisibility(true);
                  } else {
                    this.handleImpactOrderVisibility(false);
                  }
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "downtimeDialog"
                  ).setContentHeight("70%");
                } else {
                  this.handleTimeRelatedFieldsVisibility(true, true);
                  this.resetStartEndTimeStamp();
                  this.handleImpactOrderVisibility(false);
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "downtimeDialog"
                  ).setContentHeight("70%");
                }
              }
            }
          }
        } else if (this.downtimeMode === "New") {
          //handling Micro Stoppage check uncheck scenario.
          if (isChecked == true) {
            this.handleFrequencyAndDurationBasedOnMicroStoppage(
              true,
              1,
              0,
              true
            );
            if (
              this.appData.node.downtimeEntryType ==
              sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
            ) {
              this.handleTimeRelatedFieldsVisibility(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setSelected(false);
              if (
                this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
              ) {
                this.handleImpactOrderVisibility(true);
              } else {
                this.handleImpactOrderVisibility(false);
              }
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("60%");
            } else {
              this.handleTimeRelatedFieldsVisibility(true, false);
              this.resetStartEndTimeStamp();
              if (
                this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
              ) {
                this.handleImpactOrderVisibility(true);
              } else {
                this.handleImpactOrderVisibility(false);
              }
              this.enableDisablePMNotifCheckBox();
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setEnabled(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setSelected(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("80%");
            }
          } else {
            this.handleFrequencyAndDurationBasedOnMicroStoppage(
              false,
              1,
              0,
              true
            );
            if (
              this.appData.node.downtimeEntryType ==
              sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
            ) {
              this.handleTimeRelatedFieldsVisibility(false);
              if (
                this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
              ) {
                this.handleImpactOrderVisibility(true);
              } else {
                this.handleImpactOrderVisibility(false);
              }
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setSelected(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("60%");
            } else {
              this.handleTimeRelatedFieldsVisibility(true, true);
              this.handleImpactOrderVisibility(false);
              this.enableDisablePMNotifCheckBox();
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setEnabled(true);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setSelected(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("70%");
            }
          }
          this.enableDisablePMNotifictationRelatedInputFields();
        }
      },
      /*Handle Duration for downtime enablility and Value, and  Frequency visibility 
    first parameter - frequency visibility
    second parameter - frequency value
    third parameter - duration value
    fourth parametr - duration enabled*/
      handleFrequencyAndDurationBasedOnMicroStoppage: function (
        oFrequencyVisible,
        oFrequencyValue,
        oDurationValue,
        oDurationEnabled
      ) {
        sap.ui.core.Fragment.byId("downtimeDialog", "frequency").setVisible(
          oFrequencyVisible
        );
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "frequencyLabel"
        ).setVisible(oFrequencyVisible);
        sap.ui.core.Fragment.byId("downtimeDialog", "frequency").setValue(
          oFrequencyValue
        );
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "durationforDowntime"
        ).setValue(oDurationValue);
        sap.ui.core.Fragment.byId(
          "downtimeDialog",
          "durationforDowntime"
        ).setEnabled(oDurationEnabled);
      },

      onPressAssignToOrderOnDowntimeDialog: function (oEvent) {
        var aggregatedDataJSON = this.interfaces.interfacesGetOrderStatusForRunsStartedInShiftInputSync(
          this.appData.node.nodeID,
          this.appData.client,
          this.appData.plant,
          this.appData.shift.shiftID,
          this.appData.shift.shiftGrouping,
          this.appData.shift.startTimestamp,
          this.appData.shift.endTimestamp,
          false
        );
        var ordersModel = new sap.ui.model.json.JSONModel();
        ordersModel.setData({
          orders: aggregatedDataJSON.orderStatusList.results,
        });
        if (this.oOrderPopOver == undefined) {
          this.oOrderPopOver = sap.ui.xmlfragment(
            "popoverForOrderChange",
            "sap.oee.ui.fragments.orderChangeDialog",
            this
          );
          this.oOrderPopOver.setTitle(
            this.appComponent.oBundle.getText("OEE_BTN_ASSIGN_TO_ORDER")
          );
          var buttonTemplate = new sap.m.ObjectListItem({
            title:
              "{parts : [{path: 'order'},{path: 'routingOperNo'}], formatter : 'sap.oee.ui.Formatter.formatOrderNumber'}",
            attributes: [
              new sap.m.ObjectAttribute({
                text: "{material_desc}",
              }),
              new sap.m.ObjectAttribute({
                text:
                  "{parts : [{path: 'orderStartTimestamp'}], formatter : 'sap.oee.ui.Formatter.formatTimeStampWithoutLabel'}",
              }),
            ],
            type: "Active",
            firstStatus: new sap.m.ObjectStatus({
              text:
                "{parts : [{path: 'statusDescription'},{path: 'productionActivity'}], formatter : 'sap.oee.ui.Formatter.formatStatusTextAndActivity'}",
            }),
          });
          this.oOrderPopOver.bindAggregation(
            "items",
            "/orders",
            buttonTemplate
          );
          this.oOrderPopOver.attachConfirm(
            aggregatedDataJSON,
            this.selectOrderOnDialog,
            this
          );
        } else {
          this.oOrderPopOver.detachConfirm(this.selectOrderOnDialog, this);
          this.oOrderPopOver.attachConfirm(
            aggregatedDataJSON,
            this.selectOrderOnDialog,
            this
          );
        }
        this.oOrderPopOver.setModel(ordersModel);
        this.oOrderPopOver.open();
      },
      selectOrderOnDialog: function (oEvent, aggregatedDataJSON) {
        var oSource = oEvent.getParameter("selectedItem");
        var orderSelected = oSource.getBindingContext().getObject();
        var obj = this.oDowntimeDialog.getModel().getData();
        obj.downtimeDataForModel.orderAssign = {
          orderNo: orderSelected.order,
          operationNo: orderSelected.routingOperNo,
          runId: orderSelected.runID,
        };
        this.oDowntimeDialog.getModel().setData(obj);
        this.oDowntimeDialog.getModel().refresh();
        //this.oOrderPopOver.close();
      },

      //handle field visibility of downtime dialog on edit based on event type and configuration setting
      enableDisableOnDowntimeDialogOnEdit: function () {
        if (
          this.selectedDowntime.ioProductionRunDowntime.eventType ===
          sap.oee.ui.oeeConstants.timeElementTypes.changeOver
        ) {
          this.handleTimeRelatedFieldsVisibility(true, true);
          this.handleMicroStoppageAndFrequencyVisibility(false, false);
          this.handleImpactOrderVisibility(false);
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "downtimeDialog"
          ).setContentHeight("70%");
        } else if (
          this.selectedDowntime.ioProductionRunDowntime.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
          this.selectedDowntime.ioProductionRunDowntime.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
        ) {
          if (
            this.selectedDowntime.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL ||
            this.selectedDowntime.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO
          ) {
            this.handleTimeRelatedFieldsVisibility(true, true);
            this.handleImpactOrderVisibility(false);
            if (
              this.appData.node.microStoppages ==
              sap.oee.ui.oeeConstants.check_boolean.TRUE
            ) {
              this.handleMicroStoppageAndFrequencyVisibility(true, false);
            } else {
              this.handleMicroStoppageAndFrequencyVisibility(false, false);
            }
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "downtimeDialog"
            ).setContentHeight("70%");
          } else if (
            this.selectedDowntime.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
            this.selectedDowntime.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO
          ) {
            this.handleTimeRelatedFieldsVisibility(false);
            if (
              this.appData.node.microStoppages ==
              sap.oee.ui.oeeConstants.check_boolean.TRUE
            ) {
              this.handleMicroStoppageAndFrequencyVisibility(true, false);
            } else {
              this.handleMicroStoppageAndFrequencyVisibility(false, false);
            }
            if (
              this.selectedDowntime.ioProductionRunDowntime.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
            ) {
              this.handleImpactOrderVisibility(true);
            } else {
              this.handleImpactOrderVisibility(false);
            }
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "downtimeDialog"
            ).setContentHeight("60%");
          } else if (
            this.selectedDowntime.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_MANUAL ||
            this.selectedDowntime.ioProductionRunDowntime.entryType ===
              sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
          ) {
            if (this.selectedDowntime.ioProductionRunDowntime.frequency != "") {
              this.downtimeData.microStoppages = true;
              this.downtimeData.frequency = this.selectedDowntime.ioProductionRunDowntime.frequency;
              this.handleMicroStoppageAndFrequencyVisibility(true, true);
            } else {
              this.handleMicroStoppageAndFrequencyVisibility(false, false);
            }
            if (
              this.appData.node.downtimeEntryType ==
              sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
            ) {
              this.handleTimeRelatedFieldsVisibility(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("60%");
            } else {
              this.handleTimeRelatedFieldsVisibility(true, false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("70%");
            }
            if (
              this.selectedDowntime.ioProductionRunDowntime.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
            ) {
              this.handleImpactOrderVisibility(true);
            } else {
              this.handleImpactOrderVisibility(false);
            }
          }
        } else {
          this.handleTimeRelatedFieldsVisibility(true, true);
          this.handleMicroStoppageAndFrequencyVisibility(false, false);
          this.handleImpactOrderVisibility(false);
          sap.ui.core.Fragment.byId(
            "downtimeDialog",
            "downtimeDialog"
          ).setContentHeight("70%");
        }
      },

      //Handle field visibility on downtimedialog after close of reason code pop up or change or type
      handleFieldVisibilityOfDowntimeDialog: function () {
        this.initilizeInputFieldsForDowntimeDialog();
        this.checkShiftForLabelOfSetCurrent();
        if (this.downtimeMode == "Edit") {
          //In case downtime type is change from changeover to unschedule/schedule, field visibility will be handled based on config setting.
          if (
            this.selectedDowntime.ioProductionRunDowntime.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.changeOver
          ) {
            if (
              this.downtimeData.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.changeOver
            ) {
              this.handleTimeRelatedFieldsVisibility(true, true);
              this.handleMicroStoppageAndFrequencyVisibility(false, false);
              this.handleImpactOrderVisibility(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("70%");
            } else if (
              this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
              this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
            ) {
              if (
                this.appData.node.microStoppages ==
                sap.oee.ui.oeeConstants.check_boolean.TRUE
              ) {
                this.handleMicroStoppageAndFrequencyVisibility(true, false);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "microStoppage"
                ).setSelected(false);
              } else if (
                this.appData.node.microStoppages ==
                sap.oee.ui.oeeConstants.check_boolean.FALSE
              ) {
                this.handleMicroStoppageAndFrequencyVisibility(false, false);
              }
              this.resetStartEndTimeStamp();
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "durationforDowntime"
              ).setValue("0");
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "fromMaterialforDowntime"
              ).setValue(undefined);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "toMaterialforDowntime"
              ).setValue(undefined);
              if (
                this.appData.node.downtimeEntryType ==
                sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
              ) {
                this.handleTimeRelatedFieldsVisibility(false);
                if (
                  this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                ) {
                  this.handleImpactOrderVisibility(true);
                } else {
                  this.handleImpactOrderVisibility(false);
                }
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("60%");
              } else {
                this.handleTimeRelatedFieldsVisibility(true, true);
                this.handleImpactOrderVisibility(false);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("70%");
              }
            } else {
              this.handleTimeRelatedFieldsVisibility(true, true);
              this.handleMicroStoppageAndFrequencyVisibility(false, false);
              this.handleImpactOrderVisibility(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("70%");
            }
          } else {
            // Edit from Unscheduled or Scheduled downtime
            //In Case we are editing downtime apart from Changeover field visibility will be handled based on eventType
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "durationforDowntime"
            ).setEnabled(true);
            if (
              this.downtimeData.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.changeOver
            ) {
              if (
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
              ) {
                this.downtimeData.selectedFromMaterial = undefined;
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "fromMaterialforDowntime"
                ).setValue(undefined);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "toMaterialforDowntime"
                ).setValue(undefined);
                this.resetStartEndTimeStamp();
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "durationforDowntime"
                ).setValue("0");
              }
              this.handleTimeRelatedFieldsVisibility(true, true);
              this.handleMicroStoppageAndFrequencyVisibility(false, false);
              this.handleImpactOrderVisibility(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("70%");
            } else if (
              this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
              this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
            ) {
              if (
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.START_END_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.START_END_AUTO
              ) {
                if (
                  this.appData.node.microStoppages ==
                  sap.oee.ui.oeeConstants.check_boolean.TRUE
                ) {
                  this.handleMicroStoppageAndFrequencyVisibility(true, false);
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "microStoppage"
                  ).setSelected(false);
                } else if (
                  this.appData.node.microStoppages ==
                  sap.oee.ui.oeeConstants.check_boolean.FALSE
                ) {
                  this.handleMicroStoppageAndFrequencyVisibility(false, false);
                }
                this.handleTimeRelatedFieldsVisibility(true, true);
                this.handleImpactOrderVisibility(false);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("70%");
              } else if (
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.DURATION_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.DURATION_AUTO
              ) {
                if (
                  this.appData.node.microStoppages ==
                  sap.oee.ui.oeeConstants.check_boolean.TRUE
                ) {
                  this.handleMicroStoppageAndFrequencyVisibility(true, false);
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "microStoppage"
                  ).setSelected(false);
                } else if (
                  this.appData.node.microStoppages ==
                  sap.oee.ui.oeeConstants.check_boolean.FALSE
                ) {
                  this.handleMicroStoppageAndFrequencyVisibility(false, false);
                }
                this.handleTimeRelatedFieldsVisibility(false);
                if (
                  this.downtimeData.eventType ===
                  sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                ) {
                  this.handleImpactOrderVisibility(true);
                } else {
                  this.handleImpactOrderVisibility(false);
                }
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("60%");
              } else if (
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_MANUAL ||
                this.downtimeData.entryType ==
                  sap.oee.ui.oeeConstants.downtimeEntry.MICRO_STOPPAGE_AUTO
              ) {
                this.handleMicroStoppageAndFrequencyVisibility(true, false);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "microStoppage"
                ).setSelected(false);
                if (
                  this.appData.node.downtimeEntryType ==
                  sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
                ) {
                  this.handleTimeRelatedFieldsVisibility(false);
                  if (
                    this.downtimeData.eventType ===
                    sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
                  ) {
                    this.handleImpactOrderVisibility(true);
                  } else {
                    this.handleImpactOrderVisibility(false);
                  }
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "downtimeDialog"
                  ).setContentHeight("60%");
                } else {
                  this.handleTimeRelatedFieldsVisibility(true, true);
                  this.handleImpactOrderVisibility(false);
                  sap.ui.core.Fragment.byId(
                    "downtimeDialog",
                    "downtimeDialog"
                  ).setContentHeight("70%");
                }
              } else {
                this.handleTimeRelatedFieldsVisibility(true, true);
                this.handleMicroStoppageAndFrequencyVisibility(false, false);
                this.handleImpactOrderVisibility(false);
                sap.ui.core.Fragment.byId(
                  "downtimeDialog",
                  "downtimeDialog"
                ).setContentHeight("70%");
              }
            } else {
              this.handleTimeRelatedFieldsVisibility(true, true);
              this.handleMicroStoppageAndFrequencyVisibility(false, false);
              this.handleImpactOrderVisibility(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("70%");
            }
          }
        } else if (this.downtimeMode == "New") {
          // handling field visibility when reporting new downtime.It is done based on eventType and config setting
          if (
            this.downtimeData.eventType ===
            sap.oee.ui.oeeConstants.timeElementTypes.changeOver
          ) {
            this.handleTimeRelatedFieldsVisibility(true, true);
            this.handleMicroStoppageAndFrequencyVisibility(false, false);
            this.handleImpactOrderVisibility(false);
            this.downtimeData.selectedFromMaterial = undefined;
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "durationforDowntime"
            ).setEnabled(true);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "reportPMNotification"
            ).setVisible(false);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "checkPMNotification"
            ).setVisible(false);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "checkPMNotification"
            ).setSelected(false);
            this.enableDisablePMNotifictationRelatedInputFields();
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "downtimeDialog"
            ).setContentHeight("70%");
          } else if (
            this.downtimeData.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown ||
            this.downtimeData.eventType ===
              sap.oee.ui.oeeConstants.timeElementTypes.scheduledDown
          ) {
            if (
              this.appData.node.microStoppages ==
              sap.oee.ui.oeeConstants.check_boolean.TRUE
            ) {
              this.handleMicroStoppageAndFrequencyVisibility(true, false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "microStoppage"
              ).setSelected(false);
            } else if (
              this.appData.node.microStoppages ==
              sap.oee.ui.oeeConstants.check_boolean.FALSE
            ) {
              this.handleMicroStoppageAndFrequencyVisibility(false, false);
            }
            this.downtimeData.selectedFromMaterial = undefined;
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "durationforDowntime"
            ).setEnabled(true);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "fromMaterialforDowntime"
            ).setValue(undefined);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "toMaterialforDowntime"
            ).setValue(undefined);
            if (
              this.appData.node.downtimeEntryType ==
              sap.oee.ui.oeeConstants.downtimeEntryType.durationBased
            ) {
              this.handleTimeRelatedFieldsVisibility(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "reportPMNotification"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setVisible(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "checkPMNotification"
              ).setSelected(false);
              if (
                this.downtimeData.eventType ===
                sap.oee.ui.oeeConstants.timeElementTypes.unscheduledDown
              ) {
                this.handleImpactOrderVisibility(true);
              } else {
                this.handleImpactOrderVisibility(false);
              }
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("60%");
            } else {
              this.handleTimeRelatedFieldsVisibility(true, true);
              this.enableDisablePMNotifCheckBox();
              this.handleImpactOrderVisibility(false);
              // sap.ui.core.Fragment.byId("downtimeDialog", "checkPMNotification").setSelected(false);
              sap.ui.core.Fragment.byId(
                "downtimeDialog",
                "downtimeDialog"
              ).setContentHeight("70%");
            }
          } else {
            this.handleTimeRelatedFieldsVisibility(true, true);
            this.handleMicroStoppageAndFrequencyVisibility(false, false);
            this.handleImpactOrderVisibility(false);
            sap.ui.core.Fragment.byId(
              "downtimeDialog",
              "downtimeDialog"
            ).setContentHeight("70%");
          }
          this.enableDisablePMNotifictationRelatedInputFields();
        }
      },

	callRFC:function(p_this,p_data){
		console.log("Success");
	},

	reportRfc:function(reportDowntimeMultipleRequest){
	 if(!this.customScreenAllData.checkPMNotification)
	  return;
	this.customScreenAllData.ausbs = this.customScreenAllData.ausbs.split(".")[2] + this.customScreenAllData.ausbs.split(".")[1] + this.customScreenAllData.ausbs.split(".")[0];
    	this.customScreenAllData.ausvn = this.customScreenAllData.ausvn.split(".")[2] + this.customScreenAllData.ausvn.split(".")[1] + this.customScreenAllData.ausvn.split(".")[0];
	this.customScreenAllData.auztb = this.customScreenAllData.auztb + ":00"
	this.customScreenAllData.auztv = this.customScreenAllData.auztv + ":00"
	this.customScreenAllData.workcenterID = this.appData.node.workcenterID;
	this.customScreenAllData.rc1 = reportDowntimeMultipleRequest[0].rc1;
	this.customScreenAllData.rc2 = reportDowntimeMultipleRequest[0].rc2;
	this.customScreenAllData.rc3 = reportDowntimeMultipleRequest[0].rc3;
	this.customScreenAllData.rc4 = reportDowntimeMultipleRequest[0].rc4;
	this.customScreenAllData.rc5 = reportDowntimeMultipleRequest[0].rc5;
	this.customScreenAllData.rc6 = reportDowntimeMultipleRequest[0].rc6;
	var userID = this.appData.user.userID;
	var plant = this.appData.plant;
	var params = {
		I_PLANT : plant,
		I_USER : userID,
		"I_ALLDATA" : JSON.stringify(this.customScreenAllData)
	}
		  var tRunner = new TransactionRunner(
          "MES/UI/DowntimeList/callPmRFCXquery",
          params
        );
        tRunner.ExecuteQueryAsync(this, this.callRFC);
	},

      getAllCharacteristic: function () {
        var allCharJSON = {};
        var workorder = this.appData.selected.order.orderNo;
        if (!workorder) return;
        var params = {
          "Param.1": workorder,
        };
        var tRunner = new TransactionRunner(
          "MES/UI/OrderCardDetail/getAufnrInformationQry",
          params
        );
        if (!tRunner.Execute()) {
          MessageBox.error(tRunner.GetErrorMessage());
          return null;
        }
        var oData = tRunner.GetJSONData();
        var jsData = oData[0].Row;

        if (jsData == undefined) return;
        for (i = 0; i < jsData.length; i++) {
          allCharJSON[jsData[i].CHARCODE] = jsData[i].CHARVALUE;
        }
        this.appData.allCharacteristic = allCharJSON;

        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oData[0].Row[0]);
        this.getView().setModel(oModel, "allCharacteristicModel");
      },
    });
  }
);
