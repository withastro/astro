import { createSignal, onCleanup } from "solid-js";

export default function SolidCounter({ children }) {
  const [count, setCount] = createSignal(0);
  const add = () => setCount(count() + 1);
  const subtract = () => setCount(count() - 1);

  let timer = setInterval(() => setCount((c) => c + 1), 1000);
  onCleanup(() => clearInterval(timer));

  return (
    <>
      <div class="counter">
        <button onClick={subtract}>-</button>
        <pre>{count()}</pre>
        <button onClick={add}>+</button>
      </div>
      <div class="children">
        {children}
      </div>
    </>
  );
}
