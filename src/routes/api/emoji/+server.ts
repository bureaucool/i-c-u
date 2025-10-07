import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const title = url.searchParams.get('title');
	if (!title) return json({ error: 'Title is required' }, { status: 400 });
	// const reqUrl = `https://emoji-api.com/emojis?search=${encodeURIComponent(title)}&access_key=${EMOJI_API_KEY}`;
	const reqUrl = `https://www.emoji.family/api/emojis?search=${encodeURIComponent(title)}`;
	const response = await fetch(reqUrl, { method: 'GET' });

	if (!response.ok) return json({ error: 'Failed to fetch emoji' }, { status: 500 });
	const data = await response.json();
	return json(data);
};
