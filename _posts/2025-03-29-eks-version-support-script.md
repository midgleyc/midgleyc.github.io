---
layout: post
title:  "Checking When EKS Versions Go Out Of Standard Support"
tags: [technical, aws, eks]
---

With the "EKS:DescribeClusterVersions" permission, the `aws eks describe-cluster-versions` command will return a JSON document with information about the various versions.

```json
{
    "clusterVersions": [
        {
            "clusterVersion": "1.32",
            "clusterType": "eks",
            "defaultPlatformVersion": "eks.5",
            "defaultVersion": true,
            "releaseDate": "2025-01-21T00:00:00+00:00",
            "endOfStandardSupportDate": "2026-03-21T00:00:00+00:00",
            "endOfExtendedSupportDate": "2027-03-21T00:00:00+00:00",
            "status": "STANDARD_SUPPORT",
            "versionStatus": "STANDARD_SUPPORT",
            "kubernetesPatchVersion": "1.32.2"
        },
        ...
    ]
}
```

After standard support ends, AWS will charge you a lot more to host the cluster. After extended support ends, AWS will no longer allow you to host the cluster. It's useful to update the cluster version a decent amount in advance to be prepared.

With the "EKS:DescribeCluster" permission, you can use the `aws eks describe-cluster` command to get the version number for an existing cluster:

```bash
version=$(aws eks describe-cluster --name $cluster_name --query 'cluster.version' --output text)
```

and subsequently extract information for that version from the `clusterVersions` JSON:

```bash
expiration_date=$(aws eks describe-cluster-versions --query "clusterVersions[?clusterVersion=='$version'].endOfStandardSupportDate" --output text)
```

And subsequently compute whether the standard support expiry date is longer than a month out:
```bash
current_date=$(date -u +%Y-%m-%d)
let days_remaining=($(date -d "$expiration_date" +%s)-$(date -d "$current_date" +%s))/86400
```
