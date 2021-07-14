import { h } from 'preact';

export default ({ id, children }) => {
  return (
    <div id={id}>{children}</div>
  );
}