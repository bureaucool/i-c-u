import { writable } from 'svelte/store';

export const isMobile = writable(false, (set) => {
	window.addEventListener('resize', () => {
		set(window.innerWidth < 768);
	});
	return () => {
		window.removeEventListener('resize', () => {});
	};
});

export const isTouch = writable(false, (set) => {
	window.addEventListener('touchstart', () => {
		set(true);
	});
	return () => {
		window.removeEventListener('touchstart', () => {});
	};
});
