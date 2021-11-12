---
layout: post
title: "Fixing a hanging git pull"
tags: [technical, linux]
---

Occasionally `git` will hang on a `push` or `pull` using an SSH key until it times out. Using HTTP(S) mode instead is a workaround but undesired because it requires faffing about with passwords.

When this happens (once or twice a day, on Ubuntu), I previously got around it by restarting the machine. A less severe fix is to restart the network:

```bash
sudo systemctl restart NetworkManager.service
```

Immediately after that, `git` starts responding instantly again.
