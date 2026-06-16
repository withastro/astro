---
'astro': major
---

Removes deprecated APIs exported from `astro:transitions`.

In Astro 6.x, some helpers available in `astro:transitions` and `astro:transitions/client` were deprecated.

In Astro 7.0, the following APIs can no longer be used in your project:
- `TRANSITION_BEFORE_PREPARATION`
- `TRANSITION_AFTER_PREPARATION`
- `TRANSITION_BEFORE_SWAP`
- `TRANSITION_AFTER_SWAP`
- `TRANSITION_PAGE_LOAD`
- `isTransitionBeforePreparationEvent()`
- `isTransitionBeforeSwapEvent()`
- `createAnimationScope()`

#### What should I do?

Remove any occurrence of `createAnimationScope()`:

```diff
-import { createAnimationScope } from 'astro:transitions';
```

Replace any occurrence of the other APIs using the lifecycle event names directly:

```diff
-import {
-	TRANSITION_AFTER_SWAP,
-	isTransitionBeforePreparationEvent,
-} from 'astro:transitions/client';

-console.log(isTransitionBeforePreparationEvent(event));
+console.log(event.type === 'astro:before-preparation');

-console.log(TRANSITION_AFTER_SWAP);
+console.log('astro:after-swap');
```

Learn more about all utilities available in the [View Transitions Router API Reference](https://v7.docs.astro.build/en/reference/modules/astro-transitions/).
