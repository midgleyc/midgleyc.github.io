---
layout: post
title:  "C#'s double.Parse accepts non-numbers"
tags: [technical, dotnet]
---

In C#, `double.Parse` will accept strings that are non-numeric, such as `1,,,0`. This can be changed by passing a [`NumberStyles`](https://learn.microsoft.com/en-us/dotnet/api/system.globalization.numberstyles?view=net-9.0) enum.

`AllowLeadingSign`, `AllowDecimalPoint` and `AllowExponent` are likely all desired. `AllowHexSpecifier` and `AllowBinarySpecifier` are less expected, but unlikely to ruin the parsing. `AllowCurrency` will drop the currency symbol, which could be confusing. `AllowLeadingWhite` and `AllowTrailingWhite` allow for certain whitespace characters at the start or end, which seems avoidable with a `trim()`.

`AllowThousands` leads to the issue with commas. The [documentation](https://learn.microsoft.com/en-us/dotnet/api/system.globalization.numberformatinfo.numbergroupsizes?view=net-9.0#system-globalization-numberformatinfo-numbergroupsizes) suggests that only digit groupings numbering `NumberGroupSizes` should be accepted, but in practice it appears to accept consecutive commas, or commas separating groups of any size.

This issue arose when parsing what was intended as a list of numbers (e.g. `200,201,202`) as a single number, stripping the commas.
