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
	const isRecipient = (locals.user?.id ?? 0) === existing.toUserId;
	const isCreator = (locals.user?.id ?? 0) === existing.fromUserId;
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
