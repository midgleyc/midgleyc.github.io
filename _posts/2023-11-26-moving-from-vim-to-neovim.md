---
layout: post
title: "Moving from Vim to Neovim"
tags: [technical, vim, neovim]
---

I recently installed Neovim (nvim) after about a decade of vim, hoping it would fix a problem I had with an extension. That turned out to be unrelated, but I kept with it -- [coc.nvim](https://github.com/neoclide/coc.nvim) focuses on neovim, and having access to all features by default is helpful.

# Notable differences
* There is a tiny increase in the amount of time it takes to load a file. This is only noticeable because the previous opening time was so little. This is offset by a greater support for asynchronicity when loading LSPs for source code.
* In Vim, opening a terminal is `:term` or `:vert term` to open in a vertical split. In Neovim, `:term` opens in the current split, so the equivalent command is `:vsp +term`, or `:vsp +term | startinsert` to start in terminal mode (as Vim does). This uses `+cmd` to run a command in a newly created split, and then enter terminal mode.
* In Vim, leaving terminal mode is `CTRL-W N`, and in Neovim it's `CTRL-\ CTRL-n`. I can't say either of these are particularly easy to remember.
* `coc-settings.json` is stored in a different place (`./config/nvim/coc-settings.json` instead of `~/.vim/coc-settings.json`).
* You can't spawn a shell (`:sh`) at all. Terminal is generally good enough -- shell was convenient because it doesn't interpret your mappings, and I have ` w` set to `CTRL-W`. Doing terminal management outside Vim would be a better alternative.
* In Vim, bang commands  (`:!cmd`) show their output full screen, not showing any of the existing file. In Neovim, they show at the bottom of the screen.
* In Neovim, bang commands are no longer interactive.
* Neovim adds some `default-mappings`, e.g. `Y` to `y$`. While I agree this makes more sense, I have never used `y$`, and I have a lot of muscle memory for `Y`, so I unmap it: `silent! nunmap Y`.
* Neovim autocompletes from different places. `'complete'` is set to `.,w,b,u,t` instead of `.,w,b,u,t,i` so it should still scan all open buffers, but oddly I find it frequently doesn't seem to. 
* Neovim doesn't add `$`s to the end of lines when using `set list`. This might be desired for cleanliness, but I really got used to it, so I added it back to `'listchars'`. Also, in vim tabs are represented as `^I`, but in neovim a fancier `> ` for the length of the tab. Having it as `^I` did make them more noticeable.
* Neovim's cursor is different sometimes -- e.g., when in Ex mode, pressing left has it show as a line instead of a block (configured as `guicursor`). I can't say I mind this either way.

# Configuration
I followed the [migration guide](https://neovim.io/doc/user/nvim.html#nvim-from-vim) to get set up: creating the `init.vim` and splashing `has('nvim')` around my current `.vimrc`.

* I move the `backupdir` and `undodir` inside `~/.config/nvim` for Neovim. Neovim version [0.5 or above](https://github.com/neovim/neovim/commit/6995fad260e3e7c49e4f9dc4b63de03989411c7b) has a "version 3" undofile incompatible with vim's, so they shouldn't be stored in the same place.
* I source a bunch of things from `$VIMRUNTIME/defaults.vim` (using `unlet! skip_defaults_vim`), which doesn't exist on Neovim, so I went through there extracting the bits that I liked and that Neovim didn't do by default. There wasn't much.
* I set `mouse` to `nv` so I can still right-click to paste in insert mode. I am trying to use `unnamedplus` with `'clipboard'` but I might go back to just `unnamed` -- I think generally sharing a clipboard with the OS is what I want, but I keep copying something, then running `dib` or something and accidentally overwriting the thing I'm trying to paste. I'll probably improve in time.

# Conclusion
It's okay. The main benefit of getting sorted now is that if I wind up in a place that only allows VSCode (as seems likelier as environments get more and more locked down, given the popularity of that editor), I'll be able to use a Vim with proper macro support by [running Neovim inside VSCode](https://github.com/vscode-neovim/vscode-neovim).
