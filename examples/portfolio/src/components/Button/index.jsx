import { h } from 'preact';
import Styles from './styles.module.scss';

function Button({ children }) {
  return <span className={Styles.button}>{children}</span>;
}

export default Button;
