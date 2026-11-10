import type { AstroLogger } from '@astrojs/vite-plugin-router/_internal/core/logger/core.js';

/**
 * Minimal logger stub for constructing `AstroCookies`, which needs one to
 * report `set()` calls made after the cookies were sent to the browser.
 */
export const mockLogger: Pick<AstroLogger, 'warn'> = {
	warn() {},
};
