---
layout: post
title:  "Notes on AVM for Bicep"
tags: [technical, azure]
---

Infrastructure as code (IaC) serves as a method to standardize and automate deployments. Modules are a way to combine and abstract resource construction.

# Why modules?

If you write a lot of bicep, you'll notice yourself writing the same sort of code a lot: either copying from previous files or rederiving the values you need.

For example, suppose you're creating a Custom Script Extension for a VM. You do this by making a 'Microsoft.Compute/virtualMachines/extensions@2022-11-01' call using, among other values, "publisher" and "type". These are "Microsoft.Compute", "CustomScriptExtension" for Windows, and "Microsoft.Azure.Extensions" and "CustomScript" for Linux. Using a module, you can abstract this away: you pass the OS type into the module, and it produces the correct values for these fields.

Instead of writing this yourself, you might want to use a third-party module written by someone else: you don't know all these pitfalls ahead of time, so you can instead stand on the shoulders of the giants who came before.

# Why not modules?

Some features break -- e.g. `what-if` doesn't handle nested modules, and so won't tell you what will happen if you make a deployment using AVM, as most modules are very nested.

This ties your code to the module. In the case of a major version upgrade you may need to do unexpected work; in the case of an Azure API change you are stuck waiting for the module author to update.

Using a module treats the module as a "black box". Instead of being able to see in your code what the code will do, you have to check the module source. Ideally you can look at the documentation, but this may not be correct and something unexpected may happen. Use of the module may be less readable than a more artisanal implementation.

Internet-downloaded modules are third-party code and a potential security risk. Often they are unaudited and have no support model (or a support model with no penalties).

# Why AVM specifically?

Azure Verified Modules are an attempt by Microsoft to write high-quality modules that are a default choice for consumers (e.g. MSPs) looking for a reliable source of third-party modules. This is part of their "One Microsoft" initiative.

They are required to have E2E (end-to-end) tests to confirm the modules work as intended, although there is no coverage requirement for this, so some combinations of inputs may be untested. Idempotency is required to work.

There are attempts made at consistency across modules (e.g. input of customer managed keys). If you use many AVMs, another AVM should have a more familiar input than another third party module.

AVMs are "WAF Aligned", meaning that they satisfy the Well-Architected Framework's "high" impact requirements, assuming those requirements don't involve resources not managed by the module.

# Why not AVM specifically?

Microsoft does not have a great track record when it comes to keeping projects supported. AVM is a successor to Terraform Verified Modules and CARML (the equivalent for Bicep) following AzCAF and Landing Zones. The telemetry page pleads to keep telemetry enabled as low adoption would lead to AVM not having sufficient resources to continue support, which could impair your ability to support your work in the future. The work required from Microsoft grows linearly with the number of modules due to AVM's support model.

The support model offers responses to your issues in the event this is not provided by the module owner, but no guarantee of a fix. There are no penalties for failing to meet this support standard.

The list of modules provides the name, version and author of the module. There is no useful information like description / number of downloads / whether people thought the module was useful or not.

The documentation is of highly variable quality. The source is available, which is useful in that it's a substitute for the documentation. An example: for the virtual machine module, the "pipConfiguration" under NICs is not documented at all, but you can read the module code to figure out the inputs. The documentation also references "enablePublicIP", which doesn't exist (instead, the presence of "pipConfiguration" determines whether a public IP should be created).

The testing requirements are nonzero but not significant. Updates are not required to work correctly. Not all parameters are required to be tested. Test coverage isn't exposed anywhere, so the module itself should be examined.

None of these are reasons to avoid AVM completely -- however, you should audit an AVM as you would another third party module, as I don't think the minimum standards are sufficient to be able to trust them without investigation.

# Additional comments on Terraform AVM

Looking at the first AVM terraform module alphabetically, `terraform-azurerm-avm-res-app-containerapp`, we see it has three dependencies we'd expect in a TF project (terraform, azurerm, random) and two mysterious extras (azapi, modtm).

Modtm provides Azure with telemetry, as specified in https://aka.ms/avm/telemetry. It runs some Go code to apparently create a single deployment with particular tags representing information from your organisation. Azapi targets the ARM REST API directly, and is for things which aren't supported in AzureRM. This lets Microsoft do in Terraform what they can do in Bicep, which is useful.

The documentation is automatically generated (a spec requirement of AVM), and repeats itself a few times in what is probably a bug. This doesn't make it terribly readable. Comparing the example code with the documentation, we can also see that it's also missing important information, some of the inputs specified as blocks should actually be lists, and in general the types of inputs aren't specified, which is a bit awkward.

Implementation-wise, we see it mostly passes the input straight through, with minimal extras (although there is a lot of code to accomplish this). Given the difficulty of readability vs a more standard setup of just using the resources directly, I would recommend against this module.

Another module is `avm-res-authorization-roleassignment`, selling itself as a convenience wrapper around `azurerm_role_assignment` if you happen to have a problem in the same vein as the author's. The documentation is good, and I think this one could be useful. There is no way to tell, from the list of modules, which could be useful like this, and which are not. You get a display name and an author -- not a description, no rating, nothing. You know that all the modules met some minimum standard with regards to testing / layout, but not whether they will actually be useful.
