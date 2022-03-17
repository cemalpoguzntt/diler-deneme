sap.ui.define([], function () {
    "use strict";
    return {
        statusFormatter: function (data) {
            if (data && data.trim().length) {
                switch (data) {
                    case "01":
                        this.toggleStyleClass("color-01");
                        break;
                    case "02":
                        this.toggleStyleClass("color-02");
                        break;
                    default:
                        break;
                }
            }
        }
    }
}, /*export*/true);