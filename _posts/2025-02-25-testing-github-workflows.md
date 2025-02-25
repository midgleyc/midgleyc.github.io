---
layout: post
title:  "Testing GitHub Workflows Without Merging"
tags: [technical, github]
---

GitHub allows you to run workflows that exist on the default branch from the Actions tab, and also to run these workflows from a different branch. That's all well and good if you want to change an existing workflow, but the process to run a new workflow is slightly more complicated.

For this, the easiest method is to use the [`gh`](https://cli.github.com/) CLI tool. In the appropriate repository, you can use `gh workflow list` to list all workflows that have run on any branch. It'll show their name if it managed to get that far, and otherwise the file path, together with an ID. You can use `gh workflow run <id|name>` to run a workflow, and `gh workflow run <id> --ref <branch>` to run the workflow as it appears on a certain branch.

In order to use this to run a new workflow, you have to make the workflow run once. If you add `push:` to the `on:`, it'll run; you can also add `pull_request:` to have it run if you've filed a PR. When doing this you might want to add a step to force the run to fail (e.g. `run: exit 1`) if you want to set particular input variables or something. Once this is done it's fine to remove the commit and force push so it no longer appears anywhere in the branch. After running the workflow once, you can use the CLI commands to run it after further changes.
