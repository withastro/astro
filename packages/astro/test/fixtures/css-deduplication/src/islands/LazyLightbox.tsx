import { useEffect, useState } from 'react';

export function LazyLightbox() {
	const [Lightbox, setLightbox] = useState<(() => JSX.Element) | null>(null);
	useEffect(() => {
		// Keeps the dynamic import out of the server build, like client-only event handlers
		if (import.meta.env.SSR) return;
		import('../shared/Lightbox').then((mod) => setLightbox(() => mod.Lightbox));
	}, []);
	return Lightbox ? <Lightbox /> : <p>Loading</p>;
}
