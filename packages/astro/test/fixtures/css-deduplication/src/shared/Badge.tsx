import './Badge.css';

export function Badge({ children }: { children: JSX.Element }) {
	return <span className="shared-badge">{children}</span>;
}
