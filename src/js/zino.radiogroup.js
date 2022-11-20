/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'radiogroup',
		FALSE = false,
		TRUE = true;

	function Radiogroup() {
		this._defaults = {
			data: [],
			name: "radio",
			inline: false,
			select: null,
			focus: null,
			blur: null,
			create: null
		};
		this.check = true;
	}
	
	Radiogroup.prototype = {
		_attachRadiogroup: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $ul, $li, i, iCnt, id, isChecked,
				$label, $radio,
				$target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			
			$target.find("input:radio").each(function () {
				$radio = $(this).hide();
				
				$label = $radio.parentsUntil(target, "label");
				if ($label.length > 0) {
					$label.hide();
				} else {
					$label = $target.find("label[for=" + $radio.attr("id") + "]").hide();
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
				"role": "radiogroup",
				"class": "zui-radiogroup" + (inst.settings.inline ? " zui-radiogroup-inline" : "")
			}).appendTo($target);
			
			for (i = 0, iCnt = inst.settings.data.length; i < iCnt; i++) {
				id = ["zui-radio-", inst.uid, "-", i].join("");
				isChecked = inst.settings.data[i].checked !== undefined && inst.settings.data[i].checked === true;
				$("<li>").attr({
					"role": "radio",
					"aria-checked": (isChecked ? "true" : "false"),
					"tabindex": (isChecked ? 0 : -1),
					"class": (isChecked ? "zui-radiogroup-checked" : "zui-radiogroup-unchecked"),
					"data-id": id
				}).text(inst.settings.data[i].label).appendTo($ul);
				
				$('<input>').attr({
					'type': 'radio',
					'name': inst.settings.name,
					'value': inst.settings.data[i].value,
					'style': 'display:none',
					'id': id
				}).prop("checked", isChecked).appendTo($target);
			}
			
			$target
				.on("click.radiogroup", "li", function (e) {
					if (e.ctrlKey || e.altKey || e.shiftKey) {
						return true;
					}
					e.stopPropagation();
					return false;
				})
				.on("keypress.radiogroup", "li", function (e) {
					if (e.altKey) {
						return true;
					}
					var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
					switch (key) {
						case 13: //Enter
						case 32: //SpaceBar
							if (e.shiftKey || e.ctrlKey) {
								return true;
							}
							break;
						case 37: //Arrow Left
					    case 38: //Arrow Up
					    case 39: //Arrow Right
					    case 40: //Arrow Down
					    	if (e.shiftKey) {
					    		return true;
					    	}
					    	e.stopPropagation();
					    	return false;
					    	break;
					}
					return true;
				})
				.on("keydown.radiogroup", "li", function (e) {
					if (e.altKey) {
						return true;
					}
					var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0,
						$this = $(this);
					switch (key) {
						case 37: //Arrow Left
						case 38: //Arrow Up
							if (e.shiftKey) {
								return true;
							}
							var $prev = $this.prev();
							if ($this.index() == 0) {
								$prev = $target.find("li").last();
							}
							if (e.ctrlKey) {
								self.check = false;
							}
							$prev[0].focus();
							e.stopPropagation();
							return false;							
							break;
						case 39: //Arrow Right
						case 40: //Arrow Down
							if (e.shiftKey) {
								return true;
							}
							var $next = $this.next(),
								$li = $target.find("li");
							if ($this.index() == $li.length - 1) {
								$next = $li.first();
							}
							if (e.ctrlKey) {
								self.check = false;
							}
							$next[0].focus();
							e.stopPropagation();
							return false;
							break;
						case 13: //Enter
						case 32: //SpaceBar
							if (e.ctrlkey || e.shiftKey) {
								return true;
							}
							var index = $this.index();
							self._selectRadiogroup.call(self, target, index);
							e.stopPropagation();
							return false;
							break;
					}
				})
				.on("focus.radiogroup", "li", function (e) {
					self._selectRadiogroup.call(self, target, $(this).index());
					$target.trigger("radiogroupfocus", {
						
					});
					return true;
				})
				.on("blur.radiogroup", "li", function (e) {
					$(this).removeClass("zui-radiogroup-selected");
					$target.trigger("radiogroupblur", {
						
					});
					return true;
				})
				.bind("radiogroupcreate", function (event, ui) {
					if (inst.settings.create !== null) {
						inst.settings.create.call(target, event, ui);
					}
				})
				.bind("radiogroupselect", function (event, ui) {
					if (inst.settings.select !== null) {
						inst.settings.select.call(target, event, ui);
					}
				})
				.bind("radiogroupfocus", function (event, ui) {
					if (inst.settings.focus !== null) {
						inst.settings.focus.call(target, event, ui);
					}
				})
				.bind("radiogroupblur", function (event, ui) {
					if (inst.settings.blur !== null) {
						inst.settings.blur.call(target, event, ui);
					}
				})
			;
			
			$target.trigger("radiogroupcreate", {});
			
			$.data(target, PROP_NAME, inst);
		},
		_selectRadiogroup: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				$li = $target.find("li").eq(index);
			if (this.check === true) {
				$target
					.find("li")
						.attr({
							"aria-checked": "false",
							"tabindex": -1
						})
						.removeClass("zui-radiogroup-checked")
						.addClass("zui-radiogroup-unchecked")
						.eq(index)
							.attr({
								"aria-checked": "true",
								"tabindex": 0
							})
							.removeClass("zui-radiogroup-unchecked")
							.addClass("zui-radiogroup-checked");
				$target.find("input#" + $li.data("id")).prop("checked", true);
			}
			this.check = true;
			$li.addClass("zui-radiogroup-selected");
			
			$target.trigger("radiogroupselect", {
				index: index
			});
		},
		_destroyRadiogroup: function (target) {
			var inst = this._getInst(target),
				$target = $(target);
			if (!inst) {
				return FALSE;
			}
			$target
				.removeAttr("role")
				.removeClass("zui-radiogroup")
				.off(".radiogroup")
				.unbind("radiogroupcreate")
				.unbind("radiogroupselect")
				.unbind("radiogroupfocus")
				.unbind("radiogroupblur")
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
				throw 'Missing instance data for this radiogroup';
			}
		}
	};

	$.fn.zinoRadiogroup = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoRadiogroup['_' + options + 'Radiogroup'].apply($.zinoRadiogroup, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoRadiogroup['_' + options + 'Radiogroup'].apply($.zinoRadiogroup, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoRadiogroup['_' + options + 'Radiogroup'].apply($.zinoRadiogroup, [this].concat(otherArgs)) :
				$.zinoRadiogroup._attachRadiogroup(this, options);
		});
	};
	
	$.zinoRadiogroup = new Radiogroup();
	$.zinoRadiogroup.version = "1.5.1";
})(jQuery);