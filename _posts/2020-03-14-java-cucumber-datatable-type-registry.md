---
layout: post
title:  "Getting DataTables to map to classes in Cucumber version 4 and above"
tags: [java, cucumber]
---

In Cucumber 2 and below, you could reference classes containing primitive elements in step definitions, and data tables would be mapped automatically.

{% highlight gherkin %}
  Scenario: I can search for a reference using multiple search terms which returns multiple results
    Given I make a search
    Then I expect the following data in the results
      | id    | title                       |
      | 10011 | My first fantastic result   |
      | 10023 | My second stupendous result |
      | 10037 | My third terrific result    |
{% endhighlight %}

{% highlight java %}
@Then("^I expect the following data in the results$")
public void iExpectTheFollowingDataInTheResults(List<SearchResult> results)
{
    /*
     * results = [
     *   SearchResult(id=10011, title="My first fantastic result")
     *    SearchResult(id=10023, title="My second stupendous result")
     *     SearchResult(id=10037, title="My third terrific result")
     * ]
     */
}
{% endhighlight %}

In Cucumber 3 and above, this ceases to work, and gives an error message:
```
cucumber.runtime.CucumberException: Could not convert arguments for step [^I expect the following data in the results$] defined at 'stepDefinition.SearchSteps.iExpectTheFollowingDataInTheResults(SearchResult>) in file:/C:/myproject/target/test-classes/'.
It appears you did not register a data table type. The details are in the stacktrace below.
	at cucumber.runner.PickleStepDefinitionMatch.registerTypeInConfiguration(PickleStepDefinitionMatch.java:59)
	at cucumber.runner.PickleStepDefinitionMatch.runStep(PickleStepDefinitionMatch.java:44)
	at cucumber.runner.TestStep.executeStep(TestStep.java:65)
	at cucumber.runner.TestStep.run(TestStep.java:50)
	at cucumber.runner.PickleStepTestStep.run(PickleStepTestStep.java:43)
	at cucumber.runner.TestCase.run(TestCase.java:46)
	at cucumber.runner.Runner.runPickle(Runner.java:50)
	at cucumber.runtime.Runtime$1.run(Runtime.java:104)
	at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:515)
	at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
	at cucumber.runtime.Runtime$SameThreadExecutorService.execute(Runtime.java:258)
	at java.base/java.util.concurrent.AbstractExecutorService.submit(AbstractExecutorService.java:118)
	at cucumber.runtime.Runtime.run(Runtime.java:101)
	at io.cucumber.core.cli.Main.run(Main.java:43)
	at cucumber.api.cli.Main.run(Main.java:28)
	at cucumber.api.cli.Main.main(Main.java:15)
Caused by: io.cucumber.datatable.UndefinedDataTableTypeException: Can't convert DataTable to List<stateObjects.SearchResult>.
You can register a DataTableType using DataTableType.entry(stateObjects.SearchResult.class).
For more control you can define your own DataTableType with a TableEntryTransformer or TableRowTransformer for stateObjects.SearchResult.

	at io.cucumber.datatable.UndefinedDataTableTypeException.listNoConverterDefined(UndefinedDataTableTypeException.java:42)
	at io.cucumber.datatable.DataTableTypeRegistryTableConverter.toList(DataTableTypeRegistryTableConverter.java:131)
	at io.cucumber.datatable.DataTableTypeRegistryTableConverter.convert(DataTableTypeRegistryTableConverter.java:96)
	at io.cucumber.datatable.DataTable.convert(DataTable.java:362)
	at io.cucumber.stepexpression.StepExpressionFactory$3.transform(StepExpressionFactory.java:73)
	at io.cucumber.stepexpression.DataTableArgument.getValue(DataTableArgument.java:19)
	at cucumber.runner.PickleStepDefinitionMatch.runStep(PickleStepDefinitionMatch.java:41)
	... 14 more
```

This helpfully tells you what to do, but not where to do it.

> You can register a DataTableType using DataTableType.entry(stateObjects.SearchResult.class).

The [release post for Cucumber 3.0.0](https://cucumber.io/blog/open-source/announcing-cucumber-jvm-3-0-0/) indicates that you should place a class implementing `cucumber.api.TypeRegistryConfigurer` on the glue path. The glue path is one of the values given in `@CucumberOptions(glue=["glue path goes here", "or here"])` on your `CucumberRunner`: you'll likely already have one for your step definitions or your hooks.

Cucumber 4 includes the methods specified in the stack trace to easily convert particular classes (these are deprecated in later versions of 4 and removed in 5).

{% highlight java %}
public class TypeRegistryConfiguration implements TypeRegistryConfigurer
{
    @Override
    public Locale locale()
    {
        return Locale.ENGLISH;
    }

    @Override
    public void configureTypeRegistry(TypeRegistry registry)
    {
        registry.defineDataTableType(DataTableType.entry(SearchResult.class));
    }
}
{% endhighlight %}

An alternative is to add a default data table entry transformer, bringing back behaviour close to version 2. This is also available from version 4, as [described in the release notes](https://github.com/cucumber/cucumber-jvm/blob/master/release-notes/v4.0.0.md#data-tables).

{% highlight java %}
public class TypeRegistryConfiguration implements TypeRegistryConfigurer
{
    @Override
    public Locale locale()
    {
        return Locale.ENGLISH;
    }

    @Override
    public void configureTypeRegistry(TypeRegistry typeRegistry) {
        JacksonTableTransformer jacksonTableTransformer = new JacksonTableTransformer();
        typeRegistry.setDefaultDataTableEntryTransformer(jacksonTableTransformer);
    }

    private static final class JacksonTableTransformer implements TableEntryByTypeTransformer, TableCellByTypeTransformer {

        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public <T> T transform(Map<String, String> entry, Class<T> type, TableCellByTypeTransformer cellTransformer) {
            return objectMapper.convertValue(entry, type);
        }

        @Override
        public <T> T transform(String value, Class<T> cellType) {
            return objectMapper.convertValue(value, cellType);
        }
    }
}
{% endhighlight %}

Cucumber 5 also offers [many other ways of defining transformations](https://github.com/cucumber/cucumber-jvm/blob/master/release-notes/v5.0.0.md), but if you don't need access to the test context during the transformation the previous method involving the `TypeRegistryConfigurer` should continue to work well. There are now convenience methods for (for example) defining a data cell to map to a blank string or to null using annotations, by specifying `@DataTableType` on a `Map<String, String> => TargetClass` method.
