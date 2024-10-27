---
layout: post
title:  "Add Directory Read Permissions to a Managed Identity in Azure"
tags: [technical, azure]
---

Normal roles can be added to a managed identity using the `az role assignment create` CLI command. The "Directory Reader" role (and other similar roles) cannot be assigned this way as they are Graph roles and not normal roles (I assume, I can't find a way to add them using this command).

They can instead be assigned using the Powershell equivalent command:
```powershell
$DirectoryReadersRole = Get-AzureADDirectoryRole | Where-Object {$_.DisplayName -eq "Directory Readers"}
Add-AzureADDirectoryRoleMember -ObjectId $DirectoryReadersRole.ObjectId -RefObjectId MANAGED_IDENTITY_OBJECT_ID
```

You may need to ensure you've done the setup first:
```powershell
Install-Module AzureAD
Import-Module AzureAD
Connect-AzureAD
```
