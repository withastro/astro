import type { Plugin } from 'vite';
import { type BuildInternals } from './internal.js';
/**
 * Vite plugin that tracks emitted assets and handles cleanup of manifest files.
 * This plugin coordinates with emitClientAsset() to track which assets should
 * be moved to the client directory. The resolved filenames are stored in
 * BuildInternals.ssrAssetsPerEnvironment during generateBundle.
 */
export declare function vitePluginSSRAssets(internals: BuildInternals): Plugin;
