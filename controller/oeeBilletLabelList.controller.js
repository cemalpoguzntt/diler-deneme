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
        "sap/m/Dialog",
        "sap/m/Label",
        "sap/m/Button",
        "sap/m/ButtonType",
        "customActivity/scripts/transactionCaller"
  
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
        Dialog,
        Label,
        Button,
        ButtonType,
        TransactionCaller
    ) {
        //"use strict";
        var that;
  
        return Controller.extend("customActivity.controller.oeeBilletLabelList", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */
  
            formatter: formatter,
  
            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.appData.intervalState = true;
                that = this;
  
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
                this.getKTKIDFilter();
                //Filtreleme için 5sn.de bir yenileme iptal
                this.modelServices();
                this.getView().byId("setLabelQuan").setValue(2);
                this.onChangeLabelQuan();
                
            },
            addRowColor: function () {
                var status;
                var items = this.getView().byId("tblBilletLabelMaster").getItems();
                for (i = 0; i < items.length; i++) {
                    items[i].removeStyleClass("Standart");
                    items[i].removeStyleClass("STNDRT");
                    items[i].removeStyleClass("HURDA");
                    items[i].removeStyleClass("S_HURDA");
                    items[i].removeStyleClass("IKINCI_KAL");
                    items[i].removeStyleClass("STD_DISI");
                    status = this.getView().getModel("confirmBilletLabelList").oData[i]
                        .BILLET_STATUS;
                    items[i].addStyleClass(status);
                }
            },
  
            addColumnBorders:function(){
  
              var row=sap.ui.core.Fragment.byId("orderFrag", "frag0").getItems()?.length;
              if(row!=undefined){
              for (let i = 0; i < row; i++) {
                  document.getElementById(sap.ui.core.Fragment.byId("orderFrag", "frag0").getItems()[i].sId+"_cell5").classList.add("qqq");
                  document.getElementById(sap.ui.core.Fragment.byId("orderFrag", "frag0").getItems()[i].sId+"_cell7").classList.add("qqq");
                  document.getElementById(sap.ui.core.Fragment.byId("orderFrag", "frag0").getItems()[i].sId+"_cell9").classList.add("qqq");
                  document.getElementById(sap.ui.core.Fragment.byId("orderFrag", "frag0").getItems()[i].sId+"_cell11").classList.add("qqq");
                  document.getElementById(sap.ui.core.Fragment.byId("orderFrag", "frag0").getItems()[i].sId+"_cell13").classList.add("qqq");
                }}
            },
  
            onOpenRejectDialog: function (oEvent) {
                var selectedBilletLength = this.byId(
                    "tblBilletLabelMaster"
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
                this.getBilletRejectType();
            },
  
            getBilletDetail: function (oEvent) {
                var plant = this.appData.plant;
                var tableModel = this.getView().getModel("confirmBilletLabelList")
                    .oData;
                var oTable = this.getView().byId("tblBilletLabelMaster");
                var selectedRows = oTable.getSelectedContexts()[0].sPath;
                var selectedRow = selectedRows.split("/")[1];
                var Ktkid = tableModel[selectedRow].KTKID;
                /* this.getView().byId("rejectedKtkid").setSelectedKey(Ktkid);*/
                var params = { "Param.1": Ktkid };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getKTKIDForRejectQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletDetail);
            },
  
            getBilletRejectType: function (oEvent) {
                var plant = this.appData.plant;
                var params = { "Param.1": plant };
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletReject/getRejectTypesBilletMonitorQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callRejectType);
            },
            callRejectType: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "rejectedNotifTypes");
            },
  
            callRejectReasonForType: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "rejectedNotifReasons");
            },
  
            callRejectReason: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "rejectedNotifReasonSec");
            },
  
            onSelectRejectType: function (oEvent) {
                var params = {
                    "Param.1": oEvent.getSource().getSelectedKey(),
                    "Param.2": this.appData.plant,
                };
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletReject/getRejectReasonBilletMonitorQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callRejectReasonForType);
            },
            onSelectRejectReason: function (oEvent) {
                var params = { "Param.1": oEvent.getSource().getSelectedKey() };
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletReject/getRejectReasonBlletMonitorSecQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callRejectReason);
            },
  
            getKTKIDFilter: function () {
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getFilterKTKIdMonitorQry"
                );
                if (!tRunner.Execute()) return null;
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "ktkFilterModel");
            },
            callBilletList: function (p_this, p_data) {
  
               var modelArr = p_data.Rowsets.Rowset[0].Row;
  
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
  
                // var etiket_durumu = p_this.getView().byId("box2").getValue();
                // if(etiket_durumu=="SRT"){
                //  modelArr= modelArr.filter((i) => (i.LABEL_STATUS=="SRT"||i.LABEL_STATUS=="BASILMADI"));
                // }
                // else if(etiket_durumu=="TEL"){
                // modelArr= modelArr.filter((i) => (i.LABEL_STATUS=="TEL"||i.LABEL_STATUS=="BASILMADI"));
                // }
                // else if (etiket_durumu=="BASILMADI"){
                // modelArr= modelArr.filter((i) => (i.LABEL_STATUS=="BASILMADI"));
                // }
                // else if (etiket_durumu=="TUMU"){
                // modelArr= modelArr.filter((i) => (i.LABEL_STATUS=="TEL"||i.LABEL_STATUS=="BASILMADI")||i.LABEL_STATUS=="SRT");
                // }
                // else {
                //     MessageBox.warning("Lütfen Etiket Durumu Seçiniz");
                // }
                
                oModel.setData(modelArr);   
                p_this.getView().setModel(oModel, "confirmBilletLabelList");
                p_this.addRowColor();
            },
  
            getBilletList: function (oEvent) {
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var dateS = this.getView().byId("idDatePicker").getDateValue();
                var  dateS2 = this.getView().byId("idDatePicker").getSecondDateValue()

                var  d1 = moment(dateS).format('YYYY-MM-DD');
                var  d2 = moment(dateS2).format('YYYY-MM-DD');
                d1=d1+" 00:00:01";
                d2=d2+" 23:59:59";
                

                var params = {
                    "Param.1": werks,
                    "Param.2": workcenterid,
                    "Param.3": d1,
                    "Param.4": d2
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getBilletListForLabelQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletList);
                this.addRowColor();
            },
  
            onConfirmDialog: function () {
                this.handleCancel();
            },
  
            refreshData: function (oEvent) {
                this.getBilletList();
            },
  
            handleCancel: function () {
                if (!!this.appData.oDialog?.isOpen())
                    this.appData.oDialog.destroy();
                this.getBilletList();
                if (this.appData.intervalState == false)
                    this.changeIntervalState();
            },
  
  
            handleCancelBilletReject: function () {
                this.getView().byId("openBilletRejectDetails").destroy();
                this.getBilletList();
                this.appData.intervalState = false;
                this.changeIntervalState();
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
                    .oPropagatedProperties.oBindingContexts.confirmBilletLabelList.sPath.split(
                        "/"
                    )[1];
                var oData = this.getView().getModel("confirmBilletLabelList").oData[
                    selectedRow
                ];
                var ktkid = oData.KTKID;
                this.appData.oDialog = oDialog;
                oDialog.open();
                this.getBilletRejectDetail(ktkid);
            },
  
            callBilletMonitorReject: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                var oData = p_data.Rowsets.Rowset[0].Row;
                if (oData != undefined) {
                    oModel.setData(oData[0]);
                    p_this.getView().setModel(oModel, "rejectDetailModel");
                } else {
                    p_this.getView().setModel(oModel, "rejectDetailModel");
                }
            },
  
            getBilletRejectDetail: function (ktkid) {
                var params = { "Param.1": ktkid };
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletReject/getBilletMonitorRejectDetailsQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletMonitorReject);
            },
  
            callConfirmReject: function (p_this, p_data) {
                p_this.handleCancel();
                sap.m.MessageToast.show("Kayıt Başarılı");
                p_this.refreshData();
            },
  
            onConfirmBilletReject: function (oEvent) {
                var reason;
                var oTable = this.getView().byId("tblBilletLabelMaster");
                var tableModel = this.getView().getModel("confirmBilletLabelList")
                    .oData;
                var oReason = this.getView().byId("selectReasonSec");
                var oReasonForType = this.getView().byId("selectReason");
                var reasonFirst;
                var reasonFirstKey;
                var reasonSecond;
                var reasonSecondKey;
  
                if (oReasonForType.getSelectedItem()) {
                    reasonFirst = oReasonForType.getSelectedItem().getText();
                    reasonFirstKey = oReasonForType.getSelectedKey();
                }
                if (oReason) {
                    reasonSecond = oReason.getSelectedItem().getText();
                    reasonSecondKey = oReason.getSelectedKey();
                }
                if (!oReason || reasonSecond == "") {
                    reason = reasonFirst;
                    reasonKey = reasonFirstKey;
                } else {
                    reason = reasonSecond;
                    reasonKey = reasonSecondKey;
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
                var reasonType = this.getView().byId("selectType").getSelectedKey();
                var user = this.appData.user.userID;
                var desc = this.byId("description").mProperties.value;
                var params = {
                    I_WORKCENTERID: workcenterid,
                    I_REASON_TYPE: reasonType,
                    I_REASON: reason,
                    I_REASONKEY: reasonKey,
                    I_DESCRIPTION: desc,
                    ElementList_TRNS: selectedKtkIdList.toString(),
                    I_USER: user,
                };
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletLabelReject/insertBilletLabelRejectReasonXqry",
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
  
            changeIntervalState: function (oEvent) {
                oButton = this.getView().byId("chkIntervalState");
                if (this.appData.intervalState == true) {
                    this.appData.intervalState = false;
                    oButton.setType("Reject");
                    oButton.setText("Otomatik Güncelleme Kapalı");
                } else {
                    this.appData.intervalState = true;
                    this.getView().byId("chkIntervalState").setType("Accept");
                    oButton.setText("Otomatik Yenileme Açık");
                }
            },
  
            billetItemSelected: function (oEvent) {
                var stat =
                    this.getView().byId("tblBilletLabelMaster").getSelectedItems()
                        .length > 0
                        ? true
                        : false;
                var rejectedButton = this.getView().byId("btnReject");
                if (stat > 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
                    //   rejectedButton.setEnabled(true);
                } else if (stat == 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
                    //  rejectedButton.setEnabled(true);
                } else {
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                    // rejectedButton.setEnabled(false);
                }
  
                //Teyit Kontrolü
                var selectedItems = this.getView().byId("tblBilletLabelMaster").getSelectedItems();
                var selectedLength = selectedItems.length;
                var searchData = this.getView().getModel("confirmBilletLabelList").oData;
                var path;
                var confirmCount = 0;
                for (var index = 0; index < selectedLength; index++) {
                    path = selectedItems[index].oBindingContexts.confirmBilletLabelList.sPath.substring(1);
                    if (searchData[path].SUCCESS != "" && searchData[path].SUCCESS != null) confirmCount++;
                }
                if (confirmCount > 0) {
                    this.getView().byId("btnReject").setEnabled(false);
                    this.getView().byId("btnChangeCharacteristic").setEnabled(false);
                    this.getView().byId("btnChangeLabelWeight").setEnabled(false);
                    //this.getView().byId("printManual").setEnabled(false);
                    sap.m.MessageToast.show("Seçilen kangallarda teyit verilmiş kayıtlar mevcut. Teyit verilmiş kangallarda işlem yapılamaz!");
                }
                else {
                    this.getView().byId("btnReject").setEnabled(true);
                    this.getView().byId("btnChangeCharacteristic").setEnabled(true);
                    this.getView().byId("btnChangeLabelWeight").setEnabled(true);
                    this.getView().byId("printManual").setEnabled(true);
                }
                //Teyit Kontolü
  
            },
  
            modelServices: function () {
                var self = this;
  
                this.intervalHandle = setInterval(function () {
                    if (window.location.hash == "#/activity/ZACT_LABEL_LIST") {
                        if (self.appData.intervalState == true) {
                            self.getBilletList();
                        }
                        console.log(1);
                    }
                }, 10000);
            },
            time: function () {
                var day1 = new Date().getDate();
                var month1 = new Date().getMonth() + 1;
                var fullyear1 = new Date().getFullYear();
                return fullyear1 + "-" + month1 + "-" + day1;},
  
            onPressPrintManual: function () {
                var selectedBilletLength = this.byId(
                    "tblBilletLabelMaster"
                ).getSelectedItems().length;
  
                if (selectedBilletLength <= 0) {
                    MessageBox.error("Lütfen KTKID seçiniz!");
                    return;
                } else if (selectedBilletLength >= 2) {
                    MessageBox.error("Birden fazla kangal seçemezsiniz!!!");
                    return;
                } else {
  
                    var day = sap.ui.core.Fragment.byId("fragmentOne", "picker1").getDateValue().getDate();
  
                    var month= sap.ui.core.Fragment.byId("fragmentOne", "picker1").getDateValue().getMonth()+1;
  
                    var year=sap.ui.core.Fragment.byId("fragmentOne", "picker1").getDateValue().getFullYear();
  
                    var a =sap.ui.core.Fragment.byId("fragmentOne", "labelFormats").getSelectedKey();
                  var format=  a.substring(2)
  
  
                    var tarih= day + "/" + month + "/" + year;
                    if (tarih!=null){
                        var manuel= 'X';
                    }
  
                    var selectedNumber = this.getView().byId("tblBilletLabelMaster").getSelectedContextPaths()[0].split("/")[1];
                     var ktkId = this.getView().getModel("confirmBilletLabelList").oData[selectedNumber].KTKID;
  
  
                    var response2 = TransactionCaller.sync(
                    "MES/Itelli/CAN_FRN/ETIKET/EMRE_HADDE/T_SEND_FEATURES_LABEL", 
        
                    {
                        I_KTKID: ktkId,
                        I_MANUEL_DATE: tarih,
                        I_MANUEL: manuel,
                        I_FORMAT:format
  
                      
                    },
                    "O_JSON"
                  );
                 
                  if (response2[1] == "E") {
                    MessageBox.error(response2[0]);
                    return;
              }else{ 
                  this.onCancelFrag1();
                }
            }
            },
            openmanueltarih:function(){
                if (!this._oDialog1) {
                    this._oDialog1 = sap.ui.xmlfragment(
                      "fragmentOne",
                      "customActivity.fragmentView.Manuel_Etiket",    
                      this
                    );
                    this.getView().addDependent(this._oDialog1);
                      }
  
                    var response = TransactionCaller.sync(
                      "MES/Itelli/CAN_FRN/ETIKET/EMRE_HADDE/allLabelFormatsT",
                      {
                      
                        },
                      "O_JSON"
                  ); 
  
                  var tableModel2 = new sap.ui.model.json.JSONModel(); // json modelinde bir değişken yaratı
                  tableModel2.setData(response[0]?.Rowsets?.Rowset?.Row); //içinde data set ediliyor
                  sap.ui.core.Fragment.byId("fragmentOne", "labelFormats").setModel(tableModel2);
  
                  if(this.getView().byId("tblBilletLabelMaster").getSelectedContexts().length<1){
                    MessageBox.error("LÜtfen seçim yapınız")
                    this.onCancelFrag1();
                    return;
                  }
                  if(this.getView().byId("tblBilletLabelMaster").getSelectedContexts().length>1){
                    MessageBox.error("LÜtfen tek seçim yapınız")
                    this.onCancelFrag1();
                    return;
                  }
  
  
  
                  var tableModel = this.getView().getModel("confirmBilletLabelList").oData;
                  selectedRowPath=this.getView().byId("tblBilletLabelMaster").getSelectedContexts()[0].sPath;
                  var oTable = this.getView().byId("tblBilletLabelMaster");
                  var oSelectedRowLength = oTable.getSelectedContexts().length;
                  selectedRow = selectedRowPath.split("/")[1];
                  var aufnr= tableModel[selectedRow].AUFNR;
                  
                  
                 
                  var response2 = TransactionCaller.sync(
                    "MES/Itelli/CAN_FRN/ETIKET/EMRE_HADDE/formatChoice",
                    {
                      I_AUFNR:aufnr
                      },
                    "O_JSON"
                ); 
                sap.ui.core.Fragment.byId("fragmentOne", "labelFormats").setSelectedKey(response2[0]?.Rowsets?.Rowset?.Row.API_ADRESS)
  
  
                    
                  this._oDialog1.open();   
                  sap.ui.core.Fragment.byId("fragmentOne", "picker1").setValue(this.time());   
  
  
            },
            onCancelFrag1: function () {
                this._oDialog1.close();
              },
  
              
  
             
                
  
            callPrintManual: function (p_this, p_data, oAction) {
                sap.m.MessageToast.show("Manuel etiket çıkarma başarılı");
                p_this.handleCancel();
            },
  
            printLabelManual: function (oAction) {
                if (oAction != null) {
                    var tableModel = this.getView().getModel("confirmBilletLabelList")
                        .oData;
                    var oTable = this.getView().byId("tblBilletLabelMaster");
  
                    var oSelectedRowLength = oTable.getSelectedContexts().length;
                    var selectedRowPath = oTable.getSelectedContexts()[0].sPath;
                    var selectedRow = selectedRowPath.split("/")[1];
                    var ktkId = tableModel[selectedRow].KTKID;
                    var labelStatus = tableModel[selectedRow].LABEL_STATUS;
                    var paletNo = tableModel[selectedRow].PACKAGE_NUMBER;
  
                    var location = oAction;
                    var workcenterid = this.appData.node.workcenterID;
                    var plant = this.appData.plant;
                    var params = {
                        I_KTKID: ktkId,
                        I_LABEL_STATUS: labelStatus,
                        I_PALET_NO: paletNo,
                        I_WERKS: plant,
                        I_WORKCENTER: workcenterid,
                        I_LOCATION: location,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/Integration/Label/FLM/ManualLabel/insertFlmLabelParamXqry",
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
                                tRunner.ExecuteQueryAsync(that, that.callPrintManual);
                        }
                    });
                }
            },
  
            callLabelQuan: function () { },
  
            onChangeLabelQuan: function () {
                var labelQuan = this.getView().byId("setLabelQuan").getValue();
                var params = {
                    I_QUAN: labelQuan,
                };
                var tRunner = new TransactionRunner(
                    "MES/Integration/Label/FLM/updateLabelQuanXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callLabelQuan);
            },
  
            // getCurrentLabelQuan: function (oEvent) {
            //     var tRunner = new TransactionRunner(
            //         "MES/Integration/Label/FLM/getLabelQuan"
            //     );
            //     tRunner.ExecuteQueryAsync(this, this.callCurrentLabelQuan);
            // },
            // callCurrentLabelQuan: function (p_this, p_data) {
            //     var oModel = new sap.ui.model.json.JSONModel();
            //     oModel.setSizeLimit(10000);
            //     var labelQuan = p_data.Rowsets.Rowset[0].Row[0].LABEL_QUAN;
            //     p_this.getView().byId("setLabelQuan").setValue(labelQuan);
            // },
  
            onPressBilletConfirm: function (oEvent) {
                var type = oEvent.getSource().mProperties.type;
                var selectedRow = oEvent
                    .getSource()
                    .oPropagatedProperties.oBindingContexts.confirmBilletLabelList.sPath.split(
                        "/"
                    )[1];
                if (type == "Accept") {
                    sap.m.MessageBox.warning(
                        this.appComponent.oBundle.getText("Onaylıyor musunuz?"),
                        {
                            actions: [
                                this.appComponent.oBundle.getText("EVET"),
                                this.appComponent.oBundle.getText("HAYIR"),
                            ],
                            onClose: function (oAction) {
                                if (oAction == "EVET") {
                                    this.billetConfirmation(selectedRow);
                                } else {
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                } else if (type == "Reject") {
                    sap.m.MessageBox.warning(
                        this.appComponent.oBundle.getText("Onaylıyor musunuz?"),
                        {
                            actions: [
                                this.appComponent.oBundle.getText("EVET"),
                                this.appComponent.oBundle.getText("HAYIR"),
                            ],
                            onClose: function (oAction) {
                                if (oAction == "EVET") {
                                    this.retryConfirmation(selectedRow);
                                } else {
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                }
            },
  
            retryConfirmation: function (selectedRow) {
                var tableModel = this.getView().getModel("confirmBilletLabelList")
                    .oData;
                var oTable = this.getView().byId("tblBilletLabelMaster");
  
                var ID = tableModel[selectedRow].ID;
  
                var params = {
                    I_ID: ID
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/ConfirmationList/retryQueueConfirmXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callRetryConfirmation);
            },
  
            callRetryConfirmation: function (p_this, p_data) {
                sap.m.MessageToast.show("Teyit Gönderildi");
            },
  
  
  
            billetConfirmation: function (selectedRow) {
                var tableModel = this.getView().getModel("confirmBilletLabelList")
                                .oData;
                            var oTable = this.getView().byId("tblBilletLabelMaster");
            
                            var ktkid = tableModel[selectedRow].KTKID;
                TransactionCaller.async(
                    "MES/Integration/OPC/FLM/NEWCONF/T_CALL_FLM_DATA",
                    {
                        I_MANUEL:"X",
                        I_KTKID:ktkid
                    },
                    "O_JSON",
                    this.callBilletConfirmation,
                    this
                );
            },
            callBilletConfirmation: function (iv_data, iv_scope) {
                
            if(iv_data[1]=="S")
            {
                sap.m.MessageToast.show("Teyit Gönderildi");
            }
            else
            
            {
            
                MessageBox.error(iv_data[0]);
                return;
            
            }
            
            
            },
  
            onPressChangeLabel: function (oEvent) {
                var selectedBilletLength = this.byId("tblBilletLabelMaster").getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText("OEE_LABEL_ERROR_NO_BILLET_SELECTED");
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                }
  
                var oView = this.getView();
                var oDialog = oView.byId("ChangeLabelWeight");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.changeLabelWeight",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                this.appData.oDialog = oDialog;
                oDialog.open();
            },
            onSaveChangeLabelWeight: function (oEvent) {
                var inputLabelWeight = this.getView().byId("idquantity").getValue();
                if (inputLabelWeight == "") {
                    MessageBox.error("Boş bırakmayınız.");
                    return null;
                }
                var user = this.appData.user.userID;
                var oTable = this.getView().byId("tblBilletLabelMaster");
                var tableModel = this.getView().getModel("confirmBilletLabelList")
                    .oData;
                var selectedKtkIdList = [];
                var oSelectedRowLength = oTable.getSelectedContexts().length;
                for (i = 0; i < oSelectedRowLength; i++) {
                    var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                    var selectedRow = selectedRowPath.split("/")[1];
                    var Ktkid = tableModel[selectedRow].PACKAGE_ID;
                    selectedKtkIdList.push(Ktkid);
                }
                var params = {
                    ElementList_TRNS: selectedKtkIdList.toString(),
                    I_WEIGHT: inputLabelWeight,
                    I_USER: user
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/ChangeLabelWeight/changeLabelWeightXqry",
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
                            tRunner.ExecuteQueryAsync(that, that.callSaveLabelWeight);
                    }
                });
            },
            callSaveLabelWeight: function (p_this, p_data) {
                p_this.handleCancel();
                sap.m.MessageToast.show("Değişiklik Başarılı");
                p_this.refreshData();
            },
  
            onOpenChangeCharacteristicsDialog: function (oEvent) {
                var selectedBilletLength = this.byId("tblBilletLabelMaster").getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText("OEE_LABEL_ERROR_NO_BILLET_SELECTED");
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                }
  
                var oView = this.getView();
                var oDialog = oView.byId("changeCharacteristics");
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(
                        oView.getId(),
                        "customActivity.fragmentView.changeCharacteristics",
                        this
                    );
                    oView.addDependent(oDialog);
                }
                this.appData.oDialog = oDialog;
                oDialog.open();
                this.getChangeCharacteristicValues();
            },
            getChangeCharacteristicValues: function (oEvent) {
                var diameterCharacteristic = "Y_CAP_FLM_MM";
                var qualityCharacteristic = "Y_KALITE_FLM";
                var productionMethodCharacteristic = "Y_URETIM_YONTEMI_FLM";
                //Diameter Query
                var params = { "Param.1": diameterCharacteristic };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/ChangeCharateristics/getChangeCharacteristicsQry", params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setSizeLimit(1000);
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "diameterValues");
                //Diameter Query
                //Quality Query
                params = { "Param.1": qualityCharacteristic };
                tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/ChangeCharateristics/getChangeCharacteristicsQry", params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "qualityValues");
                //Quality Query
                //Production Type Query
                params = { "Param.1": productionMethodCharacteristic };
                tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/ChangeCharateristics/getChangeCharacteristicsQry", params
                );
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return null;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(oData[0]);
                this.getView().setModel(oModel, "productionTypeValues");
                //Production Type Query
                var oButton = this.getView().byId("btnSaveCharacteristics");
                oButton.setEnabled(false);
            },
            handleChangeCharacteristicComboValues: function (oEvent) {
                var oButton = this.getView().byId("btnSaveCharacteristics");
                var oValidatedComboBox = oEvent.getSource(),
                    sSelectedKey = oValidatedComboBox.getSelectedKey(),
                    sValue = oValidatedComboBox.getValue();
  
                if (!sSelectedKey && sValue) {
                    oValidatedComboBox.setValueState(sap.ui.core.ValueState.Error);
                    oValidatedComboBox.setValueStateText("Lütfen geçerli bir değer giriniz!!");
                    oButton.setEnabled(false);
                } else {
                    oValidatedComboBox.setValueState(sap.ui.core.ValueState.Success);
                    oButton.setEnabled(true);
                }
            },
            callSaveChangeCharacteristics: function (p_this, p_data) {
                p_this.handleCancel();
                sap.m.MessageToast.show("Değişiklik Başarılı");
                p_this.refreshData();
            },
            onSaveChangeCharacteristics: function (oEvent) {
                var selectedDiameter = this.getView().byId("selectDiameter").getSelectedKey();
                var selectedQuality = this.getView().byId("selectQuality").getSelectedKey();
                var selectedProduction = this.getView().byId("selectProduction").getSelectedKey();
                if (selectedDiameter == "" && selectedQuality == "" && selectedProduction == "") {
                    MessageBox.error("Alanlar boş geçilemez.");
                    return null;
                }
                var user = this.appData.user.userID;
                var oTable = this.getView().byId("tblBilletLabelMaster");
                var tableModel = this.getView().getModel("confirmBilletLabelList")
                    .oData;
                var selectedKtkIdList = [];
                var oSelectedRowLength = oTable.getSelectedContexts().length;
                for (i = 0; i < oSelectedRowLength; i++) {
                    var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                    var selectedRow = selectedRowPath.split("/")[1];
                    var Ktkid = tableModel[selectedRow].KTKID;
                    selectedKtkIdList.push(Ktkid);
                }
                var params = {
                    ElementList_TRNS: selectedKtkIdList.toString(),
                    I_DIAMETER: selectedDiameter,
                    I_QUALITY: selectedQuality,
                    I_PRODTYPE: selectedProduction,
                    I_USER: user
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/ChangeCharateristics/changeCharacteristicsXqry",
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
                            tRunner.ExecuteQueryAsync(that, that.callSaveChangeCharacteristics);
                    }
                });
            },
  
            openfragment5: function () {
                if (!this._oDialog5) {
                  this._oDialog5 = sap.ui.xmlfragment(
                    "orderFrag",
                    "customActivity.fragmentView.orderSummary", 
                    this
                  );
                  this.getView().addDependent(this._oDialog5);
                }
                this._oDialog5.open();
                this.ordersumm();
              },
      
      
      onCancelFrag5: function () {
                this._oDialog5.close();
              },
  
              ordersumm:function(){
                
                  if( this.getView().byId("idDatePicker").getDateValue()==null)
                  {alert("Lütfen From-To(Tarih Aralığı) alanını boş bırakmayınız");
                     return;}
  
                     var day1 = this.getView().byId("idDatePicker").getDateValue().getDate();
                     var month1 = this.getView().byId("idDatePicker").getDateValue().getMonth() + 1;
                     var fullyear1 = this.getView().byId("idDatePicker").getDateValue().getFullYear();
                     var date1 = fullyear1 + "-" + month1 + "-" + day1+" 00:00:00";
  
                     var day2 = this.getView().byId("idDatePicker").getSecondDateValue().getDate();
                     var month2 = this.getView().byId("idDatePicker").getSecondDateValue().getMonth() + 1;
                     var fullyear2 = this.getView().byId("idDatePicker").getSecondDateValue().getFullYear();
                     var date2 = fullyear2 + "-" + month2 + "-" + day2+" 23:59:59";
                    
  
                var response = TransactionCaller.sync(
                  "MES/Itelli/oeeBilet/orderSummary",
      
                  {
                     I_DATE1: date1,
                     I_DATE2: date2
                  },
                  "O_JSON"
                );
                
                var ObjArr = Array.isArray(response[0].Rowsets.Rowset.Row)
                 ? response[0].Rowsets.Rowset.Row
               : new Array(response[0].Rowsets.Rowset.Row);
               var Model = new sap.ui.model.json.JSONModel(ObjArr);
               sap.ui.core.Fragment.byId("orderFrag", "frag0").setModel(Model);
               this.addColumnBorders();
  
  
              },
          
  
  
            onPressBilletConfirmCancel: function (oEvent) {
                var path = oEvent.getSource().getParent().getBindingContextPath();
                path = path.split("/")[1];
                var rows = this.getView().getModel("confirmBilletLabelList").oData;
                var textMessage = "Teyidi iptal etmek istediğinize emin misiniz?";
                var data = rows[path];
                var user = this.appData.user.userID;
                var self = this;
  
                var oDialog = new Dialog({
                    title: "Yeniden Dene",
                    type: "Message",
                    content: [
                        new Label({
                            text: textMessage,
                        }),
                    ],
                    beginButton: new Button("id", {
                        type: ButtonType.Accept,
                        text: "Onayla",
                        press: function () {
                            sap.ui.getCore().byId("id").setEnabled(false);
                            window.setTimeout(function () {
                                var params = {
                                    I_CONF_NUMBER: data.CONF_NUMBER,
                                    I_CONF_COUNTER: data.CONF_COUNTER,
                                    I_ENTRYID: data.ENTRY_ID,
                                    I_AUFNR: data.AUFNR,
                                    I_KTKID: data.KTKID,
                                    I_USER: user
                                };

                                var response = TransactionCaller.sync(
                                    "MES/Integration/OPC/FLM/NEWCONF/confirmCancelFilmasin",
                                    {
                                    I_CONF_NUMBER: data.CONF_NUMBER,
                                    I_CONF_COUNTER: data.CONF_COUNTER,
                                    I_ENTRYID: data.ENTRY_ID,
                                    I_AUFNR: data.AUFNR,
                                    I_KTKID: data.KTKID,
                                    I_USER: user,
                                    I_QID:data.ID

                                  
                                    },
                                    "O_JSON"
                                  );
                               
                                    if(response[1]=="S"){

                                        MessageBox.information("İşlem Başarılı");

                                    }

                                    if (response[1]=="E"){


                                        MessageBox.error(response[0]);


                                    }





                                oDialog.close();
                            }, 500);
                        },
                    }),
                    endButton: new Button({
                        text: "İptal",
                        press: function () {
                            oDialog.close();
                        },
                    }),
                    afterClose: function () {
                        oDialog.destroy();
                        self.getBilletList();
                    },
                });
                oDialog.open();
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
  