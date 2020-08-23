---
layout: page
title: What is ...?
permalink: /what-is/
---

There are certain software-development-related items that are hard to search for if you don't already know what theyare / that they exist -- this page stores things I find.

## Git

### commits starting with emoji

I thought this was behaviour by one particular Windows client -- I thought it was "GitLab for Windows", but that doesn't seem to exist.

There's an attempt to make a standard at [GitMoji](https://gitmoji.carloscuesta.me/), among other places.

### feat(X), fix(X) in Git Commits

This is Angular's [commit message format](https://github.com/angular/angular/blob/72d6032fa4b5679e7c07998a6e745fc10abb9f73/CONTRIBUTING.md#-commit-message-format): \<type>(\<scope>): \<summary>. Some projects take a subset of the types, exclude the scopes, and possibly have different rules for capitalisation or ending with a period.

This was standardised as [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), which offers automated semantic versioning / [changelogs](https://github.com/conventional-changelog/conventional-changelog).

## JavaScript / TypeScript

### [Angular / Typescript version requirements](https://gist.github.com/LayZeeDK/c822cc812f75bb07b7c55d07ba2719b3)

### npx

`npx` is a tool you can use to execute the version of a package installed in the `node_modules` folder, instead of on the system. Good for things like `mocha`, `eslint`, `uglifyjs`.

## Other

### Screen Recording

For the terminal, [asciinema](https://asciinema.org/). You might then want to convert to SVG (e.g. using [svg-term-cli](https://github.com/marionebl/svg-term-cli), or anything linked from there), for cleanly-zoomable text.

For a simple screen recording, I like [ScreenToGif](https://www.screentogif.com/).

For a screen recording that shows the keys you press, there's [keycast](https://github.com/cho45/KeyCast), but the one used on most places I see looks different so there must be more.
