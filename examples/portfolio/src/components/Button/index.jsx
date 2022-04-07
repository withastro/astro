import Styles from './styles.module.scss';
import { h } from 'preact';

function Button({ children }) {
	return <span className={Styles.button}>{children}</span>;
}

export default Button;
