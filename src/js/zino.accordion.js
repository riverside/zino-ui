/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'accordion',
		FALSE = false,
		TRUE = true;
	
	function Accordion() {
		this._defaults = {
			active: 0,
			collapsible: false,
			header: "h3"
		};
	}
	
	Accordion.prototype = {
		_attachAccordion: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);
			
			$target
				.addClass("zui-accordion")
				.attr("role", "tablist")
				.children(inst.settings.header)
					.bind("click.accordion", function (e) {
						var $this = $(this);
						self._activateAccordion.call(self, target, $this.parent().children(inst.settings.header).index($this));
					})
					.addClass("zui-accordion-title zui-unselectable")
					.attr({
						"aria-expanded": false,
						"aria-selected": false,
						"role": "tab"
					})
					.end()
				.children("div")
					.hide()
					.addClass("zui-accordion-content")
					.attr("role", "tabpanel");
			
			$.data(target, PROP_NAME, inst);
			
			if (inst.settings.active === false && inst.settings.collapsible) {
				
			} else {
				self._activateAccordion.call(self, target, inst.settings.active);
			}
		},
		_activateAccordion: function(target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $this = $(target).children(inst.settings.header).eq(index);
			if ($this.next("div").is(":visible")) {
				if (inst.settings.collapsible) {
					$this
						.attr({
							"aria-selected": false,
							"aria-expanded": false
						})
						.next("div").slideUp();
				}
			} else {
				$(target)
					.children(inst.settings.header)
						.attr({
							"aria-selected": false,
							"aria-expanded": false
						})
						.end()
					.children("div:visible").slideUp();
				
				$this
					.attr({
						"aria-selected": true,
						"aria-expanded": true
					})
					.next("div").slideDown();
			}
		},
		_destroyAccordion: function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.removeClass("zui-accordion")
				.removeAttr("role")
				.children(inst.settings.header)
					.unbind(".accordion")
					.removeClass("zui-accordion-title")
					.removeAttr("aria-expanded")
					.removeAttr("aria-selected")
					.removeAttr("role")
					.end()
				.children("div")
					.removeClass("zui-accordion-content")
					.removeAttr("role")
					.show();
			$.data(target, PROP_NAME, FALSE);
		},
		_optionAccordion: function (target, opt) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (typeof opt === "string") {
				if (arguments[2]) {
					inst.settings[opt] = arguments[2];
				} else {
					return inst.settings[opt];
				}
			} else if (typeof opt === "object") {
				$.extend(inst.settings, opt);
			}
			$.data(target, PROP_NAME, inst);
		},
		_newInst: function(target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 99999999),
				isOpen: FALSE,
				isDisabled: FALSE,
				settings: {}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this accordion';
			}
		}
	};
	
	$.fn.zinoAccordion = function (options) {
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoAccordion['_' + options + 'Accordion'].apply($.zinoAccordion, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoAccordion['_' + options + 'Accordion'].apply($.zinoAccordion, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoAccordion['_' + options + 'Accordion'].apply($.zinoAccordion, [this].concat(otherArgs)) :
				$.zinoAccordion._attachAccordion(this, options);
		});
	};
	$.zinoAccordion = new Accordion();
	$.zinoAccordion.version = "1.5.1";
})(jQuery);