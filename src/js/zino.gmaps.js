/*!
 * zino-ui v1.5.1 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";
	
	var PROP_NAME = 'editor',
		FALSE = false,
		TRUE = true;

	function Editor() {
		this._defaults = {
			
		};
	}
	
	Editor.prototype = {
		_attachEditor: function (target, settings) {
			if (this._getInst(target)) {
				return FALSE;
			}
			var $target = $(target),
				self = this,
				inst = self._newInst($target);

			$.extend(inst.settings, self._defaults, settings);
			
			
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
				throw 'Missing instance data for this editor';
			}
		}
	};

	$.fn.zinoEditor = function (options) {
		
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && options === 'isDisabled') {
			return $.zinoEditor['_' + options + 'Editor'].apply($.zinoEditor, [this[0]].concat(otherArgs));
		}
		
		if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
			return $.zinoEditor['_' + options + 'Editor'].apply($.zinoEditor, [this[0]].concat(otherArgs));
		}
		
		return this.each(function() {
			typeof options == 'string' ?
				$.zinoEditor['_' + options + 'Editor'].apply($.zinoEditor, [this].concat(otherArgs)) :
				$.zinoEditor._attachEditor(this, options);
		});
	};
	
	$.zinoEditor = new Editor();
	$.zinoEditor.version = "1.5.1";
})(jQuery);