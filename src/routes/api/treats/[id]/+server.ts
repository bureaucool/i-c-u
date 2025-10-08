import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { treat } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const accepted = typeof body.accepted === 'boolean' ? body.accepted : undefined;
  const declined = typeof body.declined === 'boolean' ? body.declined : undefined;
  const valueMinutes =
    body.valueMinutes == null ? undefined : Number(body.valueMinutes);
  const feedbackNote =
    typeof body.feedbackNote === 'string' ? body.feedbackNote : undefined;

  // Load treat to authorize action
  const [existing] = await db.select().from(treat).where(eq(treat.id, id)).limit(1);
  if (!existing) throw error(404, 'treat not found');

  // Only the recipient can accept/decline
  if ((locals.user?.id ?? 0) !== existing.toUserId) {
    throw error(403, 'only recipient can modify acceptance');
  }

	const updates: Record<string, unknown> = {};
  const now = Date.now();
  if (accepted !== undefined) {
    updates.accepted = accepted;
    updates.acceptedAt = accepted ? now : null;
    // reset decline when accepting
    if (accepted) updates.declinedAt = null;
  }
  if (declined !== undefined && declined === true) {
    updates.accepted = false;
    updates.declinedAt = now;
    updates.acceptedAt = null;
  }
  if (valueMinutes !== undefined && Number.isFinite(valueMinutes)) {
    updates.valueMinutes = valueMinutes;
  }
  if (feedbackNote !== undefined) {
    updates.feedbackNote = feedbackNote;
  }

	if (Object.keys(updates).length === 0) return json({});

	const [updated] = await db.update(treat).set(updates).where(eq(treat.id, id)).returning();
	if (!updated) throw error(404, 'treat not found');
	return json(updated);
};
