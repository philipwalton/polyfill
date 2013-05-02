;(function($) {

  Polyfill({declarations:["position:*stickier"]}).then(function(matched, unmatched) {

    matched.each(function(rule) {

      var $el = $(rule.getSelectors())
        , offset = $el.offset().top
        , top = rule.getDeclaration().top
        , $clone


      function onScroll(e) {

        if ($(window).scrollTop() >= offset) {
          if (!$clone) {
            $clone = $el.clone().css({position: "fixed", top: top}).appendTo("body")
            $el.css("visiblity", "hidden")
          }
        } else {
          $clone && $clone.remove()
          $clone = null
          $el.removeAttr("style")
        }
      }

      onScroll()
      $(window).on("scroll", onScroll);


    })

  })

}(jQuery))
