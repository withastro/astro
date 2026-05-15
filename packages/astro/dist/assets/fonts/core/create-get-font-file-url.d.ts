import type { RuntimeFontFileUrlResolver } from '../definitions.js';
export declare function createGetFontFileURL(
	runtimeFontFileUrlResolver: RuntimeFontFileUrlResolver,
): (url: string, requestUrl?: URL) => string;
