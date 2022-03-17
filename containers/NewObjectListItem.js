sap.ui.define([
  "sap/m/ObjectListItem"
], function(V) {
  "use strict";
  return V.extend("customActivity.containers.NewObjectListItem", {
    metadata: {
      aggregations: {
        statuses: {
          type: "sap.m.ObjectStatus"
        }
      }
    },
    onAfterRendering: function() {
      if (sap.m.ObjectListItem.prototype.onAfterRendering) {
        sap.m.ObjectListItem.prototype.onAfterRendering.apply(this, arguments);
      }

      var oObjectStatus = this.$().find('.sapMLIBContent')[0];

      var content = [];
      this.getStatuses().forEach(function(b) {
	var titleObject = b.$()[0].firstChild;
	b.addStyleClass("smallMarginCustom")
	// titleObject.classList.add("boldWeight"); // .sapMObjStatusTitle class'ına eklendiği için ihtiyaç kalmadı
	// titleObject.classList.add("sapMObjLTitle");
	// titleObject.classList.add("sapMText");
	content.push(b);
      });

	oObjectStatus.classList.add("sapMObjLAttrRow");

      for(var i=0;i<content.length;i++){
          // content[i].$().addClass("sapMObjLStatusDiv");
          oObjectStatus.appendChild(content[i].$()[0]);
      }
    },
    renderer: function(oRM, oControl) { // static function
      sap.m.ObjectListItemRenderer.render(oRM, oControl);
      oControl.getStatuses().forEach(function(b) {
        oRM.renderControl(b);
      });
    }
  });
});