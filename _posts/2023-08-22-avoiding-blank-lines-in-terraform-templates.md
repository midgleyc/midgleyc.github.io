---
layout: post
title:  "Avoiding blank lines in Terraform templates"
tags: [technical, terraform]
---

You can use [Terraform templates](https://developer.hashicorp.com/terraform/language/expressions/strings#string-templates) to include or omit lines of configuration (or scripts) based on some condition:
```tftmpl
this is always present
%{ if condition }
this is present
%{ endif }
this is also always present
```

If `condition`, this will print

```
this is always present

this is present

this is also always present
```

otherwise, it will print

```
this is always present

this is also always present
```

You can avoid the blank lines by carefully setting up your template
```tftmpl
this is always present%{ if condition }
this is present%{ endif }
this is also always present
```

or you can keep the nice formatting by using a [strip marker](https://developer.hashicorp.com/terraform/language/expressions/strings#whitespace-stripping) at the _start_

```tftmpl
this is always present
%{~ if condition }
this is present
%{~ endif }
this is also always present
```
