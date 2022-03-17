sap.ui.define(
    ['sap/ui/core/Control'],
    function(Control) {
     
        return Control.extend("customActivity.containers.ShadowBoard",{
            metadata: {
                properties: {
                    width: {
                        type: "sap.ui.core.CSSSize", //this is optional, but it helps prevent errors in your code by enforcing a type
                        defaultValue: "auto" //this is also optional, but recommended, as it prevents your properties being null
                    },
                    height: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "auto"
                    },
                    margin: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "5px"
                    }
                },
	aggregations: {
		content: {
			type: "sap.ui.core.Control"
		},
		items : {
			type : "com.armolis.armi.containers.ShadowContainer",
			multiple : true
		}
	},
                defaultAggregation: "items",
            },

            init: function() {
                //initialisation code, in this case, ensure css is imported
            },
         
            renderer: function(oRm,oControl){
                //first up, render a div for the ShadowBoard
		oRm.write("<div ");

                //render width & height & background properties
                oRm.write(" style=\"width: " + oControl.getWidth()
                                + "; height: " + oControl.getHeight()
                                + "; margin: " + oControl.getMargin()
                                + "\"");                //render width & height & background properties
             
                //next, render the control information, this handles your sId (you must do this for your control to be properly tracked by ui5).

		oRm.writeControlData(oControl);
		oRm.write(">");

		var items = oControl.getItems();
		items.forEach(function(item) {oRm.renderControl(item);});
		//and obviously, close off our div
		oRm.write("</div>");
            },

            onAfterRendering: function(arguments) {
                if(sap.ui.core.Control.prototype.onAfterRendering) {
                 sap.ui.core.Control.prototype.onAfterRendering.apply(this,arguments);
                }
            },
         
        });
     
    }
);