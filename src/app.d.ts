// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: { id: number; name: string; email: string } | null;
			groupId: number | null;
		}
		interface PageData {
			user?: { id: number; name: string; email?: string } | null;
			groupId?: number | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
