# 💅 Styling

Styling in Astro is meant to be as flexible as you’d like it to be! The following options are all supported:

| Framework        | Global CSS | Scoped CSS | CSS Modules |
| :--------------- | :--------: | :--------: | :---------: |
| `.astro`         |     ✅     |     ✅     |    N/A¹     |
| `.jsx` \| `.tsx` |     ✅     |     ❌     |     ✅      |
| `.vue`           |     ✅     |     ✅     |     ✅      |
| `.svelte`        |     ✅     |     ✅     |     ❌      |

¹ _`.astro` files have no runtime, therefore Scoped CSS takes the place of CSS Modules (styles are still scoped to components, but don’t need dynamic values)_

All styles in Astro are automatically [**autoprefixed**](#-autoprefixer) and optimized, so you can just write CSS and we’ll handle the rest ✨.

## 🖍 Quick Start

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

Be sure to add the config path to `astro.config.mjs`, so that Astro enables JIT support in the dev server.

```diff
  // astro.config.mjs
  export default {
+   devOptions: {
+     tailwindConfig: './tailwindConfig.js',
+   },
  };
```

Now you’re ready to write Tailwind! Our recommended approach is to create a `public/global.css` file with [Tailwind utilities][tailwind-utilities] like so:

```css
/* public/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

💁 As an alternative to `public/global.css`, You may also add Tailwind utilities to individual `pages/*.astro` components in `<style>` tags, but be mindful of duplication! If you end up creating multiple Tailwind-managed stylesheets for your site, make sure you’re not sending the same CSS to users over and over again in separate CSS files.

#### 📦 Bundling

All CSS is minified and bundled automatically for you in running `astro build`. The general specifics are:

- If a style only appears on one route, it’s only loaded for that route
- If a style appears on multiple routes, it’s deduplicated into a `common.css` bundle

We’ll be expanding our styling optimization story over time, and would love your feedback! If `astro build` generates unexpected styles, or if you can think of improvements, [please open an issue](https://github.com/snowpackjs/astro/issues).

**⚠️ Ordering may not be guaranteed**. Though we try and preserve your ordering as much as possible, there are no guarantees between pages. For example, if one page loads `a.css`, `b.css`, and another loads `b.css`, there’s a chance that `b.css` may load first (as it’s a shared asset). The best course of action is to reduce your styles’ dependence on ordering as much as possible. But if specific order is required, [Sass’ @use is highly recommended][sass-use] or you must guarantee that all styles load in the same order on every page.

## 📚 Advanced Styling Architecture in Astro

Many development setups give you the basics on where to put CSS for small things, but very quickly you realize the simple examples fail you as your code scales, and soon you have a mess on your hands. An natural question for any setup is “how do I architect my styles?” yet not every framework outlines its rules. While we’d like to say _“use whatever you want,”_ and leave it up to you, the reality is that not all styling approaches will work as well in Astro as others, because Astro is a blend of new ideas (**Partial Hydration** and **JS frameworks with zero runtime JS**) and old (**HTML-first**). It couldn’t hurt to try and provide a guide on how to think about styling architecture in Astro, and this section is precisely that.

An example of all styling approaches not being equal in Astro: given that Astro tries and removes runtime JS, and even the framework if possible, it’d be very inefficient to load all of React just to load Styled Components so your page can have styles (in fact we’d discourage using any CSS-in-JS runtime in Astro in general). On the opposite end of the styling spectrum, you _can_ use a completely-decoupled [BEM][bem] or [SMACSS][smacss] approach in Astro. But that’s a lot of manual maintenance you can avoid, and it leaves out a lof of convenience of [Astro components][astro-syntax].

We think there’s a great middle ground between easy-to-use-but-slow CSS-in-JS and fast-but-ornery decoupled CSS. This approach doesn’t have a fancy name (yet), but works well in Astro, is performant for users, and will be the best styling solution in Astro _for most people_ (provided you’re willing to learn a little). This guide is structured in the form of some basic do’s and don’ts up front, followed by the reasoning behind each. Again, the reason they’re outlined here and not mandated by the framework is that we want you to ultimately make the decisions! But if you’re looking for opinions, you’ve found them 🙂.

### Rules

1. Avoid global styles (other than utility CSS)
2. Use utility CSS
3. Centralize your layouts
4. Don’t use flexbox and grid libraries; write them custom when you need them
5. Never use `margin` on a component wrapper
6. Let each component set its own media queries (i.e. don’t have global media queries).

_Note: if these rules seem restrictive, they’re meant to be! As stated, these are strong opinions that may improve your apps’ styles after you learn the reasons why._

#### 1. Avoid global styles

You don’t need an explanation on component-based design. You already know that reusing components is a good idea. And it’s this idea that got people used to concepts like [Styled Components][styled-components] and [Styled JSX][styled-jsx]. But rather than burden your users with slow load times, Astro has something better: **built-in scoped styles.**

```html
<!-- src/components/Button.astro -->
<style lang="scss">
  /* ✅ Locally scoped! */
  .btn {
    padding: 0.5em 1em;
    border-radius: 3px;
    font-weight: 700;
  }
</style>
<button type="button" class="btn"><slot></slot></button>
```

_Note: all the examples here use `lang="scss"` which is a great convenience for nesting, and sharing [colors and variables][sass-use], but it’s entirely optional and you may use normal CSS if you wish._

That `.btn` class is scoped within that component, and won’t leak out. It means that you can **focus on styling and not naming.** Local-first approach fits in very well with Astro’s ESM-powered design, favoring encapsulation and reusability over global scope. While this is a simple example, it should be noted that **this scales incredibly well.** And if you need to share common values between components, [Sass’ module system][sass-use] also gets our recommendation for being easy to use, and a great fit with component-first design.

---

By contrast, Astro does allow global styles via the `:global()` escape hatch, however, this should be avoided if possible. To illustrate this: say you used your button in a `<Nav />` component, and you wanted to style it differently there. You might be tempted to have something like:

```jsx
<!-- src/components/Nav.astro -->
---
import Button from './Button.astro';
---

<style lang="scss">
  .nav :global(.btn) {
    /* ❌ Don’t do this! */
  }
</style>

<nav class="nav"><button>Menu</button></nav>
```

This is undesirable because now `<Nav>` and `<Button>` fight over what the final button looks like. Now, whenever you edit one, you’ll always have to edit the other, and they are no longer truly isolated as they once were (now coupled by a bidirectional styling dependency). It’s easy to see how this pattern only has to repeated a couple times before editing one file breaks the styles of another.

Instead, let `<Button>` control its own styles, and try a prop:

```jsx
<!-- src/components/Button.astro -->
---
export let theme;
---
<style lang="scss">
  /* ✅  <Button> is now back in control of its own styling again! */
  .btn {
    [data-theme='nav'] {
      // nav-friendly styles here…
    }
  }
</style>

<button type="button" data-theme="{theme}"><slot></slot></button>
```

Elsewhere, you can use `<Button theme="nav">` to set the type of button it is. This preserves the contract of _Button is in charge of its styles, and Nav is in charge of its styles_, and now you can edit one without affecting the other. The worst case scenario of using global styles is that the component is broken and unusable (it’s missing part of its core styles). But the worst case scenario of using props (e.g. typo) is that a component will only fall back to its default, but still usable, state.

#### 2. Use utility CSS

Recently there has been a debate of all-scoped component styles vs utility-only CSS. But we agree with people like Sarah Dayan who ask [why can’t we have both][utility-css]? Truth is that while having scoped component styles are great, there are still hundreds of times when the website’s coming together when two components just don’t line up _quite_ right, and one needs a nudge. Or different text treatment is needed in one component instance.

While the thought of having perfect, pristine components is nice, it’s unrealistic. No design system is absoutely perfect, and every design system has inconsistencies. And it’s in reconciling these inconsistencies where components can become a mess without utility CSS. Utility CSS is great for adding minor tweaks necessary to get the website out the door. And utilities work best when they’re globally-available so you don’t have to deal with imports all willy-nilly.

Some great examples of Utility (and Global) CSS are:

- [margin](https://github.com/drwpow/sass-utils#-margin--padding)
- [padding](https://github.com/drwpow/sass-utils#-margin--padding)
- [text/background color](https://github.com/drwpow/sass-utils#-color)
- [font size and family](https://github.com/drwpow/sass-utils#%F0%9F%85%B0%EF%B8%8F-font--text)
- [default element styling](https://github.com/kognise/water.css)

In Astro, we recommend the following setup for this:

```html
<head>
  <link rel="stylesheet" href="/styles/global.css" />
</head>
```

And in your local filesystem, you can even use Sass’ [@use][sass-use] to combine files together effortlessly:

```
├── public/
│   └── styles/
│       ├── _base.scss
│       ├── _tokens.scss
│       ├── _typography.scss
│       ├── _utils.scss
│       └── global.scss
└── src/
    └── …
```

What’s in each file is up to you to determine, but start small, add utilities as you need them, and you’ll keep your CSS weight incredibly low. And utilities you wrote to meet your real needs will always be better than anything off the shelf.

Is utility CSS capable of building entire apps? **No!** It becomes very unwieldy trying to create components entirely out of them. Or if you’re managing breakpoints (media queries), or when you are handling interactions like `:hover`, `:focus`, or even animation. Think of component styles as the backbone of a healthy style architecture that get you 80% of the way there, and utility CSS filling in the remaining 20%. They both work well in tandem, with each compensating for the other’s weakness.

#### 3. Centralize your layouts

While this guide will never be long enough to answer the question _”How should a page be laid out?”_ there’s a subtle, but important question within that field that is critical to get right: _“Given a layout, how should components/styles be organized?”_ This question has more of a right or wrong answer, but it will take a little bit of explaining in the form of an example to communicate the general concept. Imagine that we are starting with a layout like so:

```
|---------------|
|       1       |
|-------+-------|
|   2   |   2   |
|---+---|---+---|
| 3 | 3 | 3 | 3 |
|---+---+---+---|
| 3 | 3 | 3 | 3 |
|---+---+---+---|
```

The layout consists of a big, giant, full-width post at top, followed by two half-width posts below it. And below that, we want a bunch of smaller posts to fill out the rest of the page. For simplicity, we’ll just call these `<BigPost>` (1), `<MediumPost>` (2), and `<SmallPost>` (3). We add them to our page like so:

```jsx
---
// src/pages/index.astro

import Nav from '../components/Nav.astro';
import BigPost from '../components/BigPost.astro';
import Grid from '../components/Grid.astro';
import MediumPosts from '../components/MediumPost.astro';
import SmallPosts from '../components/SmallPost.astro';
import Footer from '../components/Footer.astro';
---
<html>
  <body>
    <Nav />

    <Grid>
      <BigPost />
      <MediumPosts />
      <SmallPosts />
    </Grid>

    <Footer />
  </body>
</html>
```

This is very clean, and all our components are isolated. This is correct, right? Well, not so much—this is about the worst way to compose the layout. Because there’s no CSS in our top level, we can assume that the layout CSS doesn’t exist in one place; it’s evenly split between four components: `<Grid>`, `<BigPost>`, `<MediumPosts>`, and `<SmallPosts>`. This is actually the **Global CSS Problem** in disguise—multiple components fight over how they all lay out together, without layout being one, central responsibility. And because the layout is an implicit contract between 4 components, your layout is brittle, and it will always break unless you edit all 4 components together. In other words, you’ve created one big component split into 4 files.

Further, this limits the reusable power of these components. Because now they can’t be used outside of a `<Grid>`, they aren’t that reusable and you’ll probably create clones of each. Or if they can live outside `<Grid>`, you now have to manage multiple variations of all components that could be avoided. **Components should display the same regardless of placement**, and layouts that require specific combinations and orderings of components is a poor system.

By contrast, let’s see how we’d fix this:

```jsx
---
// src/pages/index.astro

import Nav from '../components/Nav.astro';
import BigPost from '../components/BigPost.astro';
import MediumPost from '../components/MediumPost.astro';
import SmallPost from '../components/SmallPost.astro';
import Footer from '../components/Footer.astro';
---

<html>
  <head>
    <style lang="scss">
      .wrapper {
        max-width: 60rem;
        margin-right: auto;
        margin-left: auto;
        padding-right: 2rem;
        padding-left: 2rem;
      }

      .grid {
        display: grid;
        grid-gap: 1.5rem;
        grid-template columns: 1fr 1fr 1fr 1fr;
      }

      .big-post {
        grid-column: span 4;
      }

      .medium-post {
        grid-column: span 2;
      }

      .small-post {
        grid-column: span 1;
      }
    </style>
  </head>
  <body>
    <Nav />

    <div class="wrapper">
      <div class="grid">
        <div class="big-post"><BigPost postId={12345} /></div>

        <div class="medium-post"><MediumPost postId={12345} /></div>
        <div class="medium-post"><MediumPost postId={12345} /></div>

        <div class="small-post"><SmallPost postId={12345} /></div>
        <div class="small-post"><SmallPost postId={12345} /></div>
        <div class="small-post"><SmallPost postId={12345} /></div>
        <div class="small-post"><SmallPost postId={12345} /></div>
        <div class="small-post"><SmallPost postId={12345} /></div>
        <div class="small-post"><SmallPost postId={12345} /></div>
        <div class="small-post"><SmallPost postId={12345} /></div>
        <div class="small-post"><SmallPost postId={12345} /></div>
      </div>
    </div>

    <Footer />
  </body>
</html>
```

This is much better—`index.astro` now manages 100% of the layout, and the components manage 0%. Your layout is centralized, and now these components truly are reusable because they don’t care one bit about whether they’re in the same grid or not. You can edit styles in any of these files now without fear of styles breaking in another.

The basic rule is that when orchestrating multiple components, **that’s a unique responsibility** that should live in one and only one place. That can be in the form of page styles (like here), and that’s a great starting point. But you can also extract layouts to their own layout components, just as long as they remain in one place.

#### 4. Don’t use a Flexbox or Grid library; write it custom

This may feel like a complete overreach to tell you not to use your favorite layout framework you’re familiar with. After all, it’s gotten you this far! But the days of [float madness](https://zellwk.com/blog/responsive-grid-system/) are gone, replaced by Flexbox and Grid. And the latter don’t need libraries to manage them (often they can make it harder).

Many front-end developers experience the following train of thought:

1. I should reuse as much CSS as possible (_good!_)
2. Many pages reuse the same layout, … (_hold up—_)
3. … therefore I can find an existing solution to manage all my duplicate layouts (_wait a minute—_)

While the logic is sound and the first point is correct, many developers assume #2 is correct when that is not the reality for many. Many projects contain myriad layouts that are different from one part of a website to another. And even if they are the same on one breakpoint doesn’t mean they are the same on all breakpoints!

Ask yourself: _If there really were more unique layouts in my website than I assumed, why am I trying to deduplicate them?_ You’ll probably start to realize that fewer of your layouts are reusable than you thought, and that a few, thoughtful, custom layout components can handle all your needs. This is especially true when you **Centralize your Layouts** (Rule #3).

Another way to look at it: perhaps spending a couple hours learning Flexbox and Grid will pay off much better than spending that same amount of time learning a proprietary styling framework, wrestling with it, and/or switchign it out when it doesn’t perform as expected. There are great, free, learning resources that are worth your time:

- [Flexbox Froggy](https://flexboxfroggy.com/)
- [CSS Grid Garden](https://cssgridgarden.com/)

So in short: stop trying to deduplicate layouts when there’s nothing to deduplicate! You’ll find your styles not only easier to manage, but your CSS payloads much lighter, and load times faster.

#### 5. Never use `margin` on a component wrapper

In other words, don’t do this:

```jsx
<!-- src/components/MyComponent.astro -->
<style lang="scss">
  .wrapper {
    /* ❌ Don’t do this! */
    margin-top: 3rem;
  }
</style>

<div class="wrapper"></div>
```

If you remember the [CSS box model][box-model], `margin` extends beyond the boundarieso of the box. This means that when you place `margin` on the outermost element, now that will push other components next to it. Even though the styles are scoped, it’s _technically_ affecting elements around it, so it [breaks the concept of style containment][layout-isolated].

When you have components that rearrage, or appear different when they’re next to other components, that’s a hard battle to win. **Components should look and act the same no matter where they are placed.** That’s what makes them components!

💁 **Why this helps Astro styling**: margins pushing other components around creeps into your styling architecture in sneaky ways, and can result in the creation of some wonky or brittle layout components. Avoiding it altogether will keep your layout components simpler, and you’ll spend less time styling in general.

#### 6. Don’t use global media queries

The final point is a natural extension of the **Prefer Component-scoped styles** rule. That extends to breakpoints, too! You know that one, weird breakpoint where your `<Card />` component wraps awkardly at a certain size? You should handle that within `<Card />`, and not anywhere else.

Even if you end up with some random value like `@media (min-width: 732px) {`, that’ll probably work better than trying to create a global [magic number][magic-number] somewhere that only applies to one context (an arbitrary value may be “magic” to the rest of an app, but it does still have meaning within the context of a component that needs that specific value).

Granted, this has been near-impossible to achieve until Container Queries; fortunately [they are finally landing!][container-queries]

Also, a common complaint of this approach is when someone asks _”What if I have 2 components that need to do the same thing at the same breakpoint?”_ to which my answer is: you’ll always have one or two of those; just handle those as edge cases. But if your entire app is made up of dozens of these cases, perhaps your component lines could be redrawn so that they’re more [layout-isolated][layout-isolated] in general.

💁 **Why this helps Astro styling**: this is probably the least-important point, which is why it’s saved for last. But it’s something that people try to architect for at scale, and having a global system to manage this can often be unnecessary. Give _not_ architecting for global media queries a try, and see how far it takes you!

### 👓 Further Reading

This guide wouldn’t be possible without the following blog posts, which expand on these topics and explain them in more detail. Please give them a read!

- [**Layout-isolated Components**][layout-isolated] by Emil Sjölander
- [**In defense of utility-first CSS**][utility-css] by Sarah Dayan

Also please check out the [Stylelint][stylelint] project to whip your styles into shape. You lint your JS, why not your CSS?

[astro-syntax]: ./syntax.md
[autoprefixer]: https://github.com/postcss/autoprefixer
[bem]: http://getbem.com/introduction/
[box-model]: https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model
[browserslist]: https://github.com/browserslist/browserslist
[container-queries]: https://ishadeed.com/article/say-hello-to-css-container-queries/
[css-modules]: https://github.com/css-modules/css-modules
[layout-isolated]: https://visly.app/blogposts/layout-isolated-components
[magic-number]: https://css-tricks.com/magic-numbers-in-css/
[sass]: https://sass-lang.com/
[sass-use]: https://sass-lang.com/documentation/at-rules/use
[smacss]: http://smacss.com/
[styled-components]: https://styled-components.com/
[styled-jsx]: https://github.com/vercel/styled-jsx
[stylelint]: https://stylelint.io/
[svelte-style]: https://svelte.dev/docs#style
[tailwind]: https://tailwindcss.com
[tailwind-utilities]: https://tailwindcss.com/docs/adding-new-utilities#using-css
[utility-css]: https://frontstuff.io/in-defense-of-utility-first-css
[vue-css-modules]: https://vue-loader.vuejs.org/guide/css-modules.html
[vue-scoped]: https://vue-loader.vuejs.org/guide/scoped-css.html
