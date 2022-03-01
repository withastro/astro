---
title: 'Scaling Astro to 10,000+ Pages'
description: 'A new experimental flag in Astro build enables building sites with tens of thousands of pages.'
publishDate: 'January 25, 2022'
authors:
  - matthew
lang: 'en'
---

Astro is about to get a lot faster! Our new build optimization process is ready to try out in Astro today:

```shell
astro build --experimental-static-build
```

Our new build system can scale to tens, or even hundreds, of thousands of pages. If you hang out in our [Discord](https://astro.build/chat) or pay attention to recent releases you might have seen a lot of discussion about a "static build". Our new implementation of `astro build` does 2 things:

- Improves build times by up to 75%.
- Lowers memory usage when building very large sites (10,000+ pages).

This new build works by first building an SSR version of your app and then rendering each page to HTML. Because the site is pre-optimized it can render each page in parallel and will never run out of memory.

If you are a current Astro user please try out this new build by passing the flag in your `build` script.

This build approach will remain flagged for the next few releases until we iron out any issues, at which point we plan to promote it to be the default `astro build` command. Please help us by reporting issues you encounter, either in the [Discord](https://astro.build/chat) or by filing an [issue](https://github.com/withastro/astro/issues/new/choose).