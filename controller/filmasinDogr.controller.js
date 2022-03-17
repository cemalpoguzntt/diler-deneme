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
        return Controller.extend("customActivity/controller/filmasinDogr", {

            onInit: function () {
                this.appComponent = this.getView().getViewData().appComponent;
                this.appData = this.appComponent.getAppGlobalData();
                this.interfaces = this.appComponent.getODataInterface();
                this.infoArr = [];
                this.infoArr2 = [];
                that = this;



                var myModel = new sap.ui.model.json.JSONModel();
                var obj = new Object();
                var arr = new Array();
                arr.push(obj);
                myModel.setData(arr);
                this.getView().byId("tableProduction").setModel(myModel);


                

            },


            onAfterRendering: function () {
                this.getView().byId("radioButton1").setSelected(true);
                this.getActiveOrder();
                

            },


            openIssueFragment: function () {

					if (!this._oDialogyenikayit) {
						this._oDialogyenikayit = sap.ui.xmlfragment(
							"IssueComboBox", // buraya fragment'in id'sini girmemiz
							"customActivity.fragmentView.IssueComboBox",
                            this
						);

						this.getView().addDependent(this._oDialogyenikayit);

						
					}
					this._oDialogyenikayit.open() ;

                    this.onSelectRejectType();

			},

            	CloseIssueFragment: function () {
					this._oDialogyenikayit.close();
				},



            checkRadioButton: function () {

                var arbpl;

                if (this.getView().byId("radioButton1").getSelected() === true) { arbpl = "FLMDOG1" };
                if (this.getView().byId("radioButton2").getSelected() === true) { arbpl = "FLMDOG2" };
                if (this.getView().byId("radioButton3").getSelected() === true) { arbpl = "FLMDOG3" };
                if (this.getView().byId("radioButton4").getSelected() === true) { arbpl = "FLMDOG4" };
                if (this.getView().byId("radioButton5").getSelected() === true) { arbpl = "FLMDOG5" };
                if (this.getView().byId("radioButton6").getSelected() === true) { arbpl = "FLMDOG6" };


                return arbpl

            },

            getActiveOrder: function (oEvent) {

                /*  this.clearAllData(); */


                var arbpl = this.checkRadioButton();






                TransactionCaller.async(
                    "MES/Itelli/DOGRULTMA/T_GET_ACT_ORDER_DATA",
                    {
                        I_ARBPL: arbpl,
                    },
                    "O_JSON",
                    this.getActiveOrderCB,
                    this
                );





            },


            getActiveOrderCB: function (iv_data, iv_scope) {

                var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row) ? iv_data[0]?.Rowsets?.Rowset?.Row : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
                var myModel = new sap.ui.model.json.JSONModel(myArrr);

               



                    iv_scope.getView().byId("tableOrderInfo").setModel(myModel);
                

                var myArrr2 = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Columns?.Row) ? iv_data[0]?.Rowsets?.Rowset?.Columns?.Row : new Array(iv_data[0]?.Rowsets?.Rowset?.Columns?.Row);
                var myModel2 = new sap.ui.model.json.JSONModel(myArrr2);

               


                    iv_scope.getView().byId("tableFilmasin").setModel(myModel2);
              

                var myArrr3 = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Columns?.Rowset?.Row) ? iv_data[0]?.Rowsets?.Rowset?.Columns?.Rowset?.Row : new Array(iv_data[0]?.Rowsets?.Rowset?.Columns?.Rowset?.Row);
                var myModel3 = new sap.ui.model.json.JSONModel(myArrr3);

                


                    iv_scope.getView().byId("tableDogrultma").setModel(myModel3);


                    iv_scope.infoArr = myArrr;
                    iv_scope.infoArr2 = myArrr2;
                

                iv_scope.getView().byId("picker0").setDateValue(null);
                iv_scope.getView().byId("picker0").setValue(moment(new Date()).format('YYYY-MM-DD'))


                setTimeout(() => {

                    iv_scope.getView().byId("tableOrderInfo").getModel().refresh();

                    iv_scope.getView().byId("tableOrderInfo").getModel().refresh();
    
                    iv_scope.getView().byId("tableDogrultma").getModel().refresh();
                    
                }, 1000);


        













                return myModel;

            },







            clearAllData: function () {
                this.getView().byId("tableOrderInfo").setModel();
                this.getView().byId("input0").setValue("");
                this.getView().byId("tableFilmasin").setModel();
                this.getView().byId("tableDogrultma").setModel();
            },


            onChangeSelectedType: function () {
                var type = this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[0].getSelectedKey();

                if (type == "CUBUK") {
                    //Set Column Visibility for CUBUK
                    this.getView().byId("tableProduction").mAggregations.columns[0].setVisible(true);
                    this.getView().byId("tableProduction").mAggregations.columns[1].setVisible(true);
                    this.getView().byId("tableProduction").mAggregations.columns[2].setVisible(false);
                    this.getView().byId("tableProduction").mAggregations.columns[3].setVisible(false);
                } else if (type == "STD_DISI") {
                    //Set Column Visibility for STD_DISI
                    this.getView().byId("tableProduction").mAggregations.columns[0].setVisible(true);
                    this.getView().byId("tableProduction").mAggregations.columns[1].setVisible(true);
                    this.getView().byId("tableProduction").mAggregations.columns[2].setVisible(true);
                    this.getView().byId("tableProduction").mAggregations.columns[3].setVisible(false);
                } else if (type == "HURDA") {
                    //Set Column Visibility for HURDA
                    this.getView().byId("tableProduction").mAggregations.columns[0].setVisible(true);
                    this.getView().byId("tableProduction").mAggregations.columns[1].setVisible(false);
                    this.getView().byId("tableProduction").mAggregations.columns[2].setVisible(false);
                    this.getView().byId("tableProduction").mAggregations.columns[3].setVisible(true);
                } else {
                    MessageBox.error("Tip seçimi kontrol edilmelidir!");
                    return;
                }
                this.clearInputs();
            },


            clearInputs: function () {
                this.getView().byId("tableProduction").mAggregations.rows[0]?.mAggregations?.cells[1]?.setValue("");
                this.getView().byId("tableProduction").mAggregations.rows[0]?.mAggregations?.cells[2]?.setValue("");
                this.getView().byId("tableProduction").mAggregations.rows[0]?.mAggregations?.cells[3]?.setValue("");
                this.getView().byId("tableProduction").mAggregations.rows[0]?.mAggregations?.cells[4]?.setValue("");
            },


            onChangeBarcode: function () {


                /*  this.clearAllData(); */
                activeBarcode = this.getView().byId("tableFilmasin").mAggregations.rows[0].mAggregations.cells[3].getText();
                if (activeBarcode != "") {
                    this.getView().byId("input0").setValue("");
                    MessageBox.error("Hatta aktif filmaşin bulunmaktadır!");
                    return;
                }




                var arbpl = this.checkRadioButton();
                /* var aufnr = this.getView().byId("tableDogrultma").getModel().oData?.Rowsets?.Rowset?.Row[0]?.AUFNR; */

                var aufnr = this.getView().byId("tableOrderInfo").getModel().oData[0]?.AUFNR;
                var barcode = this.getView().byId("input0").getValue();
                var plant = this.appData.plant;



                this.getView().byId("input0").setValue("");

                this.getView().byId("tableFilmasin").setBusy(true);

                TransactionCaller.async(
                    "MES/Itelli/DOGRULTMA/DOGRULTMA_SON/T_DOG_CHECK",
                    {
                        I_ARBPL: arbpl,
                        I_AUFNR: aufnr,
                        I_BARCODE: barcode,
                        I_PLANT: plant,
                    },
                    "O_JSON",
                    this.onChangeBarcodeCB,
                    this
                );

            },

            onChangeBarcodeCB: function (iv_data, iv_scope) {


                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    iv_scope.getView().byId("tableFilmasin").setBusy(false);
                    return;
                }
                var myModel = new sap.ui.model.json.JSONModel();
                if (Array.isArray(iv_data[0].Rowsets?.Rowset?.Row)) {
                    myModel.setData(iv_data[0]);
                } else if (!iv_data[0].Rowsets?.Rowset?.Row) {
                    myModel.setData(null);
                } else {
                    var obj_iv_data = iv_data[0];
                    var dummyData = [];
                    dummyData.push(iv_data[0].Rowsets.Rowset.Row);
                    obj_iv_data.Rowsets.Rowset.Row = dummyData;
                    myModel.setData(obj_iv_data);
                }
                iv_scope.getView().byId("tableFilmasin").setModel(myModel);
                iv_scope.getView().byId("tableFilmasin").setBusy(false);

                iv_scope.getActiveOrder();





                return myModel;
            },

            onCompleteActiveFLM: function () {


                var kalan = this.getView().byId("tableFilmasin")?.getModel()?.oData[0]?.KALAN;

                if (kalan === undefined) {

                    MessageBox.error("Hatta aktif filmaşin bulunmamaktadır!");
                    return;
                }

                /*   var tabloCheck = this.getView().byId("tableDogrultma")?.getModel()?.oData[0]?.ID;

                  if (!(tabloCheck === undefined )){

                           
                      MessageBox.error("Tabloda Kayıt Varken Filmaşın İptal Edilemez.");
                       return;
                   
                      } */





                this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[0].setSelectedKey("HURDA");

                this.onChangeSelectedType();

                setTimeout(() => {
                    /*  this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[1].setSelectedKey(kalan); */
                    this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[1].setValue(kalan);
                }, 500);




            },

            onSaveProdTable: function () {
                //Get Type
                var type = this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[0].getSelectedKey();
                var quantity;
                var size = "";
                //Input Validation
                if (type == "CUBUK") {
                    quantity = this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[1].getValue();
                    if (quantity == "") {
                        MessageBox.error("Çubuk ekleyebilmek için 'Adet' alanı doldurulmalıdır");
                        return;
                    }
                    if (!(/^\d+$/.test(quantity))) {
                        MessageBox.error("Sadece sayı girişi yapılabilir");
                        return;
                    }
                } else if (type == "STD_DISI") {
                    quantity = this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[1].getValue();
                    size = this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[2].getValue();
                    if ((size == "") || (quantity == "")) {
                        MessageBox.error("Standart Dışı ekleyebilmek için 'Adet' ve 'Boy' alanları doldurulmalıdır");
                        return;
                    }
                    if (!(/^\d+$/.test(quantity))) {
                        MessageBox.error("Sadece sayı girişi yapılabilir");
                        return;
                    }
                    size = size.replaceAll(",", ".");
                } else if (type == "HURDA") {
                    quantity = this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[1].getValue();
                    if (quantity == "") {
                        MessageBox.error("Hurda girişi yalnızca aktif filmaşin bitirilerek yapılabilir.");
                        return;
                    }
                } else {
                    MessageBox.error("Tip seçimi kontrol edilmelidir!");
                    return;
                }
                var arbpl = this.checkRadioButton();
                var barcode = this.infoArr2[0]?.CHARG;
                var objek = this.infoArr[0]?.OBJEK;
                var aufnr = this.infoArr[0]?.AUFNR;
                var user = this.appData.user.userID;

                this.getView().byId("tableProduction").setBusy(true);

                if (barcode === null || barcode === undefined) {

                    MessageBox.error("Hatta aktif filmaşin bulunmamaktadır!");
                    this.getView().byId("tableProduction").setBusy(false);

                    this.clearInputs();

                    return

                }

                TransactionCaller.async("MES/Itelli/DOGRULTMA/T_INSERT_FLMDOG_RECORDS", {
                    I_ADET: quantity,
                    I_ARBPL: arbpl,
                    I_BARCODE: barcode,
                    I_LENGTH: size,
                    I_OBJEK: objek,
                    I_TYPE: type,
                    I_AUFNR: aufnr,
                    I_USER: user
                },
                    "O_JSON",
                    this.onSaveProdTableCB,
                    this,
                    "GET"
                );
                this.clearInputs();
                this.getView().byId("tableProduction").mAggregations.rows[0].mAggregations.cells[0].setSelectedKey("CUBUK");
                this.onChangeSelectedType();


            },


            onSaveProdTableCB: function (iv_data, iv_scope) {


                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    iv_scope.getView().byId("tableProduction").setBusy(false);
                    return;
                } else {
                    MessageBox.information("Veriler başarılı bir şekilde kaydedildi.");
                }

                iv_scope.getView().byId("tableProduction").setBusy(false);

                setTimeout(() => {
                    iv_scope.getActiveOrder();
                }, 1000);


            },


            onDeleteProdTable: function (oEvent) {



                var index = oEvent.oSource.getParent().getBindingContext().getPath().split("/")[1];

                var tableData = this.getView().byId("tableDogrultma").getModel().getData();

                var ID = tableData[index]?.ID;

                var user = this.appData.user.userID;

                if (!!!ID) {

                    MessageBox.information("Bu işlemi yapabilmek için tablonuzda veri olmalıdır.");

                    return
                }


                const cevap = confirm("Verileri silmek istediğinize emin misiniz?");

                if (cevap === true) {


                    TransactionCaller.async("MES/Itelli/DOGRULTMA/DOGRULTMA_SON/T_DELETE_DOG", {
                        I_ID: ID,
                        I_UPUSER: user
                    },
                        "O_JSON",
                        this.onDeleteProdTableCB,
                        this,
                        "GET"
                    );

                }

            },


            onDeleteProdTableCB: function (iv_data, iv_scope) {

                MessageBox.information("Veriler Başarılı bir şekilde silindi");

                setTimeout(() => {
                    iv_scope.getActiveOrder();
                }, 500);





                return





            },

            onCancelActiveFLM: function (isScrap) {

                var giden = this.getView().byId("tableFilmasin")?.getModel()?.oData[0]?.GIDEN
                var batch = this.getView().byId("tableFilmasin").mAggregations.rows[0].mAggregations.cells[3].getText();

                if (!(giden == '0') && !(isScrap == "1")) {



                    MessageBox.information("Bir filmaşin kullanılmaya başlandıktan sonra iptal edilemez!");

                }

                else {




                    TransactionCaller.async("MES/Itelli/DOGRULTMA/DOGRULTMA_SON/T_FILMASIN_CANCEL", {
                        I_BATCH: batch
                    },
                        "O_JSON",
                        this.onCancelActiveFLMCB,
                        this,
                        "GET"
                    );


                }


            },



            onCancelActiveFLMCB: function (iv_data, iv_scope) {

                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);

                    return;
                }

                MessageBox.information("Aktif filmaşinin görevi bitirildi.");

                iv_scope.getActiveOrder();


            },


            onClick: function (e) {
                console.log(document.getElementById(e.target.dataset.sapUi).innerText);

            },


            getissueCode: function (){

             var issueCode = sap.ui.core.Fragment.byId("IssueComboBox","IssueCode").getSelectedKey() ; 

             if(issueCode === undefined || issueCode == ""){

               MessageBox.error("Lütfen bir seçim yapıp tekrar deneyiniz.");  

               return
             }

             this.CloseIssueFragment(); 

             this.onSaveCreatePackage(issueCode);


            },


            hesitate : function () {
                var arrSelectedInd = this.getView().byId("tableDogrultma").getSelectedIndices();
               
                var isTYPE = this.getView().byId("tableDogrultma").getModel().oData[arrSelectedInd[0]].TYPE;

               if (isTYPE == "STD_DISI") {

                   
                   this.openIssueFragment();

                   return
               }

               else {
                   this.onSaveCreatePackage();
               }

               





            },




            onSaveCreatePackage: function (issueCode) {

              
              
                var returncontrol = false;


                var matnr = "KANGAL_DOGRULTMA";
                var sumQuantity = 0;
                var arrSelectedInd = this.getView().byId("tableDogrultma").getSelectedIndices();
                var arrSelectedRows = new Array();
                arrSelectedInd.forEach((item) => {
                    arrSelectedRows.push(this.getView().byId("tableDogrultma").getModel().oData[item]);
                })

                var selectedID = new Array();
                arrSelectedInd.forEach((item) => {
                    selectedID.push(this.getView().byId("tableDogrultma").getModel().oData[item].ID);
                })
                    var control = arrSelectedRows[0]?.MALZ_KODU;
                arrSelectedRows.forEach((item) => {

                        if (!(control == item.MALZ_KODU)){

                            MessageBox.error("Farklı tip ürünler birlikte teyit verilemez.");
                            returncontrol = true;
                            return;
                        }
                        else {
                     control = item.MALZ_KODU; 
                        }
                    })

                if(returncontrol === true){ 
                    return
                }

                /*  var nonCubukArr = arrSelectedRows.filter((i) => i.TYPE != "CUBUK");
                 if (nonCubukArr?.length > 0) {
                     MessageBox.error("Hatalı seçim yaptınız!");
                     return;
                 }
                 var CubukArr = arrSelectedRows.filter((i) => i.TYPE == "CUBUK");
                 if (CubukArr?.length < 1) {
                     MessageBox.error("Hatalı seçim yaptınız!");
                     return;
                 } */

                var cubukCount = 0;
                cubukCount = this.infoArr[0]?.Y_CUBUK_SAYISI;
                var tempCount = 0;

                if(arrSelectedRows[0]?.MALZ_KODU == "KANGAL_DOGRULTMA") {

                arrSelectedRows.forEach((item) => { tempCount = tempCount + item.ADET; })
                  if (tempCount != cubukCount) {
                     MessageBox.error("Toplam çubuk adeti " + (cubukCount.toString()) + " adet olmalıdır");
                     return;
                 } 
                }



                var arrDistinctBarcode = [...new Set(arrSelectedRows.map(item => item.BARCODE))];
                arrDistinctBarcode.forEach((item) => {
                    tempArr = arrSelectedRows.filter((i) => i.BARCODE == item);
                    var tempQuantity = 0;
                    tempArr.forEach((item) => {
                        tempQuantity = tempQuantity + item.QUANTITY;
                    })
                    sumQuantity = sumQuantity + tempQuantity;
                    tempQuantity = tempQuantity / 1000;                         // KG to TON
                    tempQuantity = Math.round(tempQuantity * 1000) / 1000;      // Round with 3 decimals
                    /* this.insertConsumption(item,tempQuantity,"20"); */
                })
                var dcElement = "GOOD_QUANTITY";


                this.reportConfirmation(matnr, 101, dcElement, sumQuantity, "KG", arrSelectedRows, selectedID,issueCode);
            },




            reportConfirmation: function (matnr, movetype, dcElement, quantity, uom, arrUsed, selectedID,issueCode) {

                if(issueCode == undefined){issueCode = '';}

                this.getView().byId("tableDogrultma").setBusy(true);

                var client = this.infoArr[0].CLIENT;
                var plant = this.infoArr[0].WERKS;
                var nodeID = this.infoArr[0].NODE_ID;
                var aufnr = this.infoArr[0].AUFNR;
                var objek = this.infoArr[0].OBJEK;



                /* var timestamp = new Date().getTime(); */
                var timestamp = moment(this.getView().byId("picker0").getDateValue()).format('YYYY-MM-DD')

                if (timestamp == "Invalid date") {

                    timestamp = moment(new Date()).format('YYYY-MM-DD')
                }

                var inputXML = {};
                inputXML.client = client;
                inputXML.plant = plant;
                //inputXML.runID = runID;  
                inputXML.nodeID = nodeID;
                inputXML.material = matnr;
                inputXML.comments = "";
                inputXML.batchNo = "";
                inputXML.arbpl = this.checkRadioButton();
                inputXML.dcElementType = dcElement;
                inputXML.startTimestamp = timestamp;
                inputXML.endTimestamp = timestamp;
                inputXML.dcElement = dcElement;
                inputXML.quantity = Math.round(quantity * 100) / 100;
                inputXML.uom = uom;
                //inputXML.releasedID = releasedID;
                inputXML.aufnr = aufnr;
                inputXML.movetype = movetype;
                //inputXML.objek = objek;

                var inputChar = [];

                TransactionCaller.async("MES/Itelli/DOGRULTMA/DOGRULTMA_SON/RFC/T_CALL_FLM_DATA", {
                    inputXML: JSON.stringify(inputXML),
                    inputChar: JSON.stringify(inputChar),
                    I_SELECTED_ID: selectedID,
                    I_AUFNR: aufnr,
                    I_ICODE: issueCode
                },
                    "O_JSON",
                    this.reportConfirmationCB,
                    this,
                    "GET",
                    selectedID
                );


                //this.getView().byId("batchConfirmPage").setBusy(true);                <<<<<<<<<<<<<<<<<<<<<<<<
            },


            reportConfirmationCB: function (iv_data, iv_scope, selectedID) {
                //p_this.getView().byId("batchConfirmPage").setBusy(false);             <<<<<<<<<<<<<<<<<<<<<<<<
                /*  if (iv_data[1] == "E") {
                     MessageBox.error(iv_data[0]);
                     iv_scope.getView().byId("tableProduction").setBusy(false);
                     return;
                 }
                 var workcenterid = iv_scope.infoArr[0].WORKCENTER_ID;
                 var response = TransactionCaller.sync(
                     "MES/Itelli/DOGRULTMA/T_UPDATE_ERP_SEND_DATA",
                     {
                         I_STATUS: iv_data[1],
                         I_TABLEROWS: JSON.stringify(arrUsed),
                         I_WORKCENTERID: workcenterid,
                         I_ENTRYID: iv_data[0]
                     },
                     "O_JSON"
                   ); */
                if (iv_data[1] == "E") {
                    MessageBox.error(iv_data[0]);
                    iv_scope.getView().byId("tableDogrultma").setBusy(false);
                    return;
                }
                iv_scope.getView().byId("tableDogrultma").setBusy(false);
                MessageBox.information("Teyit gönderildi");
                iv_scope.getActiveOrder();


                var itemNo = iv_scope.getView().byId("tableDogrultma").getSelectedIndices();
                var statu = iv_scope.getView().byId("tableDogrultma")?.getModel()?.oData[itemNo]?.TYPE

                if (statu == "HURDA") {

                    var isScrap = "1"

                    iv_scope.onCancelActiveFLM(isScrap);

                }

            },






            onSaveScrap: function () {
                var matnr = "K_DOGRULTMA_HURDA";
                var sumQuantity = 0;
                var arrSelectedInd = this.getView().byId("tableDogrultma").getSelectedIndices();
                var arrSelectedRows = new Array();
                arrSelectedInd.forEach((item) => {
                    arrSelectedRows.push(this.getView().byId("tableDogrultma").getModel().oData[item]);
                })

                var nonHurdaArr = arrSelectedRows.filter((i) => i.TYPE != "HURDA");
                if (nonHurdaArr?.length > 0) {
                    MessageBox.error("Hatalı seçim yaptınız!");
                    return;
                }
                var HurdaArr = arrSelectedRows.filter((i) => i.TYPE == "HURDA");
                if (HurdaArr?.length < 1) {
                    MessageBox.error("Hatalı seçim yaptınız!");
                    return;
                }

                var arrDistinctBarcode = [...new Set(arrSelectedRows.map(item => item.BARCODE))];
                arrDistinctBarcode.forEach((item) => {
                    tempArr = arrSelectedRows.filter((i) => i.BARCODE == item);
                    var tempQuantity = 0;
                    tempArr.forEach((item) => {
                        tempQuantity = tempQuantity + item.QUANTITY;
                    })
                    sumQuantity = sumQuantity + tempQuantity;
                    tempQuantity = tempQuantity / 1000;                         // KG to TON
                    tempQuantity = Math.round(tempQuantity * 1000) / 1000;      // Round with 3 decimals
                    this.insertConsumption(item, tempQuantity, "30");
                })
                var dcElement = "GOOD_QUANTITY";
                this.reportConfirmation(matnr, 531, dcElement, sumQuantity, "KG", arrSelectedRows);
            },

            onSelectRejectType: function (oEvent) {
                var params = {
                    "Param.1":"IKINCI_KAL",
                    "Param.2":"2002",
                };
                var tRunner = new TransactionRunner(
                    "MES/Integration/OPC/FLM/BilletReject/getRejectReasonBilletMonitorQry",
                    params
                );
                tRunner.ExecuteQueryAsync(this, this.callRejectReasonForType);
            },


             callRejectReasonForType: function (p_this, p_data) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setSizeLimit(10000);
                oModel.setData(p_data.Rowsets.Rowset[0].Row);
                sap.ui.core.Fragment.byId("IssueComboBox","IssueCode").setModel(oModel);
               // p_this.getView().setModel(oModel, "IssueCode");
            },








        });
    }
);