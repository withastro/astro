---
layout: ../../layouts/content.astro
title: Workbox
tags: communityGuide
description: The Workbox CLI integrates well with Snowpack.
---

<div class="stub">
This article is a stub, you can help expand it into <a href="https://documentation.divio.com/how-to-guides/">guide format</a>
</div>

The [Workbox CLI](https://developers.google.com/web/tools/workbox/modules/workbox-cli) integrates well with Snowpack. Run the wizard to bootstrap your first configuration file, and then run `workbox generateSW` to generate your service worker.

Remember that Workbox expects to be run every time you deploy, as a part of a production build process. If you don't have one yet, create package.json [`"deploy"` and/or `"build"` scripts](https://michael-kuehnel.de/tooling/2018/03/22/helpers-and-tips-for-npm-run-scripts.html) to automate your production build process.
