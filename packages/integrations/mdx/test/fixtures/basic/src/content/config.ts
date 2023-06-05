import { z, defineCollection } from 'astro:content';

const astroContentCssCollection = defineCollection({
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = {
  ['astro-content-css']: astroContentCssCollection,
};
