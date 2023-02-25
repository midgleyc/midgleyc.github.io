---
layout: post
title:  "Looking for subdomains"
tags: [technical]
---

It's useful to have a tool that can find subdomains of a given domain. I expect this is generally used for security testing, but I use it to look for development sites that other developers haven't documented for projects I'm working on.

There are many services from the [fancy](https://subdomains.whoisxmlapi.com/) to the [less fancy](https://suip.biz/?act=subfinder), but most are slow, have CAPTCHAs, or try to charge you. A nice alternative for HTTPS sites is [crt.sh](https://crt.sh/), which looks for recently generated certificates. It is free, comprehensive, and fast. It also puts the sites into a helpful order: most recent generations at the top (and hence most likely to have been freshly introduced). It's presumably used by the paid services to generate their lists.
