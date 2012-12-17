module.exports = function(grunt) {
  grunt.initConfig({
    coffee: {
      compile: {
        files: {
          "js/script.js": "js/script.coffee"
        }
      }
    },
    semper: {
      compile: {
        files: {
          "index.html": "index.semper"
        }
      }
    },
    stylus: {
      compile: {
        options: {
          compress: true,
          paths: ['node_modules']
        },
        files: {
          'css/screen.css': 'css/screen.styl'
        }
      }
    },
    min: {
      bootstrap: {
        src: 'js/bootstrap.js',
        dest: 'assets/temp/bootstrap.js'
      },
      script: {
        src: 'js/script.js',
        dest: 'assets/temp/script.js'
      },
      tab: {
        src: 'js/taboverride.js',
        dest: 'assets/temp/taboverride.js'
      }
    },
    concat: {
      dist: {
        src: ['js/semper.js', 'assets/temp/*.js'],
        dest: 'assets/global.min.js'
      }
    },
    mincss: {
      compress: {
        files: {
          "assets/global.min.css": ["css/bootstrap.css", "css/screen.css"]
        }
      }
    },
    server: {},
    watch: {
      files: ['js/server.coffee', 'css/*', 'index.semper'],
      tasks: 'compile'
    }
  });

  grunt.loadNpmTasks('grunt-contrib');

  grunt.registerTask('default', 'compile server watch');
  grunt.registerTask('compile', 'coffee semper stylus min mincss concat');
};
