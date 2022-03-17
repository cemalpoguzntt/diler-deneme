sap.ui.define(
	['sap/m/Input'],
	function (Input) {
		var CustomInput = Input.extend("customActivity.controls.Input", {
			metadata: {
				aggregations: {
					attributes: 'sap.ui.core.CustomData'
				}
			},
			renderer: {},
			onAfterRendering: function () {
				if (sap.m.Input.prototype.onAfterRendering) {
					sap.m.Input.prototype.onAfterRendering.apply(this, arguments);
				}
				var input = this.$().find('INPUT');
				this.getAttributes().forEach(function (attr) {
					input.attr(attr.getKey(), attr.getValue());
				});
			}
		});
		return CustomInput;
	}
);