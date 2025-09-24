---
'astro': minor
---

Adds a new `SvgComponent` type

You can now more easily enforce type safety for your `.svg` assets by directly importing `SVGComponent` from `astro/types`:

```astro
---
// src/components/Logo.astro
import type { SvgComponent } from "astro/types";
import HomeIcon from './Home.svg'
interface Link {
	url: string
	text: string
	icon: SvgComponent
}
const links: Link[] = [
	{
		url: '/',
		text: 'Home',
		icon: HomeIcon
	}
]
---
```
