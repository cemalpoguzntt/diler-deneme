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

        'sap/ui/core/library',
        "sap/ui/core/Core",
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
        coreLibrary,
        Core,
        customStyle,
    ) {
        "use strict";
        var that;

        var jsonDataForPriorityChange;
        return Controller.extend(
            "customActivity.controller.counterData",

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
                    this.modelGlobal = []
                    this.index;
                    this.IDs = [];
                    this.tableModel = new sap.ui.model.json.JSONModel();
                    this.control = "0";

                    jsonDataForPriorityChange = [];

                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();

                    this.interfaces = this.appComponent.getODataInterface();
                    this.cGroupCB1();
                },

                getData: function () {

                    var value = this.getView().byId("inputdatepicker").getDateValue()
                    var plant = this.getView().byId("inputplant").getSelectedKey();
                    var sayacadi = this.getView().byId("inputsayacadi").getSelectedKey();
                    var dateValue = moment(value).format('YYYY-MM-DD');

                    if (plant === "" || sayacadi === "" || dateValue === "") {
                        return;
                    }
                    else {
                        var plant = this.getView().byId("inputplant").getSelectedKey();
                        var date = this.getView().byId("inputdatepicker").getDateValue();
                        var dateValue = moment(date).format('YYYY-MM-DD');

                        var response = TransactionCaller.sync(
                            "MES/Itelli/PM_SCREEN/counterData/T_SELECT_DAKIKA",
                            {

                                I_PLANT: plant,
                                I_counterID: sayacadi,
                                I_DATE: dateValue,

                            },
                            "O_JSON"
                        );
                        var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                        var tableModel2 = new sap.ui.model.json.JSONModel(modelArr);

                        this.getView().byId("mainTable").setModel(tableModel2);
                        this.getView().byId("mainTable").getModel().refresh();

                        this.modelGlobal = JSON.parse(JSON.stringify(modelArr));
                    }
                },

                counterName: function () {
                    this.getView().byId("mainTable").setModel(this.tableModel);
                    this.getView().byId("inputdatepicker").setDateValue();
                },

                cGroupCB1: function () {
                    var response = TransactionCaller.sync(
                        "MES/Itelli/PM_SCREEN/counterData/T_SELECT_PLANT",
                        {},
                        "O_JSON"
                    );
                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel2 = new sap.ui.model.json.JSONModel(modelArr);
                    this.getView().byId("inputplant").setModel(tableModel2);
                },


                SelectedPlant: function () {

                    var plant = this.getView().byId("inputplant").getSelectedKey();

                    var response = TransactionCaller.sync(
                        "MES/Itelli/PM_SCREEN/counterData/T_SELECT_SAYAC_ADI",
                        {
                            I_PLANT: plant,
                        },
                        "O_JSON"
                    ); // distinct komutlu transaction sonucu geliyor.
                    var modelArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0].Rowsets.Rowset.Row : new Array(response[0].Rowsets.Rowset.Row);
                    var tableModel2 = new sap.ui.model.json.JSONModel(modelArr);

                    this.getView().byId("inputsayacadi").setSelectedKey("");
                    this.getView().byId("inputsayacadi").setValue("");

                    this.getView().byId("inputsayacadi").setModel(tableModel2);
                    this.getView().byId("mainTable").setModel(this.tableModel);
                    this.getView().byId("inputdatepicker").setDateValue();




                },



                save: function () {
                    //Burada yap??lan i??lem kabaca ??u ??ekildedir;
                    //Model ilk ??a????r??l??rken Global'de bir de??i??kene atan??r
                    //Ard??ndan de??i??iklik yap??lm???? son model kaydet tu??una bast??ktan sonra al??n??r.
                    //A??a????daki metod yoluyla ikisi aras??nda hangi sat??rlarda fark var diye tek tek b??t??n bile??enler kar????la??t??r??l??r.
                    //Farkl??l??k olan sat??rlar??n ID'leri ve verileri bir Array'e object olarak at??l??r.
                    //Toplanan son Array backend'e g??nderilerek update ve insert i??lemleri ger??ekle??tirilir.
                    var modelArk = this.getView().byId("mainTable").getModel();
                    modelArk.oData.forEach(function (item, index) {
                        that.index = index;
                        if (that.control == "1") { return; } //foreach'?? k??r??p fonksiyonu durdurmaya ??al??????yorum 


                        Object.keys(item).map((e) => {

                            if (!(item[e] == that.modelGlobal[that.index][e])) {

                                var ID = that.modelGlobal[that.index]?.COUNTER_ID;
                                var v1 = item?.VARDIYA1;
                                var v2 = item?.VARDIYA2;
                                var v3 = item?.VARDIYA3;
                                var g = item?.GUN;
                                var plant = item?.PLANT;
                                var exp = item?.COUNTER_EXP;

                                if (isNaN(v1) || isNaN(v2) || isNaN(v3) || isNaN(g)) { //string ifade girilmemesi i??in kontrol

                                    MessageBox.error("L??tfen doldurulacak alanlara sadece say?? giriniz!");
                                    that.control = "1";   //foreach'?? k??r??p fonksiyonu durdurmaya ??al??????yorum                                                                
                                    return
                                }

                                if ((Number(v1) + Number(v2) + Number(v3)) > Number(g)) {

                                    g = (Number(v1) + Number(v2) + Number(v3));
                                }

                                var array = { "ID": ID, "v1": v1, "v2": v2, "v3": v3, "gun": g, "plant": plant, "exp": exp };

                                that.IDs.push(array);
                            }

                        })

                    })


                    if (that.control == "1") { //foreach'?? k??r??p fonksiyonu durdurmaya ??al??????yorum 
                        that.control = "0";
                        return;
                    }

                    var value = this.getView().byId("inputdatepicker").getDateValue()
                    var plant = this.getView().byId("inputplant").getSelectedKey();
                    var sayacadi = this.getView().byId("inputsayacadi").getSelectedKey();
                    var dateValue = moment(value).format('YYYY-MM-DD');

                    var response99 = TransactionCaller.sync(
                        "MES/Itelli/PastActivity/T_GetFilterModel",
                        {
                            I_CLIENT: this.appData.client,
                            I_PLANT: this.appData.plant,
                            I_WORKPLACE: "SAYAC",
                            I_DATE: moment(value).format('DD-MM-YYYY'),     // se??ili teyitin tarihi

                        },
                        "O_JSON"
                    );
                    if (response99[1] == "E") {
                        MessageBox.error("G??n kapat??lm????t??r.");
                        return;
                    }


                    if (plant === "" || sayacadi === "" || dateValue === "") {
                        MessageToast.show("L??tfen gerekli alanlar?? doldurup tekrar deneyiniz.");
                        return;
                    }

                    var oModel = JSON.stringify(that.IDs)

                    var response = TransactionCaller.sync(
                        "MES/Itelli/PM_SCREEN/counterData/T_COUNTER_DATA_INSERT",
                        {
                            I_DATE: dateValue,
                            I_ARRAY: oModel,
                            I_USER: this.appData.user.userID,

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        alert(response[0]);
                    }

                    this.erpSend(dateValue, oModel);

                    this.IDs = [];

                },

                /* delete: function () {


                    var selected = this.getView().byId("mainTable").getSelectedIndex();
                    if (selected === -1) {
                        MessageToast.show("L??tfen tablodan sat??r se??iniz");
                        return;
                    }

                    var cevap = confirm("Bu sat??r?? silmek istedi??inize emin misiniz?");

                    if (cevap === true) {

                        var tableData = this.getView().byId("mainTable").getModel().getData();

                        var a = tableData[selected];
                        var idkey = a.ID;

                        var response = TransactionCaller.sync(
                            "MES/Itelli/PM_SCREEN/counterData/T_DELETE",
                            {
                                I_ID: idkey
                            },

                            "O_JSON"

                        );



                        MessageBox.information("Veriler Ba??ar??l?? bir ??ekilde silindi");



                    }

                    this.tableSelect();

                }, */

                erpSend: function (dateValue, oModel) {

                    this.getView().byId("mainTable").setBusy(true);
                    TransactionCaller.async(
                        "MES/Itelli/PM_SCREEN/counterData/T_ERP_SEND",
                        {
                            I_DATE: dateValue,
                            I_ARRAY: oModel,
                            I_USER: this.appData.user.userID,
                        },
                        "O_JSON",
                        this.erpSendCB,
                        this
                    );


                },


                erpSendCB: function (iv_data, iv_scope) {

                    if (iv_data[1] == "E") {
                        alert(iv_data[0]);
                        iv_scope.getView().byId("mainTable").setBusy(false)
                        return

                    } else {
                        iv_scope.getView().byId("mainTable").setBusy(false)
                        iv_scope.getData();
                        MessageBox.information("Bilgiler ba??ar??l?? bir ??ekilde kaydedildi.");
                        return

                    }

                },

            });
    }
);


// "SAPJAVA1"."COUNTER_DATA"