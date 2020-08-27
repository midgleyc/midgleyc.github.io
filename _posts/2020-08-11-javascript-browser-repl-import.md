---
layout: post
title:  "Importing modules into a browser REPL"
tags: [technical, javascript]
---

It can be useful to import a module for a single session without saving it as a scratchpad, or to be able to use it against a webpage.

Browsers support top-level await and ESM URL import, which are the keys to this. Snowpack is a CDN that allows you to import any library as an ESM.

Suppose you want to import the latest version of `moment`.

```javascript
var momentModule = await import('https://cdn.skypack.dev/moment')
```

You can then extract the core `moment` as `momentModule.default`. You can import a particular version by changing the url -- e.g. `https://cdn.skypack.dev/moment@2.25.3` for 2.25.3.

You can search for particular packages on [Skypack](https://www.skypack.dev).

This isn't yet possible in Node (14) -- while ESMs are supported with the `--experimental-modules` flag, they can only be imported if [already saved or as data URIs](https://nodejs.org/api/esm.html#esm_import_specifiers), not by URLs. Top-level await is supported with the `--experimental-repl-await` flag.
