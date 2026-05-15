import type { TextStyler } from '../definitions.js';
export declare class PassthroughTextStyler implements TextStyler {
	bgWhite(msg: string): string;
	black(msg: string): string;
	dim(msg: string): string;
	green(msg: string): string;
	bold(msg: string): string;
	bgGreen(msg: string): string;
	cyan(msg: string): string;
}
