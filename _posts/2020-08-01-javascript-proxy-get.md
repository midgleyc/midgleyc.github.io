---
layout: post
title:  "Using JavaScript's Proxy to add methods to a data object"
tags: [technical, javascript]
---

Assume we have a document obtained from a database as a JSON object, and we want to add additional properties, or override existing properties, preferably without modifying the original object.

Modifying the source
--------------------

If we know that we can modify the original object, we can check add the property, possibly after checking for its existence to make sure we don't replace it if it's already there:

```javascript
if (!user.hasOwnProperty('isAdmin')) {
  user.isAdmin = user.roles.includes('Admin')
}
```

This would evaluate the roles at the time of the function call, though. To avoid that we could use a function, or more elegantly a `get` property.

```javascript
Object.defineProperty(user, 'isAdmin', {
  get() {
    return this.roles.includes('Admin')
  }
})
```

Not modifying the source
------------------------

If the original object has no functions you might want to keep, you can do a deep or shallow copy to get a new object, then apply the methods in the previous section.

```javascript
const newUserShallow = {...user}
const newUserDeep = JSON.parse(JSON.stringify(user))
```

If not, you can use a Proxy.

```javascript
const UserHandler = {
    get: (target, propKey, receiver) => {
        switch(propKey) {
            case "isAdmin":
                return target.roles.includes('Admin')
            default:
                return Reflect.get(target, propKey, receiver);
        }
    }
}

function createUser(user) {
  return new Proxy(user, UserHandler)
}

const User = createUser(user)
```

For aesthetics, I like to export a constructor-like object you use with `new`:

```javascript
const User = new Proxy(Object, {
    construct: (target, userArgs) => new Proxy(...userArgs, UserHandler)
})

user = new User(user)
```

This exposes an interesting feature about proxying constructors -- while the target passed to the proxy needs to be Object-like, it doesn't have to be used in the construction!
