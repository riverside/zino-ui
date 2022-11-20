/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'combobox',
		FALSE = false,
		TRUE = true;

	function Combobox() {
		this._defaults = {
			autocomplete: false,
			dataSource: null,
			multiple: false
		};
		this._events = {
			change: null,
			close: null,
			open: null,
			select: null
		};
	}
	
	Combobox.prototype = {
		_attachCombobox: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $div, $ul, $trigger, $wrapper,
				$target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, self._events, settings);
			
			$target
				.attr({
					"role": "combobox",
					"aria-expanded": "false",
					"aria-autocomplete": "list",
					"aria-owns": "zui-combobox-listbox-" + inst.uid,
					"aria-activedescendant": ""
				})
				.addClass("zui-combobox zui-combobox-combo")
				.wrap('<div class="zui-combobox-wrapper zui-unselectable" />')
				.bind("comboboxopen", function (event, ui) {
					if (inst.settings.open !== null) {
						inst.settings.open.call(target, event, ui);
					}
				})
				.bind("comboboxselect", function (event, ui) {
					if (inst.settings.select !== null) {
						inst.settings.select.call(target, event, ui);
					}
				})
				.bind("comboboxchange", function (event, ui) {
					if (inst.settings.change !== null) {
						inst.settings.change.call(target, event, ui);
					}
				})
				.bind("comboboxclose", function (event, ui) {
					if (inst.settings.close !== null) {
						inst.settings.close.call(target, event, ui);
					}
				});
			
			var width = $target.width() + 26,
				pos = $target.parent().offset();
			
			$wrapper = $target.parent();
			$wrapper.css("width", width + "px");
			
			$div = $("<div>", {
				"id": "zui-combobox-" + inst.uid
			}).hide().css({
				"position": "absolute",
				"top": (pos.top + $wrapper.height() + 1) + "px",
				"left": pos.left + "px",
				"width": width + "px"
			});
			$ul = $("<ul>", {
				"role": "listbox",
				"id": "zui-combobox-listbox-" + inst.uid
			}).addClass("zui-combobox-list zui-unselectable");
			
			inst.settings.dataSource.load(function (data) {
				for (var i = 0, len = data.length; i < len; i++) {
					if (typeof this.opts.fields[0] === "object") {
						$("<li>", {
							"role": "option",
							"id": ["zui-combobox-option-", inst.uid, "-", i].join("")
						}).addClass("zui-combobox-item").text(data[i][this.opts.fields[0].name]).appendTo($ul);
					} else {
						$("<li>", {
							"role": "option",
							"id": ["zui-combobox-option-", inst.uid, "-", i].join("")
						}).addClass("zui-combobox-item").text(data[i][this.opts.fields[0]]).appendTo($ul);
					}
				}
			});
			
			$trigger = $("<span>")
				.addClass("zui-combobox-trigger zui-unselectable")
				.bind("click.combobox", function () {
					if ($div.is(":visible")) {
						self._closeCombobox.call(self, target);
					} else {
						self._openCombobox.call(self, target);
					}
				})
				.append("<span />")
				.appendTo($target.parent());
			
			$ul.on("mouseover.combobox", ".zui-combobox-item", function () {
				$(this).addClass("zui-combobox-item-hover");
			}).on("mouseout.combobox", ".zui-combobox-item", function () {
				$(this).removeClass("zui-combobox-item-hover");
			}).on("click.combobox", ".zui-combobox-item", function () {
				var $this = $(this);
				if (!inst.settings.multiple) {
					self._selectCombobox.call(self, target, $this.index());
					self._closeCombobox.call(self, target);
				} else {
					var v = $target.val(),
						t = $this.text(),
						stack = $target.data("stack");
					if (stack === undefined) {
						$target.data("stack", [t]);
						$target.val(t).focus();
					} else {
						var index = $.inArray(t, stack);
						if (index === -1) {
							stack.push(t);
							$target.data("stack", stack).val(stack.join(", ")).focus();
						} else {
							stack.splice(index, 1);
							$target.data("stack", stack).val(stack.join(", ")).focus();
						}
					}
				}
				//$this.toggleClass("zui-combobox-item-selected");
			});
			
			if (inst.settings.autocomplete) {
				$wrapper.on("keyup.combobox", $target, function () {
					var term = $target.val();
					if (term.length > 0) {
						$("li", $ul).show().not("li:contains('" + term + "')").hide();
					} else {
						$("li", $ul).show();
					}
					if (!$div.is(":visible")) {
						self._openCombobox.call(self, target);
					}
				});
			}
			
			$ul.appendTo($div);
			$div.appendTo(document.body);
			
			$(window).off(".combobox").on("mousedown.combobox", document.body, function (e) {
				var $eTarget = $(e.target);
				if (!$eTarget.hasClass("zui-combobox-item") 
						&& !$eTarget.hasClass("zui-combobox-trigger") 
						&& !$eTarget.hasClass("zui-combobox") 
						&& !$eTarget.hasClass("zui-combobox-wrapper") 
						&& !$eTarget.hasClass("zui-combobox-list")) {
					e.stopPropagation();
					$(".zui-combobox").zinoCombobox("close");
				} else {
					//$(".zui-combobox").not( "#" + $(target).attr("id") ).zinoCombobox("close");
				}
			});
			
			inst.list = $ul;
			inst.container = $div;
			$.data(target, PROP_NAME, inst);
		},
		_openCombobox: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (!inst.container.is(":visible")) {
				inst.container.show();
				$(target).attr("aria-expanded", "true").trigger("comboboxopen", {
					
				});
			}
		},
		_selectCombobox: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $el;
			if ($.isNumeric(index)) {
				$el = $("li", inst.list).eq(index);
			} else if (index instanceof jQuery) {
				$el = index;
			}
			$el.siblings("li")
				.removeClass("zui-combobox-item-selected").end()
				.addClass("zui-combobox-item-selected");
			
			$(target)
				.trigger("comboboxselect", {
					index: index,
					item: $el
				})
				.attr("aria-activedescendant", ["zui-combobox-option-", inst.uid, "-", $el.index()].join(""))
				.val($el.text())
				.focus()
				.trigger("comboboxchange", {
					index: index,
					item: $el
				});
		},
		_closeCombobox: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (inst.container.is(":visible")) {
				inst.container.hide();
				$(target).attr("aria-expanded", "false").trigger("comboboxclose", {
					
				});
			}
		},
		_newInst: function (target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 99999999),
				isDisabled: FALSE,
				settings: {}
			}; 
		},
		_getInst: function (target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this combobox';
			}
		}
	};

	$.fn.zinoCombobox = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoCombobox['_' + options + 'Combobox'].apply($.zinoCombobox, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoCombobox['_' + options + 'Combobox'].apply($.zinoCombobox, [this[0]].concat(otherArgs));
		}
		
		return this.each (function () {
			typeof options == 'string' ?
				$.zinoCombobox['_' + options + 'Combobox'].apply($.zinoCombobox, [this].concat(otherArgs)) :
				$.zinoCombobox._attachCombobox(this, options);
		});
	};
	
	$.zinoCombobox = new Combobox();
	$.zinoCombobox.version = "1.5.1";
})(jQuery);