# i-c-u – Collaborative Task Manager

This app helps groups manage tasks and time balance collaboratively. Members share equal rights within a group. Tasks can be assigned, scheduled, and tracked with durations. "Treats" can be offered and accepted to compensate time differences.

## Quick Start

```sh
pnpm install
cp .env.example .env # then fill values
pnpm run dev
```

## Environment

Define these variables in `.env`:

```
PUBLIC_SUPABASE_URL="https://<your-project>.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
EMOJI_API_ACCESS_KEY="<your-emoji-api-key>"
```

Emoji API used: [`emoji-api.com`](https://emoji-api.com/emojis?search=computer&access_key=95f65a51a5b9a9647391bbe94cb0ccf34f5125a7)

## Database

Supabase Postgres with Realtime and RLS. Manage schema using Supabase migrations (CLI/Studio).

Schema defines:

- `user`: `id`, `name`, `email` (unique), `availableTimeMinutesPerWeek`
- `group`: `id`, `title`
- `group_member`: `groupId`, `userId` (composite PK)
- `invite`: `id`, `groupId`, `email`, `token`, `accepted`, `createdAt`
- `task`: `id`, `groupId`, `title`, `emoji`, `assignedUserId`, `durationMinutes`, `scheduledAt`, `recurrenceType`, `recurrenceInterval`
- `treat`: `id`, `groupId`, `title`, `emoji`, `fromUserId`, `toUserId`, `accepted`, `valueMinutes`, `createdAt`

Recurrence values for `task.recurrenceType`:

```
none | daily | weekly | monthly | every_x_days | every_x_weeks | every_x_months
```

## Emoji Helper

Server helper `getEmojiForTitle(title)` at `src/lib/server/emoji.ts` queries the Emoji API to select the first matching emoji for a title. It requires `EMOJI_API_ACCESS_KEY`.

## API Endpoints

All endpoints return JSON. Base path: `/api`.

### Users

`GET /api/users`

Returns all users.

`POST /api/users`

Body:

```json
{ "name": "Alice", "email": "alice@example.com", "availableTimeMinutesPerWeek": 600 }
```

Responses:

- 201 created: created user
- 409 conflict: email exists

### Groups

`GET /api/groups`

Returns all groups.

`POST /api/groups`

Body:

```json
{ "title": "Home", "memberUserIds": [1, 2] }
```

Adds existing users as members.

### Invites

`GET /api/invites`

Returns all invites.

`POST /api/invites`

Body:

```json
{ "groupId": 1, "email": "bob@example.com" }
```

Generates a unique `token` for the invite.

### Planned Endpoints (coming next)

### Tasks

`GET /api/tasks?groupId=1`

Returns tasks (optionally filtered by `groupId`).

`POST /api/tasks`

Body:

```json
{
	"groupId": 1,
	"title": "Do the dishes",
	"assignedUserId": 2,
	"scheduledAt": 1736112000000,
	"recurrenceType": "weekly",
	"recurrenceInterval": null
}
```

Creates a task. Emoji is generated from `title` via the Emoji API.

### Treats

`GET /api/treats?groupId=1`

Returns treats (optionally filtered by `groupId`).

`POST /api/treats`

Body:

```json
{
	"groupId": 1,
	"title": "Movie night",
	"fromUserId": 1,
	"toUserId": 2,
	"valueMinutes": 60
}
```

Creates a treat. Emoji is generated from `title` via the Emoji API.

## Development

```sh
pnpm run dev
pnpm run build
pnpm run preview
pnpm run lint
pnpm run check
```

## Authentication & Admin

- Auth via Supabase; SSR in `hooks.server.ts` using `@supabase/ssr`.
- Users may have a `password_hash` when using local password auth flows.

Endpoints:

- `POST /api/auth` — body: `{ "email": string, "password": string }` — signs in via Supabase
- `DELETE /api/auth` — signs out

Routes:

- `/setup` — Create a new `group` and the first `user` (name, email, password). After creation, a membership is added and the user is logged in.
- `/settings` — Update group title and adjust the current user's availability. Also supports changing the logged-in user's password.
