describe("Polyfill", function() {

  var iframe = window.top.document.getElementById("test-frame")
    , polyfill
    , options = {
        include: ["simple-test"],
        keywords: {
          selectors: [".selector"],
          declarations: ["prop:*"]
        }
      }
    , matchedCount = 0
    , unmatchedCount = 0
    , matchedResults = []
    , unmatchedResults = []

  // ignore these tests if we're not in an iframe
  if (!iframe) return

  function doMatched(matched) {
    matchedCount++
    matchedResults.push({
      matched: matched,
      polyfill: this
    })
  }

  function undoUnmatched(unmatched) {
    unmatchedCount++
    unmatchedResults.push({
      unmatched: unmatched,
      polyfill: this
    })
  }

  function reset() {
    matchedCount = 0
    unmatchedCount = 0
    matchedResults = []
    unmatchedResults = []
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

  function createPolyfill(o) {
    runs(function() {
      o || (o = options)
      reset()
      polyfill = Polyfill(o)
        .doMatched(doMatched)
        .undoUnmatched(undoUnmatched)
      waitsFor(function() { return matchedCount > 0 })
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

  describe("options:", function() {

    it("defaults to downloading all stylesheets (expect print stylesheets) if no options are passed", function() {
      createPolyfill({declarations: ["prop:*"]}, {})
      runs(function() {
        expect(polyfill._stylesheets.length).toBe(12)
      })
    })

    it("can exlude certain stylesheets from being downloaded", function() {
      createPolyfill({
        exclude:["exclude-test1", "exclude-test2"],
        keywords: {
          declarations: ["prop:*"]
        }
      })
      runs(function() {
        expect(polyfill._stylesheets.length).toBe(10)
      })
    })

    it("can limit the downloads to only included stylesheets", function() {
      createPolyfill({
        include:["include-test1", "include-test2"],
        keywords: {
          declarations: ["prop:*"]
        }
      })
      runs(function() {
        expect(polyfill._stylesheets.length).toBe(2)
      })
    })

    it("can filter rules by selector keywords", function() {
      createPolyfill({
        include: ["filter-test"],
        keywords: {
          selectors:[":nth-of-type", ".flex"]
        }
      })
      runs(function() {
        expect(polyfill._filteredRules.length).toBe(3)
        expect(polyfill._filteredRules[0].selectors).toEqual(["p:nth-of-type(2n-1)", "pre:last-child", "code"])
        expect(polyfill._filteredRules[1].selectors).toEqual([".flex"])
        expect(polyfill._filteredRules[2].selectors).toEqual([".flex"])
      })
    })

    it("can filter rules by declaration keywords", function() {
      createPolyfill({
        include: ["filter-test"],
        keywords: {
          declarations:["display:*flex", "*flex:*"]
        }
      })
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

    it("includes stylesheet media attributes in each filtered rule's media list", function() {
      createPolyfill({
        include: ["media-test"],
        keywords: {
          declarations:["*:*"]
        }
      })
      runs(function() {
        expect(polyfill._filteredRules.length).toBe(1)
        expect(polyfill._filteredRules[0].media).toEqual(["max-width: 800px"])
      })
    })

    it("ignores stylesheets with a `print` media attribute", function() {
      createPolyfill({
        include: ["media-test", "media-print-test"],
        keywords: {
          declarations:["*:*"]
        }
      })
      runs(function() {
        expect(polyfill._filteredRules.length).toBe(1)
        expect(polyfill._filteredRules[0].selectors).toEqual(["#media"])
      })
    })

    it("ignores `all` and `screen` media attributes", function() {
      createPolyfill({
        include: ["media-screen-test", "media-all-test"],
        keywords: {
          declarations:["*:*"]
        }
      })
      runs(function() {
        expect(polyfill._filteredRules.length).toBe(2)
        expect(polyfill._filteredRules[0].media).not.toBeDefined()
        expect(polyfill._filteredRules[1].media).not.toBeDefined()
      })
    })

    it("ignores stylesheets from external domains", function() {
      createPolyfill({
        include: ["media-test", "external-domain"],
        keywords: {
          declarations:["*:*"]
        }
      })
      runs(function() {
        expect(polyfill._filteredRules.length).toBe(1)
        expect(polyfill._filteredRules[0].selectors).toEqual(["#media"])
      })
    })

  })

  describe("getCurrentMatches()", function() {

    it("returns a Ruleset object containing all rules that match the current media", function() {

      setFrame(200)
      runs(function() {
        polyfill = Polyfill(options)
          .doMatched(doMatched)
          .undoUnmatched(undoUnmatched)
        waitsFor(function() { return matchedCount > 0 })
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
        polyfill = Polyfill(options)
          .doMatched(doMatched)
          .undoUnmatched(undoUnmatched)
        waitsFor(function() { return matchedCount > 0 })
      })
    }

    afterEach(function() {
      polyfill && polyfill.destroy()
      polyfill = null
    })

    it("can create a new Polyfill instance with all the correct properties", function() {
      createPolyfill()
      runs(function() {
        expect(polyfill._options).toBeDefined()
        expect(polyfill._stylesheets).toBeDefined()
        expect(polyfill._filteredRules).toBeDefined()
        expect(polyfill._mediaQueryMap).toBeDefined()
        expect(polyfill._promise).toBeDefined()
        expect(polyfill._doMatched).toBeDefined()
        expect(polyfill._undoUnmatched).toBeDefined()
      })
    })

    it("initially returns a list of rules that match the passed keywords", function() {
      setFrame(300)
      createPolyfill()
      runs(function() {
        expect(matchedCount).toBe(1)
        expect(unmatchedCount).toBe(0)
        expect(matchedResults[0].matched.size()).toBe(2)
      })
    })

    it("sends new matches when the media changes", function() {
      setFrame(500)
      createPolyfill()
      setFrame(800)
      runs(function() {
        expect(matchedCount).toBe(1)
        expect(unmatchedCount).toBe(0)
        expect(matchedResults[0].matched.size()).toBe(2)
        expect(matchedResults[0].matched.at(0).getMedia()).toEqual("(min-width: 40em)")
      })
    })

    it("sends matches that previously matched but no longer do when the media changes", function() {
      setFrame(500)
      createPolyfill()
      setFrame(800)
      setFrame(200)
      runs(function() {
        expect(matchedCount).toBe(1)
        expect(unmatchedCount).toBe(1)
        expect(unmatchedResults[0].unmatched.size()).toBe(2)
        expect(unmatchedResults[0].unmatched.at(0).getMedia()).toEqual("(min-width: 40em)")
        expect(matchedResults[0].matched.size()).toBe(1)
        expect(matchedResults[0].matched.at(0).getMedia()).toEqual("(max-width: 30em)")
      })
    })

    it("doesn't send matches on window.resize if the matched media hasn't changed", function() {
      setFrame(500)
      createPolyfill()
      setFrame(550)
      runs(function() {
        expect(matchedCount).toBe(0)
        expect(unmatchedCount).toBe(0)
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
        expect(matchedCount).toBe(0)
        expect(unmatchedCount).toBe(0)
      })
    })

  })

  describe("Multiple polyfill instances:", function() {

    var polyfill1
      , polyfill2
      , polyfill3
      , options1 = {
          include: ["complex-test"],
          keywords: { declarations: ["foo:*"] }
        }
      , options2 = {
          include: ["complex-test"],
          keywords: { declarations: ["bar:*"] }
        }
      , options3 = {
          include: ["complex-test"],
          keywords: { declarations: ["fizz:*"] }
        }

    function createPolyfills() {
      runs(function() {
        polyfill1 = Polyfill(options1, options)
          .doMatched(doMatched)
          .undoUnmatched(undoUnmatched)
        polyfill2 = Polyfill(options2)
          .doMatched(doMatched)
          .undoUnmatched(undoUnmatched)
        polyfill3 = Polyfill(options3)
          .doMatched(doMatched)
          .undoUnmatched(undoUnmatched)
        waitsFor(function() { return matchedCount === 3 })
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
        expect(polyfill1._options).toBeDefined()
        expect(polyfill1._stylesheets).toBeDefined()
        expect(polyfill1._filteredRules).toBeDefined()
        expect(polyfill1._mediaQueryMap).toBeDefined()
        expect(polyfill1._promise).toBeDefined()
        expect(polyfill1._doMatched).toBeDefined()
        expect(polyfill1._undoUnmatched).toBeDefined()
        // polyfill2
        expect(polyfill2._options).toBeDefined()
        expect(polyfill2._stylesheets).toBeDefined()
        expect(polyfill2._filteredRules).toBeDefined()
        expect(polyfill2._mediaQueryMap).toBeDefined()
        expect(polyfill2._promise).toBeDefined()
        expect(polyfill2._doMatched).toBeDefined()
        expect(polyfill2._undoUnmatched).toBeDefined()
        // polyfill3
        expect(polyfill3._options).toBeDefined()
        expect(polyfill3._stylesheets).toBeDefined()
        expect(polyfill3._filteredRules).toBeDefined()
        expect(polyfill3._mediaQueryMap).toBeDefined()
        expect(polyfill3._promise).toBeDefined()
        expect(polyfill3._doMatched).toBeDefined()
        expect(polyfill3._undoUnmatched).toBeDefined()
      })
    })

    it("initially returns a list of rules that match the passed keywords", function() {
      setFrame(700)
      createPolyfills()
      runs(function() {
        expect(matchedCount).toBe(3)
        expect(unmatchedCount).toBe(0)
        // polyfill1
        expect(matchedResults[0].polyfill).toBe(polyfill1)
        expect(matchedResults[0].matched.size()).toBe(2)
        // polyfill2
        expect(matchedResults[1].polyfill).toBe(polyfill2)
        expect(matchedResults[1].matched.size()).toBe(0)
        // polyfill3
        expect(matchedResults[2].polyfill).toBe(polyfill3)
        expect(matchedResults[2].matched.size()).toBe(0)
      })
    })

    it("sends new matches when the media changes", function() {
      setFrame(700)
      createPolyfills()
      setFrame(450)
      runs(function() {
        expect(matchedCount).toBe(2)
        expect(unmatchedCount).toBe(0)
        // polyfill2
        expect(matchedResults[0].polyfill).toBe(polyfill2)
        expect(matchedResults[0].matched.size()).toBe(1)
        // polyfill3
        expect(matchedResults[1].polyfill).toBe(polyfill3)
        expect(matchedResults[1].matched.size()).toBe(1)
      })
    })

    it("sends matches that previously matched but no longer do when the media changes", function() {
      setFrame(700)
      createPolyfills()
      setFrame(450)
      setFrame(100)
      runs(function() {
        expect(matchedCount).toBe(1)
        expect(unmatchedCount).toBe(3)
        // polyfill1
        expect(unmatchedResults[0].polyfill).toBe(polyfill1)
        expect(unmatchedResults[0].unmatched.size()).toBe(1)
        expect(unmatchedResults[0].unmatched.at(0).getMedia()).toEqual("(min-width: 400px)")
        // polyfill2
        expect(matchedResults[0].polyfill).toBe(polyfill2)
        expect(matchedResults[0].matched.size()).toBe(1)
        expect(matchedResults[0].matched.at(0).getMedia()).toEqual("(max-width: 400px)")
        expect(unmatchedResults[1].polyfill).toBe(polyfill2)
        expect(unmatchedResults[1].unmatched.size()).toBe(1)
        expect(unmatchedResults[1].unmatched.at(0).getMedia()).toEqual("(min-width: 200px) and (max-width: 600px)")
        // polyfill3
        expect(unmatchedResults[2].polyfill).toBe(polyfill3)
        expect(unmatchedResults[2].unmatched.size()).toBe(1)
        expect(unmatchedResults[2].unmatched.at(0).getMedia()).toEqual("(min-width: 300px) and (max-width: 500px)")
      })
    })

    it("doesn't send matches on window.resize if the matched media hasn't changed", function() {
      setFrame(425)
      createPolyfills()
      setFrame(475)
      runs(function() {
        expect(matchedCount).toBe(0)
        expect(unmatchedCount).toBe(0)
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
        expect(matchedCount).toBe(0)
        expect(unmatchedCount).toBe(0)
      })
    })

  })

})
