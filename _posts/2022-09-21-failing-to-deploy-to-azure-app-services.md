---
layout: post
title: "Azure App Service can fail to deploy due to free plan"
tags: [technical, azure]
---

I recently failed to deploy a project to an Azure App Service with a variety of mysterious errors. The project ran fine locally, but:

* pushing to the custom git repo URL gave a 503
* trying to deploy a zip gave an error generally associated with being behind a proxy
```
Max retries exceeded with url: /api/publish?type=zip (Caused by SSLError(SSLEOFError(8, 'EOF occurred in violation of protocol (_ssl.c:2396)')))
```
* `az webapp up` claimed I was trying to deploy too large files (and flipped the runtime from net6 to net7, still in preview, despite the csproj targeting net6)
* FTP successfully deployed the files and let me view the existing files, but accessing the website gave "This service is unavailable."

The issue was that the app service plan was free (F1), which apparently can prevent deploying at all under some conditions. There was a comment in the logs about no workers being available, but this didn't explain anything. Switching the app service plan to Shared allowed the deploy to succeed.
