---
layout: post
title:  "Basic CSS: Opacity on overlapping components"
tags: [webdev, css]
---

Last week, I designed an icon using two separate overlapping SVG icons (a flask with a line through it). This was to represent whether to show or hide assays (on a graph of assays and key event relations), and I wanted to fade out the icon if assays were hidden. I tried this using [`color: rgba(255, 255, 255, 0.5)`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgba()) for both icons. This didn't work:


{% highlight css%}
<div style="background-color: black; height: 120px; width: 150px">
 <div style="background-color: rgba(255, 255, 255, 0.5); height: 80px; width: 100px"></div>
 <div style="background-color: rgba(255, 255, 255, 0.5); height: 80px; width: 100px; transform: translateX(50%) translateY(-50%)"></div>
</div>
{% endhighlight %}

<div style="background-color: black; height: 120px; width: 150px">
 <div style="background-color: rgba(255, 255, 255, 0.5); height: 80px; width: 100px"></div>
 <div style="background-color: rgba(255, 255, 255, 0.5); height: 80px; width: 100px; transform: translateX(50%) translateY(-50%)"></div>
</div>

The overlapped area is lighter as the icons combine.

To fix this and have the entire construct have the same color, you can use [`opacity`](https://developer.mozilla.org/en-US/docs/Web/CSS/opacity). I found this hard to search for, but I can't see a way to get better at this other than learning basic CSS keywords as I've learnt the standard libraries of other languages.

{% highlight css%}
<div style="background-color: black; height: 120px; width: 150px">
 <div style="opacity: 50%">
  <div style="background-color: white; height: 80px; width: 100px"></div>
  <div style="background-color: white; height: 80px; width: 100px; transform: translateX(50%) translateY(-50%)"></div>
 </div>
</div>
{% endhighlight %}

<div style="background-color: black; height: 120px; width: 150px">
 <div style="opacity: 50%">
  <div style="background-color: white; height: 80px; width: 100px"></div>
  <div style="background-color: white; height: 80px; width: 100px; transform: translateX(50%) translateY(-50%)"></div>
 </div>
</div>
