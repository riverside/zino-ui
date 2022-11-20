/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'spinner',
		FALSE = false,
		TRUE = true;

	function Spinner() {
		this._defaults = {
			min: 0, // Numeric
			max: 100, // Numeric
			step: 1, // Numeric
			align: 'right', // String left|right
			disabled: false, // Boolean true|false
			decimals: 2, // Mixed false|number,
			create: null, //callback
			change: null //callback
		};
	}
	
	Spinner.prototype = {
		_attachSpinner: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $holder, $handle, $up, $down,
				$target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			
			$holder = $("<span>").addClass("zui-spinner zui-spinner-holder").attr("aria-disabled", inst.settings.disabled);
			$handle = $("<span>").addClass("zui-spinner-handle");
			$up = $("<span>", {
					"title": "Increase value",
					"unselectable": "on",
					"role": "button",
					"aria-disabled": inst.settings.disabled
				})
				.addClass("zui-spinner-up zui-unselectable")
				.append("<span>")
				.bind("click.spinner", function () {
					self._increaseSpinner.call(self, target);
				})
				.bind("mouseenter.spinner", function () {
					$(this).addClass("zui-spinner-up-hover");
				})
				.bind("mouseleave.spinner", function () {
					$(this).removeClass("zui-spinner-up-hover");
				})
				.bind("mousedown.spinner", function () {
					$(this).addClass("zui-spinner-up-click");
				})
				.bind("mouseup.spinner", function () {
					$(this).removeClass("zui-spinner-up-click");
				})
				.appendTo($handle);
			$down = $("<span>", {
					"title": "Decrease value",
					"unselectable": "on",
					"role": "button",
					"aria-disabled": inst.settings.disabled
				})
				.addClass("zui-spinner-down zui-unselectable")
				.append("<span>")
				.bind("click.spinner", function () {
					self._decreaseSpinner.call(self, target);
				})
				.bind("mouseenter.spinner", function () {
					$(this).addClass("zui-spinner-down-hover");
				})
				.bind("mouseleave.spinner", function () {
					$(this).removeClass("zui-spinner-down-hover");
				})
				.bind("mousedown.spinner", function () {
					$(this).addClass("zui-spinner-down-click");
				})
				.bind("mouseup.spinner", function () {
					$(this).removeClass("zui-spinner-down-click");
				})
				.appendTo($handle);

			$target
				.attr({
					"autocomplete": "off",
					"role": "spinbutton",
					"aria-invalid": "false",
					"aria-valuemin": inst.settings.min,
					"aria-valuemax": inst.settings.max,
					"aria-valuenow": 0
				})
				.addClass("zui-spinner-input")
				.bind("keydown.spinner", function (e) {
					var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
					//console.log(key, e.target.value);
					// digits: 48-57, 96-105
					// full stop: 46(keypress) 110 and 190 (keydown)
					// backspace: 8
					// arrows (left, up, right, down): 37, 38, 39, 40
					// end, home: 35, 36
					if (key === 38) {
						self._increaseSpinner.call(self, target);
						return false;
					} else if (key === 40) {
						self._decreaseSpinner.call(self, target);
						return false;
					}
					if (!/^(4[8-9]|5[0-7]|110|190|8|3[5-9]|40|9[6-9]|10[0-5])$/.test(key)) {
						return false;
					}
					if (/^(110|190)$/.test(key) && e.target.value.indexOf(".") !== -1) {
						return false;
					}
				})
				.bind("focusin.spinner", function (e) {
					$(this).parent().addClass("zui-spinner-focus");
				})
				.bind("focusout.spinner", function (e) {
					$(this).parent().removeClass("zui-spinner-focus");
					self._valueSpinner.call(self, target, $(target).val());
				})
				/*.bind("keyup.spinner", function (e) {
					var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
					//console.log(key);
					if (/^(4[8-9]|5[0-7])$/.test(key)) {
						console.log(String.fromCharCode(key));
						self._valueSpinner.call(self, target, $(target).val() + String.fromCharCode(key));
					}
					if (/^(9[6-9]|10[0-5])$/.test(key)) {
						self._valueSpinner.call(self, target, String.fromCharCode(key-48));
					}
				})*/;
			if (inst.settings.disabled) {
				$holder.addClass("zui-spinner-disabled");
				$target.prop("disabled", true);
				$up.addClass("zui-spinner-disabled");
				$down.addClass("zui-spinner-disabled");
			}
			$holder.css("width", ($target.width() + 25) + "px");
			
			$holder
				.bind("spinnercreate", function (event, ui) {
					if (inst.settings.create !== null) {
						inst.settings.create.call(target, event, ui);
					}
				})
				.bind("spinnerchange", function (event, ui) {
					if (inst.settings.change !== null) {
						inst.settings.change.call(target, event, ui);
					}
				})
			;
			
			$target.after($holder);
			$holder.append($target).append($handle);
			
			inst.holder = $holder.get(0);
			inst.handle = $handle.get(0);
			$.data(target, PROP_NAME, inst);
			
			if ($target.val().length === 0) {
				self._valueSpinner.call(self, target, inst.settings.min);
			}
			
			$holder.trigger("spinnercreate", {
				min: inst.settings.min,
				max: inst.settings.max,
				step: inst.settings.step
			});
		},
		_decreaseSpinner: function (target) {
			var inst = this._getInst(target);
			if (!inst || inst.settings.disabled) {
				return FALSE;
			}
			var before = parseFloat(inst.input.val()),
				after = before - inst.settings.step;
			if (after >= inst.settings.min) {
				this._valueSpinner.call(this, target, after);
				
				$(inst.holder).trigger("spinnerchange", {
					before: before,
					after: after,
					min: inst.settings.min,
					max: inst.settings.max,
					step: inst.settings.step
				});
			}
		},
		_increaseSpinner: function (target) {
			var inst = this._getInst(target);
			if (!inst || inst.settings.disabled) {
				return FALSE;
			}
			var before = parseFloat(inst.input.val()),
				after = before + inst.settings.step;

			if (after > inst.settings.max) {
				after = inst.settings.max;
			}
			
			this._valueSpinner.call(this, target, after);
			
			$(inst.holder).trigger("spinnerchange", {
				before: before,
				after: after,
				min: inst.settings.min,
				max: inst.settings.max,
				step: inst.settings.step
			});
		},
		_enableSpinner: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target).prop("disabled", false);
			$(inst.holder).attr("aria-disabled", "false").removeClass("zui-spinner-disabled");
			$(".zui-spinner-up, .zui-spinner-down", inst.holder).attr("aria-disabled", "false").removeClass("zui-spinner-disabled");
			inst.settings.disabled = FALSE;
			$.data(target, PROP_NAME, inst);
		},
		_disableSpinner: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target).prop("disabled", true);
			$(inst.holder).attr("aria-disabled", "true").addClass("zui-spinner-disabled");
			$(".zui-spinner-up, .zui-spinner-down", inst.holder).attr("aria-disabled", "true").addClass("zui-spinner-disabled");
			inst.settings.disabled = TRUE;
			$.data(target, PROP_NAME, inst);
		},
		_destroySpinner: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $holder = $(inst.holder),
				$handle = $(inst.handle),
				$target = $(target);
			
			$target.insertAfter($holder);
			$holder.remove();
			
			$target
				.removeAttr("aria-valuemin")
				.removeAttr("aria-valuemax")
				.removeAttr("aria-valuenow")
				.removeAttr("aria-invalid")
				.removeAttr("aria-disabled")
				.removeAttr("role")
				.removeAttr("autocomplete")
				.removeClass("zui-spinner-input")
				.unbind(".spinner")
			;
			
			$.data(target, PROP_NAME, FALSE);
		},
		_valueSpinner: function (target, value) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var vn = parseFloat(value).toFixed(inst.settings.decimals);
			inst.input.val(vn);
			inst.input.attr("aria-valuenow", vn);
			if (vn < inst.settings.min || vn > inst.settings.max) {
				inst.input.attr("aria-invalid", "true");
			} else {
				inst.input.attr("aria-invalid", "false");
			}
			$.data(target, PROP_NAME, inst);
		},
		_newInst: function(target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 99999999),
				isDisabled: FALSE,
				settings: {}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this spinner';
			}
		}
	};

	$.fn.zinoSpinner = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoSpinner['_' + options + 'Spinner'].apply($.zinoSpinner, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoSpinner['_' + options + 'Spinner'].apply($.zinoSpinner, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoSpinner['_' + options + 'Spinner'].apply($.zinoSpinner, [this].concat(otherArgs)) :
				$.zinoSpinner._attachSpinner(this, options);
		});
	};
	
	$.zinoSpinner = new Spinner();
	$.zinoSpinner.version = "1.5.1";
})(jQuery);