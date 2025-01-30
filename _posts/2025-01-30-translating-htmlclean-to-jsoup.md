---
layout: post
title:  "Translating HtmlCleaner to Jsoup"
tags: [technical, java]
---

[HtmlCleaner](https://htmlcleaner.sourceforge.net/) is an HTML parser written in Java that converts HTML to well-formed XML, and allow you to use the DOM and XPath to locate particular elements. [JSoup](https://jsoup.org/) is a different parser that converts HTML more as browsers do, and allows you to use the DOM and XPath, and also a querySelector-like filter to find elements.

The following table shows how to convert common DOM / XPath functions from HtmlCleaner into Jsoup.

| HtmlCleaner | Jsoup | Notes |
| ----------- | ----- | ----- |
| `new HtmlCleaner().clean` | `Jsoup.parse` ||
| `TagNode` | `Element` ||
| `TagNode.getName()` | `Element.tagName()` ||
| `TagNode.getAllChildren()` | `Element.childNodes()` | children() is just Elements |
| `TagNode.getAttributeByName(X)` | `Element.attr(X)` | returns blank string instead of null on missing, you can use `hasAttribute` to check if a blank-string attribute exists |
| `TagNode.getAttributes()` | `Element.attributes()` | not a map, but can be iterated over |
| `TagNode.getElementListByName("X", true)` | `Element.children().select("X")` | need children() to avoid matching current element |
| `TagNode.getElementListByName("X", false)` | `Element.select(">X")` | |
| `TagNode.getElementsByName("X", true)` | `Element.children().select("X")` | need children() to avoid matching current element, need .size() instead of .length |
| `TagNode.getElementsByName("X", false)` | `Element.select(">X")` | need .size() instead of .length |
| `TagNode.getChildTags()` | `Element.children()` | |
| `TagNode.getText().toString()` | `Element.wholeText()` | text() collapses spaces |
| `TagNode.getParent()` | `Element.parent()` | |
| `TagNode.getParent().removeChild(X)` | `X.remove()` | |
| `TagNode.findElementByName("X", true)` | `Element.children().select("X").first()` | |
| `TagNode.findElementByName("X", false)` | `Element.selectFirst(">X")` | |
| `TagNode.findElementByAttValue("X", "Y", true, false)` | `Element.children().select("[X=Y]").first()` | |
| `TagNode.findElementByAttValue("X", "Y", false, false)` | `Element.selectFirst(">[X=Y]")` | |
| `TagNode.evaluateXPath(X)` | `Element.selectXpath(X, Node.class)` | See XPath section below |
| `BaseToken` | `Node` | |
| `BaseToken.getName()` | `Node.nodeName()` | if you're operating on Nodes instead of Elements|
| `ContentNode` | `TextNode` | |
| `ContentNode.getContent()` | `TextNode.getWholeText()` | text() collapses spaces | |
| `CommentNode` | `Comment` | |
| `CommentNode.getContent()` | `Comment.getData()` | |

# XPath

HtmlCleaner will allow invalid XPath queries. For example, `//label/input[@type='checkbox']@checked` is treated the same as `//label/input[@type='checkbox']/@checked` (extra slash between `]` and the last `@`). In general, it looks like the query splits at non-alphabetic characters, so adjacent punctuation characters don't need to be separated by a slash. If this is exposed to the user anywhere, user-defined functions may break.

Jsoup also cannot return non-nodes from its XPath implementation, so things like `//@value` won't work. You can get around this by returning the node and then doing `.attr("value")`, but it's less convenient.

Jsoup also seems more performant if you use its CSS selector than its XPath selector, but either way is slower than the HtmlCleaner XPath.

# Attribute escaping

HtmlCleaner will prefer to escape entities where possible (e.g. `&apos;`). Jsoup will prefer to *not* escape entities where not necessary (e.g. `'`). This will mean that if you're looking for a particular string (e.g. `contains` or regex) you may need to change the search.
