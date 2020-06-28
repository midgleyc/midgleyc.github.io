---
layout: post
title:  "Removing boilerplate in REST API tests"
tags: [technical, java, junit, solid, open-closed]
---

While converting our backend REST API integration tests from Cucumber to JUnit, I saw the chance to simplify our rollback of test data.

The [Kaptis](https://www.lhasalimited.org/products/kaptis.htm) project aimed to allow an easy way of viewing and editing <abbr title="Adverse Outcome Pathway">AOP</abbr>s, complicated [graphs](https://aopwiki.org/info_pages/2/info_linked_pages/1#B%20Graphical%20Representation%20of%20the%20AOP) containing many different elements: Key Events, Key Event Relationships, Assays, Assay Measures, Commentaries, References, Sources, etc. Some of these were several levels deep in the graph, and the choice was made to populate an initial dump of test data (for most tests) instead of having each test create its own test data from scratch.

This meant that each test did something like:

* When I make something changes
* Then I see that the right thing has happened
* When I make changes to revert my previous changes

and had to be told to roll back the database to a previous version in case of test failure, because it couldn't tell how much needed to be reverted. This was a fairly expensive operation, done using [Liquibase](https://www.liquibase.org/) to roll back to a previous tag (this took ~5 minutes with the database on a different machine -- later I moved the database to a docker container on the same machine, and it started taking ~45 seconds. Still quite a long time!).

The initial aim was to remove the reliance on these refreshes, which could be done by noting which changes had been made and how they needed to be reverted. I used a JUnit 5 extension for this, and named it "Rollback".

Creating a Rollback class
=========================

{% highlight java %}
public class Rollback {

    private List<Operation> operations = new ArrayList<>();

    void clear() {
        operations.clear();
    }

    public void rollback() {
        for (int i = operations.size() - 1; i >= 0; i--) {
            operations.get(i).run();
        }
    }

    public void addCleanupCall(Operation operation) {
        operations.add(operation);
    }

    @FunctionalInterface
    public interface Operation {
        void run();
    }
}
{% endhighlight %}

This stores a list of callable operations, allows them to be cleared by the extension, and runs them backwards (as earlier ones may rely on a state reverted to by later ones). No error checking or handling is implemented -- you could allow `run()` to throw Exceptions which are then caught, or require it return a `boolean` as to whether it succeeded -- I kept it simple until this is required.

{% highlight java %}
import org.junit.jupiter.api.extension.*;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import static java.util.Arrays.stream;

public class RollbackExtension implements BeforeEachCallback, AfterEachCallback, TestInstancePostProcessor, ParameterResolver {

    private List<Rollback> rollbacks = new ArrayList<>();

    @Override
    public void beforeEach(ExtensionContext context) throws Exception {
        rollbacks.forEach(Rollback::clear);
    }

    @Override
    public void afterEach(ExtensionContext extensionContext) throws Exception {
        rollbacks.forEach(Rollback::rollback);
    }

    @Override
    public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return parameterContext.getParameter().getType() == Rollback.class;
    }

    @Override
    public Object resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) throws ParameterResolutionException {
        return createRollback();
    }

    @Override
    public void postProcessTestInstance(Object o, ExtensionContext extensionContext) throws Exception {
        stream(o.getClass().getDeclaredFields())
                .filter(field -> field.getType() == Rollback.class)
                .forEach(field -> injectRollback(o, field));
    }

    private void injectRollback(Object o, Field field) {
        field.setAccessible(true);
        try {
            field.set(o, createRollback());
        } catch (IllegalAccessException iae) {
            throw new RuntimeException(iae);
        }
    }

    private Rollback createRollback() {
        var rollback = new Rollback();
        rollbacks.add(rollback);
        return rollback;
    }
}
{% endhighlight %}

This allowed the potential use of multiple `Rollback` objects -- I don't think I ever used that, so it could have been an `Optional<Rollback>` instead (or a plain `Rollback`, if you'll remember to do null checking). This allows injection into both test classes and test methods, for flexibility, though most later uses used class injection for convenience.

Test classes could then have a `private Rollback rollback;` field, be extended as `@ExtendWith(RollbackExtension.class)`, and use the rollbacks like:

```java
ResponseEntity<String> patchResponse = aopRestCaller.update(1, Map.of("name", "A new name"));
rollback.addCleanupCall(() -> aopRestCaller.update(1, Map.of("name", "AOP 1")));
```

Centralising the rollbacks
==========================

I noticed after using this a short time that we could programmatically figure out what the rollbacks should be for many common calls -- a `create` call would want to be followed by a `delete`, and an `update` would want another `update` with the original fields.

I set about making an `AbstractRestCaller` class, that I wanted to the other model REST caller classes to extend. Most model objects used the default Spring DATA repository endpoints, so I had only one abstract method -- `protected abstract String getEndpoint()` -- which contained the endpoint (e.g. `aops`) and everything else could be derived from that. Despite that, I made sure to keep it fine-grained and heavily customizable by using small protected methods, which could be overridden by the child classes. I've noticed a trend away from making classes open to extension in favour of composability, mostly using dependency injection (for example, having a `Configuration` class that gets passed into the constructor), so this felt like a little bit of old-school development. I think the end result of having small, overridable methods was much easier to use and extend than the DI-based configuration -- certainly more flexible!

