function Node(styles) {

  // Stores the original styles object as a backup.
  this.source = styles;

  // Copies all properties except the child nodes.
  for (var key in styles) {
    if (styles.hasOwnProperty(key) && key != 'nodes') {
      this[key] = styles[key];
    }
  }

  // Converts plain child node objects into Node instances.
  if (styles.nodes) {
    this.nodes = [];
    for (var i = 0, child, node; child = styles.nodes[i]; i++) {
      node = new Node(child);
      node.parent = this;

      this.nodes.push(node);
    }
  }
}

Node.prototype.eachAtRule = function(callback) {
  walkNodes(this, 'atrule', callback);
}

Node.prototype.eachRule = function(callback) {
  walkNodes(this, 'rule', callback);
}

Node.prototype.eachDeclaration = function(callback) {
  walkNodes(this, 'decl', callback);
}

Node.prototype.toCSS = function() {
  return stringify(this);
  // return stringify(this.styles);
}


/**
 * Returns the media query this rule must match to apply or `null` if the rule
 * is not nested inside a media query.
 * @return {string|null}
 */
Node.prototype.getMedia = function() {
  if (this.type == 'rule' &&
      this.parent &&
      this.parent.type == 'atrule' &&
      this.parent.name == 'media') {

    return this.parent.params;
  }
  return null;
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

module.exports = Node;
