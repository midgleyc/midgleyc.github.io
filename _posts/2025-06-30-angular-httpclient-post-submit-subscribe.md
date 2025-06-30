---
layout: post
title:  "Angular's HttpClient Does Not Submit the Request Until Subscribed To"
tags: [technical, javascript, angular]
---

Angular's `HttpClient` does not submit requests until it receives a subscription (and in case it receives multiple subscriptions, will submit requests multiple times).

While this is very clear in the [HttpClient documentation](https://v18.angular.dev/guide/http/making-requests), whenever I take some time between projects, I usually forget it, especially for POST requests that return No Content and so nothing needs to be done that would require a subscription. You can use `void firstValueFrom` to simplify the Observable to a Promise at the expense of some features (no canceling the request when the user navigates away, no retry mechanism). `await firstValueFrom` will get you the data in case of a success, and throw an exception which you can `catch` (or handle data in `finally`) on error.
