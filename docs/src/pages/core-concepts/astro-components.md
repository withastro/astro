---
layout: ~/layouts/MainLayout.astro
title: Astro Components
---

**Astro Components** (files ending with `.astro`) are the foundation of server-side templating in Astro. Think of the Astro component syntax as HTML enhanced with JavaScript.

Learning a new syntax can feel intimidating, so we carefully designed the Astro component syntax to feel as familiar to web developers as possible. It borrows heavily from patterns you likely already know: components, frontmatter, props, and JSX expressions. We're confident that this guide will have you writing Astro components in no time, especially if you are already familiar with HTML & JavaScript.

## Syntax Overview

A single `.astro` file represents a single Astro component in your project. This pattern is known as a **Single-File Component (SFC)**. Both Svelte (`.svelte`) and Vue (`.vue`) also follow this pattern.

Below is a walk-through of the different pieces and features of the Astro component syntax. You can read it start-to-finish, or jump between sections.

### HTML Template

Astro component syntax is a superset of HTML. **If you know HTML, you already know enough to write your first Astro component.**

For example, this three-line file is a valid Astro component:

```html
<!-- Example1.astro - Static HTML is a valid Astro component! -->
<div class="example-1">
  <h1>Hello world!</h1>
</div>
```

An Astro component represents some snippet of HTML in your project. This can be a reusable component, or an entire page of HTML including `<html>`, `<head>` and `<body>` elements. See our guide on [Astro Pages](/core-concepts/astro-pages) to learn how to build your first full HTML page with Astro.

**Every Astro component must include an HTML template.** While you can enhance your component in several ways (see below), at the end of the day it's the HTML template that dictates what your rendered Astro component will look like.

### CSS Styles

CSS rules inside of a `<style>` tag are automatically scoped to that component. That means that you can reuse class names across multiple components, without worrying about conflicts. Styles are automatically extracted and optimized in the final build so that you don't need to worry about style loading.

For best results, you should only have one `<style>` tag per-Astro component. This isn't necessarily a limitation, but it will often result in better-optimized CSS in your final build. When you're working with pages, the `<style>` tag can go nested inside of your page `<head>`. For standalone components, the `<style>` tag can go at the top-level of your template.

```html
<!-- Astro Component CSS example -->
<style>
  .circle {
    background-color: red;
    border-radius: 999px;
    height: 50px;
    width: 50px;
  }
</style>
<div class="circle"></div>
```

```html
<!-- Astro Page CSS example -->
<html>
  <head>
    <style>
      ...;
    </style>
  </head>
  <body>
    ...
  </body>
</html>
```

Using `<style global>` will skip automatic scoping for every CSS rule in the `<style>` block. This escape hatch should be avoided if possible but can be useful if, for example, you need to modify styling for HTML elements added by an external library.

Sass (an alternative to CSS) is also available via `<style lang="scss">`.

📚 Read our full guide on [Component Styling](/guides/styling) to learn more.

### Frontmatter Script

