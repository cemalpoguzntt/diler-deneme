sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "sap/m/Label",
        "sap/m/Dialog",
        "sap/m/DialogType",
        "sap/m/Button",
        "sap/m/ButtonType",
        "sap/ui/core/CustomData",
        "customActivity/scripts/custom",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "customActivity/scripts/customStyle",
        "sap/ui/model/FilterType",
        "customActivity/scripts/transactionCaller",
    ],

    function (
        Controller,
        JSONModel,
        MessageBox,
        Label,
        Dialog,
        DialogType,
        Button,
        ButtonType,
        CustomData,
        customScripts,
        formatter,
        Filter,
        FilterOperator,
        customStyle,
        FilterType,
        TransactionCaller
    ) {
        var that;
        return Controller.extend("customActivity.controller.dogTiptal", {

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                that = this;
                this.appData.intervalState = true;

                this.modelServices();
                this.haschange();
                this.getBilletList();



            },



            getBilletList: function (oEvent) {

                var date1 = moment(this.getView().byId("idDatePicker").getDateValue()).format('YYYY-MM-DD');
                var date2 = moment(this.getView().byId("idDatePicker").getSecondDateValue()).format('YYYY-MM-DD');

                if (date1 == "Invalid date" && date2 == "Invalid date") {

                    date1 = moment(new Date()).format('YYYY-MM-DD');
                    date2 = moment(new Date()).format('YYYY-MM-DD');


                    var display = moment(new Date()).format('DD.MM.YYYY');

                    this.getView().byId("idDatePicker").setValue(display + " - " + display);


                }

                var response = TransactionCaller.sync(
                    "MES/Itelli/DOGRULTMA/TEYIT_IPTAL/T_GET_TEYIT_IPTAL_TABLE",
                    {
                        I_DATE1: date1,
                        I_DATE2: date2,

                    },
                    "O_JSON"
                );

                var ObjArr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0]?.Rowsets?.Rowset?.Row
                    : new Array(response[0]?.Rowsets?.Rowset?.Row);
                var Model = new sap.ui.model.json.JSONModel(ObjArr);

                this.getView().byId("confDog").setModel(Model);


            },

            TeyitIptal: function (oEvent) {


                var searchData = this.getView().byId("confDog").getModel().oData;
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().sPath.split("/")[1]
                var confo = searchData[selectedIndex]?.CONFNO;
                var counter = searchData[selectedIndex]?.COUNTER;
                var entryid = searchData[selectedIndex]?.ENTRY_ID


                this.getView().byId("confDog").setBusy(true);

                TransactionCaller.async(
                    "MES/Itelli/DOGRULTMA/TEYIT_IPTAL/T_TEYIT_IPTAL_RFC",
                    {
                        I_CONFNO: confo,
                        I_COUNTER: counter,
                        I_ENTRYID: entryid
                    },
                    "O_JSON",
                    this.TeyitIptalCB,
                    this
                );



            },




            TeyitIptalCB: function (iv_data, iv_scope) {

                if (iv_data[1] == "E") {
                    MessageBox.error("Teyit İptal edilemedi");
                } else {
                    MessageBox.information("Teyip İptal Edildi");
                }
                iv_scope.getView().byId("confDog").setBusy(false);

                iv_scope.getBilletList();

            },


            TekrarDene: function (oEvent) {


                var searchData = this.getView().byId("confDog").getModel().oData;
                var selectedIndex = oEvent.oSource.getParent().getBindingContext().sPath.split("/")[1]

                var entryid = searchData[selectedIndex]?.ENTRY_ID

                this.getView().byId("confDog").setBusy(true);

                TransactionCaller.async(
                    "MES/Itelli/DOGRULTMA/TEYIT_IPTAL/T_TRY_AGAIN",
                    {

                        I_ENTRY_ID: entryid
                    },
                    "O_JSON",
                    this.TekrarDeneCB,
                    this
                );



            },



            TekrarDeneCB: function (iv_data, iv_scope) {

                if (iv_data[1] == "E") {
                    MessageBox.error("Teyit tekrar işlenemedi.");
                } else {
                    MessageBox.information("Tekrar teyite gönderildi.");
                }
                iv_scope.getView().byId("confDog").setBusy(false);

                iv_scope.getBilletList();

            },


            LabelDog: function () {



                var selectedItems = this.getView().byId("confDog").getSelectedItems();
                var selectedLength = selectedItems.length;
                var searchData = this.getView().byId("confDog").getModel().oData;

                if (selectedLength <= 0) {
                    MessageBox.error("Lütfen Seçim yapınız!");
                    return;
                }
                var labelQuan = this.getView().byId("setLabelQuan").getValue();

                var IDS = [];
                for (var index = 0; index < selectedLength; index++) {
                    var path = selectedItems[index].oBindingContexts.undefined.sPath.substring(1);
                    var id = searchData[path]?.ENTRY_ID
                    IDS.push(id);


                }
                var IDList = IDS.toString().replace('"', "");


            },


            haschange: function () {

                window.onhashchange = function () {
                    if (window.location.href.includes("Z_DOG_TEY_IPTAL")) {

                    }
                    else {
                        clearInterval(this.intervalHandle);
                        clearInterval(that.intervalHandle);
                        clearInterval(self.intervalHandle);
                    }

                };


            },

            modelServices: function () {
                var self = this;
                this.intervalHandle = setInterval(function () {
                    if (self.appData.intervalState == true) {
                        console.log("int çalışıyor")
                        self.getBilletList();
                    }
                }, 6000);
            },


            changeIntervalState: function (oEvent) {
                oButton = this.getView().byId("chkIntervalState");
                if (this.appData.intervalState == true) {
                    this.appData.intervalState = false;
                    oButton.setType("Reject");
                    oButton.setText("Otomatik Güncelleme Kapalı");
                } else {
                    var selectedItems = this.getView().byId("confDog").getSelectedItems();
                    var selectedLength = selectedItems.length;
                    if (selectedLength < 1) {
                        this.appData.intervalState = true;
                        this.getView().byId("chkIntervalState").setType("Accept");
                        oButton.setText("Otomatik Yenileme Açık");
                    }
                    else {

                        MessageBox.error("Önce seçili Satırları Kaldırınız!")
                    }
                }
            },








        });
    }
);