import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as z from 'zod/v4';
import { formDataToObject } from '../../../dist/actions/runtime/server.js';

describe('formDataToObject', () => {
	it('should handle strings', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');
		formData.set('email', 'test@test.test');

		const input = z.object({
			name: z.string(),
			email: z.string(),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'Ben');
		assert.equal(res.email, 'test@test.test');
	});

	it('should handle numbers', () => {
		const formData = new FormData();
		formData.set('age', '25');

		const input = z.object({
			age: z.number(),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.age, 25);
	});

	it('should pass NaN for invalid numbers', () => {
		const formData = new FormData();
		formData.set('age', 'twenty-five');

		const input = z.object({
			age: z.number(),
		});

		const res = formDataToObject(formData, input);
		assert.ok(isNaN(res.age as number));
	});

	it('should handle boolean checks', () => {
		const formData = new FormData();
		formData.set('isCool', 'yes');
		formData.set('isTrue', String(true));
		formData.set('isFalse', String(false));
		formData.set('falseString', 'false');

		const input = z.object({
			isCool: z.boolean(),
			isNotCool: z.boolean(),
			isTrue: z.boolean(),
			isFalse: z.boolean(),
			falseString: z.boolean(),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.isCool, true);
		assert.equal(res.isNotCool, false);
		assert.equal(res.isTrue, true);
		assert.equal(res.isFalse, false);
		assert.equal(res.falseString, false);
	});

	it('should handle optional values', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');

		const input = z.object({
			name: z.string().optional(),
			email: z.string().optional(),
			age: z.number().optional(),
		});

		const res = formDataToObject(formData, input);

		assert.equal(res.name, 'Ben');
		assert.equal(res.email, undefined);
		assert.equal(res.age, undefined);
	});

	it('should handle null values', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');

		const input = z.object({
			name: z.string().nullable(),
			email: z.string().nullable(),
			age: z.number().nullable(),
		});

		const res = formDataToObject(formData, input);

		assert.equal(res.name, 'Ben');
		assert.equal(res.email, null);
		assert.equal(res.age, null);
	});

	it('should handle zod default values', () => {
		const formData = new FormData();

		const input = z.object({
			name: z.string().default('test'),
			email: z.string().default('test@test.test'),
			favoriteNumbers: z.array(z.number()).default([1, 2]),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'test');
		assert.equal(res.email, 'test@test.test');
		assert.deepEqual(res.favoriteNumbers, [1, 2]);
	});

	it('should handle zod chaining of optional, default, and nullish values', () => {
		const formData = new FormData();
		formData.set('email', 'test@test.test');

		const input = z.object({
			name: z.string().default('test').optional(),
			email: z.string().optional().nullish(),
			favoriteNumbers: z.array(z.number()).default([1, 2]).nullish().optional(),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'test');
		assert.equal(res.email, 'test@test.test');
		assert.deepEqual(res.favoriteNumbers, [1, 2]);
	});

	it('should handle File objects', () => {
		const formData = new FormData();
		formData.set('file', new File([''], 'test.txt'));

		const input = z.object({
			file: z.instanceof(File),
		});

		const res = formDataToObject(formData, input);

		assert.equal(res.file instanceof File, true);
	});

	it('should handle string arrays', () => {
		const formData = new FormData();
		formData.append('contact', 'Ben');
		formData.append('contact', 'Jane');
		formData.append('contact', 'John');

		const input = z.object({
			contact: z.array(z.string()),
		});

		const res = formDataToObject(formData, input);

		assert.ok(Array.isArray(res.contact), 'contact is not an array');
		assert.deepEqual(res.contact.sort(), ['Ben', 'Jane', 'John']);
	});

	it('should handle number arrays', () => {
		const formData = new FormData();
		formData.append('age', '25');
		formData.append('age', '30');
		formData.append('age', '35');

		const input = z.object({
			age: z.array(z.number()),
		});

		const res = formDataToObject(formData, input);

		assert.ok(Array.isArray(res.age), 'age is not an array');
		assert.deepEqual(res.age.sort(), [25, 30, 35]);
	});

	it('should handle an array of File objects', () => {
		const formData = new FormData();
		const file1 = new File([''], 'test1.txt');
		const file2 = new File([''], 'test2.txt');
		formData.append('files', file1);
		formData.append('files', file2);

		const input = z.object({
			files: z.array(z.instanceof(File)),
		});

		const res = formDataToObject(formData, input);

		assert.equal(res.files instanceof Array, true);
		assert.deepEqual(res.files, [file1, file2]);
	});

	it('should handle nested objects with dot notation keys', () => {
		const formData = new FormData();
		formData.set('a', 'hello');
		formData.set('bc.b', 'hoge');
		formData.set('bc.c', 'world');

		const input = z.object({
			a: z.string(),
			bc: z.object({
				b: z.enum(['hoge', 'huga']),
				c: z.string().optional(),
			}),
		});

		const res = formDataToObject(formData, input);
		assert.deepEqual(res, {
			a: 'hello',
			bc: { b: 'hoge', c: 'world' },
		});
	});

	it('should parse nested objects with superRefine wrapping', () => {
		const formData = new FormData();
		formData.set('a', 'hello');
		formData.set('bc.b', 'huga');
		formData.set('bc.c', 'test');

		const input = z.object({
			a: z.string(),
			bc: z
				.object({
					b: z.enum(['hoge', 'huga']),
					c: z.string().optional(),
				})
				.superRefine((data, ctx) => {
					if (data.b === 'huga' && (!data.c || data.c.trim() === '')) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							path: ['bc', 'c'],
							message: 'C is required when B is "huga"',
						});
					}
				}),
		});

		const res = formDataToObject(formData, input);
		assert.deepEqual(res, {
			a: 'hello',
			bc: { b: 'huga', c: 'test' },
		});
	});

	it('should handle deeply nested objects', () => {
		const formData = new FormData();
		formData.set('a.b.c', 'deep');
		formData.set('a.b.d', '42');

		const input = z.object({
			a: z.object({
				b: z.object({
					c: z.string(),
					d: z.number(),
				}),
			}),
		});

		const res = formDataToObject(formData, input);
		assert.deepEqual(res, {
			a: { b: { c: 'deep', d: 42 } },
		});
	});

	it('should return undefined for optional nested objects when no keys present', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');

		const input = z.object({
			name: z.string(),
			address: z
				.object({
					street: z.string(),
					city: z.string(),
				})
				.optional(),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'Ben');
		assert.equal(res.address, undefined);
	});

	it('should return null for nullable nested objects when no keys present', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');

		const input = z.object({
			name: z.string(),
			address: z
				.object({
					street: z.string(),
					city: z.string(),
				})
				.nullable(),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'Ben');
		assert.equal(res.address, null);
	});

	it('should parse optional nested objects when keys are present', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');
		formData.set('address.street', '123 Main');
		formData.set('address.city', 'Springfield');

		const input = z.object({
			name: z.string(),
			address: z
				.object({
					street: z.string(),
					city: z.string(),
				})
				.optional(),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'Ben');
		assert.deepEqual(res.address, { street: '123 Main', city: 'Springfield' });
	});

	it('should use default value for nested objects when no keys present', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');

		const input = z.object({
			name: z.string(),
			settings: z
				.object({
					theme: z.string(),
				})
				.default({ theme: 'dark' }),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'Ben');
		assert.deepEqual(res.settings, { theme: 'dark' });
	});

	it('should override default for nested objects when keys are present', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');
		formData.set('settings.theme', 'light');

		const input = z.object({
			name: z.string(),
			settings: z
				.object({
					theme: z.string(),
				})
				.default({ theme: 'dark' }),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'Ben');
		assert.deepEqual(res.settings, { theme: 'light' });
	});

	it('should handle nested discriminatedUnion', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');
		formData.set('contact.type', 'email');
		formData.set('contact.email', 'ben@test.test');

		const input = z.object({
			name: z.string(),
			contact: z.discriminatedUnion('type', [
				z.object({ type: z.literal('email'), email: z.string() }),
				z.object({ type: z.literal('phone'), phone: z.string() }),
			]),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'Ben');
		assert.deepEqual(res.contact, { type: 'email', email: 'ben@test.test' });
	});

	it('should handle nested discriminatedUnion with alternate variant', () => {
		const formData = new FormData();
		formData.set('name', 'Ben');
		formData.set('contact.type', 'phone');
		formData.set('contact.phone', '555-1234');

		const input = z.object({
			name: z.string(),
			contact: z.discriminatedUnion('type', [
				z.object({ type: z.literal('email'), email: z.string() }),
				z.object({ type: z.literal('phone'), phone: z.string() }),
			]),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.name, 'Ben');
		assert.deepEqual(res.contact, { type: 'phone', phone: '555-1234' });
	});

	it('should allow object passthrough when chaining .passthrough() on root object', () => {
		const formData = new FormData();
		formData.set('expected', '42');
		formData.set('unexpected', '42');

		const input = z
			.object({
				expected: z.number(),
			})
			.passthrough();

		const res = formDataToObject(formData, input);
		assert.deepEqual(res, {
			expected: 42,
			unexpected: '42',
		});
	});
});
