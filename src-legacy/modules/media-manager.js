var MediaManager = (function() {

  var reMinWidth = /\(min\-width:[\s]*([\s]*[0-9\.]+)(px|em)[\s]*\)/
    , reMaxWidth = /\(max\-width:[\s]*([\s]*[0-9\.]+)(px|em)[\s]*\)/

    // a cache of the active media query info
    , mediaQueryMap = {}

    // the value of an `em` as used in a media query,
    // not necessarily the base font-size
    , emValueInPixels
    , currentWidth

  /**
   * Get the pixel value of 1em for use in parsing media queries
   * ems in media queries are not affected by CSS, instead they
   * are the value of the browsers default font size, usually 16px
   */
  function getEmValueInPixels() {

    // cache this value because it probably won't change and
    // it's expensive to lookup
    if (emValueInPixels) return emValueInPixels

    var html = document.documentElement
      , body = document.body
      , originalHTMLFontSize = html.style.fontSize
      , originalBodyFontSize = body.style.fontSize
      , div = document.createElement("div")

    // 1em is the value of the default font size of the browser
    // reset html and body to ensure the correct value is returned
    html.style.fontSize = "1em"
    body.style.fontSize = "1em"

    // add a test element and measure it
    body.appendChild(div)
    div.style.width = "1em"
    div.style.position = "absolute"
    emValueInPixels = div.offsetWidth

    // remove the test element and restore the previous values
    body.removeChild(div)
    body.style.fontSize = originalBodyFontSize
    html.style.fontSize = originalHTMLFontSize

    return emValueInPixels
  }

  /**
   * Use the browsers matchMedia function or existing shim
   */
  function matchMediaNatively(query) {
    return window.matchMedia(query)
  }

  /**
   * Try to determine if a mediaQuery matches by
   * parsing the query and figuring it out manually
   * TODO: cache current width for repeated invocations
   */
  function matchMediaManually(query) {
    var minWidth
      , maxWidth
      , matches = false

    // recalculate the width if it's not set
    // if (!currentWidth) currentWidth = document.documentElement.clientWidth
    currentWidth = document.documentElement.clientWidth

    // parse min and max widths from query
    if (reMinWidth.test(query)) {
      minWidth = RegExp.$2 === "em"
        ? parseFloat(RegExp.$1) * getEmValueInPixels()
        : parseFloat(RegExp.$1)
    }
    if (reMaxWidth.test(query)) {
      maxWidth = RegExp.$2 === "em"
        ? parseFloat(RegExp.$1) * getEmValueInPixels()
        : parseFloat(RegExp.$1)
    }

    // if both minWith and maxWidth are set
    if (minWidth && maxWidth) {
      matches = (minWidth <= currentWidth && maxWidth >= currentWidth)
    } else {
      if (minWidth && minWidth <= currentWidth) matches = true
      if (maxWidth && maxWidth >= currentWidth) matches = true
    }

    // return fake MediaQueryList object
    return {
      matches: matches,
      media: query
    }
  }


  return {
    /**
     * Similar to the window.matchMedia method
     * results are cached to avoid expensive relookups
     * @returns MediaQueryList (or a faked one)
     */
    matchMedia: function(query) {
      return supports.matchMedia
          ? matchMediaNatively(query)
          : matchMediaManually(query)
      // return mediaQueryMap[query] || (
      //   mediaQueryMap[query] = supports.matchMedia
      //     ? matchMediaNatively(query)
      //     : matchMediaManually(query)
      // )
    },

    clearCache: function() {
      // we don't use cache when the browser supports matchMedia listeners
      if (!supports.nativeMatchMedia) {
        currentWidth = null
        mediaQueryMap = {}
      }
    }
  }

}())
