// shiki-engine-workerd.ts
import type { RegexEngine } from 'shiki';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

let shikiEngine: RegexEngine | undefined = undefined;

export async function loadShikiEngine(): Promise<RegexEngine> {
	if (shikiEngine === undefined) {
		// @ts-ignore wasm type
		shikiEngine = await createOnigurumaEngine(import('shiki/onig.wasm'));
	}

	return shikiEngine;
}
