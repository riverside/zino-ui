/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'menu',
		FALSE = false,
		TRUE = true;

	function Menu() {
		this._defaults = {
			dataSource: null,
			orientation: "horizontal", //String. Values: horizontal, vertical
			open: null, //callback
			close: null, //callback
			enable: null, //callback
			disable: null //callback
		};
	}
	
	Menu.prototype = {
		_attachMenu: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			
			$target.on("mouseenter.menu", ".zui-menubar-item", function (e) {
				self._openMenu.call(self, target, this);
				return true;
			}).on("mouseleave.menu", ".zui-menubar-item", function (e) {
				self._closeMenu.call(self, target, this);
				return true;
			}).on("focus.menu", ".zui-menubar-item", function (e) {
				$(".zui-menubar-item[aria-haspopup='true']").not(this).trigger("mouseleave");
				$(this).addClass("zui-menubar-item-focus");
				return true;
			}).on("blur.menu", ".zui-menubar-item", function (e) {
				$(this).removeClass("zui-menubar-item-focus");
				return true;
			}).on("mouseenter.menu", ".zui-menu-item", function (e) {
				$(this).addClass("zui-menu-item-hover");
				return true;
			}).on("mouseleave.menu", ".zui-menu-item", function (e) {
				$(this).removeClass("zui-menu-item-hover");
				return true;
			}).on("focus.menu", ".zui-menu-item", function (e) {
				//$(this).siblings().trigger("mouseleave");
				return true;
			}).on("blur.menu", ".zui-menu-item", function (e) {
				return true;
			}).on("keydown.menu", ".zui-menubar-item", function (e) {
				e.stopPropagation();
				e.preventDefault();
				var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
				switch (key) {
					case 37: //Arrow Left
						$(e.target).prev().trigger("focus");
						break;
					case 38: //Arrow Up
						$(e.target)
							.trigger("mouseenter")
							.find(".zui-menu-item")
							.filter(":last")
							.trigger("focus")
							.trigger("mouseenter");
						break;
					case 39: //Arrow Right
						$(e.target).next().trigger("focus");
						break;
					case 40: //Arrow Down
						$(e.target)
							.trigger("mouseenter")
							.find(".zui-menu-item")
							.filter(":first")
							.trigger("focus")
							.trigger("mouseenter");
						break;
					case 13: //Enter
					case 32: //SpaceBar
						break;
				}
				return true;
			}).on("keydown.menu", ".zui-menu-item", function (e) {
				e.stopPropagation();
				e.preventDefault();
				var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
				switch (key) {
					case 37: //Arrow Left
						$(this)
							.trigger("mouseleave")
							.closest(".zui-menubar-item")
								//.trigger("mouseleave")//addition!!
								.prev()
								.trigger("focus")
								.trigger("mouseenter")
								.find(".zui-menu-item")
								.filter(":first")
								.trigger("focus")
								.trigger("mouseenter")
						;
						break;
					case 38: //Arrow Up
						var $el = $(e.target).prev();
						if ($el.get(0) === undefined) {
							$el = $(e.target).siblings().filter(":last");
						}
						$el.trigger("focus").trigger("mouseenter").siblings().removeClass("zui-menu-item-hover");
						break;
					case 39: //Arrow Right
						$(this)
							.trigger("mouseleave")
							.closest(".zui-menubar-item")
								//.trigger("mouseleave")//addition!!
								.next()
								.trigger("focus")
								.trigger("mouseenter")
								.find(".zui-menu-item")
								.filter(":first")
								.trigger("focus")
								.trigger("mouseenter")
						;
						break;
					case 40: //Arrow Down
						var $el = $(e.target).next();
						if ($el.get(0) === undefined) {
							$el = $(e.target).siblings().filter(":first");
						}
						$el.trigger("focus").trigger("mouseenter").siblings().removeClass("zui-menu-item-hover");
						break;
					case 13: //Enter
					case 32: //SpaceBar
						break;
					case 27: //Escape
						$(e.target)
							.removeClass("zui-menu-item-hover")
							.trigger("blur")
							.closest(".zui-menu")
								.hide()
								.attr("aria-hidden", "true")
								.closest(".zui-menubar-item")
						;
						break;
				}
				return true;
			}).bind("menuenable", function (event, ui) {
				if (inst.settings.enable !== null) {
					inst.settings.enable.call(target, event, ui);
				}
			}).bind("menudisable", function (event, ui) {
				if (inst.settings.disable !== null) {
					inst.settings.disable.call(target, event, ui);
				}
			}).bind("menuopen", function (event, ui) {
				if (inst.settings.open !== null) {
					inst.settings.open.call(target, event, ui);
				}
			}).bind("menuclose", function (event, ui) {
				if (inst.settings.close !== null) {
					inst.settings.close.call(target, event, ui);
				}
			});
			
			$.data(target, PROP_NAME, inst);
			self._renderMenu.call(self, target);
		},
		_destroyMenu: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target);
			if (target.nodeName === "UL") {
				$target
					.removeAttr("role")
					.removeClass("zui-menubar zui-menubar-horizontal zui-menubar-vertical")
					.children("li")
						.removeAttr("role")
						.removeAttr("aria-disabled")
						.removeAttr("aria-haspopup")
						.removeClass("zui-menubar-item zui-menubar-item-hover zui-menubar-item-disabled")
						.children("ul")
							.removeAttr("role")
							.removeAttr("aria-hidden")
							.removeClass("zui-menu")
							.children("li")
								.removeAttr("role")
								.removeAttr("aria-disabled")
								.removeClass("zui-menu-item zui-menu-item-hover");
			} else {
				$target.children().remove();
			}
			$.data(target, PROP_NAME, FALSE);
		},
		getItem: function ($target, index) {
			var $el;
			switch (typeof index) {
				case "number":
					if ($target.hasClass("zui-menubar")) {
						$el = $target.children(".zui-menubar-item").eq(index);
					} else {
						$el = $(".zui-menubar", $target).children(".zui-menubar-item").eq(index);
					}
					break;
				case "string":
					$el = $(index);
					break;
				case "object":
					if (index instanceof jQuery) {
						$el = index;
					} else if (index.nodeType) {
						$el = $(index);
					}
					break;
			}
			return $el;
		},
		_enableMenu: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				$el = this.getItem($target, index);
			if ($el.attr("aria-disabled") === "false") {
				return FALSE;
			}
			$el.attr("aria-disabled", "false").removeClass("zui-menubar-item-disabled");
			
			$target.trigger("menuenable", {
				index: index
			});
		},
		_disableMenu: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				$el = this.getItem($target, index);
			if ($el.attr("aria-disabled") === "true") {
				return FALSE;
			}
			$el.attr("aria-disabled", "true").addClass("zui-menubar-item-disabled");
			if ($el.children(".zui-menu").is(":visible")) {
				$el.trigger("mouseleave");
			}
			
			$target.trigger("menudisable", {
				index: index
			});
		},
		_closeMenu: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $menu,
				$target = $(target),
				$el = this.getItem($target, index);

			$el.removeClass("zui-menubar-item-hover");
			$menu = $el.children(".zui-menu");
			if (!$menu.is(":visible")) {
				return FALSE;
			}
			//.trigger("blur")
			$menu.hide().attr("aria-hidden", "true");
			
			$target.trigger("menuclose", {
				index: index
			});
		},
		_openMenu: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $menu,
				$target = $(target),
				$el = this.getItem($target, index);
			
			$menu = $el.children(".zui-menu");
			if ($menu.is(":visible") || $el.attr("aria-disabled") === "true") {
				return FALSE;
			}
			$el.addClass("zui-menubar-item-hover");
			$menu.show().attr("aria-hidden", "false");
			
			$target.trigger("menuopen", {
				index: index
			});
		},
		_renderMenu: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $ul, $sub, $li, $a, $span, i, iCnt, j, jCnt,
				$target = $(target);

			function dataHandler(data, $ul) {
				jCnt = 0;
				for (i = 0, iCnt = data.length; i < iCnt; i++) {
					if (data[i].parent_id == 0) {
						$li = $("<li>")
							.attr("role", "menuitem")
							.attr("tabindex", jCnt > 0 ? -1 : 0)
							.addClass("zui-menubar-item");
						$("<a>", {
							"href": data[i].url
						}).html(data[i].text).appendTo($li);
						$sub = $("<ul>", {
							"aria-hidden": "true",
							"role": "menu"
						}).hide().addClass("zui-menu");
						for (j = 0; j < iCnt; j++) {
							if (data[j].parent_id == data[i].id) {
								$("<li>")
									.attr("role", "menuitem")
									.attr("tabindex", -1)
									.addClass("zui-menu-item")
									.append($("<a>", {
										"href": data[j].url
									}).html(data[j].text))
									.appendTo($sub);
							}
						}
						if ($sub.children().get(0) != undefined) {
							$sub.appendTo($li);
							$li.attr("aria-haspopup", "true");
						} else {
							$li.attr("aria-haspopup", "false");
						}
						$li.appendTo($ul);
						jCnt += 1;
					}
				}
			}
			
			if (target.nodeName === "UL") {
				$target
					.attr("role", "menubar")
					.addClass("zui-menubar")
					.find("ul")
						.hide();
				switch (inst.settings.orientation) {
					case "horizontal":
						$target.addClass("zui-menubar-horizontal");
						break;
					case "vertical":
						$target.addClass("zui-menubar-vertical");
						break;
				}

				$target
					.children("li")
						.attr({
							"role": "menuitem",
							"aria-disabled": "false"
						})
						.addClass("zui-menubar-item")
						.each(function (i, el) {
							$(el)
								.attr("aria-haspopup", $(el).children("ul").get(0) != undefined ? "true" : "false")
								.attr("tabindex", i > 0 ? -1 : 0);
						})
						.end()
					.find("ul")
						.attr("role", "menu")
						.addClass("zui-menu")
						.children("li")
							.attr("tabindex", -1)
							.attr({
								"role": "menuitem",
								"aria-disabled": "false"
							})
							.addClass("zui-menu-item");
				
			} else {
				inst.settings.dataSource.load(function (data) {
					$ul = $("<ul>", {
						"role": "menubar"
					}).addClass("zui-menubar zui-menubar-" + inst.settings.orientation);
					dataHandler(data, $ul);
					$ul.appendTo($target);
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
				settings: {}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this menu';
			}
		}
	};

	$.fn.zinoMenu = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoMenu['_' + options + 'Menu'].apply($.zinoMenu, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoMenu['_' + options + 'Menu'].apply($.zinoMenu, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoMenu['_' + options + 'Menu'].apply($.zinoMenu, [this].concat(otherArgs)) :
				$.zinoMenu._attachMenu(this, options);
		});
	};
	
	$.zinoMenu = new Menu();
	$.zinoMenu.version = "1.5";
})(jQuery);