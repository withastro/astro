import { h, Fragment } from 'preact';

export default function Yell({ children }) {
  return children.map(child => {
    if (typeof child === 'string') return <Fragment>{`${child.toUpperCase()}!`}</Fragment>;
    return <Fragment>{child}</Fragment>
  })
}
