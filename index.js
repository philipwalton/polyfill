var babelify = require('babelify');
var browserify = require('browserify');
var fs = require('fs');
var path = require('path');
var postcss = require('postcss');
var stream = require('stream');
var through = require('through2');
var UglifyJS = require('uglify-js');


/**
 * Accepts a readable stream of a CSS file and a configuration object and
 * transforms the stream into a shimrified JS file.
 * @param {Object} options Configuration options, merged with the defaults.
 * @returns {Stream} A writeable stream.
 */
module.exports = function(source, options) {
  var files = [
    fs.createReadStream(path.resolve(__dirname, 'src/shimr.js')),
    source.pipe(shimrify())
  ];
  return browserify(files)
      .transform(babelify)
      .bundle()
      .pipe(uglify())
}


/**
 * Creates a duplex stream that transforms a CSS file into a JavaScript file
 * that wraps the CSS AST in the shimr `addSource` API method.
 * @return {Stream}
 */
function shimrify() {
  var buffer;
  return through(
    function(chunk, enc, cb) {
      buffer = !buffer ? chunk : Buffer.concat([buffer, chunk]);
      cb()
    },
    function(cb) {
      var json = postcss.parse(buffer).toJSON();
      var AST = JSON.stringify(removeUnusedNodeProperties(json), null, 2);
      var code = 'window.shimr.addSource(' + AST + ')';
      this.push(new Buffer(code));
      cb();
    }
  )
}


/**
 * Transforms a stream using UglifyJS
 * @return {Stream}
 */
function uglify() {
  var buffer;
  return through(
    function(chunk, enc, cb) {
      buffer = !buffer ? chunk : Buffer.concat([buffer, chunk]);
      cb()
    },
    function(cb) {
      var code = UglifyJS.minify(buffer.toString(), {fromString: true}).code;
      this.push(new Buffer(code));
      cb();
    }
  )
}


/**
 * Accepts a PostCSS node and copies it, removing (recursively) the properties
 * that are not needed for stringifying to CSS.
 * @param {Object} node A PostCSS node object.
 * @return {Object} The copied objects, sans unneeded properties.
 */
function removeUnusedNodeProperties(node) {
  // Ignore comment nodes.
  if (node.type == 'comment') return;

  var typePropertyMap = {
    root: ['type'],
    atrule: ['type', 'name', 'params'],
    rule: ['type', 'selector'],
    decl: ['type', 'prop', 'value', 'important']
  };

  var copy = {};
  for (var prop of Object.keys(node)) {
    if (typePropertyMap[node.type].indexOf(prop) > -1) {
      copy[prop] = node[prop];
    }
  }
  if (node.nodes) {
    copy.nodes = [];
    for (var i = 0; i < node.nodes.length; i++) {
      var result = removeUnusedNodeProperties(node.nodes[i]);
      if (result) copy.nodes.push(result);
    }
  }

  return copy;
}
