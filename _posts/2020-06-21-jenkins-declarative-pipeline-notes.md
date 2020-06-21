---
layout: post
title:  "Notes on Jenkins Declarative Pipelines"
tags: [technical, jenkins]
---

At Lhasa on the Kaptis project we used Jenkins declarative pipelines to build, test and create artifacts after every commit. Here I note down some things I've learned.

Declare extra functions
-----------------------

You can use functions provided by plugins, but also declare them above the `pipeline` line. Declare them as you would in Groovy. You can use globally available variables, such as `currentBuild` or `params`, and also environment variables defined in the `environment` section of the pipeline, after the function is defined!

```groovy
void sendMessage(token, message) {
  def buildUrl = currentBuild.absoluteUrl
  def targetUrl = "https://hooks.example.com/${token}"
  httpRequest url: targetUrl, contentType: 'APPLICATION_JSON', httpMode: 'POST', responseHandle: 'NONE', timeout: 30, requestBody: """
    {
      "message": "${message}: See ${buildUrl}"
    }
  """
}
```

Fall back into script mode
--------------------------

Script mode allows the use of `if` statements (among other things) and can be more convenient to use than declarative mode (for example, storing local variables). You can enter script mode using the [`script` block](https://www.jenkins.io/doc/book/pipeline/syntax/#script).


Using environment variables
---------------------------

The default environment variables are noted in [the documentation](https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#using-environment-variables). You can set more in an `environment` block at the pipeline level, or store more within steps by setting them on the `env` object.

```groovy
env.CONTAINER_PORT = container.port(8080).split(':')[1]
```

As stated [elsewhere in the documentation](https://www.jenkins.io/doc/book/pipeline/getting-started/#global-variable-reference), you can go to `<your instance>/pipeline-syntax/globals` to get a larger list of all environment variables, under `env`.

Preferably use pre-existing docker containers
---------------------------------------------

You can use a docker container as an image, and the `steps` block will run inside it.

```groovy
agent {
  docker {
    image 'emeraldsquad/sonar-scanner:latest'
    reuseNode true
  }
}
```

Preferably re-use images instead of creating your own (if you have to create your own, make sure they're uploaded to a repository so they don't have to be rebuilt every time. Preferably use images over using things installed on the jenkins boxes -- you don't have to configure the location of a tool installed using docker, so it's more convenient.

Good picks include:
* Running Karma tests: `timbru31/node-chrome:latest` or `amio/node-chrome:latest`
* Running maven tests: `maven:3.6.2-jdk-11`
* Running sonar scanner: `emeraldsquad/sonar-scanner:latest`

Maven documentation
-------------------

The best help for `mvn` (extra flags, for example) is accessed by running `mvn --help` on a machine where it's installed. If you don't have one to hand, the [Apache Maven documentation](https://maven.apache.org/ref/3.6.3/maven-embedder/cli.html) exists but can be tricky to find.

Using docker containers inside builds
-------------------------------------

The docker documentation is primary in the `<url>/pipeline-syntax/globals` section. By searching a given sentence, you can find a copy elsewhere on the internet -- for example, [Jenkins 全局变量参考](http://web.archive.org/web/20200621194014/https://wdd.js.org/jenkins-global-variable-reference.html). You can use the `withRun` and `inside` blocks to remove a container inside a step, or plain `run` to create a container that you take responsibility for cleaning up at the end. Either way, the image isn't deleted at the end, so if you think there's no point caching it, it should be deleted to save disk space. If you give your containers `--name`s, they are easier to clean up (and `--link` to).

```groovy
docker.image("mysql:8").run("--name ${DB_NAME} -e MYSQL_DATABASE=db -e MYSQL_USER=${DB_USER} -e MYSQL_PASSWORD=${DB_PASSWORD}", "--lower-case-tables-names=1")
docker.build("${BACKEND_IMAGE_TAG}", "-f Dockerfile_backend backend")
docker.image("${BACKEND_IMAGE_TAG}").run("--name ${BACKEND_SERVICE_NAME} -P --link ${DB_NAME}", "--spring.datasource.url=\"${DB_URL}\"")

docker.build("${FRONTEND_IMAGE_TAG}", "-f Dockerfile_frontend frontend")
docker.image("${FRONTEND_IMAGE_TAG}").run("--name ${FRONTEND_SERVICE_NAME} -P --env BACKEND_URL=http://${BACKEND_SERVICE_NAME}:8080/"

docker.withRegistry("https://artifactory.example.com:6532", "Bitbucket") {
  docker.image("${BACKEND_IMAGE_TAG}").push()
  docker.image("${FRONTEND_IMAGE_TAG}").push()
}
```

This starts the database, backend and frontend, and pushes the freshly built backend and frontend images to an artifactory. DB\_NAME is defined in the `environment` -- we have it as the first 63 characters of the branch name, with "-" replaced with "_":

```groovy
DB_NAME = "$BRANCH_NAME".replaceAll("-", "_").take(63)
DB_URL = "jdbc:mysql://${DB_NAME}:3306/db?serverTimezone=UTC"
```

We start the images in their own stage because they're going to be used across multiple stages -- a backend API test, a smoke test, and a full end to end test.

```groovy
docker.image('selenium/standalone-chrome-debug:3.141.59-xenon').withRun("-P --shm-size=2g -e SCREEN_WIDTH=1920 -e SCREEN_HEIGHT=1080 -e VNC_NO_PASSWORD=1 -e SE_OPTS='-browserTimeout 60' --link ${FRONTEND_SERVICE_NAME} --link ${BACKEND_SERVICE_NAME}") { s ->
  echo "VNC Server exposed on port ${s.port(5900)}"
  docker.image("maven:3.6.2-jdk-11").inside("-v ${BUILD_USER_HOME_FOLDER}:/var/maven --link ${s.id}:selenium --link ${DB_NAME}") {
    sh """
      mvn test --projects :e2e-tests --also-make -s $MAVEN_SETTINGS -DfrontendUrl=http://${FRONTEND_SERVICE_NAME} -DdbUrl="${DB_URL}" -DseleniumUrl=http://selenium:4444/wd/hub -DfailIfNoTests=false -Duser.home=/var/maven -P allTests -Dtest=AllTestsRunner -Dmaven.test.failure.ignore=true
      mvn test --projects :e2e-tests --also-make -s $MAVEN_SETTINGS -DfrontendUrl=http://${FRONTEND_SERVICE_NAME} -DdbUrl="${DB_URL}" -DseleniumUrl=http://selenium:4444/wd/hub -DfailIfNoTests=false -Duser.home=/var/maven -P rerunFailedTests -Dtest=RerunFailedTests -DrerunFailureLimit=5
  """
  }
}

```

This could run on any machine for which an agent is installed, and there's no folder on all machines that the user certainly has access to (that isn't deleted, such as /tmp). We use `${BUILD_USER_HOME_FOLDER}` for this -- it's set to the user's home folder. `-Duser.home` changes everything to do with the home folder, which is useful for those users that don't have one set -- `-Dmaven.repo.local` can be used for only the repository.

We take into account the required network access -- the backend needs to be able to access the database in order to do anything. The tests need to access the database to populate test data, and to access selenium in order to tell it what to do. Selenium runs the user's browser, and so needs to access the frontend and backend (for REST API). The machine running the frontend doesn't need to be able to access anything else -- not even the backend, because the calls go through the client's computer. We use `--link` instead of a proper network just because it's a lot easier to set up.

The rerun failure limit is to [abort the build if too many tests fail]({% post_url 2020-05-23-abort-cucumber-rerun-too-many-failed-tests %}).

Finally, we clean up at the end:

```groovy
post {
  always {
    sh "docker logs ${BACKEND_SERVICE_NAME} > backend_logs.txt"
    archiveArtifacts artifacts: 'e2e-tests/screenshots/**', allowEmptyArchive: true
    archiveArtifacts artifacts: 'backend-logs.txt', allowEmptyArchive: true
  }
  cleanup {
    sh "docker rm -f ${DB_NAME} || true"
    sh "docker rm -f ${BACKEND_SERVICE_NAME} || true"
    sh "docker rm -f ${FRONTEND_SERVICE_NAME} || true"
    sh "docker image rm ${FRONTEND_IMAGE_TAG} || true"
    sh "docker image rm ${BACKEND_IMAGE_TAG} || true"
    sh "docker image rm artifactory.example.com:6532/${FRONTEND_IMAGE_TAG} || true"
    sh "docker image rm artifactory.example.com:6532/${BACKEND_IMAGE_TAG} || true"
    deleteDir()
  }
}
```

Storing the logs allows us to see any errors that might have occured during the test run. We also store screenshots saved by selenium in case of failure.

Cleaning up, we delete all the containers, and the images to save disk space. You might choose to keep the images for a while to help caching future builds, if that helps. The `|| true` is because a failed shell call in the cleanup step will stop the build there, while we want to go on to the end.
