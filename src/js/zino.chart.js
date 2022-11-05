/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'chart',
		FALSE = false,
		TRUE = true;

	function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
		var angleInRadians = angleInDegrees * Math.PI / 180.0;
		var x = centerX + radius * Math.cos(angleInRadians);
		var y = centerY + radius * Math.sin(angleInRadians);
		return [x,y];
	}

	function Chart() {
		this._defaults = {
			plugin: "svg", //svg, canvas
			type: "line", //line, area, pie, donut, bar, column, radar, polar, candlestick, ohlc, gauge
			variation: null,
			points: false,
			stacking: false, //normal, percent
			progression: "forward", //forward, backward
			legend: true,
			tooltip: {
            	color: "#fff",
            	fill: "#000",
            	radius: "2px",
            	opacity: 1,
            	offset: {
            		x: 15,
            		y: 15
            	},
            	pattern: "%label, %value (%percent)" //%name, %value, %percent
            },
			series: [],
			lineRowColor: "#ccc",
			axisColor: "#444",
			textColor: "#444",
			fontSize: "12px",
			fontFamily: "Arial",
			radius: 75,
			innerRadius: 50,
			width: 530,
			height: 320
		};
		this.points = [];
		this.over = false;
        this.tooltip = {};
	}
	
	Chart.getWebsafeColors = function () {
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
	
	Chart.colorLuminance = function (hex, lum) {
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
	
	Chart.getColors = function (i) {
		var c = ['#3366CC', '#DC3912', '#067A06', '#FFCC00', '#663300',
		         '#660066', '#3399CC', '#CC6600', '#CC3399', '#CC6666',
		         '#339900', '#CC99FF', '#CC3300', '#99FF66', '#993366',
		         '#16448A'];
		if (i !== undefined && c[i] !== undefined) {
			return c[i];
		}
		return c;
	};
	
	Chart.hexToRgb = function (hex) {
	    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
	        return r + r + g + g + b + b;
	    });

	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	};

	Chart.prototype = {
		_attachChart: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				that = this,
				inst = this._newInst($target);

			this.tooltip[inst.uid] = {};

			$.extend(inst.settings, this._defaults, settings);

            if ($.inArray(inst.settings.plugin, ['svg', 'canvas']) === -1) {
                throw Error("Ivalid value of 'plugin'. Supported values are: 'svg' and 'canvas'.");
            }

            $target.addClass("zui-chart zui-chart-" + inst.settings.type);

			inst.settings.paddingTop = Math.floor(inst.settings.height * 10 / 100);
			inst.settings.paddingBottom = Math.floor(inst.settings.height * 10 / 100);
			inst.settings.paddingLeft = Math.floor(inst.settings.width * 10 / 100);
			inst.settings.paddingRight = inst.settings.legend ? Math.floor(inst.settings.width * 20 / 100) : 0;
            if (inst.settings.type === 'pie' && inst.settings.variation === 'multi-level' && inst.settings.legend && $.inArray(inst.settings.legend, [true, 1, 2]) !== -1) {
                inst.settings.paddingRight = 0;
            }
			inst.settings.canvasWidth = inst.settings.width - inst.settings.paddingLeft - 
				($.inArray(inst.settings.type, ["ohlc", "candlestick", "spline", "scatter", "bubble"]) === -1 ? inst.settings.paddingRight : 0);
			inst.settings.canvasHeight = inst.settings.height - inst.settings.paddingTop - inst.settings.paddingBottom;
			switch (inst.settings.type) {
			case "line":
			case "area":
			case "bar":
			case "column":
			case "stepline":
			case "spline":
			case "bubble":
			case "scatter":
				//inst.settings.blockNum = inst.settings.categories[0].category.length;
				inst.settings.blockNum = inst.settings.series[0].data.length;
				break;
			default:
				inst.settings.blockNum = inst.settings.series.length - ($.inArray(inst.settings.type, ["ohlc", "candlestick"]) === -1 ? 1 : 0);
			}

            //inst.settings.blockWidth = Math.floor(inst.settings.canvasWidth / inst.settings.blockNum);
			inst.settings.blockWidth = (inst.settings.canvasWidth / inst.settings.blockNum);
			//inst.settings.blockHeight = Math.floor(inst.settings.canvasHeight / inst.settings.blockNum);
            inst.settings.blockHeight = (inst.settings.canvasHeight / inst.settings.blockNum);

			switch (inst.settings.plugin) {
			case "canvas":
				inst.handle = zino.Canvas({
					"target": target, 
					"width": inst.settings.width, 
					"height": inst.settings.height
				});
				break;
			case "svg":
				inst.handle = zino.Svg({
					"target": target, 
					"width": inst.settings.width, 
					"height": inst.settings.height
				});
				
				inst.handle.desc('Created with Zino UI ' + $.zinoChart.version);
				var clipPath = inst.handle.clipPath("zinoui-" + inst.uid).getShape();
				inst.handle.rect(inst.settings.paddingLeft, inst.settings.paddingTop, 0, 0, inst.settings.canvasWidth, inst.settings.canvasHeight, false).attr({
					"fill": "none"
				}).appendTo(clipPath);
				break;
			}
			
			/*if (inst.settings.tooltip) {
				$target.bind("mousemove.chart", function (e) {
					var i, iCnt, x, y, path, bbox,
						width = 100,
						height = 50,
						arr = 10,
						radius = 0,
						mouseX = e.pageX - this.offsetLeft,
						mouseY = e.pageY - this.offsetTop;
					for (i = 0, iCnt = that.points.length; i < iCnt; i++) {
						if ((mouseX >= that.points[i].x - 3 && mouseX <= that.points[i].x + 3) && 
							(mouseY >= that.points[i].y - 3 && mouseY <= that.points[i].y + 3)) {
							
							switch (inst.settings.plugin) {
							case "canvas":
								inst.handle.attr({
									"fillStyle": that.points[i].color
								}).begin().circle(
									that.points[i].x,
									that.points[i].y, 
									that.points[i].radius + 1
								).fill();
								break;
							case "svg":
							default:
								var g = inst.handle.g().attr({
									"class": "zui-chart-tooltip"
								}).getShape();
								
								inst.handle.circle(
									that.points[i].x,
									that.points[i].y, 
									that.points[i].radius + 1, 
									false
								).attr({
									"fill": that.points[i].color
								}).appendTo(g);
								break;
							}
							// tooltip
							if (that.over === false) {
								x = that.points[i].x - width / 2;
								y = that.points[i].y - height - arr - 5; 
								
								path = ["M", x + radius, ",", y, "L", x + width - radius, ",", y, 
									    "L", x + width, ",", y + height - radius, "L", x + width - (width - arr) / 2, 
									    ",", y + height, "L", x + width / 2, ",", y + height + arr, "L", 
									    x + (width - arr) / 2, ",", y + height, "L", x + radius, ",", y + height,
									    "L", x, ",", y + radius, "Z"
								];
	
								switch (inst.settings.plugin) {
								case "canvas":
									inst.handle.attr({
										"fillStyle": "#FFFFFF",
										"strokeStyle": "#A5A5A5",
										"lineWidth": 1
									}).path(path.join(""));
									
									inst.handle.attr({
										"fillStyle": "black",
										"font": "bold " + inst.settings.fontSize + " " + inst.settings.fontFamily,
										"textAlign": "start",
										"textBaseline": "middle",
										"class": "zui-chart-text"
									}).text(that.points[i].name, x + 5, y + 8);
									
									inst.handle.attr({
										"fillStyle": "black",
										"font": inst.settings.fontSize + " " + inst.settings.fontFamily,
										"textAlign": "start",
										"textBaseline": "middle"
									}).text(that.points[i].data, x + 5, y + 28);
									break;
								case "svg":
								default:
									inst.handle.path(path.join("")).attr({
										"fill": "#FFFFFF",
										"stroke": "#A5A5A5",
										"stroke-width": 1
									}).appendTo(g);
									
									inst.handle.text(x + 5, y + 8, that.points[i].name).attr({
										"fill": "#000",
										"font-family": inst.settings.fontFamily,
										"font-size": inst.settings.fontSize,
										"font-weight": "bold",
										"text-anchor": "start",
										"alignment-baseline": "baseline",
										"class": "zui-chart-text"
									}).appendTo(g);
									
									inst.handle.text(x + 5, y + 28, that.points[i].data).attr({
										"fill": "#000",
										"font-family": inst.settings.fontFamily,
										"font-size": inst.settings.fontSize,
										"text-anchor": "start",
										"alignment-baseline": "baseline"
									}).appendTo(g);
								}
							}
							that.over = true;
							break;
						} else {
							if (that.over === true) {
								that.over = false;
								$target.find("g.zui-chart-tooltip").remove();
							}
						}
					}
				});
			}*/

			$.data(target, PROP_NAME, inst);

			this.draw.call(this, target);
		},
		draw: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}

			switch (inst.settings.plugin) {
			case "canvas":
				inst.handle.attr({
					fillStyle: "#FFFFFF"
				}).begin().rect(0, 0, inst.settings.width, inst.settings.height).fill();
				break;
			case "svg":
				inst.handle.rect(0, 0, 0, 0, inst.settings.width, inst.settings.height).attr({
					"fill": "#FFFFFF",
					"stroke": "none",
					"stroke-width": 0
				}).insert();
				break;
			}
			
			switch (inst.settings.type) {
				case "pie":
					this.pie.call(this, target);
					break;
				case "donut":
					this.donut.call(this, target);
					break;
				case "bar":
					this.bar.call(this, target);
					break;
				case "column":
					this.column.call(this, target);
					break;
				case "stepline":
					this.stepline.call(this, target);
					break;
				case "line":
					this.line.call(this, target);
					break;
				case "area":
					this.area.call(this, target);
					break;
				case "polar":
					this.polar.call(this, target);
					break;
				case "radar":
					this.radar.call(this, target);
					break;
				case "rose":
					this.rose.call(this, target);
					break;
				case "candlestick":
					this.candlestick.call(this, target);
					break;
				case "ohlc":
					this.ohlc.call(this, target);
					break;
				case "spline":
					this.spline.call(this, target);
					break;
				case "scatter":
					this.scatter.call(this, target);
					break;
				case "bubble":
					this.bubble.call(this, target);
					break;
                case "gauge":
                    this.gauge.call(this, target);
                    break;
			}
		},
		_hideLabelsChart: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target).find(".zui-chart-labels").remove();
		},
		_showLabelsChart: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var i, iCnt, end, gt,
				start = 0,
				total = 0,
				cx = Math.floor((inst.settings.width - inst.settings.paddingRight) / 2),
				cy = Math.floor(inst.settings.height / 2);
			
			if (inst.settings.plugin === "svg") {
				gt = inst.handle.g().attr({
					"class": "zui-chart-labels"
				}).getShape();
			}
			
			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
				total += inst.settings.series[i].value;
			}
			
			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
				end = (inst.settings.series[i].value / total) * 360 + start;
				
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr({
						"font": inst.settings.fontSize + " " + inst.settings.fontFamily,
				        "textAlign": "center",
				        "textBaseline": "middle",
				        "fillStyle": inst.settings.textColor
					}).text(
						inst.settings.series[i].value, 
						cx + (inst.settings.radius + 20) * Math.cos((-(start + end) / 2) * Math.PI/180),
						cy + (inst.settings.radius + 20) * Math.sin((-(start + end) / 2) * Math.PI/180)
					);
					break;
				case "svg":
					inst.handle.text(
						cx + (inst.settings.radius + 20) * Math.cos((-(start + end) / 2) * Math.PI/180),
						cy + (inst.settings.radius + 20) * Math.sin((-(start + end) / 2) * Math.PI/180),
						inst.settings.series[i].value, 
						false
					).attr({
						"fill": inst.settings.textColor,
						"font-family": inst.settings.fontFamily,
						"font-size": inst.settings.fontSize,
						"text-anchor": "middle"
					}).appendTo(gt);
				default:
					break;
				}
				start = end;
			}
		},
		_hideLegendChart: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			$(target).find(".zui-chart-legend").remove();
		},
		_showLegendChart: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var i, iCnt, t, g, txt, span,
				colors = Chart.getColors();
			
			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chart-legend"
				}).getShape();
			}
			
			switch (inst.settings.type) {
			case 'stepline':
				iCnt = inst.settings.series[0].length;
				t = 1;
				break;
			case 'pie':
			case 'donut':
            case 'line':
            case 'area':
            case 'bar':
            case 'column':
            case 'polar':
            case 'radar':
            case 'rose':
				iCnt = inst.settings.series.length;
				t = 2;
				break;
			}

			for (i = 0; i < iCnt; i++) {
				switch (inst.settings.plugin) {
                case "canvas":
					inst.handle.attr({
						"fillStyle": inst.settings.series[i].color || colors[i]
					}).fillRect(
						inst.settings.width - inst.settings.paddingRight + 10,
						inst.settings.paddingTop + i * 15,
						12, 
						12
					);
					inst.handle.attr({
						"font": inst.settings.fontSize + " " + inst.settings.fontFamily,
				        "textAlign": "left",
				        "textBaseline": "top",
				        "fillStyle": inst.settings.textColor,
				        "strokeStyle": "transparent"
					}).text(
						t === 1 ? inst.settings.series[0][i] : inst.settings.series[i].label,
						inst.settings.width - inst.settings.paddingRight + 10 + 15, 
						inst.settings.paddingTop + i * 15
					);
					break;
				case "svg":
				default:
					inst.handle.rect(
						inst.settings.width - inst.settings.paddingRight + 10,
						inst.settings.paddingTop + i * 15,
						0,
						0,
						12,
						12,
						false
					).attr({
						"fill": inst.settings.series[i].color || colors[i],
						"stroke": "none",
						"stroke-width": 0
					}).appendTo(g);

                    txt = inst.handle.factory("text", false).attr({
                        "x": inst.settings.width - inst.settings.paddingRight + 10 + 15,
                        "y": inst.settings.paddingTop + i * 15,
                        "font-family": inst.settings.fontFamily,
                        "font-size": inst.settings.fontSize,
                        "text-anchor": "start"
                    }).appendTo(g).getShape();

                    span = inst.handle.factory("tspan", false).attr({
                        "alignment-baseline": "text-before-edge"
                    }).appendTo(txt).getShape();
                    inst.handle.textNode(t === 1 ? inst.settings.series[0][i] : inst.settings.series[i].label, false).appendTo(span);
					break;
				}
			}
		},
		pie: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var i, iCnt, end, rand, g,
				gradients = [],
				start = 0,
				total = 0,
				cx = Math.floor((inst.settings.width - inst.settings.paddingRight) / 2),
				cy = Math.floor(inst.settings.height / 2),
				colors = Chart.getColors();

			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chart-canvas"
				}).getShape();
				
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					
					gradients[i] = inst.handle.radialGradient(cx, cy, inst.settings.radius).attr({
						"id": "radial-" + i,
						"gradientUnits": "userSpaceOnUse"
					}).getShape();
					
					inst.handle.factory("stop", false).attr({
						"offset": "0",
						"stop-color": inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i]
					}).appendTo(gradients[i]);
					
					inst.handle.factory("stop", false).attr({
						"offset": "1",
						"stop-color": Chart.colorLuminance(inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i], -0.3)
					}).appendTo(gradients[i]);
				}
			} else if (inst.settings.plugin === "canvas") {
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					gradients[i] = inst.handle.radialGradient(cx, cy, inst.settings.radius*0.9, cx, cy, inst.settings.radius-inst.settings.radius);
					gradients[i].addColorStop(0, inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i]);
					gradients[i].addColorStop(1, Chart.colorLuminance(inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i], -0.3));
				}
			}

			var deep = 0,
				roses = 0,
				totalRoses = 0,
				totalCat = [];
			
			function findDeep(obj) {
				if (obj.category) {
					deep += 1;
					findDeep(obj.category[0]);
				}
			}

			function findDeepTotal(arr, level) {
				if (!totalCat[level]) {
					totalCat[level] = 0;
				}
				for (var i = 0, iCnt = arr.length; i < iCnt; i++) {
					totalCat[level] += parseFloat(arr[i].value);
					totalRoses += 1;
					if (arr[i].category) {
						findDeepTotal(arr[i].category, level + 1);
					}
				}
			}
			
			function drawRoses(arr, level, startAngle) {
				if (roses >= totalRoses - 1) {
					return;
				}

				var endAngle, tmpStart, tmpEnd,
                    txt, span, x, y, ca, pc1, pc2, label,
					tmpStartAngle = startAngle,
					r1 = (inst.settings.radius / (deep + 1)) * (level + 1), 
					r2 = (inst.settings.radius / (deep + 1)) * level;
				
				for (var i = 0, iCnt = arr.length; i < iCnt; i++) {
					endAngle = (parseFloat(arr[i].value) / totalCat[level]) * 360 + startAngle;
					
					start = polarToCartesian(cx, cy, r1, -startAngle);
					end = polarToCartesian(cx, cy, r1, -endAngle);
					
					tmpStart = polarToCartesian(cx, cy, r2, -startAngle);
					tmpEnd = polarToCartesian(cx, cy, r2, -endAngle);
					
					switch (inst.settings.plugin) {
					case 'canvas':
						inst.handle.attr({
							"fillStyle": arr[i].color,
							"strokeStyle": "#fff",
							"lineWidth": 2
						})
						.begin()
						.moveTo(tmpEnd[0], tmpEnd[1])
						.lineTo(end[0], end[1])
						.arc(cx, cy, r1, endAngle*Math.PI/180, startAngle*Math.PI/180, true)
						.lineTo(start[0], start[1])
						.lineTo(tmpStart[0], tmpStart[1])
						.arc(cx, cy, r2, startAngle*Math.PI/180, endAngle*Math.PI/180, false)
						.close()
						.fill()
						.stroke();
						break;
					case 'svg':
					default:
						inst.handle.rose(
							start[0], start[1], //Mmx,my
							r1, end[0], end[1], //Ar1,r1 0 0,1 x1,y1
							tmpEnd[0], tmpEnd[1], //Llx,ly
							r2, tmpStart[0], tmpStart[1], //Ar2,r2 0 0,0 x2,y2	
							false
						).attr({
							"fill": arr[i].color,
							"stroke": "#fff",
							"stroke-width": 2,
							"class": arr[i].label
						})/*.animate({
							"attributeName": "fill",
							"fill": "freeze",
							"to": arr[i].color,
							"from": "#fff",
							"dur": "0.5s"
						})*/.appendTo(g);
						break;
					}

                    if (inst.settings.legend) {
                        ca = (endAngle + startAngle) / 2;
                        pc1 = polarToCartesian(cx, cy, r1, -ca);
                        pc2 = polarToCartesian(cx, cy, r2, -ca);

                        x = ((pc1[0] + pc2[0]) / 2).toFixed(2);
                        y = ((pc1[1] + pc2[1]) / 2).toFixed(2);
                        switch (inst.settings.plugin) {
                            case "canvas":
                                switch (inst.settings.legend) {
                                    case 3:
                                    case 4:
                                        inst.handle.attr({
                                            "fillStyle": arr[i].color || colors[i]
                                        }).fillRect(
                                            inst.settings.width - inst.settings.paddingRight + 10,
                                            inst.settings.paddingTop + roses * 15,
                                            12,
                                            12
                                        );
                                        label = arr[i].label;
                                        if (inst.settings.legend === 4) {
                                            label += ": " + arr[i].value;
                                        }
                                        inst.handle.attr({
                                            "font": inst.settings.fontSize + " " + inst.settings.fontFamily,
                                            "textAlign": "left",
                                            "textBaseline": "top",
                                            "fillStyle": inst.settings.textColor,
                                            "strokeStyle": "transparent"
                                        }).text(
                                            label,
                                            inst.settings.width - inst.settings.paddingRight + 10 + 15,
                                            inst.settings.paddingTop + roses * 15
                                        );
                                        break;
                                    case 1:
                                    case 2:
                                    default:
                                        label = arr[i].label;
                                        if (inst.settings.legend === 2) {
                                            label += ": " + arr[i].value;
                                        }
                                        inst.handle.attr({
                                            "font": "9px " + inst.settings.fontFamily,
                                            "textAlign": "center",
                                            "textBaseline": "middle",
                                            "fillStyle": inst.settings.textColor,
                                            "strokeStyle": "transparent"
                                        }).transform(1, 0, 0, 1, x, y).text(
                                            label,
                                            0,
                                            0
                                        ).resetTransform();
                                        break;
                                }
                                break;
                            case "svg":
                            default:
                                switch (inst.settings.legend) {
                                    case 3:
                                    case 4:
                                        inst.handle.rect(
                                            inst.settings.width - inst.settings.paddingRight + 10,// + (level-1)*12,
                                            inst.settings.paddingTop + roses * 15,
                                            0,
                                            0,
                                            12,
                                            12,
                                            false
                                        ).attr({
                                            "fill": arr[i].color || colors[i],
                                            "stroke": "none",
                                            "stroke-width": 0
                                        }).appendTo(gx);

                                        txt = inst.handle.factory("text", false).attr({
                                            "x": inst.settings.width - inst.settings.paddingRight + 10 + 15,// + (level-1)*12,
                                            "y": inst.settings.paddingTop + roses * 15,
                                            "font-family": inst.settings.fontFamily,
                                            "font-size": inst.settings.fontSize,
                                            "text-anchor": "start"
                                        }).appendTo(gx).getShape();

                                        span = inst.handle.factory("tspan", false).attr({
                                            "alignment-baseline": "text-before-edge"
                                        }).appendTo(txt).getShape();
                                        label = arr[i].label;
                                        if (inst.settings.legend === 4) {
                                            label += ": " + arr[i].value;
                                        }
                                        inst.handle.textNode(label, false).appendTo(span);
                                        break;
                                    case 1:
                                    case 2:
                                    default:
                                        txt = inst.handle.factory("text", false).attr({
                                            "x": 0,
                                            "y": 0,
                                            "transform": "matrix(1,0,0,1," + x + "," + y + ")",
                                            "fill": inst.settings.textColor,
                                            "font-family": inst.settings.fontFamily,
                                            "font-size": "9px",
                                            "text-anchor": "middle"
                                        }).appendTo(gx).getShape();

                                        span = inst.handle.factory("tspan", false).attr({
                                            "alignment-baseline": "middle"
                                        }).appendTo(txt).getShape();
                                        label = arr[i].label;
                                        if (inst.settings.legend === 2) {
                                            label += ": " + arr[i].value;
                                        }
                                        inst.handle.textNode(label, false).appendTo(span);
                                        break;
                                }
                                break;
                        }
                    }

                    roses += 1;

					if (arr[i].category && level + 1 <= deep) {
						drawRoses(arr[i].category, level + 1, startAngle);
					}

					startAngle = endAngle;
				}
			}
			
			if (inst.settings.variation === "multi-level") {

                if (inst.settings.legend && inst.settings.plugin === "svg") {
                    var gx = inst.handle.g().attr({
                        "class": "zui-chart-legend"
                    }).getShape();
                }

				findDeep(inst.settings.series[0]);
				findDeepTotal(inst.settings.series, 0);
				
				var r = inst.settings.radius / (deep + 1);
				for (i = 0; i < deep; i++) {
					if (i > 0) {
						drawRoses(inst.settings.series[0].category, i, 0);
					} else {
						switch (inst.settings.plugin) {
						case 'canvas':
							inst.handle.attr({
								"fillStyle": inst.settings.series[0].color,
								"strokeStyle": "#fff",
								"lineWidth": 2
							}).begin().circle(cx, cy, r).close().fill().stroke();
							break;
						case 'svg':
						default:
							inst.handle.circle(cx, cy, r, false).attr({
								"fill": inst.settings.series[0].color
                            })/*.animate({
								"attributeName": "fill",
								"fill": "freeze",
								"to": inst.settings.series[0].color,
								"from": "#fff",
								"dur": "0.5s"
							})*/
                            .appendTo(g);
							break;
						}

                        if (inst.settings.legend) {
                            switch (inst.settings.plugin) {
                            case 'canvas':
                                switch (inst.settings.legend) {
                                    case 3:
                                    case 4:
                                        break;
                                    case 1:
                                    case 2:
                                    default:
                                        inst.handle.attr({
                                            "font": "9px " + inst.settings.fontFamily,
                                            "textAlign": "center",
                                            "textBaseline": "middle",
                                            "fillStyle": inst.settings.textColor,
                                            "strokeStyle": "transparent"
                                        }).transform(1, 0, 0, 1, cx, cy).text(
                                            inst.settings.series[0].label,
                                            0,
                                            0
                                        ).resetTransform();
                                        break;
                                }
                                break;
                            case 'svg':
                            default:
                                switch (inst.settings.legend) {
                                    case 3:
                                    case 4:
                                        break;
                                    case 1:
                                    case 2:
                                    default:
                                        var txt = inst.handle.factory("text", false).attr({
                                            "x": 0,
                                            "y": 0,
                                            "transform": "matrix(1,0,0,1," + cx + "," + cy + ")",
                                            "fill": inst.settings.textColor,
                                            "font-family": inst.settings.fontFamily,
                                            "font-size": "9px",
                                            "text-anchor": "middle"
                                        }).appendTo(gx).getShape();

                                        var span = inst.handle.factory("tspan", false).attr({
                                            "alignment-baseline": "middle"
                                        }).appendTo(txt).getShape();
                                        inst.handle.textNode(inst.settings.series[0].label, false).appendTo(span);
                                        break;
                                }
                                break;
                            }
                        }
					}
				}
			} else {
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					total += inst.settings.series[i].value;
				}
				
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					rand = Math.floor(Math.random() * 999999);
					end = (inst.settings.series[i].value / total) * 360 + start;
					
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"lineWidth": 2,
							"fillStyle": gradients[i],//inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i],
							"strokeStyle": "#FFFFFF"
						}).sector(cx, cy, inst.settings.radius, start, end);
						break;
					case "svg":
					default:
						inst.handle.sector(cx, cy, inst.settings.radius, start.toFixed(2), end.toFixed(2), false).attr({
							//"fill": inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i],
							"fill": "url(#radial-" + i + ")",
							"stroke": "#FFFFFF",
							"stroke-width": 2,
							"data-rel": "sector_" + rand,
							"zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern 
                    			? inst.settings.tooltip.pattern
                    				.replace('%label', inst.settings.series[i].label) 
                    				.replace('%value', inst.settings.series[i].value)
                    				.replace('%percent', ((inst.settings.series[i].value / total) * 100).toFixed(1) + '%')
                    			: inst.settings.series[i].label)
						})/*.animate({
							"attributeName" : "fill",
							"from" : "#FFF",
							"to": inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i],
							"fill" : "freeze",
							"dur" : "1s"
						})*/.bind("click", function (startAngle, endAngle, color, random) {
							return function (event, el) {
								var $el = $(el),
									$arc = $el.siblings("path[data-rel='arc_" + ($el.attr("data-rel").split("_")[1]) + "']");
								if ($arc.length === 0) {
									inst.handle.arc(cx, cy, inst.settings.radius + 3, startAngle, endAngle, false).attr({
										"fill": "none",
										"stroke": color,
										"stroke-opacity": 1,
										"stroke-width": 3,
										"data-rel": "arc_" + random
									}).appendTo(g);
								} else {
									$arc.remove();
								}
							}
						}(start.toFixed(2), end.toFixed(2), inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i], rand))
                        .bind("mouseenter", function (that) {
                            return function (event, shape) {
                                that._mouseenter.call(that, target, event, shape);
                            }
                        }(this))
                        .bind("mouseleave", function (that) {
                            return function (event, shape) {
                                that._mouseleave.call(that, target, event, shape);
                            }
                        }(this))
                        .bind("mousemove", function (that) {
                            return function (event, shape) {
                                that._mousemove.call(that, target, event, shape);
                            }
                        }(this))
						.appendTo(g);
						break;
					}
					start = end;
				}

                this._tooltip.call(this, target);
				this._showLabelsChart.call(this, target);
				
				if (inst.settings.legend) {
					this._showLegendChart.call(this, target);
				}
			}
		},
		polar: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setCircumference.call(this, target);

			var i, iCnt, j, jCnt, x, y, r, g3, g5,
				p = [],
				cx = Math.floor((inst.settings.width - inst.settings.paddingRight) / 2),
				cy = Math.floor(inst.settings.height / 2),
				bounds2 = this.getBounds2(target),
				deg = 360 / inst.settings.series[0].data.length, 
				colors = Chart.getColors();
			
			if (inst.settings.plugin === "svg") {
				g3 = inst.handle.g().attr({
					"class": "zui-chart-area"/*,
					"transform": ["rotate(-90 ", cx, " ", cy, ")"].join("")*/
				}).getShape();
				g5 = inst.handle.g().attr({
					"class": "zui-chart-points"/*,
					"transform": ["rotate(-90 ", cx, " ", cy, ")"].join("")*/
				}).getShape();
			}
			
			//prepare area
			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					r = (inst.settings.series[j].data[i].value / bounds2.yMax) * inst.settings.radius;
					x = cx + r * Math.cos((-90 + deg * i) * Math.PI/180);
					y = cy + r * Math.sin((-90 + deg * i) * Math.PI/180);
					if (p[j] === undefined) {
						p[j] = [];
					}
					if (i > 0) {
						p[j].push(["L", x, ",", y].join(""));
					} else {
						p[j].push(["M", x, ",", y].join(""));
					}
				}
			}
			
			if (inst.settings.variation !== "scatter") {
				//area
				var rgb;
				for (j = 0, jCnt = p.length; j < jCnt; j++) {
					switch (inst.settings.plugin) {
					case "canvas":
						rgb = Chart.hexToRgb(inst.settings.series[j].color || colors[j]);
						p[j].push(p[j][0]);
						inst.handle.attr({
							"fillStyle": inst.settings.variation === "area" ? ["rgba("+ rgb.r, rgb.g, rgb.b, "0.4)"].join(",") : "none",
							"strokeStyle": inst.settings.series[j].color || colors[j],
							"lineWidth": 2
						}).path(p[j].join(""));
						break;
					case "svg":
					default:
						p[j].push("Z");
						inst.handle.path(p[j].join(""), false).attr({
							"fill": inst.settings.variation === "area" ? inst.settings.series[j].color || colors[j] : "none",
							"fill-opacity": inst.settings.variation === "area" ? 0.4 : 1,
							"stroke": inst.settings.series[j].color || colors[j],
							"stroke-width": 2,
                            "style": "stroke-dasharray: 3000,3000"
						}).appendTo(g3);
						break;
					}
				}
			}
			
			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					r = (inst.settings.series[j].data[i].value / bounds2.yMax) * inst.settings.radius;
					x = cx + r * Math.cos((-90 + deg * i) * Math.PI/180);
					y = cy + r * Math.sin((-90 + deg * i) * Math.PI/180);
					
					if (inst.settings.points || inst.settings.variation === "scatter") {
						switch (inst.settings.plugin) {
						case "canvas":
							inst.handle.attr({
								"fillStyle": "#FFFFFF",
								"strokeStyle": inst.settings.series[j].color || colors[j],
								"lineWidth": 2
							}).begin().circle(x, y, 3).close().fill().stroke();
							break;
						case "svg":
						default:
							inst.handle.circle(x, y, 3, false).attr({
								"fill": "#FFFFFF",
								"stroke": inst.settings.series[j].color || colors[j],
								"stroke-width": 2
							}).appendTo(g5);
							break;
						}
					}
				}
			}
			
			this.setCircumferenceLabels.call(this, target);
			if (inst.settings.legend) {
				this._showLegendChart.call(this, target);
			}
		},
		radar: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			this.setCircumference.call(this, target);
			
			var i, iCnt, j, jCnt, x, y, r, g3, rgb,
				d = [],
				p = [],
				cx = Math.floor((inst.settings.width - inst.settings.paddingRight) / 2),
				cy = Math.floor(inst.settings.height / 2),
				bounds2 = this.getBounds2(target),
				deg = 360 / inst.settings.series[0].data.length, 
				colors = Chart.getColors();
			
			if (inst.settings.plugin === "svg") {
				g3 = inst.handle.g().attr({
					"class": "zui-chart-area"/*,
					"transform": ["rotate(-90 ", cx, " ", cy, ")"].join("")*/
				}).getShape();
			}
			
			//prepare area
			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					r = (inst.settings.series[j].data[i].value / bounds2.yMax) * inst.settings.radius;
					x = cx + r * Math.cos((-90 + deg * (i)) * Math.PI/180);
					y = cy + r * Math.sin((-90 + deg * (i)) * Math.PI/180);
					if (p[j] === undefined) {
						p[j] = [];
					}
					if (i > 0) {
						p[j].push(["L", x, ",", y].join(""));
					} else {
						p[j].push(["M", x, ",", y].join(""));
					}
				}
			}
			
			//area
			for (j = 0, jCnt = p.length; j < jCnt; j++) {
				switch (inst.settings.plugin) {
				case "canvas":
					rgb = Chart.hexToRgb(inst.settings.series[j].color || colors[j]);
					p[j].push(p[j][0]);
					inst.handle.attr({
						"fillStyle": ["rgba("+ rgb.r, rgb.g, rgb.b, "0.4)"].join(","),
						"strokeStyle": inst.settings.series[j].color || colors[j],
						"lineWidth": 1
					}).path(p[j].join(""));
					break;
				case "svg":
				default:
					p[j].push("Z");
					inst.handle.path(p[j].join(""), false).attr({
						"fill": inst.settings.series[j].color || colors[j],
						"fill-opacity": 0.4,
						"stroke": inst.settings.series[j].color || colors[j],
						"stroke-width": 1
					}).appendTo(g3);
					break;
				}
			}
			
			this.setCircumferenceLabels.call(this, target);
			if (inst.settings.legend) {
				this._showLegendChart.call(this, target);
			}
		},
		rose: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setCircumference.call(this, target);
			
			var i, iCnt, j, jCnt, x, y, r, g3, g5,
				d, startAngle, endAngle, start, end, percent, diff, tmp, tmpStart, tmpEnd, tmpRadius,
				highest = 0,
				gradients = [],
				sum = [],
				cx = Math.floor((inst.settings.width - inst.settings.paddingRight) / 2),
				cy = Math.floor(inst.settings.height / 2),
				bounds2 = this.getBounds2(target),
				deg = 360 / inst.settings.series[0].data.length, 
				colors = Chart.getColors();
			
			if (inst.settings.plugin === "svg") {
				g3 = inst.handle.g().attr({
					"class": "zui-chart-area"/*,
					"transform": ["rotate(-90 ", cx, " ", cy, ")"].join("")*/
				}).getShape();
				g5 = inst.handle.g().attr({
					"class": "zui-chart-area222"/*,
					"transform": ["rotate(-90 ", cx, " ", cy, ")"].join("")*/
				}).getShape();
				
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					
					gradients[i] = inst.handle.radialGradient(cx, cy, inst.settings.radius).attr({
						"id": "radial-" + i,
						"gradientUnits": "userSpaceOnUse"
					}).getShape();
					
					inst.handle.factory("stop", false).attr({
						"offset": "0",
						"stop-color": inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i]
					}).appendTo(gradients[i]);
					
					inst.handle.factory("stop", false).attr({
						"offset": "1",
						"stop-color": Chart.colorLuminance(inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i], -0.3)
					}).appendTo(gradients[i]);
				}
			}

            for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
                sum[i] = 0;
                for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
                    sum[i] += inst.settings.series[j].data[i].value;
                }
            }

			switch (inst.settings.stacking) {
			case "normal":
			case "percent":
				highest = Math.max.apply(Math, sum);
				break;
			}

			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				tmp = 0;
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					if (!inst.settings.stacking) {
						r = (inst.settings.series[j].data[i].value / bounds2.yMax) * inst.settings.radius;
						
						startAngle = -90 + deg * (i) + (deg/(jCnt)) * (j-1);
						endAngle = -90 + deg * (i) + (deg/(jCnt)) * j;
						
						switch (inst.settings.plugin) {
						case "canvas":
							inst.handle.attr({
								"fillStyle": colors[j]
							}).sector(cx, cy, r, startAngle, endAngle);
							break;
						case "svg":
						default:
							inst.handle.sector(cx, cy, r, startAngle, endAngle, false).attr({
								//"fill": colors[j-1]
								"fill": "url(#radial-" + j + ")",
                                "zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern
                                    ? inst.settings.tooltip.pattern
                                        .replace('%label', inst.settings.series[j].label)
                                        .replace('%value', inst.settings.series[j].data[i].value)
                                        .replace('%percent', ((inst.settings.series[j].data[i].value / sum[i]) * 100).toFixed(1) + '%')
                                    : inst.settings.series[i].label)
                            })
                            .bind("mouseenter", function (that) {
                                return function (event, shape) {
                                    that._mouseenter.call(that, target, event, shape);
                                }
                            }(this))
                            .bind("mouseleave", function (that) {
                                return function (event, shape) {
                                    that._mouseleave.call(that, target, event, shape);
                                }
                            }(this))
                            .bind("mousemove", function (that) {
                                return function (event, shape) {
                                    that._mousemove.call(that, target, event, shape);
                                }
                            }(this))
                                .appendTo(g3);
							break;
						}
					} else {
						
						switch (inst.settings.stacking) {
						case "normal":
							percent = inst.settings.series[j].data[i].value / highest;
							r = inst.settings.radius * (percent + tmp);
							tmp += percent;
							//r = (inst.settings.series[j].data[i].value / bounds2.yMax) * inst.settings.radius;
							break;
						case "percent":
							percent = inst.settings.series[j].data[i].value / sum[i];
							r = inst.settings.radius * (percent + tmp);
							tmp += percent;
							break;
						}

						startAngle = -90 + deg * (i);
						endAngle = -90 + deg * (i) + deg;

						diff = Math.abs(startAngle - endAngle) / 4;
						startAngle += diff;
						endAngle -= diff;
						
						start = polarToCartesian(cx, cy, r, -startAngle);
						end = polarToCartesian(cx, cy, r, -endAngle);

						if (j > 0) {
							switch (inst.settings.plugin) {
							case "canvas":
								inst.handle.attr({
									"fillStyle": colors[j]
								})
								.begin()
								.moveTo(tmpEnd[0], tmpEnd[1])
							    .lineTo(end[0], end[1])
							    .arc(cx, cy, r, startAngle*Math.PI/180, endAngle*Math.PI/180, false)
							    .lineTo(start[0], start[1])
							    .lineTo(tmpStart[0], tmpStart[1])
							    .arc(cx, cy, tmpRadius, startAngle*Math.PI/180, endAngle*Math.PI/180, false)
							    //.lineTo(tmpEnd[0], tmpEnd[1])
							    .close()
							    .stroke()
							    .fill();
								break;
							case "svg":
							default:
								inst.handle.rose(
									start[0], start[1], //Mmx,my
									r, end[0], end[1], //Ar1,r1 0 0,1 x1,y1
									tmpEnd[0], tmpEnd[1], //Llx,ly
									tmpRadius, tmpStart[0], tmpStart[1], //Ar2,r2 0 0,0 x2,y2
									false
								).attr({
									//"fill": colors[j-1]
									"fill": "url(#radial-" + j + ")",
                                    "zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern
                                        ? inst.settings.tooltip.pattern
                                            .replace('%label', inst.settings.series[j].label)
                                            .replace('%value', inst.settings.series[j].data[i].value)
                                            .replace('%percent', ((inst.settings.series[j].data[i].value / sum[i]) * 100).toFixed(1) + '%')
                                        : inst.settings.series[i].label)
								})
                                .bind("mouseenter", function (that) {
                                    return function (event, shape) {
                                        that._mouseenter.call(that, target, event, shape);
                                    }
                                }(this))
                                .bind("mouseleave", function (that) {
                                    return function (event, shape) {
                                        that._mouseleave.call(that, target, event, shape);
                                    }
                                }(this))
                                .bind("mousemove", function (that) {
                                    return function (event, shape) {
                                        that._mousemove.call(that, target, event, shape);
                                    }
                                }(this))
                                .appendTo(g3);
								break;
							}
						} else {
							switch (inst.settings.plugin) {
							case "canvas":
								inst.handle.attr({
									"fillStyle": colors[j]
								}).sector(cx, cy, r, startAngle, endAngle);
								break;
							case "svg":
							default:
								inst.handle.rose(
									start[0], start[1], //Mmx,my
									r, end[0], end[1], //Ar1,r1 0 0,1 x1,y1
									cx, cy, //Llx,ly
									0, cx, cy, //Ar2,r2 0 0,0 x2,y2
									false
								).attr({
									//"fill": colors[j-1]
									"fill": "url(#radial-" + j + ")",
                                    "zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern
                                        ? inst.settings.tooltip.pattern
                                            .replace('%label', inst.settings.series[j].label)
                                            .replace('%value', inst.settings.series[j].data[i].value)
                                            .replace('%percent', ((inst.settings.series[j].data[i].value / sum[i]) * 100).toFixed(1) + '%')
                                        : inst.settings.series[i].label)
								})
                                .bind("mouseenter", function (that) {
                                    return function (event, shape) {
                                        that._mouseenter.call(that, target, event, shape);
                                    }
                                }(this))
                                .bind("mouseleave", function (that) {
                                    return function (event, shape) {
                                        that._mouseleave.call(that, target, event, shape);
                                    }
                                }(this))
                                .bind("mousemove", function (that) {
                                    return function (event, shape) {
                                        that._mousemove.call(that, target, event, shape);
                                    }
                                }(this))
                                .appendTo(g3);
								break;
							}
						}
						
						tmpStart = start;
						tmpEnd = end;
						tmpRadius = r;
					}
				}
			}

            this._tooltip.call(this, target);
			this.setCircumferenceLabels.call(this, target);
			if (inst.settings.legend) {
				this._showLegendChart.call(this, target);
			}
		},
		donut: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var i, iCnt, endAngle, rand, g, 
				start, end, tmpStart, tmpEnd,
				r1 = inst.settings.innerRadius,
				r2 = inst.settings.radius,
				gradients = [],
				startAngle = 0,
				total = 0,
				cx = Math.floor((inst.settings.width - inst.settings.paddingRight) / 2),
				cy = Math.floor(inst.settings.height / 2),
				colors = Chart.getColors();
			
			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chart-canvas"
				}).getShape();
				
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					
					gradients[i] = inst.handle.radialGradient(cx, cy, inst.settings.radius).attr({
						"id": "radial-" + i,
						"gradientUnits": "userSpaceOnUse"
					}).getShape();
					
					inst.handle.factory("stop", false).attr({
						"offset": "0",
						"stop-color": inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i]
					}).appendTo(gradients[i]);
					
					inst.handle.factory("stop", false).attr({
						"offset": "1",
						"stop-color": Chart.colorLuminance(inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i], -0.3)
					}).appendTo(gradients[i]);
				}
			} else if (inst.settings.plugin === "canvas") {
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					gradients[i] = inst.handle.radialGradient(cx, cy, inst.settings.radius*0.9, cx, cy, inst.settings.radius-inst.settings.radius);
					gradients[i].addColorStop(0, inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i]);
					gradients[i].addColorStop(1, Chart.colorLuminance(inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i], -0.3));
				}
			}
			
			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
				total += inst.settings.series[i].value;
			}

			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
				rand = Math.floor(Math.random() * 999999);
				endAngle = (inst.settings.series[i].value / total) * 360 + startAngle;
				
				switch (inst.settings.plugin) {
				case "canvas":
					start = polarToCartesian(cx, cy, r1, -startAngle);
					end = polarToCartesian(cx, cy, r1, -endAngle);
					tmpStart = polarToCartesian(cx, cy, r2, -startAngle);
					tmpEnd = polarToCartesian(cx, cy, r2, -endAngle);
					
					inst.handle
						.attr({
							"lineWidth": 2,
							"fillStyle": gradients[i],
							"strokeStyle": "#FFFFFF"
						})
						.begin()
						.moveTo(tmpEnd[0], tmpEnd[1])
						.lineTo(end[0], end[1])
						.arc(cx, cy, r1, endAngle*Math.PI/180, startAngle*Math.PI/180, true)
						.lineTo(start[0], start[1])
						.lineTo(tmpStart[0], tmpStart[1])
						.arc(cx, cy, r2, startAngle*Math.PI/180, endAngle*Math.PI/180, false)
						//.lineTo(tmpEnd[0], tmpEnd[1])
						.close()
						.fill()
						.stroke();
					break;
				case "svg":
				default:
					start = polarToCartesian(cx, cy, r1, -startAngle);
					end = polarToCartesian(cx, cy, r1, -endAngle);
					tmpStart = polarToCartesian(cx, cy, r2, -startAngle);
					tmpEnd = polarToCartesian(cx, cy, r2, -endAngle);
					
					inst.handle.rose(
						start[0], start[1],
						r1, end[0], end[1],
						tmpEnd[0], tmpEnd[1],
						r2, tmpStart[0], tmpStart[1],
						false
					).attr({
						//"fill": inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i],
						"fill": "url(#radial-" + i + ")",
						"stroke": "#FFFFFF",
						"stroke-width": 2,
						"data-rel": "sector_" + rand,
						"zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern 
                    		? inst.settings.tooltip.pattern
                    			.replace('%label', inst.settings.series[i].label)
                    			.replace('%value', inst.settings.series[i].value)
                    			.replace('%percent', ((inst.settings.series[i].value / total) * 100).toFixed(1) + '%')
                    		: inst.settings.series[i].label)
					})/*.animate({
						"attributeName" : "fill",
						"from" : "#FFF",
						"to": inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i],
						"fill" : "freeze",
						"dur" : "1s"
					})*/.bind("click", function (sAngle, eAngle, color, random) {
						return function (event, el) {
							var $el = $(el),
								$arc = $el.siblings("path[data-rel='arc_" + ($el.attr("data-rel").split("_")[1]) + "']");
							if ($arc.length === 0) {
								inst.handle.arc(cx, cy, inst.settings.radius + 3, sAngle, eAngle, false).attr({
									"fill": "none",
									"stroke": color,
									"stroke-opacity": 1,
									"stroke-width": 3,
									"data-rel": "arc_" + random
								}).appendTo(g);
							} else {
								$arc.remove();
							}
						}
					}(startAngle.toFixed(2), endAngle.toFixed(2), inst.settings.series[i].color !== undefined ? inst.settings.series[i].color : colors[i], rand))
                    .bind("mouseenter", function (that) {
                        return function (event, shape) {
                            that._mouseenter.call(that, target, event, shape);
                        }
                    }(this))
                    .bind("mouseleave", function (that) {
                        return function (event, shape) {
                            that._mouseleave.call(that, target, event, shape);
                        }
                    }(this))
                    .bind("mousemove", function (that) {
                        return function (event, shape) {
                            that._mousemove.call(that, target, event, shape);
                        }
                    }(this))
					.appendTo(g);
					break;
				}
				
				startAngle = endAngle;
			}
			
            this._tooltip.call(this, target);
			this._showLabelsChart.call(this, target);
			if (inst.settings.legend) {
				this._showLegendChart.call(this, target);
			}
		},
		_lineArea: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}

			this.setPlot.call(this, target);
			
			if (inst.settings.legend) {
				this._showLegendChart.call(this, target);
			}
			
			var i, iCnt, j, jCnt, xFirst, xLast, d1, d2, y, g, g2,
                sum = [],
				colors = Chart.getColors();
			
			if (inst.settings.plugin === "svg") {
                if (inst.settings.type === "area") {
                    g2 = inst.handle.g().attr({
                        "class": "zui-chart-plot"
                    }).getShape();
                }
                g = inst.handle.g().attr({
					"class": "zui-chart-canvas",
					"clip-path": "url(#zinoui-" + inst.uid + ")"
				}).getShape();
			}

            for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
                sum[i] = 0;
                for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
                    sum[i] += inst.settings.series[j].data[i].value;
                }
            }

			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
				// line
				xFirst = inst.settings.paddingLeft + inst.settings.blockWidth/2;
				d1 = [];
				d2 = [];
				for (j = 0, jCnt = inst.settings.series[i].data.length; j < jCnt; j++) {
					xLast = inst.settings.paddingLeft + inst.settings.blockWidth * (j) + inst.settings.blockWidth/2;
					//y = this.getY(target, inst.settings.series[j][i]);
					y = this.getY(target, inst.settings.series[i].data[j].value);
					if (j === 0) {
						d1.push("M" + xFirst + "," + y);
						d2.push("M" + xFirst + "," + y);
					} else {
						d1.push("L" + xLast + "," + y);
						d2.push("L" + xLast + "," + y);
					}
					this.points.push({
						x: xLast, 
						y: y, 
						radius: 3,
						color: inst.settings.series[i].color || colors[i],
						name: inst.settings.categories[0].category[j].label,
						data: inst.settings.series[i].data[j].value
					});
				}

				var rgb = Chart.hexToRgb(inst.settings.series[i].color || colors[i]);
				
				if (inst.settings.type === "area") {
					d2.push("L" + xLast + "," + (inst.settings.height - inst.settings.paddingBottom));
					d2.push("L" + xFirst + "," + (inst.settings.height - inst.settings.paddingBottom));
					
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": ["rgba("+ rgb.r, rgb.g, rgb.b, "0.3)"].join(","),
							"strokeStyle": "transparent"
						}).path(d2.join(""));
						break;
					case "svg":
					default:
						d2.push("Z");
						inst.handle.path(d2.join(""), false).attr({
							"fill": inst.settings.series[i].color || colors[i],
							"fill-opacity": 0.3,
							"stroke": "none",
							"stroke-width": 0
						}).appendTo(g2);
						break;
					}
				}

				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr({
						"fillStyle": "transparent",
						"strokeStyle": inst.settings.series[i].color || colors[i],
						"lineWidth": 2
					}).path(d1.join(""));
					break;
				case "svg":
				default:
					inst.handle.path(d1.join(""), false).attr({
						"fill": "none",
						"fill-opacity": 1,
						"stroke": inst.settings.series[i].color || colors[i],
						"stroke-width": 2,
						"style": "stroke-dasharray: 3000,3000"
					}).appendTo(g);
					break;
				}
			}

			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
				for (j = 0, jCnt = inst.settings.series[i].data.length; j < jCnt; j++) {
					xLast = inst.settings.paddingLeft + inst.settings.blockWidth * (j) + inst.settings.blockWidth/2;
					y = this.getY(target, inst.settings.series[i].data[j].value);
					
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": "#FFFFFF",
							"strokeStyle": inst.settings.series[i].color || colors[i],
							"lineWidth": 2
						}).begin().circle(xLast, y, 4).close().fill().stroke();
						break;
					case "svg":
					default:
						inst.handle.circle(xLast, y, 4, false).attr({
							"fill": "#FFFFFF",
							"stroke": inst.settings.series[i].color || colors[i],
							"stroke-width": 2,
                            "zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern
                                ? inst.settings.tooltip.pattern
                                    .replace('%label', inst.settings.series[i].label)
                                    .replace('%value', inst.settings.series[i].data[j].value)
                                    .replace('%percent', ((inst.settings.series[i].data[j].value / sum[i]) * 100).toFixed(1) + '%')
                                : inst.settings.series[i].label)
						})
                        .bind("mouseenter", function (that) {
                            return function (event, shape) {
                                that._mouseenter.call(that, target, event, shape);
                            }
                        }(this))
                        .bind("mouseleave", function (that) {
                            return function (event, shape) {
                                that._mouseleave.call(that, target, event, shape);
                            }
                        }(this))
                        .bind("mousemove", function (that) {
                            return function (event, shape) {
                                that._mousemove.call(that, target, event, shape);
                            }
                        }(this))
                        .appendTo(g);
						break;
					}
				}
			}

            this._tooltip.call(this, target);
		},
		line: function (target) {
			this._lineArea.call(this, target);
		},
		area: function (target) {
			this._lineArea.call(this, target);
		},
		bar: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setPlot.call(this, target);
			
			if (inst.settings.legend) {
				this._showLegendChart.call(this, target);
			}
			
			var i, iCnt, j, jCnt, g, y, width, height, percent, tmp,
				gradients = [],
				highest = 0,
				sum = [],
				sCnt = inst.settings.series.length,
				x = this.getXX(target, 0),
				max = this.getBounds2(target).yMax,
				colors = Chart.getColors();
			
			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chart-canvas",
					"clip-path": "url(#zinoui-" + inst.uid + ")"
				}).getShape();
				
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					
					gradients[i] = inst.handle.linearGradient("50%", "0%", "50%", "100%").attr({
						"id": "linear-" + i
					}).getShape();
					
					inst.handle.factory("stop", false).attr({
						"offset": "0%",
						"stop-color": inst.settings.series[i].color || colors[i]
					}).appendTo(gradients[i]);
					
					inst.handle.factory("stop", false).attr({
						"offset": "100%",
						"stop-color": Chart.colorLuminance(inst.settings.series[i].color || colors[i], -0.3)
					}).appendTo(gradients[i]);
				}
			}

            for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
                sum[i] = 0;
                for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
                    sum[i] += inst.settings.series[j].data[i].value;
                }
            }

			switch (inst.settings.stacking) {
			case "normal":
			case "percent":
				highest = Math.max.apply(Math, sum);
				height = inst.settings.blockHeight / 2;
				break;
			default:
				height = (inst.settings.blockHeight / 2) / sCnt;
				break;
			}

			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				tmp = 0;
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					
					switch (inst.settings.stacking) {
					case "normal":
						percent = inst.settings.series[j].data[i].value / highest;
						width = inst.settings.canvasWidth * percent;
						x = tmp + inst.settings.paddingLeft;
						y = inst.settings.paddingTop + (i) * inst.settings.blockHeight + ((inst.settings.blockHeight-height)/2);
						tmp += width;
						break;
					case "percent":
						percent = inst.settings.series[j].data[i].value / sum[i];
						width = inst.settings.canvasWidth * percent;
						x = tmp + inst.settings.paddingLeft;
						y = inst.settings.paddingTop + (i) * inst.settings.blockHeight + ((inst.settings.blockHeight-height)/2);
						tmp += width;
						break;
					default:
						width = (inst.settings.series[j].data[i].value / max) * (inst.settings.canvasWidth);
						//y = inst.settings.paddingTop + 10 * (j-1) + 10 * (i-1) * jCnt;
						y = inst.settings.paddingTop + (i) * inst.settings.blockHeight + (height+ 2) * (j) + (inst.settings.blockHeight - (height+ 2) * (jCnt-1) + 2) / 2;
						//x = inst.settings.paddingLeft + (i-1) * inst.settings.blockWidth + (width + 2) * (j-1) + (inst.settings.blockWidth - (width + 2) * sCnt + 2) / 2;
						break;
					}

					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": colors[j]
						}).fillRect(x, y, width, height);
						break;
					case "svg":
					default:
						inst.handle.rect(x, y, 0, 0, width, height, false).attr({
							//"fill": colors[j1]
							"fill": "url(#linear-" + j + ")",
                            "zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern
                                ? inst.settings.tooltip.pattern
                                    .replace('%label', inst.settings.series[j].label)
                                    .replace('%value', inst.settings.series[j].data[i].value)
                                    .replace('%percent', ((inst.settings.series[j].data[i].value / sum[i]) * 100).toFixed(1) + '%')
                                : inst.settings.series[j].label)
						})/*.animate({
							"attributeName": "x",
							"attributeType": "XML",
							"from": -inst.settings.width + inst.settings.paddingLeft,
							"to": x,
							"dur": "0.8s",
							"repeatCount": 1
						})*/
                        .bind("mouseenter", function (that) {
                            return function (event, shape) {
                                that._mouseenter.call(that, target, event, shape);
                            }
                        }(this))
                        .bind("mouseleave", function (that) {
                            return function (event, shape) {
                                that._mouseleave.call(that, target, event, shape);
                            }
                        }(this))
                        .bind("mousemove", function (that) {
                            return function (event, shape) {
                                that._mousemove.call(that, target, event, shape);
                            }
                        }(this))
                        .appendTo(g);
						break;
					}
				}
			}

            this._tooltip.call(this, target);
		},
		bubble: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			//this.setPlot.call(this, target);
			this.setGrid.call(this, target);
			this.setAxis.call(this, target);

			var i, iCnt, j, jCnt, cx, cy, r, xMax, yMax, g, gx, gy, textAttr, rgb, txt, span,
				colors = Chart.getColors(),
				bounds2 = this.getBounds2(target);
			
			if (inst.settings.plugin === "svg") {
				textAttr = {
					"fill": inst.settings.textColor,
					"font-family": inst.settings.fontFamily,
					"font-size": inst.settings.fontSize,
					"text-anchor": "middle"
				};
				gy = inst.handle.g().attr({
					"class": "zui-chart-labels zui-chart-labels-y"
				}).getShape();
				gx = inst.handle.g().attr({
					"class": "zui-chart-labels zui-chart-labels-x"
				}).getShape();
				g = inst.handle.g().attr({
					"class": "zui-chart-circles"/*,
					"clip-path": "url(#zinoui-" + inst.uid + ")"*/
				}).getShape();
			} else if (inst.settings.plugin === "canvas") {
				textAttr = {
					"fillStyle": inst.settings.textColor,
					"font": inst.settings.fontSize + " " + inst.settings.fontFamily,
					"strokeStyle": "transparent"
				};
			}

			inst.settings.series.sort(function (a, b) {
				if (!isNaN(parseFloat(a[1])) && isFinite(a[1])) {
					if (a[1] < b[1]) {
						return -1;
					} else if (a[1] > b[1]) {
						return 1;
					}
					return 0;
				}
				return -1;
			});

			//x axis
			for (i = 0, iCnt = inst.settings.categories[0].category.length; i < iCnt; i++) {
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr(textAttr).attr({
						"textAlign": "center"
					}).text(
						inst.settings.categories[0].category[i].label,
						inst.settings.paddingLeft + inst.settings.blockWidth * (i) + inst.settings.blockWidth/2,
						inst.settings.height - inst.settings.paddingBottom + 20
					);
					break;
				case "svg":
				default:
					inst.handle.text(
						inst.settings.paddingLeft + inst.settings.blockWidth * (i) + inst.settings.blockWidth/2,
						inst.settings.height - inst.settings.paddingBottom + 20, 
						inst.settings.categories[0].category[i].label,
						false
					).attr(textAttr).appendTo(gx);
					break;
				}
			}

			//y axis
			for (i = 0; i <= bounds2.yMax; i = i + Math.ceil(bounds2.yMax / 4)) {
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr(textAttr).attr({
						"textBaseline": "middle",
						"textAlign": "right"
					}).text(
						i,
						inst.settings.paddingLeft - 20, 
						this.getYY(target, i)
					);
					break;
				case "svg":
				default:
                    txt = inst.handle.factory("text", false).attr(textAttr).attr({
                        "x": inst.settings.paddingLeft - 10,
                        "y": this.getYY(target, i),
                        "text-anchor": "end"
                    }).appendTo(gy).getShape();
                    span = inst.handle.factory("tspan", {
                        "alignment-baseline": "middle"
                    }, false).appendTo(txt).getShape();
                    inst.handle.textNode(i, false).appendTo(span);
					break;
				}
			}

			var xMin = bounds2.xMin,
				xMax = bounds2.xMax,
				yMin = bounds2.yMin,
				yMax = bounds2.yMax;
			
			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					cx = this.getX(target, inst.settings.series[j].data[i].x);//inst.settings.paddingLeft + (inst.settings.series[i][1] / xMax) * inst.settings.canvasWidth;
					cy = this.getY(target, inst.settings.series[j].data[i].y);//inst.settings.paddingTop + inst.settings.canvasHeight - (inst.settings.series[i][2] / yMax) * inst.settings.canvasHeight;
					//cx = inst.settings.paddingLeft + (inst.settings.series[j].data[i].x / xMin - inst.settings.series[j].data[i].x / xMax) * inst.settings.canvasWidth;
					//cy = inst.settings.paddingTop + inst.settings.canvasHeight - (inst.settings.series[j].data[i].y / yMin - inst.settings.series[j].data[i].y / yMax) * inst.settings.canvasHeight;
					
					if (inst.settings.series[j].data[i].z !== undefined) {
						r = (inst.settings.series[j].data[i].z / bounds2.zMax) * 20;
					}
					switch (inst.settings.plugin) {
					case "canvas":
						rgb = Chart.hexToRgb(inst.settings.series[j].color || colors[j]);
						inst.handle.attr({
							//"fillStyle": inst.settings.series[j].color || colors[j]
							"fillStyle": ["rgba("+ rgb.r, rgb.g, rgb.b, "0.4)"].join(",")
						}).begin().circle(cx, cy, r).fill();
						break;
					case "svg":
					default:
						inst.handle.circle(cx, cy, r, false).attr({
							"fill": inst.settings.series[j].color || colors[j],
							"fill-opacity": 0.7,
							"stroke": "none",
							"stroke-width": 0
						}).appendTo(g);
						break;
					}
				}
			}
		},
		ohlc: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setPlot.call(this, target);

			var i, iCnt, j, jCnt, fill, x, y, x1, x2, y1, y2, cHeight, rand, gItems, gItem,
				cWidth = inst.settings.blockWidth * 0.55,
				colors = Chart.getColors(),
				bounds = this.getBounds(target);
	
			if (inst.settings.plugin === "svg") {
				gItems = inst.handle.g().attr({
					"class": "zui-chart-items",
					"clip-path": "url(#zinoui-" + inst.uid + ")"
				}).getShape();
			}

			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {

                if (inst.settings.plugin === "svg") {
                    //FIXME
                    inst.settings.tooltip.pattern = "%label, open: %open, high: %high, low: %low, close: %close";

                    gItem = inst.handle.g(false).attr({
                        "class": "zui-chart-item",
                        "zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern
                            ? inst.settings.tooltip.pattern
                                .replace('%label', inst.settings.series[i].label)
                                .replace('%open', inst.settings.series[i].open)
                                .replace('%high', inst.settings.series[i].high)
                                .replace('%low', inst.settings.series[i].low)
                                .replace('%close', inst.settings.series[i].close)
                            : inst.settings.series[i].label)
                    })
                    .bind("mouseenter", function (that) {
                        return function (event, shape) {
                            that._mouseenter.call(that, target, event, shape);
                        }
                    }(this))
                    .bind("mouseleave", function (that) {
                        return function (event, shape) {
                            that._mouseleave.call(that, target, event, shape);
                        }
                    }(this))
                    .bind("mousemove", function (that) {
                        return function (event, shape) {
                            that._mousemove.call(that, target, event, shape);
                        }
                    }(this))
                    .appendTo(gItems)
                    .getShape();
                }

				//fill = inst.settings.series[i][2] < inst.settings.series[i][3];
				fill = inst.settings.series[i].high < inst.settings.series[i].low;
				
				x = inst.settings.paddingLeft + i*inst.settings.blockWidth + inst.settings.blockWidth/2;
				//y1 = this.getY(target, inst.settings.series[i][2]);//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][2] / bounds.yMax);
				//y2 = this.getY(target, inst.settings.series[i][3]);//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][3] / bounds.yMax);
				y1 = this.getY(target, inst.settings.series[i].high);//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][2] / bounds.yMax);
				y2 = this.getY(target, inst.settings.series[i].low);//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][3] / bounds.yMax);
				switch (inst.settings.plugin) {
				case "canvas":
					//vertical (high-to-low)
					inst.handle.attr({
				    	"strokeStyle": (inst.settings.series[i].color || colors[0]),
				    	"lineWidth": 2
					}).line(x + 0.5, y1, x + 0.5, y2);
					//left (open)
					y1 = this.getY(target, inst.settings.series[i].open);
					inst.handle.line(x+1 + 0.5, y1, x-6 + 0.5, y1);
					//right (close)
					y2 = this.getY(target, inst.settings.series[i].close);
					inst.handle.line(x-1 + 0.5, y2, x+6 + 0.5, y2);
					break;
				case "svg":
				default:
					//vertical (high-to-low)
					inst.handle.line(x, y1, x, y2, false).attr({
						"shape-rendering": "crispEdges",
				    	//"stroke": (inst.settings.series[i][5] || colors[0]),
				    	"stroke": (inst.settings.series[i].color || colors[0]),
				    	"stroke-width": 2
					}).appendTo(gItem);
					//left (open)
					//y1 = this.getY(target, inst.settings.series[i][1]);//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][1] / bounds.yMax);
					y1 = this.getY(target, inst.settings.series[i].open);//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][1] / bounds.yMax);
					inst.handle.line(x+1, y1, x-6, y1, false).attr({
						"shape-rendering": "crispEdges",
				    	"stroke": (inst.settings.series[i].color || colors[0]),
				    	//"stroke": (inst.settings.series[i][5] || colors[0]),
				    	"stroke-width": 2
					}).appendTo(gItem);
					//right (close)
					//y2 = this.getY(target, inst.settings.series[i][4]);//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][4] / bounds.yMax);
					y2 = this.getY(target, inst.settings.series[i].close);//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][4] / bounds.yMax);
					inst.handle.line(x-1, y2, x+6, y2, false).attr({
						"shape-rendering": "crispEdges",
				    	"stroke": (inst.settings.series[i].color || colors[0]),
				    	//"stroke": (inst.settings.series[i][5] || colors[0]),
				    	"stroke-width": 2
					}).appendTo(gItem);
					break;
				}
			}

            this._tooltip.call(this, target);
		},
		candlestick: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setPlot.call(this, target);
			
			var i, iCnt, j, jCnt, fill, x, y, x1, x2, y1, y2, cHeight, rand, gCandles, gCandle,
				cWidth = inst.settings.blockWidth * 0.55,
				colors = Chart.getColors(),
				bounds = this.getBounds(target);

			if (inst.settings.plugin === "svg") {
                gCandles = inst.handle.g().attr({
                    "class": "zui-chart-candles",
                    "clip-path": "url(#zinoui-" + inst.uid + ")"
                }).getShape();
			}

			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {

                if (inst.settings.plugin === 'svg') {
                    //FIXME
                    inst.settings.tooltip.pattern = "%label, open: %open, high: %high, low: %low, close: %close";

                    gCandle = inst.handle.g(false).attr({
                        "class": "zui-chart-candle",
                        "zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern
                            ? inst.settings.tooltip.pattern
                                .replace('%label', inst.settings.series[i].label)
                                .replace('%open', inst.settings.series[i].open)
                                .replace('%high', inst.settings.series[i].high)
                                .replace('%low', inst.settings.series[i].low)
                                .replace('%close', inst.settings.series[i].close)
                            : inst.settings.series[i].label)
                    })
                    .bind("mouseenter", function (that) {
                        return function (event, shape) {
                            that._mouseenter.call(that, target, event, shape);
                        }
                    }(this))
                    .bind("mouseleave", function (that) {
                        return function (event, shape) {
                            that._mouseleave.call(that, target, event, shape);
                        }
                    }(this))
                    .bind("mousemove", function (that) {
                        return function (event, shape) {
                            that._mousemove.call(that, target, event, shape);
                        }
                    }(this))
                    .appendTo(gCandles)
                    .getShape();
                }

				//fill = inst.settings.series[i][2] < inst.settings.series[i][3];
				fill = inst.settings.series[i].high < inst.settings.series[i].low;
				
				//lower line
				x1 = x2 = inst.settings.paddingLeft + i*inst.settings.blockWidth + inst.settings.blockWidth/2;
				//y1 = inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][1] / bounds.yMax);
				//y2 = inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][2] / bounds.yMax);
				y1 = inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i].open / bounds.yMax);
				y2 = inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i].high / bounds.yMax);
				if (y1 > y2) {
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
					    	"strokeStyle": (inst.settings.series[i].color || colors[0]),
					    	"lineWidth": 2
						}).line(x1 + 0.5, y1, x2 + 0.5, y2);
						break;
					case "svg":
					default:
						inst.handle.line(x1, y1, x2, y2, false).attr({
							"shape-rendering": "crispEdges",
					    	"stroke": (inst.settings.series[i].color || colors[0]),
					    	"stroke-width": 2
						}).appendTo(gCandle);
						break;
					}
				}
				
				//upper line
				x1 = x2 = inst.settings.paddingLeft + i*inst.settings.blockWidth + inst.settings.blockWidth/2;
				//y1 = inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][3] / bounds.yMax);
				//y2 = inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][4] / bounds.yMax);
				y1 = inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i].low / bounds.yMax);
				y2 = inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i].close / bounds.yMax);
				if (y1 > y2) {
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
					    	"strokeStyle": (inst.settings.series[i].color || colors[0]),
					    	"lineWidth": 2
						}).line(x1 + 0.5, y1, x2 + 0.5, y2);
						break;
					case "svg":
					default:
						inst.handle.line(x1, y1, x2, y2, false).attr({
							"shape-rendering": "crispEdges",
					    	"stroke": (inst.settings.series[i].color || colors[0]),
					    	"stroke-width": 2
						}).appendTo(gCandle);
						break;
					}
				}
				
				//candle
				rand = Math.floor(Math.random() * 99999);
				x = inst.settings.paddingLeft + i * inst.settings.blockWidth + ((inst.settings.blockWidth-cWidth)/2);
				y = (fill ? 
					inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i].low / bounds.yMax) :
					inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i].high / bounds.yMax)
					//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][3] / bounds.yMax) :
					//inst.settings.height - inst.settings.paddingBottom - inst.settings.canvasHeight * (inst.settings.series[i][2] / bounds.yMax)
				);
				cHeight = inst.settings.canvasHeight * (Math.abs(inst.settings.series[i].high-inst.settings.series[i].low) / bounds.yMax);
				//cHeight = inst.settings.canvasHeight * (Math.abs(inst.settings.series[i][2]-inst.settings.series[i][3]) / bounds.yMax);
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr({
						"fillStyle": fill ? (inst.settings.series[i].color || colors[0]) : "#FFFFFF",
						"strokeStyle": (inst.settings.series[i].color || colors[0]),
						"lineWidth": 2,
						"data-rel": "rect_" + rand
					}).begin().rect(x, y, cWidth, cHeight).fill().stroke();
					break;
				case "svg":
				default:
					inst.handle.rect(x, y, 0, 0, cWidth, cHeight, false).attr({
						"fill": fill ? (inst.settings.series[i].color || colors[0]) : "#FFFFFF",
						"shape-rendering": "crispEdges",
						"stroke": (inst.settings.series[i].color || colors[0]),
						"stroke-width": 2,
						"data-rel": "rect_" + rand
					}).bind("click", function (rx, ry, width, height, random, color, f) {
						return function (el) {
							var r = null,
								$el = $(el),
								$rect = $el.siblings("rect[data-rel^='inner_']"),
								length = $rect.length;
							
							if (length > 0) {
								r = $rect.attr("data-rel").split("_")[1],
								$rect.remove();
							}
							
							if (length === 0 || random != r) {
								inst.handle.rect(rx+(f?1:2), ry+(f?1:2), 0, 0, width-(f?2:4), height-(f?2:4), false).attr({
									"fill": "none",
									"shape-rendering": "crispEdges",
									"stroke": color,
									"stroke-width": 1,
									"data-rel": "inner_" + random
								}).appendTo(gCandle);
							}
						};
					}(x, y, cWidth, cHeight, rand, fill ? "#FFFFFF" : (inst.settings.series[i].color || colors[0]), fill)).appendTo(gCandle);
					break;
				}
			}

            this._tooltip.call(this, target);
		},
		column: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setPlot.call(this, target);
			
			if (inst.settings.legend) {
				this._showLegendChart.call(this, target);
			}
			
			var i, iCnt, j, jCnt, total, width, height, g, x, y, percent, tmp,
				gradients = [],
				sCnt = inst.settings.series.length,
				highest = 0,
				sum = [],
				max = this.getBounds2(target).yMax,
				colors = Chart.getColors();

			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chart-canvas",
					"clip-path": "url(#zinoui-" + inst.uid + ")"
				}).getShape();
				
				for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					
					gradients[i] = inst.handle.linearGradient("0%", "50%", "100%", "50%").attr({
						"id": "linear-" + i
					}).getShape();
					
					inst.handle.factory("stop", false).attr({
						"offset": "0%",
						"stop-color": inst.settings.series[i].color || colors[i]
					}).appendTo(gradients[i]);
					
					inst.handle.factory("stop", false).attr({
						"offset": "100%",
						"stop-color": Chart.colorLuminance(inst.settings.series[i].color || colors[i], -0.3)
					}).appendTo(gradients[i]);
				}
			}

            for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
                sum[i] = 0;
                for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
                    sum[i] += inst.settings.series[j].data[i].value;
                }
            }

			switch (inst.settings.stacking) {
			case "normal":
			case "percent":
				highest = Math.max.apply(Math, sum);
				width = inst.settings.blockWidth / 2;
				break;
			default:
				width = (inst.settings.blockWidth / 2) / sCnt;
				break;
			}

			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				tmp = 0;
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					
					switch (inst.settings.stacking) {
					case "normal":
						percent = inst.settings.series[j].data[i].value / highest;
						height = (inst.settings.canvasHeight * percent).toFixed(2);
						x = inst.settings.paddingLeft + (i) * inst.settings.blockWidth + ((inst.settings.blockWidth-width)/2);
						y = ((1 - percent - tmp) * inst.settings.canvasHeight + inst.settings.paddingTop).toFixed(2);
						tmp += percent;
						break;
					case "percent":
						percent = inst.settings.series[j].data[i].value / sum[i];
						height = (inst.settings.canvasHeight * percent).toFixed(2);
						x = inst.settings.paddingLeft + (i) * inst.settings.blockWidth + ((inst.settings.blockWidth-width)/2);
						y = ((1 - percent - tmp) * inst.settings.canvasHeight + inst.settings.paddingTop).toFixed(2);
						tmp += percent;
						break;
					default:
						height = ((inst.settings.series[j].data[i].value / max) * (inst.settings.canvasHeight)).toFixed(2);
						x = inst.settings.paddingLeft + (i) * inst.settings.blockWidth + (width + 2) * (j) + (inst.settings.blockWidth - (width+2)*sCnt+2) / 2;
						y = (inst.settings.height - inst.settings.paddingTop - height).toFixed(2);
						break;
					}
					
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": inst.settings.series[j].color || colors[j]
						}).fillRect(x, y, width, height);
						break;
					case "svg":
					default:
						inst.handle.rect(x, y, 0, 0, width, height, false).attr({
							//"fill": colors[j-1]
							"fill": "url(#linear-" + j + ")",
                            "zui:tooltip": (inst.settings.tooltip && inst.settings.tooltip.pattern
                                ? inst.settings.tooltip.pattern
                                    .replace('%label', inst.settings.series[j].label)
                                    .replace('%value', inst.settings.series[j].data[i].value)
                                    .replace('%percent', ((inst.settings.series[j].data[i].value / sum[i]) * 100).toFixed(1) + '%')
                                : inst.settings.series[j].label)
						})/*.animate({
							"attributeName": "y",
							"attributeType": "XML",
							"from": inst.settings.height - inst.settings.paddingBottom,
							"to": y,
							"dur": "0.8s",
							"repeatCount": 1
						})*/
                        .bind("mouseenter", function (that) {
                            return function (event, shape) {
                                that._mouseenter.call(that, target, event, shape);
                            }
                        }(this))
                        .bind("mouseleave", function (that) {
                            return function (event, shape) {
                                that._mouseleave.call(that, target, event, shape);
                            }
                        }(this))
                        .bind("mousemove", function (that) {
                            return function (event, shape) {
                                that._mousemove.call(that, target, event, shape);
                            }
                        }(this))
                        .appendTo(g);
						break;
					}
				}
			}

            this._tooltip.call(this, target);
		},
        gauge: function (target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }

            var g, startAngle, endAngle, start, end, tmpStart, tmpEnd, txt, span,
                total = 100,
                value = 80,
                cx = inst.settings.width/2,
                cy = inst.settings.height/2,
                r = inst.settings.radius,
                r1 = inst.settings.radius + 5,
                r2 = inst.settings.radius + 30;


            startAngle = 0;
            endAngle = (value / total) * 360 + startAngle;

            if (inst.settings.plugin === "svg") {
                g = inst.handle.g().attr({
                    "class": "zui-chart-canvas",
                    "clip-path": "url(#zinoui-" + inst.uid + ")"
                }).getShape();
            }

            switch (inst.settings.plugin) {
                case "canvas":
                	//TODO
                    break;
                case "svg":
                    inst.handle.circle(cx, cy, r, false).attr({
                        "fill": "red"
                    }).appendTo(g);

                    start = polarToCartesian(cx, cy, r1, -startAngle);
                    end = polarToCartesian(cx, cy, r1, -endAngle);
                    tmpStart = polarToCartesian(cx, cy, r2, -startAngle);
                    tmpEnd = polarToCartesian(cx, cy, r2, -endAngle);
                    
                    //console.log(start,end,tmpStart,tmpEnd);

                    inst.handle.rose(
                        start[0], start[1],
                        r1, end[0], end[1],
                        tmpEnd[0], tmpEnd[1],
                        r2, tmpStart[0], tmpStart[1],
                        false
                    ).attr({
                        "fill": "green"
                    }).appendTo(g);
                    
                    /*inst.handle.rose(
                        start[0], start[1],
                        r1, end[0], end[1],
                        tmpEnd[0], tmpEnd[1],
                        r2, tmpStart[0], tmpStart[1],
                        false
                    ).attr({
                        "fill": "green"
                    }).appendTo(g);*/

                    txt = inst.handle.factory("text", {
                        "x": cx,
                        "y": cy
                    }, false).attr({
                        "x": 0,
                        "y": 0,
                        "transform": "matrix(1,0,0,1," + cx + "," + cy + ")",
                        "fill": inst.settings.textColor,
                        "font-family": inst.settings.fontFamily,
                        "font-size": inst.settings.fontSize,
                        "text-anchor": "middle"
                    }).appendTo(g).getShape();
                    span = inst.handle.factory("tspan", {
                        "alignment-baseline": "middle"
                    }, false).appendTo(txt).getShape();
                    inst.handle.textNode((total - value) + '%', false).appendTo(span);
                    break;
            }
        },
		getX: function (target, val) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var bounds = this.getBounds2(target),
				total = bounds.xMax - bounds.xMin,
				current = val - bounds.xMin,
				index = current / total;
			
			/*return (inst.settings.width
		    	- inst.settings.canvasWidth * index
		    	- inst.settings.paddingLeft).toFixed(2);
			//return (inst.settings.width - inst.settings.canvasWidth * index).toFixed(2);*/

			return (inst.settings.width - ((inst.settings.canvasWidth / this.getBounds2(target).xMax) * val)).toFixed(2);
		},
		getXX: function (target, index) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			return ((inst.settings.canvasWidth / this.getBounds2(target).yMax) * 
			    	index + inst.settings.paddingLeft).toFixed(2);
		},
		getY: function (target, val) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var bounds = this.getBounds2(target),
				total = bounds.yMax - bounds.yMin,
				current = val - bounds.yMin,
				index = current / total;

			return (inst.settings.height
		    	- inst.settings.canvasHeight * index
		    	- inst.settings.paddingBottom).toFixed(2);
		},
		getYY: function (target, val) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			return parseFloat((inst.settings.height - 
		    	((inst.settings.canvasHeight / this.getBounds2(target).yMax) * val) - 
		    	inst.settings.paddingBottom).toFixed(2));
		},
		getBounds2: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var iCnt, j, jCnt, tmp, x,
		    	i = 0,
		    	xMax = null,
		    	xMin = null,
		    	yMax = null,
		    	yMin = null,
		    	zMin = null,
		    	zMax = null;
			if ($.inArray(inst.settings.type, ["candlestick", "ohlc"]) === -1) {
			    //y
			    for (tmp = i, iCnt = inst.settings.series.length; i < iCnt; i++) {
		    		for (j = 0, jCnt = inst.settings.series[i].data.length; j < jCnt; j++) {
						if (i === tmp && j === 0) {
							yMax = inst.settings.series[i].data[j].value;
							yMin = inst.settings.series[i].data[j].value;
						} else {
							yMax = inst.settings.series[i].data[j].value > yMax ? inst.settings.series[i].data[j].value : yMax;
							yMin = inst.settings.series[i].data[j].value < yMin ? inst.settings.series[i].data[j].value : yMin;
						}
					}
				}
			    //x
			    j = 0;
			    for (i = 0, iCnt = inst.settings.categories[0].category.length; i < iCnt; i++) {
					if (i === 0) {
						xMax = inst.settings.categories[0].category[i].label;
						xMin = inst.settings.categories[0].category[i].label;
					} else {
						xMax = inst.settings.categories[0].category[i].label > xMax ? inst.settings.categories[0].category[i].label : xMax;
						xMin = inst.settings.categories[0].category[i].label < xMin ? inst.settings.categories[0].category[i].label : xMin;
					}
				}
			}
		    switch (inst.settings.type) {
		    case "bubble":
		    case "scatter":
			    for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
					for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
						if (i === 0 && j === 0) {
							xMax = inst.settings.series[j].data[i].x;
							xMin = inst.settings.series[j].data[i].x;
							yMax = inst.settings.series[j].data[i].y;
							yMin = inst.settings.series[j].data[i].y;
							zMax = inst.settings.series[j].data[i].z;
							zMin = inst.settings.series[j].data[i].z;
						} else {
							xMax = inst.settings.series[j].data[i].x > xMax ? inst.settings.series[j].data[i].x : xMax;
							xMin = inst.settings.series[j].data[i].x < xMin ? inst.settings.series[j].data[i].x : xMin;
							yMax = inst.settings.series[j].data[i].y > yMax ? inst.settings.series[j].data[i].y : yMax;
							yMin = inst.settings.series[j].data[i].y < yMin ? inst.settings.series[j].data[i].y : yMin;
							zMax = inst.settings.series[j].data[i].z > zMax ? inst.settings.series[j].data[i].z : zMax;
							zMin = inst.settings.series[j].data[i].z < zMin ? inst.settings.series[j].data[i].z : zMin;
						}
					}
				}
			    break;
		    case "candlestick":
		    case "ohlc":
		    	//y
		    	for (i = 0, j = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
		    		for (var x in inst.settings.series[i]) {
		    			if (inst.settings.series[i].hasOwnProperty(x) && $.inArray(x, ['open', 'high', 'low', 'close']) !== -1) {
		    				if (i === 0 && j === 0) {
								yMax = inst.settings.series[i][x];
								yMin = inst.settings.series[i][x];
							} else {
								yMax = inst.settings.series[i][x] > yMax ? inst.settings.series[i][x] : yMax;
								yMin = inst.settings.series[i][x] < yMin ? inst.settings.series[i][x] : yMin;
							}
		    				j++;
		    			}
		    		}
		    	}
		    	//x
		    	for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
					if (i === 0) {
						xMax = inst.settings.series[i][0];
						xMin = inst.settings.series[i][0];
					} else {
						xMax = inst.settings.series[i][0] > xMax ? inst.settings.series[i][0] : xMax;
						xMin = inst.settings.series[i][0] < xMin ? inst.settings.series[i][0] : xMin;
					}
				}
		    	xMin = 0;
		    	xMax = 0;
		    	break;
		    }
		    
		    return {
		    	"xMin": parseFloat(xMin),
		    	"xMax": parseFloat(xMax),
		    	"yMin": yMin,
		    	"yMax": yMax,
		    	"zMin": zMin, 
		    	"zMax": zMax
		    };
		},
		getBounds: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
		    var iCnt, j, jCnt, tmp, x,
		    	i = $.inArray(inst.settings.type, ["ohlc", "candlestick"]) === -1 ? 1 : 0,
		    	xMax = null,
		    	xMin = null,
		    	yMax = null,
		    	yMin = null;
		    //y
		    for (tmp = i, iCnt = inst.settings.series.length; i < iCnt; i++) {
		    	switch (inst.settings.type) {
		    	case "bubble":
		    		if (i === 1) {
						yMax = inst.settings.series[i][2];
						yMin = inst.settings.series[i][2];
					} else {
						yMax = inst.settings.series[i][2] > yMax ? inst.settings.series[i][2] : yMax;
						yMin = inst.settings.series[i][2] < yMin ? inst.settings.series[i][2] : yMin;
					}
		    		break;
		    	case "ohlc":
		    	case "candlestick":
		    		for (x in inst.settings.series[i]) {
		    			if (inst.settings.series[i].hasOwnProperty(x)) {
		    				if ($.inArray(x, ["open", "high", "low", "close"]) !== -1) {
		    					if (i === 1) {
		    						yMax = inst.settings.series[i][x];
		    						yMin = inst.settings.series[i][x];
		    					} else {
		    						yMax = inst.settings.series[i][x] > yMax ? inst.settings.series[i][x] : yMax;
		    						yMin = inst.settings.series[i][x] < yMin ? inst.settings.series[i][x] : yMin;
		    					}
		    				}
		    			}
		    		}
		    		break;
		    	default:
		    		for (j = 1, jCnt = inst.settings.series[i].length; j < jCnt; j++) {
						if (i === tmp && j === 1) {
							yMax = inst.settings.series[i][j];
							yMin = inst.settings.series[i][j];
						} else {
							yMax = inst.settings.series[i][j] > yMax ? inst.settings.series[i][j] : yMax;
							yMin = inst.settings.series[i][j] < yMin ? inst.settings.series[i][j] : yMin;
						}
					}
		    		break;
		    	}
			}
		    //x
		    j = inst.settings.type !== "bubble" ? 0 : 1;
		    for (i = 1, iCnt = inst.settings.series.length; i < iCnt; i++) {
				if (i === 1) {
					xMax = inst.settings.series[i][j];
					xMin = inst.settings.series[i][j];
				} else {
					xMax = inst.settings.series[i][j] > xMax ? inst.settings.series[i][j] : xMax;
					xMin = inst.settings.series[i][j] < xMin ? inst.settings.series[i][j] : xMin;
				}
			}
		    
		    return {
		    	"xMin": xMin,
		    	"xMax": xMax,
		    	"yMin": yMin, 
		    	"yMax": yMax
		    };
		},
		setPlot: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setGrid(target);
			this.setLabels(target);
			this.setAxis(target);
		},
		setGrid: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var i, iCnt, j, x, y, x1, x2, g, g1, g2,
				bounds = this.getBounds(target),
				bounds2 = this.getBounds2(target);

			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chart-grid"
				}).getShape();
				g1 = inst.handle.g().attr({
					"class": "zui-chart-axis-x"
				}).getShape();
				g2 = inst.handle.g().attr({
					"class": "zui-chart-axis-y"
				}).getShape();
			}

			switch (inst.settings.type) {
			case "area":
			case "line":
			case "stepline":
			case "spline":
			case "column":
			case "candlestick":
			case "ohlc":
			case "scatter":
			case "bubble":
				i = 1;
				if ($.inArray(inst.settings.type, ["ohlc", "candlestick", "line", "area", "column", "stepline", "spline", "bubble", "scatter"]) !== -1) {
					i = 0;
				}
				if ($.inArray(inst.settings.type, ["line", "area", "column", "stepline", "spline", "bubble", "scatter"]) !== -1) {
					iCnt = inst.settings.series[0].data.length;
				} else {
					iCnt = inst.settings.series.length;
				}
				y = inst.settings.height - inst.settings.paddingBottom;
				for (iCnt=iCnt; i <= iCnt; i++) {
					if ($.inArray(inst.settings.type, ["ohlc", "candlestick", "line", "area", "column", "stepline", "spline", "bubble", "scatter"]) === -1) {
						j = i - 1;
					} else {
						j = i;
					}

					x1 = inst.settings.paddingLeft + inst.settings.blockWidth * j;
					x2 = x1 + inst.settings.blockWidth/2;
					
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"lineWidth": 1,
							"fillStyle": "transparent",
					    	"strokeStyle": inst.settings.lineRowColor
						}).setLineDash([5,2]).line(x1 + 0.5, inst.settings.paddingTop, x1 + 0.5, y).setLineDash([0]);

						inst.handle.attr({
							"lineWidth": 1,
							"fillStyle": "transparent",
					    	"strokeStyle": inst.settings.axisColor
						}).line(x1 + 0.5, y+1, x1 + 0.5, y+5);
						break;
					case "svg":
					default:
						inst.handle.line(
					    	x1, inst.settings.paddingTop,
					    	x1, y,
					    	false
					    ).attr({
					    	"fill": "none",
					    	"shape-rendering": "crispEdges",
					    	"stroke": inst.settings.lineRowColor,
					    	"stroke-dasharray": "5,2",
					    	"stroke-width": 1
					    }).appendTo(g);
					    
					    inst.handle.line(
					    	x1, y+1,
					    	x1, y+5,
					    	false
					    ).attr({
					    	"fill": "none",
					    	"shape-rendering": "crispEdges",
					    	"stroke": inst.settings.axisColor,
					    	"stroke-width": 1
					    }).appendTo(g1);
						break;
					}
				}
				
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr({
						"lineWidth": 1,
						"fillStyle": "transparent",
				    	"strokeStyle": inst.settings.lineRowColor
					})
					.setLineDash([5,2])
					.line(
						inst.settings.paddingLeft, 
						inst.settings.paddingTop+0.5,
						inst.settings.paddingLeft + inst.settings.canvasWidth, 
						inst.settings.paddingTop+0.5
					)
					.setLineDash([0]);
					break;
				case "svg":
				default:
					inst.handle.line(
						inst.settings.paddingLeft, inst.settings.paddingTop,
						inst.settings.paddingLeft + inst.settings.canvasWidth, inst.settings.paddingTop,
				    	false
				    ).attr({
				    	"fill": "none",
				    	"shape-rendering": "crispEdges",
				    	"stroke": inst.settings.lineRowColor,
				    	"stroke-dasharray": "5,2",
				    	"stroke-width": 1
				    }).appendTo(g);
					break;
				}

				// y
				for (i = 0, iCnt = bounds2.yMax; i <= iCnt; i = i + Math.ceil(iCnt / 4)) {
					y = this.getYY(target, i);

					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"lineWidth": 1,
							"fillStyle": "transparent",
					    	"strokeStyle": inst.settings.lineRowColor
						})
						.setLineDash([5,2])
						.line(
							inst.settings.paddingLeft, 
							y+0.5, 
							inst.settings.paddingLeft + inst.settings.canvasWidth, 
							y+0.5
						).setLineDash([0]);
						
						inst.handle.attr({
							"lineWidth": 1,
							"fillStyle": "transparent",
					    	"strokeStyle": inst.settings.axisColor
						}).line(inst.settings.paddingLeft - 4, y+0.5, inst.settings.paddingLeft, y+0.5);
						break;
					case "svg":
					default:
					    inst.handle.line(
					    	inst.settings.paddingLeft, y,
					    	inst.settings.paddingLeft + inst.settings.canvasWidth, y,
					    	false
					    ).attr({
					    	"fill": "none",
					    	"shape-rendering": "crispEdges",
					    	"stroke": inst.settings.lineRowColor,
					    	"stroke-dasharray": "5,2",
					    	"stroke-width": 1
					    }).appendTo(g);
					    
					    inst.handle.line(
					    	inst.settings.paddingLeft - 4, y,
					    	inst.settings.paddingLeft, y,
					    	false
					    ).attr({
					    	"fill": "none",
					    	"shape-rendering": "crispEdges",
					    	"stroke": inst.settings.axisColor,
					    	"stroke-width": 1
					    }).appendTo(g2);
					    break;
					}
				}
				break;
			case "bar":
				// horizontal lines & y-dashes
				for (i = 0, j = 1, iCnt = bounds2.yMax; j <= inst.settings.blockNum; j++, i = i + Math.ceil(iCnt / inst.settings.blockNum)) {
					//y = this.getYY(target, i);
					y = inst.settings.paddingTop + inst.settings.blockHeight * i;

					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
					        "lineWidth": 1,
					        "fillStyle": "transparent",
					        "strokeStyle": inst.settings.lineRowColor
					    }).setLineDash([5,2]).line(inst.settings.paddingLeft, y+0.5, inst.settings.paddingLeft + inst.settings.canvasWidth, y+0.5).setLineDash([0]);
						
						inst.handle.attr({
					    	"fillStyle": inst.settings.axisColor,
					    	"strokeStyle": "transparent"
					    }).fillRect(inst.settings.paddingLeft - 4, y, 4, 1);
						break;
					case "svg":
					default:
						inst.handle.line(
					    	inst.settings.paddingLeft, y,
					    	inst.settings.paddingLeft + inst.settings.canvasWidth, y, 
					    	false
					    ).attr({
					    	"fill": "none",
					    	"shape-rendering": "crispEdges",
					    	"stroke": inst.settings.lineRowColor,
					    	"stroke-dasharray": "5,2",
					    	"stroke-width": 1
					    }).appendTo(g);
					    
					    inst.handle.rect(
					    	inst.settings.paddingLeft - 4, y, 0, 0, 4, 1, false
					    ).attr({
					    	"fill": inst.settings.axisColor,
					    	"shape-rendering": "crispEdges",
					    	"stroke": "none",
					    	"stroke-width": 0
					    }).appendTo(g);
					    break;
					}
				}
				// vertical lines & x-dashes
				y = inst.settings.height - inst.settings.paddingBottom;
				for (i = 0, iCnt = bounds2.yMax; i <= iCnt; i = i + Math.ceil(iCnt / inst.settings.blockNum)) {
					//x = this.getXX(target, i);
					x = inst.settings.paddingLeft + inst.settings.blockWidth * i;
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": inst.settings.axisColor,
							"strokeStyle": "transparent"
						}).fillRect(x, y, 1, 4);
						
						inst.handle.attr({
					        "lineWidth": 1,
					        "strokeStyle": inst.settings.lineRowColor
					    }).setLineDash([5,2]).line(
					    	x+0.5, 
				    		inst.settings.paddingTop, 
				    		x+0.5, 
				    		inst.settings.paddingTop + inst.settings.canvasHeight
				    	).setLineDash([0]);
						break;
					case "svg":
					default:
						inst.handle.rect(x, y, 0, 0, 1, 4, false).attr({
					    	"fill": inst.settings.axisColor,
					    	"shape-rendering": "crispEdges",
					    	"stroke": "none",
					    	"stroke-width": 0
					    }).appendTo(g);

						inst.handle.line(
							x,
							inst.settings.paddingTop, 
							x,
							inst.settings.paddingTop + inst.settings.canvasHeight, 
							false
						).attr({
					    	"fill": "none",
					    	"shape-rendering": "crispEdges",
					    	"stroke-dasharray": "5,2",
					    	"stroke": inst.settings.lineRowColor,
					    	"stroke-width": 1
					    }).appendTo(g);
						break;
					}
				}
				break;
			}
		},
		setLabels: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var i, iCnt, j, x, y, gx, gy, txt, span, textAttr,
				bounds = this.getBounds(target),
				bounds2 = this.getBounds2(target);
			
			switch (inst.settings.plugin) {
			case "canvas":
				textAttr = {
					"fillStyle": inst.settings.textColor,
					"font": inst.settings.fontSize + " " + inst.settings.fontFamily,
					"strokeStyle": "transparent",
					"textAlign": "center"
				};
				break;
			case "svg":
			default:
				gy = inst.handle.g().attr({
					"class": "zui-chart-labels zui-chart-labels-y"
				}).getShape();
				gx = inst.handle.g().attr({
					"class": "zui-chart-labels zui-chart-labels-x"
				}).getShape();
				textAttr = {
					"fill": inst.settings.textColor,
					"font-family": inst.settings.fontFamily,
					"font-size": inst.settings.fontSize,
					"text-anchor": "middle"
				};
				break;
			}
			
			switch (inst.settings.type) {
			case "area":
			case "line":
			case "stepline":
			case "spline":
			case "column":
			case "candlestick":
			case "ohlc":
			case "scatter":
			case "bubble":
				// x text
				/*if (inst.settings.type === "column" && !inst.settings.stacking) {
					textAttr["text-anchor"] = "start";
				}*/
				
				i = 1;
				if ($.inArray(inst.settings.type, ["ohlc", "candlestick", "pie", "line", "area", "column", "stepline", "spline", "scatter"]) !== -1) {
					i = 0;
				}
				
				for (iCnt = inst.settings.categories[0].category.length; i <= iCnt; i++) {
					if ($.inArray(inst.settings.type, ["ohlc", "candlestick", "pie", "line", "area", "column", "stepline", "spline", "scatter"]) === -1) {
						j = i - 1;
					} else {
						j = i;
					}
					x = inst.settings.paddingLeft + inst.settings.blockWidth * j + inst.settings.blockWidth/2;
					y = inst.settings.height - inst.settings.paddingBottom;
					if (i < iCnt) {
						
						switch (inst.settings.plugin) {
						case "canvas":
							inst.handle.attr(textAttr).text(
									$.inArray(inst.settings.type, ["ohlc", "candlestick", "pie"]) === -1 ? 
									inst.settings.categories[0].category[i].label : 
									inst.settings.series[i].label,
								x,
								y + 20
							);
							break;
						case "svg":
						default:
						
							inst.handle.text(
								x,
								y + 20, 
								$.inArray(inst.settings.type, ["ohlc", "candlestick", "pie"]) === -1 ? 
								inst.settings.categories[0].category[i].label : 
								inst.settings.series[i].label,
								false
							).attr(textAttr).appendTo(gx);
						
							break;
						}
					}
				}
				// y text
				var margin = bounds2.yMax - bounds2.yMin;
				for (i = 0, iCnt = bounds2.yMax, j = bounds2.yMin; i <= iCnt; i = i + Math.ceil(iCnt / 4), j = j + Math.ceil(margin / 4)) {
				//for (i = 0, iCnt = bounds2.yMax; i <= iCnt; i = i + Math.ceil(iCnt / 4)) {
					y = this.getYY(target, i);

					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr(textAttr).attr({
							"textBaseline": "middle"
						}).text(j % 1 === 0 ? j : j.toFixed(1), inst.settings.paddingLeft - 20, y);
						break;
					case "svg":
					default:
                        txt = inst.handle.factory("text", {
                            "x": inst.settings.paddingLeft - 10,
                            "y": y
                        }, false).attr(textAttr).attr({
                            "text-anchor": "end"
                        }).appendTo(gy).getShape();
                        span = inst.handle.factory("tspan", {
                            "alignment-baseline": "middle"
                        }, false).appendTo(txt).getShape();
                        inst.handle.textNode(j % 1 === 0 ? j : j.toFixed(1), false).appendTo(span);
						break;
					}
				}
				break;
			case "bar":
				// x text
				y = inst.settings.height - inst.settings.paddingBottom;
				for (i = 0, iCnt = bounds2.yMax; i <= iCnt; i = i + Math.ceil(iCnt / inst.settings.blockNum)) {
					//x = this.getXX(target, i);
					x = inst.settings.paddingLeft + inst.settings.blockWidth * i;
					
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr(textAttr).text(i, x, y + 20);
						break;
					case "svg":
					default:
						inst.handle.text(x, y + 20, i, false).attr(textAttr).appendTo(gx);
						break;
					}
				}
				// y text
				for (i = 0, j = 0, iCnt = bounds2.yMax; j < inst.settings.blockNum; j++, i = i + Math.ceil(iCnt / inst.settings.blockNum)) {
					//y = this.getYY(target, i);
					y = inst.settings.paddingTop + inst.settings.blockHeight * i;
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr(textAttr).attr({
							"textBaseline": "middle"
						}).text(
							inst.settings.categories[0].category[j].label, 
							inst.settings.paddingLeft - 20, 
							//parseFloat(y) - inst.settings.blockHeight
							y + inst.settings.blockHeight/2
						);
						break;
					case "svg":
					default:
                        txt = inst.handle.factory("text", false).attr(textAttr).attr({
                            "x": inst.settings.paddingLeft - 10,
                            "y": y + inst.settings.blockHeight/2,
                            "text-anchor": "end"
                        }).appendTo(gy).getShape();
                        span = inst.handle.factory("tspan", {
                            "alignment-baseline": "middle"
                        }, false).appendTo(txt).getShape();
                        inst.handle.textNode(inst.settings.categories[0].category[j].label, false).appendTo(span);
						break;
					}
				}
				break;
			}
		},
		setCircumference: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var i, iCnt, j, jCnt, x, y, g1, g2,
				d = [],
				cx = Math.floor((inst.settings.width - inst.settings.paddingRight) / 2),
				cy = Math.floor(inst.settings.height / 2),
				deg = 360 / inst.settings.series[0].data.length, 
				num = 5,
				step = inst.settings.radius / num;
			
			if (inst.settings.plugin === "svg") {
				g1 = inst.handle.g().attr({
					"class": "zui-chart-lines"/*,
					"transform": ["rotate(-90 ", cx, " ", cy, ")"].join("")*/
				}).getShape();
				g2 = inst.handle.g().attr({
					"class": "zui-chart-grid"/*,
					"transform": ["rotate(-90 ", cx, " ", cy, ")"].join("")*/
				}).getShape();
			}
			
			//lines
			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				x = cx + inst.settings.radius * Math.cos((-90 + deg * (i)) * Math.PI/180);
				y = cy + inst.settings.radius * Math.sin((-90 + deg * (i)) * Math.PI/180);
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr({
						"strokeStyle": inst.settings.lineRowColor,
						"lineWidth": 1
					}).line(cx, cy, x, y);
					break;
				case "svg":
				default:
					inst.handle.line(cx, cy, x, y, false).attr({
						"fill": "none",
						"stroke": inst.settings.lineRowColor,
						"stroke-width": 1
					}).appendTo(g1);
					break;
				}
			}
			
			switch (inst.settings.type) {
			case "radar":
				for (j = 0, jCnt = num; j < jCnt; j++) {
					d[j] = [];
					for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
						x = cx + (inst.settings.radius - step * j) * Math.cos((-90 + deg * (i)) * Math.PI/180);
						y = cy + (inst.settings.radius - step * j) * Math.sin((-90 + deg * (i)) * Math.PI/180);
						if (i > 0) {
							d[j].push(["L", x, ",", y].join(""));
						} else {
							d[j].push(["M", x, ",", y].join(""));
						}
					}
					switch (inst.settings.plugin) {
					case "canvas":
						d[j].push(d[j][0]);
						inst.handle.attr({
							"fillStyle": "transparent",
							"strokeStyle": inst.settings.lineRowColor,
							"lineWidth": 1
						}).path(d[j].join(""));
						break;
					case "svg":
					default:
						d[j].push("Z");
						inst.handle.path(d[j].join(""), false).attr({
							"fill": "none",
							"stroke": inst.settings.lineRowColor,
							"stroke-width": 1
						}).appendTo(g2);
						break;
					}
				}
				break;
			case "polar":
			case "rose":
			default:
				for (j = 0, jCnt = num; j < jCnt; j++) {
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": "transparent",
							"strokeStyle": inst.settings.lineRowColor,
							"lineWidth": 1
						}).begin().circle(cx, cy, inst.settings.radius - step * j).close().fill().stroke();
						break;
					case "svg":
					default:
						inst.handle.circle(cx, cy, inst.settings.radius - step * j, false).attr({
							"fill": "none",
							"stroke": inst.settings.lineRowColor,
							"stroke-width": 1
						}).appendTo(g2);
						break;
					}
				}
				break;
			}
		},
		setCircumferenceLabels: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			var i, iCnt, j, jCnt, x, y, g4, g5, text, txt, span,
				cx = Math.floor((inst.settings.width - inst.settings.paddingRight) / 2),
				cy = Math.floor(inst.settings.height / 2),
				bounds2 = this.getBounds2(target),
				deg = 360 / inst.settings.series[0].data.length, 
				num = 5,
				step = inst.settings.radius / num;
			
			if (inst.settings.plugin === "svg") {
				g4 = inst.handle.g().attr({
					"class": "zui-chart-labels"
				}).getShape();
				g5 = inst.handle.g().attr({
					"class": "zui-chart-scale"
				}).getShape();
			}
			
			for (i = 0, iCnt = inst.settings.categories[0].category.length; i < iCnt; i++) {
				//labels
				switch (inst.settings.type) {
				case "radar":
					text = inst.settings.categories[0].category[i].label;
					break;
				case "polar":
				case "rose":
				default:
                    text = (deg * i).toFixed(0);
                    if ('categories' in inst.settings
                        && inst.settings.categories[0]
                        && 'category' in inst.settings.categories[0]
                        && inst.settings.categories[0].category
                        && inst.settings.categories[0].category[i]
                        && 'label' in inst.settings.categories[0].category[i]) {
                        text = inst.settings.categories[0].category[i].label;
                    }
					break;
				}
				x = cx + (inst.settings.radius + 20) * Math.cos((-90 + deg * i) * Math.PI/180);
				y = cy + (inst.settings.radius + 20) * Math.sin((-90 + deg * i) * Math.PI/180);
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr({
						"textAlign": "center",
				        "textBaseline": "middle",
						"fillStyle": inst.settings.textColor,
						"strokeStyle": "transparent",
						"font": inst.settings.fontSize + " " + inst.settings.fontFamily
					}).text(text, x, y);
					break;
				case "svg":
				default:
                    txt = inst.handle.factory("text", {
                        "x": x,
                        "y": y,
                        "fill": inst.settings.textColor,
                        "font-size": inst.settings.fontSize,
                        "font-family": inst.settings.fontFamily,
                        "text-anchor": "middle"
                    }, false).appendTo(g4).getShape();
                    span = inst.handle.factory("tspan", {
                        "alignment-baseline": "middle"
                    }, false).appendTo(txt).getShape();
                    inst.handle.textNode(text, false).appendTo(span);
					break;
				}
			}
			
			for (j = 0, jCnt = num; j < jCnt; j++) {
				for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
					x = cx + (inst.settings.radius - step * j) * Math.cos((-90 + deg * i) * Math.PI/180);
					y = cy + (inst.settings.radius - step * j) * Math.sin((-90 + deg * i) * Math.PI/180);
					if (i > 0) {
					} else {
						
						//text
						switch (inst.settings.plugin) {
						case "canvas":
							inst.handle.attr({
								"textAlign": "right",
						        "textBaseline": "middle",
								"fillStyle": inst.settings.textColor,
								"font": inst.settings.fontSize + " " + inst.settings.fontFamily
							}).text((bounds2.yMax - (bounds2.yMax / num) * j).toFixed(2), x-5, y);
							break;
						case "svg":
						default:
                            txt = inst.handle.factory("text", {
                                "x": x-5,
                                "y": y,
                                "fill": inst.settings.textColor,
                                "font-size": inst.settings.fontSize,
                                "font-family": inst.settings.fontFamily,
                                "text-anchor": "end"
                            }, false).appendTo(g5).getShape();
                            span = inst.handle.factory("tspan", {
                                "alignment-baseline": "central"
                            }, false).appendTo(txt).getShape();
                            inst.handle.textNode((bounds2.yMax - (bounds2.yMax / num) * j).toFixed(2), false).appendTo(span);
							break;
						}
					}
				}
			}
		},
		setAxis: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			var g,
				points = [];
			
			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chart-axis"
				}).getShape();
			}
			
			switch (inst.settings.plugin) {
			case "canvas":
				points.push(["M",inst.settings.paddingLeft + 0.5, ",", inst.settings.paddingTop].join(""));
				points.push(["L",inst.settings.paddingLeft + 0.5, ",", inst.settings.paddingTop + inst.settings.canvasHeight + 0.5].join(""));
				points.push(["L",inst.settings.paddingLeft + inst.settings.canvasWidth + 0.5, ",", inst.settings.paddingTop + inst.settings.canvasHeight + 0.5].join(""));
				inst.handle
					.attr({
						"fillStyle": "transparent",
						"strokeStyle": inst.settings.axisColor,
				    	"lineWidth": 1
					})
					.path(points.join(""));
				break;
			case "svg":
			default:
				points.push([inst.settings.paddingLeft, ",", inst.settings.paddingTop].join(""));
				points.push([inst.settings.paddingLeft, ",", inst.settings.paddingTop + inst.settings.canvasHeight].join(""));
				points.push([inst.settings.paddingLeft + inst.settings.canvasWidth, ",", inst.settings.paddingTop + inst.settings.canvasHeight].join(""));
			
				inst.handle.polyline(points.join(" "), false).attr({
			    	"fill": "none",
			    	"shape-rendering": "crispEdges",
			    	"stroke": inst.settings.axisColor,
			    	"stroke-width": 1
			    }).appendTo(g);
				break;
			}
		},
		scatter: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			//this.setPlot.call(this, target);
			this.setGrid.call(this, target);
			this.setAxis.call(this, target);
			
			var i, iCnt, j, jCnt, cx, cy, g,
				textAttr, gy, gx, txt, span,
				bounds2 = this.getBounds2(target),
				colors = Chart.getColors();
				
			switch (inst.settings.plugin) {
			case "canvas":
				textAttr = {
					"fillStyle": inst.settings.textColor,
					"font": inst.settings.fontSize + " " + inst.settings.fontFamily,
					"strokeStyle": "transparent"
				};
				break;
			case "svg":
			default:
				g = inst.handle.g().attr({
					"class": "zui-chart-markers"
				}).getShape();
				textAttr = {
					"fill": inst.settings.textColor,
					"font-family": inst.settings.fontFamily,
					"font-size": inst.settings.fontSize,
					"text-anchor": "middle"
				};
				gy = inst.handle.g().attr({
					"class": "zui-chart-labels zui-chart-labels-y"
				}).getShape();
				gx = inst.handle.g().attr({
					"class": "zui-chart-labels zui-chart-labels-x"
				}).getShape();
				break;
			}

			//x axis
			for (i = 0, iCnt = inst.settings.categories[0].category.length; i < iCnt; i++) {
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr(textAttr).attr({
						"textAlign": "center"
					}).text(
						inst.settings.categories[0].category[i].label,
						inst.settings.paddingLeft + inst.settings.blockWidth * (i) + inst.settings.blockWidth/2,
						inst.settings.height - inst.settings.paddingBottom + 20
					);
					break;
				case "svg":
				default:
					inst.handle.text(
						inst.settings.paddingLeft + inst.settings.blockWidth * (i) + inst.settings.blockWidth/2,
						inst.settings.height - inst.settings.paddingBottom + 20, 
						inst.settings.categories[0].category[i].label,
						false
					).attr(textAttr).attr({
                        "text-anchor": "middle"
                    }).appendTo(gx);
					break;
				}
			}

			//y axis
			for (i = 0; i <= bounds2.yMax; i = i + Math.ceil(bounds2.yMax / 4)) {
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr(textAttr).attr({
						"textAlign": "right",
						"textBaseline": "middle"
					}).text(
						i,
						inst.settings.paddingLeft - 20, 
						this.getYY(target, i)
					);
					break;
				case "svg":
				default:
                    txt = inst.handle.factory("text", false).attr(textAttr).attr({
                        "x": inst.settings.paddingLeft - 10,
                        "y": this.getYY(target, i),
                        "text-anchor": "end"
                    }).appendTo(gy).getShape();
                    span = inst.handle.factory("tspan", {
                        "alignment-baseline": "middle"
                    }, false).appendTo(txt).getShape();
                    inst.handle.textNode(i, false).appendTo(span);
					break;
				}
			}
			
			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					//cx = inst.settings.paddingLeft + (inst.settings.series[j].data[i].x / bounds2.xMax) * inst.settings.canvasWidth;
					//cy = this.getY(target, inst.settings.series[j].data[i].y);//inst.settings.paddingTop + inst.settings.canvasHeight - (inst.settings.series[i][j] / bounds2.yMax) * inst.settings.canvasHeight;
					cx = this.getX(target, inst.settings.series[j].data[i].x);
					cy = this.getY(target, inst.settings.series[j].data[i].y);
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": inst.settings.series[j].color || colors[j],
							"strokeStyle": "transparent"
						}).begin().circle(cx, cy, 4).fill();
						break;
					case "svg":
					default:
						inst.handle.circle(cx, cy, 4, false).attr({
							"fill": inst.settings.series[j].color || colors[j],
							"fill-opacity": 1,
							"stroke": "none",
							"stroke-width": 0
						}).appendTo(g);
						break;
					}
				}
			}
			
			$(inst.handle.svg).on("mouseover", "circle", function (e) {
				var $this = $(this);
				inst.handle.circle($this.attr("cx"), $this.attr("cy"), 6, false).attr({
					"fill": "none",
					"stroke": $this.attr("fill"),
					"stroke-width": 1,
					"class": "zui-chart-over"
				}).appendTo(g);
			}).on("mouseout", "circle", function (e) {
				$("circle.zui-chart-over").remove();
			});
			
		},
		spline: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setPlot.call(this, target);
			
			var i, iCnt, j, jCnt, x, p, x1, x2, g1, g2,
				y = [],
				bounds2 = this.getBounds2(target),
				colors = Chart.getColors();
				
			if (inst.settings.plugin === "svg") {
				g1 = inst.handle.g().attr({
					"class": "zui-chart-canvas"
				}).getShape();
				g2 = inst.handle.g().attr({
					"class": "zui-chart-points"
				}).getShape();
			}
			
			for (i = 0, iCnt = inst.settings.series[0].data.length; i < iCnt; i++) {
				for (j = 0, jCnt = inst.settings.series.length; j < jCnt; j++) {
					if (y[j] === undefined) {
						y[j] = [];
					}
					y[j].push( inst.settings.paddingTop + inst.settings.canvasHeight - inst.settings.canvasHeight * (inst.settings.series[j].data[i].value / bounds2.yMax) );
				}
			}

			for (j = 0, jCnt = y.length; j < jCnt; j++) {
				p = [];
				for (i = 0, iCnt = y[j].length; i < iCnt; i++) {
					x1 = inst.settings.paddingLeft + inst.settings.blockWidth / 2 + i * inst.settings.blockWidth;
					if (i !== iCnt - 1) {
						x2 = inst.settings.paddingLeft + inst.settings.blockWidth / 2 + (i+1) * inst.settings.blockWidth;
						
						switch (inst.settings.plugin) {
						case "canvas":
							inst.handle.attr({
								"fillStyle": "transparent",
								"strokeStyle": inst.settings.series[j].color || colors[j],
								"lineWidth": 3
							}).begin().moveTo(
								x1,
								y[j][i]
							).bezierCurveTo(
								x1 + inst.settings.blockWidth / 2, 
								y[j][i],
								x2 - inst.settings.blockWidth / 2,
								y[j][i+1],
								x2,
								y[j][i+1]					
							).stroke();
							
							p.push((i > 0 ? "" : "M" + x1 + "," + y[j][i] + " ") + 
								"C" + (x1 + inst.settings.blockWidth / 2) + "," + y[j][i] +
								" " + (x2 - inst.settings.blockWidth / 2) + "," + y[j][i+1] +
								" " + x2 + "," + y[j][i+1]);
							break;
						case "svg":
						default:
							p.push((i > 0 ? "" : "M" + x1 + "," + y[j][i] + " ") + 
								"C" + (x1 + inst.settings.blockWidth / 2) + "," + y[j][i] +
								" " + (x2 - inst.settings.blockWidth / 2) + "," + y[j][i+1] +
								" " + x2 + "," + y[j][i+1]);
							break;
						}
					}
					
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": "#FFFFFF",
							"strokeStyle": inst.settings.series[j].color || colors[j],
							"lineWidth": 1
						}).begin().circle(x1, y[j][i], 4).fill().stroke();
						break;
					case "svg":
					default:
						inst.handle.circle(
							x1,	y[j][i], 4, false
						).attr({
							"fill": "#FFFFFF",
							"fill-opacity": 1,
							"stroke": inst.settings.series[j].color || colors[j],
							"stroke-opacity": 1,
							"stroke-width": 1
						}).appendTo(g2);
						break;
					}
				}

				switch (inst.settings.plugin) {
				case "canvas":
					
					break;
				case "svg":
				default:
					inst.handle.path(p.join(" "), false).attr({
						"fill": "none",
						"stroke": inst.settings.series[j].color || colors[j],
						"stroke-width": 3,
						"style": "stroke-dasharray: 3000,3000"
					}).appendTo(g1);
					break;
				}
			}
		},
		stepline: function (target) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			this.setPlot.call(this, target);
			
			var i, iCnt, j, jCnt, g, xFirst, xLast, x, y,
				colors = Chart.getColors(),
				d = [];
			
			if (inst.settings.plugin === "svg") {
				g = inst.handle.g().attr({
					"class": "zui-chart-canvas",
					"clip-path": "url(#zinoui-" + inst.uid + ")"
				}).getShape();
			}
			
			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
				xFirst = inst.settings.paddingLeft + inst.settings.blockWidth/2;
				d[i] = [];
				for (j = 0, jCnt = inst.settings.series[i].data.length; j < jCnt; j++) {
					xLast = inst.settings.paddingLeft + inst.settings.blockWidth * (j) + inst.settings.blockWidth/2;
					y = this.getY(target, inst.settings.series[i].data[j].value);
					if (j > 0) {
						switch (inst.settings.progression) {
						case "backward":
							d[i].push(["L", xLast - inst.settings.blockWidth, ",", y].join(""));
							d[i].push(["L", xLast, ",", y].join(""));
							break;
						case "forward":
						default:
							d[i].push(["L", xLast, ",", y].join(""));
							if (j < jCnt - 1) {
								d[i].push(["L", xLast + inst.settings.blockWidth, ",", y].join(""));
							}
							break;
						}
					} else {
						switch (inst.settings.progression) {
						case "backward":
							d[i].push(["M", xFirst, ",", y].join(""));
							break;
						case "forward":
						default:
							d[i].push(["M", xFirst, ",", y].join(""));
							d[i].push(["L", xFirst + inst.settings.blockWidth, ",", y].join(""));
							break;
						}
					}
				}
			}

			for (i = 0, iCnt = d.length; i < iCnt; i++) {
				switch (inst.settings.plugin) {
				case "canvas":
					inst.handle.attr({
						"fillStyle": "transparent",
						"strokeStyle": inst.settings.series[i].color || colors[i],
						"lineWidth": 2
					}).path(d[i].join(""));
					break;
				case "svg":
				default:
					inst.handle.path(d[i].join(""), false).attr({
						"fill": "none",
						"stroke": inst.settings.series[i].color || colors[i],
						"stroke-width": 2,
						"style": "stroke-dasharray: 3000,3000",
						"marker-start": "url(#marker-" + i + ")",
						"marker-mid": "url(#marker-" + i + ")",
						"marker-end": "url(#marker-" + i + ")"
					}).appendTo(g);
					break;
				}
			}
			
			for (i = 0, iCnt = inst.settings.series.length; i < iCnt; i++) {
				for (j = 0, jCnt = inst.settings.series[i].data.length; j < jCnt; j++) {
					xLast = inst.settings.paddingLeft + inst.settings.blockWidth * (j) + inst.settings.blockWidth/2;
					y = this.getY(target, inst.settings.series[i].data[j].value);
					
					switch (inst.settings.plugin) {
					case "canvas":
						inst.handle.attr({
							"fillStyle": "#FFFFFF",
							"strokeStyle": inst.settings.series[i].color || colors[i],
							"lineWidth": 2
						}).begin().circle(xLast, y, 4).close().fill().stroke();
						break;
					case "svg":
					default:
						inst.handle.circle(xLast, y, 4, false).attr({
							"fill": "#FFFFFF",
							"stroke": inst.settings.series[i].color || colors[i],
							"stroke-width": 2
						}).appendTo(g);
						break;
					}
				}
			}
		},
		symbol: function (target, type, opts, g) {
			var inst = this._getInst(target);
			if (!inst) {
				return FALSE;
			}
			
			switch (inst.settings.plugin) {
			case "canvas":
				break;
			case "svg":
			default:
				
				switch (type) {
				case "":
					break;
				case "":
					break;
				case "":
					break;
				case "circle":
				default:
					inst.handle.circle(false).attr({
						
					}).appendTo(g);
					break;
				}
				break;
			}
		},
        _mouseenter: function(target, e, shape) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }
            if (!inst.settings.tooltip) {
                return;
            }
            if (inst.settings.plugin === 'svg') {
                this.tooltip[inst.uid].txt.firstChild.firstChild.nodeValue = shape.getAttributeNS("zui", "tooltip");
                var bbox = this.tooltip[inst.uid].txt.getBBox();
                this.tooltip[inst.uid].rect.setAttributeNS(null, "width", Number(bbox.width) + 10);
                this.tooltip[inst.uid].rect.setAttributeNS(null, "height", Number(bbox.height) + 10);
                this.tooltip[inst.uid].g1.setAttributeNS(null, "visibility", "visible");
            }
        },
        _mouseleave: function(target, e, shape) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }
            if (!inst.settings.tooltip) {
                return;
            }
            if (inst.settings.plugin === 'svg') {
                this.tooltip[inst.uid].g1.setAttributeNS(null, "visibility", "hidden");
            }
        },
        _mousemove: function(target, e, shape) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }
            if (!inst.settings.tooltip) {
                return;
            }
            if (inst.settings.plugin === 'svg') {
                var x = e.offsetX,
                    y = e.offsetY,
                    width = parseInt(this.tooltip[inst.uid].rect.getAttributeNS(null, "width"), 10),
                    height = parseInt(this.tooltip[inst.uid].rect.getAttributeNS(null, "height"), 10);
                if (y + height + inst.settings.tooltip.offset.y > inst.settings.height) {
                    y -= height + inst.settings.tooltip.offset.y;
                }
                if (x + width + inst.settings.tooltip.offset.x > inst.settings.width) {
                    x -= width + inst.settings.tooltip.offset.x;
                }
                this.tooltip[inst.uid].g1.setAttributeNS(null, "transform", ["translate(", x, ",", y, ")"].join(""));
            }
        },
        _tooltip: function(target) {
            var inst = this._getInst(target);
            if (!inst) {
                return FALSE;
            }
            if (inst.settings.tooltip && inst.settings.plugin === 'svg') {
                this.tooltip[inst.uid].g1 = inst.handle.g().attr({
                    "class": "zui-chart-tooltip",
                    "visibility": "hidden",
                    "transform": "translate(0,0)"
                }).getShape();

                this.tooltip[inst.uid].rect = inst.handle.rect(inst.settings.tooltip.offset.x, inst.settings.tooltip.offset.y, 0, 0, 100, 22, false).attr({
                    "fill": inst.settings.tooltip.fill,
                    "opacity": inst.settings.tooltip.opacity
                }).appendTo(this.tooltip[inst.uid].g1).getShape();

                this.tooltip[inst.uid].txt = inst.handle.factory("text", false).attr({
                    "x": 20,
                    "y": 20,
                    "fill": inst.settings.tooltip.color,
                    "font-family": inst.settings.fontFamily,
                    "font-size": inst.settings.fontSize,
                    "text-anchor": "start"
                }).appendTo(this.tooltip[inst.uid].g1).getShape();

                this.tooltip[inst.uid].span = inst.handle.factory("tspan", false).attr({
                    "alignment-baseline": "text-before-edge"
                }).appendTo(this.tooltip[inst.uid].txt).getShape();
                inst.handle.textNode("", false).appendTo(this.tooltip[inst.uid].span);
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
				throw 'Missing instance data for this chart';
			}
		}
	};
	
	$.fn.zinoChart = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoChart['_' + options + 'Chart'].apply($.zinoChart, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoChart['_' + options + 'Chart'].apply($.zinoChart, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoChart['_' + options + 'Chart'].apply($.zinoChart, [this].concat(otherArgs)) :
				$.zinoChart._attachChart(this, options);
		});
	};
	
	$.zinoChart = new Chart();
	$.zinoChart.version = "1.5";
})(jQuery);