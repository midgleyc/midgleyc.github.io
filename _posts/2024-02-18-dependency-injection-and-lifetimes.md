---
layout: post
title:  "Dependency Injection and Lifetimes"
tags: [philosophical, di, patterns]
---
Dependency Injection is useful in the case where you want to manage lifetimes of instances of classes you request. Using the Microsoft DI terminology, we can call these "Singleton", "Scoped" and "Transient". Singleton is where you want the same instance every time you ask for one. Transient is where you always want a new instance of a class. Scoped is where it gets interesting -- under some condition, you want the same instance, under different circumstances you want a different one. For web applications, this tends to be a single request -- inside a request, you want the same instance; otherwise you want a new one.

This also applies to dependencies of classes requested. If I ask for an instance of class A, which is registered with a Transient lifetime, but A contains an instance of B which is registered with a Scoped lifetime, I should get the same B while I'm in the same request.

Sometimes those dependencies are implicit. For example, suppose you have a method call `Datetime.now()` to get the current date (and time). This will change as time passes. You can consider `Datetime` to be a Singleton instance dependency of the caller.

If you don't have Scoped lifetimes, this can be imagined as the pre-DI architectural style: when you want a Transient instance, you call `new MyTransient()`, and when you want a Singleton instance, you either implement the Singleton pattern and call `new MySingleton()`, or you just put it in a static class where you can reference it globally: `Statics.MySingleton`.

In this case, the desire for DI is often driven by tests, which is the one case where a Singleton might want to be registered with a different lifetime. Over the course of an application, sharing things like "what time is it?" is perfectly reasonable -- but a test might desire to run with a particular time for consistency and checking unusual cases. Additionally, some tests might set global values which other tests assume have default values -- that is, the data "leaks" between tests.

However, rearchitecting an application to use DI is rather a large task. In this case, a smaller refactor will suffice. Mocks can also be used, but this may have a significant performance penalty (from testing, >5 seconds compared to ~80 ms).

First, ensure that all static DateTime calls go through a utility class:
```java
public class DateTimeManager {
  public static final ZoneId ARIZONA = ZoneId.of("GMT-0700");

  public ZonedDateTime getArizonaDateTime() {
    return ZonedDateTime.now(ARIZONA);
  }

  public DateTimeManager() {}
}
```

Second, create a Globals static class to contain the singleton:
```java
public class Globals {
  private Globals() {}

  public static DateTimeManager DateTimeManager = new DateTimeManager();

  static void setDateTimeManager(DateTimeManager dtm) {
    DateTimeManager = dtm;
  }
}
```

In Java, we can use package-private visibility to make it more likely that nothing outside test classes will overwrite the DateTimeManager. In languages that don't have this (or something similar, like the ability to only compile the method when running for tests), you just have to be careful not to call it outside tests. There are many libraries which offer functions to enforce this, but in practice I find that if you tell your team to not do something, they don't.

Third, create a `TestDateTimeManager` (reminiscent of the [factory method pattern](https://midgleyc.github.io/2020/08/12/testing-without-dependency-injection)) to override the time under certain circumstances:
```java
public class TestDateTimeManager extends DateTimeManager {
  private LocalDateTime time;

  public ZonedDateTime getArizonaDateTime() {
    return ZonedDateTime.of(time, ARIZONA);
  }

  public TestDateTimeManager(LocalDateTime time) {
    this.time = time;
  }
}
```

Fourth, create a `TestGlobals` (in the same namespace as Globals) which your test methods are going to use to temporarily override the date time manager:
```java
public class TestGlobals {
  public static void setDate(LocalDateTime time) {
    Globals.setDateTimeManager(new TestDateTimeManager(time));
  }

  public static void setDateTimeManager(DateTimeManager dtm) {
    Globals.setDateTimeManager(dtm);
  }
}
```

Subsequently, you can set up your tests to use a particular date when testing, e.g.

```java
public class SetBoringDay implements BeforeAllCallback {

  @Override
  public void beforeAll(ExtensionContext context) {
    if (isNested(context)) return;
    SetBoringDay.setDay();
  }

  public static void setDay() {
    // a boring day in which nothing special happens
    TestGlobals.setDate(LocalDateTime.of(2023, Month.AUGUST, 1, 12, 0));
  }
}
```

or use try-finally in the tests themselves to temporarily override the `DateTimeManager`.
