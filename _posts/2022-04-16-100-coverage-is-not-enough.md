---
layout: post
title: "100% coverage is not sufficient"
tags: [technical, java]
---

I recently posted a [pull request](https://github.com/kolmafia/kolmafia/pull/701) that I was certain would work correctly as I had 100% code coverage. I was mistaken.

As part of this I had converted a loop construct, like
```java
long meatCount = 0;

for (int i = 0; i < itemList.length; ++i) {
  AdventureResult item = itemList[i];
  if (item.getName().equals(AdventureResult.MEAT)) {
    meatCount += item.getLongCount();
    itemList[i] = null;
  }
}

if (meatCount > 0) {
  int moveType = isTake ? ClosetRequest.MEAT_TO_INVENTORY : ClosetRequest.MEAT_TO_CLOSET;
  RequestThread.postRequest(new ClosetRequest(moveType, meatCount));
}
```

into a stream construct, like
```java
var split = Arrays.stream(itemList).collect(Collectors.partitioningBy(AdventureResult::isMeat));
var meat = split.get(true);
var items = split.get(false);

if (meat.size() > 0) {
  int meatCount = meat.stream().map(AdventureResult::getCount).mapToInt(Integer::intValue).sum();
  if (meatCount > 0) {
    int moveType = isTake ? ClosetRequest.MEAT_TO_INVENTORY : ClosetRequest.MEAT_TO_CLOSET;
    RequestThread.postRequest(new ClosetRequest(moveType, meatCount));
  }
}
```

Fortunately an eagle-eyed reviewer spotted the issue: I converted a long into an int, so calls with, say, 3 billion meat would fail (int max being 2,147,483,647).

While we had coverage for every line and branch, we didn't have coverage for data past the boundary of that accepted by an int. I think static testing might struggle to determine this was necessary: the function itself takes a string that gets parsed. Fuzz testing might find it, with suitable inputs.

Sometimes, 100% line coverage is not necessary, either. In Java, the [`URL` constructor](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/net/URL.html#%3Cinit%3E(java.lang.String,java.lang.String,int,java.lang.String)) can throw a `MalformedURLException` in the case of an unknown protocol, but is guaranteed to succeed for the protocols `http`, `https`, `ftp`, `file` and `jar`. Due to checked exceptions, a constructor that uses one of these still needs to `try`-`catch` the exception, but the code in the catch clause can never be hit.

A similar problem was present with charsets prior to the introduction of [`StandardCharsets`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/charset/StandardCharsets.html) in Java 7.
