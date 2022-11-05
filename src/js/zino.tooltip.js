/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'slider',
		FALSE = false,
		TRUE = true;
	
	function getMouse(e) {
		var x = 0, y = 0;
		if (!e) {
			var e = window.event;
		}
		if (e.pageX || e.pageY) {
			x = e.pageX;
			y = e.pageY;
		} else if (e.clientX || e.clientY) 	{
			x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return {"x": x, "y": y};
	}
	
	function getEventTarget(e) {
		var targ;
		if (!e) {
			var e = window.event;
		}
		if (e.target) {
			targ = e.target;
		} else if (e.srcElement) {
			targ = e.srcElement;
		}
		if (targ.nodeType == 3) {
			targ = targ.parentNode;
		}
		return targ;
	}
	
	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	
	function Tooltip() {
		this._defaults = {
			follow: true,
			source: null,
			opacity: 1,
			offset: [0, 0],
			position: "bottom",
			showAfter: 0,
			hideAfter: 0
		};
		this.mouseover = false;
		this.focus = false;
		this.dismissed = false;
	}
	
	Tooltip.prototype = {
		_attachTooltip: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);
			
			var $container = $("<div>");
				
			if (inst.settings.source === null) {
				//if (!$target.length) {
					self.tooltipText = $target.attr("title");
					$target.removeAttr("title").data("title", self.tooltipText);
				//}
			} else {
				self.tooltipText = $(inst.settings.source).html();
			}
			
			$container
				.attr("id", ["zui-tooltip-", inst.uid].join(""))
				.addClass("zui-tooltip")
				.html(self.tooltipText);
			if (inst.settings.opacity < 1) {
				$container.css({
					opacity: inst.settings.opacity,
					filter: ["alpha(opacity=", inst.settings.opacity * 100, ")"].join("")
				});
			}
			if (document.body) {
				$container.appendTo(document.body);
			} else {
				$container.insertBefore($("script").eq(0));
			}
			
			$target.on("mouseenter.tooltip", $target, function (e) {
				self._showTooltip.call(self, e, this);
				self.mouseover = true;
				e.stopPropagation();
				return false;
			}).on("mouseleave.tooltip", $target, function (e) {
				if (self.dismissed === true || self.focus === false) {
					self._hideTooltip.call(self, this);
				}
				self.mouseover = false;
				e.stopPropagation();
				return false;
			}).on("focusin.tooltip", $target, function (e) {
				self._showTooltip.call(self, e, this);
				self.focus = true;
				e.stopPropagation();
				return false;
			}).on("focusout.tooltip", $target, function (e) {
				if (self.mouseover === false) {
					self._hideTooltip.call(self, this);
				}
				self.focus = false;
				self.dismissed = false;
				e.stopPropagation();
				return false;
			});
			if (inst.settings.follow) {
				$target.on("mousemove.tooltip", $target, function (e) {
					self._onMove.call(self, e, this);
				});
			}
			$.data(target, PROP_NAME, inst);
		},
		_destroyTooltip: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var $target = $(target),
				t = $target.data("title");
			$target.off(".tooltip");
			if (t.length > 0) {
				$target.attr("title", t);
			}
			$("#zui-tooltip-" + inst.uid).remove();
			$.data(target, PROP_NAME, FALSE);
		},
		_onMove: function (e, target) {
			var inst = this._getInst(target),
				pos = getMouse(e);
			
			$(target).css({
				top: (pos.y + inst.settings.offset[1]) + "px",
				left: (pos.x + inst.settings.offset[0]) + "px"
			});
		},
		_hideTooltip: function (target) {
			var inst = this._getInst(target),
				$container = $("#zui-tooltip-" + inst.uid);
			if (isNumber(inst.settings.hideAfter) && inst.settings.hideAfter > 0) {
				if (inst.timeoutID) {
					window.clearTimeout(inst.timeoutID);
				}
				inst.timeoutID = window.setTimeout(function () {
					$container.hide();
				}, inst.settings.hideAfter);
			} else {
				$container.hide();
			}
		},
		_showTooltip: function (e, target) {
			var inst = this._getInst(target),
				pos = getMouse(e),
				$container = $("#zui-tooltip-" + inst.uid),
				$trgt = $(getEventTarget(e));

			if (inst.settings.source === null && !inst.tooltipText) {
				$container.html($trgt.attr("title"));
			}
			$container.css({
				top: (pos.y + inst.settings.offset[1]) + "px",
				left: (pos.x + inst.settings.offset[0]) + "px"	
			});
			
			if (isNumber(inst.settings.showAfter) && inst.settings.showAfter > 0) {
				if (inst.timeoutID) {
					window.clearTimeout(inst.timeoutID);
				}
				inst.timeoutID = window.setTimeout(function () {
					$container.show();
				}, inst.settings.showAfter);
			} else {
				$container.show();
			}
		},
		_newInst: function(target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 99999999),
				isDisabled: FALSE,
				timeoutID: null,
				tooltipText: "",
				settings: {}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this tooltip';
			}
		}
	};
	
	$.fn.zinoTooltip = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoTooltip['_' + options + 'Tooltip'].apply($.zinoTooltip, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoTooltip['_' + options + 'Tooltip'].apply($.zinoTooltip, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoTooltip['_' + options + 'Tooltip'].apply($.zinoTooltip, [this].concat(otherArgs)) :
				$.zinoTooltip._attachTooltip(this, options);
		});
	};
	
	$.zinoTooltip = new Tooltip();
	$.zinoTooltip.version = "1.5";
})(jQuery);