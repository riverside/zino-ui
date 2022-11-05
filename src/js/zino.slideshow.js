/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'slideshow',
		FALSE = false,
		TRUE = true;

	function Slideshow() {
		this._defaults = {
			animation: 'slide',
			autoPlay: false,
			easing: 'easeIn',
			focused: 0,
			height: 400,
			interval: 2000,
			orientation: 'horizontal',
			arrows: {
				enable: true,
				visible: false
			},
			control: true,
			navigation: true,
			responsive: false,
			speed: 1000,
			stopOnEnd: false,
			width: 600,
			start: null,
			end: null,
			first: null,
			last: null
		};
	}
	
	Slideshow.prototype = {
		_attachSlideshow: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				$box, $control, $navi, $nav, $prev, $next, $play, $stop,
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);
			
			$box = $("<div>").addClass("zui-slideshow-box").appendTo($target);

			$target
				.bind("slideshowstart", function (event, ui) {
					if (inst.settings.start !== null) {
						inst.settings.start.call(target, event, ui);
					}
				})
				.bind("slideshowend", function (event, ui) {
					if (inst.settings.end !== null) {
						inst.settings.end.call(target, event, ui);
					}
				})
				.bind("slideshowfirst", function (event, ui) {
					if (inst.settings.first !== null) {
						inst.settings.first.call(target, event, ui);
					}
				})
				.bind("slideshowlast", function (event, ui) {
					if (inst.settings.last !== null) {
						inst.settings.last.call(target, event, ui);
					}
				})
				.addClass("zui-slideshow")
				.children(":not(.zui-slideshow-box)")
					.addClass("zui-slideshow-item")
					.appendTo($box)
			;
			if (inst.settings.control) {
				$control = $("<div>").addClass("zui-slideshow-control");
				
				$play = $("<a>", {
					"href": "#"
				}).addClass("zui-slideshow-play").appendTo($control);
				
				$stop = $("<a>", {
					"href": "#"
				}).addClass("zui-slideshow-stop").appendTo($control);
				
				$control.appendTo($target);
			}
			if (inst.settings.navigation) {
				$navi = $("<div>").addClass("zui-slideshow-nav");
				
				$target.find(".zui-slideshow-item").each(function () {
					$navi.append($("<a>", {"href": "#"}));
				});
				$navi.appendTo($target);
				$nav = $target.find(".zui-slideshow-nav a");
			}
			if (inst.settings.arrows) {
				$prev = $("<a>", {
					"href": "#"
				}).addClass("zui-slideshow-arrow")
					.addClass(inst.settings.orientation == 'horizontal' ? "zui-slideshow-prev" : "zui-slideshow-up")
					.css("display", inst.settings.arrows.visible ? "block" : "none")
					.appendTo($target);
				
				$next = $("<a>", {
					"href": "#"
				}).addClass("zui-slideshow-arrow")
					.addClass(inst.settings.orientation == 'horizontal' ? "zui-slideshow-next" : "zui-slideshow-down")
					.css("display", inst.settings.arrows.visible ? "block" : "none")
				.appendTo($target);
			}
			
			var obj = {};
			if (inst.settings.focused > 0) {
				inst.index = inst.settings.focused;
			}
			if (inst.settings.animation === 'fade') {
				if (inst.settings.responsive) {
					obj.height = "100%";
					obj.width = "100%";
				} else {
					obj.height = inst.settings.height;
					obj.width = inst.settings.width;
				}
			} else if (inst.settings.animation === 'slide') {
				switch (inst.settings.orientation) {
					case 'horizontal':
						if (inst.settings.responsive) {
							obj.height = "100%";
							obj.width = ($(inst.settings.selectorItem, $box).length * 100) + "%";
							if (inst.settings.focused > 0) {
								obj.left = (-inst.settings.focused * 100) + "%";
							}
						} else {
							obj.height = inst.settings.height;
							obj.width = $(inst.settings.selectorItem, $box).length * inst.settings.width;
							if (inst.settings.focused > 0) {
								obj.left = -inst.settings.focused * inst.settings.width;
							}
						}
						break;
					case 'vertical':
						if (inst.settings.responsive) {
							obj.height = ($(inst.settings.selectorItem, $box).length * 100) + "%";
							obj.width = "100%";
							if (inst.settings.focused > 0) {
								obj.top = (-inst.settings.focused * 100) + "%";
							}
						} else {
							obj.height = $(inst.settings.selectorItem, $box).length * inst.settings.height;
							obj.width = inst.settings.width;
							if (inst.settings.focused > 0) {
								obj.top = -inst.settings.focused * inst.settings.height;
							}
						}
						break;
			}
			}
			$box.css(obj);
			$target.css({
				width: inst.settings.responsive ? "100%" : inst.settings.width,
				height: inst.settings.responsive ? "100%" : inst.settings.height
			})
			if (inst.settings.navigation) {
				$nav.removeClass(inst.settings.classNavFocus);
				$nav.eq(inst.index).addClass(inst.settings.classNavFocus);
	
				$nav.bind("click.slideshow", function (e) {
					if (e && e.preventDefault) {
						e.preventDefault();
					}
					self._gotoSlideshow(target, $nav.index(this));
					return FALSE;
				});
			}
			
			if (inst.settings.arrows && !inst.settings.arrows.visible) {
				$target.bind("mouseenter.slideshow", function () {
					$(inst.settings.selectorArrow, $target).show();
				}).bind("mouseleave.slideshow", function () {
					$(inst.settings.selectorArrow, $target).hide();
				});
			}
			
			$target.on("click.slideshow", inst.settings.selectorPrev, function (e) {
				if (e && e.preventDefault) {
					e.preventDefault();
				}
				self._prevSlideshow(target);
				return FALSE;
			}).on("click.slideshow", inst.settings.selectorNext, function (e) {
				if (e && e.preventDefault) {
					e.preventDefault();
				}
				self._nextSlideshow(target);
				return FALSE;
			}).on("click.slideshow", inst.settings.selectorPlay, function (e) {
				if (e && e.preventDefault) {
					e.preventDefault();
				}
				self._playSlideshow(target);
				return FALSE;
			}).on("click.slideshow", inst.settings.selectorStop, function (e) {
				if (e && e.preventDefault) {
					e.preventDefault();
				}
				self._stopSlideshow(target);
				return FALSE;
			});
			inst.box = $box;
			inst.slides = $target.find(".zui-slideshow-box .zui-slideshow-item");
			if (inst.settings.animation === 'fade') {
				inst.slides.css({
					"width": "100%", 
					"opacity": 0,
					"position": "absolute",
					"zIndex": 1
				});
				inst.slides.eq(inst.settings.focused).css({"opacity": 1, "zIndex": 2});
			} else if (inst.settings.animation === 'slide') {
				if (inst.settings.responsive) {
					inst.slides.css("width", (100 / inst.slides.size()) + "%");
				}
			}
			inst.nav = $nav;
			$.data(target, PROP_NAME, inst);
			if (inst.settings.autoPlay) {
				self._playSlideshow(target);
			}
		},
		_destroySlideshow: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			$(target)
				.unbind(".slideshow")
				.off(".slideshow")
				.removeClass("zui-slideshow")
				.find(".zui-slideshow-arrow")
					.remove()
					.end()
				.find(".zui-slideshow-nav")
					.remove()
					.end()
				.find(".zui-slideshow-control")
					.remove()
					.end()
				.find(".zui-slideshow-item")
					.unwrap()
					.removeClass("zui-slideshow-item")
					.end()
			;
			$.data(target, PROP_NAME, FALSE);
		},
		_playSlideshow: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			var self = this;
			inst.intervalID = window.setInterval(function () {
				self._nextSlideshow(target);
				if (inst.settings.stopOnEnd && inst.index === 0) {
					self._stopSlideshow(target);
				}
			}, inst.settings.interval);
			$.data(target, PROP_NAME, inst);
		},
		_stopSlideshow: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			window.clearInterval(inst.intervalID);
			$.data(target, PROP_NAME, inst);
		},
		_animate: function (target, inst, o) {
			var $target = $(target);
			$target.trigger("slideshowstart", {
				index: o.index
			});
			
			if (inst.settings.animation === 'fade') {
				var $el = inst.box.find(inst.settings.selectorItem).eq(o.index);
				inst.box.find(inst.settings.selectorItem).not($el).animate({
					"opacity": 0
				}, inst.settings.speed, inst.settings.easing, function () {
					$(this).css("zIndex", 1); 
				});
				$el.animate({
					opacity: 1
				}, inst.settings.speed, inst.settings.easing, function () {
					$(this).css("zIndex", 2);
					$target.trigger("slideshowend", {
						index: o.index
					});
					if (o.index === 0) {
						$target.trigger("slideshowfirst", {
							index: o.index
						});
					}
					if (o.index === inst.slides.length - 1) {
						$target.trigger("slideshowlast", {
							index: o.index
						});
					}
				});
			} else if (inst.settings.animation === 'slide') {
				inst.box.animate(o.params, inst.settings.speed, inst.settings.easing, function () {
					$target.trigger("slideshowend", {
						index: o.index
					});
					if (o.index === 0) {
						$target.trigger("slideshowfirst", {
							index: o.index
						});
					}
					if (o.index === inst.slides.length - 1) {
						$target.trigger("slideshowlast", {
							index: o.index
						});
					}
				});
			}
			inst.index = o.index;
			if (inst.nav) {
				inst.nav.removeClass(inst.settings.classNavFocus);
				inst.nav.eq(inst.index).addClass(inst.settings.classNavFocus);
			}
			$.data(target, PROP_NAME, inst);
		},
		_firstSlideshow: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			var o = {};
			switch (inst.settings.orientation) {
				case 'horizontal':
					o.left = inst.settings.responsive ? "0%" : "0px";
					break;
				case 'vertical':
					o.top = inst.settings.responsive ? "0%" : "0px";
					break;
			}
			this._animate(target, inst, {
				params: o,
				index: 0
			});
		},
		_lastSlideshow: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			var o = {};
			switch (inst.settings.orientation) {
				case 'horizontal':
					if (inst.settings.responsive) {
						o.left = "-" + (inst.slides.size() * 100 - 100) + "%";
					} else {
						o.left = "-" + (inst.box.width() - inst.settings.width) + "px";
					}
					break;
				case 'vertical':
					if (inst.settings.responsive) {
						o.top = "-" + (inst.slides.size() * 100 - 100) + "%";
					} else {
						o.top = "-" + (inst.box.height() - inst.settings.height) + "px";
					}
					break;
			}
			this._animate(target, inst, {
				params: o,
				index: inst.slides.length - 1
			});
		},
		_prevSlideshow: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			var position = inst.box.position(),
				notFirst = false;
				
			if (inst.settings.animation === 'fade') {
				notFirst = inst.box.find(inst.settings.selectorItem).eq(0).is(":visible");
			} else if (inst.settings.animation === 'slide') {
				switch (inst.settings.orientation) {
					case 'horizontal':
							if (inst.settings.responsive) {
								notFirst = position.left != 0 && -inst.index * 100 < 0;
							} else {
						notFirst = position.left != 0 && -inst.index * inst.settings.width < 0;
							}
						break;
					case 'vertical':
							if (inst.settings.responsive) {
								notFirst = position.top != 0 && -inst.index * 100 < 0;
							} else {
						notFirst = position.top != 0 && -inst.index * inst.settings.height < 0;
							}
						break;
				}
			}
			
			if (notFirst) {
				var o = {};
				switch (inst.settings.orientation) {
					case 'horizontal':
						if (inst.settings.responsive) {
							o.left = "+=100%";
						} else {
							o.left = "+=" + inst.settings.width + "px";
						}
						break;
					case 'vertical':
						if (inst.settings.responsive) {
							o.top = "+=100%";
						} else {
							o.top = "+=" + inst.settings.height + "px";
						}
						break;
				}
				this._animate(target, inst, {
					params: o,
					index: inst.index - 1
				});
			} else {
				this._lastSlideshow(target);
			}
		},
		_nextSlideshow: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			var position = inst.box.position(),
				width, height,
				notLast = false;
				
			switch (inst.settings.orientation) {
				case 'horizontal':
					if (inst.settings.responsive) {
						width = inst.slides.size() * 100;
						notLast = -position.left != width - 100 && (inst.index + 1) * 100 < width;
					} else {
						width = inst.box.width();
						notLast = -position.left != width - inst.settings.width && (inst.index + 1) * inst.settings.width < width;
					}
					break;
				case 'vertical':
					if (inst.settings.responsive) {
						height = inst.slides.size() * 100;
						notLast = -position.top != height - 100 && (inst.index + 1) * 100 < height;
					} else {
						height = inst.box.height();
						notLast = -position.top != height - inst.settings.height && (inst.index + 1) * inst.settings.height < height;
					}
					break;
			}
			if (notLast) {
				var o = {};
				switch (inst.settings.orientation) {
					case 'horizontal':
						if (inst.settings.responsive) {
							o.left = "-=100%";
						} else {
							o.left = "-=" + inst.settings.width + "px";
						}
						break;
					case 'vertical':
						if (inst.settings.responsive) {
							o.top = "-=100%";
						} else {
							o.top = "-=" + inst.settings.height + "px";
						}
						break;
				}
				this._animate(target, inst, {
					params: o,
					index: inst.index + 1
				});
			} else {
				this._firstSlideshow(target);
			}
		},
		_gotoSlideshow: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			var o = {};
			switch (inst.settings.orientation) {
				case 'horizontal':
					if (inst.settings.responsive) {
						o.left = "-" + (index * 100) + "%";
					} else {
						o.left = "-" + (index * inst.settings.width) + "px";
					}
					break;
				case 'vertical':
					if (inst.settings.responsive) {
						o.top = "-" + (index * 100) + "%";
					} else {
						o.top = "-" + (index * inst.settings.height) + "px";
					}
					break;
			}
			this._animate(target, inst, {
				params: o,
				index: index
			});
		},
		_optionSlideshow: function (target, optName, optValue) {
			var inst = this._getInst(target);
			if (!inst) {
				return;
			}
			
			if (typeof optName === 'string') {
				if (arguments.length === 2) {
					return inst.settings[optName];
				} else if (arguments.length === 3) {
					inst.settings[optName] = optValue;
				}
			} else if (typeof optName === 'object') {
				$.extend(inst.settings, optName);
			}
			$.data(target, PROP_NAME, inst);
		},
		_newInst: function(target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				slides: target.find(".zui-slideshow-box .zui-slideshow-item"),
				nav: target.find(".zui-slideshow-nav a"),
				uid: Math.floor(Math.random() * 99999999),
				index: 0,
				intervalID: null,
				settings: {
					classNavFocus: "zui-slideshow-nav-focus",
					selectorItem: ".zui-slideshow-item",
					selectorArrow: ".zui-slideshow-arrow",
					selectorPrev: ".zui-slideshow-prev, .zui-slideshow-up",
					selectorNext: ".zui-slideshow-next, .zui-slideshow-down",
					selectorPlay: ".zui-slideshow-play",
					selectorStop: ".zui-slideshow-stop"
				}
			}; 
		},
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this slideshow';
			}
		}
	};

	$.fn.zinoSlideshow = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoSlideshow['_' + options + 'Slideshow'].apply($.zinoSlideshow, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoSlideshow['_' + options + 'Slideshow'].apply($.zinoSlideshow, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoSlideshow['_' + options + 'Slideshow'].apply($.zinoSlideshow, [this].concat(otherArgs)) :
				$.zinoSlideshow._attachSlideshow(this, options);
		});
	};
	
	$.zinoSlideshow = new Slideshow();
	$.zinoSlideshow.version = "1.5";
})(jQuery);