import 'mocha';
import assert from 'node:assert';
import type { Language } from '@volar/language-core';
import { createProxyLanguageService } from '@volar/typescript/lib/node/proxyLanguageService.js';
import type ts from 'typescript';

suite('Proxy language service', () => {
	test('uses language service methods assigned by a later plugin', () => {
		let called = 'original';
		const languageService = {
			getCompletionsAtPosition() {
				called = 'original';
			},
		} as unknown as ts.LanguageService;
		const { initialize, proxy } = createProxyLanguageService(languageService);

		initialize({ scripts: { get: () => undefined } } as unknown as Language<string>);
		void proxy.getCompletionsAtPosition;
		proxy.getCompletionsAtPosition = () => {
			called = 'decorated';
			return undefined;
		};
		proxy.getCompletionsAtPosition('component.vue', 0, undefined);

		assert.strictEqual(called, 'decorated');
	});
});
