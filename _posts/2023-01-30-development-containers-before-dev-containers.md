---
layout: post
title:  "Using Containers for development without DevContainers"
tags: [technical]
---

[DevContainers](https://containers.dev/) are a formal specification for adding JSON config to a Dockerfile to run applications and editors inside a container, and to be able to share the configuration that allows you to do this with others. But even without that, it's still valuable (and somewhat easier or more flexible) to use containers in your local development.

# Access to specific library versions

If you have multiple projects using different versions of the same language, you need to use a tool that allows you to install different versions at the same time, and also remember to change when you switch projects (unless you're using a tool that does this automatically, like [volta](https://volta.sh/) for node or [asdf](https://asdf-vm.com/) for many languages).

Instead of this, you can run the code you need in a Docker container (e.g. `docker run --rm -it php:7.1-cli` will give you a PHP 7.1 REPL to try commands in). You can also mount your local directory into a (for instance) `node:14` container to develop on your local machine (taking advantage of features like hot reload) while running in a container (which, if the application is deployed in a container, should be closer to the final deployment artifact).

You can also run one-shot tools (for example, [mongo-express](https://hub.docker.com/_/mongo-express/) to give a web UI for a mongo database) to run them in an isolated, deletable fashion. If you use `--network host` you can run a series of containers with all the ports as though they were running on your local machine, which can be very convenient. You can also map ports to run multiple copies of the same server through docker.

# Access to a consistent build environment

When working with an infrastructure as code repository, it can be nice if all users have the same version of terraform / kubectl / other tools you might use. You can set up a docker container to install everything to a set version, and then work out of that when running the `terraform apply` commands to ensure they work on a given version.

Alternatively, if you're happy with any version, you can use it as a convenient way to install everything (or as documentation, if you feel like code as documentation is enough).

# Access to credentials

If you use multiple accounts on the same cloud environment or multiple kubernetes clusters, you can log into each as a separate profile, and pass it for each command. If you configure a docker container with a mounted configuration directory, you can configure it to have exactly the accounts you need to use (setting it as, for example, the default profile on AWS or with `kubectl config set-context --current`). After that, whenever you bring up the container again, it will automatically have the right credentials without you needing to configure anything (assuming they have a decently long expiry).

# Creating a CLI

Bringing the previous points together, in an infrastructure repository it can be nice to make a "CLI" container that you can hop onto whenever you want to make a change that contains all the tools necessary, and has the credentials configured.

## Set up your container with the required tools
```Dockerfile
FROM ubuntu:20.04

# base apt packages
RUN \
  export DEBIAN_FRONTEND=noninteractive && \
  apt-get update && \
  apt-get install -y \
    curl software-properties-common dirmngr apt-transport-https \
    lsb-release ca-certificates acl vim git unzip docker.io

# terraform
RUN \
  export DEBIAN_FRONTEND=noninteractive && \
  curl -fsSL https://apt.releases.hashicorp.com/gpg | apt-key add - && \
  apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com focal main" && \
  apt-get update && \
  apt-get install -y terraform && \
  rm -rf /var/cache/apt

# AWS cli
RUN \
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
  unzip awscliv2.zip && \
  ./aws/install && \
  rm -f awscliv2.zip

# eksctl
RUN \
  curl --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp && \
  mv /tmp/eksctl /usr/local/bin

# kubectl
RUN \
  curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
  install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# helm
RUN curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 > get_helm.sh && \
  chmod 700 get_helm.sh && \
  ./get_helm.sh
```

## Create a script to run each time you want to access the CLI
It can be nice to create one version of this script per environment (here project `p1`, environment `test`), hence the `CONTAINER` at the top.

```bash
#!/bin/bash

CONTAINER="infrastructure-tools-p1"
CONTAINER_NAME="infrastructure-tools-p1-test"
SCRIPT_DIR=$(realpath $(dirname $0))
BASE_DIR="$SCRIPT_DIR/.."
DOCKER_VOLUMES="$BASE_DIR/.docker-volumes/p1-test"

mkdir -p "$DOCKER_VOLUMES/.aws"

if [ "$(docker ps -qa -f name=$CONTAINER_NAME)" ]; then
  echo "Re-using existing environment."
  docker start -i $CONTAINER_NAME
else
  echo "Recreating your docker environment."
  (
  cd $SCRIPT_DIR
  docker build -f "$BASE_DIR/Dockerfile" -t $CONTAINER .
  docker run -it \
    -v "$SSH_AUTH_SOCK":/ssh-agent.sock --env SSH_AUTH_SOCK=/ssh-agent.sock \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "${HOME}"/.ssh/config:/home/"${USER}"/.ssh/config \
    -v "${HOME}"/.bashrc:/home/"${USER}"/.bashrc:ro \
    -v "${HOME}"/.profile:/home/"${USER}"/.profile:ro \
    -v "${DOCKER_VOLUMES}"/.aws:/home/"${USER}"/.aws \
    -v "${SCRIPT_DIR}":/home/"${USER}"/host-src \
    -v "${SCRIPT_DIR}/../terraform":/home/"${USER}"/terraform \
    -e RUNAS=$(id -u ${USER}) \
    -e RUNAS_NAME="$USER" \
    --name $CONTAINER_NAME \
    $CONTAINER \
    "/home/${USER}/host-src/cli-init"
  )
fi
```

`cli-init` contains scripts that need to be run to set up the container as a particular user: creating the user itself, configuring directories and permissions, setting up terraform (for example), and logging into aws / kubectl.

```bash
#!/bin/bash

set -e

if id "${RUNAS_NAME}" &>/dev/null; then
  # Already exists
  echo '';
else
  useradd -u ${RUNAS} "${RUNAS_NAME}";
fi

# adding user to docker group didn't work
setfacl --modify user:$RUNAS:rw /var/run/docker.sock

echo Logging in as ${RUNAS} now...

cd /home/"${RUNAS_NAME}"/host-src
HOME=/home/"${RUNAS_NAME}"

# Some home folders are created by the volume mapping and are root owned so we
# need to give ownership to the user to allow them to be written.
chown "${RUNAS_NAME}":"${RUNAS_NAME}" /home/"${RUNAS_NAME}"
chown ${RUNAS_NAME}:${RUNAS_NAME} "${HOME}/.ssh"

# anything else you need to do in here

su -s /bin/bash "${RUNAS_NAME}"
```
