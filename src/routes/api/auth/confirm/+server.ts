/**
 * Server-side OTP Verification Endpoint
 *
 * This endpoint is called when user clicks the password reset link from email.
 * It verifies the OTP token server-side and redirects to the reset form.
 */

import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');

	if (!token_hash || type !== 'recovery') {
		// Redirect to error page or home
		throw redirect(303, '/?error=invalid_reset_link');
	}

	const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => cookies.get(key),
			set: (key, value, options) => cookies.set(key, value, { path: '/', ...options }),
			remove: (key, options) => cookies.delete(key, { path: '/', ...options })
		}
	});

	// Verify the OTP token - this establishes a session
	const { error } = await supabase.auth.verifyOtp({
		type: 'recovery',
		token_hash
	});

	if (error) {
		console.error('OTP verification error:', error);
		throw redirect(303, '/?error=expired_reset_link');
	}

	// OTP verified! Session is now established via cookies
	// Redirect to a simple password reset form
	throw redirect(303, '/auth/reset/confirm');
};
