import { defineAction } from "astro:actions";
import { API_SECRET } from "astro:env/server";

export const server = {
  getSecret: defineAction({
    handler(_input, _context) {
      return {
        secret: API_SECRET,
      };
    },
  }),
};