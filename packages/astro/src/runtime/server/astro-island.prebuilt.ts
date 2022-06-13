/**
 * This file is prebuilt from packages/astro/src/runtime/server/astro-island.ts
 * Do not edit this directly, but instead edit that file and rerun the prebuild
 * to generate this file.
 */

export default `{const i={0:t=>t,1:t=>JSON.parse(t,r),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(JSON.parse(t,r)),5:t=>new Set(JSON.parse(t,r)),6:t=>BigInt(t),7:t=>new URL(t)},r=(t,e)=>{if(t===""||!Array.isArray(e))return e;const[n,s]=e;return n in i?i[n](s):void 0};customElements.define("astro-island",class extends HTMLElement{async connectedCallback(){const[{default:t}]=await Promise.all([import(this.getAttribute("directive-url")),import(this.getAttribute("before-hydration-url"))]),e=JSON.parse(this.getAttribute("opts"));t(this,e,async()=>{const n=this.hasAttribute("props")?JSON.parse(this.getAttribute("props"),r):{},s=this.getAttribute("renderer-url"),[o,{default:p}]=await Promise.all([import(this.getAttribute("component-url")),s?import(s):()=>()=>{}]),a=o[this.getAttribute("component-export")||"default"];return(l,c)=>p(l)(a,n,c,{client:this.getAttribute("client")})})}})}`;