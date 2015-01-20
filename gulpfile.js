var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
	jshintReporter = require('jshint-stylish'),
	gutil = require('gulp-util'),
	watch = require('gulp-watch'),
	browserify = require('browserify'),
	watchify = require('watchify'),
	source = require('vinyl-source-stream'),
	_ = require('lodash'),
	chalk = require('chalk'),
	reactify = require('reactify');

/*
 * Create variables for our project paths so we can change in one place
 */
var paths = {
	'src':['./models/**/*.js','./routes/**/*.js', 'keystone.js', 'package.json'],
	// enable for tests
	//'tests':['./test/*.js', './test/**/*.js']
};

// build scripts with browserify and react / jsx transforms
gulp.task('build-scripts', function() {
	return browserify({ 
			standalone: 'App',	
		})
		.add('./webkit/index.js')		
		.transform(reactify)
		.bundle()
		.on('error', function(e) {
			gutil.log('Browserify Error', e);
		})
		.pipe(source('webkit.js'))
		.pipe(gulp.dest('./build'));
});
// watch scripts & build with debug features
gulp.task('watch-scripts', function() {
	
	var b = browserify(_.defaults({
			standalone: 'App'
		}, watchify.args))		
		.add('./webkit/index.js')
		.transform(reactify);		
		
	var w = watchify(b)
		.on('update', function (scriptIds) {
			scriptIds = scriptIds
				.filter(function(i) { return i.substr(0,2) !== './' })
				.map(function(i) { return chalk.blue(i.replace(__dirname, '')) });
			if (scriptIds.length > 1) {
				gutil.log(scriptIds.length + ' Scripts updated:\n* ' + scriptIds.join('\n* ') + '\nrebuilding...');
			} else {
				gutil.log(scriptIds[0] + ' updated, rebuilding...');
			}
			rebundle();
		})
		.on('time', function (time) {
			gutil.log(chalk.green('Scripts built in ' + (Math.round(time / 10) / 100) + 's'));
		});
	
	function rebundle() {
		w.bundle()
			.on('error', function(e) {
 				gutil.log('Browserify Error', e);
 			})
 			.pipe(source('webkit.js'))
 			.pipe(gulp.dest('./build'));

	}
	
	return rebundle();
	
});
// gulp lint
gulp.task('lint', function(){
	gulp.src(paths.src)
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));

});

// gulp watcher for lint
gulp.task('watchLint', function () {
	gulp.src(paths.src)
		.pipe(watch())
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));
});
