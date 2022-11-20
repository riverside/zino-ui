/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'tabs',
		FALSE = false,
		TRUE = true;

	function Tabs() {
		this._state = [];
		this._defaults = {
			event: "click", // click, dblclick, mouseover
			disabled: [],
			selected: 0,
			enable: null,
			disable: null,
			add: null,
			remove: null,
			show: null,
			load: null,
			select: null,
			create: null
		};
	}
	
	Tabs.prototype = {
		_attachTabs: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);
			
			$target
				.addClass("zui-tabs-holder")
				.children().not("ul").addClass("zui-tabs-box").attr({
					"role": "tabpanel",
					"aria-hidden": "true"
				}).end()
				.on("keydown.tabs", ".zui-tabs-link", function (e) {
					e.stopPropagation();
					
					var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
					switch (key) {
						case 37: //Arrow Left
						case 38: //Arrow Up
							e.preventDefault();
							var stack = $(e.target).closest("ul").find(".zui-tabs-link"),
								cnt = stack.length,
								index = stack.index(e.target);
							if (index === 0) {
								index = cnt - 1;
							} else {
								index -= 1;
							}
							self._selectTabs.call(self, target, index);
							break;
						case 39: //Arrow Right
						case 40: //Arrow Down
							e.preventDefault();
							var stack = $(e.target).closest("ul").find(".zui-tabs-link"),
								cnt = stack.length,
								index = stack.index(e.target);
							if (index === cnt - 1) {
								index = 0;
							} else {
								index += 1;
							}
							self._selectTabs.call(self, target, index);
							break;
					}
					return true;
				});
			$target
				.bind("tabsenable", function (event, ui) {
					if (inst.settings.enable !== null) {
						inst.settings.enable.call(target, event, ui);
					}
				})
				.bind("tabsdisable", function (event, ui) {
					if (inst.settings.disable !== null) {
						inst.settings.disable.call(target, event, ui);
					}
				})
				.bind("tabsadd", function (event, ui) {
					if (inst.settings.add !== null) {
						inst.settings.add.call(target, event, ui);
					}
				})
				.bind("tabsremove", function (event, ui) {
					if (inst.settings.remove !== null) {
						inst.settings.remove.call(target, event, ui);
					}
				})
				.bind("tabsload", function (event, ui) {
					if (inst.settings.load !== null) {
						inst.settings.load.call(target, event, ui);
					}
				})
				.bind("tabsselect", function (event, ui) {
					if (inst.settings.select !== null) {
						inst.settings.select.call(target, event, ui);
					}
				})
				.bind("tabscreate", function (event, ui) {
					if (inst.settings.create !== null) {
						inst.settings.create.call(target, event, ui);
					}
				})
			;
			var $ul = $target.find("ul").eq(0);
			if ($ul.length > 0) {
				$ul.attr("role", "tablist").addClass("zui-tabs-header")
					.find("li").attr({
						"role": "tab",
						"aria-controls": "",
						"aria-selected": "false",
						"tabindex": "-1"
					}).addClass("zui-tabs-link")
					.eq(inst.settings.selected).addClass("zui-tabs-focus");
				
				var _id, 
					br = 1;
				$ul.find("a").each(function (i, el) {
					var $a = $(el),
						href = $a.attr("href"),
						id = ["zui-tabs-", inst.uid, "-", i].join("");
					$a.attr({
						"role": "presentation",
						"tabindex": "-1",
						"id": id
					});
					$a.closest("li").attr("aria-labelledby", id);
					if (i == inst.settings.selected) {
						$a.closest("li").attr({
							"tabindex": "0",
							"aria-selected": "true"
						});
					}
					if (href.indexOf("#") !== 0) {
						_id = href;
						href = "#zui-tabs-" + br;
						$a.data("href", _id).attr("href", href);
						$("<div>", {
							"id": href.slice(1),
							"role": "tabpanel",
							"aria-labelledby": id
						}).addClass("zui-tabs-box").appendTo($target);
						br += 1;
					} else {
						$target.children(".zui-tabs-box").filter(href).attr("aria-labelledby", id);
					}
					$a.closest("li").attr("aria-controls", href.slice(1));
				});
				
				$target.find(".zui-tabs-box").hide().attr({
					"aria-hidden": "true",
					"aria-expanded": "false"
				});
				
				$ul.on("click.tabs", "a", function (e) {
					if (e && e.preventDefault) {
						e.preventDefault();
					}
					var index = $("li", $target).index($(this).parent().get(0));
					self._selectTabs.call(self, target, index);
					return false;
				});
				$.data(target, PROP_NAME, inst);
				$target.trigger("tabscreate", {
					
				});
				var $selected = $ul.find("a").eq(inst.settings.selected);
				if ($selected.attr("href").indexOf("#") === 0) {
					//$selected.trigger("click");
					self._selectTabs.call(self, target, inst.settings.selected);
				}
			}
			$.data(target, PROP_NAME, inst);
		},
		_destroyTabs: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.unbind("tabsenable")
				.unbind("tabsdisable")
				.unbind("tabsadd")
				.unbind("tabsremove")
				.unbind("tabsshow")
				.unbind("tabsload")
				.unbind("tabsselect")
				.unbind("tabscreate")
				.removeClass("zui-tabs-holder")
				.find(".zui-tabs-header")
					.removeClass("zui-tabs-header")
					.children("li")
						.removeClass("zui-tabs-link")
						.removeClass("zui-tabs-focus")
						.end()
					.end()
					.children("div")
						.removeClass("zui-tabs-box")
						.show()
			;
			$.data(target, PROP_NAME, FALSE);
		},
		_enableTabs: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				$tab = $target.find(".zui-tabs-header").eq(0).children("li").eq(index);
			$tab.removeClass("zui-tabs-disabled");
			$target.trigger("tabsenable", {
				index: index,
				tab: $tab
			});
		},
		_disableTabs: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				$tab = $target.find(".zui-tabs-header").eq(0).children("li").eq(index);
			$tab.addClass("zui-tabs-disabled");
			$target.trigger("tabsdisable", {
				index: index,
				tab: $tab
			});
		},
		_addTabs: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target);
			$target.trigger("tabsads", {});
		},
		_removeTabs: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				$header = $target.find(".zui-tabs-header").eq(0);
			$target
				.find(".zui-tabs-header")
					.eq(0)
						.children("li")
							.eq(index)
								.remove()
							.end()
						.end()
					.end()
				.end()
				.find(".zui-tabs-box")
				.eq(index)
				.remove()
				.trigger("tabsremove", {
					index: index
				})
			;
			if ($header.children(".zui-tabs-focus").length === 0) {
				this._selectTabs.call(this, target, 0);
			}
		},
		_selectTabs: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var _href, $href,
				$target = $(target),
				$this = $target.find(".zui-tabs-header").find("a").eq(index),
				href = $this.attr("href");
			
			if ($this.parent().hasClass("zui-tabs-disabled")) {
				return FALSE;
			}
			
			$this.parent()
				.addClass("zui-tabs-focus")
				.attr({
					"tabindex": "0",
					"aria-selected": "true"
				})
				.focus()
				.siblings("li")
					.attr({
						"tabindex": "-1",
						"aria-selected": "false"
					})
					.removeClass("zui-tabs-focus");
			
			if (href.indexOf("#") === 0) {
				$href = $(href);
				$href
					.siblings("div:visible").hide()
					.end().show();
				_href = $this.data("href");
				if (_href !== undefined) {
					$href.load(_href, function (data) {
						$href.html(data.replace(/\n/g, "<br>"));
						$target.trigger("tabsload", {
							index: index
						});
					});
				}
			}
			$target.find(".zui-tabs-box").attr({
				"aria-hidden": "true",
				"aria-expanded": "false"
			}).hide().eq(index).attr({
				"aria-hidden": "false",
				"aria-expanded": "true"
			}).show();

			$target.trigger("tabsselect", {
				index: index
			});
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
				throw 'Missing instance data for this tab';
			}
		}
	};

	$.fn.zinoTabs = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoTabs['_' + options + 'Tabs'].apply($.zinoTabs, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoTabs['_' + options + 'Tabs'].apply($.zinoTabs, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoTabs['_' + options + 'Tabs'].apply($.zinoTabs, [this].concat(otherArgs)) :
				$.zinoTabs._attachTabs(this, options);
		});
	};
	
	$.zinoTabs = new Tabs();
	$.zinoTabs.version = "1.5.1";
})(jQuery);