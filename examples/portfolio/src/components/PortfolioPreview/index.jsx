import { h } from 'preact';
import Styles from './styles.module.scss';

function PortfolioPreview({ project }) {
	return (
		<div className={Styles.card}>
			<div className={Styles.titleCard} style={`background-image:url(${project.img})`}>
				<h1 className={Styles.title}>{project.title}</h1>
			</div>
			<div className="pa3">
				<p className={`${Styles.desc} mt0 mb2`}>{project.description}</p>
				<div className={Styles.tags}>
					Tagged:
					{project.tags.map((t) => (
						<div className={Styles.tag} data-tag={t}>
							{t}
						</div>
					))}
				</div>
				<a className={Styles.link} href={project.url}>
					<span className={Styles.linkInner}>View</span>
				</a>
			</div>
		</div>
	);
}

export default PortfolioPreview;
