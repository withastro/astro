---
'astro': minor
---

Adds a new `priority` attribute for Astro's image components.

This change introduces a new `priority` option for the `<Image />` and `<Picture />` components, which automatically sets the `loading`, `decoding`, and `fetchpriority` attributes to their optimal values for above-the-fold images which should be loaded immediately, even at the expense of performance.

It is a boolean prop, and you can use the shorthand syntax by simply adding `priority` as a prop to the `<Image />` or `<Picture />` component. When set, it will apply the following attributes:

- `loading="eager"`
- `decoding="sync"`
- `fetchpriority="high"`

The individual attributes can still be set manually if you need to customize your images further.

By default, the Astro [`<Image />` component](https://docs.astro.build/en/guides/images/#display-optimized-images-with-the-image--component) generates `<img>` tags that lazy-load their content by setting `loading="lazy"` and `decoding="async"`. This improves performance by deferring the loading of images that are not immediately visible in the viewport, and gives the best scores in performance audits like Lighthouse. 

The new `priority` attribute will override those defaults and automatically add the best settings for your high-priority assets.

This option was previously available for experimental responsive images, but now it is a standard feature for all images.

## Usage

```astro
<Image 
  src="/path/to/image.jpg" 
  alt="An example image" 
  priority
/>
```

> [!Note]
> You should only use the `priority` option for images that are critical to the initial rendering of the page, and ideally only one image per page. Using it for too many images will lead to performance issues, as it forces the browser to load those images immediately, potentially blocking the rendering of other content.
