sap.ui.define([
], function (
) {
    "use strict";

    return {
        sync: function (transactionName, params, output, method = "GET") {
            var callURL = this.createURL(transactionName, params, output);
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open(method, callURL, false);
            xmlHttp.send();
            var response = xmlHttp.responseXML;
            return this.messageHandler(response, output);
        },

        messageHandler: function (iv_responseXML, iv_output) {
            var localXML = iv_responseXML;
            var responseObject = [];
            var errNode = localXML.getElementsByTagName("FatalError");
            if (errNode.length > 0) {
                responseObject[0] = localXML
                    .getElementsByTagName("FatalError")[0]
                    .innerHTML.toString();
                responseObject[1] = "E";
            } else {
                try {
                    responseObject[0] = JSON.parse(
                        localXML.getElementsByTagName(iv_output)[0].innerHTML
                    );
                }
                catch {
                    responseObject[0] = localXML.getElementsByTagName(iv_output)[0].innerHTML;
                }
                responseObject[1] = "S";
            }
            return responseObject;
        },

        async: function (
            transactionName,
            params,
            output,
            cbFunction,
            scope,
            method = "GET",
            param
        ) {
            var that = this;
            var callURL = this.createURL(transactionName, params, output);
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open(method, callURL, true);

            xmlHttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        var res = xmlHttp.responseXML;
                        cbFunction(that.messageHandler(res, output), scope, param);
                    } else {
                        cbFunction([null, "E"], scope, param);
                    }
                }
            };
            xmlHttp.send();
        },

        createURL: function (transactionName, params, output) {
            var cURL = "/XMII/Runner?";
            params["Transaction"] = transactionName;
            if (!output.isNaN || output.length() > 0) {
                params["OutputParameter"] = output;
            }
            params["Content-Type"] = "text/xml";

            for (var key in params) {
                var value = params[key];
                cURL = cURL + "&" + key + "=" + value;
            }

            return this.getconfigFile("URL") + cURL;
        },
        readConfigFile: function (path, callback) {

            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, false);
            xhr.send();
            return xhr.responseText

        },
        getconfigFile: function (data) {
            let rs = this.readConfigFile("/XMII/CM/MES/WebContent/customActivity/scripts/config.json", '')
            rs = JSON.parse(rs)
            return rs[data]
        }
    };
});
