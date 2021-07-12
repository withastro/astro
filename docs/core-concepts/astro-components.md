---
layout: ~/layouts/Main.astro
title: Astro Components
---

## ✨ `.astro` Syntax

Astro comes with its own server-side, component-based templating language. Think of it as HTML enhanced with the full power of JavaScript.

Learning a new syntax can be intimidating, but the `.astro` format has been carefully designed with familiarity in mind. It borrows heavily from patterns you likely already know—components, Frontmatter, and JSX-like expressions. We're confident that this guide will help you feel comfortable writing `.astro` files in no time.

---

### The `.astro` format

If you're already familiar with **HTML or JavaScript**, you'll likely feel comfortable with `.astro` files right away.

Think of `.astro` as **component-oriented HTML**. Components are reusable, self-contained blocks of HTML and CSS that belong together.

```html
<!-- This is a valid Astro component -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <main>
      <h1>Hello world!</h1>
    </main>
  </body>
</html>
```

```html
<!-- This is also a valid Astro component! -->
<main>
  <h1>Hello world!</h1>
</main>
```

Developers have come up with a myriad of different techniques for composing blocks of HTML over the years, but far and away the most successful has been [JSX](https://reactjs.org/docs/introducing-jsx.html).

We love JSX! In fact, `.astro` files borrow the highly-expressive expression syntax directly from JSX.

```jsx
<!-- This is an Astro component with expressions! -->
<main>
  <h1>Hello {name}!</h1>
  <ul>
    {items.map((item) => (
      <li>{item}</li>
    ))}
  </ul>
  <h2 data-hint={`Use JS template strings when you need to mix-in ${"variables"}.`}>So good!</h2>
</main>
```

`.astro` files also borrow the concept of [Frontmatter](https://jekyllrb.com/docs/front-matter/) from Markdown. Instead of introducing a new HTML-oriented `import` and `export` syntax, `.astro` just uses JavaScript.

```jsx
---
// This area is TypeScript (and therefore JavaScript)!
import MyComponent from './MyComponent.astro'
---

<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    <MyComponent></MyComponent>
  </body>
</html>
```

### Data and Props

`.astro` components can define local variables inside of the Frontmatter script. These are automatically exposed to the content below.

```jsx
---
let name = 'world';
---

<main>
    <h1>Hello {name}!</h1>
</main>
```

`.astro` components can also accept props when they are rendered. Public props are exposed on the `Astro.props` global.

```jsx
---
const { greeting = 'Hello', name } = Astro.props;
---

<main>
    <h1>{greeting} {name}!</h1>
</main>
```

To define the props which your component accepts, you may export a TypeScript interface or type named `Props`.

```tsx
---
export interface Props {
  name: string;
  greeting?: string;
}

const { greeting = 'Hello', name } = Astro.props;
---

<main>
    <h1>{greeting} {name}!</h1>
</main>
```

### Slots

`.astro` files use the [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) element to enable component composition. Coming from React, this is the same concept as `children`. You can think of the `<slot>` element as a placeholder for markup which will be passed from outside of the component.

```astro
<!-- MyComponent.astro -->
<div id="my-component">
  <slot /> <!-- children will go here -->
</div>

<!-- Usage -->
<MyComponent>
  <h1>Hello world!</h1>
</MyComponent>
```

Slots are especially powerful when using **named slots**. Rather than a single `<slot>` element which renders _all_ children, named slots allow you to specify where certain children should be placed.

> **Note** The `slot` attribute is not restricted to plain HTML, components can use `slot` as well!

```astro
<!-- MyComponent.astro -->
<div id="my-component">
  <header>
    <slot name="header" /> <!-- children with the `slot="header"` attribute will go here -->
  </header>

  <main>
    <!-- children without a `slot` (or with the `slot="default"`) attribute will go here -->
    <slot />
  </main>

  <footer>
    <slot name="footer"> <!-- children with the `slot="footer"` attribute will go here -->
  </footer>
</div>

<!-- Usage -->
<MyComponent>
  <h1 slot="header">Hello world!</h1>
  <p>Lorem ipsum ...</p>
  <FooterComponent slot="footer" />
</MyComponent>
```

Slots also have the ability to render **fallback content**. When there are no matching children passed to a `<slot>`, a `<slot>` element will be replaced with its own children.

```astro
<!-- MyComponent.astro -->
<div id="my-component">
  <slot>
    <h1>I will render when this slot does not have any children!</h1>
  </slot>
</div>
```

### Fragments

At the top-level of an `.astro` file, you may render any number of elements.

```html
<!-- Look, no Fragment! -->
<div id="a" />
<div id="b" />
<div id="c" />
```

Inside of an expression, you must wrap multiple elements in a Fragment. Fragments must open with `<>` and close with `</>`.

```jsx
<div>
  {[0, 1, 2].map((id) => (
    <>
      <div id={`a-${id}`} />
      <div id={`b-${id}`} />
      <div id={`c-${id}`} />
    </>
  ))}
</div>
```

### `.astro` versus `.jsx`

`.astro` files can end up looking very similar to `.jsx` files, but there are a few key differences. Here's a comparison between the two formats.

| Feature                 | Astro           | JSX              |
| ----------------------- | --------------- | ---------------- |
| File extension          | `.astro`        | `.jsx` or `.tsx` |
| User-Defined Components | `<Capitalized>` | `<Capitalized>`  |
| Expression Syntax       | `{}`            | `{}`             |
| Spread Attributes       | `{...props}`    | `{...props}`     |

|
| Children | `<slot>` (with named slot support) | `children`  
|
| Boolean Attributes | `autocomplete` === `autocomplete={true}` | `autocomplete` === `autocomplete={true}` |
| Inline Functions | `{items.map(item => <li>{item}</li>)}` | `{items.map(item => <li>{item}</li>)}` |
| IDE Support | WIP - [VS Code][code-ext] | Phenomenal |
| Requires JS import | No | Yes, `jsxPragma` (`React` or `h`) must be in scope |
| Fragments | Automatic top-level, `<>` inside functions | Wrap with `<Fragment>` or `<>` |
| Multiple frameworks per-file | Yes | No |
| Modifying `<head>` | Just use `<head>` | Per-framework (`<Head>`, `<svelte:head>`, etc) |
| Comment Style | `<!-- HTML -->` | `{/* JavaScript */}` |
| Special Characters | `&nbsp;` | `{'\xa0'}` or `{String.fromCharCode(160)}` |
| Attributes | `dash-case` | `camelCase` |

### URL resolution

It’s important to note that Astro **won’t** transform HTML references for you. For example, consider an `<img>` tag with a relative `src` attribute inside `src/pages/about.astro`:

```html
<!-- ❌ Incorrect: will try and load `/about/thumbnail.png` -->
<img src="./thumbnail.png" />
```

Since `src/pages/about.astro` will build to `/about/index.html`, you may not have expected that image to live at `/about/thumbnail.png`. So to fix this, choose either of two options:

#### Option 1: Absolute URLs

```html
<!-- ✅ Correct: references public/thumbnail.png -->
<img src="/thumbnail.png" />
```

The recommended approach is to place files within `public/*`. This references a file it `public/thumbnail.png`, which will resolve to `/thumbnail.png` at the final build (since `public/` ends up at `/`).

#### Option 2: Asset import references

```jsx
---
//  ✅ Correct: references src/thumbnail.png
import thumbnailSrc from './thumbnail.png';
---

<img src={thumbnailSrc} />
```

If you’d prefer to organize assets alongside Astro components, you may import the file in JavaScript inside the component script. This works as intended but this makes `thumbnail.png` harder to reference in other parts of your app, as its final URL isn’t easily-predictable (unlike assets in `public/*`, where the final URL is guaranteed to never change).

[code-ext]: https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode
