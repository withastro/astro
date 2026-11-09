import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import './IslandA.css';

export function IslandA() {
	const [Lazy, setLazy] = useState<(() => JSX.Element) | null>(null);
	useEffect(() => {
		import('./LazyPanel').then((mod) => setLazy(() => mod.LazyPanel));
	}, []);
	return (
		<Card>
			<p className="island-a">{Lazy ? <Lazy /> : 'Island A'}</p>
		</Card>
	);
}
