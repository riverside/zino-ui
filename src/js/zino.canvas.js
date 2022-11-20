/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function (window, undefined) {
	"use strict";
	
	var document = window.document;
	
	function Canvas(options) {
		if (!(this instanceof Canvas)) {
			return new Canvas(options);
		}
		this.target = options.target;
		this.width = options.width;
		this.height = options.height;
		this.canvas = null;
		this.context = null;
		this.rad = Math.PI / 180;
		this._init.call(this);
	}
	Canvas.copyPixLCD = function (source, dest, w1) {
		// copies a 3:1 image to a 1:1 image, using LCD stripes	
		// w1 = centre weighting for sampling. e.g. 0.6
		
		var readIndex, writeIndex, r, g, b, a, x, y,
			
			sc = source.getContext('2d'),
			sw = source.width,
			sh = source.height,
			sp = sc.getImageData(0, 0, sw, sh),
		
			dc = dest.getContext('2d'),
			dw = dest.width,
			dh = dest.height,
			dp = dc.getImageData(0, 0, dw, dh);
		
		// sampling weightings. w1 = weight for sub-pixel; w2 = weight for 
		var w2 = (1-w1) * 0.5;
		var w21 = w1 + w2;
		var w211 = w2 + w2 + w1;
		
		// copy. we cheat, by ignoring the width edges.
		// todo: check extents of source reads, e.g. to use 0..dw, and then prevent index error (too slow?)
		for (y = 0; y < dh; y++) {
		
			for (x = 1; x < (dw-1); x++) {
			
				readIndex  = (y * sw + x * 3) * 4;
				writeIndex = (y * dw + x) * 4;
				
				// r
				dp.data[writeIndex + 0] = Math.round(
						w1 *   sp.data[ readIndex + 0 ]
					+	w2 * ( sp.data[ readIndex - 4 ] + sp.data[ readIndex +  4 ] )
				);
				
				// g
				dp.data[writeIndex + 1] = Math.round(
						w1 *   sp.data[ readIndex + 5 ]
					+	w2 * ( sp.data[ readIndex + 1 ] + sp.data[ readIndex +  9 ] )
				);
				
				// b
				dp.data[writeIndex + 2] = Math.round(
						w1 *   sp.data[ readIndex + 10 ]
					+	w2 * ( sp.data[ readIndex + 6 ] + sp.data[ readIndex + 14 ] )
				);
				
				// a
				dp.data[writeIndex + 3] = Math.round(
					0.3333 * (
							w211 *   sp.data[ readIndex + 7 ]
						+	w21  * ( sp.data[ readIndex + 3 ] + sp.data[ readIndex + 11 ] )
						+	w2   * ( sp.data[ readIndex - 1 ] + sp.data[ readIndex + 15 ] )
					)
				);
				
			}
			
		}
		
		dc.putImageData(dp,0,0);
	};
	Canvas.prototype = {
		_init: function () {
			this.canvas = document.createElement("canvas");
			this.canvas.setAttribute("width", this.width);
			this.canvas.setAttribute("height", this.height);
			this.context = this.canvas.getContext("2d");
			this.target.appendChild(this.canvas);
			return this;
		},
		arc: function (cx, cy, radius, startAngle, endAngle) {
			if (arguments.length === 5) {
				this.context.arc(cx, cy, radius, startAngle, endAngle);
			} else {
				this.context.arc(cx, cy, radius, startAngle, endAngle, arguments[5]);
			}
			
			return this;
		},
		arcTo: function (x1, y1, x2, y2, radius) {
			if (arguments.length === 5) {
				this.context.arcTo(x1, y1, x2, y2, radius);
			} else {
				this.context.arcTo(x1, y1, x2, y2, radius, arguments[5], arguments[6]);
			}
			
			return this;
		},
		attr: function (attr) {
			if (arguments.length === 2) {
				this.context[attr] = arguments[1];
				
				return this;
			}
			
			for (var key in attr) {
				if (attr.hasOwnProperty(key)) {
					this.context[key] = attr[key];
				}
			}
			
			return this;
		},
		begin: function () {
			this.context.beginPath();
			
			return this;
		},
		bezierCurveTo: function (cp1x, cp1y, cp2x, cp2y, x, y) {
			this.context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
			
			return this;
		},
		circle: function (cx, cy, radius) {
			return this.arc(cx, cy, radius, 0, 360 * this.rad, false);
		},
		clear: function () {
			this.context.clearRect(0, 0, this.width, this.height);
			
			return this;
		},
		bind: function (eventType, fn) {
			var that = this;
			this.canvas.addEventListener(eventType, function (event) {
				return fn.call(that, event, this);
			});
			
			return this;
		},
		clip: function () {
			this.context.clip();
			
			return this;
		},
		close: function () {
			this.context.closePath();
			
			return this;
		},
		commit: function () {
			this.context.commit();
			
			return this;
		},
		ellipse: function (x, y, radiusX, radiusY) {
			var kappa = .5522848,
				width = radiusX * 2,
				height = radiusY * 2,
				ox = (width / 2) * kappa, // control point offset horizontal
				oy = (height / 2) * kappa, // control point offset vertical
				xe = x + width, // x-end
				ye = y + height, // y-end
				xm = x + width / 2, // x-middle
				ym = y + height / 2; // y-middle

			this
				.moveTo(x, ym)
				.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y)
				.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym)
				.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye)
				.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym)
			;
			
			return this;
		},
		fill: function () {
			this.context.fill();
			
			return this;
		},
		fillRect: function (x, y, width, height) {
			this.context.fillRect(x, y, width, height);
			
			return this;
		},
		getContext: function () {
			return this.context;
		},
		image: function (src, sx, sy) {
			var self = this,
				args = arguments,
				imageObj = new Image();
		    imageObj.onload = function() {
		    	switch (args.length) {
		    	case 3:
		    		self.context.drawImage(imageObj, sx, sy);
		    		break;
		    	case 5:
		    		self.context.drawImage(imageObj, sx, sy, args[3], args[4]);
		    		break;
		    	case 9:
		    		self.context.drawImage(imageObj, sx, sy, args[3], args[4], args[5], args[6], args[7], args[8]);
		    		break;
		    	}
		    };
		    imageObj.src = src;
			
			return this;
		},
		line: function (x1, y1, x2, y2) {
			this.begin().moveTo(x1, y1).lineTo(x2, y2).stroke();
			
			return this;
		},
		linearGradient: function (x0, y0, x1, y1) {
			return this.context.createLinearGradient(x0, y0, x1, y1);
		},
		lineTo: function (x, y) {
			this.context.lineTo(x, y);
			
			return this;
		},
		measureText: function (text) {
			return this.context.measureText(text);
		},
		moveTo: function (x, y) {
			this.context.moveTo(x, y);
			
			return this;
		},
		path: function (d) {
			var tmp, el, x, xCnt, t, 
				arr = [];
			
			var t = d.split(/M|L|Z/);
			for (x = 0, xCnt = t.length; x < xCnt; x++) {
				if (t[x].length > 0 && t[x] !== "") {
					arr.push(t[x]);
				}
			}

			this.begin().moveTo(arr[0].split(",")[0], arr[0].split(",")[1]);
			
			//arr.push(arr[0]);
			for (x = 0, xCnt = arr.length; x < xCnt; x++) {
				if (x > 0) {
					tmp = el;
				}
				el = arr[x].split(",");
				if (x > 0) {
					this.lineTo(el[0], el[1]);
				}
			}
			this.fill().stroke();
			
			return this;
		},
		pattern: function (src, repetition, callback) {
			var self = this,
				imageObj = new Image();
		    imageObj.onload = function() {
		    	var pattern = self.context.createPattern(imageObj, repetition);
		    	
		    	if (typeof callback === "function") {
		    		callback.call(null, pattern);
		    	}
		    };
		    imageObj.src = src;
			
			return this;
		},
		quadraticCurveTo: function (cpx, cpy, x, y) {
			this.context.quadraticCurveTo(cpx, cpy, x, y);
			
			return this;
		},
		radialGradient: function (x0, y0, r0, x1, y1, r1) {
			return this.context.createRadialGradient(x0, y0, r0, x1, y1, r1);
		},
		rect: function (x, y, width, height) {
			this.context.rect(x, y, width, height);
			
			return this;
		},
		resetClip: function () {
			this.context.resetClip();
			
			return this;
		},
		resetTransform: function () {
			this.context.resetTransform();
			
			return this;
		},
		restore: function () {
			this.context.restore();
			
			return this;
		},
		rose: function (mx, my, r1, x1, y1, lx, ly, r2, x2, y2) {
			var d = [
			    "M", mx, ",", my, 
			    " A", r1, ",", r1, " ", 0, " ", 0, ",", 1, , " ", x1, ",", y1,
			    " L", lx, ",", ly,
			    " A", r2, ",", r2, , " ", 0, " ", 0, ",", 0, " ", x2, ",", y2,
			    " Z"
			].join("");

			return this.path(d);
		},
		rotate: function (angle) {
			this.context.rotate(angle);
			
			return this;
		},
		save: function () {
			this.context.save();
			
			return this;
		},
		scale: function (x, y) {
			this.context.scale(x, y);
			
			return this;
		},
		sector: function (cx, cy, r, startAngle, endAngle) {
			this
				.save()
				
				.begin()
				.moveTo(cx, cy)
				.arc(cx, cy, r, (startAngle * this.rad).toFixed(2), (endAngle * this.rad).toFixed(2))
				.lineTo(cx, cy)
				.close()
				.fill()
				.stroke()
				.restore();
			
			return this;
		},
		setLineDash: function (args) {
			if (!this.context.setLineDash) {
				return this;
			}
			this.context.setLineDash(args);
			
			return this;
		},
		setTransform: function (m11, m12, m21, m22, dx, dy) {
			this.context.setTransform(m11, m12, m21, m22, dx, dy);
			
			return this;
		},
		stroke: function () {
			this.context.stroke();
			
			return this;
		},
		strokeRect: function (x, y, width, height) {
			this.context.strokeRect(x, y, width, height);
			
			return this;
		},
		text: function (text, x, y) {
			var method = "fill";
			if (this.context.strokeStyle !== undefined) {
				method = "stroke";
			}
			if (arguments.length === 4 && arguments[3] !== undefined) {
				this.context.fillText(text, x, y, arguments[3]);
				if (method == "stroke") {
					this.context.strokeText(text, x, y, arguments[3]);
				}
			} else {
				this.context.fillText(text, x, y);
				if (method == "stroke") {
					this.context.strokeText(text, x, y);
				}
			}
			
			return this;
		},
		transform: function (m11, m12, m21, m22, dx, dy) {
			this.context.transform(m11, m12, m21, m22, dx, dy);
			
			return this;
		},
		translate: function (x, y) {
			this.context.translate(x, y);
			
			return this;
		}
	};
	
	window.zino = window.zino || {};
	window.zino.Canvas = Canvas;
})(window);