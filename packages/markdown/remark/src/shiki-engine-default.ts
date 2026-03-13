// shiki-engine-default.ts
import type { RegexEngine } from 'shiki';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

let shikiEngine: RegexEngine | undefined = undefined;

export async function loadShikiEngine(): Promise<RegexEngine> {
	if (shikiEngine === undefined) {
		shikiEngine = await createOnigurumaEngine(import('shiki/wasm'));
	}

	return shikiEngine;
}
