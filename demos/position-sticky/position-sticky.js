;(function($) {

  /**
   * Feature detect position sticky, if it exists then do nothing
   */
  if ((function(d) {
    d.style.position = "sticky"
    // this will return false if the browser doesn't recognize
    // "sticky" as a valid position value
    return d.style.position === "sticky"
  }(document.createElement("div")))) return


  console.log("Creating Polyfill")


  // a unique id used to safely remove event callbacks
  var uniqueID = 0

  /**
   * Scroll event callback
   * Based on the scroll position toggle the element between
   * position:fixed and its default position value
   */
  function onscroll($el) {
    var data = $el.data("position:sticky")
    if ($(window).scrollTop() >= data.offsetTop - data.top) {
      if (!data.$clone) {
        data.$clone = $el.clone().css({position: "fixed", top: data.top}).appendTo("body")
        $el.css("visibility", "hidden")
        onresize($el)
      }
    }
    else {
      if (data.$clone) {
        data.$clone.remove()
        data.$clone = null
        $el.css("visibility", "visible")
      }
    }
  }

  /**
   * Resize event callback
   * Recalculate the dimensions of the hidden element as
   * it may have changed. If it has, update the clone
   */
  function onresize($el) {
    var data = $el.data("position:sticky")
      , offset
    // Make sure no operations that require a repaint are
    // done unless a cloned element exists
    if (data && data.$clone) {
      offset = $el.offset()
      data.offsetTop = offset.top
      data.$clone.css({left: offset.left, width: $el.width()})
    }
  }


  Polyfill({declarations:["position:sticky"]}).then(function(matched, unmatched) {

    matched.each(function(rule) {
      var $elements = $(rule.getSelectors())
        , declaration = rule.getDeclaration()
      $elements.each(function() {
        var $this = $(this)
          , data = $this.data("position:sticky")
        if (!data) {
          data = {
            id: ++uniqueID,
            offsetTop: $this.offset().top,
            top: parseInt(declaration.top, 10)
          }
          $this.data("position:sticky", data)
        }
        onscroll($this)
        $(window).on("scroll.position:sticky:" + data.id, function() { onscroll($this) })
        $(window).on("resize.position:sticky:" + data.id, function() { onresize($this) })
      })
    })

    unmatched.each(function(rule) {
      var $elements = $(rule.getSelectors())
      $elements.each(function() {
        var $this = $(this)
          , data = $(this).data("position:sticky")
        if (data) {
          if (data.$clone) {
            data.$clone.remove()
            $this.css("visibility", "visible")
          }
          $(window).off(".position:sticky:" + data.id)
          $this.removeData("position:sticky")
        }
      })
    })

  })

}(jQuery))
