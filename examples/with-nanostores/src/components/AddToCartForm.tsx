import type { ComponentChildren } from 'preact';
import { addCartItem, isCartOpen } from '../cartStore';
import type { CartItemDisplayInfo } from '../cartStore';

type Props = {
	item: CartItemDisplayInfo;
	children: ComponentChildren;
};

export default function AddToCartForm({ item, children }: Props) {
	function addToCart(e: SubmitEvent) {
		e.preventDefault();
		isCartOpen.set(true);
		addCartItem(item);
	}

	return <form onSubmit={addToCart}>{children}</form>;
}
