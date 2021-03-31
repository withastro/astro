import { h } from 'preact';

export default function(props) {
  return (
    <div id="fallback">{props.static ? 'static' : 'dynamic'}</div>
  );
};