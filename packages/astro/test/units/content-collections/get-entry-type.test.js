import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import { getEntryType } from '../../../dist/content/utils.js';

const fixtures = [
	{
		title: 'Without any underscore above the content directory tree',
		contentConfigFileUrl: new URL('src/content/config.ts', import.meta.url),
		contentDirectory: new URL('src/content/', import.meta.url),
	},
	{
		title: 'With underscore levels above the content directory tree',
		contentConfigFileUrl: new URL('_src/content/config.ts', import.meta.url),
		contentDirectory: new URL('_src/content/', import.meta.url),
	},
];

const contentEntryExtensions = ['.md', '.mdx'];
const dataEntryExtensions = ['.yaml', '.yml', '.json'];

describe('Content Collections - getEntryType', () => {
	fixtures.forEach(({ title, contentConfigFileUrl, contentDirectory }) => {
		describe(title, () => {
			it('Returns "content" for Markdown files', () => {
				for (const entryPath of ['blog/first-post.md', 'blog/first-post.mdx']) {
					const entry = fileURLToPath(new URL(entryPath, contentDirectory));
					const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
					expect(type).to.equal('content');
				}
			});

			it('Returns "data" for JSON and YAML files', () => {
				for (const entryPath of [
					'banners/welcome.json',
					'banners/welcome.yaml',
					'banners/welcome.yml',
				]) {
					const entry = fileURLToPath(new URL(entryPath, contentDirectory));
					const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
					expect(type).to.equal('data');
				}
			});

			it('Returns "content" for Markdown files in nested directories', () => {
				for (const entryPath of ['blog/2021/01/01/index.md', 'blog/2021/01/01/index.mdx']) {
					const entry = fileURLToPath(new URL(entryPath, contentDirectory));
					const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
					expect(type).to.equal('content');
				}
			});

			it('Returns "config" for config files', () => {
				const entry = fileURLToPath(contentConfigFileUrl);
				const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
				expect(type).to.equal('config');
			});

			it('Returns "unsupported" for non-Markdown files', () => {
				const entry = fileURLToPath(new URL('blog/robots.txt', contentDirectory));
				const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
				expect(type).to.equal('unsupported');
			});

			it('Returns "ignored" for .DS_Store', () => {
				const entry = fileURLToPath(new URL('blog/.DS_Store', contentDirectory));
				const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
				expect(type).to.equal('ignored');
			});

			it('Returns "ignored" for unsupported files using an underscore', () => {
				const entry = fileURLToPath(new URL('blog/_draft-robots.txt', contentDirectory));
				const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
				expect(type).to.equal('ignored');
			});

			it('Returns "ignored" when using underscore on file name', () => {
				const entry = fileURLToPath(new URL('blog/_first-post.md', contentDirectory));
				const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
				expect(type).to.equal('ignored');
			});

			it('Returns "ignored" when using underscore on directory name', () => {
				const entry = fileURLToPath(new URL('blog/_draft/first-post.md', contentDirectory));
				const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
				expect(type).to.equal('ignored');
			});

			it('Returns "ignored" for images', () => {
				const entry = fileURLToPath(new URL('blog/first-post.png', contentDirectory));
				const type = getEntryType({ entryPath: entry, contentEntryExtensions, dataEntryExtensions, contentDirectory, contentConfigFileUrl });
				expect(type).to.equal('ignored');
			});
		});
	});
});
