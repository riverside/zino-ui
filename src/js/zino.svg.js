/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function (window, undefined) {
	"use strict";

	var document = window.document;

	function Svg(options) {
		if (!(this instanceof Svg)) {
			return new Svg(options);
		}
		this.target = options.target;
		this.width = options.width;
		this.height = options.height;
		this.options = options;
		this.defs = null;
		this.svg = null;
		this.svgNS = "http://www.w3.org/2000/svg";
		this.shape = null;
		this.rad = Math.PI / 180;
		this._init.call(this);
	}
	Svg.prototype = {
		_init: function () {
			this.svg = document.createElementNS(this.svgNS, "svg");
			this.svg.setAttribute("version", "1.1");
			this.svg.setAttribute("baseProfile", "full");
			this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
			this.svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
			this.svg.setAttribute("xmlns:ev", "http://www.w3.org/2001/xml-events");
			this.svg.setAttribute("width", this.width);
			this.svg.setAttribute("height", this.height);
			if (this.options.viewBox) {
				this.svg.setAttribute("viewBox", this.options.viewBox);
			}
			if (this.options.preserveAspectRatio) {
				this.svg.setAttribute("preserveAspectRatio", this.options.preserveAspectRatio);
			}
			if (this.options.namespaces) {
				for (var ns in this.options.namespaces) {
					if (this.options.namespaces.hasOwnProperty(ns)) {
						this.svg.setAttribute("xmlns:" + ns, this.options.namespaces[ns]);
					}
				}
			}
			this.defs = document.createElementNS(this.svgNS, "defs");
			this.svg.appendChild(this.defs);
			this.target.appendChild(this.svg);
			return this;
		},
		a: function (href, target, append) {
			this.shape = document.createElementNS(this.svgNS, "a");
			this.shape.setAttributeNS(null, "target", target);
			this.shape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", href);
			if (append === undefined || append === true) {
				this.svg.appendChild(this.shape);
			}
			return this;
		},
		_animate: function (shape, attr) {
			for (var key in attr) {
				if (attr.hasOwnProperty(key)) {
					shape.setAttributeNS(null, key, attr[key]);
				}
			}
			this.append(shape);
			return this;
		},
		animate: function (attr) {
			var shape = document.createElementNS(this.svgNS, "animate");
			return this._animate(shape, attr);
		},
		animateColor: function (attr) {
			var shape = document.createElementNS(this.svgNS, "animateColor");
			return this._animate(shape, attr);
		},
		animateMotion: function (attr) {
			var shape = document.createElementNS(this.svgNS, "animateMotion");
			return this._animate(shape, attr);
		},
		animateTransform: function (attr) {
			var shape = document.createElementNS(this.svgNS, "animateTransform");
			return this._animate(shape, attr);
		},
		append: function (el) {
			if (el) {
				this.shape.appendChild(el);
			}
			return this;
		},
		appendTo: function (target) {
			target.appendChild(this.shape);
			return this;
		},
		arc: function (cx, cy, r, startAngle, endAngle, append) {
			var x1 = cx + r * Math.cos(-startAngle * this.rad),
				x2 = cx + r * Math.cos(-endAngle * this.rad),
				y1 = cy + r * Math.sin(-startAngle * this.rad),
				y2 = cy + r * Math.sin(-endAngle * this.rad),
				d = ["M", x1, ",", y1, "A", r, ",", r, " 0 ", +(endAngle - startAngle > 180), ",0 ", x2, ",", y2].join("");
			return this.path(d, append);
		},
		attr: function (attr) {
			for (var key in attr) {
				if (attr.hasOwnProperty(key)) {
					if (key.indexOf(':') === -1) {
						this.shape.setAttributeNS(null, key, attr[key]);
					} else {
						this.shape.setAttributeNS(key.split(':')[0], key.split(':')[1], attr[key]);
					}
				}
			}
			return this;
		},
		bind: function (eventType, fn) {
			var that = this;
			$(this.shape).bind(eventType, function (e) {
				return fn.call(that, e, this);
			});
			return this;
		},
		circle: function (cx, cy, r, append) {
            return this.factory("circle", {
                "cx": cx,
                "cy": cy,
                "r": r
            }, append);
		},
		clipPath: function (id, append) {
			this.shape = document.createElementNS(this.svgNS, "clipPath");
			this.shape.setAttributeNS(null, "id", id);
			if (append === undefined || append === true) {
				this.defs.appendChild(this.shape);
			}
			return this;
		},
		//Cubic Bezier curve
		cubicCurve: function (c1x, c1y, c2x, c2y, c3x, c3y, x, y, append) {
			var d = ["M", x, ",", y, " C", c1x, ",", c1y, " ", c2x, ",", c2y, " ", c3x, ",", c3y].join("");
			return this.path(d, append);
		},
		desc: function (text, append) {
			this.shape = document.createElementNS(this.svgNS, "desc");
			this.shape.appendChild(document.createTextNode(text));
			if (append === undefined || append === true) {
				this.svg.appendChild(this.shape);
			}
			return this;
		},
		ellipse: function (cx, cy, rx, ry, append) {
            return this.factory("ellipse", {
                "cx": cx,
                "cy": cy,
                "rx": rx,
                "ry": ry
            }, append);
		},
        //factory(String element[, Object attr[, Boolean append]]);
		factory: function () {
            var append,
                attr = {},
                element = arguments[0];

            switch (arguments.length) {
            case 2:
                append = arguments[1];
                break;
            case 3:
                attr = arguments[1];
                append = arguments[2];
                break;
            }

			this.shape = document.createElementNS(this.svgNS, element);
            this.attr(attr);
			if (append === undefined || append === true) {
				this.svg.appendChild(this.shape);
			}
			return this;
		},
		g: function (append) {
            return this.factory("g", append);
		},
		getBBox: function () {
			return this.shape.getBBox();
		},
		getShape: function () {
			return this.shape;
		},
		image: function (x, y, width, height, href, append) {
			this.shape = document.createElementNS(this.svgNS, "image");
			this.shape.setAttributeNS(null, "x", x);
			this.shape.setAttributeNS(null, "y", y);
			this.shape.setAttributeNS(null, "width", width);
			this.shape.setAttributeNS(null, "height", height);
			this.shape.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", href);
			if (append === undefined || append === true) {
				this.svg.appendChild(this.shape);
			}
			return this;
		},
		insert: function () {
			this.svg.appendChild(this.shape);
			return this;
		},
		line: function (x1, y1, x2, y2, append) {
            return this.factory("line", {
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2
            }, append);
		},
		linearGradient: function (x1, y1, x2, y2, append) {
			this.shape = document.createElementNS(this.svgNS, "linearGradient");
			this.shape.setAttributeNS(null, "x1", x1);
			this.shape.setAttributeNS(null, "y1", y1);
			this.shape.setAttributeNS(null, "x2", x2);
			this.shape.setAttributeNS(null, "y2", y2);
			if (append === undefined || append === true) {
				this.defs.appendChild(this.shape);
			}
			return this;
		},
		radialGradient: function (cx, cy, r, append) {
			this.shape = document.createElementNS(this.svgNS, "radialGradient");
			this.shape.setAttributeNS(null, "cx", cx);
			this.shape.setAttributeNS(null, "cy", cy);
			this.shape.setAttributeNS(null, "r", r);
			if (append === undefined || append === true) {
				this.defs.appendChild(this.shape);
			}
			return this;
		},
		marker: function (append) {
            return this.factory("marker", append);
		},
		path: function (d, append) {
            return this.factory("path", {
                "d": d
            }, append);
		},
		polygon: function (points, append) {
            return this.factory("polygon", {
                "points": points
            }, append);
		},
		polyline: function (points, append) {
            return this.factory("polyline", {
                "points": points
            }, append);
		},
		//Quadratic Bezier curve 
		quadraticCurve: function (x1, y1, x2, y2, cx, cy, append) {
			var d = ["M", x1, ",", y1, " Q", x2, ",", y2, " ", cx, ",", cy].join("");
			return this.path(d, append);
		},
		rect: function (x, y, rx, ry, width, height, append) {
			this.shape = document.createElementNS(this.svgNS, "rect");
			this.shape.setAttributeNS(null, "x", x);
			this.shape.setAttributeNS(null, "y", y);
			if (rx === 0 && ry === 0) {
				
			} else {
				this.shape.setAttributeNS(null, "rx", rx);
				this.shape.setAttributeNS(null, "ry", ry);
			}
			this.shape.setAttributeNS(null, "width", width);
			this.shape.setAttributeNS(null, "height", height);
			if (append === undefined || append === true) {
				this.svg.appendChild(this.shape);
			}
			return this;
		},
		rose: function (mx, my, r1, x1, y1, lx, ly, r2, x2, y2, append) {
			var d = [
			    "M", mx, ",", my, 
			    " A", r1, ",", r1, " ", 0, " ", 0, ",", 0, , " ", x1, ",", y1,
			    " L", lx, ",", ly,
			    " A", r2, ",", r2, , " ", 0, " ", 0, ",", 1, " ", x2, ",", y2,
			    " Z"
			].join("");
			return this.path(d, append);
		},
		sector: function (cx, cy, r, startAngle, endAngle, append) {
			var x1 = cx + r * Math.cos(-startAngle * this.rad),
				x2 = cx + r * Math.cos(-endAngle * this.rad),
				y1 = cy + r * Math.sin(-startAngle * this.rad),
				y2 = cy + r * Math.sin(-endAngle * this.rad),
				d = ["M", cx, ",", cy, " L", x1, ",", y1, " A", r, ",", r, " ", 0, " ", +(endAngle - startAngle > 180), ",", 0, " ", x2, ",", y2, " Z"].join("");
			return this.path(d, append);
		},
		text: function (x, y, text, append) {
			this.shape = document.createElementNS(this.svgNS, "text");
			this.shape.setAttributeNS(null, "x", x);
			this.shape.setAttributeNS(null, "y", y);
			this.shape.appendChild(document.createTextNode(text));
			if (append === undefined || append === true) {
				this.svg.appendChild(this.shape);
			}
			return this;
		},
        textNode: function (text, append) {
            this.shape = document.createTextNode(text);
            if (append === undefined || append === true) {
                this.svg.appendChild(this.shape);
            }
            return this;
        },
		title: function (text, append) {
			this.shape = document.createElementNS(this.svgNS, "title");
			this.shape.appendChild(document.createTextNode(text));
			if (append === undefined || append === true) {
				this.svg.appendChild(this.shape);
			}
			return this;
		}
	};
	
	window.zino = window.zino || {};
	window.zino.Svg = Svg;
})(window);