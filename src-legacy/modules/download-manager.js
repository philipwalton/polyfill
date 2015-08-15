/**
 * Consumes an array of URLs and returns an array of strings
 * containing the text of those URLs
 *
 * Dependencies: inArray
 */
var DownloadManager = (function() {

  var cache = {}
    , queue = []
    , callbacks = []
    , requestCount = 0
    , xhr = (function() {
        var method
        try { method = new window.XMLHttpRequest() }
        catch (e) { method = new window.ActiveXObject( "Microsoft.XMLHTTP" ) }
        return method
      }())

  // return function(urls, callback) {

  function addURLsToQueue(urls) {
    var url
      , i = 0
    while (url = urls[i++]) {
      if (!cache[url] && !inArray(url, queue)) {
        queue.push(url)
      }
    }
  }

  function processQueue() {
    // don't process the next one if we're in the middle of a download
    if (!(xhr.readyState === 0 || xhr.readyState === 4)) return

    var url
    if (url = queue[0]) {
      downloadStylesheet(url)
    }
    if (!url) {
      invokeCallbacks()
    }
  }

  /**
   * Make the requests
   *
   * TODO: Get simultaneous downloads working, it can't be that hard
  */
  function downloadStylesheet(url) {
    requestCount++
    xhr.open("GET", url, true)
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
        cache[url] = xhr.responseText
        queue.shift()
        processQueue()
      }
    }
    xhr.send(null)
  }

  /**
   * Check the cache to make sure all requests are complete
   */
  function downloadsFinished(urls) {
    var url
      , i = 0
      , len = 0
    while (url = urls[i++]) {
      if (cache[url]) len++
    }
    return (len === urls.length)
  }

  /**
   * Invoke each callback and remove it from the list
   */
  function invokeCallbacks() {
    var callback
    while (callback = callbacks.shift()) {
      invokeCallback(callback.urls, callback.fn)
    }
  }

  /**
   * Put the stylesheets in the proper order and invoke the callback
   */
  function invokeCallback(urls, callback) {
    var stylesheets = []
      , url
      , i = 0
    while (url = urls[i++]) {
      stylesheets.push(cache[url])
    }
    callback.call(null, stylesheets)
  }

  return {
    request: function(urls, callback) {
      // Add the callback to the list
      callbacks.push({urls: urls, fn: callback})

      if (downloadsFinished(urls)) {
        invokeCallbacks()
      } else {
        addURLsToQueue(urls)
        processQueue()
      }
    },
    clearCache: function() {
      cache = {}
    },
    _getRequestCount: function() {
      return requestCount
    }
  }

}())
