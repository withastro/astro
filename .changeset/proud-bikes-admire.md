---
'astro': patch
---

Fixes the dev toolbar returning a 504 "Outdated Optimize Dep" error when a workspace-linked package imports a dependency that Vite's initial scan did not discover
