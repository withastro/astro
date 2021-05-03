## ✨ `.astro` Syntax

"Yikes! Here we go again... They're really going to make me learn another new syntax?"

Believe us, we know—and we wouldn't have introduced the `.astro` syntax without having some great reasons. Give us five minutes, read through this guide, and we think you'll be as excited about Astro as we are.

---

### Why use Astro?

By focusing on HTML _instead of JavaScript_, Astro is able to be framework-agnostic.

A common pain point for JavaScript newcomers is the ecosystem's steep learning curve. Choosing between build tools, frameworks, and meta frameworks is an enormous amount of work with long-term consequences. Not to mention that this all has to happen before you've written any code—much of which is just static markup.

Astro's approach is based on the recognition that HTML is the lowest common denominator between frameworks. By using `.astro` as a composable, component-based format on top of HTML, you can start writing and styling your static content immediately.

When you finally do need to introduce dynamic functionality, Astro allows you to _bring your own framework_, so you're free to use any component format you'd like without committing to a holistic architectural approach up-front. "The big question" is deferred until it actually needs to be answered.

During a long-term project, you might even decide to switch frameworks somewhere down the road. Since Astro decouples decisions about data-loading and static rendering from your framework, that decision has a much smaller impact—try out the new framework on a single page or even mix both frameworks on some pages while you migrate.

### What _are_ `.astro` files?

If you're already familiar with **HTML or JSX**, you'll likely feel comfortable with `.astro` files right away.

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

We love JSX! In fact, `.astro` files borrow the highly-expressive templating syntax directly from JSX.

```jsx
<!-- This is an Astro component with expressions! -->
<main>
  <h1>Hello {name}!</h1>
  <ul>
    {items.map((item) => (
      <li>{item}</li>
    ))}
  </ul>
</main>
```

`.astro` files also borrow the concept of [Frontmatter](https://jekyllrb.com/docs/front-matter/) from Markdown. Instead of introducing a new HTML-oriented `import` and `export` syntax, `.astro` just uses the JavaScript syntax you likely already know.

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

### `.astro` versus `.jsx`

`.astro` files can end up looking very similar to `.jsx` files, but there are a few key differences. Here's a comparison between the two formats.

| Feature                      | Astro                                    | JSX                                                |
| ---------------------------- | ---------------------------------------- | -------------------------------------------------- |
| File extension               | `.astro`                                 | `.jsx` or `.tsx`                                   |
| User-Defined Components      | `<Capitalized>`                          | `<Capitalized>`                                    |
| Expression Syntax            | `{}`                                     | `{}`                                               |
| Spread Attributes            | `{...props}`                             | `{...props}`                                       |
| Boolean Attributes           | `autocomplete` === `autocomplete={true}` | `autocomplete` === `autocomplete={true}`           |
| Inline Functions             | `{items.map(item => <li>{item}</li>)}`   | `{items.map(item => <li>{item}</li>)}`             |
| IDE Support                  | WIP - [VS Code][code-ext]                | Phenomenal                                         |
| Requires JS import           | No                                       | Yes, `jsxPragma` (`React` or `h`) must be in scope |
| Fragments                    | Automatic                                | Wrap with `<Fragment>` or `<>`                     |
| Multiple frameworks per-file | Yes                                      | No                                                 |
| Modifying `<head>`           | Just use `<head>`                        | Per-framework (`<Head>`, `<svelte:head>`, etc)     |
| Comment Style                | `<!-- HTML -->`                          | `{/* JavaScript */}`                               |
| Special Characters           | `&nbsp;`                                 | `{'\xa0'}` or `{String.fromCharCode(160)}`         |
| Attributes                   | `dash-case`                              | `camelCase`                                        |

### TODO: Styling

### TODO: Composition (Slots)

[code-ext]: https://marketplace.visualstudio.com/items?itemName=astro-build.astro
