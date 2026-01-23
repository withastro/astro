import * as fontsMod from 'virtual:astro:assets/fonts/internal';
import { createGetFontBuffer } from '../core/create-get-font-buffer.js';

// TODO: remove default when stabilizing
export const fontData = fontsMod.fontDataByCssVariable ?? {};

export const getFontBuffer = createGetFontBuffer(fontsMod);
