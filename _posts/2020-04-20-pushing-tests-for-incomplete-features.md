---
layout: post
title:  "Using JUnit5 Extensions to allow pushing tests for code not yet implemented"
tags: [technical, java, junit]
---

**Edit 18th May 2020**: I'd now recommend just using `@Disabled("Ticket XX-111")` instead of having an entirely separate annotation with different behaviour. This means that you can search your codebase for the presence of disabled tags with closed tickets, and I think the tradeoff of this not being automated is worth the gain of not having another annotation and not running tests every build that aren't expected to pass. You could automate this with a nightly job, for example: run through, find all references to tickets, look on JIRA to see if they're closed, maybe make some metrics as to how long tests stay in this state.

---

It's helpful to have acceptance tests that you can run to confirm a feature is complete. It's also helpful to have another person write these, so you reduce the chance that an ambiguous acceptance criteria is interpreted one way or the other without considering the opposite, to increase the chance that you're delivering the version of the feature the stakeholder wants.

If the person writing the tests finishes first, the CI build will break if the changes are pushed (as the tests check functionality which is not yet implemented). It's good to get the changes in, as otherwise refactors to the test framework could wind up breaking these tests, and the person writing them will have to correct them. Also, it's nice for the person writing the functionality to have some tests available.

The person writing the tests could mark them as ignored, but that relies on the person implementing the functionality to remember to un-ignore them, and they wouldn't run as part of the build, so there's nothing helping you to remember to un-ignore them. You could tag them as a special-case, and run special-case tests separately and not fail the build if they fail, but again this doesn't help you to remember to move them over. An alternative is to use JUnit extensions (or TestRules on previous versions).

{% highlight java %}
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
@ExtendWith(NotImplementedYetExtension.class)
public @interface NotImplementedYet {}
{% endhighlight %}

{% highlight java %}
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.InvocationInterceptor;
import org.junit.jupiter.api.extension.ReflectiveInvocationContext;
import org.opentest4j.TestAbortedException;

import java.lang.reflect.Method;

public class NotImplementedYetExtension implements InvocationInterceptor {

    @Override
    public void interceptTestMethod(Invocation<Void> invocation, ReflectiveInvocationContext<Method> invocationContext,
                                    ExtensionContext extensionContext) throws Throwable {
        try {
            invocation.proceed();
        } catch (Throwable t) {
            throw new TestAbortedException("Test failed -- not expected to pass yet", t);
        }
        throw new AssertionError("Test passed -- please remove the annotation");
    }
}
{% endhighlight %}

This is used by annotating a test with `@NotImplementedYet`, and converts failures to aborts, which don't fail a build. It also converts passes to failures, so that you are required to take off the annotation if the functionality is implemented.

On the downside, this runs the tests even though they are not implemented, so builds will take longer, and if the functionality spends a long time unimplemented this is purely wasted time. It's a tradeoff -- you can get the code in sooner, and you're more likely to remember to convert the test to a normally running one, but your builds will take longer while the test fails unnecessarily.
