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
        "customActivity/scripts/transactionCaller"
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
        customStyle,
        TransactionCaller
    ) {
        //"use strict";
        var that;

        return Controller.extend("customActivity.controller.oeeBilletMonitorFLMNew", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */

            formatter: formatter,

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.appData.intervalState = true;
                this.interfaces = this.appComponent.getODataInterface();
                //Filtrelemede bugünün tarihini seçer
                that = this;

                this.aufnr;
                this.ktkid;
                
                var today = new Date();
                setYest = (today.getDate()) + "." + (today.getMonth() + 1) + "." + today.getFullYear();
                setTom = (today.getDate()) + "." + (today.getMonth() + 1) + "." + today.getFullYear();
                this.getView().byId("idDatePicker").setValue(setYest + " - " + setTom);
                this.date = setYest + " - " + setTom;

                this.busycontrol = false ;
                this.getBilletList();
                this.modelServices();
                this.fulfilLabel();

            },

            fulfilLabel:function() {

                TransactionCaller.async(
                    "MES/Itelli/FLM/ALERT/T_GET_FRN_TRACE_DATA",
                    {
                      
                    },
                    "O_JSON",
                    this.fulfilLabelCB,
                    this,
                    "GET"
                );


            },

            fulfilLabelCB: function (iv_data, iv_scope) {

                var myArrr3 = Array.isArray(iv_data[0]?.modelData?.activeOrder?.Rowsets?.Rowset?.Row) ? iv_data[0]?.modelData?.activeOrder?.Rowsets?.Rowset?.Row : new Array(iv_data[0]?.modelData?.activeOrder?.Rowsets?.Rowset?.Row);
                    var myModel3 = new sap.ui.model.json.JSONModel(myArrr3);

                    var planlananKutuk= iv_data[0]?.modelData?.planlananMiktar.Rowsets.Rowset.Row.Y_URETILECEK_PAKSAY;
                    var uretilenkutuk= iv_data[0]?.modelData?.uretilenMiktar.Rowsets.Rowset.Row.URETILEN_KUTUK_SAYISI;
                    var farkx=iv_data[0]?.modelData?.fark.Rowsets;                 
                    iv_scope.getView().byId("uretimMiktar")?.setText(planlananKutuk+"-"+uretilenkutuk+"-"+farkx);



                    iv_scope.getView().byId("sipno").setText(myModel3?.oData[0]?.AUFNR);
                    iv_scope.getView().byId("malzemekodu").setText(myModel3?.oData[0]?.MATNR);
                    iv_scope.getView().byId("filmkalite").setText(myModel3?.oData[0]?.MAKTX);

                    return
            },



            getDateTime: function (oEvent) {
                var dateS = oEvent.getSource().getValue();
                var dateValues = dateS.split(" - ");
                console.log(dateValues[0]);
                console.log(dateValues[1]);
            },
/*             changeMiddleFilterEnabled: function (status) {
                var middleIdArr = ["searchFieldCastNo", "searchFieldCap", "searchFieldMQuality", "searchFieldKQuality"];
                middleIdArr.forEach((id) => {
                    this.getView().byId(id).setValue("");
                    this.getView().byId(id).setEnabled(status);
                });
            }, */
            onOpenRejectDialog: function (oEvent) {
                var selectedBilletLength = this.byId(
                    "tblBilletMaster"
                ).getSelectedItems().length;

                if (selectedBilletLength <= 0) {
                    MessageBox.error("Lütfen KTKID seçiniz!");
                    return;
                }

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
                var oDialog2 = oView.byId("openBilletRejectDetail");
                if (!oDialog2) {
                    oDialog2 = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.openBilletRejectDetail",
                        this
                    );
                    oView.addDependent(oDialog2);
                }
                var selectedItems = this.getView().byId("tblBilletMaster").getSelectedItems();
                var selectedLength = selectedItems.length;

                var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var oTableData = this.getView().byId("tblBilletMaster").getModel().getData()[selectedIndex];
				var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oTableData);
                this.getView().setModel(oModel, "rejectDetailModel");
                this.appData.oDialog2 = oDialog2;
                oDialog2.open();
            },
            newStartButton: function (oEvent) {
               
                this.StartButton(oTableData);

            },



           /*  onSearch: function (oEvent) {

                var ktkParameter = this.getView().byId("searchFieldKTKID").getValue();
                var orderParameter = this.getView().byId("searchFieldOrder").getValue();
                var dateS = this.getView().byId("idDatePicker").getValue();
                var dateValues = dateS.split(" - ");
                //dateValues[0]+="T00:00:00";
                //dateValues[1]+="T00:00:00";
                if (!ktkParameter && !orderParameter)
                    this.getBilletList();
                var aFilters = [];
                aFilters = [
                    new Filter(
                        [
                            //  new Filter("FURNACE_EXIT_TIME", FilterOperator.BT, (dateValues[0]+"T00:00:00"),(dateValues[1]+"T00:00:00")),
                            new Filter("AUFNR", FilterOperator.Contains, orderParameter),
                            new Filter("KTKID", FilterOperator.Contains, ktkParameter)
                        ],
                        true
                    )
                ];


                // update list binding
                var oList = this.byId("tblBilletMaster");
                var oBinding = oList.getBinding("items");
                var oModel = this.getView().getModel("tblBilletMaster").oData;
                var oData = oModel.oData;
                if (oData)
                    oData.filter(aFilters, FilterType.Applications);
                oModel.setData(oData);

            }, */
            /*
            callBilletList: function (p_this, p_data) {
                var tableData = p_data;
                  // database'den geldiği için yoruma alındı. 09.10.2020 //
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
                  
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                // oModel.setData(tableData);
                p_this.getView().setModel(oModel, "confirmBilletList");
                p_this.getOrderFilter();
                p_this.getKTKIDFilter();
                // p_this.bindRawMaterialsToTable(p_data.Rowsets.Rowset[0]);
                //p_this.onSearch();
            },
            */

            resetDateTimePicker: function () {
                this.getView().byId("idDatePicker").setSecondDateValue(null);
                this.getView().byId("idDatePicker").setValue(null);
            },
