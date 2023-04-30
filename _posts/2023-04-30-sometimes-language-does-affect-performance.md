---
layout: post
title:  "Sometimes language does affect performance"
tags: [technical]
---

A common refrain is that if rewriting your application in a different language improves the performance, this is mostly due to being able to rearchitect to remove technical debt, instead of due to the language itself.

However, some languages are faster than others! Low-level languages like C or Rust are faster than higher-level compiled languages like Java or C#, which are faster than interpreted languages like JavaScript or Python.

I recently wrote a Monte Carlo simulation to determine the likely buff a skill gave in Kingdom of Loathing. I first wrote the simulation in Python, as that's what I am most familiar with:

```python
#!/bin/env python3
import random

queue = []
monsters = [1, 1, 1, 2, 3, 4, 5]

def pick_monster():
  random.shuffle(monsters)
  pick = monsters[0]
  if pick == 1:
    return 1
  elif pick not in queue:
    return pick
  else:
    if random.random() < 0.25:
      return pick
    else:
      return pick_monster()

def add_queue(elt):
  if len(queue) < 5:
    queue.append(elt)
  else:
    del queue[0]
    queue.append(elt)

def main(n):
  count = 0
  # 5 encounter zone
  # plus two copies, ignore queue
  for x in range(1, n):
    pick = pick_monster()
    if pick == 1:
      count += 1
    add_queue(pick)
  return count/n


if __name__ == '__main__':
  import sys
  avg = main(int(sys.argv[1]))
  print(avg)
```

This runs "fast enough" to get a decent answer: ~0.55 with 1,000,000 iterations taking around 7 seconds.

For fun, I then rewrote it in Rust:

```rust
use rand::rngs::ThreadRng;
use rand::seq::SliceRandom;
use rand::thread_rng;
use rand::Rng;
use std::env;

fn pick_monster(mut rng: &mut ThreadRng, monsters: &[i32], queue: &[i32]) -> i32 {
    let pick = monsters.choose(&mut rng).unwrap();
    if *pick == 1 {
        1
    } else if !queue.contains(pick) {
        *pick
    } else {
        let r: f32 = rng.gen();
        if r < 0.25 {
            *pick
        } else {
            pick_monster(rng, monsters, queue)
        }
    }
}

fn add_queue(queue: &mut Vec<i32>, pick: i32) {
    if queue.len() == 5 {
        queue.remove(0);
    }
    queue.push(pick);
}

fn calc(n: i32) -> f32 {
    let mut queue: Vec<i32> = Vec::with_capacity(5);
    // 5 encounter zone
    // plus two copies, ignore queue
    let monsters = vec![1, 1, 1, 2, 3, 4, 5];

    let mut rng = thread_rng();
    let mut count = 0;
    for _ in 0..n {
        let pick = pick_monster(&mut rng, &monsters, &queue);
        if pick == 1 {
            count += 1;
        }
        add_queue(&mut queue, pick);
    }
    count as f32 / n as f32
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let default_iter = 1_000_000;
    let iterations: i32 = if args.len() < 2 {
        default_iter
    } else {
        args[1].parse().unwrap_or(default_iter)
    };
    let avg = calc(iterations);
    println!("{}", avg);
}
```

Note the similarity in functions: both scripts have the same structure. However, the Rust script runs a lot faster: running in release mode takes 0.15 seconds for the same million iterations. This is a nearly 50x improvement!

The Rust script can presumably be further optimised. I tried swapping out the `Vec` for a `VecDeque` as each iteration (past the first five) we remove an entry from the start, but this wound up slower, possibly due to `contains` being less efficient.
