
const channel = new MessageChannel();

function onNewCartItem(cb: (m: any) => void) {
	let onMessage = (ev: MessageEvent) => {
		cb(ev.data);
	};
	channel.port2.addEventListener('message', onMessage);
	channel.port2.start();
	return () => channel.port2.removeEventListener('message', onMessage);
}

function addToCart(item: any) {
	channel.port1.postMessage(item);
}

export {
	onNewCartItem,
	addToCart
}
