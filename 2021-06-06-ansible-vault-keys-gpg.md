---
layout: post
title: "Storing encrypted Ansible vault keys safely with GPG"
tags: [technical, ansible, gpg]
---

[Ansible vault keys](https://docs.ansible.com/ansible/latest/user_guide/vault.html) are required when running Ansible playbooks to decrypt vault secrets. Because of this, it's useful to store them somewhere accessible from the machine running the playbooks (on disk or in an environment variable as a secret, for example). If you don't have such a centralised machine, one possibility is to store the keys in the same git repository as the playbooks, encrypted so that only the dev team can access them.

If the key were encrypted using a single password, you would be right back where you started -- you'd have to somehow communicate the password to all developers, and again whenever it changed. What you really want is for each developer to be able to decode the key using their own password, which they keep secret. This can be done using [GPG](https://en.wikipedia.org/wiki/GNU_Privacy_Guard).

What you want to do is to encrypt a file for a set of "recipients" (the dev team), each of whom need to provide their public key. This encrypted file and these public keys are checked into source control: when a new developer joins the team, they add their public key to the repository and request someone already on the team re-encrypt the key with all public keys.

First, everyone on the team generates a GPG key, and exports their public key:

```bash
gpg --generate-key
gpg --armor --export --output your_name.pub
```

The keys are collected into a directory (`public_keys`, say).

Next, generate a password (e.g., you could use `pwgen`):

```bash
echo 'verySecure' > mypass
```

Now encrypt the password file using everybody's public keys:

```bash
TMP_DIR=$(mktemp -d)
gpg --homedir "$TMP_DIR" --import public_keys/*
ENCRYPT_FOR_FLAGS=$(gpg --homedir "$TMP_DIR" --list-keys --with-colons | grep uid | cut -d'<' -f2 | cut -d'>' -f1 | awk '{printf "-r " $0" "}')
cat mypass | gpg --homedir "$TMP_DIR" --trust-model always --encrypt $ENCRYPT_FOR_FLAGS --output mypass.enc
```

To use in ansible, you'll need to create a script which prints the decrypted key to stdout.

In ansible.cfg:
```
vault_password_file=gpg-decrypt
```

In gpg-decrypt:
```bash
VAULT_KEY_FILE=$(dirname $0)/relative/path/to/mypass.enc
gpg --quiet --batch --decrypt "$VAULT_KEY_FILE"
```

A relative path is used so that this file, and the `ansible.cfg`, can both be checked into version control.

You may wish to add `--quiet`, `--batch` and `--yes` to the above scripts to have them run silently without prompting for input.
