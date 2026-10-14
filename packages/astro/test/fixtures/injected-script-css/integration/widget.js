import './widget.css';

export function mount(label) {
	const el = document.createElement('p');
	el.className = 'injected-widget';
	el.textContent = `${label}: styled`;
	document.body.append(el);
}
