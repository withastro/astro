import { defineAction } from 'astro:actions';

export const server = {
  ping: defineAction({ handler: async () => 'pong' }),
};
