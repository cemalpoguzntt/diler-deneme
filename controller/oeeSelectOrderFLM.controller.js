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
        "customActivity/scripts/customStyle",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        customStyle,
        TransactionCaller,
        Fragment
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
        return Controller.extend("customActivity.controller.oeeSelectOrderFLM", {
            selectedOrder: {
                orderNumber: "",
                status: "",
                routingOperNo: "",
                productionActivity: "",
                releasedHeaderID: "",
                releasedID: "",
                baseUOM: "",
                quantityReleased: "",
                quantityReleasedUOM: "",
                material: "",
                startDate: "",
                startTime: "",
                activity: "",
                runID: "",
                numberOfCapacities: "",
            },

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.appData.intervalState = true;
                this.getVisibleStatusCharacteristic();
                this.appComponent.getEventBus().subscribe(
                    this.appComponent.getId(),
                    "shiftChanged",
                    //  this.refreshOrderData,
                    this
                );

                if (this.appData.statusList == undefined) {
                    this.appData.statusList = this.interfaces.interfacesGetAllStatus(
                        this.appData.client,
                        this.appData.plant
                    );
                    this.statusList = this.appData.statusList;
                } else {
                    this.statusList = this.appData.statusList;
                }
                if (this.appData.productionActivities == undefined) {
                    this.appData.productionActivities = this.readProductionActivities();
                    this.prodActivityList = this.appData.productionActivities;
                } else {
                    this.prodActivityList = this.appData.productionActivities;
                }

                if (this.appData.defaultUom == undefined) {
                    this.appData.defaultUom = this.appData.getCustomizationValues(
                        this.appData.node.nodeID,
                        sap.oee.ui.oeeConstants.customizationNames
                            .defaultuomforproductionreporting
                    );
                }
                this.orderOperationJSONModel = new sap.ui.model.json.JSONModel();
                this.statusJSONModel = new sap.ui.model.json.JSONModel();
                this.statusJSONModel.setData({
                    statusDetails: sap.oee.ui.oeeConstants.status,
                });
                this.byId("statusBar").setModel(this.statusJSONModel);
                this.operationJSONModel = new sap.ui.model.json.JSONModel();
                this.oProductionActivityModel = new sap.ui.model.json.JSONModel();
                this.oEnterTimeModel = new sap.ui.model.json.JSONModel();
                this.oSortModel = new sap.ui.model.json.JSONModel();
                this.oSelectCapacityModel = new sap.ui.model.json.JSONModel();
                this.setDefaultFilters();
                this.bindOrdersToTable();
                this.getTableModel();
                this.modelServices();

            },

            modelServices: function () {
                // var self = this;
                // this.intervalHandle = setInterval(function () {
                //  if (window.location.hash == "#/activity/ZACT_RELAY_BILLET")
                //      if (self.appData.intervalState == true) {
                //          self.getBilletListRole();
                //          self.getBilletListPackage();
                //          self.getAlert();
                //      }
                //  //console.log(1);
                // }, 5000);

                oTrigger = new sap.ui.core.IntervalTrigger(5000);
                oTrigger.addListener(() => {
                    if (this.appData.intervalState) {
                        this.tonajBilgisiInterval();
                        this.getActAUFNR();
                    }
                    console.log("interval çalışıyor");

                }, this);

            },

            getVisibleStatusCharacteristic: function () {
                var werks = this.appData.plant;
                var workcenterID = this.appData.node.workcenterID;
                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterID,
                };
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
                var jsonVisibleStatus = [];
                for (var i = 0; i < oData[0].Row?.length; i++) {
                    if (oData[0].Row[i].ATNAM == "ZMII_KARAKTERSITIK") {
                        jsonVisibleStatus[jsonVisibleStatus.length] = oData[0].Row[i];
                    }
                }
                oModel.setData(jsonVisibleStatus);
                this.getView().setModel(oModel, "visibleStatusModel");
            },

            setDefaultFilters: function () {
                var checkBoxIdNewStatus = this.byId("idNewStatus");
                var checkBoxIdActiveStatus = this.byId("idActiveStatus");
                var checkBoxIdHoldStatus = this.byId("idHoldStatus");
                var checkBoxIdCompletedStatus = this.byId("idCompletedStatus");
                var checkBoxIdAbortedStatus = this.byId("idAbortedStatus");
                var shiftDependentOrders = this.byId("idShiftCheckbox");
                var activityOptionValuesForDefaultFilters;
                if (
                    this.appData.filtersForManageOrder.selectedFilterForManageOrders
                        .length > 0
                ) {
                    activityOptionValuesForDefaultFilters = [];
                    for (
                        var i = 0;
                        i <
                        this.appData.filtersForManageOrder.selectedFilterForManageOrders
                            .length;
                        i++
                    ) {
                        activityOptionValuesForDefaultFilters.push({
                            optionValue:
                                this.appData.filtersForManageOrder
                                    .selectedFilterForManageOrders[i],
                        });
                    }
                } else {
                    activityOptionValuesForDefaultFilters = this.getActivityOptionValues(
                        sap.oee.ui.oeeConstants.activityOptionNameDefaultFilters
                    );
                }

                if (
                    this.appData.filtersForManageOrder.orderBasedOnCurrentShift === true
                ) {
                    activityOptionValuesForDefaultFilters.push({
                        optionValue: sap.oee.ui.oeeConstants.status.SHIFT,
                    });
                }

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
                            sap.oee.ui.oeeConstants.status.NEW
                        ) {
                            checkBoxIdNewStatus.setSelected(true);
                        }
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.status.ACTIVE
                        ) {
                            checkBoxIdActiveStatus.setSelected(true);
                        }
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.status.HOLD
                        ) {
                            checkBoxIdHoldStatus.setSelected(true);
                        }
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.status.COMPLETED
                        ) {
                            checkBoxIdCompletedStatus.setSelected(true);
                        }
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.status.ABORTED
                        ) {
                            checkBoxIdAbortedStatus.setSelected(true);
                        }
                        if (
                            activityOptionValuesForDefaultFilters[i].optionValue ==
                            sap.oee.ui.oeeConstants.status.SHIFT
                        ) {
                            shiftDependentOrders.setSelected(true);
                            this.appData.filtersForManageOrder.orderBasedOnCurrentShift = true;
                        }
                    }
                } else {
                    checkBoxIdActiveStatus.setSelected(true);
                }
            },

            getActivityOptionValues: function (obj) {
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
                            if (
                                this.getView().getViewData().viewOptions[i].optionName == obj
                            ) {
                                return this.getView().getViewData().viewOptions[i]
                                    .activityOptionValueDTOList.results;
                            }
                        }
                    }
                }
            },

            statusFormatter: function (obj) {
                if (!obj) return;
                for (
                    var statusCounter = 0;
                    statusCounter < this.statusList.length;
                    statusCounter++
                ) {
                    if (obj == this.statusList[statusCounter].status) {
                        return this.statusList[statusCounter].description;
                    }
                }
                return "";
            },

            sortFieldsFormatter: function (obj) {
                if (!obj) return;
                if (obj == "plannedStart") {
                    return this.interfaces.oOEEBundle.getText("OEE_LABEL_PLANNED_START");
                }
                if (obj == "status") {
                    return this.interfaces.oOEEBundle.getText("OEE_LABEL_STATUS");
                }
                if (obj == "actualStart") {
                    return this.interfaces.oOEEBundle.getText(
                        "OEE_LABEL_ACTUAL_START_DATE"
                    );
                }
                if (obj == "order") {
                    return this.interfaces.oOEEBundle.getText("OEE_LABEL_ORDER");
                }
                if (obj == "quantityReleased") {
                    return this.interfaces.oOEEBundle.getText("OEE_LABEL_QUANTITY");
                }
                if (obj == "material") {
                    return this.interfaces.oOEEBundle.getText("OEE_LABEL_MATERIAL");
                }
            },
            statusStyleFormatter: function (obj) {
                if (obj === sap.oee.ui.oeeConstants.status.NEW) return "kpiTileGood";
                if (obj === sap.oee.ui.oeeConstants.status.ACTIVE)
                    return "statusActive";
                if (obj === sap.oee.ui.oeeConstants.status.HOLD) return "kpiTileBad";
                return "kpiNotApplicable";
            },
            readProductionActivities: function () {
                var prodActivities = this.interfaces.getProductionActivityForNode(
                    this.appData.client,
                    this.appData.plant,
                    this.appData.node.nodeID
                );
                if (
                    prodActivities != undefined &&
                    prodActivities.ioProductionActivityList != undefined
                ) {
                    return prodActivities.ioProductionActivityList.results;
                }
            },

            productionActivitiesFormatter: function (obj) {
                if (!obj) return;
                if (this.prodActivityList != undefined) {
                    for (
                        var prodActivityCounter = 0;
                        prodActivityCounter < this.prodActivityList.length;
                        prodActivityCounter++
                    ) {
                        if (obj == this.prodActivityList[prodActivityCounter].prodActivity)
                            return this.prodActivityList[prodActivityCounter].description;
                    }
                    return "";
                }
            },

            capacitiesFormatter: function (obj) {
                if (!obj) return;
                if (
                    this.capacityList != undefined &&
                    this.capacityList.details != undefined &&
                    this.capacityList.details.results != undefined
                ) {
                    var capacityList = this.capacityList.details.results;
                    if (capacityList != undefined) {
                        for (
                            var capacityCounter = 0;
                            capacityCounter < capacityList.length;
                            capacityCounter++
                        ) {
                            if (obj == capacityList[capacityCounter].nodeId)
                                return capacityList[capacityCounter].description;
                        }
                        return "";
                    }
                }
            },

            onPressSetCurrent: function () {
                var startDateTemp;
                var buttonToSetCurrent = sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "setCurrentDateTime"
                );
                var dateObject = new Date(
                    this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                        new Date().getTime()
                    )
                );
                if (
                    buttonToSetCurrent.getText() ==
                    this.interfaces.oOEEBundle.getText("OEE_BUTTON_SET_CURRENT")
                ) {
                    this.oEnterTimeModel.setProperty("/startDate", dateObject);
                    this.oEnterTimeModel.setProperty("/startTime", dateObject);
                } else {
                    startDateTemp = new Date(
                        this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                            this.appData.shift.startTimestamp
                        )
                    );
                    this.oEnterTimeModel.setProperty("/startDate", startDateTemp);
                    this.oEnterTimeModel.setProperty("/startTime", startDateTemp);
                }
                this.oEnterTimeModel.refresh();
                var valueStateofEnterTime = sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "inputTime"
                );
                var valueStateofEnterDate = sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "inputDate"
                );
                if (valueStateofEnterTime) {
                    valueStateofEnterTime.setValueState(sap.ui.core.ValueState.None);
                }
                if (valueStateofEnterDate) {
                    valueStateofEnterDate.setValueState(sap.ui.core.ValueState.None);
                }
                var okButtonofEnterTime = sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "okButton1"
                );
                if (okButtonofEnterTime) {
                    okButtonofEnterTime.setEnabled(true);
                }
            },

            onPressSetCurDate: function (oEvent) {
                var startDateTemp;
                var buttonToSetCurrentTimeForStart = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "buttonToSetCurrentTimeForStart"
                );
                var dateObject = new Date(
                    this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                        new Date().getTime()
                    )
                );
                if (
                    buttonToSetCurrentTimeForStart.getText() ==
                    this.interfaces.oOEEBundle.getText("OEE_BUTTON_SET_CURRENT")
                ) {
                    this.oProductionActivityModel.setProperty("/startDate", dateObject);
                    this.oProductionActivityModel.setProperty("/startTime", dateObject);
                } else {
                    startDateTemp = new Date(
                        this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                            this.appData.shift.startTimestamp
                        )
                    );
                    this.oProductionActivityModel.setProperty(
                        "/startDate",
                        startDateTemp
                    );
                    this.oProductionActivityModel.setProperty(
                        "/startTime",
                        startDateTemp
                    );
                }
                this.oProductionActivityModel.refresh();
                var valueStateofStartDate = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputStartDate"
                );
                var valueStateofStartTime = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputStartTime"
                );
                if (valueStateofStartDate) {
                    valueStateofStartDate.setValueState(sap.ui.core.ValueState.None);
                }
                if (valueStateofStartTime) {
                    valueStateofStartTime.setValueState(sap.ui.core.ValueState.None);
                }
                var okButtonofActivity = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "okButton"
                );
                if (okButtonofActivity) {
                    okButtonofActivity.setEnabled(true);
                }
            },

            onPressSetCurrentDateForEndTime: function (oEvent) {
                var startDateTemp;
                var buttonToSetCurrentTime = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "buttonToSetCurrentTime"
                );
                var dateObject = new Date(
                    this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                        new Date().getTime()
                    )
                );
                if (
                    buttonToSetCurrentTime.getText() ==
                    this.interfaces.oOEEBundle.getText("OEE_BUTTON_SET_CURRENT")
                ) {
                    this.oProductionActivityModel.setProperty("/endDate", dateObject);
                    this.oProductionActivityModel.setProperty("/endTime", dateObject);
                } else {
                    startDateTemp = new Date(
                        this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                            this.appData.shift.startTimestamp
                        )
                    );
                    this.oProductionActivityModel.setProperty("/endDate", startDateTemp);
                    this.oProductionActivityModel.setProperty("/endTime", startDateTemp);
                }
                this.oProductionActivityModel.refresh();
                var endDate = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndDate"
                );
                var endTime = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndTime"
                );
                this.setValueStateOk(endDate);
                this.setValueStateOk(endTime);
            },

            setValueStateOk: function (control) {
                control.setValueState("None");
                control.setValueStateText(" ");
                sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "okButton"
                ).setEnabled(true);
            },

            onClickStart: function (showTimeAndActivity) {
                var that = this,
                    fragmentHeader = "";
                var currentDate, dateObject, startDateTemp;

                dateObject = new Date(
                    this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                        new Date().getTime()
                    )
                );
                if (this.oActivityDialog == undefined) {
                    this.oActivityDialog = sap.ui.xmlfragment(
                        "prodActivitiesFragment",
                        "sap.oee.ui.fragments.activityDialog",
                        this
                    );
                    this.byId(
                        sap.ui.core.Fragment.createId(
                            "prodActivitiesFragment",
                            "activities"
                        )
                    );
                    this.getView().addDependent(this.oActivityDialog);
                }
                var endDate = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndDate"
                ); // on opening Dialog, ValueState for EndTime should be none
                var endTime = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndTime"
                );
                this.setValueStateOk(endTime);
                this.setValueStateOk(endDate);
                this.initializeStatusModel();
                if (
                    this.selectedOrder.productionActivity != undefined &&
                    this.selectedOrder.productionActivity != ""
                ) {
                    fragmentHeader = this.interfaces.oOEEBundle.getText(
                        "OEE_LABEL_SELECT_ACTIVITY"
                    );
                } else {
                    fragmentHeader =
                        this.interfaces.oOEEBundle.getText(
                            "OEE_LABEL_ENTER_STARTTIME_FORORDER"
                        ) +
                        " " +
                        this.selectedOrder.orderNumber;
                }
                var showActivityList = false;
                if (this.prodActivityList.length > 0) {
                    showActivityList = true;
                }
                if (this.isCurrentShift == true) {
                    this.oProductionActivityModel.setData({
                        showTimeAndActivity: showTimeAndActivity,
                        showActivityList: showActivityList,
                        activities: this.prodActivityList,
                        fragmentHeader: fragmentHeader,
                        startDate: dateObject,
                        startTime: dateObject,
                        crewSize: this.selectedOrder.crewSize,
                        crewSizeVisibilty: this.appData.node.crewSize,
                    });
                } else {
                    startDateTemp = new Date(
                        this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                            this.appData.shift.startTimestamp
                        )
                    );
                    this.oProductionActivityModel.setData({
                        showTimeAndActivity: showTimeAndActivity,
                        showActivityList: showActivityList,
                        activities: this.prodActivityList,
                        fragmentHeader: fragmentHeader,
                        startDate: startDateTemp,
                        startTime: startDateTemp,
                        crewSize: this.selectedOrder.crewSize,
                        crewSizeVisibilty: this.appData.node.crewSize,
                    });
                }
                this.oProductionActivityModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                this.oActivityDialog.setModel(this.oProductionActivityModel);
                if (
                    this.prodActivityList == undefined ||
                    this.prodActivityList.length == 0
                ) {
                    this.oActivityDialog.setContentHeight("20%");
                } else {
                    this.oActivityDialog.setContentHeight("30%");
                }
                this.oActivityDialog.open();
                if (
                    this.selectedOrder.productionActivity != undefined &&
                    this.selectedOrder.productionActivity != ""
                ) {
                    var items = sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "activities"
                    ).getItems();
                    if (items.length > 0) {
                        for (i in items) {
                            if (
                                items[i].getBindingContext().getProperty("prodActivity") ==
                                this.selectedOrder.productionActivity
                            ) {
                                items[i].setSelected(true);
                            }
                        }
                    }
                }
            },

            initializeStatusModel: function () {
                var descriptionOfStatus = {},
                    data = [],
                    dropDown,
                    buttonToSetCurrentTime,
                    curentDateTemp,
                    currentDateTimeStampInUTC;
                this.locale = sap.ui
                    .getCore()
                    .getConfiguration()
                    .getLocale()
                    .toString()
                    .substring(0, 2);
                var that = this;
                var endDate = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndDate"
                );
                var endTime = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndTime"
                );
                buttonToSetCurrentTime = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "buttonToSetCurrentTime"
                );
                buttonToSetCurrentTimeForStart = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "buttonToSetCurrentTimeForStart"
                );
                dropDown = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "selectStatus"
                );
                if (!this.oStatusModel) {
                    this.oStatusModel = new sap.ui.model.json.JSONModel();
                    data = [];
                    allStatus = this.interfaces.GetAllStatusWithLang(
                        this.appData.client,
                        this.appData.plant
                    );
                    allStatus.statusDTOList.results.forEach(function (elem) {
                        for (var i = 0; i < elem.statusDescDTOList.results.length; i++) {
                            if (elem.statusDescDTOList.results[i].language === that.locale) {
                                elem.description =
                                    elem.statusDescDTOList.results[i].description;
                            }
                        }
                    });

                    for (i = 0; i < this.appData.statusList.length; i++) {
                        if (this.appData.statusList[i].status === "ACT") {
                            descriptionOfStatus.Active =
                                this.appData.statusList[i].description;
                        } else if (this.appData.statusList[i].status === "CMPL") {
                            descriptionOfStatus.Completed =
                                this.appData.statusList[i].description;
                        } else if (this.appData.statusList[i].status === "HOLD") {
                            descriptionOfStatus.Hold = this.appData.statusList[i].description;
                        }
                    }
                    data.push({
                        Key: "ACT",
                        value: descriptionOfStatus.Active,
                    });
                    data.push({
                        Key: "HOLD",
                        value: descriptionOfStatus.Hold,
                    });
                    data.push({
                        Key: "CMPL",
                        value: descriptionOfStatus.Completed,
                    });
                    this.oStatusModel.setData({
                        data: data,
                    });
                    dropDown.setModel(this.oStatusModel);
                }
                // currentDate = sap.oee.ui.Utils.getPlantTimezoneTime(new Date().getTime(),this.appData.plantTimezoneOffset);
                curentDateTemp = new Date().toUTCString();
                this.setValueStateOk(endTime);
                this.setValueStateOk(endDate);
                currentDateTimeStampInUTC = new Date(curentDateTemp).getTime();
                if (
                    currentDateTimeStampInUTC <= this.appData.shift.endTimestamp &&
                    currentDateTimeStampInUTC >= this.appData.shift.startTimestamp
                ) {
                    dropDown.setSelectedIndex(0);
                    endTime.setEnabled(false);
                    endDate.setEnabled(false);
                    buttonToSetCurrentTime.setText(
                        that.interfaces.oOEEBundle.getText("OEE_BUTTON_SET_CURRENT")
                    );
                    buttonToSetCurrentTime.setTooltip(
                        that.interfaces.oOEEBundle.getText("OEE_BUTTON_SET_CURRENT")
                    );
                    buttonToSetCurrentTime.setEnabled(false);
                    buttonToSetCurrentTimeForStart.setText(
                        that.interfaces.oOEEBundle.getText("OEE_BUTTON_SET_CURRENT")
                    );
                    buttonToSetCurrentTimeForStart.setTooltip(
                        that.interfaces.oOEEBundle.getText("OEE_BUTTON_SET_CURRENT")
                    );
                    this.isCurrentShift = true;
                } else {
                    dropDown.setSelectedIndex(2);
                    endTime.setEnabled(true);
                    endDate.setEnabled(true);
                    buttonToSetCurrentTime.setText(
                        that.interfaces.oOEEBundle.getText("OEE_BTN_SET_SHIFT_START")
                    );
                    buttonToSetCurrentTime.setTooltip(
                        that.interfaces.oOEEBundle.getText("OEE_BTN_SET_SHIFT_START")
                    );
                    buttonToSetCurrentTime.setEnabled(true);
                    buttonToSetCurrentTimeForStart.setText(
                        that.interfaces.oOEEBundle.getText("OEE_BTN_SET_SHIFT_START")
                    );
                    buttonToSetCurrentTimeForStart.setTooltip(
                        that.interfaces.oOEEBundle.getText("OEE_BTN_SET_SHIFT_START")
                    );
                    this.isCurrentShift = false;
                }
            },

            onResumeOrder: function (showTimeAndActivity) {
                var dateObject, startDateTemp;

                dateObject = new Date(
                    this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                        new Date().getTime()
                    )
                );

                if (this.oActivityDialog == undefined) {
                    this.oActivityDialog = sap.ui.xmlfragment(
                        "prodActivitiesFragment",
                        "sap.oee.ui.fragments.activityDialog",
                        this
                    );
                    this.byId(
                        sap.ui.core.Fragment.createId(
                            "prodActivitiesFragment",
                            "activities"
                        )
                    );
                    this.getView().addDependent(this.oActivityDialog);
                }
                this.initializeStatusModel();
                var fragmentHeader = "";
                /*if(this.selectedOrder.productionActivity != undefined && this.selectedOrder.productionActivity != ""){
                                                                              fragmentHeader = this.interfaces.oOEEBundle.getText("OEE_LABEL_SELECT_ACTIVITY");
                                                                          }else{*/
                fragmentHeader =
                    this.interfaces.oOEEBundle.getText("OEE_LABEL_ENTER_TIME") +
                    " - " +
                    this.selectedOrder.orderNumber;
                //}
                var showActivityList = false;
                if (this.prodActivityList.length > 0) {
                    showActivityList = true;
                }
                if (this.isCurrentShift == true) {
                    this.oProductionActivityModel.setData({
                        showTimeAndActivity: showTimeAndActivity,
                        showActivityList: showActivityList,
                        activities: this.prodActivityList,
                        fragmentHeader: fragmentHeader,
                        startDate: dateObject,
                        startTime: dateObject,
                        crewSize: this.selectedOrder.crewSize,
                        crewSizeVisibilty: this.appData.node.crewSize,
                    });
                } else {
                    startDateTemp = new Date(
                        this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                            this.appData.shift.startTimestamp
                        )
                    );
                    this.oProductionActivityModel.setData({
                        showTimeAndActivity: showTimeAndActivity,
                        showActivityList: showActivityList,
                        activities: this.prodActivityList,
                        fragmentHeader: fragmentHeader,
                        startDate: startDateTemp,
                        startTime: startDateTemp,
                        crewSize: this.selectedOrder.crewSize,
                        crewSizeVisibilty: this.appData.node.crewSize,
                    });
                }
                this.oProductionActivityModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                this.oActivityDialog.setModel(this.oProductionActivityModel);
                if (
                    this.prodActivityList == undefined ||
                    this.prodActivityList.length == 0
                ) {
                    this.oActivityDialog.setContentHeight("20%");
                } else {
                    this.oActivityDialog.setContentHeight("30%");
                }
                this.oActivityDialog.open();
                if (
                    this.selectedOrder.productionActivity != undefined &&
                    this.selectedOrder.productionActivity != ""
                ) {
                    var items = sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "activities"
                    ).getItems();
                    if (items.length > 0) {
                        for (i in items) {
                            if (
                                items[i].getBindingContext().getProperty("prodActivity") ==
                                this.selectedOrder.productionActivity
                            ) {
                                items[i].setSelected(true);
                            }
                        }
                    }
                }
            },

            handleOK: function (oEvent) {
                var endDateValueTimeStampInUTC,
                    startDateValueTimeStampInUTC,
                    isStartTimeValid,
                    orderStartResumeTime,
                    orderEndTimeStamp,
                    orderEndDate;
                var startDateValue,
                    startTimeValue,
                    endDateValue,
                    endTimeValue,
                    orderEndResumeTime;

                startDateValue = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputStartDate"
                ).getDateValue();
                startTimeValue = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputStartTime"
                ).getDateValue();
                endDateValue = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndDate"
                ).getDateValue();
                endTimeValue = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndTime"
                ).getDateValue();

                if (
                    startDateValue &&
                    startTimeValue &&
                    startDateValue != "" &&
                    startTimeValue != ""
                ) {
                    orderStartResumeTime = sap.oee.ui.Utils.createTimestampFromDateTime(
                        startDateValue,
                        startTimeValue
                    );
                }

                if (
                    endDateValue &&
                    endTimeValue &&
                    endDateValue != "" &&
                    endTimeValue != ""
                ) {
                    orderEndResumeTime = sap.oee.ui.Utils.createTimestampFromDateTime(
                        endDateValue,
                        endTimeValue
                    );
                }

                if (
                    orderStartResumeTime == null ||
                    orderStartResumeTime == undefined ||
                    orderStartResumeTime == ""
                ) {
                    sap.oee.ui.Utils.createMessage(
                        this.interfaces.oOEEBundle.getText("OEE_ERR_MSG_ENTER_START_TIME"),
                        sap.ui.core.MessageType.Error
                    );
                    return;
                }
                isStartTimeValid =
                    this.validateStartTimeDateForOrder(orderStartResumeTime); // start time in future or not
                if (isStartTimeValid === true && isStartTimeValid !== undefined) {
                    var result = this.validationCheckForEndTimeField();
                    if (result === true) {
                        var valueStateStartDate = sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputStartDate"
                        ).getValueState();
                        var valueStateEndDate = sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndDate"
                        ).getValueState();
                        var valueStateStartTime = sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputStartTime"
                        ).getValueState();
                        var valueStateEndTime = sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndTime"
                        ).getValueState();

                        if (
                            valueStateStartDate == "None" &&
                            valueStateEndDate == "None" &&
                            valueStateStartTime == "None" &&
                            valueStateEndTime == "None"
                        ) {
                            var selectedProductionActivity = "";
                            if (
                                sap.ui.core.Fragment.byId(
                                    "prodActivitiesFragment",
                                    "activities"
                                ).getSelectedItem() != null
                            ) {
                                var selectedProductionActivityContext =
                                    sap.ui.core.Fragment.byId(
                                        "prodActivitiesFragment",
                                        "activities"
                                    )
                                        .getSelectedItem()
                                        .getBindingContext();
                                selectedProductionActivity =
                                    selectedProductionActivityContext.getProperty("prodActivity");
                            }
                            if (
                                !this.oProductionActivityModel.getProperty(
                                    "/showTimeAndActivity"
                                )
                            ) {
                                var result = this.interfaces.changeProductionActivity(
                                    this.selectedOrder.runID,
                                    selectedProductionActivity
                                );
                                if (result.outputCode === 0) {
                                    sap.oee.ui.Utils.toast(
                                        this.appComponent.oBundle.getText(
                                            "OEE_MESSAGE_PROD_ACT_CHANGED"
                                        )
                                    );
                                    this.clearActivityData();
                                    this.oActivityDialog.close();
                                    sap.oee.ui.Utils.updateModel(this.oActivityDialog.getModel());
                                    this.bindOrdersToTable();
                                } else {
                                    sap.oee.ui.Utils.createMessage(
                                        result.outputMessage,
                                        sap.ui.core.MessageType.Error
                                    );
                                }
                                return;
                            }

                            startDateValue = orderStartResumeTime;

                            startDateValueTimeStampInUTC =
                                this.getUTCForCurrentDate(startDateValue);
                            if (
                                orderEndResumeTime !== undefined &&
                                orderEndResumeTime !== null
                            ) {
                                //										endDateValueTimeStamp = orderEndResumeTime.getTime();
                                //var runEndTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(endDateValueTimeStamp,this.appData.plantTimezoneOffset);
                                endDateValueTimeStampInUTC =
                                    this.getUTCForCurrentDate(orderEndResumeTime);
                                orderEndTimeStamp = this.removeSecondsFromTime(
                                    endDateValueTimeStampInUTC
                                ); // value passed in ODataInterface.
                            } else {
                                orderEndTimeStamp = null;
                            }
                            jQuery.sap.require("sap.ui.core.format.NumberFormat");
                            var floatFormatter =
                                sap.ui.core.format.NumberFormat.getFloatInstance();
                            if (
                                this.appData.node.crewSize ===
                                sap.oee.ui.oeeConstants.checkBooleanValue.TRUE
                            ) {
                                this.crewSize = sap.ui.core.Fragment.byId(
                                    "prodActivitiesFragment",
                                    "crewSize"
                                ).getValue();
                                if (this.crewSize != "") {
                                    var value = floatFormatter.parse(this.crewSize);
                                    if (isNaN(value) || value < 0) {
                                        sap.ui.core.Fragment.byId(
                                            "prodActivitiesFragment",
                                            "crewSize"
                                        ).setValue("");
                                        sap.oee.ui.Utils.createMessage(
                                            this.appComponent.oBundle.getText(
                                                "OEE_ERR_MSG_CREW_SIZE"
                                            ),
                                            sap.ui.core.MessageType.Error
                                        );
                                        return;
                                    }
                                    this.crewSize = value;
                                } else {
                                    this.crewSize = parseFloat(0);
                                }
                            } else {
                                this.crewSize = 0;
                            }

                            var startTimeString =
                                sap.oee.ui.Formatter.formatDateTimeToString(startDateValue); // this is only the time so not converting it to UTC
                            var endTimeString =
                                sap.oee.ui.Formatter.formatDateTimeToString(orderEndResumeTime); // to set value for this.selectedOrder.endTime , this is only the time so not converting it to UTC
                            //var startTimeStamp_create= new Date(startDateValue).getTime();
                            var startTimeStamp_create = startDateValueTimeStampInUTC;
                            /*var shiftStartTime =new Date(this.appData.shift.startDate+' '+this.appData.shift.startTime).getTime();
                                                                                        var shiftEndTime =new Date(this.appData.shift.endDate+' '+this.appData.shift.endTime).getTime();*/
                            var shiftStartTime = this.appData.shift.startTimestamp;
                            var shiftEndTime = this.appData.shift.endTimestamp;

                            if (
                                startTimeStamp_create >= shiftStartTime &&
                                startTimeStamp_create <= shiftEndTime
                            ) {
                                // current time is between present shift or not
                                var orderStartDate =
                                    this.orderStartDateForOverlappingShifts(startTimeString);
                                if (
                                    orderEndResumeTime !== undefined &&
                                    orderEndResumeTime !== null &&
                                    orderEndResumeTime !== ""
                                ) {
                                    // orderEndDate = this.gettingOrderEndDate(orderEndResumeTime);
                                    orderEndDate = this.gettingOrderEndDate(
                                        new Date(endDateValueTimeStampInUTC)
                                    );
                                }
                                this.clearActivityData();
                                this.oActivityDialog.close();
                                sap.oee.ui.Utils.updateModel(this.oActivityDialog.getModel());
                                this.selectedOrder.productionActivity =
                                    selectedProductionActivity;
                                this.selectedOrder.startDate = orderStartDate;
                                this.selectedOrder.endDate = orderEndDate;
                                this.selectedOrder.startTime = startTimeString;
                                this.selectedOrder.endTime = endTimeString;

                                if (
                                    this.appData.node.lineBehavior == "MULTI_CAP_SINGLE_LINE" ||
                                    this.appData.node.lineBehavior ==
                                    "MULTI_CAP_SINGLE_LINE_REP_WITH_MULTIPLIER"
                                ) {
                                    this.openCapacityDialog(orderStartDate, startTimeString);
                                } else {
                                    try {
                                        if (this.customData.getValue() == "RESUME") {
                                            this.onClickResume(orderStartResumeTime);
                                        } else {
                                            /*var operationStartData = this.interfaces
                                                                                                    .interfacesStartProductionRun(this.selectedOrder.releasedHeaderID,this.selectedOrder.releasedID,this.appData.shift.shiftID,
                                                                                                            this.appData.shift.shiftGrouping,this.appData.shift.workBreakSchedule,
                                                                                                            selectedProductionActivity,
                                                                                                            orderStartDate,startTimeString,undefined,this.crewSize); */
                                            /*	removeSecondsFromTime(startDateValue.getTime());*/

                                            // Setting Order Start Date
                                            //var runStartTimeStampTemp = new Date(orderStartDate + ' '+ startTimeString).getTime();
                                            //var runStartTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(runStartTimeStampTemp,this.appData.plantTimezoneOffset);
                                            var runStartTimeStamp = this.getUTCForCurrentDate(
                                                new Date(orderStartDate + " " + startTimeString)
                                            );
                                            var orderStartTimeStamp =
                                                this.removeSecondsFromTime(runStartTimeStamp);

                                            var operationStartResumeData =
                                                this.interfaces.startResumeOrder(
                                                    this.selectedOrder.releasedHeaderID,
                                                    this.selectedOrder.releasedID,
                                                    this.appData.shift.shiftID,
                                                    this.appData.shift.shiftGrouping,
                                                    this.appData.shift.workBreakSchedule,
                                                    selectedProductionActivity,
                                                    orderStartTimeStamp,
                                                    undefined,
                                                    this.crewSize,
                                                    orderEndTimeStamp,
                                                    this.selectedStatusValue
                                                );
                                            if (operationStartResumeData == undefined) {
                                                return;
                                            }
                                            if (operationStartResumeData != undefined) {
                                                outputCode = operationStartResumeData.outputCode;
                                                if (outputCode == 0) {
                                                    this.appComponent
                                                        .getEventBus()
                                                        .publish(this.appComponent.getId(), "orderChange", {
                                                            runID: operationStartResumeData.runID,
                                                        });
                                                    this.router = this.appComponent.getRouter();
                                                    this.router.navTo("contentArea");
                                                } else if (outputCode == 1) {
                                                    sap.oee.ui.Utils.createMessage(
                                                        operationStartResumeData.outputMessage,
                                                        sap.ui.core.MessageType.Error
                                                    );
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        sap.oee.ui.Utils.createMessage(
                                            e.message,
                                            sap.ui.core.MessageType.Error
                                        );
                                    }
                                }
                            } else {
                                sap.oee.ui.Utils.createMessage(
                                    this.interfaces.oOEEBundle.getText(
                                        "OEE_MESSAGE_SHIFT_BOUNDARY"
                                    ),
                                    sap.ui.core.MessageType.Error
                                );
                                //sap.ui.core.Fragment.byId("prodActivitiesFragment","InputDate").setValueState(sap.ui.core.ValueState.Error);
                            }
                        }
                    }
                } else {
                    sap.oee.ui.Utils.createMessage(
                        this.interfaces.oOEEBundle.getText("OEE_ERR_START_TIME_IN_FUTURE"),
                        sap.ui.core.MessageType.Error
                    );
                }
            },

            validateStartTimeDateForOrder: function (orderDate) {
                var currentTime, currentTimeStamp, orderDate, orderDateTimeStamp;
                currentTime = new Date().toUTCString();
                currentTimeStamp = new Date(currentTime).getTime();
                if ((orderDate != "" && orderDate != null) || orderDate != undefined) {
                    orderDateTimeStamp = this.getUTCForCurrentDate(orderDate);
                } else {
                    return false;
                }
                if (currentTimeStamp < orderDateTimeStamp) {
                    return false;
                } else {
                    return true;
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
                        offsetInMinutes =
                            sap.oee.ui.Utils.getPlantTimezoneOffsetBasedOnTimezoneKey(
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

            gettingOrderEndDate: function (endDateValueTimeStampTemp) {
                var tempOrderEndDate, tempOrderEndMonth, tempOrderEndYear, orderEndDate;
                tempOrderEndDate = this.endDateFormatter(
                    endDateValueTimeStampTemp.getDate()
                );
                tempOrderEndMonth = this.endDateFormatter(
                    endDateValueTimeStampTemp.getMonth(),
                    true
                );
                tempOrderEndYear = endDateValueTimeStampTemp.getFullYear();
                orderEndDate =
                    tempOrderEndYear + "/" + tempOrderEndMonth + "/" + tempOrderEndDate;
                return orderEndDate;
            },

            validationCheckForEndTimeField: function () {
                var endDateValue,
                    startDateValue,
                    endTimeValue,
                    startTimeValue,
                    startDateTime,
                    endDateTime,
                    startDateValueTimeStamp,
                    endDateValueTimeStamp;
                this.selectedStatus = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "selectStatus"
                );
                this.selectedStatusValue = this.selectedStatus.getSelectedKey();
                endDateValue = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndDate"
                ).getDateValue();
                endTimeValue = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndTime"
                ).getDateValue();
                startDateValue = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputStartDate"
                ).getDateValue();
                startTimeValue = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputStartTime"
                ).getDateValue();

                if (
                    endDateValue &&
                    endTimeValue &&
                    endDateValue != "" &&
                    endTimeValue != ""
                ) {
                    endDateTime = sap.oee.ui.Utils.createTimestampFromDateTime(
                        endDateValue,
                        endTimeValue
                    );
                }

                if (
                    startDateValue &&
                    startTimeValue &&
                    startDateValue != "" &&
                    startTimeValue != ""
                ) {
                    startDateTime = sap.oee.ui.Utils.createTimestampFromDateTime(
                        startDateValue,
                        startTimeValue
                    );
                }

                startDateValueTimeStamp = this.getUTCForCurrentDate(startDateTime);
                endDateValueTimeStamp = this.getUTCForCurrentDate(endDateTime);
                if (
                    startDateValueTimeStamp != null &&
                    startDateValueTimeStamp != undefined &&
                    startDateValueTimeStamp != "" &&
                    endDateValueTimeStamp != "" &&
                    endDateValueTimeStamp != undefined &&
                    endDateValueTimeStamp != null
                ) {
                    if (startDateValueTimeStamp === endDateValueTimeStamp) {
                        // checking of start time is equal to endtime or not
                        sap.oee.ui.Utils.createMessage(
                            this.interfaces.oOEEBundle.getText(
                                "START_TIME_EQUALS_END_TIME_ERROR"
                            ),
                            sap.ui.core.MessageType.Error
                        );
                        return false;
                    } else if (startDateValueTimeStamp > endDateValueTimeStamp) {
                        // checking if start time is less than end time or not
                        sap.oee.ui.Utils.createMessage(
                            this.interfaces.oOEEBundle.getText(
                                "START_TIME_GREATER_THAN_END_TIME"
                            ),
                            sap.ui.core.MessageType.Error
                        );
                        return false;
                    }
                }
                if (
                    this.selectedStatusValue === "CMPL" ||
                    this.selectedStatusValue === "HOLD"
                ) {
                    if (
                        endDateValue === undefined ||
                        endDateValue === null ||
                        endDateValue === ""
                    ) {
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndDate"
                        ).setValueState("Error");
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndDate"
                        ).setValueStateText("Please Enter End Date");
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndTime"
                        ).setValueState("Error");
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndTime"
                        ).setValueStateText("Please Enter End Time");
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "okButton"
                        ).setEnabled(false);
                        return false;
                    } else {
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndDate"
                        ).setValueState("None");
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndDate"
                        ).setValueStateText(" ");
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndTime"
                        ).setValueState("None");
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "inputEndTime"
                        ).setValueStateText(" ");
                        sap.ui.core.Fragment.byId(
                            "prodActivitiesFragment",
                            "okButton"
                        ).setEnabled(true);
                        return true;
                    }
                } else {
                    sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "inputEndDate"
                    ).setValueState("None");
                    sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "inputEndDate"
                    ).setValueStateText(" ");
                    sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "inputEndTime"
                    ).setValueState("None");
                    sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "inputEndTime"
                    ).setValueStateText(" ");
                    sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "okButton"
                    ).setEnabled(true);
                    return true;
                }
            },

            endDateFormatter: function (val, isMonth) {
                if (isMonth && isMonth !== undefined) {
                    val = val + 1;
                }
                return val < 10 ? "0" + val : val;
            },

            removeSecondsFromTime: function (timeStamp) {
                if (timeStamp) {
                    var dateTime = new Date(parseInt(timeStamp));
                    var seconds = dateTime.getSeconds();
                    timeStamp = timeStamp / 1000;
                    timeStamp = timeStamp - seconds;
                    timeStamp = timeStamp * 1000;
                    return timeStamp;
                }
                return "";
            },

            onChangeStatus: function (oEvent) {
                var endTime, endDate;
                var selectedStatus = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "selectStatus"
                );
                endTime = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndTime"
                );
                endDate = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndDate"
                );
                var selectedStatusValue = selectedStatus.getSelectedKey();
                if (selectedStatusValue === "ACT") {
                    if (endTime.getValueState() === "Error") {
                        this.setValueStateOk(endTime);
                    }
                    if (endDate.getValueState() === "Error") {
                        this.setValueStateOk(endDate);
                    }
                    endTime.setDateValue(null);
                    endTime.setEnabled(false);
                    endDate.setDateValue(null);
                    endDate.setEnabled(false);
                    var buttonToSetCurrentTime = sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "buttonToSetCurrentTime"
                    );
                    buttonToSetCurrentTime.setEnabled(false);
                } else if (
                    selectedStatusValue === "CMPL" ||
                    selectedStatusValue === "HOLD"
                ) {
                    endTime.setEnabled(true);
                    endDate.setEnabled(true);
                    var buttonToSetCurrentTime = sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "buttonToSetCurrentTime"
                    );
                    buttonToSetCurrentTime.setEnabled(true);
                    this.setValueStateOk(endTime);
                    this.setValueStateOk(endDate);
                }
            },


            handleActivityCancel: function (oEvent) {
                this.clearActivityData();
                /*var crewSize = sap.ui.core.Fragment.byId("prodActivitiesFragment","crewSize");
                                                                          if(crewSize){
                                                                              crewSize.setValue("0");
                                                                          }*/
                sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "okButton"
                ).setEnabled(true);
                sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputStartDate"
                ).setValueState(sap.ui.core.ValueState.None);
                sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndDate"
                ).setValueState(sap.ui.core.ValueState.None);
                if (this.oProductionActivityModel) {
                    this.oProductionActivityModel.setData(null);
                    this.oProductionActivityModel.updateBindings(true);
                }
                this.oActivityDialog.close();
            },



            clearActivityData: function () {
                var items = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "activities"
                ).getItems();
                if (items.length > 0) {
                    for (i in items) {
                        if (items[i].getSelected()) {
                            items[i].setSelected(false);
                        }
                    }
                }
            },

            getActAUFNR: function (oEvent) {


                TransactionCaller.async(
                    "MES/Itelli/FLM/ALERT/T_GET_FRN_TRACE_DATA",
                    {

                    },
                    "O_JSON",
                    this.getActAUFNRCB,
                    this
                );
            },

            getActAUFNRCB: function (iv_data, iv_scope) {

                var myArrr3 = Array.isArray(iv_data[0]?.modelData?.activeOrder?.Rowsets?.Rowset?.Row) ? iv_data[0]?.modelData?.activeOrder?.Rowsets?.Rowset?.Row : new Array(iv_data[0]?.modelData?.activeOrder?.Rowsets?.Rowset?.Row);
                var myModel3 = new sap.ui.model.json.JSONModel(myArrr3);


                var planlananKutuk = iv_data[0]?.modelData?.planlananMiktar.Rowsets.Rowset.Row.Y_URETILECEK_PAKSAY;
                var uretilenkutuk = iv_data[0]?.modelData?.uretilenMiktar.Rowsets.Rowset.Row.URETILEN_KUTUK_SAYISI;
                var farkx = iv_data[0]?.modelData?.fark.Rowsets;
                iv_scope.getView().byId("uretimMiktar")?.setText(planlananKutuk + "-" + uretilenkutuk + "-" + farkx);



            },

            handleCancelTime: function (oEvent) {
                sap.ui.core.Fragment.byId("enterTimeFragment", "okButton1").setEnabled(
                    true
                );
                sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "inputDate"
                ).setValueState(sap.ui.core.ValueState.None);
                sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "inputTime"
                ).setValueState(sap.ui.core.ValueState.None);
                this.oEnterTimeDialog.close();
            },

            onClickHold: function (holdTime) {
                var isStartTimeValid;
                var endDateValue = holdTime;
                var endTimeString =
                    sap.oee.ui.Formatter.formatDateTimeToString(endDateValue); // taking out the Time in HH:MM:SS String format
                // var endTimeStamp_create= new Date(endDateValue).getTime();
                var endTimeStamp_create = this.getUTCForCurrentDate(endDateValue); // current value in hold date Time field in UTC
                /*var shiftStartTime =new Date(this.appData.shift.startDate+' '+this.appData.shift.startTime).getTime();
                                                                          var shiftEndTime =new Date(this.appData.shift.endDate+' '+this.appData.shift.endTime).getTime();*/
                var shiftStartTime = this.appData.shift.startTimestamp;
                var shiftEndTime = this.appData.shift.endTimestamp;
                isStartTimeValid = this.validateStartTimeDateForOrder(endDateValue);
                if (isStartTimeValid != null && isStartTimeValid === true) {
                    if (
                        endTimeStamp_create >= shiftStartTime &&
                        endTimeStamp_create <= shiftEndTime
                    ) {
                        try {
                            var orderHoldDate =
                                this.orderStartDateForOverlappingShifts(endTimeString);
                            var status = this.interfaces.pauseProductionRun(
                                this.selectedOrder.runID,
                                endTimeStamp_create
                            ); // passing the UTC HoldTimestamp to this service so removing conversion from ODataInterface.js
                            if (status !== undefined && status != "") {
                                if (status.outputCode != undefined && status.outputCode === 0) {
                                    this.appComponent
                                        .getEventBus()
                                        .publish(this.appComponent.getId(), "clearOrderContext", {
                                            orderChangePublish: true,
                                        });
                                    // this.bindOrdersToTable();
                                    this.fetchOrdersBasedOnStatus();
                                } else if (
                                    status.outputCode != undefined &&
                                    status.outputCode === 1
                                ) {
                                    sap.oee.ui.Utils.createMessage(
                                        status.outputMessage,
                                        sap.ui.core.MessageType.Error
                                    );
                                }
                            } else {
                                sap.oee.ui.Utils.createMessage(
                                    this.interfaces.oOEEBundle.getText(
                                        "OEE_MESSAGE_UNSUCCESSFUL_PAUSE"
                                    ),
                                    sap.ui.core.MessageType.Error
                                );
                            }
                        } catch (e) {
                            sap.oee.ui.Utils.createMessage(
                                e.message,
                                sap.ui.core.MessageType.Error
                            );
                        }
                    } else {
                        sap.oee.ui.Utils.createMessage(
                            this.interfaces.oOEEBundle.getText("OEE_MESSAGE_SHIFT_BOUNDARY"),
                            sap.ui.core.MessageType.Error
                        );
                    }
                } else {
                    sap.oee.ui.Utils.createMessage(
                        this.interfaces.oOEEBundle.getText("OEE_ERR_START_TIME_IN_FUTURE"),
                        sap.ui.core.MessageType.Error
                    );
                }
            },

            openEnterTimeDialog: function (timeText) {
                var startDate = new Date(
                    this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(
                        new Date().getTime()
                    )
                );
                if (this.oEnterTimeDialog == undefined) {
                    this.oEnterTimeDialog = sap.ui.xmlfragment(
                        "enterTimeFragment",
                        "sap.oee.ui.fragments.enterTime",
                        this
                    );
                    this.getView().addDependent(this.oEnterTimeDialog);
                }

                this.oEnterTimeModel.setData({
                    timeLabel: timeText,
                    fragmentHeader:
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_ENTER_TIME") +
                        " - " +
                        this.selectedOrder.orderNumber,
                    enterDateTime: false,
                    startDate: startDate,
                    startTime: startDate,
                });
                this.oEnterTimeModel.setDefaultBindingMode(
                    sap.ui.model.BindingMode.TwoWay
                );
                this.oEnterTimeDialog.setModel(this.oEnterTimeModel);
                this.oEnterTimeDialog.open();
            },

            checkDateTime: function (oEvent) {
                var bValid = oEvent.getParameter("valid");
                if (bValid) {
                    oEvent.oSource.setValueState(sap.ui.core.ValueState.None);
                    var okButtonofEnterTime = sap.ui.core.Fragment.byId(
                        "enterTimeFragment",
                        "okButton1"
                    );
                    if (okButtonofEnterTime) {
                        okButtonofEnterTime.setEnabled(true);
                    }
                    var okButtonofActivity = sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "okButton"
                    );
                    if (okButtonofActivity) {
                        okButtonofActivity.setEnabled(true);
                    }
                } else {
                    oEvent.oSource.setValueState(sap.ui.core.ValueState.Error);
                    var okButtonofEnterTime = sap.ui.core.Fragment.byId(
                        "enterTimeFragment",
                        "okButton1"
                    );
                    if (okButtonofEnterTime) {
                        okButtonofEnterTime.setEnabled(false);
                    }
                    var okButtonofActivity = sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "okButton"
                    );
                    if (okButtonofActivity) {
                        okButtonofActivity.setEnabled(false);
                    }
                    //oEvent.oSource.setValue("");
                }
            },

            handleOKTime: function (oEvent) {
                var aufnr = this.selectedOrder.orderNumber;
                var nodeID = this.appData.node.nodeID;
                var workcenterName = this.appData.node.description;

                if (workcenterName == "Ark Ocağı" || workcenterName == "Pota Ocağı") {
                    var params = {
                        I_AUFNR: aufnr,
                        I_NODEID: nodeID,
                        I_WORKCENTERNAME: workcenterName,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/selectOrder/castCloseControl/castCloseControlXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                }
                var startTime, startDate, combinedDateTime;

                var valueStateDate = sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "inputDate"
                ).getValueState();
                var valueStateTime = sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "inputTime"
                ).getValueState();
                startDate = sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "inputDate"
                ).getDateValue();
                startTime = sap.ui.core.Fragment.byId(
                    "enterTimeFragment",
                    "inputTime"
                ).getDateValue();
                if (
                    startTime == null ||
                    startTime == undefined ||
                    startTime == "" ||
                    startDate == null ||
                    startDate == undefined ||
                    startDate == ""
                ) {
                    sap.oee.ui.Utils.createMessage(
                        this.interfaces.oOEEBundle.getText("OEE_ERR_MSG_ENTER_START_TIME"),
                        sap.ui.core.MessageType.Error
                    );
                    return;
                }
                if (valueStateDate == "None" && valueStateTime == "None") {
                    try {
                        combinedDateTime = sap.oee.ui.Utils.createTimestampFromDateTime(
                            startDate,
                            startTime
                        );
                        if (
                            this.customData.getValue() == sap.oee.ui.oeeConstants.status.HOLD
                        ) {
                            this.onClickHold(combinedDateTime);
                        }
                        if (this.customData.getValue() == "COMPLETE") {
                            this.onClickComplete(combinedDateTime);
                        }
                        /*if(this.customData.getValue()== "RESUME"){
                                                                                  this.onResumeOrder(true);
                                                                              }*/
                    } catch (e) {
                        sap.oee.ui.Utils.createMessage(
                            e.message,
                            sap.ui.core.MessageType.Error
                        );
                    }
                    this.oEnterTimeDialog.close();
                }
            },

            onClickResume: function (resumeTime) {
                var endDateValueTimeStamp,
                    orderEndTimeStamp,
                    runStartTimeStampTempInUTC,
                    orderStartTimeStamp,
                    combinedEndDate;
                var resumeDateValue = resumeTime;
                var resumeTimeString =
                    sap.oee.ui.Formatter.formatDateTimeToString(resumeDateValue); // it is only taking time so not changing it to UTC
                //						var resumeTimeStamp_create= new Date(resumeDateValue).getTime();
                var resumeTimeStamp_create = this.getUTCForCurrentDate(resumeDateValue); // UTC Timestamp of resume
                /*var shiftStartTime =new Date(this.appData.shift.startDate+' '+this.appData.shift.startTime).getTime();
                                                                          var shiftEndTime =new Date(this.appData.shift.endDate+' '+this.appData.shift.endTime).getTime();*/
                var shiftStartTime = this.appData.shift.startTimestamp; // taking the UTC timestamp of shifts for comparison.
                var shiftEndTime = this.appData.shift.endTimestamp;

                var endDate = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndDate"
                ).getDateValue();
                var endTime = sap.ui.core.Fragment.byId(
                    "prodActivitiesFragment",
                    "inputEndTime"
                ).getDateValue();

                if (endDate && endTime && endDate != "" && endTime != "") {
                    combinedEndDate = sap.oee.ui.Utils.createTimestampFromDateTime(
                        endDate,
                        endTime
                    );
                }

                if (combinedEndDate != undefined) {
                    orderEndTimeStamp = this.removeSecondsFromTime(
                        this.getUTCForCurrentDate(combinedEndDate)
                    ); // value passed in ODataInterface.
                } else {
                    orderEndTimeStamp = null;
                }

                runStartTimeStampTempInUTC = this.getUTCForCurrentDate(
                    new Date(
                        this.selectedOrder.startDate + " " + this.selectedOrder.startTime
                    )
                ); // run startTimeStamp is in UTC
                //						var runStartTimeStampTemp = new Date(this.selectedOrder.startDate + ' '+ this.selectedOrder.startTime).getTime();
                //						var runStartTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(runStartTimeStampTemp,this.appData.plantTimezoneOffset);
                orderStartTimeStamp = this.removeSecondsFromTime(
                    runStartTimeStampTempInUTC
                );

                if (
                    resumeTimeStamp_create >= shiftStartTime &&
                    resumeTimeStamp_create <= shiftEndTime
                ) {
                    var orderResumeDate =
                        this.orderStartDateForOverlappingShifts(resumeTimeString);
                    if (
                        this.appData.node.lineBehavior == "MULTI_CAP_SINGLE_LINE" ||
                        this.appData.node.lineBehavior ==
                        "MULTI_CAP_SINGLE_LINE_REP_WITH_MULTIPLIER"
                    ) {
                        this.selectedOrder.startDate = orderResumeDate;
                        this.selectedOrder.startTime = resumeTimeString;
                        this.openCapacityDialog(orderResumeDate, resumeTimeString);
                    } else {
                        try {
                            /*var resumedOrderJSON = this.interfaces
                                                                                        .resumeProductionRun(this.selectedOrder.runID,this.appData.shift.shiftID,this.appData.shift.shiftGrouping,
                                                                                                this.appData.shift.workBreakSchedule,orderResumeDate, 
                                                                                                resumeTimeString,this.selectedOrder.productionActivity,undefined,this.crewSize);*/

                            var operationStartResumeData = this.interfaces.startResumeOrder(
                                this.selectedOrder.releasedHeaderID,
                                this.selectedOrder.releasedID,
                                this.appData.shift.shiftID,
                                this.appData.shift.shiftGrouping,
                                this.appData.shift.workBreakSchedule,
                                this.selectedOrder.productionActivity,
                                orderStartTimeStamp,
                                this.capacityNodeList,
                                this.crewSize,
                                orderEndTimeStamp,
                                this.selectedStatusValue,
                                this.selectedOrder.runID
                            );
                            if (operationStartResumeData == undefined) {
                                return;
                            } else if (
                                operationStartResumeData != undefined &&
                                operationStartResumeData.outputCode == 0
                            ) {
                                this.appComponent
                                    .getEventBus()
                                    .publish(this.appComponent.getId(), "orderChange", {
                                        runID: operationStartResumeData.runID,
                                    });
                                this.router = this.appComponent.getRouter();
                                this.router.navTo("contentArea");
                            } else if (operationStartResumeData.outputCode == 1) {
                                sap.oee.ui.Utils.createMessage(
                                    operationStartResumeData.outputMessage,
                                    sap.ui.core.MessageType.Error
                                );
                            }
                        } catch (e) {
                            sap.oee.ui.Utils.createMessage(
                                e.message,
                                sap.ui.core.MessageType.Error
                            );
                        }
                    }
                } else {
                    sap.oee.ui.Utils.createMessage(
                        this.interfaces.oOEEBundle.getText("OEE_MESSAGE_SHIFT_BOUNDARY"),
                        sap.ui.core.MessageType.Error
                    );
                }
            },

            onClickComplete: function (endTime) {
                var isStartTimeValid;
                var endDateValue = endTime;
                var endTimeString =
                    sap.oee.ui.Formatter.formatDateTimeToString(endDateValue); // getting value of End time in HH:MM:SS String format
                // var endTimeStamp_create= new Date(endDateValue).getTime();
                var endTimeStamp_create = this.getUTCForCurrentDate(endDateValue); // converting the endTime to UTC TimeStamp
                /*var shiftStartTime =new Date(this.appData.shift.startDate+' '+this.appData.shift.startTime).getTime();
                                                                          var shiftEndTime =new Date(this.appData.shift.endDate+' '+this.appData.shift.endTime).getTime();*/
                var shiftStartTime = this.appData.shift.startTimestamp;
                var shiftEndTime = this.appData.shift.endTimestamp;
                isStartTimeValid = this.validateStartTimeDateForOrder(endDateValue);
                if (isStartTimeValid != null && isStartTimeValid === true) {
                    if (
                        endTimeStamp_create >= shiftStartTime &&
                        endTimeStamp_create <= shiftEndTime
                    ) {
                        try {
                            var orderCompleteDate =
                                this.orderStartDateForOverlappingShifts(endTimeString);
                            var stopOrderData = this.interfaces.stopProductionRun(
                                this.selectedOrder.releasedID,
                                this.selectedOrder.releasedHeaderID,
                                orderCompleteDate,
                                endTimeString
                            );
                            if (stopOrderData != undefined) {
                                if (stopOrderData.outputCode == 0) {
                                    this.appComponent
                                        .getEventBus()
                                        .publish(this.appComponent.getId(), "clearOrderContext", {
                                            orderChangePublish: true,
                                        });
                                    sap.oee.ui.Utils.toast(
                                        this.appComponent.oBundle.getText(
                                            "OEE_MESSAGE_ORDER_COMPLETE"
                                        )
                                    );
                                    //TODO: need to clarify the navigation here
                                    //this.bindOrdersToTable();
                                    this.byId("idActiveStatus").setSelected(true);
                                    //this.byId("idAllStatus").setSelected(false);
                                    this.byId("idNewStatus").setSelected(false);
                                    this.byId("idHoldStatus").setSelected(false);
                                    this.byId("idCompletedStatus").setSelected(false);
                                    this.fetchOrdersBasedOnStatus();
                                    //this.filterOrderData();
                                } else {
                                    sap.oee.ui.Utils.createMessage(
                                        stopOrderData.outputMessage,
                                        sap.ui.core.MessageType.Error
                                    );
                                }
                            }
                            //this.byId('idOrdersTable').getBinding("items").filter(new sap.ui.model.Filter("status","EQ",sap.oee.ui.oeeConstants.status.ACTIVE));
                        } catch (e) {
                            sap.oee.ui.Utils.createMessage(
                                e.message,
                                sap.ui.core.MessageType.Error
                            );
                        }
                    } else {
                        sap.oee.ui.Utils.createMessage(
                            this.interfaces.oOEEBundle.getText("OEE_MESSAGE_SHIFT_BOUNDARY"),
                            sap.ui.core.MessageType.Error
                        );
                    }
                } else {
                    sap.oee.ui.Utils.createMessage(
                        this.interfaces.oOEEBundle.getText("OEE_ERR_START_TIME_IN_FUTURE"),
                        sap.ui.core.MessageType.Error
                    );
                }
            },

            bindOrdersToTable: function () {
                var orderOperationJSON;
                // this.byId("idOrdersTable").setBusy(true);
                // this.byId("statusBar").setBusy(true);
                /*var orderOperationJSON = this.interfaces
                                                                                  .interfacesGetReleasedDemandInputForTimePeriodAndPatternAsync(this.appData.plant,this.appData.node.nodeID,this.appData.client,
                                                                                              this.appData.shift.startTimestamp, [ sap.oee.ui.oeeConstants.status.NEW,sap.oee.ui.oeeConstants.status.COMPLETED, sap.oee.ui.oeeConstants.status.HOLD, sap.oee.ui.oeeConstants.status.ACTIVE, sap.oee.ui.oeeConstants.status.ABORTED ],null,this.renderOrderDetails,this.getView().getController());*/
                if (
                    this.appData.filtersForManageOrder.selectedFilterForManageOrders
                        .length > 0
                ) {
                    orderOperationJSON =
                        this.interfaces.interfacesGetReleasedDemandInputForTimePeriodAndPatternAsync(
                            this.appData.plant,
                            this.appData.node.nodeID,
                            this.appData.client,
                            this.appData.shift.startTimestamp,
                            this.appData.shift.endTimestamp,
                            this.appData.filtersForManageOrder.selectedFilterForManageOrders,
                            this.appData.filtersForManageOrder.orderBasedOnCurrentShift,
                            null,
                            this.renderOrderDetails,
                            this.getView().getController()
                        );
                } else {
                    orderOperationJSON =
                        this.interfaces.interfacesGetReleasedDemandInputForTimePeriodAndPatternAsync(
                            this.appData.plant,
                            this.appData.node.nodeID,
                            this.appData.client,
                            this.appData.shift.startTimestamp,
                            this.appData.shift.endTimestamp,
                            [sap.oee.ui.oeeConstants.status.ACTIVE],
                            this.appData.filtersForManageOrder.orderBasedOnCurrentShift,
                            null,
                            this.renderOrderDetails,
                            this.getView().getController()
                        );
                }
            },

            getTableCharacteristic: function (params) {
                var tRunner = new TransactionRunner(
                    "MES/Itelli/FLM/getCharacteristicColumnsQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var oData = tRunner.GetJSONData();

                return oData[0];
            },

            getTableModel: function () {

                this.byId("idOrdersTable").setBusy(true);
                this.byId("idOrdersTable").setBusyIndicatorDelay(0);
                this.byId("statusBar").setBusy(true);
                this.byId("statusBar").setBusyIndicatorDelay(0);

                this.getView().byId("idColumnBaslat").setVisible(true);
                this.getView().byId("idColumnDevam").setVisible(true);
                this.getView().byId("idColumnBeklet").setVisible(true);
                this.getView().byId("idColumnTamamla").setVisible(true);
                this.getView().byId("idColumnTekrarHold").setVisible(true);
                this.getView().byId("idInfo").setVisible(true);

                var NewStatus = this.getView().byId("idNewStatus").getSelected();
                var ActiveStatus = this.getView().byId("idActiveStatus").getSelected();
                var HoldStatus = this.getView().byId("idHoldStatus").getSelected();
                var CompletedStatus = this.getView().byId("idCompletedStatus").getSelected();

                if (NewStatus == true) {
                    this.getView().byId("idColumnDevam").setVisible(false);
                    this.getView().byId("idColumnBeklet").setVisible(false);
                    this.getView().byId("idColumnTamamla").setVisible(false);
                    this.getView().byId("idColumnTekrarHold").setVisible(false);
                    this.getView().byId("idColumnDevamFAKE").setVisible(false);
                    this.getView().byId("idColumnBekletFAKE").setVisible(false);
                    this.getView().byId("idColumnTamamlaFAKE").setVisible(false);
                    this.getView().byId("idColumnTekrarHoldFAKE").setVisible(false);
                    this.getView().byId("idColumnBaslatFAKE").setVisible(true);

                    var status = "NEW";
                }
                else if (ActiveStatus == true) {
                    this.getView().byId("idColumnBaslat").setVisible(false);
                    this.getView().byId("idColumnDevam").setVisible(false);
                    this.getView().byId("idColumnBeklet").setVisible(true);
                    this.getView().byId("idColumnTekrarHold").setVisible(false);
                    this.getView().byId("idColumnBaslatFAKE").setVisible(false);
                    this.getView().byId("idColumnDevamFAKE").setVisible(false);
                    this.getView().byId("idColumnBekletFAKE").setVisible(true);
                    this.getView().byId("idColumnTekrarHoldFAKE").setVisible(false);
                    this.getView().byId("idColumnTamamlaFAKE").setVisible(true);

                    var status = "ACT";
                }
                else if (HoldStatus == true) {
                    this.getView().byId("idColumnBaslat").setVisible(false);
                    this.getView().byId("idColumnBeklet").setVisible(false);
                    this.getView().byId("idColumnTamamla").setVisible(false);
                    this.getView().byId("idColumnTekrarHold").setVisible(false);
                    this.getView().byId("idColumnDevamFAKE").setVisible(true);
                    this.getView().byId("idColumnBaslatFAKE").setVisible(false);
                    this.getView().byId("idColumnBekletFAKE").setVisible(false);
                    this.getView().byId("idColumnTamamlaFAKE").setVisible(false);
                    this.getView().byId("idColumnTekrarHoldFAKE").setVisible(false);

                    var status = "HOLD";
                }
                else if (CompletedStatus == true) {
                    this.getView().byId("idColumnBaslat").setVisible(false);
                    this.getView().byId("idColumnDevam").setVisible(false);
                    this.getView().byId("idColumnBeklet").setVisible(false);
                    this.getView().byId("idColumnTekrarHold").setVisible(false);
                    this.getView().byId("idColumnTamamla").setVisible(false);
                    this.getView().byId("idColumnBaslatFAKE").setVisible(false);
                    this.getView().byId("idColumnDevamFAKE").setVisible(false);
                    this.getView().byId("idColumnBekletFAKE").setVisible(false);
                    this.getView().byId("idColumnTamamlaFAKE").setVisible(false);
                    this.getView().byId("idColumnTekrarHoldFAKE").setVisible(false);


                    var status = "CMPL";
                }

                this.getModelRenderOrderDetails(status);


            },

            getModelRenderOrderDetails: function (status) {


                this.byId("idOrdersTable").setBusy(true);
                this.byId("idOrdersTable").setBusyIndicatorDelay(0);
                this.byId("statusBar").setBusy(true);
                this.byId("statusBar").setBusyIndicatorDelay(0);

                TransactionCaller.async(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_GET_MANAGE_ORDER_MODEL",
                    {
                        I_STATUS: status,
                    },
                    "O_JSON",
                    this.getModel,
                    this,
                    "GET",
                    status

                );


            },

            getModel: function (iv_data, iv_scope, status) {

                var myModel = new sap.ui.model.json.JSONModel();
                if (Array.isArray(iv_data[0].Rowsets?.Rowset?.Row)) {
                    myModel.setData(iv_data[0]);
                } else if (!iv_data[0].Rowsets?.Rowset?.Row) {
                    myModel.setData(null);
                } else {
                    var obj_response = iv_data[0];
                    var dummyData = [];
                    dummyData.push(iv_data[0].Rowsets.Rowset.Row);
                    obj_response.Rowsets.Rowset.Row = dummyData;
                    myModel.setData(obj_response);
                }

                if (status == "NEW") {
                    var newStatusArray = iv_data[0].Rowsets?.Rowset?.Row?.filter((i) => i.STATUS == "NEW");
                    var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);
                }
                else if (status == "ACT") {
                    var newStatusArray = iv_data[0].Rowsets?.Rowset?.Row?.filter((i) => i.STATUS == "ACT");
                    var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);
                }
                else if (status == "HOLD") {
                    var newStatusArray = iv_data[0].Rowsets?.Rowset?.Row?.filter((i) => i.STATUS == "HOLD");
                    var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);
                }
                else if (status == "CMPL") {
                    var newStatusArray = iv_data[0].Rowsets?.Rowset?.Row?.filter((i) => i.STATUS == "CMPL");
                    var myNEWModel = new sap.ui.model.json.JSONModel(newStatusArray);
                }

                //change button css
                for (i = 0; i < myNEWModel.getData().length; i++) {
                    if (myNEWModel.getData()[i].AUFNR !== undefined) {
                        var orderNo = myNEWModel.getData()[i]["AUFNR"];
                        var acilama = myNEWModel.getData()[i]["TDLINE"];
                        if (myNEWModel.getData()[i]["TDLINE"] != null && myNEWModel.getData()[i]["TDLINE"] != "---") {

                            myNEWModel.getData()[i].descriptionBtnColor = "Accept"
                        }
                    }
                }


                iv_scope.byId("idOrdersTable").setBusy(false);
                iv_scope.byId("statusBar").setBusy(false);
                iv_scope.getView().byId("idOrdersTable").setModel(myNEWModel);

                if (status == "NEW") {

                    var row = iv_scope.getView().byId("idOrdersTable")?.getModel()?.oData?.length;

                    if (row != undefined) {
                        var array = iv_scope.getView().byId("idOrdersTable")?.getModel().oData;
                        document.getElementById(iv_scope.getView().byId("idOrdersTable").getItems()[0].sId + "_cell3").classList.add("lightPink");

                        var firstIndex = array.findIndex(item => item.SIRA === 1);

                        var firstCap = iv_scope.getView().byId("idOrdersTable")?.getModel().oData[firstIndex]?.Y_CAP_FLM_MM;
                        for (let i = 1; i <= row; i++) {
                            var indexOfTable = array.findIndex(item => item.SIRA === i);

                            if (firstCap != iv_scope.getView().byId("idOrdersTable")?.getModel().oData[indexOfTable].Y_CAP_FLM_MM) {

                                document.getElementById(iv_scope.getView().byId("idOrdersTable").getItems()[(i - 1)].sId + "_cell3").classList.add("lightPink");


                                var new_cap = iv_scope.getView().byId("idOrdersTable")?.getModel().oData[indexOfTable].Y_CAP_FLM_MM;
                                firstCap = new_cap;
                            }
                        }


                    }
                }


                else {
                    var row = myNEWModel.oData.length;
                    if (row != undefined) {
                        var first = myNEWModel.oData[0]?.Y_CAP_FLM_MM
                        for (let i = 0; i < row; i++) {
                            document.getElementById(iv_scope.getView().byId("idOrdersTable").getItems()[0].sId + "_cell3").classList.add("lightPink");
                            if (first != myNEWModel.oData[i].Y_CAP_FLM_MM) {
                                document.getElementById(iv_scope.getView().byId("idOrdersTable").getItems()[i].sId + "_cell3").classList.add("lightPink");
                                var newCap = myNEWModel.oData[i].Y_CAP_FLM_MM;
                                first = newCap;
                            }
                        }
                    }
                }
            },
            tonajBilgisiInterval: function () {
                var ActiveStatus = this.getView().byId("idActiveStatus").getSelected();

                if (ActiveStatus == true) {
                    var data = this.getView().byId("idOrdersTable")?.getModel()?.getData()[0]
                    if (data != null) {
                        var orderNumber = data.AUFNR;
                        var response = TransactionCaller.sync(
                            "MES/Itelli/EREN/Filmasin/T_SendOrderConfirmationDetails",
                            {
                                I_AUFNR: orderNumber,
                            },

                            "O_JSON"
                        );

                        if (response[1] == "E") {
                            MessageBox.error(response[0]);
                            return;
                        }


                        this.getView().byId("idToolbarAufnr").setText(orderNumber);
                        this.getView().byId("idUretilenTon").setText(response[0].Rowsets?.Rowset?.Row?.URETILEN_TONAJ);
                        this.getView().byId("idKalanTon").setText(response[0].Rowsets?.Rowset?.Row?.KALAN_TONAJ);
                        this.getView().byId("idUretilenPaket").setText(response[0].Rowsets?.Rowset?.Row?.URETILEN_ADET);
                        this.getView().byId("idKalanPaket").setText(response[0].Rowsets?.Rowset?.Row?.KALAN_PAKET);
                    }
                    else {
                        this.getView().byId("idToolbarAufnr").setText("");
                        this.getView().byId("idUretilenTon").setText("");
                        this.getView().byId("idKalanTon").setText("");
                        this.getView().byId("idUretilenPaket").setText("");
                        this.getView().byId("idKalanPaket").setText("");
                    }


                }


            },

            onPressTonajBilgisi: function () {

                var selected = this.getView().byId("idOrdersTable").getSelectedContextPaths()[0];
                if (selected == null) {
                    MessageBox.error("Lütfen satır seçiniz.");
                    return;
                }
                var selectedIndex = this.getView().byId("idOrdersTable").getSelectedContextPaths()[0].split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];
                var orderNumber = oTableData.AUFNR;

                var response = TransactionCaller.sync(
                    "MES/Itelli/EREN/Filmasin/T_SendOrderConfirmationDetails",
                    {
                        I_AUFNR: orderNumber,
                    },

                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {
                    MessageBox.information("İşlem Başarılı");
                }


                this.getView().byId("idToolbarAufnr").setText(orderNumber);
                this.getView().byId("idUretilenTon").setText(response[0].Rowsets?.Rowset?.Row?.URETILEN_TONAJ);
                this.getView().byId("idKalanTon").setText(response[0].Rowsets?.Rowset?.Row?.KALAN_TONAJ);
                this.getView().byId("idUretilenPaket").setText(response[0].Rowsets?.Rowset?.Row?.URETILEN_ADET);
                this.getView().byId("idKalanPaket").setText(response[0].Rowsets?.Rowset?.Row?.KALAN_PAKET);


            },

            onPressSetCurDateSTART: function (oEvent) {
                var daynow = new Date().getDate();
                var monthnow = new Date().getMonth() + 1;
                var fullyearnow = new Date().getFullYear();
                if (monthnow < 10) {
                    monthnow = "0" + monthnow;
                }
                if (daynow < 10) {
                    daynow = "0" + daynow;
                }
                var idStartDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
                sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").setValue(idStartDate);

                var hournow = new Date().getHours();
                var minutesnow = new Date().getMinutes();
                var secondsnow = new Date().getSeconds();

                if (hournow < 10) {
                    hournow = "0" + hournow;
                }
                if (minutesnow < 10) {
                    minutesnow = "0" + minutesnow;
                }
                if (secondsnow < 10) {
                    secondsnow = "0" + secondsnow;
                }
                var idStartSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
                sap.ui.core.Fragment.byId("StartButton", "idStartTimePicker").setValue(idStartSaat);

            },

            onPressSetCurDateResume: function (oEvent) {
                var daynow = new Date().getDate();
                var monthnow = new Date().getMonth() + 1;
                var fullyearnow = new Date().getFullYear();
                if (monthnow < 10) {
                    monthnow = "0" + monthnow;
                }
                if (daynow < 10) {
                    daynow = "0" + daynow;
                }
                var idResumeDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
                sap.ui.core.Fragment.byId("ResumeButton", "idResumeDatePicker").setValue(idResumeDate);

                var hournow = new Date().getHours();
                var minutesnow = new Date().getMinutes();
                var secondsnow = new Date().getSeconds();

                if (hournow < 10) {
                    hournow = "0" + hournow;
                }
                if (minutesnow < 10) {
                    minutesnow = "0" + minutesnow;
                }
                if (secondsnow < 10) {
                    secondsnow = "0" + secondsnow;
                }
                var idResumeSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
                sap.ui.core.Fragment.byId("ResumeButton", "idResumeTimePicker").setValue(idResumeSaat);

            },

            onPressSetCurDateHOLD: function (oEvent) {
                var daynow = new Date().getDate();
                var monthnow = new Date().getMonth() + 1;
                var fullyearnow = new Date().getFullYear();
                if (monthnow < 10) {
                    monthnow = "0" + monthnow;
                }
                if (daynow < 10) {
                    daynow = "0" + daynow;
                }
                var idStartDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
                sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").setValue(idStartDate);

                var hournow = new Date().getHours();
                var minutesnow = new Date().getMinutes();
                var secondsnow = new Date().getSeconds();

                if (hournow < 10) {
                    hournow = "0" + hournow;
                }
                if (minutesnow < 10) {
                    minutesnow = "0" + minutesnow;
                }
                if (secondsnow < 10) {
                    secondsnow = "0" + secondsnow;
                }
                var idStartSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
                sap.ui.core.Fragment.byId("HoldButton", "idBitisTimePicker").setValue(idStartSaat);

            },

            onPressSetCurDateBITIR: function (oEvent) {
                var daynow = new Date().getDate();
                var monthnow = new Date().getMonth() + 1;
                var fullyearnow = new Date().getFullYear();
                if (monthnow < 10) {
                    monthnow = "0" + monthnow;
                }
                if (daynow < 10) {
                    daynow = "0" + daynow;
                }
                var idStartDate = String(fullyearnow) + "-" + String(monthnow) + "-" + String(daynow);
                sap.ui.core.Fragment.byId("BitirButton", "idBitirDatePickerBitis").setValue(idStartDate);

                var hournow = new Date().getHours();
                var minutesnow = new Date().getMinutes();
                var secondsnow = new Date().getSeconds();

                if (hournow < 10) {
                    hournow = "0" + hournow;
                }
                if (minutesnow < 10) {
                    minutesnow = "0" + minutesnow;
                }
                if (secondsnow < 10) {
                    secondsnow = "0" + secondsnow;
                }
                var idStartSaat = String(hournow) + ":" + String(minutesnow) + ":" + String(secondsnow);
                sap.ui.core.Fragment.byId("BitirButton", "idBitisTimePicker").setValue(idStartSaat);

            },

            newStartButton: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];

                this.StartButton(oTableData);

            },

            StartButton: function (oTableData) {
                if (!this._oDialog01) {
                    this._oDialog01 = sap.ui.xmlfragment(
                        "StartButton",
                        "customActivity.fragmentView.StartButtonFragment",
                        this
                    );
                    this.getView().addDependent(this._oDialog01);
                }
                this._oDialog01.open();

                sap.ui.core.Fragment.byId("StartButton", "idStartDialog").setModel(oTableData);


            },

            StartButtonOK: function (oEvent) {
                var aufnr = "0000" + sap.ui.core.Fragment.byId("StartButton", "idStartDialog").getModel().AUFNR;
                var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("StartButton", "idStartDialog").getModel().AUFNR);
                var operationNumber = "0010"
                var nodeid = this.appData.node.nodeID;
                var targetStatus = "ACT";
                var crewSize = "1";

                var idStartYıl = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getFullYear(); //2021
                var idStartAy = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getMonth() + 1; //ay
                if (idStartAy < 10) {
                    idStartAy = "0" + idStartAy;
                }
                var idStartGün = sap.ui.core.Fragment.byId("StartButton", "idStartDatePicker").getDateValue().getDate(); //gün
                if (idStartGün < 10) {
                    idStartGün = "0" + idStartGün;
                }
                var idStartDate = String(idStartYıl) + "-" + String(idStartAy) + "-" + String(idStartGün);
                var idExecStartTime = sap.ui.core.Fragment.byId("StartButton", "idStartTimePicker").getValue();
                var StartTime = String(idStartDate) + "T" + String(idExecStartTime);

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        I_ORDER_NUMBER: orderNumber,
                        I_OPERATION_NUMBER: operationNumber,
                        I_NODEID: nodeid,
                        I_TARGET_STATUS: targetStatus,
                        I_CREWSIZE: crewSize,
                        I_StartTime: StartTime,
                        I_AUFNR: aufnr,
                        I_ACTIVE: "E0002"
                    },
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {


                    MessageBox.information("İşlem Başarılı");


                }
                var status = "NEW";
                this.getModelRenderOrderDetails(status);
                this.onCancelFrag01();

            },

            onCancelFrag01: function () {
                this._oDialog01.close();
            },

            newResumeButton: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];

                this.ResumeButton(oTableData);

            },

            ResumeButton: function (oTableData) {
                if (!this._oDialog04) {
                    this._oDialog04 = sap.ui.xmlfragment(
                        "ResumeButton",
                        "customActivity.fragmentView.ResumeButtonFragment",
                        this
                    );
                    this.getView().addDependent(this._oDialog04);
                }
                this._oDialog04.open();

                sap.ui.core.Fragment.byId("ResumeButton", "idResumeDialog").setModel(oTableData);


            },

            ResumeButtonOK: function (oEvent) {
                var aufnr = "0000" + sap.ui.core.Fragment.byId("ResumeButton", "idResumeDialog").getModel().AUFNR;
                var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("ResumeButton", "idResumeDialog").getModel().AUFNR);
                var operationNumber = "0010"
                var nodeid = this.appData.node.nodeID;
                var targetStatus = "RESUME";
                var crewSize = "1";

                var idResumeYıl = sap.ui.core.Fragment.byId("ResumeButton", "idResumeDatePicker").getDateValue().getFullYear(); //2021
                var idResumeAy = sap.ui.core.Fragment.byId("ResumeButton", "idResumeDatePicker").getDateValue().getMonth() + 1; //ay
                if (idResumeAy < 10) {
                    idResumeAy = "0" + idResumeAy;
                }
                var idResumeGün = sap.ui.core.Fragment.byId("ResumeButton", "idResumeDatePicker").getDateValue().getDate(); //gün
                if (idResumeGün < 10) {
                    idResumeGün = "0" + idResumeGün;
                }
                var idResumeDate = String(idResumeYıl) + "-" + String(idResumeAy) + "-" + String(idResumeGün);
                var idExecResumeTime = sap.ui.core.Fragment.byId("ResumeButton", "idResumeTimePicker").getValue();
                var ResumeTime = String(idResumeDate) + "T" + String(idExecResumeTime);

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        I_ORDER_NUMBER: orderNumber,
                        I_OPERATION_NUMBER: operationNumber,
                        I_NODEID: nodeid,
                        I_TARGET_STATUS: targetStatus,
                        I_CREWSIZE: crewSize,
                        I_StartTime: ResumeTime,
                        I_AUFNR: aufnr,
                        I_ACTIVE: "E0002"
                    },
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {


                    MessageBox.information("İşlem Başarılı");


                }

                var status = "HOLD";
                this.getModelRenderOrderDetails(status);
                this.onCancelFrag04();

            },

            onCancelFrag04: function () {
                this._oDialog04.close();
            },

            newHoldButton: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];
                var aufnr = oTableData.AUFNR;

                var responseZ = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/insideFurnaceControl",

                    {
                        I_AUFNR: aufnr

                    },
                    "O_JSON"
                );

                if (responseZ[1] == "E") {
                    MessageBox.error(responseZ[0]);
                    return;
                }



                this.HoldButton(oTableData);

            },

            HoldButton: function (oTableData) {
                if (!this._oDialog02) {
                    this._oDialog02 = sap.ui.xmlfragment(
                        "HoldButton",
                        "customActivity.fragmentView.HoldButtonFragment",

                        this
                    );
                    this.getView().addDependent(this._oDialog02);
                }
                this._oDialog02.open();

                sap.ui.core.Fragment.byId("HoldButton", "idHoldDialog").setModel(oTableData);

            },

            HoldButtonOK: function (oEvent) {
                var aufnr = "0000" + sap.ui.core.Fragment.byId("HoldButton", "idHoldDialog").getModel().AUFNR;
                var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("HoldButton", "idHoldDialog").getModel().AUFNR);
                var operationNumber = "0010"
                var nodeid = this.appData.node.nodeID;
                var targetStatus = "HOLD";
                var crewSize = "1";

                var idHoldYıl = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getFullYear();
                var idHoldAy = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getMonth() + 1; //ay
                if (idHoldAy < 10) {
                    idHoldAy = "0" + idHoldAy;
                }
                var idHoldGün = sap.ui.core.Fragment.byId("HoldButton", "idHoldDatePickerBitis").getDateValue().getDate(); //gün
                if (idHoldGün < 10) {
                    idHoldGün = "0" + idHoldGün;
                }
                var idHoldDate = String(idHoldYıl) + "-" + String(idHoldAy) + "-" + String(idHoldGün);
                var idExecHoldTime = sap.ui.core.Fragment.byId("HoldButton", "idBitisTimePicker").getValue();
                var HoldTime = String(idHoldDate) + "T" + String(idExecHoldTime);

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        I_ORDER_NUMBER: orderNumber,
                        I_OPERATION_NUMBER: operationNumber,
                        I_NODEID: nodeid,
                        I_TARGET_STATUS: targetStatus,
                        I_CREWSIZE: crewSize,
                        I_ENDTIME: HoldTime,
                        I_AUFNR: aufnr,
                        I_ACTIVE: "E0003"
                    },
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {


                    MessageBox.information("İşlem Başarılı");


                }

                var status = "ACT";
                this.getModelRenderOrderDetails(status);
                this.onCancelFrag02();

            },

            onCancelFrag02: function () {
                this._oDialog02.close();
            },

            newBitirButton: function (oEvent) {

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/insideFurnaceControl",

                    {

                    },
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];

                this.BitirButton(oTableData);

            },

            BitirButton: function (oTableData) {
                if (!this._oDialog03) {
                    this._oDialog03 = sap.ui.xmlfragment(
                        "BitirButton",
                        "customActivity.fragmentView.BitirButtonFragment",
                        this
                    );
                    this.getView().addDependent(this._oDialog03);
                }
                this._oDialog03.open();

                sap.ui.core.Fragment.byId("BitirButton", "idBitirDialog").setModel(oTableData);
            },

            BitirButtonOK: function (oEvent) {
                var aufnr = "0000" + sap.ui.core.Fragment.byId("BitirButton", "idBitirDialog").getModel().AUFNR;
                var orderNumber = "0000" + String(sap.ui.core.Fragment.byId("BitirButton", "idBitirDialog").getModel().AUFNR);
                var operationNumber = "0010"
                var nodeid = this.appData.node.nodeID;
                var targetStatus = "CMPL";
                var crewSize = "1";

                var idBitirYıl = sap.ui.core.Fragment.byId("BitirButton", "idBitirDatePickerBitis").getDateValue().getFullYear();
                var idBitirAy = sap.ui.core.Fragment.byId("BitirButton", "idBitirDatePickerBitis").getDateValue().getMonth() + 1; //ay
                if (idBitirAy < 10) {
                    idBitirAy = "0" + idBitirAy;
                }
                var idBitirGün = sap.ui.core.Fragment.byId("BitirButton", "idBitirDatePickerBitis").getDateValue().getDate(); //gün
                if (idBitirGün < 10) {
                    idBitirGün = "0" + idBitirGün;
                }
                var idBitirDate = String(idBitirYıl) + "-" + String(idBitirAy) + "-" + String(idBitirGün);
                var idExecBitirTime = sap.ui.core.Fragment.byId("BitirButton", "idBitisTimePicker").getValue();
                var BitirTime = String(idBitirDate) + "T" + String(idExecBitirTime);

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        I_ORDER_NUMBER: orderNumber,
                        I_OPERATION_NUMBER: operationNumber,
                        I_NODEID: nodeid,
                        I_TARGET_STATUS: targetStatus,
                        I_CREWSIZE: crewSize,
                        I_ENDTIME: BitirTime,
                        I_AUFNR: aufnr,
                        I_ACTIVE: "E0004"
                    },
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {


                    MessageBox.information("İşlem Başarılı");


                }

                var status = "ACT";
                this.getModelRenderOrderDetails(status);
                this.onCancelFrag03();

            },

            newTekrarHoldAlma: function (oEvent) {

                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];
                var aufnr = oTableData.AUFNR;
                var orderNumber = "0000" + oTableData.AUFNR;
                var client = this.appData.client;
                var plant = this.appData.plant;
                var nodeid = this.appData.node.nodeID;

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/T_START_ORDER_FLM",
                    {
                        client: client,
                        plant: plant,
                        I_NODEID: nodeid,
                        I_ORDER_NUMBER: orderNumber,
                        I_AUFNR: aufnr,
                        I_ACTIVE: "E0003"
                    },
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {


                    MessageBox.information("İşlem Başarılı");


                }

                var status = "CMPL";
                this.getModelRenderOrderDetails(status);


            },



            onCancelFrag03: function () {
                this._oDialog03.close();
            },

            onPressOpenInfo: function (oEvent) {
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
                this.getOrderInfos(oEvent);
            },

            getOrderInfos: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];
                var aufnr = oTableData.AUFNR;
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

            // tdLineHasDataForGivenOrderNo: function (orderNo) {
            //     //fetch tdLine for given orderNo B.E
            //     var buttonSettings = {
            //         descriptionBtnVisible: true,
            //         descriptionBtnColor: "Transparent",
            //     };
            //     var werks = this.appData.plant;
            //     var aufnr = orderNo;
            //     var params = {
            //         "Param.1": werks,
            //         "Param.2": aufnr,
            //     };
            //     var tRunner = new TransactionRunner(
            //         "MES/UI/CreateCast/getInformationCharacteristicQry",
            //         params
            //     );
            //     if (!tRunner.Execute()) {
            //         MessageBox.error(tRunner.GetErrorMessage());
            //         return null;
            //     }
            //     var oData = tRunner.GetJSONData();
            //     if (oData[0].Row !== undefined) {
            //         if (
            //             oData[0].Row[0].TDLINE !== "" ||
            //             oData[0].Row[0].TDFORMAT !== ""
            //         ) {
            //             // buttonSettings.descriptionBtnVisible = true;
            //             buttonSettings.descriptionBtnColor = "Accept";
            //         }
            //     }
            //     return buttonSettings;
            // },

            setOrderOperationData: function (
                orderOperationData,
                orderData,
                operationData
            ) {
                orderOperationData.action1Visible = false;
                orderOperationData.action2Visible = false;
                orderOperationData.action3Visible = false;
                orderOperationData.action3Enabled = true;

                orderOperationData.action1Enabled = true;
                orderOperationData.action2Enabled = true;
                //orderOperationData.rowIndex = j;

                orderOperationData.order = orderData.order;
                orderOperationData.orderNo = sap.oee.ui.Formatter.formatOrderNo(
                    orderData.order
                );
                orderOperationData.material = orderData.material;
                orderOperationData.releasedHeaderID = orderData.releasedHeaderID;
                orderOperationData.plannedStartDate = orderData.scheduledStartDate;
                orderOperationData.plannedStartTime = orderData.scheduledStartTime;
                orderOperationData.plannedFinishDate = orderData.scheduledFinishDate;
                orderOperationData.plannedFinishTime = orderData.scheduledFinishTime;
                orderOperationData.materialDescription =
                    orderData.materialHeader.materialDescription;
                orderOperationData.startDate = operationData.startDate;
                orderOperationData.startTime = operationData.startTime;
                orderOperationData.endDate = operationData.endDate;
                orderOperationData.endTime = operationData.endTime;

                if (
                    operationData.routingOperNo != undefined &&
                    operationData.routingOperNo != ""
                ) {
                    orderOperationData.routingOperNo = operationData.routingOperNo;
                    orderOperationData.operationDesc = operationData.operationDesc;
                }
                if (
                    operationData.parentOperationNo != undefined &&
                    operationData.parentOperationNo != ""
                ) {
                    orderOperationData.parentOperNo = operationData.parentOperationNo;
                    orderOperationData.parentOperationDesc =
                        operationData.parentOperationDesc;
                }
                orderOperationData.releasedID = operationData.releasedID;
                orderOperationData.productionMode = operationData.productionMode;
                if (this.appData.defaultUom != null) {
                    if (
                        this.appData.defaultUom.value ==
                        sap.oee.ui.oeeConstants.uomType.productionUom
                    ) {
                        orderOperationData.quantityReleased =
                            operationData.quantityReleasedInProductionUom;
                        orderOperationData.quantityReleasedUOM =
                            operationData.quantityReleasedProductionUOM;
                    } else {
                        orderOperationData.quantityReleased =
                            operationData.quantityReleased;
                        orderOperationData.quantityReleasedUOM =
                            operationData.quantityReleasedUOM;
                    }
                } else {
                    orderOperationData.quantityReleased = operationData.quantityReleased;
                    orderOperationData.quantityReleasedUOM =
                        operationData.quantityReleasedUOM;
                }

                orderOperationData.status = operationData.releaseDemandStatus;
                orderOperationData.numberOfCapacities =
                    operationData.numberOfCapacities;
                orderOperationData.statusDesc = this.statusFormatter(
                    orderOperationData.status
                );
                orderOperationData.runID = operationData.runID;
                orderOperationData.detailsVisible = true;
                if (
                    operationData.releaseDemandStatus ==
                    sap.oee.ui.oeeConstants.status.NEW
                ) {
                    orderOperationData.action1Label =
                        this.interfaces.oOEEBundle.getText("OEE_BTN_START");
                    orderOperationData.action1Visible = true;
                    orderOperationData.targetAction1 =
                        sap.oee.ui.oeeConstants.orderTargetActions.START;
                    orderOperationData.action1Icon = "sap-icon://fob-watch";
                    orderOperationData.detailsVisible = false;
                }
                if (
                    operationData.releaseDemandStatus ==
                    sap.oee.ui.oeeConstants.status.HOLD
                ) {
                    orderOperationData.startDate = operationData.startDate;
                    orderOperationData.startTime = operationData.startTime;
                    orderOperationData.action1Label =
                        this.interfaces.oOEEBundle.getText("OEE_BTN_RESUME");
                    //orderOperationData.action2Label = this.interfaces.oOEEBundle.getText("OEE_BTN_COMPLETE");

                    orderOperationData.action1Visible = true;
                    //orderOperationData.action2Visible = true;

                    if (
                        this.prodActivityList != undefined &&
                        this.prodActivityList.length > 0
                    ) {
                        orderOperationData.action3Visible = true;
                        //this.byId("productionActivityColumn").setVisible(true);
                    }
                    if (
                        operationData.productionActivity != undefined &&
                        operationData.productionActivity != ""
                    ) {
                        orderOperationData.action3Label =
                            this.productionActivitiesFormatter(
                                operationData.productionActivity
                            );
                        orderOperationData.productionActivity =
                            operationData.productionActivity;
                    } else {
                        orderOperationData.productionActivity =
                            this.interfaces.oOEEBundle.getText("OEE_BTN_ASSIGN");
                        orderOperationData.action3Label =
                            this.interfaces.oOEEBundle.getText("OEE_BTN_ASSIGN");
                    }
                    orderOperationData.targetAction1 =
                        sap.oee.ui.oeeConstants.orderTargetActions.RESUME;
                    //orderOperationData.targetAction2 = "COMPLETE";
                    orderOperationData.targetAction3 =
                        sap.oee.ui.oeeConstants.orderTargetActions.ACTIVITY;
                    orderOperationData.action1Icon = "sap-icon://media-play";
                    orderOperationData.action2Icon = "sap-icon://flag";
                    orderOperationData.action3Icon = "sap-icon://activity-2";
                    orderOperationData.action3Enabled = false;
                }
                if (
                    operationData.releaseDemandStatus ==
                    sap.oee.ui.oeeConstants.status.ACTIVE
                ) {
                    orderOperationData.startDate = operationData.startDate;
                    orderOperationData.startTime = operationData.startTime;
                    orderOperationData.action1Label =
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");
                    orderOperationData.action2Label =
                        this.interfaces.oOEEBundle.getText("OEE_BTN_COMPLETE");

                    orderOperationData.startTime = operationData.startTime;
                    orderOperationData.action1Visible = true;
                    orderOperationData.action2Visible = true;
                    if (
                        this.prodActivityList != undefined &&
                        this.prodActivityList.length > 0
                    ) {
                        orderOperationData.action3Visible = true;
                        //this.byId("productionActivityColumn").setVisible(true);
                    }
                    if (
                        operationData.productionActivity != undefined &&
                        operationData.productionActivity != ""
                    ) {
                        orderOperationData.action3Label =
                            this.productionActivitiesFormatter(
                                operationData.productionActivity
                            );
                        orderOperationData.productionActivity =
                            operationData.productionActivity;
                    } else {
                        orderOperationData.productionActivity =
                            this.interfaces.oOEEBundle.getText("OEE_BTN_ASSIGN");
                        orderOperationData.action3Label =
                            this.interfaces.oOEEBundle.getText("OEE_BTN_ASSIGN");
                    }

                    orderOperationData.targetAction1 =
                        sap.oee.ui.oeeConstants.status.HOLD;
                    orderOperationData.targetAction2 =
                        sap.oee.ui.oeeConstants.orderTargetActions.COMPLETE;
                    orderOperationData.targetAction3 =
                        sap.oee.ui.oeeConstants.orderTargetActions.ACTIVITY;
                    orderOperationData.action1Icon = "sap-icon://media-pause";
                    orderOperationData.action2Icon = "sap-icon://flag";
                    orderOperationData.action3Icon = "sap-icon://activity-2";

                    // If run is active in selected shift, then only allow order to be completed or put on hold
                    var enableActionButtons =
                        this.hasActiveRunInSelectedShift(operationData);
                    orderOperationData.action1Enabled = enableActionButtons;
                    orderOperationData.action2Enabled = enableActionButtons;
                    orderOperationData.action3Enabled = enableActionButtons;
                }
                if (
                    operationData.releaseDemandStatus ==
                    sap.oee.ui.oeeConstants.status.ABORTED
                ) {
                    orderOperationData.startDate = operationData.startDate;
                    orderOperationData.startTime = operationData.startTime;
                    orderOperationData.action1Label =
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD");
                    orderOperationData.action2Label =
                        this.interfaces.oOEEBundle.getText("OEE_BTN_COMPLETE");

                    orderOperationData.startTime = operationData.startTime;
                    orderOperationData.action1Visible = true;
                    orderOperationData.action2Visible = true;
                    if (
                        this.prodActivityList != undefined &&
                        this.prodActivityList.length > 0
                    ) {
                        orderOperationData.action3Visible = true;
                        //this.byId("productionActivityColumn").setVisible(true);
                    }
                    if (
                        operationData.productionActivity != undefined &&
                        operationData.productionActivity != ""
                    ) {
                        orderOperationData.action3Label =
                            this.productionActivitiesFormatter(
                                operationData.productionActivity
                            );
                        orderOperationData.productionActivity =
                            operationData.productionActivity;
                    } else {
                        orderOperationData.productionActivity =
                            this.interfaces.oOEEBundle.getText("OEE_BTN_ASSIGN");
                        orderOperationData.action3Label =
                            this.interfaces.oOEEBundle.getText("OEE_BTN_ASSIGN");
                    }

                    orderOperationData.targetAction1 =
                        sap.oee.ui.oeeConstants.status.HOLD;
                    orderOperationData.targetAction2 =
                        sap.oee.ui.oeeConstants.orderTargetActions.COMPLETE;
                    orderOperationData.targetAction3 =
                        sap.oee.ui.oeeConstants.orderTargetActions.ACTIVITY;
                    orderOperationData.action1Icon = "sap-icon://media-pause";
                    orderOperationData.action2Icon = "sap-icon://flag";
                    orderOperationData.action3Icon = "sap-icon://activity-2";
                    orderOperationData.action3Enabled = false;
                }
                if (operationData.crewSize !== "") {
                    orderOperationData.crewSize = operationData.crewSize;
                }

                orderOperationData.defaultUomText =
                    this.interfaces.interfacesGetTextForUOM(
                        orderOperationData.quantityReleasedUOM
                    ); // amit
                //orderOperationData.salesOrderNumber = operationData.salesOrderNumber;
                (orderOperationData.salesOrderNumber = orderData.salesOrderNumber), //30.12.2020
                    this.orderDetails.push(orderOperationData);
            },

            hasActiveRunInSelectedShift: function (operationData) {
                return (
                    operationData.reportingShiftEndTimestamp ==
                    this.appData.shift.endTimestamp &&
                    operationData.reportingShiftStartTimestamp ==
                    this.appData.shift.startTimestamp
                );
            },

            action1: function (oEvent) {
                var event = {};
                event.getSource = oEvent.getSource();
                var selectedRowContext = oEvent.getSource().getBindingContext();
                this.selectedOrder.status = this.orderOperationJSONModel.getProperty(
                    "status",
                    selectedRowContext
                );
                this.selectedOrder.orderNumber =
                    this.orderOperationJSONModel.getProperty("order", selectedRowContext);

                var chosenCastID = this.orderOperationJSONModel.getProperty(
                    "castingNumber",
                    selectedRowContext
                );

                var nodeID = this.appData.node.nodeID;
                var plant = this.appData.plant;

                if (this.selectedOrder.status == "NEW") {
                    var workcenterName = this.appData.node.description;

                    if (
                        workcenterName == "Ark Ocağı" ||
                        workcenterName == "Pota Ocağı" ||
                        workcenterName == "Sürekli Döküm"
                    ) {
                        var params = {
                            I_PLANT: plant,
                            I_CASTID: chosenCastID,
                            I_NODEID: nodeID,
                            I_WORKCENTERNAME: workcenterName,
                            I_AUFNR: this.selectedOrder.orderNumber,
                        };

                        var tRunner = new TransactionRunner(
                            "MES/UI/selectOrder/controlCastID/controlCastIDXquery",
                            params
                        );
                        if (!tRunner.Execute()) {
                            MessageBox.error(tRunner.GetErrorMessage());
                            return null;
                        }
                        var jsData = tRunner.GetJSONData();
                        var row = jsData[0].Row[0];
                        if (row.STATUS == "FAILED") {
                            if (row.TYPE == "error") {
                                sap.m.MessageBox.error(row.MESSAGE);
                                return;
                            } else if (row.TYPE == "warning") {
                                sap.m.MessageBox.warning(row.MESSAGE, {
                                    actions: [
                                        sap.m.MessageBox.Action.YES,
                                        sap.m.MessageBox.Action.NO,
                                    ],
                                    onClose: function (oAction) {
                                        if (oAction == "YES") {
                                            this.callAction1(event);
                                        } else {
                                            return;
                                        }
                                    }.bind(this),
                                });
                            }
                        } else this.callAction1(event);
                    } else this.callAction1(event);
                } else this.callAction1(event);
            },

            callAction1: function (oEvent) {
                var selectedRowContext = oEvent.getSource.getBindingContext();
                this.selectedOrder.status = this.orderOperationJSONModel.getProperty(
                    "status",
                    selectedRowContext
                );
                this.selectedOrder.orderNumber =
                    this.orderOperationJSONModel.getProperty("order", selectedRowContext);

                var chosenCastID = this.orderOperationJSONModel.getProperty(
                    "castingNumber",
                    selectedRowContext
                );

                var nodeID = this.appData.node.nodeID;
                var plant = this.appData.plant;

                var objek =
                    this.getView().getModel("visibleStatusModel").oData[0].OBJEK;

                if (objek == "2001HHYOL1" || objek == "2001HHYOL2") {
                    var params = {
                        "Param.1": this.selectedOrder.orderNumber,
                    };

                    var tRunner = new TransactionRunner(
                        "MES/UI/selectOrder/controlCharacteristic/controlCharacteristicXquery",
                        params
                    );
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return null;
                    }
                }

                //2001SDM ve 3001SDM iş yerleri için yapılmıştır.
                if (this.selectedOrder.status == "NEW") {
                    var description = this.appData.node.description;
                    if (description == "Sürekli Döküm") {
                        if (this.checkFragmentChrac(this.selectedOrder.orderNumber)) {
                            sap.m.MessageBox.alert(
                                this.interfaces.oOEEBundle.getText(
                                    "OEE_LABEL_PLEASE_ROAD_ENTRY"
                                )
                            );
                            return;
                        }
                    }
                }

                this.selectedOrder.material = this.orderOperationJSONModel.getProperty(
                    "material",
                    selectedRowContext
                );
                this.selectedOrder.releasedHeaderID =
                    this.orderOperationJSONModel.getProperty(
                        "releasedHeaderID",
                        selectedRowContext
                    );
                this.selectedOrder.releasedID =
                    this.orderOperationJSONModel.getProperty(
                        "releasedID",
                        selectedRowContext
                    );
                this.selectedOrder.productionMode =
                    this.orderOperationJSONModel.getProperty(
                        "productionMode",
                        selectedRowContext
                    );
                this.selectedOrder.startDate = this.orderOperationJSONModel.getProperty(
                    "startDate",
                    selectedRowContext
                );
                this.selectedOrder.quantityReleased =
                    this.orderOperationJSONModel.getProperty(
                        "quantityReleased",
                        selectedRowContext
                    );
                this.selectedOrder.quantityReleasedUOM =
                    this.orderOperationJSONModel.getProperty(
                        "quantityReleasedUOM",
                        selectedRowContext
                    );
                this.selectedOrder.runID = this.orderOperationJSONModel.getProperty(
                    "runID",
                    selectedRowContext
                );
                this.selectedOrder.productionActivity =
                    this.orderOperationJSONModel.getProperty(
                        "productionActivity",
                        selectedRowContext
                    );
                this.selectedOrder.numberOfCapacities =
                    this.orderOperationJSONModel.getProperty(
                        "numberOfCapacities",
                        selectedRowContext
                    );

                if (selectedRowContext.getObject().crewSize) {
                    this.selectedOrder.crewSize = oEvent.getSource
                        .getBindingContext()
                        .getObject().crewSize;
                }

                this.customData = oEvent.getSource.getCustomData()[0];
                if (this.selectedOrder.status === sap.oee.ui.oeeConstants.status.NEW) {
                    this.onClickStart(true);
                }

                if (
                    this.selectedOrder.status === sap.oee.ui.oeeConstants.status.ACTIVE
                ) {
                    this.openEnterTimeDialog(
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD_TIME")
                    );
                }

                if (this.selectedOrder.status === sap.oee.ui.oeeConstants.status.HOLD) {
                    this.onResumeOrder(true);
                }

                if (
                    this.selectedOrder.status === sap.oee.ui.oeeConstants.status.ABORTED
                ) {
                    this.openEnterTimeDialog(
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_HOLD_TIME")
                    );
                }
            },

            action2: function (oEvent) {
                var selectedRowContext = oEvent.getSource().getBindingContext();

                this.selectedOrder.status = this.orderOperationJSONModel.getProperty(
                    "status",
                    selectedRowContext
                );
                this.selectedOrder.orderNumber =
                    this.orderOperationJSONModel.getProperty("order", selectedRowContext);
                this.selectedOrder.material = this.orderOperationJSONModel.getProperty(
                    "material",
                    selectedRowContext
                );
                this.selectedOrder.releasedHeaderID =
                    this.orderOperationJSONModel.getProperty(
                        "releasedHeaderID",
                        selectedRowContext
                    );
                this.selectedOrder.releasedID =
                    this.orderOperationJSONModel.getProperty(
                        "releasedID",
                        selectedRowContext
                    );
                this.selectedOrder.productionMode =
                    this.orderOperationJSONModel.getProperty(
                        "productionMode",
                        selectedRowContext
                    );
                this.selectedOrder.startDate = this.orderOperationJSONModel.getProperty(
                    "startDate",
                    selectedRowContext
                );
                this.selectedOrder.quantityReleased =
                    this.orderOperationJSONModel.getProperty(
                        "quantityReleased",
                        selectedRowContext
                    );
                this.selectedOrder.quantityReleasedUOM =
                    this.orderOperationJSONModel.getProperty(
                        "quantityReleasedUOM",
                        selectedRowContext
                    );
                this.selectedOrder.runID = this.orderOperationJSONModel.getProperty(
                    "runID",
                    selectedRowContext
                );
                this.selectedOrder.productionActivity =
                    this.orderOperationJSONModel.getProperty(
                        "productionActivity",
                        selectedRowContext
                    );
                this.customData = oEvent.getSource().getCustomData()[0];
                if (
                    this.selectedOrder.status ===
                    sap.oee.ui.oeeConstants.orderTargetActions.RESUME ||
                    this.selectedOrder.status === sap.oee.ui.oeeConstants.status.HOLD ||
                    this.selectedOrder.status === sap.oee.ui.oeeConstants.status.ACTIVE ||
                    this.selectedOrder.status === sap.oee.ui.oeeConstants.status.ABORTED
                ) {
                    this.openEnterTimeDialog(
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_END_TIME")
                    );
                }
            },
            action3: function (oEvent) {
                var selectedRowContext = oEvent.getSource().getBindingContext();

                this.selectedOrder.status = this.orderOperationJSONModel.getProperty(
                    "status",
                    selectedRowContext
                );
                this.selectedOrder.orderNumber =
                    this.orderOperationJSONModel.getProperty("order", selectedRowContext);
                this.selectedOrder.material = this.orderOperationJSONModel.getProperty(
                    "material",
                    selectedRowContext
                );
                this.selectedOrder.releasedHeaderID =
                    this.orderOperationJSONModel.getProperty(
                        "releasedHeaderID",
                        selectedRowContext
                    );
                this.selectedOrder.releasedID =
                    this.orderOperationJSONModel.getProperty(
                        "releasedID",
                        selectedRowContext
                    );
                this.selectedOrder.productionMode =
                    this.orderOperationJSONModel.getProperty(
                        "productionMode",
                        selectedRowContext
                    );
                this.selectedOrder.startDate = this.orderOperationJSONModel.getProperty(
                    "startDate",
                    selectedRowContext
                );
                this.selectedOrder.quantityReleased =
                    this.orderOperationJSONModel.getProperty(
                        "quantityReleased",
                        selectedRowContext
                    );
                this.selectedOrder.quantityReleasedUOM =
                    this.orderOperationJSONModel.getProperty(
                        "quantityReleasedUOM",
                        selectedRowContext
                    );
                this.selectedOrder.runID = this.orderOperationJSONModel.getProperty(
                    "runID",
                    selectedRowContext
                );
                this.selectedOrder.productionActivity =
                    this.orderOperationJSONModel.getProperty(
                        "productionActivity",
                        selectedRowContext
                    );
                this.customData = oEvent.getSource().getCustomData()[0];
                this.onClickStart(false);
            },

            filterOrderBasedOnStatus: function (oEvent) {
                this.filterOrderData();
            },

            fetchOrdersBasedOnStatus: function (oEvent) {
                var newCheckBox = this.byId("idNewStatus").getSelected();
                var activeCheckBox = this.byId("idActiveStatus").getSelected();
                var holdCheckBox = this.byId("idHoldStatus").getSelected();
                var completedCheckBox = this.byId("idCompletedStatus").getSelected();
                var abortedCheckBox = this.byId("idAbortedStatus").getSelected();
                var shiftCheckBox = this.byId("idShiftCheckbox").getSelected();

                var oFilter = [];
                this.appData.filtersForManageOrder.selectedFilterForManageOrders = [];
                this.appData.filtersForManageOrder.orderBasedOnCurrentShift = false;

                if (newCheckBox) {
                    oFilter.push(sap.oee.ui.oeeConstants.status.NEW);
                    this.appData.filtersForManageOrder.selectedFilterForManageOrders.push(
                        sap.oee.ui.oeeConstants.status.NEW
                    );
                }

                if (activeCheckBox) {
                    oFilter.push(sap.oee.ui.oeeConstants.status.ACTIVE);
                    this.appData.filtersForManageOrder.selectedFilterForManageOrders.push(
                        sap.oee.ui.oeeConstants.status.ACTIVE
                    );
                }

                if (holdCheckBox) {
                    oFilter.push(sap.oee.ui.oeeConstants.status.HOLD);
                    this.appData.filtersForManageOrder.selectedFilterForManageOrders.push(
                        sap.oee.ui.oeeConstants.status.HOLD
                    );
                }

                if (completedCheckBox) {
                    oFilter.push(sap.oee.ui.oeeConstants.status.COMPLETED);
                    this.appData.filtersForManageOrder.selectedFilterForManageOrders.push(
                        sap.oee.ui.oeeConstants.status.COMPLETED
                    );
                }

                if (abortedCheckBox) {
                    oFilter.push(sap.oee.ui.oeeConstants.status.ABORTED);
                    this.appData.filtersForManageOrder.selectedFilterForManageOrders.push(
                        sap.oee.ui.oeeConstants.status.ABORTED
                    );
                }
                // this.byId("idOrdersTable").setBusy(true);
                // this.byId("statusBar").setBusy(true);
                // //          var prnt = oEvent.getSource().getParent();
                // //          prnt.setBusy(true);
                //          setTimeout(function () {
                //            prnt.setBusy(false);
                //          }, 3000);

                if (shiftCheckBox) {
                    this.appData.filtersForManageOrder.orderBasedOnCurrentShift = true;
                }

                if (oFilter.length > 0) {
                    this.interfaces.interfacesGetReleasedDemandInputForTimePeriodAndPatternAsync(
                        this.appData.plant,
                        this.appData.node.nodeID,
                        this.appData.client,
                        this.appData.shift.startTimestamp,
                        this.appData.shift.endTimestamp,
                        oFilter,
                        this.appData.filtersForManageOrder.orderBasedOnCurrentShift,
                        null,
                        this.renderOrderDetails,
                        this.getView().getController()
                    );
                } else {
                    this.interfaces.interfacesGetReleasedDemandInputForTimePeriodAndPatternAsync(
                        this.appData.plant,
                        this.appData.node.nodeID,
                        this.appData.client,
                        this.appData.shift.startTimestamp,
                        this.appData.shift.endTimestamp,
                        [
                            sap.oee.ui.oeeConstants.status.NEW,
                            sap.oee.ui.oeeConstants.status.COMPLETED,
                            sap.oee.ui.oeeConstants.status.HOLD,
                            sap.oee.ui.oeeConstants.status.ACTIVE,
                            sap.oee.ui.oeeConstants.status.ABORTED,
                        ],
                        this.appData.filtersForManageOrder.orderBasedOnCurrentShift,
                        null,
                        this.renderOrderDetails,
                        this.getView().getController()
                    );
                }
            },

            filterOrderData: function () {
                //var allCheckBox = this.byId("idAllStatus").getSelected();
                var newCheckBox = this.byId("idNewStatus").getSelected();
                var activeCheckBox = this.byId("idActiveStatus").getSelected();
                var holdCheckBox = this.byId("idHoldStatus").getSelected();
                var completedCheckBox = this.byId("idCompletedStatus").getSelected();
                var abortedCheckBox = this.byId("idAbortedStatus").getSelected();
                /*if(newCheckBox || activeCheckBox || holdCheckBox || completedCheckBox ){
                                                                              allCheckBox = false;
                                                                              this.byId("idAllStatus").setSelected(false);
                                                                          }*/
                var oFilter = [];
                var newFilter = new sap.ui.model.Filter(
                    "status",
                    "EQ",
                    sap.oee.ui.oeeConstants.status.NEW
                );
                var activeFilter = new sap.ui.model.Filter(
                    "status",
                    "EQ",
                    sap.oee.ui.oeeConstants.status.ACTIVE
                );
                var holdFilter = new sap.ui.model.Filter(
                    "status",
                    "EQ",
                    sap.oee.ui.oeeConstants.status.HOLD
                );
                var completedFilter = new sap.ui.model.Filter(
                    "status",
                    "EQ",
                    sap.oee.ui.oeeConstants.status.COMPLETED
                );
                var abortedFilter = new sap.ui.model.Filter(
                    "status",
                    "EQ",
                    sap.oee.ui.oeeConstants.status.ABORTED
                );

                /*if(allCheckBox){
                                                                              oFilter.push(newFilter);
                                                                              oFilter.push(activeFilter);
                                                                              oFilter.push(holdFilter);
                                                                              oFilter.push(completedFilter);
                                                                          }*/

                if (newCheckBox) {
                    oFilter.push(newFilter);
                }

                if (activeCheckBox) {
                    oFilter.push(activeFilter);
                }

                if (holdCheckBox) {
                    oFilter.push(holdFilter);
                }

                if (completedCheckBox) {
                    oFilter.push(completedFilter);
                }

                if (abortedCheckBox) {
                    oFilter.push(abortedFilter);
                }
                this.currentFilters = oFilter;

                if (this.byId("idOrdersTable").getBinding("items") != undefined)
                    this.byId("idOrdersTable").getBinding("items").filter(oFilter);
                this.onSearch();
            },

            onExit: function () {
                if (this.oActivityDialog != undefined) {
                    this.oActivityDialog.destroy();
                }

                if (this.oEnterTimeDialog != undefined) {
                    this.oEnterTimeDialog.destroy();
                }
                if (this.oSortDialog != undefined) {
                    this.oSortDialog.destroy();
                }

                if (this.oCapacityDialog != undefined) {
                    this.oCapacityDialog.destroy();
                }

                this.appComponent
                    .getEventBus()
                    .unsubscribe(
                        this.appComponent.getId(),
                        "shiftChanged",
                        this.refreshOrderData,
                        this
                    );
            },
            refreshOrderData: function (oEvent) {
                this.fetchOrdersBasedOnStatus(oEvent);
                //this.bindOrdersToTable();
            },

            sortOrderData: function (oEvent) {
                if (this.oSortDialog == undefined) {
                    this.oSortDialog = sap.ui.xmlfragment(
                        "sortFragment",
                        "sap.oee.ui.fragments.sortDialog",
                        this
                    );
                    this.byId(
                        sap.ui.core.Fragment.createId("sortFragment", "sortFields")
                    );
                    this.byId(sap.ui.core.Fragment.createId("sortFragment", "sortTypes"));
                    this.getView().addDependent(this.oSortDialog);
                }
                var sortFields = [];
                sortFields.push("plannedStart");
                sortFields.push("status");
                sortFields.push("actualStart");
                sortFields.push("order");
                sortFields.push("quantityReleased");
                sortFields.push("material");
                this.oSortModel.setData({
                    sortFields: sortFields,
                });
                this.oSortModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                this.oSortDialog.setModel(this.oSortModel);
                this.oSortDialog.open();
            },
            handleSortOK: function (oEvent) {
                if (
                    sap.ui.core.Fragment.byId(
                        "sortFragment",
                        "sortFields"
                    ).getSelectedItem() != null
                ) {
                    var sortDescending = false;
                    if (
                        sap.ui.core.Fragment.byId(
                            "sortFragment",
                            "sortTypes"
                        ).getSelectedItem() != null
                    ) {
                        if (
                            sap.ui.core.Fragment.byId("sortFragment", "sortTypes")
                                .getSelectedItem()
                                .getProperty("label") ==
                            this.interfaces.oOEEBundle.getText("OEE_LABEL_DESCENDING")
                        ) {
                            sortDescending = true;
                        }
                    }
                    var oSorter = [];
                    if (
                        sap.ui.core.Fragment.byId("sortFragment", "sortFields")
                            .getSelectedItem()
                            .getProperty("label") ==
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_STATUSH")
                    ) {
                        var oStatusSorter = new sap.ui.model.Sorter(
                            "status",
                            sortDescending
                        );
                        oSorter.push(oStatusSorter);
                    }
                    if (
                        sap.ui.core.Fragment.byId("sortFragment", "sortFields")
                            .getSelectedItem()
                            .getProperty("label") == "Planned Start"
                    ) {
                        var oStartDateSorter = new sap.ui.model.Sorter(
                            "plannedStartDate",
                            sortDescending
                        );
                        var oStartTimeSorter = new sap.ui.model.Sorter(
                            "plannedStartTime",
                            sortDescending
                        );
                        oSorter.push(oStartDateSorter);
                        oSorter.push(oStartTimeSorter);
                    }
                    if (
                        sap.ui.core.Fragment.byId("sortFragment", "sortFields")
                            .getSelectedItem()
                            .getProperty("label") ==
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_ACTUAL_START_DATE")
                    ) {
                        var oStartDateSorter = new sap.ui.model.Sorter(
                            "startDate",
                            sortDescending
                        );
                        var oStartTimeSorter = new sap.ui.model.Sorter(
                            "startTime",
                            sortDescending
                        );
                        oSorter.push(oStartDateSorter);
                        oSorter.push(oStartTimeSorter);
                    }
                    if (
                        sap.ui.core.Fragment.byId("sortFragment", "sortFields")
                            .getSelectedItem()
                            .getProperty("label") ==
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_ORDER")
                    ) {
                        var oStatusSorter = new sap.ui.model.Sorter(
                            "order",
                            sortDescending
                        );
                        oSorter.push(oStatusSorter);
                    }
                    if (
                        sap.ui.core.Fragment.byId("sortFragment", "sortFields")
                            .getSelectedItem()
                            .getProperty("label") ==
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_QUANTITY")
                    ) {
                        var oStatusSorter = new sap.ui.model.Sorter(
                            "quantityReleased",
                            sortDescending
                        );
                        oSorter.push(oStatusSorter);
                    }
                    if (
                        sap.ui.core.Fragment.byId("sortFragment", "sortFields")
                            .getSelectedItem()
                            .getProperty("label") ==
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_MATERIAL")
                    ) {
                        var oStatusSorter = new sap.ui.model.Sorter(
                            "material",
                            sortDescending
                        );
                        oSorter.push(oStatusSorter);
                    }
                    this.byId("idOrdersTable").getBinding("items").sort(oSorter);
                }
                this.oSortDialog.close();
            },

            openCapacityDialog: function (orderStartDate, orderStartTime) {
                if (this.oCapacityDialog == undefined) {
                    this.oCapacityDialog = sap.ui.xmlfragment(
                        "selectCapacityFragment",
                        "sap.oee.ui.fragments.selectCapacityDialog",
                        this
                    );
                    this.capacityListInDialog = sap.ui
                        .getCore()
                        .byId(
                            sap.ui.core.Fragment.createId(
                                "selectCapacityFragment",
                                "capacities"
                            )
                        );
                    this.searchCapacity = sap.ui
                        .getCore()
                        .byId(
                            sap.ui.core.Fragment.createId(
                                "selectCapacityFragment",
                                "searchCapacity"
                            )
                        );
                    sap.ui
                        .getCore()
                        .byId(
                            sap.ui.core.Fragment.createId(
                                "selectCapacityFragment",
                                "capacityCheckBox"
                            )
                        );
                    this.getView().addDependent(this.oCapacityDialog);
                }
                var fragmentHeader =
                    this.interfaces.oOEEBundle.getText(
                        "OEE_HEADING_SEL_CAPACITY_FOR_ORDER"
                    ) +
                    " " +
                    this.selectedOrder.orderNumber;
                this.capacityList = this.interfaces.getCapacityNodesForParentNode(
                    this.appData.node.nodeID,
                    orderStartDate,
                    orderStartTime
                );

                for (var i = 0; i < this.capacityList.details.results.length; i++) {
                    var capacity = this.capacityList.details.results[i];

                    capacity.selected = false;
                }
                var map = {};
                map.clearButtonPressed = true;
                this.searchCapacity.fireSearch(map);

                this.oSelectCapacityModel.setData({
                    capacities: this.capacityList.details.results,
                    fragmentHeader: fragmentHeader,
                    numberOfCapacities:
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_SELECT") +
                        " " +
                        this.selectedOrder.numberOfCapacities +
                        " " +
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_CAPACITIES"),
                });
                //this.oSelectCapacityModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                this.oCapacityDialog.setModel(this.oSelectCapacityModel);
                this.oCapacityDialog.open();
            },

            handleCapacityOK: function (oEvent) {
                var selectedCapacityValues = [],
                    combinedEndDate;
                this.capacityNodeList = [];
                var selectedCapacitiesCount = 0;
                for (var i = 0; i < this.capacityList.details.results.length; i++) {
                    var capacity = this.capacityList.details.results[i];
                    if (capacity.selected) {
                        var capacityNode = {};
                        capacityNode.nodeID = capacity.nodeId;
                        capacityNode.client = this.appData.client;
                        capacityNode.plant = this.appData.plant;
                        this.capacityNodeList.push(capacityNode);
                        selectedCapacitiesCount++;
                    }
                }
                if (
                    selectedCapacitiesCount !=
                    parseInt(this.selectedOrder.numberOfCapacities)
                ) {
                    sap.oee.ui.Utils.createMessage(
                        this.interfaces.oOEEBundle.getText("OEE_ERR_MSG_INCORRECT_NUM_CAP"),
                        sap.ui.core.MessageType.Error
                    );
                    return;
                }
                try {
                    var endDate = sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "inputEndDate"
                    ).getDateValue();
                    var endTime = sap.ui.core.Fragment.byId(
                        "prodActivitiesFragment",
                        "inputEndTime"
                    ).getDateValue();

                    if (endDate && endTime && endDate != "" && endTime != "") {
                        combinedEndDate = sap.oee.ui.Utils.createTimestampFromDateTime(
                            endDate,
                            endTime
                        );
                    }

                    if (combinedEndDate != undefined) {
                        var orderEndTimeStamp = this.removeSecondsFromTime(
                            this.getUTCForCurrentDate(combinedEndDate)
                        );
                    } else {
                        var orderEndTimeStamp = null;
                    }
                    //var runStartTimeStampTemp = new Date(this.selectedOrder.startDate + ' '+ this.selectedOrder.startTime).getTime();
                    /*var runStartTimeStamp = sap.oee.ui.Utils.removePlantTimezoneTimeOffsetAndSendUTC(runStartTimeStampTemp,this.appData.plantTimezoneOffset);
                                                                                        var orderStartTimeStamp = this.removeSecondsFromTime(runStartTimeStamp);*/
                    var runStartTimeStampInUTC = this.getUTCForCurrentDate(
                        new Date(
                            this.selectedOrder.startDate + " " + this.selectedOrder.startTime
                        )
                    );
                    var orderStartTimeStamp = this.removeSecondsFromTime(
                        runStartTimeStampInUTC
                    );
                    if (this.customData.getValue() == "RESUME") {
                        //								operationStartResumeData = this.interfaces.resumeProductionRun(this.selectedOrder.runID,this.appData.shift.shiftID,this.appData.shift.shiftGrouping,
                        //								this.appData.shift.workBreakSchedule,this.selectedOrder.startDate,
                        //								this.selectedOrder.startTime, this.selectedOrder.productionActivity, this.capacityNodeList);
                        var operationStartResumeData = this.interfaces.startResumeOrder(
                            this.selectedOrder.releasedHeaderID,
                            this.selectedOrder.releasedID,
                            this.appData.shift.shiftID,
                            this.appData.shift.shiftGrouping,
                            this.appData.shift.workBreakSchedule,
                            this.selectedOrder.productionActivity,
                            orderStartTimeStamp,
                            this.capacityNodeList,
                            this.crewSize,
                            orderEndTimeStamp,
                            this.selectedStatusValue,
                            this.selectedOrder.runID
                        );
                    } else {
                        //								operationStartResumeData = this.interfaces
                        //								.interfacesStartProductionRun(this.selectedOrder.releasedHeaderID,this.selectedOrder.releasedID,this.appData.shift.shiftID,
                        //								this.appData.shift.shiftGrouping,this.appData.shift.workBreakSchedule,
                        //								this.selectedOrder.productionActivity,
                        //								this.selectedOrder.startDate,this.selectedOrder.startTime,this.capacityNodeList,this.crewSize);
                        var operationStartResumeData = this.interfaces.startResumeOrder(
                            this.selectedOrder.releasedHeaderID,
                            this.selectedOrder.releasedID,
                            this.appData.shift.shiftID,
                            this.appData.shift.shiftGrouping,
                            this.appData.shift.workBreakSchedule,
                            this.selectedOrder.productionActivity,
                            orderStartTimeStamp,
                            this.capacityNodeList,
                            this.crewSize,
                            orderEndTimeStamp,
                            this.selectedStatusValue
                        );
                    }
                    if (operationStartResumeData == undefined) {
                        return;
                    }
                    if (operationStartResumeData != undefined) {
                        outputCode = operationStartResumeData.outputCode;
                        if (outputCode == 1) {
                            sap.oee.ui.Utils.createMessage(
                                operationStartResumeData.outputMessage,
                                sap.ui.core.MessageType.Error
                            );
                        } else if (outputCode == 0) {
                            this.appComponent
                                .getEventBus()
                                .publish(this.appComponent.getId(), "orderChange", {
                                    runID: operationStartResumeData.runID,
                                });
                            this.router = this.appComponent.getRouter();
                            this.router.navTo("contentArea");
                        }
                    }
                } catch (e) {
                    sap.oee.ui.Utils.createMessage(
                        e.message,
                        sap.ui.core.MessageType.Error
                    );
                }
                this.oCapacityDialog.close();
            },

            orderStartDateForOverlappingShifts: function (time) {
                var orderStartDate;
                if (time) {
                    if (this.appData.shift.startDate == this.appData.shift.endDate) {
                        orderStartDate = this.appData.shift.startDate;
                    } else {
                        // In Case of Overlapping Shifts

                        var hour = parseInt(time.slice(0, 2));
                        var shiftStarthour = parseInt(
                            this.appData.shift.startTime.slice(0, 2)
                        );
                        if (hour >= 0 && hour < shiftStarthour) {
                            orderStartDate = this.appData.shift.endDate;
                        } else {
                            // Default to shift start Date if outside zone
                            orderStartDate = this.appData.shift.startDate;
                        }
                    }
                }
                return orderStartDate;
            },

            navigateToOrderDetails: function (oEvent) {
                var selectedRowContext = oEvent.getSource().getBindingContext();
                //this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChange",{runID : this.orderOperationJSONModel.getProperty("runID",selectedRowContext)});
                this.appData.selected.order.orderNo =
                    this.orderOperationJSONModel.getProperty("order", selectedRowContext);
                this.appData.selected.operationNo =
                    this.orderOperationJSONModel.getProperty(
                        "routingOperNo",
                        selectedRowContext
                    );
                this.appData.selected.releasedID =
                    this.orderOperationJSONModel.getProperty(
                        "releasedID",
                        selectedRowContext
                    );
                this.router = this.appComponent.getRouter();
                // need to check if some constants can be used to navigate to activityID
                this.router.navTo("activity", {
                    activityId:
                        sap.oee.ui.oeeConstants.defaultWorkerUIActivites
                            .ACTIVITY_ORDER_DETAILS_SELECTION,
                    mode: this.orderOperationJSONModel.getProperty(
                        "runID",
                        selectedRowContext
                    ),
                });
            },

            onSearch: function (oEvent) {
                var properties = [];
                //properties =Object.getOwnPropertyNames(this.orderOperationJSONModel.oData.orderDetails[0]);
                properties.push("statusDesc");
                properties.push("order");
                properties.push("routingOperNo");
                properties.push("material");
                properties.push("materialDescription");
                properties.push("plannedStartDate");
                properties.push("plannedStartTime");
                properties.push("quantityReleased");
                properties.push("quantityReleasedUOM");
                properties.push("operationDesc");

                sap.oee.ui.Utils.fuzzySearch(
                    this,
                    this.orderOperationJSONModel,
                    this.byId("orderSearch").getValue(),
                    this.byId("idOrdersTable").getBinding("items"),
                    null,
                    properties,
                    this.currentFilters
                );
            },

            onSearchCapacityDialog: function (oEvent) {
                var properties = [];
                //properties =Object.getOwnPropertyNames(this.orderOperationJSONModel.oData.orderDetails[0]);
                properties.push("description");

                sap.oee.ui.Utils.fuzzySearch(
                    this,
                    this.oSelectCapacityModel,
                    oEvent.getSource().getValue(),
                    this.capacityListInDialog.getBinding("items"),
                    oEvent.getSource(),
                    properties
                );
            },

            handleClose: function (oEvent) {
                oEvent.getSource().getParent().close();
            },

            handleCancel: function (oEvent) {
                oEvent.getSource().getParent().close();
            },

            handleCancelOrderDetails: function (oEvent) {
                oEvent.getSource().getParent().close();
            },

            checkIfStatusPresent: function (obj1) {
                if (obj1 == undefined || "" == obj1) return false;
                else return true;
            },

            getCharacteristic: function (workorder) {
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
                }

                oModel.setData(panelJSON);
                this.getView().setModel(oModel, "panelsJSON");
                var table = this.byId("CharacteristicTable1");
                if (table != undefined) table.setModel(oModel);
                return oData;
            },
            onPressOpenCharacteristic: function (oEvent) {
                var orderNo = this.getView()
                    .byId("idOrdersTable")
                    .getModel()
                    .getProperty("orderNo", oEvent.getSource().getBindingContext());

                var oView = this.getView();
                var oDialog = oView.byId("getCharacteristicOrder");
                // create dialog lazily
                if (!oDialog) {
                    // create dialog via fragment factory
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.getCharacteristicOrder",
                        this
                    );
                    // connect dialog to view (models, lifecycle)
                    oView.addDependent(oDialog);
                }
                oDialog.open();
                this.getCharacteristic(orderNo);
                // this.byId("inputBarcode").setValue("");
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
                this.getOrderDetails(oEvent);
            },

            getOrderDetails: function (oEvent) {
                var rowNumber = oEvent
                    .getSource()
                    .getBindingContext()
                    .sPath.substring(14);
                var werks = this.appData.plant;
                var aufnr = this.getView().byId("idOrdersTable").getModel().getData()
                    .orderDetails[rowNumber].orderNo;
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

            onPressContinuousCasting: function (oEvent) {
                var selectedRowContext = oEvent.getSource().getBindingContext();
                this.selectedOrder.orderNumber =
                    this.orderOperationJSONModel.getProperty("order", selectedRowContext);

                this.selectedOrder.status = this.orderOperationJSONModel.getProperty(
                    "status",
                    selectedRowContext
                );

                if (
                    this.selectedOrder.status != "ACT" &&
                    this.selectedOrder.status != "NEW"
                ) {
                    sap.m.MessageToast.show(
                        this.interfaces.oOEEBundle.getText(
                            "OEE_LABEL_ORDER_ACTIVE_NEW_ERROR"
                        )
                    );
                    return;
                }

                var oView = this.getView();
                var oDialog = oView.byId("continuousCasting");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.continuousCasting",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                oDialog.open();
                this.appData.oDialog = oDialog;
                this.getfragmentTableData(this.selectedOrder.orderNumber);
                this.getContinuousCastingFragmentQry(this.selectedOrder.orderNumber);
                this.getE1cawnmDimensionsQry();
                this.getE1cawnmLengthKtkQry();
                this.getE1cawnwCastingTypeQry();
            },

            handleExit: function () {
                this.appData.oDialog.destroy();
            },

            callFragmentTableData: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                if (!p_data.Rowsets.Rowset[0].Row) {
                    var tableData = [];
                    for (var i = 0; i < 6; i++) {
                        tableData.push({
                            LINE: i + 1,
                        });
                    }
                    oModel.setData(tableData);
                } else oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().byId("continuousCastingTable").setModel(oModel);
            },

            getfragmentTableData: function (workorder) {
                var params = {
                    "Param.1": workorder,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/getfragmentTableDataQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callFragmentTableData);
            },

            callContinuousCastingFragment: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "continuousCastingFragment");
            },

            getContinuousCastingFragmentQry: function (workorder) {
                var params = {
                    "Param.1": workorder,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/getContinuousCastingFragmentQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callContinuousCastingFragment);
            },

            callE1cawnmDimensionsQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "dimensions");
            },

            getE1cawnmDimensionsQry: function () {
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/getE1cawnmDimensionsQry"
                );
                tRunner.ExecuteQueryAsync(this, this.callE1cawnmDimensionsQry);
            },

            callE1cawnmLengthKtkQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "lengths");
            },

            getE1cawnmLengthKtkQry: function () {
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/getE1cawnmLengthKtkQry"
                );
                tRunner.ExecuteQueryAsync(this, this.callE1cawnmLengthKtkQry);
            },

            callE1cawnmCastingTypeQry: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "castingType");
            },

            getE1cawnwCastingTypeQry: function () {
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/getE1cawnmCastingTypeQry"
                );
                tRunner.ExecuteQueryAsync(this, this.callE1cawnmCastingTypeQry);
            },

            callZmpmOrderChracXquery: function (p_this, p_data) {
                sap.m.MessageToast.show(
                    p_this.interfaces.oOEEBundle.getText("OEE_LABEL_SUCCESS")
                );
                p_this.handleExit();
            },

            onPressSaveChanges: function (oEvent) {
                var errorStatus = false;

                var tableData = this.getView()
                    .byId("continuousCastingTable")
                    .getModel().oData;

                for (var i = 0; i < tableData.length; i++) {
                    if (!tableData[i].Y_BOY || !tableData[i].Y_EBAT) errorStatus = true;
                }

                if (errorStatus) {
                    sap.m.MessageToast.show(
                        this.interfaces.oOEEBundle.getText("OEE_LABEL_PLEASE_CONTROL")
                    );
                    return;
                }

                var appData = this.appData;
                var client = appData.client;
                var plant = appData.plant;
                var nodeID = appData.node.nodeID;
                var workcenterID = appData.node.workcenterID;
                var aufnr = this.selectedOrder.orderNumber;
                var aprio = appData.selected.operationNo;
                var userID = appData.user.userID;
                var matnr = appData.selected.material.id;
                var quality = this.getView().byId("quality").getValue();
                var castingType = this.getView().byId("idCastingType").getSelectedKey();
                var tableData = this.getView()
                    .byId("continuousCastingTable")
                    .getModel().oData;
                var params = {
                    I_CLIENT: client,
                    I_PLANT: plant,
                    I_NODEID: nodeID,
                    I_WORKCENTERID: workcenterID,
                    I_AUFNR: aufnr,
                    I_APRIO: aprio,
                    I_USERID: userID,
                    I_MATNR: matnr,
                    I_TABLEDATA: JSON.stringify(tableData),
                    I_KALITE_KTK: quality,
                    I_DOKUM_TIPI: castingType,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/insertZmpmOrderChracXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callZmpmOrderChracXquery);
            },

            changeFragmentCombobox: function (oEvent) {
                var oTable = this.getView().byId("continuousCastingTable");
                var index =
                    oTable
                        .getModel()
                        .getProperty("LINE", oEvent.getSource().getBindingContext()) - 1;
                var chosenSelect = oEvent.getSource().getSelectedKey();
                var column;
                if (oEvent.getSource().mBindingInfos.items.model == "dimensions")
                    column = "Y_EBAT";
                else column = "Y_BOY";
                oTable.getModel().oData[index][column] = chosenSelect;
            },

            checkFragmentChrac: function (workorder) {
                var params = {
                    "Param.1": workorder,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/getfragmentTableDataQry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }

                var jsData = tRunner.GetJSONData();
                return !jsData[0].Row;
            },
            onPressLıneChange: function (oEvent) {
                var oModel = new sap.ui.model.json.JSONModel();
                var sPath = oEvent.getSource().getBindingContext().sPath;
                var pressRow = sPath.split("/")[1];
                var oTable = this.getView().byId("continuousCastingTable");
                var oData = oTable.getModel().oData;
                for (var i = pressRow; i < 6; i++) {
                    oData[i].Y_EBAT = oData[pressRow].Y_EBAT;
                    oData[i].Y_BOY = oData[pressRow].Y_BOY;
                }
                oModel.setData(oData);
                oTable.setModel(oModel);
            },

            onPressOpenComponents: function (oEvent) {
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("idOrdersTable").getModel().getData()[selectedIndex];
                var workorder = "0000" + String(oTableData.AUFNR);

                var oView = this.getView();
                var oDialog = oView.byId("componentDialog");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.componentDialog",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                oDialog.open();
                this.appData.oDialog = oDialog;
                this.getComponentsTable(workorder);
            },

            callComponentsTable: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                p_this.getView().setModel(oModel, "componensModel");
            },

            getComponentsTable: function (workorder) {
                var params = {
                    "Param.1": workorder,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/selectOrder/getComponentsQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callComponentsTable);
            },

            onPressOpenOrderLogsFrag: function (oEvent) {

                if (!this._oDialog05) {
                    this._oDialog05 = sap.ui.xmlfragment(
                        "idFragment05",
                        "customActivity.fragmentView.remainingOrderLogs",
                        this
                    );
                    this.getView().addDependent(this._oDialog05);
                }

                var params = {
                    "Param.1": Number(this.appData.selected.order.orderNo),
                };
                var tRunner = new TransactionRunner("MES/Itelli/FLM/RemaningOrderLogs/activeOrderLog", params);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]?.Row);
                sap.ui.core.Fragment.byId("idFragment05", "idACTRemaningTable").setModel(oModel)
                sap.ui.core.Fragment.byId("idFragment05", "idACTRemaningTable").mAggregations.items[0].mAggregations.cells[4].setValue(oData[0]?.Row[0].TEXT)

                var params2 = {
                };
                var tRunner2 = new TransactionRunner("MES/Itelli/FLM/RemaningOrderLogs/getRemainingOrderLogsQry", params2);
                if (!tRunner2.Execute()) {
                    MessageBox.error(tRunner2.GetErrorMessage());
                    return;
                }
                var oData2 = tRunner2.GetJSONData();
                var oModel2 = new sap.ui.model.json.JSONModel();
                oModel2.setData(oData2[0]?.Row);
                sap.ui.core.Fragment.byId("idFragment05", "idRemaningTable").setModel(oModel2)


                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/ALERT/T_GET_FRN_TRACE_DATA",
                    {

                    },
                    "O_JSON"
                );

                var planlananKutuk = response[0]?.modelData?.planlananMiktar.Rowsets.Rowset.Row.Y_URETILECEK_PAKSAY;
                var uretilenkutuk = response[0]?.modelData?.uretilenMiktar.Rowsets.Rowset.Row.URETILEN_KUTUK_SAYISI;
                var farkx = response[0]?.modelData?.fark.Rowsets;
                sap.ui.core.Fragment.byId("idFragment05", "uretimMiktarFrag").setText(planlananKutuk + "-" + uretilenkutuk + "-" + farkx)
                this._oDialog05.open();


            },

            onCloseFrag: function () {
                this._oDialog05.close();
            },


            onPressSave: function (oEvent) {

                var pressedPath = oEvent?.oSource?.getParent()?.getBindingContextPath()?.split("/")[1];
                var ACTtableModel = sap.ui.core.Fragment.byId("idFragment05", "idACTRemaningTable").getModel().getData()[pressedPath];
                var getText = sap.ui.core.Fragment.byId("idFragment05", "idTextArea05").getValue();
                var values = sap.ui.core.Fragment.byId("idFragment05", "uretimMiktarFrag").getText().split("-");
                var plannedValue = values[0];
                var producedValue = values[1];
                var remainingValue = values[2];

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/RemaningOrderLogs/T_INSERT_LOGS",
                    {
                        I_AUFNR: ACTtableModel.AUFNR,
                        I_KTK_KALITE: ACTtableModel.Y_KALITE_KTK,
                        I_M_KALITE: ACTtableModel.Y_KALITE_FLM,
                        I_TEXT: getText,
                        I_USER: this.appData.user.userID,
                        I_CAP: ACTtableModel.Y_CAP_FLM_MM,
                        I_PLANNED: plannedValue,
                        I_PRODUCED: producedValue,
                        I_REMAINING: remainingValue
                    },
                    "O_JSON"
                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {
                    MessageBox.information("İşlem Başarılı");
                }


                var params2 = {
                };
                var tRunner2 = new TransactionRunner("MES/Itelli/FLM/RemaningOrderLogs/getRemainingOrderLogsQry", params2);
                if (!tRunner2.Execute()) {
                    MessageBox.error(tRunner2.GetErrorMessage());
                    return;
                }
                var oData2 = tRunner2.GetJSONData();
                var oModel2 = new sap.ui.model.json.JSONModel();
                oModel2.setData(oData2[0]?.Row);
                sap.ui.core.Fragment.byId("idFragment05", "idRemaningTable").setModel(oModel2)
                sap.ui.core.Fragment.byId("idFragment05", "idACTRemaningTable").mAggregations.items[0].mAggregations.cells[4].setValue("")


            },

            handleLiveChange: function (oEvent) {
                liveText = oEvent.oSource.mProperties.value;
                sap.ui.core.Fragment.byId("idFragment05", "idTextArea05").setValue(liveText);
            },

            onPressCompletedToHold: function(){

                var radioCMPL = this.byId("idCompletedStatus").getSelected();
                var selectedPath = this.getView().byId("idOrdersTable")?.getSelectedContextPaths()[0]?.split("/")[1];                

                if (!!!selectedPath){
                    MessageBox.error("Tablodan Satır Seçiniz!");
                    return;
                }

                if (!!!radioCMPL){
                    MessageBox.error("Sadece Tamamlanmış Siparişler Beklete Alınabilir!");
                    return;
                }
                var selectedModel = this.getView().byId("idOrdersTable")?.getModel()?.getData()[selectedPath];

                var response = TransactionCaller.sync(
                    "MES/Itelli/FLM/MANAGE_ORDER/resetCompletedOrderToHold",
                    {
                        I_AUFNR: selectedModel.AUFNR
                    },
                    "O_JSON"
                );
                
                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return;
                }
                else {
                    MessageBox.information("İşlem Başarılı");
                }
            },

        });
    }
);