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
        "sap/ui/core/Core",
        "sap/ui/core/library",
        "sap/ui/unified/library",
        "sap/ui/unified/DateTypeRange"
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
        Core,
        CoreLibrary,
        UnifiedLibrary,
        DateTypeRange
    ) {
		return Controller.extend("customActivity/controller/StdDisiReport", {
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

			openRaporEkranı: function () {
				this.getView().byId("FlexKtk").setVisible(true);
					this.byId("selectionScreen").setVisible(false);
			},


           

			getData: function () {
                var day1 = this.getView().byId("datePicker").getDateValue().getDate(); 
                var month1 =this.getView().byId("datePicker").getDateValue().getMonth() + 1;
                var fullyear1 = this.getView()
                  .byId("datePicker")
                  .getDateValue()
                  .getFullYear();
				var date1 = fullyear1 + "-" + month1 + "-" + day1;

                var day2 = this.getView().byId("datePicker").getSecondDateValue().getDate(); 
                var month2 =this.getView().byId("datePicker").getSecondDateValue().getMonth() + 1;
                var fullyear2 = this.getView()
                  .byId("datePicker")
                  .getSecondDateValue()
                  .getFullYear();
				var date2 = fullyear2 + "-" + month2 + "-" + day2;


			
				


				this.byId("selectionScreen").setBusy(true);

				


				
				
						TransactionCaller.async(
							"MES/Itelli/FLM/STD_DISI_RAPORU/stdDisiReportT",
							{
								I_DATE1: date1,
								I_DATE2: date2,
								
							},
							"O_JSON",
							this.setData2,
							this
						);
					 
                    
                   
				
			},
            backMainPanel: function () {
				
				this.getView().byId("FlexKtk").setVisible(false);
				this.byId("selectionScreen").setVisible(true);
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
				iv_scope.getView().byId("tableReportedTie3").setModel(myModel);
				iv_scope.getView().byId("selectionScreen").setBusy(false);
            },
            createColumns : function () {
				return [{
					label: 'Tarih',
					property: 'INSDATE',
					width: '20'
				}, {
					label: 'Vardiya',
					property: 'SHIFT',
					width: '20'
				}, {
					label: 'Üretim Sip.No',
					property: 'AUFNR',
					width: '20'
				},

				{
					label: 'KTKID',
					property: 'KTKID',
					width: '20'
				},
				{
					label: 'MALZEME NO',
					property: 'MATNR',
					width: '20'
				},
				{
					label: 'KALITE_FLM',
					property: 'Y_KALITE_FLM',
					width: '20'
				},
				{
					label: 'CAP_FLM_MM',
					property: 'Y_CAP_FLM_MM',
					width: '20'
				},
				{
					label: 'EBAT',
					property: 'Y_EBAT',
					width: '20'
				},
				{
					label: 'BOY_KTK',
					property: 'Y_BOY_KTK',
					width: '20'
				},
				{
					label: 'KUTUK_MENSEI',
					property: 'Y_KUTUK_MENSEI',
					width: '20'
				},
				{
					label: 'TASLAMA',
					property: 'Y_TASLAMA',
					width: '20'
				},
				{
					label: 'DOKUM',
					property: 'Y_DOKUM',
					width: '20'
				},
				{
					label: 'REASON_TYPE',
					property: 'REASON_TYPE',
					width: '20'
				},
				{
					label: 'REASON',
					property: 'REASON',
					width: '45'
				},
				{
					label: 'DESCRIPTION',
					property: 'DESCRIPTION',
					width: '20'
				},
				{
					label: 'WEIGHT',
					property: 'WEIGHT',
					width: '20'
				}
			
			
			];
			},
			
			
				

			onExport2: function (oEvent) {

				var oColumns = this.createColumns();
				var tableModel = this.getView().byId("tableReportedTie3").getModel();
				if (!(!!tableModel?.oData)) {
					MessageBox.error("Tabloda veri bulunmamaktadır.");
					return;
				}
				var oDatas = tableModel.getData().Rowsets.Rowset.Row;
				if (!(!!oDatas)) {
					MessageBox.error("Tabloda veri bulunmamaktadır.");
					return;
				}
				var oSettings = {
					workbook: {
						columns: oColumns
					},
					dataSource: oDatas,
					fileName: "STD DISI RAPOR" 
				};
				var oSheet = new Spreadsheet(oSettings);
				oSheet.build().then(function () {
					MessageToast.show("Tablo Excel'e aktarıldı.");
				});
			},

		

		});
	}
);
