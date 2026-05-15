import type http from 'node:http';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroLogger } from '../logger/core.js';
interface PreviewServer {
	host?: string;
	port: number;
	server: http.Server;
	closed(): Promise<void>;
	stop(): Promise<void>;
}
export default function createStaticPreviewServer(
	settings: AstroSettings,
	logger: AstroLogger,
): Promise<PreviewServer>;
export {};
