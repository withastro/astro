---
"@astrojs/preact": minor
---

Allows rendering lazy components.

Now you can use lazy components on your SSR. Fallback will be not displayed when component renders on the server and when hydration process too. More details about [lazy-components](https://preactjs.com/guide/v10/switching-to-preact/#suspense-experimental).

``` jsx
import { lazy, Suspense } from 'preact/compat';

const BigComponent = lazy(async () => import('./BigComponent'));
const Fallback = () => <p>Loading...</p>;

const Component = () => {
  return (
    <div>
      <h1>Header</h1>

      <Suspense fallback={Fallback}>
				<BigComponent someProp="someValue">
          {children}
        </BigComponent>
			</Suspense>
    </div>
  )
}
```
