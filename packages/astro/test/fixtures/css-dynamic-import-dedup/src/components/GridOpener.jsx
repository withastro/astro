import { useState } from 'react';

export default function GridOpener() {
	const [Modal, setModal] = useState(null);
	const open = async () => {
		const mod = await import('./GridModal.jsx');
		setModal(() => mod.default);
	};
	return (
		<>
			<button onClick={open}>Open</button>
			{Modal && <Modal />}
		</>
	);
}
