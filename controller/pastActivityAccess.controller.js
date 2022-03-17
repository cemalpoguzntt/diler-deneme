sap.ui.define(
    [
        "sap/m/MessageBox",
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "customActivity/scripts/transactionCaller",
        "sap/ui/core/Fragment",
        "sap/m/Dialog",
        "sap/m/Text",
        "sap/m/TextArea",
        "sap/m/Button",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "customActivity/scripts/custom",

    ],

    function (
        MessageBox,
        Controller,
        JSONModel,
        MessageToast,
        TransactionCaller,
        Fragment,
        Dialog,
        Text,
        TextArea,
        Button,
        Filter,
        FilterOperator,
        customScripts

    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity/controller/pastActivityAccess",

            {
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
                    that = this;
                    jsonDataForPriorityChange = [];
                    // this.router = sap.ui.core.UIComponent.getRouterFor(this);
                    // this.router.attachRouteMatched(this._fnRouteMatched, this);
                    //  this.router = new sap.ui.core.routing.Router(this);

                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();
                    this.interfaces = this.appComponent.getODataInterface();

                    this.getModel();

                },

                handleChange: function (oEvent) {
                    var oText = this.getView().byId("DateTimePicker"),
                        sValue = oEvent.getParameter("value");


                    oText.setValue(sValue);

                },

                getModel: function () {

                    
                    var params3 = {   
                    };
                    var tRunner3 = new TransactionRunner("MES/Itelli/PastActivity_All/getPlantQry", params3);
                    if (!tRunner3.Execute()) {
                        MessageBox.error(tRunner3.GetErrorMessage());
                        return;
                    }
                    var oData3 = tRunner3.GetJSONData();
                    var oModel3 = new sap.ui.model.json.JSONModel();
                    oModel3.setData(oData3[0].Row);
                    this.getView().byId("plantSelectBox").setModel(oModel3);

                    this.getView().byId("plantSelectBox").setSelectedKey(this.appData.plant);
                    


                    var params4 = {
                        "Param.1": this.appData.client,
                        "Param.2": this.appData.plant,

                    };
                    var tRunner4 = new TransactionRunner("MES/Itelli/PastActivity_All/getWorkplaceAllQry", params4);
                    if (!tRunner4.Execute()) {
                        MessageBox.error(tRunner4.GetErrorMessage());
                        return;
                    }
                    var oData4 = tRunner4.GetJSONData();
                    var oModel4 = new sap.ui.model.json.JSONModel();
                    oModel4.setData(oData4[0].Row);
                    this.getView().byId("isyeriSelectBox").setModel(oModel4);


                    var params = {
                        "Param.1": this.appData.client,
                        "Param.2": this.appData.plant,
                        "Param.3": this.appData.node.nodeID,

                    };
                    var tRunner = new TransactionRunner("MES/Itelli/PastActivity_All/getWorkplaceQry", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    this.getView().byId("isyeriSelectBox").setSelectedKey(oData[0].Row[0].NAME);



                    var params2 = {
                        "Param.1": this.appData.client,
                        "Param.2": this.appData.plant,
                        "Param.3": this.getView().byId("isyeriSelectBox").getSelectedKey(),

                    };
                    var tRunner2 = new TransactionRunner("MES/Itelli/PastActivity_All/getModelQry", params2);
                    if (!tRunner2.Execute()) {
                        MessageBox.error(tRunner2.GetErrorMessage());
                        return;
                    }
                    var oData2 = tRunner2.GetJSONData();
                    var oModel2 = new sap.ui.model.json.JSONModel();
                    oModel2.setData(oData2[0].Row);
                    this.getView().byId("pastActivityInfos").setModel(oModel2);


                },

                onSaveData: function () {

                   
                    // var process = this.getView().byId("islemComboBox").getSelectedKey();
                    var plant = this.getView().byId("plantSelectBox").getSelectedKey();
                    var workplace = this.getView().byId("isyeriSelectBox").getSelectedKey();

                    var date = this.getView().byId("DateTimePicker").getValue();

                    if (!!!workplace) {
                        MessageBox.error("İş yerini seçiniz.")
                        return;
                    }
                    // if (!!!process) {
                    //     MessageBox.error("İşlemi seçiniz.")
                    //     return;
                    // }
                    if (!!!date) {
                        MessageBox.error("Tarihi doldurunuz.")
                        return;
                    }
                    if (moment(new Date()).format("DD-MM-YYYY") == date) {
                        MessageBox.error("Bugünün tarihine kayıt oluşturamazsınız.")
                        return;
                    }

                    this.getView().byId("pastActivityInfos").setBusy(true);
                    
                    TransactionCaller.async(
                        "MES/Itelli/PastActivity_All/T_Insert_Past_Activity_AP",
                        {
                            I_CLIENT: this.appData.client,
                            I_PLANT: plant,
                            I_ISYERI: workplace,                           
                            I_DATE: date,
                            I_USER: this.appData.user.userID,

                        },
                        "O_JSON",
                        this.onSaveDataCB,
                        this
                    );
                   



             


                },



                onSaveDataCB: function (iv_data, iv_scope) {
                    iv_scope.getView().byId("pastActivityInfos").setBusy(false);

                                if (iv_data[1] == "E") {
                                     MessageBox.error(iv_data[0]);
                                 return;
                                        }

                    var plant = iv_scope.getView().byId("plantSelectBox").getSelectedKey();
                    var workplace = iv_scope.getView().byId("isyeriSelectBox").getSelectedKey();

                    var params = {
                        "Param.1": iv_scope.appData.client,
                        "Param.2": plant,
                        "Param.3": workplace,

                    };
                    var tRunner = new TransactionRunner("MES/Itelli/PastActivity_All/getModelQry", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }

                    
                       
                   

                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);
                    iv_scope.getView().byId("pastActivityInfos").setModel(oModel);
                    

                },


                onPressDeleteCB: function (iv_data, iv_scope) {
                    iv_scope.getView().byId("pastActivityInfos").setBusy(false);

                                if (iv_data[1] == "E") {
                                     MessageBox.error(iv_data[0]);
                                 return;
                                        }

                    
                    
                    var plant = iv_scope.getView().byId("plantSelectBox").getSelectedKey();
                    var workplace = iv_scope.getView().byId("isyeriSelectBox").getSelectedKey();

                    var params = {
                        "Param.1": iv_scope.appData.client,
                        "Param.2": plant,
                        "Param.3": workplace,

                    };
                    var tRunner = new TransactionRunner("MES/Itelli/PastActivity_All/getModelQry", params);
                    if (!tRunner.Execute()) {
                        MessageBox.error(tRunner.GetErrorMessage());
                        return;
                    }
                    var oData = tRunner.GetJSONData();
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(oData[0].Row);
                    iv_scope.getView().byId("pastActivityInfos").setModel(oModel); 

                },

                


                onDelete: function (oEvent) {
                    var selectedIndex = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                    var selectedModel = oEvent.oSource.getModel().getData()[selectedIndex];
                    var selectedID = selectedModel.ID;
                    var selectedDATE = selectedModel.DATE;
                    var plant = this.getView().byId("plantSelectBox").getSelectedKey();
                    var workplace = this.getView().byId("isyeriSelectBox").getSelectedKey();
                    var array = [{}];
                    array[0].plant = plant;
                    array[0].workplace = workplace;
                    array[0].selectedID = selectedID;
                    array[0].DATE = selectedDATE  ;        


                    this.openFragment(array);
                },



                openFragment: function (array) {
                    if (!this._oDialog01) {
                        this._oDialog01 = sap.ui.xmlfragment(
                            "pastActivityMessage",
                            "customActivity.fragmentView.pastActivityMessage",
        
                            this
                        );
                        this.getView().addDependent(this._oDialog01);
                    }
                    this._oDialog01.open();
        
        
                    sap.ui.core.Fragment.byId("pastActivityMessage", "deleteData").setModel(array);
        
                },


                onCancelFrag01: function () {
                    this._oDialog01.close();
                },

                onPressDelete: function (oEvent) {
                    
                    var selectedModelfromDialog = sap.ui.core.Fragment.byId("pastActivityMessage", "deleteData")?.getModel();
                    var selectedID = selectedModelfromDialog[0]?.selectedID;
                    var date = selectedModelfromDialog[0]?.DATE;
                    var client = this.appData.client;
                    var plant = selectedModelfromDialog[0]?.plant;
                    var workplace = selectedModelfromDialog[0]?.workplace;

                    this.getView().byId("pastActivityInfos").setBusy(true);

                    TransactionCaller.async(
                        "MES/Itelli/PastActivity_All/T_Insert_Past_Activity_AP",
                        {
                            I_CLIENT: client,
                            I_PLANT: plant,
                            I_ISYERI: workplace,                           
                            I_DATE: date,
                            I_USER: this.appData.user.userID,
                            I_SELECTEDID: selectedID,

                        },
                        "O_JSON",
                        this.onPressDeleteCB,
                        this
                    );

                   

                    this.onCancelFrag01(); 

                },



                plantChange: function () {
                    
                    var params4 = {
                        "Param.1": this.appData.client,
                        "Param.2": this.getView().byId("plantSelectBox").getSelectedKey(),

                    };
                    var tRunner4 = new TransactionRunner("MES/Itelli/PastActivity_All/getWorkplaceAllQry", params4);
                    if (!tRunner4.Execute()) {
                        MessageBox.error(tRunner4.GetErrorMessage());
                        return;
                    }
                    var oData4 = tRunner4.GetJSONData();
                    var oModel4 = new sap.ui.model.json.JSONModel();
                    oModel4.setData(oData4[0].Row);
                    this.getView().byId("isyeriSelectBox").setModel(oModel4);
                    this.getView().byId("isyeriSelectBox").setSelectedKey(null);


                },


                workPlaceChange: function () {
                    
                    var params2 = {
                        "Param.1": this.appData.client,
                        "Param.2": this.getView().byId("plantSelectBox").getSelectedKey(),
                        "Param.3": this.getView().byId("isyeriSelectBox").getSelectedKey(),

                    };
                    var tRunner2 = new TransactionRunner("MES/Itelli/PastActivity_All/getModelQry", params2);
                    if (!tRunner2.Execute()) {
                        MessageBox.error(tRunner2.GetErrorMessage());
                        return;
                    }
                    var oData2 = tRunner2.GetJSONData();
                    var oModel2 = new sap.ui.model.json.JSONModel();
                    oModel2.setData(oData2[0].Row);
                    this.getView().byId("pastActivityInfos").setModel(oModel2);




                },





            }
        );
    }
);