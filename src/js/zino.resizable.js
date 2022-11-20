/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'resizable',
		FALSE = false,
		TRUE = true;

	function Resizable() {
		this._defaults = {
			maxWidth : null,
			maxHeight : null,
			minWidth : 10,
			minHeight : 10,
			resize : null,
			start : null,
			end : null
		};
		this._internal = {
			direction: null,
			opts: null,
			listening : false,
			resizing : false,
			disposed : false,
			x : 0,
			y : 0
		};
	};
	Resizable.prototype = {
		_attachResizable: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				$parent = $target.parent(),
				$document = $(document),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);

			inst.internal.opts = {
				parentWidth: $parent.length > 0 ? $parent.outerWidth() : $document.width(),
				parentHeight: $parent.length > 0 ? $parent.outerHeight() : $document.height(),
				parentTop: $parent.length > 0 ? $parent.offset().top : 0,
				parentLeft: $parent.length > 0 ? $parent.offset().left : 0
			};
			
			$target.addClass("zui-resizable")
				.bind("resizablestart", function (event, ui) {
					if (inst.settings.start !== null) {
						inst.settings.start.call(target, event, ui);
					}
				})
				.bind("resizableresize", function (event, ui) {
					if (inst.settings.resize !== null) {
						inst.settings.resize.call(target, event, ui);
					}
				})
				.bind("resizableend", function (event, ui) {
					if (inst.settings.end !== null) {
						inst.settings.end.call(target, event, ui);
					}
				});
			$("<div>").addClass("zui-resizable-handle zui-resizable-n").appendTo($target);
			$("<div>").addClass("zui-resizable-handle zui-resizable-s").appendTo($target);
			$("<div>").addClass("zui-resizable-handle zui-resizable-e").appendTo($target);
			$("<div>").addClass("zui-resizable-handle zui-resizable-w").appendTo($target);
			$("<div>").addClass("zui-resizable-handle zui-resizable-ne").appendTo($target);
			$("<div>").addClass("zui-resizable-handle zui-resizable-nw").appendTo($target);
			$("<div>").addClass("zui-resizable-handle zui-resizable-se").appendTo($target);
			$("<div>").addClass("zui-resizable-handle zui-resizable-sw").appendTo($target);
			
			$.data(target, PROP_NAME, inst);
			this._startListening.call(this, target);
		},
		_resizeStart : function(target, eventObj) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var direction,
				$eTarget = $(eventObj.target),
				self = this;
			if (inst.internal.resizing || !inst.internal.listening
					|| inst.internal.disposed) {
				return;
			}
			inst.internal.resizing = true;

			if ($eTarget.hasClass("zui-resizable-n")) {
				direction = "n";
			} else if ($eTarget.hasClass("zui-resizable-e")) {
				direction = "e";
			} else if ($eTarget.hasClass("zui-resizable-s")) {
				direction = "s";
			} else if ($eTarget.hasClass("zui-resizable-w")) {
				direction = "w";
			} else if ($eTarget.hasClass("zui-resizable-ne")) {
				direction = "ne";
			} else if ($eTarget.hasClass("zui-resizable-nw")) {
				direction = "nw";
			} else if ($eTarget.hasClass("zui-resizable-se")) {
				direction = "se";
			} else if ($eTarget.hasClass("zui-resizable-sw")) {
				direction = "sw";
			}
			inst.internal.direction = direction;
			
			$(target).trigger("resizablestart", {});
			/*if (inst.settings.onStart != null) {
				inst.settings.onStart.call(target, eventObj, inst);
			}*/

			$(document).bind("mousemove.resizable", function(e) {
				self._resizeGo.call(self, target, e);
			});
			$(document).bind("mouseup.resizable", function(e) {
				self._resizeStopHook.call(self, target, e, this);
			});
			$.data(target, PROP_NAME, inst);
			
			if (eventObj.stopPropagation) {
				eventObj.stopPropagation();
			}
			if (eventObj.preventDefault) {
				eventObj.preventDefault();
			}
			return false;
		},
		_resizeGo : function(target, eventObj) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this,
				$target = $(target);
			if (!inst.internal.resizing || inst.internal.disposed) {
				return;
			}

			var newPos = zino.Position.getCursor(eventObj),
				offset = $target.offset(),
				diffX = newPos.X - offset.left, 
				diffY = newPos.Y - offset.top, 
				newWidth, 
				newHeight,
				newLeft,
				newTop;

			switch (inst.internal.direction) {
				case "n":
					newHeight = $target.height() - diffY;
					newTop = $target.position().top + diffY;
					if ((!inst.settings.maxHeight || newHeight < inst.settings.maxHeight) &&
							newHeight > inst.settings.minHeight && 
							newTop >= 0) {
						$target.css("height", newHeight + "px");
						$target.css("top", newTop + "px");
					}
					break;
				case "s":
					diffY -= $target.outerHeight();
					newHeight = $target.height() + diffY;
					if ((!inst.settings.maxHeight || newHeight < inst.settings.maxHeight) &&
							newHeight > inst.settings.minHeight && 
							offset.top + newHeight <= inst.internal.opts.parentHeight + inst.internal.opts.parentTop) {
						$target.css("height", newHeight + "px");
					}
					break;
				case "e":
					diffX -= $target.outerWidth();
					newWidth = $target.width() + diffX;
					if ((!inst.settings.maxWidth || newWidth < inst.settings.maxWidth) &&
							newWidth > inst.settings.minWidth && 
							offset.left + newWidth <= inst.internal.opts.parentWidth + inst.internal.opts.parentLeft) {
						$target.css("width", newWidth + "px");
					}
					break;
				case "w":
					newWidth = $target.width() - diffX;
					newLeft = $target.position().left + diffX;
					if ((!inst.settings.maxWidth || newWidth < inst.settings.maxWidth) &&
							newWidth > inst.settings.minWidth && 
							newLeft >= 0) {
						$target.css("left", newLeft + "px");
						$target.css("width", newWidth + "px");
					}
					break;
				case "ne":
					newHeight = $target.height() - diffY;
					newTop = $target.position().top + diffY;
					if ((!inst.settings.maxHeight || newHeight < inst.settings.maxHeight) &&
							newHeight > inst.settings.minHeight && 
							newTop >= 0) {
						$target.css("height", newHeight + "px");
						$target.css("top", newTop + "px");
					}
					diffX -= $target.outerWidth();
					newWidth = $target.width() + diffX;
					if ((!inst.settings.maxWidth || newWidth < inst.settings.maxWidth) &&
							newWidth > inst.settings.minWidth && 
							newWidth <= inst.internal.opts.parentWidth &&
							offset.left + newWidth <= inst.internal.opts.parentWidth + inst.internal.opts.parentLeft) {
						$target.css("width", newWidth + "px");
					}
					break;
				case "nw":
					newHeight = $target.height() - diffY;
					newTop = $target.position().top + diffY;
					if ((!inst.settings.maxHeight || newHeight < inst.settings.maxHeight) &&
							newHeight > inst.settings.minHeight && 
							newTop >= 0) {
						$target.css("height", newHeight + "px");
						$target.css("top", newTop + "px");
					}
					newWidth = $target.width() - diffX;
					newLeft = $target.position().left + diffX;
					if ((!inst.settings.maxWidth || newWidth < inst.settings.maxWidth) &&
							newWidth > inst.settings.minWidth && 
							newLeft >= 0) {
						$target.css("width", newWidth + "px");
						$target.css("left", newLeft + "px");
					}
					break;
				case "se":
					diffY -= $target.outerHeight();
					newHeight = $target.height() + diffY;
					if ((!inst.settings.maxHeight || newHeight < inst.settings.maxHeight) &&
							newHeight > inst.settings.minHeight && 
							offset.top + newHeight <= inst.internal.opts.parentHeight + inst.internal.opts.parentTop) {
						$target.css("height", newHeight + "px");
					}
					diffX -= $target.outerWidth();
					newWidth = $target.width() + diffX;
					if ((!inst.settings.maxWidth || newWidth < inst.settings.maxWidth) &&
							newWidth > inst.settings.minWidth && 
							offset.left + newWidth <= inst.internal.opts.parentWidth + inst.internal.opts.parentLeft) {
						$target.css("width", newWidth + "px");
					}
					break;
				case "sw":
					diffY -= $target.outerHeight();
					newHeight = $target.height() + diffY;
					if ((!inst.settings.maxHeight || newHeight < inst.settings.maxHeight) &&
							newHeight > inst.settings.minHeight &&
							offset.top + newHeight <= inst.internal.opts.parentHeight + inst.internal.opts.parentTop) {
						$target.css("height", newHeight + "px");
					}
					newWidth = $target.width() - diffX;
					newLeft = $target.position().left + diffX;
					if ((!inst.settings.maxWidth || newWidth < inst.settings.maxWidth) &&
							newWidth > inst.settings.minWidth && 
							newLeft >= 0) {
						$target.css("width", newWidth + "px");
						$target.css("left", newLeft + "px");
					}
					break;
			}
			$target.trigger("resizableresize", {});
			/*if (inst.settings.onResize != null) {
				inst.settings.onResize.call(target, eventObj, inst);
			}*/
			$.data(target, PROP_NAME, inst);

			if (eventObj.stopPropagation) {
				eventObj.stopPropagation();
			}
			if (eventObj.preventDefault) {
				eventObj.preventDefault();
			}
			return false;
		},
		_resizeStopHook : function(target, eventObj) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this._resizeStop.call(this, target, eventObj);
			if (eventObj.stopPropagation) {
				eventObj.stopPropagation();
			}
			if (eventObj.preventDefault) {
				eventObj.preventDefault();
			}
			return false;
		},
		_resizeStop : function(target, eventObj) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this;
			if (!inst.internal.resizing || inst.internal.disposed) {
				return;
			}
			$(document).unbind("mousemove.resizable", function(e) {
				self._resizeGo.call(self, target, e);
			});
			$(document).unbind("mouseup.resizable", function(e) {
				self._resizeStopHook.call(self, target, e, this);
			});
			$(target).trigger("resizableend", {});
			/*if (inst.settings.onEnd != null) {
				inst.settings.onEnd.call(target, eventObj, inst);
			}*/
			inst.internal.resizing = false;
			$.data(target, PROP_NAME, inst);
		},
		_destroyResizable : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (inst.internal.disposed) {
				return;
			}
			$(target).removeClass("zui-resizable");
			$(".zui-resizable-handle", target).remove();
			this._stopListening.call(this, target, true);
			$.data(target, PROP_NAME, null);
		},
		_disableResizable: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (inst.isDisabled) {
				return;
			}
			inst.isDisabled = TRUE;
			this._stopListening.call(this, target, true);
			$.data(target, PROP_NAME, inst);
		},
		_enableResizable: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (!inst.isDisabled) {
				return;
			}
			inst.isDisabled = FALSE;
			this._startListening.call(this, target);
			$.data(target, PROP_NAME, inst);
		},
		_startListening : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this;
			if (inst.internal.listening || inst.internal.disposed) {
				return;
			}
			inst.internal.listening = true;
			$(".zui-resizable-handle", target).bind("mousedown.resizable", function(e) {
				self._resizeStart.call(self, target, e, this);
			});
			$.data(target, PROP_NAME, inst);
		},
		_stopListening : function(target, stopCurrentResizing) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this;
			if (!inst.internal.listening || inst.internal.disposed) {
				return;
			}
			$(".zui-resizable-handle", target).unbind("mousedown.resizable", function(e) {
				self._resizeStart.call(self, target, e, this);
			});
			inst.internal.listening = false;

			if (stopCurrentResizing && inst.internal.resizing) {
				self._resizeStop.call(self, target);
			}
			$.data(target, PROP_NAME, inst);
		},
		_isResizing : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			return inst.internal.resizing;
		},
		_isListening : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			return inst.internal.listening;
		},
		_isDisposed : function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			return inst.internal.disposed;
		},
		_newInst: function(target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 99999999),
				isDisabled: FALSE,
				settings: {},
				internal: {}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this resizable';
			}
		}
	};

	$.fn.zinoResizable = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoResizable['_' + options + 'Resizable'].apply($.zinoResizable, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoResizable['_' + options + 'Resizable'].apply($.zinoResizable, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoResizable['_' + options + 'Resizable'].apply($.zinoResizable, [this].concat(otherArgs)) :
				$.zinoResizable._attachResizable(this, options);
		});
	};
	
	$.zinoResizable = new Resizable();
	$.zinoResizable.version = "1.5.1";
})(jQuery);