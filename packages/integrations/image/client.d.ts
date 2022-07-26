type InputFormat =
	| 'heic'
	| 'heif'
	| 'avif'
	| 'jpeg'
	| 'jpg'
	| 'png'
	| 'tiff'
	| 'webp'
	| 'gif';

interface ImageMetadata {
	src: string;
	width: number;
	height: number;
	format: InputFormat;
}

// images
declare module '*.jpg' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.jpeg' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.png' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.gif' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.svg' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.ico' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.webp' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.avif' {
	const metadata: ImageMetadata;
	export default metadata;
}
