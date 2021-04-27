## ✨ `.astro` Syntax

"Yikes! Here we go again... They're really going to make me learn another new syntax?"

Believe us, we know—and we wouldn't have introduced the `.astro` syntax without having some great reasons. Give us five minutes, read through this guide, and we think you'll be as excited about Astro as we are.

- Already know **HTML**? [👉 Get Started](#what-are-astro-files)
- Already know **JSX**? [👉 Get Started](#what-are-astro-files)
- Already know **both**? [👉 Get Started](#what-are-astro-files)

---

### What _are_ `.astro` files?

Okay you caught us, every _Get Started_ option ends up here. If you're already familiar with **HTML or JSX**, you'll likely feel comfortable with `.astro` files right away.

Think of `.astro` as **component-oriented HTML**. Components are reusable, self-contained blocks of HTML and CSS that belong together.

```html
<!-- This is a valid Astro component -->
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
<main>
    <h1>Hello {name}!</h1>
    <ul>
        {items.map(item => <li>{item}</li>)}
    </ul>
</main>
```

`.astro` files also borrow the concept of [Frontmatter](https://jekyllrb.com/docs/front-matter/) from Markdown. Instead of introducing a new HTML-oriented `import` and `export` syntax, `.astro` just uses the JavaScript syntax you likely already know.

```jsx
---
// This area is JavaScript!
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

### Why use `.astro` files?

We think `JSX` can have a pretty steep initial learning curve. You should be able to write composable HTML and CSS without setting up a build tool, learning about `jsxPragma`s and `h` functions, or choosing a reactive JavaScript framework. In short, `JSX` requires you to make quite a few decisions up-front that, in an ideal world, would be decided much later (if at all).

To combat this, we've seen the rise of "meta-Frameworks" like [Next.js](https://nextjs.org/), [Nuxt.js](https://nuxtjs.org/), and [SvelteKit](https://kit.svelte.dev/) which bring their own opinions about how to structure an application.

By focusing on HTML _instead of JavaScript_, Astro is able to be framework-agnostic. 

**TODO make this better!**

### What about data?

`.astro` files can define local variables inside of the Frontmatter script. These are automatically exposed to the content below.

```jsx
---
let name = 'world';
---

<main>
    <h1>Hello {name}!</h1>
</main>
```

**TODO props!**

### What about styles?

**TODO styles!**

### What about composition?

**TODO slots!**
