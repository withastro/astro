import type { AstroAdapter, AstroIntegration } from 'astro';
import type { Options, UserOptions } from './types.js';
export declare function getAdapter({ staticHeaders }: Pick<Options, 'staticHeaders'>): AstroAdapter;
export default function createIntegration(userOptions: UserOptions): AstroIntegration;
