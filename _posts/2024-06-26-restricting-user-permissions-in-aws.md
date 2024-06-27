---
layout: post
title:  "Restricting user permissions in AWS"
tags: [technical, aws]
---

For most projects, restricting permissions to the level of "power user" or "admin" (with the occasional "read only" user) will suffice. Other projects want more control.

Note that if you're using IAM Identity Center (IIC) permission sets assigned to roles, you can't use the following tools on the roles themselves -- only on the account-specific IAM roles automatically created when a user logs in using SSO.

# Role permission generation from Cloudtrail events

For each IAM role, you have the option to "Generate policy based on Cloudtrail events" from the role page. This generates a JSON document (with to-be-filled-in resource restrictions) based on the API calls made by the role in question (by any user that can use it) across the time period you specify. Selecting a region before the trail makes the API calls come from that region, which is useful for getting around any guardrails which may be set up on the account (until recently, there was a bug that meant all calls came from us-east-1).

If you're using IIC roles, you should begin by creating a permission set specific to the group whose permissions you want to restrict, in order to generate a unique account-role combination. For example, if you create a group "Testers", each account it's set up in will have a role "AWSReservedSSO\_Testers\_" followed by a hexadecimal string.

You can replace the inline permission of the particular permission set (or role if not using IIC) with this generated JSON document (after replacing the resources with proper globs). Afterwards, have members of your team contact you with error messages they receive, and add permissions accordingly. You can use [https://aws.permissions.cloud/](https://aws.permissions.cloud/) to find out the required resource format.

If you have the same role across multiple accounts and have generates multiple JSON documents, you can use the following Javascript function to combine alike resources for easier maintenance (assuming the permissions are to be matched across accounts):
```js
function addPermissions(source, target) {
  if (source == null) return;
  for (let statement of source.Statement) {
    // find element in target matching Effect / Resource
    let potentials = target.Statement.filter(x => x.Effect === statement.Effect && x.Resource === statement.Resource);
    if (potentials.length === 0) {
      target.Statement.push(statement);
      continue;
    }
    const targetStatement = potentials[0];
    if (typeof statement.Action === 'string') {
      statement.Action = [statement.Action];
    }
    if (typeof targetStatement.Action === 'string') {
      targetStatement.Action = [targetStatement.Action];
    }
    for (let action of statement.Action) {
      if (!targetStatement.Action.includes(action)) {
        targetStatement.Action.push(action);
      }
    }
    targetStatement.Action.sort();
    if (targetStatement.Action.length === 1) {
      targetStatement.Action = targetStatement.Action[0];
    }
  }
}
```

# Cloudtrail events

You can view the individual events (that were used to generate permissions for the role in the process above) in CloudTrail directly. You can also filter these events by username, in case you suspect one particular user of having a different usage pattern to others (e.g. something worth splitting out into a separate role).

# Unused role analyzer

The unused role analyzer allows you to see which roles are unused, and which permissions in used roles were unused for a given time period. You create a single role analyzer for a given period (say, 90 days) and changing the period requires deleting and recreating the analyzer.

Perhaps unexpectedly, the analyzer can only analyze roles which existed at the start of the period. If you set the period to 2 weeks, a role created 1 week ago will not appear at all, whether it has been used or not (and if it has been used, you can't see which permissions were unused). If you want to inspect this role, you need to either wait another week (such that its creation date falls outside the analysis period) or delete and recreate the analyzer, specifying a time limit of 1 week.

Generally, generating permissions from CloudTrail is more convenient, as this gives a JSON object of permissions that can be directly copied over the role permissions, instead of a list of permissions that can be removed.
