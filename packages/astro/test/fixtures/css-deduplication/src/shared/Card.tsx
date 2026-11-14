import './Card.css';

export function Card({ children }: { children: JSX.Element }) {
	return <div className="shared-card">{children}</div>;
}
