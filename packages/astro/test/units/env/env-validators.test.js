import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { validateEnvVariable } from '../../../dist/env/validators.js';

/**
 * @typedef {Parameters<typeof validateEnvVariable>} Params
 */

const createFixture = () => {
	/**
	 * @type {{ value: Params[1]; options: Params[2] }} input
	 */
	let input;
	/**
	 * @type {ReturnType<typeof validateEnvVariable>}
	 */
	let result;

	return {
		/**
		 * @param {Params[1]} value
		 * @param {Params[2]} options
		 */
		createInput(value, options) {
			return {
				value,
				options,
			};
		},
		/**
		 * @param {typeof input} _input
		 */
		givenInput(_input) {
			input = _input;
		},
		whenValidating() {
			result = validateEnvVariable(input.value, input.options);
		},
		/**
		 * @param {import("../../../src/env/validators.js").ValidationResultValue} value
		 */
		thenResultShouldBeValid(value) {
			assert.equal(result.ok, true);
			assert.equal(result.value, value);
		},
		thenResultShouldBeInvalid() {
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

	describe('string field', () => {
		it('Should fail if the variable is missing', () => {
			const input = fixture.createInput(undefined, {
				type: 'string',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeInvalid();
		});

		it('Should not fail is the variable type is incorrect', () => {
			const input = fixture.createInput('123456', {
				type: 'string',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid('123456');
		});

		it('Should not fail if the optional variable is missing', () => {
			const input = fixture.createInput(undefined, {
				type: 'string',
				optional: true,
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(undefined);
		});

		it('Should not fail if the variable is missing and a default value is provided', () => {
			const input = fixture.createInput(undefined, {
				type: 'string',
				default: 'abc',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid('abc');
		});

		it('Should not take a default value is the variable is not missing', () => {
			const input = fixture.createInput('abc', {
				type: 'string',
				default: 'def',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid('abc');
		});
	});

	describe('number field', () => {
		it('Should fail if the variable is missing', () => {
			const input = fixture.createInput(undefined, {
				type: 'number',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeInvalid();
		});

		it('Should fail is the variable type is incorrect', () => {
			const input = fixture.createInput('abc', {
				type: 'number',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeInvalid();
		});

		it('Should accept integers', () => {
			const input = fixture.createInput('12345', {
				type: 'number',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(12345);
		});

		it('Should accept floats', () => {
			const input = fixture.createInput('12.34', {
				type: 'number',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(12.34);
		});

		it('Should not fail if the optional variable is missing', () => {
			const input = fixture.createInput(undefined, {
				type: 'number',
				optional: true,
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(undefined);
		});

		it('Should not fail if the variable is missing and a default value is provided', () => {
			const input = fixture.createInput(undefined, {
				type: 'number',
				default: 123,
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(123);
		});

		it('Should not take a default value is the variable is not missing', () => {
			const input = fixture.createInput('123', {
				type: 'number',
				default: 456,
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(123);
		});
	});

	describe('boolean field', () => {
		it('Should fail if the variable is missing', () => {
			const input = fixture.createInput(undefined, {
				type: 'boolean',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeInvalid();
		});

		it('Should fail is the variable type is incorrect', () => {
			const input = fixture.createInput('abc', {
				type: 'boolean',
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeInvalid();
		});

		it('Should not fail if the optional variable is missing', () => {
			const input = fixture.createInput(undefined, {
				type: 'boolean',
				optional: true,
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(undefined);
		});

		it('Should not fail if the variable is missing and a default value is provided', () => {
			const input = fixture.createInput(undefined, {
				type: 'boolean',
				default: true,
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(true);
		});

		it('Should not take a default value is the variable is not missing', () => {
			const input = fixture.createInput('true', {
				type: 'boolean',
				default: false,
			});
			fixture.givenInput(input);
			fixture.whenValidating();
			fixture.thenResultShouldBeValid(true);
		});
	});
});
