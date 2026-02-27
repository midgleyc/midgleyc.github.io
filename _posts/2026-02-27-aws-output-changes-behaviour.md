---
layout: post
title: "AWS CLI output format changes behaviour"
tags: [technical]
---

The two commands `aws COMMAND --output text` and `aws COMMAND --output json | jq -r '.'` may have different results.

Commands with the `--query` parameter will do client-side filtering using the JMESPath specified. For example, suppose you want to find the highest numeric tag an ECR container has which is less than 1000, you could pass ``--query max(imageDetails[].imageTags[] | [?@ >= '0' && @ <= '999999999' && to_number(@) <= \`1000\`])``. The intended output of this query is a single number: the highest numbered tag. However, if you use `--output text`, you will receive one number per page in the results (which can then be filtered down using `| sort -nr | head -1`).

This surprising behaviour is [documented](https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-filter.html#cli-usage-filter-client-side):

> **Important**
> 
> The output type you specify changes how the `--query` option operates:
> 
> If you specify `--output text`, the output is paginated *before* the `--query` filter is applied, and the AWS CLI runs the query once on *each page* of the output. Due to this, the query includes the first matching element on each page which can result in unexpected extra output. To additionally filter the output, you can use other command line tools such as `head` or `tail`.
>
> If you specify `--output json`, `--output yaml`, or `--output yaml-stream` the output is completely processed as a single, native structure before the `--query` filter is applied. The AWS CLI runs the query only once against the entire structure, producing a filtered result that is then output.

Note that the documentation isn't completely correct as written: `yaml-stream` behaves like `text`, not like `json`.

Websites when suggesting fixes to this may recommend `--no-paginate`, believing it will return all results at once. This is not the case: as [documented](https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-pagination.html#cli-usage-pagination-serverside), it means that the CLI receives only the first page from the server, and doesn't request additional pages. This may come as a surprise to the casual reader, as the simplest reading of "don't paginate" is "return everything at once", not "only return the first page".
