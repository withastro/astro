import sharp from 'sharp';
import { isAspectRatioString, isOutputFormat } from './types.js';
import type { ImageAttributes, ImageProps, IntegrationOptions, LocalImageService } from './types.js';

type CreateServiceProps = Required<Pick<IntegrationOptions, 'routePattern'>>;

export default function createService({ routePattern }: CreateServiceProps): LocalImageService {
	async function toImageSrc(props: ImageProps) {
		const url = new URL(routePattern);
		
		if (props.quality) {
			url.searchParams.append('q', props.quality.toString());
		}

		if (props.format) {
			url.searchParams.append('f', props.format);
		}

		if (props.width) {
			url.searchParams.append('w', props.width.toString());
		}

		if (props.height) {
			url.searchParams.append('h', props.height.toString());
		}

		if (props.aspectRatio) {
			url.searchParams.append('ratio', props.aspectRatio.toString());
		}
		
		url.searchParams.append('href', props.src);

		return url.toString();
	}

	 function parseImageSrc(src: ImageAttributes['src']) {
		const url = new URL(src);

		if (!url.searchParams.has('href')) {
			return undefined;
		}

		let props: ImageProps = { src: url.searchParams.get('href')! };

		if (url.searchParams.has('q')) {
			props.quality = parseInt(url.searchParams.get('q')!);
		}

		if (url.searchParams.has('f')) {
			const format = url.searchParams.get('f')!;
			if (isOutputFormat(format)) {
				props.format = format;
			}
		}

		if (url.searchParams.has('w')) {
			props.width = parseInt(url.searchParams.get('w')!);
		}

		if (url.searchParams.has('h')) {
			props.height = parseInt(url.searchParams.get('h')!);
		}

		if (url.searchParams.has('ratio')) {
			const ratio = url.searchParams.get('ratio')!;

			if (isAspectRatioString(ratio)) {
				props.aspectRatio = ratio;
			} else {
				props.aspectRatio = parseFloat(ratio);
			}
		}

		return props;
	 }

	 async function toBuffer(inputBuffer: Buffer, props: ImageProps) {
		const sharpImage = sharp(inputBuffer, { failOnError: false });

		if (props.width || props.height) {
			sharpImage.resize(props.width, props.height);
		}

		if (props.format) {
			sharpImage.toFormat(props.format, { quality: props.quality });
		}

		return sharpImage.toBuffer();
	}

	return {
		toImageSrc,
		parseImageSrc,
		toBuffer,
	}
}
