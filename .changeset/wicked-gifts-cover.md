---
'astro': minor
---

Adds support for the client:media hydrator

The new `client:media` hydrator allows you to define a component that should only be loaded when a media query matches. An example usage:

```jsx
---
import Sidebar from '../components/Sidebar.jsx';
---

<Sidebar client:media="(max-width: 700px)" />
```

This allows you to define components which, for example, only run on mobile devices. A common example is a slide-in sidebar that is needed to add navigation to a mobile app, but is never displayed in desktop view.

Since Astro components can have expressions, you can move common media queries to a module for sharing. For example here are defining:

**media.js**

```js
export const MOBILE = '(max-width: 700px)';
```

And then you can reference this in your page:

**index.astro**

```jsx
import Sidebar from '../components/Sidebar.jsx';
import { MOBILE } from '../media.js';
---

<Sidebar client:media={MOBILE} />
```
