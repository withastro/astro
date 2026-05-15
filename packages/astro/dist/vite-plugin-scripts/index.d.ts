import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
export declare const BEFORE_HYDRATION_SCRIPT_ID: string;
export declare const PAGE_SCRIPT_ID: string;
export declare const PAGE_SSR_SCRIPT_ID: string;
export default function astroScriptsPlugin({ settings }: { settings: AstroSettings }): VitePlugin;
