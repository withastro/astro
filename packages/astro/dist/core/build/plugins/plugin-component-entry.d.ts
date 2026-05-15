import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
/**
 * When adding hydrated or client:only components as Rollup inputs, sometimes we're not using all
 * of the export names, e.g. `import { Counter } from './ManyComponents.jsx'`. This plugin proxies
 * entries to re-export only the names that the user is using.
 */
export declare function pluginComponentEntry(internals: BuildInternals): VitePlugin;
export declare function normalizeEntryId(id: string): string;
