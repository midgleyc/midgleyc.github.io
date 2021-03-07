---
layout: post
title: "Running PHP scripts targeting localhost for MySQL in Docker"
tags: [technical, docker, mysql, php]
---

When targeting `localhost` as the host for a MySQL connection, PHP will attempt to connect using the configured socket instead of TCP. This can prove a problem when the socket does not exist, such as when you're running inside a container. A simple solution is to target `127.0.0.1` instead (or alternate appropriate hostname), but this is can involve a big change to an existing codebase, particularly if it wasn't written to use external or obvious configuration files.

If you want to use a non-localhost IP, perhaps a different container, when dealing with an application with no centralized configuration point for MySQL hosts, this can also be problematic, potentially requiring large-scale refactoring before the change can be enacted.

An alternative is to use `socat` to redirect attempted socket connections to a different machine over TCP.

First, in `php.ini`, configure the `default_socket`. Certain compilation options in PHP hardcode the socket at compile time: in that case attempt to find which filepath is being used and reference that in the `socat` configuration.

```ini
mysql.default_socket = /var/run/mysqld/mysqld.sock
mysqli.default_socket = /var/run/mysqld/mysqld.sock
pdo_mysql.default_socket = /var/run/mysqld/mysqld.sock
```

Second, change the Dockerfile to install `socat` and use an alternate starting command, so you can set it up.

```Dockerfile
FROM php:8-apache

# Prerequisites
RUN apt-get update && apt-get install -qy socat

COPY php.ini /usr/local/etc/php/conf.d/php.ini

# <Rest of your application setup>

# Override the startup command to enable socat
COPY start-webserver.sh /usr/bin/start-webserver.sh
RUN chmod +x /usr/bin/start-webserver.sh
CMD ["start-webserver.sh"]
```

Third, create the `start-webserver.sh` file:

```bash
#!/bin/bash

FORWARD_TO=${MYSQL_HOST:-127.0.0.1}

# Forward the MySQL socket to the remote server
mkdir -p /var/run/mysqld/
socat UNIX-LISTEN:/var/run/mysqld/mysqld.sock,fork,reuseaddr,unlink-early,mode=777 TCP4:${FORWARD_TO}:3306 &

# Start the web server.
apache2-foreground
```

This allows setting an environment variable, `MYSQL_HOST`, when run to tell the container where the mysql database is hosted (on a fixed port 3306).

When run, connections to `localhost` should go to `MYSQL_HOST` instead.
