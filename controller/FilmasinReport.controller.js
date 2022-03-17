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
		"jquery.sap.global",
		"sap/m/MessageToast",
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
		jQuery,
		MessageToast
	) {
		return Controller.extend("customActivity/controller/FilmasinReport", {
			onInit: function () {
				this.appComponent = this.getView().getViewData().appComponent;
				this.appData = this.appComponent.getAppGlobalData();
				this.interfaces = this.appComponent.getODataInterface();
				this.screenAllValue = [{}];
				this.screenObj = [];
				this.screenObj.inputChar = [];
				this.infoArr = [];
			},

			searchData: function () {
				if (
					this.getView().byId("datePicker").getDateValue() == null ||
					this.getView().byId("datePicker").getSecondDateValue() == null
				) {
					MessageBox.error("Lütfen Tarih Giriniz.");
					return;
				}

				this.byId("selectionScreen").setBusy(true);
				this.byId("selectionScreen").setBusyIndicatorDelay(0);

				this.getData();
			},


            NavStonePage: function (oEvent) {
                                                  
 
                var date1 = this.getView()
                .byId("datePicker")
                .getDateValue()
                .toDateString();
                var date2 = this.getView()
                .byId("datePicker")
                .getSecondDateValue()
                .toDateString();


				this.appComponent.date1 = date1 ;
				this.appComponent.date2 = date2;

				
                     
                 this.appComponent.getRouter().navTo("activity", {
                 activityId: "Z_TASLAMA_REPORT",
				 mode: date1,
                 
				
				 
                });

                

		
                                   
                                           },

                NavCanLifePage: function (oEvent) {
                                                  
 
			
					
						 
					 this.appComponent.getRouter().navTo("activity", {
					 activityId: "Z_stoneLifeReport",
					
					
					});

				},


				NavCanPage: function (oEvent) {
                                                  
 
					var date1 = this.getView()
					.byId("datePicker")
					.getDateValue()
					.toDateString();
					var date2 = this.getView()
					.byId("datePicker")
					.getSecondDateValue()
					.toDateString();
	
	
					this.appComponent.date1 = date1 ;
					this.appComponent.date2 = date2;
	
					
						 
					 this.appComponent.getRouter().navTo("activity", {
					 activityId: "Z_CAN_REPORT",
					 mode: date1,
					 
					
					 
					});

				},

			getData: function () {
				var date1 = this.getView()
					.byId("datePicker")
					.getDateValue()
					.toDateString();
				var date2 = this.getView()
					.byId("datePicker")
					.getSecondDateValue()
					.toDateString();
				var tesis = this.getView().byId("SelectBox").getSelectedKey();

				var reportType = this.getView().byId("SelectBox2").getSelectedKey();

				this.byId("selectionScreen").setBusy(true);

				if (tesis == "KANGAL_DOGRULTMA") {
					MessageBox.error("Kangal Doğrultma Raporu Geliştirme Aşamasındadır.");
					this.byId("selectionScreen").setBusy(false);

					return;
				}

				if (tesis == "CAN"){

					this.NavCanPage();
				}

                if(tesis == "STONE"){

                    this.NavCanLifePage();
                }

                if (tesis == "TASLAMA") {

                   
                        this.NavStonePage();
                }

				if (tesis == "FILMASIN") {
					if (reportType == "KTKID") {
						TransactionCaller.async(
							"MES/Itelli/FLM/REPORTS/getFlmReport1Model",
							{
								I_DATE1: date1,
								I_DATE2: date2,
								I_TESIS: tesis,
								I_TYPE: reportType,
							},
							"O_JSON",
							this.setData2,
							this
						);
					} 
                    
                    else {
						TransactionCaller.async(
							"MES/Itelli/FLM/REPORTS/getFlmReport1Model",
							{
								I_DATE1: date1,
								I_DATE2: date2,
								I_TESIS: tesis,
								I_TYPE: reportType,
							},
							"O_JSON",
							this.setData,
							this
						);
					}
				}
			},

			setData: function (iv_data, iv_scope) {
				var myModel = new sap.ui.model.json.JSONModel();
				myModel.setSizeLimit(10000);

				if (iv_data[1] == "E") {
					MessageBox.error(
						"Data seti hatalı veri içermektedir.Danışman desteği talep ediniz."
					);
					iv_scope.getView().byId("selectionScreen").setBusy(false);

					return;
				}

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
				iv_scope.getView().byId("selectionScreen").setVisible(false);
				iv_scope.getView().byId("FlexVardiya").setVisible(true);
				iv_scope.getView().byId("tableReportedTie3").setModel(myModel);
				iv_scope.getView().byId("selectionScreen").setBusy(false);
				return myModel;
			},

			setData2: function (iv_data, iv_scope) {
				var myModel = new sap.ui.model.json.JSONModel();
				myModel.setSizeLimit(10000);

				if (iv_data[1] == "E") {
					MessageBox.error(
						"Data seti hatalı veri içermektedir.Danışman desteği talep ediniz."
					);
					iv_scope.getView().byId("selectionScreen").setBusy(false);

					return;
				}

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
				iv_scope.getView().byId("selectionScreen").setVisible(false);
				iv_scope.getView().byId("FlexKtk").setVisible(true);
				iv_scope.getView().byId("Ktable").setModel(myModel);
				iv_scope.getView().byId("selectionScreen").setBusy(false);
			
			},

			createColumnConfig: function () {
				return [
					{
						label: "Tarih",
						property: "EXIT_DATE",
						width: "20",
					},

					{
						label: "Vardiya",
						property: "SHIFT",
						width: "20",
					},

					{
						label: "İş Yeri",
						property: "RMOD",
						width: "20",
					},
					{
						label: "Sipariş No",
						property: "AUFNR",
						width: "20",
					},
					{
						label: "Kütük Ebat",
						property: "Y_EBAT",
						width: "20",
					},
					{
						label: "Kütük Boy",
						property: "Y_BOY_KTK",
						width: "30",
					},
					{
						label: "Kütük Kalitesi",
						property: "Y_KALITE_KTK",
						width: "20",
					},
					{
						label: "Kütük Menşei",
						property: "Y_KUTUK_MENSEI",
						width: "20",
					},
					{
						label: "Vakum",
						property: "Y_VAKUM",
						width: "20",
					},

					{
						label: "Taşlama",
						property: "Y_TASLAMA",
						width: "20",
					},

					{
						label: "Kütük Sayısı",
						property: "TOPLAM_HAD_ADET",
						width: "20",
					},

					{
						label: "Kütük Ton",
						property: "TOPLAM_HAD_TON",
						width: "20",
					},
					{
						label: "Mamul Çap",
						property: "Y_CAP_FLM_MM",
						width: "20",
					},
					{
						label: "Nervür/Düz",
						property: "Y_NERVUR_DUZ",
						width: "20",
					},
					{
						label: "Mamul Standartı",
						property: "Y_STANDART_FLM",
						width: "20",
					},
					{
						label: "Mamul Kalitesi",
						property: "Y_KALITE_FLM",
						width: "20",
					},
					{
						label: "ihc Paket Say",
						property: "-",
						width: "20",
					},

					{
						label: "ihc Paket Ton",
						property: "-",
						width: "20",
					},

					{
						label: "iç Pys Pakt Say",
						property: "-",
						width: "20",
					},
					{
						label: "iç Pys Pakt Ton",
						property: "-",
						width: "20",
					},

					{
						label: "Std Dışı Pak Say.",
						property: "STD_DISI_PAK_SAY",
						width: "20",
					},

					{
						label: "Std Dışı Pak Ton",
						property: "STD_DISI_PAK_TON",
						width: "20",
					},

					{
						label: "2.Kalite Mml Adt",
						property: "IKINCI_KAL_PAK_SAY",
						width: "20",
					},

					{
						label: "2.Kalite Mml Ton",
						property: "IKINCI_KAL_PAK_TON",
						width: "20",
					},

					{
						label: "Satılabilir Hrd Adt",
						property: "S_HURDA_PAK_SAY",
						width: "20",
					},

					{
						label: "Satılabilir Hrd Ton",
						property: "S_HURDA_PAK_TON",
						width: "20",
					},

					{
						label: "Top Pak Say",
						property: "TOPLAM_PAKET_SAYISI",
						width: "20",
					},

					{
						label: "Top Mml Ton",
						property: "TOPLAM_PAK_TON",
						width: "20",
					},

					{
						label: "Hurda Kangal Adt",
						property: "HURDA_ADET",
						width: "20",
					},

					{
						label: "Hurda Kangal Ton",
						property: "HURDA_TON",
						width: "20",
					},

					{
						label: "Hadde Bozuğu Adt",
						property: "HADDE_BOZUGU_ADET",
						width: "20",
					},

					{
						label: "Hadde Bozuğu Ton",
						property: "HADDE_BOZUGU_TON",
						width: "20",
					},

					{
						label: "% Hadde Bozuğu",
						property: "YUZDE_HAD_BOZUGU",
						width: "20",
					},

					{
						label: "UçBaş-Uçkuyruk Ton",
						property: "BAS_KUYRUK",
						width: "20",
					},

					{
						label: "% Uç-Kuyruk",
						property: "YUZDE_UC_KUYRUK",
						width: "20",
					},

					{
						label: "% Fire",
						property: "{= Math.round((('100'-${VERIM}))*1000)/1000}",
						width: "20",
					},

					{
						label: "Verim",
						property: "VERIM",
						width: "20",
					},

					{
						label: "ULKE",
						property: "Y_ULKE",
						width: "20",
					},

					{
						label: "ULKE",
						property: "BATCH",
						width: "20",
					},

					{
						label: "Rötor Tipi",
						property: "Y_ROTOR_TIPI",
						width: "20",
					},

					{
						label: "Kalite Sınıfı",
						property: "Y_KALITE_SINIF_FLM",
						width: "20",
					},

					{
						label: "Kalite Grubu",
						property: "Y_KALITE_GRUBU_FLM",
						width: "20",
					},

					{
						label: "Üretim Yönetimi",
						property: "Y_URETIM_YONTEMI_FLM",
						width: "20",
					},
				];
			},

			onExport: function () {
				var aCols = this.createColumnConfig();
				if (this.getView().byId("tableReportedTie3").getModel() == undefined) {
					MessageToast.show("Tabloda veri bulunmamaktadır");
					return;
				}

				if (
					this.getView().byId("tableReportedTie3").getModel().getData() == null
				) {
					MessageToast.show("Tabloda veri bulunmamaktadır");
					return;
				}

				var aProducts = this.getView()
					.byId("tableReportedTie3")
					.getModel()
					.getProperty("/").Rowsets.Rowset.Row;
				var oSettings = {
					workbook: {
						columns: aCols,
					},
					dataSource: aProducts,
					fileName: "Rapor",
				};

				var oSheet = new Spreadsheet(oSettings);
				oSheet.build().then(function () {
					MessageToast.show("Tablo Excele Aktarıldı");
				});
			},

			backMainPanel: function () {
				this.getView().byId("FlexVardiya").setVisible(false);
				this.getView().byId("FlexKtk").setVisible(false);
				this.byId("selectionScreen").setVisible(true);
			},

			openRaporEkranı: function () {

                var tesis = this.getView().byId("SelectBox").getSelectedKey();

                var reportType = this.getView().byId("SelectBox2").getSelectedKey();

                if(tesis == "FILMASIN" && reportType == "Vardiya" ) {

				this.getView().byId("FlexVardiya").setVisible(true);
				this.byId("selectionScreen").setVisible(false);


                              }
                 if(tesis == "FILMASIN" && reportType == "KTKID" ) {

				this.getView().byId("FlexKtk").setVisible(true); 
				this.byId("selectionScreen").setVisible(false);


                   }


			},
			createColumnConfig2: function () {
				return [
					{
						label: "Sinyal Noktası",
						property: "SIGNAL_POINT",
						width: "20",
					},

					{
						label: "Kütük Durumu",
						property: "BILLET_STATUS",
						width: "20",
					},

					{
						label: "KAYIT_TARIHI",
						property: "KAYIT_TARIHI",
						width: "20",
					},
					{
						label: "Fırın Giriş",
						property: "FURNACE_ENTRY_TIME",
						width: "20",
					},
					{
						label: "Fırın Çıkış",
						property: "FURNACE_EXIT_TIME",
						width: "20",
					},
					{
						label: "Fırın Giriş Tartım",
						property: "ENTRY_WEIGHT",
						width: "30",
					},
					{
						label: "Kütük Teorik",
						property: "THEORETICAL_QUANTITY",
						width: "20",
					},
					{
						label: "Vardiya",
						property: "SHIFT",
						width: "20",
					},
					{
						label: "Sipariş No",
						property: "SIPARIS_NUMARASI",
						width: "20",
					},

					{
						label: "KTKID",
						property: "KTKID",
						width: "20",
					},

					{
						label: "OTOMASYON_ID",
						property: "OTOMASYON_ID",
						width: "20",
					},

					{
						label: "Sipariş Sıra No",
						property: "SIP_SIRA_NO",
						width: "20",
					},
				
					{
						label: "Kütük Kodu",
						property: "MATNR",
						width: "20",
					},
					{
						label: "Kütük Parti",
						property: "KUTUK_PARTI",
						width: "20",
					},
					{
						label: "Döküm Numrası",
						property: "DOKUM_NUMARASI",
						width: "20",
					},
					{
						label: "Kütük Kalite",
						property: "Y_KALITE_KTK",
						width: "20",
					},

					{
						label: "Ebat",
						property: "Y_EBAT",
						width: "20",
					},

					{
						label: "Boy",
						property: "Y_BOY_KTK",
						width: "20",
					},
					{
						label: "Fırın User",
						property: "HEADUPDUSER",
						width: "20",
					},

					{
						label: "Filmaşin Çap",
						property: "Y_CAP_FLM_MM",
						width: "20",
					},

					{
						label: "Filmaşin Kalite",
						property: "Y_KALITE_FLM",
						width: "20",
					},

					{
						label: "Hadde Bozuğu",
						property: "HB_REAL",
						width: "20",
					},

					{
						label: "Uç Baş",
						property: "UCBAS_REAL",
						width: "20",
					},

					{
						label: "Uç Kuyruk",
						property: "UCKUYRUK_REAL",
						width: "20",
					},

					{
						label: "Uç Baş Uç Kuyruk",
						property: "BAS_KUYRUK",
						width: "20",
					},

					{
						label: "Palet Numarası",
						property: "PACKAGE_NUMBER",
						width: "20",
					},

					{
						label: "Palet Statü",
						property: "LABEL_STATUS",
						width: "20",
					},

					{
						label: "Etiket  Statü",
						property: "PAKET_STATU",
						width: "20",
					},

					{
						label: "Boş Tartım Zamanı",
						property: "BOS_TARTIM_ZAMAN",
						width: "20",
					},

					{
						label: "Dolu Tartım Zamanı",
						property: "DOLU_ZAMAN",
						width: "20",
					},

					{
						label: "Palet Dara Tartım",
						property: "PACKAGE_TARE_WEIGHT",
						width: "20",
					},

					{
						label: "Filmaşın Net Tartım",
						property: "LABEL_WEIGHT",
						width: "20",
					},

					{
						label: "Paket User",
						property: "PACKAGE_USER",
						width: "20",
					}

					
				];
			},

			onExport2: function () {
				var aCols = this.createColumnConfig2();
				if (this.getView().byId("Ktable").getModel() == undefined) {
					MessageToast.show("Tabloda veri bulunmamaktadır");
					return;
				}

				if (this.getView().byId("Ktable").getModel().getData() == null) {
					MessageToast.show("Tabloda veri bulunmamaktadır");
					return;
				}

				var aProducts2 = this.getView()
					.byId("Ktable")
					.getModel()
					.getProperty("/").Rowsets.Rowset.Row;
				var oSettings = {
					workbook: {
						columns: aCols,
					},
					dataSource: aProducts2,
					fileName: "RaporKTKID",
				};

				var oSheet = new Spreadsheet(oSettings);
				oSheet.build().then(function () {
					MessageToast.show("Tablo Excele Aktarıldı");
				});
			},
		});
	}
);
