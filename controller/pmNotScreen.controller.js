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

        return Controller.extend("customActivity.controller.pmNotScreen", {
            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.generalData = [];
                this.specData = [];
                this.DAB = [];
                this.DN = [];
                this.DK = [];
                this.TBT = [];
                this.TBK = [];
                this.PMI = [];
                this.WCN;
                this.DATE1;
                this.DATE2;
                this.VA;
                this.OP;
                this.location = JSON.parse(JSON.stringify(window.location.hash));
                this.appData.intervalState = true ;
                this.mData = [] ;
                this.StartFunction();
                that = this;
                this.getNewData();
                this.getWCN();
                this.controlDokumNoColumn();


                this.intervalHandle = setInterval(function () {
                    if (window.location.hash == that.location) {

                   
                        if (that.appData.intervalState == true) {
                            that.syncButtonNotification();
                            
                        }
                    }
                }, 180000);

            },








            syncButtonNotification: function () {
                this.StartFunction();
                MessageToast.show("Tablo Güncellendi");
            },






            //create fragment kapatma
            createNotificationCancel: function () {
                this.createNotificationFragment213.close();
                this.appData.intervalState = true ;
            },

            ViewNotificationCancel: function () {
                this.createNotificationFragment2.close();
                this.appData.intervalState = true ;
            },

            closeShowDeleted: function () {

                this.deletedNotificationsFragment.close();
                this.appData.intervalState = true ;

            },



            //Tabloya güncel verilerin basılması
            StartFunction: function () {
                var value = this.getView().byId("DP1").getDateValue()
                if (!!!value) {

                    value = new Date()

                }

                var dateValue = moment(value).format('YYYY-MM-DD');

                var vardiya = this.getView().byId("vardiyacb").getSelectedKey();

                var response = TransactionCaller.sync(
                    "MES/Itelli/PM_SCREEN/T_SELECT_PMSCREEN",
                    {
                        I_WORKCTR: this.appData.node.workcenterID,
                        I_DATE: dateValue,
                        I_VARDIYA : vardiya
                    },
                    "O_JSON"
                );

                var modelArrr = Array.isArray(response[0]?.Rowsets?.Rowset?.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);

                if (!!modelArrr[0]) {

                    modelArrr.forEach(function (item, index) {


                        Object.keys(item).map((e) => {

                            if (item[e] == "---") {
                                item[e] = ''

                            }


                        })

                    })
                }
                this.mData = this.specData = JSON.parse(JSON.stringify(modelArrr));

                var tableModel = new sap.ui.model.json.JSONModel(modelArrr);

                this.getView().byId("notificationTable").setModel(tableModel);
                this.getView().byId("notificationTable").getModel().refresh();


                //-----------------------
                this.getView().byId("topdurus").setText(" 0 Dakika");
                this.getView().byId("tdurus1").setText(" 0 Dakika");
                this.getView().byId("tdurus2").setText(" 0 Dakika");
                this.getView().byId("tdurus3").setText(" 0 Dakika");

                var response = TransactionCaller.sync(
                    "MES/Itelli/PM_SCREEN/T_TIME_OF_STOP",
                    {
                        I_DATE: dateValue,
                        I_WORKCTR: this.appData.node.workcenterID,
                    },
                    "O_JSON"
                ); // distinct komutlu transaction sonucu geliyor.

                var modelArrr = Array.isArray(response[0].Rowsets.Rowset.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);

                var tableModel2 = new sap.ui.model.json.JSONModel(modelArrr); // json modelinde bir değişken yaratı
                /* tableModel2.setData(response[0]?.Rowsets?.Rowset?.Row); //içinde data set ediliyor */

                if (!(modelArrr[0]?.DURUS1 === null || modelArrr[0]?.DURUS1 === undefined || modelArrr[0]?.DURUS1 == "NA")) {
                    this.getView().byId("tdurus1").setText(" " + modelArrr[0]?.DURUS1 + " Dakika");

                }

                if (!(modelArrr[0]?.DURUS2 === null || modelArrr[0]?.DURUS2 === undefined || modelArrr[0]?.DURUS2 == "NA")) {
                    this.getView().byId("tdurus2").setText(" " + modelArrr[0]?.DURUS2 + " Dakika");


                }

                if (!(modelArrr[0]?.DURUS2 === null || modelArrr[0]?.DURUS2 === undefined || modelArrr[0]?.DURUS3 == "NA")) {

                    this.getView().byId("tdurus3").setText(" " + modelArrr[0]?.DURUS3 + " Dakika");


                }

                if (!(modelArrr[0]?.TDURUS === null || modelArrr[0]?.TDURUS === undefined || modelArrr[0]?.TDURUS == "NA")) {

                    this.getView().byId("topdurus").setText(" " + modelArrr[0]?.TDURUS + " Dakika");


                }




                this.getView().byId("vardiyacb").setSelectedKey("");
                this.getView().byId("dokumnofiltre").setSelectedKey("");

                this.controlDokumNoColumn();




            },

            // sil butonu
            deleteButtonNotification: function () {

                var selected = this.getView().byId("notificationTable")?.getSelectedContextPaths()[0]?.split("/")[1];
                if (selected === undefined) {
                    MessageToast.show("Lütfen tablodan satır seçiniz");
                    return;
                }

                /* if(!(this.getView().byId("notificationTable")?.getSelectedContextPaths()[1] == undefined)){
                    MessageToast.show("Bu işlemde çoklu seçenek özelliği kullanılamaz.");
                    return;

                } */

                if (confirm('Bu bildirimi silmek istediğinize emin misiniz?')) {




                    var a = this.getView().byId("notificationTable")?.getSelectedContextPaths();
                    var tableData = this.getView().byId("notificationTable").getModel().getData();

                    let c = [];
                    let d = [];
                    let del = [];

                    for (var i = 0; i < a.length; i++) {
                        var b = a[i].replace('/', '')

                        c.push(b);


                        d.push('' + tableData[b]?.ID + '');
                        del.push('' + tableData[b]?.ID + '');

                    };

                    this.getView().byId("notificationTable")?.setBusy(true);


                   TransactionCaller.async(
                        "MES/Itelli/PM_SCREEN/T_PM_SCREEN_DELETE",
                        {
                            IDKEY: del
                        },

                        "O_JSON",
                        this.deleteButtonNotificationCB,
                        this

                    );

                   
                }

            },


            deleteButtonNotificationCB: function (iv_data,iv_scope) {

                if (iv_data[1] == "E") {
                    alert(iv_data[0]);
                    iv_scope.getView().byId("notificationTable")?.setBusy(false);
                } else {

                    iv_scope.getView().byId("notificationTable")?.setBusy(false);
                    MessageBox.information("İşlem başarılı bir şekilde gerçekleştirildi.");
                }


            

                iv_scope.StartFunction();


            },
            //detayları göster butonu




            divideNotificationButton: function () {

                var index = this.getView().byId("notificationTable")?.getSelectedContextPaths()[0]?.split("/")[1];
                if (index === undefined) {
                    MessageToast.show("Lütfen tablodan satır seçiniz");
                    return;
                }
                var tableData = this.getView().byId("notificationTable").getModel().getData();
                var nottype = tableData[index]?.NOTTYPE;

                if (!(nottype == "OTO")) {

                    MessageToast.show("Sadece 'OTO' bildirimler bölünebilir.");
                }

                else {


                    var cevap = prompt(" Bu bildirimi ikiye bölmek üzeresiniz." + "\n" + "İlk bildirimin kaç dakika olduğunu giriniz: ");

                    return this.divideFunction(cevap)


                }



            },

            divideFunction: function (cevap) {

                if (cevap == "" || cevap == undefined) {

                    MessageToast.show("Bildirim dakikası alanı boş bırakılamaz. Lütfen doldurup tekrar deneyiniz.");

                    return
                }

                if (cevap < "0") {

                    MessageToast.show("Dakika değeri en az 1 olmalıdır.");

                    return

                }


                var index = this.getView().byId("notificationTable")?.getSelectedContextPaths()[0]?.split("/")[1];
                if (index === undefined) {
                    MessageToast.show("Lütfen tablodan satır seçiniz");
                    return;
                }
                var tableData = this.getView().byId("notificationTable").getModel().getData();

                var I_ID = tableData[index].ID;
                var I_DOKUM_NO = tableData[index].DOKUM_NO;
                var I_FACENDDATE = tableData[index].FACENDDATE;
                var I_FACSTRTDATE = tableData[index].FACSTRTDATE;
                var I_INSDATE = tableData[index].OINSDATE;
                var I_INSUSER = tableData[index].OINSUSER;
                var I_WORKCTR = tableData[index].WORKCTR;
                var I_CEVAP = cevap;


                var response = TransactionCaller.sync(
                    "MES/Itelli/PM_SCREEN/T_PM_DIVIDE_FUNC",
                    {
                        I_ID: I_ID,
                        I_DOKUM_NO: I_DOKUM_NO,
                        I_FACENDDATE: I_FACENDDATE,
                        I_FACSTRTDATE: I_FACSTRTDATE,
                        I_INSDATE: I_INSDATE,
                        I_INSUSER: I_INSUSER,
                        I_WORKCTR: I_WORKCTR,
                        I_CEVAP: I_CEVAP
                    },

                    "O_JSON"

                );

                if (response[1] == "E") {
                    alert(response[0]);
                } else {


                    MessageBox.information("işlem başarılı bir şekilde gerçekleştirildi.");
                }

                this.StartFunction();


            },


            aggregateNotificationButton: function () {

                var index = this.getView().byId("notificationTable")?.getSelectedContextPaths()[0]?.split("/")[1];
                if (index === undefined) {
                    MessageToast.show("Lütfen tablodan satır seçiniz");
                    return;
                }

                if (this.getView().byId("notificationTable")?.getSelectedContextPaths()[1] === undefined) {

                    MessageToast.show("Birleştirme işlemi yapmak için en az iki seçim yapmalısınız.");
                    return;

                }

                var a = this.getView().byId("notificationTable")?.getSelectedContextPaths();
                var tableData = this.getView().byId("notificationTable").getModel().getData();

                let c = [];
                let d = [];
                let del = [];

                for (var i = 0; i < a.length; i++) {
                    var b = a[i].replace('/', '')

                    c.push(b);

                    if (tableData[b]?.NOTTYPE != "OTO") {

                        MessageBox.information("Bu işlem sadece 'OTO' Bildirim türleri ile yapılabilir.");
                        return

                    }


                    d.push('' + tableData[b]?.ID + '');
                    del.push('' + tableData[b]?.ID + '');

                };

                var upd = d[0];




                del.splice(0, 1);


                var response = TransactionCaller.sync(
                    "MES/Itelli/PM_SCREEN/AggregateFunc/T_AggregateFunc",
                    {
                        I_ID_KEYS: d,
                        I_DELS: del,
                        I_UPD: upd,

                    },

                    "O_JSON"

                );


                if (response[1] == "E") {
                    alert(response[0]);
                } else {


                    MessageBox.information("İşlem başarılı bir şekilde gerçekleştirildi.");
                }



                this.StartFunction();



            },

            pmNEW: function () {
                //2SIRA
                if (!this.createNotificationFragment213) {
                    this.createNotificationFragment213 = sap.ui.xmlfragment("fragmentCreateNotification2", "customActivity.fragmentView.pmNEW", this);
                    this.getView().addDependent(this.createNotificationFragment213);

                }
                this.createNotificationFragment213.setEscapeHandler((oEscapeHandler) => {that.createNotificationCancel();});

                this.appData.intervalState = false ;

                this.clearFragment();
                this.getNewData();
                var users = this.getUsers();


                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik")?.setModel(new sap.ui.model.json.JSONModel(that.DAB));
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni")?.setModel(new sap.ui.model.json.JSONModel(that.DN));
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu")?.setModel(new sap.ui.model.json.JSONModel(that.DK));
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi")?.setModel(new sap.ui.model.json.JSONModel(that.TBT));
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu")?.setModel(new sap.ui.model.json.JSONModel(that.TBK));
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri")?.setModel(new sap.ui.model.json.JSONModel(that.PMI));

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").setValue(users?.AMIR_FULL_NAME);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "NotifiedUser").setValue(users?.OP_FULL_NAME);



                this.controlAO();



                var shift = this.getShift();
                var lastAUFNRs = this.getLastAUFNRs();
                var AUFNR = this.getActiveAUFNR();

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiya")?.setValue(shift);

                if (!(this.WCN == "FLMHAD")) {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip")?.setModel(new sap.ui.model.json.JSONModel(lastAUFNRs));
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip")?.setSelectedKey(AUFNR);
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip")?.setValue(AUFNR);

                }
                else {
                    var ktkAUFNR = this.KutukAUFNR();
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip")?.setSelectedKey(ktkAUFNR);
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip")?.setValue(ktkAUFNR);
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip").setEnabled(false);
                }







                this.createNotificationFragment213.open();
                this.createNotificationFragment213.setTitle("Bakım ve Onarım Bildirimi Yarat");


                this.uniqueValues();




            },


            getNewData: function () {
                // 1SIRA
                var params = {
                    "Param.1": this.appData.plant,
                    "Param.2": this.appData.node.nodeID,

                };
                var tRunner = new TransactionRunner("MES/Itelli/PM_SCREEN/pmNEW/Q_pmNEWdata", params);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return;
                }
                var oData = tRunner.GetJSONData();
                var oModel = new sap.ui.model.json.JSONModel();

                //sorgudan dönen sonuc ana veri olarak set edilir.
                if (!!(oData[0]?.Row)) {
                    this.generalData = oData[0]?.Row;
                }

                //geçici arrayımıza ana veriyi kopyalıyoruz.

                this.specData = JSON.parse(JSON.stringify(this.generalData));

                //gelen ana modeldeki verilerin her key için unique(distinct) verileri bulunmak üzere başka bir fonksiyona gönderiliyor
                /* this.uniqueValues(); */


            },

            TesisStartDateTime: function () {
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartDate")?.setDateValue(new Date());
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartTime")?.setDateValue(new Date());

                this.TesiscalculateTimeInMinutes2();

            },

            //Bitiş Zamanı alanında butonuna basılmasıyla güncel zamanının set edilmesi
            TesisEndDateTime: function () {

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndDate")?.setDateValue(new Date());
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndTime")?.setDateValue(new Date());


                this.TesiscalculateTimeInMinutes2();

            },

            uniqueValues: function (a) {
                //3SIRA
                //Bu açıklama aşağıdaki bütün Map fonksiyonları için geçerlidir:
                //Bu fonksiyon sayesinde filtrelenmiş veya filtrelenmemiş modelimiz içinde verdiğimiz key'deki unique(distinct) verileri sıralayabiliyoruz
                //Her key için verileri global scope'daki arraylara basıyoruz.

                that.TBT = [...new Map(this.specData.map(item => [item["TEKNIK_BIRIM_TANIMI"], item])).values()];
                that.TBK = [...new Map(this.specData.map(item => [item["TEKNIK_BIRIM_KODU"], item])).values()];
                that.PMI = [...new Map(this.specData.map(item => [item["PM_ISYERI"], item])).values()];
                that.DAB = [...new Map(this.specData.map(item => [item["DURUS_ANA_BASLIK"], item])).values()];
                that.DN = [...new Map(this.specData.map(item => [item["DURUS_NEDENI"], item])).values()];
                that.DK = [...new Map(this.specData.map(item => [item["DURUS_KODU"], item])).values()];

                

                //comboboxları içi dolu mu diye bakıyoruz. İçi boş olanlara ilgili veriler basılacak
                var DAB = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik")?.getSelectedKey();
                var DN = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni")?.getSelectedKey();
                var DK = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu")?.getSelectedKey();
                var TBT = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi")?.getSelectedKey();
                var TBK = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu")?.getSelectedKey();
                var PMI = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri")?.getSelectedKey();

                if (that.TBT[0] == undefined || that.TBK[0] == undefined || that.PMI[0] == undefined || that.DAB[0] == undefined || that.DN[0] == undefined || that.DK[0] == undefined ){
                    if (DAB == "" && TBK == "" && PMI == "" && DAB == "" && DN == "" && DK == ""){
                    
                    }
                    else{
                        that.resetFilter();
                    MessageToast.show("Veriler uygunsuz olduğu için filtreler resetlenmiştir.");
                
                    }
                }


                //Bu açıklama aşağıdaki bütün ifler için geçerlidir:
                //Eğer bir combobox'ın içi boş ise filtrelerden geçirilmiş bu comboBox'a özel yukarıda hazırlanmış model set edilir.
                if (DAB == '') {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik")?.setModel(new sap.ui.model.json.JSONModel(that.DAB));
                    if (that.DAB.length == 1) { sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik")?.setSelectedKey(that.DAB[0]?.DURUS_ANA_BASLIK) };
                }

                if (DN == '') {
                    that.DN = that.DN.sort((A, B) => (A['DURUS_NEDENI'] > B['DURUS_NEDENI']) ? 1 : -1); // Alfabetik sıraya soktuk
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni")?.setModel(new sap.ui.model.json.JSONModel(that.DN));
                    if (that.DN.length == 1) { sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni")?.setSelectedKey(that.DN[0]?.DURUS_NEDENI) };
                }

                if (DK == '') {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu")?.setModel(new sap.ui.model.json.JSONModel(that.DK));
                    if (that.DK.length == 1) { sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu")?.setSelectedKey(that.DK[0]?.DURUS_KODU) };
                }

                if (TBT == '') {
                    that.TBT = that.TBT.sort((A, B) => (A['TEKNIK_BIRIM_TANIMI'] > B['TEKNIK_BIRIM_TANIMI']) ? 1 : -1); // Alfabetik sıraya soktuk
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi")?.setModel(new sap.ui.model.json.JSONModel(that.TBT));
                    if (that.TBT.length == 1) { sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi")?.setSelectedKey(that.TBT[0]?.TEKNIK_BIRIM_TANIMI) };
                }

                if (TBK == '') {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu")?.setModel(new sap.ui.model.json.JSONModel(that.TBK));
                    if (that.TBK.length == 1) { sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu")?.setSelectedKey(that.TBK[0]?.TEKNIK_BIRIM_KODU) };
                }

                if (PMI == '') {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri")?.setModel(new sap.ui.model.json.JSONModel(that.PMI));
                    if (that.PMI.length == 1) { sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri")?.setSelectedKey(that.PMI[0]?.PM_ISYERI) };
                }

                //Fonksiyonu terkederken geçici array'ımızı tekrar ana veriyeri eşitliyoruz. Böylece bu işlemler tekrar ve tekrar yapılabilir.

                this.specData = JSON.parse(JSON.stringify(this.generalData));


            },


            resetFilter: function () {
                //5SIRA
                //İşlemin yarısında filtre sıfırlanmak istenirse bütün combobox'lar temizlenir ve 
                //gecici array ana veriye eşitlenip filtreleme işlemi baştan başlatılır.

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik")?.setModel(new sap.ui.model.json.JSONModel());
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni")?.setModel(new sap.ui.model.json.JSONModel());
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu")?.setModel(new sap.ui.model.json.JSONModel());
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi")?.setModel(new sap.ui.model.json.JSONModel());
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu")?.setModel(new sap.ui.model.json.JSONModel());
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri")?.setModel(new sap.ui.model.json.JSONModel());


                this.specData = JSON.parse(JSON.stringify(this.generalData));

                var a = 1;

                this.uniqueValues(a);
            },

            TBTfilter: function () {

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu").setModel(new sap.ui.model.json.JSONModel());

                this.filter();


            },


            filter: function () {
                //4SIRA
                //ana verimizi gecici arraya kopyalıyoruz.






                this.specData = JSON.parse(JSON.stringify(this.generalData));



                // daha önceden seçilmiş key'lere bakıyoruz. Eğer seçilmiş varsa ona müdahale etmeyeceğiz.
                var DAB = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik")?.getSelectedKey();
                var DN = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni")?.getSelectedKey();
                var DK = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu")?.getSelectedKey();
                var TBT = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi")?.getSelectedKey();
                var TBK = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu")?.getSelectedKey();
                var PMI = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri")?.getSelectedKey();




                //aşağıdaki bütün ifler için bu açıklama geçerlidir:
                //eğer key doluysa o key'e göre filtrelemek üzere filter fonksiyonuna sokuyoruz. Filtrelenmiş model artık yeni geçici arrayımız oluyor
                //Bu sayede bir sonraki işlemlere key'i dolu olan yerin key'ine göre filtrelenmiş model ile devam etmiş oluyoruz


                if (!(DAB == '')) {
                    var array = that.specData.filter(function (item) {
                        return item.DURUS_ANA_BASLIK == sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik")?.getSelectedKey();;
                    });
                    that.specData = [];
                    that.specData = array;
                }

                if (!(DN == '')) {
                    var array = that.specData.filter(function (item) {
                        return item.DURUS_NEDENI == sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni")?.getSelectedKey();;
                    });
                    that.specData = [];
                    that.specData = array;
                }

                if (!(DK == '')) {
                    var array = that.specData.filter(function (item) {
                        return item.DURUS_KODU == sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu")?.getSelectedKey();;
                    });
                    that.specData = [];
                    that.specData = array;
                }

                if (!(TBT == '')) {
                    var array = that.specData.filter(function (item) {
                        return item.TEKNIK_BIRIM_TANIMI == sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi")?.getSelectedKey();;
                    });
                    that.specData = [];
                    that.specData = array;
                }

               /*  if (!(TBK == '')) {
                    var array = that.specData.filter(function (item) {
                        return item.TEKNIK_BIRIM_KODU == sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu")?.getSelectedKey();;
                    });
                    that.specData = [];
                    that.specData = array;
                }*/

                if (!(PMI == '')) {
                    var array = that.specData.filter(function (item) {
                        return item.PM_ISYERI == sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri")?.getSelectedKey();;
                    });
                    that.specData = [];
                    that.specData = array;
                } 

                //
                this.uniqueValues();
                this.controlDataTable();


            },

            getWCN: function () {


                var params = {
                    "Param.1": this.appData.node.nodeID,
                    "Param.2": this.appData.plant,

                };
                var tRunner = new TransactionRunner("MES/Itelli/PM_SCREEN/pmNEW/Q_GET_WORKCENTER_NAME", params);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return;
                }
                var oData = tRunner.GetJSONData();
                this.WCN = oData[0]?.Row[0]?.NAME;

            },

            controlAO: function () {

                if (!!!(this.WCN == "AO")) {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "hbox1")?.setVisible(true);
                }
                else {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "hbox1")?.setVisible(false);
                }

                if (this.WCN == "AO") {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "hbox2")?.setVisible(true);
                }
                else {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "hbox2")?.setVisible(false);
                }

                if (!!!(this.WCN == "AO")) {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "hbox3")?.setVisible(true);
                }
                else {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "hbox3")?.setVisible(false);
                }



            },

            controlAO2: function () {

                if (!!!(this.WCN == "AO")) {
                    sap.ui.core.Fragment.byId("fragmentNotification2", "hbox1")?.setVisible(true);
                }
                else {
                    sap.ui.core.Fragment.byId("fragmentNotification2", "hbox1")?.setVisible(false);
                }

                if (this.WCN == "AO") {
                    sap.ui.core.Fragment.byId("fragmentNotification2", "hbox2")?.setVisible(true);
                }
                else {
                    sap.ui.core.Fragment.byId("fragmentNotification2", "hbox2")?.setVisible(false);
                }

                if (!!!(this.WCN == "AO")) {
                    sap.ui.core.Fragment.byId("fragmentNotification2", "hbox3")?.setVisible(true);
                }
                else {
                    sap.ui.core.Fragment.byId("fragmentNotification2", "hbox3")?.setVisible(false);
                }



            },

            getShift: function () {

                var clock = moment(Date.now()).format('HH');
                var shift;

                if (0 <= clock && clock < 8) { shift = 1 }
                else if (8 <= clock && clock < 16) { shift = 2 }
                else { shift = 3 }

                return shift

            },

            getRealShift: function () {
                var clock = moment(this.DATE1).format('HH')
                var shift;

                if (0 <= clock && clock < 8) { shift = 1 }
                else if (8 <= clock && clock < 16) { shift = 2 }
                else { shift = 3 }

                return shift


            },


            TesiscalculateTimeInMinutes2: function () {
                var startDate = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartDate").getDateValue();
                var startTime = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartTime").getDateValue();

                var endDate = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndDate").getDateValue();
                var endTime = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndTime").getDateValue();

                if (startDate != null && startTime != null && endDate != null && endTime != null) {
                    var getFullYear_Start = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartDate").getDateValue().getFullYear();
                    var getMonth_Start = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartDate").getDateValue().getMonth();
                    var getDate_Start = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartDate").getDateValue().getDate();
                    var getHours_Start = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartTime").getDateValue().getHours();
                    var getMinutes_Start = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartTime").getDateValue().getMinutes();
                    var combinedDateTime_Start = new Date(getFullYear_Start, getMonth_Start, getDate_Start, getHours_Start, getMinutes_Start);

                    var getFullYear_End = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndDate").getDateValue().getFullYear();
                    var getMonth_End = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndDate").getDateValue().getMonth();
                    var getDate_End = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndDate").getDateValue().getDate();
                    var getHours_End = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndTime").getDateValue().getHours();
                    var getMinutes_End = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndTime").getDateValue().getMinutes();
                    var combinedDateTime_End = new Date(getFullYear_End, getMonth_End, getDate_End, getHours_End, getMinutes_End);

                    if (combinedDateTime_End.getTime().toString() == "NaN" || combinedDateTime_Start.getTime().toString() == "NaN") {
                        var differenceInMinutes = "";
                    } else {
                        var differenceInMinutes = (combinedDateTime_End.getTime() - combinedDateTime_Start.getTime()) / 60000;
                    }



                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisidTimeInMinutes")?.setValue(differenceInMinutes);

                }
            },

            createNewNotification: function () {

                var datecontrol = this.dateControl();
                if (datecontrol == "E") { return };
                var isPM = this.pmControl();

                if (sap.ui.core.Fragment.byId("fragmentCreateNotification2", "partiNo").getValue() == '' && sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik").getSelectedKey() == "HAMMADDE KAYNAKLI") {

                    MessageBox.error("Hammadde kaynaklı duruşlarda 'Parti No' alanı doldurulmalıdır!");
                    return;
                }

                this.saveFunction()

            },


            dateControl: function () {

                var TesisStartDate = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartDate")?.getDateValue();
                var TesisStartTime = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartTime")?.getDateValue();

                var TesisgetFullYear_Start = TesisStartDate?.getFullYear();
                var TesisgetMonth_Start = TesisStartDate?.getMonth();
                var TesisgetDate_Start = TesisStartDate?.getDate();
                var TesisgetHours_Start = TesisStartTime?.getHours();
                var TesisgetMinutes_Start = TesisStartTime?.getMinutes();
                var TesiscombinedDateTime_Start = new Date(TesisgetFullYear_Start, TesisgetMonth_Start, TesisgetDate_Start, TesisgetHours_Start, TesisgetMinutes_Start);
                if (new Date().getTime() - TesiscombinedDateTime_Start?.getTime() < 0) {
                    MessageBox.error("Bildirim başlangıç zamanı gelecek zamanda olamaz!");
                    return;
                }

                if (TesiscombinedDateTime_Start == undefined || TesiscombinedDateTime_Start == "Invalid Date") { TesiscombinedDateTime_Start = ""; }
                else { TesiscombinedDateTime_Start = TesiscombinedDateTime_Start.toISOString(); }


                var TesisEndDate = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndDate")?.getDateValue();
                var TesisEndTime = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndTime")?.getDateValue();

                var TesisgetFullYear_End = TesisEndDate?.getFullYear();
                var TesisgetMonth_End = TesisEndDate?.getMonth();
                var TesisgetDate_End = TesisEndDate?.getDate();
                var TesisgetHours_End = TesisEndTime?.getHours();
                var TesisgetMinutes_End = TesisEndTime?.getMinutes();
                var TesiscombinedDateTime_End = new Date(TesisgetFullYear_End, TesisgetMonth_End, TesisgetDate_End, TesisgetHours_End, TesisgetMinutes_End);
                if (new Date().getTime() - TesiscombinedDateTime_End?.getTime() < 0) {
                    MessageBox.error("Bildirim bitiş zamanı gelecek zamanda olamaz!");
                    return;
                }

                if (TesiscombinedDateTime_End == undefined || TesiscombinedDateTime_End == "Invalid Date") { TesiscombinedDateTime_End = ""; }
                else { TesiscombinedDateTime_End = TesiscombinedDateTime_End.toISOString(); }

                this.DATE1 = TesiscombinedDateTime_Start;
                this.DATE2 = TesiscombinedDateTime_End;

                var ID = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "selectedid")?.getValue();


                var response = TransactionCaller.sync(
                    "MES/Itelli/PM_SCREEN/pmNEW/T_STOP_CONTROL",
                    {
                        I_WORKCTR: this.appData.node.workcenterID,
                        I_DATE1: this.DATE1,
                        I_DATE2: this.DATE2,
                        I_ID: ID,

                    },

                    "O_JSON"

                );

                if (response[1] == "E") {
                    MessageBox.error(response[0]);
                    return "E"
                }
            },

            getActiveAUFNR: function () {

                /*  var params = {
                     "Param.1": this.appData.node.nodeID,
                 };
                 var tRunner = new TransactionRunner("MES/Itelli/PM_SCREEN/pmNEW/Q_GET_ACT_AUFNR", params);
                 if (!tRunner.Execute()) {
                     MessageBox.error(tRunner.GetErrorMessage());
                     return;
                 }
                 var oData = tRunner.GetJSONData();
 
                 return oData[0]?.Row[0]?.AUFNR */

                return this.appData?.selected?.order?.orderNo
            },

            getLastAUFNRs: function () {

                var params = {
                    "Param.1": this.appData.node.nodeID,
                };
                var tRunner = new TransactionRunner("MES/Itelli/PM_SCREEN/pmNEW/Q_GET_LAST_AUFNRS", params);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return;
                }
                var oData = tRunner.GetJSONData();

                return oData[0]?.Row



            },




            pmControl: function () {

                var dk = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu")?.getSelectedKey();
                var tbk = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu")?.getSelectedKey();

                var array = that.specData.filter(function (item) {
                    return item.DURUS_KODU == dk;
                });


                var array2 = array.filter(function (item) {
                    return item.TEKNIK_BIRIM_KODU == tbk;
                });


                return array2[0]?.PM_BILDIRIMI

            },

            KutukAUFNR: function () {


                var params = {
                };
                var tRunner = new TransactionRunner("MES/Itelli/PM_SCREEN/pmNEW/Q_KUTUK_AUFNR", params);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return;
                }
                var oData = tRunner.GetJSONData();

                return oData[0]?.Row[0]?.AUFNR;


            },

            clearFragment: function () {

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip").setEnabled(true);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip").setSelectedKey("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "dokumNo").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik").setSelectedKey("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni").setSelectedKey("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu").setSelectedKey("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi").setSelectedKey("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu").setSelectedKey("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri").setSelectedKey("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "partiNo").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartDate").setValue(null);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartTime").setValue(null);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndDate").setValue(null);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndTime").setValue(null);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisidTimeInMinutes").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiya").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "NotifiedUser").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "selectedid").setValue("");
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "idExplanations").setValue("");

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "notnum").setValue("");


            },

            updateButtonNotification2: function () {

                var index = this.getView().byId("notificationTable")?.getSelectedContextPaths()[0]?.split("/")[1];
                if (index === undefined) {
                    MessageToast.show("Lütfen tablodan satır seçiniz");
                    return;
                }

                if (!(this.getView().byId("notificationTable")?.getSelectedContextPaths()[1] == undefined)) {
                    MessageToast.show("Bu işlemde çoklu seçenek özelliği kullanılamaz.");
                    return;

                }
                var tableData = this.getView().byId("notificationTable").getModel().getData();
                var notnum = tableData[index]?.NOTNUM;
                var selectedID = tableData[index]?.ID;
                this.pmNEW();


                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "selectedid").setValue(selectedID);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "notnum").setValue(notnum);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip").setSelectedKey(tableData[index]?.AUFNR);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip").setValue(tableData[index]?.AUFNR);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "dokumNo").setSelectedKey(tableData[index]?.DOKUM_NO);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "dokumNo").setValue(tableData[index]?.DOKUM_NO);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik").setSelectedKey(tableData[index]?.CATGROUP);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik").setValue(tableData[index]?.CATGROUP);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni").setSelectedKey(tableData[index]?.CATREASON);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni").setValue(tableData[index]?.CATREASON);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu").setSelectedKey(tableData[index]?.CATCODE);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu").setValue(tableData[index]?.CATCODE);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi").setSelectedKey(tableData[index]?.TECHUNIT);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi").setValue(tableData[index]?.TECHUNIT);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu").setSelectedKey(tableData[index]?.TECHCODE);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu").setValue(tableData[index]?.TECHCODE);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri").setSelectedKey(tableData[index]?.PM_WORKCTR);
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri").setValue(tableData[index]?.PM_WORKCTR);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "partiNo").setValue(tableData[index]?.BATCHNO);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "idExplanations").setValue(tableData[index]?.DESCRIPTON);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartDate").setDateValue(new Date(tableData[index]?.FACSTRTDATE));
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisStartTime").setDateValue(new Date(tableData[index]?.FACSTRTDATE));

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndDate").setDateValue(new Date(tableData[index]?.FACENDDATE));
                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisEndTime").setDateValue(new Date(tableData[index]?.FACENDDATE));

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisidTimeInMinutes").setValue(tableData[index]?.FACM);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiya").setValue(tableData[index]?.VARDIYA);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").setValue(tableData[index]?.AMIR_FULL_NAME);

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "NotifiedUser").setValue(tableData[index]?.OP_FULL_NAME);

            },

            saveFunction: function () {

                var DAB = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik").getSelectedKey();
                var DN = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni").getSelectedKey();
                var DK = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu").getSelectedKey();
                var TBT = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi").getSelectedKey();
                var TBK = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu").getSelectedKey();
                var PMI = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri").getSelectedKey();



                if ((DAB == '') || (DN == '') || (DK == '') || (TBT == '') || (TBK == '') || (PMI == '')) {

                    MessageBox.error("Lütfen gerekli bilgileri doldurup tekrar deneyiniz.");

                    return;

                }

                var idPMNotificationType = this.pmControl();
                var AUFNR = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "uretimsip").getSelectedKey();
                var dokumno = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "dokumNo").getValue();
                var CatGroup = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik").getSelectedKey();
                var CatCode = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu").getSelectedKey();
                var catreason = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni").getSelectedKey();
                var TechBirim = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi").getSelectedKey();
                var TechCode = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu").getSelectedKey();
                var PMI = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri").getSelectedKey();
                var batchNo = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "partiNo").getValue();
                var idExplanations = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "idExplanations").getValue();
                var notnum = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "notnum").getValue();
                var vardiya = this.getRealShift();
                var v_amir = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").getValue();
                var NotifiedUser = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "NotifiedUser").getValue();
                var TesisidTimeInMinutes = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TesisidTimeInMinutes").getValue();
                var ID = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "selectedid").getValue();

                if (TesisidTimeInMinutes == 0 || TesisidTimeInMinutes < 0) { MessageBox.error("Arıza bitiş tarihi arıza başlangıcından önce olamaz."); return; }
                if (sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").getValue() == "") { MessageBox.error("Lütfen 'Vardiya Amiri' alanını doldurunuz."); return; }

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "idSelectedID2").setBusy(true);



                TransactionCaller.async(
                    "MES/Itelli/PM_SCREEN/T_PM_SCREEN_INS",
                    {
                        I_idPMNotificationType: idPMNotificationType,
                        I_AUFNR: AUFNR,
                        I_DOKUM_NO: dokumno,
                        I_CatGroup: CatGroup,
                        I_CATREASON: catreason,
                        I_CatCode: CatCode,
                        I_TechBirim: TechBirim,
                        I_TechCode: TechCode,
                        I_PMI: PMI,
                        I_BatchNo: batchNo,
                        I_idExplanations: idExplanations,
                        I_TesiscombinedDateTime_Start: this.DATE1,
                        I_TesiscombinedDateTime_End: this.DATE2,
                        I_TesisidTimeInMinutes: TesisidTimeInMinutes,

                        I_NotifiedUser: this.appData.user.userID,
                        I_WORKCTR: this.appData.node.workcenterID,
                        I_ProductionPlace: this.appData.plant,
                        I_nodeid: this.appData.node.nodeID,
                        I_SELECTID: ID,
                        I_NOTNUM: notnum,
                        I_VARDIYA: vardiya,
                        I_V_AMIR: this.VA,
                        I_OPERATOR: this.OP,
                        I_OP_FULL_NAME: NotifiedUser,
                        I_AMIR_FULL_NAME: v_amir

                    },
                    "O_JSON",
                    this.saveFunctionCB,
                    this
                );



            },

            saveFunctionCB: function (iv_data, iv_scope) {

                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "idSelectedID2").setBusy(false);
                    return
                } else {
                    iv_scope.createNotificationCancel();

                    MessageBox.information("Bildirim başarılı bir şekilde yaratıldı.");
                }

                iv_scope.StartFunction();

                sap.ui.core.Fragment.byId("fragmentCreateNotification2", "idSelectedID2").setBusy(false);


            },


            ShowDetails: function (oEvent) {

                var index = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];
                var tableData = this.getView().byId("notificationTable").getModel().getData();

                if (!this.createNotificationFragment2) {
                    this.createNotificationFragment2 = sap.ui.xmlfragment("fragmentNotification2", "customActivity.fragmentView.Z_pmScreen_ViewNot", this);
                    this.getView().addDependent(this.createNotificationFragment2);

                }

                this.createNotificationFragment2.setEscapeHandler((oEscapeHandler) => {that.ViewNotificationCancel();});

                this.appData.intervalState = false ;

                this.controlAO2();

                this.createNotificationFragment2.open();



                sap.ui.core.Fragment.byId("fragmentNotification2", "uretimsip").setSelectedKey(tableData[index]?.AUFNR);
                sap.ui.core.Fragment.byId("fragmentNotification2", "uretimsip").setValue(tableData[index]?.AUFNR);

                sap.ui.core.Fragment.byId("fragmentNotification2", "dokumNo").setSelectedKey(tableData[index]?.DOKUM_NO);
                sap.ui.core.Fragment.byId("fragmentNotification2", "dokumNo").setValue(tableData[index]?.DOKUM_NO);

                sap.ui.core.Fragment.byId("fragmentNotification2", "DurusAnaBaslik").setSelectedKey(tableData[index]?.CATGROUP);
                sap.ui.core.Fragment.byId("fragmentNotification2", "DurusAnaBaslik").setValue(tableData[index]?.CATGROUP);

                sap.ui.core.Fragment.byId("fragmentNotification2", "DurusNedeni").setSelectedKey(tableData[index]?.CATREASON);
                sap.ui.core.Fragment.byId("fragmentNotification2", "DurusNedeni").setValue(tableData[index]?.CATREASON);

                sap.ui.core.Fragment.byId("fragmentNotification2", "DurusKodu").setSelectedKey(tableData[index]?.CATCODE);
                sap.ui.core.Fragment.byId("fragmentNotification2", "DurusKodu").setValue(tableData[index]?.CATCODE);

                sap.ui.core.Fragment.byId("fragmentNotification2", "TeknikBirimTanimi").setSelectedKey(tableData[index]?.TECHUNIT);
                sap.ui.core.Fragment.byId("fragmentNotification2", "TeknikBirimTanimi").setValue(tableData[index]?.TECHUNIT);

                sap.ui.core.Fragment.byId("fragmentNotification2", "TeknikBirimKodu").setSelectedKey(tableData[index]?.TECHCODE);
                sap.ui.core.Fragment.byId("fragmentNotification2", "TeknikBirimKodu").setValue(tableData[index]?.TECHCODE);

                sap.ui.core.Fragment.byId("fragmentNotification2", "PmIsyeri").setSelectedKey(tableData[index]?.PM_WORKCTR);
                sap.ui.core.Fragment.byId("fragmentNotification2", "PmIsyeri").setValue(tableData[index]?.PM_WORKCTR);

                sap.ui.core.Fragment.byId("fragmentNotification2", "partiNo").setValue(tableData[index]?.BATCHNO);

                sap.ui.core.Fragment.byId("fragmentNotification2", "idExplanations").setValue(tableData[index]?.DESCRIPTON);

                sap.ui.core.Fragment.byId("fragmentNotification2", "TesisStartDate").setDateValue(new Date(tableData[index]?.FACSTRTDATE));
                sap.ui.core.Fragment.byId("fragmentNotification2", "TesisStartTime").setDateValue(new Date(tableData[index]?.FACSTRTDATE));

                sap.ui.core.Fragment.byId("fragmentNotification2", "TesisEndDate").setDateValue(new Date(tableData[index]?.FACENDDATE));
                sap.ui.core.Fragment.byId("fragmentNotification2", "TesisEndTime").setDateValue(new Date(tableData[index]?.FACENDDATE));

                sap.ui.core.Fragment.byId("fragmentNotification2", "TesisidTimeInMinutes").setValue(tableData[index]?.FACM);

                sap.ui.core.Fragment.byId("fragmentNotification2", "vardiya").setValue(tableData[index]?.VARDIYA);

                sap.ui.core.Fragment.byId("fragmentNotification2", "vardiyaAmiri").setValue(tableData[index]?.AMIR_FULL_NAME);

                sap.ui.core.Fragment.byId("fragmentNotification2", "NotifiedUser").setValue(tableData[index]?.OP_FULL_NAME);



            },

            getUsers: function () {

                var workctr = this.appData.node.workcenterID;
                var date = moment(Date.now()).format('YYYY-MM-DD');
                var vardiya = this.getShift();

                var params = {
                    "Param.1": workctr,
                    "Param.2": date,
                    "Param.3": vardiya,

                };
                var tRunner = new TransactionRunner("MES/Itelli/PM_SCREEN/pmNEW/Q_GET_USERS", params);
                if (!tRunner.Execute()) {
                    MessageBox.error(tRunner.GetErrorMessage());
                    return;
                }
                var oData = tRunner.GetJSONData();

                if (!(oData[0].Row == undefined)) {

                    return oData[0].Row[0]
                }

            },

            getOP: function () {



                var operator = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "NotifiedUser").getValue();
                this.OP = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "NotifiedUser").getValue();
                var fullname = this.getFullName(operator);

                if (!(isNaN(operator)) && operator < 5213) {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "NotifiedUser").setValue(fullname);
                }
                else {

                    MessageBox.error("Lütfen geçerli bir ID giriniz!")
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "NotifiedUser").setValue("");
                    return
                }

            },

            getVA: function () {

                var amir = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").getValue();
                this.VA = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").getValue();
                var fullname = this.getFullName(amir);

                if (!(isNaN(amir)) && amir < 5213) {
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").setValue(fullname);
                }
                else {

                    MessageBox.error("Lütfen geçerli bir ID giriniz!")
                    sap.ui.core.Fragment.byId("fragmentCreateNotification2", "vardiyaAmiri").setValue("");
                    return
                }




            },

            getFullName: function (id) {


                var params = {
                    "Param.1": id,

                };
                var tRunner = new TransactionRunner("MES/Itelli/PM_SCREEN/pmNEW/Q_GET_FULL_NAME", params);
                if (!tRunner.Execute()) {
                    /*  MessageBox.error(tRunner.GetErrorMessage()); */
                    return;
                }
                var oData = tRunner.GetJSONData();

                if (!(oData[0].Row == undefined)) {

                    return oData[0].Row[0].VORNA + " " + oData[0].Row[0].NACHN
                }
                else {

                    return "Ad-soyad bulunamadı"
                }



            },


            controlDataTable: function () {

                var DAB = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusAnaBaslik").getSelectedKey();
                var DN = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusNedeni").getSelectedKey();
                var DK = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "DurusKodu").getSelectedKey();
                var TBT = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimTanimi").getSelectedKey();
                var TBK = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "TeknikBirimKodu").getSelectedKey();
                var PMI = sap.ui.core.Fragment.byId("fragmentCreateNotification2", "PmIsyeri").getSelectedKey();



                if (!(DAB == '') && !(DN == '') && !(DK == '') && !(TBT == '') && !(TBK == '') && !(PMI == '')) {



                    var response = TransactionCaller.sync(
                        "MES/Itelli/PM_SCREEN/pmNEW/T_DATA_CONTROL",
                        {
                            I_DAB: DAB,
                            I_DN: DN,
                            I_DK: DK,
                            I_TBT: TBT,
                            I_TBK: TBK,
                            I_PMI: PMI,
                            I_URETIM_YERI: this.appData.plant,
                            I_PP_ISYERI: this.WCN,

                        },
                        "O_JSON"
                    );

                    if (response[1] == "E") {
                        MessageToast.show("Bilgiler uyumlu olmadığı için filtreler sıfırlanmıştır.");
                        this.resetFilter();
                    }


                }



            },

            controlDokumNoColumn: function () {
                if (this.WCN == "AO") {
                    this.getView().byId("dokumnocolumn")?.setVisible(true);
                    this.getView().byId("dokumnoflexbox")?.setVisible(true);

                    if(!(this.mData[0]?.DOKUM_NO == undefined)) {

                    var uniqueValues = [...new Map(this.mData?.map(item => [item["DOKUM_NO"], item])).values()];

                    this.getView().byId("dokumnofiltre")?.setModel(new sap.ui.model.json.JSONModel(uniqueValues));
                    }
                }
                else {
                    this.getView().byId("dokumnocolumn")?.setVisible(false);
                    this.getView().byId("dokumnoflexbox")?.setVisible(false);
                }
            },

            dokumNoFilter: function() {

                var filter = this.getView().byId("dokumnofiltre")?.getSelectedKey();

                if(filter == ''){MessageToast.show("Lütfen geçerli bir 'Döküm No' girin.");}

              
                var array = that.mData.filter(function (item) {
                    return item.DOKUM_NO == filter;
                });

                var tableModel = new sap.ui.model.json.JSONModel(array);

                this.getView().byId("notificationTable").setModel(tableModel);
                this.getView().byId("notificationTable").getModel().refresh();



                
            },

            showDeleted: function () {

                if (!this.deletedNotificationsFragment) {
                    this.deletedNotificationsFragment = sap.ui.xmlfragment("deletedNotificationsFragment", "customActivity.fragmentView.Z_showDeleted", this);
                    this.getView().addDependent(this.deletedNotificationsFragment);
                }

                this.deletedNotificationsFragment.setEscapeHandler((oEscapeHandler) => {that.closeShowDeleted();});

                this.appData.intervalState = false ;

                this.deletedNotificationsFragment.open();
                this.deletedNotificationsFragment.setTitle("Silinmiş Bildirimler Tablosu");

                if (this.WCN == "AO") { sap.ui.core.Fragment.byId("deletedNotificationsFragment", "dokumnocolumn")?.setVisible(true);     
                    }
                


                var value = this.getView().byId("DP1").getDateValue()
                if (!!!value) {

                    value = new Date()

                }

                var dateValue = moment(value).format('YYYY-MM-DD');

               
                var response = TransactionCaller.sync(
                    "MES/Itelli/PM_SCREEN/pmNEW/T_SELECT_DELETED_PMSCREEN",
                    {
                        I_WORKCTR: this.appData.node.workcenterID,
                        I_DATE: dateValue,
                    
                    },
                    "O_JSON"
                );

                var modelArrr = Array.isArray(response[0]?.Rowsets?.Rowset?.Row) ? response[0]?.Rowsets?.Rowset?.Row : new Array(response[0]?.Rowsets?.Rowset?.Row);

                if (!!modelArrr[0]) {

                    modelArrr.forEach(function (item, index) {


                        Object.keys(item).map((e) => {

                            if (item[e] == "---") {
                                item[e] = ''

                            }


                        })

                    })
                }
               

                var tableModel = new sap.ui.model.json.JSONModel(modelArrr);

                sap.ui.core.Fragment.byId("deletedNotificationsFragment", "notificationTable").setModel(tableModel);
                sap.ui.core.Fragment.byId("deletedNotificationsFragment", "notificationTable").getModel().refresh();

          

            },

         
            
            





        });
    });


