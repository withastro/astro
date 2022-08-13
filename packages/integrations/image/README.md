# @astrojs/image 📷

> ⚠️ This integration is still experimental! Only node environments are supported currently, stay tuned for Deno support in the future!

This **[Astro integration][astro-integration]** makes it easy to optimize images in your [Astro project](https://astro.build), with full support for SSG builds and server-side rendering!

- <strong>[Why `@astrojs/image`?](#why-astrojsimage)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why `@astrojs/image`?

Images play a big role in overall site performance and usability. Serving properly sized images makes all the difference but is often tricky to automate.

This integration provides `<Image />` and `<Picture>` components as well as a basic image transformer powered by [sharp](https://sharp.pixelplumbing.com/), with full support for static sites and server-side rendering. The built-in `sharp` transformer is also replacable, opening the door for future integrations that work with your favorite hosted image service.

## Installation


 ### Quick Install
  
The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.
   
```sh
# Using NPM
npx astro add image
# Using Yarn
yarn astro add image
# Using PNPM
pnpx astro add image
```
  
Then, restart the dev server by typing `CTRL-C` and then `npm run astro dev` in the terminal window that was running Astro.
  
Because this command is new, it might not properly set things up. If that happens, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

 ### Manual Install
  
First, install the `@astrojs/image` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/image
```
Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js
import image from '@astrojs/image';

export default {
  // ...
  integrations: [image()],
}
``` 
Then, restart the dev server.

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

The included `sharp` transformer supports resizing images and encoding them to different image formats. Third-party image services will be able to add support for custom transformations as well (ex: `blur`, `filter`, `rotate`, etc).

### `<Image />`

The built-in `<Image />` component is used to create an optimized `<img />` for both remote images hosted on other domains as well as local images imported from your project's `src` directory.

In addition to the component-specific properties, any valid HTML attribute for the `<img />` included in the `<Image />` component will be included in the built `<img />`.

#### src

<p>

**Type:** `string` | `ImageMetadata` | `Promise<ImageMetadata>`<br>
**Required:** `true`
</p>

Source for the original image file.

For images in your project's repository, use the `src` relative to the `public` directory. For remote images, provide the full URL.

#### format

<p>

**Type:** `'avif' | 'jpeg' | 'png' | 'webp'`<br>
**Default:** `undefined`
</p>

The output format to be used in the optimized image. The original image format will be used if `format` is not provided.

#### quality

<p>

**Type:** `number`<br>
**Default:** `undefined`
</p>

The compression quality used during optimization. The image service will use a default quality if not provided.

#### width

<p>

**Type:** `number`<br>
**Default:** `undefined`
</p>

The desired width of the output image. Combine with `height` to crop the image to an exact size, or `aspectRatio` to automatically calculate and crop the height.

Dimensions are optional for local images, the original image size will be used if not provided.

For remote images, the integration needs to be able to calculate dimensions for the optimized image. This can be done by providing `width` and `height` or by providing one dimension and an `aspectRatio`.

#### height

<p>

**Type:** `number`<br>
**Default:** `undefined`
</p>

The desired height of the output image. Combine with `width` to crop the image to an exact size, or `aspectRatio` to automatically calculate and crop the width.

Dimensions are optional for local images, the original image size will be used if not provided.

For remote images, the integration needs to be able to calculate dimensions for the optimized image. This can be done by providing `width` and `height` or by providing one dimension and an `aspectRatio`.

#### aspectRatio

<p>

**Type:** `number` | `string`<br>
**Default:** `undefined`
</p>

The desired aspect ratio of the output image. Combine with either `width` or `height` to automatically calculate and crop the other dimension.

A `string` can be provided in the form of `{width}:{height}`, ex: `16:9` or `3:4`.

A `number` can also be provided, useful when the aspect ratio is calculated at build time. This can be an inline number such as `1.777` or inlined as a JSX expression like `aspectRatio={16/9}`.

### `<Picture /`>

#### src

<p>

**Type:** `string` | `ImageMetadata` | `Promise<ImageMetadata>`<br>
**Required:** `true`
</p>

Source for the original image file.

For images in your project's repository, use the `src` relative to the `public` directory. For remote images, provide the full URL.

#### alt

<p>

**Type:** `string`<br>
**Default:** `undefined`
</p>

If provided, the `alt` string will be included on the built `<img />` element.

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
<Picture src={...} widths={[400, 800, 1200]} aspectRatio="1:1" />
```

#### aspectRatio

<p>

**Type:** `number` | `string`<br>
**Default:** `undefined`
</p>

The desired aspect ratio of the output image. This is combined with `widths` to calculate the final dimensions of each built image.

A `string` can be provided in the form of `{width}:{height}`, ex: `16:9` or `3:4`.

A `number` can also be provided, useful when the aspect ratio is calculated at build time. This can be an inline number such as `1.777` or inlined as a JSX expression like `aspectRatio={16/9}`.

#### formats

<p>

**Type:** `Array<'avif' | 'jpeg' | 'png' | 'webp'>`<br>
**Default:** `undefined`
</p>

The output formats to be used in the optimized image. If not provided, `webp` and `avif` will be used in addition to the original image format.

### `getImage`

This is the helper function used by the `<Image />` component to build `<img />` attributes for the transformed image. This helper can be used directly for more complex use cases that aren't currently supported by the `<Image />` component.

This helper takes in an object with the same properties as the `<Image />` component and returns an object with attributes that should be included on the final `<img />` element.

This can be helpful if you need to add preload links to a page's `<head>`.

```astro
---
import { getImage } from '@astrojs/image';

const { src } = await getImage('../assets/hero.png');
---

<html>
  <head>
    <link rel="preload" as="image" href={src}>
  </head>
</html>
```

### `getPicture`

This is the helper function used by the `<Picture />` component to build multiple sizes and formats for responsive images. This helper can be used directly for more complex use cases that aren't currently supported by the `<Picture />` component.

This helper takes in an object with the same properties as the `<Picture />` component and returns an object attributes that should be included on the final `<img />` element **and** a list of sources that should be used to render all `<source>`s for the `<picture>` element.

## Configuration

The integration can be configured to run with a different image service, either a hosted image service or a full image transformer that runs locally in your build or SSR deployment.

> During development, local images may not have been published yet and would not be available to hosted image services. Local images will always use the built-in `sharp` service when using `astro dev`.

There are currently no other configuration options for the `@astrojs/image` integration. Please [open an issue](https://github.com/withastro/astro/issues/new/choose) if you have a compelling use case to share.


 ### config.serviceEntryPoint
  
The `serviceEntryPoint` should resolve to the image service installed from NPM. The default entry point is `@astrojs/image/sharp`, which resolves to the entry point exported from this integration's `package.json`.

```js
// astro.config.mjs
import image from '@astrojs/image';

export default {
  integrations: [image({
    // Example: The entrypoint for a third-party image service installed from NPM
    serviceEntryPoint: 'my-image-service/astro.js'
  })],
}
```

## Examples

### Local images
  
Image files in your project's `src` directory can be imported in frontmatter and passed directly to the `<Image />` component. All other properties are optional and will default to the original image file's properties if not provided.

```astro
---
import { Image } from '@astrojs/image/components';
import heroImage from '../assets/hero.png';
---

// optimized image, keeping the original width, height, and image format
<Image src={heroImage} />

// height will be recalculated to match the original aspect ratio
<Image src={heroImage} width={300} />

// cropping to a specific width and height
<Image src={heroImage} width={300} height={600} />

// cropping to a specific aspect ratio and converting to an avif format
<Image src={heroImage} aspectRatio="16:9" format="avif" />

// image imports can also be inlined directly
<Image src={import('../assets/hero.png')} />
```

### Remote images
  
Remote images can be transformed with the `<Image />` component. The `<Image />` component needs to know the final dimensions for the `<img />` element to avoid content layout shifts. For remote images, this means you must either provide `width` and `height`, or one of the dimensions plus the required `aspectRatio`.

```astro
---
import { Image } from '@astrojs/image/components';

const imageUrl = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
---

// cropping to a specific width and height
<Image src={imageUrl} width={544} height={184} />

// height will be recalculated to match the aspect ratio
<Image src={imageUrl} width={300} aspectRatio={16/9} />

// cropping to a specific height and aspect ratio and converting to an avif format
<Image src={imageUrl} height={200} aspectRatio="16:9" format="avif" />
```

### Responsive pictures

The `<Picture />` component can be used to automatically build a `<picture>` with multiple sizes and formats. Check out [MDN](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#art_direction) for a deep dive into responsive images and art direction.

By default, the picture will include formats for `avif` and `webp` in addition to the image's original format.

For remote images, an `aspectRatio` is required to ensure the correct `height` can be calculated at build time.

```astro
---
import { Picture } from '@astrojs/image/components';
import hero from '../assets/hero.png';

const imageUrl = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
---

// Local image with multiple sizes
<Picture src={hero} widths={[200, 400, 800]} sizes="(max-width: 800px) 100vw, 800px" alt="My hero image" />

// Remote image (aspect ratio is required)
<Picture src={imageUrl} widths={[200, 400, 800]} aspectRatio="4:3" sizes="(max-width: 800px) 100vw, 800px" alt="My hero image" />

// Inlined imports are supported
<Picture src={import("../assets/hero.png")} widths={[200, 400, 800]} sizes="(max-width: 800px) 100vw, 800px" alt="My hero image" />
```

## Troubleshooting
- If your installation doesn't seem to be working, make sure to restart the dev server.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If refreshing the page doesn't update your preview, or if a new installation doesn't seem to be working, then restart the dev server.

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.
