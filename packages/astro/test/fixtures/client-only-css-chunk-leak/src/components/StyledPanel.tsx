import './StyledPanel.css';

export default function StyledPanel({ children }: { children: React.ReactNode }) {
  return <div className="heavy-widget">{children}</div>;
}
