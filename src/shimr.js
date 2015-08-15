/**
 * @fileoverview
 * This file defines the base shimr object and is responsible for converting
 * the included style AST into CSS and adding it to the DOM.
 * Note, the `AST` variable referenced in this file gets added at build time.
 */


/* global AST */


/**
 * References `document.currentScript` (if available)
 * or gets the last script tag in the document.
 * Note: this only works with synchronous scripts.
 */
var currentScript = document.currentScript || (function() {
  var scripts = document.getElementsByTagName('script');
  return scripts[scripts.length - 1];
}());


/**
 * Converts a shimr AST node into CSS.
 * @param node A shimr AST node.
 * @return string The CSS content.
 */
function stringify(node) {
  var str = '';

  // Stringify pre-child nodes.
  if (node.type == 'atrule') {
    str += '@' + node.name + ' ' + node.params + '{';
  }
  else if (node.type == 'rule') {
    str += node.selector + '{';
  }
  else if (node.type == 'decl') {
    str += node.prop + ':' + node.value +
        (node.important ? '!important' : '') + ';';
  }

  // Stringify child nodes.
  if (node.nodes) {
    str += node.nodes.map(stringify).join('');
  }

  // Stringify post-child nodes.
  if (node.type == 'atrule' || node.type == 'rule') {
    str += '}';
  }

  return str;
}


// Creates a style node and interts it into the DOM
// immediately before the current shimr script.
var style = document.createElement('style');
style.innerHTML = stringify(AST);
currentScript.parentNode.insertBefore(style, currentScript);


// Exposes the global object.
window.shimr = {
  AST: AST,
  stringify: stringify
};
