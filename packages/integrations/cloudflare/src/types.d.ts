/**
 * Cloudflare Worker Request types
 * Extends the global Request object with Cloudflare-specific properties
 */

import type { IncomingRequestCfProperties } from '@cloudflare/workers-types';

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
		readonly cf?: IncomingRequestCfProperties;
	}
}

export type { IncomingRequestCfProperties };
