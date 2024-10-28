import { defineMiddleware } from 'astro/middleware';
import { KNOWN_SECRET } from 'astro:env/server';

export const onRequest = defineMiddleware(async (ctx, next) => {
  console.log({ KNOWN_SECRET });
  return await next();
});
