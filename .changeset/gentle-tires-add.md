---
'astro': minor
---

Adds a `fetch()` function to the font provider `init()` context

This function requests a provider API, retrying transient failures and routing requests through a proxy when one is configured. It lets providers that wrap a 3rd-party unifont provider pass the context to it directly:

```ts
import type { FontProvider } from 'astro';
import type { InitializedProvider } from 'unifont';
import { acmeProvider } from '@acme/unifont-provider';

export function acmeFontProvider(): FontProvider {
	const provider = acmeProvider();
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		async init(context) {
			initializedProvider = await provider(context);
		},
		// ...
	};
}
```

