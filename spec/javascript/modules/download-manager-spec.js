describe("DownloadManager", function() {

  var DownloadManager = Polyfill.modules.DownloadManager

  beforeEach(function() {
    DownloadManager.clearCache()
  })

  describe("request", function() {

    it("downloads all passed URLs and returns the results as an array of strings", function() {

      var stylesheets

      DownloadManager.request([
        "../spec/css/exclude-test1.css",
        "../spec/css/exclude-test2.css",
        "../spec/css/include-test1.css",
        "../spec/css/include-test2.css"
      ], function(results) {
        stylesheets = results
      })

      waitsFor(function() { return stylesheets })

      runs(function() {
        expect(stylesheets[0]).toContain("#exclude1")
        expect(stylesheets[1]).toContain("#exclude2")
        expect(stylesheets[2]).toContain("#include1")
        expect(stylesheets[3]).toContain("#include2")
      })
    })

    it("caches requests to avoid multiple downloads to the same URL", function() {

      var stylesheets
        , cachedResult
        , startingRequestCount = DownloadManager._getRequestCount()

      DownloadManager.request([
        "../spec/css/exclude-test1.css",
        "../spec/css/exclude-test2.css",
        "../spec/css/include-test1.css",
        "../spec/css/include-test2.css"
      ], function(results) {
        stylesheets = results
      })

      waitsFor(function() {
        return stylesheets
      })

      runs(function() {
        expect(DownloadManager._getRequestCount()).toBe(startingRequestCount + 4)
        DownloadManager.request(["../spec/css/exclude-test1.css"], function(results) {
          cachedResult = results
        })
      })

      runs(function() {
        expect(cachedResult[0]).toContain("#exclude1")
        expect(DownloadManager._getRequestCount()).toBe(startingRequestCount + 4)
      })
    })

  })

  describe("clearCache", function() {

    it("can clear the download cache if needed", function() {

      var stylesheets
        , cachedResult
        , startingRequestCount = DownloadManager._getRequestCount()

      DownloadManager.request([
        "../spec/css/exclude-test1.css",
        "../spec/css/exclude-test2.css"
      ], function(results) {
        stylesheets = results
      })

      waitsFor(function() {
        return stylesheets
      })

      runs(function() {
        expect(DownloadManager._getRequestCount()).toBe(startingRequestCount + 2)
        DownloadManager.clearCache()
        DownloadManager.request(["../spec/css/exclude-test1.css"], function(results) {
          cachedResult = results
        })
      })

      runs(function() {
        expect(DownloadManager._getRequestCount()).toBe(startingRequestCount + 3)
      })

    })

  })

})


