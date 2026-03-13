import React from 'react';

export default function ({ id, conditional = null }) {
	return (
		<div id={id}>
			<div className="conditional-slot">{conditional}</div>
		</div>
	);
}
