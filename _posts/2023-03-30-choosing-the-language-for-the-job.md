---
layout: post
title:  "Choosing the language for the job"
tags: [technical]
---

If you're a developer who knows multiple languages and you're working on a new task, you may, depending on how modular the codebase is, have the flexibility to pick a new language for it. I think this is something which should be strongly considered.

Picking the same language you're already using is a safe bet -- using many languages leads to a more complex codebase, especially if not all developers know all languages. It requires context-switching, and requires you to implement some sort of interface with the existing code (unless the component is standalone). If you pick an obscure language for an important project, you might find it tricky to recruit maintainers.

However, it can offer large benefits. Languages have different standard libraries (and third-party libraries) available, and something that might be a few days work to code might come out of the box in a different language. For example, we recently had a task involving decrypting password-encoded PDF and DOCX files. We found loads of libraries that could decrypt PDF files, but the only DOCX decrypters were in Python. I initially wrote the scripts in Bash (using Python from CLI) before switching to Python itself. Our default language would have been NodeJS, which I think would have been more annoying to deal with.

Languages also offer different constructs. For example, C# has structs which can never be null, while Java doesn't. PHP makes it trivial to write server-side code. Threading is much easier (or harder) in particular languages: C# has an `await` keyword, Java needs explicit Threads (or a ExecutorService), JavaScript has Promises, Go has channels. If you're writing front-end code, it's almost surely JavaScript, but could be a different language (e.g. Rust) compiled to WASM. This can offer more flexibility or performance at the expense of making interacting with the other front-end code much trickier.
