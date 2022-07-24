---
layout: post
title: "Coding in Wiki Templates"
tags: [technical, wiki]
---

My first major programming projects, before university, involved coding using wiki templates.

[Wiki templates](https://meta.wikimedia.org/wiki/Help:Template) are snippets designed to be used on other pages. For example, the earliest version of `Template:Stub` had the content

```
''This article is a [[Wikipedia:The perfect stub article|stub]]. You can help Wikipedia by [[Wikipedia:Find or fix a stub|fixing it]].''
```

It could be included in an article as {%raw%}`{{stub}}`{%endraw%}. If the text wanted to be changed (or to have a box set around it), it would only need to be changed in this one place.

Templates commonly take parameters: either numeric or keyworded, which when passed in change the text content. For example, a template that eases linking to other templates, `Template:tl`

{% raw %}
```
&#123;&#123;[[Template:{{{1}}}|{{{1}}}]]&#125;&#125;
```
{% endraw %}

Called using {%raw%}`{{tl}}`{%endraw%} displays {{"{{"}}[tl](https://en.wikipedia.org/wiki/Template:Template_link)}}.

The initial {%raw%}`{{`{%endraw%} characters need to be escaped, as you can call one template from another template.

{% raw %}
```
{{LastMonth}} <- {{Month}} -> {{NextMonth}}
```
{% endraw %}

and additionally you can pass in a parameter with the name of the template to call:

{% raw %}
```
The output of Template:{{{1}}} is {{{{{1}}}}}.
```
{% endraw %}

Using this, you can create [data pages for items](https://kol.coldfront.net/thekolwiki/index.php/Data:Helmet_turtle):

{% raw %}
```
<includeonly>{{{{{format}}}|
name=helmet turtle|
plural=helmet turtles|
image=turtle.gif|
{{{1|}}}}}</includeonly><noinclude>{{{{FULLPAGENAME}}|format=item/meta}}</noinclude>
```
{% endraw %}

When a template page is displayed, the text inside `<includeonly>` is not included. When a template is included in a page (i.e. as {%raw%}`{{template}}`{%endraw%}), the text inside `<noinclude>` is not included. This template says to call the template provided as the `format` variable (above, `item/meta`) with the parameters `name=helmet turtle`, `plural=helmet turtles`, `image=turtle.gif`, and one extra numeric parameter, defaulting to empty (not provided above, but you could enter it as {%raw%}`{{Data:Helmet turtle|format=my_template|my_extra_variable}}`{%endraw%}).

The above style is good if you need all of the variables (or more than one), as there's a limit on how many templates can be transcluded in a single page that you might breach if you took them all individually. To extract a single one, you can use [#switch](https://www.mediawiki.org/wiki/Help:Extension:ParserFunctions##switch):

{% raw %}
```
{{Data:{{{1}}}|format=#switch:{{{2}}}|{{{3}}}}}
```
{% endraw %}

This lets you call pass in a keyword (e.g. `image`) as the second parameter, and get either the value of that parameter or the third parameter you've provided as a default (using the spare numeric parameter on the data page above).

Note the interesting behaviour here -- {%raw%}`{{{format}}}`{%endraw%} is replaced with `#switch: mykey`, and then the whole construct is interpreted as a {%raw%}`{{#switch}}`{%endraw%} parser function. This delayed parsing lets you make templates that can embody very complex behaviour.
