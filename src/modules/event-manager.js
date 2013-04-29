var EventManager = (function() {

  var MediaListener = (function() {
    var listeners = []
    return {
      add: function(polyfill, mql, fn) {
        var listener
          , i = 0
        // if the listener is already in the array, return false
        while (listener = listeners[i++]) {
          if (
            listener.polyfill == polyfill
            && listener.mql === mql
            && listener.fn === fn
          ) {
            return false
          }
        }
        // otherwise add it
        mql.addListener(fn)
        listeners.push({
          polyfill: polyfill,
          mql: mql,
          fn: fn
        })
      },
      remove: function(polyfill) {
        var listener
          , i = 0
        while (listener = listeners[i++]) {
          if (listener.polyfill === polyfill) {
            listener.mql.removeListener(listener.fn)
            listeners.splice(--i, 1)
          }
        }
      }
    }
  }())

  var ResizeListener = (function(listeners) {
    function onresize() {
      var listener
        , i = 0
      while (listener = listeners[i++]) {
        listener.fn()
      }
    }
    return {
      add: function(polyfill, fn) {
        if (!listeners.length) {
          if (window.addEventListener) {
            window.addEventListener("resize", onresize, false)
          } else {
            window.attachEvent("onresize", onresize)
          }
        }
        listeners.push({
          polyfill: polyfill,
          fn: fn
        })

      },
      remove: function(polyfill) {
        var listener
          , i = 0
        while (listener = listeners[i++]) {
          if (listener.polyfill === polyfill) {
            listeners.splice(--i, 1)
          }
        }
        if (!listeners.length) {
          if (window.removeEventListener) {
            window.removeEventListener("resize", onresize, false)
          } else if (window.detachEvent) {
            window.detachEvent("onresize", onresize)
          }
        }
      }
    }
  }([]))


  /**
   * Simple debounce function
   */
  function debounce(fn, wait) {
    var timeout
    return function() {
      clearTimeout(timeout)
      timeout = setTimeout(fn, wait)
    }
  }

  return {

    removeListeners: function(polyfill) {
      supports.nativeMatchMedia
        ? MediaListener.remove(polyfill)
        : ResizeListener.remove(polyfill)
    },

    addListeners: function(polyfill, callback) {

      var queries = polyfill._mediaQueryMap
        , state = {}


      /**
       * Set up initial state
       */
      ;(function() {
        for (var query in queries) {
          if (!queries.hasOwnProperty(query)) continue
          state[query] = MediaManager.matchMedia(query).matches
        }
      }())

      /**
       * Register the listeners to detect media query changes
       * if the browser doesn't support this natively, use resize events instead
       */
      function addListeners() {

        if (supports.nativeMatchMedia) {
          for (var query in queries) {
            if (queries.hasOwnProperty(query)) {
              // a closure is needed here to keep the variable reference
              (function(mql, query) {
                MediaListener.add(polyfill, mql, function() {
                  callback.call(polyfill, query, mql.matches)
                })
              }(queries[query], query))
            }
          }
        } else {

          var fn = debounce((function(polyfill, queries) {
            return function() {
              updateMatchedMedia(polyfill, queries)
            }
          }(polyfill, queries)), polyfill._options.debounceTimeout || 100)

          ResizeListener.add(polyfill, fn)

        }
      }

      /**
       * Check each media query to see if it still matches
       * Note: this is only invoked when the browser doesn't
       * natively support window.matchMedia addListeners
       */
      function updateMatchedMedia(polyfill, queries) {
        var query
          , current = {}

        // clear the cache since a resize just happened
        MediaManager.clearCache()

        // look for media matches that have changed since the last inspection
        for (query in queries) {
          if (!queries.hasOwnProperty(query)) continue
          current[query] = MediaManager.matchMedia(query).matches
          if (current[query] != state[query]) {
            callback.call(polyfill, query, MediaManager.matchMedia(query).matches)
          }
        }
        state = current
      }

      addListeners()

    }

  }

}())
