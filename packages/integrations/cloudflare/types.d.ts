/**
 * Cloudflare Worker Request types
 * Extends the global Request object with Cloudflare-specific properties
 */

declare global {
	interface Request {
		/**
		 * Cloudflare-specific properties available on incoming requests
		 * Contains metadata about the request such as:
		 * - Geographic information (country, colo, timezone)
		 * - TLS/Security details (cipher, protocol version)
		 * - Bot Management scores
		 * - Client information (ASN, TCP metrics)
		 */
		readonly cf?: import('@cloudflare/workers-types').IncomingRequestCfProperties;
	}
}

type Runtime = import('./dist/index.d.ts').Runtime;

declare namespace App {
	interface Locals extends Runtime {}
}
