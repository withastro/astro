import { getEntryType } from '../../../dist/content/utils.js';
import { expect } from 'chai';
import { fileURLToPath } from 'node:url';

describe('Content Collections - getEntryType', () => {
	const contentDir = new URL('src/content/', import.meta.url);
	const contentPaths = {
		config: {
			url: new URL('src/content/config.ts', import.meta.url),
			exists: true,
		},
	};

	it('Returns "content" for Markdown files', () => {
		for (const entryPath of ['blog/first-post.md', 'blog/first-post.mdx']) {
			const entry = fileURLToPath(new URL(entryPath, contentDir));
			const type = getEntryType(entry, contentPaths);
			expect(type).to.equal('content');
		}
	});

	it('Returns "content" for Markdown files in nested directories', () => {
		for (const entryPath of ['blog/2021/01/01/index.md', 'blog/2021/01/01/index.mdx']) {
			const entry = fileURLToPath(new URL(entryPath, contentDir));
			const type = getEntryType(entry, contentPaths);
			expect(type).to.equal('content');
		}
	});

	it('Returns "config" for config files', () => {
		const entry = fileURLToPath(contentPaths.config.url);
		const type = getEntryType(entry, contentPaths);
		expect(type).to.equal('config');
	});

	it('Returns "unsupported" for non-Markdown files', () => {
		const entry = fileURLToPath(new URL('blog/robots.txt', contentDir));
		const type = getEntryType(entry, contentPaths);
		expect(type).to.equal('unsupported');
	});

	it('Returns "ignored" for .DS_Store', () => {
		const entry = fileURLToPath(new URL('blog/.DS_Store', contentDir));
		const type = getEntryType(entry, contentPaths);
		expect(type).to.equal('ignored');
	});

	it('Returns "ignored" for unsupported files using an underscore', () => {
		const entry = fileURLToPath(new URL('blog/_draft-robots.txt', contentDir));
		const type = getEntryType(entry, contentPaths);
		expect(type).to.equal('ignored');
	});

	it('Returns "ignored" when using underscore on file name', () => {
		const entry = fileURLToPath(new URL('blog/_first-post.md', contentDir));
		const type = getEntryType(entry, contentPaths);
		expect(type).to.equal('ignored');
	});

	it('Returns "ignored" when using underscore on directory name', () => {
		const entry = fileURLToPath(new URL('blog/_draft/first-post.md', contentDir));
		const type = getEntryType(entry, contentPaths);
		expect(type).to.equal('ignored');
	});
});