/*             resetMiddleCombos: function () {
                this.getView().byId("searchFieldCastNo").setValue("");
                this.getView().byId("searchFieldCap").setValue("");
                this.getView().byId("searchFieldMQuality").setValue("");
                this.getView().byId("searchFieldKQuality").setValue("");
            }, */
           /*  onKTKIDSelectionChange: function (oEvent) {
                this.resetDateTimePicker();
                var ktkId = this.getView().byId("searchFieldKTKID").getValue();
                var paramObj = {
                    I_KTKID: ktkId
                }
                this.filterCaller(paramObj);
            }, */
            onAufnrSelectionChange: function (oEvent) {
                this.resetDateTimePicker();
                var aufnr = this.getView().byId("searchFieldOrder").getValue();
                var paramObj = {
                    I_AUFNR: aufnr
                }
                this.filterCaller(paramObj);
            },
/*             onCastNoSelectionChange: function (oEvent) {
                //this.resetDateTimePicker();
                var castNo = this.getView().byId("searchFieldCastNo").getValue();
                if (!(!!castNo)) {
                    MessageToast.show("Döküm numarasına ait kayıt listede yok");
                    this.getView().byId("tblBilletMaster").setModel(this.currentModel);
                    this.resetMiddleCombos();
                    return;
                }
                this.filterFromModel("CASTID", castNo, "searchFieldCastNo");
                this.getView().byId("searchFieldCastNo").setValue(castNo);
            }, */
/*             onCapSelectionChange: function (oEvent) {
                //this.resetDateTimePicker();
                var cap = this.getView().byId("searchFieldCap").getValue();
                if (!(!!cap)) {
                    this.getView().byId("tblBilletMaster").setModel(this.currentModel);
                    this.resetMiddleCombos();
                    return;
                }
                this.filterFromModel("Y_CAP_FLM_MM", cap, "searchFieldCap");
                this.getView().byId("searchFieldCap").setValue(cap);
            }, */
