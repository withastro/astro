type AstroUserConfig = import('./dist/types/@types/astro').AstroUserConfig;

/**
 * See the full Astro Configuration API Documentation
 * https://astro.build/config
 */
export function defineConfig(config: AstroUserConfig): AstroUserConfig;

/**
 * Synchronously load environment variables from default location
 */
export function loadEnv(): Record<string, any>;
