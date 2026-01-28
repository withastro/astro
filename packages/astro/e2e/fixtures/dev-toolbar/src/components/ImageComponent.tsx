export function ImageComponent() {
	// This image is >20KB and would normally trigger the "Use Image component" audit
	return <img src="/the-future.jpg" alt="The future" />;
}
