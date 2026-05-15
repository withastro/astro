import type { AstroLogger } from '../../../core/logger/core.js';
import type { FontFetcher, FontTypeExtractor } from '../definitions.js';
import type { FontFileById } from '../types.js';
import type { ServerResponse } from 'node:http';
interface MinimalResponse {
	setHeader: (name: string, value: string) => void;
	end: (buffer?: Buffer) => void;
	setStatusCode: (statusCode: number) => void;
}
interface Options {
	url: string | undefined;
	response: MinimalResponse;
	next: () => void;
	fontFetcher: FontFetcher | null;
	fontTypeExtractor: FontTypeExtractor | null;
	logger: AstroLogger;
	fontFileById: FontFileById | null;
}
export declare function resToMinimalResponse(res: ServerResponse): MinimalResponse;
export declare function fontFileMiddleware({
	url: _url,
	response,
	next,
	fontFetcher,
	fontTypeExtractor,
	logger,
	fontFileById,
}: Options): Promise<void>;
export {};
