---
"astro": minor
---

Adds a new `ComponentProps` type export from `astro/types` to get the props type of an Astro component.

```astro
---
import type { ComponentProps } from 'astro/types';
import { Button } from "./Button.astro";

type myButtonProps = ComponentProps<typeof Button>;
---
```
