export function drag(node) {
	let mouseDown = false;

	let startX = 0;
	let startY = 0;

	let dragStartTime = 0;

	const handleMouseDown = (event) => {
		// event.stopPropagation();
		handleStart(event.clientX, event.clientY);
	};

	const handleMouseMove = (event) => {
		if (mouseDown) {
			// event.stopPropagation();
			handleMove(event.clientX, event.clientY);
		}
	};

	const handleMouseUp = (event) => {
		handleUp(event);
	};

	const handleTouchDown = (event) => {
		// event.stopPropagation();
		handleStart(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
	};

	const handleTouchMove = (event) => {
		if (mouseDown) {
			handleMove(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
		}
	};

	const handleTouchUp = (event) => {
		handleUp(event);
	};

	function handleStart(x, y) {
		startX = x;
		startY = y;

		dragStartTime = Date.now();

		if (!mouseDown) {
			node.dispatchEvent(
				new CustomEvent('downchange', {
					detail: { down: true, drag: [x - startX, y - startY] }
				})
			);
		}

		mouseDown = true;
	}

	function handleMove(x, y) {
		node.dispatchEvent(
			new CustomEvent('drag', {
				detail: { drag: [x - startX, y - startY] }
			})
		);
	}

	function handleUp() {
		if (mouseDown) {
			node.dispatchEvent(
				new CustomEvent('downchange', {
					detail: { down: false }
				})
			);
			if (Date.now() - dragStartTime > 100) {
				event.stopPropagation();
				event.preventDefault();
				// console.log('preveent');
			}
		}
		mouseDown = false;
	}

	node.addEventListener('mousedown', handleMouseDown, true);
	window.addEventListener('mousemove', handleMouseMove, true);
	window.addEventListener('mouseup', handleMouseUp, true);
	window.addEventListener('mouseup', handleMouseUp, true);

	node.addEventListener('touchstart', handleTouchDown, true);
	window.addEventListener('touchmove', handleTouchMove, true);
	window.addEventListener('touchend', handleTouchUp, true);
	window.addEventListener('touchend', handleTouchUp, true);

	return {
		destroy() {
			node.removeEventListener('mousedown', handleMouseDown, true);
			window.removeEventListener('mousemove', handleMouseMove, true);
			window.removeEventListener('mouseup', handleMouseUp, true);
			window.removeEventListener('mouseup', handleMouseUp, true);

			node.removeEventListener('touchstart', handleTouchDown, true);
			window.removeEventListener('touchmove', handleTouchMove, true);
			window.removeEventListener('touchend', handleTouchUp, true);
			window.removeEventListener('touchend', handleTouchUp, true);
		}
	};
}
