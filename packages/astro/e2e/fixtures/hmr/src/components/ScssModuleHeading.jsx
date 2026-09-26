import styles from '../styles/scss-module.module.scss';

export default function ScssModuleHeading({ id }) {
	return (
		<h1 id={id} class={styles.scssModule}>
			This is blue
		</h1>
	);
}
