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
        "sap/ui/export/library",
        "sap/ui/export/Spreadsheet",
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
        exportLibrary,
        Spreadsheet
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.sayacManuel",

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
                    this.getView().byId("idSayac2").setValue("0")
                    // this.getView().byId("datePicker").setValue(this.time());

                },

                date: function () {
                    var day = this.getView().byId("datePicker").getDateValue().getDate();
                    var month = this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear = this.getView().byId("datePicker").getDateValue().getFullYear();
                    return day + "/" + month + "/" + fullyear;

                },

                time: function () {
                    var day = new Date().getDate();
                    var month = new Date().getMonth() + 1;
                    var fullyear = new Date().getFullYear();
                    return day + "/" + month + "/" + fullyear;
                },
                bagIdModel : function (){

					var plant = this.getView().byId("idComboBox").getSelectedKey();

					var response = TransactionCaller.sync(
                        "MES/Itelli/SayacScreen/YAZICI_SAYAC/T_GET_SAYAC_MODEL_CMBOX",
                        {
							I_PLANT : plant
						},
                        "O_JSON"
                    ); 

                    var tableModel2 = new sap.ui.model.json.JSONModel(); // json modelinde bir değişken yaratı
                    tableModel2.setData(response[0]?.Rowsets?.Rowset?.Row); //içinde data set ediliyor
                    this.getView().byId("idComboBoxTag").setModel(tableModel2); 

				},

                kaydet: function () {
                    var date = this.date();
                    var ComboBox = this.getView().byId("idComboBox").getValue();
                    var TagID = this.getView().byId("idComboBoxTag").getSelectedKey();
                    var Sayac1 = this.getView().byId("idSayac1").getValue();
                    var Sayac2 = this.getView().byId("idSayac2").getValue();
                    var Sayac = Sayac1 + "." + Sayac2

                    var mytext= this.getView().byId("idComboBoxTag")._getSelectedItemText();
                    var myArray = mytext.split("-");
                    var  I_Tagtanim= myArray[1];

                    var response = TransactionCaller.sync(
                        "MES/Itelli/SayacScreen/T_CREATE_SAYAC_MANUEL",


                        {
                            I_DATE: date,
                            I_COMBOBOX: ComboBox,
                            I_TAGID: TagID,
                            I_SAYAC: Sayac,
                            I_TAGTANIM : I_Tagtanim

                        },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        alert(response[0]);
                        MessageBox.information(response[0]);
                    } else {
                        // this.onCancelFrag();

                        MessageBox.information("Veriler bşarılı bir şekilde kayıt edildi.");
                    }


                },


            }
        );
    }
);
