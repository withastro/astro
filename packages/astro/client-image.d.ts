/// <reference path="./client-base.d.ts" />

// TODO: Merge this file with `client-base.d.ts` in 3.0, when the `astro:assets` feature isn't under a flag anymore.

type InputFormat = import('./dist/assets/types.js').ImageInputFormat;

interface ImageMetadata {
	src: string;
	width: number;
	height: number;
	format: InputFormat;
}

declare module '*.gif' {
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
declare module '*.svg' {
	const metadata: ImageMetadata;
	export default metadata;
}
