var StyleManager = {

  _cache: {},

  clearCache: function() {
    StyleManager._cache = {}
  },

  /**
   * Parse a string of CSS
   * optionaly pass an identifier for caching
   *
   * Adopted from TJ Holowaychuk's
   * https://github.com/visionmedia/css-parse
   *
   * Minor changes include removing the "stylesheet" root and
   * using String.charAt(i) instead of String[i] for IE7 compatibility
   */
  parse: function(css, identifier) {

    /**
     * Opening brace.
     */
    function open() {
      return match(/^\{\s*/)
    }

    /**
     * Closing brace.
     */
    function close() {
      return match(/^\}\s*/)
    }

    /**
     * Parse ruleset.
     */
    function rules() {
      var node
      var rules = []
      whitespace()
      comments(rules)
      while (css.charAt(0) != '}' && (node = atrule() || rule())) {
        rules.push(node)
        comments(rules)
      }
      return rules
    }

    /**
     * Match `re` and return captures.
     */
    function match(re) {
      var m = re.exec(css)
      if (!m) return
      css = css.slice(m[0].length)
      return m
    }

    /**
     * Parse whitespace.
     */
    function whitespace() {
      match(/^\s*/)
    }

    /**
     * Parse comments
     */
    function comments(rules) {
      rules = rules || []
      var c
      while (c = comment()) rules.push(c)
      return rules
    }

    /**
     * Parse comment.
     */
    function comment() {
      if ('/' == css[0] && '*' == css[1]) {
        var i = 2
        while ('*' != css[i] || '/' != css[i + 1]) ++i
        i += 2
        var comment = css.slice(2, i - 2)
        css = css.slice(i)
        whitespace()
        return { comment: comment }
      }
    }

    /**
     * Parse selector.
     */
    function selector() {
      var m = match(/^([^{]+)/)
      if (!m) return
      return trim(m[0]).split(/\s*,\s*/)
    }

    /**
     * Parse declaration.
     */
    function declaration() {
      // prop
      var prop = match(/^(\*?[\-\w]+)\s*/)
      if (!prop) return
      prop = prop[0]

      // :
      if (!match(/^:\s*/)) return

      // val
      var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)\s*/)
      if (!val) return
      val = trim(val[0])

      //
      match(/^[;\s]*/)

      return { property: prop, value: val }
    }

    /**
     * Parse keyframe.
     */
    function keyframe() {
      var m
      var vals = []

      while (m = match(/^(from|to|\d+%|\.\d+%|\d+\.\d+%)\s*/)) {
        vals.push(m[1])
        match(/^,\s*/)
      }

      if (!vals.length) return

      return {
        values: vals,
        declarations: declarations()
      }
    }

    /**
     * Parse keyframes.
     */
    function keyframes() {
      var m = match(/^@([\-\w]+)?keyframes */)
      if (!m) return
      var vendor = m[1]

      // identifier
      var m = match(/^([\-\w]+)\s*/)
      if (!m) return
      var name = m[1]

      if (!open()) return
      comments()

      var frame
      var frames = []
      while (frame = keyframe()) {
        frames.push(frame)
        comments()
      }

      if (!close()) return

      var obj = {
        name: name,
        keyframes: frames
      }
      // don't include vendor unles there's a match
      if (vendor) obj.vendor = vendor

      return obj
    }

    /**
     * Parse supports.
     */
    function supports() {
      var m = match(/^@supports *([^{]+)/)
      if (!m) return
      var supports = trim(m[1])

      if (!open()) return
      comments()

      var style = rules()

      if (!close()) return

      return { supports: supports, rules: style }
    }

    /**
     * Parse media.
     */
    function media() {
      var m = match(/^@media *([^{]+)/)
      if (!m) return

      var media = trim(m[1])

      if (!open()) return
      comments()

      var style = rules()

      if (!close()) return

      return { media: media, rules: style }
    }


    /**
     * Parse paged media.
     */
    function atpage() {
      var m = match(/^@page */)
      if (!m) return

      var sel = selector() || []
      var decls = []

      if (!open()) return
      comments()

      // declarations
      var decl
      while (decl = declaration() || atmargin()) {
        decls.push(decl)
        comments()
      }

      if (!close()) return

      return {
        type: "page",
        selectors: sel,
        declarations: decls
      }
    }

    /**
     * Parse margin at-rules
     */
    function atmargin() {
      var m = match(/^@([a-z\-]+) */)
      if (!m) return
      var type = m[1]

      return {
        type: type,
        declarations: declarations()
      }
    }

    /**
     * Parse import
     */
    function atimport() {
      return _atrule('import')
    }

    /**
     * Parse charset
     */
    function atcharset() {
      return _atrule('charset')
    }

    /**
     * Parse namespace
     */
    function atnamespace() {
      return _atrule('namespace')
    }

    /**
     * Parse non-block at-rules
     */
    function _atrule(name) {
      var m = match(new RegExp('^@' + name + ' *([^;\\n]+);\\s*'))
      if (!m) return
      var ret = {}
      ret[name] = trim(m[1])
      return ret
    }

    /**
     * Parse declarations.
     */
    function declarations() {
      var decls = []

      if (!open()) return
      comments()

      // declarations
      var decl
      while (decl = declaration()) {
        decls.push(decl)
        comments()
      }

      if (!close()) return
      return decls
    }

    /**
     * Parse at rule.
     */
    function atrule() {
      return keyframes()
        || media()
        || supports()
        || atimport()
        || atcharset()
        || atnamespace()
        || atpage()
    }

    /**
     * Parse rule.
     */
    function rule() {
      var sel = selector()
      if (!sel) return
      comments()
      return { selectors: sel, declarations: declarations() }
    }

    /**
     * Check the cache first, otherwise parse the CSS
     */
    if (identifier && StyleManager._cache[identifier]) {
      return StyleManager._cache[identifier]
    } else {
      // strip comments before parsing
      css = css.replace(/\/\*[\s\S]*?\*\//g, "")
      return StyleManager._cache[identifier] = rules()
    }

  },

  /**
   * Filter a ruleset by the passed keywords
   * Keywords may be either selector or property/value patterns
   */
  filter: function(rules, keywords) {

    var filteredRules = []

    /**
     * Concat a2 onto a1 even if a1 is undefined
     */
    function safeConcat(a1, a2) {
      if (!a1 && !a2) return
      if (!a1) return [a2]
      return a1.concat(a2)
    }

    /**
     * Add a rule to the filtered ruleset,
     * but don't add empty media or supports values
     */
    function addRule(rule) {
      if (rule.media == null) delete rule.media
      if (rule.supports == null) delete rule.supports
      filteredRules.push(rule)
    }

    function containsKeyword(string, keywordList) {
      if (!keywordList) return
      var i = keywordList.length
      while (i--) {
        if (string.indexOf(keywordList[i]) >= 0) return true
      }
    }

    function matchesKeywordPattern(declaration, patternList) {
      var wildcard = /\*/
        , pattern
        , parts
        , reProp
        , reValue
        , i = 0
      while (pattern = patternList[i++]) {
        parts = pattern.split(":")
        reProp = new RegExp("^" + trim(parts[0]).replace(wildcard, ".*") + "$")
        reValue = new RegExp("^" + trim(parts[1]).replace(wildcard, ".*") + "$")
        if (reProp.test(declaration.property) && reValue.test(declaration.value)) {
          return true
        }
      }
    }

    function matchSelectors(rule, media, supports) {
      if (!keywords.selectors) return

      if (containsKeyword(rule.selectors.join(","), keywords.selectors)) {
        addRule({
          media: media,
          supports: supports,
          selectors: rule.selectors,
          declarations: rule.declarations
        })
        return true
      }
    }

    function matchesDeclaration(rule, media, supports) {
      if (!keywords.declarations) return
      var declaration
        , i = 0
      while (declaration = rule.declarations[i++]) {
        if (matchesKeywordPattern(declaration, keywords.declarations)) {
          addRule({
            media: media,
            supports: supports,
            selectors: rule.selectors,
            declarations: rule.declarations
          })
          return true
        }
      }
    }

    function filterRules(rules, media, supports) {
      var rule
        , i = 0
      while (rule = rules[i++]) {
        if (rule.declarations) {
          matchSelectors(rule, media, supports) || matchesDeclaration(rule, media, supports)
        }
        else if (rule.rules && rule.media) {
          filterRules(rule.rules, safeConcat(media, rule.media), supports)
        }
        else if (rule.rules && rule.supports) {
          filterRules(rule.rules, media, safeConcat(supports, rule.supports))
        }
      }

    }

    // start the filtering
    filterRules(rules)

    // return the results
    return filteredRules

  }
}