---
layout: post
title: "Notes on CIS hardening"
tags: [technical]
---

I recently had the pleasure of having to harden an Ubuntu 24.04 machine to CIS level 1 standards. Here are some of my thoughts on the process.

AWS offer the ability to [CIS scan](https://docs.aws.amazon.com/inspector/latest/user/scanning-cis.html) a box, which is very convenient for figuring out what's left to do, and also for proving everything is done. I ran this on a fresh Ubuntu 24.04 box to find out what I needed to do.

You need the AmazonInspector2ManagedCisPolicy and the AmazonSSMManagedInstanceCore (or AmazonSSMManagedEC2InstanceDefaultPolicy, which is identical) policies. You don't need the ability to view metadata tags from inside the box, but if you don't have that it displays an error message in the output (and then proceeds anyway -- it already knows from the outside that the box it's on has the tags it needs, I don't know what it checks here). You can run it on a single machine with tag: Name and value the name of the box. If it fails, you can go into SSM, then Command History, then search for something with "Cis" in the name, then find the output to get a more exact error message.

CIS offer a PDF in which each of the requirements have a description, rationale, audit script, and remediation script. This is very convenient and saves time having to figure out how to write the script yourself. However, the script has line breaks in the PDF where there should not be, and copying preserves these. Copying also strips all the indentation. So in order to actually run the script, you have to copy it, and then glance back at the PDF in order to remove all the linebreaks the script shouldn't have. This makes the process rather more aggravating than it needs to be.

CIS requires that /tmp is mounted noexec, which means that scripts can't run out of it. This is the worst sort of security theatre, combining being no issue to an attacker, who will simply try a different folder, of which there are many (the most obvious being the user's home directory), but breaking many common installation scripts / processes. For example, many Python packages put code into /tmp and try to use GCC to compile C code. This prevented the install of [SIFT](https://www.sans.org/tools/sift-workstation), so I did the install *first* and then hardened the box.

This also means that the tests run by EC2 Image Builder (and theoretically any component run after the hardening) fail. You can fix this by changing the working directory in the recipe.

I was able to eliminate the entire SSH section by uninstalling SSH (connection is done solely through SSM), which felt great! However, I still had to implement password security on a machine where none of the users have passwords, which was less great. Yes, in theory I could add a password to a user -- but no users use these to log in! You literally can't log in except through SSM! I suppose if you added a password, you could use the serial console. Still, this felt like a massive waste of time.

I also managed to break everything after reboot by setting a bootloader password (that no user will ever see or enter, because the box is hosted on AWS and you could simply set up a new machine and move the drive across if you wanted to hack it). Fortunately, the PDF tells you what you needed to have done -- add `--unrestricted` to the line starting `CLASS=`. This one is particularly fun because the box will work fine until it reboots, at which point SSM is unable to contact it (because it hasn't finished booting), so in addition to being unable to log on, you're unable to use `Run-Command` to check anything.
