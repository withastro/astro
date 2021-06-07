# Publishing Astro components

Astro is able to use components from most popular frameworks such as React, Vue, Svelte and Preact out of the box. You can also write components in the `.astro` format.

Every framework recommends different methods for publishing components, this document talks about how we suggest you publish Astro components to [npm](https://www.npmjs.com/).

## Astro component uses cases

Astro components are server-only and provide a lightweight HTML-like syntax.

This makes Astro components a good match for anything that doesn't need to be interactive in the client. Astro comes with a few built-in components such as the [Prism](https://prismjs.com/) component which you can use like so:

```jsx
---
import { Prism } from 'astro/components';
---

<Prism code={`const foo = 'bar';`} />
```

This component provides syntax highlighting for code blocks. Since this never changes in the client it makes sense to use an Astro component (it's equally reasonable to use a framework component for this kind of thing; Astro is server-only by default for all frameworks!).

## Publishing components

Some frameworks, such as [React](https://reactjs.org/) recommend pre-compiling components to JavaScript and publishing the artifacts. Astro currently doesn't have a way to pre-compile components, so we recommend publishing the `.astro` files directly.

Here's an example project with a couple of components.

```
/my-components/
├── package.json
├── index.js
├── capitalize.astro
└── bold.astro
```

Where **index.js** looks like this:

```js
export { default as Capitalize } from './capitalize.astro';
export { default as Bold } from './bold.astro';
```

In your **package.json** define an [exports entry](https://nodejs.org/api/packages.html) like so:

```json
{
  "name": "@example/my-components",
  "version": "1.0.0",
  "exports": "./index.js"
}
```

This will allow consumers to import your components like so:

```svelte
---
import { Bold, Capitalize } from '@example/my-components';
---

<Capitalize phrase={`Hello world`} />
```

### Importing astro components directly

Above we created an index file that re-exports our components, which gives us the ability to publish several components in a single package. Since Astro components are server only we don't need to worry about tree-shaking concerns.

However you can also import published `.astro` files directly, in the same manner that you import `.astro` files in your own project.

Change the above **package.json** to this:

```json
{
  "name": "@example/my-components",
  "version": "1.0.0",
  "exports": {
    ".": "./index.js",
    "./bold.astro": "./bold.astro",
    "./capitalize.astro": "./capitalize.astro"
  }
}
```

The `"."` is used to signify the package's main module. We set it to the **index.js** file to allow the import method shown above.

Adding `"./bold.astro"` and `"./capitalize.astro"` to the exports field also allows consumers to import the components directly, by file name, like so:

```svelte
---
import Capitalize from '@example/my-components/capitalize.astro';
---

<Capitalize phrase={`Hello world`} />
```
