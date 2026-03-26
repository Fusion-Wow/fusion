import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { session, accessLevel } = locals;
	const path = url.pathname;

	// Block unauthenticated users from everything except /login
	if (!session && path !== '/login') {
		redirect(302, '/login');
	}

	// Block users with no matching role
	if (session && accessLevel === 'blocked' && path !== '/blocked') {
		redirect(302, '/blocked');
	}

	// Config page is admin-only
	if (path.startsWith('/config') && accessLevel !== 'admin') {
		redirect(302, '/');
	}

	// Picks page requires at least picker access
	if (path.startsWith('/picks') && accessLevel === 'viewer') {
		redirect(302, '/');
	}

	return {
		session,
		accessLevel
	};
};
