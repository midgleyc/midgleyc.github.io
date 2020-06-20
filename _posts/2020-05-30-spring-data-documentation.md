---
layout: post
title:  "Notes on Spring Data"
tags: [technical, java, spring]
---

I find the Spring documentation generally comprehensive, but most useful after you already know the right answer to your questions. Here I note down some things I've learned this past project.

Override a single repository URL explicitly
-------------------------------------------

You can use the [`@RepositoryRestController`](https://docs.spring.io/spring-data/rest/docs/3.4.0-SNAPSHOT/reference/html/#customizing-sdr.overriding-sdr-response-handlers) annotation on a `Controller` to override a specific URL, and also use `Resources` and `linkTo` as mentioned in the given example to make something that looks HAL-ish.

We needed this for completely normal operations when saving an entity wasn't working -- both it and a child entity (saved by JPA cascading) shared the same base class, which was intercepted by an `EntityListener`'s `@PrePersist` to call a different repository to set some fields. When the `CrudRepository` was called, the child entity was intercepted again until the stack overflowed. This was difficult to debug because most of the classes involved were called by Spring proxies, but an explicit method that saved the child, then the parent worked.

We also used it for validation, to give a nicer error message than would be given by naturally validating the generated API produced from the incoming JSON.

Query methods
-------------

Query methods are [documented on spring-data-jpa](https://docs.spring.io/spring-data/jpa/docs/2.4.0-SNAPSHOT/reference/html/#jpa.query-methods). I couldn't find a complete listing of the verbs (DoBy, e.g. FindBy), but you can draw them out of [the source code](https://github.com/spring-projects/spring-data-commons/blob/4be5aae181ad9930f409a93eb5a36697884c5c18/src/main/java/org/springframework/data/repository/query/parser/PartTree.java#L59):

* SELECT: Find, Read, Get, Query, Search, Stream
* COUNT: Count
* EXISTS: Exists
* DELETE: Delete, Remove

In particular, "ExistsBy" returning a boolean is rather nice for quick uniqueness-checking methods.

Almost unnoted is the slightly non-grammatical way you have to write some queries: finding the entry with the lowest ID, for example, is `findFirst*By*OrderByIdAsc`, which I don't think is called out explicitly (but is in the documentation as an example).

You can add underscores to make the methods easier to read even if this isn't required for parsing purposes.

You can also use [`@Query`](https://docs.spring.io/spring-data/jpa/docs/2.4.0-SNAPSHOT/reference/html/#jpa.query-methods.at-query) methods, which are useful for queries that are just slightly too complicated to write in a way that can be auto-generated (e.g., checking incoming parameters for null and ignoring them).

We also had to use it on occasion to write out methods which appeared the same as should have been generated from the method, but which Spring couldn't succesfully create. This occurred on queries using fields from a parent object with the annotation `@Inheritance(strategy=InheritanceType.JOINED)`.

{% highlight java %}
@Query("select r from BookReference r join r.source as source where source.id = :id")
List<BookReference> findBySourceId(@Param("id") Integer id)
{% endhighlight %}

HTTP endpoint input data format
-------------------------------

The [documentation around endpoints and accepted input data formats](https://docs.spring.io/spring-data/rest/docs/3.4.0-SNAPSHOT/reference/html/#repository-resources.fundamentals) doesn't have any examples. As I see it,
* a collection resource is at `/humans`
* an item resource is at `/humans/1`
* a collection assocation resource is at `/humans/1/children`
* a non-collection assocation resource is at `/humans/1/father`

You can pass in URIs to represent elements instead of passing in a complete JSON object. For example, if `Human` has a field `Human father;`, you can pass in `{"father": "/16"}` to the item resource endpoint.

The endpoints accepting `text/uri-list` accept a single number -- the id for the resource you're trying to add / update.

HTTP endpoint general comments
------------------------------

Setting `RepositoryRestConfiguration.returnBodyOnUpdate` can be very useful for tests that try to roll back the changes made, and avoid additional GETs you may be making.

Use `@ControllerAdvice` to convert error messages to consistent status codes. We had issues with 403s and 404s being used inconsistently: always converting to 404 is likely best for obscuring which entities exist. Spring Security throws an AccessDenied exception no matter what goes wrong: catch it closer to the call and convert it to the exception you want.

Sending JSON to an endpoint calls the `setX` method for `X` in the JSON (and similarly, receiving JSON converts `getX` to properties). Using this, you can add "flat" properties that expand to child elements -- for example a `mothersMaidenName` property could correspond to a `setMothersMaidenName` method that calls `getOrCreateMother().setBirthSurname(name)`.

Using different IDs in the URL
------------------------------

By default, the ID exposed in the URL is the `@Id` of the object -- which tends to be simply a number or a string. You may want to modify it -- for example, if you're using an embedded ID, it will use the string representation of the embedded ID when showing the URL in `links`, and simply refuse to parse it when input.

You can do this by creating a class annotated with `@Component` that implements [`BackendIdConverter`](https://docs.spring.io/spring-data/rest/docs/current/api/org/springframework/data/rest/webmvc/spi/BackendIdConverter.html), and having the `supports` method return true for the model object whose URLs you want to affect. Generally, though, it's nicer to have a number for a primary key -- enough things become harder using embedded IDs with HATEOAS that I'd prefer to avoid them in general. [This stackoverflow question](https://stackoverflow.com/q/23801575/2591803) has more information.

Modifying the Repository Config
-------------------------------

You can modify the configuration by having a `@Component` implement the `RepositoryRestConfigurer` interface and overriding the `configureRepositoryRestConfiguration` method. (In versions before 3.1, extend `RepositoryRestConfigurerAdapter`; in versions before 2.4 have your application extend `RepositoryRestMvcConfiguration`.)

If you want the entity Ids to be exposed more accessibly, you can call `exposeIdsFor`, which takes a varargs of classes for which to expose ids. You can do this manually (pro: explicit, fast) or automatically (e.g., [using the EntityManager](https://stackoverflow.com/a/47765828/2591803)) which does it for all managed entities without having to maintain the code. This is mostly useful for tests in my experience, but it does make it a lot more convenient to be able to get the id as `$.id` instead of `$.links.self.href` followed by string manipulation (characters after the last '/').

After 3.1, you can disable specific HTTP methods using the `getExposureConfiguration` method followed by `forDomainType(Class<?> type)` (and, e.g. `withItemExposure((metadata, httpMethods) -> httpMethods.disable(HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE))`). You can also set a Repository method to `@RestResource(exported = false)`, but this may disable multiple HTTP methods (for example, disabling `save` will stop both PUT and DELETE).

An Annoying Bug (a workaround for a StackOverflow exception)
------------------------------------------------------------

This is an extremely specific note in case I run into this problem again. We have:

* A `@MappedSuperclass` `MySuperClass`
* A class `MyClass` extending `MySuperClass`
* Another class `MyForeignClass` extending `MySuperClass`
 * Both classes have an ID field with `GenerationType.IDENTITY`
* A `@OneToOne(cascade = CascadeType.ALL) private MyForeignClass f = new MyForeignClass()` field on `MyClass` (with getters and setters)
* A `MySuperClassEntityListener` (mapped with `@EntityListeners` on MySuperClass)
 * The EntityListener has a `@PrePersist` method
  * The method calls an injected `JpaRepository` that exists only as an interface (in order to inject Spring beans into entity listeners, we use an `@Autowired` `init` method, because constructors didn't work)

Saving `MyClass` (e.g., a POST to a REST endpoint) leads to a StackOverflowException.

To work around this, send an `id` with the POST call (e.g. '{"id": 0, [...]}'). The ID is ignored, and both objects are written to the database.
