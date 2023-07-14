---
layout: post
title:  "Migrating deprecated aws_s3_bucket in Terraform AWS Provider 4 and above"
tags: [technical, aws, terraform]
---

Terraform AWS Provider 4.0 [introduced](https://github.com/hashicorp/terraform-provider-aws/issues/23106) a series of new, smaller resources intended to replace the monolithic `aws_s3_bucket` resource, which was deprecated. While it hasn't been removed even in 5.0, it's nice to migrate to the new subcomponents under the assumption it will eventually prevent major version updates.

If you don't do this, you'll see that you have deprecation warnings when running a `plan` or `apply`: you can see all of these using the code [from this post](https://discuss.hashicorp.com/t/show-all-warnings/5606/10):

```bash
terraform validate -json | jq -r '[ del( .diagnostics[] | select( .detail | startswith( "Experimental features" ) ) ) | .diagnostics[] | { Detail:.detail, Address:.address, Filename:.range.filename, Line:.range.start.line } ] | ( .[0] | keys_unsorted | ( . , map( length*"-" ) ) ), .[] | map(.) | @tsv' | column -ts $'\t'
```

The validation warnings will show you what needs doing in which areas.

Two convenient tools for this update are [tfedit](https://github.com/minamijoyo/tfedit) (to migrate the resources) and [tfmigrate](https://github.com/minamijoyo/tfmigrate) to migrate the state file to point to the new subresources. After finding the module you want to update, install tfedit with `go install github.com/minamijoyo/tfedit@latest` then run `~/go/bin/tfedit filter awsv4upgrade -u -f BUCKETS.tf`, changing `BUCKETS.tf` to the relevant terraform file.

`tfedit` will do the migration automatically. You may want to modify the resulting file: for example, all the resources will be sorted by type (e.g. all the bucket declaration will be at the top), but you possibly want all subresources for a given bucket to be next to each other. You may also want to reorder fields so it's clearer the resources are the same before and after.

After setting this up, you can install `tfmigrate` the same way (`go install github.com/minamijoyo/tfmigrate@latest`) and follow the [instructions in `tfedit`](https://github.com/minamijoyo/tfedit#overview).

```bash
terraform plan -out=tmp.tfplan
terraform show -json tmp.tfplan | tfedit migration fromplan -o=tfmigrate_fromplan.hcl
```

This will produce a migration file to be used with `tfmigrate`. You can then run `tfmigrate plan tfmigrate_fromplan.hcl` to confirm that there are no unexpected changes. If there are, modify your `BUCKETS.tf`, regenerate the migration, and try again until it succeeds. An example might be a `versioning_configuration` of `Disabled` -- `tfedit` will always assume it to be `Suspended` -- or adding an `owner` to a `grant`.

You can then apply the migration file with `tfmigrate apply tfmigrate_fromplan.hcl`. If your `terraform plan` does include changes, you can still apply the migrations by modifying `tfmigrate_fromplan.hcl` to add `force = true`:

```terraform
migration "state" "fromplan" {
  force = true
  actions = [
    //...
  ]
}
```
