// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CspDirective } from '../../../dist/core/csp/config.js';
import { deduplicateDirectiveValues, pushDirective } from '../../../dist/core/csp/runtime.js';

describe('deduplicateDirectiveValues', () => {
	it('merges directives', () => {
		let result = deduplicateDirectiveValues("img-src 'self'", 'img-src https://example.com');

		assert.deepStrictEqual(result, "img-src 'self' https://example.com");
	});

	it('deduplicate directives', () => {
		let result = deduplicateDirectiveValues("img-src 'self'", "img-src 'self' https://example.com");

		assert.deepStrictEqual(result, "img-src 'self' https://example.com");
	});

	it('handles duplicates', () => {
		let result = deduplicateDirectiveValues("img-src 'self'", "img-src 'self' https://example.com");

		assert.deepStrictEqual(result, "img-src 'self' https://example.com");
	});

	it("should return the existing directive if they don't match", () => {
		let result = deduplicateDirectiveValues("img-src 'self'", 'font-src https://example.com');

		assert.deepStrictEqual(result, undefined);
	});

	it('handle multiple spaces', () => {
		let result = deduplicateDirectiveValues(
			"img-src     'self'    ",
			"img-src    'self'     https://example.com",
		);

		assert.deepStrictEqual(result, "img-src 'self' https://example.com");
	});
});

describe('pushDirective', () => {
	it('adds new and dedupes the ones that are the same', () => {
		const result = pushDirective(
			["img-src 'self'", "default-src 'self'"],
			'img-src https://example.com',
		);

		assert.deepStrictEqual(result, ["img-src 'self' https://example.com", "default-src 'self'"]);
	});

	describe('regression: issue #16594', () => {
		const directiveNameOf = (directive: CspDirective): string => {
			const head = directive.split(/\s+/).find(Boolean);
			return head ?? '';
		};

		const countOccurrences = (list: readonly CspDirective[], target: CspDirective): number => {
			let count = 0;
			for (const entry of list) {
				if (entry === target) {
					count += 1;
				}
			}
			return count;
		};

		const assertExactlyOnce = (list: readonly CspDirective[], target: CspDirective): void => {
			const occurrences = countOccurrences(list, target);
			assert.equal(occurrences, 1, `expected ${target} to appear once, got ${occurrences}`);
		};

		it('appends a non-matching new directive exactly once (Mode 1)', () => {
			const existing: CspDirective[] = ["img-src 'self'", "font-src 'self'"];
			const incoming: CspDirective = "connect-src 'self'";

			const result = pushDirective(existing, incoming);

			assert.deepStrictEqual(result, [...existing, incoming]);
			assertExactlyOnce(result, incoming);
		});

		it('returns a single-element array when the input list is empty', () => {
			const incoming: CspDirective = "connect-src 'self'";
			const empty: CspDirective[] = [];

			const result = pushDirective(empty, incoming);

			assert.equal(result.length, 1);
			assert.deepStrictEqual(result, [incoming]);
		});

		it('merges with a later match without leaving an unmerged copy (Mode 2)', () => {
			const existing: CspDirective[] = ["img-src 'self'", "connect-src 'self'"];
			const incoming: CspDirective = "connect-src 'unsafe-inline'";

			const result = pushDirective(existing, incoming);

			assert.deepStrictEqual(result, ["img-src 'self'", "connect-src 'self' 'unsafe-inline'"]);

			for (const entry of result) {
				if (directiveNameOf(entry) === 'connect-src') {
					assert.ok(entry.includes("'self'"));
					assert.ok(entry.includes("'unsafe-inline'"));
				}
			}
		});

		it('does not duplicate the new directive across many non-matches', () => {
			const existing: CspDirective[] = [
				"img-src 'self'",
				"font-src 'self'",
				"media-src 'self'",
				"frame-src 'self'",
			];
			const incoming: CspDirective = "connect-src 'self'";

			const result = pushDirective(existing, incoming);

			assert.equal(result.length, existing.length + 1);
			assertExactlyOnce(result, incoming);

			const nameCounts = new Map<string, number>();
			for (const entry of result) {
				const name = directiveNameOf(entry);
				nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
			}
			for (const [name, count] of nameCounts) {
				assert.equal(count, 1, `directive name "${name}" should be unique, got ${count}`);
			}
		});

		it('table-driven: every shape produces a unique-name list with the new directive once', () => {
			interface PushDirectiveCase {
				name: string;
				existing: CspDirective[];
				incoming: CspDirective;
				expectMatched: boolean;
			}

			const cases: PushDirectiveCase[] = [
				{
					name: 'two non-matches before insert',
					existing: ["img-src 'self'", "font-src 'self'"],
					incoming: "connect-src 'self'",
					expectMatched: false,
				},
				{
					name: 'match in the middle',
					existing: ["img-src 'self'", "connect-src 'self'", "font-src 'self'"],
					incoming: "connect-src 'unsafe-inline'",
					expectMatched: true,
				},
				{
					name: 'match at the end',
					existing: ["img-src 'self'", "font-src 'self'", "connect-src 'self'"],
					incoming: "connect-src 'unsafe-inline'",
					expectMatched: true,
				},
			];

			for (const testCase of cases) {
				const result = pushDirective(testCase.existing, testCase.incoming);

				if (testCase.expectMatched) {
					assert.equal(result.length, testCase.existing.length, testCase.name);
					const occurrencesOfIncoming = countOccurrences(result, testCase.incoming);
					assert.equal(
						occurrencesOfIncoming,
						0,
						`${testCase.name}: incoming should be merged, not raw`,
					);
				} else {
					assert.equal(result.length, testCase.existing.length + 1, testCase.name);
					assertExactlyOnce(result, testCase.incoming);
				}

				const seenNames = new Set<string>();
				for (const entry of result) {
					const name = directiveNameOf(entry);
					assert.equal(seenNames.has(name), false, `${testCase.name}: duplicate ${name}`);
					seenNames.add(name);
				}
			}
		});
	});
});
