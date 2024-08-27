---
layout: post
title: "Solve Specific Problems"
tags: [technical, philosophical]
---

Suppose you have a particular problem. When solving it, you can look into things which might solve only that problem, or try to see it as a case of a more general problem, which you already know how to solve. This is common, but the solution to the general problem can be much more complicated than a solution to the specific problem.

To give a specific example, suppose that you have an on-premises application where users occasionally trigger a job which requires much more RAM than normal. If run on a machine sized for normal loads, it takes several hours, but a significantly larger machine can run the job in less than an hour. Ideally, to minimise load across the organisation, you'd like to run the larger machine only when a user requests this particular job.

With experience in the cloud space, this looks like a clear example of a problem solved by autoscaling: detect when RAM usage is high, and scale up, then detect again when RAM usage is low, and downscale. Given that you already know how to solve this problem, the temptation is to move the on-premises application into the cloud.

This is likely to be incredibly costly. Many things such as networking and secrets management are much less of a problem on an on-premises system inside your DMZ, so there is likely some redesign that needs to be done (and some straight-up design if this was never considered). Additionally, most default autoscaling implementations deal with horizontal scaling instead of vertical scaling, so if you use these, you might have to rearchitect your application (if horizontal scaling wouldn't improve things). If you don't already have a cloud presence, you may need to hire additional workers with previous experience to help manage it, and need to add this requirement to your recruiting going forwards.

Even if you decide to stay on-premises, you may still want to use a framework you know supports autoscaling: for example, you could create a kubernetes cluster on which to deploy your application. This has similar issues to the cloud: you need experts, and you need horizontal scaling to work. Additionally, if vertical scaling is used the maximum possible allowance needs to always be available to the cluster, and unless the rest of the business is also running workloads on the cluster, that large machine won't be available to them.

The original problem had a feature rendering it much simpler than the average autoscaling problem: the large machine was only required if a particular job was requested. Generally, CPU and RAM are monitored due to the prospect of a large number of calls requiring additional instances: for an in-house application, this is unlikely. Instead, the process triggering the job can request the larger machine, then run the job on it, then return the larger machine back to the business.

If the job is run rarely or with times known in advance, this can even be done manually: the person wanting to run the job shoots off an email, and somebody requests the larger machine, sets the job to run, waits for it to complete, and returns the larger machine. This is inelegant, but requires no development time, and the cost of the worker running these manual steps is likely to be significantly lower than the cost of a properly developed project.
