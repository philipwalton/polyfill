module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON("package.json"),
    banner: "/*!\n"
      + " * <%= pkg.title %> - v<%= pkg.version %>\n"
      + " *\n"
      + " * Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %> <<%= pkg.author.url %>>\n"
      + " * Released under the <%= pkg.license %> license\n"
      + " *\n"
      + " * Date: <%= grunt.template.today('yyyy-mm-dd') %>\n"
      + " */\n",
    // Task configuration.
    concat: {
      options: {
        banner: "<%= banner %>",
        stripBanners: true
      },
      dist: {
        src: [
          "src/intro.js",
          "src/utils.js",
          "src/supports.js",
          "src/modules/download-manager.js",
          "src/modules/styles-manager.js",
          "src/modules/media-manager.js",
          "src/modules/event-manager.js",
          "src/constructors/ruleset.js",
          "src/constructors/rule.js",
          "src/constructors/polyfill.js",
          "src/outro.js"
        ],
        dest: "dist/<%= pkg.name %>.js"
      }
    },
    compass: {
      dist: {
        options: {
          sassDir: '_sass',
          cssDir: 'css'
        }
      }
    },
    uglify: {
      options: {
        banner: "<%= banner %>"
      },
      dist: {
        src: "<%= concat.dist.dest %>",
        dest: "dist/<%= pkg.name %>.min.js"
      }
    },
    jshint: {
      options: grunt.file.readJSON(".jshintrc"),
      dist: {
        src: "<%= concat.dist.dest %>"
      }
    },
    watch: {
      css: {
        files: "_sass/**/*",
        tasks: ["compass"],
      },
      scripts: {
        files: ["Gruntfile.js", "src/**/*.js"],
        tasks: ["concat", "jshint"],
      },
      gruntfile: {
        files: ["Gruntfile.js"],
        tasks: ["default"],
      }
    },
    shell: {
      "gh-pages": {
        command: [
          "git checkout gh-pages",
          "git rebase master",
          "git push origin gh-pages",
          "git checkout master"
        ].join(" && ")
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-compass");
  grunt.loadNpmTasks('grunt-shell');

  // Default task.
  grunt.registerTask("default", ["compass", "concat", "jshint", "uglify"]);

  // Push gh-pages branch to Github Pages
  grunt.registerTask("gh-pages", ["shell:gh-pages"]);

};
