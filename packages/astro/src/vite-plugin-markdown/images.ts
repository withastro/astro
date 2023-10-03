export type MarkdownImagePath = { raw: string; resolved: string; safeName: string };

export function getMarkdownCodeForImages(imagePaths: MarkdownImagePath[], html: string) {
	return `
		import { getImage } from "astro:assets";
		${imagePaths
			.map((entry) => `import Astro__${entry.safeName} from ${JSON.stringify(entry.raw)};`)
			.join('\n')}

		const images = async function() {
			return {
				${imagePaths
					.map((entry) => `"${entry.raw}": await getImage({src: Astro__${entry.safeName}})`)
					.join(',\n')}
				}
			}

			async function updateImageReferences(html) {
				return images().then((images) => {
					return html.replaceAll(/__ASTRO_IMAGE_="([^"]+)"/gm, (full, imagePath) =>
					spreadAttributes({
						src: images[imagePath].src,
						...images[imagePath].attributes,
					})
					);
				});
			}

			// NOTE: This causes a top-level await to appear in the user's code, which can break very easily due to a Rollup
			// bug and certain adapters not supporting it correctly. See: https://github.com/rollup/rollup/issues/4708
			// Tread carefully!
			const html = await updateImageReferences(${JSON.stringify(html)});
		`;
}
