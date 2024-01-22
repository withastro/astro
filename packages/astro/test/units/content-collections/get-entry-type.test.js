import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import { getEntryType } from '../../../dist/content/utils.js';

const fixtures = [
	{
		title: 'Without any underscore above the content directory tree',
		contentPaths: {
			config: {
				url: new URL('src/content/config.ts', import.meta.url),
				exists: true,
			},
			contentDir: new URL('src/content/', import.meta.url),
		},
	},
	{
		title: 'With underscore levels above the content directory tree',
		contentPaths: {
			config: {
				url: new URL('_src/content/config.ts', import.meta.url),
				exists: true,
			},
			contentDir: new URL('_src/content/', import.meta.url),
		},
	},
];

const contentFileExts = ['.md', '.mdx'];
const dataFileExts = ['.yaml', '.yml', '.json'];

describe('Content Collections - getEntryType', () => {
	fixtures.forEach(({ title, contentPaths }) => {
		describe(title, () => {
			it('Returns "content" for Markdown files', () => {
				for (const entryPath of ['blog/first-post.md', 'blog/first-post.mdx']) {
					const entry = fileURLToPath(new URL(entryPath, contentPaths.contentDir));
					const type = getEntryType(entry, contentPaths, contentFileExts, dataFileExts);
					expect(type).to.equal('content');
				}
			});

			it('Returns "data" for JSON and YAML files', () => {
				for (const entryPath of [
					'banners/welcome.json',
					'banners/welcome.yaml',
					'banners/welcome.yml',
				]) {
					const entry = fileURLToPath(new URL(entryPath, contentPaths.contentDir));
					const type = getEntryType(entry, contentPaths, contentFileExts, dataFileExts);
					expect(type).to.equal('data');
				}
			});

			it('Returns "content" for Markdown files in nested directories', () => {
				for (const entryPath of ['blog/2021/01/01/index.md', 'blog/2021/01/01/index.mdx']) {
					const entry = fileURLToPath(new URL(entryPath, contentPaths.contentDir));
					const type = getEntryType(entry, contentPaths, contentFileExts, dataFileExts);
					expect(type).to.equal('content');
				}
			});

			it('Returns "config" for config files', () => {
				const entry = fileURLToPath(contentPaths.config.url);
				const type = getEntryType(entry, contentPaths, contentFileExts, dataFileExts);
				expect(type).to.equal('config');
			});

			it('Returns "ignored" for non-Markdown files', () => {
				for (const entryPath of ['blog/robots.txt', 'blog/first-post.png', '.DS_Store']) {
					const entry = fileURLToPath(new URL(entryPath, contentPaths.contentDir));
					const type = getEntryType(entry, contentPaths, contentFileExts, dataFileExts);
					expect(type).to.equal('ignored');
				}
			});

			it('Returns "ignored" when using underscore on file name', () => {
				const entry = fileURLToPath(new URL('blog/_first-post.md', contentPaths.contentDir));
				const type = getEntryType(entry, contentPaths, contentFileExts, dataFileExts);
				expect(type).to.equal('ignored');
			});

			it('Returns "ignored" when using underscore on directory name', () => {
				const entry = fileURLToPath(new URL('blog/_draft/first-post.md', contentPaths.contentDir));
				const type = getEntryType(entry, contentPaths, contentFileExts, dataFileExts);
				expect(type).to.equal('ignored');
			});
		});
	});
});
