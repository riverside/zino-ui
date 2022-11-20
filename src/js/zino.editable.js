/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'editable',
		FALSE = false,
		TRUE = true;

	function Editable() {
		this._defaults = {
			control: "input", //e.g. input, textarea
			event: "click", //e.g. click, dblclick, mouseover
			buttons: {
				"OK": function (ui) {
					$(this).zinoEditable("save");
				},
				"Cancel": function (ui) {
					$(this).zinoEditable("close");
				}
			},
			load: null, //callback
			save: null, //callback
			close: null, //callback
			enable: null, //callback
			disable: null //callback
		};
	}
	
	Editable.prototype = {
		_attachEditable: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $container, $control, $btn, offset,
				$target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			
			offset = $target.offset();
			
			$container = $("<div>", {
				id: "zui-editable-" + inst.uid
			}).hide().addClass("zui-editable-wrapper zui-unselectable").css({
				"left": offset.left + "px",
				"top": offset.top + "px"
			}).bind("mousedown.editable", function (e) {
				e.stopPropagation();
			}).bind("keydown.editable", function (e) {
				var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
				switch (key) {
					case 27: //Escape
						e.stopPropagation();
						self._closeEditable.call(self, target);
						break;
				}
			});
			
			$control = $("<" + inst.settings.control + ">", {
				"autocomplete": "off"
			}).bind("keydown.editable", function (e) {
				var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
				switch (key) {
					case 13: //Enter
						self._saveEditable.call(self, target);
						break;
				}
			}).addClass("zui-editable-control").appendTo($container);
			
			switch (inst.settings.control) {
				case "input":
					$control.css({
						"width": ($target.width() + 10) + "px"
					});
					break;
				case "textarea":
					$control.css({
						"height": ($target.height() + 30) + "px",
						"width": $target.width() + "px"
					});
					break;
			}
			
			for (var key in inst.settings.buttons) {
				if (inst.settings.buttons.hasOwnProperty(key)) {
					$btn = $("<input>", {
						"type": "button"
					}).val(key).addClass("zui-editable-button").bind("click.editable", function (k, t) {
						return function (e) {
							inst.settings.buttons[k].call(t, this);
						};
					}(key, target)).appendTo($container);
					if ($.fn.zinoButton !== undefined) {
						$btn.zinoButton();
					}
				}
			}
			
			$target
				.addClass("zui-editable")
				.bind(inst.settings.event + ".editable", function (e) {
					e.stopPropagation();
					self._loadEditable.call(self, target);
				})
				.bind("editableload", function (event, ui) {
					if (inst.settings.load !== null) {
						inst.settings.load.call(target, event, ui);
					}
				})
				.bind("editablesave", function (event, ui) {
					if (inst.settings.save !== null) {
						inst.settings.save.call(target, event, ui);
					}
				})
				.bind("editableclose", function (event, ui) {
					if (inst.settings.close !== null) {
						inst.settings.close.call(target, event, ui);
					}
				})
				.bind("editableenable", function (event, ui) {
					if (inst.settings.enable !== null) {
						inst.settings.enable.call(target, event, ui);
					}
				})
				.bind("editabledisable", function (event, ui) {
					if (inst.settings.disable !== null) {
						inst.settings.disable.call(target, event, ui);
					}
				})
			;
			$container.appendTo(document.body);
			
			$(window).off(".editable").on("mousedown.editable", document.body, function (e) {
				if (!$(e.target).hasClass("zui-editable-button")) {
					e.stopPropagation();
					$(".zui-editable").zinoEditable("close");
				}
			});
			
			inst.container = $container;
			inst.control = $control;
			$.data(target, PROP_NAME, inst);
		},
		_loadEditable: function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target);
			if ($target.hasClass("zui-editable-disabled")) {
				return FALSE;
			}
			$target.css("visibility", "hidden");
			$target.trigger("editableload", {});
			
			inst.control.val($target.text());
			inst.container.show();
			inst.control.select();
		},
		_saveEditable: function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target);
			$target.trigger("editablesave", {
				control: inst.control
			});
			$target.text(inst.container.find(".zui-editable-control").val());
			this._closeEditable.call(this, target);
		},
		_closeEditable: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target);
			$target.trigger("editableclose", {});
			inst.container.find(".zui-editable-control").val("").end().hide();
			$target.css("visibility", "visible");
		},
		_destroyEditable: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target);
			this._closeEditable.call(this, target);
			$target.unbind(".editable").removeClass("zui-editable");
			inst.container.remove();
			$.removeData(target, PROP_NAME);
		},
		_enableEditable: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target);
			if (!$target.hasClass("zui-editable-disabled")) {
				return FALSE;
			}
			$target.removeClass("zui-editable-disabled").trigger("editableenable", {});
		},
		_disableEditable: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target);
			if ($target.hasClass("zui-editable-disabled")) {
				return FALSE;
			}
			$target.addClass("zui-editable-disabled").trigger("editabledisable", {});
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
				throw 'Missing instance data for this editable';
			}
		}
	};

	$.fn.zinoEditable = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoEditable['_' + options + 'Editable'].apply($.zinoEditable, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoEditable['_' + options + 'Editable'].apply($.zinoEditable, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoEditable['_' + options + 'Editable'].apply($.zinoEditable, [this].concat(otherArgs)) :
				$.zinoEditable._attachEditable(this, options);
		});
	};
	
	$.zinoEditable = new Editable();
	$.zinoEditable.version = "1.5.1";
})(jQuery);