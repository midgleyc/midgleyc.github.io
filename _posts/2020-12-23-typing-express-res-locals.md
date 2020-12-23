---
layout: post
title:  "Typing Express' res.locals in TypeScript"
tags: [technical, typescript, express, nodejs]
---

TypeScript is a good tool to use to prevent bugs in the inconsistent use of variables by ensuring that they're all of the same type, at least. By default, this restriction does not apply to Express' `res.locals`, which is a map of `string` to `any`. This can lead to issues, as `res.locals` can be set in middleware or earlier routers quite distant from where it is used, which can be hard to notice, and units tests often mock the data, and so it can't be noticed that way either. This post shows a way to add types to `res.locals`.

Creating the types
------------------

Create a file `express.d.ts` somewhere where it'll be picked up by your `tsconfig.json`. This will use [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to add new properties to Express.

```typescript
export interface Locals {
  errors?: Array<{code?: number, message: string}>
  title?: string
}

export as namespace Express
export = Express

declare namespace Express {
  export interface Response {
    typedLocals: Locals
  }
}
```

Your `Locals` interface should contain all the types you want to use with `res.locals`. You should access `res.locals` and `res.typedLocals`: I didn't succeed trying to override `res.locals` directly: I assume that `Locals` and `Record<string, any>` are merged into `Record<string, any>` which is unhelpful.

Assigning the property
----------------------

Add to your first bit of middleware, or just to the initial startup (given a `const app = express()` somewhere):

```typescript
app.use((_req, res, next) => {
  res.typedLocals = res.locals
  next()
})
```

Preventing untyped use
----------------------

Use a linting tool to disallow direct access to `res.locals`. Here's an example using `eslint`:

In `package.json`:

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^4.10.0",
    "@typescript-eslint/parser": "^4.10.0",
    "eslint": "^7.15.0",
    "eslint-plugin-regex": "^1.2.1",
    "typescript": "^4.1.3"
  }
}
```

In `.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint",
    "regex"
  ],
  "parserOptions": {
    "ecmaVersion": 2020
  },
  "rules": {
    "regex/invalid": [
      "error", [
        {
          "regex": "res\\.locals",
          "message": "To ensure types, please use `res.typedLocals`",
          "files": {
            "ignore": ".*\\.js"
          }
        }
      ]
    ]
  }
}
```

Here we set up a regex to disallow `res.locals`, counting on `res` as the conventional name for a response object in Express. It won't stop someone determined to go around it, but should catch most cases. If you have a different conventional name for a response object, update the regex to refer to it.

We ignore `.js` files as, in the case of a mixed TypeScript / JavaScript project, the JavaScript files can continue using `res.locals` as before. If you plan on migrating to TypeScript relatively soon it might be worth having them all use `res.typedLocals`, but if you don't you can avoid churn by leaving them as they are.

You'll need to update your middleware:
```typescript
app.use((_req, res, next) => {
  // eslint-disable-next-line regex/invalid
  res.typedLocals = res.locals
  next()
})
```

Possible modifications
----------------------

The keys of the interface can either be allowed to be undefined or not. If they are allowed to be undefined, you should check whether they're available when you call them, using one of an `assert`, an `if` check, or a non-null assertion `res.typedLocals.property!`. I find the last makes the code the cleanest, but it does remove some of TypeScript's ability to help you, so be aware of that.

If they are not allowed to be undefined, the initial assignment of `res.locals` to `res.typedLocals` won't work unless you type `res.locals`:

```typescript
res.typedLocals = res.locals as Locals
```

but from then on you can use all the keys without having to check their presence. Again, this means that TypeScript will assume that all keys are always present which is often not correct, so be aware of the meaning of your choice here.

Instead of accessing through `res.typedLocals`, you can access through `res.locals` appropriately casted. For example:

```typescript
const locals = res.locals as Locals
locals.title = 'The Title'
```

One downside of this is that you can't forbid creative untyped assignments from `res.locals`:

```typescript
const { title } = res.locals
```
