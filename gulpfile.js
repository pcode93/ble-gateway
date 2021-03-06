var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    sass = require('gulp-sass'),
    uglify = require('gulp-uglify'),
    csslint = require('gulp-csslint'),
    sourcemaps = require('gulp-sourcemaps'),
    cleanCss = require('gulp-clean-css');

gulp.task('sass', function() {
    return gulp.src('public/main.scss')
            .pipe(sass())
            .pipe(sourcemaps.init())
            .pipe(csslint())
            .pipe(csslint.reporter('text'))
            .pipe(cleanCss())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('public/styles'));
});

gulp.task('jshint', function() {
    return gulp.src(['*.js', 'public/*.js', 'public/components/*/*.js'])
            .pipe(jshint({
                esversion: 6
            }))
            .pipe(jshint.reporter(stylish));
});

gulp.task('install-web-lib', function() {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js',
                     'node_modules/angular/angular.min.js',
                     'node_modules/angular-ui-router/release/angular-ui-router.min.js',
                     'node_modules/font-awesome/css/font-awesome.min.css',
                     'node_modules/font-awesome/fonts/*'], {base: 'node_modules'})
            .pipe(gulp.dest('public/lib'))
})

gulp.task('default', ['sass', 'jshint']);