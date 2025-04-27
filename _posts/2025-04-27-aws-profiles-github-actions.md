---
layout: post
title:  "Using multiple AWS profiles in GitHub actions"
tags: [technical, aws, github]
---

You can use multiple AWS roles in a single GitHub action by logging into the appropriate role before running the script that requires it, but if you want to assume multiple roles in a single script you need to use profiles (or have the script assume the roles itself). This is also convenient if you're making Terraform files that can be run both by individual developers (who will have a series of profiles set up) and by a CI system (e.g., to check if `terraform plan -detailed-exitcode` shows any changes).

After assuming a role using the normal action, you can use `aws configure` to set up a profile using the provided environment variables:

```yml
- name: Configure AWS Credentials (Test)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActionRole
    aws-region: eu-west-1

- name: Configure AWS Test Profile
  run: |
    aws configure set profile.test.aws_access_key_id "$AWS_ACCESS_KEY_ID"
    aws configure set profile.test.aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
    aws configure set profile.test.aws_session_token "$AWS_SESSION_TOKEN"
```

Note that you must run your script commands with `aws --profile XXX` instead of using the `AWS_PROFILE` environment variable, as the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` variables will persist from the last credentials you configured and will be used instead of the profile configured by the `AWS_PROFILE` variable.
