import sharp from 'sharp';
import { isAspectRatioString, isOutputFormat } from './types.js';
import type { ImageAttributes, ImageProps, IntegrationOptions, LocalImageService } from './types.js';

type CreateServiceProps = Required<Pick<IntegrationOptions, 'routePattern'>> & {
	root: string;
};

function calculateSize(props: ImageProps, metadata: sharp.Metadata) {
	if (props.width && props.height) {
		return {
			width: props.width,
			height: props.height
		};
	}

	const metaAspect = metadata.width! / metadata.height!;
	console.log('metaAspect', metaAspect);

	if (props.width) {
		return {
			width: props.width!,
			height: props.width! / metaAspect
		};
	}

	return {
		width: props.height! * metaAspect,
		height: props.height!
	}
}

export default function createService({ routePattern, root }: CreateServiceProps): LocalImageService {
	async function getImage(props: ImageProps) {
		const href = props.src.startsWith('http') ? new URL(props.src) : new URL(props.src, root);
		const inputRes = await fetch(href.toString());

		if (!inputRes.ok) {
			throw new Error(`"${props.src}" not found`);
		};

		const inputBuffer = await Buffer.from(await inputRes.arrayBuffer());
		const sharpImage = sharp(inputBuffer);
		const metadata = await sharpImage.metadata();

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

		const src = `${routePattern}?${searchParams.toString()}`;

		return { src, ...calculateSize(props, metadata) };
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
		getImage,
		parseImageSrc,
		toBuffer,
	}
}
