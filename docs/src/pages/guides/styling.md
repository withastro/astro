---
layout: ~/layouts/MainLayout.astro
title: Styling & CSS
---

Astro includes special handling to make writing CSS as easy as possible. Styling inside of Astro components is done by adding a `<style>` tag anywhere.

By default, all Astro component styles are **scoped**, meaning they only apply to the current component. These styles are automatically extracted and optimized for you in the final build, so that you don't need to worry about style loading.

To create global styles, add a `:global()` wrapper around a selector (the same as if you were using [CSS Modules][css-modules]).

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

<div class="scoped">I'm a scoped style and only apply to this component</div>
<h1>I have both scoped and global styles</h1>
```

To include every selector in a `<style>` as global styles, use `<style global>`. It's best to avoid using this escape hatch if possible, but it can be useful if you find yourself repeating `:global()` multiple times in the same `<style>`.

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
</style>

<style global>
  /* Global style */
  h1 {
    font-size: 32px;
  }
</style>

<div class="scoped">I'm a scoped style and only apply to this component</div>
<h1>I have both scoped and global styles</h1>
```

📚 Read our full guide on [Astro component syntax](/core-concepts/astro-components#css-styles) to learn more about using the `<style>` tag.

## Cross-Browser Compatibility

We also automatically add browser prefixes using [Autoprefixer][autoprefixer]. By default, Astro loads the [Browserslist defaults][browserslist-defaults], but you may also specify your own by placing a [Browserslist][browserslist] file in your project root.

---

## Supported Styling Options

Styling in Astro is meant to be as flexible as you'd like it to be! The following options are all supported:

| Framework        | Global CSS | Scoped CSS | CSS Modules |
| :--------------- | :--------: | :--------: | :---------: |
| `.astro`         |     ✅     |     ✅     |    N/A¹     |
| `.jsx` \| `.tsx` |     ✅     |     ❌     |     ✅      |
| `.vue`           |     ✅     |     ✅     |     ✅      |
| `.svelte`        |     ✅     |     ✅     |     ❌      |

¹ _`.astro` files have no runtime, therefore Scoped CSS takes the place of CSS Modules (styles are still scoped to components, but don't need dynamic values)_

All styles in Astro are automatically [**autoprefixed**](#cross-browser-compatibility), minified and bundled, so you can just write CSS and we'll handle the rest ✨.

---

## Frameworks and Libraries

### 📘 React / Preact

`.jsx` files support both global CSS and CSS Modules. To enable the latter, use the `.module.css` extension (or `.module.scss`/`.module.sass` if using Sass).

```js
import './global.css'; // include global CSS
import Styles from './styles.module.css'; // Use CSS Modules (must end in `.module.css`, `.module.scss`, or `.module.sass`!)
```

### 📗 Vue

Vue in Astro supports the same methods as `vue-loader` does:

- [vue-loader - Scoped CSS][vue-scoped]
- [vue-loader - CSS Modules][vue-css-modules]

### 📕 Svelte

Svelte in Astro also works exactly as expected: [Svelte Styling Docs][svelte-style].

### 👓 Sass

Astro also supports [Sass][sass] out-of-the-box. To enable for each framework:

- **Astro**: `<style lang="scss">` or `<style lang="sass">`
- **React** / **Preact**: `import Styles from './styles.module.scss'`;
- **Vue**: `<style lang="scss">` or `<style lang="sass">`
- **Svelte**: `<style lang="scss">` or `<style lang="sass">`

💁‍ Sass is great! If you haven't used Sass in a while, please give it another try. The new and improved [Sass Modules][sass-use] are a great fit with modern web development, and it's blazing-fast since being rewritten in Dart. And the best part? **You know it already!** Use `.scss` to write familiar CSS syntax you're used to, and only sprinkle in Sass features if/when you need them.'

**Note**: If you use .scss files rather than .css files, your stylesheet links should still point to .css files because of Astro’s auto-compilation process. When Astro “needs” the styling files, it’ll be “looking for” the final .css file(s) that it compiles from the .scss file(s). For example, if you have a .scss file at `./src/styles/global.scss`, use this link: `<link rel="stylesheet" href="{Astro.resolve('../styles/global.css')}">` — **not** `<link rel="stylesheet" href="{Astro.resolve('../styles/global.scss')}">`.

### 🍃 Tailwind

> Note that Astro's Tailwind support _only_ works with Tailwind JIT mode.

Astro can be configured to use [Tailwind][tailwind] easily! Install the dependencies:

```
npm install --save-dev tailwindcss
```

And also create a `tailwind.config.js` in your project root:

```js
// tailwind.config.js
module.exports = {
  mode: 'jit',
  purge: ['./public/**/*.html', './src/**/*.{astro,js,jsx,svelte,ts,tsx,vue}'],
  // more options here
};
```

Be sure to add the config path to `astro.config.mjs`, so that Astro enables JIT support in the dev server.

```diff
  // astro.config.mjs
  export default {
+   devOptions: {
+     tailwindConfig: './tailwind.config.js',
+   },
  };
```

Now you're ready to write Tailwind! Our recommended approach is to create a `src/styles/global.css` file (or whatever you‘d like to name your global stylesheet) with [Tailwind utilities][tailwind-utilities] like so:

```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

As an alternative to `src/styles/global.css`, You may also add Tailwind utilities to individual `pages/*.astro` components in `<style>` tags, but be mindful of duplication! If you end up creating multiple Tailwind-managed stylesheets for your site, make sure you're not sending the same CSS to users over and over again in separate CSS files.

#### Migrating from v0.19

As of [version 0.20.0](https://github.com/snowpackjs/astro/releases/tag/astro%400.20.0), Astro will no longer bundle, build and process `public/` files. Previously, we'd recommended putting your tailwind files in the `public/` directory. If you started a project with this pattern, you should move any Tailwind styles into the `src` directory and import them in your template using [Astro.resolve()](/reference/api-reference#astroresolve):

```astro
  <link
    rel="stylesheet"
    href={Astro.resolve("../assets/global.css")}
  >
```

### Importing from npm

If you want to import third-party libraries into an Astro component, you can use a `<style lang="scss">` tag to enable [Sass][sass] and use the [@use][sass-use] rule.

```html
<!-- Loads Boostrap -->
<style lang="scss">
  @use "bootstrap/scss/bootstrap";
</style>
```

### 🎭 PostCSS

[PostCSS](https://postcss.org/) is a popular CSS transpiler with support for [a huge ecosystem of plugins.](https://github.com/postcss/postcss#plugins)

**To use PostCSS with Snowpack:** add the [@snowpack/plugin-postcss](https://www.npmjs.com/package/@snowpack/plugin-postcss) plugin to your project.

```diff
// snowpack.config.js
"plugins": [
+  "@snowpack/plugin-postcss"
]
```

PostCSS requires a [`postcss.config.js`](https://github.com/postcss/postcss#usage) file in your project. By default, the plugin looks in the root directory of your project, but you can customize this yourself with the `config` option. See [the plugin README](https://www.npmjs.com/package/@snowpack/plugin-postcss) for all available options.

```js
// postcss.config.js
// Example (empty) postcss config file
module.exports = {
  plugins: [
    // ...
  ],
};
```

Be aware that this plugin will run on all CSS in your project, including any files that compiled to CSS (like `.scss` Sass files, for example).

## Bundling

All CSS is minified and bundled automatically for you in running `astro build`. Without getting too in the weeds, the general rules are:

- If a style only appears on one route, it's only loaded for that route (`/_astro/[page]-[hash].css`)
- If a style appears on multiple routes, it's deduplicated into a `/_astro/common-[hash].css` bundle
- All styles are hashed according to their contents (the hashes only change if the contents do!)

We'll be expanding our styling optimization story over time, and would love your feedback! If `astro build` generates unexpected styles, or if you can think of improvements, [please open an issue][issues].

_Note: be mindful when some page styles get extracted to the "common" bundle, and some page styles stay on-page. For most people this may not pose an issue, but when part of your styles are bundled they technically may load in a different order and your cascade may be different. While this problem isn't unique to Astro and is present in almost any CSS bundling process, it can be unexpected if you're not anticipating it. Be sure to inspect your final production build, and please [report any issues][issues] you may come across._

## Advanced Styling Architecture

Too many development setups take a hands-off approach to CSS, or at most leave you with only contrived examples that don't get you very far. Telling developers "Use whatever styling solution you want!" is a nice thought that rarely works out in practice. Few styling approaches lend themselves to every setup. Astro is no different—certain styling approaches _will_ work better than others.

An example to illustrate this: Astro removes runtime JS (even the core framework if possible). Thus, depending on Styled Components for all your styles would be bad, as that would require React to load on pages where it's not needed. Or at best, you'd get a "[FOUC][fouc]" as your static HTML is served but the user waits for JavaScript to download and execute. Or consider a second example at the opposite end of the spectrum: _BEM_. You _can_ use a completely-decoupled [BEM][bem] or [SMACSS][smacss] approach in Astro. But that's a lot of manual maintenance you can avoid, and it leaves out a lof of convenience of [Astro components](/core-concepts/astro-components).

We think there's a great middle ground between intuitive-but-slow CSS-in-JS and fast-but-cumbersome global CSS: **Hybrid Scoped + Utility CSS**. This approach works well in Astro, is performant for users, and will be the best styling solution in Astro _for most people_ (provided you're willing to learn a little). So as a quick recap:

**This approach is good for…**

- Developers wanting to try out something new in regard to styling
- Developers that would appreciate some strong opinions in CSS architecture

**This approach is **NOT** good for…**

- Developers that already have strong opinions on styling, and want to control everything themselves

Read on if you're looking for some strong opinions 🙂. We'll describe the approach by enforcing a few key rules that should govern how you set your styles:

### Hybrid Scoped + Utility CSS

#### Scoped styles

You don't need an explanation on component-based design. You already know that reusing components is a good idea. And it's this idea that got people used to concepts like [Styled Components][styled-components] and [Styled JSX][styled-jsx]. But rather than burden your users with slow load times of CSS-in-JS, Astro has something better: **built-in scoped styles.**

```jsx
---
// src/components/Button.astro -->
---
<style lang="scss">
  /* ✅ Locally scoped! */
  .btn {
    padding: 0.5em 1em;
    border-radius: 3px;
    font-weight: 700;
  }
</style>
<button type="button" class="btn">
  <slot></slot>
</button>
```

_Note: all the examples here use `lang="scss"` which is a great convenience for nesting, and sharing [colors and variables][sass-use], but it's entirely optional and you may use normal CSS if you wish._

That `.btn` class is scoped within that component, and won't leak out. It means that you can **focus on styling and not naming.** Local-first approach fits in very well with Astro's ESM-powered design, favoring encapsulation and reusability over global scope. While this is a simple example, it should be noted that **this scales incredibly well.** And if you need to share common values between components, [Sass' module system][sass-use] also gets our recommendation for being easy to use, and a great fit with component-first design.

By contrast, Astro does allow global styles via the `:global()` and `<style global>` escape hatches. However, this should be avoided if possible. To illustrate this: say you used your button in a `<Nav />` component, and you wanted to style it differently there. You might be tempted to have something like:

```jsx
---
// src/components/Nav.astro
import Button from './Button.astro';
---

<style lang="scss">
  .nav :global(.btn) {
    /* ❌ This will fight with <Button>'s styles */
  }
</style>

<nav class="nav">
  <Button>Menu</Button>
</nav>
```

This is undesirable because now `<Nav>` and `<Button>` fight over what the final button looks like. Now, whenever you edit one, you'll always have to edit the other, and they are no longer truly isolated as they once were (now coupled by a bidirectional styling dependency). It's easy to see how this pattern only has to be repeated a couple times before being afraid that touching any styles _anywhere_ may break styling in a completely different part of the app (queue `peter-griffin-css-blinds.gif`).

Instead, let `<Button>` control its own styles, and try a prop:

```jsx
---
// src/components/Button.astro
const { theme } = Astro.props;
---
<style lang="scss">
  .btn {
    /* ✅  <Button> is now back in control of its own styling again! */
    [data-theme='nav'] {
      // nav-friendly styles here…
    }
  }
</style>

<button type="button" data-theme={theme}>
  <slot></slot>
</button>
```

Elsewhere, you can use `<Button theme="nav">` to set the type of button it is. This preserves the contract of _Button is in charge of its styles, and Nav is in charge of its styles_, and now you can edit one without affecting the other. The worst case scenario of using global styles is that the component is broken and unusable (it's missing part of its core styles). But the worst case scenario of using props (e.g. typo) is that a component will only fall back to its default, but still usable, state.

💁 **Why this works well in Astro**: Astro is inspired most by JavaScript modules: you only need to know about what's in one file at a time, and you never have to worry about something in a remote file affecting how this code runs. But we're not alone in this; Vue and Svelte have both capitalized on and popularized the idea that styles and markup are natural fits in the same component file. [You can still have separation of concerns][peace-on-css] even with markup, styling, and logic contained in one file. In fact, that's what makes component design so powerful! So write CSS without fear that you picked a name that's used by some other component across your app.

#### Utility CSS

Recently there has been a debate of all-scoped component styles vs utility-only CSS. But we agree with people like Sarah Dayan who ask [why can't we have both][utility-css]? Truth is that while having scoped component styles are great, there are still hundreds of times when the website's coming together when two components just don't line up _quite_ right, and one needs a nudge. Or different text treatment is needed in one component instance.

While the thought of having perfect, pristine components is nice, it's unrealistic. No design system is absolutely perfect, and every design system has inconsistencies. And it's in reconciling these inconsistencies where components can become a mess without utility CSS. Utility CSS is great for adding minor tweaks necessary to get the website out the door. But they also are incomplete on their own—if you've ever tried to manage responsive styles or accessible focus states with utility CSS it can quickly become a mess! **Utility CSS works best in partnership with component (scoped) CSS**. And in order to be as easy as possible to use, Utility CSS should be global (arguably should be your only global CSS, besides maybe reset.css) so you don't have to deal with imports all willy-nilly.

Some great problems best handled with Utility CSS are:

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

And in your local filesystem, you can even use Sass' [@use][sass-use] to combine files together effortlessly:

```
├── src/
│   └── styles/
│       ├── _base.scss
│       ├── _tokens.scss
│       ├── _typography.scss
│       ├── _utils.scss
│       └── global.scss
```

What's in each file is up to you to determine, but start small, add utilities as you need them, and you'll keep your CSS weight incredibly low. And utilities you wrote to meet your real needs will always be better than anything off the shelf.

So to recap, think of scoped styles as the backbone of your styles that get you 80% of the way there, and utility CSS filling in the remaining 20%. They both work well in tandem, with each compensating for the other's weakness.

💁 **Why this works well in Astro**: Astro was built around the idea of **Scoped CSS and Global Utility CSS living together in harmony** ♥️! Take full advantage of it.

### More suggestions

"But wait!" you may ask, having read the previous section. "That doesn't take care of [my usecase]!" If you‘re looking for more pointers on some common styling problems, you may be interested in the following suggestions. These all are cohesive, and fit with the **Hybrid Scoped + Utility** philosophy:

1. Split your app into Layout Components and Base Components
1. Avoid Flexbox and Grid libraries (write your own!)
1. Avoid `margin` on a component wrapper
1. Avoid global media queries

#### Suggestion #1: Split your app into Layout Components and Base Components

While this guide will never be long enough to answer the question _"How should a page be laid out?"_ (that's a [design problem!][cassie-evans-css]) there is a more specific question hiding within that we _can_ answer: _"Given a layout, how should components/styles be organized?"_ The answer is **don't bake layout into components.** Have layout components that control layout, and base components (buttons, cards, etc.) that don't control layout. _What does that mean?_ Let's walk through an example so it's more clear. Pretend we have a page that looks like this (numbers for different components):

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

The layout consists of a big, giant, full-width post at top, followed by two half-width posts below it. And below that, we want a bunch of smaller posts to fill out the rest of the page. For simplicity, we'll just call these `<BigPost>` (1), `<MediumPost>` (2), and `<SmallPost>` (3). We add them to our page like so:

```jsx
---
// src/pages/index.astro

import Nav from '../components/Nav.astro';
import BigPost from '../components/BigPost.astro';
import Grid from '../components/Grid.astro';
import MediumPosts from '../components/MediumPosts.astro';
import SmallPosts from '../components/SmallPosts.astro';
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

This _looks_ clean, but looks can be deceiving. At first glance, we may think that `<Grid>` is controlling the layout, but that's an illusion. We actually have `<BigPost>` handling its own width, `<MediumPosts>` loading 2 components and controlling its width, and `<SmallPosts>` loading 4+ components and controlling its width. In total, including `<Grid>`, that means **4 components** are all fighting over the same layout. Remove one post from `<MediumPosts>`, the layout breaks. Edit `<BigPost>`, the layout breaks. Edit `<Grid>`, the layout breaks. If you think about it, none of these components are truly reusable—they might as well just be one big file.

This is actually the **Global CSS Problem** in disguise—multiple components fight over how they all lay out together, without layout being one, central responsibility (kinda like global CSS)! Now that we identified the problem, one way to fix this is to hoist the entire layout to the top level, and load all components there, too:

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

Getting over that this is more code, it's actually a much cleaner separation. What was a four-component layout is now managed 100% within the top-level `index.astro` (which we can now consider a **Layout Component**, and if we wanted to reuse this we could extract this into its own file). Your layout is centralized, and now these components truly are reusable because they don't care one bit about whether they're in the same grid or not. You can edit styles in any of these files now without fear of styles breaking in another.

The basic rule is that when orchestrating multiple components, **that's a unique responsibility** that should live in one central place, rather than split between 4 components as we were doing. In fact, top-level pages are great at this, and should always be the starting point of your layout components. See how far you can take it, and only extract layout components when you absolutely have to.

To recap: **if you have to touch multiple files to manage one layout, you probably need to reorganize everything into a Layout Component.**

💁 **Why this works well in Astro**: In Astro, anything can be a `.astro` component, and you never incur performance problems no matter how many components you add. But the main benefit to [Layout isolation][layout-isolated] is how much it cuts down on the amount of CSS you need.

#### Suggestion #2: Avoid Flexbox and Grid libraries (write your own!)

This may feel like a complete overreach to tell you not to use your favorite layout framework you're familiar with. After all, it's gotten you this far! But the days of [float madness](https://zellwk.com/blog/responsive-grid-system/) are gone, replaced by Flexbox and Grid. And the latter don't need libraries to manage them (often they can make it harder).

Many front-end developers experience the following train of thought:

1. I should reuse as much CSS as possible (_good!_)
2. Many pages reuse the same layout, … (_hold up—_)
3. … therefore I can find an existing solution to manage all my duplicate layouts (_wait a minute—_)

While the logic is sound, the reality is that #2 isn't truth for many projects. Probably, many parts of the website weren't designed to fit into these nice, neat, 12 column grids. Even modest web apps can contain _hundreds_ of unique layouts when you factor in all the breakpoints. Ask yourself: _If the website I'm building really contains so many unique layouts, why am I using a heavy grid library that only gives me generic layouts?_

A few well-written lines of CSS Grid here and there will not only be perfect in every occasion; it's likely lighter and easier to manage than that heavy library you've fought with for so long. Another way to look at it: if you have to spend a couple hours learning a proprietary styling framework, wrestling with it, filing issues, etc., why not just spend that time on Flexbox and Grid instead? For many people, learning the basics only takes an hour, and that can get you pretty far! There are great, free, learning resources that are worth your time:

- [Flexbox Froggy](https://flexboxfroggy.com/)
- [CSS Grid Garden](https://cssgridgarden.com/)

So in short: stop trying to deduplicate layouts when there's nothing to deduplicate! You'll find your styles not only easier to manage, but your CSS payloads much lighter, and load times faster.

💁 **Why this works well in Astro**: grid libraries are a quick path to stylesheet bloat, and a major contributor to people attempting to [treeshake their styles][css-treeshaking]. Astro does **not** treeshake unused CSS for you, because [that can cause problems][css-treeshaking]. We're not saying you have to be library free; we're big fans of libraries like [Material UI][material-ui]. But if you can at least shed the thousands upon thousands of layouts you're not using from your styling library, you probably don't need automatic treeshaking.

#### Suggestion #3: Avoid `margin` on a component wrapper

In other words, don't do this:

```jsx
<!-- src/components/MyComponent.astro -->
<style lang="scss">
  .wrapper {
    /* ❌ Don't do this! */
    margin-top: 3rem;
  }
</style>

<div class="wrapper"></div>
```

If you remember the [CSS box model][box-model], `margin` extends beyond the boundaries of the box. This means that when you place `margin` on the outermost element, now that will push other components next to it. Even though the styles are scoped, it's _technically_ affecting elements around it, so it [breaks the concept of style containment][layout-isolated].

When you have components that rearrange, or appear different when they're next to other components, that's a hard battle to win. **Components should look and act the same no matter where they are placed.** That's what makes them components!

💁 **Why this works well in Astro**: margins pushing other components around creeps into your styling architecture in sneaky ways, and can result in the creation of some wonky or brittle layout components. Avoiding it altogether will keep your layout components simpler, and you'll spend less time styling in general.

#### Suggestion #4: Avoid global media queries

The final point is a natural boundary of **Scoped Styles**. That extends to breakpoints, too! You know that one, weird breakpoint where your `<Card />` component wraps awkwardly at a certain size? You should handle that within `<Card />`, and not anywhere else.

Even if you end up with some random value like `@media (min-width: 732px) {`, that'll probably work better than trying to create a global [magic number][magic-number] somewhere that only applies to one context (an arbitrary value may be "magic" to the rest of an app, but it does still have meaning within the context of a component that needs that specific value).

Granted, this has been near-impossible to achieve until Container Queries; fortunately [they are finally landing!][container-queries]

Also, a common complaint of this approach is when someone asks _"What if I have 2 components that need to do the same thing at the same breakpoint?"_ to which my answer is: you'll always have one or two of those; just handle those as edge cases. But if your entire app is made up of dozens of these cases, perhaps your component lines could be redrawn so that they're more [layout-isolated][layout-isolated] in general.

💁 **Why this works well in Astro**: this is probably the least important point, which is why it's saved for last. In fact, you could probably skip this if it doesn't work for you. But it's something that people try to architect for at scale, and having a global system to manage this can often be unnecessary. Give _not_ architecting for global media queries a try, and see how far it takes you!

### 👓 Further Reading

This guide wouldn't be possible without the following blog posts, which expand on these topics and explain them in more detail. Please give them a read!

- [**Layout-isolated Components**][layout-isolated] by Emil Sjölander
- [**In defense of utility-first CSS**][utility-css] by Sarah Dayan

Also please check out the [Stylelint][stylelint] project to whip your styles into shape. You lint your JS, why not your CSS?

[autoprefixer]: https://github.com/postcss/autoprefixer
[bem]: http://getbem.com/introduction/
[box-model]: https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model
[browserslist]: https://github.com/browserslist/browserslist
[browserslist-defaults]: https://github.com/browserslist/browserslist#queries
[cassie-evans-css]: https://twitter.com/cassiecodes/status/1392756828786790400?s=20
[container-queries]: https://ishadeed.com/article/say-hello-to-css-container-queries/
[css-modules]: https://github.com/css-modules/css-modules
[css-treeshaking]: https://css-tricks.com/how-do-you-remove-unused-css-from-a-site/
[fouc]: https://en.wikipedia.org/wiki/Flash_of_unstyled_content
[layout-isolated]: https://web.archive.org/web/20210227162315/https://visly.app/blogposts/layout-isolated-components
[issues]: https://github.com/snowpackjs/astro/issues
[magic-number]: https://css-tricks.com/magic-numbers-in-css/
[material-ui]: https://material.io/components
[peace-on-css]: https://didoo.medium.com/let-there-be-peace-on-css-8b26829f1be0
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
