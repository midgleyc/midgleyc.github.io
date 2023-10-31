---
layout: post
title: "Performance"
tags: [philosophical, technical]
---

Performance is one of the properties of a program that the learned developer has a quote at hand to discount -- as premature optimisation is the root of all evil (carefully omitting the second part of the quote). The natural consequence is that code is written to be more readable (as code is written once, but read many times), with better variable names (good code is self-documenting) and more reusability (Don't Repeat Yourself), but as performance is not a concern, it is ignored (or occasionally worked against, preferring developer experience over user experience).

I read a Hacker News post recently talking about Google interviews, and the poster mentioned that Data Structures & Algorithmic knowledge was vital, as this generated most performance improvements. I don't think that meshes with my experience (I would expect network / IO code), and I have a project at hand to check. About 80% of these came from profiling; the others were from using the program and considering likely issues.

# Algorithmic (Needless Work)

- [only change ascension class if different](https://github.com/kolmafia/kolmafia/pull/1227) -- avoid an expensive process call if nothing would change. This is going to be a common theme, which I'll call "needless work" for short.
- [only change location if different](https://github.com/kolmafia/kolmafia/pull/1246) -- same as the above (but removing even more unnecessary calls), but for another part
- [avoid checking a complex regex if it can't be present](https://github.com/kolmafia/kolmafia/pull/1259) -- a certain quick-check condition allows a message to be present at all, so check that before the complex regex
- [reduce frequency of name to id to name conversions](https://github.com/kolmafia/kolmafia/pull/1265) -- don't look up the same ID repeatedly
- [cache UTF-8 encoded preference values in memory](https://github.com/kolmafia/kolmafia/pull/1275) -- these values were saved to a file very frequently, and the encoding itself took a decent proportion of time
- [cache passive skill modifiers](https://github.com/kolmafia/kolmafia/pull/1290) -- the maximizer, an absurdly complicated part of the engine, was recomputing passive skill modifiers every run, while they (almost) never changed
- [cache UTF-8 encoded mall price lines in memory](https://github.com/kolmafia/kolmafia/pull/1382) -- these values were _also_ saved to a file very frequently, and the encoding itself took a decent proportion of time

- [cache skill modifiers, and keep ids around to avoid multiple lookups](https://github.com/kolmafia/kolmafia/pull/1395) -- more caching, and more avoidance of looking up the same ID multiple times

# Algorithmic (Bulk Updates)
- [defer GearChangeFrame updates](https://github.com/kolmafia/kolmafia/pull/1230) -- when getting current equipment, instead of setting each piece individually and updating the frame at the time, set each piece and then update the frame in bulk. This is sort of algorithmic but isn't the standard Big O improvement, but about doing bulk updates instead of individual ones
- [read cached data instead of doing an expensive computation](https://github.com/kolmafia/kolmafia/pull/1245) -- area combat data is stored for each area with a list of monsters, and the function was formerly getting all areas with a particular monster (i.e. reading over every area) and checking if a particular area was present. It's much faster to just read off the specific area's combat data (even though that involves a list instead of a set).
- [buffer the mall price output stream instead of flushing every line](https://github.com/kolmafia/kolmafia/pull/1388) -- buffering leads to an order of magnitude increase in efficiency for file I/O

# Algorithmic (Wrong Abstraction)

- [use JLabel methods instead of HTML for foreground colors](https://github.com/kolmafia/kolmafia/pull/1381) -- HTML is simple and well-understood, but isn't required to render a foreground color
- [use JLabel methods instead of HTML for spacing and newlines](https://github.com/kolmafia/kolmafia/pull/1387) -- this lead to a slight change in the layout, but was faster to render

# Data Structures
- [remove IntegerPool class](https://github.com/kolmafia/kolmafia/pull/722) -- a small improvement in memory usage and a tiny improvement in performance by removing an eagerly computed cache of values between -2 and 13000. This might have been a good idea in Java 4 when the application was first developed, but wasn't in Java 11 when I removed it.
- [use CaseInsensitiveHashMap over TreeMap](https://github.com/kolmafia/kolmafia/pull/1231) -- a pure data structure improvement
- [use CaseInsensitiveHashMap over TreeMap, and sort only on read](https://github.com/kolmafia/kolmafia/pull/1240) -- another data structure improvement with a small "bulk update" addition: instead of sorting on each addition, sort when we need to use the values
- [store a single object in a Map\<Integer, Custom\> instead of one map for each primitive field](https://github.com/kolmafia/kolmafia/pull/1235) -- pure data structures simplification. This also allowed items to be passed around between methods instead of passing around an ID and looking it up in various maps
- [make an efficient sorted collection for concoctions](https://github.com/kolmafia/kolmafia/pull/1380) -- change strategy based on number of additions: for a low number, use binary search to find the insertion point for each individually; for a high number add all then sort the list. Also, an awareness of Big O here to find the breakpoint.
- [store modifiers sparsely if there aren't many](https://github.com/kolmafia/kolmafia/pull/1394) -- use a custom collection for modifiers that uses a sparse TreeMap when small, and a dense array when large. Later, this [switched](https://github.com/kolmafia/kolmafia/pull/1450) to a sparse TreeMap and a dense EnumMap.

# Other

- [migrate from HTTP/1.1 to HTTP 2](https://github.com/kolmafia/kolmafia/pull/653) -- a massive improvement in speed for users not in the USA, with proportionally better increases the greater the distance. Mostly swapping glue code, with a tiny amount of networking knowledge (HTTP headers are case insensitive)

So in conclusion, I was wrong: data structure specifics were heavily involved in the performance improvements, and while Big O-style algorithms weren't, concepts like needless work and bulk updates were. Caching also made an appearance.
