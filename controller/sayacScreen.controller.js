sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"customActivity/scripts/custom",
		"../model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"customActivity/scripts/customStyle",
		"sap/ui/model/FilterType",
		"customActivity/scripts/transactionCaller",
        'sap/ui/core/library',
        "sap/ui/core/Core",
        "sap/ui/export/Spreadsheet",
	],
	function (
		Controller,
		JSONModel,
		MessageBox,
		customScripts,
		formatter,
		Filter,
		FilterOperator,
		customStyle,
		FilterType,
		TransactionCaller,
        coreLibrary,
        Core,
        Spreadsheet  
	) {
		var that;
		var interval;
		var focusCount = 0;
		var isWeldList = null;
		var isSaveRecordsComponent = false;
		var isSaveRecords = false;
		var isSavePcStrand = false;
		return Controller.extend("customActivity/controller/sayacScreen", {
			goodQuantityDataCollection: undefined,
			rejectedQuantityDataCollection: undefined,
			dataCollectionElements: undefined,
			dataCollectionElementKeys: undefined,
			reportedProductionData: undefined,
			onInit: function () {
				this.appComponent = this.getView().getViewData().appComponent;
				this.appData = this.appComponent.getAppGlobalData();
				this.interfaces = this.appComponent.getODataInterface();
				this.screenAllValue = [{}];
				this.screenObj = [];
				this.screenObj.inputChar = [];
				this.getModel();
			},

            time: function () {
                var day1 = new Date().getDate();
                var month1 = new Date().getMonth() + 1;
                var fullyear1 = new Date().getFullYear();
                return fullyear1 + "-" + month1 + "-" + day1;},


          dayCounter:function(){
          var date1 = new Date();
          var a = date1.getTime();
          var b = this.getView().byId("picker0").getDateValue().getTime();
          var c = 24 * 60 * 60 * 1000,
          diffDays = Math.round((a - b) / c)-1;
          if(diffDays<0){
              return;
          }
          this.getView().byId("idadetinput").setValue(diffDays);
          
                },

			getModel: function () {
				var response = TransactionCaller.sync(
					"MES/Itelli/SayacScreen/T_GET_SAYAC_MODEL",
					{},
					"O_JSON"
				);

				response[0].Rowsets.Rowset.Row = Array.isArray(
					response[0].Rowsets?.Rowset.Row
				)
					? response[0].Rowsets.Rowset.Row
					: new Array(response[0].Rowsets.Rowset.Row);
				var tableModel = new sap.ui.model.json.JSONModel();
				tableModel.setData(response[0]?.Rowsets?.Rowset?.Row);
				this.getView().byId("table1").setModel(tableModel);
				this.getView().byId("table1").getModel().refresh();
			},

			openFragment: function () {
				if (!this._oDialogSayac) {
					this._oDialogSayac = sap.ui.xmlfragment(
						"sayacFragment",
						"customActivity.fragmentView.sayacScreenFragment",
						this
					);
					this.getView().addDependent(this._oDialogSayac);
				}
				this._oDialogSayac.open();
			},
			onCancelFragment: function () {
				this._oDialogSayac.close();
			},

			onPressSubmit: function () {
				var sayacId = sap.ui.core.Fragment.byId(
					"sayacFragment",
					"input1"
				).getValue();

				var response = TransactionCaller.sync(
					"MES/Itelli/SayacScreen/T_SAYAC_FRAGMENT_MODEL",
					{
						I_ID: sayacId,
					},
					"O_JSON"
				);

				if (response[1] == "E") {
					MessageBox.error(response[0]);
				}

				sap.ui.core.Fragment.byId("sayacFragment", "input2").setValue(
					response[0].Rowsets.Rowset.Row.NAME
				);
			},

            liveChange: function () {

                //NUMERIC İÇİN

                var _oInput = this.getView().byId("idadetinput");

                var val = _oInput.getValue();

                val = val.replace(/[^\d]/g, "");

                _oInput.setValue(val);

            },
        kaydetfonk:function(){
               
            var sayi= this.getView().byId("idadetinput").getValue();

            if(sayi!=""){
                var response = TransactionCaller.sync(
                    "MES/Itelli/SayacScreen/T_SEND_SAYAC_RFC",
        
                    {
                        I_DATEBEFORE:sayi
                    },
                    "O_JSON"
                  );
                  if (response[1] == "E") {
                    alert(response[0]);
                  } else {
                    MessageBox.error(
                      "Veriler Başarılı bir şekilde kayıt edildi"
                    );
       }
    }
        },
			onDelete: function () {
				var index = this.getView().byId("table1").getSelectedContextPaths();
				if (index.length==0) {
					MessageBox.error("Lütfen tablodan satır seçiniz");
					return;

				}
				var jsonData = []; 
				this.getView().byId("table1").getSelectedContextPaths().forEach((item, index) => {
					jsonData.push(this.getView().byId("table1").getModel().getData()[item.substr(item.lastIndexOf("/") + 1)]);
				}, this);


				var response = TransactionCaller.sync(
                    "MES/Itelli/SayacScreen/T_DELETE_SAYAC_SCREEN",
                    
                    {
                        I_ID:JSON.stringify(jsonData),
                    },
                    "O_JSON"
                );
                this.getModel();


			},
			onPressSave: function () {
				var input1 = sap.ui.core.Fragment.byId(
					"sayacFragment",
					"input1"
				).getValue();
				var input2 = sap.ui.core.Fragment.byId(
					"sayacFragment",
					"input2"
				).getValue();

				var input3 = sap.ui.core.Fragment.byId(
					"sayacFragment",
					"selectBox"
				).getSelectedKey();

				if (input1 == "" || input2 == "" || input3 == "") {
					MessageBox.error("Lütfen gerekli alanları doldurunuz");
					return;
				}

				var response = TransactionCaller.sync(
					"MES/Itelli/SayacScreen/T_INSERT_SAYAC_VALUES",
					{
						I_SAYACID: sap.ui.core.Fragment.byId(
							"sayacFragment",
							"input1"
						).getValue(),
						I_TEXT: sap.ui.core.Fragment.byId(
							"sayacFragment",
							"input2"
						).getValue(),

						I_PLANT: input3,
					},
					"O_JSON"
				);

				if (response[1] == "E") {
					MessageBox.information(response[0]);
					sap.ui.core.Fragment.byId("sayacFragment", "input1").setValue("");
					sap.ui.core.Fragment.byId("sayacFragment", "input2").setValue("");

					return;
				}

				this.onCancelFragment();
				MessageBox.information("Kayıt Başarılı");
				sap.ui.core.Fragment.byId("sayacFragment", "input1").setValue("");
				sap.ui.core.Fragment.byId("sayacFragment", "input2").setValue("");
				this.getModel();
			},
        

            createColumns : function () {
                return [{
                    label: 'ID',
                    property: 'ID',
                    width: '20'
                }, {
                    label: 'DEVICE_ID',
                    property: 'DEVICE_ID',
                    width: '20'
                }, {
                    label: 'NAME',
                    property: 'NAME',
                    width: '20'
                }, {
                    label: 'INSDATE',
                    property: 'INSDATE',
                    width: '20'
                }, {
                    label: 'UPDATE',
                    property: 'UPDATE',
                    width: '20'
                }, {
                    label: 'X_DELETED',
                    property: 'X_DELETED',
                    width: '20'
                }, {
                    label: 'PLANT',
                    property: 'PLANT',
                    width: '20'
                }
            ];
        },
        onExport: function (oEvent) {

            var oColumns = this.createColumns();
            var tableModel = this.getView().byId("table1").getModel();
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
                fileName: "Sayac_Ekranı_Rapor" 
            };
            var oSheet = new Spreadsheet(oSettings);
            oSheet.build().then(function () {
                MessageToast.show("Tablo Excel'e aktarıldı.");
            });
        },

















		});
	}
);
