// shiki-engine-default.ts
import type { RegexEngine } from 'shiki';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

export function loadShikiEngine(): Promise<RegexEngine> {
	return createOnigurumaEngine(import('shiki/wasm'));
}
