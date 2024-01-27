---
layout: post
title: "Ubuntu Pro is surprisingly cheap"
tags: [technical, financial]
---

Ubuntu LTS releases provide security updates in general support for 5 years, after which you are encouraged to upgrade to a newer release (which comes every 2 years). If you don't want to, Canonical offer "Extended Security Maintenance" for another 5 years of security updates.

If you're running Ubuntu commercially, you want security updates, as the impact could be quite severe. This means you'll (preferably) be on a [new LTS](https://endoflife.date/ubuntu) version, or failing that will pay for Ubuntu Pro to get the ESM updates.

Running AWS EC2 instances with Ubuntu Pro does not [cost that much more](https://aws.amazon.com/ec2/pricing/on-demand/) than running with plain Ubuntu. On a t3.large instance, a month with Ubuntu would cost $59.90, while Ubuntu Pro the cost would be $62.42, for a $2.52 overhead, or around 4%. The overhead is the same absolute value no matter the size of the instance (although it seem proportionally larger on smaller instances due to the lower initial overhead).

This means that continuing to pay for Ubuntu Pro is an attractive option compared to taking even one day of developer time, which can cost $500 or more for a single day, and is likely to take even longer to fix the problem (assuming there are any issues with moving to a later LTS). This might be worthwhile if there are desired features on a later LTS, but for maintenance work it's unlikely to be worth the expense.

Outside of AWS, it is a [similar story](https://ubuntu.com/pricing/pro): the cheapest "desktop" option at $25 / year, slightly cheaper than AWS's $30.24. The "server with unlimited VMs" option is only worthwhile if you're running at least 20 VMs on a single server, but the more VMs you're running, the cheaper it'll be.
