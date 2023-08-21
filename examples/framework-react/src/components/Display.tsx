import { useContext } from 'react';
import { Context } from './Provider.tsx';

export default function Display({ children }) {
	const { count } = useContext(Context);
	console.log('Display', { count });
	
	return (
		<ul>
			<li><output>Current count is: {count}</output></li>
			<li>{children}</li>
		</ul>
	);
}
