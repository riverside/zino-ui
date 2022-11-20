/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'overlay',
		prefix = 'zui-overlay-',
		FALSE = false,
		TRUE = true;

	function getViewport() {
		var width, height;
		// the more standards compliant browsers (mozilla/netscape/opera/IE7)
		// use window.innerWidth and window.innerHeight
		if (typeof window.innerWidth !== 'undefined') {
			width = window.innerWidth;
			height = window.innerHeight;
		} else if (typeof document.documentElement !== 'undefined'
				&& typeof document.documentElement.clientWidth !== 'undefined'
				&& document.documentElement.clientWidth !== 0) { // IE6
			width = document.documentElement.clientWidth;
			height = document.documentElement.clientHeight;
		} else { // older versions of IE
			width = document.body.clientWidth;
			height = document.body.clientHeight;
		}
		return {
			"width" : parseInt(width, 10),
			"height" : parseInt(height, 10)
		};
	}

	function getScroll() {
		var scrollLeft, scrollTop;
		if (typeof window.pageYOffset !== 'undefined') { // Netscape
			scrollTop = window.pageYOffset;
			scrollLeft = window.pageXOffset;
		} else {
			var B = document.body, // IE 'quirks', DOM compliant
			D = document.documentElement; // IE with doctype
			D = (D.clientHeight) ? D : B;
			scrollTop = D.scrollTop;
			scrollLeft = D.scrollLeft;
		}
		return {
			"top" : parseInt(scrollTop, 10),
			"left" : parseInt(scrollLeft, 10)
		};
	}

	function getDocHeight() {
		return Math.max(Math.max(document.body.scrollHeight,
				document.documentElement.scrollHeight), Math.max(
				document.body.offsetHeight,
				document.documentElement.offsetHeight), Math.max(
				document.body.clientHeight,
				document.documentElement.clientHeight));
	}

	function getDocWidth() {
		return Math.max(Math.max(document.body.scrollWidth,
				document.documentElement.scrollWidth), Math
				.max(document.body.offsetWidth,
						document.documentElement.offsetWidth), Math
				.max(document.body.clientWidth,
						document.documentElement.clientWidth));
	}

	function Overlay() {
		this.curInst = null;
		this.data = {};
		this._defaults = {
			width : 320,
			height : 240,
			autoOpen : false,
			modal : false,
			header : true,
			footer : true,
			resizable : false,
			draggable : false,
			maximized : false, // new
			minimized : false, // new
			minWidth : 150,
			minHeight : 150,
			maxWidth : false,
			maxHeight : false,
			toolbar : {
				minimize : true,
				maximize : true,
				close : true
			},
			buttons : {
				'Ok' : function() {
					$(this).zinoOverlay("close");
				}
			},
			beforeOpen : null,
			beforeClose : null,
			//callbacks
			open : null,	
			close : null,
			minimize : null,
			maximize : null,
			restore : null,
			drag : null,
			dragstart : null,
			dragend : null,
			resize : null,
			resizestart : null,
			resizeend : null
		};
		
		this.body = document.getElementsByTagName("body")[0];
		this.html = document.getElementsByTagName("html")[0];
		if (this.body) {
			this.overflow_body = this.body.style.overflow;
		}
		this.overflow_html = this.html.style.overflow;
	}
	Overlay.prototype = {
		_attachOverlay : function(target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);
			
			var $container, 
				$wrapper, 
				$holder, 
				$header, 
				$header_title, 
				$header_toolbar, 
				$content, 
				$footer, 
				viewport = getViewport(), 
				scroller = getScroll(), 
				$btn;
			
			$.extend(inst.settings, self._defaults, settings);
			
			$target
				.bind("overlayopen", function (event, ui) {
					if (inst.settings.open !== null) {
						inst.settings.open.call(target, event, ui);
					}
				})
				.bind("overlayclose", function (event, ui) {
					if (inst.settings.close !== null) {
						inst.settings.close.call(target, event, ui);
					}
				})
				.bind("overlayminimize", function (event, ui) {
					if (inst.settings.minimize !== null) {
						inst.settings.minimize.call(target, event, ui);
					}
				})
				.bind("overlaymaximize", function (event, ui) {
					if (inst.settings.maximize !== null) {
						inst.settings.maximize.call(target, event, ui);
					}
				})
				.bind("overlayrestore", function (event, ui) {
					if (inst.settings.restore !== null) {
						inst.settings.restore.call(target, event, ui);
					}
				})
				.bind("overlaydrag", function (event, ui) {
					if (inst.settings.drag !== null) {
						inst.settings.drag.call(target, event, ui);
					}
				})
				.bind("overlaydragstart", function (event, ui) {
					if (inst.settings.dragstart !== null) {
						inst.settings.dragstart.call(target, event, ui);
					}
				})
				.bind("overlaydragend", function (event, ui) {
					if (inst.settings.dragend !== null) {
						inst.settings.dragend.call(target, event, ui);
					}
				})
				.bind("overlayresize", function (event, ui) {
					if (inst.settings.resize !== null) {
						inst.settings.resize.call(target, event, ui);
					}
				})
				.bind("overlayresizestart", function (event, ui) {
					if (inst.settings.resizestart !== null) {
						inst.settings.resizestart.call(target, event, ui);
					}
				})
				.bind("overlayresizeend", function (event, ui) {
					if (inst.settings.resizeend !== null) {
						inst.settings.resizeend.call(target, event, ui);
					}
				});
			
			$container = $("<div>").attr({
				id: [ prefix, "container-", inst.uid ].join("")
			}).addClass([ prefix, "container" ].join(""));
			
			$wrapper = $("<div>").attr({
				id: [ prefix, "wrapper-", inst.uid ].join("")
			}).addClass([ prefix, "wrapper" ].join(""));
			
			$holder = $("<div>").attr({
				id: [ prefix, "holder-", inst.uid ].join(""),
				role: "dialog"
			}).addClass([ prefix, "holder" ].join(""));
			
			$header = $("<div>").attr({
				id: [ prefix, "header-", inst.uid ].join("")
			}).addClass([ prefix, "header zui-unselectable" ].join(""));
			
			$header_title = $("<div>")
				.addClass("zui-overlay-header-title")
				.html($target.attr("title"))
				.appendTo($header);
			$header_toolbar = $("<div>").addClass("zui-overlay-header-toolbar");
			
			$content = $("<div>").attr({
				id: [ prefix, "content-", inst.uid ].join("")
			}).addClass([ prefix, "content" ].join("")).html($target.html());
			
			$footer = $("<div>").attr({
				id: [ prefix, "footer-", inst.uid ].join("")
			}).addClass([ prefix, "footer" ].join("")).append( $("<div>").addClass("zui-overlay-footer-inner") );
			
			for ( var key in inst.settings.buttons) {
				if (inst.settings.buttons.hasOwnProperty(key)) {
					$btn = $("<input>").attr({
						"type": "button"
					}).val(key).click(function (k, t) {
						return function(e) {
							inst.settings.buttons[k].apply(t, [ this ]);
						};
					}(key, target)).appendTo($footer.find(".zui-overlay-footer-inner"));
					if ($.fn.zinoButton !== undefined) {
						$btn.zinoButton();
					}
				}
			}

			if (inst.settings.toolbar.minimize) {
				var $icon_minimize = $("<span>").addClass([ prefix, "toolbar-icon ", prefix, "minimize" ].join(""));
				var $icon_restore = $("<span>").addClass([ prefix, "toolbar-icon ", prefix, "restore" ].join(""));
				var $anchor_minimize = $("<a>")
					.addClass([ prefix, "toolbar-link" ].join(""))
					.attr({
						"href": "#"
					})
					.click(function(e) {
						if (e && e.preventDefault) {
							e.preventDefault();
						}
						self._minimizeOverlay.call(self, target, this);
						return false;
					})
					.append($icon_minimize)
					.appendTo($header_toolbar);
				var $anchor_restore = $("<a>")
					.addClass([ prefix, "toolbar-link" ].join(""))
					.attr({
						"href": "#"
					})
					.hide()
					.click(function(e) {
						if (e && e.preventDefault) {
							e.preventDefault();
						}
						self._restoreOverlay.call(self, target, this);
						return false;
					})
					.append($icon_restore)
					.appendTo($header_toolbar);
			}
			if (inst.settings.toolbar.maximize) {
				var $icon_maximize = $("<span>")
					.addClass([ prefix, "toolbar-icon ", prefix, "maximize" ].join(""));
				var $anchor_maximize = $("<a>")
					.attr({
						"href": "#"
					})
					.addClass([ prefix, "toolbar-link" ].join(""))
					.click(function(e) {
						if (e && e.preventDefault) {
							e.preventDefault();
						}
						self._maximizeOverlay.call(self, target, this);
						return false;
					})
					.append($icon_maximize)
					.appendTo($header_toolbar);
			}
			if (inst.settings.toolbar.close) {
				var $icon_close = $("<span>").addClass([ prefix, "toolbar-icon ", prefix, "close" ].join(""));
				var $anchor_close = $("<a>").addClass([ prefix, "toolbar-link" ].join("")).attr({
					"href": "#"
				}).click(function (e) {
					if (e && e.preventDefault) {
						e.preventDefault();
					}
					self._closeOverlay.call(self, target, this);
					return false;
				}).append($icon_close).appendTo($header_toolbar);
			}
			$header_toolbar.appendTo($header);
			$header.dblclick(function(e) {
				if (!inst.settings.maximized) {
					self._maximizeOverlay.call(self, target, this);
				} else {
					self._restoreOverlay.call(self, target, this);
				}
			});

			$holder.css({
				"width": inst.settings.width + "px",
				"height": inst.settings.height + "px"
			});
			if (!inst.settings.draggable && !inst.settings.resizable) {
				$holder.css({
					"webkitTransitionProperty": "top, left",
					"webkitTransitionDuration": "1000ms"
				});
				$(window).bind("resize.overlay", function () {
					self._onWindowResize.call(self, target);
				}).bind("scroll.overlay", function () {
					self._onWindowResize.call(self, target);
				});
			}

			if (inst.settings.header) {
				$header.appendTo($holder);
			} else {
				$content.css("top", 0);
			}
			$content.appendTo($holder);
			if (inst.settings.footer) {
				$footer.appendTo($holder);
			} else {
				$content.css("bottom", 0);
			}

			$wrapper.appendTo($container);
			$holder.appendTo($container);
			$container.appendTo(document.body);
			
			if (inst.settings.draggable) {
				if ($.fn.zinoDraggable !== undefined) {
					//$header.zinoDraggable({
						//element : $holder,
					$holder.zinoDraggable({
						handle: $header,
						lowerBound: null,
						upperBound: null,
						start: function(event, ui) {
							$target.trigger("overlaydragstart", {
								event: event,
								ui: ui
							});
						},
						drag: function(event, ui) {
							$target.trigger("overlaydrag", {
								event: event,
								ui: ui
							});
						},
						end: function(event, ui) {
							$target.trigger("overlaydragend", {
								event: event,
								ui: ui
							});
						},
						attachLater : false
					});
					$header.css({
						"cursor": "move"
					});
				
				} else {
					throw new Error("zinoDraggable is missing.");
				}
			}

			$(document).bind("keydown.overlay", function (e) {
				var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
				if (key === 27) {
					if (self.curInst) {
						self.curInst._closeOverlay.call(self, target);
					}
				}
			});
			inst.$wrapper = $wrapper;
			inst.$holder = $holder;
			inst.$container = $container;
			$.data(target, PROP_NAME, inst);
			
			if (inst.settings.autoOpen) {
				self._openOverlay.call(self, target);
			}
			
			if (inst.settings.resizable) {
				if ($.fn.zinoResizable !== undefined) {
					$holder.zinoResizable({
						resize: function() {
							$target.trigger("overlayresize", {});
						},
						start: function() {
							$target.trigger("overlayresizestart", {});
						},
						end: function() {
							$target.trigger("overlayresizeend", {});
						},
						maxWidth: inst.settings.maxWidth,
						maxHeight: inst.settings.maxHeight,
						minWidth: inst.settings.minWidth,
						minHeight: inst.settings.minHeight
					});
				} else {
					throw new Error("zinoResizable is missing.");
				}
			}
		},
		_setPosition : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var scroller = getScroll(), 
				viewport = getViewport();
			$("#zui-overlay-holder-" + inst.uid).css({
				"top": [ scroller.top + (viewport.height - inst.settings.height) / 2, "px" ].join(""),
				"left": [ scroller.left + (viewport.width - inst.settings.width) / 2, "px" ].join("")
			});
		},
		_setSize : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var scroller = getScroll(), 
				viewport = getViewport();
			$("#zui-overlay-container-" + inst.uid).css({
				"height": [ scroller.top + viewport.height, "px" ].join(""),
				"width": [ scroller.left + viewport.width, "px" ].join("")
			});
			$("#zui-overlay-wrapper-" + inst.uid).css({
				"height": [ getDocHeight(), "px" ].join(""),
				"width": [ getDocWidth(), "px" ].join("")
			});
		},
		_onWindowResize : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (!inst.isOpen) {
				return;
			}
			this._setPosition(target);
			this._setSize(target);
		},
		_showResizableHandles : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(".zui-resizable-handle", inst.$container).show();
		},
		_hideResizableHandles : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(".zui-resizable-handle", inst.$container).hide();
		},
		_openOverlay : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this,
				$target = $(target);
			self.curInst = self;

			if (inst.settings.beforeOpen !== null && inst.settings.beforeOpen.call(target, inst) === false) {
				return self;
			}
			self._setSize(target);
			self._setPosition(target);
			$("#zui-overlay-wrapper-" + inst.uid).css({
				"display": (inst.settings.modal ? "block" : "none")
			});
			$("#zui-overlay-container-" + inst.uid).show();
			$(target).trigger("overlayopen", {
				
			});
			inst.isOpen = true;
			$.data(target, PROP_NAME, inst);
		},
		_closeOverlay: function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (inst.settings.beforeClose !== null && inst.settings.beforeClose.call(target, inst) === false) {
				return this;
			}
			$("#zui-overlay-container-" + inst.uid).hide();
			$(target).trigger("overlayclose", {
				
			});
			if (this.body) {
				this.body.style.overflow = this.overflow_body;
			}
			if (this.html) {
				this.html.style.overflow = this.overflow_html;
			}
			this.curInst = null;
			inst.isOpen = false;
			$.data(target, PROP_NAME, inst);
		},
		_minimizeOverlay: function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (!inst.isOpen) {
				return;
			}
			var header = document.getElementById("zui-overlay-header-" + inst.uid),
				height = header.offsetHeight;
			if (!inst.settings.maximized) {
				this.last_width = inst.settings.width;
				this.last_height = inst.settings.height;
			}
			if (inst.settings.resizable) {
				this._hideResizableHandles.call(this, target);
			}

			if (this.body) {
				this.body.style.overflow = this.overflow_body;
			}
			if (this.html) {
				this.html.style.overflow = this.overflow_html;
			}

			$("#zui-overlay-content-" + inst.uid).hide();
			if (inst.settings.footer) {
				$("#zui-overlay-footer-" + inst.uid).hide();
			}
			$(".zui-overlay-minimize", header).parent().hide();
			$(".zui-overlay-maximize", header).parent().show();
			$(".zui-overlay-restore", header).parent().show();
			$("#zui-overlay-holder-" + inst.uid).css({
				"height": height + "px"
			});
			inst.settings.maximized = false;
			inst.settings.minimized = true;
			$(target).trigger("overlayminimize", {
				
			});
			$.data(target, PROP_NAME, inst);
		},
		_maximizeOverlay : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (!inst.isOpen) {
				return;
			}
			var viewport = getViewport(), 
				scroll = getScroll(),
				header = document.getElementById("zui-overlay-header-" + inst.uid);
			if (!inst.settings.minimized) {
				this.last_width = inst.settings.width;
				this.last_height = inst.settings.height;
			}
			inst.settings.width = viewport.width;
			inst.settings.height = viewport.height;
			$("#zui-overlay-holder-" + inst.uid).css({
				"height": viewport.height + "px",
				"width": viewport.width + "px"
			});
			inst.settings.maximized = true;
			inst.settings.minimized = false;
			$(".zui-overlay-minimize", header).parent().show();
			$(".zui-overlay-maximize", header).parent().hide();
			$(".zui-overlay-restore", header).parent().show();

			if (inst.settings.resizable) {
				this._hideResizableHandles(this, target);
			}
			if (this.body) {
				this.body.style.overflow = "hidden";
			}
			if (this.html) {
				this.html.style.overflow = "hidden";
			}

			$("#zui-overlay-content-" + inst.uid).show();
			if (inst.settings.footer) {
				$("#zui-overlay-footer-" + inst.uid).show();
			}
			$("#zui-overlay-holder-" + inst.uid).css({
				"top": scroll.top + "px",
				"left": scroll.left + "px"
			});
			$(target).trigger("overlaymaximize", {
				
			});
			$.data(target, PROP_NAME, inst);
		},
		_restoreOverlay : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (!inst.isOpen) {
				return;
			}
			var last_width = this.last_width, 
				last_height = this.last_height,
				header = document.getElementById("zui-overlay-header-" + inst.uid);

			if (inst.settings.minimized) {
				inst.settings.minimized = false;
			} else if (inst.settings.maximized) {
				inst.settings.maximized = false;
			} else {
				this.last_width = inst.settings.width;
				this.last_height = inst.settings.height;
			}

			if (inst.settings.resizable) {
				this._showResizableHandles.call(this, target);
			}

			inst.settings.width = last_width;
			inst.settings.height = last_height;

			if (this.body) {
				this.body.style.overflow = this.overflow_body;
			}
			if (this.html) {
				this.html.style.overflow = this.overflow_html;
			}

			$("#zui-overlay-holder-" + inst.uid).css({
				"width": last_width + "px",
				"height": last_height + "px"
			});
			$("#zui-overlay-content-" + inst.uid).show();
			if (inst.settings.footer) {
				$("#zui-overlay-footer-" + inst.uid).show();
			}
			$(".zui-overlay-minimize", header).parent().show();
			$(".zui-overlay-maximize", header).parent().show();
			$(".zui-overlay-restore", header).parent().hide();
			
			this._setPosition(target);
			$(target).trigger("overlayrestore", {
				
			});
			$.data(target, PROP_NAME, inst);
		},
		_newInst: function(target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 999999),
				isDisabled: FALSE,
				isOpen: FALSE,
				settings: {}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this overlay';
			}
		}
	};
	
	$.fn.zinoOverlay = function (options) {
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoOverlay['_' + options + 'Overlay'].apply($.zinoOverlay, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoOverlay['_' + options + 'Overlay'].apply($.zinoOverlay, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoOverlay['_' + options + 'Overlay'].apply($.zinoOverlay, [this].concat(otherArgs)) :
				$.zinoOverlay._attachOverlay(this, options);
		});
	};
	$.zinoOverlay = new Overlay;
	$.zinoOverlay.version = "1.5.1";
})(jQuery);