---
layout: post
title:  "I lost a day to relative URLs"
tags: [technical, debugging, work]
---

We'd been having problems with this feature branch already. It was supposed to change the behaviour on logging in to redirect you to where you'd been just before. It worked fine locally, but failed on the build server.

**I.**

There were mysterious issues with the build server more generally -- earlier that day, the entire Jenkins instance had gone down as the container running it stopped, and we had continual issues with Chrome disconnecting or taking up too much memory during the unit tests. This issue wasn't that, though -- it was with the integration tests.

We used three containers -- one for the frontend (node, Angular), one for the backend (Java, Spring) and one for the [selenium server](https://github.com/SeleniumHQ/docker-selenium). The frontend knew where the backend was, the selenium server knew where both of them were, and we told another maven instance to run the integration tests on the selenium server. To ensure that we could run multiple branches at once, the containers were named according to the branch names, and linked to other containers (using [`--link`](https://docs.docker.com/engine/reference/run/#expose-incoming-ports)).

I connected to the VNC server on port 5900 on the selenium box to try to see what was going on. Chrome reported that it couldn't connect to the frontend container at all. I checked `/etc/hosts`, and confirmed that the hostname was present. I tried the IP address, and that worked, so I knew networking was set up.

I noticed that the branch name was longer than we normally set it: a search of "length limit to hostnames" found me [a stackoverflow answer](https://stackoverflow.com/questions/8724954/what-is-the-maximum-number-of-characters-for-a-host-name-in-unix) providing the bash command `getconf HOST_NAME_MAX` -- running that showed it was limited to 64 characters, which was slightly exceeded by the branch name plus "kaptis-frontend" or "kaptis-backend". I updated the Jenkinsfile to trim container names to 64 characters and set the build off again.

{% highlight groovy %}
KAPTIS_BACKEND = "kaptis-backend-${TAG_NAME}".take(64)
{% endhighlight %}

The first few tests passed, which was a good sign, but after running for a while the tests started failing. I had the VNC server open, and I could see it wasn't even trying to log in -- if I logged in manually, the tests worked! What was going on?

**II.**

Attempting to log in was handled by the `waitForLogin` method, reproduced below:

{% highlight java %}
private void waitForLogin(String url, String redirectUrl)
{
	if (!url.contains("login") && !helper.waitForElement(By.id("logo-image")))
	{
		if (Driver.getDriver().getCurrentUrl().endsWith("login"))
		{
			login(Users.LHASA_EDITOR, redirectUrl);
		}
		else
		{
			fail("Unable to log in to Kaptis");
		}
	}
}

private void login(Users user, String redirectUrl)
{
	login(user.getUsername(), user.getPassword());
	helper.waitForElement("search aops");
	helper.navigateToUrl(Driver.getBaseUrl() + redirectUrl);
}

private void login(String username, String password)
{
	helper.sendKeys(By.cssSelector("form .email"), username);
	helper.waitForElementToBeCickable("login button");
	helper.click("login button");

	helper.sendKeys(By.id("password"), password);
	helper.waitForElementToBeCickable("kc login button");
	helper.click("kc login button");
}
{% endhighlight %}

Looking at it, it seems quite readable, although the method's doing double duty -- it only wants to try to log in if we're not already logged in, or if we're not trying to access the "login" page (because after you've logged in, you can't access the login page, and this method was reused where perhaps it shouldn't have been). The `logo-image` will be present only if you're logged in, so that's a quick check. If we're actually on the login page, we then try to log in, otherwise we report an error.

Unfortunately, none of that happened: sometimes it would successfully log in, but sometimes it would sit at the login page, not doing anything at all. `redirectUrl` might look like `/#/aop/123` or `/#/ke/10000` -- there's no way for `login` to appear there unless we're in the login screen itself.

Here was my error: having determined that `redirectUrl` was relative, I assumed `url` would be as well, and that `contains` was as good as `endsWith`. This was wrong.

{% highlight java %}
String fullUrl = Driver.getBaseUrl() + route;
helper.navigateToUrl(fullUrl);

if (executeLogin) {
	waitForLogin(fullUrl, route);
}
{% endhighlight %}

`url` was an absolute URL! This meant that `contains` was also implicitly checking the branch name, which contained the phrase `redirect-when-login`, describing what it was doing. So the `contains` check returned `true`, and the method never tried to log in at all.

I changed `contains("login")` to `endsWith("/login")`, and the tests started passing.

I mentioned earlier that some tests passed -- while the bulk of the tests would fail, some tests would successfully log in, which served to distract me from the real issue. After the fact, I found that these tests were logging in using a different method: either they were explicitly logging in, or they had a "I log in" step, instead of just accessing a URL and leaving the access step to handle logging in.

**III.**

To spend less time debugging in the future, I could:
- pay more attention to my "this looks weird" sense -- I noticed that `contains` was odd, but thought the URL was relative and ignored it
- move to putting print statements in the code on the server sooner -- in the end this was what showed me the URL was absolute. I wanted to reproduce it locally for easier debugging, and I set up the containers -- but I renamed them to `kaptis-frontend` and `kaptis-backend` because this was shorter and easier, neatly sidestepping the issue! On the plus side, I managed to replicate and fix a different issue, where some of the initial login tests would fail, but only on the first run, so this wasn't entirely wasted time
