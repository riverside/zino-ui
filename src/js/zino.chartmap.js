/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
  */
(function ($, undefined) {
    "use strict";

    var PROP_NAME = 'chartmap',
    	global = {},
        FALSE = false,
        TRUE = true;

    function setGlobal() {
		global.$body = $(document.body);
		global.margin = global.$body.offset();
		global.padding = {
			left: Number(global.$body.css("paddingLeft").replace("px", "")),
			top: Number(global.$body.css("paddingTop").replace("px", ""))
		};
	}
	
	$(function () {
		setGlobal.call(null);
	});
	
	$(window).on("resize", function (e) {
		setGlobal.call(null);
	});
	
    function Chartmap() {
        this._defaults = {
            plugin: "svg",
            map: "BG",
            fill: "#5DC1E4",
            hover: "#957030",
            background: "#FFFFFF",
            palette: true,
            provinces: true,
            font: {
                family: "Arial",
                size: "12px"
            },
            tooltip: {
            	color: "#fff",
            	fill: "#000",
            	radius: 0,
            	opacity: 1,
            	offset: {
            		x: 15,
            		y: 15
            	},
            	pattern: "%name" //%name
            },
            legend: [],
            zoom: 11,
            width: 530,
            height: 320,
            click: null
        };
    }

    var Color = {
        cutHex: function (h) {
            return (h.charAt(0)=="#") ? h.substring(1,7) : h;
        },
        hexToR: function (h) {
            return parseInt((Color.cutHex(h)).substring(0,2),16);
        },
        hexToG: function (h) {
            return parseInt((Color.cutHex(h)).substring(2,4),16);
        },
        hexToB: function (h) {
            return parseInt((Color.cutHex(h)).substring(4,6),16);
        },
        hexToRgb: function (h) {
            return [Color.hexToR(h), Color.hexToG(h), Color.hexToB(h)];
        },
        rgbToHex: function (r, g, b) {
            return ["#", Color.toHex(r), Color.toHex(g), Color.toHex(b)].join("");
        },
        toHex: function (n) {
            n = parseInt(n, 10);
            if (isNaN(n)) {
                return "00";
            }
            n = Math.max(0, Math.min(n, 255));
            var str = "0123456789ABCDEF";

            return [str.charAt((n - n % 16) / 16), str.charAt(n % 16)].join("");
        },
        rgbToHsv: function (r, g, b) {
            var computedH = 0,
                computedS = 0,
                computedV = 0;

            r = parseInt((''+r).replace(/\s/g, ''), 10);
            g = parseInt((''+g).replace(/\s/g, ''), 10);
            b = parseInt((''+b).replace(/\s/g, ''), 10);

            if (r === null || g === null || b === null || isNaN(r) || isNaN(g)|| isNaN(b)) {
                return FALSE;
            }
            if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) {
                return FALSE;
            }
            r = r / 255;
            g = g / 255;
            b = b / 255;
            var minRGB = Math.min(r, Math.min(g, b)),
                maxRGB = Math.max(r, Math.max(g, b));

            if (minRGB === maxRGB) {
                computedV = minRGB;
                return [0, 0, computedV];
            }

            var d = (r === minRGB) ? g - b : ((b === minRGB) ? r - g : b - r),
                h = (r === minRGB) ? 3 : ((b === minRGB) ? 1 : 5);
            computedH = 60 * (h - d / (maxRGB - minRGB));
            computedS = (maxRGB - minRGB)/maxRGB;
            computedV = maxRGB;

            return [computedH, computedS, computedV];
        },
        hsvToRgb: function (hsv) {
            var r, g, b;
            if (hsv[1] === 0) {
                r = g = b = Math.round(hsv[2] * 2.55);
            } else {
                hsv[0] /= 60;
                //hsv[1] /= 100;
                //hsv[2] /= 100;
                var i = Math.floor(hsv[0]),
                    f = hsv[0] - i,
                    p = hsv[2] * (1 - hsv[1]),
                    q = hsv[2] * (1 - hsv[1] * f),
                    t = hsv[2] * (1 - hsv[1] * (1 - f));
                switch (i) {
                    case 0:
                        r = hsv[2];
                        g = t;
                        b = p;
                        break;
                    case 1:
                        r = q;
                        g = hsv[2];
                        b = p;
                        break;
                    case 2:
                        r = p;
                        g = hsv[2];
                        b = t;
                        break;
                    case 3:
                        r = p;
                        g = q;
                        b = hsv[2];
                        break;
                    case 4:
                        r = t;
                        g = p;
                        b = hsv[2];
                        break;
                    default:
                        r = hsv[2];
                        g = p;
                        b = q;
                }
                r = Math.round(r * 255);
                g = Math.round(g * 255);
                b = Math.round(b * 255);
            }
            return [r, g, b];
        },
        hueShift: function (h, s) {
            h += s;
            while (h >= 360.0) {
                h -= 360.0;
            }
            while (h < 0.0) {
                h += 360.0;
            }

            return h;
        },
        complementary: function (color) {
            var hsv, rgb;
            if (color.match(/[0-9a-fA-F]+/)) {
                rgb = Color.hexToRgb(color);
            } else {
                rgb = color;
            }
            hsv = Color.rgbToHsv(rgb[0], rgb[1], rgb[2]);
            hsv[0] = Color.hueShift(hsv[0], 180.0);
            rgb = Color.hsvToRgb(hsv);

            return Color.rgbToHex(rgb[0], rgb[1], rgb[2]);
        }
    };

    Chartmap.getWebsafeColors = function () {
        var i, j, k,
            c = [],
            a = ["00", "33", "66", "99", "CC", "FF"];
        for (i = 0; i < 6; i++) {
            for (j = 0; j < 6; j++) {
                for (k = 0; k < 6; k++) {
                    c.push(["#", a[i], a[j], a[k]].join(""));
                }
            }
        }
        return c;
    };

    Chartmap.getColorLuminance = function (hex, lum) {
        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i*2,2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00"+c).substr(c.length);
        }

        return rgb;
    };

    Chartmap.getColors = function (i) {
        var c = ['#3366CC', '#DC3912', '#067A06', '#FFCC00', '#663300',
            '#660066', '#3399CC', '#CC6600', '#CC3399', '#CC6666',
            '#339900', '#CC99FF', '#CC3300', '#99FF66', '#993366',
            '#16448A'];
        if (i !== undefined && c[i] !== undefined) {
            return c[i];
        }
        return c;
    };

    Chartmap.getColorPalette = function (hex, cnt) {
        var lum = 0,
            direction = 'up',
            step = 0.2,
            palette = [];

        switch (arguments.length) {
            case 3:
                direction = arguments[2];
                break;
            case 4:
                direction = arguments[2];
                step = arguments[3];
                break;
        }

        for (var i = 0; i < cnt; i += 1) {
            if (direction == 'up') {
                lum += step;
            } else {
                lum -= step;
            }
            palette.push( Chartmap.getColorLuminance(hex, lum) );
        }

        return palette;
    };

    Chartmap.prototype = {
        _attachChartmap: function (target, settings) {
            if (this._getInst(target)) {
                return FALSE;
            }
            var $target = $(target),
                that = this,
                inst = this._newInst($target);

            $.extend(inst.settings, this._defaults, settings);
            
            inst.settings.earthRadius = 6378137;
            inst.settings.index = inst.settings.earthRadius / Math.max(inst.settings.width, inst.settings.height);
            inst.settings.wIndex = inst.settings.earthRadius / inst.settings.width;
            inst.settings.hIndex = inst.settings.earthRadius / inst.settings.height;

            switch (inst.settings.plugin) {
                case "svg":
                    inst.handle = zino.Svg({
                        "target": target,
                        "width": inst.settings.width,
                        "height": inst.settings.height,
                        "viewBox": "0 0 WW HH"
                        	.replace('WW', inst.settings.width)
                        	.replace('HH', inst.settings.height),
                        	//.replace('WW', inst.settings.earthRadius / inst.settings.wIndex)
                        	//.replace('HH', inst.settings.earthRadius / inst.settings.hIndex),
                        "preserveAspectRatio": "xMidYMid meet",
                        "namespaces": {
                        	"zui": "http://zinoui.com/svgns"
                        }
                    });

                    inst.handle.desc('Created with ZinoUI ' + $.zinoChartmap.version);
                    var clipPath = inst.handle.clipPath("zinoui-1").getShape();
                    inst.handle.rect(0, 0, 0, 0, inst.settings.width, inst.settings.height, false).attr({
                        "fill": "none"
                    }).appendTo(clipPath);
                    break;
            }

            $.data(target, PROP_NAME, inst);

            this.draw.call(this, target);
        },
        draw: function (target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }

            switch (inst.settings.plugin) {
                case "svg":
                    inst.handle.rect(0, 0, 0, 0, inst.settings.width, inst.settings.height).attr({
						"fill": inst.settings.background.length ? inst.settings.background : "none",
                        "stroke": "none",
                        "stroke-width": 0
                    }).insert();
                    break;
            }

            this.map.call(this, target);
        },
        map: function (target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }

            if (!(inst.settings.map in zino.Chartmap.countries)) {
            	throw new Error(["Please verify that ", inst.settings.map, ".js is loaded."].join(""));
            }
            
            var data = zino.Chartmap.countries[inst.settings.map],
            	scale = parseInt(data.scale),
                palette = Chartmap.getColorPalette(inst.settings.fill, data.provinces.length, 'down', 0.005),
                colors = Chartmap.getColors();

            var i, iCnt, j, jCnt, p, _g, g, g1, g2, rect, txt, span, fill, hover, bc, xx, yy;

            function _mouseenter(e, shape) {
                var bbox,
                    $el = $(shape),
                    fill = $el.attr("fill"),
                    hover = shape.getAttributeNS("zui", "hover");

                $el.data("fill", fill);
                shape.setAttributeNS(null, "fill", hover || inst.settings.hover || Color.complementary(fill));

                if (!inst.settings.tooltip) {
                    return;
                }
                txt.firstChild.firstChild.nodeValue = shape.getAttributeNS("zui", "tooltip");
                bbox = txt.getBBox();
                rect.setAttributeNS(null, "width", Number(bbox.width) + 10);
                rect.setAttributeNS(null, "height", Number(bbox.height) + 10);
                g1.setAttributeNS(null, "visibility", "visible");
            }

            function _mouseleave(e, shape) {
                shape.setAttributeNS(null, "fill", $(shape).data("fill"));

                if (!inst.settings.tooltip) {
                    return;
                }
                g1.setAttributeNS(null, "visibility", "hidden");
            }

            function _mousemove(e, shape) {
                if (!inst.settings.tooltip) {
                    return;
                }
                var x = e.clientX, //e.offsetX,
                    y = e.clientY, //e.offsetY,
                    offset_x = 0,
                    offset_y = 0,
                    width = parseInt(rect.getAttributeNS(null, "width"), 10),
                    height = parseInt(rect.getAttributeNS(null, "height"), 10);
                
                if (!isNaN(inst.settings.tooltip.offset.x)) {
                	offset_x = inst.settings.tooltip.offset.x;
                }
                if (!isNaN(inst.settings.tooltip.offset.y)) {
                	offset_y = inst.settings.tooltip.offset.y;
                }
                x -= global.margin.left + global.padding.left;
                y -= global.margin.top + global.padding.top;
                if (y + height + offset_y > inst.settings.height) {
                    y -= height + offset_y;
                }
                if (x + width + offset_x > inst.settings.width) {
                    x -= width + offset_x;
                }
                g1.setAttributeNS(null, "transform", ["translate(", x, ",", y, ")"].join(""));
            }

            function _click(e, shape) {
                if (!inst.settings.click) {
                    return;
                }
                inst.settings.click.call(this, e, shape);
            }

            switch (inst.settings.plugin) {
                case "svg":
                	_g = inst.handle.g().attr({
                		"class": "zui-chartmap-map",
                		"visibility": "hidden",
                        "transform": "translate(XX,YY) scale(ZOOMX,ZOOMY)"
                            .replace('XX', (-data.minx*scale / inst.settings.index) * inst.settings.zoom)
                            .replace('YY', (data.maxy*scale  / inst.settings.index) * inst.settings.zoom)
                            .replace(/ZOOMX/g, parseFloat(inst.settings.zoom) * 1)
                            .replace(/ZOOMY/g, parseFloat(inst.settings.zoom) * -1)
                	});
                    g = _g.getShape();

                    if (inst.settings.provinces) {
                        for (i = 0, iCnt = data.provinces.length; i < iCnt; i += 1) {
                        	for (j = 0, jCnt = data.provinces[i].polygon.length; j < jCnt; j += 1) {
	                        	p = data.provinces[i].polygon[j].split(" ");
	                        	p.forEach(function (value, idx, arr) {
	                        		arr[idx] = (parseFloat(value)*scale / inst.settings.index).toFixed(2);
	                        		if (isNaN(arr[idx])) {
	                        			//console.log('NaaaaaaaN', typeof arr[idx], arr[idx]);
	                        		}
	                        	});

	                        	fill = inst.settings.palette 
	                        		? palette[i] || Chartmap.getColorLuminance(inst.settings.fill, 1 - i/10) 
	                        		: inst.settings.fill;
	                        	hover = inst.settings.hover;
	                        	
	                        	if (inst.settings.provinces.length > 0) {
	                        		inst.settings.provinces.forEach(function (value, idx, arr) {
	                        			if (typeof value === 'string' && value == data.provinces[i].id) {
	                        				fill = inst.settings.fill;
	                        				hover = inst.settings.hover;
	                        			} else if (value.id && value.id == data.provinces[i].id) {
	                        				fill = value.fill || inst.settings.fill;
	                        				hover = value.hover || inst.settings.hover;
	                        			}
	                        		});
	                        	}

	                        	inst.handle.polygon(p.join(" ")).attr({
	                        		"zui:tooltip": (inst.settings.tooltip.pattern 
	                        			? inst.settings.tooltip.pattern.replace('%name', data.provinces[i].name) 
	                        			: data.provinces[i].name),
	                        		"id": data.provinces[i].id,
	                                "fill": fill,
	                                "zui:hover": hover
	                            })
	                            .bind("mouseenter", _mouseenter)
	                            .bind("mouseleave", _mouseleave)
	                            .bind("mousemove", _mousemove)
                                .bind("click", _click)
	                            .appendTo(g);
                        	}
                        }
                    } else {
                        for (i = 0, iCnt = data.country.length; i < iCnt; i += 1) {
                        	p = data.country[i].split(" ");
                        	p.forEach(function (value, idx, arr) {
                        		arr[idx] = (parseFloat(value) * scale / inst.settings.index).toFixed(2);
                        	});
                        	inst.handle.polygon(p.join(" ")).attr({
                        		"zui:tooltip": (inst.settings.tooltip.pattern 
                        			? inst.settings.tooltip.pattern.replace('%name', data.name) 
                        			: data.name),
                                "fill": inst.settings.fill,
                                "zui:hover": inst.settings.hover
                            })
                            .bind("mouseenter", _mouseenter)
	                    	.bind("mouseleave", _mouseleave)
	                    	.bind("mousemove", _mousemove)
	                        .bind("click", _click)
                            .appendTo(g);
                        }
                    }
                    
                    g2 = inst.handle.g().append(g).getShape();
                    
                    setTimeout(function () {
	                    bc = g.getBoundingClientRect();
	                    xx = (inst.settings.width - bc.width) / 2;
	                    yy = (inst.settings.height - bc.height) / 2;
	                    if (yy < 0) {
	                    	yy = 0;
	                    }
	                    g2.setAttributeNS(null, "transform", "translate(XX,YY)"
                    		.replace('XX', xx)
                    		.replace('YY', yy)
	                	);
	                    g.setAttributeNS(null, "visibility", "visible")
                    }, 1);

					if (inst.settings.legend) {
                    	this._showLegendChartmap.call(this, target);
                    }
                    
                    if (inst.settings.tooltip) {
	                    g1 = inst.handle.g().attr({
	                        "class": "zui-chartmap-tooltip",
	                        "visibility": "hidden",
	                        "transform": "translate(0,0)"
	                    }).getShape();
	
	                    // Defaults
	                    var offset_x = 0,
	                    	offset_y = 0,
	                    	radius = 0; 
	                    
	                    if (!isNaN(inst.settings.tooltip.offset.x)) {
	                    	offset_x = inst.settings.tooltip.offset.x;
	                    }
	                    if (!isNaN(inst.settings.tooltip.offset.y)) {
	                    	offset_y = inst.settings.tooltip.offset.y;
	                    }
	                    if (!isNaN(inst.settings.tooltip.radius) && inst.settings.tooltip.radius >= 0) { 
	                    	radius = inst.settings.tooltip.radius;
	                    }
	                    
	                    rect = inst.handle.rect(offset_x, offset_y, radius, radius, 100, 22, false).attr({
	                        "fill": inst.settings.tooltip.fill,
	                        "opacity": inst.settings.tooltip.opacity
	                    }).appendTo(g1).getShape();
	
	                    txt = inst.handle.factory("text", false).attr({
	                        "x": offset_x + 5,
	                        "y": offset_y + 5,
	                        "fill": inst.settings.tooltip.color,
	                        "font-family": inst.settings.font.family,
	                        "font-size": inst.settings.font.size,
	                        "text-anchor": "start",
	                        "dominant-baseline": "text-before-edge"
	                    }).appendTo(g1).getShape();
	
	                    span = inst.handle.factory("tspan", false).attr({
	                        "alignment-baseline": "text-before-edge"
	                    }).appendTo(txt).getShape();
	                    inst.handle.textNode("", false).appendTo(span);
                    }
                    break;
            }
        },
        _hideLegendChartmap: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target).find(".zui-chartmap-legend").remove();
		},
		_showLegendChartmap: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var iCnt = 0;
			if (inst.settings.legend.items) {
				iCnt = inst.settings.legend.items.length;
			}
			
			if (!iCnt) {
				return;
			}
			
			var i, x, g, txt, span, bc,
				myHeight = 0,
				myWidth = 0,
				myMeta = [],
				offsetTop = 0, 
				offsetLeft = 0,
				colors = Chartmap.getColors();
			
			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chartmap-legend"
				}).getShape();
				
				inst.handle.rect(0, 0, 0, 0, 0, 0, false).attr({
					"fill": inst.settings.legend.fill.length ? inst.settings.legend.fill : "none"
				}).appendTo(g);
			}
			
			for (i = 0; i < iCnt; i++) {
				switch (inst.settings.plugin) {
				case "svg":
					inst.handle.rect(0, 10, 0, 0, 12, 12, false).attr({
						"fill": inst.settings.legend.items[i].fill,
						"stroke": "none",
						"stroke-width": 0
					}).appendTo(g);

                    txt = inst.handle.factory("text", false).attr({
                        "x": 0,
                        "y": 10,
                        "fill": inst.settings.legend.color,
                        "font-family": inst.settings.font.family,
                        "font-size": inst.settings.font.size,
                        "text-anchor": "start",
                        "dominant-baseline": "text-before-edge"
                    }).appendTo(g).getShape();

                    span = inst.handle.factory("tspan", false).attr({
                        "alignment-baseline": "text-before-edge"
                    }).appendTo(txt).getShape();
                    inst.handle.textNode(inst.settings.legend.items[i].label, false).appendTo(span);
                    
                    bc = txt.getBoundingClientRect();
                    
                    myMeta[1+i*2] = 12+3;
                    myMeta[1+i*2+1] = bc.width+5;
                    myWidth += myMeta[1+i*2];
                    myWidth += myMeta[1+i*2+1];
                    myHeight = bc.height;
					break;
				}
			}
			
			switch (inst.settings.legend.position) {
			case 'top':
				offsetTop = 15;
				break;
			case 'bottom':
				offsetTop = inst.settings.height - myHeight - 15;
				break;
			}
				
			switch (inst.settings.legend.alignment) {
			case 'left':
				offsetLeft = 15;
				break;
			case 'middle':
				offsetLeft = (inst.settings.width - myWidth) / 2;
				break;
			case 'right':
				offsetLeft = inst.settings.width - myWidth - 15;
				break;
			}
				
			if (inst.settings.plugin === "svg") {
				x = 0;
				for (i = 0, iCnt = g.childNodes.length; i < iCnt; i += 1) {
					if (i > 0) {
						g.childNodes[i].setAttributeNS(null, "x", offsetLeft + x);
						g.childNodes[i].setAttributeNS(null, "y", offsetTop);
						x += myMeta[i];
					} else {
						g.childNodes[i].setAttributeNS(null, "width", myWidth+10);
						g.childNodes[i].setAttributeNS(null, "height", myHeight+10);
						g.childNodes[i].setAttributeNS(null, "x", offsetLeft-5);
						g.childNodes[i].setAttributeNS(null, "y", offsetTop-5);
					}
				}
			}
			
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
                throw 'Missing instance data for this chartmap';
            }
        }
    };

    $.fn.zinoChartmap = function (options) {

        var otherArgs = Array.prototype.slice.call(arguments, 1);
        if (typeof options == 'string' && options === 'isDisabled') {
            return $.zinoChartmap['_' + options + 'Chartmap'].apply($.zinoChartmap, [this[0]].concat(otherArgs));
        }

        if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
            return $.zinoChartmap['_' + options + 'Chartmap'].apply($.zinoChartmap, [this[0]].concat(otherArgs));
        }

        return this.each(function() {
            typeof options == 'string' ?
                $.zinoChartmap['_' + options + 'Chartmap'].apply($.zinoChartmap, [this].concat(otherArgs)) :
                $.zinoChartmap._attachChartmap(this, options);
        });
    };

    $.zinoChartmap = new Chartmap();
    $.zinoChartmap.version = "1.5.1";

    window.zino = window.zino || {};
    window.zino.Chartmap = {
        countries: {}
    };
})(jQuery);