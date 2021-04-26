import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';

/** a counter written in Preact */
export default function PreactCounter({ children }) {
  const [count, setCount] = useState(0)
  const add = () => setCount(i => i + 1);
  const subtract = () => setCount(i => i - 1);

  return <>
    <div className="counter">
        <button onClick={subtract}>-</button>
        <pre>{count}</pre>
        <button onClick={add}>+</button>
    </div>
    <div className="children">
        {children}
    </div>
  </>
}
