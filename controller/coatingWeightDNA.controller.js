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
        "customActivity/scripts/custom",
        "customActivity/scripts/customStyle",
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
        Spreadsheet,
        customScripts,
        customStyle
    ) {
        "use strict";
        var that;
        var jsonDataForPriorityChange;
        var EdmType = exportLibrary.EdmType;
        return Controller.extend(
            "customActivity.controller.coatingWeightDNA",

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


                    this.getView().byId("idFirstWeight").setValue(0);
                    this.getView().byId("idLastWeight").setValue(0);
                    this.getView().byId("idSampDiameter").setValue(0);
                    this.getView().byId("idSampLength").setValue(0);
                    this.getView().byId("idCW").setValue(0);

                    this.getModelDataOnInit();

                    
                },

                changeBarcodeInput: function (oEvent) {

                    var inputValue = oEvent.getSource()._getInputValue();

                    if (this.appData.plant == "3007") {
                        if (!inputValue.includes("|")) {
                            return;
                        }
                        var splittedArr = inputValue.split("|");
                        var batchNo = "";
                        if (splittedArr[0].length == 4) {
                            // Yeni Etiket
                            batchNo = splittedArr[2];
                        } else {
                            // Eski Etiket
                            batchNo = splittedArr[0];
                        }
                    }
                    this.getView().byId("idReadBarcode").setValue(null);

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/CoatingWeight/getBatchInformationTrns",
                        {
                            I_BATCHNO: batchNo
                        },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }

                    this.getView().byId("idAufnr").setText(response[0].LOCAL_XML.AUFNR);
                    this.getView().byId("idCharg").setText(response[0].LOCAL_XML.CHARG);
                    this.getView().byId("idType").setText(response[0].LOCAL_XML.TYPE);
                    this.getView().byId("idQuantity").setText(response[0].LOCAL_XML.QUALITY);


                },

                calculateCW: function (oEvent) {
                    var firstW = this.getView().byId("idFirstWeight").getValue();
                    var lastW = this.getView().byId("idLastWeight").getValue();
                    var diameter = this.getView().byId("idSampDiameter").getValue();
                    var length = this.getView().byId("idSampLength").getValue();

                    var CW = (firstW - lastW) / ((diameter / 1000) * (length / 100) * (3.14159));


                    this.getView().byId("idCW").setValue(CW.toFixed(3));



                },


                onPressSave: function () {

                    var firstW = Number(this.getView().byId("idFirstWeight").getValue());
                    var lastW = Number(this.getView().byId("idLastWeight").getValue());
                    var diameter = Number(this.getView().byId("idSampDiameter").getValue());
                    var length = Number(this.getView().byId("idSampLength").getValue());
                    var CW = Number(this.getView().byId("idCW").getValue());
                    var batchNo = Number(this.getView().byId("idCharg").getText());

                    if (!!!batchNo) {
                        MessageBox.error("Barkod okutunuz!");
                        return;
                    }

                    if (!!!CW) {
                        MessageBox.error("Kaplama Ağırlığını hesaplayınız. Verileri kontrol edin.");
                        return;
                    }


                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/CoatingWeight/insertCoatingWeightTrns",
                        {
                            I_CLIENT: this.appData.client,
                            I_PLANT: this.appData.plant,
                            I_NODEID: this.appData.node.nodeID,
                            I_SHIFT: this.appData.shift.shiftID,
                            I_CHARG: batchNo,
                            I_FIRST_WEIGHT: firstW,
                            I_LAST_WEIGHT: lastW,
                            I_DIAMETER: diameter,
                            I_LENGTH: length,
                            I_COATING_WEIGHT: CW,
                            I_USER: this.appData.user.userID
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

                    this.clearAll();
                    this.clearValues();

                },

                openRaporEkranı: function () {
                    this.getView().byId("CoatingWeight").setVisible(false);
                    this.getView().byId("raporBox").setVisible(true);
                },
                openCW: function () {
                    this.getView().byId("raporBox").setVisible(false);
                    this.getView().byId("CoatingWeight").setVisible(true);
                    this.getModelDataOnInit();
                },

                clearAll: function () {

                    this.getView().byId("idAufnr").setText(null);
                    this.getView().byId("idCharg").setText(null);
                    this.getView().byId("idType").setText(null);
                    this.getView().byId("idQuantity").setText(null);


                },

                clearValues: function () {

                    this.getView().byId("idFirstWeight").setValue(null);
                    this.getView().byId("idLastWeight").setValue(null);
                    this.getView().byId("idSampDiameter").setValue(null);
                    this.getView().byId("idSampLength").setValue(null);
                    this.getView().byId("idCW").setValue(null);


                },

                searchData: function () {

                    var date1 = this.date1();                    
                    var date2 = this.date2();

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/CoatingWeight/getDataCoatingWeightTrns",
                        {
                            I_DATE1: date1,
                            I_DATE2: date2
                        },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }                    
                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    this.getView().byId("coatingWeightTable").setModel(tableModel);
                    var myColumns=response[0].Rowsets.Rowset.Columns.Column;
                    return myColumns;


                },

                handleChange1: function (oEvent) {
                    var oText = this.getView().byId("DateTimePicker1"),
                        sValue = oEvent.getParameter("value");


                    oText.setValue(sValue);

                },

                time: function () {
                    var day1 = new Date().getDate();
                    var month1 = new Date().getMonth() + 1;
                    var fullyear1 = new Date().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;
                },
                date1: function () {
                    var day1 = this.getView().byId("datePicker").getDateValue().getDate();
                    var month1 = this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                    var fullyear1 = this.getView().byId("datePicker").getDateValue().getFullYear();
                    return fullyear1 + "-" + month1 + "-" + day1;

                },
                date2: function () {
                    var day2 = this.getView().byId("datePicker").getSecondDateValue().getDate();
                    var month2 = this.getView().byId("datePicker").getSecondDateValue().getMonth() + 1;
                    var fullyear2 = this.getView().byId("datePicker").getSecondDateValue().getFullYear();
                    return fullyear2 + "-" + month2 + "-" + day2;

                },

                getModelDataOnInit: function () {

                    var date1 = this.time();                   
                    var date2 = this.time();

                    var response = TransactionCaller.sync(
                        "MES/Itelli/DNA/CoatingWeight/getDataCoatingWeightTrns",
                        {
                            I_DATE1: date1,
                            I_DATE2: date2
                        },
                        "O_JSON"
                    );
                    if (response[1] == "E") {
                        MessageBox.error(response[0]);
                        return;
                    }                    
                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel = new sap.ui.model.json.JSONModel(modelArr);
                    this.getView().byId("coatingWeightTable").setModel(tableModel);

                    this.getView().byId("datePicker").setValue(this.time()+" " + "- "+ " " + this.time());
                  

                },

                createColumns : function () {
                    var myColumns= this.searchData() //RETURN'Ü ALDI
                     var dynamicExcel = [];
                     for(var i=0; i< myColumns.length; i++) {
                         dynamicExcel.push({label: myColumns[i]["@Description"],
                                            property: myColumns[i]["@Description"],
                                            width: '20'
                     });
                     }  
                     return dynamicExcel
                 },
    
                 onExport: function (oEvent) {
                  var oColumns = this.createColumns();
                                     var tableModel = this.getView().byId("coatingWeightTable").getModel();
                                     if (!(!!tableModel?.oData)) {
                                         MessageBox.error("Tabloda veri bulunmamaktadır.");
                                         return;
                                     }
                                     var oDatas = tableModel.getData();
                                     if (!(!!oDatas)) {
                                         MessageBox.error("Tabloda veri bulunmamaktadır.");
                                         return;
                                     }
                                     var oSettings = {
                                         workbook: {
                                             columns: oColumns
                                         },
                                         dataSource: oDatas,
                                         fileName: "RAPOR" 
                                     };
                                     var oSheet = new Spreadsheet(oSettings);
                                     oSheet.build().then(function () {
                                         MessageToast.show("Tablo Excel'e aktarıldı.");
                                     });
                                 },



            }
        );
    }
);