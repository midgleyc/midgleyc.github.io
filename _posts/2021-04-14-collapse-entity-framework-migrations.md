---
layout: post
title: "Collapse EntityFramework Migrations"
tags: [technical, c#, dotnet, entityframework]
---

On every major version release (or any other time you don't think you're ever going to want to roll back to a given version), it's nice to collapse migrations into a single file so they all run faster and don't do needless work (e.g. deleting and recreating data, creating and dropping tables, etc.).

After collapsing the migrations you will need to insert a row into every database's `__EFMigrationsHistory` table stating that this migration (which contains all the preceding migrations) has run. Remember to run all preceding migrations if a deployment is behind!

If `dotnet ef` gives an error you will need to install the tool: `dotnet tool install --global dotnet-ef`.

You will need to do this for all data projects.

1. Reset the database to a blank state.
2. Apply all existing migrations.
3. If you are running the project, or have anything open that may be locking the files, stop it.
4. Delete all existing migration files except `Initial`.
5. Delete the `DbContextSnapshot`.
6. `cd` into the project containing the Migrations.
7. Run the command:
```bash
dotnet ef migrations add VersionX
```
If you use a different startup project to the project containing the migrations you will need to specify it.
```bash
dotnet ef --startup-project ../Project.Startup/ migrations add VersionX
```
8. Look at the generated migration to confirm all actions taken are correct. If not, you can manually modify the file and record the changes made.
9. Confirm that the `DbContextSnapshot` is the same and commit all changes.

After the changes are ready to deploy, find the databases associated to the projects they will be deployed to, and mark the migration as run. Record the name of the migration and the version of EntityFramework.
```sql
INSERT INTO "__EFMigrationsHistory" VALUES ( '20210406102319_VersionX' , '3.1.10');
```

If you accidentally deployed without having previously run all the migrations, you will need to run only those that have not been run. You can either check in the database, if you didn't clear the `__EFMigrationsHistory` table, or get it from the git history: if the last deployed commit was `abcdef123456`, running `git log --name-status abcdef123456..main Migrations/` will show created and changed files in the `Migrations/` folder, which will show you the ones you need to run.

You can then check out the commit immediately before the collapse migrations commit (you can do this as `git checkout migrationCommit~`), and run `dotnet ef migrations script > migrate.sql` to generate an SQL script of all migrations. Delete the ones which have already run and run the others.
