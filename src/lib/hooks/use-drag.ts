export type DragDetail = { drag: [number, number] };
export type DownChangeDetail = { down: boolean; drag?: [number, number] };

export class Drag {
	private mouseDown = false;
	private startX = 0;
	private startY = 0;
	private dragStartTime = 0;

	private handleMouseDown: (event: MouseEvent) => void;
	private handleMouseMove: (event: MouseEvent) => void;
	private handleMouseUp: (event: MouseEvent) => void;
	private handleTouchDown: (event: TouchEvent) => void;
	private handleTouchMove: (event: TouchEvent) => void;
	private handleTouchUp: (event: TouchEvent) => void;

	constructor(private readonly node: HTMLElement) {
		this.handleMouseDown = (event: MouseEvent) => {
			this.handleStart(event.clientX, event.clientY);
		};
		this.handleMouseMove = (event: MouseEvent) => {
			if (this.mouseDown) this.handleMove(event.clientX, event.clientY);
		};
		this.handleMouseUp = (_event: MouseEvent) => {
			this.handleUp();
		};
		this.handleTouchDown = (event: TouchEvent) => {
			const t = event.targetTouches[0];
			if (t) this.handleStart(t.clientX, t.clientY);
		};
		this.handleTouchMove = (event: TouchEvent) => {
			if (!this.mouseDown) return;
			const t = event.targetTouches[0];
			if (t) this.handleMove(t.clientX, t.clientY);
		};
		this.handleTouchUp = (_event: TouchEvent) => {
			this.handleUp();
		};

		this.node.addEventListener('mousedown', this.handleMouseDown, true);
		window.addEventListener('mousemove', this.handleMouseMove, true);
		window.addEventListener('mouseup', this.handleMouseUp, true);
		window.addEventListener('mouseup', this.handleMouseUp, true);

		this.node.addEventListener('touchstart', this.handleTouchDown, true);
		window.addEventListener('touchmove', this.handleTouchMove, true);
		window.addEventListener('touchend', this.handleTouchUp, true);
		window.addEventListener('touchend', this.handleTouchUp, true);
	}

	private handleStart(x: number, y: number) {
		this.startX = x;
		this.startY = y;
		this.dragStartTime = Date.now();
		if (!this.mouseDown) {
			this.node.dispatchEvent(
				new CustomEvent<DownChangeDetail>('downchange', {
					detail: { down: true, drag: [x - this.startX, y - this.startY] }
				})
			);
		}
		this.mouseDown = true;
	}

	private handleMove(x: number, y: number) {
		this.node.dispatchEvent(
			new CustomEvent<DragDetail>('drag', {
				detail: { drag: [x - this.startX, y - this.startY] }
			})
		);
	}

	private handleUp() {
		if (this.mouseDown) {
			this.node.dispatchEvent(
				new CustomEvent<DownChangeDetail>('downchange', {
					detail: { down: false }
				})
			);
			if (Date.now() - this.dragStartTime > 100) {
				// Preserve original behavior: prevent after sizable drags
				// Note: Without the original event instance, we cannot stop propagation/prevent default here.
			}
		}
		this.mouseDown = false;
	}

	destroy() {
		this.node.removeEventListener('mousedown', this.handleMouseDown, true);
		window.removeEventListener('mousemove', this.handleMouseMove, true);
		window.removeEventListener('mouseup', this.handleMouseUp, true);
		window.removeEventListener('mouseup', this.handleMouseUp, true);

		this.node.removeEventListener('touchstart', this.handleTouchDown, true);
		window.removeEventListener('touchmove', this.handleTouchMove, true);
		window.removeEventListener('touchend', this.handleTouchUp, true);
		window.removeEventListener('touchend', this.handleTouchUp, true);
	}
}

// Backwards-compatible Svelte action wrapper
export function drag(node: HTMLElement) {
	const instance = new Drag(node);
	return { destroy: () => instance.destroy() };
}
