// src/actions/addToCart.ts
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
  addToCart: defineAction({
		accept: 'form',
    input: z.object({ productId: z.string() }),
    handler: async (input, context) => {
			console.log('input', input);
      const cart = await context.session.get("cart") || [];
			console.log('cart', cart);
      cart.push(input.productId);
      await context.session.set("cart", cart);
      return cart;
    },
  }),
	getCart: defineAction({
		handler: async (input, context) => {
			return await context.session.get("cart");
		},
	}),
	clearCart: defineAction({
		accept: 'json',
		handler: async (input, context) => {
			await context.session.set("cart", []);
			return [];
		},
	}),
};
