---
layout: post
title: "Running SQL scripts in dockerized MySQL"
tags: [technical, docker, mysql]
---

You can redirect a SQL script through a mysql client by running:

```bash
mysql -uroot -prootpass -D mydatabase < /my/file/location.sql
```

Suppose you're running MySQL or MariaDB in a container (e.g. `mariadb:5.5` or `mysql:8`). You can do the same thing:

```bash
docker exec -i <container id> mysql -uroot -prootpass -D mydatabase < /my/file/location.sql
```

Note that this requires `-i` instead of the more normal `-it` you'd use when running. I believe any time you're looking to pass in a finite stream (e.g. you're redirecting something into the container), you don't want to use `-t`.
