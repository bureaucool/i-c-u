import { onDestroy } from 'svelte';
import { browser } from '$app/environment';

/** @param {() => void} callback */
export const useRaf = (callback) => {
	if (!browser) return;

	/** @type {ReturnType<typeof requestAnimationFrame> | undefined} */
	let handle;

	let lastTime = new Date().getTime();

	const tick = () => {
		const currentTime = new Date().getTime();
		callback(currentTime - lastTime);
		lastTime = currentTime;
		handle = requestAnimationFrame(tick);
	};

	tick();

	onDestroy(() => {
		if (!handle) return;
		cancelAnimationFrame(handle);
	});
};
