/// <reference types="astro/client-base" />

type InputFormat = 'avif' | 'gif' | 'heic' | 'heif' | 'jpeg' | 'jpg' | 'png' | 'tiff' | 'webp';

interface ImageMetadata {
	src: string;
	width: number;
	height: number;
	format: InputFormat;
}
