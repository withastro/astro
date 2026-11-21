import { useEffect, useState } from 'react';

export default function Box({ id, children }) {
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => setHydrated(true), []);
	return (
		<div id={id} data-hydrated={hydrated || undefined}>
			{children}
		</div>
	);
}
