import { useEffect, useState } from 'react';

export function LazyNote() {
	const [Note, setNote] = useState<(() => JSX.Element) | null>(null);
	useEffect(() => {
		// The server build keeps this dynamic import, so it adds Note's styles to the page
		import('../shared/Note').then((mod) => setNote(() => mod.Note));
	}, []);
	return Note ? <Note /> : <p>Loading</p>;
}
