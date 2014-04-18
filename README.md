The Universal Data Cube
=======================

Development workflow:

 * Start the static file server in the background with the command `node server.js &`
   * If necessary, run `npm install` to install Express, a dependency of `server.js`
 * Navigate to `http://localhost:8000/SpecRunner.html` to run unit tests
 * Iterate by editing code, saving code and refreshing the page
 * Generate documentation by running `grunt` and navigating to `http://localhost:8000/docs/udc.html`
 * Run `./countLines.sh` to count lines of code

This project uses:

 * [Require.js](http://requirejs.org/) for dependency management
 * [Bower](http://bower.io/) for package management
 * [Grunt](http://gruntjs.com/) for task automation
 * [Jasmine](http://jasmine.github.io/) for unit testing
 * [Docco](http://jashkenas.github.io/docco/) for documentation generation

