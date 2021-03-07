---
layout: post
title: "Debugging ancient PHP scripts"
tags: [technical, php]
---

Modern browsers have a "feature" where if a page takes too long to send anything (headers / body) it times out. I can't find a way to stop this on the frontend, but it's annoying for debugging old, slow, half-broken scripts designed for IE7 (in PHP 5.4/Apache, where I am at the moment).

I'm currently sending a simple header and some trivial content, hoping that it'll get to a point where it crashes without closing the connection, timing out, or giving net::ERR_INCOMPLETE_CHUNKED_ENCODING.

I'm using:

```php
header('Content-Type: text/plain');
ob_flush();
echo ob_get_level();
flush();
```

This is classic "throw things at a wall to see what sticks" code. However, even minor changes to this have broken: without the first `ob_flush`, I get a white screen; with `echo 0;` instead of `echo ob_get_level();` I get an error in the chunked encoding.

Eventually I get something like:

```html
0<br />
<b>Fatal error</b>:  Allowed memory size of 134217728 bytes exhausted (tried to allocate 32 bytes) in <b>/var/www/html/update_database.php</b> on line <b>94</b><br />
```

and aha! The script was trying to read the entire database into memory!
