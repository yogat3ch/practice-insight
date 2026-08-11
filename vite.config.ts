import {sveltekit} from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		watch: {
			// Ignore documentation/notes folders so editing them doesn't trigger
			// HMR or full page reloads — only source (src/) changes should.
			ignored: ['**/.agents/**'],
		},
	},
});
