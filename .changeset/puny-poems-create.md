---
'@astrojs/markdoc': minor
'@astrojs/preact': major
'@astrojs/svelte': major
'@astrojs/react': major
'@astrojs/solid-js': major
'@astrojs/mdx': major
'create-astro': major
'@astrojs/prism': major
'@astrojs/upgrade': minor
'astro': major
---

Increases minimum Node.js version to 22.0.0

Node 18 reached its End of Life in March 2025 and Node 20 is scheduled to reach its End of Life in April 2026.

Astro v6.0 drops Node 18 and Node 20 support entirely so that all Astro users can take advantage of Node's more modern features.

#### What should I do?

Check that both your development environment and your deployment environment are using **Node `22.0.0` or higher**.

1. Check your local version of Node using:

  ```sh
  node -v
  ```

2. Check your deployment environment's own documentation to verify that they support Node 22.

  You can specify Node `22.0.0` for your Astro project either in a dashboard configuration setting or a `.nvmrc` file.

  ```bash
  # .nvmrc
  22.0.0
  ```
