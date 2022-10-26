---
layout: post
title: "Variable shadowing is good"
tags: [technical, web]
---

Variable shadowing is when you give a variable the same name as a variable that already exists. Linters and tools generally complain when you do this (e.g. [no-shadow on eslint](https://eslint.org/docs/latest/rules/no-shadow), [mypy](http://mypy-lang.org/) or TypeScript will report errors), and the language may forbid in entirely. Despite that, I find that it often makes code easier to read, instead of harder.

One thing I like to do is change the type of a variable:
```ts
function doSomething(data: Data) {
  users = data.users
  users = data.users.map(mappingFunction)
  if (users.some(x => x.isSpecial())) {
    users = users.map(otherMappingFunction)
    doSomethingElseWith(users)
  }
  doAnotherThingWith(users)
}
```

If you can't shadow, you have to include the types or give the variables awkward names:
```ts
function doSomething(data: Data) {
  users = data.users
  mappedUsers = data.users.map(mappingFunction)
  if (mappedUsers.some(x => x.isSpecial())) {
    differentMappedUsers = mappedUsers.map(otherMappingFunction)
    doSomethingElseWith(differentMappedUsers)
  }
  doAnotherThingWith(mappedUsers)
}
```

This happens especially often when I receive a collection of some type and want to convert it into a different collection, or when I receive an Option type and want to check if it contains a value, and extract it if so. In this case, I often wind up calling the Option variable `variableOpt` to be able to use `variable` for the extracted value.

The argument given for avoiding variable shadowing is that the user might get confused as to what type a variable is(e.g. they might think that the `users` passed to `doSomethingElseWith` and `doAnotherThingWith` are the same object).  In practice, I don't have this problem. I think after you learn the model of how it works:
* the latest declaration wins, except
* a new block creates a new scope that doesn't persist beyond the end of the block
you can look upwards for the closest declaration in the same block and it's easy to figure out. Also, as IDEs get better I find that I rely on my tools to tell me the type of a variable instead of guessing it myself.

One other argument is that a user seeing multiple variables with the same name across a large function might assume they are related. I agree this is potentially a problem, though one that tools can help with. In general, most cases where I'm interested in variable shadowing, the duplicates occur in very quick succession.

This post was inspired by coding in Rust, which is one of the only typed languages I've seen to allow variable shadowing, which can be quite convenient.
```rust
if let Some(x) = x {
  let x = i32::from(x);
  return x.into();
}
```
