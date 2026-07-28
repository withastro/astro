import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderCspContent } from '../../../dist/runtime/server/render/csp.js';
import type { SSRResult } from '../../../dist/types/public/internal.js';

/**
 * Builds a synthetic `SSRResult` containing only the fields `renderCspContent` reads. This lets us
 * unit test the rendering logic directly, without a pipeline or a full result object.
 */
function createCspResult(
	overrides: {
		directives?: SSRResult['directives'];
		scriptDirective?: Partial<SSRResult['scriptDirective']>;
		styleDirective?: Partial<SSRResult['styleDirective']>;
		extraScriptHashes?: string[];
		extraStyleHashes?: string[];
	} = {},
): SSRResult {
	return {
		directives: overrides.directives ?? [],
		scriptDirective: {
			resources: [],
			hashes: [],
			strictDynamic: false,
			...overrides.scriptDirective,
		},
		styleDirective: {
			resources: [],
			hashes: [],
			...overrides.styleDirective,
		},
		_metadata: {
			extraScriptHashes: overrides.extraScriptHashes ?? [],
			extraStyleHashes: overrides.extraStyleHashes ?? [],
		},
	} as unknown as SSRResult;
}

describe('renderCspContent', () => {
	it('emits only script-src/style-src (defaulting to self) when nothing is configured', () => {
		assert.equal(renderCspContent(createCspResult()), "script-src 'self' ; style-src 'self' ;");
	});

	it('includes default-kind hashes on script-src/style-src', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					scriptDirective: { hashes: ['sha256-script'] },
					styleDirective: { hashes: ['sha256-style'] },
				}),
			),
			"script-src 'self' 'sha256-script'; style-src 'self' 'sha256-style';",
		);
	});

	it('moves default hashes into script-src-elem instead of duplicating them on the baseline', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					scriptDirective: {
						hashes: ['sha256-default', { hash: 'sha256-elem', kind: 'element' }],
						resources: [{ resource: 'https://cdn.example.com', kind: 'element' }],
					},
				}),
			),
			"script-src 'self' ; " +
				"script-src-elem https://cdn.example.com 'sha256-default' 'sha256-elem'; " +
				"style-src 'self' ;",
		);
	});

	it('emits script-src-elem with the self default when only an element hash is scoped', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					scriptDirective: { hashes: [{ hash: 'sha256-elem', kind: 'element' }] },
				}),
			),
			"script-src 'self' ; script-src-elem 'self' 'sha256-elem'; style-src 'self' ;",
		);
	});

	it('does not add self to element directives when default resources are configured', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					scriptDirective: {
						hashes: [{ hash: 'sha256-script', kind: 'element' }],
						resources: ["'none'"],
					},
					styleDirective: {
						hashes: [{ hash: 'sha256-style', kind: 'element' }],
						resources: ['https://styles.example.com'],
					},
				}),
			),
			"script-src 'none' ; script-src-elem 'sha256-script'; " +
				"style-src https://styles.example.com ; style-src-elem 'sha256-style';",
		);
	});

	it('does not share default hashes into the -attr directives', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					styleDirective: {
						hashes: ['sha256-default'],
						resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }],
					},
				}),
			),
			"script-src 'self' ; style-src 'self' 'sha256-default'; style-src-attr 'unsafe-inline';",
		);
	});

	it('emits an explicit none scoped to an attribute directive', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					scriptDirective: { resources: [{ resource: "'none'", kind: 'attribute' }] },
				}),
			),
			"script-src 'self' ; script-src-attr 'none'; style-src 'self' ;",
		);
	});

	it('does not emit a contradictory none when an attribute hash is scoped without resources', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					scriptDirective: { hashes: [{ hash: 'sha256-attr', kind: 'attribute' }] },
				}),
			),
			"script-src 'self' ; script-src-attr 'sha256-attr'; style-src 'self' ;",
		);
	});

	it('applies strict-dynamic to script-src and inherits it on script-src-elem', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					scriptDirective: {
						hashes: ['sha256-default'],
						resources: [{ resource: 'https://cdn.example.com', kind: 'element' }],
						strictDynamic: true,
					},
				}),
			),
			"script-src 'self' 'strict-dynamic'; " +
				"script-src-elem https://cdn.example.com 'sha256-default' 'strict-dynamic'; " +
				"style-src 'self' ;",
		);
	});

	it('places render-time (extra) hashes on style-src-elem when it governs elements', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					styleDirective: { resources: [{ resource: 'https://cdn.example.com', kind: 'element' }] },
					extraStyleHashes: ['sha256-svg'],
				}),
			),
			"script-src 'self' ; style-src 'self' ; style-src-elem https://cdn.example.com 'sha256-svg';",
		);
	});

	it('deduplicates a hash present in both the directive and the render-time set', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					scriptDirective: { hashes: ['sha256-dup'] },
					extraScriptHashes: ['sha256-dup'],
				}),
			),
			"script-src 'self' 'sha256-dup'; style-src 'self' ;",
		);
	});

	it('emits directives in a deterministic order', () => {
		assert.equal(
			renderCspContent(
				createCspResult({
					directives: ["img-src 'self'"],
					scriptDirective: {
						resources: [
							{ resource: 'https://cdn.example.com', kind: 'element' },
							{ resource: "'none'", kind: 'attribute' },
						],
					},
					styleDirective: {
						resources: [
							{ resource: 'https://styles.example.com', kind: 'element' },
							{ resource: "'unsafe-inline'", kind: 'attribute' },
						],
					},
				}),
			),
			"img-src 'self'; " +
				"script-src 'self' ; " +
				'script-src-elem https://cdn.example.com; ' +
				"script-src-attr 'none'; " +
				"style-src 'self' ; " +
				'style-src-elem https://styles.example.com; ' +
				"style-src-attr 'unsafe-inline';",
		);
	});

	it('omits the more specific directives when nothing is scoped to them', () => {
		assert.equal(
			renderCspContent(createCspResult({ scriptDirective: { hashes: ['sha256-default'] } })),
			"script-src 'self' 'sha256-default'; style-src 'self' ;",
		);
	});
});
