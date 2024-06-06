import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { getEnvFieldType, validateEnvVariable } from '../../../dist/env/validators.js';

/**
 * @typedef {Parameters<typeof validateEnvVariable>} Params
 */

const createFixture = () => {
	/**
	 * @type {{ value: Params[1]; options: Params[2] }} input
	 */
	let input;

	return {
		/**
		 * @param {Params[1]} value
		 * @param {Params[2]} options
		 */
		givenInput(value, options) {
			input = { value, options };
		},
		/**
		 * @param {import("../../../src/env/validators.js").ValidationResultValue} value
		 */
		thenResultShouldBeValid(value) {
			const result = validateEnvVariable(input.value, input.options);
			assert.equal(result.ok, true);
			assert.equal(result.value, value);
		},
		thenResultShouldBeInvalid() {
			const result = validateEnvVariable(input.value, input.options);
			assert.equal(result.ok, false);
			console.log(result.error);
		},
	};
};

describe('astro:env validators', () => {
	/** @type {ReturnType<typeof createFixture>} */
	let fixture;

	before(() => {
		fixture = createFixture();
	});

	it('types codegen should return the right string based on the field options', () => {
		assert.equal(
			getEnvFieldType({
				type: 'string',
			}),
			'string'
		);

		assert.equal(
			getEnvFieldType({
				type: 'string',
				optional: true,
			}),
			'string | undefined'
		);

		assert.equal(
			getEnvFieldType({
				type: 'string',
				optional: true,
				default: 'abc',
			}),
			'string'
		);

		assert.equal(
			getEnvFieldType({
				type: 'number',
			}),
			'number'
		);

		assert.equal(
			getEnvFieldType({
				type: 'number',
				optional: true,
			}),
			'number | undefined'
		);

		assert.equal(
			getEnvFieldType({
				type: 'number',
				optional: true,
				default: 456,
			}),
			'number'
		);

		assert.equal(
			getEnvFieldType({
				type: 'boolean',
			}),
			'boolean'
		);

		assert.equal(
			getEnvFieldType({
				type: 'boolean',
				optional: true,
			}),
			'boolean | undefined'
		);

		assert.equal(
			getEnvFieldType({
				type: 'boolean',
				optional: true,
				default: true,
			}),
			'boolean'
		);
	});

	describe('string field', () => {
		it('Should fail if the variable is missing', () => {
			fixture.givenInput(undefined, {
				type: 'string',
			});
			fixture.thenResultShouldBeInvalid();
		});

		it('Should not fail is the variable type is incorrect', () => {
			fixture.givenInput('123456', {
				type: 'string',
			});
			fixture.thenResultShouldBeValid('123456');
		});

		it('Should not fail if the optional variable is missing', () => {
			fixture.givenInput(undefined, {
				type: 'string',
				optional: true,
			});
			fixture.thenResultShouldBeValid(undefined);
		});

		it('Should not fail if the variable is missing and a default value is provided', () => {
			fixture.givenInput(undefined, {
				type: 'string',
				default: 'abc',
			});
			fixture.thenResultShouldBeValid('abc');
		});

		it('Should not take a default value is the variable is not missing', () => {
			fixture.givenInput('abc', {
				type: 'string',
				default: 'def',
			});
			fixture.thenResultShouldBeValid('abc');
		});
	});

	describe('number field', () => {
		it('Should fail if the variable is missing', () => {
			fixture.givenInput(undefined, {
				type: 'number',
			});
			fixture.thenResultShouldBeInvalid();
		});

		it('Should fail is the variable type is incorrect', () => {
			fixture.givenInput('abc', {
				type: 'number',
			});
			fixture.thenResultShouldBeInvalid();
		});

		it('Should accept integers', () => {
			fixture.givenInput('12345', {
				type: 'number',
			});
			fixture.thenResultShouldBeValid(12345);
		});

		it('Should accept floats', () => {
			fixture.givenInput('12.34', {
				type: 'number',
			});
			fixture.thenResultShouldBeValid(12.34);
		});

		it('Should not fail if the optional variable is missing', () => {
			fixture.givenInput(undefined, {
				type: 'number',
				optional: true,
			});
			fixture.thenResultShouldBeValid(undefined);
		});

		it('Should not fail if the variable is missing and a default value is provided', () => {
			fixture.givenInput(undefined, {
				type: 'number',
				default: 123,
			});
			fixture.thenResultShouldBeValid(123);
		});

		it('Should not take a default value is the variable is not missing', () => {
			fixture.givenInput('123', {
				type: 'number',
				default: 456,
			});
			fixture.thenResultShouldBeValid(123);
		});
	});

	describe('boolean field', () => {
		it('Should fail if the variable is missing', () => {
			fixture.givenInput(undefined, {
				type: 'boolean',
			});
			fixture.thenResultShouldBeInvalid();
		});

		it('Should fail is the variable type is incorrect', () => {
			fixture.givenInput('abc', {
				type: 'boolean',
			});
			fixture.thenResultShouldBeInvalid();
		});

		it('Should not fail if the optional variable is missing', () => {
			fixture.givenInput(undefined, {
				type: 'boolean',
				optional: true,
			});
			fixture.thenResultShouldBeValid(undefined);
		});

		it('Should not fail if the variable is missing and a default value is provided', () => {
			fixture.givenInput(undefined, {
				type: 'boolean',
				default: true,
			});
			fixture.thenResultShouldBeValid(true);
		});

		it('Should not take a default value is the variable is not missing', () => {
			fixture.givenInput('true', {
				type: 'boolean',
				default: false,
			});
			fixture.thenResultShouldBeValid(true);
		});
	});
});
