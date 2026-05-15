import { AstroTelemetry } from '@astrojs/telemetry';
import { version as viteVersion } from 'vite';
import { ASTRO_VERSION } from '../core/constants.js';
const telemetry = new AstroTelemetry({
	astroVersion: ASTRO_VERSION,
	viteVersion,
});
export * from './error.js';
export * from './session.js';
export { telemetry };
