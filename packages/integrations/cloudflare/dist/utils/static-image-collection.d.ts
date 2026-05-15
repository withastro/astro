import type { CompileImageConfig } from '../vite-plugin-config.js';
/**
 * Installs `globalThis.astroAsset.addStaticImage` for use inside workerd
 * during prerendering. This mirrors the logic in astro's vite-plugin-assets.ts
 * but uses only workerd-safe APIs (no node: imports).
 */
export declare function installAddStaticImage(config: CompileImageConfig): void;
