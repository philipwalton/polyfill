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
