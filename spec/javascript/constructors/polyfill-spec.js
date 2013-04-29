describe("Polyfill", function() {

  var iframe = window.top.document.getElementById("test-frame")
    , results = []
    , callCount = 0
    , polyfill
    , keywords = {selectors: [".selector"], declarations: ["prop:*"]}
    , options = {include: ["simple-test"]}

  // ignore these tests if we're not in an iframe
  if (!iframe) return

  function callback(matched, unmatched, polyfill) {
    callCount++
    results.push({
      matchedRules: matched,
      unmatchedRules: unmatched,
      polyfill: polyfill
    })
  }

  function reset() {
    callCount = 0
    results = []
  }

  function setFrame(size, timeoutAmount) {
    runs(function() {
      reset()
      iframe.width = size
      // timeoutAmount must be longer than the window.resize debounce
      // time in order for the tests to work in old browsers
      waits(timeoutAmount || 125)
    })
  }

  function createPolyfill(k, o) {
    runs(function() {
      k || (k = keywords)
      o || (o = options)
      reset()
      polyfill = Polyfill(k, o, callback)
      waitsFor(function() { return callCount > 0 })
    })
  }

  beforeEach(function() {
    reset()
    // Hide scroll bars to be safe. They're different widths
    // in different browsers, which affects our measurements
    document.documentElement.style.overflow = "hidden"
  })

  afterEach(function() {
    polyfill && polyfill.destroy()
    iframe.width = "100%"
    document.documentElement.style.overflow = "auto"
  })

  describe("keywords:", function() {

    it("can filter rules by selector keywords", function() {
      createPolyfill(
        {selectors:[":nth-of-type", ".flex"]},
        {include: ["filter-test"]}
      )
      runs(function() {
        expect(polyfill._filteredRules.length).toBe(3)
        expect(polyfill._filteredRules[0].selectors).toEqual(["p:nth-of-type(2n-1)", "pre:last-child", "code"])
        expect(polyfill._filteredRules[1].selectors).toEqual([".flex"])
        expect(polyfill._filteredRules[2].selectors).toEqual([".flex"])
      })
    })

    it("can filter rules by declaration keywords", function() {
      createPolyfill(
        {declarations:["display:*flex", "*flex:*"]},
        {include: ["filter-test"]}
      )
      runs(function() {
        expect(polyfill._filteredRules.length).toBe(2)
        expect(polyfill._filteredRules[0].declarations).toEqual([
          {property: "display", value:"-webkit-flex"},
          {property: "foo", value:"bar"}
        ])
        expect(polyfill._filteredRules[1].declarations).toEqual([
          {property: "-webkit-flex", value:"0 0 auto"}
        ])
      })
    })

  })

  describe("options:", function() {

    it("defaults to downloading all stylesheets if no options are passed", function() {
      createPolyfill({declarations: ["prop:*"]}, {})
      runs(function() {
        expect(polyfill._stylesheets.length).toBe(9)
      })
    })

    it("can exlude certain stylesheets from being downloaded", function() {
      createPolyfill(
        {declarations: ["prop:*"]},
        {exclude:["exclude-test1", "exclude-test2"]}
      )
      runs(function() {
        expect(polyfill._stylesheets.length).toBe(7)
      })
    })

    it("can limit the downloads to only included stylesheets", function() {
      createPolyfill(
        {declarations: ["prop:*"]},
        {include:["include-test1", "include-test2"]}
      )
      runs(function() {
        expect(polyfill._stylesheets.length).toBe(2)
      })
    })

  })

  describe("getCurrentMatches()", function() {

    it("returns a Ruleset object containing all rules that match the current media", function() {

      setFrame(200)
      runs(function() {
        polyfill = Polyfill(keywords, options, callback)
        waitsFor(function() { return callCount > 0 })
      })
      setFrame(800)
      runs(function() {
        var matches = polyfill.getCurrentMatches()
        expect(matches.size()).toBe(3)
        expect(matches.at(0).getDeclaration()).toEqual({"foo": "bar"})
        expect(matches.at(1).getDeclaration()).toEqual({"bar": "foo"})
        expect(matches.at(2).getDeclaration()).toEqual({"prop": "one"})
        polyfill.destroy()
      })
    })

  })

  describe("A single polyfill instance:", function() {

    function createPolyfill() {
      runs(function() {
        polyfill = Polyfill(keywords, options, callback)
        waitsFor(function() { return callCount > 0 })
      })
    }

    afterEach(function() {
      polyfill && polyfill.destroy()
      polyfill = null
    })

    it("can create a new Polyfill instance with all the correct properties", function() {
      createPolyfill()
      runs(function() {
        expect(polyfill._callback).toBeDefined()
        expect(polyfill._filteredRules).toBeDefined()
        expect(polyfill._keywords).toBeDefined()
        expect(polyfill._mediaQueryMap).toBeDefined()
        expect(polyfill._options).toBeDefined()
        expect(polyfill._parsedCSS).toBeDefined()
        expect(polyfill._promise).toBeDefined()
        expect(polyfill._stylesheetURLs).toBeDefined()
        expect(polyfill._stylesheets).toBeDefined()
      })
    })

    it("initially returns a list of rules that match the passed keywords", function() {
      setFrame(300)
      createPolyfill()
      runs(function() {
        expect(callCount).toBe(1)
        expect(results[0].matchedRules.size()).toBe(2)
        expect(results[0].unmatchedRules.size()).toBe(0)
      })
    })

    it("sends new matches when the media changes", function() {
      setFrame(500)
      createPolyfill()
      setFrame(800)
      runs(function() {
        expect(callCount).toBe(1)
        expect(results[0].matchedRules.size()).toBe(2)
        expect(results[0].matchedRules.at(0).getMedia()).toEqual("(min-width: 40em)")
        expect(results[0].unmatchedRules.size()).toBe(0)
      })
    })

    it("sends matches that previously matched but no longer do when the media changes", function() {
      setFrame(500)
      createPolyfill()
      setFrame(800)
      setFrame(200)
      runs(function() {
        expect(callCount).toBe(2)
        expect(results[0].matchedRules.size()).toBe(0)
        expect(results[0].unmatchedRules.size()).toBe(2)
        expect(results[0].unmatchedRules.at(0).getMedia()).toEqual("(min-width: 40em)")
        expect(results[1].matchedRules.size()).toBe(1)
        expect(results[1].matchedRules.at(0).getMedia()).toEqual("(max-width: 30em)")
        expect(results[1].unmatchedRules.size()).toBe(0)
      })
    })

    it("doesn't send matches on window.resize if the matched media hasn't changed", function() {
      setFrame(500)
      createPolyfill()
      setFrame(550)
      runs(function() {
        expect(callCount).toBe(0)
      })
    })

    it("can destroy itself and remove any attached event listeners", function() {
      setFrame(300)
      createPolyfill()
      runs(function() {
        polyfill.destroy()
      })
      setFrame(900)
      runs(function() {
        expect(callCount).toBe(0)
      })
    })

  })

  describe("Multiple polyfill instances:", function() {

    var polyfill1
      , polyfill2
      , polyfill3
      , keywords1 = {declarations: ["foo:*"]}
      , keywords2 = {declarations: ["bar:*"]}
      , keywords3 = {declarations: ["fizz:*"]}
      , options = {include: ["complex-test"]}

    function createPolyfills() {
      runs(function() {
        polyfill1 = Polyfill(keywords1, options, callback)
        polyfill2 = Polyfill(keywords2, options, callback)
        polyfill3 = Polyfill(keywords3, options, callback)
        waitsFor(function() { return callCount === 3 })
      })
    }

    afterEach(function() {
      polyfill1 && polyfill1.destroy()
      polyfill2 && polyfill2.destroy()
      polyfill3 && polyfill3.destroy()
      iframe.width = "100%"
    })

    it("can create new Polyfill instances with all the correct properties", function() {
      createPolyfills()
      runs(function() {
        // polyfill1
        expect(polyfill1._callback).toBeDefined()
        expect(polyfill1._filteredRules).toBeDefined()
        expect(polyfill1._keywords).toBeDefined()
        expect(polyfill1._mediaQueryMap).toBeDefined()
        expect(polyfill1._options).toBeDefined()
        expect(polyfill1._parsedCSS).toBeDefined()
        expect(polyfill1._promise).toBeDefined()
        expect(polyfill1._stylesheetURLs).toBeDefined()
        expect(polyfill1._stylesheets).toBeDefined()
        // polyfill2
        expect(polyfill2._callback).toBeDefined()
        expect(polyfill2._filteredRules).toBeDefined()
        expect(polyfill2._keywords).toBeDefined()
        expect(polyfill2._mediaQueryMap).toBeDefined()
        expect(polyfill2._options).toBeDefined()
        expect(polyfill2._parsedCSS).toBeDefined()
        expect(polyfill2._promise).toBeDefined()
        expect(polyfill2._stylesheetURLs).toBeDefined()
        expect(polyfill2._stylesheets).toBeDefined()
        // polyfill3
        expect(polyfill3._callback).toBeDefined()
        expect(polyfill3._filteredRules).toBeDefined()
        expect(polyfill3._keywords).toBeDefined()
        expect(polyfill3._mediaQueryMap).toBeDefined()
        expect(polyfill3._options).toBeDefined()
        expect(polyfill3._parsedCSS).toBeDefined()
        expect(polyfill3._promise).toBeDefined()
        expect(polyfill3._stylesheetURLs).toBeDefined()
        expect(polyfill3._stylesheets).toBeDefined()
      })
    })

    it("initially returns a list of rules that match the passed keywords", function() {
      setFrame(700)
      createPolyfills()
      runs(function() {
        expect(callCount).toBe(3)
        // polyfill1
        expect(results[0].polyfill).toBe(polyfill1)
        expect(results[0].matchedRules.size()).toBe(2)
        // polyfill2
        expect(results[1].polyfill).toBe(polyfill2)
        expect(results[1].matchedRules.size()).toBe(0)
        // polyfill3
        expect(results[2].polyfill).toBe(polyfill3)
        expect(results[2].matchedRules.size()).toBe(0)
      })
    })

    it("sends new matches when the media changes", function() {
      setFrame(700)
      createPolyfills()
      setFrame(450)
      runs(function() {
        expect(callCount).toBe(2)
        // polyfill2
        expect(results[0].polyfill).toBe(polyfill2)
        expect(results[0].matchedRules.size()).toBe(1)
        console.log(results[0])
        // polyfill3
        expect(results[1].polyfill).toBe(polyfill3)
        expect(results[1].matchedRules.size()).toBe(1)
      })
    })

    it("sends matches that previously matched but no longer do when the media changes", function() {
      setFrame(700)
      createPolyfills()
      setFrame(450)
      setFrame(100)
      runs(function() {
        expect(callCount).toBe(4)
        // polyfill1
        expect(results[0].polyfill).toBe(polyfill1)
        expect(results[0].matchedRules.size()).toBe(0)
        expect(results[0].unmatchedRules.size()).toBe(1)
        expect(results[0].unmatchedRules.at(0).getMedia()).toEqual("(min-width: 400px)")
        // polyfill2
        expect(results[1].polyfill).toBe(polyfill2)
        expect(results[1].matchedRules.size()).toBe(1)
        expect(results[1].matchedRules.at(0).getMedia()).toEqual("(max-width: 400px)")
        expect(results[1].unmatchedRules.size()).toBe(0)
        expect(results[2].polyfill).toBe(polyfill2)
        expect(results[2].matchedRules.size()).toBe(0)
        expect(results[2].unmatchedRules.size()).toBe(1)
        expect(results[2].unmatchedRules.at(0).getMedia()).toEqual("(min-width: 200px) and (max-width: 600px)")
        // polyfill3
        expect(results[3].polyfill).toBe(polyfill3)
        expect(results[3].matchedRules.size()).toBe(0)
        expect(results[3].unmatchedRules.size()).toBe(1)
        expect(results[3].unmatchedRules.at(0).getMedia()).toEqual("(min-width: 300px) and (max-width: 500px)")
      })
    })

    it("doesn't send matches on window.resize if the matched media hasn't changed", function() {
      setFrame(425)
      createPolyfills()
      setFrame(475)
      runs(function() {
        expect(callCount).toBe(0)
      })
    })

    it("can destroy itself and remove any attached event listeners", function() {
      setFrame(450)
      createPolyfills()
      runs(function() {
        polyfill1.destroy()
        polyfill2.destroy()
        polyfill3.destroy()
      })
      setFrame(100)
      runs(function() {
        expect(callCount).toBe(0)
      })
    })

  })

})
