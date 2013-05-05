/**
 * The Rule constructor
 */
function Rule(rule) {
  this._rule = rule
}

Rule.prototype.getDeclaration = function() {
  var styles = {}
    , i = 0
    , declaration
    , declarations = this._rule.declarations
  while (declaration = declarations[i++]) {
    styles[declaration.property] = declaration.value
  }
  return styles
}

Rule.prototype.getSelectors = function() {
  return this._rule.selectors.join(", ")
}

Rule.prototype.getMedia = function() {
  return this._rule.media.join(" and ")
}
