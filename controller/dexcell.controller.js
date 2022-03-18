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
        coreLibrary,
        Core,
        customStyle,
        customScripts,
    ) {
        "use strict";
        var that;

        return Controller.extend("customActivity.controller.dexcell", {
            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();


                that = this;
                this.spaceArray = [];
                this.generalData = [];
                this.specData = [];
                this.plant = [];
                this.PPWC = [];
                this.DN = [];


                this.getAllData();
            },

            getAllData: function () {
                var params = {
                };
                var tRunner = new TransactionRunner("MES/Itelli/PM_SCREEN/Datas/Q_GET_ALL_DATA", params);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return;
                }
                var oData = tRunner.GetJSONData();




                //sorgudan dönen sonuc ana veri olarak set edilir.
                if (!!(oData[0]?.Row)) {
                    this.generalData = oData[0]?.Row;
                    that.plant = [...new Map(this.generalData.map(item => [item["URETIM_YERI"], item])).values()];
                }

                //geçici arrayımıza ana veriyi kopyalıyoruz.

                this.specData = JSON.parse(JSON.stringify(this.generalData));



                this.getView().byId("plant").setModel(new sap.ui.model.json.JSONModel(that.plant));
                this.getView().byId("plant").setSelectedKey(null);
            },

            plantSelected: function () {

                this.specData = JSON.parse(JSON.stringify(this.generalData));

                var array = that.specData.filter(function (item) {
                    return item.URETIM_YERI == that.getView().byId("plant").getSelectedKey();
                });
                that.specData = [];
                that.specData = array;

                that.PPWC = [...new Map(this.specData.map(item => [item["PP_ISYERI"], item])).values()];

                this.getView().byId("ppIsyeri").setModel(new sap.ui.model.json.JSONModel(that.PPWC));
                this.getView().byId("ppIsyeri").setSelectedKey(null);

                this.getView().byId("dn").setModel(new sap.ui.model.json.JSONModel(that.spaceArray));
                this.getView().byId("dn").setSelectedKey(null);


            },

            ppSelected: function () {

                var array = that.specData.filter(function (item) {
                    return item.URETIM_YERI == that.getView().byId("plant").getSelectedKey();
                });


                var array2 = array.filter(function (item) {
                    return item.PP_ISYERI == that.getView().byId("ppIsyeri").getSelectedKey();
                });

                this.getView().byId("notificationTable").setModel(new sap.ui.model.json.JSONModel(array2));

                that.DN = [...new Map(array2.map(item => [item["DURUS_NEDENI"], item])).values()];

                this.getView().byId("dn").setModel(new sap.ui.model.json.JSONModel(that.DN));
                this.getView().byId("dn").setSelectedKey(null);


            },

            dnSelected: function () {

                var array = that.specData.filter(function (item) {
                    return item.URETIM_YERI == that.getView().byId("plant").getSelectedKey();
                });


                var array2 = array.filter(function (item) {
                    return item.PP_ISYERI == that.getView().byId("ppIsyeri").getSelectedKey();
                });


                var array3 = array2.filter(function (item) {
                    return item.DURUS_NEDENI == that.getView().byId("dn").getSelectedKey();
                });

                this.getView().byId("notificationTable").setModel(new sap.ui.model.json.JSONModel(array3));



            },

            openFragment: function () {

                if (!this.dexcell) {
                    this.dexcell = sap.ui.xmlfragment("dexcell", "customActivity.fragmentView.dexcell", this);
                    this.getView().addDependent(this.dexcell);

                }

                this.dexcell.open();

            },

            closeFragment: function () {

                this.dexcell.close();
            },

            createLine: function () {

                this.openFragment();
                this.clearFragment();


            },

            arrangeLine: function () {

                var index = this.getView().byId("notificationTable")?.getSelectedContextPaths()[0]?.split("/")[1];
                if (index === undefined) {
                    MessageToast.show("Lütfen tablodan satır seçiniz");
                    return;
                }
                var tableData = this.getView().byId("notificationTable").getModel().getData();
                this.clearFragment();
                this.openFragment();


                sap.ui.core.Fragment.byId("dexcell", "selectedID")?.setValue(tableData[index]?.ID);

                sap.ui.core.Fragment.byId("dexcell", "uretimyeri")?.setSelectedKey(tableData[index]?.URETIM_YERI);
                sap.ui.core.Fragment.byId("dexcell", "uretimyeri")?.setValue(tableData[index]?.URETIM_YERI);
                sap.ui.core.Fragment.byId("dexcell", "ppIsyeri")?.setValue(tableData[index]?.PP_ISYERI);
                sap.ui.core.Fragment.byId("dexcell", "tbk")?.setValue(tableData[index]?.TEKNIK_BIRIM_KODU);
                sap.ui.core.Fragment.byId("dexcell", "tbt")?.setValue(tableData[index]?.TEKNIK_BIRIM_TANIMI);
                sap.ui.core.Fragment.byId("dexcell", "dabk")?.setValue(tableData[index]?.DURUS_ANA_BASLIK_KODU);
                sap.ui.core.Fragment.byId("dexcell", "dab")?.setValue(tableData[index]?.DURUS_ANA_BASLIK);
                sap.ui.core.Fragment.byId("dexcell", "dk")?.setValue(tableData[index]?.DURUS_KODU);
                sap.ui.core.Fragment.byId("dexcell", "dn")?.setValue(tableData[index]?.DURUS_NEDENI);
                sap.ui.core.Fragment.byId("dexcell", "pmBildirim")?.setSelectedKey(tableData[index]?.PM_BILDIRIMI);
                sap.ui.core.Fragment.byId("dexcell", "pmBildirim")?.setValue(tableData[index]?.PM_BILDIRIMI);
                sap.ui.core.Fragment.byId("dexcell", "pmIsyeri")?.setValue(tableData[index]?.PM_ISYERI);

            },

            clearFragment: function () {

                sap.ui.core.Fragment.byId("dexcell", "selectedID")?.setValue("");

                sap.ui.core.Fragment.byId("dexcell", "uretimyeri")?.setSelectedKey("")
                sap.ui.core.Fragment.byId("dexcell", "uretimyeri")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "ppIsyeri")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "tbk")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "tbt")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "dabk")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "dab")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "dk")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "dn")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "pmBildirim")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "pmBildirim")?.setValue("");
                sap.ui.core.Fragment.byId("dexcell", "pmIsyeri")?.setValue("");

            },


            saveFunction: function () {

                var ID = sap.ui.core.Fragment.byId("dexcell", "selectedID")?.getValue();


                var uretimYeri = sap.ui.core.Fragment.byId("dexcell", "uretimyeri")?.getSelectedKey();
                var ppIsyeri = sap.ui.core.Fragment.byId("dexcell", "ppIsyeri")?.getValue();
                var TBK = sap.ui.core.Fragment.byId("dexcell", "tbk")?.getValue();
                var TBT = sap.ui.core.Fragment.byId("dexcell", "tbt")?.getValue();
                var DABK = sap.ui.core.Fragment.byId("dexcell", "dabk")?.getValue();
                var DAB = sap.ui.core.Fragment.byId("dexcell", "dab")?.getValue();
                var DK = sap.ui.core.Fragment.byId("dexcell", "dk")?.getValue();
                var DN = sap.ui.core.Fragment.byId("dexcell", "dn")?.getValue();
                var pmBildirim = sap.ui.core.Fragment.byId("dexcell", "pmBildirim")?.getSelectedKey();
                var pmIsyeri = sap.ui.core.Fragment.byId("dexcell", "pmIsyeri")?.getValue();

                if (pmBildirim == undefined || pmBildirim == "" || uretimYeri == undefined || uretimYeri == "") {
                    MessageBox.error("PM Bildirim ve Üretim Yeri alanlarının doldurulması zorunludur.")
                    return
                }




                sap.ui.core.Fragment.byId("dexcell", "dexcellFragment").setBusy(true);
                TransactionCaller.async(
                    "MES/Itelli/PM_SCREEN/Datas/T_INSERT_TABLE",
                    {
                        I_URETIM_YERI: uretimYeri,
                        I_PP_ISYERI: ppIsyeri,
                        I_TBK: TBK,
                        I_TBT: TBT,
                        I_DABK: DABK,
                        I_DAB: DAB,
                        I_DK: DK,
                        I_DN: DN,
                        I_PM_BILDIRIM: pmBildirim,
                        I_PM_ISYERI: pmIsyeri,
                        I_ID: ID,


                    },
                    "O_JSON",
                    this.saveFunctionCB,
                    this
                );


            },

            saveFunctionCB: function (iv_data, iv_scope) {

                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    sap.ui.core.Fragment.byId("dexcell", "dexcellFragment").setBusy(false);
                    return
                } else {
                    iv_scope.closeFragment();


                    MessageBox.information("Bilgiler başarılı bir şekilde kaydedildi.");

                }

                sap.ui.core.Fragment.byId("dexcell", "dexcellFragment").setBusy(false);




                iv_scope.getView().byId("plant").setModel(new sap.ui.model.json.JSONModel(that.spaceArray));
                iv_scope.getView().byId("ppIsyeri").setModel(new sap.ui.model.json.JSONModel(that.spaceArray));
                iv_scope.getView().byId("dn").setModel(new sap.ui.model.json.JSONModel(that.spaceArray));
                iv_scope.getView().byId("notificationTable").setModel(new sap.ui.model.json.JSONModel(that.spaceArray));

                iv_scope.getAllData();

            },





        });





    });


