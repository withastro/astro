import sharp from 'sharp';
import { isAspectRatioString, isOutputFormat, OutputFormat } from './types.js';
import type { ImageAttributes, ImageProps, LocalImageService } from './types.js';

function calculateSize(props: ImageProps) {
	if ((props.width && props.height) || !props.aspectRatio) {
		return {
			width: props.width,
			height: props.height
		};
	}

	let aspectRatio: number;

	if (typeof props.aspectRatio === 'number') {
		aspectRatio = props.aspectRatio;
	} else {
		const [width, height] = props.aspectRatio.split(':');
		aspectRatio = parseInt(width) / parseInt(height);
	}

	if (props.width) {
		return {
			width: props.width,
			height: props.width / aspectRatio
		};
	}

	return {
		width: props.height! * aspectRatio,
		height: props.height!
	}
}

async function getImage(props: ImageProps) {
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

	return { searchParams, ...calculateSize(props) };
}

	function parseImageSrc(src: ImageAttributes['src']) {
	const [_, search] = src.split('?');

	const searchParams = new URLSearchParams(search);

	if (!searchParams.has('href')) {
		return undefined;
	}

	const format = searchParams.get('f');
	if (!format || !isOutputFormat(format)) {
		return undefined;
	}

	let props: ImageProps = { src: searchParams.get('href')!, format };

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

	const { data, info } = await sharpImage.toBuffer({ resolveWithObject: true });

	return {
		data,
		format: info.format
	};
}

export default {
	getImage,
	parseImageSrc,
	toBuffer,
} as LocalImageService;
