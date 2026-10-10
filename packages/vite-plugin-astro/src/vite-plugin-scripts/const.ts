// NOTE: We can't use the virtual "\0" ID convention because we need to
// inject these as ESM imports into actual code, where they would not
// resolve correctly.
export const SCRIPT_ID_PREFIX = `astro:scripts/`;
export const BEFORE_HYDRATION_SCRIPT_ID = `${SCRIPT_ID_PREFIX}before-hydration.js`;
export const PAGE_SCRIPT_ID = `${SCRIPT_ID_PREFIX}page.js`;
export const PAGE_SSR_SCRIPT_ID = `${SCRIPT_ID_PREFIX}page-ssr.js`;
