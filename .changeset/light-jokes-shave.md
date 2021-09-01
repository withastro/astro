---
'astro': minor
---

New `<Debug />` component (backwards compatible)

Debug is now imported from `import {Debug} from 'astro/components';`

It is now implemented internally using the <Code> component, so no CSS will be added to your page when you use this component.

Outdated imports (from 'astro/debug') will continue to work with a deprecation warning to update. This will be removed entirely before v1.0.
