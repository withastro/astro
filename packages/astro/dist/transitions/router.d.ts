import type { Fallback, Options } from './types.js';
export declare const supportsViewTransitions: boolean;
export declare const transitionEnabledOnThisPage: () => boolean;
export declare function getFallback(): Fallback;
export declare function navigate(href: string, options?: Options): Promise<void>;
