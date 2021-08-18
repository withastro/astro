# docs

## 0.0.5-next.0

### Patch Changes

- 78b5bde1: Adds support for Astro.resolve

  `Astro.resolve()` helps with creating URLs relative to the current Astro file, allowing you to reference files within your `src/` folder.

  Astro _does not_ resolve relative links within HTML, such as images:

  ```html
  <img src="../images/penguin.png" />
  ```

  The above will be sent to the browser as-is and the browser will resolve it relative to the current **page**. If you want it to be resolved relative to the .astro file you are working in, use `Astro.resolve`:

  ```astro
  <img src={Astro.resolve('../images/penguin.png')} />
  ```

## 0.0.4

### Patch Changes

- adc767c5: change Spanish translations for Getting Started page

## 0.0.3

### Patch Changes

- 70f0a09: Added remark-slug to default plugins
