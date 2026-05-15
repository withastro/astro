import type { AstroCookies } from './cookies.js';
export declare function attachCookiesToResponse(response: Response, cookies: AstroCookies): void;
export declare function getCookiesFromResponse(response: Response): AstroCookies | undefined;
export declare function getSetCookiesFromResponse(response: Response): Generator<string, string[]>;
