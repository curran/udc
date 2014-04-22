// The Grunt configuration file.
//
// Curran Kelleher 4/21/2014
module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js', 'spec/**/*.js']
    },
    uglify: {
      dist: {
        files: {'dist/udc.min.js': ['dist/udc.js']}
      }
    },
    umd: {
      all: {
        src: 'src/udc.js',
        dest: 'dist/udc.js',
        objectToExport: 'UDC'
      }
    },
    docco: {
      debug: {
        src: ['src/**/*.js', 'spec/**/*.js'],
        options: {
          output: 'docs/'
        }
      }
    },
    jasmine: {
      all: {
        options: {
          specs: 'spec/*Spec.js',
          vendor: ['lib/requirejs/require.js', 'requireConfig.js'],
          globalAlias: 'udc'
        }
      }
    }
  });

  grunt.registerTask('build', ['jshint', 'umd', 'uglify']);
  grunt.registerTask('default', ['build', 'jasmine', 'docco']);
};
