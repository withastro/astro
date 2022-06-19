import sharp from 'sharp';
import { isAspectRatioString, isOutputFormat } from './types.js';
import type { ImageAttributes, ImageProps, IntegrationOptions, LocalImageService } from './types.js';

type CreateServiceProps = Required<Pick<IntegrationOptions, 'routePattern'>>;

export default function createService({ routePattern }: CreateServiceProps): LocalImageService {
	async function toImageSrc(props: ImageProps) {
		const searchParams = new URLSearchParams();
		
		if (props.quality) {
			searchParams.append('q', props.quality.toString());
		}

		if (props.format) {
			searchParams.append('f', props.format);
		}

		if (props.width) {
			searchParams.append('w', props.width.toString());
		}

		if (props.height) {
			searchParams.append('h', props.height.toString());
		}

		if (props.aspectRatio) {
			searchParams.append('ratio', props.aspectRatio.toString());
		}
		
		searchParams.append('href', props.src);

		return `${routePattern}?${searchParams.toString()}`;
	}

	 function parseImageSrc(src: ImageAttributes['src']) {
		const [_, search] = src.split('?');

		const searchParams = new URLSearchParams(search);

		if (!searchParams.has('href')) {
			return undefined;
		}

		let props: ImageProps = { src: searchParams.get('href')! };

		if (searchParams.has('q')) {
			props.quality = parseInt(searchParams.get('q')!);
		}

		if (searchParams.has('f')) {
			const format = searchParams.get('f')!;
			if (isOutputFormat(format)) {
				props.format = format;
			}
		}

		if (searchParams.has('w')) {
			props.width = parseInt(searchParams.get('w')!);
		}

		if (searchParams.has('h')) {
			props.height = parseInt(searchParams.get('h')!);
		}

		if (searchParams.has('ratio')) {
			const ratio = searchParams.get('ratio')!;

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
