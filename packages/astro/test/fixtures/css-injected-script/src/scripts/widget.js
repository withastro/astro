import './widget.css';

export function mount() {
	const el = document.createElement('p');
	el.className = 'injected-widget';
	document.body.append(el);
}
