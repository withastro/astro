import { Children, useEffect, useState } from 'react';

export default function Count({ id, children }) {
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => setHydrated(true), []);
	return (
		<div id={id} data-hydrated={hydrated || undefined}>
			{Children.count(children)}
		</div>
	);
}
