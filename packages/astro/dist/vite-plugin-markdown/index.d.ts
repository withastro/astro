import type { Plugin } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
interface AstroPluginOptions {
	settings: AstroSettings;
	logger: AstroLogger;
}
export default function markdown({ settings, logger }: AstroPluginOptions): Plugin;
export {};
