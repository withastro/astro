import { h } from 'preact';

export default function (props) {
  return <div id="fallback">{import.meta.env.astro ? 'static' : 'dynamic'}</div>;
}
