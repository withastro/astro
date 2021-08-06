---
layout: ~/layouts/MainLayout.astro
title: Aliases
---

Aliasing is an integral part when it comes to clean and readable code, that's why Astro comes with support for custom aliases out of the box.

## What are aliases?

Aliases are _keywords_ you can use instead of paths. 
So instead of `../../components/SomeComponent/` you can use `components/SomeComponent`. Cool, right!

## Adding a custom alias

If you navigate to the root directory of your project and open the `snowpack.config.mjs` file you will notice that there are some pre-defined aliases already.

```ts
// snowpack.config.mjs

alias: {
  components: './src/components',
  '~': './src',
}
```

To **add your own** alias just define it on a new line, like so:

```ts
// snowpack.config.mjs

alias: {
  components: './src/components',
  '~': './src',
  '@public': './public' // This can be virtually anything
}
```

| Key      | Value |
| ----- | ----- |
| The keyword you'll be using | The path it will get replaced with |

## Usage


Now just use the **defined** aliases in a file of your choice:

```js
import '@public/assets/logo.svg';
import MyComponent from 'components/MyComponent/MyComponent.tsx'
```
