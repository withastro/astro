type InputFormat =
	| 'avif'
	| 'gif'
	| 'heic'
	| 'heif'
	| 'jpeg'
	| 'jpg'
	| 'png'
	| 'tiff'
	| 'webp';

interface ImageMetadata {
	src: string;
	width: number;
	height: number;
	format: InputFormat;
}

// images
declare module '*.avif' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.gif' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.heic' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.heif' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.jpeg' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.jpg' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.png' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.tiff' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.webp' {
	const metadata: ImageMetadata;
	export default metadata;
}
