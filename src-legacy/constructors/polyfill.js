/**
 * The Polyfill constructor
 */
function Polyfill(options) {

  if (!(this instanceof Polyfill)) return new Polyfill(options)

  // set the options
  this._options = options

  // allow the keywords option to be the only object passed
  if (!options.keywords) this._options = { keywords: options }

  this._promise = []

  // then do the stuff
  this._getStylesheets()
  this._downloadStylesheets()
  this._parseStylesheets()
  this._filterCSSByKeywords()
  this._buildMediaQueryMap()
  this._reportInitialMatches()
  this._addMediaListeners()
}


/**
 * Fired when the media change and new rules match
 */
Polyfill.prototype.doMatched = function(fn) {
  this._doMatched = fn
  this._resolve()
  return this
}


/**
 * Fired when the media changes and previously matching rules no longer match
 */
Polyfill.prototype.undoUnmatched = function(fn) {
  this._undoUnmatched = fn
  this._resolve()
  return this
}


/**
 * Get all the rules the match the current media
 */
Polyfill.prototype.getCurrentMatches = function() {
  var i = 0
    , rule
    , media
    , matches = []
  while (rule = this._filteredRules[i++]) {
    // rules are considered matches if they they have
    // no media query or the media query curently matches
    media = rule.media && rule.media.join(" and ")
    if (!media || MediaManager.matchMedia(media).matches) {
      matches.push(rule)
    }
  }
  return new Ruleset(matches)
}


/**
 * Destroy the instance
 * Remove any bound events and send all current
 * matches to the callback as unmatches
 */
Polyfill.prototype.destroy = function() {
  if (this._undoUnmatched) {
    this._undoUnmatched(this.getCurrentMatches())
    EventManager.removeListeners(this)
  }
  return
}


/**
 * Defer a task until after a condition is met
 */
Polyfill.prototype._defer = function(condition, callback) {
  condition.call(this)
    ? callback.call(this)
    : this._promise.push({condition: condition, callback: callback})
}


/**
 * Invoke any functions that have been deferred
 */
Polyfill.prototype._resolve = function() {
  var promise
    , i = 0
  while (promise = this._promise[i]) {
    if (promise.condition.call(this)) {
      this._promise.splice(i, 1)
      promise.callback.call(this)
    } else {
      i++
    }
  }
}


/**
 * Get a list of <link> tags in the head
 * optionally filter by the include/exclude options
 */
Polyfill.prototype._getStylesheets = function() {
  var i = 0
    , id
    , ids
    , link
    , links
    , inline
    , inlines
    , stylesheet
    , stylesheets = []

  if (this._options.include) {
    // get only the included stylesheets link tags
    ids = this._options.include
    while (id = ids[i++]) {
      if (link = document.getElementById(id)) {
        // if this tag is an inline style
        if (link.nodeName === "STYLE") {
          stylesheet = { text: link.textContent }
          stylesheets.push(stylesheet)
          continue
        }
        // ignore print stylesheets
        if (link.media && link.media == "print") continue
        // ignore non-local stylesheets
        if (!isLocalURL(link.href)) continue
        stylesheet = { href: link.href }
        link.media && (stylesheet.media = link.media)
        stylesheets.push(stylesheet)
      }
    }
  }
  else {
    // otherwise get all the stylesheets stylesheets tags
    // except the explicitely exluded ones
    ids = this._options.exclude
    links = document.getElementsByTagName( "link" )
    while (link = links[i++]) {
      if (
        link.rel
        && (link.rel == "stylesheet")
        && (link.media != "print") // ignore print stylesheets
        && (isLocalURL(link.href)) // only request local stylesheets
        && (!inArray(link.id, ids))
      ) {
        stylesheet = { href: link.href }
        link.media && (stylesheet.media = link.media)
        stylesheets.push(stylesheet)
      }
    }
    inlines = document.getElementsByTagName('style');
    i = 0;
    while (inline = inlines[i++]){
      stylesheet = { text: inline.textContent }
      stylesheets.push(stylesheet);
    }
  }
  return this._stylesheets = stylesheets
}


/**
 * Download each stylesheet in the _stylesheetURLs array
 */
Polyfill.prototype._downloadStylesheets = function() {
  var self = this
    , stylesheet
    , urls = []
    , i = 0
  while (stylesheet = this._stylesheets[i++]) {
    urls.push(stylesheet.href)
  }
  DownloadManager.request(urls, function(stylesheets) {
    var stylesheet
      , i = 0
    while (stylesheet = stylesheets[i]) {
      self._stylesheets[i++].text = stylesheet
    }
    self._resolve()
  })
}

Polyfill.prototype._parseStylesheets = function() {
  this._defer(
    function() {
      return this._stylesheets
        && this._stylesheets.length
        && this._stylesheets[0].text },
    function() {
      var i = 0
        , stylesheet
      while (stylesheet = this._stylesheets[i++]) {
        stylesheet.rules = StyleManager.parse(stylesheet.text, stylesheet.url)
      }
    }
  )
}

Polyfill.prototype._filterCSSByKeywords = function() {
  this._defer(
    function() {
      return this._stylesheets
        && this._stylesheets.length
        && this._stylesheets[0].rules
    },
    function() {
      var stylesheet
        , media
        , rules = []
        , i = 0
      while (stylesheet = this._stylesheets[i++]) {
        media = stylesheet.media
        // Treat stylesheets with a media attribute as being contained inside
        // a single @media block, but ignore `all` and `screen` media values
        // since they're basically meaningless in this context
        if (media && media != "all" && media != "screen") {
          rules.push({rules: stylesheet.rules, media: stylesheet.media})
        } else {
          rules = rules.concat(stylesheet.rules)
        }
      }
      this._filteredRules = StyleManager.filter(rules, this._options.keywords)
    }
  )
}

Polyfill.prototype._buildMediaQueryMap = function() {
  this._defer(
    function() { return this._filteredRules },
    function() {
      var i = 0
        , media
        , rule
      this._mediaQueryMap = {}
      while (rule = this._filteredRules[i++]) {
        if (rule.media) {
          media = rule.media.join(" and ")
          this._mediaQueryMap[media] = MediaManager.matchMedia(media)
        }
      }
    }
  )
}

Polyfill.prototype._reportInitialMatches = function() {
  this._defer(
    function() {
      return this._filteredRules && this._doMatched
    },
    function() {
      this._doMatched(this.getCurrentMatches())
    }
  )
}

Polyfill.prototype._addMediaListeners = function() {
  this._defer(
    function() {
      return this._filteredRules
        && this._doMatched
        && this._undoUnmatched
    },
    function() {
      EventManager.addListeners(
        this,
        function(query, isMatch) {
          var i = 0
            , rule
            , matches = []
            , unmatches = []
          while (rule = this._filteredRules[i++]) {
            if (rule.media && rule.media.join(" and ") == query) {
              (isMatch ? matches : unmatches).push(rule)
            }
          }
          matches.length && this._doMatched(new Ruleset(matches))
          unmatches.length && this._undoUnmatched(new Ruleset(unmatches))
        }
      )
    }
  )
}
