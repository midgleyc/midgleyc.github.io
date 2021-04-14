---
layout: post
title:  "Aborting a Cucumber rerun of failed tests if too many failed"
tags: [technical, java, cucumber]
---

Cucumber [allows you to rerun failed tests](https://stackoverflow.com/a/38709873/2591803) by defining a test runner that specifies the features to run to be those with failed last time, as output by the built-in rerun plugin. We wanted to fail the build entirely if too many tests failed the first run, as we found tests weren't being fixed (they would always fail the first time, refresh the database, and pass the second time: some earlier tests weren't properly cleaning up after themselves).

The rerun text file looks something like this:

```conf
file:src/test/resources/features/Login.feature:59
file:src/test/resources/features/CreateUser.feature:7:63
```

This contains one line per failing feature, followed by colon separated line numbers for the failing scenarios. The number of failing tests is the number of colon-separated line numbers. Calculating this is quite simple, e.g. with awk:

{% highlight bash %}
awk --field-separator=: '{s += NF - 2}END{print s}' failures.txt
{% endhighlight %}

As members of the team generally aren't familiar with Bash, it was preferable to do it in a language they already knew, such as Java. Running with JUnit, as we were, you can put `@BeforeClass` methods directly in the test runner:

{% highlight java %}
@RunWith(Cucumber.class)
@CucumberOptions(
		features = "@target/cucumber/initial-run/failures.txt",
		glue = "stepDefinition")
public class RerunFailedTests
{
	private static final long MAX_FAILED_TESTS = Long.parseLong(System.getProperty("rerunFailureLimit", "5"));

	@BeforeClass
	public static void beforeTests() {
		Path reruns = Path.of("target", "cucumber", "initial-run", "failures.txt");
		int numberOfTests = countTests(reruns);
		if (numberOfTests > MAX_FAILED_TESTS) {
			Assert.fail("Too many failed tests! Expected at most " + MAX_FAILED_TESTS + ", but there were " + numberOfTests);
		}
	}

	private static int countTests(Path reruns) {
		List<String> text;
		try {
			text = Files.readAllLines(reruns);
		} catch (IOException ex) {
			// could not find file, perhaps there were no failures, this is fine
			return 0;
		}
		return text.stream().mapToInt(line -> line.split(":").length - 2).map(i -> Math.max(i, 0)).sum();
	}
}
{% endhighlight %}

This allows a `-DrerunFailureLimit` parameter to be passed to a `mvn test` call that calls this runner (using `-Dtest=RerunFailedTests`, for example) to determine how many tests can have failed before this runner will abort the entire test process with a failure.

Doing it this way instead of in Bash adds a small amount of overhead, as the test runner needs to start up and parse its configuration before you can get to calling the `@BeforeClass` method that tells it to potentially abort.
