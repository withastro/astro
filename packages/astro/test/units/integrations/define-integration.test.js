import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { defineIntegration } from '../../../dist/integrations/define-integration.js';
import { z } from '../../../zod.mjs';

/**
 * @typedef {Parameters<typeof defineIntegration>[0]} DefineIntegrationParams
 */

const createFixture = () => {
	let name = 'my-integration';
	/** @type {DefineIntegrationParams["setup"]} */
	let setup = () => ({
		hooks: {},
	});
	/** @type {DefineIntegrationParams["optionsSchema"]} */
	let optionsSchema;

	return {
		/** @param {typeof name} _name */
		givenName(_name) {
			name = _name;
		},
		/** @param {typeof setup} _setup */
		givenSetup(_setup) {
			setup = _setup;
		},
		/** @param {typeof optionsSchema} _optionsSchema */
		givenOptionsSchema(_optionsSchema) {
			optionsSchema = _optionsSchema;
		},
		/** @param {import("astro").AstroIntegration} expected */
		thenIntegrationShouldBe(expected) {
			const resolved = defineIntegration({
				name,
				optionsSchema,
				setup,
			})();
			assert.equal(expected.name, resolved.name);
			assert.deepEqual(Object.keys(expected.hooks).sort(), Object.keys(resolved.hooks).sort());
		},
		/**
		 * @param {string} key
		 * @param {any} value
		 */
		thenExtraFieldShouldBe(key, value) {
			const resolved = defineIntegration({
				name,
				optionsSchema,
				setup,
			})();
			assert.equal(true, Object.keys(resolved).includes(key));
			assert.deepEqual(value, resolved[key]);
		},
		/** @param {any} options */
		thenIntegrationCreationShouldNotThrow(options) {
			assert.doesNotThrow(() =>
				defineIntegration({
					name,
					optionsSchema,
					setup,
				})(options)
			);
		},
		/** @param {any} options */
		thenIntegrationCreationShouldThrow(options) {
			assert.throws(() =>
				defineIntegration({
					name,
					optionsSchema,
					setup,
				})(options)
			);
		},
	};
};

describe('core: defineIntegration', () => {
	/** @type {ReturnType<typeof createFixture>} */
	let fixture;

	beforeEach(() => {
		fixture = createFixture();
	});

	it('Should return the correct integration with no hooks', () => {
		const name = 'my-integration';
		const setup = () => ({ hooks: {} });

		fixture.givenName(name);
		fixture.givenSetup(setup);

		fixture.thenIntegrationShouldBe({
			name: 'my-integration',
			hooks: {},
		});
	});

	it('Should return the correct integration with some hooks', () => {
		const name = 'my-integration';
		const setup = () => ({
			hooks: {
				'astro:config:setup': () => {},
				'astro:server:start': () => {},
			},
		});

		fixture.givenName(name);
		fixture.givenSetup(setup);

		fixture.thenIntegrationShouldBe({
			name: 'my-integration',
			hooks: {
				'astro:server:start': () => {},
				'astro:config:setup': () => {},
			},
		});
	});

	it('Should handle optionsSchema correctly', () => {
		const optionsSchema = z.object({
			foo: z.string(),
		});

		fixture.givenOptionsSchema(optionsSchema);
		fixture.thenIntegrationCreationShouldNotThrow({
			foo: 'bar',
		});
		fixture.thenIntegrationCreationShouldThrow(null);
		fixture.thenIntegrationCreationShouldThrow({
			foo: 123,
		});
	});

	it('Should accept any extra field from setup', () => {
		const setup = () => ({
			hooks: {},
			config: {
				foo: 'bar',
			},
		});

		fixture.givenSetup(setup);
		fixture.thenExtraFieldShouldBe('config', { foo: 'bar' });
	});
});
