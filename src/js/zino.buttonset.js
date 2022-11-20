/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'buttonset',
		FALSE = false,
		TRUE = true;
	
	function Buttonset() {
		this._state = [];
		this._defaults = {
			
		};
	}
	
	Buttonset.prototype = {
		_attachButtonset: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target),
				id = $target.attr("id"),
				$label = $("label[for='" + id + "']");
			
			$.extend(inst.settings, self._defaults, settings);
			
			$target.addClass("zui-buttonset-hidden");
			
			if ($label.length > 0) {
				
				$label.attr("role", "button").addClass("zui-buttonset");
				
				if ($target.is(":disabled")) {
					$label.attr("aria-disabled", true).addClass("zui-buttonset-disabled");
				} else {
					$label.attr("aria-disabled", false);
				}
				
				if ($target.is(":checked")) {
					$label.attr("aria-pressed", true);
				}
				var $siblings = $label.siblings("label");
				if ($siblings.length > 0) {
					if (!$siblings.first().hasClass("zui-buttonset")) {
						$label.addClass("zui-buttonset-left");
					}
					if ($siblings.last().hasClass("zui-buttonset")) {
						$label.addClass("zui-buttonset-right");
					}
				} else {
					$label.addClass("zui-buttonset-left zui-buttonset-right");
				}
				
				var $parent = $label.parent();
			
				if ($target.is(":radio")) {
					$target.off(".buttonset");
					$target.on("change.buttonset", $target.not(":disabled"), function (e) {
						var $_label = $("label[for='" + $(this).attr("id") + "']");
						$_label.siblings("label").removeAttr("aria-pressed");
						$_label.attr("aria-pressed", true);
					});
				} else if ($target.is(":checkbox")) {
					$target.off(".buttonset");
					$target.on("change.buttonset", $target.not(":disabled"), function (e) {
						var $this = $(this),
							$_label = $("label[for='" + $this.attr("id") + "']");
						if ($this.is(":checked")) {
							$_label.attr("aria-pressed", true);
						} else {
							$_label.removeAttr("aria-pressed", true);
						}
					});
				}
			}
			$.data(target, PROP_NAME, inst);
		},
		_enableButtonset: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.attr("aria-disabled", "false")
				.prop("disabled", false)
				.removeClass("zui-buttonset-disabled")
			;
		},
		_disableButtonset: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.attr("aria-disabled", "true")
				.prop("disabled", true)
				.addClass("zui-buttonset-disabled")
			;
		},
		_destroyButtonset: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				$label = $("label[for='" + $target.attr("id") + "']");
			
			$target.removeClass("zui-buttonset-hidden");
			if ($label.length > 0) {
				$label
					.removeClass("zui-buttonset")
					.removeClass("zui-buttonset-left")
					.removeClass("zui-buttonset-right")
					.removeClass("zui-buttonset-disabled")
					.removeAttr("role")
					.removeAttr("aria-disabled")
					.removeAttr("aria-pressed")
				;
			}
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
				throw 'Missing instance data for this buttonset';
			}
		}
	};

	$.fn.zinoButtonset = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoButtonset['_' + options + 'Buttonset'].apply($.zinoButtonset, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoButtonset['_' + options + 'Buttonset'].apply($.zinoButtonset, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoButtonset['_' + options + 'Buttonset'].apply($.zinoButtonset, [this].concat(otherArgs)) :
				$.zinoButtonset._attachButtonset(this, options);
		});
	};
	
	$.zinoButtonset = new Buttonset();
	$.zinoButtonset.version = "1.5.1";
})(jQuery);