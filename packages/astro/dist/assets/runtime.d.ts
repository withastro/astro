import type { ImageMetadata } from './types.js';
export interface SvgComponentProps {
	meta: ImageMetadata;
	attributes: Record<string, string>;
	children: string;
	styles: string[];
}
export declare function createSvgComponent({
	meta,
	attributes,
	children,
	styles,
}: SvgComponentProps): import('../runtime/server/index.js').AstroComponentFactory & ImageMetadata;
type SvgAttributes = Record<string, any>;
export declare function dropAttributes(attributes: SvgAttributes): SvgAttributes;
export {};
