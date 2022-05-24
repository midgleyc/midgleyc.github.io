---
layout: post
title: "Installing private GitHub packages from CI"
tags: [technical, npm, javascript, github]
---

While developing microservices or other projects, it can be useful to extract shared functionality into a library that can be used across all projects. To avoid copying or vendoring, it's convenient to put this library somewhere external where it can be installed -- often an external registry. In the absence of a registry, a library can be installed from source from a GitHub repository.

```json
{
  "name": "my-secret-project",
  "dependencies": {
    "my-shared-library": "github:Organisation/my-shared-library#semver:^1.0.0",
  }
}
```

By default, an npm package will install using SSH keys available on the local machine, and so users can individually use the library if they upload their public keys to GitHub. If you develop inside a docker container, you can use the host keys:

```
docker-compose run --rm --no-deps -v "$SSH_AUTH_SOCK":/ssh-agent.sock -e SSH_AUTH_SOCK=/ssh-agent.sock my-container npm install
```

If you need access to the SSH keys when building a container, I think it's easiest to use [BuildKit](https://docs.docker.com/develop/develop-images/build_enhancements/):

```docker
RUN mkdir -p ~/.ssh
RUN ssh-keyscan -H github.com >> ~/.ssh/known_hosts

ENV GIT_SSH_COMMAND="ssh -v"

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm --mount=type=ssh,id=default npm ci
```

For CI, you can add a "deploy key" -- a key that provides read-only access to the repository. Add it to [Settings -> Security -> Deploy keys](https://github.com/Organisation/my-shared-library/settings/keys) and set it up in the CI tool. For GitHub Actions, I used [`shimataro/ssh-key-action`](https://github.com/shimataro/ssh-key-action):

```yml
- name: Install SSH key
  uses: shimataro/ssh-key-action@v2.3.1
  with:
    key: ${{ secrets.SSH_KEY }}
    known_hosts: unnecessary
    if_key_exists: "replace"
```
