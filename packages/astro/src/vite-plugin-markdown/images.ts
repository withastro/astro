export type MarkdownImagePath = { raw: string; resolved: string; safeName: string };

export function getMarkdownCodeForImages(imagePaths: MarkdownImagePath[], html: string) {
	return `
    import { getImage } from "astro:assets";
    ${imagePaths
			.map((entry) => `import Astro__${entry.safeName} from ${JSON.stringify(entry.raw)};`)
			.join('\n')}

    const images = async function(html) {
      const imageSources = {};
      ${imagePaths
				.map((entry) => {
					return `{
            const regex = new RegExp('__ASTRO_IMAGE_="([^"]*' + ${JSON.stringify(
							entry.raw
						)} + '[^"]*)"', 'g');
            const match = regex.exec(html);
            if (match) {
              const imageProps = JSON.parse(match[1].replace(/&#x22;/g, '"'));
              const { src, ...props } = imageProps;
							console.log(props)
              imageSources[${JSON.stringify(entry.raw)}] = await getImage({src: Astro__${
								entry.safeName
							}, ...props});
            }
          }`;
				})
				.join('\n')}
      return imageSources;
    }

    async function updateImageReferences(html) {
      return images(html).then((imageSources) => {
        return html.replaceAll(/__ASTRO_IMAGE_="([^"]+)"/gm, (full, imagePath) => {
          const decodedImagePath = JSON.parse(imagePath.replace(/&#x22;/g, '"'));
					if (imageSources[decodedImagePath.src].srcSet.values.length > 0) {
						imageSources[decodedImagePath.src].attributes.srcset = imageSources[decodedImagePath.src].srcSet.attribute;
					}
          return spreadAttributes({
            src: imageSources[decodedImagePath.src].src,
            ...imageSources[decodedImagePath.src].attributes,
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
