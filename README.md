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

Clients shouldn't have to download and parse the same stylesheets over and over again, or add the same event handlers to the same media query listeners. It's a waste of resources and not fair to your users.

If most polyfill libraries do the same tasks, why not abstract those common tasks into a single library that plugin authors can hook into.

Polyfill.js does this abstraction for you.

## How It Works

Polyfill.js exposes a single constructor function called `Polyfill`. When you create a new instance of the polyfill object you pass in one or more keywords representing the CSS features you want to polyfill. The keywords can be properties, values, selectors, or media.

The following expression creates a new object to polyfill the `:local-link` CSS psuedo class:

```
var localLinkPolyfill = Polyfill({ selectors: [":local-link"] })
```

Once you have your polyfill instance, you simply register two callback: `doMatched()` and `undoUnmatched()`. When the page first loads and the stylesheets have been downloaded, parsed, filtered, and matched, the `doMatched()` callback is invoked and is passed a list of CSS rules that contain the specified keywords and match the current media.

If the media values change (usually by resizing the browser window) and new rules match, the `doMatched()` callback will be invoked again each time passing in the newly matched rules.

If the media value changes and some rules no longer match, the `undoUnmatched()` callback is invoked and passed a list of rules that used to match but now don't.

## Demos

* [Local Link]("/demos/local-link"): a new CSS pseudo-class for anchor tags that link to URLs within the current domain
* [Position Sticky]("/demos/position-sticky"): a new CSS position value to allow elements to stick in place only after a specified scroll position is met.

## API

### Polyfill(keywords, [options])

Create a new polyfill object. *Note:* the `new` operator is optional.

#### arguments

1. **keywords** {Object}: An object map containing an array of strings to match against CSS rules. The possible object keys are `declarations`, `selectors`, or `media`, and the values are an array or keywords. Keywords strings are literal matches, but you may also include an asterisk character which will match any number of characters (equivalent to the following Regex: `/.*/`).
2. **options** {Object} _(optional)_: An object map containing an array of stylesheet IDs to include or exclude from the Polyfill. `include` and `exclude` cannot be used together. If both are passed, `include` is favored.

#### returns

{Polyfill} the new Polyfill instance

#### example

```js
var p1 = Polyfill({
  selectors: [":local-link", ":nth-of-type"],
  declarations: ["*border-radius:*", "position:sticky", "display:*flex"]
}, {
  exclude: ["third-party-css"]
})

var p2 = Polyfill({
  declarations: ["display:*flex"]
}, {
  include: ["flexbox", "box"]
})
```

### Polyfill#doMatched(callback)

Register a callback to be invoked whenever new rules match the passed keywords. This happens as soon as the page is loaded as well as when media changes. The callback is invoked with a [Ruleset](#ruleset) object that contains all of the newly matched CSS rules.

#### arguments

1) **callback** {Function): the function called

#### returns

{Polyfill} the current [Polyfill](#polyfill) instance

#### example

```
polyfill.doMatched(function(rules) {
  // do somthing...
})
```

### Polyfill#undoUnmatched(callback)

Register a callback function to be invoked whenever previously matches rules no longer match. This could be because the media changed or the polyfill was destroyed.

#### arguments

1. **callback** {Function): A callback function. Each invocation is passed a [Ruleset](#ruleset) object which contains all of the newly matched CSS rules.

#### returns

{Polyfill} the current [Polyfill](#polyfill) instance

#### example

```js
polyfill.undoUnmatched(function(rules) {
  // do somthing...
})
````

### Polyfill#getMatches()

Fetch all the CSS rules that match the current media. Rules that are not in a media block always match.

#### returns

{Ruleset} a [Ruleset](#ruleset) object containing all of the currently matches rules.

#### example

```js
var matches = pf.getMatches()
```

### Polyfill#destroy()

Destroy the polyfill instance by removing any media listeners and invoking the undoMatched callback.

#### returns

{undefined}

#### example

```js
polyfill.destroy()
```

### Ruleset#each(callback)

Iterates over a Ruleset invoking a callback for each Rule object in the Ruleset. Callbacks are invoked with the Rule object as their only arguments.

#### arguments

1. **callback** {Function}: the function called per iteration

#### returns

{Ruleset} the current instance

#### example

```js
rules.each(function(rule) {
  // do something...
})
```

### Ruleset#at(index)

Returns the `Rule` instance at the specified index.

#### arguments

1. **index** (Number): the index of the rule to return

#### returns

{Rule} the Rule object at the specified index.

#### examples

```js
var rule = rules.at(0)
```

### Ruleset#size()

Returns the number of rules in the Ruleset

#### returns

{Number}

#### example

```js
var length = rules.size()
```

### Rule#getSelectors()

Returns the full selector as a string. If the rule contains more than one selector they are join with a comma.

#### returns

{String} the full selector

#### example

```js
var selector = rule.getSelectors()
```

### Rule#getDeclaration()

Returns an object map of the CSS declaration. Note: since an object cannot have duplicate keys, duplicate CSS property values ignored. If you need to access duplicate CSS values, you can manually inspect the `Rule` instance for the raw data.

#### returns

{Object} the rule's declaration

#### example

```js
var declaration = rule.getDeclaration()
```

### Rule#getMedia()

Returns a string of the media query value. If the rule contains more than one media query value (e.g. a nested rule) the media values are joined on `and`.

#### returns

{String} the full media query

#### example

```js
var media = rule.getMedia()
```

## A Complete Example

Putting it all together, this is all the code you'd need to write a fully-functioning polyfill for the new CSS property `:local-link`. This example uses jQuery:

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