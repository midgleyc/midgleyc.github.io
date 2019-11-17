---
layout: post
title:  "Using Firefox at work"
categories: firefox productivity
---

**I.**

I use Firefox at work. Unlike the prime focus of their advertising campaigns, I'm not interested in the privacy protections. I use it primarily for two features that haven't yet made it to Chrome -- containers (cookie isolation) and tab hiding.

**II.**

Firefox containers provide website storage isolation, and were designed for privacy purposes -- for example, for folk who didn't want Facebook or Google to be able to track them on every site, but only on the sites those companies provide. As a side effect, providing cookie isolation allows you to log on to a site multiple times, once per container.

Some sites, such as AWS, only allow one login at a time, forcing you to log out if you want to use a different one (or use different browsers or profiles). With containers, you can simply open a new tab with a new container. If MFA is turned on for every login, this is massively more convenient, and being able to use tabs instead of new windows is a lot nicer as well.

Containers also enhance safety, in that you can ensure you're using the right user as the tab is colour-coded. Using different browsers, or different icons on your different profiles also ensures this, but containers are more convenient, and can be named according to the user type. This can help prevent accidentally making changes to production instead of staging.

I also use containers on sites that store multiple logins, such as Azure or Sharepoint, to avoid having to click the correct user. As Sharepoint URLs are different on a user level, I can force the website into the correct container, so that email-opened files open instead of telling me that I'm logged in with the wrong account.

One other use of containers is when manually testing multiple logins to sites locally. This doesn't work in private browsing mode, which is my standard go-to for testing, as cookies are shared across all private browsing windows. Containers isolate cookies, so I can ensure my session handling is working correctly.

Containers aren't enabled by default, and require an extension that uses them to be enabled. I use [Firefox Multi-Account Containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/) for simplicity -- it offers containers and the ability to lock a site to a container. [Containerise](https://addons.mozilla.org/en-US/firefox/addon/containerise/) offers more powerful regex locking if this is required. Containers [require that you have Firefox set to remember history](https://support.mozilla.org/en-US/kb/containers), apparently due to [possible user confusion](https://bugzilla.mozilla.org/show_bug.cgi?id=1320757).

**III.**

Tab hiding is the ability to hide tabs you're not interested in seeing at the moment. Primarily, this is implemented using groups of tabs, of which you see one group at a time. For example, I might have a "CSS" group and a "Java" group, and if somebody calls me onto another ticket or I have to give a presentation I might create another group for that. When I change groups, all the tabs that are currently visible will be hidden, and only the tabs in the group will be shown.

Alternatives to this in other browsers include using multiple windows (one for each group), Edge's "set aside" feature, or using another tab management extension that doesn't hide tabs, such as [Tabs Outliner](https://chrome.google.com/webstore/detail/tabs-outliner/eggkanocgddhmamlbiijnphhppkpkmkl). Using multiple windows can get confusing as to which group contains a particular tab and isn't very easy to manage (for example, you can't easily see all tabs without an extension), but does allow you to see many tabs at once. Edge's "set aside" closes and reopens tabs, so switching "groups" makes a series of network hits. I find hiding irrelevant tabs useful for focusing on a particular problem, so I prefer hiding extensions over "[Tree Style Tabs](https://addons.mozilla.org/en-US/firefox/addon/tree-style-tab/)"-style extensions.

Tab hiding requires an extension with the "hide and show browser tabs" permission. I use [Simple Tab Groups](https://addons.mozilla.org/en-US/firefox/addon/simple-tab-groups/) by Drive4ik. Most extensions have similar features, and look reasonably like the "Panorama" tab groups management feature that was removed in Firefox 45.

Tab Groups have been in Firefox for a while, but have a fairly small user base ([0.01% of users in Firefox 45](https://bugzilla.mozilla.org/show_bug.cgi?id=1221050)). They were first introduced in Firefox 4 Beta as [Tab Candy](https://www.geek.com/news/mozilla-shows-off-firefox-tab-candy-1272614/), then in Firefox 4 proper as Panorama. This was then [removed from Firefox 45](https://www.ghacks.net/2015/11/08/mozilla-to-remove-tab-groups-panorama-in-firefox-45/), but Quicksaver [produced an addon](http://web.archive.org/web/20170930123202/https://addons.mozilla.org/en-US/firefox/addon/tab-groups-panorama/), based off the same codebase, with the same features. This addon [stopped working](http://web.archive.org/web/20171017070348/http://fasezero.com/lastnotice.html) when Firefox 57 removed support for XUL-style extensions. The ability was [added back](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/hide) in Firefox 59 beta or 61 main.

**IV**

I expect I'll stay on Firefox at work until Chrome implements containers and tab hiding. I've used profiles before as a container replacement, but it's less convenient to have an entirely separate window for different logons (although it's more convenient to have history and bookmarks separated as well). I like tab hiding to the extent that I stayed on the ESR version of Firefox after XUL went away, but [tab hiding was not yet added to Web Extensions](https://bugzilla.mozilla.org/show_bug.cgi?id=1384515).
