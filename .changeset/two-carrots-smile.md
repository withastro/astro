---
'astro': minor
---

Added `Polymorphic` type helper to `astro/types` to easily create polymorphic components:

```astro
---
import { HTMLTag, Polymorphic } from 'astro/types';

type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }>;

const { as: Tag, ...props } = Astro.props;
---

<Tag {...props} />
```
