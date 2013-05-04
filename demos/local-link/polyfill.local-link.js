;(function($) {

  var reURL = /^(?:(https?:)\/\/)?((?:[0-9a-z\.\-]+)(?::(?:\d+))?)/

  $.extend($.expr[':'], {
    "local-link": function(el) {
      var url = el.href.match(reURL)
        , protocol = url[1]
        , host = url[2]
      return protocol == location.protocol && host == location.host
    }
  })

  Polyfill({selectors:[":local-link"]})
    .doMatched(function(rules) {
      rules.each(function(rule) {
        $(rule.getSelectors()).css(rule.getDeclaration())
      })
    })
    .undoUnmatched(function(rules) {
      rules.each(function(rule) {
        $(rule.getSelectors()).removeAttr("style")
      })
    })

}(jQuery))