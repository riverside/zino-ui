const { src, dest, parallel } = require('gulp');
const clean = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const rename = require("gulp-rename");

function js() {
    return src('src/js/*.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
		.pipe(dest('dist/js'));
}

function maps() {
    return src('src/maps/*.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(dest('dist/maps'));
}

function themes() {
    return src('src/maps/*.js')
        .pipe(clean())
        .pipe(rename({suffix: '.min'}))
        .pipe(dest('dist/themes'));
}


const build = parallel(js, maps, themes);

exports.js = js;
exports.maps = maps;
exports.themes = themes;
exports.build = build;
exports.default = build;