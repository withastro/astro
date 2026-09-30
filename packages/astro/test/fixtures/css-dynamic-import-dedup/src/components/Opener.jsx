import { useState } from 'react';

export default function Opener() {
	const [Modal, setModal] = useState(null);
	const open = async () => {
		const mod = await import('./LazyModal.jsx');
		setModal(() => mod.default);
	};
	return (
		<>
			<button onClick={open}>Open</button>
			{Modal && <Modal />}
		</>
	);
}
