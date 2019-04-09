const gulp = require('gulp')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const watchify = require('watchify')
const tsify = require('tsify')
const gutil = require('gulp-util')
const glob = require('glob')
const exorcist = require('exorcist')


function task(name) {
	let browser = browserify({
		basedir: '.',
		//debug: true,
		entries: glob.sync(__dirname + '/test/dom/**/*.test.ts')
	})
	browser.plugin(tsify, {
		typeRoots: ['test/dom/node_modules/@types'],
		types: ['mocha', 'chai']
	})
	browser.on('log', gutil.log)

	if (name === 'test-watch') {
		browser.plugin(watchify)
		browser.on('update', () => {
			browser.close()
			bundle()
		})
	}

	function bundle() {
		return browser
			.bundle()
			//.pipe(exorcist(__dirname + '/test/dom/bundle.js.map'))
			.pipe(source('bundle.js'))
			.pipe(gulp.dest('test/dom'))
	}

	return bundle()
}

gulp.task('test', () => task('test'))
gulp.task('test-watch', () => task('test-watch'))