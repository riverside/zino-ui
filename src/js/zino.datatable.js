/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'datatable',
		FALSE = false,
		TRUE = true;

	function Datatable() {
		this._defaults = {
			caption: "",
			dataSource: null,
			summary: ""
		};
	}
	
	Datatable.prototype = {
		_attachDatatable: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $table, $thead, $tbody, $tr, i, len, j, jen, x,
				$target = $(target),
				self = this,
				inst = self._newInst($target);
			
			$.extend(inst.settings, self._defaults, settings);
			
			$table = $("<table>").addClass("zui-datatable-table");
			$thead = $("<thead>").addClass("zui-datatable-thead");
			$tbody = $("<tbody>").addClass("zui-datatable-tbody");
			$tr = $("<tr>");
			
			inst.settings.dataSource.load(function (data) {
				$table.attr("summary", inst.settings.summary);
				if (inst.settings.caption !== "") {
					$("<caption>")
						.addClass("zui-datatable-caption")
						.html(inst.settings.caption)
						.appendTo($table);
				}
				// THEAD
				for (i = 0, len = this.opts.fields.length; i < len; i++) {
					if (typeof this.opts.fields[i] === "object") {
						$("<th>").addClass("zui-datatable-th").html(this.opts.fields[i].label).appendTo($tr);						
					} else {
						$("<th>").addClass("zui-datatable-th").html(this.opts.fields[i]).appendTo($tr);
					}
				}
				$tr.appendTo($thead);
				
				// TBODY
				for (i = 0, len = data.length; i < len; i++) {
					$tr = $("<tr>").addClass("zui-datatable-" + (i % 2 === 0 ? "even" : "odd"));
					for (j = 0, jen = this.opts.fields.length; j < jen; j++) {
						if (typeof this.opts.fields[j] === "object") {
							$("<td>").addClass("zui-datatable-td").html(data[i][this.opts.fields[j].name]).appendTo($tr);
						} else {
							$("<td>").addClass("zui-datatable-td").html(data[i][this.opts.fields[j]]).appendTo($tr);	
						}
					}
					$tr.appendTo($tbody);
				}
			});

			$thead.appendTo($table);
			$tbody.appendTo($table);
			$table.appendTo($target);

			$tbody.on("mouseover", "tr", function () {
				$(this).addClass("zui-datatable-hover");
			}).on("mouseout", "tr", function () {
				$(this).removeClass("zui-datatable-hover");
			});
			
			$.data(target, PROP_NAME, inst);
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
				throw 'Missing instance data for this datatable';
			}
		}
	};

	$.fn.zinoDatatable = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoDatatable['_' + options + 'Datatable'].apply($.zinoDatatable, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoDatatable['_' + options + 'Datatable'].apply($.zinoDatatable, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoDatatable['_' + options + 'Datatable'].apply($.zinoDatatable, [this].concat(otherArgs)) :
				$.zinoDatatable._attachDatatable(this, options);
		});
	};
	
	$.zinoDatatable = new Datatable();
	$.zinoDatatable.version = "1.5.1";
})(jQuery);