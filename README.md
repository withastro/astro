# 👩‍🚀 Astro

A next-generation static-site generator with partial hydration. Use your favorite JS framework and ship bare-minimum JS (or none at all!).

## 🔧 Setup

```
npm install astro
```

TODO: astro boilerplate

### 💧 Partial Hydration

By default, Astro outputs zero client-side JS. If you'd like to include an interactive component in the client output, you may use any of the following techniques.

- `MyComponent:load` will render `MyComponent` on page load
- `MyComponent:idle` will use `requestIdleCallback` to render `MyComponent` as soon as main thread is free
- `MyComponent:visible` will use an `IntersectionObserver` to render `MyComponent` when the element enters the viewport

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
