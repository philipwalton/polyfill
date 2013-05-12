# Polyfill.js

Polyfill.js is library designed to make writing CSS polyfills much, much easier. It's an abstraction library that takes care of the boilerplate, so you can focus on what your polyfill actually does.

For most CSS polyfills, the hardest part is not the polyfill logic, it's the boring stuff, the stuff that the browser is supposed to do for you: downloading the CSS, parsing it, and finding the parts you care about. If the CSS contains media queries, you need to deal with them, detect when they apply, and manually listen for changes.

Furthermore, on the Web today, most polyfills exist isolated from each other, which means they all repeat the same expensive tasks. Polyfill.js solves this problem. It provides a common API for Polyfill authors to hook into, so all the hard work happens only once at most. Downloaded stylesheets are parsed and stored in a cache so additional instances don't do double work. And if the same media queries are needed for two separate polyfill instances, only one event listener is added.

## How It Works

Polyfill.js make writing your own CSS Polyfill easy by breaking it down into the following three steps:

### 1) Include the Polyfill.js library on your page.

It doesn't really matter where you put it, as long as it appears after the stylesheet(s) containing the rules you want to polyfill.

```html
<script src="path/to/polyfill.js"></script>
```

### 2) Create a new Polyfill Instance

You create a new instance of the Polyfill object by passing in one or more keywords representing the CSS features you want to polyfill. The keywords can be declaration keywords (property-value pairs) or selector keywords.

The following expression creates an instance to polyfill the :local-link CSS psuedo class:

```js
var localLinkPolyfill = Polyfill({ selectors: [":local-link"] })
```

### 3) Register Event Callbacks

Once you have your polyfill instance, you simply register two callback: doMatched() and undoUnmatched(). When the page first loads and Polyfill.js has done all its work behind the scenes, the doMatched() callback is invoked and is passed a list of CSS rules that contain the specified keywords and match the current media.

If the media values change (usually by resizing the browser window) and new rules match, the doMatched() callback will be invoked again, each time being passed the newly matched rules.

If the media value changes and some rules no longer match, the undoUnmatched() callback is invoked and passed a list of rules that used to match but now don't.

## Demos

* [Local Link]("/demos/local-link"): a new CSS pseudo-class for anchor tags that link to URLs within the current domain
* [Position Sticky]("/demos/position-sticky"): a new CSS position value to allow elements to stick in place only after a specified scroll position is met.

## Running the Tests

