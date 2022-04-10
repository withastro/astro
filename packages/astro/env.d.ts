/// <reference types="vite/client" />

type Astro = import('astro').AstroGlobal;

// We duplicate the description here because editors won't show the JSDoc comment from the imported type (but will for its properties, ex: Astro.request will show the AstroGlobal.request description)
/**
 * Astro global available in all contexts in .astro files
 *
 * [Astro documentation](https://docs.astro.build/reference/api-reference/#astro-global)
 */
declare const Astro: Readonly<Astro>;

declare const Fragment: any;
