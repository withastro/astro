import { z } from 'zod';
import type { SitemapOptions } from './index';
import { SitemapOptionsSchema } from './schema';

// @internal
export const validateOpts = (site: string | undefined, opts: SitemapOptions) => {
  const schema = SitemapOptionsSchema.extend({
    site: z.string().optional(),
  })
    .strict()
    .refine(({ site, canonicalURL }) => site || canonicalURL, {
      message: 'Required `site` astro.config option or `canonicalURL` integration option',
    });

  schema.parse({ site: site || '', ...(opts || {}) });
};
