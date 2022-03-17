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
        "customActivity/scripts/customStyle",
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
        customStyle
    ) {
        //"use strict";
        var that;

        return Controller.extend(
            "customActivity.controller.oeeBilletInsideFurnace",
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
                onOpenRejectDialog: function (oEvent) {
                 var selectedBilletLength = this.byId("tblBilletMaster").getSelectedItems().length;
                    var noBilletSelected = this.appComponent.oBundle.getText("OEE_LABEL_ERROR_NO_BILLET_SELECTED");
                    if (selectedBilletLength <= 0) {
                        MessageBox.error(noBilletSelected);
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
                        MessageBox.error(tRunner.GetErrorMessage());
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
                        MessageBox.error(tRunner.GetErrorMessage());
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
                        I_DIAMETER:diameter,
                        I_WORKCENTERID:workcenterid                        
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
                    sap.m.MessageBox.warning(
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
                    sap.m.MessageToast.show("Kütük ekleme başarılı");
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
                    var params = { "Param.1": RejectType ,"Param.2" : plant};
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
                    var params = { "Param.1": RejectType ,"Param.2" : plant };
                    var tRunner = new TransactionRunner(
                        "MES/UI/Filmasin/getDetailOfReasonQry",
                        params
                    );
                    tRunner.ExecuteQueryAsync(this, this.callRejectDetail);
		selectRejectReason.setValueState("Success");
                },
	     onSelectRejectDetail: function(oEvent) {
			         var selectRejectDetail = this.getView().byId("selectDetail");
				selectRejectDetail.setValueState("Success");
		},
                callConfirmReject: function (p_this, p_data) {
                    p_this.handleCancel();
                    sap.m.MessageToast.show("Uygunsuzluk kaydedildi");
                },

                /*25.09.2020*/
                onConfirmBilletReject: function (oEvent) {
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
                    var detail = this.getView().byId("selectDetail").getSelectedItem()?.getText();
                    var user = this.appData.user.userID;
                    var desc = this.byId("description").mProperties.value;
		var reasonText = reasonSelect.getSelectedItem()?.getText();
		if(detail != undefined)
                  		  var detailKey = this.getView().byId("selectDetail").getSelectedKey();
	//Kontrol Şartları
	if(reasonType == "")
	{
		typeSelect.setValueState("Error");
 		sap.m.MessageToast.show("Uygunsuzluk türü seçmelisiniz!");
 		return null;
	}
	if(reason == "")
	{	
		typeSelect.setValueState("Success");
		reasonSelect.setValueState("Error");
    		sap.m.MessageToast.show("Uygunsuzluk nedeni seçmelisiniz!");
    		return null;
	}
	var detailCount = this.getView().getModel("rejectedNotifDetails").oData.Row?.length; 
	if(detailCount!=undefined && detailCount >0 && detail == undefined)
	{
		typeSelect.setValueState("Success");
		reasonSelect.setValueState("Success");
		detailSelect.setValueState("Error");
    		sap.m.MessageToast.show("Bu uygunsuzluk nedeni için detay seçmelisiniz!");
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
		  I_DETAILKEY : detailKey,
                        ElementList_TRNS: selectedKtkIdList.toString(),
                        I_USER: user,
                    };
                    var tRunner = new TransactionRunner(
                        "MES/Integration/OPC/FLM/BilletReject/insertBilletRejectReasonXqry",
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
                        if (window.location.hash == "#/activity/ZACT_BILLET_FRNC")
                            if (self.appData.intervalState == true){
                                self.getBilletList();
                                  self.getAlert();
                            //console.clear();
                        }

                    }, 10000);
                },

  callGetAlert: function (p_this, p_data) {
  	  var data = p_data.Rowsets.Rowset[0].Row;
  	  if(data != undefined){
            var alertMessage = p_data.Rowsets.Rowset[0].Row[0].LONGTEXT;
            var alertID = p_data.Rowsets.Rowset[0].Row[0].ID;
      sap.m.MessageBox.warning(
                          p_this.appComponent.oBundle.getText(alertMessage),
                          {
                              actions: [
                                 p_this.appComponent.oBundle.getText ("TAMAM"),
                                  
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
  	  }else {
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


  updateAlertStatus:function(alertID){
              var params = {
                I_ALERTID: alertID
              };
              var tRunner = new TransactionRunner(
               "MES/UI/AlertViewer/updateAlertStatusXqry",
                params
              );
              tRunner.ExecuteQueryAsync(this, this.callUpdateAlert);
          },
  
  callUpdateAlert:function(p_this,p_that){
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
                refreshData: function (oEvent) {
                    this.getBilletList();
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
