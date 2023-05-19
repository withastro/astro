import { heading } from './heading.js';
export { setupHeadingConfig } from './heading.js';
import { shiki } from './fence.js';

export const nodes = { heading, fence: { shiki } };
