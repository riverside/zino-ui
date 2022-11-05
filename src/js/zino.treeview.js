/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'treeview',
		FALSE = false,
		TRUE = true;

	function Treeview() {
		this._defaults = {
			dataSource: null,
			easing: "linear", //string, "linear", "swing"
			expandDuration: 350, // "slow", "normal", "fast", or numeric
			collapseDuration: "fast", // "slow", "normal", "fast", or numeric
			expand: null, // callback function
			collapse: null, // callback function
			select: null, // callback function
			remove: null // callback function
		};
	}
	
	Treeview.prototype = {
		_attachTreeview: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $tree, $ul, $li,
				$target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			
			$target
				.addClass("zui-treeview zui-unselectable")
				.append($("<ul>")
						.attr({
							"role": "tree",
							"aria-labelledby": "",
							"tabindex": 0
						})
						.addClass("zui-treeview-list-root"));
			
			$.data(target, PROP_NAME, inst); // Fix for display function: self._expandTreeview.call(), self._selectTreeview.call()
			
			var id, 
				index = 1;
			function displayJSON(data, parent_id, $node) {
				for (var i = 0, len = data.length; i < len; i++) {
					if (data[i].parent_id === parent_id) {
						id = ["zui-treeview-label-", inst.uid, "-", index].join("");
						$li = $("<li>")
							.attr({
								"role": "treeitem",
								"tabindex": -1,
								"aria-expanded": false,
								"aria-labelledby": id
							})
							.addClass("zui-treeview-item")
							.append($("<div>")
									.attr("id", id)
									.addClass("zui-treeview-label")
									.html(data[i].text))
							.append($("<ul>").attr("role", "group").addClass("zui-treeview-list"));
						if (data[i].expanded) {
							self._expandTreeview.call(self, target, $li);
						}
						if (data[i].selected) {
							self._selectTreeview.call(self, target, $li);
						}
						$li.appendTo($node.children("ul"));
						index += 1;
						displayJSON(data, data[i].id, $li);
					}
				}
			}
			
			function callback() {
				$target.find(".zui-treeview-label").each(function (i, el) {
					var $el = $(el),
						$ul = $el.siblings("ul"),
						$li = $el.parent("li");
					if ($ul.children().length > 0) {
						$el.before($("<span>")
								.attr("role", "presentation")
								.addClass("zui-treeview-arrow")
								.addClass($li.attr("aria-expanded") === "false" ? "zui-treeview-arrow-collapse" : "zui-treeview-arrow-expand"));
					} else {
						$ul.remove();
					}
				});
			}
			
			inst.settings.dataSource.load(function (data) {
				displayJSON(data, 0, $target);
				callback();
			});
			
			$target.on("mouseover.treeview", ".zui-treeview-label", function () {
				$(this).addClass("zui-treeview-label-hover");
			}).on("mouseout.treeview", ".zui-treeview-label", function () {
				$(this).removeClass("zui-treeview-label-hover");
			}).on("click.treeview", ".zui-treeview-label", function () {
				self._selectTreeview.call(self, target, $(this).parent("li"));
			}).on("dblclick.treeview", ".zui-treeview-label", function () {
				var $ul = $(this).siblings("ul").eq(0);
				if ($ul.is(":visible")) {
					self._collapseTreeview.call(self, target, $ul.parent("li"));
				} else {
					self._expandTreeview.call(self, target, $ul.parent("li"));
				}
			}).on("click.treeview", ".zui-treeview-arrow-collapse", function () {
				self._expandTreeview.call(self, target, $(this).parent("li"));
			}).on("click.treeview", ".zui-treeview-arrow-expand", function () {
				self._collapseTreeview.call(self, target, $(this).parent("li"));
			}).on("keydown.treeview", "li", function (e) {
				e.stopPropagation();
				var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
				switch (key) {
					case 37: //Arrow Left
						e.preventDefault();
						self._collapseTreeview.call(self, target, $(e.target));
						break;
					case 38: //Arrow Up
						e.preventDefault();
						var prev = self._getPrevTreeview.call(self, target, self._getSelectedTreeview.call(self, target));
						self._selectTreeview.call(self, target, prev);
						break;
					case 39: //Arrow Right
						e.preventDefault();
						self._expandTreeview.call(self, target, $(e.target));
						break;
					case 40: //Arrow Down
						e.preventDefault();
						var next = self._getNextTreeview.call(self, target, self._getSelectedTreeview.call(self, target));
						if (next.hasClass("zui-treeview-item") && next.get(0).nodeName === "LI") {
							self._selectTreeview.call(self, target, next);
						}
						break;
					case 13: //Enter
					case 32: //SpaceBar
						e.preventDefault();
						//console.log("e&s");
						break;
					case 9: //Tab
						e.preventDefault();
						//console.log("tab");
						break;
				}
				return true;
			}).bind("treeviewexpand", function (event, ui) {
				if (inst.settings.expand !== null) {
					inst.settings.expand.call(target, event, ui);
				}
			}).bind("treeviewcollapse", function (event, ui) {
				if (inst.settings.collapse !== null) {
					inst.settings.collapse.call(target, event, ui);
				}
			}).bind("treeviewselect", function (event, ui) {
				if (inst.settings.select !== null) {
					inst.settings.select.call(target, event, ui);
				}
			}).bind("treeviewremove", function (event, ui) {
				if (inst.settings.remove !== null) {
					inst.settings.remove.call(target, event, ui);
				}
			});

			$.data(target, PROP_NAME, inst);
		},
		_collapseTreeview: function (target, node) {
			var inst = this._getInst(target);
			if (!inst || node.length === 0) {
				return FALSE;
			}
			node
				.attr("aria-expanded", false)
				.children("span")
					.removeClass("zui-treeview-arrow-expand")
					.addClass("zui-treeview-arrow-collapse")
					.end()
				.children("ul")
				.slideUp(inst.settings.collapseDuration, inst.settings.easing);

			if (node.children("ul").length === 0 || !node.children("ul").is(":visible")) {
				var el = node.closest(".zui-treeview-list").closest(".zui-treeview-item");
				if (el.length > 0) {
					this._selectTreeview.call(this, target, el);
				}
			}
			
			$(target).trigger("treeviewcollapse", {
				item: node
			});
		},
		_expandTreeview: function (target, node) {
			var inst = this._getInst(target);
			if (!inst || node.length === 0) {
				return FALSE;
			}
			node
				.attr("aria-expanded", true)
				.children("span")
					.removeClass("zui-treeview-arrow-collapse")
					.addClass("zui-treeview-arrow-expand")
					.end()
				.children("ul")
				.slideDown(inst.settings.expandDuration, inst.settings.easing);
			
			$(target).trigger("treeviewexpand", {
				item: node
			});
		},
		_collapseAllTreeview: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(".zui-treeview-item", target).attr("aria-expanded", false);
			$(".zui-treeview-arrow", target).removeClass("zui-treeview-arrow-expand").addClass("zui-treeview-arrow-collapse");
			$(".zui-treeview-list", target).slideUp();
		},
		_expandAllTreeview: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(".zui-treeview-item", target).attr("aria-expanded", true);
			$(".zui-treeview-arrow", target).removeClass("zui-treeview-arrow-collapse").addClass("zui-treeview-arrow-expand");
			$(".zui-treeview-list", target).slideDown();
		},
		_removeTreeview: function (target, node) {
			var inst = this._getInst(target);
			if (!inst || node.length === 0) {
				return FALSE;
			}
			node.remove();

			$(target).trigger("treeviewremove", {
				item: node
			});
		},
		_getSelectedTreeview: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			return $(".zui-treeview-label-selected", target).parent();
		},
		_getPrevTreeview: function (target, node) {
			var inst = this._getInst(target);
			if (!inst || !node || node.length === 0) {
				return FALSE;
			}
			var prev = node.prev(),
				p = node.parent().parent();

			if (prev.length === 0 && p.is("li") && p.hasClass("zui-treeview-item")) {
				return p;
			} else if (prev.has(".zui-treeview-list") && prev.attr("aria-expanded") === "true") {
				return prev.find(".zui-treeview-item").filter(":visible").last();
			} else {
				return prev;
			}
		},
		_getNextTreeview: function (target, node) {
			var inst = this._getInst(target);
			if (!inst || !node || node.length === 0) {
				return FALSE;
			}
			var next = node.next(),
				hasChildren = node.has(".zui-treeview-list"),
				expanded = node.attr("aria-expanded");

			function getNext (node) {
				var p = node.parent().parent(),
					pn = p.next();
				if (pn.length === 0) {
					getNext(p);
				} else {
					r = pn;
				}
			}
			
			if (next.length === 0 && (!hasChildren || expanded === "false")) {
				var r;
				getNext(node, r);
				return r;
			} else if (hasChildren && expanded === "true") {
				return node.find(".zui-treeview-item").filter(":visible").first();
			} else {
				return next;
			}
		},
		_selectTreeview: function (target, node) {
			var inst = this._getInst(target);
			if (!inst || !node || node.length === 0) {
				return FALSE;
			}
			$(".zui-treeview-label", target).removeClass("zui-treeview-label-selected");
			$(".zui-treeview-item", target).attr("tabindex", -1);
			node
				.attr("tabindex", 0)
				.focus()
				.children(".zui-treeview-label")
					.addClass("zui-treeview-label-selected");
			
			$(target).trigger("treeviewselect", {
				item: node
			});
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
				throw 'Missing instance data for this treeview';
			}
		}
	};

	$.fn.zinoTreeview = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && $.inArray(options, ['isDisabled', 'getSelected', 'getNext', 'getPrev'])) {
			return $.zinoTreeview['_' + options + 'Treeview'].apply($.zinoTreeview, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoTreeview['_' + options + 'Treeview'].apply($.zinoTreeview, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoTreeview['_' + options + 'Treeview'].apply($.zinoTreeview, [this].concat(otherArgs)) :
				$.zinoTreeview._attachTreeview(this, options);
		});
	};
	
	$.zinoTreeview = new Treeview();
	$.zinoTreeview.version = "1.5";
})(jQuery);