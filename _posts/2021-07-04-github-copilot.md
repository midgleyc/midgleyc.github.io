---
layout: post
title:  "GitHub Copilot"
tags: [personal, current, technical]
---

GitHub has recently released a product called [Copilot](https://copilot.github.com/), an advanced form of autocomplete that can complete blocks of code when prompted with a filename, comments, and a function contract (name, inputs and outputs), and potentially any other code above or even below the item being completed.

## Background

GitHub are working on this project with OpenAI, who in February 2019 released [GPT-2](https://en.wikipedia.org/wiki/GPT-2), an intelligence that could generate additional text given a starting prompt. An upgraded version, GPT-3, was released in June 2020. GPT-3 was trained mostly on natural language. After release, many others trained GPT-3 on different sources: for example, poems by specific authors, [novels by specific author](https://www.gwern.net/RNN-metadata), code in specific languages. Copilot strongly reminded me of Sharif Shameem's [debuild.co](https://debuild.co/): a GPT-3 model trained on React code that converts comments into a small application.

In September 2020, Microsoft (who own GitHub) announced they had exclusive access to GPT-3's language model.

In June 2021, OpenAI announced Codex (often "OpenAI Codex"), an AI aiming to translate natural language (e.g. comments) to code. This was reported as a descendant of GPT-3, and trained on "publicly available source code and natural language". Given the variety of languages supported, either an individual model was trained for each language or a single model for all languages with metadata: the latter would take far less total training time. I expect that the source code was modified before being fed in: Copilot takes the name of the file (or, more usefully, declared language type) into account when generating code. I imagine this being like metadata before the code, something along the lines of:

```
File: get_date.py
Language: Python

Code: <code goes here>
```

It would be possible to check by naming a file an unknown language, but having it contain C-like code, and seeing what gets generated.

I don't think this can be exactly what's happening because GPT-3 didn't "know" that such early metadata is very relevant to the generated code (which spans multiple lines, as we can see for languages like Python), but Microsoft do have access to the model, so there may be something special going on here. Is the code only text-based, or is it parsed at all? All interesting questions.

All given examples have the prompt text before the generated code. It's possible Copilot can also take into account code after the generation prompt (e.g. for styling). One way to do this without advancing the state of the art would be to move the code below the generation above the prompt (as functions don't tend to care what order they're in) in the training data, and also in the VSCode extension when submitting text to the Copilot service. I don't know whether this is done or not.

By the marketing, Copilot can include code from its training data directly about 0.1% of the time, affected by the context. This runs the risk of breaching the license of that code if this code makes it into your final product. Non-licensed code isn't supposed to be used at all, GPL code can virally demand that the rest of your code is GPL, and even MIT requires that you reproduce the license and copyright statement. Because of this, I can't see Copilot being used in large organisations, as the risks are so great and the probability so likely (after 693 uses, it's above 50%, assuming the 0.1% chance is independent).

Copilot is avoiding a Tay situation by filtering out abusive language, possibly doing something like [extremely decreasing the probability of certain words](https://aidungeon.medium.com/controlling-gpt-3-with-logit-bias-55866d593292).

### Generated Code

I'm pretty excited over the potential of Codex! I can see it being useful for generating boring boilerplate, generating unit tests for legacy code, or helping to learn new concepts or a new language. I'd be even more interested if it could generate semi-accurate documentation (going code -> natural language instead of natural language -> code).

I am slightly concerned that it could be used to propagate bad practices, and also how it recommends to generate tests: auto-generating them from the code means that if your code is wrong, your tests are also wrong. This is what I do at the moment for the most part, so it merely means that I get to do the wrong thing faster, but a much better approach is to create tests based on the design spec, before writing the code. This means that instead of testing what your code does, you test what it should do.

Looking at the actual code on the marketing page (which I would expect to be among the best examples: GitHub are trying to sell this as a product), I'm impressed that they're anywhere near correct, but not thrilled with the quality. This is fine if Copilot is used in the "learning a new language / library" sense: it gives you a more focused place to start searching the documentation. It is less fine if you accept the code and move on.

#### A Detailed Review

I skipped `write_sql.go` and `server.go` because I don't know Go that well. I skipped `addresses.rb` because it generates a US-specific database table record referencing other tables that may or may not exist, and there wasn't really anything interesting I could say about it.

##### sentiment.ts

```ts
#!/usr/bin/env ts-node

import { fetch } from "fetch-h2";

// Determine whether the sentiment of text is positive
// Use a web service
async function isPositive(text: string): Promise<boolean> {
  const response = await fetch(`http://text-processing.com/api/sentiment/`, {
    method: "POST",
    body: `text=${text}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const json = await response.json();
  return json.label === "pos";
}
```

First, the upside: it determines, from the comments about a web service for determining text sentiment, that you should use http://text-processing.com/api/sentiment/. This is fantastic! As a newcomer to an area, trying to find popular tools, programs and public APIs can be really hard. The function also works, saving you from having to lookup the documentation.

On the downside: as [Jake Archibald](https://jakearchibald.com/2021/encoding-data-for-post-requests/) points out, the text is added to the body directly without escaping, which is a security issue. This is a commonality in later examples, too. Additionally, the used API is throttled to 1000 calls per day per IP, and shouldn't be used for commercial purposes.

##### parse\_expenses.py

```py
import datetime

def parse_expenses(expenses_string):
    """Parse the list of expenses and return the list of triples (date, value, currency).
    Ignore lines starting with #.
    Parse the date using datetime.
    Example expenses_string:
        2016-01-02 -34.01 USD
        2016-01-03 2.59 DKK
        2016-01-03 -2.72 EUR
    """
    expenses = []
    for line in expenses_string.splitlines():
        if line.startswith("#"):
            continue
        date, value, currency = line.split(" ")
        expenses.append((datetime.datetime.strptime(date, "%Y-%m-%d"),
                         float(value),
                         currency))
    return expenses
```

It's an interesting start. Note that it decides the only invalid lines are those starting with #s (likely comments) without being prompted, but misses out the other standard check for completely blank lines. Converting the value to a float is possibly wrong: the right thing to do would depend on the codebase, but using `Decimal` (or a custom currency type) is probably better in general.

The other flaws can be laid at the head of the docstring. By the example, you can't tell whether `expenses_string` is space separated or whitespace separated. The generated code handles space only, and crashes on unexpected inputs. The docstring tells to "parse the date using datetime": the generated code uses `datetime.datetime.strptime` to parse an ISO date into a datetime of midnight on that day, with no timezone. This could flip the day depending on what happens afterwards. `datetime.date.fromisoformat` would likely be better.

##### runtime.go

```go
package main

type Run struct {
    Time int // in milliseconds
    Results string
    Failed bool
}

// Get average runtime of successful runs in seconds
func averageRuntimeInSeconds(runs []Run) float64 {
    var totalTime int
    var failedRuns int
    for _, run := range runs {
        if run.Failed {
            failedRuns++
        } else {
            totalTime += run.Time
        }
    }

    averageRuntime := float64(totalTime) / float64(len(runs) - failedRuns) / 1000
    return averageRuntime
}
```

This one is also impressive from a parsing perspective: given a struct with a comment of "milliseconds", it knows how to translate to seconds, and to discount failed runs from an average of successful runs (that is, that success is the opposite of failed).

On the downside, if there are no runs, or if all runs fail, it crashes. While this would depend on the design, I'd saying returning 0 would be a better option.

##### days\_between\_dates.js

```js
function calculateDaysBetweenDates(date1, date2) {
  var oneDay = 24 * 60 * 60 * 1000;
  var date1InMillis = date1.getTime();
  var date2InMillis = date2.getTime();
  var days = Math.round(Math.abs(date2InMillis - date1InMillis) / oneDay);
  return days;
}
```

Brilliant! Good names for the generated variables, knowledge of how long a day is compared to a millisecond (on average), sensible decisions with rounding and absolution. No comment here to help with whether the days should be integral, or the answer should always be positive: reasonable choices were made.

Criticism is mostly stylistic: "date2 - date1" does the same as "date2.getTime() - date1.getTime()". Assuming all days have the same length would be a problem if the answer weren't rounded (I don't think you can accumulate enough error to breach 12 hours). It also gets caught out by the switchover between the Julian and Gregorian calendars (in the UK, 2 September 1752 was followed by 14 September 1752), but that's presumably out of scope.

##### find\_files.sh

```bash
#!/bin/bash
# List all python source files which are more than 1KB and contain the word "copilot".
find . \
  -name "*.py" \
  -size +1000 \
  -exec grep -n copilot {}\;
```

The first miss, in a couple of ways. First, it doesn't run: it errors with `find: missing argument to `-exec'`. It just needs a space between `{}` and `\;` though, so that's easy to fix.

Second, it does the wrong thing, though it uses approximately the right tools. `name` is right. `size` defaults to 512-byte blocks, and so should be `-size 1k` or `-size +1000c` if it really wants kilobytes over kibibytes. `-size +2` would work but isn't readable. `grep -n` prints the line number of the line containing 'copilot', not the filename (as only one file is passed when using `\;`). Instead of `-n`, the desired flag is `-l` (or the long form, `--files-with-matches`). Finally, there's a minor performance bonus for passing all files at once with `+`.

Lastly, `/usr/bin/grep` may be preferred to `grep` to guarantee an incorrect `grep` from earlier in the PATH won't be run.

##### collaborators.ts

```ts
/**
 * json schema:
 * [
 *   { name: "John Doe",
 *     collaborators: ["Jane Doe", "Herbert Frapp", "Elsie McEwan"]
 *   },
 *   { name: "Jane Doe",
 *     collaborators: ["John Doe", "Karen Smith"]
 *   },
 *   { name: "Skittles the Cat",
 *     collaborators: []
 *   }
 * ]
 */
function collaborators_map(json: any): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const item of json) {
    const name = item.name;
    const collaborators = item.collaborators;
    const set = new Set<string>(collaborators);
    map.set(name, set);
  }
  return map;
}
```

I think the generated code is fine, but wouldn't the author have been better off converting the comments to a type, and then using that instead of `any`? If Copilot can convert examples to a type that'd be rather interesting.

##### get\_repositories.py

```py
import urllib.request, json

def get_repositories(org):
    """List all names of GitHub repositories for an org."""
    url = 'https://api.github.com/orgs/' + org + '/repos'
    request = urllib.request.Request(url)
    response = urllib.request.urlopen(request)
    data = json.loads(response.read().decode())
    return [repo['name'] for repo in data]
```

Same security flaw as before: dumps "org" directly into the URL. Probably not exploitable: requires the response to be a list of objects with "name"s, uses whatever admin access is available on the app for injection if logged in, e.g. `org = secret/blocks#`.

Works and saves you having to read the docs, though, so nice.

##### non\_alt\_images.js

```js
// find images without an alt attribute
// and give them a red border
function nonAltImages() {
  const images = document.querySelectorAll('img');
  for (let i = 0; i < images.length; i++) {
    if (!images[i].hasAttribute('alt')) {
      images[i].style.border = '1px solid red';
    }
  }
}
```

Does what it says on the tin! At first I thought this might be tripped up by `<picture>` tags, but these tags contain an `<img>` as default, so it's fine. Doesn't check for blank alt, but that's what the comment tells it to do.

##### Generation by examples

The comment marker generation is amazing! Codex needs to "know" some of this stuff to be able to write code: it needs to be able to switch between "code" style and "comment" style. It's not quite "right", though: all given examples are inline comments except COBOL, where "\*" only works if it's the first character of the line (position 7, after the number). The inline start for COBOL comments is "\*>".

For the database generation: I'm not sure of the worth of generating a schema ex nihilo, ignoring any information about other tables. Doubtless this will improve.

For the time generation: knowledge of how everything fits in is very cool, but I don't think `const months = 30 * days` is a good idea. The subsequent `const years = 12 * months` give a year having 360 days, which is nicely divisible but also wrong. For an approximation, having a year be 52 weeks would be better.

##### Unit Test Generation

All of these are extremely neat, and may encourage coding patterns involving putting the tests in the same file as the code, which is a pattern I like from Rust. That, or developers will generate the tests in the same file and move them out once they're done, or you could prompt VSCode with where your source is so it can send the right thing to Copilot. Lots of interesting opportunities here.

I think the nicest bonus is the ability to autogenerate what a good test looks like for an unfamiliar framework or a familiar framework with a lot of boilerplate (e.g. Angular). I wonder whether Copilot is actually running the code to ensure the tests pass, or just looking at it and figuring out what it should do. Either is interesting.

On the downside, for the simple non-React examples they gave I think [property-based testing](https://forallsecure.com/blog/what-is-property-based-testing) might be more fitting. Copilot won't help you if you're asking it to solve the wrong problem.

##### Unfamiliar code generation

We have managed to obsolete codility: just pass it to Copilot and get a solution! If it doesn't compile or pass tests, try again until it does.

Looking only at the memoization examples, I note that for JavaScript and TypeScript (and probably Ruby), falsy types aren't cached (so null, undefined, false...). I'd expect the Python one to point you to the `@functools.cache` or `@functools.lru_cache` decorators.

I see this as good for generating documentation examples for a widely used library you've written, but perhaps not so great for finding out how to do something properly for a library you've never used before.

## Summary

Copilot is exciting, and a breakthrough in what's possible for developer productivity, at least in some areas. There's lots of room for growth -- I'm particularly interested in what can be done for code -> tests, tests -> code and code -> documentation.

I think the legal risks are to high to justify using in a commercial venture until it's been to court a few times (similar to how GPL code is avoided). I think it may be useful in some areas, especially for high-boilerplate javascript frameworks, but I don't think it's at the stage where it'll be useful in day-to-day coding. There's good reason to believe it'll improve from here, though!
