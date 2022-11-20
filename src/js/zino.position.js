/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function (window, undefined) {
	"use strict";
	function Position(x, y) {
		this.version = "1.5.1";
		this.X = x;
		this.Y = y;
	}
	Position.getCursor = function(e) {
		return new Position(e.pageX, e.pageY);
	};
	Position.prototype = {
		add : function(val) {
			var newPos = new Position(this.X, this.Y);
			if (val != null) {
				if (!isNaN(val.X)) {
					newPos.X += val.X;
				}
				if (!isNaN(val.Y)) {
					newPos.Y += val.Y;
				}
			}
			return newPos;
		},
		subtract : function(val) {
			var newPos = new Position(this.X, this.Y);
			if (val != null) {
				if (!isNaN(val.X)) {
					newPos.X -= val.X;
				}
				if (!isNaN(val.Y)) {
					newPos.Y -= val.Y
				}
			}
			return newPos;
		},
		min : function(val) {
			var newPos = new Position(this.X, this.Y)
			if (val == null) {
				return newPos;
			}
			if (!isNaN(val.X) && this.X > val.X) {
				newPos.X = val.X;
			}
			if (!isNaN(val.Y) && this.Y > val.Y) {
				newPos.Y = val.Y;
			}
			return newPos;
		},
		max : function(val) {
			var newPos = new Position(this.X, this.Y)
			if (val == null) {
				return newPos;
			}
			if (!isNaN(val.X) && this.X < val.X) {
				newPos.X = val.X;
			}
			if (!isNaN(val.Y) && this.Y < val.Y) {
				newPos.Y = val.Y;
			}
			return newPos;
		},
		bound : function(lower, upper) {
			var newPos = this.max(lower);
			return newPos.min(upper);
		},
		check : function() {
			var newPos = new Position(this.X, this.Y);
			if (isNaN(newPos.X)) {
				newPos.X = 0;
			}
			if (isNaN(newPos.Y)) {
				newPos.Y = 0;
			}
			return newPos;
		},
		apply : function(element) {
			if (typeof (element) == "string") {
				element = $(element);
			}
			if (element.length === 0) {
				return;
			}
			if (!isNaN(this.X)) {
				element.css("left", this.X + 'px');
			}
			if (!isNaN(this.Y)) {
				element.css("top", this.Y + 'px');
			}
		}
	};
	
	window.zino = window.zino || {};
	window.zino.Position = Position;
})(window);