---
layout: post
title: "Statement injection in C#"
tags: [technical, c#, dotnet, security]
---

We have a system that allows a user to write a single statement to be evaluated with a subset of C#: something like 

```c-sharp
using System;

namespace Evaluation {
  public class _Evaluator {
    public {0} {1}() {
      return ({2});
    }
  }
}
```

and then returning `(new _Evaluator()).{1}()`, where `{0}` is constrained to be an `int`, `double` or `string`.

The statement takes inputs `$1`, `$2`, `$3`, etc. Often, it's used to calculate something simple:
* `$1`
* `$1 + $2`
* `$1 >= 1.0 ? $1 : "LOD"`

Sometimes, the user wants something more complicated. We have a few custom functions like `Sum`, `Avg` and `Min`/`Max`, and we can call out to some C# functions like `Math.Round`. We can also deploy new functions, which is the 'right' way to solve these problems, but the product in question is legacy and new deployments are difficult and preferably avoided.

A recent complicated example is "sum all of these variables, provided they are greater than 1". If there are a small number of variables, you can do this with a stacked ternary:
```c-sharp
$1 > 1 && $2 > 1 ? $1 + $2 : $1 > 1 ? $1 : $2 > $1 ? $2 : 0
```
or
```c-sharp
$1 > 1 ? $2 > 1 ? $1 + $2 : $1 : $2 > 1 ? $2 : 0
```
but this is unreadable and very difficult to write for larger numbers of variables.

Preferably, we'd use LINQ:
```c-sharp
(new double[] {$1, $2, $3}).Where(x => x >= 1.0).Sum()
```
but this requires a `using System.Linq` that the existing deployment didn't have. I tried using the full `System.Linq.Where`, but couldn't get that to compile. I wanted to add a `using` inside the function, but you can't add a `using` after a namespace, or create a new namespace, so this is a no-go.

My next thought was from JavaScript: could I create an IIFE-like anonymous function, giving me access to expressions instead of statements, and call it immediately?

```c-sharp
() => {
  double sum = 0;
  foreach (var item in new double[] {$1, $2, $3}) {
    if (item >= 1.0) sum += item;
  }
  return sum;
}()
```

Unfortunately that doesn't work, giving the error `CS0149: Method name expected`.

Fortunately, [the fix](https://stackoverflow.com/questions/3923864/how-to-call-anonymous-function-in-c) is quite simple: wrap the lambda in a `new Func`:

```c-sharp
new Func<double>(() => [...])()
```

This let us compute a "small sum" of 17 variables without having to do a new deployment or write an unreadable ternary, which was much appreciated!
