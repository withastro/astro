import { createMarkdownProcessor } from '../dist/index.js';

import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

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
			} = await processor.render(markdownHeading());

			assert.equal(heading.slug, expectedSlug());

			/**
			 * Value function
			 * @returns {string} markdown heading with defined `NON_BREAKING_SPACES` in text
			 * */
			function markdownHeading() {
				return `## text${NON_BREAKING_SPACES.join('text')}text`;
			}

			/**
			 * Value function
			 * @returns {string} expected slug value of `markdownHeading()`
			 * */
			function expectedSlug() {
				return `text-${NON_BREAKING_SPACES.map(() => 'text').join('-')}`;
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

			assert.equal(headings.length, new Set(headings.map(({ slug }) => slug)).size);
		});
	});
});
