JSProjectTemplate
=================

Boilerplate structure for starting a JavaScript project that uses:

 * [Require.js](http://requirejs.org/) for dependency management
 * [Bower](http://bower.io/) for package management
 * [Grunt](http://gruntjs.com/) for task automation
 * [Jasmine](http://jasmine.github.io/) for unit testing
 * [Docco](http://jashkenas.github.io/docco/) for documentation generation

When using tools like [Yeoman](http://yeoman.io/) and Grunt, it is easy to let the tools and dependencies get out of control. This project template is designed to be as simple as possible while supporting essential functionality such as dependency management, unit testing, and documentation generation.

Directory structure:

 * `index.html` the main page of the application
 * `src` contains JavaScript source files as [AMD modules](http://requirejs.org/)
 * `spec` contains [Jasmine](http://jasmine.github.io/) unit tests
 * `SpecRunner.html` is the Jasmine test runner that runs tests in the `spec` directory
 * `lib` contains JavaScript libraries
 * `Gruntfile.js` is the Grunt configuration
   * This is responsible for copying libraries from the `bower_modules` directory to `lib` and generating documentation
   * This approach is a simpler alternative to [grunt-bower-install](https://github.com/stephenplusplus/grunt-bower-install) and [grunt-bower-task](https://github.com/yatskevich/grunt-bower-task) that results in a cleaner `lib` directory (e.g. no subdirectories for single-file libraries).
 * `server.js` is a simple static file server for development use. It is necessary to use a file server because code that uses XMLHttpRequest does not work when using the `file:///` protocol.
 * `package.json` is used by Grunt, and also installs dependencies for `server.js`
 * `LICENSE` The MIT license
 * `README.md` The Markdown file that contains documentation for the project
 * `bower.json` The Bower configuration file
 * `bower_components` the directory where Bower dependencies go
 * `node_modules
 * `.gitignore` causes Git to ignore node modules and Bower components
 * `requireConfig.js` the Require.js configuration file
 * `countLines.sh` a shell script that counts lines of code in source files and unit tests

Sample output from `countLines.sh`:

    Source code files:
       4 ./main.js
       7 ./myModule.js
       11 in total
    Unit tests:
       12 ./MyModuleSpec.js
       12 in total

Development workflow:

 * Start the static file server in the background with the command `node server.js &`
   * If necessary, run `npm install` to install Express, a dependency of `server.js`
 * Navigate to `http://localhost:8000/` to run `index.html`
 * Navigate to `http://localhost:8000/http://localhost:8000/SpecRunner.html` to run unit tests
 * Iterate by editing code, saving code and refreshing the page.
 * Generate documentation by running `grunt` and navigating to `http://localhost:8000/docs/main.html`
 * Run `./countLines.sh` if you are curious about how many lines of code each file contains, not counting comments and empty lines (my preference is to keep files under 100 lines).

Workflow for adding unit tests:

 * Add a test suite to the `spec` directory
 * Update `SpecRunner.html` to include the new suite script
 * Re-run the tests

Workflow for dependency management:

 * Use the bower command line tool directly for installing or updating dependencies
 * Update the Gruntfile to copy the files you want from each dependency into the `lib` directory
