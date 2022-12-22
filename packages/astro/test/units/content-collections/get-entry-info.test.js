import { getEntryInfo } from '../../../dist/content/types-generator.js';
import { expect } from 'chai';

describe('Content Collections - getEntryInfo', () => {
	const contentDir = new URL('src/content/', import.meta.url);

	it('Returns correct entry info', () => {
		const entry = new URL('blog/first-post.md', contentDir);
		const info = getEntryInfo({ entry, contentDir });
		expect(info.id).to.equal('first-post.md');
		expect(info.slug).to.equal('first-post');
		expect(info.collection).to.equal('blog');
	});

	it('Returns correct slug when spaces used', () => {
		const entry = new URL('blog/first post.mdx', contentDir);
		const info = getEntryInfo({ entry, contentDir });
		expect(info.slug).to.equal('first-post');
	});

	it('Returns correct slug when nested directories used', () => {
		const entry = new URL('blog/2021/01/01/index.md', contentDir);
		const info = getEntryInfo({ entry, contentDir });
		expect(info.slug).to.equal('2021/01/01');
	});

	it('Returns correct collection when nested directories used', () => {
		const entry = new URL('blog/2021/01/01/index.md', contentDir);
		const info = getEntryInfo({ entry, contentDir });
		expect(info.collection).to.equal('blog');
	});

	it('Returns error when outside collection directory', () => {
		const entry = new URL('blog.md', contentDir);
		expect(getEntryInfo({ entry, contentDir }) instanceof Error).to.equal(true);
	});

	it('Silences error on `allowFilesOutsideCollection`', () => {
		const entry = new URL('blog.md', contentDir);
		const entryInfo = getEntryInfo({ entry, contentDir, allowFilesOutsideCollection: true });
		expect(entryInfo instanceof Error).to.equal(false);
		expect(entryInfo.id).to.equal('blog.md');
	});
});
