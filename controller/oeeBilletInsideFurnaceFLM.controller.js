sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "customActivity/controls/MessageBox",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
        "sap/m/Dialog",
        "customActivity/scripts/custom",
        "customActivity/scripts/customStyle",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterType",
        "sap/m/Text",
        "sap/m/TextArea"
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        TransactionCaller,
        Fragment,
        Dialog,
        customScripts,
        customStyle,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        Text,
        TextArea
    ) {
        //"use strict";
        var that;

        return Controller.extend(
            "customActivity.controller.oeeBilletInsideFurnaceFLM",
            {
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
                    this.getBilletList();
                    //Filtreleme için 5sn.de bir yenileme iptal
                    this.modelServices();
                    this.getActAUFNR();
                    this.getFG();
                    
                },
                handleEscape: function(pEscapePending) {
                    // Depending on the use case, call pEscapePending.resolve() or pEscapePending.reject() to overwrite the default behavior.
                    pEscapePending.resolve();
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


                getActAUFNR: function (oEvent) {

                     document.getElementById(this.getView().byId("fl")?.sId+"-bdi")?.classList.add("neon");
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


                    var planlananKutuk= iv_data[0]?.modelData?.planlananMiktar.Rowsets.Rowset.Row.Y_URETILECEK_PAKSAY;
                    var uretilenkutuk= iv_data[0]?.modelData?.uretilenMiktar.Rowsets.Rowset.Row.URETILEN_KUTUK_SAYISI;
                    var farkx=iv_data[0]?.modelData?.fark.Rowsets;
                    iv_scope.getView().byId("uretimMiktar")?.setText(planlananKutuk+"-"+uretilenkutuk+"-"+farkx);



                    iv_scope.getView().byId("sipno").setText(myModel3?.oData[0]?.AUFNR);
                    iv_scope.getView().byId("malzemekodu").setText(myModel3?.oData[0]?.MATNR);
                    iv_scope.getView().byId("filmkalite").setText(myModel3?.oData[0]?.MAKTX);

                    var icon = iv_data[0]?.modelData?.pcoValues?.Rowsets?.Rowset?.Row?.FIRIN_GIRIS_KTKID_YOLVER;
                    var kantar = iv_data[0]?.modelData?.pcoValues?.Rowsets?.Rowset?.Row?.FIRIN_GIRIS_KANTAR_DOLU_BOS;
                    var ktkamount = iv_data[0]?.modelData?.pcoValues?.Rowsets?.Rowset?.Row?.PLC_FRN_ICI_KTK_SAYISI;
                    var isOTO = iv_data[0]?.modelData?.pcoValues?.Rowsets?.Rowset?.Row?.FIRIN_GIRIS_BOLGESI_OTO_MANUEL;

                    if (isOTO == "1") {

                        iv_scope.getView().byId("icontrue2").setVisible(true);
                        iv_scope.getView().byId("iconfalse2").setVisible(false);

                        iv_scope.getView().byId("Otomatik").setVisible(true);
                        iv_scope.getView().byId("Manuel").setVisible(false);
                    }
                    else {

                        iv_scope.getView().byId("icontrue2").setVisible(false);
                        iv_scope.getView().byId("iconfalse2").setVisible(true);

                        iv_scope.getView().byId("Otomatik").setVisible(false);
                        iv_scope.getView().byId("Manuel").setVisible(true);
                        
                    }





                    if (icon == "0") {

                        iv_scope.getView().byId("icontrue").setVisible(true);
                        iv_scope.getView().byId("iconfalse").setVisible(false);
                    }
                    else {

                        iv_scope.getView().byId("icontrue").setVisible(false);
                        iv_scope.getView().byId("iconfalse").setVisible(true);
                    }


                    if (kantar == "0") {

                        iv_scope.getView().byId("kantarDolu").setVisible(true);
                        iv_scope.getView().byId("kantarBos").setVisible(false);
                    }
                    else {

                        iv_scope.getView().byId("kantarDolu").setVisible(false);
                        iv_scope.getView().byId("kantarBos").setVisible(true);
                    }
                    iv_scope.getView().byId("frcpconumber").setText("-"+ktkamount);


                    iv_scope.getFG();

                    












                    return
                },














                onOpenRejectDialog: function (oEvent) {
                    var selectedBilletLength = this.byId("tblBilletMaster").getSelectedItems().length;
                    var noBilletSelected = this.appComponent.oBundle.getText("OEE_LABEL_ERROR_NO_BILLET_SELECTED");
                    if (selectedBilletLength <= 0) {

                        var messageText = noBilletSelected;
                        
                        MessageBox.error(messageText)





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
                    this.getBilletDetail();
                    this.getBilletRejectType();
                },
                getBilletLocationList: function () {
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/Manual/getBilletLocationListQry"
                    );
                    if (!tRunner.Execute()) {

                        var messageText = tRunner.GetErrorMessage();
                        
                        MessageBox.error(messageText);




                        return null;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);
                    this.getView().setModel(oModel, "locationModel");
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
                onUpdateBilletWeight: function (oEvent) {
                    var weight = this.getView().byId("weightInput").getValue();
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
                        I_WEIGHT: parseInt(weight),
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/Manual/updateBilletWeightXqry",
                        params
                    );
                    if (!tRunner.Execute()) {


                        var messageText = tRunner.GetErrorMessage();
                       
                        MessageBox.error(messageText);


                        return null;
                    }
                    else
                        this.handleCancel();
                    this.getBilletList();
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                },
                onUpdateBilletLocation: function (oEvent) {
                    var location = this.getView().byId("locationCombobox").getSelectedKey();
                    var tableModel = this.getView().getModel("confirmBilletList").oData;
                    var oTable = this.getView().byId("tblBilletMaster");
                    var selectedKtkIdList = [];
                    var oSelectedRowLength = oTable.getSelectedContexts().length;
                    for (i = 0; i < oSelectedRowLength; i++) {
                        var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                        var selectedRow = selectedRowPath.split("/")[1];
                        var Ktkid = tableModel[selectedRow].KTKID;
                        var diameter = tableModel[selectedRow].Y_CAP_FLM_MM;
                        var workcenterid = this.appData.node.workcenterID;
                        selectedKtkIdList.push(Ktkid);
                    }

                    var params = {
                        KTKIDLIST_TRNS: selectedKtkIdList.toString(),
                        I_LOCATION: location,
                        I_DIAMETER: diameter,
                        I_WORKCENTERID: workcenterid
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/Manual/updateBilletLocationXqry",
                        params
                    );
                    if (!tRunner.Execute()) {



                        var messageText = tRunner.GetErrorMessage();
                       
                        MessageBox.error(messageText);

                        return null;
                    }
                    else
                        this.handleCancel();
                    this.getBilletList();
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                },
                /*	validationRejectDialog : function(oEvent){
                    	
                    if(this.appData.intervalState  == true)
                        this.changeIntervalState();
                              var selectedBilletLength = this.byId(
                                "tblBilletMaster"
                              ).getSelectedItems().length;
                              var noBilletSelected = this.appComponent.oBundle.getText(
                                "OEE_LABEL_ERROR_NO_BILLET_SELECTED"
                              );
                              if (selectedBilletLength <= 0) {
                                MessageBox.error(noBilletSelected);
                                return false;
                              }
                    var list = this.getView().getModel('confirmBilletList')?.getData();
                //	var mnmx = list.reduce(([prevMin,prevMax], e) =>[Math.min(prevMin, e.BILLET_SEQ), Math.max(prevMax, e.BILLET_SEQ)], [Infinity, -Infinity]);
                    var slist = new Array();
                    tbl.getSelectedContextPaths().forEach(
                //		e => slist.push(parseInt(e.split('/')[1]))
                        function(e){slist.push(parseInt(e.split('/')[1]))}
                    );
                    },
                */



                addBilletToFurnaceDialog: function (oEvent) {
                    MessageBox.error(
                        this.appComponent.oBundle.getText("OEE_LABEL_MAUAL_BILLET_ENTRY"),
                        {
                            actions: [
                                this.appComponent.oBundle.getText("EVET"),
                                this.appComponent.oBundle.getText("HAYIR"),

                            ],
                            onClose: function (oAction) {
                                if (oAction == "EVET") {
                                    this.onConfirmAddBillet();
                                } else {
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                },


                callAddBillet: function (p_this, p_data) {
                    p_this.handleCancel();

                    var messageText = "Kütük ekleme başarılı";
                    var oTextArea = new Text("textBox", { text: messageText });

                    oTextArea.addStyleClass("cNo");

                    sap.m.MessageToast.show(messageText);
                },

                onConfirmAddBillet: function () {
                    var plant = this.appData.plant;
                    var workcenterid = this.appData.node.workcenterID;
                    var table = "SEHPA1";
                    var kutuks = "1";
                    var location = "FRG";
                    var params = {
                        I_PLANT: plant,
                        I_WORKCENTER: workcenterid,
                        I_KUTUKS: kutuks,
                        I_LOCATION: location,
                        I_TABLE: table
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/Manual/insertBilletToFurnaceXqry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callAddBillet);
                },



                callBilletDetail: function (p_this, p_data) {
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(p_data.Rowsets.Rowset[0]);
                    p_this.getView().setModel(oModel, "rejectionModel");
                },

               openFragment_errors: function () {
                    if (!this._oDialog1) {
                      this._oDialog1 = sap.ui.xmlfragment(
                        "Fragment4",
                        "customActivity.fragmentView.errorMessages",   
                        this
                      );
                      this.getView().addDependent(this._oDialog1);
                    }
                    this._oDialog1.open();

                    

                    this.ErrorMessages();
                   
                  },
               onCancelFrag2: function () {
                    this._oDialog1.close();
                  },

                  ErrorMessages : function(){
                    var response = TransactionCaller.sync(
                        "MES/Itelli/FLM/ALERT/T_ERROR_MESSAGES_FRG",
            
                        {
                          
                        },
                        "O_JSON"
                      );
                      
                      var ObjArr = Array.isArray(response[0].Rowsets.Rowset.Row)
                       ? response[0].Rowsets.Rowset.Row
                     : new Array(response[0].Rowsets.Rowset.Row);
                     var fragmentModel = new sap.ui.model.json.JSONModel(ObjArr);
                     sap.ui.core.Fragment.byId("Fragment4", "errors").setModel(fragmentModel);
                      sap.ui.core.Fragment.byId("Fragment4", "errors").getModel().refresh();
                    },

                getBilletDetail: function (param) {
                    var plant = this.appData.plant;
                    var tableModel = this.getView().getModel("confirmBilletList").oData;
                    var oTable = this.getView().byId("tblBilletMaster");
                    var selectedRows = oTable.getSelectedContexts()[0]?.sPath;
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
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/getTypeOfRejectQry"
                    );
                    tRunner.ExecuteQueryAsync(this, this.callRejectType);
                },

                callRejectReason: function (p_this, p_data) {
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(p_data.Rowsets.Rowset[0]);
                    p_this.getView().setModel(oModel, "rejectedNotifReasons");
                },

                onSelectRejectType: function (oEvent) {
                    var plant = this.appData.plant;
                    var selectRejectType = this.getView().byId("selectType");
                    var RejectType = selectRejectType.getSelectedKey();
                    var params = { "Param.1": RejectType, "Param.2": plant };
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/getReasonOfRejectQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callRejectReason);
                    selectRejectType.setValueState("Success");
                },
                callRejectDetail: function (p_this, p_data) {
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(p_data.Rowsets.Rowset[0]);
                    p_this.getView().setModel(oModel, "rejectedNotifDetails");
                },
                onSelectRejectReason: function (oEvent) {
                    var plant = this.appData.plant;
                    var selectRejectReason = this.getView().byId("selectReason");
                    var RejectType = selectRejectReason.getSelectedKey();
                    var params = { "Param.1": RejectType, "Param.2": plant };
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/getDetailOfReasonQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callRejectDetail);
                    selectRejectReason.setValueState("Success");
                },
                onSelectRejectDetail: function (oEvent) {
                    var selectRejectDetail = this.getView().byId("selectDetail");
                    selectRejectDetail.setValueState("Success");
                },
                callConfirmReject: function (p_this, p_data) {
                    p_this.handleCancel();


                    var messageText = "Uygunsuzluk kaydedildi.";
                    var oTextArea = new Text("textBox", { text: messageText });

                    oTextArea.addStyleClass("cNo");

                    sap.m.MessageToast.show(messageText);
                },

                /*25.09.2020*/
                onConfirmBilletReject: function (oEvent) {
                    var tableModel = this.getView().getModel("confirmBilletList").oData;
                    var oTable = this.getView().byId("tblBilletMaster");
                    var typeSelect = this.getView().byId("selectType");
                    var reasonSelect = this.getView().byId("selectReason");
                    var detailSelect = this.getView().byId("selectDetail");
                    if(oSelectedRowLength >1){
                    var selectedKtkIdList = [];
                    var oSelectedRowLength = oTable.getSelectedContexts().length;
                    for (i = 0; i < oSelectedRowLength; i++) {
                        var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                        var selectedRow = selectedRowPath.split("/")[1];
                        var Ktkid = tableModel[selectedRow].KTKID;
                        selectedKtkIdList.push(Ktkid);
                    }}
                    else{
                        var selectedRowPath = oTable.getSelectedContexts()[0].sPath;
                        var selectedRow = selectedRowPath.split("/")[1];
                        var selectedKtkIdList = tableModel[selectedRow].KTKID;
                        
                    }

                    var plant = this.appData.plant;
                    var workcenterid = this.appData.node.workcenterID;
                    var reasonType = this.getView().byId("selectType").getSelectedKey();
                    var reason = this.getView().byId("selectReason").getSelectedKey();
                    var detail = this.getView().byId("selectDetail").getSelectedItem()?.getText();
                    var user = this.appData.user.userID;
                    var desc = this.byId("description").mProperties.value;
                    var reasonText = reasonSelect.getSelectedItem()?.getText();
                    if (detail != undefined)
                        var detailKey = this.getView().byId("selectDetail").getSelectedKey();
                    //Kontrol Şartları
                    if (reasonType == "") {
                        typeSelect.setValueState("Error");

                        var messageText = "Uygunsuzluk türü seçmelisiniz!";
                        var oTextArea = new Text("textBox", { text: messageText });

                        oTextArea.addStyleClass("cNo");

                        sap.m.MessageToast.show(messageText);
                        return null;
                    }
                    if (reason == "") {
                        typeSelect.setValueState("Success");
                        reasonSelect.setValueState("Error");

                        var messageText = "Uygunsuzluk nedeni seçmelisiniz!";
                        var oTextArea = new Text("textBox", { text: messageText });

                        oTextArea.addStyleClass("cNo");

                        sap.m.MessageToast.show(messageText);
                        return null;
                    }
                    var detailCount = this.getView().getModel("rejectedNotifDetails").oData.Row?.length;
                    if (detailCount != undefined && detailCount > 0 && detail == undefined) {
                        typeSelect.setValueState("Success");
                        reasonSelect.setValueState("Success");
                        detailSelect.setValueState("Error");

                        var messageText = "Bu uygunsuzluk nedeni için detay seçmelisiniz! ";
                        var oTextArea = new Text("textBox", { text: messageText });

                        oTextArea.addStyleClass("cNo");

                        sap.m.MessageToast.show(messageText);
                        return null;
                    }
                    typeSelect.setValueState("Success");
                    reasonSelect.setValueState("Success");
                    detailSelect.setValueState("Success");
                    // Kontrol Şartları
                    var params = {
                        I_WORKCENTERID: workcenterid,
                        I_REASON_TYPE: reasonType,
                        I_REASON: reason,
                        I_DESCRIPTION: desc,
                        I_DETAIL: detail,
                        I_REASONTEXT: reasonText,
                        I_DETAILKEY: detailKey,
                        ElementList_TRNS: selectedKtkIdList.toString(),
                        I_USER: user,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/Integration/OPC/FLM/BilletReject/insertBilletRejectReasonXqry",
                        params
                    );
                    var that = this;
                    MessageBox.error("Devam etmek istiyor musunuz?.", {
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
                /*25.09.2020*/

                callBilletList: function (p_this, p_data) {
                    var tableData = [];
                    var characteristic = [];
                    var rows = p_data.Rowsets.Rowset[0].Row;
                    var werks = p_this.appData.plant;
                    var workcenterID = p_this.appData.node.workcenterID;
                    var aufnr = p_this.appData.selected.order.orderNo;
                    var boolean;
                    if (rows != undefined) {
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

                        for (var i = 0; i < tableData.length; i++) {
                            if (tableData[i].SIGNAL_POINT != "Fırın Girişi" && tableData[i].STATUS == "ERR")
                                tableData[i].COLOR = "Error";
                            //  else if (p_data.Rowsets.Rowset[0].Row[i].KTKID == 30)
                            //        p_data.Rowsets.Rowset[0].Row[i].COLOR = "Approved";
                        }
                    }
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(tableData);
                    p_this.getView().setModel(oModel, "confirmBilletList");


                    //Fırın içindeki kütükler
                    var tableDataBIF = tableData.filter(x => x.SIGNAL_POINT == "FIRIN İÇİ");
                    var oModelBIF = new sap.ui.model.json.JSONModel();
                    oModelBIF.setData(tableDataBIF);
                    p_this.getView().setModel(oModelBIF, "confirmBilletListBIF");

                    

                    var row = p_this.getView().getModel("confirmBilletList").oData.length;
                    if(row!=undefined){
                       var array= p_this.getView().getModel("confirmBilletList").oData;

                        for (let i = 0; i < row; i++) {

                            if(array[i].TEORIK=="X"){

                                document.getElementById(p_this.getView().byId("tblBilletMaster").getItems()[i].sId+"_cell8").classList.add("lightYellow");
                            
                            }
                            
                  }
                }



                    // Fırın Girişi kütük
                    var tableDataBEF = tableData.filter(x => x.SIGNAL_POINT == "FIRIN GİRİŞİ");
                    var oModelBEF = new sap.ui.model.json.JSONModel();
                    oModelBEF.setData(tableDataBEF);
                    p_this.getView().setModel(oModelBEF, "confirmBilletListBEF");


                    var row2 = p_this.getView().getModel("confirmBilletListBEF").oData.length;
                    if(row2!=undefined){
                       var array2= p_this.getView().getModel("confirmBilletListBEF").oData;

                        for (let i = 0; i < row2; i++) {

                            if(array2[i].TEORIK=="X"){

                                document.getElementById(p_this.getView().byId("firstBillet").getItems()[i].sId+"_cell8").classList.add("lightYellow");
                            
                            }
                            
                  }
                }



                },

                openfragment: function () {
                    if (!this._oDialog1) {
                        this._oDialog1 = sap.ui.xmlfragment(
                            "fragmentOne",
                            "customActivity.fragmentView.furnaceSummary",
                            this
                        );
                        this.getView().addDependent(this._oDialog1);
                    }
                    this._oDialog1.open();

                },


                onCancelFrag1: function () {
                    this._oDialog1.close();
                },


                callBilletList2: function (p_this, p_data) {
                    var tableData = [];
                    var characteristic = [];
                    var rows = p_data.Rowsets.Rowset[0].Row;
                    var werks = p_this.appData.plant;
                    var workcenterID = p_this.appData.node.workcenterID;
                    var aufnr = p_this.appData.selected.order.orderNo;
                    var boolean;
                    if (rows != undefined) {
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

                    }
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(tableData);
                    p_this.getView().setModel(oModel, "confirmBilletList2");
                    // sap.ui.core.Fragment.byId("fragmentOne", "tblBilletMaster2").setModel(oModel);

                },

                summaryScreen: function (oEvent) {

                    this.appComponent.getRouter().navTo("activity", {

                        activityId: "Z_FURNACE_SUM"



                    });

                },


                getBilletList: function (oEvent) {
                    var chosenAufnr = this.getView()
                        .byId("searchFieldOrder")
                        .getSelectedKey();
                    var chosenQuality = this.getView()
                        .byId("searchFieldQuality")
                        .getValue();
                    var chosenDiameter = this.getView()
                        .byId("searchFieldCap")
                        .getSelectedKey();

                    var werks = this.appData.plant;
                    var workcenterid = this.appData.node.workcenterID;
                    //var aufnr = this.appData.selected.order.orderNo;
                    var params = {
                        "Param.1": chosenAufnr,
                        "Param.2": werks,
                        "Param.3": workcenterid,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/getBilletListForFurnaceQry",
                        params
                    );

                    tRunner.ExecuteQueryAsync(this, this.callBilletList);

                    //this.getInsideFurnaceCount();
                    this.getQualityFilter();
                    this.getCapFilter();
                },

                getBilletList2: function (oEvent) {
                    var chosenAufnr = this.getView()
                        .byId("searchFieldOrder")
                        .getSelectedKey();
                    var chosenQuality = this.getView()
                        .byId("searchFieldQuality")
                        .getValue();
                    var chosenDiameter = this.getView()
                        .byId("searchFieldCap")
                        .getSelectedKey();

                    var werks = this.appData.plant;
                    var workcenterid = this.appData.node.workcenterID;
                    //var aufnr = this.appData.selected.order.orderNo;
                    var params = {
                        "Param.1": chosenAufnr,
                        "Param.2": werks,
                        "Param.3": workcenterid,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/Itelli/oeeBilet/Q_Firin_Ici",
                        params
                    );


                    tRunner.ExecuteQueryAsync(this, this.callBilletList2);
                    this.openfragment();

                },





                /* 22.09*/
                setFilter: function (capValue, qualityValue, orderValue) {
                    //   if (capValue == "" && qualityValue == "" && orderValue == "")
                    this.getBilletList();
                    var filtCounter;
                    var gModel = this.getView().getModel("confirmBilletList");
                    var characteristic = gModel.getData();
                    var filteredCharacteristic = [];
                    filtCounter = 0;
                    if (capValue != "") {
                        for (j = 0; j < characteristic.length; j++) {
                            if (characteristic[j].Y_CAP_FLM_MM == capValue) {
                                filteredCharacteristic[filtCounter] = characteristic[j];
                                filtCounter++;
                            }
                        }
                    }
                    filtCounter = 0;
                    if (orderValue != "") {
                        for (j = 0; j < characteristic.length; j++) {
                            if (characteristic[j].AUFNR == orderValue) {
                                filteredCharacteristic[filtCounter] = characteristic[j];
                                filtCounter++;
                            }
                        }
                    }
                    filtCounter = 0;
                    if (qualityValue != "") {
                        for (j = 0; j < characteristic.length; j++) {
                            if (characteristic[j].Y_KALITE_KTK == qualityValue) {
                                filteredCharacteristic[filtCounter] = characteristic[j];
                                filtCounter++;
                            }
                        }
                    }

                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(filteredCharacteristic);
                    this.getView().setModel(oModel, "confirmBilletList");
                    // p_this.bindRawMaterialsToTable(p_data.Rowsets.Rowset[0]);

                    //Fırın içindeki kütükler
                    var tableDataBIF = filteredCharacteristic.filter(x => x.SIGNAL_POINT == "FIRIN İÇİ");
                    var oModelBIF = new sap.ui.model.json.JSONModel();
                    oModelBIF.setData(tableDataBIF);
                    p_this.getView().setModel(oModelBIF, "confirmBilletListBIF");
                },
                onSearch(oEvent) {
                    capValue = this.getView().byId("searchFieldCap").getSelectedKey();
                    qualityValue = this.getView()
                        .byId("searchFieldQuality")
                        .getSelectedKey();
                    orderValue = this.getView().byId("searchFieldOrder").getSelectedKey();
                    this.setFilter(capValue, qualityValue, orderValue);
                },

                getCapFilter: function () {
                    var aufnr = this.appData.selected.order.orderNo; var werks = this.appData.plant;
                    var workcenterID = this.appData.node.workcenterID;
                    var SIGNAL_POINT = "FRI";
                    var params = { "Param.1": aufnr, "Param.3": werks, "Param.4": workcenterID };
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
                    var params = { "Param.1": aufnr, "Param.3": werks, "Param.4": workcenterID };
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
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                    this.getView().byId("btnManualActions").setEnabled(false);
                },

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

                handleCancelBilletReturned: function () {
                    this.getView().byId("openReturnedBilletList").destroy();
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                    this.getView().byId("btnManualActions").setEnabled(false);
                },

                modelServices: function () {
                    var self = this;
                    this.intervalHandle = setInterval(function () {
                        if (window.location.hash == "#/activity/ZACT_BILLET_FRNC_FLM") {
                            if (self.appData.intervalState == true) {
                                self.getBilletList();
                                self.getAlert();
                                //console.clear();
                            }
                        }

                    }, 5000);

                    this.intervalControl = setInterval(function () {
                        if (window.location.hash == "#/activity/ZACT_BILLET_FRNC_FLM") {

                            self.getActAUFNR();
                            console.log("merhaba");
                        }
                        //console.clear();


                    }, 3000);
                },

                callGetAlert: function (p_this, p_data) {
                    var data = p_data.Rowsets.Rowset[0].Row;
                    if (data != undefined) {
                        var alertMessage = p_data.Rowsets.Rowset[0].Row[0].LONGTEXT;
                        var alertID = p_data.Rowsets.Rowset[0].Row[0].ID;
                            MessageBox.error(
                            p_this.appComponent.oBundle.getText(alertMessage),
                            {
                                actions: [
                                    p_this.appComponent.oBundle.getText("TAMAM"),

                                ],
                                onClose: function (oAction) {

                                    if (oAction == "TAMAM") {
                                        p_this.appData.intervalState = true;
                                        p_this.updateAlertStatus(alertID);
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
                    var shortText = "FRG_ALERT";
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
                        "MES/UI/AlertViewer/updateAlertStatusXqry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callUpdateAlert);
                },

                callUpdateAlert: function (p_this, p_that) {
                    p_this.appData.intervalState = true;

                },

                billetItemSelected: function (oEvent) {
                    var stat = this.getView().byId("tblBilletMaster").getSelectedItems().length > 0 ? true : false;
                    var rejectedButton = this.getView().byId("btnRejected");
                    var manualActionsButton = this.getView().byId("btnManualActions");
                    if (stat > 1) {
                        this.appData.intervalState = true;
                        this.changeIntervalState();
                        // rejectedButton.setEnabled(true);
                        manualActionsButton.setEnabled(false);
                    }
                    else if (stat == 1) {
                        this.appData.intervalState = true;
                        this.changeIntervalState();
                        //rejectedButton.setEnabled(true);
                        manualActionsButton.setEnabled(true);
                    }
                    else {
                        this.appData.intervalState = false;
                        this.changeIntervalState();
                        //  rejectedButton.setEnabled(false);
                        manualActionsButton.setEnabled(false);
                    }
                },



                izinVer: function (oEvent) {



                    this.getView().byId("firstBillet").setBusy(true);
                    this.getView().byId("tblBilletMaster").setBusy(true);


                    TransactionCaller.async(
                        "MES/Integration/OPC/FLM/BilletEntryToFurnance/insertBilletToFurnaceTrns_NEW",
                        {
                            I_MANUEL: "X",

                        },
                        "O_JSON",
                        this.izinVerCB,
                        this
                    );



                },

                izinVerCB: function (iv_data, iv_scope) {

                    if (iv_data[1] == "E") {

                        iv_scope.getView().byId("firstBillet").setBusy(false);
                        iv_scope.getView().byId("tblBilletMaster").setBusy(false);

                        var messageText = iv_data[0];
                        
                        MessageBox.error(messageText);


                        return;
                    } else {
                        sap.m.MessageToast.show("Başarılı");
                        iv_scope.getView().byId("firstBillet").setBusy(false);
                        iv_scope.getView().byId("tblBilletMaster").setBusy(false);
                        return;
                    }
                },



                getFG:function() {

                    var response = TransactionCaller.sync(
                        "MES/Integration/OPC/FLM/BilletEntryToFurnance/T_SELECT_SWITCH_DATA",
                        {

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        alert(response[0]);
                        return
                    }

                    var firing = response[0]?.Rowsets?.Rowset?.Row?.FIRIN_G;

                    if (firing === false){

                        sap.ui.getCore().applyTheme("sap_hcb");
                    }
                    else {
                        sap.ui.getCore().applyTheme("sap_bluecrystal");
                    }



                },



                fieldControl: function () {



                    var response = TransactionCaller.sync(
                        "MES/Integration/OPC/FLM/BilletEntryToFurnance/T_SELECT_SWITCH_DATA",
                        {

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        alert(response[0]);
                        return
                    }



                    if (!this._oDialog) {
                        this._oDialog = sap.ui.xmlfragment(
                            "fieldControl",
                            "customActivity.fragmentView.fieldControl",

                            this
                        );
                        this.getView().addDependent(this._oDialog);

                    }
                    this._oDialog.open();





                    var kamera = response[0]?.Rowsets?.Rowset?.Row?.KAMERA;
                    var konveyor = response[0]?.Rowsets?.Rowset?.Row?.KONVEYOR
                    var firing = response[0]?.Rowsets?.Rowset?.Row?.FIRIN_G;
                    var kantar = response[0]?.Rowsets?.Rowset?.Row?.KANTAR;


                    sap.ui.core.Fragment.byId("fieldControl", "FGS").setState(firing);
                    sap.ui.core.Fragment.byId("fieldControl", "konveyor").setState(konveyor);
                    sap.ui.core.Fragment.byId("fieldControl", "kamera").setState(kamera);
                    sap.ui.core.Fragment.byId("fieldControl", "GKantar").setState(kantar);








                },

                fieldControlClose: function () {


                    this._oDialog.close();

                },

                buttonSave: function () {

                    console.log("çalışıyor");

                    sap.ui.core.Fragment.byId("fieldControl","fieldControl").setBusy(true);
                    var firing = sap.ui.core.Fragment.byId("fieldControl", "FGS").getState();
                    var konveyor = sap.ui.core.Fragment.byId("fieldControl", "konveyor").getState();
                    var kamera = sap.ui.core.Fragment.byId("fieldControl", "kamera").getState();
                    var kantar = sap.ui.core.Fragment.byId("fieldControl", "GKantar").getState();

                    sap.ui.core.Fragment.byId("fieldControl","fieldControl").setBusy(true);

                    if (firing === false){

                        sap.ui.getCore().applyTheme("sap_hcb");
                    }
                    else {
                        sap.ui.getCore().applyTheme("sap_bluecrystal");
                    }



                    TransactionCaller.async(
                        "MES/Integration/OPC/FLM/BilletEntryToFurnance/T_UPDATE_SWITCHS",
                        {
                            I_FIRING: firing,
                            I_KONVEYOR: konveyor,
                            I_KAMERA: kamera,
                            I_KANTAR: kantar

                        },
                        "O_JSON",
                        this.buttonSaveCB,
                        this
                    );





                },

                buttonSaveCB: function (iv_data, iv_scope) {

                   if (iv_data[1] == "E") {
                            MessageBox.error(iv_data[0]);
                            return;
                   }

                   sap.ui.core.Fragment.byId("fieldControl","fieldControl").setBusy(false);
                },

                refreshData: function (oEvent) {
                    this.getBilletList();
                },

                onPressYolVer: function (oEvent) {

                    var response = TransactionCaller.sync(
                        "MES/Integration/OPC/FLM/BilletEntryToFurnance/T_PCO_YOL_VER",
                        {
                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return
                    }
                    else {
                        MessageBox.information("Yol ver sinyali gönderilmiştir.")
                    }




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