/*             onMQualitySelectionChange: function (oEvent) {
                //this.resetDateTimePicker();
                var mQuality = this.getView().byId("searchFieldMQuality").getValue();
                if (!(!!mQuality)) {
                    this.getView().byId("tblBilletMaster").setModel(this.currentModel);
                    this.resetMiddleCombos();
                    return;
                }
                this.filterFromModel("Y_KALITE_FLM", mQuality, "searchFieldMQuality");
                this.getView().byId("searchFieldMQuality").setValue(mQuality);
            },
            onKQualitySelectionChange: function (oEvent) {
                //this.resetDateTimePicker();
                var kQuality = this.getView().byId("searchFieldKQuality").getValue();
                if (!(!!kQuality)) {
                    this.getView().byId("tblBilletMaster").setModel(this.currentModel);
                    this.resetMiddleCombos();
                    return;
                }
                this.filterFromModel("Y_KALITE_KTK", kQuality, "searchFieldKQuality");
                this.getView().byId("searchFieldKQuality").setValue(kQuality);
            }, */
 /*            filterFromModel: function (key, value, id) {

                var middleComboArr = ["CASTID", "Y_CAP_FLM_MM", "Y_KALITE_FLM", "Y_KALITE_KTK"];
                var middleIdArr = ["searchFieldCastNo", "searchFieldCap", "searchFieldMQuality", "searchFieldKQuality"];

                var tableModel = this.getView().byId("tblBilletMaster").getModel();
                var tableArr = tableModel?.oData;
                if (!!tableArr && tableArr.length > 0) {
                    var filteredArr = tableArr.filter((item) => item[key] == value);
                    if (filteredArr.length == 0) {
                        MessageToast.show("Filtreye ait kayıt yok");
                        this.getView().byId("tblBilletMaster").setModel(this.currentModel);
                        this.getView().byId("idDatePicker").setSecondDateValue(this.currentEndDate);
                        this.getView().byId("idDatePicker").setValue(this.currentDateS);
                        this.getView().byId(id).setValue("");
                        return;
                    }
                    var myModel = new sap.ui.model.json.JSONModel();
                    myModel.setData(filteredArr);

                    for (let i = 0; i < middleComboArr.length; i++) {
                        var comboFilter = [...new Set(filteredArr.map((m) => m[middleComboArr[i]]))];
                        var comboModel = new sap.ui.model.json.JSONModel();
                        var modelArr = [];
                        comboFilter.forEach((item) => {
                            var key = middleComboArr[i];
                            var obj = {};
                            obj[key] = item;
                            modelArr.push(obj);
                        });
                        comboModel.setData(modelArr);
                        this.getView().byId(middleIdArr[i]).setModel(comboModel);
                    }

                    this.getView().byId("tblBilletMaster").setModel(myModel);
                }

            }, */
            filterCaller: function (paramObj,busycontrol) {
                paramObj.I_KTKID = this.getView().byId("searchFieldKTKID")?.getSelectedKey();
                paramObj.I_AUFNR = this.getView().byId("searchFieldOrder")?.getSelectedKey();

                this.ktkid = this.getView().byId("searchFieldKTKID")?.getSelectedKey();
                this.aufnr = this.getView().byId("searchFieldOrder")?.getSelectedKey();

                var isDateEmpty = this.getView().byId("idDatePicker").getValue();
                if(isDateEmpty == "" && paramObj.I_KTKID == "" && paramObj.I_AUFNR == "") {

                    MessageBox.error("Lütfen gerekli alanlardan birini doldurup tekrar deneyiniz.");
                    return;
                }

              

                
                   

                    TransactionCaller.async(
                        "MES/Itelli/FLM/BILLET_MONITOR/T_BILLET_MONITOR",
                        paramObj,
                        "O_JSON",
                        this.filterCallerCB,
                        this,
                        "GET",
                       
    
                        
                    );
                    
              


              


          

                

                /* if(busycontrol != true) {
                this.getView().byId("tblBilletMaster").setBusy(true);
                } */
            },

            onKTKIDSelectionChange2 : function () {this.getView().byId("searchFieldOrder")?.setSelectedKey(""); this.getView().byId("idDatePicker").setValue("");},
            onAufnrSelectionChange2 : function () {this.getView().byId("searchFieldKTKID")?.setSelectedKey(""); this.getView().byId("idDatePicker").setValue("");},
            datePickerTrigger: function () {this.getView().byId("searchFieldOrder")?.setSelectedKey(""); this.getView().byId("searchFieldKTKID")?.setSelectedKey("");},
         

            onPressResetFilters: function (oEvent) {
                this.getView().byId("searchFieldKTKID")?.setSelectedKey("");
                this.getView().byId("searchFieldOrder")?.setSelectedKey("");
                this.getView().byId("searchFieldCastNo")?.setSelectedKey("");
                this.getView().byId("searchFieldCap")?.setSelectedKey("");
                this.getView().byId("searchFieldMQuality")?.setSelectedKey("");
                this.getView().byId("searchFieldKQuality")?.setSelectedKey("");

                this.getView().byId("idDatePicker").setValue(this.date);

                this.getBilletList();
                
             
            },

            pmNavigate: function () {
                this.appComponent.getRouter().navTo("activity", {
                                        activityId: "pmNotScreen"
                                        
                                    });

            },
           /*  onPressResetFilters: function (oEvent) {
                this.getView().byId("tblBilletMaster").setBusy(true);
                this.resetFilters();
                this.getView().byId("tblBilletMaster").setBusy(false);
            }, */
            /* resetFilters: function () {
                if (!!this.currentEndDate && !!this.currentDateS) {
                    this.getView().byId("idDatePicker").setSecondDateValue(this.currentEndDate);
                    this.getView().byId("idDatePicker").setValue(this.currentDateS);
                    this.getBilletList();
                }
                else {
                    var myModel = new sap.ui.model.json.JSONModel();
                    this.getView().byId("tblBilletMaster").setModel(myModel);
                    this.getView().byId("searchFieldOrder").setModel(myModel);
                    this.getView().byId("searchFieldKTKID").setModel(myModel);
                    this.getView().byId("searchFieldCastNo").setModel(myModel);
                    this.getView().byId("searchFieldCap").setModel(myModel);
                    this.getView().byId("searchFieldMQuality").setModel(myModel);
                    this.getView().byId("searchFieldKQuality").setModel(myModel);
                }
                this.getView().byId("tblBilletMaster").setValue("");
                this.getView().byId("searchFieldOrder").setValue("");
                this.getView().byId("searchFieldKTKID").setValue("");
                this.getView().byId("searchFieldCastNo").setValue("");
                this.getView().byId("searchFieldCap").setValue("");
                this.getView().byId("searchFieldMQuality").setValue("");
                this.getView().byId("searchFieldKQuality").setValue("");
            }, */
            filterCallerCB: function (iv_data, iv_scope) {

                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    return;
                }

                var modelArrAll = Array.isArray(iv_data[0].Rowsets.Rowset[0].Row) ? iv_data[0].Rowsets.Rowset[0].Row : new Array(iv_data[0].Rowsets.Rowset[0].Row);
                var myModelAll = new sap.ui.model.json.JSONModel(modelArrAll);
                iv_scope.getView().byId("tblBilletMaster").setModel(myModelAll);

                /* iv_scope.getView().byId("tblBilletMaster").setBusy(false); */
                
                var modelArrOrder = Array.isArray(iv_data[0].Rowsets.Rowset[1].Row) ? iv_data[0].Rowsets.Rowset[1].Row : new Array(iv_data[0].Rowsets.Rowset[1].Row);
                var myModelOrder = new sap.ui.model.json.JSONModel(modelArrOrder);
                iv_scope.getView().byId("searchFieldOrder").setModel(myModelOrder);
                
                var modelArrKTK = Array.isArray(iv_data[0].Rowsets.Rowset[2].Row) ? iv_data[0].Rowsets.Rowset[2].Row : new Array(iv_data[0].Rowsets.Rowset[2].Row);
                var myModelKTK = new sap.ui.model.json.JSONModel(modelArrKTK);
                iv_scope.getView().byId("searchFieldKTKID").setModel(myModelKTK);

              /*   var modelArrCast = Array.isArray(iv_data[0].Rowsets.Rowset[3].Row) ? iv_data[0].Rowsets.Rowset[3].Row : new Array(iv_data[0].Rowsets.Rowset[3].Row);
                var myModelCast = new sap.ui.model.json.JSONModel(modelArrCast);
                iv_scope.getView().byId("searchFieldCastNo").setModel(myModelCast);

                var modelArrDiameter = Array.isArray(iv_data[0].Rowsets.Rowset[4].Row) ? iv_data[0].Rowsets.Rowset[4].Row : new Array(iv_data[0].Rowsets.Rowset[4].Row);
                var myModelDiameter = new sap.ui.model.json.JSONModel(modelArrDiameter);
                iv_scope.getView().byId("searchFieldCap").setModel(myModelDiameter);

                var modelArrQuality = Array.isArray(iv_data[0].Rowsets.Rowset[5].Row) ? iv_data[0].Rowsets.Rowset[5].Row : new Array(iv_data[0].Rowsets.Rowset[5].Row);
                var myModelQuality = new sap.ui.model.json.JSONModel(modelArrQuality);
                iv_scope.getView().byId("searchFieldMQuality").setModel(myModelQuality);

                var modelArrKQuality = Array.isArray(iv_data[0].Rowsets.Rowset[6].Row) ? iv_data[0].Rowsets.Rowset[6].Row : new Array(iv_data[0].Rowsets.Rowset[6].Row);
                var myModelKQuality = new sap.ui.model.json.JSONModel(modelArrKQuality);
                iv_scope.getView().byId("searchFieldKQuality").setModel(myModelKQuality); */

                /* if (!!iv_scope.getView().byId("idDatePicker").getSecondDateValue())
                    iv_scope.changeMiddleFilterEnabled(true);
                else
                    iv_scope.changeMiddleFilterEnabled(false); */
                    iv_scope.getView().byId("searchFieldOrder").setSelectedKey(iv_scope.aufnr)
                    iv_scope.getView().byId("searchFieldKTKID").setSelectedKey(iv_scope.ktkid);

                    
            },
            getBilletList: function (busycontrol) {
                var startDate = moment(this.getView().byId("idDatePicker").getDateValue()).format('YYYY-MM-DD' + ' 00:00:01');
                var endDate = moment(this.getView().byId("idDatePicker").getSecondDateValue()).format('YYYY-MM-DD' + ' 23:59:59');
                var werks = this.appData.plant;
                var workcenterId = this.appData.node.workcenterID;
 
              
 
                 var paramObj = {
                     I_WERKS: werks,
                     I_WORKCENTERID: workcenterId,
                     I_START_DATE: startDate,
                     I_END_DATE: endDate
 
                 }
                 this.filterCaller(paramObj,busycontrol);
 
                 
             },
 

            onConfirmDialog: function () {
                this.handleCancel();
            },
            getKTKIDFilter: function () {
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var dateS = this.getView().byId("idDatePicker").getValue();
                var pickerSecondDate = new Date(this.getView().byId("idDatePicker").getSecondDateValue())
                var secondaryDate = (pickerSecondDate.getDate() + 1) + "." + (pickerSecondDate.getMonth() + 1) + "." + pickerSecondDate.getFullYear();
                var dateValues = dateS.split(" - ");
                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterid,
                    "Param.3": dateValues[0],
                    "Param.4": secondaryDate
                }
                var tRunner = new TransactionRunner("MES/UI/Filmasin/getFilterKTKIdMonitorQry", params);
                if (!tRunner.Execute())
                    return null;
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "ktkFilterModel");
            },
            getOrderFilter: function () {
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var dateS = this.getView().byId("idDatePicker").getValue();
                var pickerSecondDate = new Date(this.getView().byId("idDatePicker").getSecondDateValue())
                var secondaryDate = (pickerSecondDate.getDate() + 1) + "." + (pickerSecondDate.getMonth() + 1) + "." + pickerSecondDate.getFullYear();
                var dateValues = dateS.split(" - ");
                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterid,
                    "Param.3": dateValues[0],
                    "Param.4": secondaryDate
                }
                var tRunner = new TransactionRunner("MES/UI/Filmasin/getFilterOrderMonitorQry", params);
                if (!tRunner.Execute())
                    return null;
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "orderFilterModel");
            },

            handleCancel: function () {
                if (!!this.appData.oDialog) {
                    this.appData.oDialog.destroy();
                }
                this.appData.intervalState = false;
                this.changeIntervalState();
                this.getView().byId("btnManualActions").setEnabled(false);
            },
            handleCancelBilletReject: function () {
                this.getView().byId("openBilletRejectDetails").destroy();
                this.appData.intervalState = false;
                this.changeIntervalState();
                this.getView().byId("btnManualActions").setEnabled(false);

            },
            handleCancelBilletReturned: function () {
                this.getView().byId("openReturnedBilletList").destroy();
                this.appData.intervalState = false;
                this.changeIntervalState();
                this.getView().byId("btnManualActions").setEnabled(false);
            },
            //25.09 K.T
            createColumnConfig: function () {
                return [{
                    name: "VRD",
                    template: {
                        content: "{SHIFT}"
                    }
                }, {
                    name: "Sip. No",
                    template: {
                        content: "{AUFNR}"
                    }
                },
                {
                    name: "Sip. S.",
                    template: {
                        content: "{AUFNR_SEQ}"
                    }
                },
                {
                    name: "KTKID",
                    template: {
                        content: "{KTKID}"
                    }
                },
                {
                    name: "OTOID",
                    template: {
                        content: "{OTOID}"
                    }
                },
                {
                    name: "Cap",
                    template: {
                        content: "{Y_CAP_FLM_MM}"
                    }
                },
                {
                    name: "M. Kalite",
                    template: {
                        content: "{Y_KALITE_FLM}"
                    }
                },
                {
                    name: "Mensei",
                    template: {
                        content: "{Y_KUTUK_MENSEI}"
                    }
                },
                {
                    name: "K. Kalite",
                    template: {
                        content: "{Y_KALITE_KTK}"
                    }
                },
                {
                    name: "Ebat",
                    template: {
                        content: "{Y_EBAT}"
                    }
                },
                {
                    name: "Boy",
                    template: {
                        content: "{Y_BOY_KTK}"
                    }
                },
                {
                    name: "DNO",
                    template: {
                        content: "{CASTID}"
                    }
                },
                {
                    name: "Durum",
                    template: {
                        content: "{PRODUCT_STATUS}"
                    }
                },
                {
                    name: "ND",
                    template: {
                        content: "{Y_NERVUR_DUZ}"
                    }
                },
                {
                    name: "G.Tartim",
                    template: {
                        content: "{ENTRY_WEIGHT}"
                    }
                },
                {
                    name: "Uretim Yontemi",
                    template: {
                        content: "{Y_URETIM_YONTEMI_FLM}"
                    }
                },
                {
                    name: "F. Giris Zaman",
                    template: {
                        content: "{FURNACE_ENTRY_TIME}"
                    }
                }, {
                    name: "F. Cikis Zaman",
                    template: {
                        content: "{FURNACE_EXIT_TIME}"
                    }
                }, {
                    name: "HB",
                    template: {
                        content: "{HB}"
                    }
                }, {
                    name: "UB+UK",
                    template: {
                        content: "{UBUK}"
                    }
                }, {
                    name: "Hata Kodu",
                    template: {
                        content: "{REASONCODE}"
                    }
                }, {
                    name: "Hata Detayi",
                    template: {
                        content: "{DESCRIPTION}"
                    }
                }]
            },

            onDataExport: function (oEvent) {

                var aCols, oExcData, oSettings, oSheet;
                aCols = this.createColumnConfig();
                oExcData = this.getView().byId("tblBilletMaster").getModel().getProperty('/');
                var oExport = new sap.ui.core.util.Export({
                    exportType: new sap.ui.core.util.ExportTypeCSV({
                        separatorChar: "\t",
                        mimeType: "application/vnd.ms-excel",
                        charset: "utf-8",
                        fileExtension: "xls",
                    }),
                    models: oExcData,
                    rows: {
                        path: "/"
                    },
                    columns: aCols
                });
                oExport.setModel(this.getView().byId("tblBilletMaster").getModel());

                oExport.saveFile('Kutuk_Takip_Data').always(function () {
                    //    this.destroy();
                });
            },

            //25.09 K.T
            changeIntervalState: function (oEvent) {
                oButton = this.getView().byId("chkIntervalState");
                if (this.appData.intervalState == true) {
                    this.appData.intervalState = false;
                    oButton.setType("Reject");
                    oButton.setText("Otomatik Güncelleme Kapalı")
                }
                else {
                    this.appData.intervalState = true;
                    this.getView().byId("chkIntervalState").setType("Accept");
                    oButton.setText("Otomatik Güncelleme Açık")
                }
            },
            ////////HATA BILDIR 
            callBilletDetail: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "rejectionModel");
            },

            getBilletDetail: function (param) {
                var plant = this.appData.plant;
                var tableModel = this.getView().byId("tblBilletMaster").getModel().oData;
                var oTable = this.getView().byId("tblBilletMaster");
                var selectedRows = oTable.getSelectedContexts()[0].sPath;
                var selectedRow = selectedRows.split("/")[1];
                var Ktkid = tableModel[selectedRow].KTKID;
                /*  this.getView().byId("rejectedKtkid").setSelectedKey(Ktkid); */
                var params = { "Param.1": Ktkid };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getKTKIDForRejectQry",
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
                var params = { "param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletReject/getRejectTypesBilletMonitorQry", params
                );
                tRunner.ExecuteQueryAsync(this, this.callRejectType);
            },

            callRejectReason: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "rejectedNotifReasons");
            },

            onSelectRejectType: function (oEvent) {
                var params = { "Param.1": oEvent.getSource().getSelectedKey(), "Param.2": this.appData.plant }
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletReject/getRejectReasonBilletMonitorQry",
                    params,
                );
                tRunner.ExecuteQueryAsync(this, this.callRejectReason);
            },
            callConfirmReject: function (p_this, p_data) {
                p_this.handleCancel();
                sap.m.MessageToast.show("Kayıt Başarılı");
                p_this.refreshData();
            },

            onConfirmBilletReject: function (oEvent) {
                var reason;
                var oTable = this.getView().byId("tblBilletMaster");
                var tableModel = this.getView().byId("tblBilletMaster").getModel().oData;
                var reasonType = this.getView().byId("selectType").getSelectedKey();
                var oReasonFirst = this.getView().byId("selectReason");
                var reason
                var reasonFirst;
                var reasonFirstKey;
                var reasonKey;
                if (!(!!reasonType)) {
                    sap.m.MessageToast.show("Tür seçmeden kayıt edemezsiniz.");
                    return null;
                }


                if (oReasonFirst.getSelectedItem()) {
                    reasonFirst = oReasonFirst.getSelectedItem().getText();
                    reasonFirstKey = oReasonFirst.getSelectedKey();
                }
                var oReasonFirstData = this.getView().getModel("rejectedNotifReasons").oData;
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
                    "MES/Integration/OPC/FLM/BilletReject/insertBilletMonitorRejectReasonXqry",
                    params
                );
                var that = this;
                MessageBox.warning("Devam etmek istiyor musunuz?.", {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CLOSE],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction == MessageBox.Action.CLOSE)
                            return null;
                        else
                            tRunner.ExecuteQueryAsync(that, that.callConfirmReject);
                    }
                });

            },
            ////////HATA BILDIR 



            callReturnedBilletDetail: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "returnedBilletModel");
            },

            openReturnedBilletList: function (oEvent) {
                var oView = this.getView();
                var oDialog = oView.byId("openReturnedBilletList");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.openReturnedBilletList",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var params = { "Param.1": werks, "Param.2": workcenterid }
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getReturnedBilletList",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callReturnedBilletDetail);
                this.appData.oDialog = oDialog;
                oDialog.open();
            },


            modelServices: function () {
                var self = this;
                this.intervalHandle = setInterval(function () {
                    if (window.location.hash == "#/activity/ZACT_BILLET_MNTR_FLM")
                        if (self.appData.intervalState == true) {
                            var busycontrol = true;
                            self.fulfilLabel();
                            self.getBilletList(busycontrol);
                            //self.callGetAlertList();
                            self.getAlert();
                        }
                    console.log(1);
                }, 5000);
            },
            multipleThousand: function (str) {
                return isNaN(parseFloat(str)) ? str : parseFloat(str) * 1000;
            },
            callGetAlert: function (p_this, p_data) {
                var data = p_data.Rowsets.Rowset[0].Row;
                if (data != undefined) {
                    var alertMessage = p_data.Rowsets.Rowset[0].Row[0].LONGTEXT;
                    var alertID = p_data.Rowsets.Rowset[0].Row[0].ID;
                    sap.m.MessageBox.warning(
                        p_this.appComponent.oBundle.getText(alertMessage),
                        {
                            actions: [
                                p_this.appComponent.oBundle.getText("EVET"),
                                p_this.appComponent.oBundle.getText("HAYIR"),

                            ],
                            onClose: function (oAction) {

                                if (oAction == "EVET") {
                                    p_this.updateAlertStatus(alertID);
                                    p_this.updateBilletStatus(alertMessage);

                                } else if (oAction == "HAYIR") {
                                    p_this.updateAlertStatus(alertID);
                                    p_this.updateProductStatus(alertMessage);

                                } else {
                                    return;
                                }
                            }.bind(p_this),
                        }
                    );
                } else {
                    p_this.appData.intervalState = true;
                }
            },

            getAlert: function (oEvent) {
                var shortText = "FRC_ALERT";
                var params = {
                    "Param.1": shortText
                }
                var tRunner = new TransactionRunner(
                    "MES/UI/AlertViewer/getNewAlertQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callGetAlert);
                this.appData.intervalState = false;
            },


            updateAlertStatus: function (alertID) {
                var params = {
                    I_ALERTID: alertID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Package/updateAlertStatusXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdateAlert);
            },

            callUpdateAlert: function (p_this, p_that) {
                p_this.appData.intervalState = true;

            },


            updateProductStatus: function (alertMessage) {
                var user = this.appData.user.userID;
                var parse = JSON.parse(JSON.stringify(alertMessage).split(" "));
                var ktkId = parse.split(",")[0];
                var params = {
                    I_USER: user,
                    I_KTKID: ktkId
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Operations/updateProductStatusXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdateProduct);
            },

            callUpdateProduct: function (p_this, p_that) {
                p_this.appData.intervalState = true;

            },

            updateBilletStatus: function (alertMessage) {
                var user = this.appData.user.userID;
                var parse = JSON.parse(JSON.stringify(alertMessage).split(" "));
                var ktkId = parse.split(",")[0];
                var params = {
                    I_USER: user,
                    I_KTKID: ktkId
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Operations/updateBilletStatusXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdateBilletStat);
            },

            callUpdateBilletStat: function (p_this, p_that) {
            },


            /*
                        callGetAlertList: function () {
                            var oModel = new sap.ui.model.json.JSONModel();
                            var that = this;
                            var aData = jQuery.ajax({
                                type: "GET",
                                contentType: "application/json",
                                url: "http://10.237.82.33:50000/XMII/Illuminator?Service=Alert&mode=GetAlerts&content-type=text/json&Status=New",
                                dataType: "json",
                                async: true,
                                success: function (data, textStatus, jqXHR) {
                                    oModel.setData(data);
                                    that.appData.alert = data;
                                    //alert(" ");
                                }
                            });
                            //this.getView().getModel(oModel);
                            var alertData = that.appData.alert;
                            if (alertData == undefined || alertData.Rowsets == undefined) {
                                return;
                            }
                            var alertList = alertData.Rowsets.Rowset[0].Row;
                            if (alertList != undefined) {
                                alertData = JSON.parse(JSON.stringify(alertData).replaceAll(" ", "_"));
                                var alertID = alertData.Rowsets.Rowset[0].Row[0].Tanıtıcı;
                               // var shortText = alertData.Rowsets.Rowset[0].Row[0].Short_Text;
                                var KısaMetin = alertData.Rowsets.Rowset[0].Row[0].Kısa_metin;
                                this.appData.intervalState = false;
                                this.alertList(alertID,KısaMetin);
                            }
                        },
            
            
                        alertList: function (alertID,KısaMetin) {
                            if(KısaMetin == undefined){
                                    this.appData.intervalState = true;
                                   }
                           else if (KısaMetin.length == 9) {
                                sap.m.MessageBox.warning(
                                    this.appComponent.oBundle.getText(KısaMetin + " " + "nolu kütük hadde bozuğu olarak kaydedilsin mi ?"),
                                    {
                                        actions: [
                                            this.appComponent.oBundle.getText("EVET"),
                                            this.appComponent.oBundle.getText("HAYIR"),
            
                                        ],
                                        onClose: function (oAction) {
            
                                            if (oAction == "EVET") {
                                                this.appData.alert = undefined;
                                                this.updateAlertStatus(alertID);
                                                this.updateBilletStatus(KısaMetin);
            
            
                                            } else if (oAction == "HAYIR") {
                                                this.appData.alert = undefined;
                                                this.appData.intervalState = true;
                                                this.updateAlertStatus(alertID);
                                                this.updateProductStatus(KısaMetin);
                                            } else {
                                                return;
                                            }
                                        }.bind(this),
                                    }
                                );
                            } else {
                                this.appData.intervalState = true;
                            }
                        },
            */




            onUpdateBilletDownPallet: function () {
                var palletNo = this.getView().byId("palletNoInput").getValue();
                var tableModel = this.getView().byId("tblBilletMaster").getModel().oData;
                var oTable = this.getView().byId("tblBilletMaster");
                var selectedKtkIdList = [];
                var oSelectedRowLength = oTable.getSelectedContexts().length;
                for (i = 0; i < oSelectedRowLength; i++) {
                    var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                    var selectedRow = selectedRowPath.split("/")[1];
                    var Ktkid = tableModel[selectedRow].KTKID;
                    selectedKtkIdList.push(Ktkid);
                }
                var params = {
                    KTKIDLIST_TRNS: selectedKtkIdList.toString(),
                    I_LOCATION: "PLT",
                    I_PALLETNO: palletNo,
                    I_USER: this.appData.user.userID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Manual/updateBilletLocationXqry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                else
                    this.handleCancel();
                this.getBilletList();
            },
            onOpenDownPalletDialog: function (oEvent) {
                var oView = this.getView();
                var oDialog = oView.byId("editBilletDownPalletFLM");
                if (!oDialog) {
                    this.getView().byId("editBilletDownPalletFLM")?.destroyContent();
                    this.getView().byId("editBilletDownPalletFLM")?.destroy();
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.editBilletDownPalletFLM",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                this.appData.oDialog = oDialog;
                oDialog.open();
            },
            sendBilletRelayWay: function () {
                var location = "RLY";
                var tableModel = this.getView().byId("tblBilletMaster").getModel().oData;
                var oTable = this.getView().byId("tblBilletMaster");
                var selectedKtkIdList = [];
                var oSelectedRowLength = oTable.getSelectedContexts().length;
                for (i = 0; i < oSelectedRowLength; i++) {
                    var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                    var selectedRow = selectedRowPath.split("/")[1];
                    var Ktkid = tableModel[selectedRow].KTKID;
                    selectedKtkIdList.push(Ktkid);
                }

                var params = {
                    KTKIDLIST_TRNS: selectedKtkIdList.toString(),
                    I_LOCATION: location,
                    I_USER: this.appData.user.userID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Manual/updateBilletLocationXqry",
                    params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                else {
                    sap.m.MessageToast.show("Kayıt başarılı");
                    this.handleCancel();
                }
            },
            onSendBilletRelay: function () {
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("Seçili kütüğü röle yoluna göndermek istiyor musunuz?"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.sendBilletRelayWay();
                                this.handleCancel();
                            } else if (oAction == "HAYIR") {
                                this.handleCancel();
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },

            onMenuAction: function (oEvent) {
                var selectedItem = oEvent.getParameter("item").mAggregations.tooltip;
                switch (selectedItem) {
                    case "0":
                        this.onSendBilletRelay();
                        break;
                    case "1":
                        this.onOpenDownPalletDialog();
                        break;
                }
            },
            billetItemSelected: function (oEvent) {
                var stat = this.getView().byId("tblBilletMaster").getSelectedItems().length;
                var rejectedButton = this.getView().byId("btnReject");
                var manualActionsButton = this.getView().byId("btnManualActions");
                if (stat > 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
                    //   rejectedButton.setEnabled(true);
                    manualActionsButton.setEnabled(false);
                }
                else if (stat == 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
                    //  rejectedButton.setEnabled(true);
                    manualActionsButton.setEnabled(true);
                }
                else {
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                    // rejectedButton.setEnabled(false);
                    manualActionsButton.setEnabled(false);
                }
                //Teyit Kontrolü
                var selectedItems = this.getView().byId("tblBilletMaster").getSelectedItems();
                var selectedLength = selectedItems.length;
                var searchData = this.getView().byId("tblBilletMaster").getModel().oData;
                var confirmCount = 0;
                var oTable = this.getView().byId("tblBilletMaster");

                for (var index = 0; index < selectedLength; index++) {
                    var selectedRows = oTable.getSelectedContexts()[index].sPath;
                    var selectedRow = selectedRows.split("/")[1];

                    var ktkid= searchData[selectedRow].KTKID;
                    var response2 = TransactionCaller.sync(
                        "MES/UI/Filmasin/Package/checkStatusT",
            
                        {
                          I_KTKID:ktkid,
                        },
                        "O_JSON"
                      );
                      
                     
                    if( response2[0].Rowsets.Rowset.Row?.ENTRY_ID!=null &&  response2[0].Rowsets.Rowset.Row?.ENTRY_ID!="---"){
                        this.getView().byId("btnReject").setEnabled(false);
                        sap.m.MessageToast.show("Seçilen kangallarda teyit verilmişler var. Teyit verilmiş kangallarda işlem yapılamaz!");
                        return;

                    }
                    else {
                        this.getView().byId("btnReject").setEnabled(true);
                    }
                }

                // var oTable = this.getView().byId("tblBilletMaster");
                // var selectedRows = oTable.getSelectedContexts()[0].sPath;
                //     var selectedRow = selectedRows.split("/")[1];
                // var ktkid= searchData[selectedRow].KTKID;
                //     var response2 = TransactionCaller.sync(
                //         "MES/UI/Filmasin/Package/checkStatusT",
            
                //         {
                //           I_KTKID:ktkid,
                //         },
                //         "O_JSON"
                //       );
                      
                //       var ObjArr = Array.isArray(response2[0].Rowsets.Rowset.Row)
                //        ? response2[0].Rowsets.Rowset.Row
                //      : new Array(response2[0].Rowsets.Rowset.Row);
                     
                //     if( response2[0].Rowsets.Rowset.Row.ENTRY_ID!=null){
                //         this.getView().byId("btnReject").setEnabled(false);
                //         sap.m.MessageToast.show("Seçilen kangallarda teyit verilmişler var. Teyit verilmiş kangallarda işlem yapılamaz!");
                //     }
                //     else {
                //         this.getView().byId("btnReject").setEnabled(true);
                //     }
                    

                
            },
            refreshData: function (oEvent) {
                this.getBilletList();
                this.getView().byId("btnManualActions").setEnabled(false);
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
                if (this.intervalHandle) {clearInterval(this.intervalHandle)};
            },
        });
    }
);
