import type { Root } from 'hast';
import type { Plugin } from 'unified';
import type { ShikiConfig } from './types.js';
export declare const rehypeShiki: Plugin<[ShikiConfig, string[]?], Root>;
