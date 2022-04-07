import Styles from './styles.module.scss';
import { h } from 'preact';

function Footer() {
	return (
		<footer className={Styles.footer}>
			&copy; {new Date().getFullYear()} Jeanine White
			<small className={Styles.byline}>🚀 Built by Astro</small>
		</footer>
	);
}
export default Footer;
