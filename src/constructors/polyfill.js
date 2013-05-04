/**
 * The Polyfill constructor
 */
function Polyfill(keywords, options, callback) {

  if (!(this instanceof Polyfill)) return new Polyfill(keywords, options, callback)

  // set the options
  this._keywords = keywords
  this._options = options || {}
  this._promise = []

  // then do the stuff
  this._getStylesheetURLs()
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
Polyfill.prototype._getStylesheetURLs = function() {
  var i = 0
    , id
    , ids
    , link
    , links = []
    , allLinks
  if (this._options.include) {
    // get only the included stylesheets link tags
    ids = this._options.include
    while (id = ids[i++]) {
      if (link = document.getElementById(id)) links.push(link.href)
    }
    return this._stylesheetURLs = links
  }
  else {
    // otherwise get all the stylesheets links tags
    // except the explicitely exluded ones
    ids = this._options.exclude
    allLinks = document.getElementsByTagName( "link" )
    while (link = allLinks[i++]) {
      if (
        link.rel
        && (link.rel.toLowerCase() === "stylesheet")
        && (!inArray(link.id, ids))
      ) {
        links.push(link.href)
      }
    }
    return this._stylesheetURLs = links
  }
}


/**
 * Download each stylesheet in the _stylesheetURLs array
 */
Polyfill.prototype._downloadStylesheets = function() {
  var self = this
  DownloadManager.request(this._stylesheetURLs, function(stylesheets) {
    self._stylesheets = stylesheets
    self._resolve()
  })
}

Polyfill.prototype._parseStylesheets = function() {
  this._defer(
    function() { return this._stylesheets },
    function() {
      var i = 0
        , stylesheet
      while (stylesheet = this._stylesheets[i++]) {
        this._parsedCSS = (this._parsedCSS || []).concat(StyleManager.parse(stylesheet.css, stylesheet.url))
      }
    }
  )
}

Polyfill.prototype._filterCSSByKeywords = function() {
  this._defer(
    function() { return this._parsedCSS },
    function() {
      this._filteredRules = StyleManager.filter( this._parsedCSS, this._keywords )
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
