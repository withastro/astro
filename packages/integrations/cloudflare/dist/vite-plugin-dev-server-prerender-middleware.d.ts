import type * as vite from 'vite';
/**
 * Enables Astro core prerender middleware in dev so prerendered routes can
 * run in Node while non-prerendered routes continue through workerd.
 */
export declare function createNodePrerenderPlugin(): vite.Plugin;
