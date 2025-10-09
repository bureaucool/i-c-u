import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE } from '$env/static/private';

export function createSupabaseService() {
	if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
		throw new Error('Supabase service role env vars missing');
	}
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}