To build dynamic components, we introduce the idea of a frontmatter component script. [Frontmatter](https://jekyllrb.com/docs/front-matter/) is a common pattern in Markdown, where some config/metadata is contained inside a code fence (`---`) at the top of the file. Astro does something similar, but with full support for JavaScript & TypeScript in your components.

Remember that Astro is a server-side templating language, so your component script will run during the build but only the HTML is rendered to the browser. To send JavaScript to the browser, you can use a `<script>` tag in your HTML template or [convert your component to use a frontend framework](/core-concepts/component-hydration) like React, Svelte, Vue, etc.

```astro
---
// Anything inside the `---` code fence is your component script.
// This JavaScript code runs at build-time.
// See below to learn more about what you can do.
console.log('This runs at build-time, is visible in the CLI output');
// Tip: TypeScript is also supported out-of-the-box!
const thisWorks: number = 42;
---
<div class="example-1">
  <h1>Hello world!</h1>
</div>
```

### Component Imports

An Astro component can reuse other Astro components inside of its HTML template. This becomes the foundation of our component system: build new components and then reuse them across your project.

To use an Astro component in your template, you first need to import it in the frontmatter component script. An Astro component is always the file's default import.

Once imported, you can use it like any other HTML element in your template. Note that an Astro component **MUST** begin with an uppercase letter. Astro will use this to distinguish between native HTML elements (`form`, `input`, etc.) and your custom Astro components.

```astro
---
// Import your components in your component script...
import SomeComponent from './SomeComponent.astro';
---
<!-- ... then use them in your HTML! -->
<div>
  <SomeComponent />
</div>
```

📚 You can also import and use components from other frontend frameworks like React, Svelte, and Vue. Read our guide on [Component Hydration](/core-concepts/component-hydration) to learn more.

### Dynamic JSX Expressions

Instead of inventing our own custom syntax for dynamic templating, we give you direct access to JavaScript values inside of your HTML, using something that feels just like [JSX](https://reactjs.org/docs/introducing-jsx.html).

Astro components can define local variables inside of the Frontmatter script. Any script variables are then automatically available in the HTML template below.

#### Dynamic Values

```astro
---
const name = "Your name here";
---
<div>
  <h1>Hello {name}!</h1>
</div>
```

#### Dynamic Attributes

```astro
---
const name = "Your name here";
---
<div>
  <div data-name={name}>Attribute expressions supported</div>
  <div data-hint={`Use JS template strings to mix ${"variables"}.`}>So good!</div>
</div>
```

#### Dynamic HTML

```astro
---
const items = ["Dog", "Cat", "Platipus"];
---
<ul>
  {items.map((item) => (
    <li>{item}</li>
  ))}
</ul>
```

### Component Props

An Astro component can define and accept props. Props are available on the `Astro.props` global in your frontmatter script.

```astro
---
// Example: <SomeComponent greeting="(Optional) Hello" name="Required Name" />
const { greeting = 'Hello', name } = Astro.props;
---
<div>
    <h1>{greeting}, {name}!</h1>
</div>
```

You can define your props with TypeScript by exporting a `Props` type interface.

> _**In the future**_, Astro will automatically pick up any exported `Props` interface and give type warnings/errors for your project.

```astro
---
// Example: <SomeComponent />  (WARNING: "name" prop is required)
export interface Props {
  name: string;
  greeting?: string;
}
const { greeting = 'Hello', name } = Astro.props;
---
<div>
    <h1>{greeting}, {name}!</h1>
</div>
```

### Slots

`.astro` files use the [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) tag to enable component composition. Coming from React or Preact, this is the same concept as `children`. You can think of the `<slot>` element as a placeholder for markup which will be passed in from outside of the component.

```astro
<!-- Example: MyComponent.astro -->
<div id="my-component">
  <slot /> <!-- children will go here -->
</div>

<!-- Usage -->
<MyComponent>
  <h1>Hello world!</h1>
</MyComponent>
```

Note that if the `<slot>` tag is not used in the HTML template, any children passed to the component will not be rendered.

Slots become even more powerful when using **named slots**. Rather than a single `<slot>` element which renders _all_ children, named slots allow you to specify multiple places where children should be placed.

> **Note:** The `slot` attribute is not restricted to plain HTML, components can use `slot` as well!

```astro
<!-- Example: MyComponent.astro -->
<div id="my-component">
  <header>
    <!-- children with the `slot="header"` attribute will go here -->
    <slot name="header" />
  </header>
  <main>
    <!-- children without a `slot` (or with the `slot="default"`) attribute will go here -->
    <slot />
  </main>
  <footer>
    <!-- children with the `slot="footer"` attribute will go here -->
    <slot name="footer" />
  </footer>
</div>

<!-- Usage -->
<MyComponent>
  <h1 slot="header">Hello world!</h1>
  <p>Lorem ipsum ...</p>
  <FooterComponent slot="footer" />
</MyComponent>
```

Slots can also render **fallback content**. When there are no matching children passed to a `<slot>`, a `<slot>` element will render its own placeholder children.

```astro
<!-- MyComponent.astro -->
<div id="my-component">
  <slot>
    <h1>I will render when this slot does not have any children!</h1>
  </slot>
</div>

<!-- Usage -->
<MyComponent />
```

### Fragments & Multiple Elements

An Astro component template can render as many top-level elements as you'd like. Unlike other UI component frameworks, you don't need to wrap everything in a single `<div>` if you'd prefer not to.

```html
<!-- An Astro component can contain multiple top-level HTML elements: -->
<div id="a" />
<div id="b" />
<div id="c" />
```

When working inside a JSX expression, however, you must wrap multiple elements inside of a **Fragment**. Fragments let you render a set of elements without adding extra nodes to the DOM. This is required in JSX expressions because of a limitation of JavaScript: You can never `return` more than one thing in a JavaScript function or expression. Using a Fragment solves this problem.

A Fragment must open with `<>` and close with `</>`. Don't worry if you forget this, Astro's compiler will warn you that you need to add one.

```astro
---
const items = ["Dog", "Cat", "Platipus"];
---
<ul>
  {items.map((item) => (
    <>
      <li>Red {item}</li>
      <li>Blue {item}</li>
      <li>Green {item}</li>
    </>
  ))}
</ul>
```

## Comparing `.astro` versus `.jsx`

`.astro` files can end up looking very similar to `.jsx` files, but there are a few key differences. Here's a comparison between the two formats.

| Feature                      | Astro                                      | JSX                                                |
| ---------------------------- | ------------------------------------------ | -------------------------------------------------- |
| File extension               | `.astro`                                   | `.jsx` or `.tsx`                                   |
| User-Defined Components      | `<Capitalized>`                            | `<Capitalized>`                                    |
| Expression Syntax            | `{}`                                       | `{}`                                               |
| Spread Attributes            | `{...props}`                               | `{...props}`                                       |
| Boolean Attributes           | `autocomplete` === `autocomplete={true}`   | `autocomplete` === `autocomplete={true}`           |
| Inline Functions             | `{items.map(item => <li>{item}</li>)}`     | `{items.map(item => <li>{item}</li>)}`             |
| IDE Support                  | WIP - [VS Code][code-ext]                  | Phenomenal                                         |
| Requires JS import           | No                                         | Yes, `jsxPragma` (`React` or `h`) must be in scope |
| Fragments                    | Automatic top-level, `<>` inside functions | Wrap with `<Fragment>` or `<>`                     |
| Multiple frameworks per-file | Yes                                        | No                                                 |
| Modifying `<head>`           | Just use `<head>`                          | Per-framework (`<Head>`, `<svelte:head>`, etc)     |
| Comment Style                | `<!-- HTML -->`                            | `{/* JavaScript */}`                               |
| Special Characters           | `&nbsp;`                                   | `{'\xa0'}` or `{String.fromCharCode(160)}`         |
| Attributes                   | `dash-case`                                | `camelCase`                                        |

## URL resolution

It's important to note that Astro **won't** transform HTML references for you. For example, consider an `<img>` tag with a relative `src` attribute inside `src/pages/about.astro`:

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

The recommended approach is to place files within `public/*`. This references a file at `public/thumbnail.png`, which will resolve to `/thumbnail.png` at the final build (since `public/` ends up at `/`).

#### Option 2: Asset import references

```astro
---
//  ✅ Correct: references src/thumbnail.png
import thumbnailSrc from './thumbnail.png';
---

<img src={thumbnailSrc} />
```

If you'd prefer to organize assets alongside Astro components, you may import the file in JavaScript inside the component script. This works as intended but this makes `thumbnail.png` harder to reference in other parts of your app, as its final URL isn't easily-predictable (unlike assets in `public/*`, where the final URL is guaranteed to never change).

[code-ext]: https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode
