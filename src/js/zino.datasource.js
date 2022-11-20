/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function (window, undefined) {
	"use strict";
	
	var defaults = {
			autoLoad: false,
			data: [],
			dataType: "array",//xml, json
			dataUrl: null,
			fields: [],
			page: 1,
			rowCount: 20,
			xmlRoot: null,
			xmlRecord: null,
			filter: null, //[{field: "age", operator: "gt", value: "18"}],
			sort: null, //[{field: "email", direction: "asc"}]
			change: null //callback
		};
	
	function DataSource(options) {
		if (!(this instanceof DataSource)) {
			return new DataSource(options);
		}
		
		this._offset = 0;
		this._pages = 0;
		this._total = 0;
		this.originalData = [];
		this._view = [];
		this.cache = false;
		this.callback = null;
		
		this.init.call(this, options);
		
		return this;
	}
	
	DataSource.guid = function() {
		return [s4(), s4(), '-', s4(), '-', s4(), '-', s4(), '-', s4(), s4(), s4()].join("");
	};
	
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	
	function sort(property) { 
		var sortOrder = 1;
		if(property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1, property.length - 1);
		}
		return function (a,b) {
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			return result * sortOrder;
		}
	}

	function sortAll() {
	    var props = arguments;
	    return function (obj1, obj2) {
	        var i = 0, result = 0, numberOfProperties = props.length;
	        while(result === 0 && i < numberOfProperties) {
	            result = sort(props[i])(obj1, obj2);
	            i++;
	        }
	        return result;
	    }
	}
	
	function cast(value, type) {
		switch (type.toLowerCase()) {
		case "int":
		case "integer":
		case "numeric":
			return parseInt(value, 10);
			break;
		case "bool":
		case "boolean":
			if (value.toLowerCase() === "true" || value === "1" || value === 1) {
				return true;
			} else if (value.toLowerCase() === "false" || value === "0" || value === 0) {
				return false
			}
			break;
		case "string":
			return value.toString();
			break;
		case "float":
		case "decimal":
			return parseFloat(value);
			break;
		case "date":
			return new Date(value);
			break;
		}
	}
	
	DataSource.prototype = {
		add: function (item) {
			if (item === undefined) {
				throw new Error("Data item is undefined");
			}
			
			item._zuid_ = DataSource.guid();
			this.opts.data.push(item);
            this._total = this.opts.data.length;
            this._pages = Math.ceil(this._total / this.opts.rowCount);
            this._offset = (parseInt(this.opts.page, 10) - 1) * this.opts.rowCount;
			
			this.refresh.call(this);
			
			return this;
		},
		cancel: function () {
			this.opts.data = this.originalData;
			
			$(this).trigger("datasourcechange", {
				
			});
			
			return this;
		},
		data: function () {
			if (arguments.length === 0) {
				// Get data
				return this.opts.data;
			}
			// Set data
			this.opts.data = arguments[0];
			
			return this;
		},
		filter: function () {
			if (arguments.length === 0) {
				// Get filter
				return this.opts.filter;
			}
			// Set filter
			this.opts.filter = arguments[0];
			
			this._filter.call(this);
			
			return this;
		},
		getById: function (zuid) {
			for (var i = 0, iCnt = this.opts.data.length; i < iCnt; i++) {
				if (this.opts.data[i]._zuid_ === zuid) {
					return this.opts.data[i];
				}
			}
			
			return null;
		},
		getByIndex: function (index) {
			return this.opts.data[index] !== undefined ? this.opts.data[index] : null;
		},
		init: function (options) {
			var self = this;
			
			this.opts = $.extend(defaults, options);
			
			$(this).bind("datasourcechange", function (event, ui) {
				if (self.opts.change !== null) {
					self.opts.change.call(this, event, ui);
				}
			});
			
			if (this.opts.autoLoad) {
				this.load.call(this);
			}
		},
		insert: function (index, item) {
			if (item === undefined) {
				throw new Error("Data item is undefined");
			}
			this.opts.data.splice(index, 0, item);
			
			this.refresh.call(this);
			
			return this;
		},
		load: function (callback) {
			var self = this;
			
			if (callback !== undefined && typeof callback === "function")
			{
				self.callback = callback;
			}
			
			function zuid (data) {
				for (var i = 0, iCnt = data.length; i < iCnt; i++) {
					data[i]._zuid_ = DataSource.guid();
				}
				
				return data;
			}
			
			switch (this.opts.dataType) {
			case "json":
				$.get(this.opts.dataUrl).done(function (data) {
					self._total = data.length;
					self._pages = Math.ceil(self._total / self.opts.rowCount);
					self._offset = (parseInt(self.opts.page, 10) - 1) * self.opts.rowCount;
					self.opts.data = zuid(data);
                    self._sort.call(self);
					self._view = self.opts.data.slice(self._offset, self._offset + self.opts.rowCount);
                    /////self._view = data.slice(self._offset, self._offset + self.opts.rowCount);
					//self.opts.data = data.slice(self._offset, self._offset + self.opts.rowCount);
					//self.opts.data = zuid(self.opts.data);
					self.originalData = self.opts.data;
					
					/////self._sort.call(self);
					
					if (callback !== undefined && typeof callback === "function")
					{
						callback.call(self, self._view);
					}
				});
				break;
			case "xml":
				$.get(this.opts.dataUrl).done(function (data) {
					var cache = [],
						//$xml = $( $.parseXML(data) ),
                        $xml = $(data),
						$root = $xml.find(self.opts.xmlRoot),
						$record = $root.find(self.opts.xmlRecord);

					$record.each(function (i, el) {
						cache.push({});
						$(el).children().each(function (j, opt) {
							for (var j = 0, jCnt = self.opts.fields.length; j < jCnt; j++) {
								if (typeof self.opts.fields[j] === "object") {
									if (this.nodeName === self.opts.fields[j].name) {
										cache[i][this.nodeName] = cast($(opt).text(), self.opts.fields[j].type);
										break;
									}
								} else {
									cache[i][this.nodeName] = $(opt).text();
								}
							}
						});
					});
					
					self._total = cache.length;
					self._pages = Math.ceil(self._total / self.opts.rowCount);
					self._offset = (parseInt(self.opts.page, 10) - 1) * self.opts.rowCount;
					self.opts.data = cache.slice(self._offset, self._offset + self.opts.rowCount);
					self.opts.data = zuid(self.opts.data);
					self.originalData = self.opts.data;
					
					self._sort.call(self);
					
					if (callback !== undefined && typeof callback === "function")
					{
						callback.call(self, self.opts.data);
					}
				});
				break;
			case "array":
			default:
				this._total = this.opts.data.length;
				this.opts.data = zuid(this.opts.data);
				this.originalData = this.opts.data;
				
				this._sort.call(this);
				
				if (callback !== undefined && typeof callback === "function")
				{
					callback.call(this, this.opts.data);
				}
				break;
			}
			$(this).trigger("datasourcechange", {
				
			});
			return this;
		},
		page: function () {
			if (arguments.length === 0) {
				// Get page
				return this.opts.page;
			}
			// Set page
			this.opts.page = parseInt(arguments[0], 10);
			
			return this;
		},
		pages: function () {
			return this._pages;
		},
		refresh: function () {
			if (this.callback !== undefined && this.callback !== null && typeof this.callback === "function")
			{
				this._offset = (parseInt(this.opts.page, 10) - 1) * this.opts.rowCount;
				this._view = this.opts.data.slice(this._offset, this._offset + this.opts.rowCount);
				this._pages = Math.ceil(this._total / this.opts.rowCount);
				this.callback.call(this, this._view);
			}
			
			return this;
		},
		remove: function (item) {
			if (item === undefined) {
				throw new Error("Data item is undefined");
			}
			
			for (var i = 0, iCnt = this.opts.data.length; i < iCnt; i++) {
				if (JSON.stringify(item) === JSON.stringify(this.opts.data[i])) {
					this.opts.data.splice(i, 1);
					break;
				}
			}

            this._total = this.opts.data.length;
            this._pages = Math.ceil(this._total / this.opts.rowCount);
            this._offset = (parseInt(this.opts.page, 10) - 1) * this.opts.rowCount;
			this.refresh.call(this);
			
			return this;
		},
        removeById: function (id) {
            for (var i = 0, iCnt = this.opts.data.length; i < iCnt; i++) {
                if (this.opts.data[i]._zuid_ === id) {
                    this.opts.data.splice(i, 1);
                    break;
                }
            }

            this._total = this.opts.data.length;
            this._pages = Math.ceil(this._total / this.opts.rowCount);
            this._offset = (parseInt(this.opts.page, 10) - 1) * this.opts.rowCount;
            this.refresh.call(this);

            return this;
        },
        removeByIndex: function (index) {
            this.opts.data.splice(index, 1);

            this._total = this.opts.data.length;
            this._pages = Math.ceil(this._total / this.opts.rowCount);
            this._offset = (parseInt(this.opts.page, 10) - 1) * this.opts.rowCount;
            this.refresh.call(this);

            return this;
        },
		rowCount: function () {
			if (arguments.length === 0) {
				// Get rowCount
				return this.opts.rowCount;
			}
			// Set rowCount
			this.opts.rowCount = parseInt(arguments[0], 10);
			
			return this;
		},
		sort: function () {
			if (arguments.length === 0) {
				// Get sort
				return this.opts.sort;
			}
			// Set sort
			this.opts.sort = arguments[0];
			
			this._sort.call(this);
			
			return this;
		},
		total: function () {
			return this._total;
		},
		_filter: function () {
			var i, a, pattern,
				filter = this.opts.filter,
				iCnt = filter.length;
			this.opts.data = $.grep(this.originalData, function (n) {
				a = [];
				for (i = 0; i < iCnt; i++) {
					a[i] = false;
					switch (filter[i].operator) {
					case "start":
						pattern = '^' + filter[i].value;
                        if (n[filter[i].field].toString().match(pattern) !== null) {
							a[i] = true;
						}
						break;
					case "end":
						pattern = filter[i].value + '$';
						if (n[filter[i].field].toString().match(pattern) !== null) {
							a[i] = true;
						}
						break;
					case "lt":
					case "<":
						if (n[filter[i].field] < filter[i].value) {
							a[i] = true;
						}
						break;
					case "lte":
					case "le":
					case "<=":
						if (n[filter[i].field] <= filter[i].value) {
							a[i] = true;
						}
						break;
					case "gt":
					case ">":
						if (n[filter[i].field] > filter[i].value) {
							a[i] = true;
						}
						break;
					case "gte":
					case "ge":
					case ">=":
						if (n[filter[i].field] >= filter[i].value) {
							a[i] = true;
						}
						break;
					case "ne":
					case "neq":
					case "!=":
						if (n[filter[i].field] != filter[i].value) {
							a[i] = true;
						}
						break;
					case "eq":
					case "=":
					default:
						if (n[filter[i].field] == filter[i].value) {
							a[i] = true;
						}
						break;
					}
				}

				if ($.inArray(false, a) === -1) {
					return true;
				}
				
				return false;
			});
		},
		_sort: function () {
			var i, iCnt,
				sorters = [];
			
			if (this.opts.sort === null || this.opts.sort.length === 0) {
				return false;
			}
			
			for (i = 0, iCnt = this.opts.sort.length; i < iCnt; i++) {
				sorters.push(
					this.opts.sort[i].direction.toUpperCase() === "ASC" ? 
					this.opts.sort[i].field : 
					"-" + this.opts.sort[i].field
				);
			}
			this.opts.data.sort(sortAll.apply(null, sorters));
		}
	};
	
	window.zino = window.zino || {};
	window.zino.DataSource = DataSource;
})(window);