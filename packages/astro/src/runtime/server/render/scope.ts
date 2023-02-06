import type { SSRResult } from '../../../@types/astro';

export const ScopeFlags = {
	Astro: 1 << 0, // 1
	JSX: 1 << 1, // 2
	Slot: 1 << 2, // 4
	HeadBuffer: 1 << 3, // 8
} as const;

type ScopeFlagValues = (typeof ScopeFlags)[keyof typeof ScopeFlags];

export function addScopeFlag(result: SSRResult, flag: ScopeFlagValues) {
	result.scope |= flag;
}

export function removeScopeFlag(result: SSRResult, flag: ScopeFlagValues) {
	result.scope &= ~flag;
}

export function createScopedResult(result: SSRResult, flag?: ScopeFlagValues): SSRResult {
	const scopedResult =  Object.create(result, {
		scope: {
			writable: true,
			value: result.scope
		}
	});
	if(flag != null) {
		addScopeFlag(scopedResult, flag);
	}
	return scopedResult;
}
