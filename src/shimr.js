var StyleTree = require('./style-tree');


/**
 * The list of plugins to use.
 */
var plugins = [];


// Export the global shimr object.
window.shimr = {

  /**
   * Registers a Shimr plugin for use.
   * @param {Object} plugin The plugin object
   */
  plugin: function(plugin) {
    plugins.push(plugin);
  },

  /**
   * Accepts a CSS object, applies/initializes any registered plugins, and
   * inserts a new <style> tag on the page with the resulting CSS.
   * @param {Object} css A JSON representation of the CSS abstract syntax tree.
   * @param {Object} options (**not currently used**)
   * @return {Object} the `shimr` singleton.
   */
  shim: function(css, options) {
    var styleTag = document.createElement('style');
    var scriptTag = getCurrentScript();

    var styles = new StyleTree(css);
    applyPlugins(styles);

    styleTag.innerHTML = styles.toCSS();
    scriptTag.parentNode.insertBefore(styleTag, scriptTag);
  }
};


/**
 * Invokes each plugin, in order, and returns the transformed AST.
 * @return {Object}
 */
function applyPlugins(styles) {
  for (var i = 0, plugin; plugin = plugins[i]; i++) {
    plugin.transform(styles);
  }
  return styles;
}


/**
 * Returns `document.currentScript` (if available)
 * or gets the last script tag in the document.
 * Note: this only works with synchronous scripts.
 * @return {HTMLElement}
 */
function getCurrentScript() {
  return document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  }());
}
