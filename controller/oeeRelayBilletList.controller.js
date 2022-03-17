sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "customActivity/scripts/transactionCaller",
        "customActivity/scripts/custom",
        "customActivity/scripts/customStyleF",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterType",
        'sap/ui/core/library',
        "sap/ui/core/Core",
    ],
  
    function (
        Controller,
        JSONModel,
        MessageBox,
        TransactionCaller,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        FilterType,
        coreLibrary,
        Core,
    ) {
        //"use strict";
        var that;
        that=this;
        this.i = 0;
        this.t = 0;
        var globalTableData;
  
        return Controller.extend("customActivity.controller.oeeRelayBilletList", {
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
                this.getBilletListRole();
                this.getBilletListPackage();
                this.modelServices();
                this.i = 0;
                
  
  
            },
  
            onExit: function () {
                console.log("sayfadan çıkıldı");
            },
            Get_package_numbers_dolu: function () {
                var response = TransactionCaller.sync(
  
                    "MES/Itelli/oeeBilet/T_PACKAGE_NUMBERS_DOLU",
  
                    {
  
                    },
                    "O_JSON"
                );
  
                var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                var tableModel = new sap.ui.model.json.JSONModel(modelArr);
  
                if (response[1] == "E") {
                    MessageBox.information("PACKAGE NUMBERS WERE NOT ABLE TO CALL");
                } else {
                    var array = [];
  
                    if (response[0].Rowsets.Rowset.Row != null) {
                        if (response[0].Rowsets.Rowset.Row.length >= 2) {
                            response[0].Rowsets.Rowset.Row.forEach(function (item, i) {
                                var package_numbers = response[0].Rowsets.Rowset.Row[i].PACKAGE_NUMBER_DOLU;
                                array.push(package_numbers);
                            });
  
                            let text = array.toString();
  
                            this.getView().byId("neon2")? this.getView().byId("neon2").setText(text) : this.i=0;
  
                            
                            
  
                              document.getElementById(this.getView().byId("neon2")?.sId)?document.getElementById(this.getView().byId("neon2").sId).classList.add("neonx") : i=0;
  
                            
  
                        }
  
                        else if(response[0].Rowsets.Rowset.Row.length == 1) {
                          var text = response[0].Rowsets.Rowset.Row.PACKAGE_NUMBER_DOLU;
                          this.getView().byId("neon2")? this.getView().byId("neon2").setText(text) : this.i=0;
                      //    this.i = i;
                        //  i += 1;
                    
                     //     if (i >= 2) {
                      document.getElementById(this.getView().byId("neon2")?.sId)?document.getElementById(this.getView().byId("neon2").sId).classList.add("neonx") : i=0;
                      //    }  
                        }
                    }
    
                }
            },
  
            Get_package_numbers: function () {
                var response = TransactionCaller.sync(
  
                    "MES/Itelli/oeeBilet/T_PACKAGE_NUMBERS",
  
                    {
  
                    },
                    "O_JSON"
                );
  
                var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                var tableModel = new sap.ui.model.json.JSONModel(modelArr);
  
                if (response[1] == "E") {
                    MessageBox.information("PACKAGE NUMBERS WERE NOT ABLE TO CALL");
                } else {
                    var array = [];
  
                    if (response[0].Rowsets.Rowset.Row != null) {
                        if (response[0].Rowsets.Rowset.Row.length >= 2) {
                            response[0].Rowsets.Rowset.Row.forEach(function (item, i) {
                                var package_numbers = response[0].Rowsets.Rowset.Row[i].PACKAGE_NUMBER;
                                array.push(package_numbers);
                            });
  
                            let text = array.toString();
  
                            this.getView().byId("neon")? this.getView().byId("neon").setText(text) : this.i=0;
  
                            
                            
  
                              document.getElementById(this.getView().byId("neon")?.sId)?document.getElementById(this.getView().byId("neon").sId).classList.add("neonx") : i=0;
  
                            
  
                        }
  
                        else if(response[0].Rowsets.Rowset.Row.length == 1) {
                          var text = response[0].Rowsets.Rowset.Row.PACKAGE_NUMBER;
                          this.getView().byId("neon")? this.getView().byId("neon").setText(text) : this.i=0;
                      //    this.i = i;
                        //  i += 1;
                    
                     //     if (i >= 2) {
                      document.getElementById(this.getView().byId("neon")?.sId)?document.getElementById(this.getView().byId("neon").sId).classList.add("neonx") : i=0;
                      //    }  
                        }
                    }
    
                }
            },
          
             
              getKtkid : function(){
                var response = TransactionCaller.sync(
                    "MES/Itelli/oeeBilet/T_HURDA_KTKID",
        
                    {
                      
                    },
                    "O_JSON"
                  );
                  this.globalTableData;
                  var ObjArr = Array.isArray(response[0].Rowsets.Rowset.Row)
                   ? response[0].Rowsets.Rowset.Row
                 : new Array(response[0].Rowsets.Rowset.Row);

                 if(t>0){
                 var tableLength =
                    this.byId("tblBilletMaster").getItems().length;

                   
                 var tableModel = this.getView().getModel("confirmBilletListRole").oData;
                var oTable = this.getView().byId("tblBilletMaster");
                
                tableModel.forEach(function (item, i) {
                    var tblktkid = tableModel[i].KTKID;

                    ObjArr.forEach(function (item, k) {
                           if(tblktkid==ObjArr[k].KTKID){

                            tableModel[i].BILLET_STATUS="HURDA"
                           
                           }
                        
                      });

                   
                  });

                  var status;
                      var items = this.byId("tblBilletMaster").getItems(); 
                      for (var i = 0; i < items.length; i++) {
                       
                          items[i].removeStyleClass("HURDA");
                          items[i].removeStyleClass("STNDRT");
                         
                          status = this.getView().getModel("confirmBilletListRole").oData[i]
                              .BILLET_STATUS;
                          items[i].addStyleClass(status);
                      }
                 
                   


                    }
                 
                },

                newStartButton: function (oEvent) {

                    var selectedIndex = oEvent.oSource.getParent().getBindingContextPath().split("/")[1];

                    var selectedKtkid = this.getView().getModel("confirmBilletListRole").oData[selectedIndex].KTKID

                     var response = TransactionCaller.sync(
                        "MES/Itelli/oeeBilet/T_hurdaQuantitiy",
            
                        {
                         I_KTKID : selectedKtkid,
                        },
                        "O_JSON"
                      );
                      
                      var Obj = Array.isArray(response[0].Rowsets.Rowset.Row)
                       ? response[0].Rowsets.Rowset.Row[0]
                     : new Array(response[0].Rowsets.Rowset.Row);
                     var  Hurda= Obj[0]? Obj[0].HURDA : Hurda=0;
                     



                    this.StartButton(Hurda);



                },
                StartButton: function (Hurda) {

                    if (!this._oDialog02) {
                        this._oDialog02 = sap.ui.xmlfragment(

                            "Fragment3",

                            "customActivity.fragmentView.hurdaMiktari",

                            this

                        );

                        this.getView().addDependent(this._oDialog02);

                    }

                    this._oDialog02.open();
                     sap.ui.core.Fragment.byId("Fragment3", "hurdamiktar").setText(Hurda);



                },
                onCancelFra4: function () {
                    this._oDialog02.close();
                  },





                  newStartButton2: function (oEvent) {

                    var selectedIndex = oEvent.oSource.getParent().getBindingContextPath().split("/")[2];

                    var selectedKtkid = this.getView().getModel("confirmBilletListPackage").oData.Row[selectedIndex].KTKID;

                     var response = TransactionCaller.sync(
                        "MES/Itelli/oeeBilet/T_hurdaQuantitiy",
            
                        {
                         I_KTKID : selectedKtkid,
                        },
                        "O_JSON"
                      );
                      
                      var Obj = Array.isArray(response[0].Rowsets.Rowset.Row)
                       ? response[0].Rowsets.Rowset.Row[0]
                     : new Array(response[0].Rowsets.Rowset.Row);
                      var  Hurda= Obj[0]? Obj[0].HURDA : Hurda=0;
                     



                    this.StartButton2(Hurda);



                },
                StartButton2: function (Hurda) {

                    if (!this._oDialog02) {
                        this._oDialog02 = sap.ui.xmlfragment(

                            "Fragment3",

                            "customActivity.fragmentView.hurdaMiktari",

                            this

                        );

                        this.getView().addDependent(this._oDialog02);

                    }

                    this._oDialog02.open();
                     sap.ui.core.Fragment.byId("Fragment3", "hurdamiktar").setText(Hurda);



                },
                onCancelFra4: function () {
                    this._oDialog02.close();
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
                        "MES/Itelli/oeeBilet/T_ERROR_MESSAGES",
            
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



   
  
  
  
  
  
            onOpenRejectDialog: function (oEvent) {
                var selectedBilletLength =
                    this.byId("tblBilletMaster").getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_ERROR_NO_BILLET_SELECTED"
                );
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
  
            callBilletDetail: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
                p_this.getView().setModel(oModel, "rejectionModel");
            },
  
            getBilletDetail: function (oEvent) {
                var plant = this.appData.plant;
                var tableModel = this.getView().getModel("confirmBilletList").oData;
                var oTable = this.getView().byId("tblBilletMaster");
                var selectedRows = oTable.getSelectedContexts()[0].sPath;
                var selectedRow = selectedRows.split("/")[1];
                var Ktkid = tableModel[selectedRow].KTKID;
                this.getView().byId("rejectedKtkid").setSelectedKey(Ktkid);
                var params = { "Param.1": Ktkid };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getKTKIDForRejectQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletDetail);
            },
  
            onConfirmDialog: function () {
                this.handleCancel();
            },
  
            handleCancel: function () {
                if (!!this.appData.oDialog.isOpen()) this.appData.oDialog.destroy();
  
                if (this.appData.intervalState == false) this.changeIntervalState();
            },
  
            getBilletListRole: function (oEvent) {
                var plant = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;
                var params = { "Param.1": plant, "Param.2": workcenterid };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getBilletListForRoleQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletListRole);
            },
  
            callBilletListRole: function (p_this, p_data) {
                var tableCharacteristic = p_data.Rowsets.Rowset[0];
                var rows = p_data.Rowsets.Rowset[0].Row;
  
                var characteristic = [];
                var tableData = [];
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
                this.globalTableData = tableData;
                var oModel = new sap.ui.model.json.JSONModel();

                var response = TransactionCaller.sync(
                    "MES/Itelli/oeeBilet/T_HURDA_KTKID",
        
                    {
                      
                    },
                    "O_JSON"
                  );
                  this.globalTableData;
                  var ObjArr = Array.isArray(response[0].Rowsets.Rowset.Row)
                   ? response[0].Rowsets.Rowset.Row: new Array(response[0].Rowsets.Rowset.Row);

                   
                if(ObjArr.length>=1 && ObjArr[0] != undefined&&tableData!=undefined&&tableData.length>0){                     
                    tableData.forEach(function (item, i) {
                    var tblktkid = tableData[i].KTKID;

                    ObjArr.forEach(function (item, k) {
                           if(tblktkid==ObjArr[k].KTKID){
                            tableData[i].BILLET_STATUSX="HURDA"
                           
                           }
                        
                      });

                   
                  });
                  
                }
                oModel.setData(tableData);
                  p_this.getView().setModel(oModel, "confirmBilletListRole");

                  if(tableData!=undefined&&tableData.length){  
                  var status;
                      var items = p_this.byId("tblBilletMaster")?.getItems(); 
                      if(items!=undefined){ 
                      for (var i = 0; i < items.length; i++) {
                       
                          items[i].removeStyleClass("HURDA");
                          items[i].removeStyleClass("STNDRT");

                          status = p_this.getView().getModel("confirmBilletListRole").oData[i]
                              .BILLET_STATUSX;
                          items[i].addStyleClass(status);

                          
                      }}}
                  
                      

            },
            billetItemSelected: function (oEvent) {
                var row = this.getView()
                    .byId("tblBilletMaster")
                    .getSelectedContextPaths();
                var statLen = this.getView()
                    .byId("tblBilletMaster")
                    .getSelectedItems().length;
                var statPackLen = this.getView()
                    .byId("tblBilletMaster2")
                    .getSelectedItems().length;
                var sendtoPackage = this.getView().byId("btnDownPallet");
                if (statLen >= 1 || statPackLen >= 1) {
                    this.appData.intervalState = true;
                    this.changeIntervalState();
  
                    /*   if((row[0].split('/')[1] == 0 && row[1].split('/')[1]==1) || (row[0].split('/')[1] == 1 && row[1].split('/')[1]==0)){
                              sendtoPackage.setEnabled(true);
                             }else  sendtoPackage.setEnabled(false);     
                     */
                } else {
                    this.appData.intervalState = false;
                    this.changeIntervalState();
                }
                // DHSH-2528
                if (statLen >= 1) {
                    this.changeEnabledStatusFooterButtons(false);
                } else {
                    this.changeEnabledStatusFooterButtons(true);
                }
            },
            changeEnabledStatusFooterButtons: function (enabled) {
                var btnArr = [
                    "btnSendRollerTbl",
                    "btnPiece",
                    "btnHBPacket",
                    "btnHBRole",                   
                    "btnContinue",
                ];
                btnArr.forEach((item) => this.getView().byId(item).setEnabled(enabled));
            },
            getBilletListPackage: function (oEvent) {
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var aufnr = this.appData.selected.order.orderNo;
                var params = { "Param.1": werks, "Param.2": workcenterid };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/getBilletListForPackageQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletListPackage);
            },
  
            callBilletListPackage: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(p_data.Rowsets.Rowset[0]);
              // p_this.getView().setModel(oModel, "confirmBilletListPackage");
                var response = TransactionCaller.sync(
                    "MES/Itelli/oeeBilet/T_HURDA_KTKID",
        
                    {
                      
                    },
                    "O_JSON"
                  );
                  this.globalTableData;
                  var ObjArr = Array.isArray(response[0].Rowsets.Rowset.Row)
                   ? response[0].Rowsets.Rowset.Row
                 : new Array(response[0].Rowsets.Rowset.Row);

                 
 
                    if(p_data.Rowsets.Rowset[0].Row!==undefined&&oModel.oData.Row!=undefined){
                        var tableData = oModel.oData.Row?oModel.oData.Row : oModel.oData;

                        tableData.forEach(function (item, i) {
                        var tblktkid = tableData[i].KTKID;
                        if(ObjArr.length>=1 && ObjArr[0] != undefined){
                        ObjArr.forEach(function (item, k) {
                               if(tblktkid==ObjArr[k].KTKID){
    
                                tableData[i].BILLET_STATUSX="HURDA"
                               
                               } });
    
                        }
                      });
                      
                    }
                    p_data.Rowsets.Rowset[0].Row=tableData;
                      oModel.setData(p_data.Rowsets.Rowset[0]);
                      p_this.getView().setModel(oModel, "confirmBilletListPackage");
                   if(tableData!=undefined&&tableData.length>0){  
                      var status;
                      var items = p_this.byId("tblBilletMaster2")?.getItems();  
                      if(items!=undefined){
                          
                          for (var i = 0; i < items.length; i++) {
                           
                              items[i].removeStyleClass("HURDA");
                              items[i].removeStyleClass("STNDRT");
                             
                              status =  p_this.getView().getModel("confirmBilletListPackage").oData.Row[i].BILLET_STATUSX;
                              items[i].addStyleClass(status);
                
                } }}

                 
                      
            },
  
            onPressContinueDialog: function (oEvent) {
  
                var selectedBilletLength =
                    this.byId("tblBilletMaster2").getSelectedItems().length;
  
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_RLY_ERROR_SELECT_BILLET"
                );
  
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                }
                else {
                    var oTable = this.getView().byId("tblBilletMaster2");
                    var selectedPath = oTable
                        .getSelectedContextPaths()
                        .map((path) => path.split("/")[2])[0];
                    if (selectedPath != (this.getView().getModel("confirmBilletListPackage").getData().Row.length -1) ) {
                        MessageBox.error("Lütfen ilk sıradaki KTKID'yi seçiniz.");
                        return;
                    }
                }
  
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_LABEL_RLY_PACKAGE_STATUS"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("OEE_LABEL_RLY_FULL_PACKAGE"),
                            this.appComponent.oBundle.getText("OEE_LABEL_RLY_EMPTY_PACKAGE"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "DOLU PALET") {
                                sap.m.MessageBox.warning(
                                    this.appComponent.oBundle.getText("OEE_LABEL_RLY_PACKAGE_TG"),
                                    {
                                        actions: [
                                            this.appComponent.oBundle.getText("TEORİK AĞIRLIK"),
                                            this.appComponent.oBundle.getText("GERÇEK AĞIRLIK"),
                                        ],
                                        onClose: function (oAction) {
                                            if (
                                                oAction == "TEORİK AĞIRLIK" ||
                                                oAction == "GERÇEK AĞIRLIK"
                                            ) {
                                                this.updateLabelWeight(oAction);
                                            }
                                        }.bind(this),
                                    }
                                );
                            } else if (oAction == "BOŞ PALET") {
                                this.updateEmptyPackage(oAction);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },
  
  
            updateEmptyPackage: function (oAction) {
                var user = this.appData.user.userID;
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var params = {
                    I_WERKS: werks,
                    I_USER: user,
                    I_WORKCENTER: workcenterid,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Package/updateEmptyPackageXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdateEmptyPackage);
            },
  
            callUpdateEmptyPackage: function (p_this, p_data) {
                sap.m.MessageToast.show("Boş palet gönderildi.");
                p_this.handleCancel();
            },
  
            updateLabelWeight: function (oEvent) {
                var user = this.appData.user.userID;
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                this.appData.selectAction = oEvent;
                var params = {
                    I_ACTION: oEvent,
                    I_WERKS: werks,
                    I_USER: user,
                    I_WORKCENTER: workcenterid,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Package/updateLabelWeightXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdateLabel);
            },
  
            callUpdateLabel: function (p_this, p_data) {
                var action = p_this.appData.selectAction;
                if (action == "TEORİK AĞIRLIK") {
                    sap.m.MessageToast.show("Teorik miktar atandı.");
                } else if (action == "GERÇEK AĞIRLIK") {
                    sap.m.MessageToast.show("Gerçek miktar atandı.");
                } else {
                    return;
                }
            },
  
            onPressHBPacked: function (oEvent) {
                /*         
                        var selectedBilletLength = this.byId(
                           "tblBilletMaster2"
                         ).getSelectedItems().length;
                         var noBilletSelected = this.appComponent.oBundle.getText(
                           "OEE_LABEL_PLT_ERROR_SELECTED_BILLET"
                         );
                         if (selectedBilletLength <= 0) {
                           MessageBox.error(noBilletSelected);
                           return;
                          } else{
             */
                var selectedBilletLength =
                    this.byId("tblBilletMaster2").getSelectedItems().length;
  
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_RLY_ERROR_SELECT_BILLET"
                );
  
                if(selectedBilletLength>1){
                  MessageBox.error("Lütfen Tek Seçim yapınız");
                  return;
                }       
               else{
                  if (selectedBilletLength <= 0) {
                      MessageBox.error("Şekillendirme Alanı Tablosundan Seçiniz");
                      return;
                  }
  
                  var oTable = this.getView().byId("tblBilletMaster2");
                var selectedPath = oTable
                    .getSelectedContextPaths()
                    .map((path) => path.split("/")[2])[0];
  
                var ktkid =  this.getView().getModel("confirmBilletListPackage").oData.Row[selectedPath].KTKID;
                var kangal =  this.getView().getModel("confirmBilletListPackage").oData.Row[selectedPath].LABEL_WEIGHT;
  
                var response2 = TransactionCaller.sync(
                  "MES/Itelli/oeeBilet/T_WEIGHT_COMPARING",
      
                  {
                    I_KTKID:ktkid,
                    I_KANGAL_AGIRLIK :kangal                  
                  },
                  "O_JSON"
                );
                if (response2[1] == "E") {
                  MessageBox.error(response2[0]);
                  return;
                } 
              
  
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                }
                else {
                    var oTable = this.getView().byId("tblBilletMaster2");
                    var selectedPath = oTable
                        .getSelectedContextPaths()
                        .map((path) => path.split("/")[2])[0];
                    if (selectedPath != (this.getView().getModel("confirmBilletListPackage").getData().Row.length -1)) {
                        MessageBox.error("Lütfen ilk sıradaki KTKID'yi seçiniz.");
                        return;
                    }
                }
              }
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText(
                        "OEE_LABEL_PLT_BILLET_BEFORE_PAKCED_HB"
                    ),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.insertHBPacked();
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },
  
            callHBPacked: function (p_this, p_data) {
                sap.m.MessageToast.show("Kangal HB tartılan olarak kaydedildi.");
                p_this.handleCancel();
            },
  
            insertHBPacked: function (oEvent) {
                var tableModel = this.getView().getModel(
                    "confirmBilletListPackage"
                ).oData;
                var oTable = this.getView().byId("tblBilletMaster2");
                /*
                 var selectedKtkIdList = [];
                 var oSelectedRowLength = oTable.getSelectedContexts().length;
                 for (i = 0; i < oSelectedRowLength; i++) {
                   var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                   var selectedRow = selectedRowPath.split("/Row/")[1];
                   var Ktkid = tableModel.Row[selectedRow].KTKID;
                   selectedKtkIdList.push(Ktkid);
                 }   */
  
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var user = this.appData.user.userID;
  
                var params = {
                    I_WORKCENTER: workcenterid,
                    I_WERKS: werks,
                    // I_KTKID: selectedKtkIdList.toString(),
                    I_USER: user,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/RollerTable/insertBilletHBPackedXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callHBPacked);
            },
  
            onPressHBRollerTbl: function (oEvent) {
  
                var selectedBilletLength =
                    this.byId("tblBilletMaster2").getSelectedItems().length;
  
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_RLY_ERROR_SELECT_BILLET"
                );
  
                if(selectedBilletLength>1){
                  MessageBox.error("Lütfen Tek Seçim yapınız");
                  return;
                }       
               else{
  
                  if (selectedBilletLength <= 0) {
                      MessageBox.error("Şekillendirme Alanı Tablosundan Seçiniz");
                      return;
                  }
  
                  var oTable = this.getView().byId("tblBilletMaster2");
                var selectedPath = oTable
                    .getSelectedContextPaths()
                    .map((path) => path.split("/")[2])[0];
  
                var ktkid =  this.getView().getModel("confirmBilletListPackage").oData.Row[selectedPath].KTKID;
                var kangal =  this.getView().getModel("confirmBilletListPackage").oData.Row[selectedPath].LABEL_WEIGHT;
  
                var response2 = TransactionCaller.sync(
                  "MES/Itelli/oeeBilet/T_WEIGHT_COMPARING",
      
                  {
                    I_KTKID:ktkid,
                    I_KANGAL_AGIRLIK :kangal                  
                  },
                  "O_JSON"
                );
                if (response2[1] == "E") {
                  MessageBox.error(response2[0]);
                  return;
                } 
  
  
                
                
                else {
                    var oTable = this.getView().byId("tblBilletMaster2");
                    var selectedPath = oTable
                        .getSelectedContextPaths()
                        .map((path) => path.split("/")[2])[0];
                    if (selectedPath != (this.getView().getModel("confirmBilletListPackage").getData().Row.length -1)) {
                        MessageBox.error("Lütfen ilk sıradaki KTKID'yi seçiniz.");
                        return;
                    }
                }
  
              }
                
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_LABEL_RLY_BILLET_ON_RLY_HB"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.insertHBRollerTbl();
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },
  
            callInsertHBRoller: function (p_this, p_data) {
                sap.m.MessageToast.show("Kangal hadde bozuğu olarak kaydedildi.");
                p_this.handleCancel();
            },
  
            insertHBRollerTbl: function (oEvent) {
                var tableModel = this.getView().getModel("confirmBilletListRole").oData;
                var oTable = this.getView().byId("tblBilletMaster");
                /*
                 var selectedKtkIdList = [];
                 var oSelectedRowLength = oTable.getSelectedContexts().length;
                 for (i = 0; i < oSelectedRowLength; i++) {
                   var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                   var selectedRow = selectedRowPath.split("/")[1];
                   var Ktkid = tableModel[selectedRow].KTKID;
                   selectedKtkIdList.push(Ktkid);
                 } */
  
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var user = this.appData.user.userID;
  
                var params = {
                    I_WORKCENTER: workcenterid,
                    I_WERKS: werks,
                    //I_KTKID: selectedKtkIdList.toString(),
                    I_USER: user,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/RollerTable/insertBilletHBRollerTblXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callInsertHBRoller);
            },
  
            onPressSendBilletOnPackage: function (oEvent) {
                var selectedBilletLength =
                    this.byId("tblBilletMaster").getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_ERROR_NO_BILLET_SELECTED"
                );
                var moreThanOneBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_BILLET_SELECTED_MORE_ONE"
                );
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                } else if (selectedBilletLength > 1) {
                    MessageBox.error(moreThanOneBilletSelected);
                    return;
                } else {
                    sap.m.MessageBox.warning(
                        this.appComponent.oBundle.getText("OEE_LABEL_RLY_SEND_PACKAGE"),
                        {
                            actions: [
                                this.appComponent.oBundle.getText("EVET"),
                                this.appComponent.oBundle.getText("HAYIR"),
                            ],
                            onClose: function (oAction) {
                                if (oAction == "EVET") {
                                    this.sendBilletOnPackage();
                                } else {
                                    return;
                                }
                            }.bind(this),
                        }
                    );
                }
            },
  
            callSendOnPackage: function (p_this, p_data) {
                sap.m.MessageToast.show("Kangal palete indirildi.");
                p_this.handleCancel();
            },
  
            sendBilletOnPackage: function (oEvent) {
                var tableModel = this.getView().getModel("confirmBilletListRole").oData;
                var oTable = this.getView().byId("tblBilletMaster");
  
                var selectedKtkIdList = [];
                var oSelectedRowLength = oTable.getSelectedContexts().length;
                for (i = 0; i < oSelectedRowLength; i++) {
                    var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                    var selectedRow = selectedRowPath.split("/")[1];
                    var Ktkid = tableModel[selectedRow].KTKID;
                    selectedKtkIdList.push(Ktkid);
                }
  
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var user = this.appData.user.userID;
  
                var params = {
                    I_WORKCENTER: workcenterid,
                    I_WERKS: werks,
                    I_KTKID: selectedKtkIdList.toString(),
                    I_USER: user,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/RollerTable/sendBilletOnPackageXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callSendOnPackage);
            },
  
            onPressSendRollerTbl: function (oEvent) {
  
                var selectedBilletLength =
                    this.byId("tblBilletMaster2").getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_PLT_ERROR_SELECTED_BILLET"
                );
  
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                }
                else {
                    var oTable = this.getView().byId("tblBilletMaster2");
                    var selectedPath = oTable
                        .getSelectedContextPaths()
                        .map((path) => path.split("/")[2])[0];
                    if (selectedPath != (this.getView().getModel("confirmBilletListPackage").getData().Row.length -1)) {
                        MessageBox.error("Lütfen ilk sıradaki KTKID'yi seçiniz.");
                        return;
                    }
                }
  
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_LABEL_RLY_SEND_ROLLER_TBL"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.sendRollerTbl();
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
  
            },
  
            callSendRollerTbl: function (p_this, p_data) {
                sap.m.MessageToast.show("Seçili kangallar role yoluna gönderildi.");
                p_this.handleCancel();
            },
  
            sendRollerTbl: function (oEvent) {
                var tableModel = this.getView().getModel(
                    "confirmBilletListPackage"
                ).oData;
                var oTable = this.getView().byId("tblBilletMaster2");
  
                var selectedKtkIdList = [];
                var oSelectedRowLength = oTable.getSelectedContexts().length;
                for (i = 0; i < oSelectedRowLength; i++) {
                    var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                    var selectedRow = selectedRowPath.split("/Row/")[1];
                    var Ktkid = tableModel.Row[selectedRow].KTKID;
                    selectedKtkIdList.push(Ktkid);
                }
  
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var user = this.appData.user.userID;
  
                var params = {
                    I_WORKCENTER: workcenterid,
                    I_WERKS: werks,
                    I_KTKID: selectedKtkIdList.toString(),
                    I_USER: user,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Package/sendBilletRollerTblXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callSendRollerTbl);
            },
  
            onPressPieceBillet: function (oEvent) {
                /*     var selectedBilletLength = this.byId(
                       "tblBilletMaster2"
                     ).getSelectedItems().length;
                     var noBilletSelected = this.appComponent.oBundle.getText(
                       "OEE_LABEL_PLT_ERROR_SELECTED_BILLET"
                     );
                     if (selectedBilletLength <= 0) {
                       MessageBox.error(noBilletSelected);
                       return;
                      } else{
                 */
  
                var selectedBilletLength =
                    this.byId("tblBilletMaster2").getSelectedItems().length;
  
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_RLY_ERROR_SELECT_BILLET"
                );
                if(selectedBilletLength>1){
                  MessageBox.error("Lütfen Tek Seçim yapınız");
                  return;
                }       
               else{
                  if (selectedBilletLength <= 0) {
                      MessageBox.error("Şekillendirme Alanı Tablosundan Seçiniz");
                      return;
                  }
  
                  var oTable = this.getView().byId("tblBilletMaster2");
                var selectedPath = oTable
                    .getSelectedContextPaths()
                    .map((path) => path.split("/")[2])[0];
  
                var ktkid =  this.getView().getModel("confirmBilletListPackage").oData.Row[selectedPath].KTKID;
                var kangal =  this.getView().getModel("confirmBilletListPackage").oData.Row[selectedPath].LABEL_WEIGHT;
  
                var response3 = TransactionCaller.sync(
                  "MES/Itelli/oeeBilet/T_WEIGHT_COMPARING2",
      
                  {
                    I_KTKID:ktkid,
                    I_KANGAL_AGIRLIK :kangal                  
                  },
                  "O_JSON"
                );
                if (response3[1] == "E") {
                  MessageBox.error(response3[0]);
                  return;
                } 
                if (selectedBilletLength <= 0) {
                    MessageBox.error("Şekillendirme Alanı Tablosundan Seçiniz");
                    return;
                }
                else {
                    var oTable = this.getView().byId("tblBilletMaster2");
                    var selectedPath = oTable
                        .getSelectedContextPaths()
                        .map((path) => path.split("/")[2])[0];
                    if (selectedPath != (this.getView().getModel("confirmBilletListPackage").getData().Row.length -1)) {
                        MessageBox.error("Lütfen ilk sıradaki KTKID'yi seçiniz.");
                        return;
                    }
                }
              }
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_LABEL_PLT_CHOOSE_HB"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("PARÇA KAFA"),
                            this.appComponent.oBundle.getText("PARÇA KUYRUK"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "PARÇA KAFA" || oAction == "PARÇA KUYRUK") {
                                this.updatePieceBillet(oAction);
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },
  
            callPieceBillet: function (p_this, p_data) {
                sap.m.MessageToast.show("Role yoluna gönderildi.");
                p_this.handleCancel();
            },
  
            updatePieceBillet: function (oAction) {
                var tableModel = this.getView().getModel(
                    "confirmBilletListPackage"
                ).oData;
                var oTable = this.getView().byId("tblBilletMaster2");
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var user = this.appData.user.userID;
  
                var params = {
                    I_WORKCENTER: workcenterid,
                    I_WERKS: werks,
                    I_USER: user,
                    I_SELECTED: oAction,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/RollerTable/updatePieceBilletStatusXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callPieceBillet);
            },
  
            onPressScrapPackage: function (oEvent) {
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText("OEE_LABEL_PLT_SCRAP_PACKAGE"),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.updateScrapPackage();
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
            },
  
            callScrapPackage: function (p_this, p_data) {
                sap.m.MessageToast.show("Kangal hurda olarak saklandı.");
                p_this.handleCancel();
            },
  
            updateScrapPackage: function (oEvent) {
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var user = this.appData.user.userID;
  
                var params = {
                    I_WORKCENTER: workcenterid,
                    I_WERKS: werks,
                    I_USER: user,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Package/updateScrapPackageXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callScrapPackage);
            },
  
            changeButtonColor: function (oEvent) {
                oBtnContinue = this.getView().byId("btnContinue");
                oBtnDownPallet = this.getView().byId("btnDownPallet");
                oBtnbtnHBRole = this.getView().byId("btnHBRole");
                // oBtnbtnHBRole.setType("Emphasized");
                oBtnDownPallet.setType("Default");
                oBtnContinue.setType("Emphasized");
            },
  
            modelServices: function () {
                // var self = this;
                // this.intervalHandle = setInterval(function () {
                // 	if (window.location.hash == "#/activity/ZACT_RELAY_BILLET")
                // 		if (self.appData.intervalState == true) {
                // 			self.getBilletListRole();
                // 			self.getBilletListPackage();
                // 			self.getAlert();
                // 		}
                // 	//console.log(1);
                // }, 5000);
  
                oTrigger = new sap.ui.core.IntervalTrigger(5000);
                oTrigger.addListener(() => {
                    if (this.appData.intervalState) {
                        this.getBilletListRole();
                        this.getBilletListPackage();
                        //this.getSignalPoints();
                        this.getAlert();
                        this.Get_package_numbers();
                        this.Get_package_numbers_dolu();
                        
                        
  
                    }
                    console.log("interval çalışıyor");
  
                }, this);
  
            },







  
            callGetAlert: function (p_this, p_data) {
                var data = p_data.Rowsets.Rowset[0].Row;
                if (data != undefined) {
                    var alertMessage = p_data.Rowsets.Rowset[0].Row[0].LONGTEXT;
                    var alertID = p_data.Rowsets.Rowset[0].Row[0].ID;
                    var length = alertMessage.length;
                    var isQuestion = alertMessage[length - 1];
                    if (isQuestion == "?") {
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
                                        p_this.updateBilletStatus();
                                    } else if (oAction == "HAYIR") {
                                        p_this.updateAlertStatus(alertID);
                                    } else {
                                        return;
                                    }
                                }.bind(p_this),
                            }
                        );
                    } else {
                        sap.m.MessageBox.warning(
                            p_this.appComponent.oBundle.getText(alertMessage),
                            {
                                actions: [p_this.appComponent.oBundle.getText("TAMAM")],
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
                    }
                } else {
                    p_this.appData.intervalState = true;
                }
            },
  
            getAlert: function (oEvent) {
                var shortText = "RLY_ALERT";
                var params = {
                    "Param.1": shortText,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/AlertViewer/getNewAlertQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callGetAlert);
                this.appData.intervalState = false;
            },
  
            updateAlertStatus: function (alertID) {
                var params = {
                    I_ALERTID: alertID,
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
  
            updateBilletStatus: function () {
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var user = this.appData.user.userID;
                var params = {
                    I_WERKS: werks,
                    I_USER: user,
                    I_WORKCENTER: workcenterid,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Package/updateBilletStatusSHurdaXqry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callUpdateBilletStat);
            },
  
            callUpdateBilletStat: function (p_this, p_that) {
                sap.m.MessageToast.show("Kangal satılabilir hurda olarak kaydedildi");
                p_this.appData.intervalState = true;
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
                    oButton.setText("Otomatik Güncelleme Açık");
                    this.getBilletListRole();
                    this.getBilletListPackage();
                }
            },
  
            onUpdateBilletDownPallet: function () {
                var palletNo = this.getView().byId("palletNoInput").getValue();
                var tableModel = this.getView().getModel("confirmBilletListRole").oData;
                var oTable = this.getView().byId("tblBilletMaster");
  
                if (!!!palletNo) {
                    MessageBox.error("Palet numarası giriniz");
                    return;
                }
                var pathArr = oTable
                    .getSelectedContextPaths()
                    .map((path) => path.split("/")[1]);
                var sortedIndexArr = pathArr.sort((a, b) => (a > b ? 1 : -1));
                if (pathArr.length > 1) {
                    // Multi coil
                    var isSequential = true;
                    sortedIndexArr.forEach((item, index) => {
                        if (item != index) {
                            isSequential = false;
                        }
                    });
                    if (!isSequential) {
                        MessageBox.error("Röle yolunda seçilen kangallar sıralı olmalıdır");
                        return;
                    }
                } else {
                    // Single coil
                    var selectedPath = oTable
                        .getSelectedContextPaths()
                        .map((path) => path.split("/")[1])[0];
                    if (selectedPath != 0) {
                        MessageBox.error("İlk sıradaki paleti manuel indirmeniz gerekir");
                        return;
                    }
                }
                var sekillendirmeArr = this.getView().getModel(
                    "confirmBilletListPackage"
                )?.oData?.Row;
                if (!!sekillendirmeArr && sekillendirmeArr.length > 0) {
                    var coilCount = sortedIndexArr.length;
                    var sekillendirmeByPaletArr = sekillendirmeArr.filter(
                        (item) => item.PACKAGE_NUMBER == palletNo
                    );
                    if (
                        sekillendirmeByPaletArr.length > 0 &&
                        coilCount + sekillendirmeByPaletArr.length > 3
                    ) {
                        MessageBox.error(
                            `${palletNo} nolu palete en fazla 3 adet kangal eklenebilir`
                        );
                        return;
                    }
                }
  
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
                    I_PALLETNO: palletNo.toString(),
                    I_USER: this.appData.user.userID,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Manual/updateBilletLocationXqry",
                    params
                );
                var that = this;
                MessageBox.warning("Devam etmek istiyor musunuz?.", {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CLOSE],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction == MessageBox.Action.CLOSE) return null;
                        else {
                            if (!tRunner.Execute()) {
                                MessageBox.error(tRunner.GetErrorMessage());
                                return null;
                            } else {
                                that.handleCancel();
                                that.getBilletListRole();
                            }
                        }
                    },
                });
            },
            onOpenDownPalletDialog: function (oEvent) {
                var selectedBilletLength =
                    this.byId("tblBilletMaster").getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_RLY_ERROR_SELECT_BILLET"
                );
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                }
                if (selectedBilletLength > 3) {
                    MessageBox.error(
                        "Manuel indir işlemi için en fazla 3 adet kangal seçilebilir"
                    );
                    return;
                }
                var oTable = this.getView().byId("tblBilletMaster");
                var pathArr = oTable
                    .getSelectedContextPaths()
                    .map((path) => path.split("/")[1]);
                var sortedIndexArr = pathArr.sort((a, b) => (a > b ? 1 : -1));
                if (pathArr.length > 1) {
                    // Multi coil
                    var isSequential = true;
                    sortedIndexArr.forEach((item, index) => {
                        if (item != index) {
                            isSequential = false;
                        }
                    });
                    if (!isSequential) {
                        MessageBox.error("Röle yolunda seçilen kangallar sıralı olmalıdır");
                        return;
                    }
                } else {
                    // Single coil
                    var selectedPath = oTable
                        .getSelectedContextPaths()
                        .map((path) => path.split("/")[1])[0];
                    if (selectedPath != 0) {
                        MessageBox.error("İlk sıradaki paleti manuel indirmeniz gerekir");
                        return;
                    }
                }
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
            callBilletStatusError: function (p_this, p_data) {
                sap.m.MessageToast.show("Seçilen kangallar yoldan alındı.");
                p_this.handleCancel();
            },
  
            updateBilletStatusError: function (oEvent) {
                var werks = this.appData.plant;
                var workcenterid = this.appData.node.workcenterID;
                var user = this.appData.user.userID;
                var oTable = this.getView().byId("tblBilletMaster");
                var tableModel = this.getView().getModel("confirmBilletListRole").oData;
                var selectedKtkIdList = [];
                var oSelectedRowLength = oTable.getSelectedContexts().length;
                for (i = 0; i < oSelectedRowLength; i++) {
                    var selectedRowPath = oTable.getSelectedContexts()[i].sPath;
                    var selectedRow = selectedRowPath.split("/")[1];
                    var Ktkid = tableModel[selectedRow].KTKID;
                    selectedKtkIdList.push(Ktkid);
                    var ktkIdList = selectedKtkIdList.toString().replace('"', "");
                }
                var params = {
                    I_WERKS: werks,
                    I_USER: user,
                    ElementList_TRNS: ktkIdList,
                };
                var tRunner = new TransactionRunner(
                    "MES/UI/Filmasin/Operations/setDownRelayBilletXquery",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callBilletStatusError);
            },
  
            onPressDeleteFromRly: function (oEvent) {
                var selectedBilletLength =
                    this.byId("tblBilletMaster").getSelectedItems().length;
                var noBilletSelected = this.appComponent.oBundle.getText(
                    "OEE_LABEL_RLY_ERROR_SELECT_BILLET"
                );
                if (selectedBilletLength <= 0) {
                    MessageBox.error(noBilletSelected);
                    return;
                }
                sap.m.MessageBox.warning(
                    this.appComponent.oBundle.getText(
                        "Seçili kangalları Role Yolu'ndan kaldırmak istiyor musunuz?"
                    ),
                    {
                        actions: [
                            this.appComponent.oBundle.getText("EVET"),
                            this.appComponent.oBundle.getText("HAYIR"),
                        ],
                        onClose: function (oAction) {
                            if (oAction == "EVET") {
                                this.updateBilletStatusError();
                            } else if (oAction == "HAYIR") {
                                this.handleCancel();
                            } else {
                                return;
                            }
                        }.bind(this),
                    }
                );
                //     this.getBilletRejectType();
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
  