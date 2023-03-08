# @astrojs/image 📷

> ⚠️ This integration is still experimental! Only node environments are supported currently, stay tuned for Deno support in the future!

This **[Astro integration][astro-integration]** makes it easy to optimize images in your [Astro project](https://astro.build), with full support for SSG builds and server-side rendering!

- <strong>[Why `@astrojs/image`?](#why-astrojsimage)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Debugging](#debugging)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why `@astrojs/image`?

Images play a big role in overall site performance and usability. Serving properly sized images makes all the difference but is often tricky to automate.

This integration provides `<Image />` and `<Picture>` components as well as a basic image transformer, with full support for static sites and server-side rendering. The built-in image transformer is also replaceable, opening the door for future integrations that work with your favorite hosted image service.

## Installation

Along with our integration, we recommend installing [sharp](https://sharp.pixelplumbing.com/) when appropriate. 

The `@astrojs/image` default image transformer is based on [Squoosh](https://github.com/GoogleChromeLabs/squoosh) and uses WebAssembly libraries to support most deployment environments, including those that do not support sharp, such as StackBlitz.

For faster builds and more fine-grained control of image transformations, install sharp in addition to `@astrojs/image` if
- You are building a static site with Astro.
- You are using an SSR deployment host that supports NodeJS using `@astrojs/netlify/functions`, `@astrojs/vercel/serverless` or `@astrojs/node`.


Note that `@astrojs/image` is not currently supported on
- Cloudflare SSR
- `@astrojs/deno`
- `@astrojs/netlify/edge-functions`
- `@astrojs/vercel/edge`


### Quick Install

The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.

```sh
# Using NPM
npx astro add image
# Using Yarn
yarn astro add image
# Using PNPM
pnpm astro add image
```

If you run into any issues, [feel free to report them to us on GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

 ### Manual Install

First, install the `@astrojs/image` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/image
```
Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js ins={2} "image()"
import { defineConfig } from 'astro/config';
import image from '@astrojs/image';

export default defineConfig({
  // ...
  integrations: [image()],
});
```

### Installing `sharp` (optional)

First, install the `sharp` package using your package manager. If you're using npm or aren't sure, run this in the terminal:

```sh
npm install sharp
```

Then, update the integration in your `astro.config.*` file to use the built-in `sharp` image transformer.

__`astro.config.mjs`__

```js ins={7}
import { defineConfig } from 'astro/config';
import image from '@astrojs/image';

export default defineConfig({
  // ...
  integrations: [image({
    serviceEntryPoint: '@astrojs/image/sharp'
  })],
})
```

### Update `env.d.ts`

For the best development experience, add the integrations type definitions to your project's `env.d.ts` file.

```typescript
// Replace `astro/client` with `@astrojs/image/client`
/// <reference types="@astrojs/image/client" />
```

Or, alternatively if your project is using the types through a `tsconfig.json`

```json
{
  "compilerOptions": {
    // Replace `astro/client` with `@astrojs/image/client`
    "types": ["@astrojs/image/client"]
  }
}
```

## Usage

```astro title="src/pages/index.astro"
---
import { Image, Picture } from '@astrojs/image/components';
---
```

The included image transformers support resizing images and encoding them to different image formats. Third-party image services will be able to add support for custom transformations as well (ex: `blur`, `filter`, `rotate`, etc).

Astro’s `<Image />` and `<Picture />` components require the `alt` attribute, which provides descriptive text for images. A warning will be logged if alt text is missing, and a future release of the integration will throw an error if no alt text is provided.

If the image is merely decorative (i.e. doesn’t contribute to the understanding of the page), set `alt=""` so that the image is properly understood and ignored by screen readers.

### `<Image />`

The built-in `<Image />` component is used to create an optimized `<img />` for both remote images accessed by URL as well as local images imported from your project's `src/` directory.

In addition to the component-specific properties, any valid HTML attribute for the `<img />` included in the `<Image />` component will be included in the built `<img />`.

#### src

<p>

**Type:** `string` | `ImageMetadata` | `Promise<ImageMetadata>`<br>
**Required:** `true`
</p>

Source for the original image file.

For remote images, provide the full URL. (e.g. `src="https://astro.build/assets/blog/astro-1-release-update.avif"`)

For images located in your project's `src/`: use the file path relative to the `src/` directory. (e.g. `src="../assets/source-pic.png"`)


For images located in your `public/` directory: use the URL path relative to the `public/` directory. (e.g. `src="/images/public-image.jpg"`). These work like remote images.

#### alt

<p>

**Type:** `string`<br>
**Required:** `true`
</p>

Defines an alternative text description of the image.

Set to an empty string (`alt=""`) if the image is not a key part of the content (e.g. it's decoration or a tracking pixel).

#### format

<p>

**Type:** `'avif' | 'jpeg' | 'jpg' | 'png' | 'svg' | 'webp'`<br>
**Default:** `undefined`
</p>

The output format to be used in the optimized image. The original image format will be used if `format` is not provided.

This property is required for remote images when using the default image transformer Squoosh, this is because the original format cannot be inferred.

Added in v0.15.0: You can use the `<Image />` component when working with SVG images, but the `svg` option can only be used when the original image is a `.svg` file. Other image formats (like `.png` or `.jpg`) cannot be converted into vector images. The `.svg` image itself will not be transformed, but the final `<img />` will be properly optimized by the integration.

#### quality

<p>

**Type:** `number`<br>
**Default:** `undefined`
</p>

The compression quality used during optimization. The image service will use its own default quality depending on the image format if not provided.

#### width

<p>

**Type:** `number`<br>
**Default:** `undefined`
</p>

The desired width of the output image. Combine with `height` to crop the image to an exact size, or `aspectRatio` to automatically calculate and crop the height.

Dimensions are optional for local images, the original image size will be used if not provided.

For remote images, including images in `public/`, the integration needs to be able to calculate dimensions for the optimized image. This can be done by providing `width` and `height` or by providing one dimension and an `aspectRatio`.

#### height

<p>

**Type:** `number`<br>
**Default:** `undefined`
</p>

The desired height of the output image. Combine with `width` to crop the image to an exact size, or `aspectRatio` to automatically calculate and crop the width.

Dimensions are optional for local images, the original image size will be used if not provided.

For remote images, including images in `public/`, the integration needs to be able to calculate dimensions for the optimized image. This can be done by providing `width` and `height` or by providing one dimension and an `aspectRatio`.

#### aspectRatio

<p>

**Type:** `number` | `string`<br>
**Default:** `undefined`
</p>

The desired aspect ratio of the output image. Combine with either `width` or `height` to automatically calculate and crop the other dimension.

A `string` can be provided in the form of `{width}:{height}`, ex: `16:9` or `3:4`.

A `number` can also be provided, useful when the aspect ratio is calculated at build time. This can be an inline number such as `1.777` or inlined as a JSX expression like `aspectRatio={16/9}`.

For remote images, including images in `public/`, the integration needs to be able to calculate dimensions for the optimized image. This can be done by providing `width` and `height` or by providing one dimension and an `aspectRatio`.

#### background

<p>

**Type:** `ColorDefinition`<br>
**Default:** `undefined`
</p>

> This is not supported by the default Squoosh service. See the [installation section](#installing-sharp-optional) for details on using the `sharp` service instead.

The background color is used to fill the remaining background when using `contain` for the `fit` property.

The background color is also used for replacing the alpha channel with `sharp`'s `flatten` method. In case the output format
doesn't support transparency (i.e. `jpeg`), it's advisable to include a background color, otherwise black will be used
as default replacement for transparent pixels.

The parameter accepts a `string` as value.

The parameter can be a [named HTML color](https://www.w3schools.com/tags/ref_colornames.asp), a hexadecimal
color representation with 3 or 6 hexadecimal characters in the form `#123[abc]`, an RGB definition in the form
`rgb(100,100,100)`, an RGBA definition in the form `rgba(100,100,100, 0.5)`.

#### fit

<p>

**Type:** `'cover' | 'contain' | 'fill' | 'inside' | 'outside'` <br>
**Default:** `'cover'`
</p>

> This is not supported by the default Squoosh service. See the [installation section](#installing-sharp-optional) for details on using the `sharp` service instead. Read more about [how `sharp` resizes images](https://sharp.pixelplumbing.com/api-resize).

How the image should be resized to fit both `height` and `width`.

#### position

<p>

**Type:** `'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest' | 'center' | 'centre' | 'cover' | 'entropy' | 'attention'` <br>
**Default:** `'centre'`
</p>

> This is not supported by the default Squoosh service. See the [installation section](#installing-sharp-optional) for details on using the `sharp` service instead. Read more about [how `sharp` resizes images](https://sharp.pixelplumbing.com/api-resize).

Position of the crop when fit is `cover` or `contain`.

### `<Picture />`

The built-in `<Picture />` component is used to create an optimized `<picture />` for both remote images accessed by URL as well as local images imported from your project's `src/` directory.

In addition to the component-specific properties, any valid HTML attribute for the `<img />` included in the `<Picture />` component will be included in the built `<img />`.

#### src

<p>

**Type:** `string` | `ImageMetadata` | `Promise<ImageMetadata>`<br>
**Required:** `true`
</p>

Source for the original image file.

For remote images, provide the full URL. (e.g. `src="https://astro.build/assets/blog/astro-1-release-update.avif"`)

For images located in your project's `src/`: use the file path relative to the `src/` directory. (e.g. `src="../assets/source-pic.png"`)


For images located in your `public/` directory: use the URL path relative to the `public/` directory. (e.g. `src="/images/public-image.jpg"`). These work like remote images.

#### alt

<p>

**Type:** `string`<br>
**Required:** `true`
</p>

Defines an alternative text description of the image.

Set to an empty string (`alt=""`) if the image is not a key part of the content (e.g. it's decoration or a tracking pixel).

#### sizes

<p>

**Type:** `string`<br>
**Required:** `true`
</p>

The HTMLImageElement property `sizes` allows you to specify the layout width of the image for each of a list of media conditions.

See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/sizes) for more details.

#### widths

<p>

**Type:** `number[]`<br>
**Required:** `true`
</p>

The list of sizes that should be built for responsive images. This is combined with `aspectRatio` to calculate the final dimensions of each built image.

```astro
// Builds three images: 400x400, 800x800, and 1200x1200
<Picture src={...} widths={[400, 800, 1200]} aspectRatio="1:1" alt="descriptive text" />
```

#### aspectRatio

<p>

**Type:** `number` | `string`<br>
**Default:** `undefined`
</p>

The desired aspect ratio of the output image. This is combined with `widths` to calculate the final dimensions of each built image.

A `string` can be provided in the form of `{width}:{height}`, ex: `16:9` or `3:4`.

A `number` can also be provided, useful when the aspect ratio is calculated at build time. This can be an inline number such as `1.777` or inlined as a JSX expression like `aspectRatio={16/9}`.

For remote images, including images in `public/`, `aspectRatio` is required to ensure the correct `height` can be calculated at build time.

#### formats

<p>

**Type:** `Array<'avif' | 'jpeg' | 'png' | 'webp'>`<br>
**Default:** `undefined`
</p>

The output formats to be used in the optimized image. If not provided, `webp` and `avif` will be used in addition to the original image format.

For remote images, including images in `public/`, the original image format is unknown. If not provided, only `webp` and `avif` will be used.

#### background

<p>

**Type:** `ColorDefinition`<br>
**Default:** `undefined`
</p>

> This is not supported by the default Squoosh service. See the [installation section](#installing-sharp-optional) for details on using the `sharp` service instead.

The background color to use for replacing the alpha channel with `sharp`'s `flatten` method. In case the output format
doesn't support transparency (i.e. `jpeg`), it's advisable to include a background color, otherwise black will be used
as default replacement for transparent pixels.

The parameter accepts a `string` as value.

The parameter can be a [named HTML color](https://www.w3schools.com/tags/ref_colornames.asp), a hexadecimal
color representation with 3 or 6 hexadecimal characters in the form `#123[abc]`, or an RGB definition in the form
`rgb(100,100,100)`.

#### fit

<p>

**Type:** `'cover' | 'contain' | 'fill' | 'inside' | 'outside'` <br>
**Default:** `'cover'`
</p>

> This is not supported by the default Squoosh service. See the [installation section](#installing-sharp-optional) for details on using the `sharp` service instead. Read more about [how `sharp` resizes images](https://sharp.pixelplumbing.com/api-resize).

How the image should be resized to fit both `height` and `width`.

#### position

<p>

**Type:** `'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' |
  'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest' |
  'center' | 'centre' | 'cover' | 'entropy' | 'attention'` <br>
**Default:** `'centre'`
</p>

> This is not supported by the default Squoosh service. See the [installation section](#installing-sharp-optional) for details on using the `sharp` service instead. Read more about [how `sharp` resizes images](https://sharp.pixelplumbing.com/api-resize).

Position of the crop when fit is `cover` or `contain`.

### `getImage`

This is the helper function used by the `<Image />` component to build `<img />` attributes for the transformed image. This helper can be used directly for more complex use cases that aren't currently supported by the `<Image />` component.

This helper takes in an object with the same properties as the `<Image />` component and returns an object with attributes that should be included on the final `<img />` element.

This can be helpful if you need to add preload links to a page's `<head>`.

```astro
---
import { getImage } from '@astrojs/image';

const { src } = await getImage({
    src: import('../assets/hero.png'),
    alt: "My hero image"
  });
---

<html>
  <head>
    <link rel="preload" as="image" href={src} alt="alt text">
  </head>
</html>
```

### `getPicture`

This is the helper function used by the `<Picture />` component to build multiple sizes and formats for responsive images. This helper can be used directly for more complex use cases that aren't currently supported by the `<Picture />` component.

This helper takes in an object with the same properties as the `<Picture />` component and returns an object attributes that should be included on the final `<img />` element **and** a list of sources that should be used to render all `<source>`s for the `<picture>` element.

## Configuration

The integration can be configured to run with a different image service, either a hosted image service or a full image transformer that runs locally in your build or SSR deployment.

> During development, local images may not have been published yet and would not be available to hosted image services. Local images will always use the built-in image service when using `astro dev`.


 ### config.serviceEntryPoint

The `serviceEntryPoint` should resolve to the image service installed from NPM. The default entry point is `@astrojs/image/squoosh`, which resolves to the entry point exported from this integration's `package.json`.

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import image from '@astrojs/image';

export default defineConfig({
  integrations: [image({
    // Example: The entrypoint for a third-party image service installed from NPM
    serviceEntryPoint: 'my-image-service/astro.js'
  })],
});
```

### config.logLevel

The `logLevel` controls can be used to control how much detail is logged by the integration during builds. This may be useful to track down a specific image or transformation that is taking a long time to build.

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import image from '@astrojs/image';

export default defineConfig({
  integrations: [image({
    // supported levels: 'debug' | 'info' | 'warn' | 'error' | 'silent'
    // default: 'info'
    logLevel: 'debug'
  })],
});
```

### config.cacheDir

During static builds, the integration will cache transformed images to avoid rebuilding the same image for every build. This can be particularly helpful if you are using a hosting service that allows you to cache build assets for future deployments.

Local images will be cached for 1 year and invalidated when the original image file is changed. Remote images will be cached based on the `fetch()` response's cache headers, similar to how a CDN would manage the cache.

By default, transformed images will be cached to `./node_modules/.astro/image`. This can be configured in the integration's config options.

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import image from '@astrojs/image';

export default defineConfig({
	integrations: [image({
    // may be useful if your hosting provider allows caching between CI builds
    cacheDir: "./.cache/image"
  })]
});
```

Caching can also be disabled by using `cacheDir: false`.

## Examples

### Local images

Image files in your project's `src/` directory can be imported in frontmatter and passed directly to the `<Image />` component as the `src=` attribute value. `alt` is also required. 

All other properties are optional and will default to the original image file's properties if not provided.

```astro
---
import { Image } from '@astrojs/image/components';
import heroImage from '../assets/hero.png';
---

// optimized image, keeping the original width, height, and image format
<Image src={heroImage} alt="descriptive text" />

// height will be recalculated to match the original aspect ratio
<Image src={heroImage} width={300} alt="descriptive text" />

// cropping to a specific width and height
<Image src={heroImage} width={300} height={600} alt="descriptive text" />

// cropping to a specific aspect ratio and converting to an avif format
<Image src={heroImage} width={300} aspectRatio="16:9" format="avif" alt="descriptive text" />

// image imports can also be inlined directly
<Image src={import('../assets/hero.png')} alt="descriptive text" />
```

#### Images in `/public`

The `<Image />` component can also be used with images stored in the `public/` directory and the `src=` attribute is relative to the public folder. It will be treated as a remote image, which requires either both `width` and `height`, or one dimension and an `aspectRatio` attribute.

Your original image will be copied unprocessed to the build folder, like all files located in public/, and Astro’s image integration will also return optimized versions of the image.

For example, use an image located at `public/social.png` in either static or SSR builds like so:

```astro title="src/pages/page.astro"
---
import { Image } from '@astrojs/image/components';
import socialImage from '/social.png';
---
// In static builds: the image will be built and optimized to `/dist`.
// In SSR builds: the image will be optimized by the server when requested by a browser.
<Image src={socialImage} width={1280} aspectRatio="16:9" alt="descriptive text" />
```

### Remote images

Remote images can be transformed with the `<Image />` component. The `<Image />` component needs to know the final dimensions for the `<img />` element to avoid content layout shifts. For remote images, this means you must either provide `width` and `height`, or one of the dimensions plus the required `aspectRatio`.

```astro
---
import { Image } from '@astrojs/image/components';

const imageUrl = 'https://astro.build/assets/press/full-logo-dark.png';
---

// cropping to a specific width and height
<Image src={imageUrl} width={750} height={250} format="avif" alt="descriptive text" />

// height will be recalculated to match the aspect ratio
<Image src={imageUrl} width={750} aspectRatio={16/9} format="avif" alt="descriptive text" />
```

### Responsive pictures

The `<Picture />` component can be used to automatically build a `<picture>` with multiple sizes and formats. Check out [MDN](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#art_direction) for a deep dive into responsive images and art direction.

By default, the picture will include formats for `avif` and `webp`. For local images only, the image's original format will also be included.

For remote images, an `aspectRatio` is required to ensure the correct `height` can be calculated at build time.

```astro
---
import { Picture } from '@astrojs/image/components';
import hero from '../assets/hero.png';

const imageUrl = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
---

// Local image with multiple sizes
<Picture src={hero} widths={[200, 400, 800]} sizes="(max-width: 800px) 100vw, 800px" alt="descriptive text" />

// Remote image (aspect ratio is required)
<Picture src={imageUrl} widths={[200, 400, 800]} aspectRatio="4:3" sizes="(max-width: 800px) 100vw, 800px" alt="descriptive text" />

// Inlined imports are supported
<Picture src={import("../assets/hero.png")} widths={[200, 400, 800]} sizes="(max-width: 800px) 100vw, 800px" alt="descriptive text" />
```

## Troubleshooting
- If your installation doesn't seem to be working, try restarting the dev server.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If refreshing the page doesn't update your preview, or if a new installation doesn't seem to be working, then restart the dev server.

For help, check out the `#support` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.