/*  SELECT * FROM "SAPJAVA1"."ITE_PM_SCREEN_CREATE" --ANATABLODAN CEKİLEN VERİLER (RFC'Yİ DOLDURACAK VERİLER)

SELECT * FROM "SAPJAVA1"."ITE_MT_FUNCLOC" --ADAMLARIN PP İŞYERİ BAZINDA PM İŞYERLERİNİ VALUEPAR1-2 DÖNDÜĞÜ TABLO

SELECT * FROM "SAPJAVA1"."ZMPM_EQUIPMENT" --EKİPMANLARIN BULUNDUĞU TABLO

SELECT * FROM "SAPJAVA1"."MPM_WRKCTR_HDR" --İŞYERİ,PLANT VE OBJID'LERİN İÇİNDE OLDUĞU TABLO

SELECT * FROM "SAPJAVA1"."MPM_WRKCTR_HDRT" --OBJID BAZINDA İŞYERİNİN AÇIKLAMALARI

SELECT * FROM "SAPJAVA1"."ITE_MT_CATALOG_HEADER" --CODEGROUP İÇİN TABLO

SELECT * FROM "SAPJAVA1"."ITE_MT_CATALOG_ITEM" --CATALOG CODE İÇİN TABLO (CODEGROUP BAZINDA)

SELECT * FROM "SAPJAVA1"."MPM_MPH_NODE" --NODE_ID'DEN BİR YERLERE ULAŞMAK İÇİN

SELECT * FROM "SAPJAVA1"."ITE_WORKPLACE_CODEGROUP" --DOLDURMASI İÇİN MÜŞTERİYE YAPTIĞIM UI'IN SOL TARAFININ TABLOSU

SELECT * FROM "SAPJAVA1"."ITE_PM_PP_WORKCENTER" --DOLDURMASI İÇİN MÜŞTERİYE YAPTIĞIM UI'IN SAĞ TARAFININ TABLOSU

SELECT * FROM "SAPJAVA1"."ZMPM_EQUIPMENT" --EKİPMAN NO BAZINDA AÇIKLAMALARIN BULUNDUĞU TABLO */