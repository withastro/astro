import { useEffect, useState } from 'react';

export function LazyPanelLoader() {
	const [Panel, setPanel] = useState<(() => JSX.Element) | null>(null);
	useEffect(() => {
		// Keeps the dynamic import out of the server build, like client-only event handlers
		if (import.meta.env.SSR) return;
		import('./LazyPanel').then((mod) => setPanel(() => mod.LazyPanel));
	}, []);
	return Panel ? <Panel /> : <p>Loading</p>;
}
