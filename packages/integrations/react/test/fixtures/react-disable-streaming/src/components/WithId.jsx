import { useId } from 'react';

export default function WithId() {
  const id = useId();
  return <p className="react-use-id" id={id}>{id}</p>;
}
