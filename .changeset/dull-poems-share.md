---
"astro": minor
---

Adds a new optional `getFontProperties()` callback to font providers

Font providers can now expose the weights, styles, subsets and formats a font family actually has. Astro uses it when resolving your font configuration to warn about values a provider cannot serve, for example a weight a font family does not offer.

All built-in providers implement it. If you maintain a custom font provider, implementing this callback is optional for now but it will be required in Astro 8:

```ts
import type { FontProvider } from 'astro';

const provider: FontProvider = {
	name: 'my-provider',
	resolveFont: ({ familyName }) => {
		// ...
	},
	getFontProperties: ({ familyName }) => ({
		weights: ['400', '700'],
		styles: ['normal', 'italic'],
		subsets: ['latin'],
		formats: ['woff2'],
	}),
};
```
