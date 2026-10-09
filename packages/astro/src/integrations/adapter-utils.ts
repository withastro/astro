import type { AstroAdapterFeatures, MiddlewareMode } from '../types/public/integrations.js';

/**
 * Resolves the middleware mode from adapter features.
 * Handles backward compatibility with the deprecated `edgeMiddleware` flag.
 *
 * @example
 * ```ts
 * // New way
 * resolveMiddlewareMode({ middlewareMode: 'always' }) // 'always'
 *
 * // Backward compatibility
 * resolveMiddlewareMode({ edgeMiddleware: true }) // 'edge'
 * resolveMiddlewareMode({ edgeMiddleware: false }) // 'classic'
 *
 * // Default
 * resolveMiddlewareMode({}) // 'classic'
 * ```
 */
export function resolveMiddlewareMode(features?: AstroAdapterFeatures): MiddlewareMode {
	// New property takes precedence
	if (features?.middlewareMode) {
		return features.middlewareMode;
	}

	// Backward compatibility with deprecated edgeMiddleware flag
	if (features?.edgeMiddleware === true) {
		return 'edge';
	}

	// Default mode
	return 'classic';
}
