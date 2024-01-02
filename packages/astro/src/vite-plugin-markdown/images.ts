export type MarkdownImagePath = { raw: string; resolved: string; safeName: string };

export function getMarkdownCodeForImages(imagePaths: MarkdownImagePath[], html: string) {
	return `
		import { getImage } from "astro:assets";
		${imagePaths
			.map((entry) => `import Astro__${entry.safeName} from ${JSON.stringify(entry.raw)};`)
			.join('\n')}

		const images = async function(html) {
			const imageRegex = JSON.parse(html.match(/__ASTRO_IMAGE_="([^"]+)"/)[1].replace(/&#x22;/g, '"'));
			const { src, ...Props } = imageRegex;
			return {
				${imagePaths
					.map(
						(entry) => `"${entry.raw}": await getImage({src: Astro__${entry.safeName}, ...Props})`
					)
					.join(',\n')}
				}
			}

		async function updateImageReferences(html) {
			return images(html).then((images) => {
					return html.replaceAll(/__ASTRO_IMAGE_="([^"]+)"/gm, (full, imagePath) => {
							const decodedImagePath = JSON.parse(imagePath.replace(/&#x22;/g, '"'));

							return spreadAttributes({
									src: images[decodedImagePath.src].src,
									...images[decodedImagePath.src].attributes,
							});
					});
			});
	}
		
			// NOTE: This causes a top-level await to appear in the user's code, which can break very easily due to a Rollup
			// bug and certain adapters not supporting it correctly. See: https://github.com/rollup/rollup/issues/4708
			// Tread carefully!
			const html = await updateImageReferences(${JSON.stringify(html)});
		`;
}
