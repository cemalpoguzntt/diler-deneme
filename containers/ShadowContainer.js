sap.ui.define(
    ['sap/ui/core/Control'],
    function(Control) {
     
        return Control.extend("customActivity.containers.ShadowContainer",{
            metadata: {
                properties: {
		title: {type : "string"},
		subtitle: {type : "string"},
                     mode : {type : "string"},
                     time : {type : "string"},
                    width: {
                        type: "sap.ui.core.CSSSize", //this is optional, but it helps prevent errors in your code by enforcing a type
                        defaultValue: "auto" //this is also optional, but recommended, as it prevents your properties being null
                    },
                    height: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "auto"
                    },
                    background: {
                        type: "sap.ui.core.CSSColor",
                        defaultValue: "#ffffff"
                    },
                    margin: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "5px"
                    }
                },
        events : {
            "press" : {},
	"drop": {}
        },
	aggregations: {
		content: {
			type: "sap.ui.core.Control"
		},
		items : {
			type : "com.armolis.armi.containers.ShadowBox",
			multiple : true
		}
	},
                defaultAggregation: "items",
            },

	onclick : function(evt) {  
		if(evt.target.classList.contains("inset-text-effect"))
			this.firePress();
	},

	ondrop: function(evt){
		this.fireDrop(evt);
	},

	ondragover: function(ev) {
	    ev.preventDefault();
	},

            init: function() {
                //initialisation code, in this case, ensure css is imported
                var libraryPath = jQuery.sap.getModulePath("com.armolis.armi"); //get the server location of the ui library
                jQuery.sap.includeStyleSheet(libraryPath + "/css/dalrae.css"); //specify the css path relative from the ui folder
            },
         
            renderer: function(oRm,oControl){
                //first up, render a div for the ShadowContainer
		// ondrop='drop(event)'
		// ondragover='allowDrop(event)'
		oRm.write("<div ");
		oRm.addClass("dalrShadowContainer");
		if(oControl.getMode() == "left2right" || oControl.getMode() == "single")
			oRm.addClass("horizontalContainer");
		oRm.addClass("sapUiLargeMarginBegin");
		oRm.addClass("sapUiTinyMarginTop");
		oRm.writeClasses();

		/* oRm.write("style='width: auto; height: auto; background-color: #ffffff; margin: 5px'"); */

                //render width & height & background properties
                oRm.write(" style=\"width: " + oControl.getWidth()
                                + "; height: " + oControl.getHeight()
                                + "; background-color: " + oControl.getBackground()
                                + "; margin: " + oControl.getMargin()
                                + "\"");                //render width & height & background properties
             
                //next, render the control information, this handles your sId (you must do this for your control to be properly tracked by ui5).

		oRm.writeControlData(oControl);
		oRm.write(">");

		if(oControl.getMode() != "left2right" && oControl.getMode() != "single")
			oRm.write("<p align=\"center\" class=\"inset-text-effect sapMPointer\">" + oControl.getTitle() + "</p>");
		else {
			oRm.write("<div style='height: 6rem; width: 9rem;'");
			oRm.addClass("OneByOne");
			oRm.addClass("inset-text-effect-2");
			oRm.addClass("sapMGT");
			oRm.addClass("tileLayout");
			if(oControl.getMode() == "single")
				oRm.addClass("single");
			oRm.writeClasses();
			oRm.write(">");

			oRm.write("<div class='sapMGTWithoutImageHoverOverlay'>");
			oRm.write("</div>");
			oRm.write("<div class='sapMGTFocusDiv'>");
			oRm.write("</div>");
			oRm.write("<div class='sapMGTContent'>");
			oRm.write("<div class='Loaded sapMNCValue' style='margin-left: 8px;'>");
			oRm.write("<div class='sapMNCValueScr' style='font-size: 24px; text-align: left;'>" + oControl.getTitle() + "</div>");
			if(oControl.getTime())
				oRm.write("<div class='sapMNCValueScr' style='font-size: 24px; text-align: left;'>" + oControl.getTime() + "</div>");
			oRm.write("</div>");
			oRm.write("</div>");
			oRm.write("</div>");
		}
		/* oRm.write("</div>");*/

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