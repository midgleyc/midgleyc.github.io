---
layout: post
title:  "Testing without Dependency Injection"
tags: [philosophical, di, patterns]
---

Dependency Injection is a software pattern where you pass dependencies to an object, instead of creating them inside the object. Around a decade ago, it became very popular to use dependency injection for everything -- not only for swapping out dependencies at runtime (the problem it was the solution for initially) but for creating a dependency with a particular lifecycle (e.g. singleton or once per session for a webapp), replacing dependencies for testing, and even for instantiating dependencies which were always going to be the same, which were "injected" as the concrete class and "registered" as the same.

We wrote very impressive helper classes which would use reflection to search through packages for interfaces which were only implemented by one class so that we could register them at program start with our DI framework, in addition to registering every class as an instance of itself, because this allowed us to avoid explicitly registering anything. This lead to a small increase in startup time (greater the larger the numbers of packages to search), but was "worth it" because it provided the benefits that DI provided (greater testability) without having to write too much extra boilerplate.

Testing before using DI for testing
-----------------------------------

Before this wave hit, you would probably have a class that looked something like:

```java
class MyClass {
	
	MyInterface myInterface;

	MyClass() {
		myInterface = new MyInterfaceImplementation();
	}
}
```

or perhaps a class that took the implementation off a static class:

```java
class MyClass {
	MyInterface myInterface = MyInterfaceFactory.getMyInterfaceImplementation();
}
```

although static classes were becoming unpopular by this point because you couldn't mock them out in Java without tools like [`PowerMock`](https://github.com/powermock/powermock), and frequently this was treated as both a technical impossibility and a law of nature, so the restriction expanded to languages beyond Java. I think the general (over?)appreciation of mocking lead to the large take-up of DI: if the rule goes that, in order to write a proper "unit" test you need to mock all the dependencies, DI offers an excellent way to force doing just that.

As an aside: I found I wasted rather a lot of time writing unit tests with mocked out dependencies for classes which were later refactored away. I preferred later to write a "unit" test at the package level, and treat the external interface as the "thing to be tested", while all the classes inside the package remain an implementation detail. Other unit tests might be written to really nail an algorithm on an inner class, but it wasn't obligatory -- only if I feel I don't have enough confidence in the class as-is -- and if it's doing nothing but orchestrating other classes, probably not.

We're seeing a minor reversion in this use of DI for testing with the rise of languages that do allow mocking of imports -- Python has [`unittest.mock`](https://docs.python.org/3/library/unittest.mock.html) and JavaScript has Jest's [`jest.mock`](https://jestjs.io/docs/en/mock-functions.html#mocking-modules). The widespread success of the latter seems to me to indicate that not being able to mock dependencies has gone from being seen as a philosophical inability to being seen as a technical one, which is now fixed. Of course, languages before Java had the ability to mock out dependencies -- C created object files with a header file specifying the contract they met, and you could swap out the object files for different ones when it came to run your tests, so they didn't have to run the real `processCreditCard` function.

At the time, you might test a class like the one above by adding a method that allowed the dependency to be swapped out:

```java
class MyClass {
	setMyInterface(MyInterface myInterface) {
		this.myInterface = myInterface;
	}
}
```

although this was generally considered poor practice -- you shouldn't add code only used for tests. This argument didn't apply on the architectural level -- changing your entire application's architecture for improved testing is frequently considered good without any acknowledgement of tradeoffs -- the idea being that making your application more testable is a positive enough to outweigh any negatives that may arise ("more readable" is often treated the same). I remain unconvinced.

Testing by using DI for testing
-------------------------------

The DI testing advocates would say that rather than adding a method to call after the fact in your tests, you should set it up in the constructor:

```java
class MyClass {
	
	MyInterface myInterface;

	MyClass(MyInterface myInterface) {
		this.myInterface = myInterface;
	}
}
```

This allows you to instantiate your class with your mocked dependency ahead of time -- and avoids you needing to construct your original MyInterfaceImplementation, in case such a construction is expensive.

This was unpopular among some existing application developers as it would require rewriting a lot of code -- whereas previously you could instant `MyClass` directly as `new MyClass()`, now you had to instantiate it as `new MyClass(new MyInterfaceImplementation())`, even though you literally always wanted the latter. And additionally, users of `MyClass` also needed to be able to use, access and construct `MyInterfaceImplementation`, which previously was an implementation detail.

Two main solutions arose: first, to keep the existing constructor that took no arguments and instantiated the default dependencies inside itself; and second to use a DI framework that handled instantiation of all classes. The first was disliked among DI advocates for keeping part of the code untestable, and the second disliked among legacy application developers for requiring changes intended to only allow easier testing of `MyClass` to virally affect the entirety of the rest of the application.

Taking the first solution, you could expect that your existing integration tests appropriately covered the default constructor, and possible make that one (and the class) public while your DI constructor stays package private, intended to be accessible only for your tests. The complaint that you shouldn't have code used only for tests remained here -- although I didn't find the conclusion that enforcing the use of the code-only-for-tests on the rest of the application made it okay terribly convincing. One oft-noted remark that the tests and the source should construct the object the same way seemed to me to be carefully failing to notice that the source constructed the object by requesting it from a DI framework, while the tests constructed it directly. Some frameworks now do require that both the application and the tests construct classes by DI -- for example [Angular](https://angular.io/guide/testing-services) -- and I find that a lot better, as occasionally you can get issues where you've failed to test your DI and as such it breaks.

Testing without using DI for testing
------------------------------------

While reading Design Patterns (published 1994), I found a pattern that seemed a good fit for this problem -- the factory method pattern.

```java
class MyClass {

	MyInterface myInterface;

	MyClass() {
		this.myInterface = createMyInterface();
	}

	protected createMyInterface() {
		return new MyInterfaceImplementation();
	}
}
```

and then in your test, you'd create `MyClassTest extends MyClass`, and override `createMyInterface` to return a mock.

DI advocates might still argue that using DI is better because you never test the original implementation of `createMyInterface`, and so your code coverage is locked below 100% -- I could counter that the DI-based solution never tests `MyClass` with `MyInterfaceImplementation` either, and arguing code coverage based on lines of code is letting the metrics rule the implementation. You could get 100% code coverage with DI by having a configuration-only class that is potentially excluded from coverage, or by having your configuration class written in some other language (XML was popular for the original swap-out-classes-at-runtime problem), or by using some sort of package auto-scan class where you can get full code coverage without really comprehensively testing it. At the end of the day, the metrics are there to help give you confidence your code works, not to constrain you.
