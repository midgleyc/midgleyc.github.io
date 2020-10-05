---
layout: post
title:  "Getting code coverage for manual or integration tests in NodeJS"
tags: [technical, javascript, nodejs, coverage]
---

It can be useful to get code coverage for a manual test set in order to check that you've covered all the cases for the code you've written. Getting this is similar to the process for getting coverage for an integration test.

This post focuses on NodeJS, but the idea is similar across all languages: run the coverage executable on your service, run your tests, then shutdown your service in such a way that the coverage is generated. Frequently, killing the process or shutting down the docker container running the service is not sufficient.

Choosing a coverage library
---------------------------

The first job is to pick a coverage library. For NodeJS, I like [c8](https://github.com/bcoe/c8) or [nyc](https://github.com/istanbuljs/nyc/). I prefer c8: I think it's faster, and it's definitely faster in the case where you want to get code coverage for all files, as `nyc` instruments (rewrites, adding extra functions for coverage checking) all files, while c8 uses the inbuilt node coverage and adds uncovered files at the end.

You'll want to use nyc if
* you're using a node version below 10.12.0
* you want to use features provided only by nyc, such as merging files created by multiple test runs (using `nyc merge`)

You'll want to use c8 if
* your [tests fail when run](https://github.com/istanbuljs/nyc/issues/1350)[ in an instrumented state](https://github.com/istanbuljs/nyc/issues/1327) (for example, we have a test using `pouch-adapter-memory` that uses map/reduce functions that don't work when instrumented)
* you're making heavy use of esm modules (there is [@istanbuljs/esm-loader-hook](https://www.npmjs.com/package/@istanbuljs/esm-loader-hook), but it's somewhat slow and experimental)

Setting up your service
-----------------------

You'll need some way to appropriately shut down the process generating coverage data. I like to use `SIGKILL` for this.

For a manual test, you can save the PID on startup somewhere convenient (it's exposed as `process.pid`), then use `kill -s SIGINT <pid>` to shut the process down. For an integration test, if the construction of the service is handled by the test, you can use [`child_process`](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) to gain a reference to the process and [`subprocess.kill`](https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal) to kill it.

For c8, you'll additionally need to add a signal handler, as [c8 doesn't save data when it receives a SIGINT](https://github.com/bcoe/c8/issues/189). Just doing the `process.exit` yourself is sufficient, oddly enough. `SIGTERM`, even with a handler, didn't work for me at all.

```javascript
// c8 requires a process.exit in order to produce code coverage
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', () => {
    // eslint-disable-next-line no-process-exit -- we really want to exit
    process.exit(0)
  });
  console.log(`PID of service: ${process.pid}`)
}
```

Putting it all together
-----------------------

First, you need to run the service with your coverage tool. If the service runs as a docker container, you need to make sure the coverage is saved into a directory you can access. By default this is `./coverage/`. If using `nyc` you may also want `./.nyc_output/`. If you want these files to be owned by the local user, ensure the docker container runs as the local user.

Here we use the "lcov" reporter, which produces a nice HTML website (that lets you drill down into the amount of coverage in each file) for humans and a nice `lcov.info` file for tools like Sonar.

If you're running on a CI platform, ensure you don't allocate a TTY.

```bash
docker run --name myservicename --interactive --tty --publish-all --user $(id -u):$(id -g) --volume $(pwd):/tmp/src --workdir /tmp/src myservice npx --reporter lcov c8 npm start
```

Next, you need to run your tests: either your integration test suite or manually. If you use `-P` in your docker command (or don't specify a mapped port in your compose file) docker will assign an unused port to your process, which you can identify using `docker port <container name / id>`.

Next, you want to get the PID of the process so you can kill it. If you don't have a process reference but made the service print out its PID, you can get this from the docker logs:

```bash
PID=$(docker logs myservicename 2>/dev/null | grep "PID of service:"  | tail -1 | cut -d':' -f2 | tr -d ' ')
```

and subsequently you can use `docker exec` to kill the process inside the container, which will stop the container.

Now you should have your coverage data inside `./coverage`, and can view it by, for example, running `firefox ./coverage/lcov-report/index.html`.
