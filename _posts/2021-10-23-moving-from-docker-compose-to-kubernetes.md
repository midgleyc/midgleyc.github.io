---
layout: post
title: "Moving from Docker Compose to Kubernetes"
tags: [technical, docker, kubernetes, aws]
---

We were running a Task Definition generated from a Docker Compose file in AWS' ECS when we encountered an issue: we needed to run 11 containers in a single task (as they all needed to talk to each other), but the limit was 10. Looking at the documentation, it seemed that putting in a network they could communicate on in the ECS infrastructure was about as hard as migrating everything to Kubernetes, which would offer other benefits, so we decided to go for that instead.

## Ensuring the architecture was migratable

Our current deployment ran out of one host machine, and was designed under the assumption this would be the case. The first thing to do was to go over the architecture and migrate anything that couldn't be represented in Kubernetes to something that could.

The main issue was that certain containers were accessed under specific ports on the host machine (for example, one container is exposed on port 80, another on 5200, another on 5201...). As far as I'm aware, port-specific routing isn't something that's possible under Kubernetes. Instead, we set them to have different subdomains in the URL, and set up the load balancer accordingly.

As an example, the backend API was accessed at `http://example.com:5200`. It was changed to be accessible at `http://api.example.com`, and the load balancer was changed to route requests to `http://api.example.com` to the port 5200.

## Creating the YAML for Kubernetes

We developed locally using Docker Compose. A "production" docker-compose file was created from the Task Definition, and this was fed into [Kompose](https://kompose.io/) to create an initial set of YAML files for Kubernetes.

Subsequently, many changes were made:
* removing references to `kompose`
 * removing the `metadata.annotations` with the generated command and version
 * renaming the `io.kompose.service` label to `app`
* moving the configuration items into a `ConfigMap` and `Secret` instead of duplicating them across all containers
* changing the `PersistentVolumeClaim` `storage` requirements to be more realistic
* changing the services' exposed ports to be the same as the container exposed ports, for internal containers. By default, these are the ports the containers expose to the host, which was wrong for our use-case.
* changing the external services' type to `LoadBalancer`, the port to 443, and configuring `service.beta.kubernetes.io/aws-load-balancer-ssl-cert` (to the right certificate) and `service.beta.kubernetes.io/aws-load-balancer-backend-protocol` (to http) to do SSL termination
* adding `loadBalancerSourceRanges` for the external services where appropriate, to restrict which IPs can access the containers
* adding `imagePullPolicy: Always` to those images which updated by using a major version (and our test development deployments, which used a single tag)
* for AWS and postgres specifically, using `PGDATA` to [mount an empty data directory](https://github.com/docker-library/postgres/issues/263#issuecomment-460998040), as AWS' default mount includes `lost+found`

## Creating the cluster

We used [`eksctl`](https://eksctl.io/) to create the cluster, as that seems to be the recommended way. We wanted only one node (as we knew from ECS the deployment was small, and didn't need to scale) with reasonable names.

```bash
eksctl create cluster -n example -r eu-west-1 --nodegroup-name example-nodegroup -N 1
```

After half an hour, it was up! The first time I messed up the command and left the cluster in a state where I couldn't create any nodegroups: I just deleted the whole thing and started again, and it worked the second time.

Next, the cluster creator should follow [the instructions on AWS for adding other users](https://aws.amazon.com/premiumsupport/knowledge-center/eks-api-server-unauthorized-error/). Run

```bash
kubectl edit configmap aws-auth -n kube-system
```

and edit the resulting YAML file to add

```yaml
mapUsers: |
  - userarn: arn:aws:iam::XXXXXXXXXXXX:user/testuser
    username: testuser
    groups:
      - system:masters
```

for the users you want to add. If running on Windows, this should be run in WSL or in a line-ending aware editor like VSCode, as otherwise carriage returns can ruin the configuration.

Those users can then create their `kubeconfig` using `aws eks update-kubeconfig --name CLUSTERNAME`.

## Making SES work

We use AWS' Simple Email Service to send emails from our services. We attached a policy to the `eksctl`-created nodegroup service account with the `SendEmail` permissions, as mentioned in the error message we got when trying to send an email without this.

## Making new deployments

If the files change, you can run `kubectl apply -f FOLDERNAME` to reapply all configuration files in that folder. If the files don't change but the docker images do, you can run `kubectl rollout restart deployment/whatever` to redeploy only that `ReplicaSet` or `kubectl rollout restart deployment` to restart everything (if necessary), assuming you have `imagePullPolicy: Always`.
