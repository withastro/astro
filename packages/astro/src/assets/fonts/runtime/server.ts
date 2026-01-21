import * as fontsMod from 'virtual:astro:assets/fonts/internal';
import { createGetFontBuffer } from '../core/create-get-font-buffer.js';

// TODO: remove default when stabilizing
export const fontData = fontsMod.fontData ?? {};

export const getFontBuffer = createGetFontBuffer(fontsMod);
