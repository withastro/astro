import React from 'react';

export default function ({ children }) {
	return (
		<div>
			<div className="with-children">{children}</div>
			<div className="with-children-count">{children.length}</div>
		</div>
	);
}
