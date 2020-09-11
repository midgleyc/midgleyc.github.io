---
layout: post
title:  "Importing modules into a browser REPL"
tags: [technical, javascript]
---

It can be useful to import a module for a single session without saving it as a scratchpad, or to be able to use it against a webpage.

Browsers support top-level await and ESM URL import, which are the keys to this. [JSPM](https://jspm.org/) is a CDN that allows you to import any library as an ESM.

Suppose you want to import the latest version of `request`.

```javascript
var request = await import('https://jspm.dev/request')
```

You can then extract the core `request` as `request.default`. You can import a particular version by changing the url -- e.g. `https://jspm.dev/request@2.27.0` for 2.27.0.

You can also import ESMs from other CDNs, such as [Skypack](https://www.skypack.dev).

This isn't yet possible in Node (14) -- while ESMs are supported with the `--experimental-modules` flag, they can only be imported if [already saved or as data URIs](https://nodejs.org/api/esm.html#esm_import_specifiers), not by URLs. Top-level await is supported with the `--experimental-repl-await` flag.
