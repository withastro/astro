---
'astro': major
---

Updates the Astro config loading flow to ignore processing locally-linked dependencies with Vite (e.g. `npm link`, in a monorepo, etc). Instead, they will be normally imported by the Node.js runtime the same way as other dependencies from `node_modules`.

Previously, Astro would process locally-linked dependencies which were able to use Vite features like TypeScript when imported by the Astro config file. 

However, this caused confusion as integration authors may test against a package that worked locally, but not when published. This method also restricts using CJS-only dependencies because Vite requires the code to be ESM. Therefore, Astro's behaviour is now changed to ignore processing any type of dependencies by Vite.

In most cases, make sure your locally-linked dependencies are built to JS before running the Astro project, and the config loading should work as before.
