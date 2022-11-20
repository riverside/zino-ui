/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'splitter',
		FALSE = false,
		TRUE = true;

	function Splitter() {
		this._defaults = {
			expand: null, // callback function
			collapse: null, // callback function
			resize: null, // callback function
			load: null, // callback function
			dataUrl: null,
			splitterSize: 4,
			orientation: "horizontal", //"horizontal" or "vertical"
			panes: [] // Array of objects. Object indexes: size(numeric), collapsible(boolean), resizable(boolean), region(string)-east,south,west,north,center
		};
	}
	
	Splitter.prototype = {
		_attachSplitter: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);
			
			$target
				.addClass("zui-splitter")
				.bind("splitterexpand", function (event, ui) {
					if (inst.settings.expand !== null) {
						inst.settings.expand.call(target, event, ui);
					}
				})
				.bind("splittercollapse", function (event, ui) {
					if (inst.settings.collapse !== null) {
						inst.settings.collapse.call(target, event, ui);
					}
				})
				.bind("splitterresize", function (event, ui) {
					if (inst.settings.resize !== null) {
						inst.settings.resize.call(target, event, ui);
					}
				})
				.bind("splitterload", function (event, ui) {
					if (inst.settings.load !== null) {
						inst.settings.load.call(target, event, ui);
					}
				});
			
			var $pane, $separator, $collapsible, $before, i, iCnt, top, left, width, 
				height, css, lowerBound, upperBound, 
				horizontal = inst.settings.orientation === "horizontal",
				pCss = {},
				offset = 0;
			for (i = 0, iCnt = inst.settings.panes.length; i < iCnt; i++) {
				css = {
					"position": "absolute"
				};
				$pane = $target.children().not(".zui-splitter-separator").eq(i);
				if (inst.settings.panes[i].dataUrl !== undefined) {
					$.get(inst.settings.panes[i].dataUrl).done(function (index) {
						return function (data) {
							$target.children().not(".zui-splitter-separator").eq(index).html(data);
							$target.trigger("splitterload", {
								
							});
						};
					}(i));
				}
				$pane.addClass("zui-splitter-pane")
					.data("size", inst.settings.panes[i].size);
				
				if (horizontal) {
					$pane.addClass("zui-splitter-pane-horizontal");
					
					top = 0;
					left = offset + "px";
					width = inst.settings.panes[i].size + "px";
					css.bottom = 0;
					
					pCss.top = 0;
					pCss.bottom = 0;
					pCss.left = (inst.settings.panes[i].size + offset) + "px";
					pCss.right = "auto";
					pCss.width = inst.settings.splitterSize + "px";
				} else {
					$pane.addClass("zui-splitter-pane-vertical");
					
					top = offset + "px";
					left = 0;
					height = inst.settings.panes[i].size + "px";
					css.right = 0;
					
					pCss.left = 0;
					pCss.right = 0;
					pCss.top = (inst.settings.panes[i].size + offset) + "px";
					pCss.bottom = "auto";
					pCss.height = inst.settings.splitterSize + "px";
				}
				
				css.top = top;
				css.left = left;
				css.width = width;
				css.height = height;
				
				$pane.css(css);
				$separator = $("<div>", {
					"role": "separator"
				}).addClass("zui-splitter-separator");
				
				if (inst.settings.panes[i].region !== undefined) {
					$separator.data("region", inst.settings.panes[i].region);
					$pane.data("region", inst.settings.panes[i].region);
				} else {
					if (horizontal) {
						$separator.data("region", "west");
						$pane.data("region", "west");
					} else {
						$separator.data("region", "north");
						$pane.data("region", "north");
					}
				}
				
				if (inst.settings.panes[i].resizable === undefined || inst.settings.panes[i].resizable === TRUE) {
					$separator.attr("data-draggable", "true").addClass("zui-splitter-separator-draggable");
				}
				
				if (horizontal) {
					if (inst.settings.panes[i].region !== undefined && inst.settings.panes[i].region === "east") {
						$separator.insertBefore($pane);
						$before = $separator.prev();
						if ($before.hasClass("zui-splitter-separator")) {
							$before.remove();
						}
						pCss.left = (offset - inst.settings.splitterSize) + "px";
					} else {
						$separator.insertAfter($pane);
					}
					$separator.addClass("zui-splitter-separator-horizontal");
				} else if (inst.settings.orientation === "vertical") {
					if (inst.settings.panes[i].region !== undefined && inst.settings.panes[i].region === "south") {
						$separator.insertBefore($pane);
						$before = $separator.prev();
						if ($before.hasClass("zui-splitter-separator")) {
							$before.remove();
						}
						pCss.top = (offset - inst.settings.splitterSize) + "px";
					} else {
						$separator.insertAfter($pane);
					}
					
					$separator.addClass("zui-splitter-separator-vertical");
				}
				
				$separator.css(pCss);
				offset += inst.settings.panes[i].size + inst.settings.splitterSize;
				
				if (inst.settings.panes[i].collapsible !== undefined && 
						inst.settings.panes[i].collapsible === TRUE) {
					$collapsible = $("<a>").addClass("zui-splitter-collapsible").appendTo($separator);
					if (horizontal) {
						$collapsible.addClass("zui-splitter-collapsible-horizontal");
					} else if (inst.settings.orientation === "vertical") {
						$collapsible.addClass("zui-splitter-collapsible-vertical");
					}
				}
			}
			
			$target.children().children(".zui-splitter-collapsible").bind("click.splitter", function (e) {
				e.stopPropagation();
				
				var $separator = $(this).parent(),
					$node = ($separator.data("region") === "north" || $separator.data("region") === "west") ? $separator.prev() : $separator.next();
				if ($node.is(":visible")) {
					self._collapseSplitter.call(self, target, $node);
				} else {
					self._expandSplitter.call(self, target, $node);
				}
				if (e && e.preventDefault) {
					e.preventDefault();
				}
				return false;
			});
			
			if (inst.settings.orientation === "horizontal") {
				upperBound = [0, 0];
				lowerBound = [$target.width() - inst.settings.splitterSize, 0];
			} else {
				upperBound = [0, $target.height() - inst.settings.splitterSize];
				lowerBound = [0, 0];
			}
			
			if ($.fn.zinoDraggable !== undefined) {
				$target.find(".zui-splitter-separator-draggable").zinoDraggable({
					lowerBound: lowerBound,
					upperBound: upperBound,
					start: function (event, ui) {},
					drag: function (event, ui) {},
					end: function (event, ui) {
						var size,
							$this = $(this),
							$prev = $this.prev(), 
							$next = $this.next(),
							$subsequent = $next.next(),
							position = $this.position();

						if (inst.settings.orientation === "horizontal") {
							size = position.left - $prev.position().left;
							$prev.css({
								"width": size + "px"
							}).data("size", size);
							size = $subsequent.length === 0 ? $this.parent().width() - position.left - inst.settings.splitterSize : $subsequent.position().left - position.left - inst.settings.splitterSize;
							$next.css({
								"width": size + "px",
								"left": (position.left + inst.settings.splitterSize) + "px"
							}).data("size", size);
						} else {
							size = position.top - $prev.position().top;
							$prev.css({
								"height": size + "px"
							}).data("size", size);
							size = $subsequent.length === 0 ? $this.parent().height() - position.top - inst.settings.splitterSize : $subsequent.position().top - position.top - inst.settings.splitterSize;
							$next.css({
								"height": size + "px",
								"top": (position.top + inst.settings.splitterSize) + "px"
							}).data("size", size);
						}
						$target.trigger("splitterresize", {
							
						});
					}
				});
			} else {
				throw new Error("zinoDraggable is missing.");
			}
			
			$.data(target, PROP_NAME, inst);
		},
		_collapseSplitter: function (target, node) {
			var inst = this._getInst(target);
			if (!inst || node.length === 0) {
				return FALSE;
			}
			
			node.attr("aria-expanded", false);
			var position = node.position(),
				reverse = node.data("region") === "east" || node.data("region") === "south",
				$separator = !reverse ? node.next(".zui-splitter-separator") : node.prev(".zui-splitter-separator"),
				$pane = !reverse ? $separator.next(".zui-splitter-pane") : $separator.prev(".zui-splitter-pane");
			if (node.hasClass("zui-splitter-pane-horizontal")) {
				$separator.css({
					left: (!reverse ? position.left : position.left + node.outerWidth() - inst.settings.splitterSize) + "px"
				});
				$pane.css({
					left: (!reverse ? position.left + inst.settings.splitterSize : $pane.position().left) + "px",
					width: ($pane.outerWidth() + node.outerWidth()) + "px"
				});
			} else if (node.hasClass("zui-splitter-pane-vertical")) {
				$separator.css({
					top: (!reverse ? position.top : position.top + node.outerHeight() - inst.settings.splitterSize) + "px"
				});
				$pane.css({
					top: (!reverse ? position.top + inst.settings.splitterSize : $pane.position().top) + "px",
					height: ($pane.outerHeight() + node.outerHeight()) + "px"
				});
			}
			node.hide();
			if ($separator.data("draggable") && $.fn.zinoDraggable !== undefined) {
				$separator.zinoDraggable("disable");
			}
			$separator.addClass("zui-splitter-separator-collapsed");
			
			$(target).trigger("splittercollapse", {
				item: node
			});
		},
		_expandSplitter: function (target, node) {
			var inst = this._getInst(target);
			if (!inst || node.length === 0) {
				return FALSE;
			}
			
			node.attr("aria-expanded", true);
			node.show();
			var position = node.position(),
				reverse = node.data("region") === "east" || node.data("region") === "south",
				$separator = !reverse ? node.next(".zui-splitter-separator") : node.prev(".zui-splitter-separator"),
				$pane = !reverse ? $separator.next(".zui-splitter-pane") : $separator.prev(".zui-splitter-pane");
			if (node.hasClass("zui-splitter-pane-horizontal")) {
				node.css({
					//left: (!reverse ? position.left : position.left - node.data("size")) + "px",
					width: node.data("size") + "px"
				});
				$separator.css({
					left: (!reverse ? position.left + parseInt(node.outerWidth(), 10) : position.left /*- node.data("size")*/ - inst.settings.splitterSize) + "px"
				});
				$pane.css({
					left: (!reverse ? $pane.position().left + node.outerWidth() : $pane.position().left) + "px",
					width: ($pane.outerWidth() - node.outerWidth()) + "px"
				});
			} else if (node.hasClass("zui-splitter-pane-vertical")) {
				node.css({
					//top: (!reverse ? position.top : position.top - node.data("size")) + "px",
					height: node.data("size") + "px"
				});
				$separator.css({
					top: (!reverse ? position.top + parseInt(node.outerHeight(), 10) : position.top /*- node.data("size")*/ - inst.settings.splitterSize) + "px"
				});
				$pane.css({
					top: (!reverse ? $pane.position().top + node.outerHeight() : $pane.position().top) + "px",
					height: ($pane.outerHeight() - node.outerHeight()) + "px"
				});
			}
			if ($separator.data("draggable") && $.fn.zinoDraggable !== undefined) {
				$separator.zinoDraggable("enable");
			}
			$separator.removeClass("zui-splitter-separator-collapsed");
			
			$(target).trigger("splitterexpand", {
				item: node
			});
		},
		_destroySplitter: function (target) {
			var inst = this._getInst(target),
				$target = $(target);
			if (!inst) {
				return FALSE;
			}
			
			$target
				.removeClass("zui-splitter")
				.children(".zui-splitter-separator")
				.remove()
				.end()
				.children()
					.removeAttr("aria-expanded")
					.removeClass("zui-splitter-pane zui-splitter-pane-horizontal zui-splitter-pane-vertical")
					.css({
						"left": "initial",
						"right": "initial",
						"top": "initial",
						"bottom": "initial",
						"position": "initial",
						"width": "initial",
						"height": "initial"
					})
			;
			
			$.data(target, PROP_NAME, FALSE);
		},
		/**
		 * Create a new instance object
		 * 
		 * @param {HTMLElement} target
		 * @return {Object}
		 */
		_newInst: function (target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 99999999),
				focus: FALSE,
				isOpen: FALSE,
				isDisabled: FALSE,
				settings: {}
			}; 
		},
		/**
		 * Retrieve the instance data for the target control.
		 * 
		 * @param {HTMLElement} target
		 * @return {Object} - the associated instance data
		 * @throws error if a jQuery problem getting data
		 */
		_getInst: function (target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this splitter';
			}
		}
	};

	$.fn.zinoSplitter = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options === 'string' && options === 'isDisabled') {
			return $.zinoSplitter['_' + options + 'Splitter'].apply($.zinoSplitter, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] === 'string') {
			return $.zinoSplitter['_' + options + 'Splitter'].apply($.zinoSplitter, [this[0]].concat(otherArgs));
		}
		
		return this.each(function () {
			typeof options === 'string' ?
				$.zinoSplitter['_' + options + 'Splitter'].apply($.zinoSplitter, [this].concat(otherArgs)) :
				$.zinoSplitter._attachSplitter(this, options);
		});
	};
	
	$.zinoSplitter = new Splitter();
	$.zinoSplitter.version = "1.5.1";
})(jQuery);