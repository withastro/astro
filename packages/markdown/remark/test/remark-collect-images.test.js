import { renderMarkdown } from '../dist/index.js';
import { mockRenderMarkdownParams } from './test-utils.js';
import chai from 'chai';

describe('collect images', () => {
	it('should collect inline image paths', async () => {
		const { code, vfile } = await renderMarkdown(
			`Hello ![inline image url](./img.png)`,
			mockRenderMarkdownParams
		);

		chai
			.expect(code)
			.to.equal('<p>Hello <img alt="inline image url" __ASTRO_IMAGE_="./img.png"></p>');

		chai.expect(Array.from(vfile.data.imagePaths)).to.deep.equal(['./img.png']);
	});

	it('should add image paths from definition', async () => {
		const { code, vfile } = await renderMarkdown(
			`Hello ![image ref][img-ref]\n\n[img-ref]: ./img.webp`,
			mockRenderMarkdownParams
		);

		chai.expect(code).to.equal('<p>Hello <img alt="image ref" __ASTRO_IMAGE_="./img.webp"></p>');
		chai.expect(Array.from(vfile.data.imagePaths)).to.deep.equal(['./img.webp']);
	});
});
