import { useRef, useState } from 'react';

export const Component = () => {
	const renders = useRef(0);
	const [count] = useState(0);
	renders.current++;
	return <div className="react">React Content {count}</div>;
};
