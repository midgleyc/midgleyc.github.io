---
layout: post
title:  "Web Development upskilling: Creating a minimap for an SVG"
tags: [technical, webdev, svg]
---

**I.**

I find it easier to learn new skills if I have a project to work on. I knew that for my current project, I want to learn more CSS, vanilla JavaScript and SVG. I thought a project that could involve all three was creating a minimap: take a large SVG image, duplicate it in miniature, and allow the user to drag a square around the miniature replica to move the view around the larger one. Somewhat like the minimap in an RTS like Age of Empires (although that involves a simplification in the smaller map I don't think I'd go for).

<figure>
  <a title="Lancer-X/ASCEAI [CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0)], via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Meritous-automap.png"><img alt="An example of a minimap: A large map in the game Meritous, and two smaller maps. Each smaller map has a highlighted section representing where the larger map occurs in it." src="{{site.url}}/assets/2019-12-meritous.png"></a>
  <figcaption>An example of a <a href="https://en.wikipedia.org/wiki/Mini-map">Mini-map</a>, from the game Meritous</figcaption>
</figure>

**II.**

While researching how to start, I was lucky enough to find a [page on scaling SVGs](https://css-tricks.com/scale-svg/) which gave me everything I needed: how to reference already-existing elements without duplicating the code, and what `viewBox` was.

<object type="text/html" data="{{site.url}}/assets/2019-12-minimap/minimap.html" width="700px" height="450px"></object>

You can view the frame source to see all the code in detail, and I'll highlight the important parts below.

**III.**

The first important part is the ability to reference the existing SVG object without recreating it, either manually or using JavaScript to get all the DOM nodes and reproduce them elsewhere. 

{% highlight html %}
<svg>
<g id="allCircles">
 [...]
</g>
</svg>
[...]
<svg>
 <use href="#allCircles"/>
</svg>
{% endhighlight %}

You can use [SVG use](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use) with a href of the original element to reuse a node. This means that if you group all the nodes with a unique ID in either the minimap or the larger version (which I've called the maximap), you can reference it in the other one!

**IV.**

The second problem involves moving the minimap hover-square as the user drags. I could have handled this by applying CSS transforms in pixels to the SVG-defined rectangle, but I wanted to be able to just adjust the x and y coordinates in SVG form. As this didn't map onto pixels directly, I needed to apply a transformation after calculating how the user had moved their mouse.

{% highlight javascript %}
function drag(e) {
	if (active) {
		e.preventDefault();
		move(e);
		currentX = e.clientX;
		currentY = e.clientY;
	}
}

function move(e) {
	var movedX = e.clientX - currentX;
	var movedY = e.clientY - currentY;
	var movedSvgX = movedX * computeSvgRatioHeight(container);
	var movedSvgY = movedY * computeSvgRatioWidth(container);

	newSvgX = +dragItem.getAttribute("x") + movedSvgX;
	newSvgY = +dragItem.getAttribute("y") + movedSvgY;
	dragItem.setAttribute("x", newSvgX);
	dragItem.setAttribute("y", newSvgY);
	[...]
}

function computeSvgRatioHeight(svg) {
	var svgHeight = svg.clientHeight;
	var svgViewHeight = svg.viewBox.baseVal.height;
	return svgViewHeight / svgHeight
}

function computeSvgRatioWidth(svg) {
	var svgWidth = svg.clientWidth;
	var svgViewWidth = svg.viewBox.baseVal.width;
	return svgViewWidth / svgWidth
}
{% endhighlight %}

After computing how far the mouse has moved since the last check (`movedX`, `movedY`), we scale by the ratio of the viewport of the SVG to the height of the SVG in pixels. We then add that to the existing coordinates of the rectangle.

**V.**

The last problem is to make the minimap actually function as a minimap, and drag the larger map as the user moves the mouse.

{% highlight javascript %}
	maximap.viewBox.baseVal.x = newSvgX;
	maximap.viewBox.baseVal.y = newSvgY;
{% endhighlight %}

For this one, I can choose the initial parameters to make this one just fall out: if the height and width of the rectangle on the minimap are the same as the height and width of the viewbox on the maximap, and the two maps share the same initial coordinates, then the viewbox `x` and `y` can be set to the rectangle's `x` and `y`. If not, this would involve an additional coordinate transformation, but it's easier to just set the initial parameters so that the variables come out to 0.
