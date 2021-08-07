---
layout: post
title: "Show complicated filtered data in EntityFramework Core"
tags: [technical, c#, dotnet, entityframework]
---

We had a requirement for an API to, for a given user, return only records that user had permissions to see. We didn't want to manually filter in every case, because the filters were quite complicated, and there was no guarantee the developers would remember to call them.

At first, we tried adding global query filters to the given `DbSet`s.

```cs
public DbSet<Client> Clients { get; set; }

public DbSet<Sample> Samples { get; set; }

[...]

builder.Entity<Client>()
    .HasQueryFilter(x => x.ClientUserAccounts
        .Any(y => y.UserAccountId == _currentUserId));
builder.Entity<Sample>()
    .HasQueryFilter(x => _currentClients.Contains(x.Job.ClientId)
```

and ignoring them where a backend call needed to get all entries with `.IgnoreQueryFilters()`.

This didn't work out well -- quite often, we'd forget to ignore query filters on an apparently unrelated call, and wind up with bugs (for example, we had a set of `Action` classes that run during `SaveChanges` to update various classes based on the state of others -- these need to have the full data set, but initially we missed that).

Additionally, as time passed, we got additional requirements which were tricky to express in C# as functions that EF could translate to SQL -- we'd much rather express them in PostgreSQL directly. Also, we wanted to be able to re-use some of the filtering already done (e.g. the visible samples depended on the visible clients), and we couldn't see a way to do that in EF.

We decided to create views for our filtered data. Class-wise, we knew these had to be separate classes (as they had a separate definition -- pointing at a view rather than a table), and furthermore we wanted the relations to be separate as well, so that a developer couldn't accidentally escape into data the user shouldn't be able to see. We looked briefly if there was a way to avoid duplicating loads of code (two of every class, configuration, doubling most things in the `DbContext`), but in the end we just accepted the duplication.

```sql
CREATE VIEW clients_for_users AS
SELECT cu.user_account_id, c.*, array_remove(array_agg(e.contact_email), NULL) AS contact_emails
FROM clients c
LEFT JOIN client_emails e ON e.client_id = c.id
INNER JOIN client_user_accounts cu ON cu.client_id = c.id
GROUP BY cu.user_account_id, c.id;
```

We created a `ClientForUser` class, with a user id, base details shared with `Client` (and an interface `IClient`), and relations collections of `ForUser` classes. For methods taking both relations, you can pass an `IReadonlyCollection<IClient>`, which works for both `ICollection<Client>` and `ICollection<ClientForUser>`.

```cs
public DbSet<ClientForUser> ClientsForUsers { get; set; }

[...]

builder.Entity<ClientForUser>()
    .HasQueryFilter(x => x.UserAccountId == _currentUserId);
```

Many-to-many relations were trickier: the naive approach is to try to use the same table as the unfiltered data:

```cs
builder.HasMany(x => x.TestSuites)
    .WithMany(x => x.Products);
    .UsingEntity(x => x.ToTable("product_test_suites"));
```

But EF complains:

```
System.InvalidOperationException: Cannot use table 'product_test_suites' for entity type 'ProductForUserTestSuiteForUser (Dictionary<string, object>)' since it is being used for entity type 'ProductTestSuite' and potentially other entity types, but there is no linking relationship. Add a foreign key to 'ProductForUserTestSuiteForUser (Dictionary<string, object>)' on the primary key properties and pointing to the primary key on another entity typed mapped to 'product_test_suites'.
         at Microsoft.EntityFrameworkCore.Infrastructure.RelationalModelValidator.ValidateSharedTableCompatibility(IReadOnlyList`1 mappedTypes, String tableName, String schema, IDiagnosticsLogger`1 logger)
```

To get around this, we created a view with the same data and used that instead (accounting for EF's desire to use different names for the columns):

```sql
CREATE VIEW product_test_suites_for_users AS
SELECT product_id AS products_id, test_suite_id AS test_suites_id
FROM product_test_suites;
```

```cs
builder.HasMany(x => x.TestSuites)
    .WithMany(x => x.Products)
    .UsingEntity(x => x.ToView("product_test_suites_for_users"));
```

You can also determine the column names with additional configuration (this uses `client_id` and `product_id`, with an additional [snake case modifier](https://github.com/midgleyc/EntityFramework-ViewBug/blob/bed8bf6539fee6b53eaeedb424d19ef55666c860/ViewBug/Extensions/ModelBuilderExtensions.cs)):

```cs
builder.HasMany(x => x.Products)
    .WithMany(x => x.Clients)
    .UsingEntity<Dictionary<string, object>>(
        "ClientForUserProductForUser",
        x => x.HasOne<ProductForUser>().WithMany()
            .HasForeignKey("ProductId"),
        x => x.HasOne<ClientForUser>().WithMany()
            .HasForeignKey("ClientId"))
    .ToView("client_products_for_user");
```

This has worked well, though some views are slow (due to the complexity of the joins, and the fact that we need to `DISTINCT` the results to avoid duplicates). Because of this, we try to avoid the filtered views unless necessary for security purposes: joins on other views or queries mostly use the normal tables, if we're sure the query can't return anything the user shouldn't have access to.
