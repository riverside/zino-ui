/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'rating',
		FALSE = false,
		TRUE = true;

	function Rating() {
		this._defaults = {
			items: [],
			disabled: FALSE,
			select: null,
			focus: null,
			blur: null,
			create: null
		};
	}
	
	Rating.prototype = {
		_attachRating: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $holder, $ele, $a, index, selected, current, br,
				$target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			
			if (target.disabled !== undefined && target.disabled === TRUE) {
				inst.settings.disabled = TRUE;
			}
			
			switch (target.nodeName) {
				case 'INPUT':
					switch (target.type) {
						case 'range':
							$target.hide();
							var i,
								_min = parseFloat($target.attr("min")),
								_max = parseFloat($target.attr("max")),
								selected = parseFloat($target.attr("value"));
							br = 0;
							$holder = $("<span>").addClass("zui-rating");
							
							for (i = _min; i <= _max; i += 1) {
								$a = $("<a>", {
									"href": "#",
									"title": i,
									"data-label": i,
									"data-value": i
								}).addClass("zui-rating-star").append("<span></span>");
								if (selected !== undefined && br === 0) {
									$a.addClass("zui-rating-star-selected");
									if (selected === i) {
										br = 1;
									}
								}
								$a.appendTo($holder);
							}
							$holder.insertAfter($target);
							break;
					}
					break;
				case 'SELECT':
					$target.hide();
					$holder = $("<span>").addClass("zui-rating");
					selected = $("option:selected", $target).val();
					br = 0;
					$("option", $target).each(function (i, ele) {
						$ele = $(ele);
						current = $ele.val();
						$a = $("<a>", {
							"href": "#",
							"title": $ele.text(),
							"data-label": $ele.text(),
							"data-value": current
						}).addClass("zui-rating-star").append("<span></span>");
						if (selected !== "" && br === 0) {
							$a.addClass("zui-rating-star-selected");
							if (selected === current) {
								br = 1;
							}
						}
						$a.appendTo($holder);
					});
					$holder.insertAfter($target);
					break;
				default:
					$holder = $target.addClass("zui-rating zui-rating-custom");
					selected = -1;
					br = 0;
					for (var i = 0, len = inst.settings.items.length; i < len; i++) {
						if (inst.settings.items[i].checked) {
							selected = i;
							break;
						}
					}
					for (var i = 0, len = inst.settings.items.length; i < len; i++) {
						$a = $("<a>", {
							"href": "#",
							"title": inst.settings.items[i].label,
							"data-label": inst.settings.items[i].label,
							"data-value": inst.settings.items[i].value
						}).addClass("zui-rating-star").append("<span></span>");
						if (selected >= 0 && br === 0) {
							$a.addClass("zui-rating-star-selected");
							if (selected === i) {
								br = 1;
							}
						}
						$a.appendTo($holder);
					}
			}
			if ($holder) {
				if (inst.settings.disabled) {
					$(".zui-rating-star", $holder).addClass("zui-rating-star-disabled");
				}
				$holder.on("click", ".zui-rating-star", function (e) {
					if (e && e.preventDefault) {
						e.preventDefault();
					}
					if (!inst.settings.disabled) {
						self._selectRating.call(self, target, this);
					}
					return FALSE;
				}).on("mouseenter", ".zui-rating-star", function (e) {
					if (!inst.settings.disabled) {
						self._focusRating.call(self, target, this);
					}
				}).on("mouseleave", ".zui-rating-star", function (e) {
					if (!inst.settings.disabled) {
						self._blurRating.call(self, target, this);
					}
				});
				
				$target
					.bind("ratingcreate", function (event, ui) {
						if (inst.settings.create !== null) {
							inst.settings.create.call(target, event, ui);
						}
					})
					.bind("ratingselect", function (event, ui) {
						if (inst.settings.select !== null) {
							inst.settings.select.call(target, event, ui);
						}
					})
					.bind("ratingfocus", function (event, ui) {
						if (inst.settings.focus !== null) {
							inst.settings.focus.call(target, event, ui);
						}
					})
					.bind("ratingblur", function (event, ui) {
						if (inst.settings.blur !== null) {
							inst.settings.blur.call(target, event, ui);
						}
					})
				;
				inst.holder = $holder.get(0);
			}
			
			$(target).trigger("ratingcreate", {});
			
			$.data(target, PROP_NAME, inst);
		},
		_focusRating: function (target, element) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}

			var $el = $(element),
				index = $(".zui-rating-star", inst.holder).index(element);
			
			$(".zui-rating-star", inst.holder)
				.filter(":gt(" + index + ")")
				.removeClass("zui-rating-star-focus")
				.end()
				.filter(":lt(" + (index + 1) + ")")
				.addClass("zui-rating-star-focus");
			
			$(target).trigger("ratingfocus", {
				input: element,
				index: index,
				value: $el.data("value"),
				label: $el.data("label")
			});
		},
		_blurRating: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			$(".zui-rating-star", inst.holder).removeClass("zui-rating-star-focus");
			
			$(target).trigger("ratingblur", {});
		},
		_selectRating: function (target, element) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var $el = $(element),			
				index = $(".zui-rating-star", inst.holder).index(element);
			
			$(".zui-rating-star", inst.holder)
				.removeClass("zui-rating-star-focus zui-rating-star-selected")
				.filter(":lt(" + (index + 1) + ")")
				.addClass("zui-rating-star-selected");
		
			$(target).trigger("ratingselect", {
				input: element,
				index: index,
				value: $el.data("value"),
				label: $el.data("label")
			});
		},
		_enableRating: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(".zui-rating-star", inst.holder).removeClass("zui-rating-star-disabled");
			inst.settings.disabled = FALSE;
			$.data(target, PROP_NAME, inst);
		},
		_disableRating: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(".zui-rating-star", inst.holder).addClass("zui-rating-star-disabled");
			inst.settings.disabled = TRUE;
			$.data(target, PROP_NAME, inst);
		},
		_destroyRating: function (target) {
			var inst = this._getInst(target),
				$target = $(target);
			if (!inst) {
				return FALSE;
			}
			var $holder = $(inst.holder);
			
			if ($holder.hasClass("zui-rating-custom")) {
				$holder.removeClass("zui-rating zui-rating-custom");
				$("zui-rating-star", $holder).remove();
			} else {
				$holder.remove();
			}
			if (!$target.is(":visible")) {
				$target.show();
			}
			$.data(target, PROP_NAME, FALSE);
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
				throw 'Missing instance data for this rating';
			}
		}
	};

	$.fn.zinoRating = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoRating['_' + options + 'Rating'].apply($.zinoRating, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoRating['_' + options + 'Rating'].apply($.zinoRating, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoRating['_' + options + 'Rating'].apply($.zinoRating, [this].concat(otherArgs)) :
				$.zinoRating._attachRating(this, options);
		});
	};
	
	$.zinoRating = new Rating();
	$.zinoRating.version = "1.5.1";
})(jQuery);