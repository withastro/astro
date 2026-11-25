export default function ImageComponent() {
  return (
    <div>
      <link rel="stylesheet" href="/widget.css" />
      <link rel="preconnect" href="https://example.com" />
      <link rel="dns-prefetch" href="https://example.org" />
      <link rel="preload" as="image" href="/explicit.png" />
      <link rel="modulepreload" href="/explicit.js" />
      <h1>React 19 Island</h1>
      <button id="widget" onClick={(event) => { event.currentTarget.textContent = 'Hydrated'; }}>Widget</button>
      <img src="/_astro/test-image.webp" alt="Test" />
    </div>
  );
}
