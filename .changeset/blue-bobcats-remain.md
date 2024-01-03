---
"@astrojs/preact": minor
---

Allows rendering lazy components.

You can now use [lazy components](https://preactjs.com/guide/v10/switching-to-preact/#suspense-experimental) with Suspense:

``` jsx
import { lazy, Suspense } from 'preact/compat';

const HeavyComponent= lazy(() => import('./HeavyComponent'));

const Component = () => {
	return (
    <Suspense fallback={<p>Loading...</p>}>
			<HeavyComponent foo="bar" />
		</Suspense>
  	);
};
```
