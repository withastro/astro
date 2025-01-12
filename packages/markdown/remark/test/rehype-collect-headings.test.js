import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { createMarkdownProcessor } from '../dist/index.js';

describe('rehypeHeadingIds()', () => {
	let processor;

	before(async () => {
		processor = await createMarkdownProcessor();
	});

	describe('generated ID slug', () => {
		it('treats non-breaking space as space', async () => {
			/**
			 * NO-BREAK SPACE `&nbsp;`, FIGURE SPACE `&numsp;`, NARROW NO-BREAK SPACE
			 * */
			const NON_BREAKING_SPACES = ['&#160;', '&#8199;', '&#8239;'];

			const {
				metadata: {
					headings: [heading],
				},
			} = await processor.render(markdownHeading(NON_BREAKING_SPACES));

			assert.equal(heading.slug, expectedSlug(NON_BREAKING_SPACES));

			/**
			 * Helper function
			 * @param {string[]} nbsp - list of non-breaking spaces
			 * @returns {string} markdown heading with given `nbsp` list
			 * */
			function markdownHeading(nbsp = []) {
				return `## text${nbsp.join('text')}text`;
			}

			/**
			 * Helper function
			 * @param {string[]} nbsp - list of non-breaking spaces
			 * @returns {string} expected slug value of `markdownHeading()` with given `nbsp` list
			 * */
			function expectedSlug(nbsp = []) {
				return `text-${nbsp.map(() => 'text').join('-')}`;
			}
		});

		it('is in kebab-case', async () => {
			const EXPECTED_SLUG = 'lorem-ipsum-dolor-sit-amet';
			const MARKDOWN_HEADING = '## 😄 😄 Lorem 😄 ipsum 😄 😄 😄 dolor ✓ sit &nbsp; amet 😄 😄';

			const {
				metadata: {
					headings: [heading],
				},
			} = await processor.render(MARKDOWN_HEADING);

			assert.equal(heading.slug, EXPECTED_SLUG);
		});

		it('has unique value within given set of headings', async () => {
			const repeatedMarkdownHeadings = `${'## Lorem ipsum dolor sit amet\n\n'.repeat(3)}`;

			const {
				metadata: { headings },
			} = await processor.render(repeatedMarkdownHeadings);

			const numberOfHeadings = headings.length;
			const numberOfUniqueIdValues = new Set(headings.map(({ slug }) => slug)).size;

			assert.equal(numberOfHeadings, numberOfUniqueIdValues);
		});
	});
});
