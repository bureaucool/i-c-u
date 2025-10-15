import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { createSupabaseServer } from '$lib/server/supabase';

export const PATCH: RequestHandler = async ({ params, request, locals, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	const body = await request.json().catch(() => ({}) as Record<string, unknown>);
	const accepted = typeof body.accepted === 'boolean' ? body.accepted : undefined;
	const declined = typeof body.declined === 'boolean' ? body.declined : undefined;
	const acknowledgeAccepted =
		typeof (body as any).acknowledgeAccepted === 'boolean'
			? ((body as any).acknowledgeAccepted as boolean)
			: undefined;
	const valueMinutes = body.valueMinutes == null ? undefined : Number(body.valueMinutes);
	const feedbackNote = typeof body.feedbackNote === 'string' ? body.feedbackNote : undefined;

	// Load treat to authorize action
	const { data: existing, error: eErr } = await supabase
		.from('treat')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (eErr) throw error(500, eErr.message);
	if (!existing) throw error(404, 'treat not found');

	// Permissions: recipient can accept/decline, creator can acknowledge notification only
	const isRecipient = (locals.user?.id ?? 0) === existing.to_user_id;
	const isCreator = (locals.user?.id ?? 0) === existing.from_user_id;
	if ((accepted !== undefined || declined !== undefined) && !isRecipient) {
		throw error(403, 'only recipient can modify acceptance');
	}
	if (acknowledgeAccepted !== undefined && !isCreator) {
		throw error(403, 'only creator can acknowledge accepted notification');
	}

	const updates: Record<string, unknown> = {};
	const now = Date.now();
	if (accepted !== undefined) {
		updates.accepted = accepted;
		updates.accepted_at = accepted ? now : null;
		// reset decline when accepting
		if (accepted) updates.declined_at = null;
	}
	if (declined !== undefined && declined === true) {
		updates.accepted = false;
		updates.declined_at = now;
		updates.accepted_at = null;
	}
	if (valueMinutes !== undefined && Number.isFinite(valueMinutes)) {
		updates.value_minutes = valueMinutes;
	}
	if (feedbackNote !== undefined) {
		updates.feedback_note = feedbackNote;
	}
	if (acknowledgeAccepted !== undefined) {
		// mark when creator has been notified/has seen the acceptance
		updates.accepted_notified_at = acknowledgeAccepted ? now : null;
	}

	if (Object.keys(updates).length === 0) return json({});

	const { data: updated, error: uErr } = await supabase
		.from('treat')
		.update(updates)
		.eq('id', id)
		.select()
		.single();
	if (uErr) throw error(500, uErr.message);
	if (!updated) throw error(404, 'treat not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params, locals, cookies }) => {
	const supabase = createSupabaseServer(cookies);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'invalid id');

	// Load treat to authorize action
	const { data: existing, error: eErr } = await supabase
		.from('treat')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (eErr) throw error(500, eErr.message);
	if (!existing) throw error(404, 'treat not found');

	const isCreator = (locals.user?.id ?? 0) === existing.from_user_id;
	if (!isCreator) throw error(403, 'only creator can delete/cancel treat');
	// Only allow delete if still pending (not accepted/declined)
	if (existing.accepted === true || existing.declined_at != null) {
		throw error(400, 'cannot delete a treat that was already accepted/declined');
	}

	const { data: deleted, error: dErr } = await supabase
		.from('treat')
		.delete()
		.eq('id', id)
		.select()
		.single();
	if (dErr) throw error(500, dErr.message);
	if (!deleted) throw error(404, 'treat not found');
	return json({ ok: true });
};
