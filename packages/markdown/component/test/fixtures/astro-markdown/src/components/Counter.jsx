import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function () {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
