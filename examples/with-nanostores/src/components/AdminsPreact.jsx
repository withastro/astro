import { h, Fragment } from 'preact';
import { useStore } from '@nanostores/preact';

import { admins } from '../store/admins.js';
import { counter, increaseCounter, decreaseCounter } from '../store/counter.js';

const AdminsPreact = () => {
	const list = useStore(admins);
	const count = useStore(counter);

	return (
		<>
			<h1>Preact</h1>
			<ul>
				{list.map((admin) => (
					<li key={admin.id}>{JSON.stringify(admin, null, 2)}</li>
				))}
			</ul>
			<div>
				<h3>Counter</h3>
				<p>{count.value}</p>
				<button onClick={decreaseCounter}>-1</button>
				<button onClick={increaseCounter}>+1</button>
			</div>
			<br />
		</>
	);
};

export default AdminsPreact;
