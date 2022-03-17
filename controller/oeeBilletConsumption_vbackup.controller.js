sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"customActivity/scripts/custom",
		"../model/formatter",
		"sap/m/Dialog",
		"sap/m/Label",
		"sap/m/MessageToast",
		"sap/m/TextArea",
		"sap/m/Button",
		"sap/m/ButtonType",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/FilterType",
		"sap/ui/core/util/Export",
		"sap/ui/core/util/ExportTypeCSV",
		"customActivity/scripts/customStyle",
	],

	function(
		Controller,
		JSONModel,
		MessageBox,
		customScripts,
		formatter,
		Filter,
		FilterOperator,
		FilterType,
		Export,
		ExportTypeCSV,
		customScript,
		Dialog,
		Label,
		MessageToast,
		TextArea,
		Button,
		ButtonType
	) {
		//"use strict";
		var that;

		return Controller.extend("customActivity.controller.oeeBilletConsumption", {
			/**
			 * Called when a controller is instantiated and its View controls (if available) are already created.
			 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
			 */

			formatter: formatter,

			onInit: function() {
				this.appComponent = this.getView().getViewData().appComponent;
				this.appData = this.appComponent.getAppGlobalData();
				this.appData.intervalState = true;
				this.interfaces = this.appComponent.getODataInterface();
				//Filtrelemede bugünün tarihini seçer
				this.getNameFromWorkcenter();
				var day = new Date();
				day.setDate(day.getDate() - 1);
				var day =
					day.getDate() + "." + (day.getMonth() + 1) + "." + day.getFullYear();
				this.getView().byId("idDatePicker").setValue(day);
				this.getSelectData();
			},
			/*
						onPressCalculateYield: function (selectedRow) {
							// var selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split("/")[1];
							var tableModel = this.getView().getModel("confirmBilletYield").oData;
							var oTable = this.getView().byId("tblBilletYield");

							var ktkId = tableModel[selectedRow].KTKID;

							var nodeId = this.appData.node.nodeID;
							var client = this.appData.client;
							var workcenterid = this.appData.node.workcenterID;
							var plant = this.appData.plant;

							var params = {
								I_KTKID: ktkId,
							};
							var tRunner = new TransactionRunner(
								"MES/UI/Filmasin/Yield/updateYieldXqry",
								params
							);
							tRunner.ExecuteQueryAsync(this, this.callYieldValue);
						},

						callYieldValue: function (p_this, p_data) {
							var selectedIndex = p_this.appData.selectedAufnrIndex;
							p_this.getBilletYieldData();
						},
			*/
			/*
						onChangeTeoWeight: function (oEvent) {
							var selectedRow = oEvent
								.getSource()
								.oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split(
									"/"
								)[1];
							this.appData.row = selectedRow;
							var tableModel = this.getView().getModel("confirmBilletYield").oData;
							var oTable = this.getView().byId("tblBilletYield");

							var ktkId = tableModel[selectedRow].KTKID;
							var teoWeight = oEvent.getSource().getValue();
							if (teoWeight == "") {
								teoWeight = 0;
							}

							var nodeId = this.appData.node.nodeID;
							var client = this.appData.client;
							var workcenterid = this.appData.node.workcenterID;
							var plant = this.appData.plant;

							var params = {
								"Param.1": teoWeight,
								"Param.2": ktkId,
							};
							var tRunner = new TransactionRunner(
								"MES/UI/Filmasin/Yield/updateTeoricWeightQry",
								params
							);
							tRunner.ExecuteQueryAsync(this, this.callChangeTeoWeight);
						},

						callChangeTeoWeight: function (p_this, p_data) {
							//sap.m.MessageToast.show("");
							var selectedRow = p_this.appData.row;
							p_this.onPressCalculateYield(selectedRow);
						},
			*/
			/*
						onChangeHB: function (oEvent) {
							var selectedRow = oEvent
								.getSource()
								.oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split(
									"/"
								)[1];
							this.appData.row = selectedRow;
							var tableModel = this.getView().getModel("confirmBilletYield").oData;
							var oTable = this.getView().byId("tblBilletYield");

							var ktkId = tableModel[selectedRow].KTKID;
							var HB = oEvent.getSource().getValue();
							var UBUK = tableModel[selectedRow].UBUK;
							var input = HB;

							var user = this.appData.user.userID;
							var workcenterid = this.appData.node.workcenterID;
							var plant = this.appData.plant;

							var params = {
								I_UBUK: UBUK,
								I_HB: HB,
								I_KTKID: ktkId,
								I_USER: user,
							};
							var tRunner = new TransactionRunner(
								"MES/UI/Filmasin/Yield/insertScrapForYieldXqry",
								params
							);
							tRunner.ExecuteQueryAsync(this, this.callChangeHB);
						},

						callChangeHB: function (p_this, p_data) {
							//sap.m.MessageToast.show("");
							var selectedRow = p_this.appData.row;
							p_this.onPressCalculateYield(selectedRow);
						},
			*/
			/*
						onChangeUBUK: function (oEvent) {
							var selectedRow = oEvent
								.getSource()
								.oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split(
									"/"
								)[1];
							this.appData.row = selectedRow;
							var tableModel = this.getView().getModel("confirmBilletYield").oData;
							var oTable = this.getView().byId("tblBilletYield");

							var ktkId = tableModel[selectedRow].KTKID;
							var HB = tableModel[selectedRow].HB;
							var UBUK = oEvent.getSource().getValue();
							var input = UBUK;

							var user = this.appData.user.userID;
							var workcenterid = this.appData.node.workcenterID;
							var plant = this.appData.plant;

							var params = {
								I_HB: HB,
								I_UBUK: UBUK,
								I_KTKID: ktkId,
								I_USER: user,
							};
							var tRunner = new TransactionRunner(
								"MES/UI/Filmasin/Yield/insertScrapForYieldXqry",
								params
							);
							tRunner.ExecuteQueryAsync(this, this.callChangeUBUK);
						},

						callChangeUBUK: function (p_this, p_data) {
							//sap.m.MessageToast.show("");
							var selectedRow = p_this.appData.row;
							p_this.onPressCalculateYield(selectedRow);
						},
			*/
			/*
						getDateTime: function (oEvent) {
							var dateS = oEvent.getSource().getValue();
							var dateValues = dateS.split(" - ");
							console.log(dateValues[0]);
							console.log(dateValues[1]);
						},
			*/

			colorizeTableData: function() {
				var oTable = this.getView().byId("tblBilletYield");
				var tableItems = oTable.mAggregations.items;
				var modelData = this.getView().getModel("confirmBilletYield").getData();
			},

			getBilletYieldData: function(oEvent) {
				this.getView().setBusy(true);
				var inappropriateData = "F";
				var werks = this.appData.plant;
				// var aufnr = this.appData.selected.order.orderNo;
				var workcenterid = this.appData.node.workcenterID;
				var dateS = this.getView().byId("idDatePicker").getValue();
				var aufnr = this.getView().byId("selectWorkorder").getSelectedKey();
				var session = this.getView()
					.byId("idSessionSelect")
					.getSelectedKey()
					.split("-");
				if (session[0] == "") {
					session[0] = "00:00:00";
					session[1] = "24:00:00";
				}
				var params = {
					"Param.1": werks,
					"Param.2": dateS,
					"Param.3": session[0],
					"Param.4": session[1],
					"Param.5": aufnr,
					"Param.6": this.appData.node.name.substr(0, 5)
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/Yield/getYieldDataQry",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callBilletYieldData);
			},


			callBilletYieldData: function(p_this, p_data) {
				var tableData = p_data;
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(tableData.Rowsets.Rowset[0]?.Row);
				p_this.getView().setModel(oModel, "confirmBilletYield");
				p_this.colorizeTableData();
				p_this.getView().setBusy(false);
				p_this._workorderFilter(p_data.Rowsets.Rowset[0].Row);
				p_this.getCastIds(p_data.Rowsets.Rowset[0].Row);
				p_this.getOrders(p_data.Rowsets.Rowset[0].Row);
			},

			getCastIds: function(p) {
				var r = [];
				p.filter(function(item) {
					var i = r.findIndex(x => (x.CASTID == item.CASTID));
					if (i <= -1) {
						r.push(item)
					}
				});
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(r);
				this.getView().setModel(oModel, "castList");
			},
			getOrders: function(p) {
				var r = [];
				p.filter(function(item) {
					var i = r.findIndex(x => (x.AUFNR == item.AUFNR));
					if (i <= -1) {
						r.push(item)
					}
				});
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(r);
				this.getView().setModel(oModel, "orderList");
			},

			_workorderFilter: function(dataset) {
				var oView = this.getView();
				var modelFilter = new sap.ui.model.json.JSONModel();
				var arrQuality = Array.from(new Set(dataset.map((s) => s.AUFNR))).map(
					(AUFNR) => {
						return {
							AUFNR: AUFNR,
						};
					}
				);
				modelFilter.setData(arrQuality);
				arrQuality.push({
					AUFNR: ""
				});
				if (this.getView().byId("selectWorkorder").getSelectedKey() == "")
					oView.byId("selectWorkorder").setModel(modelFilter);
			},

			getInappropriateYieldData: function(oEvent) {
				var oView = this.getView();
				var oModel = this.getView().getModel("confirmBilletYield");
				var aFilter1 = new sap.ui.model.Filter(
					"YIELD",
					sap.ui.model.FilterOperator.LT,
					96.5
				);
				var aFilter2 = new sap.ui.model.Filter(
					"YIELD",
					sap.ui.model.FilterOperator.GT,
					99.5
				);
				var combineFilters = new sap.ui.model.Filter({
					filters: [aFilter1, aFilter2],
					and: false,
				});
				oView.byId("tblBilletYield").getBinding("items").filter(combineFilters);
				var oTable = this.getView().byId("tblBilletYield");
				var tableItems = oTable.mAggregations.items;
				var modelData = this.getView().getModel("confirmBilletYield").getData();
				var tableItemRow;
				for (var i = 0; i < tableItems.length; i++) {
					tableItems[i].mAggregations.cells[10].removeStyleClass("fontError");
					tableItems[i].mAggregations.cells[10].removeStyleClass("fontSuccess");
					tableItems[i].mAggregations.cells[10].removeStyleClass("fontWarning");
					tableItemRow = oTable.getItems()[i].getCells()[10].mProperties.text;
					if (tableItemRow > 99.5 || tableItemRow < 96.5)
						tableItems[i].mAggregations.cells[10].addStyleClass("fontError");
					else if (tableItemRow <= 99.5 && tableItemRow >= 96.5)
						tableItems[i].mAggregations.cells[10].addStyleClass("fontSuccess");
					else
						tableItems[i].mAggregations.cells[10].addStyleClass("fontWarning");
				}
				for (var i = 0; i < tableItems.length; i++) {
					tableItems[i].mAggregations.cells[11].removeStyleClass("fontError");
					tableItems[i].mAggregations.cells[11].removeStyleClass("fontSuccess");
					tableItems[i].mAggregations.cells[11].removeStyleClass("fontWarning");
					tableItemRow = oTable.getItems()[i].getCells()[11].mProperties.text;
					if (tableItemRow > 99.5 || tableItemRow < 96.5)
						tableItems[i].mAggregations.cells[11].addStyleClass("fontError");
					else if (tableItemRow <= 99.5 && tableItemRow >= 96.5)
						tableItems[i].mAggregations.cells[11].addStyleClass("fontSuccess");
					else
						tableItems[i].mAggregations.cells[11].addStyleClass("fontWarning");
				}
			},


			sendYieldConfirmation: function(oEvent) {
				var type = oEvent.getSource().mProperties.type;
				var selectedRow = oEvent
					.getSource()
					.oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split(
						"/"
					)[1];
				if (type == "Accept") {
					sap.m.MessageBox.warning(
						this.appComponent.oBundle.getText("OEE_ALERT_FLM_CONFIRM_ACCEPT"), {
							actions: [
								this.appComponent.oBundle.getText("EVET"),
								this.appComponent.oBundle.getText("HAYIR"),
							],
							onClose: function(oAction) {
								if (oAction == "EVET") {
									this.yieldConfirmation(selectedRow);
								} else {
									return;
								}
							}.bind(this),
						}
					);
				} else if (type == "Reject") {
					sap.m.MessageBox.warning(
						this.appComponent.oBundle.getText("OEE_ALERT_FLM_CONFIRM_ACCEPT"), {
							actions: [
								this.appComponent.oBundle.getText("EVET"),
								this.appComponent.oBundle.getText("HAYIR"),
							],
							onClose: function(oAction) {
								if (oAction == "EVET") {
									this.retryYieldConfirmation(selectedRow);
								} else {
									return;
								}
							}.bind(this),
						}
					);
				}
			},

			retryYieldConfirmation: function(selectedRow) {
				var tableModel = this.getView().getModel("confirmBilletYield").oData;
				var oTable = this.getView().byId("tblBilletYield");

				var ID = tableModel[selectedRow].ID;

				var params = {
					I_ID: ID,
				};
				var tRunner = new TransactionRunner(
					"MES/UI/ConfirmationList/retryQueueConfirmXquery",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callRetryConfirmation);
			},

			callRetryConfirmation: function(p_this, p_data) {
				sap.m.MessageToast.show("Verim Teyidi Gönderildi");
			},

			yieldConfirmation: function(selectedRow) {
				var tableModel = this.getView().getModel("confirmBilletYield").oData;
				var oTable = this.getView().byId("tblBilletYield");

				var ktkId = tableModel[selectedRow].KTKID;
				var teoWeight = tableModel[selectedRow].TEO_WEIGHT;
				var aufnr = tableModel[selectedRow].AUFNR;
				var nodeId = this.appData.node.nodeID;
				var client = this.appData.client;
				var user = this.appData.user.userID;
				var workcenterid = this.appData.node.workcenterID;
				var plant = this.appData.plant;

				var params = {
					I_AUFNR: aufnr,
					I_USER: user,
					I_WORKCENTER: workcenterid,
					I_PLANT: plant,
					I_CLIENT: client,
					I_NODEID: nodeId,
					I_KTKID: ktkId,
					I_TEO_QUANTITY: teoWeight,
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Filmasin/Yield/YieldConfirmation/insertYieldConfirmationXqry",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callYieldConfirmation);
			},

			callYieldConfirmation: function(p_this, p_data) {
				sap.m.MessageToast.show("Verim Teyidi Gönderildi");
			},

			cancelYieldConfirmation: function(oEvent) {
				var selectedRow = oEvent
					.getSource()
					.oPropagatedProperties.oBindingContexts.confirmBilletYield.sPath.split(
						"/"
					)[1];
				sap.m.MessageBox.warning(
					this.appComponent.oBundle.getText("OEE_ALERT_FLM_CONFIRM_CANCEL"), {
						actions: [
							this.appComponent.oBundle.getText("EVET"),
							this.appComponent.oBundle.getText("HAYIR"),
						],
						onClose: function(oAction) {
							if (oAction == "EVET") {
								this.cancelConfirmation(selectedRow);
							} else {
								return;
							}
						}.bind(this),
					}
				);
			},

			cancelConfirmation: function(selectedRow) {
				var tableModel = this.getView().getModel("confirmBilletYield").oData;
				var oTable = this.getView().byId("tblBilletYield");

				var ktkId = tableModel[selectedRow].KTKID;
				var conf_number = tableModel[selectedRow].CONF_NUMBER;
				var conf_counter = tableModel[selectedRow].CONF_COUNTER;
				var entryId = tableModel[selectedRow].ENTRY_ID;
				var aufnr = tableModel[selectedRow].AUFNR;
				var matnr = tableModel[selectedRow].MATNR;

				var nodeId = this.appData.node.nodeID;
				var client = this.appData.client;
				var user = this.appData.user.userID;
				var workcenterid = this.appData.node.workcenterID;
				var plant = this.appData.plant;

				var params = {
					I_CONF_NUMBER: conf_number,
					I_CONF_COUNTER: conf_counter,
					I_ENTRYID: entryId,
					I_AUFNR: aufnr,
					I_MATNR: matnr,
					I_KTKID: ktkId,
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Filmasin/ConfirmCancel/confirmCancelXquery",
					params
				);

				tRunner.ExecuteQueryAsync(this, this.callCancelYield);
			},

			callCancelYield: function(p_this, p_data) {
				sap.m.MessageToast.show("Teyit İptal İsteği Gönderildi");
			},

			refreshData: function(oEvent) {
				this.getBilletYieldData();
			},

			callYieldConfirmationXqry: function(p_this, p_data) {
				sap.m.MessageToast.show(
					p_this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
				);
			},

	onConfirmBilletYield: function() {
                                  sap.m.MessageBox.warning(
                                  this.appComponent.oBundle.getText("Teyit vermek istediğinize emin misiniz?"),
                                  {
                                 actions: [
                                 this.appComponent.oBundle.getText("EVET"),
                                 this.appComponent.oBundle.getText("HAYIR"),
                                 ],
                                onClose: function (oAction) {
                                if (oAction == "EVET") {
                                this.ConfirmBilletYield();
                                } else {
                                return;
                                }
                                }.bind(this),
                                }
                                );
                                }, 
                          
               ConfirmBilletYield: function() {
				var client = this.appData.client;
				var plant = this.appData.plant;
				var nodeID = this.appData.node.nodeID;
				var workcenterID = this.appData.node.workcenterID;
				var operaionNo = this.appData.selected.operationNo;
				var dateS = this.getView().byId("idDatePicker").getValue();
				var session = this.getView()
					.byId("idSessionSelect")
					.getSelectedKey()
					.split("-");
				if (session[0] == "") {
					session[0] = "00:00:00";
					session[1] = "24:00:00";
				}

				var oData = this.getView().getModel("confirmBilletYield").oData;
				var jsonData = JSON.stringify(oData);
				var params = {
					I_CLIENT: client,
					I_PLANT: plant,
					I_NODEID: nodeID,
					I_WORKCENTER: workcenterID,
					I_TABLEDATA: jsonData,
					I_DATE: dateS,
					I_FIRSTTIME: session[0],
					I_LASTTIME: session[1],
				};

				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/Yield/YieldConfirmation/insertYieldConfirmationXqry",
					params
				);

				tRunner.ExecuteQueryAsync(this, this.callYieldConfirmationXqry);
			},

			onClickOpenBilletFragment: function(oEvent) {
				var selectedRowContext = oEvent
					.getSource()
					.getParent()
					.getBindingContextPath()
					.split("/")[1];
				var confirmBilletYield = this.getView().getModel("confirmBilletYield").oData;
				var oRow = confirmBilletYield[selectedRowContext];
				var castID = confirmBilletYield[selectedRowContext].CASTID;
				var aufnr = confirmBilletYield[selectedRowContext].AUFNR;
				var oView = this.getView();
				var oDialog = oView.byId("changeBilletConsumption");
				if (!oDialog) {
					oDialog = sap.ui.xmlfragment(
						oView.getId(),
						"customActivity.fragmentView.changeBilletConsumption",
						this
					);
					oView.addDependent(oDialog);
				}
				oDialog.open();
				this.appData.oDialog = oDialog;

				this.getBilletFragmentList(oRow);
			},

			onClickChangeBilletFragment: function(oEvent) {
				var oView = this.getView();
				var oDialog = oView.byId("changeBilletYield");
				if (!oDialog) {
					oDialog = sap.ui.xmlfragment(
						oView.getId(),
						"customActivity.fragmentView.changeBilletYield",
						this
					);
					oView.addDependent(oDialog);
				}
				var obj = {
					YOL: oEvent.oSource.oParent.getCells()[1].getText(),
					WORKCENTER_ID: this.appData.node.workcenterID,
					SHIFT: oEvent.oSource.oParent.getCells()[0].getText(),
					AUFNR: oEvent.oSource.oParent.getCells()[2].getText(),
					CASTID: oEvent.oSource.oParent.getCells()[3].getText(),
					COUNTKTK: oEvent.oSource.oParent.getCells()[7].getText(),
					UCKUYRUK: oEvent.oSource.oParent.getCells()[13].getText(),
					HB: oEvent.oSource.oParent.getCells()[14].getText(),
					SHORT_PIECE: oEvent.oSource.oParent.getCells()[15].getText(),
					SELECTED: true
				}
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(obj);
				this.getView().setModel(oModel, "selectedItem");

				oDialog.open();
				this.appData.oDialog = oDialog;
			},

			callBilletFragmentList: function(p_this, p_data) {
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setSizeLimit(1000);
				oModel.setData(p_data.Rowsets.Rowset[0]?.Row);
				p_this.getView().setModel(oModel, "BilletFragmentModel");
			},

			getBilletFragmentList: function(oRow) {
				var plant = this.appData.plant;
				var dateS = this.getView().byId("idDatePicker").getValue();
				/*
				var session = this.getView()
					.byId("idSessionSelect")
					.getSelectedKey()
					.split("-");
				if (session[0] == "") {
					session[0] = "00:00:00";
					session[1] = "24:00:00";
				}
				*/
				var params = {
					"Param.1": plant,
					"Param.2": oRow.AUFNR,
					"Param.3": oRow.CASTID,
					"Param.4": dateS,
					"Param.5": oRow.SHIFT,
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/Yield/YieldConfirmation/getBilletFragmentListQry",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callBilletFragmentList);
			},

			onSaveBilletConsumption: function() {
				var oData = this.getView().getModel("BilletFragmentModel").oData;
				var oEdit = oData.filter(e => e.XEDIT);
				var params = {
					I_FRAGMENTDATA: JSON.stringify(oEdit)
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/Yield/YieldConfirmation/changeBilletConsumptionXquery",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callBilletConsumption);
			},

			callBilletConsumption: function(p_this, p_data) {
				sap.m.MessageToast.show(
					p_this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
				);
				p_this.getBilletYieldData();
				p_this.getView().byId("changeBilletConsumption").close();
			},

			openShortPieceFragment: function() {
				var oView = this.getView();
				var oDialog = oView.byId("changeShortPiece");
				if (!oDialog) {
					oDialog = sap.ui.xmlfragment(
						oView.getId(),
						"customActivity.fragmentView.changeShortPiece",
						this
					);
					oView.addDependent(oDialog);
				}
				oDialog.open();
				this.appData.oDialog = oDialog;
				this.getZmpmBilletShiftShortPiece();
			},

			handleCancel: function(oEvent) {
				this.getView().byId(oEvent.getSource()?.oParent.sId.split("--")[1]).destroy(); //.close();
			},


			callZmpmBilletShiftShortPiece: function(p_this, p_data) {
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(p_data.Rowsets.Rowset[0]?.Row);
				p_this.getView().setModel(oModel, "shortPieceList")
			},

			getZmpmBilletShiftShortPiece: function() {
				var datePicker = this.getView().byId("idDatePickerFragment").getValue();
				var params = {
					"Param.1": datePicker,
					"Param.2": this.appData.plant
				};


				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/Yield/YieldConfirmation/selectZmpmBilletShiftShortPieceQry",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callZmpmBilletShiftShortPiece);
			},

			callInsertZmpmBilletShiftShortPieceXquery: function(p_this, p_data) {
				sap.m.MessageToast.show(
					p_this.appComponent.oBundle.getText("OEE_LABEL_SUCCESS")
				);
				p_this.getZmpmBilletShiftShortPiece();
				var oView = p_this.getView();
				oView.byId("idSessionSelectFragment").setValue("");
				oView.byId("shortPieceQuantity").setValue("");
			},

			onChangeDialogShortPiece: function(oEvent) {
				var oView = this.getView();
				var datePicker = oView.byId("idDatePickerFragment").getValue();
				var session = oView.byId("idSessionSelectFragment").getSelectedKey();
				var shortPieceQuantity = oView.byId("shortPieceQuantity").getValue();

				if (datePicker == "" || session == "" || shortPieceQuantity == "") {
					sap.m.MessageBox.error(
						this.appComponent.oBundle.getText("OEE_ERR_MSG_FILL_BLANKS")
					);
					return;
				}

				var params = {
					"I_SPDATE": datePicker,
					"I_SHIFT": session,
					"I_QUANTITY": shortPieceQuantity,
					"I_USER": this.appData.user.userID,
					"I_WERKS": this.appData.plant
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/Yield/YieldConfirmation/insertZmpmBilletShiftShortPieceXquery",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callInsertZmpmBilletShiftShortPieceXquery);
			},

			onChangeBilletValue: function(oEvent) {
				var idx = oEvent.getParameter('id').split('-confirmTable-')[1];
				var oRow = oEvent.oSource.getParent().getList().getModel("BilletFragmentModel").getData()[idx];
				oRow.XEDIT = 'X';
				debugger;
			},

			onPressYieldReport: function(oEvent) {
				//this.appComponent.getRouter().navTo('ZACT_YIELD_REPORT');
				location.href = "http://10.237.82.27:50000/XMII/CM/MES/WebContent/SSCE/YieldReport.html"
			},

			getNameFromWorkcenter: function(oEvent) {
				var wc = this.appData.node.workcenterID;
				var params = {
					"Param.1": wc
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/getNameFromWorkcenterQry",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callName);
			},

			callName: function(p_this, p_data) {
				p_this.appData.node.name = p_data.Rowsets.Rowset[0].Row[0].NAME;
			},

			onPressChangeBilletYield: function(oEvent) {
				var newYol = this.getView().byId("idNewYol").getValue();
				var newShift = this.getView().byId("idNewShift").getValue();
				var newOrder = this.getView().byId("idNewOrder").getValue();
				var newCastid = this.getView().byId("idNewCastid").getValue();
				var newKtkCnt = this.getView().byId("idNewKTKCnt").getValue();
				var newHB = this.getView().byId("idNewHB").getValue();
				var newUB = this.getView().byId("idNewUB").getValue();
				var newShort = this.getView().byId("idNewShort").getValue();
				var dat = this.getView().getModel("selectedItem").getData();
				var input = {
					"YOL": dat.YOL,
					"SHIFT": dat.SHIFT,
					"ORDER": dat.AUFNR,
					"CASTID": dat.CASTID,
					"KTKCNT": dat.COUNTKTK,
					"HB": dat.HB,
					"UB": dat.UCKUYRUK,
					"SHORT": dat.SHORT_PIECE,

					"NEWYOL": newYol,
					"NEWSHIFT": newShift,
					"NEWORDER": newOrder,
					"NEWCASTID": newCastid,
					"NEWKTKCNT": newKtkCnt,
					"NEWHB": newHB,
					"NEWUB": newUB,
					"NEWSHORT": newShort
				};
				var params = {
					"InputJSON": JSON.stringify(input)
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/Yield/updateConsumptionFieldsXqry",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callbackChangeBilletYield);
				this.handleCancel(oEvent);
			},

			callbackChangeBilletYield: function(p_this, p_data) {

			},

			onSelectRB: function(oEvent) {
				if (!oEvent.getParameter("selected")) {
					return false;
				}
				var sel = oEvent.getSource().getId().includes("idRB1");
				var dat = this.getView().getModel("selectedItem").getData();
				dat.SELECTED = sel;
				this.getView().getModel("selectedItem").refresh();
			},

			onExit: function() {
				this.appComponent
					.getEventBus()
					.unsubscribe(
						this.appComponent.getId(),
						"orderChanged",
						this.refreshReported,
						this
					);
				if (this.intervalHandle) clearInterval(this.intervalHandle);
			},


			getTableFilter2: function(oEvent) {
				var oView = this.getView();
				var oModel = this.getView().getModel("confirmBilletYield");
				var inputvrdNo = oView.byId("inputvrdNo").getValue();
				var inputyolNo = oView.byId("inputyolNo").getValue();
				var inputsipNo = oView.byId("inputsipNo").getValue();
				var inputDNo = oView.byId("inputDNo").getValue();
				var aFilter1 = new sap.ui.model.Filter(
					"YIELD",
					sap.ui.model.FilterOperator.LT,
					96.5
				);
				var aFilter2 = new sap.ui.model.Filter(
					"YIELD",
					sap.ui.model.FilterOperator.GT,
					99.5
				);
				var aFilter3 = new sap.ui.model.Filter(
					"SHIFT",
					sap.ui.model.FilterOperator.BT,
					inputvrdNo
				);
				var aFilter4 = new sap.ui.model.Filter(
					"ARBPL",
					sap.ui.model.FilterOperator.BT,
					inputyolNo
				);
				var aFilter5 = new sap.ui.model.Filter(
					"AUFNR",
					sap.ui.model.FilterOperator.BT,
					inputsipNo
				);
				var aFilter6 = new sap.ui.model.Filter(
					"CASTID",
					sap.ui.model.FilterOperator.BT,
					inputDNo
				);
				var combineFilters = new sap.ui.model.Filter({
					filters: [aFilter1, aFilter2, aFilter3, aFilter4, aFilter5, aFilter6],
					and: false,
				});
				oView.byId("tblBilletYield").getBinding("items").filter(combineFilters);
				var oTable = this.getView().byId("tblBilletYield");
				var tableItems = oTable.mAggregations.items;
				var modelData = this.getView().getModel("confirmBilletYield").getData();
				var tableItemRow;
				for (var i = 0; i < tableItems.length; i++) {
					tableItems[i].mAggregations.cells[10].removeStyleClass("fontError");
					tableItems[i].mAggregations.cells[10].removeStyleClass("fontSuccess");
					tableItems[i].mAggregations.cells[10].removeStyleClass("fontWarning");
					tableItemRow = oTable.getItems()[i].getCells()[10].mProperties.text;
					if (tableItemRow > 99.5 || tableItemRow < 96.5)
						tableItems[i].mAggregations.cells[10].addStyleClass("fontError");
					else if (tableItemRow <= 99.5 && tableItemRow >= 96.5)
						tableItems[i].mAggregations.cells[10].addStyleClass("fontSuccess");
					else
						tableItems[i].mAggregations.cells[10].addStyleClass("fontWarning");
				}
				for (var i = 0; i < tableItems.length; i++) {
					tableItems[i].mAggregations.cells[11].removeStyleClass("fontError");
					tableItems[i].mAggregations.cells[11].removeStyleClass("fontSuccess");
					tableItems[i].mAggregations.cells[11].removeStyleClass("fontWarning");
					tableItemRow = oTable.getItems()[i].getCells()[11].mProperties.text;
					if (tableItemRow > 99.5 || tableItemRow < 96.5)
						tableItems[i].mAggregations.cells[11].addStyleClass("fontError");
					else if (tableItemRow <= 99.5 && tableItemRow >= 96.5)
						tableItems[i].mAggregations.cells[11].addStyleClass("fontSuccess");
					else
						tableItems[i].mAggregations.cells[11].addStyleClass("fontWarning");
				}
			},
			getTableFilter: function(oEvent) {

				this.getView().setBusy(true);
				var inputvrdNo = this.getView().byId("selectShift").getSelectedKey();
				var inputyolNo = this.getView().byId("selectARBPL").getSelectedKey();
				var inputDNo = this.getView().byId("inputDNo").getValue();
				var inappropriateData = "F";
				var werks = this.appData.plant;
				// var aufnr = this.appData.selected.order.orderNo;
				var workcenterid = this.appData.node.workcenterID;
				var dateS = this.getView().byId("idDatePicker").getValue();
				var aufnr = this.getView().byId("inputsipNo").getValue();

				var session = this.getView()
					.byId("idSessionSelect")
					.getSelectedKey()
					.split("-");
				if (session[0] == "") {
					session[0] = "00:00:00";
					session[1] = "24:00:00";
				}
				var params = {
					"Param.1": werks,
					"Param.2": dateS,
					"Param.3": session[0],
					"Param.4": session[1],
					"Param.5": aufnr,
					"Param.6": inputyolNo,
					"Param.7": inputDNo,
					"Param.8": inputvrdNo
				};
				var tRunner = new TransactionRunner(
					"MES/UI/Haddehane/Yield/getYieldDataQry_Filter",
					params
				);
				tRunner.ExecuteQueryAsync(this, this.callBilletYieldData);
				//this.getView().byId("inputvrdNo").setValue("");
				//this.getView().byId("inputyolNo").setValue("");
				//this.getView().byId("inputDNo").setValue("");
				// this.getView().byId("inputsipNo").setValue("");

			},
			getSelectData: function() {
                                var name = this.appData.node.name;
                                   var data = {
					List: [{
							Value: "",
						},
						{
							Value: "1",
						},
						{
							Value: "2"
						}
					],
				};
				var mCombo = this.getView().byId("selectARBPL");
				var oModel = new JSONModel(data);
				mCombo.setModel(oModel);


				var shiftData = {
					List: [{
							Value: "",
						},
						{
							Value: "1",
						},
						{
							Value: "2"
						},
						{
							Value: "3"
						}
					],
				};
				var mComboShift = this.getView().byId("selectShift");
				var model = new JSONModel(shiftData);
				mComboShift.setModel(model);


			}



		});
	}
);