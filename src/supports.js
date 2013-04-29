/**
 * Feature detections
 */
var supports = {
  // true with either native support or a polyfil, we don't care which
  matchMedia: window.matchMedia && window.matchMedia( "only all" ).matches,
  // true only if the browser supports window.matchMeida natively
  nativeMatchMedia: isNative(window.matchMedia)
}
