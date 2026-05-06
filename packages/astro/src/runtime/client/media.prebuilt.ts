/**
 * This file is prebuilt from packages/astro/src/runtime/client/media.ts
 * Do not edit this directly, but instead edit that file and rerun the prebuild
 * to generate this file.
 */

export default `(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener("change",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event("astro:media"));})();`;