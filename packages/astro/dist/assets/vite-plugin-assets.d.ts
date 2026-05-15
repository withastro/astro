import type * as fsMod from 'node:fs';
import type * as vite from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
interface Options {
	settings: AstroSettings;
	sync: boolean;
	logger: AstroLogger;
	fs: typeof fsMod;
}
export default function assets({ fs, settings, sync, logger }: Options): vite.Plugin[];
export {};
