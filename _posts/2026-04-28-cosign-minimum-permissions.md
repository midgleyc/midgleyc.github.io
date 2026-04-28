---
layout: post
title: "AWS CLI output format changes behaviour"
tags: [technical]
---

[Cosign](https://docs.sigstore.dev/cosign/signing/signing_with_containers/) is a binary you can use to sign containers and files against a given key, confirming their contents.

If you're running a highly secure environment, you want to ensure that only the required permissions are given to the signing user. You also want to disable the default submission to the transparency log, Rekor, as this is [publicly accessible and searchable](https://search.sigstore.dev/?logIndex=1096875651) and hosted in presumably-the-USA, which is dangerous for data sovereignty. You could host your own instance, but for a private project I don't see this providing any extra utility.

```bash
cosign signing-config create --with-default-services --no-default-rekor > config.json
cosign sign --signing-config=config.json --key=awskms:///arn:aws:kms:eu-west-2:ACCOUNT_ID:key/GUID registry/container:label
cosign sign-blob --signing-config=config.json --key=awskms:///arn:aws:kms:eu-west-2:ACCOUNT_ID:key/GUID --bundle=file.sigstore.json file
```

Make sure to verify the installed cosign binary. Grab the SHA hash separately and store it in your script. If you download it at runtime, an attacker who has replaced `curl` can replace both the binary and the signature you download, making your protection useless.
```bash
FILENAME="cosign-linux-amd64"

curl -qfsSL -O "https://github.com/sigstore/cosign/releases/download/v3.0.5/$FILENAME"
SHA_HASH=db15cc99e6e4837daabab023742aaddc3841ce57f193d11b7c3e06c8003642b2
COMPUTED_HASH=$(cat "$FILENAME" | sha256sum | head -c64)
if [ "$COMPUTED_HASH" != "$SHA_HASH" ]; then
  echo "Failure: $FILENAME does not match provided SHA hash";
  exit 1;
else
  echo "Verified: $FILENAME matches SHA hash, installing";
fi
chmod +x "$FILENAME"
mv "$FILENAME" /usr/local/bin/cosign
```

In all cases, the user calling cosign must have permissions to use the key: `kms:DescribeKey`, `kms:GetPublicKey`, and whichever of `kms:Sign` and `kms:Verify` you intend that user to use. For signing / verifying blobs, you don't need anything more, but note that you'll need `--insecure-ignore-tlog=true` if you've not submitted anything to Rekor.

For signing containers, note that the container download / upload will be carried out by the user logged into the ECR registry, which does not have to be the user who can access the key. That is, after some user runs
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin ECR_REPO
```
the credentials are cached in ~/.docker/config.json, and it is these credentials that will be used for registry access. You can freely switch profiles after this. This is useful if the registry is located in a separate account to the key.

The account logging on to the registry needs `ecr:GetAuthorizationToken` on `*`, and `ecr:BatchGetImage` and `ecr:GetDownloadUrlForLayer` on the repository images it wants to access.

You can assume a new role using `aws sts assume-role`, given that both the user has `sts:AssumeRole` on the desired role, and the desired role has an `assume_role_policy` allowing `sts:AssumeRole` from the given principal. As a one-liner, this is:
```bash
export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s" \
$(aws sts assume-role --role-arn arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME --role-session-name SESSION \
--query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]"
--output text))
```

For audit purposes, as you're not using Rekor it makes sense to note something down in another append-only log: I like CloudWatch.
```bash
TIME=$(date +%s%3N)
aws log put-log-events --log-group-name GROUP --log-stream-name verifying --log-events "timestamp=$TIME,message=Verified container: CONTAINER"
```

Note that GNU date is required for millisecond precision with `%3N`. Busybox date will silently ignore this as invalid, and Unix date will add "3N" to the end of the seconds since epoch. If using either, you should instead use `date +%s000` to ensure the timestamp has sufficient digits.
