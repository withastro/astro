// shiki-engine-worker.ts
import type { RegexEngine } from 'shiki';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

export function loadShikiEngine(): Promise<RegexEngine> {
	// @ts-ignore wasm type
	return createOnigurumaEngine(import('shiki/onig.wasm'));
}
