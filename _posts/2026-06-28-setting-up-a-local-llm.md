---
layout: post
title: "Setting up a Local LLM"
tags: [technical, llm]
---

Following on from last month, Codex removed 5.3-codex from the available models, and left only 5.5. They also either substantially reduced the number of available tokens, or 5.5 consumes far more tokens (checking the usage page, there are no numbers either way).

As I don't like being vulnerable to a model change, I tried to set up a local LLM. I briefly tried Gemini as apparently the limits are far higher, but I was unimpressed: I told it to investigate and not to change any files, but it changed files anyway (and managed to consume all available tokens, so evidently not that high a limit). The changes were bad, and worse, it failed to follow my instructions.

The goal was to get an agent I could run in WSL for coding there, connected to a model running in Windows for hoped-for-higher performance than in WSL (and more convenient disk usage). I picked [LM Studio](https://lmstudio.ai/) [OpenCode](https://opencode.ai/) simply because I'd been reading about potential tools and I thought I could wire those two together. LM Studio also shows you [the RAM you need to run the models](https://lmstudio.ai/models/qwen3.5), which I found useful.

I tested with Qwen 3.5 (9b) as the filesize was fairly low and the responses decent in chat mode. As it turned out, not good enough for agentic coding, but a good proof of concept.

After installing (which can be done most easily through the website), head to "Developer Mode" (Ctrl+2) and enable the server. To access from WSL you have [two options](https://hermes-agent.nousresearch.com/docs/integrations/providers#wsl2-networking-windows-users):
* first, on LM Studio click "Server Settings" then check "Serve on Local Network", then access using the Windows external IP. This is a security risk as it will allow all computers on your local network to access the LLM.
* second, use the [.wslconfig](https://learn.microsoft.com/en-us/windows/wsl/wsl-config#wslconfig) file to set up the network so that items hosted on localhost are accessible inside WSL. Create a file ".wslconfig" inside your user profile with the contents:
```ini
[wsl2]
networkingMode=mirrored
```
and restart WSL (`wsl --shutdown`, wait 8 seconds, reopen).

Test by calling `curl http://localhost:1234/api/v1/models`. You should see the model you just set up. I also see "Nomic Embed Text v1.5" (text-embedding-nomic-embed-text-v1.5). The `/api/v1/` API is the LM Studio-specific API, which has an awful lot more information than `/v1/`, which is the OpenAI-compatible API. For tools, though, you'll want to use the latter, as the former has the wrong fields.

This API should tell you that qwen supports reasoning with two options: "off" or "on", and it defaults to "on", unlike many other models. You can pass this in on the [local API](https://lmstudio.ai/docs/developer/rest/chat):
```bash
curl http://127.0.0.1:1234/api/v1/chat -H "Content-Type: application/json" -d '{
    "model": "qwen/qwen3.5-9b",
    "system_prompt": "You answer only in rhymes.",
    "input": "What is your favorite color?",
    "reasoning": "off"
}'
```
You can also try including "/no\_think" in the input: this was how thinking mode was turned off in Qwen 3, and due to the lineage it still works sometimes. No guarantees, though.

Next up is OpenCode. After installing, create a file at `~/.config/opencode/opencode.jsonc` with the contents:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "lmstudio": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LM Studio (local)",
      "options": {
        "baseURL": "http://127.0.0.1:1234/v1"
      },
      "models": {
        "qwen/qwen3.5-9b": {
          "name": "Qwen 3.5-9b (local)",
          "variants": {
            "thinking": {
              "reasoningEffort": "high"
            },
            "fast": {
              "reasoningEffort": "none"
            }
          }
        }
      }
    }
  }
}
```

This will install Qwen with two modes: "thinking" and "fast". "Thinking" for when you want the correct answer, and "fast" for when you want the wrong answer much faster. You can use [ctrl+t](https://opencode.ai/docs/keybinds) to cycle through the variants.

Inside OpenCode you can set up the `/provider` and `/model` you've configured. If you try anything you'll note you get a wait of 2 minutes followed by a "Context size has been exceeded" message. The default context size in LM Studio is 8k, and agentic workloads eat through this quickly, but the model supports up to 262k tokens. You'll want to set this to 32k or 64k. Generally 64k is recommended, but larger contexts can increase processing time / cache pressure, so sometimes you want a smaller one, especially on weaker hardware. You can change this in "My Models" -> cog icon -> "Load" -> Context Length, or on "Load Model" in the server screen.

After this, it should be usable. Note that for development, one other [configuration change is recommended](https://unsloth.ai/docs/models/qwen3.5#recommended-settings): set the temperature down to 0.6 (or for general tasks, increase the presence\_penalty to 1.5). General issues include hallucinations and repetition in thinking (repeated "Wait, but..." paragraphs). You can try to reduce the repetition by increasing the presence\_penalty or repeat\_penalty, but this may have negative effects on quality. Also, if you have the hardware, use a larger model, now that the POC is proven to work.
