import { createMarkdownProcessor } from '../dist/index.js';
import chai from 'chai';

describe('collect images', async () => {
    const processor = await createMarkdownProcessor();

    it('should collect inline image paths', async () => {
        const {
            code,
            metadata: { imagePaths },
        } = await processor.render(`Hello ![inline image url](./img.png)`, {
            fileURL: 'file.md',
        });

        chai
            .expect(code)
            .to.equal('<p>Hello <img alt="inline image url" __ASTRO_IMAGE_="{&#x22;src&#x22;:&#x22;./img.png&#x22;,&#x22;index&#x22;:0}"></p>');

        chai.expect(Array.from(imagePaths)).to.deep.equal(['./img.png']);
    });

    it('should add image paths from definition', async () => {
        const {
            code,
            metadata: { imagePaths },
        } = await processor.render(`Hello ![image ref][img-ref]\n\n[img-ref]: ./img.webp`, {
            fileURL: 'file.md',
        });

        chai.expect(code).to.equal('<p>Hello <img alt="image ref" __ASTRO_IMAGE_="{&#x22;src&#x22;:&#x22;./img.webp&#x22;,&#x22;index&#x22;:0}"></p>');
        chai.expect(Array.from(imagePaths)).to.deep.equal(['./img.webp']);
    });
});
