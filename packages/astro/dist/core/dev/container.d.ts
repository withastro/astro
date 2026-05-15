import nodeFs from 'node:fs';
import type * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import * as vite from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroInlineConfig } from '../../types/public/config.js';
import type { AstroLogger } from '../logger/core.js';
export interface Container {
	fs: typeof nodeFs;
	logger: AstroLogger;
	settings: AstroSettings;
	viteServer: vite.ViteDevServer;
	inlineConfig: AstroInlineConfig;
	restartInFlight: boolean;
	handle: (req: http.IncomingMessage, res: http.ServerResponse) => void;
	close: () => Promise<void>;
}
interface CreateContainerParams {
	logger: AstroLogger;
	settings: AstroSettings;
	inlineConfig?: AstroInlineConfig;
	isRestart?: boolean;
	fs?: typeof nodeFs;
}
export declare function createContainer({
	isRestart,
	logger,
	inlineConfig,
	settings,
	fs,
}: CreateContainerParams): Promise<Container>;
export declare function startContainer({
	settings,
	viteServer,
	logger,
}: Container): Promise<AddressInfo>;
export {};
