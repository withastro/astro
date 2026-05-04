import { useState } from 'react';

export default function ToggleButton({ id, children }) {
	const [ showChild, setShowChild ] = useState(false);
	const handleClick = () => setShowChild(state => !state);
	
	return (
		<div className="toggle-button-group">
			<button id={`toggle-button-${id}`} className="toggle-button" onClick={handleClick}>Toggle Link</button>
			<div className="child-wrapper">
				{showChild && children}
			</div>
		</div>
	)
}
