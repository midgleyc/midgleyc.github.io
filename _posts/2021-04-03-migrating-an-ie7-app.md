---
layout: post
title: "Migrating an IE7 App"
tags: [technical, ansible]
---

I recently had the experience of updating a web app designed for <abbr title="Internet Explorer 7">IE7</abbr> to additionally work in modern browsers (users use predominantly Internet Explorer or Edge). Here I note some changes I needed to make -- I couldn't find any solid documentation on differences in old versions of IE, and much was trial and error.

The application also held some interesting archaeological remnants -- it had a [check for document.all and document.layers to determine IE or NS](https://stackoverflow.com/questions/15854504/are-document-all-and-document-layers-obsolete-now), and it used `document.main` to access a form with a name of "main". Both work in modern browsers: `document.all` is supported, `document.layers` is not, and `document.main` is the same as `document.forms.main`, assuming "main" is the name and not only the ID.

## ID and Name

In IE, [getElementById](https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById) will get elements with a name of the passed string, in addition to elements with an ID of the passed string.

To fix add an ID equal to the name of the element.

## Default type of button element

In IE, the default type of a [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) element is "button". In modern browsers, the default type is "submit". This means that in an IE-designed webapp, a button inside a form that does not mean to submit the form (e.g. it opens a pop-up where the user can do something else) may not have a type, but using this functionality in a modern browser will submit the form unexpectedly.

The fix is to add an explicit `type="button"`.

## Setting the value of a select

In IE, you can set the value of a [`HTMLSelectElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement) `list` with the statement `list.options.value = 'my_val'`. In modern browsers this doesn't do anything.

The fix is to use `list.value = 'my_val'`.

## Security features

After [Chromium 69](https://www.chromestatus.com/feature/5140698722467840), `window.confirm` requests not originating on the current page are blocked automatically. This broke a [particular](https://stackoverflow.com/questions/52625420/how-to-prevent-google-chrome-from-suppressing-confirm-dialog) [workflow](https://stackoverflow.com/questions/43901822/how-to-prevent-google-chrome-suppressing-dialogs) used extensively by the app: a button used `window.open` to open another page with a form in a pop-up. On submit, that page then called `opener.document.main.o.value = document.form1.input1.value; opener.call_some_func(); self.close();` where `some_func` did more things, then called `window.confirm` for verification.

This is a tricky one to fix:
* replacing `confirm` with a different mechanism involves a more extensive rewrite than desired. Some possibilities, like using [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog), won't work in IE.
* shuffling `confirm` into the child element wasn't possible due to the flow of variables.
* it works in Edge if the developer console is open. This isn't ideal because it's a strange requirement and seems like a bug. It did hinder discovering the problem for a long while, though, especially because the error message appears in the developer console, so it's natural to have it open while debugging!
* the user can use a different browser: Firefox doesn't have the feature, and IE always worked. This isn't ideal because we'd prefer they be able to use their preferred browser.

## Microsoft-specific features

IE can use custom JavaScript extensions, such as [`@cc_on`](https://developer.mozilla.org/en-US/docs/Archive/Web/JavaScript/Microsoft_Extensions/at-cc-on)

```javascript
var xmlhttp;
/*@cc_on
@if (@_jscript_version >= 5)
  try {
    xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
  } catch (e) {
    try {
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    } catch (E) {
      xmlhttp = false;
    }
  }
@else
xmlhttp = false;
@end @*/
```

There's no recourse but to re-implement in JavaScript. In this case it's trying to produce a [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest).

## Race conditions

In IE, functions in a [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) tag may set fields elsewhere on the page -- for example, the background color -- even if the script precedes the body. Modern browsers are stricter here.

The fix is to move the code into a function called in an [onload](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onload) handler.
