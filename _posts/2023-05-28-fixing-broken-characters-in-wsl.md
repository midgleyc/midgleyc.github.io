---
layout: post
title:  "Fixing broken characters in WSL"
tags: [technical]
---

By default in WSL, certain characters used by particular applications (e.g. ⚠, the warning sign), show up as a question mark in a box. This is because the default font used, Consolas, does not support these characters.

In order to get them to display, you need to install a font that does. An oft-recommended one is "DejaVu Sans Mono for Powerline", which can be found at [the powerline fonts repository on GitHub](https://github.com/powerline/fonts/tree/master/DejaVuSansMono).

Download all the `.ttf` files, then hit the Windows key and search for `Font`, then open Font Settings. Drag and drop the TTF files into the given box. You may experience some lag, but they should all show up correctly.

After this, right-click on the WSL title bar, select `Properties`, and open the Fonts tab. Scroll down the Font options until you see "DejaVuSans Mono for Powerline", then select it.

After closing and re-opening WSL, these characters should appear correctly. If some still don't, you'll have to find a font that supports them.
