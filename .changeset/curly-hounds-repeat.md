---
'astro': minor
---

Adds a new `--timings` flag to `astro build` to help you find what slows down your builds

When a build takes longer than expected, it can be hard to tell whether the cause is an integration, a Markdown processor plugin, image processing, or even syntax highlighting. Add the `--timings` flag to your build command to print a summary once the build finishes:

```sh
astro build --timings
```

This is helpful to decide what to optimize first, or to compare build times before and after a change to your project.
