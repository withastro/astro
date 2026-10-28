// NOTE: We can't use the virtual "\0" ID convention because we need to
// inject these as ESM imports into actual code, where they would not
// resolve correctly.
export const BEFORE_HYDRATION_SCRIPT_ID = `astro:scripts/before-hydration.js`;
