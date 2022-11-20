/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'calendar',
		FALSE = false,
		TRUE = true;

	var now = new Date(),
		today = [now.getFullYear(), now.getMonth(), now.getDate()].join('-'),
		midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
		d = window.document;
	
	/* Private functions */
	
	function getEventTarget(e) {
		var targ;
		if (!e) {
			e = window.event;
		}
		if (e.target) {
			targ = e.target;
		} else if (e.srcElement) {
			targ = e.srcElement;
		}
		if (targ.nodeType === 3) {
			targ = targ.parentNode;
		}	
		return targ;
	}
	
	function emptyRow(weekNumbers) {
		var i, cell, cols = weekNumbers ? 8 : 7,
			row = $('<tr>');
    	for (i = 0; i < cols; i++) {
    		cell = $('<td>').addClass('zui-calendar-empty');
    		cell.appendTo(row);
    	}
    	return row;
	}
	/**
	 * @param Object obj
	 * @return Array
	 */
	function findPos(obj) {
		var curleft = 0, curtop = 0;
		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while (obj = obj.offsetParent);
			return [curleft, curtop];
		}
	}
	/**
	 * @param Number i
	 * @param Number month
	 * @return Number
	 */
	function getIndex(i, months) {
		if (i > 0 && i < months - 1) {
			return 0;
		} else if (i > 0 && i === months - 1) {
			return 2;
		} else if (i === 0 && i === months - 1) {
			return 3;
		} else if (i === 0 && i < months - 1) {
			return 1;
		}
	}
	/**
	 * Format date
	 * 
	 * @param String format
	 * @param Number date
	 * @return String
	 */
	function _formatDate(format, date) {
		
		function pad(input) {
			return (input + "").length === 2 ? input : "0" + input;
		}
		
		var i, len, f, 
			output = [], 
			dt = new Date(date);
		for (i = 0, len = format.length; i < len; i++) {
			f = format.charAt(i);
			switch (f) {
			case 'Y':
				output.push(dt.getFullYear());
				break;
			case 'y':
				output.push((dt.getFullYear() + "").slice(-2));
				break;
			case 'm':
				output.push(pad(dt.getMonth() + 1));
				break;
			case 'n':
				output.push(dt.getMonth() + 1);
				break;
			case 'F':
				output.push(this.opts.monthNamesFull[dt.getMonth()]);
				break;
			case 'M':
				output.push(this.opts.monthNames[dt.getMonth()]);
				break;
			case 'd':
				output.push(pad(dt.getDate()));
				break;
			case 'j':
				output.push(dt.getDate());
				break;
			case 'D':
				output.push(this.opts.dayNamesFull[dt.getDay()].slice(0, 3));
				break;
			case 'l':
				output.push(this.opts.dayNamesFull[dt.getDay()]);
				break;
			default:
				output.push(f);
			}
		}
		return output.join("");
	}

	function getISOdate(str, format) {
		var y, m, d, iStr, iFormat,
			limiters = ['.', '-', '/'];

		for (var i = 0, len = limiters.length; i < len; i++) {
			if (str.indexOf(limiters[i]) !== -1) {
				iStr = str.split(limiters[i]);
				iFormat = format.split(limiters[i]);
				y = $.inArray('Y', iFormat);
				m = $.inArray('m', iFormat);
				d = $.inArray('d', iFormat);
				if (m === -1) {
					m = $.inArray('n', iFormat);
				}
				if (d === -1) {
					d = $.inArray('j', iFormat);
				}
				return [iStr[y], iStr[m], iStr[d]].join("-");
			}
		}
		return str;
	}

	function is(type, obj) {
		var clas = Object.prototype.toString.call(obj).slice(8, -1);
	    return obj !== undefined && obj !== null && clas === type;
	}
	
	function Calendar() {
		this.id = null;
		this.selectedDate = null;
		
		this._state = [];
		this._defaults = {
			year: new Date().getFullYear(),
			month: new Date().getMonth(),
			dayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
			dayNamesFull: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			monthNamesFull: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			startDay: 0,
			weekNumbers: false,
			selectOtherMonths: false,
			showOtherMonths: true,
			showNavigation: true,
			months: 1,
			inline: false,
			disablePast: false,
			dateFormat: 'Y-m-d',
			position: 'bottom',
			minDate: null,
			beforeOpen: null,
			beforeClose: null,
			open: null,
			close: null,
			select: null,
			onBeforeShowDay: function () {
				return [true, ''];
			}
		};
	}
	
	Calendar.prototype = {
		_attachCalendar: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);

			var i = 0, attrname;
			if (target.nodeType === 1 && target.nodeName === "INPUT" && target.value.length > 0) {
				var iso = getISOdate(target.value, inst.settings.dateFormat),
					parts = iso.split("-"),
					now = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)),
					sd = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
				inst.settings.year = sd.getFullYear();
				inst.settings.month = sd.getMonth();
				self.selectedDate = now;
			}
			target.style.cursor = 'pointer';
			var $div = $("<div>", {
				"id": ['zui-calendar-container', inst.uid].join('-')
			}).addClass("zui-calendar-container");
			if (!inst.settings.inline) {
				$div.css({
					"display": "none",
					"position": "absolute"
				});
				$target
					.bind("focus.calendar", function (e) {
						if (inst.isOpen) {
							self._closeCalendar.call(self, target);
						} else {
							self._openCalendar.call(self, target);
						}
					})
					.bind("blur.calendar", function (e) {
						if (inst.isOpen && !inst.focus) {
							self._closeCalendar.call(self, target);
						}
					})
					.bind("keydown.calendar", function (e) {
						var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
						switch (key) {
							case 9: //Tab
								self._closeCalendar.call(self, target);
								break;
							case 27: //Escape
								self._closeCalendar.call(self, target);
								break;
						}
					})
					.bind("calendarbeforeOpen", function (event, instance) {
						if (instance.settings.beforeOpen !== null) {
							instance.settings.beforeOpen.call(target, event, instance);
						}
					})
					.bind("calendarbeforeClose", function (event, instance) {
						if (instance.settings.beforeClose !== null) {
							instance.settings.beforeClose.call(target, event, instance);
						}
					})
					.bind("calendaropen", function (event, instance) {
						if (instance.settings.open !== null) {
							instance.settings.open.call(target, event, instance);
						}
					})
					.bind("calendarclose", function (event, instance) {
						if (instance.settings.close !== null) {
							instance.settings.close.call(target, event, instance);
						}
					})
				;
				$("document").bind("mousedown.calendar", function (e) {
					var $trgt = $(getEventTarget(e));
					if ($trgt.hasClass("zui-calendar-container") || 
						$trgt.hasClass("zui-calendar-table") || 
						$trgt.hasClass("zui-calendar-date") || 
						$trgt.hasClass("zui-calendar-today") || 
						$trgt.hasClass("zui-calendar-empty") || 
						$trgt.hasClass("zui-calendar-selected") || 
						$trgt.hasClass("zui-calendar-week") ||
						$trgt.hasClass("zui-calendar-nav") ||
						$trgt.hasClass("zui-calendar-navi") || 
						$trgt.hasClass("zui-calendar-month") || 
						$trgt.hasClass("zui-calendar-wday") || 
						$trgt.hasClass("zui-calendar-wnum") ||
						$trgt.parent().hasClass("zui-calendar-container") ||
						$trgt.parent().hasClass("zui-calendar-table")) {
					} else {
						self._closeCalendar.call(self, target);
					}
				});
				$div.appendTo("body");
			} else {
				$div.appendTo(target);
			}
			
			$target
				.bind("calendarselect", function (event, instance) {
					if (instance.settings.select !== null) {
						instance.settings.select.call(target, event, instance);
					}
				})
			;
			
			inst.container = $div;
			$.data(target, PROP_NAME, inst);
			
			var y = inst.settings.year, m = inst.settings.month;
			for (i = 0; i < inst.settings.months; i++) {
				self._drawCalendar(target, y, m + i, getIndex(i, inst.settings.months));
			}
			
			$(inst.container).on("click", ".zui-calendar-date", function () {
				var $this = $(this);
				$("td", inst.container).removeClass("zui-calendar-selected");
				$this.addClass('zui-calendar-selected');
				var ts = parseInt($this.attr('zui-calendar-date'), 10);
				self.selectedDate = new Date(ts);
				inst.settings.year = self.selectedDate.getFullYear();
				inst.settings.month = self.selectedDate.getMonth();
				if (!inst.settings.inline) {
	    			self._closeCalendar.call(self, target);
	    			target.value = self.formatDate(inst.settings.dateFormat, ts);
				}
				/*if (inst.settings.onSelect !== null) {
					inst.settings.onSelect.apply(self, [target, self.formatDate(inst.settings.dateFormat, ts), ts, $this]);
				}*/
				$target.trigger("calendarselect", inst);
				self._refreshCalendar.call(self, target);
			});
		},
		/**
		 * @param String format
		 * @param Number date
		 * @return String
		 */
		formatDate: function () {
			return _formatDate.apply(this, arguments);
		},
		/**
		 * @param Number year
		 * @param Number month
		 * @param Number index (0 - without navigation, 1 - prev navigation, 2 - next navigation, 3 - prev and next navigation)
		 * @param Number id
		 */
		_drawCalendar: function (target, year, month, index, id) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this,
				autoId = id === undefined ? Math.floor(Math.random() * 9999999) : id,
				firstOfMonth = new Date(year, month, 1),
				daysInMonth = new Date(year, month + 1, 0).getDate(),
				daysInPrevMonth = new Date(year, month, 0).getDate(),
				startDay = firstOfMonth.getUTCDay(),
				first = firstOfMonth.getDay(),
				i, day, date, rows = 0, cols = inst.settings.weekNumbers ? 8 : 7,
				table = $("<table>"),
				thead = $("<thead>"),
				tbody = $("<tbody>"),
				row, cell, text, a, b, jsdate, current, oBsd,
				s_arr, si, slen,
				minDate = false;
			
			if (inst.settings.minDate !== null) {
				minDate = true;
			}
			
			row = $("<tr>");
			// Prev month link
			cell = $("<th>");
			if (inst.settings.showNavigation && (index === 1 || index === 3)) {
				cell.click(function (e) {
					$("#zui-calendar-container-" +inst.uid).html("");
					for (i = 0; i < inst.settings.months; i++) {
						self._drawCalendar(target, year, month - inst.settings.months + i, getIndex(i, inst.settings.months));
						if (i === 0) {
							inst.settings.month = month - inst.settings.months;
							inst.settings.year = year;
						}
					}
				});
				cell.addClass("zui-calendar-nav zui-unselectable").css({"cursor": "pointer"}).text("<");
			} else {
				cell.addClass("zui-calendar-navi");
			}
			cell.appendTo(row);
			
			// Month name, Year
			cell = $("<th>", {
				"colSpan": (cols === 7) ? 5 : 6
			}).addClass("zui-calendar-month").text(inst.settings.monthNamesFull[firstOfMonth.getMonth()] + ' ' + firstOfMonth.getFullYear())
				.appendTo(row);
			
			// Next month link
			cell = $("<th>");
			if (inst.settings.showNavigation && (index === 2 || index === 3)) {
				cell.css({
					"cursor": "pointer"
				}).addClass("zui-calendar-nav zui-unselectable").text('>').click(function (e) {
					$("#zui-calendar-container-" +inst.uid).html("");
					for (i = 0; i < inst.settings.months; i++) {
						self._drawCalendar(target, year, month + i + 1, getIndex(i, inst.settings.months));
						if (i === 0) {
							inst.settings.month = month + 1;
							inst.settings.year = year;
						}
					}
				});
			} else {
				cell.addClass("zui-calendar-navi");
			}
			cell.appendTo(row);
			row.appendTo(thead);
			
			row = $("<tr>");
			if (inst.settings.weekNumbers) {
				cell = $("<th>").text('wk').addClass("zui-calendar-wnum").appendTo(row);
			}
					
			for (i = 0; i < 7; i++) {
				cell = $("<th>")
					.text(inst.settings.dayNames[(inst.settings.startDay + i) % 7])
					.addClass("zui-calendar-wday")
					.appendTo(row);
			}
			row.appendTo(thead);
			thead.appendTo(table);
			
			day = inst.settings.startDay + 1 - first;
			while (day > 1) {
	    	    day -= 7;
	    	}
	    	while (day <= daysInMonth) {
	    		jsdate = new Date(year, month, day + startDay);
	    	    row = $("<tr>");
	    	    if (inst.settings.weekNumbers) {
	    	    	cell = $("<td>").addClass('zui-calendar-week');
	    	    	a = new Date(jsdate.getFullYear(), jsdate.getMonth(), jsdate.getDate() - (jsdate.getDay() || 7) + 3);
	    	    	b = new Date(a.getFullYear(), 0, 4);
	    	    	cell.text(1 + Math.round((a - b) / 864e5 / 7)).appendChild(row);
	    	    }

	    	    for (i = 0; i < 7; i++) {
	    	    	cell = $("<td>");
	    	    	if (day > 0 && day <= daysInMonth) {
	    	    		current = new Date(year, month, day);
	    	    		cell.attr('zui-calendar-date', current.getTime()).addClass('zui-calendar-date');	    	    		
	    	    		if (today === [current.getFullYear(), current.getMonth(), current.getDate()].join('-')) {
	    	    			cell.addClass('zui-calendar-today');
	    	    		}
	    	    		cell.text(day);
	    	    		oBsd = inst.settings.onBeforeShowDay.apply(self, [current]);
	    	    		if (inst.settings.disablePast === true && current < midnight) {
	    	    			cell.addClass('zui-calendar-past');
	    	    		} else if (minDate && current < inst.settings.minDate) {
	    	    			cell.addClass('zui-calendar-past');
	    	    		} else if (oBsd[0] === false) {
	    	    			cell.addClass(oBsd[1]);
	    	    		} else {
	    	    			//self._bindCalendar.call(self, cell);
						}
	    	    		
	    	    	} else {
	    	    		if (inst.settings.showOtherMonths) {
	    	    			var _day = day > 0 ? day - daysInMonth: daysInPrevMonth + day,
	    	    				_month = day > 0 ? month + 1 : month - 1;
	    	    			cell.text(_day);
	    	    			
	    	    			current = new Date(year, _month, _day);
		    	    		cell.attr('zui-calendar-date', current.getTime());
	    	    			
	    	    			if (inst.settings.selectOtherMonths) {
	    	    				//self._bindCalendar.call(self, cell);
	    	    			}
	    	    		}
	    	    		cell.addClass('zui-calendar-empty');
	    	    	}
	    	    	if (self.selectedDate !== null && self.selectedDate.getTime() === current.getTime() && inst.settings.month === month) {
	    	    		cell.addClass('zui-calendar-selected');
	    	    	}
	    	    	cell.appendTo(row);
	    	    	row.appendTo(tbody);
	    	    	day++;
	    	    }
	    	    rows++;
	    	}
	    	if (rows === 5)	{
	    		emptyRow(inst.settings.weekNumbers).appendTo(tbody);
	    	} else if (rows === 4) {
	    		emptyRow(inst.settings.weekNumbers).appendTo(tbody);
	    		emptyRow(inst.settings.weekNumbers).appendTo(tbody);
	    	}
			
			table.addClass('zui-calendar-table');
			table.attr('id', ['zui-calendar-table', autoId].join('-'));
			tbody.appendTo(table);
			
			table.click(function (e) {
				inst.focus = TRUE;
			});
			
			var tbl = d.getElementById(['zui-calendar-table', autoId].join('-'));
			if (tbl) {
				inst.container.remove(tbl);
			}
			table.appendTo(inst.container);
			$.data(target, PROP_NAME, inst);
		},
		_openCalendar: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this,
				pos = findPos(target),
				$target = $(target),
				result;
			$target.trigger("calendarbeforeOpen", inst);
			/*if (inst.settings.onBeforeOpen !== null) {
				result = inst.settings.onBeforeOpen.apply(self, []);
			}
			if (result === false) {
				return self;
			}*/
			switch (inst.settings.position) {
				case 'bottom':
					inst.container.css({"top": (pos[1] + target.offsetHeight) + 'px'});
					break;
				case 'top':
					inst.container.show();
					inst.container.css({"top": (pos[1] - inst.container.offsetHeight) + 'px'});
					break;
			}
			inst.container.css({"left": pos[0] + 'px'});			
			inst.container.show();
			$target.trigger("calendaropen", inst);
			/*if (inst.settings.onOpen !== null) {
				inst.settings.onOpen.apply(self, [target]);
			}*/
			inst.isOpen = true;
			inst.focus = true;
			$.data(target, PROP_NAME, inst);
		},
		_closeCalendar: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this,
				$target = $(target),
				result;
			/*if (inst.settings.onBeforeClose !== null) {
				result = inst.settings.onBeforeClose.call(self);
			}
			if (result === false) {
				return self;
			}*/
			$target.trigger("calendarbeforeClose", inst);
			inst.container.hide();
			/*if (inst.settings.onClose !== null) {
				inst.settings.onClose.call(self);
			}*/
			$target.trigger("calendarclose", inst);
			inst.isOpen = false;
			inst.focus = false;
			$.data(target, PROP_NAME, inst);
		},
		_destroyCalendar: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this;
			target.style.cursor = 'text';
			inst.container.parent().remove(inst.container);
			$.data(target, PROP_NAME, inst);
		},
		_optionCalendar: function (target, optName) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var self = this;
			switch (arguments.length) {
				case 2:
					if (is('String', optName) && inst.settings[optName]) {
						return inst.settings[optName];
					} else if (is('Object', optName)) {
						for (var x in optName) {
							if (optName.hasOwnProperty(x)) {
								inst.settings[x] = optName[x];
							}
						}
					}
					break;
				case 3:
					if (inst.settings[optName]) {
						inst.settings[optName] = arguments[2];
					}
					break;
			}
			$.data(target, PROP_NAME, inst);
		},
		_refreshCalendar: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var i,
				y = inst.settings.year,
				m = inst.settings.month,
				self = this;
			inst.container.html("");
			for (i = 0; i < inst.settings.months; i++) {
				self._drawCalendar(target, y, m + i, getIndex(i, inst.settings.months));
			}
			$.data(target, PROP_NAME, inst);
		},
		/**
		 * Create a new instance object
		 * 
		 * @param {HTMLElement} target
		 * @return {Object}
		 */
		_newInst: function(target) {
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
		_getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this calendar';
			}
		}
	};

	$.fn.zinoCalendar = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options === 'string' && options === 'isDisabled') {
			return $.zinoCalendar['_' + options + 'Calendar'].apply($.zinoCalendar, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] === 'string') {
			return $.zinoCalendar['_' + options + 'Calendar'].apply($.zinoCalendar, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options === 'string' ?
				$.zinoCalendar['_' + options + 'Calendar'].apply($.zinoCalendar, [this].concat(otherArgs)) :
				$.zinoCalendar._attachCalendar(this, options);
		});
	};
	
	$.zinoCalendar = new Calendar();
	$.zinoCalendar.version = "1.5.1";
})(jQuery);