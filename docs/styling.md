# 💅 Styling

Styling in Astro is meant to be as flexible as you’d like it to be! The following options are all supported:

| Framework        | Global CSS | Scoped CSS | CSS Modules |
| :--------------- | :--------: | :--------: | :---------: |
| Astro (`.astro`) |     ✅     |     ✅     |    N/A¹     |
| React / Preact   |     ✅     |     ❌     |     ✅      |
| Vue              |     ✅     |     ✅     |     ✅      |
| Svelte           |     ✅     |     ✅     |     ❌      |

¹ _`.astro` files have no runtime, therefore Scoped CSS takes the place of CSS Modules (styles are still scoped to components, but don’t need dynamic values)_

#### 🖍 Styling by Framework

##### Astro

Styling in an Astro component is done by adding a `<style>` tag anywhere. By default, all styles are **scoped**, meaning they only apply to the current component. To create global styles, add a `:global()` wrapper around a selector (the same as if you were using [CSS Modules][css-modules]).

```html
<!-- src/components/MyComponent.astro -->

<style>
  /* Scoped class selector within the component */
  .scoped {
    font-weight: bold;
  }

  /* Scoped element selector within the component */
  h1 {
    color: red;
  }

  /* Global style */
  :global(h1) {
    font-size: 32px;
  }
</style>

<div class="scoped">I’m a scoped style and only apply to this component</div>
<h1>I have both scoped and global styles</h1>
```

**Tips**

- `<style>` tags within `.astro` files will be extracted and optimized for you on build. So you can write CSS without worrying too much about delivery.
- For best result, only have one `<style>` tag per-Astro component. This isn’t necessarily a limitation, but it may result in better optimization at buildtime.
- If you want to import third-party libraries into an Astro component, you can use [Sass][sass]! In particular, [@use][sass-use] may come in handy (e.g. `@use "bootstrap/scss/bootstrap"`);

#### React / Preact

`.jsx` files support both global CSS and CSS Modules. To enable the latter, use the `.module.css` extension (or `.module.scss`/`.module.sass` if using Sass).

```js
import './global.css'; // include global CSS
import Styles from './styles.module.css'; // Use CSS Modules (must end in `.module.css`, `.module.scss`, or `.module.sass`!)
```

##### Vue

Vue in Astro supports the same methods as `vue-loader` does:

- [Scoped CSS][vue-scoped]
- [CSS Modules][vue-css-modules]

##### Svelte

Svelte in Astro also works exactly as expected: [Svelte Styling Docs][svelte-style].

#### 👓 Sass

Astro also supports [Sass][sass] out-of-the-box. To enable for each framework:

- **Astro**: `<style lang="scss">` or `<style lang="sass">`
- **React** / **Preact**: `import Styles from './styles.module.scss'`;
- **Vue**: `<style lang="scss">` or `<style lang="sass">`
- **Svelte**: `<style lang="scss">` or `<style lang="sass">`

#### 🦊 Autoprefixer

We also automatically add browser prefixes using [Autoprefixer][autoprefixer]. By default, Astro loads the default values, but you may also specify your own by placing a [Browserslist][browserslist] file in your project root.

#### 🍃 Tailwind

Astro can be configured to use [Tailwind][tailwind] easily! Install the dependencies:

```
npm install --save-dev tailwindcss
```

And also create a `tailwind.config.js` in your project root:

```js
// tailwind.config.js

module.exports = {
  mode: 'jit',
  purge: ['./public/**/*.html', './src/**/*.{astro,js,jsx,ts,tsx,vue}'],
  // more options here
};
```

Then add [Tailwind utilities][tailwind-utilities] to any Astro component that needs it:

```html
<style>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
```

You should see Tailwind styles compile successfully in Astro.

💁 **Tip**: to reduce duplication, try loading `@tailwind base` from a parent page (`./pages/*.astro`) instead of the component itself.

[autoprefixer]: https://github.com/postcss/autoprefixer
[browserslist]: https://github.com/browserslist/browserslist
[css-modules]: https://github.com/css-modules/css-modules
[vue-css-modules]: https://vue-loader.vuejs.org/guide/css-modules.html
[vue-scoped]: https://vue-loader.vuejs.org/guide/scoped-css.html
[sass]: https://sass-lang.com/
[sass-use]: https://sass-lang.com/documentation/at-rules/use
[svelte-style]: https://svelte.dev/docs#style
[tailwind]: https://tailwindcss.com
[tailwind-utilities]: https://tailwindcss.com/docs/adding-new-utilities#using-css
