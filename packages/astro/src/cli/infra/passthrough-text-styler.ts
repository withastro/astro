import type { TextStyler } from '../definitions.js';

export class PassthroughTextStyler implements TextStyler {
	bgWhite(msg: string): string {
		return msg;
	}
	black(msg: string): string {
		return msg;
	}
	dim(msg: string): string {
		return msg;
	}
	green(msg: string): string {
		return msg;
	}
	bold(msg: string): string {
		return msg;
	}
	bgGreen(msg: string): string {
		return msg;
	}
}
