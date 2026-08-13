/**
 * Client-side hooks.
 *
 * Injects the Lite Feedback widget after the app mounts.
 *
 * NOTE (why the sidebar used to vanish): a bare third-party script injected
 * from the `init` hook runs during SvelteKit client hydration. If that script
 * throws an uncaught error (e.g. before its remote settings fetch resolves), it
 * can abort hydration of this CSR-only SPA, leaving the shell — including the
 * sidebar — unmounted. The injection is therefore wrapped defensively and deferred
 * until after first render so a widget failure can never take the layout down
 * with it.
 */
import {browser} from '$app/environment';

export const init = () => {
	if (!browser) return;

	// Defer into the next frame so it never competes with hydration.
	requestAnimationFrame(() => {
		try {
			const s = document.createElement('script');
			s.src = 'https://www.litefeedback.com/min.litefeedback.js';
			// Widget key — LiteFeedback's loader reads the `lf69` attribute on
			// the script element.
			s.setAttribute('lf69', 'w_mss2065v92xbjw9agov');
			s.async = true;
			s.onerror = () =>
				console.warn('[litefeedback] failed to load widget script');
			document.head.appendChild(s);
		} catch (err) {
			// Never let a third-party widget take down the app.
			console.warn('[litefeedback] failed to inject widget', err);
		}
	});
};
