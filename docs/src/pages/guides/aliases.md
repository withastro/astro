---
layout: ~/layouts/MainLayout.astro
title: Aliases
description: An intro to aliases with Astro.
---

An **alias** is a way to create shortcuts for your imports.

Aliases can help improve the development experience in codebases with many directories or relative imports.

```astro
---
// my-project/src/pages/about/company.astro

import Button from '../../components/controls/Button.astro';
import logoUrl from '../../assets/logo.png?url';
---
```

In this example, a developer would need to understand the tree relationship between `src/pages/about/company.astro`, `src/components/controls/Button.astro`, and `src/assets/logo.png`. And then, if the `company.astro` file were to be moved, these imports would also need to be updated.

You can add import aliases from either `tsconfig.json` or `jsconfig.json`.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "asset:*": ["src/assets/*?url"],
      "component:*": ["src/components/*.astro"]
    }
  }
}
```

With this change, you can now import using the aliases anywhere in your project:

```astro
---
// my-project/src/pages/about/company.astro

import Button from 'component:Button';
import logoUrl from 'asset:logo.png';
---
```

These aliases are also integrated automatically into [VSCode](https://code.visualstudio.com/docs/languages/jsconfig) and other editors.
