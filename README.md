# 👩‍🚀 Astro

A next-generation static-site generator with partial hydration. Use your favorite JS framework and ship bare-minimum JS (or none at all!).

## 🔧 Setup

```
npm install astro
```

TODO: astro boilerplate

## 🧞 Development

Add a `dev` npm script to your `/package.json` file:

```json
{
  "scripts": {
    "dev": "astro dev ."
  }
}
```

Then run:

```
npm run dev
```

### 💧 Partial Hydration

By default, Astro outputs zero client-side JS. If you'd like to include an interactive component in the client output, you may use any of the following techniques.

- `MyComponent:load` will render `MyComponent` on page load
- `MyComponent:idle` will use `requestIdleCallback` to render `MyComponent` as soon as main thread is free
- `MyComponent:visible` will use an `IntersectionObserver` to render `MyComponent` when the element enters the viewport

### 💅 Styling

If you‘ve used [Svelte][svelte]’s styles before, Astro works almost the same way. In any `.astro` file, start writing styles in a `<style>` tag like so:

```astro
<style>
.scoped {
  font-weight: bold;
}
</style>

<div class="scoped">I’m a scoped style</div>
```

#### Sass

Astro also supports [Sass][sass] out-of-the-box; no configuration needed:

```astro
<style lang="scss">
@use "../tokens" as *;

.title {
  color: $color.gray;
}
</style>

<h1 class="title">Title</h1>
```

Supports:

- `lang="scss"`: load as the `.scss` extension
- `lang="sass"`: load as the `.sass` extension (no brackets; indent-style)

#### Autoprefixer

We also automatically add browser prefixes using [Autoprefixer][autoprefixer]. By default, Astro loads the default values, but you may also specify your own by placing a [Browserslist][browserslist] file in your project root.

#### Tailwind

Astro can be configured to use [Tailwind][tailwind] easily! Install the dependencies:

```
npm install @tailwindcss/jit tailwindcss
```

And also create a `tailwind.config.js` in your project root:

```
module.exports = {
  // your options here
}
```

_Note: a Tailwind config file is currently required to enable Tailwind in Astro, even if you use the default options._

Then write Tailwind in your project just like you‘re used to:

```astro
<style>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
```

## 🚀 Build & Deployment

Add a `build` npm script to your `/package.json` file:

```json
{
  "scripts": {
    "dev": "astro dev .",
    "build": "astro build ."
  }
}
```

Then run:

```
npm run build
```

Now upload the contents of `/_site_` to your favorite static site host.

[autoprefixer]: https://github.com/postcss/autoprefixer
[browserslist]: https://github.com/browserslist/browserslist
[sass]: https://sass-lang.com/
[svelte]: https://svelte.dev
[tailwind]: https://tailwindcss.com
