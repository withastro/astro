import m from 'mithril';
import './Counter.css';

const Counter = ({ attrs: { count: initialCount } }) => {
  let count = initialCount;
  const add = () => { count += 1 };
  const subtract = () => count -= 1;

  return {
    view: ({ children }) => {
      return (
        <>
          <div className="counter">
            <button onclick={subtract}>-</button>
            <pre>{count}</pre>
            <button onclick={add}>+</button>
          </div>
          <div className="counter-message">{children}</div>
        </>
      )
    }
  }
}

export default Counter;
