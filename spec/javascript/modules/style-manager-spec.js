describe("StyleManager", function() {

  var StyleManager = Polyfill.modules.StyleManager
    , DownloadManager = Polyfill.modules.DownloadManager

  beforeEach(function() {
    StyleManager.clearCache()
  })

  describe("parse", function() {

    var expected = [
      { "charset": "\"UTF-8\""},
      { "namespace": "\"http://www.w3.org/1999/xhtml\"" },
      { "namespace": "svg \"http://www.w3.org/2000/svg\""},
      {
        "selectors": ["h1", "h2", "h3", "h4"],
        "declarations": [
          {
            "property": "font-weight",
            "value": "bold"
          }
        ]
      },
      {
        "selectors": [".foo"],
        "declarations": [
          {
            "property": "background-image",
            "value": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAZCAYA)"
          },
          {
            "property": "width",
            "value": "calc(2em + calc(5px + 2%))"
          },
          {
            "property": "box-shadow",
            "value": "0 0 10px rgba(0,0,0,0.1)"
          }
        ]
      },
      {
        "media": "screen and (min-width: 600px) and (max-width: 1000px)",
        "rules": [
          {
            "selectors": ["p"],
            "declarations": [
              {
                "property": "color",
                "value": "gray"
              },
              {
                "property": "font-size",
                "value": "2em"
              }
            ]
          },
          {
            "media": "(max-width: 1000px)",
            "rules": [
              {
                "selectors": [".foo"],
                "declarations": [
                  {
                    "property": "box-sizing",
                    "value": "border-box"
                  }
                ]
              },
              {
                "media": "(max-width: 1000px)",
                "rules": [
                  {
                    "selectors": [".fizz"],
                    "declarations": [
                      {
                        "property": "visibility",
                        "value": "hidden"
                      }
                    ]
                  },
                  {
                    "selectors": [".buzz"],
                    "declarations": [
                      {
                        "property": "text-decoration",
                        "value": "underline"
                      }
                    ]
                  }
                ]
              },
              {
                "selectors": [".bar"],
                "declarations": [
                  {
                    "property": "clear",
                    "value": "both"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "selectors": [".animate"],
        "declarations": [
          {
            "property": "animation",
            "value": "foobar 2s ease-in-out 0s infinite alternate"
          }
        ]
      },
      {
        "name": "foobar",
        "keyframes": [
          {
            "values": ["0%"],
            "declarations": [
              {
                "property": "top",
                "value": "0"
              },
              {
                "property": "left",
                "value": "0"
              }
            ]
          },
          {
            "values": ["50%"],
            "declarations": [
              {
                "property": "top",
                "value": "50%"
              },
              {
                "property": "left",
                "value": "100%"
              }
            ]
          },
          {
            "values": ["100%"],
            "declarations": [
              {
                "property": "top",
                "value": "100%"
              },{
                "property": "left",
                "value": "0"
              }
            ]
          }
        ]
      },
      {
        "supports": "(display: flex)",
        "rules": [
          {
            "selectors": [".flexie"],
            "declarations": [
              {
                "property": "display",
                "value": "flex"
              }
            ]
          }
        ]
      },
      {
        "type": "page",
        "selectors": [],
        "declarations": [
          {
            "property": "margin",
            "value": "10%"
          },
          {
            "property": "counter-increment",
            "value": "page"
          },
          {
            "type": "top-center",
            "declarations": [
              {
                "property": "font-family",
                "value": "sans-serif"
              },
              {
                "property": "font-weight",
                "value": "bold"
              },
              {
                "property": "font-size",
                "value": "2em"
              },
              {
                "property": "content",
                "value": "counter(page)"
              }
            ]
          }
        ]
      }
    ]

    it("can parse a sting of CSS and return a list of structured rules", function() {
      var stylesheet
      DownloadManager.request(["../spec/css/parse-test.css"], function(result) {
        stylesheet = result[0]
      })
      waitsFor(function() { return stylesheet })
      runs(function() {
        expect(StyleManager.parse(stylesheet)).toEqual(expected)
      })
    })

  })

  describe("filter", function() {

    var parsedRules

    beforeEach(function() {
      var stylesheet
      DownloadManager.request(["../spec/css/filter-test.css"], function(result) {
        parsedRules = StyleManager.parse(result[0])
      })
      waitsFor(function() { return parsedRules })
    })

    it("can target keywords within the selector(s)", function() {
      var filteredRules = StyleManager.filter(parsedRules, {
        selectors: ["nth-of-type"]
      })
      expect(filteredRules.length).toBe(1)
      expect(filteredRules[0]).toEqual({
        selectors: ["p:nth-of-type(2n-1)", "pre:last-child", "code"],
        declarations: [{property: "color", value:"red"}]
      })
    })

    it("can target keywords within the declaration", function() {
      var filteredRules = StyleManager.filter(parsedRules, {
        "declarations": ["display:*flex", "*flex*:*"]
      })
      expect(filteredRules.length).toBe(2)
      expect(filteredRules[0]).toEqual({
        selectors: [".flex"],
        declarations: [
          { property: "display", value: "-webkit-flex" },
          { property: "foo", value: "bar" }
        ]
      })
      expect(filteredRules[1]).toEqual({
        media: ["(min-width: 40em)"],
        selectors: [".flex"],
        declarations: [{property: "-webkit-flex", value: "0 0 auto" }]
      })
    })

    it("combines multiple media rules together for matched rules within nested media blocks", function() {
      var filteredRules = StyleManager.filter(parsedRules, {
        "declarations": ["float:left"]
      })
      expect(filteredRules.length).toBe(1)
      expect(filteredRules[0]).toEqual({
        media: ["(min-width: 40em)", "(max-width: 1000px)"],
        selectors : [".nested"],
        declarations : [{property: "float", value: "left" }]
      })
    })

  })

})