/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";

	var PROP_NAME = 'grid',
		FALSE = false,
		TRUE = true;

	var defaults = {
		dataSource: null,
        caption: false,
        rowCountList: [5,10,20,30,40,50,100],
        selectMode: "multiRow", //singleRow, multiRow, singleCell, multiCell
        selectData: [], // [1, 2], [4] ...e.g. [row,cell], [row]
        width: 530,
        height: 200
	};
	
	function Grid() {
		this.sortCache = {};
	}
	
	Grid.prototype = {
		_attachGrid: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var i, iCnt, j, jCnt, uiGrid, uiHead, uiTh, uiBody, uiRow, uiTd, uiFoot, uiSelect, sort,
				$target = $(target),
				self = this,
				inst = self._newInst($target);
	
			$.extend(inst.settings, defaults, settings);

            sort = inst.settings.dataSource.sort();
            if (sort !== null) {
                inst.settings.dataSource.opts.fields.forEach(function (field) {
                    self.sortCache[field.name] = 'ASC';
                    sort.forEach(function (item) {
                        if (field.name === item.field) {
                            self.sortCache[field.name] = item.direction.toUpperCase();
                        }
                    });
                });
            }

            $target.addClass("zui-grid").css({
                height: inst.settings.height,
                width: inst.settings.width
            });

			inst.settings.dataSource.load(function (data) {
				var ds = inst.settings.dataSource,
					fields = ds.opts.fields;

				$target.html("");
				
				uiGrid = (this.uiGrid = $('<table cellspacing="0" cellpadding="0">'))
					.addClass("zui-grid-table")
					.appendTo(target);

                if (inst.settings.caption !== false) {
                    $("<caption>")
                        .html(inst.settings.caption)
                        .appendTo(uiGrid);
                }

				uiHead = $("<thead>")
					.appendTo(uiGrid);

                uiRow = $("<tr>")
                    .appendTo(uiHead);
				
				uiBody = $("<tbody>")
					.appendTo(uiGrid);

                uiFoot = $("<tfoot>")
                    .appendTo(uiGrid);

                var sort = ds.sort();
				for (i = 0, iCnt = fields.length; i < iCnt; i++) {
					uiTh = $("<th>").data("field", fields[i]).appendTo(uiRow);
                    if (fields[i].sortable !== undefined && fields[i].sortable === false) {

                    } else {
                        uiTh.addClass("zui-unselectable zui-grid-sortable");
                    }
                    if (sort !== null) {
                        sort.forEach(function (item) {
                            if (item.field === fields[i].name) {
                                uiTh.addClass(item.direction === "ASC" ? "zui-grid-up" : "zui-grid-down");
                            }
                        });
                    }
					if (typeof fields[i] === "string") {
						uiTh.html(fields[i]);
					} else {
						if (fields[i].label === undefined) {
							uiTh.html(fields[i].name);
						} else {
							uiTh.html(fields[i].label);
						}
					}
				}
				
				for (i = 0, iCnt = data.length; i < iCnt; i++) {
					uiRow = $("<tr>")
                        .addClass("zui-grid-row zui-grid-row-" + (i % 2 === 0 ? "even" : "odd"))
                        .attr("data-id", data[i]._zuid_)
                        .appendTo(uiBody);
					for (j = 0, jCnt = fields.length; j < jCnt; j++) {
						uiTd = $("<td>").html(data[i][fields[j].name]).appendTo(uiRow);
					}
				}

                inst.settings.selectData.forEach(function (item) {
                    uiBody.find('.zui-grid-row[data-id="' + item[0] + '"]')
                        .addClass("zui-grid-row-selected");
                });

                uiRow = $("<tr>")
                    .appendTo(uiFoot);

                uiTd = $("<td>")
                    .attr("colSpan", fields.length)
                    .appendTo(uiRow);

                $("<button>")
                    .html("First")
                    .attr("title", "First")
                    .addClass("zui-grid-button zui-grid-first")
                    .prop("disabled", ds.page() === 1)
                    .appendTo(uiTd);

                $("<button>")
                    .html("Prev")
                    .attr("title", "Prev")
                    .addClass("zui-grid-button zui-grid-prev")
                    .prop("disabled", ds.page() === 1)
                    .appendTo(uiTd);

                $("<button>")
                    .html("Next")
                    .attr("title", "Next")
                    .addClass("zui-grid-button zui-grid-next")
                    .prop("disabled", ds.pages() === ds.page())
                    .appendTo(uiTd);

                $("<button>")
                    .html("Last")
                    .attr("title", "Last")
                    .addClass("zui-grid-button zui-grid-last")
                    .prop("disabled", ds.pages() === ds.page())
                    .appendTo(uiTd);

                $("<button>")
                    .html("Refresh")
                    .attr("title", "Refresh")
                    .addClass("zui-grid-button zui-grid-refresh")
                    .appendTo(uiTd);

                $("<button>")
                    .html("Go to")
                    .attr("title", "Go to")
                    .addClass("zui-grid-button zui-grid-goto")
                    .appendTo(uiTd);

                $('<input type="text">')
                    .addClass("zui-grid-input zui-grid-page")
                    .val(ds.page())
                    .appendTo(uiTd);

                $("<span>")
                    .html([' / ', ds.pages()].join(""))
                    .addClass("zui-grid-i")
                    .appendTo(uiTd);

                uiSelect = $("<select>")
                    .addClass("zui-grid-select zui-grid-rowcount")
                    .appendTo(uiTd);

                inst.settings.rowCountList.forEach(function (item) {
                    $("<option>")
                        .val(item)
                        .text(item)
                        .prop("selected", ds.rowCount() === item)
                        .appendTo(uiSelect);
                });
			});

            $target.on("click", ".zui-grid-sortable", function () {
                var field = $(this).data("field");
                self.sortCache[field.name] = self.sortCache[field.name] === "ASC" ? "DESC" : "ASC";
                $target.zinoGrid("sort", [
                    {
                        field: field.name,
                        direction: self.sortCache[field.name]
                    }
                ]);
            }).on("click", ".zui-grid-row", function () {
                $target.zinoGrid("select", $(this).data("id"));
            }).on("click", ".zui-grid-first", function () {
                $target.zinoGrid("first");
            }).on("click", ".zui-grid-prev", function () {
                $target.zinoGrid("prev");
            }).on("click", ".zui-grid-next", function () {
                $target.zinoGrid("next");
            }).on("click", ".zui-grid-last", function () {
                $target.zinoGrid("last");
            }).on("click", ".zui-grid-refresh", function () {
                $target.zinoGrid("refresh");
            }).on("change", ".zui-grid-rowcount", function () {
                $target.zinoGrid("rowCount", $(this).find("option:selected").val());
            }).on("click", ".zui-grid-goto", function () {
                $target.zinoGrid("page", $target.find(".zui-grid-page").val());
            }).on("keypress", ".zui-grid-page", function (e) {
                var code = e.keyCode || e.which;
                if (code === 13) {
                    $target.zinoGrid("page", $(this).val());
                } else if (code >= 48 && code <= 57) {

                } else {
                    return false;
                }
            });
			
			$.data(target, PROP_NAME, inst);
		},
        _addGrid: function (target, item) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }

            if ($.isArray(item)) {
                for (var i = 0, iCnt = item.length; i < iCnt; i += 1) {
                    inst.settings.dataSource.add(item[i]);
                }
            } else {
                inst.settings.dataSource.add(item);
            }
        },
        _removeGrid: function (target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }
            var i, iCnt, tmp;

            switch (arguments.length) {
                case 1:
                    tmp = inst.settings.selectData;
                    inst.settings.selectData = [];
                    for (i = 0, iCnt = tmp.length; i < iCnt; i += 1) {
                        inst.settings.dataSource.removeById(tmp[i][0]);
                    }
                    break;
                case 2:
                    if (/\D/.test(arguments[1])) {
                        for (i = 0, iCnt = inst.settings.selectData.length; i < iCnt; i += 1) {
                            if (inst.settings.selectData[i][0] === arguments[1]) {
                                inst.settings.selectData.splice(i, 1);
                            }
                        }
                        inst.settings.dataSource.removeById(arguments[1]);
                    } else {
                        tmp = inst.settings.dataSource.getByIndex(arguments[1]);
                        if (tmp) {
                            for (i = 0, iCnt = inst.settings.selectData.length; i < iCnt; i += 1) {
                                if (inst.settings.selectData[i][0] === tmp._zuid_) {
                                    inst.settings.selectData.splice(i, 1);
                                }
                            }
                        }
                        inst.settings.dataSource.removeByIndex(arguments[1]);
                    }
                    break;
            }
        },
        _clearGrid: function (target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }

            $(target).find("tbody .zui-grid-row").removeClass("zui-grid-row-selected");
            inst.settings.selectData = [];
        },
        _selectGrid: function (target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }

            var $rows, rowId, rowIndex;

            switch (arguments.length) {
                case 2:
                    if (/\D/.test(arguments[1])) {
                        rowId = arguments[1];
                    } else {
                        rowIndex = arguments[1];
                    }
                    break;
                default:
                    return;
            }

            $rows = $(target).find("tbody .zui-grid-row");

            switch (inst.settings.selectMode) {
                case "singleRow":
                    $rows.removeClass("zui-grid-row-selected");
                    if (rowId !== undefined) {
                        $rows.filter('[data-id="' + rowId + '"]').addClass("zui-grid-row-selected");
                    } else if (rowIndex !== undefined) {
                        rowId = $rows.eq(rowIndex).addClass("zui-grid-row-selected").data("id");
                    }

                    inst.settings.selectData = [[rowId]];
                    break;
                case "multiRow":
                    var selectedIndex = -1;
                    inst.settings.selectData.forEach(function (item, i) {
                        if (item[0] === rowId) {
                            selectedIndex = i;
                            return;
                        }
                    });
                    if (selectedIndex === -1) {
                        if (rowId !== undefined) {
                            $rows.filter('[data-id="' + rowId + '"]').addClass("zui-grid-row-selected");
                        } else if (rowIndex !== undefined) {
                            rowId = $rows.eq(rowIndex).addClass("zui-grid-row-selected").data("id");
                        }

                        inst.settings.selectData.push([rowId]);
                    } else {
                        if (rowId !== undefined) {
                            $rows.filter('[data-id="' + rowId + '"]').removeClass("zui-grid-row-selected");
                        } else if (rowIndex !== undefined) {
                            $rows.eq(rowIndex).removeClass("zui-grid-row-selected");
                        }

                        inst.settings.selectData.splice(selectedIndex, 1);
                    }
                    break;
                case "singleCell":
                    break;
                case "multiCell":
                    break;
            }
        },
		_firstGrid: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			if (inst.settings.dataSource.page() > 1) {
				inst.settings.dataSource.page(1).refresh();
			}
		},
		_prevGrid: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var page = inst.settings.dataSource.page();
			if (page > 1) {
				inst.settings.dataSource.page(page - 1).refresh();
			}
		},
		_nextGrid: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var page = inst.settings.dataSource.page();
			if (page < inst.settings.dataSource.pages()) {
				inst.settings.dataSource.page(page + 1).refresh();
			}
		},
		_lastGrid: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			if (inst.settings.dataSource.page() < inst.settings.dataSource.pages()) {
				inst.settings.dataSource.page(inst.settings.dataSource.pages()).refresh();
			}
		},
		_pageGrid: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}

            if (arguments.length === 1) {
                // Getter
                return inst.settings.dataSource.page();
            }

            // Setter
			if (inst.settings.dataSource.page() != arguments[1]) {
                var page,
                    pages = inst.settings.dataSource.pages();
                if (arguments[1] > pages) {
                    page = pages;
                } else if (arguments[1] < 1) {
                    page = 1;
                } else {
                    page = arguments[1];
                }
				inst.settings.dataSource.page(page).refresh();
			}
		},
        _rowCountGrid: function (target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }

            if (arguments.length === 1) {
                // Getter
                return inst.settings.dataSource.rowCount();
            }

            // Setter
            inst.settings.dataSource.rowCount(arguments[1]).refresh();
        },
		_refreshGrid: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}

			inst.settings.dataSource.page(inst.settings.dataSource.page()).refresh();
		},
        _sortGrid: function (target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }

            if (arguments.length === 1) {
                // Getter
                return inst.settings.dataSource.sort();
            }

            // Setter
            inst.settings.dataSource.sort(arguments[1]).refresh();
        },
		_newInst: function (target) {
			var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1');
			return {
				id: id, 
				input: target, 
				uid: Math.floor(Math.random() * 99999999),
				isDisabled: FALSE,
				settings: {}
			}; 
		},
		_getInst: function (target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this grid';
			}
		}
	};
	
	$.fn.zinoGrid = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoGrid['_' + options + 'Grid'].apply($.zinoGrid, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoGrid['_' + options + 'Grid'].apply($.zinoGrid, [this[0]].concat(otherArgs));
		}
		
		return this.each (function () {
			typeof options == 'string' ?
				$.zinoGrid['_' + options + 'Grid'].apply($.zinoGrid, [this].concat(otherArgs)) :
				$.zinoGrid._attachGrid(this, options);
		});
	};
	
	$.zinoGrid = new Grid();
	$.zinoGrid.version = "1.5";
})(jQuery);