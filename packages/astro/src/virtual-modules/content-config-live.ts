// Replaces `astro:content` in the content config module bundled for its live collections.
// Importing the real `astro:content` would be circular, because it imports that module.
import { createReference } from '../content/runtime.js';

export { defineCollection, defineLiveCollection } from '../content/runtime.js';
export { z } from '../zod.js';

export const reference = createReference();
