---
layout: post
title:  "A Use-Case for Monkeypatching Python's stdlib"
categories: python monkeypatch
---

**I.**

Some languages, such as C# and Kotlin, allow the declaration of extension methods -- new methods callable on existing classes, without needing access to the original source code. Some languages, such as Python, go further and allow you to modify the behaviour of existing function calls (known as "monkeypatching").

**II.**

At Swivel Secure, I was working in Python 3.3, and I wanted a version of copytree (copy a directory and all interior files and folders) that copied ownership and allowed the target folder (and files) to already exist. I can't remember exactly what this was for, but I think it was for backup purposes, and I eventually replaced it with [`tarfile`](https://docs.python.org/3.3/library/tarfile.html), which does exactly what I wanted.

You can handle copying ownership by providing a custom `copy_function`, and in Python 3.8, you can almost do this with the `dirs_exist_ok` parameter -- the only difficulty being that attempts to overwrite existing symlinks will fail.

**III.**

The code for `copytree` in Python 3.3 can be found [on GitHub](https://github.com/python/cpython/blob/3.3/Lib/shutil.py). Neither the [option for making a directory](https://github.com/python/cpython/blob/3.3/Lib/shutil.py#L301) nor for [creating symlinks](https://github.com/python/cpython/blob/3.3/Lib/shutil.py#L311) are exposed as arguments to the function:

{% highlight python%}
os.makedirs(dst)
{% endhighlight %}

{% highlight python%}
if symlinks:
    # We can't just leave it to `copy_function` because legacy
    # code with a custom `copy_function` may rely on copytree
    # doing the right thing.
    os.symlink(linkto, dstname)
    copystat(srcname, dstname, follow_symlinks=not symlinks)
{% endhighlight %}

`os.makedirs` will fail if the directory exists, and `os.symlink` will fail if the symlink it tries to create exists. We could copy the entire function and change the relevant parts, but that introduces a lot of extra code into our project, and we won't get bugfixes that happen down the line. You could argue that this way you have some code that definitely won't change and passes all your tests (i.e. does what you want), so it would be a benefit, but tying yourself to an older verson's code like this could lead to a less understandable project compared with using the library source.

**IV.**

I chose to monkeypatch the standard library around "copytree" calls. The relevant code section of the project is:

{% highlight python lineno %}
import os
import shutil

def copytree(src, dst, symlinks=False):
    """Recursively copy src to dst.

    It is not required that the target directory does not exist.
    """
    _makedirs = os.makedirs
    os.makedirs = lambda x: _makedirs(x) if not os.path.isdir(x) else False
    _symlink = os.symlink
    # os.unlink returns None (False)
    os.symlink = lambda x, y: os.path.islink(y) and os.unlink(y) or _symlink(x, y)

    shutil.copytree(src, dst, symlinks, copy_function=copy, ignore_dangling_symlinks=True)
    copy_ownership(src, dst)

    os.makedirs = _makedirs
    os.symlink = _symlink


def copy(src, dst):
    """Copy src to dst, preserving ownership."""
    try:
        shutil.copy2(src, dst)
    except IsADirectoryError:  # allow for bug in shutil.copytree
        shutil.copytree(src, dst, copy_function=copy, ignore_dangling_symlinks=True)
    copy_ownership(src, dst)

def copy_ownership(src, dst):
    """Copy ownership of src to dst."""
    stats = os.stat(src)
    uid = stats.st_uid
    gid = stats.st_gid
    os.chown(dst, uid, gid, follow_symlinks=False)
{% endhighlight %}

`copy_ownership` copies the user id and group id from files or directories. `copy` copies files or directories, preserving ownership, and works around [bug 21697](https://bugs.python.org/issue21697), which was never fixed in Python 3.3. Finally, `copytree` shows the monkeypatching.

I store the original behaviours, call `copytree` (and `copy_ownership` for the source directory), then restore the original behaviours (not doing so could lead to subtle bugs in other parts of the codebase where this behaviour is unexpected). In this project, I opted to create them as lambdas: this is worse for readability than creating real functions for them, especially as I felt I had to comment the symlink one to show how it worked.

`makedirs` is replaced by a function that calls the original only if the directory doesn't exist. For `symlink`, as the symlink target may be pointing somewhere else, I remove the original symlink if it is present.

**V.**

Monkeypatching is normally not recommended -- it leads to code that is less readable and more fragile than other strategies. I believe in this case it was a good choice -- the other option I considered (copying code from the standard library and modifying it) would have lead to even less readable code, as it would have been less clear why the code was copied and modified instead of just using the existing library code.

It's a lot nicer when library code provides places to inject your own functions into the library calls, as in `copytree`'s `copy_function`. This is the O of [SOLID](https://en.wikipedia.org/wiki/SOLID) -- the behaviour of libraries should be modifiable without having access to the source code -- and is most frequently implemented using dependency injection.
