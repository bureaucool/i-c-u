import { writable } from 'svelte/store';

export const isMobile = writable(false, (set) => {
	window.addEventListener('resize', () => {
		set(window.innerWidth < 768);
	});
	return () => {
		window.removeEventListener('resize', () => {});
	};
});
