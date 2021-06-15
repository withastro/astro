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

`.astro` components can also accept props when they are rendered. Public props can be marked using the `export` keyword.

Local values are overwritten when props are passed, otherwise they are considered the default value.

```jsx
---
export let greeting = 'Hello';
export let name;
---

<main>
    <h1>{greeting} {name}!</h1>
</main>
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

### TODO: Composition (Slots)

[code-ext]: https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode
