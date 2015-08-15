/**
 * Expose the Polyfill object globally
 * also expose the modules and constructors for testing
 */
Polyfill.modules = {
  DownloadManager: DownloadManager,
  StyleManager: StyleManager,
  MediaManager: MediaManager,
  EventManager: EventManager
}
Polyfill.constructors = {
  Ruleset: Ruleset,
  Rule: Rule
}

window.Polyfill = Polyfill

}(window, document));