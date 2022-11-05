const { src, dest, parallel } = require('gulp');
const clean = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const rename = require("gulp-rename");

function js() {
    return src(['static/js/editor.js', '!static/js/editor.min.js'])
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
		.pipe(dest(function(file) {
			return file.base;
		}));
}


const build = parallel(js);

exports.js = js;
exports.build = build;
exports.default = build;