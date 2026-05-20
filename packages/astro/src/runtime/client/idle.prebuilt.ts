/**
 * This file is prebuilt from packages/astro/src/runtime/client/idle.ts
 * Do not edit this directly, but instead edit that file and rerun the prebuild
 * to generate this file.
 */

export default `(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value=="object"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};"requestIdleCallback"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event("astro:idle"));})();`;