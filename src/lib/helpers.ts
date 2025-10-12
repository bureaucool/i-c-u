export function clickOutside(element: HTMLElement, callbackFunction: () => void) {
	function onClick(event: MouseEvent) {
		if (!element.contains(event.target as Node)) {
			callbackFunction();
		}
	}

	document.body.addEventListener('click', onClick);

	return {
		update(newCallbackFunction: () => void) {
			callbackFunction = newCallbackFunction;
		},
		destroy() {
			document.body.removeEventListener('click', onClick);
		}
	};
}

export function beautifyDate(timestamp: number): { relative: string; formatted: string } {
	const date = new Date(timestamp);
	const now = new Date();

	// Reset time to midnight for day comparison
	const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	// Calculate difference in days
	const diffTime = dateDay.getTime() - nowDay.getTime();
	const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

	// Format the actual date
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear());
	const hours = date.getHours();
	const minutes = date.getMinutes();

	let formatted = `${day}.${month}.${year}`;
	if (hours !== 0 || minutes !== 0) {
		const hh = String(hours).padStart(2, '0');
		const mm = String(minutes).padStart(2, '0');
		formatted = `${formatted} ${hh}:${mm}`;
	}

	// Determine relative date string
	let relative: string;

	if (diffDays === 0) {
		relative = 'Today';
	} else if (diffDays === 1) {
		relative = 'Tomorrow';
	} else if (diffDays >= 2 && diffDays <= 3) {
		relative = `In ${diffDays} days`;
	} else if (diffDays >= 4 && diffDays <= 13) {
		relative = 'Next week';
	} else if (diffDays < 0) {
		const absDays = Math.abs(diffDays);
		if (absDays === 1) {
			relative = 'Yesterday';
		} else {
			relative = `${absDays} days ago`;
		}
	} else {
		relative = formatted;
	}

	return { relative, formatted };
}
