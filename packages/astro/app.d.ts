/// <reference types="vite/client" />

type Astro = import('./dist/types/@types/astro').AstroGlobal;

// We duplicate the description here because editors won't show the JSDoc comment from the imported type (but will for its properties, ex: Astro.request will show the AstroGlobal.request description)
/**
 * Astro.* available in all components
 * Docs: https://docs.astro.build/reference/api-reference/#astro-global
 */
declare let Astro: Astro;

declare let Fragment: any;
