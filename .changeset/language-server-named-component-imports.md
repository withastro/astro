---
'@astrojs/language-server': patch
'astro-vscode': patch
---

Fixes named imports of Astro components (e.g. `import { Footer } from './Footer.astro'`) not being reported as errors in the editor and by `astro check`
