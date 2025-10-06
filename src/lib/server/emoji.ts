import { env } from '$env/dynamic/private';

type EmojiApiItem = {
	character?: string;
	unicodeName?: string;
	slug?: string;
};

export async function getEmojiForTitle(title: string): Promise<string | null> {
	const accessKey = env.EMOJI_API_ACCESS_KEY;
	if (!title || !accessKey) return null;

	const url = `https://emoji-api.com/emojis?search=${encodeURIComponent(title)}&access_key=${accessKey}`;
	const response = await fetch(url, { method: 'GET' });
	if (!response.ok) return null;

	const data = (await response.json()) as EmojiApiItem[];
	if (!Array.isArray(data) || data.length === 0) return null;

	const first = data.find((e) => typeof e.character === 'string' && e.character.length > 0);
	return first?.character ?? null;
}


