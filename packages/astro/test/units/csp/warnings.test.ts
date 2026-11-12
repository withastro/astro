import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { warnIfCspResourceFallbackShadowing } from '../../../dist/core/messages/runtime.js';
import { SpyLogger } from '../test-utils.ts';

function configWithCsp(csp: unknown): any {
	return { security: { csp } };
}

function cspWarnings(logger: SpyLogger): string[] {
	return logger.logs.filter((l) => l.label === 'csp' && l.level === 'warn').map((l) => l.message);
}

describe('warnIfCspResourceFallbackShadowing', () => {
	it('warns when default resources coexist with an element entry', () => {
		const logger = new SpyLogger();
		warnIfCspResourceFallbackShadowing(
			configWithCsp({
				scriptDirective: {
					resources: ["'self'", { resource: 'https://cdn.example.com', kind: 'element' }],
				},
			}),
			logger,
		);

		const warnings = cspWarnings(logger);
		assert.equal(warnings.length, 1);
		assert.match(warnings[0], /script-src-elem/);
		assert.match(warnings[0], /'self'/);
	});

	it('warns when default resources coexist with an attribute entry (via hashes)', () => {
		const logger = new SpyLogger();
		warnIfCspResourceFallbackShadowing(
			configWithCsp({
				styleDirective: {
					resources: ['https://styles.example.com'],
					hashes: [{ hash: 'sha256-abc', kind: 'attribute' }],
				},
			}),
			logger,
		);

		const warnings = cspWarnings(logger);
		assert.equal(warnings.length, 1);
		assert.match(warnings[0], /style-src-attr/);
	});

	it('does not warn when there are only default resources', () => {
		const logger = new SpyLogger();
		warnIfCspResourceFallbackShadowing(
			configWithCsp({ scriptDirective: { resources: ["'self'", 'https://cdn.example.com'] } }),
			logger,
		);

		assert.equal(cspWarnings(logger).length, 0);
	});

	it('does not warn when there are no default resources to shadow', () => {
		const logger = new SpyLogger();
		warnIfCspResourceFallbackShadowing(
			configWithCsp({
				scriptDirective: { resources: [{ resource: 'https://cdn.example.com', kind: 'element' }] },
			}),
			logger,
		);

		assert.equal(cspWarnings(logger).length, 0);
	});

	it('does not warn when CSP is disabled or enabled without directives', () => {
		const loggerFalse = new SpyLogger();
		warnIfCspResourceFallbackShadowing(configWithCsp(false), loggerFalse);
		assert.equal(cspWarnings(loggerFalse).length, 0);

		const loggerTrue = new SpyLogger();
		warnIfCspResourceFallbackShadowing(configWithCsp(true), loggerTrue);
		assert.equal(cspWarnings(loggerTrue).length, 0);
	});
});
