describe("Rule", function() {

  var filteredRules
    , parsedRules
    , rules
    , Rule = Polyfill.constructors.Rule
    , Ruleset = Polyfill.constructors.Ruleset
    , StyleManager = Polyfill.modules.StyleManager
    , DownloadManager = Polyfill.modules.DownloadManager

  beforeEach(function() {
    DownloadManager.request(["../spec/css/filter-test.css"], function(result) {
      parsedRules = StyleManager.parse(result[0])
      filteredRules = StyleManager.filter(parsedRules, {
        "declarations": ["*:*"]
      })
      rules = (new Ruleset(filteredRules))
    })
    waitsFor(function() { return filteredRules })
  })

  describe("getMedia()", function() {

    it("returns the combined media values (joined via `and`)", function() {
      expect(rules.at(3).getMedia()).toBe("(min-width: 40em) and (max-width: 1000px)")
    })

  })

  describe("getSelectors()", function() {

    it("returns the combined selector values (joined via `, `)", function() {
      expect(rules.at(0).getSelectors()).toBe("p:nth-of-type(2n-1), pre:last-child, code")
    })

  })

  describe("getDeclaration()", function() {

    it("returns the combined selector values (joined via `, `)", function() {
      expect(rules.at(1).getDeclaration()).toEqual({"display": "-webkit-flex", "foo": "bar"})
    })

  })

})