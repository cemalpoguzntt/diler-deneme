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
        "sap/ui/core/BusyIndicator",
        "sap/ui/core/Fragment",
        "sap/m/MessageToast",
        "sap/m/MenuItem",
        "customActivity/scripts/transactionCaller",
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
        BusyIndicator,
        Fragment,
        MessageToast,
        MenuItem,
        TransactionCaller
    ) {
        "use strict";

        this.screenObj;

        return Controller.extend(
            "customActivity.controller.oeeRefracterFactoryReport",
            {
                /**
                 * Called when a controller is instantiated and its View controls (if available) are already created.
                 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
                 */
                formatter: formatter,
                onInit: function () {
                    this.appComponent = this.getView().getViewData().appComponent;
                    this.appData = this.appComponent.getAppGlobalData();
                    this.interfaces = this.appComponent.getODataInterface();

                    this.screenObj = {};
                    this.getEquipmentObjType();

                    //Ekrandan çık gir yapıldığında alanları clearla
                },
                hideBusyIndicator: function () {
                    BusyIndicator.hide();
                },
                callEquipmentObjType2: function (iv_data, iv_scope) {
                    if (iv_data[1] == "E") {
                        MessageBox.error(iv_data[0]);
                        return;
                    }

                    var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
                        ? iv_data[0]?.Rowsets?.Rowset?.Row
                        : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setSizeLimit(1000);
                    oModel.setData(myArrr);
                    iv_scope.getView().setModel(oModel, "equipmentObjType");
                    return;
                },
                getEquipmentObjType: function () {
                    TransactionCaller.async(
                        "MES/Itelli/Refractory/REPORTS/T_GET_EQUIPMENT_OBJECT_TYPE",
                        {
                            I_PLANT: this.appData.plant,
                            I_NODEID: this.appData.node.nodeID,
                        },
                        "O_JSON",
                        this.callEquipmentObjType2,
                        this
                    );
                },
                changeTechnicalObjectType: function () {
                    var vObjectType = this.getView()
                        .byId("idEquipmentObjType")
                        .getSelectedKey();

                    this.getEquipmentNumber(vObjectType);
                    this.getMaterialInfo(vObjectType);
                },
                callEquipmentNumber: function (iv_data, iv_scope) {
                    if (iv_data[1] == "E") {
                        MessageBox.error(iv_data[0]);
                        return;
                    }

                    var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
                        ? iv_data[0]?.Rowsets?.Rowset?.Row
                        : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setSizeLimit(1000);
                    oModel.setData(myArrr);
                    iv_scope.getView().setModel(oModel, "equipmentNumber");
                    return;
                },
                getEquipmentNumber: function (pObjType) {
                    TransactionCaller.async(
                        "MES/Itelli/Refractory/DataInput/T_GET_EQUIPMENT_NUMBER",
                        {
                            I_PLANT: this.appData.plant,
                            I_OBJTYPE: pObjType,
                        },
                        "O_JSON",
                        this.callEquipmentNumber,
                        this
                    );
                },
                callMaterialInfo: function (iv_data, iv_scope) {
                    if (iv_data[1] == "E") {
                        MessageBox.error(iv_data[0]);
                        return;
                    }

                    var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
                        ? iv_data[0]?.Rowsets?.Rowset?.Row
                        : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setSizeLimit(1000);
                    oModel.setData(myArrr);
                    iv_scope.getView().setModel(oModel, "materialInfo");
                    return;
                },
                getMaterialInfo: function (pObjType) {
                    TransactionCaller.async(
                        "MES/Itelli/Refractory/DataInput/T_GET_MATERIAL_INFO",
                        {
                            I_PLANT: this.appData.plant,
                            I_OBJTYPE: pObjType,
                        },
                        "O_JSON",
                        this.callMaterialInfo,
                        this
                    );
                },
                onPressSearchFilter: function () {

                    if (this.IsEmpty("idStartDatePicker") || this.IsEmpty("idEndDatePicker") || this.IsEmpty("idEquipmentObjType") || this.IsEmpty("idMaterialInfo")) {
                        MessageBox.error("Filtre Alanlarını Seçmek Zorunludur.");
                        return false;
                    }

                    this.getTableData();
                },
                IsEmpty: function (objID) {
                    var loElement = this.getView().byId(objID);

                    if (loElement.getMetadata().getName() == "sap.m.MultiComboBox") {
                        if (loElement.getSelectedKeys().length == 0) return true;
                    }
                    if (loElement.getMetadata().getName() == "sap.m.ComboBox") {
                        if (loElement.getSelectedKey().length == 0) return true;
                    }
                    if (loElement.getMetadata().getName() == "sap.m.Select") {
                        if (loElement.getSelectedKey().length == 0) return true;
                    }
                    if (loElement.getMetadata().getName() == "sap.m.Input") {
                        if (loElement.getValue().length == 0) return true;
                    }
                    if (loElement.getMetadata().getName() == "sap.m.DatePicker") {
                        if (loElement.getValue().length == 0) return true;
                    }

                    return false;
                },
                getTableData: function () {
                    let params = {
                        I_STARTDATE: this.getView().byId("idStartDatePicker").getSelectedKey(),
                        I_ENDDATE: this.getView().byId("idEndDatePicker").getSelectedKey(),
                        I_EQART: this.getView().byId("idEquipmentObjType").getSelectedKey(),
                        I_MATERIAL: this.getView().byId("idMaterialInfo").getSelectedKey()
                    }
                    TransactionCaller.async(
                        "MES/Itelli/Refractory/REPORTS/T_factoryReport",
                        params,
                        "O_JSON",
                        this.callTableData,
                        this
                    );
                },
                callTableData: function (iv_data, iv_scope) {
                    if (iv_data[1] == "E") {
                        MessageBox.error(iv_data[0]);
                        return;
                    }

                    var myArrr = Array.isArray(iv_data[0]?.Rowsets?.Rowset?.Row)
                        ? iv_data[0]?.Rowsets?.Rowset?.Row
                        : new Array(iv_data[0]?.Rowsets?.Rowset?.Row);
                    if (myArrr[0] == undefined) {
                        MessageBox.error("Aranan filtrelere göre veri bulunamadı.");
                    }
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(myArrr);

                    var oTable = iv_scope.getView().byId("idReportTable");
                    oTable.setModel(oModel);
                    // return;
                },
            }
        );
    }
);
