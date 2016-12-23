**UPDATE (2016-12-22): I am no longer supporting this library for all the reasons I address in my post [The Dark Side of Polyfilling CSS](https://philipwalton.com/articles/the-dark-side-of-polyfilling-css/). If you choose to use this library, please make sure you read the post, so you fully understand the challenges and limitations involved in writing CSS polyfills.**

* * *

# Polyfill.js

Polyfill.js is a library designed to make writing CSS polyfills much, much easier. It's an abstraction library that takes care of the boilerplate, so you can focus on what your polyfill actually does.

For most CSS polyfills, the hardest part is not the polyfill logic itself, it's the boring stuff, the stuff that the browser is supposed to do for you: downloading the CSS, parsing it, and finding the parts you care about. If the CSS contains media queries, you need to deal with them, detect when they apply, and manually listen for changes.

Furthermore, on the Web today, most polyfills exist isolated from each other, which means they all repeat the same expensive tasks. Polyfill.js solves this problem. It provides a common API for Polyfill authors to hook in to, so all the hard work happens only once at most. The stylesheets are downloaded, parsed, and stored in a cache so additional requests don't do double work.

## How It Works

Polyfill.js makes writing your own CSS Polyfill easy by breaking it down into the following three steps:

### 1) Include the Polyfill.js library on your page.

It doesn't really matter where you put it, as long as it appears after the stylesheet(s) containing the rules you want to polyfill.

```html
<script src="path/to/polyfill.js"></script>
```

### 2) Create a new Polyfill Instance

You create a new instance of the Polyfill object by passing in one or more keywords representing the CSS features you want to polyfill. The keywords can be declaration keywords (property-value pairs) or selector keywords.

The following expression creates an instance to polyfill the `:local-link` CSS pseudo-class:

```js
var localLinkPolyfill = Polyfill({ selectors: [":local-link"] })
```

### 3) Register Event Callbacks

Once you have your polyfill instance, you simply register two callbacks: `doMatched()` and `undoUnmatched()`. When the page first loads and Polyfill.js has done all its work behind the scenes, the `doMatched()` callback is invoked and is passed a list of CSS rules that contain the specified keywords and match the current media.

If the media values change (usually by resizing the browser window) and new rules match, the `doMatched()` callback will be invoked again, each time being passed the newly matched rules.

If the media value changes and some rules no longer match, the `undoUnmatched()` callback is invoked and passed a list of rules that previously matched but no longer do.

## Demos

* [Local Link](http://philipwalton.github.io/polyfill/demos/local-link): Local links (`:local-link`) is a new CSS pseudo-class for styling anchor tags that point to URLs within the current domain.
* [Position Sticky](http://philipwalton.github.io/polyfill/demos/position-sticky): "Sticky" is a new CSS position value to allow elements to stick in place only after a specified scroll position is met. This is most commonly used for navigation elements to stick in place after you start scrolling down the page.

## Running the Tests

Polyfill.js includes a [Jasmine](https://jasmine.github.io/) test suite and uses an embedded `iframe` to test the media queries and resize events. Polyfill.js has been tested on the latest Chrome, Firefox, Safari, Opera, and IE 7-10.

If you use a browser other than these, please [run the test suite in your browser](http://philipwalton.github.io/polyfill/spec/) and report back the results.

## API

The full API can be found on [project home page](http://philipwalton.github.io/polyfill/#api).
