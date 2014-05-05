var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    rjs = require('gulp-requirejs'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    docco = require('gulp-docco'),
    theCode = ['src/**/*.js','tests/**/*.js'],
    moduleName = 'udc';

gulp.task('default', ['lint', 'build', 'test', 'docs']);

gulp.task('lint', function() {
  gulp.src(theCode).pipe(jshint()).pipe(jshint.reporter(stylish));
});

gulp.task('build', function() {
  rjs({
    baseUrl: 'src',
    name: moduleName,
    out: moduleName + '.js',
    paths: { _: 'empty:' }
  })
  //.pipe(uglify())
  .pipe(gulp.dest('dist'));
});

gulp.task('test', ['build'], function () {
  gulp.src(['tests/**/*.js']).pipe(mocha({ reporter: 'spec' }));
});

gulp.task('docs', function () {
  gulp.src(theCode).pipe(docco()).pipe(gulp.dest('docs'))
});
