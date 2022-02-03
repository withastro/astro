
export default function({ time }) {
	const iso = time.toISOString();
	const formatted = new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(time);

	return <time datetime={iso}>{ formatted }</time>
}
