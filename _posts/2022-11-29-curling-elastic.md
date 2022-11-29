---
layout: post
title: "Curling ElasticSearch"
tags: [technical, elastic, curl, bash]
---

When trying to debug ElasticSearch index issues, it's generally nicest use Kibana to provide a graphical interface to assist. But sometimes you can't forward the Elastic instance to a place where you can run Kibana. Sometimes you just have a CLI.

You can use curl to various endpoints to help debug simple issues.

# Basic check

Confirm that the server is up, and which version is in use.

```bash
curl http://elastic:9200
```

If you get a response like `curl: (56) Recv failure: Connection reset by peer`, the server is not up at all. Hopefully you should get some JSON:

```json
{
  "name" : "5e071714e4da",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "WrrDRPpzSY-gVaKcayo3fg",
  "version" : {
    "number" : "7.17.5",
    "build_flavor" : "default",
    "build_type" : "docker",
    "build_hash" : "8d61b4f7ddf931f219e3745f295ed2bbc50c8e84",
    "build_date" : "2022-06-23T21:57:28.736740635Z",
    "build_snapshot" : false,
    "lucene_version" : "8.11.1",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
  },
  "tagline" : "You Know, for Search"
}
```

This confirms the version of ElasticSearch running, which lets you know which client commands you can successfully send it.

# Search for an index

Get the schema of index `myindex`:

```bash
curl http://elastic:9200/myindex
```

If the index doesn't exist at all you'll get an error:

```json
{
  "error": {
    "root_cause": [
      {
        "type": "index_not_found_exception",
        "reason": "no such index [myindex]",
        "resource.type": "index_or_alias",
        "resource.id": "myindex",
        "index_uuid": "_na_",
        "index": "myindex"
      }
    ],
    "type": "index_not_found_exception",
    "reason": "no such index [myindex]",
    "resource.type": "index_or_alias",
    "resource.id": "myindex",
    "index_uuid": "_na_",
    "index": "myindex"
  },
  "status": 404
}
```

An index can be created from a mapping, or implicitly as data is added to it. If you see segments like `"fields":{"keyword":{"type":"keyword","ignore_above":256}}`, it's likely these fields were created implicitly. Other than that, check the mappings to confirm all the fields you expect are present, and that they have the types you expect.

# Count the number of records

Check the number of records in index `myindex`.

```bash
curl http://elastic:9200/myindex/_count
```

You should get a response like
```json
{"count":34,"_shards":{"total":1,"successful":1,"skipped":0,"failed":0}}
```

Hopefully you know how many records are supposed to be in the index. If none, you can tell the insertion process failed; if a multiple of the expected you can tell it ran many times (without ids specified).

# Get the records

Get all records in `myindex`.

```bash
curl http://elastic:9200/myindex/_search?pretty -H 'Content-Type: application/json' -d' {"query": {"match_all": {} } }'
```

`hits.hits` in the resulting JSON should be an array containing all results (with the specific item under `_source`). You can manually examine these to confirm they're as you expect.

You can also change the query to examine specific records (or just manually check them from the `match_all` query).
