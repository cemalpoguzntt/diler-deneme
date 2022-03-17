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
        "sap/ui/core/util/Export",
        "sap/ui/core/util/ExportTypeCSV",
        "customActivity/scripts/customStyle"
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
        Export,
        ExportTypeCSV,
        customStyle
    ) {
        //"use strict";
        var that;

        return Controller.extend("customActivity.controller.oeeBilletMonitor", {
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
                var today = new Date();
                setYest = (today.getDate()) + "." + (today.getMonth() + 1) + "." + today.getFullYear();
                setTom = (today.getDate()) + "." + (today.getMonth() + 1) + "." + today.getFullYear();
                this.getView().byId("idDatePicker").setValue(setYest + " - " + setTom);
                this.getBilletList();
                this.modelServices();
                this.getKTKIDFilter();
                this.getOrderFilter();



            },
            getDateTime: function (oEvent) {
                var dateS = oEvent.getSource().getValue();
                var dateValues = dateS.split(" - ");
                console.log(dateValues[0]);
                console.log(dateValues[1]);
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
                var selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.confirmBilletList.sPath.split("/")[1];
                var oData = this.getView().getModel("confirmBilletList").oData[selectedRow];
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oData);
                this.getView().setModel(oModel, "rejectDetailModel");
                this.appData.oDialog = oDialog;
                oDialog.open();
            },


            onSearch: function (oEvent) {

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
                var oModel = this.getView().getModel("confirmBilletList");
                var oData = oModel.oData;
                if (oData)
                    oData.filter(aFilters, FilterType.Applications);
                oModel.setData(oData);

            },

            callBilletList: function (p_this, p_data) {
                var tableData = p_data;
                /*  // database'den geldiği için yoruma alındı. 09.10.2020 //
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
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
                // oModel.setData(tableData);
                p_this.getView().setModel(oModel, "confirmBilletList");
                p_this.getOrderFilter();
                p_this.getKTKIDFilter();
                // p_this.bindRawMaterialsToTable(p_data.Rowsets.Rowset[0]);
                //p_this.onSearch();
            },

            getBilletList: function (oEvent) {
                var werks = this.appData.plant;
                var aufnr = this.appData.selected.order.orderNo;
                var workcenterid = this.appData.node.workcenterID;
                var dateS = this.getView().byId("idDatePicker").getValue();
                var ktkParameter = this.getView().byId("searchFieldKTKID").getValue();
                var orderParameter = this.getView().byId("searchFieldOrder").getValue();
                var pickerSecondDate = new Date(this.getView().byId("idDatePicker").getSecondDateValue())
                var tomorrowDay = new Date(pickerSecondDate);
                tomorrowDay.setDate(tomorrowDay.getDate() + 1);
                var secondaryDate = (tomorrowDay.getDate()) + "." + (tomorrowDay.getMonth() + 1) + "." + tomorrowDay.getFullYear();
                var dateValues = dateS.split(" - ");
                if (!orderParameter) orderParameter = "";
                if (!ktkParameter) ktkParameter = "";
                var params = { "Param.1": aufnr, "Param.2": dateValues[0], "Param.3": secondaryDate, "Param.4": orderParameter, "Param.5": ktkParameter, "Param.6": werks, "Param.7": workcenterid };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getBilletTrackingListQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletList);
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
                this.appData.oDialog.destroy();
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
                    name: "Sip. No",
                    template: {
                        content: "{AUFNR}"
                    }
                }, {
                    name: "Sip. S.",
                    template: {
                        content: "{AUFNR_SEQ}"
                    }
                }, {
                    name: "DNO",
                    template: {
                        content: "{CASTID}"
                    }
                }, {
                    name: "KTKID",
                    template: {
                        content: "{KTKID}"
                    }
                }, {
                    name: "Durum",
                    template: {
                        content: "{PRODUCT_STATUS}"
                    }
                }, {
                    name: "K. Kalite",
                    template: {
                        content: "{Y_KALITE_KTK}"
                    }
                }, {
                    name: "Ebat",
                    template: {
                        content: "{Y_EBAT}"
                    }
                }, {
                    name: "Boy",
                    template: {
                        content: "{Y_BOY_KTK}"
                    }
                }, {
                    name: "Cap",
                    template: {
                        content: "{Y_CAP_FLM_MM}"
                    }
                }, {
                    name: "M. Kalite",
                    template: {
                        content: "{Y_KALITE_FLM}"
                    }
                }, {
                    name: "ND",
                    template: {
                        content: "{Y_NERVUR_DUZ}"
                    }
                }, {
                    name: "Mensei",
                    template: {
                        content: "{Y_KUTUK_MENSEI}"
                    }
                }, {
                    name: "T. Tartim",
                    template: {
                        content: ""
                    }
                }, {
                    name: "G.Tartim",
                    template: {
                        content: "{ENTRY_WEIGHT}"
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
                    name: "Tur",
                    template: {
                        content: "{REASON_TYPE}"
                    }
                }, {
                    name: "Neden",
                    template: {
                        content: "{REASON}"
                    }
                }, {
                    name: "Neden Kodu",
                    template: {
                        content: "{REASONCODE}"
                    }
                }, {
                    name: "Aciklama",
                    template: {
                        content: "{DESCRIPTION}"
                    }
                },]
            },

            onDataExport: function (oEvent) {

                var aCols, oExcData, oSettings, oSheet;
                aCols = this.createColumnConfig();
                oExcData = this.getView().getModel("confirmBilletList").getProperty('/');
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
                oExport.setModel(this.getView().getModel("confirmBilletList"));

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
                var tableModel = this.getView().getModel("confirmBilletList").oData;
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
                var params = {"param.1":plant};
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletReject/getRejectTypesBilletMonitorQry",params
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
                    if (window.location.hash == "#/activity/ZACT_BILLET_MNTR")
                        if (self.appData.intervalState == true) {
                            self.getBilletList();
                            //self.callGetAlertList();
                            self.getAlert();
                        }
                    console.log(1);
                }, 10000);
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
                var tableModel = this.getView().getModel("confirmBilletList").oData;
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
                var tableModel = this.getView().getModel("confirmBilletList").oData;
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
                var searchData = this.getView().getModel("confirmBilletList").oData;
                var path;
                var confirmCount = 0;
                for (var index = 0; index < selectedLength; index++) {
                    path = selectedItems[index].oBindingContexts.confirmBilletList.sPath.substring(1);
                    if (searchData[path].SUCCESS == "S") confirmCount++;
                }
                if (confirmCount > 0) {
                    this.getView().byId("btnReject").setEnabled(false);
                    sap.m.MessageToast.show("Seçilen kangallarda teyit verilmişler var. Teyit verilmiş kangallarda işlem yapılamaz!");
                }
                else {
                    this.getView().byId("btnReject").setEnabled(true);
                }
                //Teyit Kontolü
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
                if (this.intervalHandle) clearInterval(this.intervalHandle);
            },
        });
    }
);
