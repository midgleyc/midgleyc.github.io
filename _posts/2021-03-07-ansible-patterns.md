---
layout: post
title: "Ansible Patterns"
tags: [technical, ansible]
---

I've been using [Ansible](https://www.ansible.com/) for a while now, and there are certain common practices I've observed, recorded here in the spirit of [Design Patterns](https://en.wikipedia.org/wiki/Design_Patterns).

A lot relate to the proper way to define variables. You can override variables in a [22-item variable precedence list](https://docs.ansible.com/ansible/2.10/user_guide/playbooks_variables.html#understanding-variable-precedence), which has a few surprises -- while not explicitly stated, default variables in your role will be overridden by default variables in a role that your role calls. This can cause issues. Note also that ["role vars" and "role params"](https://github.com/ansible/ansible/issues/70397#issuecomment-651952866) are different but easily confusable.

Ansible's [tips and tricks](https://docs.ansible.com/ansible/2.10/user_guide/playbooks_best_practices.html), particularly related to the use of vaulted variables, are also useful.

## Use flat objects

Instead of

```yaml
backups:
  rate: 'weekly'
  store: 's3'
```

use

```yaml
backups_rate: 'weekly'
backups_store: 's3'
```

### Why?

Flat objects can be overridden individually more easily. The [default behaviour for hashes](https://docs.ansible.com/ansible/2.10/reference_appendices/config.html#default-hash-behaviour) is that a newly defined hash completely replaces the previous one, instead of merging. The can be configured at the user level, but is a global setting and can break other roles.

At the task level, you can use the [combine filter](https://docs.ansible.com/ansible/2.10/user_guide/playbooks_filters.html#combining-hashes-dictionaries) to merge hashes.

## Split variables across files

Instead of

defaults/main.yml
```yaml
<100 variables>
```

use

defaults/main/well-named.yml
```yaml
<50 variables>
```

defaults/main/different-good-name.yml

```yaml
<50 variables>
```

### Why?

Ordering makes it easier to note structure at a glance. This is likely rare only because the [documentation makes it hard to see this is possible](https://docs.ansible.com/ansible/2.10/user_guide/playbooks_reuse_roles.html):

> By default Ansible will look in each directory within a role for a `main.yml` file for relevant content (also `main.yaml` and `main`):

## Fail safely when targeting specific hosts

Instead of

playbook.yml
```yaml
---
- hosts: all
```

called as `ansible-playbook playbook.yml --limit <target>`

use

playbook.yml
```yaml
---
- hosts: '{{ target }}'
```

called as `ansible-playbook playbook.yml --extra-vars target=<target>`

### Why?

If you mistakenly call the first without specifying a limit, you'll run on all hosts in the inventory. If you mistakenly call the second without specifying extra vars, you won't run at all.

## If running on both Windows and Linux, partition only the different parts

Running on both Windows and Linux is uncommon, but possible. Frequently, you'll have playbooks or roles that are almost identical except for calls out to `service` or `win_service`, or `copy` or `win_copy`. Split these into their own files and call them based on either `ansible_facts['distribution']` or by noting the OS in the `hosts` file -- the latter being required if methods to log on are different (e.g. Windows login requires a Kerberos token and Linux login does not). You can note the OS in the host file by, for example, specifying the host under a `[windows:children]` header.

Example:

tasks/main.yml
```yaml
- name: Start deployment
  debug:
    msg: "##teamcity[blockOpened name='service-config'] description='Deployment Start'"

- block:
    - block:
        - name: Install (Windows)
          include_tasks: windows-install.yml
      when: "'windows' in group_names"

    - block:
        - name: Install (Linux)
          include_tasks: linux-install.yml
      when: "'linux' in group_names"
      become: yes

  always:
    - name: Finish deployment
      debug:
        msg: "##teamcity[blockClosed name='service-config']"
```

tasks/windows-install.yml
```yaml
- name: Call other role
  include_role:
    name: deploy-other-thing
    tasks_from: windows-deploy-other-thing

- import_tasks: common.yml

- name: Restart service
  win_service:
    name: "Service-Win"
    state: restarted
```

tasks/linux-install.yml
```yaml
- name: Call other role
  include_role:
    name: deploy-other-thing
    tasks_from: linux-deploy-other-thing

- import_tasks: common.yml

- name: Restart service
  service:
    name: "Service-Lin"
    state: restarted
```

tasks/common.yml
```yaml
- name: Post a helpful message
  debug:
    msg: "Going good!"
```

### Why?

Minimises duplication. Better still might be to have a module that can call `win_X` if on Windows or `X` if on Linux, but I couldn't find one.
