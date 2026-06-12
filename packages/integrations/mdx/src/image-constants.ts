// Tag name we rewrite markdown-derived `<img>` elements to. Lowercase + hyphenated
// so MDX routes the tag through the `_components` map.
export const ASTRO_IMAGE_ELEMENT = 'astro-image';
// Module-level identifier bound to Astro's `Image` component (from `astro:assets`).
// Imported by every compiled MDX file that contains a rewritten image; used as the
// fallback when no `components.img` is provided.
export const ASTRO_IMAGE_IMPORT = '__AstroImage__';
// Boolean export set on MDX modules that contain rewritten images. Read by
// `vite-plugin-mdx-postprocess` to decide whether to wire up the image component.
export const USES_ASTRO_IMAGE_FLAG = '__usesAstroImage';
