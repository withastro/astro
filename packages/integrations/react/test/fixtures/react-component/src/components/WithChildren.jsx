import React from 'react';

export default function ({ children }) {
	console.log("CHILDREN111", children.length)
	return (
		<div>
			<div className="with-children">{children}</div>
			<div className="with-children-count">{children.length}</div>
		</div>
	);
}
