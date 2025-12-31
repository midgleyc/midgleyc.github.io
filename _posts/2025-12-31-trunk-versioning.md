---
layout: post
title: "Versioning in Trunk-Based Development"
tags: [technical]
---

Trunk-based development -- where the only thing deployed is a single branch, often `main` -- allows for an extremely simple versioning scheme: every commit gets a new incremental version, monotonically increasing by one each commit. This can be the number of commits after a given "first" commit, or also the number of commits on the branch in total.

This was very natural in the SVN days, where instead of SHA hashes representing a commit, each commit had a revision number, and this number could be your version.

You can compute the version number (counting all commits) with `git rev-list --count`. If you want to ensure that development work has a sensible (though not unique) version, you can use `git rev-list --count $(git merge-base HEAD origin/main)`, swapping `origin/main` out for whichever trunk you're using.

From a history in Java, I also like to add `-SNAPSHOT` or `-M` if there are any local changes. `git rev-list --count origin/main..HEAD` will give you the number of commits made not on the `main` branch, and `git status --porcelain=v1` will show if there are any uncommitted changes. In our build system, I found this would happen even on CI builds, so instead in practice I check for the presence of a `CI` environment variable and mark the version as dirty if not found.
