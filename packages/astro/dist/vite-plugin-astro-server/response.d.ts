import type http from 'node:http';
import type { ErrorWithMetadata } from '../core/errors/index.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
export declare function handle500Response(
	loader: ModuleLoader,
	res: http.ServerResponse,
	err: ErrorWithMetadata,
): Promise<void>;
export declare function writeHtmlResponse(
	res: http.ServerResponse,
	statusCode: number,
	html: string,
): void;
export declare function writeRedirectResponse(
	res: http.ServerResponse,
	statusCode: number,
	location: string,
): void;
export declare function writeSSRResult(
	webRequest: Request,
	webResponse: Response,
	res: http.ServerResponse,
): Promise<void>;
