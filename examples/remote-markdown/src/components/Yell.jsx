import { h, Fragment } from 'preact';

export default function Yell({ children }) {
  return (
    children
      .filter((v) => typeof v === 'string')
      .join('')
      .toUpperCase() + '!'
  );
}
