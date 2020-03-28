---
layout: post
title:  "Incomplete documentation is better than no documentation"
tags: [philosophical, documentation]
---

I've encountered many systems that were poorly documented (or entirely undocumented) that I've had to figure out in the course of my work. Sometimes I get lucky and there's somebody still in the company who understands what's going on and can explain it to me. Sometimes there isn't.

**I.**

I often hear arguments against documentation, normally against making comments, but especially against making large documents outside the codebase. These quickly go stale, runs the argument, and never get looked at anyway, and so it's a waste of time making them. I feel there's an element of motivated thinking in this: making documentation is boring (I like writing code that does things) and I'm not as good at it as I am writing code (I'm not a technical writer). I can write tests, which are like code in that they look like code, and are sort of like documentation in that they tell you what the code should do. In fact, they're better than documentation! They're runnable, so they're definitely right, and they need to be kept up-to-date, or the build fails.

I feel like this misses the value of documentation: providing a high-level view of what the system should do (as a counterpart to the test's low-level view of what the system does) and providing a guide for how to implement the system (a test will frequently mock all collaborators -- you can't do that in production!). I agree that documentation is rarely read, but it (like tests) shows its value when you need it -- when you want to get up to speed quickly, when you want to know how to implement something, when you're onboarding new people onto the team. There is a tradeoff in time spent maintaining the documents, but I find they add value enough to be worthwhile.

**II.**

I find incomplete documentation more useful than no documentation. Incomplete documentation tells you something the author considered true at the time of writing, while the lack of documentation gives you no information at all. Reading incomplete documentation (or incorrect documentation) is something like archaeology -- you have the codebase in front of you, so you can check (and need to check) the documentation against the code, to see where they differ.

But the documentation can answer questions about the code, even if it no longer reflects the code. This design looks muddled because it is actually two designs, both half-implemented, and the first one is the one documented. These orphaned functions aren't used in reflection or by generated code -- they're just part of the first design and weren't properly deleted. If the codebase was started recently enough that there is a git or svn history, you could figure this out by looking there in place of external documentation -- with neither, I think it would be quite tricky to reason out. You can look at the codebase as a whole, and add tests, and increase your confidence that you're not breaking anything that way, but documentation serves as another way to increase your confidence about the intended high-level design and behaviour of the system.

**III.**

One area where writing documentation is more important than usual is when developing a product for people outside your team -- either a service, for which you'd write user documentation; or a library, for which you'd write developer documentation. I remember when I was just starting out reading the documentation for Spring and being highly impressed by the comprehensiveness and comprehensibility -- it wasn't very searchable, but I had confidence that if I navigated to the appropriate section and spent half a day reading, I'd find something I could use to solve my problem.

The rise of open source and projects being available on GitHub has increased my ability to find a solution by reading the codebase instead of the documentation, and I've found myself having to do this more often in recent years. I don't know whether this is because what I'm doing is more complicated or whether the documentation has got worse -- possibly a mix.

**Spring**

Spring is disadvantaged by its desire to keep backwards compatibility for the most part. Most of its documentation refers to doing DI using XML, which is definitely uncommon in my experience, being done mostly by teams [using it as it was originally envisaged](https://martinfowler.com/articles/injection.html), as a way of swapping out dependencies at runtime without needing to recompile. Most DI I see is for testing purposes: exposing a constructor parameter to allow a mock to be injected at test time, and will never consider changing the class used at runtime. From this perspective, the documentation makes it harder to find the most common use-case.

All [Spring code](https://github.com/spring-projects) is written in Java, a language you'll know if you're using it (unless you learnt Scala or Clojure without learning Java, which I imagine is unusual). This makes it quite readable, but the projects are quite sprawling -- something you want to know to help you in [Spring Data REST](https://github.com/spring-projects/spring-data-rest/) may be in [Spring Data Commons](https://github.com/spring-projects/spring-data-commons/), so it can be hard to find even the correct project, let alone the correct classes. Additionally, there's a lot of reflection, proxying, AOP and the like, which can make it very difficult to follow trains of calls through the codebase, or even to find where a known class is being invoked.

**Azure DevOps Pipelines**

Most [Azure DevOps Pipeline tasks](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/) have separate documentation, and I think it can be autogenerated from the [source task.json](https://github.com/microsoft/azure-pipelines-tasks), which means it should be reasonably up-to-date. The quality varies: some entries are quite comprehensive and include examples, while others are a more barebones list of inputs. The documentation itself [is on GitHub](https://github.com/MicrosoftDocs/vsts-docs), and is managed by a separate team to the tasks. Both codebases also contain references to "VSTS" (Visual Studio Team Services) and "TFS" (Team Foundation Server), the precursors to Azure DevOps pipelines.

The code for the tasks is written in a combination of TypeScript and PowerShell scripts. I know both languages quite well, so I'm fortunate here in that I can look at the scripts when it comes time to debug why I'm seeing an error message, or why a parameter doesn't appear to be used. The code is mostly imperative, but can be spread across many files. Tasks often log things, so the easiest way to find a particular file is often to search for a log message. Lower versions of scripts tend to have fewer files and so be easier to follow than later versions, but I found, on the whole, it simple enough to discover the workings of the tasks.

**IV.**

The [Bell Systems Technical Journal of 1983](https://archive.org/stream/bstj62-7-2365#page/n21/mode/2up) describes something we would recognise as a modern-day agile process, but places "writing user documentation" firmly as a developer responsibility. I'm not sure this is the case nowadays: when I reported [an issue in the Azure DevOps documentation](https://github.com/MicrosoftDocs/vsts-docs/issues/3099), the response indicates that the team that make the product and the team that write the documentation are separate. This is somewhat reasonable -- each team can specialise in either code or words -- but does lead to flaws where the teams can get out of sync in terms of knowing the requirements. I feel that after the [Agile Manifesto](https://agilemanifesto.org/) stated the importance of working software over comprehensive documentation, the pendulum swung out -- nobody likes writing documentation anyway, why have it? -- but I feel that having the system be documented should be part of the deliverable, and I'd rather it swing back a bit.
