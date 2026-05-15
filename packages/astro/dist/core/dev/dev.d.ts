import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import type * as vite from 'vite';
import type { AstroInlineConfig } from '../../types/public/config.js';
export interface DevServer {
	address: AddressInfo;
	handle: (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => void;
	watcher: vite.FSWatcher;
	stop(): Promise<void>;
}
/**
 * Runs Astro’s development server. This is a local HTTP server that doesn’t bundle assets.
 * It uses Hot Module Replacement (HMR) to update your browser as you save changes in your editor.
 *
 * @experimental The JavaScript API is experimental
 */
export default function dev(inlineConfig: AstroInlineConfig): Promise<DevServer>;
