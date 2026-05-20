/**
 * This file is prebuilt from packages/astro/src/runtime/client/load.ts
 * Do not edit this directly, but instead edit that file and rerun the prebuild
 * to generate this file.
 */

export default `(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event("astro:load"));})();`;