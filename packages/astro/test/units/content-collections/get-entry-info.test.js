import { getContentEntryIdAndSlug, getEntryCollectionName } from '../../../dist/content/utils.js';
import { expect } from 'chai';

describe('Content Collections - entry info', () => {
	const contentDir = new URL('src/content/', import.meta.url);

	it('Returns correct collection name', () => {
		const entry = new URL('blog/first-post.md', contentDir);
		const collection = getEntryCollectionName({ entry, contentDir });
		expect(collection).to.equal('blog');
	});

	it('Detects when entry is outside of a collection', () => {
		const entry = new URL('base-post.md', contentDir);
		const collection = getEntryCollectionName({ entry, contentDir });
		expect(collection).to.be.undefined;
	});

	it('Returns correct collection when nested directories used', () => {
		const entry = new URL('docs/2021/01/01/index.md', contentDir);
		const collection = getEntryCollectionName({ entry, contentDir });
		expect(collection).to.equal('docs');
	});

	it('Returns correct entry info', () => {
		const collection = 'blog';
		const entry = new URL(`${collection}/first-post.md`, contentDir);
		const info = getContentEntryIdAndSlug({ entry, contentDir, collection });
		expect(info.id).to.equal('first-post.md');
		expect(info.slug).to.equal('first-post');
	});

	it('Returns correct slug when spaces used', () => {
		const collection = 'blog';
		const entry = new URL(`${collection}/first post.mdx`, contentDir);
		const info = getContentEntryIdAndSlug({ entry, contentDir, collection });
		expect(info.slug).to.equal('first-post');
	});

	it('Returns correct slug when nested directories used', () => {
		const collection = 'blog';
		const entry = new URL(`${collection}/2021/01/01/index.md`, contentDir);
		const info = getContentEntryIdAndSlug({ entry, contentDir, collection });
		expect(info.slug).to.equal('2021/01/01');
	});
});
