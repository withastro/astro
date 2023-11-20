export default function Example({ list }) {
  return (
    <ul>
      {list.map((i) => (
        <li>{i}</li>
      ))}
    </ul>
  );
}
