# Polyfill.js

The goal of Polyfill.js is to make writing CSS polyfills much easier.

Most CSS polyfills do a lot of the same things. And if you're using more than one polyfill, those things can be very expensive. Even the simpliest of polyfills will likely have to do the following:

* Make an AJAX request for the stylesheets
* Parse the returned CSS
* Filter the CSS for only the rules that match features to polyfill
* Detect whether or not the filtered rules apply to the current media query
* Handle the logical matching of rules in conditional blocks
* Listen for media changes and report new results
* Listen for for DOM changes and automatically update

If most polyfills needs to do all of these tasks, it makes sense to abstract this work into a separate library. Using a common library to handle all the grunt work not only makes writing polyfills much easier, but it also means your users don't have to download and parse the same stylesheets several times for a single pageload, an unfortunate reality in the Web today.

Polyfill.js does this abstraction for you.

## How It Works

Polyfill.js exposes a single constructor function called `Polyfill`. When you create a new instance of the polyfill object you pass in one or more keywords representing the CSS features you want to polyfill. The keywords can be properties, values, selectors, or media.

The following expression creates a new object to polyfill the `:local-link` CSS psuedo class:

```
var localLinkPolyfill = Polyfill({ selectors: [":local-link"] })
```

Once you have your polyfill instance, you simply register two callback: `doMatched()` and `undoUnmatched()`. When the page first loads and the stylesheets have been downloaded, parsed, filtered, and matched, the `doMatched()` callback is invoked and is passed a list of CSS rules that contain the specified keywords and match the current media.

If the media value changes (usually by resizing the browser window) and additional rules now match, the `doMatched()` callback will be invoked again each time passing in the newly matched rules.

If the media value changes and a rule no longer matches, the `undoUnmatched()` callback is invoked and passed a list of rules that used to match but no longer do.

## API

The only accessible in the global scope is the `Polyfill` constructor. It contains the following methods:

### Polyfill

**Polyfill(keywords, options)**

Creates and returns a new Polyfill instance (the `new` keyword is optional).

**doMatched(callback)**

Accepts a callback function that is invoked whenever new rules match the passed keywords. This happens as soon as the page is loaded as well as when media changes. When the callback is invoked it is passed a Ruleset object. *(See below for the Ruleset method details.)*

**undoUnmatched(callback)**

Accepts a callback function that is invoked whenever previously matches rules no longer match. This could be because the media changed or the polyfill was destroyed. When the callback is invoked it is passed a Ruleset object. *(See below for the Ruleset method details.)*

**getMatches()**

Normally the callbacks are all you need, but occassionally you'll want to manually get a list of all rules that are current matches.

**destroy()**

Destroy the polyfill instance by removing any media listeners and invoking the undoMatched callback.

### Ruleset

**each(callback)**

Iterate through each rule in the ruleset. When the callback function is invoked it is passed an instance of a `Rule` object. *(See below for the `Rule` method details.)*

**at(index)**

Returns the `Rule` instance at the specified index. *(See below for the `Rule` method details.)*

**size()**

Returns the number of rules in the set.

### Rule

**getSelectors()**

Returns a string of the selector. If the rule has more than one selector they are join with a comma.

**getDeclaration()**

Returns an object map of the CSS declaration. (Note: since an object cannot have duplicate keys, duplicate CSS property values ignored. If you need to access duplicate CSS values, you can manually inspect the `Rule` instance for the raw data.)

**getMedia()**

Returns a string of the media query value. If the rule contains more than one media query value (a nested rule) the media values are joined on `and`.

## A Complete Example

Putting it all together, this is all the code you'd need to write a fully-functioning polyfill for `:local-link` using jQuery:

```
var reURL = /^(?:(https?:)\/\/)?((?:[0-9a-z\.\-]+)(?::(?:\d+))?)/

// First extend jQuery's selector engine
$.extend($.expr[':'], {
  "local-link": function(el) {
    var url = el.href.match(reURL)
      , protocol = url[1]
      , host = url[2]
    return protocol == location.protocol && host == location.host
  }
})

// Then let Polyfill.js do the rest
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
```