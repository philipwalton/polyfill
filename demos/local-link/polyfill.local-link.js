;(function($) {

  var reURL = /^(?:(https?:)\/\/)?((?:[0-9a-z\.\-]+)(?::(?:\d+))?)/

  $.extend($.expr[':'], {
    "local-link": function(el) {
      var url = reURL.exec(el.href)
        , protocol = url[1]
        , host = url[2]
      return protocol == location.protocol && host == location.host
    }
  })

  var localLinkPolyfill = Polyfill({
    include: ["local-link"],
    keywords: {
      selectors:[":local-link"]
    }
  })

  localLinkPolyfill.doMatched(function(rules) {
    rules.each(function(rule) {
      $(rule.getSelectors()).css(rule.getDeclaration())
    })
  })

  localLinkPolyfill.undoUnmatched(function(rules) {
    rules.each(function(rule) {
      $(rule.getSelectors()).removeAttr("style")
    })
    localLinkPolyfill.getCurrentMatches().each(function(rule) {
      $(rule.getSelectors()).css(rule.getDeclaration())
    })
  })

}(jQuery))