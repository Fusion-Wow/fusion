import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async () => {
	// Get the current active week
	const { data: week } = await supabaseAdmin
		.from('weeks')
		.select('*')
		.in('status', ['open', 'locked', 'scoring', 'complete'])
		.order('reset_date', { ascending: false })
		.limit(1)
		.single();

	if (!week) return { week: null, leaderboard: [] };

	// Get all picks for this week with user info
	const { data: picks } = await supabaseAdmin
		.from('picks')
		.select(`
			id,
			user_id,
			locked,
			tank:players!picks_tank_id_fkey(id, character_name, class, spec, role),
			healer:players!picks_healer_id_fkey(id, character_name, class, spec, role),
			dps1:players!picks_dps1_id_fkey(id, character_name, class, spec, role),
			dps2:players!picks_dps2_id_fkey(id, character_name, class, spec, role),
			dps3:players!picks_dps3_id_fkey(id, character_name, class, spec, role)
		`)
		.eq('week_id', week.id);

	// Get all player scores for this week
	const { data: scores } = await supabaseAdmin
		.from('player_scores')
		.select('*')
		.eq('week_id', week.id);

	const scoreMap = new Map((scores ?? []).map((s: { player_id: string }) => [s.player_id, s]));

	// Build leaderboard entries
	const leaderboard = (picks ?? []).map((pick: Record<string, unknown>) => {
		const roster = [
			pick.tank as { id: string; character_name: string },
			pick.healer as { id: string; character_name: string },
			pick.dps1 as { id: string; character_name: string },
			pick.dps2 as { id: string; character_name: string },
			pick.dps3 as { id: string; character_name: string }
		];
		const total = roster.reduce((sum, p) => {
			const score = scoreMap.get(p.id) as { total_score: number } | undefined;
			return sum + (score?.total_score ?? 0);
		}, 0);

		return {
			user_id: pick.user_id as string,
			total_score: total,
			roster,
			locked: pick.locked as boolean
		};
	});

	leaderboard.sort((a: { total_score: number }, b: { total_score: number }) => b.total_score - a.total_score);

	return { week, leaderboard };
};
