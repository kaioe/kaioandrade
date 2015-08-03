/**
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

'use strict';

// Include Gulp & tools we'll use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var pagespeed = require('psi');
var reload = browserSync.reload;
var bower = require('gulp-bower');
var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var appRoot = './app',
    distRoot = './dist';
var config = {
  bowerDir: './bower_components',
  fonts: {
    src: appRoot+'/fonts',
    files: appRoot+'/fonts/**',
    dest: distRoot+'/fonts'
  },
  styles: {
    folder: appRoot+'/css',
    src: appRoot+'/scss',
    files: appRoot+'/scss/**/*.scss',
    dest: distRoot+'/css'
  },
  scripts: {
    src: appRoot+'/scripts',
    files: appRoot+'/scripts/**/*.js',
    dest: distRoot+'/js'
  },
  images: {
    src: appRoot+'/img',
    files: appRoot+'/img/**/*',
    dest: distRoot+'/img'
  }
}

// Lint JavaScript
  gulp.task('jshint', function () {
    return gulp.src(config.scripts.files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
      .pipe(gulp.dest('./app/js'))
      .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
  });

// Running Bower
  gulp.task('bower', function() { 
    return bower()
           .pipe(gulp.dest(config.bowerDir)) 
  });

// Copy fonts Awesome to dist
  gulp.task('icons', function() { 
    return gulp.src(config.bowerDir+'/fontawesome/fonts/**.*') 
      .pipe(gulp.dest(config.fonts.dest)); 
  });

// Copy CSS Awesome to dist
  gulp.task('iconsCSS', function() { 
    return gulp.src(config.bowerDir+'/fontawesome/css/**.*') 
      .pipe(gulp.dest(config.styles.dest)); 
  }); 

// Optimize images
  gulp.task('images', function () {
    return gulp.src(config.images.files)
      .pipe($.cache($.imagemin({
        progressive: true,
        interlaced: true
      })))
      .pipe(gulp.dest(config.images.dest))
      .pipe($.size({title: 'img'}));
  });

// Copy all files at the root level (app)
  gulp.task('copy', function () {
    return gulp.src([
      config.appRoot,
      '!app/*.html',
      './node_modules/apache-server-configs/dist/.htaccess'
    ], { dot: true })
    .pipe(gulp.dest(config.distRoot))
    .pipe($.size({title: 'copy'}));
  });

// Copy web fonts to dist
  gulp.task('fonts', function () {
    return gulp.src([config.fonts.files])
      .pipe(gulp.dest(config.fonts.dest))
      .pipe($.size({title: 'fonts'}));
  });

// Compile and automatically prefix stylesheets
  gulp.task('css', function () {
    // For best performance, don't add Sass partials to `gulp.src`
    return gulp.src([
      'app/css/**/*.css',
      config.styles.files
    ])
      // .pipe($.sourcemaps.init())
      .pipe($.changed(config.styles.files, {extension: '.scss'}))
      .pipe($.sass({
          precision: 10,
          onError: console.error.bind(console, 'Sass error:')
        }))
      .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
      // .pipe($.sourcemaps.write())
      // .pipe(gulp.dest('./tmp/css'))
      // Concatenate and minify styles
      .pipe($.if('*.css', $.csso()))
      .pipe(gulp.dest(config.styles.folder))
      .pipe($.size({title: 'css'}));
  });

// trying to compile my scss files
  gulp.task('scss', function(){
    gulp.src(config.styles.files)
    .pipe($.sass())
    .pipe(gulp.dest('./tmp/css'))

  })

// Scan your HTML for assets & optimize them
  gulp.task('html', function () {
    var assets = $.useref.assets({searchPath: '{.tmp,app}'});

    return gulp.src(config.appRoot+'/**/*.html')
      .pipe(assets)
      // Concatenate and minify JavaScript
      .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
      // Remove any unused CSS
      // Note: if not using the Style Guide, you can delete it from
      //       the next line to only include styles your project uses.
      .pipe($.if('*.css', $.uncss({
        html: [
          config.appRoot+'/index.html'
        ],
        // CSS Selectors for UnCSS to ignore
        ignore: [
          /.navdrawer-container.open/,
          /.app-bar.open/
        ]
      })))
      // Concatenate and minify styles
      // In case you are still using useref build blocks
      .pipe($.if('*.css', $.csso()))
      .pipe(assets.restore())
      .pipe($.useref())
      // Update production Style Guide paths
      // .pipe($.replace('app/components.css', 'app/main.min.css'))
      // Minify any HTML
      .pipe($.if('*.html', $.minifyHtml()))
      // Output files
      .pipe(gulp.dest(config.distRoot))
      .pipe($.size({title: 'html'}));
  });

// Clean output directory 
  gulp.task('clean', del.bind(null, ['.tmp', 'tmp/*', 'dist/*', '!dist/.git'], {dot: true}));

// Watch files for changes & reload
  gulp.task('serve', ['css'], function () {
    browserSync({
      notify: false,
      // Customize the BrowserSync console logging prefix
      logPrefix: 'WSK',
      // Run as an https by uncommenting 'https: true'
      // Note: this uses an unsigned certificate which on first access
      //       will present a certificate warning in the browser.
      // https: true,
      server: ['.tmp', 'app']
    });

    gulp.watch([appRoot+'/**/*.{html, htm}'], reload);
    // gulp.watch([appRoot+'/css/**/*.{scss,css}'], ['css', reload]);
    gulp.watch([config.styles.files], ['css', reload]);
    gulp.watch([config.scripts.files], ['jshint']);
    gulp.watch([config.images.files], reload);
  });

// Build and serve the output from the dist build
  gulp.task('serve:dist', ['default'], function () {
    browserSync({
      notify: false,
      logPrefix: 'WSK',
      // Run as an https by uncommenting 'https: true'
      // Note: this uses an unsigned certificate which on first access
      //       will present a certificate warning in the browser.
      // https: true,
      server: 'dist'
    });
  });

// Build production files, the default task
  gulp.task('default', ['clean'], function (cb)
  {
    runSequence('css', ['jshint', 'html', 'images', 'fonts', 'copy'], cb);
  });

// Run PageSpeed Insights
  gulp.task('pagespeed', function (cb) {
    // Update the below URL to the public URL of your site
    pagespeed.output('www.kaioandrade.com', {
      strategy: 'mobile',
      // By default we use the PageSpeed Insights free (no API key) tier.
      // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
      // key: 'YOUR_API_KEY'
    }, cb);
  });

// Load custom tasks from the `tasks` directory
// try { require('require-dir')('tasks'); } catch (err) { console.error(err); }
