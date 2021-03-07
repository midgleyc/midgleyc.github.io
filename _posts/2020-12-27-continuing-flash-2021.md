---
layout: post
title:  "Continuing to Use Flash in 2021"
tags: [technical, flash]
---

[Adobe Flash](https://en.wikipedia.org/wiki/Adobe_Flash) becomes end-of-life in Janurary 2021. Despite that, it's still used for business apps and tools. Most have upgrades, but perhaps you weren't able to convince your boss to let you schedule one. This post gives some options on what you can do.

Upgrade, rewrite or seek alternatives
-------------------------------------

The easiest option is to upgrade or find an existing competing product that serves your needs. For example, if you're on vCenter 6.5, try [upgrading to vCenter 6.7](https://blogs.vmware.com/vsphere/2020/04/vsphere-web-client-support-beyond-adobe-flash-eol.html).

If the application has no working upgrades, this is a consideration to be made when renewing (if the application is paid-for). In this case you could give greater weight to a competing product.

If the application is internal and fairly simple, you could request some developer time be set aside to recreate it (or to create a similar app with the same features) in HTML5.

Use an emulator
---------------

Emulators convert SWFs into JavaScript or Web Assembly. They often run on desktop or as browser extensions. More modern offerings tend to offer a script you can place on a web page to let it run for users without any extension or plugins installed.

* [Ruffle](https://github.com/ruffle-rs/ruffle/) is free (with the option to pay a subscription for support and faster development of your requested features) and offers an extension and a server-hosted script. It supports most old Flash applications (AVM0/1) well, and doesn't really support newer ones (AVM2 / ActionScript 3) at all.
* [CheerpX](https://www.leaningtech.com/pages/cheerpxflash.html) is expensive, but the enterprise option. Based on the video and screenshots on that page, it offers an extension and a server-hosted script, though I've not used it personally. It supports any Flash app.
* Older emulators such as [lightspark](https://github.com/lightspark/lightspark) are no longer an option in 2021: as browsers remove all support for flash, these extensions will stop working, as no server-hosted script or non-plugin extension are provided.

Continue using Flash (not recommended)
--------------------------------------

Continuing to use Flash is tricky and insecure: modern browsers will not support it, Flash will try to uninstall itself, and your OS may also try to remove it. You'll probably wind up using [Edge or Internet Explorer](https://web.archive.org/web/20201215082139/https://blogs.windows.com/msedgedev/2020/09/04/update-adobe-flash-end-support/), perhaps in a Windows 7 VM.

Follow the instructions linked from the [Enterprise EOL Information Page](https://web.archive.org/web/20201224085411/https://www.adobe.com/products/flashplayer/enterprise-end-of-life.html). This page recommends you get in touch with HARMAN for commercial support. You may wish to do so.

Following the instructions, you want to add domains where Flash playback is allowed, and remove the uninstall prompts. Details are found in the [Adobe Flash Players Administration Guide](https://web.archive.org/web/20201219013719/https://www.adobe.com/content/dam/acom/en/devnet/flashplayer/articles/flash_player_admin_guide/pdf/latest/flash_player_32_0_admin_guide.pdf).

First, create an `mms.cfg` file in the correct place according to your OS and browser (Chromium browsers using Pepper Flash use a different location).

| Operating System / Browser | File Location |
| -------------------------- | ------------- |
| Windows (32-bit) | %windir%\System32\Macromed\Flash\mms.cfg |
| Windows (64-bit) | %windir%\SysWOW64\Macromed\Flash\mms.cfg |
| Edge Chromium (New Edge) on Windows | %localappdata%\Microsoft\Edge\User Data\Default\Pepper Data\Shockwave Flash\System\mms.cfg |
| MacOS | /Library/Application Support/Macromedia/mms.cfg |
| Linux | /etc/adobe/mms.cfg |

In the file, add the following lines:
```conf
EOLUninstallDisable=1
```
This will prevent the uninstall prompt from appearing, but won't prevent your users from uninstalling Flash. If you've set `AutoUpdateDisable=1` already (to disable all updates), this is not required.

```conf
EnableAllowList=1
```
This requires you to set `AllowListUrlPattern=<something>` in order to use Flash on given domains. After Flash EOL, it will be assumed to be true. Before the end of the year, you can test it using `AllowListPreview=1` and `TraceOutputEcho=1` to see, in the web console, whether a given SWF or Flash resource is allowed. After Flash EOL, you'll have to [configure](https://helpx.adobe.com/flash-player/kb/configure-debugger-version-flash-player.html) and use the [debug version](https://www.adobe.com/support/flashplayer/debug_downloads.html) of Flash Player.

```conf
AllowListRootMovieOnly=1
```
This only applies restrictions to the parent SWF loaded on a given page. That SWF can then load XML files or other SWFs (or anything else) from any location. This is less secure, but much easier to configure.

```conf
EnableInsecureAllowListLocalPathMatching=1
```
If you're using a local desktop application that uses non-conformant `file:` and `blob:` URIs, this option enables more permissive matching that may allow an application like this to work.

```conf
AllowListUrlPattern=*://my-intranet/my-admin-panel
AllowListUrlPattern=https://secure-site/some-other-utility
```

Specify multiple `AllowListUrlPattern`s for each site, directory or specific SWF you want to allow. A `*` for a scheme allows `http` and `https` only: for example, `file` is not included.

You may wish to set up a reverse proxy for useful utilities to simplify the configuration of allowed domains.
