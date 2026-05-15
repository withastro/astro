import type { Options } from '@sveltejs/vite-plugin-svelte';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer } from 'astro';
declare function getRenderer(): AstroRenderer;
export { getRenderer as getContainerRenderer };
export default function svelteIntegration(options?: Options): AstroIntegration;
export { vitePreprocess };
