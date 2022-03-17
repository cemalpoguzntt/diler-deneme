sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"customActivity/scripts/custom",
		"../model/formatter",
		"customActivity/scripts/customStyle",
	],

	function (
		Controller,
		JSONModel,
		MessageBox,
		customScript,
		formatter,
		customStyle
	) {
		//"use strict";
		var that;

		return Controller.extend("customActivity.controller.oeeBilletYieldReport", {
			/**
			 * Called when a controller is instantiated and its View controls (if available) are already created.
			 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
			 */

			formatter: formatter,

			onInit: function () {
				this.appComponent = this.getView().getViewData().appComponent;
				this.appData = this.appComponent.getAppGlobalData();
				this.appData.intervalState = true;
				this.interfaces = this.appComponent.getODataInterface();
				this.getHtml();
				that=this;
			},

			getHtml:function(){
				let url = '/XMII/CM/MES/WebContent/SSCE/YieldReport.html';
				//var html = this.httpGet(url);
				this.makeRequest('GET', url, this.callBackFn, this);
			},

 makeRequest:function (method, url, done, p_this) {
  var xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.onload = function () {
    done(null, xhr.response, p_this);
  };
  xhr.onerror = function () {
    done(xhr.response,null, p_this);
  };
  xhr.send();
},


		callBackFn: function (err, html, p_this) {
			  if (err) { throw err; }
				let sHtml = p_this.htmlEntities(html);
				p_this.getView().byId('idHtml').setContent(html);
		},


htmlEntities: function(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
},

		 httpGet:function(theUrl)
		        {
		            if (window.XMLHttpRequest)
		            {// code for IE7+, Firefox, Chrome, Opera, Safari
    		            xmlhttp=new XMLHttpRequest();
    		        }
   		         else
 		           {// code for IE6, IE5
  		              xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
 		           }
 		           xmlhttp.onreadystatechange=function()
  		          {
 		               if (xmlhttp.readyState==4 && xmlhttp.status==200)
 		               {
   		                 return xmlhttp.responseText;
  		              }
		            }
  		          xmlhttp.open("GET", theUrl, false );
 		           xmlhttp.send();    
  		      },

			onPressRefresh: function () {
				this.getHtml();
			},

			onExit: function () {
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
		});
	}
);