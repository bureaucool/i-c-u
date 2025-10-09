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
PUBLIC_APP_URL="http://localhost:5173"  # Use production URL in deployment (required for password reset)
EMOJI_API_ACCESS_KEY="<your-emoji-api-key>"
```

**Important for Password Reset**: The `PUBLIC_APP_URL` must be set to your application's URL. In production, this should be your domain (e.g., `https://yourdomain.com`). This URL is used for password reset email links.

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

This app uses a **hybrid authentication system**:

- **Supabase Auth** for session management and login (`supabase.auth.signInWithPassword`)
- **Local `password_hash`** field in the `user` table for additional flexibility

**Important**: When changing passwords, both systems must be kept in sync:

- The `changePassword` function updates both the local `password_hash` AND Supabase Auth password
- Password reset flow also updates both systems
- Auth via Supabase; SSR in `hooks.server.ts` using `@supabase/ssr`

### Endpoints

- `POST /api/auth` — body: `{ "email": string, "password": string }` — signs in via Supabase
- `DELETE /api/auth` — signs out
- `POST /api/auth/reset` — body: `{ "email": string }` — sends password reset email

### Routes

- `/setup` — Create a new `group` and the first `user` (name, email, password). After creation, a membership is added and the user is logged in.
- `/settings` — Update group title, adjust user availability, and change password. Also the landing page after password reset.
- `/auth/reset` — Legacy password reset page (for PKCE flow debugging; not used in normal flow)
- `/api/auth/confirm` — Server endpoint that verifies OTP tokens from password reset emails

### Password Reset Configuration (PKCE-Free Solution)

This app uses **Supabase's OTP verification** for password reset, which bypasses PKCE issues entirely. No external email service needed!

**How it works:**

1. User requests password reset → Supabase sends email with OTP token
2. User clicks link → Server verifies OTP and establishes session
3. User sets new password → Updates via authenticated session
4. No PKCE involved = No errors! ✅

**Setup Steps:**

1. **Configure Email Template in Supabase Dashboard**:
   - Go to **Authentication** → **Email Templates**
   - Select **"Reset Password"** (or "Confirm recovery")
   - Update the template to use the server-side confirm endpoint:

   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset your password:</p>
   <p>
   	<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery"
   		>Reset Password</a
   	>
   </p>
   <p>This link will expire in 1 hour.</p>
   ```

   **Key points:**
   - Use `{{ .TokenHash }}` NOT `{{ .ConfirmationURL }}`
   - Link points to `/api/auth/confirm` (server endpoint, not client page)
   - Include `type=recovery` parameter

2. **Add Redirect URL in Supabase Dashboard**:
   - Go to **Authentication** → **URL Configuration**
   - Add to "Redirect URLs":
     - Development: `http://localhost:5173/api/auth/confirm`
     - Production: `https://yourdomain.com/api/auth/confirm`

3. **Environment Variables**:
   - Ensure `PUBLIC_APP_URL` is set correctly (see Environment section above)

**The Flow:**

```
User requests reset
  ↓
Supabase sends email with {{ .TokenHash }}
  ↓
User clicks link → /api/auth/confirm?token_hash=xxx&type=recovery
  ↓
Server verifies OTP using supabase.auth.verifyOtp()
  ↓
Session established via cookies
  ↓
Redirect to /settings?reset_success=true
  ↓
User changes password in settings page
  ↓
Done! ✅
```

**Why this works with PKCE enabled:**

- Uses OTP (One-Time Password) flow instead of PKCE code exchange
- Server-side verification = no client-side PKCE issues
- Still uses Supabase's email service (no third-party needed)

**Testing:**

1. Click "Reset password" on your app
2. Enter email address
3. Check email for reset link
4. Click link → automatically logged in and redirected to Settings
5. See success message and change password in Settings page
