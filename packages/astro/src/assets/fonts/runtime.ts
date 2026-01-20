import * as fontsMod from 'virtual:astro:assets/fonts/internal';
import { createGetFontBuffer } from './core/create-get-font-buffer.js';
import { createGetFontData } from './core/create-get-font-data.js';

export const getFontData = createGetFontData(fontsMod);

export const getFontBuffer = createGetFontBuffer(fontsMod);
