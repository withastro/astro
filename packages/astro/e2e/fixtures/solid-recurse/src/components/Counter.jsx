import { createSignal } from 'solid-js';

export default function Counter(props) {
  const [count, setCount] = createSignal(0);
  const type = props.type;

  return (
    <button
			id={props.id + '-' + type}
      data-type={type}
      ref={(el) =>
        console.info(
          ` ${type} ${type == el.dataset.type ? '==' : '!='} ${el.dataset.type}`
        )
      }
      onClick={() => {
        console.info('click');
        setCount((p) => ++p);
      }}
    >
      {type}: {count()}
    </button>
  );
}
