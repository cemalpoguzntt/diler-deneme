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
      "customActivity.controller.oeeRefractoryDataReport",
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
        getLifespanReportData: function () {
          if (this.IsEmpty("idDatePicker")) {
            MessageBox.error("Tarih Aralığı Seçmek Zorunludur.");
            return false;
          }
          // if (this.IsEmpty("idEquipmentNumber")) {
          //   MessageBox.error("Ekipman Seçmek Zorunludur.");
          //   return false;
          // }
          if (this.IsEmpty("idEquipmentObjType")) {
            MessageBox.error("T. Nesne Türü Seçmek Zorunludur.");
            return false;
          }
          var refDate = this.getView().byId("idDatePicker").getValue();
          var equipmentNumber = this.getView()
            .byId("idEquipmentNumber")
            .getSelectedKey();
          var refMalz = this.getView().byId("idMaterialInfo").getValue();
          var objectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();

          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/REPORTS/T_GET_LIFESPAN_REPORT_DATA",
            {
              I_PLANT: this.appData.plant,
              I_REF_DATE: refDate,
              I_OBJECTYPE: objectType,
              I_EQUIPMENT_NUMBER: equipmentNumber,
              I_REFMALZ: refMalz,
            },
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }

          var vObjectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          if (response[0]?.Rowsets?.Rowset?.Row) {
            var jsData = Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
              ? response[0]?.Rowsets?.Rowset?.Row
              : new Array(response[0]?.Rowsets?.Rowset?.Row);
            var newColumnData = [
              { colName: "CAST_ID" },
              { colName: "EQUIPMENT_DESC" },
            ];
            if (vObjectType == "ZKOKİL") newColumnData.push({ colName: "YOL" });
            if (vObjectType == "ZPOTA") newColumnData.push({ colName: "TARIH" });
            var newRowData = [];
            var equipments = [];

            for (var i = 0; i < jsData.length; i++) {
              var element = jsData[i];

              var newArray = newColumnData.filter(function (obj) {
                return obj.colName == element.NESNE;
              });

              if (newArray.length == 0) {
                newColumnData.push({ colName: element.NESNE });
              }
            }

            for (var i = 0; i < jsData.length; i++) {
              var element = jsData[i];

              var filter = {
                EQUIPMENT_DESC: element.EQUIPMENT_DESC,
                CAST_ID: element.CAST_ID,
              };
              var newArray = equipments.filter(function (item) {
                for (var key in filter) {
                  if (item[key] === undefined || item[key] != filter[key])
                    return false;
                }
                return true;
              });

              if (newArray.length == 0) {
                equipments.push({
                  EQUIPMENT_DESC: element.EQUIPMENT_DESC,
                  CAST_ID: element.CAST_ID,
                });
              }
            }

            for (let index = 0; index < equipments.length; index++) {
              const element = equipments[index];
              var filter = {
                EQUIPMENT_DESC: element.EQUIPMENT_DESC,
                CAST_ID: element.CAST_ID,
              };

              var newArray = jsData.filter(function (item) {
                for (var key in filter) {
                  if (item[key] === undefined || item[key] != filter[key])
                    return false;
                }
                return true;
              });
              let newObj = {};
              for (let index = 0; index < newArray.length; index++) {
                const element = newArray[index];

                newObj[element.NESNE] = element.OMUR;
                newObj.EQUIPMENT_DESC = element.EQUIPMENT_DESC;
                newObj.CAST_ID = element.CAST_ID;
                newObj.YOL = element.YOL;
                newObj.TARIH = element.TARIH;
                newObj["BAKIM_SAYACI"] = element["BAKIM_SAYACI"];
                newObj["EQUIPMENT_NUMBER"] = element["EQUIPMENT_NUMBER"];
              }

              newRowData.push(newObj);
            }
            if (vObjectType == "ZKOKİL") newColumnData.push({ colName: "BAKIM_SAYACI" });
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setSizeLimit(1000);
            oModel.setData({
              rows: newRowData,
              columns: newColumnData,
            });

            var oTable = this.getView().byId("idReportTable");
            oTable.setModel(oModel);
            oTable.bindColumns("/columns", function (sId, oContext) {
              var columnName = oContext.getObject().colName;
              var colDesc = columnName;
              if (columnName == 'CAST_ID') {
                colDesc = "Döküm No";
              } else if (columnName == 'EQUIPMENT_DESC') {
                colDesc = "Ekipman";
              } else if (columnName == 'TARIH') {
                colDesc = "Kayıt Tarihi";
              } else if (columnName == 'BAKIM_SAYACI') {
                colDesc = "Bakım Sayacı";
              }
              return new sap.ui.table.Column({
                label: colDesc,
                template: columnName,
                width: "15rem",
                filterProperty: columnName,
                sortProperty: columnName,
              });
            });
            oTable.bindRows("/rows");
          } else {
            var oModel = new sap.ui.model.json.JSONModel();
            var oTable = this.getView().byId("idReportTable");
            oTable.setModel(oModel);
          }
        },
        onPressSearchFilter: function () {
          this.getLifespanReportData();
        },
        showDetail: function () {
          let selectedIndex = this.getView().byId("idReportTable").getSelectedIndex();
          let selectedItem = this.getView().byId("idEquipmentObjType").getSelectedKey();
          if (selectedItem == '') {

            MessageBox.error("Lütfen teknik nesne türü seçiniz")
            return false;
          }
          if (selectedIndex == -1) {
            MessageBox.error("Lütfen tablodan veri seçiniz")
            return false;
          }


          let params = {
            I_CASTID: this.getView().byId("idReportTable").getModel().oData.rows[selectedIndex].CAST_ID,
            I_EQUIPMENT: this.getView().byId("idReportTable").getModel().oData.rows[selectedIndex].EQUIPMENT_NUMBER,
            I_OBJECTTYPE: selectedItem
          }

          var response = TransactionCaller.sync(
            "MES/Itelli/Refractory/DataInput/T_GET_DATA_DETAIL",
            params,
            "O_JSON"
          );

          if (response[1] == "E") {
            MessageBox.error(response[0]);
            return;
          }
          if (response[0]?.Rowsets?.Rowset?.Row) {
            var jsData = Array.isArray(response[0]?.Rowsets?.Rowset?.Row)
              ? response[0]?.Rowsets?.Rowset?.Row
              : new Array(response[0]?.Rowsets?.Rowset?.Row);
            this.showDetailFragment(jsData)
          } else {

          }

        },
        showDetailFragment: function (data) {
          let _this = this;
          if (!this._oDialog2) {
            this._oDialog2 = sap.ui.xmlfragment(
              "idDetailFragment",
              "customActivity.fragmentView.refractoryFragmentDetail",
              this
            );

          }

          this.getView().addDependent(this._oDialog2);
          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setSizeLimit(1000);
          oModel.setData(data);

          var oTable = sap.ui.core.Fragment.byId(
            "idDetailFragment",
            "idDetailFragmentTable"
          );

          oTable.setModel(oModel);
          var vl = sap.ui.core.Fragment.byId(
            "idDetailFragment",
            "idfragmentLine"
          );
          var vObjectType = this.getView()
            .byId("idEquipmentObjType")
            .getSelectedKey();
          if (vObjectType == "ZKOKİL") vl.setVisible(true);
          else vl.setVisible(false);

          var v2 = sap.ui.core.Fragment.byId(
            "idDetailFragment",
            "idfragmentQty"
          );
          var v3 = sap.ui.core.Fragment.byId(
            "idDetailFragment",
            "idfragmentUnit"
          );

          if (vObjectType == "ZÇANAK") {
            v2.setVisible(true);
            v2.setVisible(true);
          } else {
            v2.setVisible(false);
            v3.setVisible(false);
          }
          this._oDialog2.open();
        },
        closeFragment2: function () {
          this._oDialog2.close();
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

          return false;
        },
      }
    );
  }
);
