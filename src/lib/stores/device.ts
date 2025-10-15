import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const isMobile = writable(false, (set) => {
	if (browser) {
		window.addEventListener('resize', () => {
			set(window.innerWidth < 768);
		});
		return () => {
			window.removeEventListener('resize', () => {});
		};
	} else {
		set(false);
	}
});

export const isTouch = writable(false, (set) => {
	if (browser) {
		window.addEventListener('touchstart', () => {
			set(true);
		});
		return () => {
			window.removeEventListener('touchstart', () => {});
		};
	} else {
		set(false);
	}
});
