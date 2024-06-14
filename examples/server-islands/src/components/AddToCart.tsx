import { addToCart } from '../cart';

export default function({ small }) {
	function onClick(ev: Event) {
		ev.preventDefault();
		let item = { name: 'Sofa' };
		addToCart(item);

	}

	if(small) {
		return (
			<a href="#"
				onClick={onClick}
				className="block w-full py-1 text-center text-white bg-primary border border-primary rounded-b hover:bg-transparent hover:text-primary transition">Add
				to cart</a>
		)
	}

	return (
		<a href="#"
				onClick={onClick}
				className="bg-primary border border-primary text-white px-8 py-2 font-medium rounded uppercase flex items-center gap-2 hover:bg-transparent hover:text-primary transition">
				<i className="fa-solid fa-bag-shopping"></i> Add to cart
		</a>
	)
}