Some of the methods following use a `restRequest` object that wraps Spring's `RestTemplate` to add headers for authorization. One nice advantage of having this shared across all test callers was that an interceptor to, for example, log all JSON requests and responses only needed to be made in one place.

#### Create

```java
    public ResponseEntity<String> create(Map<String, Object> fields) {
        return create(fields, null);
    }

    public ResponseEntity<String> create(Map<String, Object> fields, Rollback rollback) {
        String url = createUrl();
        ResponseEntity<String> response = restRequest.post(url, new JSONObject(fields));
        if (rollback != null) {
            rollback.addCleanupCall(() -> delete(response));
        }
        return response;
    }

    protected String createUrl() {
        return url();
    }
    
    protected String url() {
        return URLs.buildUrl(getEndpoint());
    }
    
    protected void delete(ResponseEntity<String> response) throws Exception {
        if (response.getStatusCode().is2xxSuccessful()) {
            String body = response.getBody();
            Integer id = getId(body);
            delete(id);
        }
    }
    
    public Integer getId(String body) {
        return JsonPath.read(body, "$.id");
    }
```

The entrypoint for most `create` calls is the second request, accepting a map of fields (`Object`, because it should allow Arrays and additional Maps) and a `rollback`. The initial design had `create(fields, rollback)` calling `create(fields)` instead of the other way around. It was changed because if an overriding class wants to create convenience create methods (e.g. `create(int id1, intid2)` with an optional rollback), this way around means that one convenience method can call the other.

The other methods are to show the level of overridability. Some model objects can't create on the repository directly, but need to use a custom endpoint that creates them and modifies a different object to use them as a field (in a many-to-one relationship, for example). Some model objects don't necessarily have an integer ID exposed at "id", but [we've been changing that]({% post_url 2020-05-30-spring-data-documentation %}#using-different-ids-in-the-url).

Some model objects are forbidden from being deleted using the REST endpoint, and need to be deleted using some other endpoint (or from the database directly, depending on the test)

We considered moving the "successfully created" check outside the overridable delete method on the basis that we couldn't think of a case where you wouldn't want to only do something if the call succeeded, but in the end we left it in for more flexibility.

The JSONObject is an org.json.JSONObject. We're going to see its importance in the `update` section, where we use `JSONObject.NULL` to be able to add nulls into maps.

#### Update

```java
    public ResponseEntity<String> update(Integer id, Map<String, Object> fields) {
        return update(id, fields, null);
    }

    public ResponseEntity<String> update(Integer id, Map<String, Object> fields, Rollback rollback) {
        ResponseEntity<String> getResponse = get(id);
        String url = updateUrl(id);
        var response = restRequest.patch(url, new JSONObject(fields));
        if (rollback != null) {
            rollback.addCleanupCall(() -> {
                if (response.getStatusCode().is2xxSuccessful()) {
                    Map<String, Object> oldFields = new ObjectMapper().readValue(getResponse.getBody(), new TypeReference<Map<String, Object>>() {
                    });
                    HashMap<String, Object> newFields = new HashMap<>();
                    addFieldsWithOldValues(newFields, fields, oldFields);
                    update(id, newFields);
                }
            });
        }
        return response;
    }

    protected String updateUrl(Integer id) {
        return url(id);
    }

    private void addFieldsWithOldValues(Map<String, Object> newFields, Map<String, Object> updatedFields, Map<String, Object> oldFields) {
        for (String key : updatedFields.keySet()) {
            if (!oldFields.containsKey(key)) {
                newFields.put(key, JSONObject.NULL);
            } else {
                var oldField = oldFields.get(key);
                if (oldField instanceof Map) {
                    HashMap<String, Object> map = new HashMap<>();
                    addFieldsWithOldValues(map, (Map)updatedFields.get(key), (Map)oldField);
                    newFields.put(key, map);
                } else {
                    newFields.put(key, oldField);
                }
            }
        }
    }
```

Again, we expect the entrypoint to be the second `update`, with the `rollback`.

The aim here is to create a new JSON object that looks like the JSON passed into the PATCH request, but has the values that the previous object had. We need to add NULLs for those values not present in the initial GET request (we can't use plain `null`, because you can't add `null` to a Map). PATCHing with the entire initial object (plus NULLs where appropriate) would have been nice had it worked, but occasionally lead to errors.

#### Custom endpoints

Some endpoints had custom URLs beyond the standard CRUD -- for example, "/aops" has a "publish" option that publishes it and all child elements. For these, there were two standard options:

* gather lots of information from a variety of endpoints, as a user would, to get enough information to roll it back
* make the endpoint return enough information so the tests know what to roll back

Eventually, we went for the second option: it does return information that isn't necessary for the application and is only useful for the tests, but it makes the tests easier to write, and it's "nice" from an API perspective to receive some information on what happened instead of 204 NO\_CONTENT.
