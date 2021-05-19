import type { FunctionalComponent } from 'preact';
import { h, Fragment } from 'preact';

const CodeBlock: FunctionalComponent = ({ children }) => {
  return <div className="code-block">
    {children}
  </div>
}

export default CodeBlock;
