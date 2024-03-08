import { h, Fragment } from 'preact';
import { lazy, Suspense } from 'preact/compat';

const Message = lazy(async () => import('./Message'));

const LazyMessage = () => {
	return (
		<Suspense fallback={null}>
			<Message text="lazy-message" />
		</Suspense>
	);
};

export default LazyMessage;
