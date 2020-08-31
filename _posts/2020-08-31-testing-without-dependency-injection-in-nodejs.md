---
layout: post
title:  "Testing without Dependency Injection: NodeJS"
tags: [technical, di, patterns]
---

NodeJS offers the ability to overwrite methods and values in imported modules. This can be useful for [testing without dependency injection]({% post_url 2020-08-12-testing-without-dependency-injection %}), for example if you have a large amount of legacy code, and you don't want to refactor the architecture before the unit tests are in place.

Suppose we have a file `child.js` exposing something we may want to mock out:

```javascript
module.exports = {
  getUrl() {
    return 'http://example.com'
  },
}
```

and another file `parent.js` that uses said value:

```javascript
const child = require('./child')
const url = child.getUrl()

function subName(sub) {
  return url + '/' + sub
}
    
module.exports = { subName }
```

and a simple test `parent.test.js` using `mocha` could look something like:

```javascript
const assert = require('assert')
const parent = require('./parent')

describe("Sub", function() {
  it("should return sub when not mocking", function() {
    assert.equal(parent.subName('sub'), "http://example.com/sub")
  })
})
```

There would be little point mocking out something used only as a string such as this -- a more serious example would involve accessing a URL, or more commonly a database URL. This also has something of an ideal architecture -- if `child.js` exposed getUrl as `module.exports.default`, we wouldn't be able to mock it straightforwardly, instead having to use a more complicated process, such as [`proxyquire`](https://www.npmjs.com/package/proxyquire).

Use a Library
-------------

The easy option is to use a library somebody else has already written for this purpose: for example, here's a `proxyquire`-based test:

```javascript
const assert = require('assert')
const proxyquire = require('proxyquire')
const child = {
  getUrl: () => 'http://bar.com'
}
const parent = proxyquire('./parent', {'./child': child})

describe("Sub", function() {
  it("should return mocked when mocking", function() {
    assert.equal(parent.subName('test'), "http://bar.com/test")
  })
})
```

At the expense of a small amount of speed and an external dependency, this saves you from many footguns you might otherwise hit: e.g. resetting the mocking after the test, depopulating the require cache, handling module-level variables hanging off the require. You can win back the speed, as these tests don't have to be permanent -- after you've got the unit tests in place to assure you your changes won't break anything, you can refactor `parent.js` to turn it into a class, where you can use DI or factory methods:

```javascript
const child = require('./child')

class Parent {
  constructor(url) {
    this.url = url || this.getUrl()
  }

  subName(sub) {
    return this.url + '/' + sub 
  }

  getUrl() {
    return child.getUrl()
  }
}

const parent = new Parent(child.getUrl())

module.exports = { Parent, subName: parent.subName }
```

Do It Yourself
--------------

Perhaps you can't use a pre-existing library: perhaps the file is complicated and the library too slow, or perhaps your project forbids all third-party libraries.

Naively, we want something like the following:

```javascript
const assert = require('assert')

describe("Sub", function() {
  it("should return sub when mocking", function() {
    const child = require('./child')
    child.getUrl = () => 'http://bar.com'
    const parent = require('./parent')
    assert.equal(parent.subName('test'), "http://bar.com/test")
  })
})
```

This test passes alone, but leaves the system in a sorry state -- adding back our "should return sub when not mocking" test from above to run *after* this one reveals that child's `url` is still mocked. We might think we could fix it by reverting the mock:

```javascript
const assert = require('assert')

describe("Sub", function() {
  it("should return mocked when mocking", function() {
    const child = require('./child')
    const stored = child.getUrl
    child.getUrl = () => 'http://foo.com'
    const parent = require('./parent')
    assert.equal(parent.subName('test'), "http://foo.com/test")
    child.getUrl = stored
  })
})
```

and this would work if `parent.js`'s `subName` method recalculated `child.getUrl` inline -- but doesn't work if, as it is, `parent.js` stores the calculated URL in a variable. In order to fix that, we need to clear the require cache to ensure that the modules are correctly re-imported and the variables re-calculated.

```javascript
Object.keys(require.cache).forEach((key) => {
  if (key.endsWith('child.js') || key.endsWith('parent.js')) delete require.cache[key]
})
```

This is a bit slower than a simple reassignment of the mocked import -- if speed is more important in your tests than your live code, you could consider moving the calculation of the child element into the scope of the individual functions, and out of the module itself. If speed is important in both your tests and your live code, and regenerating in your live code is slow enough to worry about, consider pre-emptively caching the value at system start and using that from then-on, assuming it can't change while the system is running.
