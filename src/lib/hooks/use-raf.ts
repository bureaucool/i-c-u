import { onDestroy } from 'svelte';
import { browser } from '$app/environment';

export type RafCallback = (deltaMs: number) => void;

export class UseRaf {
	private handle: number | undefined;
	private lastTime = 0;
	private readonly callback: RafCallback;

	constructor(callback: RafCallback) {
		this.callback = callback;
		if (!browser) return;

		this.lastTime = Date.now();
		this.tick = this.tick.bind(this);
		this.handle = requestAnimationFrame(this.tick);

		onDestroy(() => {
			this.destroy();
		});
	}

	private tick() {
		const currentTime = Date.now();
		this.callback(currentTime - this.lastTime);
		this.lastTime = currentTime;
		this.handle = requestAnimationFrame(this.tick);
	}

	destroy() {
		if (this.handle !== undefined) {
			cancelAnimationFrame(this.handle);
			this.handle = undefined;
		}
	}
}

// Backwards-compatible helper matching previous API
export const useRaf = (callback: RafCallback) => new UseRaf(callback);
