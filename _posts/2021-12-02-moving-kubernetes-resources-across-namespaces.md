---
layout: post
title: "Moving Kubernetes resources across namespaces"
tags: [technical, docker, kubernetes, aws]
---

If you have a series of `yaml` files without `namespace`s in their metadata, and add one and re`apply` the files, an entirely new series of resources will be created in the new namespace. Moving a series of resources, then, involves spinning up a new set of resources, migrating the data across, and taking down the old set.

Create a new namespace:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: test
  labels:
    name: test
```

It's convenient to also create a context for your namespace:
```bash
kubectl config set-context test --user=USERNAME --cluster CLUSTERNAME --namespace=test
```

## Check which resources are and are not namespaced

Using
```bash
kubectl api-resources --namespaced=false
```

you can see that the common resources that aren't namespace are Namespaces, Nodes and PersistentVolumes (though Claims are). In particular, ServiceAccounts are namespaced! This lead to having to make a change to our `eksctl`-managed file and running `eksctl create iamserviceaccount` again (having duplicated the service account but with a namespace this time).

## Apply the new, namespaced resources

Add a `metadata.namespace` entry to each resource, and apply. This will create a series of brand new resources in the new namespace, in addition to the old resources in the old namespace. Wait until they all come up. If any errors, you can check on the replica sets `kubectl describe rs NAME` for more detail.

## Moving the data across

A PVC in the new namespace will have a new PV associated to it. You could move the PV across, possibly, by switching the `persistentVolumeReclaimPolicy` to `Retain`, deleting the original claim, then setting the `volume` of the new PVC. An alternative would be to copy the data from one volume to the other. The latter allows you to keep both deployments up until you're ready to switch over, but could take a long time if there's a lot of data.

I used mongodump / mongorestore to dump / restore the mongo database, taking the basic command [from StackExchange](https://dba.stackexchange.com/questions/215534/mongodump-unrecognized-field-snapshot):

```bash
kubectl port-forward deployment/mongo --namespace default 27017:27017 &
docker run --rm -v $(pwd):/workdir/ -w /workdir/ --network host mongo:4.4.4 mongodump --out /workdir/dump/
```

followed by

```bash
kubectl port-forward deployment/mongo --namespace test 27017:27017 &
docker run --rm -v $(pwd):/workdir/ -w /workdir/ --network host mongo:4.4.4 mongorestore /workdir/dump
```

## Changing the DNS to point to the new servers

After confirming that the data was moved, I changed the DNS records to point to the new load balancers visible on `kubectl get svc`.

## Deleting the old resources

I switched back to the old namespace (very important), and then a series of `kubectl delete X` commands cleaned the old resources up. I did these manually, as I tend to do while deleting things, checking the timestamps to confirm I was deleting the right things.
