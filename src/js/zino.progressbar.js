/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'progressbar',
		FALSE = false,
		TRUE = true;

	function Progressbar() {
		this._defaults = {
			create: null,
			change: null,
			complete: null,
			enable: null,
			disable: null
		};
	}
	
	Progressbar.prototype = {
		_attachProgressbar: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $div,
				$target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);
			/*if (settings.value !== undefined) {
				inst.value = settings.value;
			}*/
			
			$target
				.addClass("zui-progressbar")
				.attr({
					role: "progressbar",
					"aria-valuemin": inst.min,
					"aria-valuemax": inst.settings.max,
					"aria-valuenow": inst.settings.value
				})
				.css({
					"height": inst.settings.height + "px",
					"width": inst.settings.width + "px"
				})
				.bind("progressbarcreate", function (event, ui) {
					if (inst.settings.create !== null) {
						inst.settings.create.call(target, event, ui);
					}
				})
				.bind("progressbarchange", function (event, ui) {
					if (inst.settings.change !== null) {
						inst.settings.change.call(target, event, ui);
					}
				})
				.bind("progressbarcomplete", function (event, ui) {
					if (inst.settings.complete !== null) {
						inst.settings.complete.call(target, event, ui);
					}
				})
				.bind("progressbarenable", function (event, ui) {
					if (inst.settings.enable !== null) {
						inst.settings.enable.call(target, event, ui);
					}
				})
				.bind("progressbardisable", function (event, ui) {
					if (inst.settings.disable !== null) {
						inst.settings.disable.call(target, event, ui);
					}
				})
			;
			
			var $div = $("<div>").addClass("zui-progressbar-handle");
			
			if (inst.settings.vertical) {
				$target.addClass("zui-progressbar-vertical");
				$div.css("height", inst.settings.value + "%");
			} else {
				$div.css("width", inst.settings.value + "%");
			}
			
			$div.appendTo(target)
			
			$target.trigger("progressbarcreate", {
				max: inst.settings.max,
				value: inst.settings.value
			});
			
			$.data(target, PROP_NAME, inst);
		},
		_disableProgressbar: function (target) {
			$(target)
				.attr("aria-disabled", "true")
				.addClass("zui-progressbar-disabled")
				.trigger("progressbardisable", {});
		},
		_enableProgressbar: function (target) {
			$(target)
				.attr("aria-disabled", "false")
				.removeClass("zui-progressbar-disabled")
				.trigger("progressbarenable", {});
		},
		_destroyProgressbar: function (target) {
			$(target)
				.removeClass("zui-progressbar")
				.removeAttr("role")
				.removeAttr("aria-valuemin")
				.removeAttr("aria-valuemax")
				.removeAttr("aria-valuenow")
				.removeAttr("aria-disabled")
				.find(".zui-progressbar-handle")
				.remove();
			$.data(target, PROP_NAME, FALSE);
		},
		_optionProgressbar: function (target, name, value) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (name === 'value') {
				return this._valueProgressbar.call(this, target, value);
			} else {
				inst.settings[name] = value;
			}
			$.data(target, PROP_NAME, inst);
		},
		_valueProgressbar: function (target, value) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			// Getter
			if (value === undefined) {
				return inst.settings.value;
			}
			// Setter
			if (typeof value !== "number") {
				value = 0;
			}
			inst.settings.value = value;
			if (value < inst.min) {
				inst.settings.value = inst.min;
			}
			if (value > inst.settings.max) {
				inst.settings.value = inst.settings.max;
			}
			var cssObj = {};
			if (inst.settings.vertical) {
				cssObj.height = Math.ceil((inst.settings.value / inst.settings.max) * 100) + "%";
			} else {
				cssObj.width = Math.ceil((inst.settings.value / inst.settings.max) * 100) + "%";
			}
			var $target = $(target);
			$target
				.attr("aria-valuenow", inst.settings.value)
				.find(".zui-progressbar-handle")
					.css(cssObj)
					.end()
				.trigger("progressbarchange", {
					max: inst.settings.max,
					value: inst.settings.value
				});
			
			if (inst.settings.value === inst.settings.max) {
				$target.trigger("progressbarcomplete", {
					max: inst.settings.max,
					value: inst.settings.value
				});
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
				min: 0,
				settings: {
					max: 100,
					value: 0,
					width: 320,
					height: 20,
					vertical: false
				}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this progressbar';
			}
		}
	};

	$.fn.zinoProgressbar = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoProgressbar['_' + options + 'Progressbar'].apply($.zinoProgressbar, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoProgressbar['_' + options + 'Progressbar'].apply($.zinoProgressbar, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoProgressbar['_' + options + 'Progressbar'].apply($.zinoProgressbar, [this].concat(otherArgs)) :
				$.zinoProgressbar._attachProgressbar(this, options);
		});
	};
	
	$.zinoProgressbar = new Progressbar();
	$.zinoProgressbar.version = "1.5";
})(jQuery);