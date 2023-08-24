import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(({ locals, request }, next) => {
  // intercept response data from a request
  // optionally, transform the response by modifying `locals`
  locals.title = "New title"

  // return a Response or the result of calling `next()`
  return next()
});
