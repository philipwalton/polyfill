/**
 * The Ruleset constructor
 */
function Ruleset(rules) {
  var i = 0
    , rule
  this._rules = []
  while (rule = rules[i++]) {
    this._rules.push(new Rule(rule))
  }
}

Ruleset.prototype.each = function(iterator, context) {
  var rule
    , i = 0
  context || (context = this)
  while (rule = this._rules[i++]) {
    iterator.call(context, rule)
  }
}

Ruleset.prototype.size = function() {
  return this._rules.length
}

Ruleset.prototype.at = function(index) {
  return this._rules[index]
}
