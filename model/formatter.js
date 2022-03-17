// formatter.js
 
sap.ui.define([], function () {
  "use strict";
 
  return {
 
    // formatter method contains the formatting logic
    // parameter iInteger gets passed from the view ...
    // ... that uses the formatter
    packingColumnVisible: function(isVisible) {
	      var result = false;       
	      if (isVisible == 1) { // iInteger is 0
	        result = true;      
	      }
	      // return sReturn to the view
	      return result;    
    },

     
  };
 
});