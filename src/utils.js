/**
 * isNative RegExp taken from Lodash.js by John David Dalton
 * http://lodash.com/
 */
var reNative = RegExp('^' +
  String({}.valueOf)
    .replace(/[.*+?\^${}()|\[\]\\]/g, '\\$&')
    .replace(/valueOf|for [^\]]+/g, '.+?') + '$'
)


/**
 * Trim any leading or trailing whitespace
 */
function trim(s) {
  return s.replace(/^\s+|\s+$/g,'')
}


/**
 * Detects the presence of an item in an array
 */
function inArray(target, items) {
  var item
    , i = 0
  if (!target || !items) return false
  while(item = items[i++]) {
    if (target === item) return true
  }
  return false
}


/**
 * Determine if a method is support natively by the browser
 */
function isNative(fn) {
  return reNative.test(fn)
}

/**
 * Determine if a URL is local to the document origin
 * Inspired form Respond.js
 * https://github.com/scottjehl/Respond/blob/master/respond.src.js#L90-L91
 */
var isLocalURL = (function() {
  var base = document.getElementsByTagName("base")[0]
    , reProtocol = /^([a-zA-Z:]*\/\/)/
  return function(url) {
    var isLocal = (!reProtocol.test(url) && !base)
      || url.replace(RegExp.$1, "").split("/")[0] === location.host
    return isLocal
  }
}())
