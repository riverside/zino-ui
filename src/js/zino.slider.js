/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'slider',
		FALSE = false,
		TRUE = true;

	function Slider() {
		this._defaults = {
			range: false,
			bounds: [0, 100],
			vertical: false,
			height: 320,
			width: 320,
			minValue: 0,
			maxValue: 100					
		};
		this._events = {
			slide: null,
			start: null,
			stop: null,
			enable: null,
			disable: null
		};
		this.keys = {
			backspace: 8,
			tab: 9,
			enter: 13,
			escape: 27,
			space: 32,
			pageup: 33,
			pagedown: 34,
			end: 35,
			home: 36,
			left: 37,
			up: 38,
			right: 39,
			down: 40
		};
	}
	
	Slider.prototype = {
		_attachSlider: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $a1, $a2,
				$target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, self._events, settings);
			inst.settings.offset = (8 / inst.settings.width) * 100;
			if (inst.settings.range) {
				$a1 = $("<a>", {
					"href": "#",
					"role": "slider",
					"aria-valuemax" : inst.settings.maxValue,
					"aria-valuemin" : inst.settings.minValue,
					"aria-valuenow" : inst.settings.bounds[0],
					"aria-valuetext" : inst.settings.bounds[0],
					"aria-invalid" : "false"
				}).addClass("zui-slider-handle");
			}
			$a2 = $("<a>", {
				"href": "#",
				"role": "slider",
				"aria-valuemax" : inst.settings.maxValue,
				"aria-valuemin" : inst.settings.minValue,
				"aria-valuenow" : inst.settings.bounds[1],
				"aria-valuetext" : inst.settings.bounds[1],
				"aria-invalid" : "false"
			}).addClass("zui-slider-handle");
			
			$target.addClass("zui-slider");
			var $sliderRange = $("<div>").addClass("zui-slider-range");
			
			if (!inst.settings.vertical) {
				$target.css({
					"width": inst.settings.width + "px"
				});
				var rght,
					rIndex = 0,
					lft = 0,
					wdth = 100;

				if (inst.settings.range) {
					lft = Math.ceil((inst.settings.bounds[0] / inst.settings.maxValue) * 100);
					$a1.addClass("zui-slider-left").css({
						"left": Math.ceil(((inst.settings.bounds[0] / inst.settings.maxValue) * 100) - inst.settings.offset) + "%"
					});
					inst.data.leftX = inst.settings.bounds[0];
					rIndex = 1;
				}
				
				rght = Math.ceil((inst.settings.bounds[rIndex] / inst.settings.maxValue) * 100);
				$a2.addClass("zui-slider-right").css({
					"left": Math.ceil(((inst.settings.bounds[rIndex] / inst.settings.maxValue) * 100) - inst.settings.offset) + "%"
				});
				inst.data.rightX = inst.settings.bounds[rIndex];
				wdth = rght - lft;
				
				$sliderRange.css({
					"left": lft + "%",
					"width": wdth + "%"
				});
			} else {
				$target.css({
					"height": inst.settings.height + "px"
				}).addClass("zui-slider-vertical");
				var bttm,
					bIndex = 0,
					tp = 0,
					hght = 100;
				
				if (inst.settings.range) {
					tp = Math.ceil((inst.settings.bounds[0] / inst.settings.maxValue) * 100);
					$a1.addClass("zui-slider-up").css({
						"top": tp + "%"
					});
					inst.data.upY = inst.settings.bounds[0];
					bIndex = 1;
				}

				bttm = Math.ceil((inst.settings.bounds[bIndex] / inst.settings.maxValue) * 100);
				$a2.addClass("zui-slider-down").css({
					"top": bttm + "%"
				});
				inst.data.downY = inst.settings.bounds[bIndex];
				hght = bttm - tp;

				$sliderRange.css({
					"top": tp + "%",
					"height": hght + "%"
				});
			}

			$sliderRange.appendTo(target);
			$("<div>")
				.addClass("zui-slider-scale")
				.appendTo(target);
			
			if (inst.settings.range) {
				$a1.appendTo(target);
			}
			$a2.appendTo(target);

			//--------FIXME---
			var lowObj, upObj;
			if (inst.settings.vertical) {
				lowObj = [0, -8];
				upObj = [0, inst.settings.height - 8];
			} else {
				lowObj = [-8, 0];
				upObj = [inst.settings.width - 8, 0];
			}
			$(".zui-slider-handle", $target).zinoDraggable({
				lowerBound : lowObj,
				upperBound : upObj,
				start : function(event, ui) {
					inst.data.sliding = true;
					var handle = ui.handle,
						$handle = $(handle);

					if ($handle.hasClass("zui-slider-left")) {
						inst.data.key = "leftX";
						inst.data.opp = "rightX";
					} else if ($handle.hasClass("zui-slider-right")) {
						inst.data.key = "rightX";
						inst.data.opp = "leftX";
					} else if ($handle.hasClass("zui-slider-up")) {
						inst.data.key = "upY";
						inst.data.opp = "downY";
					} else if ($handle.hasClass("zui-slider-down")) {
						inst.data.key = "downY";
						inst.data.opp = "upY";
					}
					$target.trigger("sliderstart", {
						
					});
					$(handle).addClass("zui-slider-handle-active");
				},
				drag : function(event, ui) {
					self._handlePosition.call(self, event, target, ui.handle);
				},
				end : function(event, ui) {
					self._handleStop.call(self, event, ui.handle);
					
					inst.data.sliding = false;
					$(target).trigger("sliderstop", {
						
					});
					$.data(target, PROP_NAME, inst);
					/*if (inst.settings.onDragEnd !== null) {
						inst.settings.onDragEnd.apply(self, arguments);
					} else {
						return null;
					}*/
				},
				attachLater : false
			}).bind("focus.slider", function (e) {
				$(this).addClass("zui-slider-handle-focus");
			}).bind("blur.slider", function (e) {
				$(this).removeClass("zui-slider-handle-focus");
			}).bind("keydown.slider", function (e) {
				
			}).bind("keypress.slider", function (e) {
				if (e.ctrlKey || e.shiftKey || e.altKey) {
					return true;
				}

				switch (e.keyCode) {
					case self.keys.home:
					case self.keys.pageup:
					case self.keys.end:
					case self.keys.pagedown:
					case self.keys.left:
					case self.keys.up:
					case self.keys.right:
					case self.keys.down:
						e.stopPropagation();
						return false;
						break;
				}
				return true;
			});
			//--------FIXME---
			
			$target.on("click.slider", ".zui-slider-handle", function (e) {
				if (e && e.preventDefault) {
					e.preventDefault();
				}
				//console.log("TODO");
				return false;
			}).bind("sliderstart", function (event, ui) {
				if (inst.settings.start !== null) {
					inst.settings.start.call(target, event, ui);
				}
			}).bind("sliderslide", function (event, ui) {
				if (inst.settings.slide !== null) {
					inst.settings.slide.call(target, event, ui);
				}
			}).bind("sliderstop", function (event, ui) {
				if (inst.settings.stop !== null) {
					inst.settings.stop.call(target, event, ui);
				}
			}).bind("sliderenable", function (event, ui) {
				if (inst.settings.enable !== null) {
					inst.settings.enable.call(target, event, ui);
				}
			}).bind("sliderdisable", function (event, ui) {
				if (inst.settings.disable !== null) {
					inst.settings.disable.call(target, event, ui);
				}
			}).on("click.slider", target, function (e) {
				/*console.log(e.pageX, e.pageY);
				if (inst.settings.range) {
					self._valuesSlider.call(self, target, index, value);
				} else {
					self._valueSlider.call(self, target, value);
				}*/
			});

			$.data(target, PROP_NAME, inst);
		},
		_destroySlider: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.removeClass("zui-slider")
				.find(".zui-slider-range").remove().end()
				.find(".zui-slider-scale").remove().end()
				.find(".zui-slider-handle").remove().end()
				.removeAttr("aria-disabled")
				.removeClass("zui-slider-disabled")
				.off(".slider")
				.undelegate(".slider")
				.unbind(".slider")
			;
			$.data(target, PROP_NAME, FALSE);
		},
		_enableSlider: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.attr("aria-disabled", "false")
				.removeClass("zui-slider-disabled")
				.trigger("sliderenable", {});
		},
		_disableSlider: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target)
				.attr("aria-disabled", "true")
				.addClass("zui-slider-disabled")
				.trigger("sliderdisable", {});
		},
		_valueSlider: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$.data(target, PROP_NAME, inst);
		},
		_valuesSlider: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			if (inst.settings.vertical) {
				
			} else {
				
			}
			$.data(target, PROP_NAME, inst);
		},
		_handlePosition: function (e, target, handle) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}

			var top, left, tmp, cursor, offset, o, _left, _top, _lf, _tp,
				key = inst.data.key,
				opp = inst.data.opp,
				$target = $(target),
				$handle = $(handle),
				$sliderRange = $handle.siblings(".zui-slider-range");
			
			if (inst.data.sliding === true) {
				//cursor = {x: e.pageX, y: e.pageY};
				cursor = {x: $(e.target).offset().left, y: $(e.target).offset().top};
				//console.log(cursor);
				offset = $target.offset();
				o = inst.data[opp];
				//console.log(offset);
				if (inst.settings.vertical) {
					top = Math.abs(cursor.y - offset.top - 4);
					if (top < 0) {
						top = 0;
					}
					if (top > inst.settings.height) {
						top = inst.settings.height;
					}
					_top = (top / inst.settings.height) * 100; // 0% till 100%
					top = Math.ceil((top / inst.settings.height) * 100);
					tmp = Math.ceil((top * inst.settings.maxValue) / 100);
					_tp = Math.ceil(_top - inst.settings.offset);
					if (_tp < 0 - inst.settings.offset) {
						_tp = 0 - inst.settings.offset;
					}
					if (cursor.y >= offset.top && (o === undefined || 
						(key === "upY" && o >= tmp) || (key === "downY" && o <= tmp))) {
						inst.data[key] = tmp;
						$handle.css({
							"top": _tp + "%"
						});
						$sliderRange.css({
							"top": ((inst.data.upY / inst.settings.maxValue) * 100) + "%",
							"height": (((inst.data.downY / inst.settings.maxValue) * 100) - ((inst.data.upY / inst.settings.maxValue) * 100)) + "%"
						});
					}
				} else {
					left = Math.abs(cursor.x - offset.left - 4);// pixels
					if (left < 0) {
						left = 0;
					}
					if (left > inst.settings.width) {
						left = inst.settings.width;
					}
					_left = (left / inst.settings.width) * 100; // 0% till 100%
					left = Math.ceil((left / inst.settings.width) * 100); // %
					tmp = Math.ceil((left * inst.settings.maxValue) / 100); // point/values)
					_lf = Math.ceil(_left - inst.settings.offset);
					if (_lf < 0 - inst.settings.offset) {
						_lf = 0 - inst.settings.offset;
					}
					if (cursor.x >= offset.left && (o === undefined || 
						(key === 'leftX' && o >= tmp) || (key === 'rightX' && o <= tmp))) {
						inst.data[key] = tmp;
						$handle.css({
							"left": _lf + "%"
						});
						$sliderRange.css({
							"left": ((inst.data.leftX / inst.settings.maxValue) * 100) + "%",
							"width": (((inst.data.rightX / inst.settings.maxValue) * 100) - ((inst.data.leftX / inst.settings.maxValue) * 100)) + "%"
						});
					}
				} 
			}
			$(target).trigger("sliderslide", {
				data: inst.data
			});
			$.data(target, PROP_NAME, inst);
			if (e && e.stopPropagation) {
				e.stopPropagation();
			}
			return false;
		},
		_handleStop: function (e, handle) {
			$(handle).removeClass("zui-slider-handle-active");
			$(document).off(".slider");
			if (e && e.stopPropagation) {
				e.stopPropagation();
			}
			return false;
		},
		_newInst: function(target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 99999999),
				isOpen: FALSE,
				isDisabled: FALSE,
				settings: {},
				data: {
					sliding: false,
					key: null,
					opp: null,
					leftX: null,
					rightX: null,
					upY: null,
					downY: null
				}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this slider';
			}
		}
	};

	$.fn.zinoSlider = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoSlider['_' + options + 'Slider'].apply($.zinoSlider, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoSlider['_' + options + 'Slider'].apply($.zinoSlider, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoSlider['_' + options + 'Slider'].apply($.zinoSlider, [this].concat(otherArgs)) :
				$.zinoSlider._attachSlider(this, options);
		});
	};
	
	$.zinoSlider = new Slider();
	$.zinoSlider.version = "1.5";
})(jQuery);