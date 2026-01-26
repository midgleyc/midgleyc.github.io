---
layout: post
title: "Using an SMB server to transfer files between computers"
tags: [technical]
---

If you have a set of files you want to transfer between computers, the easiest way is probably using a USB stick, emailing them to yourself or using cloud storage. But if you're on a more locked-down machine, or you don't want to store them on someone else's computer (the cloud), you can use an SMB server.

Windows has this inbuilt as "Network File and Folder Sharing". Create a new folder at the root of the C:/ drive, right-click on it in File Explorer and click `Properties`. Click onto the `Sharing` tab, then click `Share`. Give Everyone Read permission (or Read/Write if you want two-way sharing, which you probably don't). If you click the link through to the Network and Sharing Centre, you can disable password-protected sharing. If you decide not to do that, you can either log in using your existing account, or create a new account solely for file shares (while Windows makes this harder every year, you can still create a local account usable only on the machine with the file share).

To access this from another Windows machine, first find the Network Path of the folder you're sharing, visible in the `Sharing` tab in `Properties` you opened earlier. On the machine you want to access the files on, open command prompt (cmd) or Powershell. Type `net use * \\DESKTOP-NAME\folder`, where `\\DESKTOP-NAME\folder` is the Network Path of the folder. You can use a drive letter instead of `*`, but `*` means to use the first available drive, which is quite convenient.

On a Mac, open Spotlight and type "Connect to server". Selecting the result should prefill with "Connect to server at `smb://computer.local`". Fill it in: `smb://DESKTOP-NAME/folder`, then enter the credentials. You may get an error about being unable to connect, but if you open Finder you should see the share present.
