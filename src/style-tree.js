function StyleTree(styles) {
  this.styles = styles;
}

StyleTree.prototype.eachAtRule = function(callback) {
  walkNodes(this.styles, 'atrule', callback);
}

StyleTree.prototype.eachRule = function(callback) {
  walkNodes(this.styles, 'rule', callback);
}

StyleTree.prototype.eachDeclaration = function(callback) {
  walkNodes(this.styles, 'decl', callback);
}

StyleTree.prototype.toCSS = function() {
  return stringify(this.styles);
}


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
  if (node.nodes) str += node.nodes.map(stringify).join('');

  // Stringify post-child nodes.
  if (node.type == 'atrule' || node.type == 'rule') str += '}';

  return str;
}


function walkNodes(node, type, callback) {
  if (!node.nodes) return;

  for (var i = 0, child; child = node.nodes[i]; i++) {
    if (child.type == type) {
      callback(child);
    }
    else {
      walkNodes(child, type, callback);
    }
  }
}

module.exports = StyleTree;
