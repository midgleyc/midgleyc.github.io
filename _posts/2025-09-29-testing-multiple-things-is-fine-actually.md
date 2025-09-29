---
layout: post
title:  "Testing Multiple Things is Fine Actually"
tags: [technical, java]
---

For many years, there was a prescriptive drive in designing tests: Tests Should Test Only One Thing. Preferably, you put that in the name: `shouldFooTheBar`, and then test exactly that. And if the same process should also foo the qux, that's a different test.

That is, if you have

```java
@Test
void shouldFooTheBarAndBaz() {
  var cleanup = setup();
  try (cleanup) {
    var result = execute();
    assertThat(result.bar.isFooed(), is(true));
    assertThat(result.baz.isFooed(), is(true));
  }
}
```

you should split it

```java
@Test
void shouldFooTheBar() {
  var cleanup = setup();
  try (cleanup) {
    var result = execute();
    assertThat(result.bar.isFooed(), is(true));
  }
}

@Test
void shouldFooTheBaz() {
  var cleanup = setup();
  try (cleanup) {
    var result = execute();
    assertThat(result.baz.isFooed(), is(true));
  }
}
```

and often the reason given is something like "this way, if the test fails you can tell exactly what's wrong". I've never been impressed by this argument: if something fails, you run the tests, identify the failing line, fix it, run the tests again -- and you do this even if you can already see which test failed. Ideally the tests are running fast enough that this takes barely any time.

A downside of the splitting is that there's more code to read and more code for your eyes to glaze over. It's not immediately clear the two tests are related at a glance. Also, if the setup is expensive, running the tests takes longer than it should. You can fix these problems by making the code even more complicated:

```java
@Nested
class Execute {
  Cleanup cleanup;

  @BeforeAll
  static void beforeAll() {
    this.cleanup = setup();
  }

  @AfterAll
  static void afterAll() {
    this.cleanup.close();
  }

  @Test
  void shouldFooTheBar() {
    var result = execute();
    assertThat(result.bar.isFooed(), is(true));
  }

  @Test
  void shouldFooTheBaz() {
    var result = execute();
    assertThat(result.baz.isFooed(), is(true));
  }
}
```

and there is some elegance to this, but I still prefer the short 5-line method we started with. I think it's a lot more readable.

Frequently, this position changes "don't test more than one thing" into "don't have multiple setup steps". I think this is reasonable, but also I am okay with having multiple setup steps sometimes. Sometimes I think you want it to test that code path (more of an end-to-end test describing how a user would actually interact with the system), and sometimes you want a big test for "all the basic stuff works", where if anything higher fails you truly don't want to waste time running the additional tests. Sometimes you want a quick assert ensuring that your setup actually set things up correctly before you move onto the real test (testing your tests), and the assert improves your certainty the test works properly when kept in.

Essentially, I don't think it's worth being dogmatic about this. Left alone with all the time in the world you can really start ivory towering your tests, and most of these rewrites aren't actually beneficial in practice.
