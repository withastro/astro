type ViteUserConfig = import('vite').UserConfig;
type AstroUserConfig = import('./dist/@types/astro.js').AstroUserConfig;

/**
 * See the full Astro Configuration API Documentation
 * https://astro.build/config
 */
export function defineConfig(config: AstroUserConfig): AstroUserConfig;

/**
 * Use Astro to generate a fully resolved Vite config
 */
export function getViteConfig(config: ViteUserConfig): ViteUserConfig;
