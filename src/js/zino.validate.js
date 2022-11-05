/*!
 * zino-ui v1.5 (https://github.com/riverside/zino-ui)
 * Copyright 2012-2022 Dimitar Ivanov. All Rights Reserved.
 */
(function ($, undefined) {
	"use strict";

    var PROP_NAME = 'validate',
        FALSE = false,
        TRUE = true;
	
	function Validate() {
        this._defaults = {
            defs: {
                name: [
                    {
                        type: "empty",
                        text: "Name is required"
                    }
                ],
                email: [
                    {
                        type: "empty",
                        text: "Email address is required"
                    },
                    {
                        type: "email",
                        text: "Invalid email address"
                    }
                ]
            },
            onError: function () {

            },
            onValidate: function () {

            }
        };
	}

    Validate.prototype = {
        _attachValidate: function (target, settings) {
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
                throw 'Missing instance data for this validate';
            }
        }
    };
	var V = {};
	V.options = {
		emailRegExp: /[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i,
		urlRegExp: /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i
	};
	
	V.isValid = function () {
		return true;
	};
	
	V.isNumeric = function (input) {
		return (input - 0) == input && input.length > 0;
	};
	
	V.isEmail = function (input) {
		return input.match(this.options.emailRegExp) !== null;
	};
	
	V.isUrl = function (input) {
		return input.match(this.options.urlRegExp) !== null;
	};
	
	V.isEmpty = function (input) {
		 return input;
	};


    $.fn.zinoValidate = function (options) {

        var otherArgs = Array.prototype.slice.call(arguments, 1);
        if (typeof options == 'string' && $.inArray(options, ['isDisabled'])) {
            return $.zinoValidate['_' + options + 'Validate'].apply($.zinoValidate, [this[0]].concat(otherArgs));
        }

        if (options === 'option' && arguments.length === 2 && typeof arguments[1] == 'string') {
            return $.zinoValidate['_' + options + 'Validate'].apply($.zinoValidate, [this[0]].concat(otherArgs));
        }

        return this.each(function() {
            typeof options == 'string' ?
                $.zinoValidate['_' + options + 'Validate'].apply($.zinoValidate, [this].concat(otherArgs)) :
                $.zinoValidate._attachValidate(this, options);
        });
    };

    $.zinoValidate = new Validate();
    $.zinoValidate.version = "1.5";
})(jQuery);