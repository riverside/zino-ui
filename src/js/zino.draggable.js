/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'draggable',
		FALSE = false,
		TRUE = true;

	function Draggable() {
		this._defaults = {
			handle: null, 
			lowerBound: null, 
			upperBound: null, 
			attachLater: false,
			//Callbacks
			start: null, 
			drag: null, 
			end: null,
			enable: null,
			disable: null
		};
		
		this._internal = {
			cursorStartPos: null,
			elementStartPos: null,
			dragging: false,
			listening: false,
			disposed: false
		};
	}
	
	Draggable.prototype = {
		_attachDraggable: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			$.extend(inst.internal, self._internal);
			
			if (inst.settings.lowerBound !== null && zino.Position !== undefined) {
				inst.settings.lowerBound = new zino.Position(inst.settings.lowerBound[0], inst.settings.lowerBound[1]);
			}
			if (inst.settings.upperBound !== null && zino.Position !== undefined) {
				inst.settings.upperBound = new zino.Position(inst.settings.upperBound[0], inst.settings.upperBound[1]);
			}
			
			if (typeof inst.settings.handle == "string" && inst.settings.handle.length > 0) {
				inst.settings.handle = $(inst.settings.handle, target);
			}
			inst.$handle = inst.settings.handle !== null ? inst.settings.handle : $target;
			if (inst.settings.lowerBound != null && inst.settings.upperBound != null) {
				var temp = inst.settings.lowerBound.min(inst.settings.upperBound);
				inst.settings.upperBound = inst.settings.lowerBound.max(inst.settings.upperBound);
				inst.settings.lowerBound = temp;
			}
			$target
				.addClass("zui-draggable")
				.css("position", "absolute") //relative //FIXME
				.bind("draggablestart", function (event, ui) {
					if (inst.settings.start !== null) {
						inst.settings.start.call(target, event, ui);
					}
				})
				.bind("draggabledrag", function (event, ui) {
					if (inst.settings.drag !== null) {
						inst.settings.drag.call(target, event, ui);
					}
				})
				.bind("draggableend", function (event, ui) {
					if (inst.settings.end !== null) {
						inst.settings.end.call(target, event, ui);
					}
				})
				.bind("draggableenable", function (event, ui) {
					if (inst.settings.enable !== null) {
						inst.settings.enable.call(target, event, ui);
					}
				})
				.bind("draggabledisable", function (event, ui) {
					if (inst.settings.disable !== null) {
						inst.settings.disable.call(target, event, ui);
					}
				})
			;
			$.data(target, PROP_NAME, inst);
			if (!inst.settings.attachLater) {
				self._startListening.call(self, target);
			}
		},
		_enableDraggable: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (!inst.isDisabled) {
				return;
			}
			inst.isDisabled = FALSE;
			this._startListening.call(this, target);
			$(target).trigger("draggableenable", {});
			$.data(target, PROP_NAME, inst);
		},
		_disableDraggable: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (inst.isDisabled) {
				return;
			}
			inst.isDisabled = TRUE;
			this._stopListening.call(this, target, true);
			$(target).trigger("draggabledisable", {});
			$.data(target, PROP_NAME, inst);
		},
		_dragStart: function(target, eventObj) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this,
				$target = $(target);
			if (inst.internal.dragging || !inst.internal.listening || inst.internal.disposed) {
				return;
			}
			inst.internal.dragging = true;

			$target.trigger("draggablestart", {
				handle: inst.$handle.get(0)
			});
			inst.internal.cursorStartPos = zino.Position.getCursor(eventObj);

			inst.internal.elementStartPos = new zino.Position(parseInt($target.css("left")),
					parseInt($target.css("top")));

			inst.internal.elementStartPos = inst.internal.elementStartPos.check();

			$target.focus();
			
			$(document).bind("mousemove.draggable", function(e) {
				self._dragGo.call(self, target, e);
			}).bind("mouseup.draggable", function (e) {
				self._dragStopHook.call(self, target, e);
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
		_dragGo: function (target, eventObj) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this,
				$target = $(target);
			if (!inst.internal.dragging || inst.internal.disposed) {
				return;
			}
			var newPos = zino.Position.getCursor(eventObj);
			newPos = newPos.add(inst.internal.elementStartPos).subtract(inst.internal.cursorStartPos);
			newPos = newPos.bound(inst.settings.lowerBound, inst.settings.upperBound)
			newPos.apply($target);
			$target.trigger("draggabledrag", {
				handle: inst.$handle.get(0)
			});
			if (eventObj.stopPropagation) {
				eventObj.stopPropagation();
			}
			if (eventObj.preventDefault) {
				eventObj.preventDefault();
			}
			return false;
		},
		_dragStopHook: function (target, eventObj) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this._dragStop.call(this, target, eventObj);
			if (eventObj.stopPropagation) {
				eventObj.stopPropagation();
			}
			if (eventObj.preventDefault) {
				eventObj.preventDefault();
			}
			return false;
		},
		_dragStop: function (target, eventObj) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this,
				$target = $(target);
			if (!inst.internal.dragging || inst.internal.disposed) {
				return;
			}
			$(document).unbind("mousemove.draggable", function (e) {
				self._dragGo.call(self, target, e);
			});
			$(document).unbind("mouseup.draggable", function (e) {
				self._dragStopHook.call(self, target, e);
			});
			inst.internal.cursorStartPos = null;
			inst.internal.elementStartPos = null;
			$target.trigger("draggableend", {
				handle: inst.$handle.get(0)
			});
			inst.internal.dragging = false;
			$.data(target, PROP_NAME, inst);
		},
		_destroyDraggable: function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (inst.internal.disposed) {
				return;
			}
			$(target).removeClass("zui-draggable");
			this._stopListening.call(this, target, true);
			$.data(target, PROP_NAME, null);
		},
		_startListening: function(target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this;
			if (inst.internal.listening || inst.internal.disposed) {
				return;
			}
			inst.internal.listening = true;
			inst.$handle.bind("mousedown.draggable", function (e) {
				self._dragStart.call(self, target, e);
			});
			$.data(target, PROP_NAME, inst);
		},
		_stopListening: function(target, stopCurrentDragging) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this;
			if (!inst.internal.listening || inst.internal.disposed) {
				return;
			}
			inst.$handle.unbind("mousedown.draggable", function (e) {
				self._dragStart.call(self, target, e);
			});
			inst.internal.listening = false;

			if (stopCurrentDragging && inst.internal.dragging) {
				self._dragStop.call(self, target);
			}
			$.data(target, PROP_NAME, inst);
		},
		_isDragging: function(target) {
			if (!target) {
				return FALSE;
			}
			var inst = this._getInst(target);
			return inst.internal.dragging;
		},
		_isListening: function(target) {
			if (!target) {
				return FALSE;
			}
			var inst = this._getInst(target);
			return inst.internal.listening;
		},
		_isDisposed: function(target) {
			if (!target) {
				return FALSE;
			}
			var inst = this._getInst(target);
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
				throw 'Missing instance data for this draggable';
			}
		}
	};

	$.fn.zinoDraggable = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoDraggable['_' + options + 'Draggable'].apply($.zinoDraggable, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoDraggable['_' + options + 'Draggable'].apply($.zinoDraggable, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoDraggable['_' + options + 'Draggable'].apply($.zinoDraggable, [this].concat(otherArgs)) :
				$.zinoDraggable._attachDraggable(this, options);
		});
	};
	
	$.zinoDraggable = new Draggable();
	$.zinoDraggable.version = "1.5";
})(jQuery);