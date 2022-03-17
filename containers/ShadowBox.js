sap.ui.define(
    ['sap/ui/core/Control'],
    function(Control) {
     
        return Control.extend("customActivity.containers.ShadowBox",{
            metadata: {
                properties: {
                   /* Business Object properties */
                    title             : {type : "string"},
                    subtitle            : {type : "string"},
                    allowdrag: {type : "string"},
                    mode             : {type : "string"},
                    rate       : {type : "string"},
                    percent             : {type : "string"},
                    background: {
                        type: "sap.ui.core.CSSColor",
                        defaultValue: "#ffffff"
                    }
                },
        events : {
            "press" : {},
	"drag": {}
        },
                aggregations: {
                    content: {
                        type: "sap.ui.core.Control"
                    }
                },
                defaultAggregation: "content",
            },

	onclick : function(evt) {  
		this.firePress();
	},

	ondragstart: function(evt) {
		// evt.preventDefault();
		this.fireDrag(evt);
		// console.log(evt);
	},

            init: function() {
                //initialisation code, in this case, ensure css is imported
                // var libraryPath = jQuery.sap.getModulePath("com.armolis.armi"); //get the server location of the ui library
                // jQuery.sap.includeStyleSheet(libraryPath + "/css/dalrae.css"); //specify the css path relative from the ui folder
            },
         
            renderer: function(oRm,oControl){
		//first up, render a div for the ShadowBox
		// ondragstart='drag(event)'
		var percent = oControl.getPercent();
		if(percent)
			percent = percent.replaceAll(".",",").ToNumber();
		else
			percent = 0;
		oRm.write("<div role='presentation' draggable='" + oControl.getAllowdrag() + "' style='height: 6rem; width: 9rem;'");
		oRm.writeControlData(oControl);

		oRm.addClass("OneByOne");
		oRm.addClass("sapMGT");
		// if(oControl.getAllowdrag())
		oRm.addClass("sapMPointer");
		oRm.addClass("sapUiTinyMarginBegin");
		oRm.addClass("sapUiTinyMarginTop");
		oRm.addClass("tileLayout");
		oRm.addClass("tileLayout-" + oControl.getBackground());
		oRm.writeClasses();
 
		oRm.write(">");

		oRm.write("<div class='sapMGTWithoutImageHoverOverlay'></div>");
		oRm.write("<div class='sapMGTFocusDiv'></div>");
		oRm.write("<div class='OneByOne sapMGTHdrContent' style='margin-left: 0.20rem;margin-right: 0rem;'>");
		oRm.write("<div class='sapMGTHdrTxt'>");
		oRm.write("<span class='sapMGTTitle sapMText sapMTextBreakWord sapMTextMaxWidth sapUiSelectable' style='text-align: left; line-height: 2.375rem;'>");
		oRm.write("<span class='sapMTextLineClamp sapMTextMaxLine' style='-webkit-line-clamp: 2; font-size: 40px;'>%" + percent  + "</span>");
		oRm.write("</span>");
		oRm.write("</div>");
		oRm.write("<div class='' style='font-size: 20px; line-height: 3rem;'>" + oControl.getRate() + "</div>");
		oRm.write("</div>");
		oRm.write("<div class='sapMGTContent'>");
		oRm.write("</div>");

		//next, iterate over the content aggregation, and call the renderer for each control
		$(oControl.getContent()).each(function(){
			oRm.renderControl(this);
		});

		//and obviously, close off our div
		oRm.write("</div>")
            },
         
            onAfterRendering: function(arguments) {
                if(sap.ui.core.Control.prototype.onAfterRendering) {
                 sap.ui.core.Control.prototype.onAfterRendering.apply(this,arguments);
                }
            }

        });
     
    }
);