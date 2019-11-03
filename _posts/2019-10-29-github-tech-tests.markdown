---
layout: post
title:  "GitHub tech tests"
date:   2019-10-29 08:00:00 +0000
categories: jekyll update
---
Many companies put tech challenges (to be completed when applying for the job) on the public web. If there's a challenge on GitHub, there's a good chance that people will put their solutions on GitHub as well, which can be useful to compare your own solution against / take inspiration / blatantly cheat.<a href="#cheating" id="cheatingref"><sup>1</sup></a>

I first found this while working on [a challenge price calculator for ICG](https://github.com/midgleyc/challenge-price-calculator). This was intended to be distributed using GitHub, and the challenge text included a very precise string I would expect to see somewhere in the source code: `Apples 10% off`. As expected, searching gives almost 50 thousand results -- it's a very popular challenge!

I recalled it while looking at [The Stars Group's FeedMe tech test](https://github.com/thestarsgroup/feedme-tech-test). This test indicates that you should include the docker-compose.yml file, which contains a precise image which is unlikely to show up elsewhere -- `image: tsgtechtest/provider:1.0.0`. This one doesn't give many results as is, but searching for `FeedMe Tech Test` shows that they've [taken it from Sky Bet](https://github.com/skybet/feedme-tech-test), and from there searching for `image: sbgfeedme/provider:latest` reveals a number of implementations as expected.

<a id="cheating" href="#cheatingref"><sup>1</sup></a> When I interviewed myself, we would say we didn't really care where you got the code from, as long as the license allowed you to do so and you could talk about it. Getting "inspired" by an existing solution is even woolier. It is highly annoying when you see somebody else's solution and it's better than your own design, though!
