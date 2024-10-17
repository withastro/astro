<script>
	export let count = 0;
	let items = new Set();

	function onAddToCart(ev) {
		const id = ev.detail;
		items.add(id);
		count++;
	}
</script>
<style>
	.cart {
		display: flex;
		align-items: center;
		text-decoration: none;
		color: inherit;
	}
	.cart :first-child {
		margin-right: 5px;
	}

	.cart-icon {
		font-size: 36px;
	}

	.count {
		font-size: 24px;
	}
</style>
<svelte:window on:add-to-cart={onAddToCart}/>
<a href="/cart" class="cart">
	<span class="material-icons cart-icon">shopping_cart</span>
	<span class="count">{count}</span>
</a>
