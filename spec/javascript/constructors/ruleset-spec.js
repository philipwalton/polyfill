describe("Ruleset", function() {

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
      rules = new Ruleset(filteredRules)
    })
    waitsFor(function() { return filteredRules })
  })

  describe("size()", function() {

    it("returns the number of items in the Ruleset", function() {
      expect(rules.size()).toBe(4)
    })

  })

  describe("at()", function() {

    it("returns the Rule at the specified index", function() {
      expect(rules.at(0).getDeclaration()).toEqual({"color": "red"})
      expect(rules.at(1).getDeclaration()).toEqual({"display": "-webkit-flex", "foo": "bar"})
      expect(rules.at(2).getDeclaration()).toEqual({"-webkit-flex": "0 0 auto"})
      expect(rules.at(3).getDeclaration()).toEqual({"float": "left"})
    })

  })

  describe("each()", function() {

    it("can iterate over each rule in a ruleset", function() {
      var instances = []
      rules.each(function(rule) {
        instances.push(rule)
      })
      expect(instances[0] instanceof Rule).toBe(true)
      expect(instances[0].getDeclaration()).toEqual({"color": "red"})
      expect(instances[1] instanceof Rule).toBe(true)
      expect(instances[1].getDeclaration()).toEqual({"display": "-webkit-flex", "foo": "bar"})
      expect(instances[2] instanceof Rule).toBe(true)
      expect(instances[2].getDeclaration()).toEqual({"-webkit-flex": "0 0 auto"})
      expect(instances[3] instanceof Rule).toBe(true)
      expect(instances[3].getDeclaration()).toEqual({"float": "left"})

    })

  })

})