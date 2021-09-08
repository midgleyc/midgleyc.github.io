---
layout: post
title:  "Fridays, after the Sprint Ends"
tags: [personal]
---

Our sprints start on Monday and last for two weeks, and we release at the end of each one. This means we have some dead time on Friday: we want to start the release early to give us some time to recover if it goes wrong or we find an issue after release, but if it all goes well we don't want to start the next sprint early, to give us some time off the treadmill.

Normally we work on small tech debt items: simple package upgrades, implementing [skip navigation](http://web.archive.org/web/20210128082952/https://docs.microsoft.com/en-us/ef/core/modeling/relationships?tabs=fluent-api%2Cfluent-api-simple-key%2Csimple-key#many-to-many), improving the tests. One thing I thought worked very well was allowing the devs to raise any bug that particularly annoyed them to the top of the board, and work on that.

Developers use the application more than many users, but in entirely different ways. Many of their particular annoyances are likely not shared by external users, but fixing them can drastically improve their happiness working on the app. Last run-through we fixed, among other things:
* login screen [autofocuses](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) the username field, so pressing enter logs you in
* improve tagging of [autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) inputs, particularly "new-password" and "email", to try to avoid the browser offering incorrect suggestions
* make certain sections view better on smaller screens (such as when running a browser non-maximized)

None of these are likely to affect external users (possibly the last, running on an older monitor), but the first one especially has made using the app a lot more convenient.
