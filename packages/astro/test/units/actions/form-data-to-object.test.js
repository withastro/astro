import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { formDataToObject } from '../../../dist/actions/runtime/virtual/server.js';

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
		assert.ok(isNaN(res.age));
	});

	it('should handle boolean checks', () => {
		const formData = new FormData();
		formData.set('isCool', 'yes');

		const input = z.object({
			isCool: z.boolean(),
			isNotCool: z.boolean(),
		});

		const res = formDataToObject(formData, input);
		assert.equal(res.isCool, true);
		assert.equal(res.isNotCool, false);
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
});
