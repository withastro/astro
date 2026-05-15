import type { Context } from './context.js';
import type { AstroPreactAttrs, PropNameToSignalMap } from './types.js';
export declare function restoreSignalsOnProps(
	ctx: Context,
	props: Record<string, any>,
): PropNameToSignalMap;
export declare function serializeSignals(
	ctx: Context,
	props: Record<string, any>,
	attrs: AstroPreactAttrs,
	map: PropNameToSignalMap,
): void;
