/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'button',
		FALSE = false,
		TRUE = true;

	function Button() {
		this._state = [];
		this._defaults = {
			disabled: false,
			pressed: false,
			enable: null,
			disable: null
		};
	}
	
	Button.prototype = {
		_attachButton: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);
			
			$target
				.addClass("zui-button")
				.attr("role", "button")
				.bind("buttonenable", function (event, ui) {
					if (inst.settings.enable !== null) {
						inst.settings.enable.call(target, event, ui);
					}
				})
				.bind("buttondisable", function (event, ui) {
					if (inst.settings.disable !== null) {
						inst.settings.disable.call(target, event, ui);
					}
				});
			if (inst.settings.disabled) {
				$target.attr("aria-disabled", true);
			} else {
				$target.attr("aria-disabled", false);
			}
			if (inst.settings.pressed) {
				$target.attr("aria-pressed", true);
			} 
			$.data(target, PROP_NAME, inst);
		},
		_enableButton: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.attr("aria-disabled", "false")
				.prop("disabled", false)
				.removeClass("zui-button-disabled")
				.trigger("buttonenable", {})
			;
		},
		_disableButton: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.attr("aria-disabled", "true")
				.prop("disabled", true)
				.addClass("zui-button-disabled")
				.trigger("buttondisable", {})
			;
		},
		_destroyButton: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.removeClass("zui-button")
				.removeAttr("role")
				.removeAttr("aria-disabled")
				.removeAttr("aria-pressed")
			;
			$.data(target, PROP_NAME, FALSE);
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
				throw 'Missing instance data for this button';
			}
		}
	};

	$.fn.zinoButton = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoButton['_' + options + 'Button'].apply($.zinoButton, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoButton['_' + options + 'Button'].apply($.zinoButton, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoButton['_' + options + 'Button'].apply($.zinoButton, [this].concat(otherArgs)) :
				$.zinoButton._attachButton(this, options);
		});
	};
	
	$.zinoButton = new Button();
	$.zinoButton.version = "1.5";
})(jQuery);