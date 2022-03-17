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

		return Controller.extend("customActivity.controller.Printer_ID", {

			onInit: function () {
				this.appComponent = this.getView().getViewData().appComponent;
				this.appData = this.appComponent.getAppGlobalData();
				this.interfaces = this.appComponent.getODataInterface();
				this.getModel();
			},

			getModel: function () {
				var response = TransactionCaller.sync(
					"MES/Itelli/PRINTERS/T_GET_ID_MODEL",
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
				this.getView().byId("birinci").setModel(tableModel);
				this.getView().byId("birinci").getModel().refresh();
			},

			openFragment: function () {
				if (!this._oDialogSayac) {
					this._oDialogSayac = sap.ui.xmlfragment(
						"fragmentOne",
						"customActivity.fragmentView.Printer_ID",  
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
				var printid = sap.ui.core.Fragment.byId(
					"fragmentOne",
					"printid"
				).getValue();

				var response = TransactionCaller.sync(
					"MES/Itelli/PRINTERS/T_INSERT",
					{
						I_ID: printid,
					},
					"O_JSON"
				);

				if (response[1] == "E") {
					MessageBox.error("Kaydetme İşlemi Başarısız!");
				}

			else{
                
            }MessageBox.information("Başarıyla Kayıt Edildi");
            this.getModel();
			this.onCancelFragment();

			},
			onDelete: function () {


				var index = this.getView().byId("birinci").getSelectedContextPaths();
				var selectedNumber = this.getView().byId("birinci").getSelectedContextPaths()[0].split("/")[1];
                 var id = this.getView().byId("birinci").getModel().oData[selectedNumber].ID;

				var response = TransactionCaller.sync(
                    "MES/Itelli/PRINTERS/T_DELETE_ID",
                    
                    {
                        I_ID: id,
                    },
                    "O_JSON"
                );
                this.getModel();


			},
			



		});
	}
);
