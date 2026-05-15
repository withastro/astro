import type http from 'node:http';
import https from 'node:https';
import type { AstroIntegrationLogger } from 'astro';
export declare function logListeningOn(
	logger: AstroIntegrationLogger,
	server: http.Server | https.Server,
	configuredHost: string | boolean | undefined,
): Promise<void>;
