import { useState } from 'react';
import styles from './Card.module.css';

export default function Card({ label }) {
  const [count, setCount] = useState(0);
  return (
    <button className={styles.card} onClick={() => setCount(count + 1)}>
      {label}: {count}
    </button>
  );
}
