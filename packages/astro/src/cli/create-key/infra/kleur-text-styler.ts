import * as colors from 'kleur/colors';
import type { TextStyler } from '../definitions.js';

export function createKleurTextStyler(): TextStyler {
	return colors;
}
