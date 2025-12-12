import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
  test: defineAction({
    input: z.object({}).optional(),
    handler: async () => {
      return { success: true };
    },
  }),
};
