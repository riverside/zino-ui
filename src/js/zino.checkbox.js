/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'checkbox',
		FALSE = false,
		TRUE = true;

	function Checkbox() {
		this._defaults = {
			data: [],
			name: null,
			inline: false,
			toggle: null,
			focus: null,
			blur: null,
			create: null
		};
	}
	
	Checkbox.prototype = {
		_attachCheckbox: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $ul, $li, i, iCnt, id, isChecked,
				$label, $checkbox,
				$target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			
			$target.find("input:checkbox").each(function () {
				$checkbox = $(this).hide();
				
				$label = $checkbox.parentsUntil(target, "label");
				if ($label.length > 0) {
					$label.hide();
				} else {
					$label = $target.find("label[for=" + $checkbox.attr("id") + "]").hide();
				}
				
				inst.settings.data.unshift({
					label: $.trim($label.text()),
					value: this.value,
					checked: this.checked
				});
				inst.settings.name = this.name;
				this.name = "";
			});
			
			$ul = $("<ul>").attr({
				"class": "zui-checkbox" + (inst.settings.inline ? " zui-checkbox-inline" : "")
			}).appendTo($target);
			
			for (i = 0, iCnt = inst.settings.data.length; i < iCnt; i++) {
				id = ["zui-checkbox-", inst.uid, "-", i].join("");
				isChecked = inst.settings.data[i].checked !== undefined && inst.settings.data[i].checked === true;
				$("<li>").attr({
					"role": "checkbox",
					"aria-checked": (isChecked ? "true" : "false"),
					"tabindex": 0,
					"class": (isChecked ? "zui-checkbox-checked" : "zui-checkbox-unchecked"),
					"data-id": id
				}).text(inst.settings.data[i].label).appendTo($ul);
				
				$('<input>').attr({
					'type': 'checkbox',
					'name': inst.settings.data[i].name || inst.settings.name,
					'value': inst.settings.data[i].value,
					'style': 'display:none',
					'id': id
				}).prop("checked", isChecked).appendTo($target);
			}
			
			$target
				.on("click.checkbox", "li", function (e) {
					if (e.ctrlKey || e.altKey || e.shiftKey) {
						return true;
					}
					self._toggleCheckbox.call(self, target, $(this).index());
					e.stopPropagation();
					return false;
				})
				.on("keypress.checkbox", "li", function (e) {
					if (e.altKey || e.shiftKey || e.ctrlKey) {
						return true;
					}
					var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
					switch (key) {
						case 32: //SpaceBar
							e.stopPropagation();
							return false;
							break;
					}
					return true;
				})
				.on("keydown.checkbox", "li", function (e) {
					if (e.altKey || e.shiftKey || e.ctrlKey) {
						return true;
					}
					var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0,
						$this = $(this);
					switch (key) {
						case 32: //SpaceBar
							self._toggleCheckbox.call(self, target, $this.index());
							e.stopPropagation();
							return false;
							break;
					}
					return true;
				})
				.on("focus.checkbox", "li", function (e) {
					var $this = $(this);
					$this.addClass("zui-checkbox-focus");
					$this.removeClass("zui-checkbox-hover");
					return true;
				})
				.on("blur.checkbox", "li", function (e) {
					$(this).removeClass("zui-checkbox-focus");
					return true;
				})
				.on("mouseover.checkbox", "li", function (e) {
					var $this = $(this);
					if ($this.not(".zui-checkbox-focus")) {
						$this.addClass("zui-checkbox-hover");
					}
					e.stopPropagation();
					return false;
				})
				.on("mouseout.checkbox", "li", function (e) {
					$(this).removeClass("zui-checkbox-hover");
					e.stopPropagation();
					return false;
				})
				.bind("checkboxcreate", function (event, ui) {
					if (inst.settings.create !== null) {
						inst.settings.create.call(target, event, ui);
					}
				})
				.bind("checkboxtoggle", function (event, ui) {
					if (inst.settings.toggle !== null) {
						inst.settings.toggle.call(target, event, ui);
					}
				})
				.bind("checkboxfocus", function (event, ui) {
					if (inst.settings.focus !== null) {
						inst.settings.focus.call(target, event, ui);
					}
				})
				.bind("checkboxblur", function (event, ui) {
					if (inst.settings.blur !== null) {
						inst.settings.blur.call(target, event, ui);
					}
				})
			;
			
			$target.trigger("checkboxcreate", {});
			
			$.data(target, PROP_NAME, inst);
		},
		_toggleCheckbox: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				$li = $target.find("li").eq(index);
			
			$target.find("li").removeClass("zui-checkbox-focus");

			if ($li.attr("aria-checked") === "true") {
				$li.attr({
					"aria-checked": "false"
				})
				.removeClass("zui-checkbox-checked")
				.addClass("zui-checkbox-unchecked")
				.addClass("zui-checkbox-focus");
				$target.find("input#" + $li.data("id")).prop("checked", false);
			} else {
				$li.attr({
					"aria-checked": "true"
				})
				.removeClass("zui-checkbox-unchecked")
				.addClass("zui-checkbox-checked")
				.addClass("zui-checkbox-focus");
				$target.find("input#" + $li.data("id")).prop("checked", true);
			}

			$target.trigger("checkboxtoggle", {
				index: index
			});
		},
		_destroyCheckbox: function (target) {
			var inst = this._getInst(target),
				$target = $(target);
			if (!inst) {
				return FALSE;
			}
			$target
				.removeClass("zui-checkbox")
				.off(".checkbox")
				.unbind("checkboxcreate")
				.unbind("checkboxtoggle")
				.unbind("checkboxfocus")
				.unbind("checkboxblur")
				.children()
				.remove();
			
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
				throw 'Missing instance data for this checkbox';
			}
		}
	};

	$.fn.zinoCheckbox = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoCheckbox['_' + options + 'Checkbox'].apply($.zinoCheckbox, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoCheckbox['_' + options + 'Checkbox'].apply($.zinoCheckbox, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoCheckbox['_' + options + 'Checkbox'].apply($.zinoCheckbox, [this].concat(otherArgs)) :
				$.zinoCheckbox._attachCheckbox(this, options);
		});
	};
	
	$.zinoCheckbox = new Checkbox();
	$.zinoCheckbox.version = "1.5";
})(jQuery);