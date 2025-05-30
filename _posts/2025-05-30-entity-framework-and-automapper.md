---
layout: post
title:  "EntityFramework and AutoMapper"
tags: [technical, c#, dotnet, entityframework, automapper]
---

When using AutoMapper to convert a input JSON document to a model object used in EntityFramework, attempting to update an existing value can lead to issues because the mapped object lacks references to the existing database -- models returned by EntityFramework are special, and attempting to save a model object without these can lead to conflicts.

At a basic level, you can use
```csharp
context.Entry(existing).CurrentValues.SetValues(updated);
```

to overwrite all simple values with values from a new object. However, this can still have issues with lists of other objects, which may be cached.

Assuming you get all the models from the database:
```csharp
var existing = await context.Parents.Include(p => p.Children).FirstOrDefaultAsync(p => p.Id == updated.Id);
```

you can update the children by iterating over them and checking for matching or missing IDs

```csharp
public static void UpdateChild<T, TChildClass>(this DbContext context, T updatedParent, T existingParent,
    Func<T, ICollection<TChildClass>> getChildren,
    Action<T, TChildClass> setId,
    Func<TChildClass, TChildClass, bool> matchChild
)
    where T : class
    where TChildClass : class
{
    foreach (TChildClass child in getChildren(updatedParent))
    {
        setId(updatedParent, child);
        TChildClass? existingChild =
            getChildren(existingParent).FirstOrDefault(p => matchChild(p, child));

        if (existingChild == null)
        {
            getChildren(existingParent).Add(child);
            context.Set<TChildClass>().Add(child);
        }
        else
        {
            context.Entry(existingChild).CurrentValues.SetValues(child);
        }
    }

    foreach (TChildClass child in getChildren(existingParent))
    {
        if (!getChildren(updatedParent).Any(p => matchChild(p, child)))
        {
            context.Remove(child);
        }
    }
}
```

called like

```csharp
context.UpdateChild(parent, existingParent,
    (p) => p.Children,
    (p, c) => { c.ParentId = p.Id; },
    (c1, c2) => c1.Id == c2.Id);
```
