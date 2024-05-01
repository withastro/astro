import {
	getNavigationType,
	getPathId,
	isBackNavigation,
	shouldNotIntercept,
	updateTheDOMSomehow,
	useTvFragment,
} from './utils';

// View Transitions support cross-document navigations.
// Should compare performance.
// https://github.com/WICG/view-transitions/blob/main/explainer.md#cross-document-same-origin-transitions
// https://github.com/WICG/view-transitions/blob/main/explainer.md#script-events
function shouldDisableSpa() {
	return false;
}

navigation.addEventListener('navigate', (navigateEvent) => {
	if (shouldDisableSpa()) return;
	if (shouldNotIntercept(navigateEvent)) return;

	const toUrl = new URL(navigateEvent.destination.url);
	const toPath = toUrl.pathname;
	const fromPath = location.pathname;
	const navigationType = getNavigationType(fromPath, toPath);

	if (location.origin !== toUrl.origin) return;

	switch (navigationType) {
		case 'home-to-movie':
		case 'tv-to-show':
			handleHomeToMovieTransition(navigateEvent, getPathId(toPath));
			break;
		case 'movie-to-home':
		case 'show-to-tv':
			handleMovieToHomeTransition(navigateEvent, getPathId(fromPath));
			break;
		case 'movie-to-person':
			handleMovieToPersonTransition(navigateEvent, getPathId(fromPath), getPathId(toPath));
			break;
		case 'person-to-movie':
		case 'person-to-show':
			handlePersonToMovieTransition(navigateEvent, getPathId(fromPath), getPathId(toPath));
			break;
		default:
			return;
	}
});

// TODO: https://developer.chrome.com/docs/web-platform/view-transitions/#transitions-as-an-enhancement
function handleHomeToMovieTransition(navigateEvent, movieId) {
	navigateEvent.intercept({
		async handler() {
			const fragmentUrl = useTvFragment(navigateEvent)
				? '/fragments/TvDetails'
				: '/fragments/MovieDetails';
			const response = await fetch(`${fragmentUrl}/${movieId}`);
			const data = await response.text();

			if (!document.startViewTransition) {
				updateTheDOMSomehow(data);
				return;
			}

			const thumbnail = document.getElementById(`movie-poster-${movieId}`);
			if (thumbnail) {
				thumbnail.style.viewTransitionName = 'movie-poster';
			}

			const transition = document.startViewTransition(() => {
				if (thumbnail) {
					thumbnail.style.viewTransitionName = '';
				}
				document.getElementById('container').scrollTop = 0;
				updateTheDOMSomehow(data);
			});

			await transition.finished;
		},
	});
}

function handleMovieToHomeTransition(navigateEvent, movieId) {
	navigateEvent.intercept({
		scroll: 'manual',
		async handler() {
			const fragmentUrl = useTvFragment(navigateEvent)
				? '/fragments/TvList'
				: '/fragments/MovieList';
			const response = await fetch(fragmentUrl);
			const data = await response.text();

			if (!document.startViewTransition) {
				updateTheDOMSomehow(data);
				return;
			}

			const tempHomePage = document.createElement('div');
			const moviePoster = document.getElementById(`movie-poster`);
			let thumbnail;

			// If the movie poster is not in the home page, removes the transition style so that
			// the poster doesn't stay on the page while transitioning
			tempHomePage.innerHTML = data;
			if (!tempHomePage.querySelector(`#movie-poster-${movieId}`)) {
				moviePoster?.classList.remove('movie-poster');
			}

			const transition = document.startViewTransition(() => {
				updateTheDOMSomehow(data);

				thumbnail = document.getElementById(`movie-poster-${movieId}`);
				if (thumbnail) {
					thumbnail.scrollIntoViewIfNeeded();
					thumbnail.style.viewTransitionName = 'movie-poster';
				}
			});

			await transition.finished;

			if (thumbnail) {
				thumbnail.style.viewTransitionName = '';
			}
		},
	});
}

function handleMovieToPersonTransition(navigateEvent, movieId, personId) {
	// TODO: https://developer.chrome.com/docs/web-platform/view-transitions/#not-a-polyfill
	// ...has example of `back-transition` class applied to document
	const isBack = isBackNavigation(navigateEvent);

	navigateEvent.intercept({
		async handler() {
			const response = await fetch('/fragments/PersonDetails/' + personId);
			const data = await response.text();

			if (!document.startViewTransition) {
				updateTheDOMSomehow(data);
				return;
			}

			let personThumbnail;
			let moviePoster;
			let movieThumbnail;

			if (!isBack) {
				// We're transitioning the person photo; we need to remove the transition of the poster
				// so that it doesn't stay on the page while transitioning
				moviePoster = document.getElementById(`movie-poster`);
				if (moviePoster) {
					moviePoster.classList.remove('movie-poster');
				}

				personThumbnail = document.getElementById(`person-photo-${personId}`);
				if (personThumbnail) {
					personThumbnail.style.viewTransitionName = 'person-photo';
				}
			}

			const transition = document.startViewTransition(() => {
				updateTheDOMSomehow(data);

				if (personThumbnail) {
					personThumbnail.style.viewTransitionName = '';
				}

				if (isBack) {
					// If we're coming back to the person page, we're transitioning
					// into the movie poster thumbnail, so we need to add the tag to it
					movieThumbnail = document.getElementById(`movie-poster-${movieId}`);
					if (movieThumbnail) {
						movieThumbnail.scrollIntoViewIfNeeded();
						movieThumbnail.style.viewTransitionName = 'movie-poster';
					}
				}

				document.getElementById('container').scrollTop = 0;
			});

			await transition.finished;

			if (movieThumbnail) {
				movieThumbnail.style.viewTransitionName = '';
			}
		},
	});
}

function handlePersonToMovieTransition(navigateEvent, personId, movieId) {
	const isBack = isBackNavigation(navigateEvent);

	navigateEvent.intercept({
		scroll: 'manual',
		async handler() {
			const fragmentUrl = useTvFragment(navigateEvent)
				? '/fragments/TvDetails'
				: '/fragments/MovieDetails';
			const response = await fetch(`${fragmentUrl}/${movieId}`);
			const data = await response.text();

			if (!document.startViewTransition) {
				updateTheDOMSomehow(data);
				return;
			}

			let thumbnail;
			let moviePoster;
			let movieThumbnail;

			if (!isBack) {
				movieThumbnail = document.getElementById(`movie-poster-${movieId}`);
				if (movieThumbnail) {
					movieThumbnail.style.viewTransitionName = 'movie-poster';
				}
			}

			const transition = document.startViewTransition(() => {
				updateTheDOMSomehow(data);

				if (isBack) {
					moviePoster = document.getElementById(`movie-poster`);
					if (moviePoster) {
						moviePoster.classList.remove('movie-poster');
					}

					if (personId) {
						thumbnail = document.getElementById(`person-photo-${personId}`);
						if (thumbnail) {
							thumbnail.scrollIntoViewIfNeeded();
							thumbnail.style.viewTransitionName = 'person-photo';
						}
					}
				} else {
					document.getElementById('container').scrollTop = 0;

					if (movieThumbnail) {
						movieThumbnail.style.viewTransitionName = '';
					}
				}
			});

			await transition.finished;

			if (thumbnail) {
				thumbnail.style.viewTransitionName = '';
			}

			if (moviePoster) {
				moviePoster.classList.add('movie-poster');
			}
		},
	});
}
